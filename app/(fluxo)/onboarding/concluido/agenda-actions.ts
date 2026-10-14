"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sugerirHorarios } from "@/lib/agenda/horarios";
import { avaliarHorario, type IntervaloOcupado } from "@/lib/agenda/regras";
import { agendaGoogleConfigurada, apagarEventoGoogle, calendarIdConfigurado,
  criarEventoGoogle, lerEventoGoogle, ocupacoesGoogle } from "@/lib/agenda/google";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Reserva = {
  id: string; business_id: string; calendar_id: string; google_event_id: string | null;
  google_etag: string | null; google_event_url: string | null;
  starts_at: string; ends_at: string; status: "pending" | "confirmed";
};

export type EstadoAgenda =
  | { status: "legado" }
  | { status: "erro"; mensagem: string }
  | { status: "livre"; horarios: string[] }
  | { status: "pendente"; inicio: string }
  | { status: "confirmada"; inicio: string; fim: string; url: string | null };

async function contexto(): Promise<{
  businessId: string; orderId: string; cnpj: string; email: string; nome: string;
} | null> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at || !user.email) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from("commercial_orders")
    .select("id, cnpj, buyer_name, buyer_email, buyer_profile_id")
    .eq("business_id", ativo.negocio.id).eq("status", "payment_approved")
    .order("created_at", { ascending: false }).limit(20);
  if (error || !data) return null;
  const email = user.email.trim().toLowerCase();
  const pedido = data.find((item) => /^\d{14}$/.test(item.cnpj ?? "")
    && item.buyer_email?.trim().toLowerCase() === email
    && (!item.buyer_profile_id || item.buyer_profile_id === user.id));
  if (!pedido) return null;
  return { businessId: ativo.negocio.id, orderId: pedido.id, cnpj: pedido.cnpj,
    email, nome: pedido.buyer_name?.trim() || ativo.negocio.name };
}

async function reservaAtiva(businessId: string): Promise<Reserva | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("onboarding_meetings")
    .select("id, business_id, calendar_id, google_event_id, google_etag, google_event_url, starts_at, ends_at, status")
    .eq("business_id", businessId).in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("falha_leitura_reserva");
  return data as Reserva | null;
}

async function conciliarReservaAtiva(reserva: Reserva): Promise<Reserva | null> {
  if (!reserva.google_event_id) return reserva;
  const evento = await lerEventoGoogle(reserva.google_event_id);
  const admin = createAdminClient();
  if (evento?.status === "confirmed" && evento.businessId === reserva.business_id && evento.etag) {
    if (reserva.status === "confirmed" && reserva.google_etag === evento.etag) return reserva;
    const { data, error } = await admin.from("onboarding_meetings")
      .update({ status: "confirmed", google_etag: evento.etag, google_event_url: evento.htmlLink })
      .eq("id", reserva.id).eq("business_id", reserva.business_id)
      .in("status", ["pending", "confirmed"])
      .select("id, business_id, calendar_id, google_event_id, google_etag, google_event_url, starts_at, ends_at, status")
      .single();
    if (error || !data) throw new Error("falha_confirmacao_reserva");
    return data as Reserva;
  }
  if ((evento === null || evento.status === "cancelled") && reserva.status === "pending") {
    // A escrita no Google pode ter acontecido mesmo sem resposta HTTP. Não libera
    // o negócio até um operador conferir a ausência ou cancelar o evento.
    return reserva;
  }
  if (evento === null || evento.status === "cancelled") {
    const { error } = await admin.from("onboarding_meetings")
      .update({ status: "cancelled" })
      .eq("id", reserva.id).eq("business_id", reserva.business_id);
    if (error) throw new Error("falha_cancelamento_reserva");
    return null;
  }
  // Evento desconhecido ou com outro negócio: segura a vaga para revisão humana.
  return reserva;
}

async function ocupacoesDaAgenda(agora: Date, calendarId: string): Promise<IntervaloOcupado[]> {
  const fim = new Date(agora.getTime() + 10 * 24 * 60 * 60_000);
  const [google, locais] = await Promise.all([
    ocupacoesGoogle(agora, fim),
    createAdminClient().from("onboarding_meetings")
      .select("starts_at, ends_at")
      .eq("calendar_id", calendarId).in("status", ["pending", "confirmed"])
      .gte("ends_at", agora.toISOString()).lt("starts_at", fim.toISOString()),
  ]);
  if (locais.error || !locais.data) throw new Error("falha_ocupacoes_locais");
  return [...google, ...locais.data.map((item) => ({ inicio: new Date(item.starts_at), fim: new Date(item.ends_at) }))];
}

function estadoDaReserva(reserva: Reserva): EstadoAgenda {
  if (reserva.status === "pending") return { status: "pendente", inicio: reserva.starts_at };
  const url = reserva.google_event_url;
  const segura = url && /^https:\/\/(?:www\.google\.com|calendar\.google\.com)\/calendar\//.test(url) ? url : null;
  return { status: "confirmada", inicio: reserva.starts_at, fim: reserva.ends_at, url: segura };
}

export async function carregarAgendaAction(): Promise<EstadoAgenda> {
  if (!agendaGoogleConfigurada()) return { status: "legado" };
  const ctx = await contexto();
  const calendarId = calendarIdConfigurado();
  if (!ctx || !calendarId) return { status: "erro", mensagem: "Não conseguimos conferir o negócio desta reunião." };
  try {
    const existente = await reservaAtiva(ctx.businessId);
    if (existente) {
      const conciliada = await conciliarReservaAtiva(existente);
      if (conciliada) return estadoDaReserva(conciliada);
    }
    const agora = new Date();
    const ocupacoes = await ocupacoesDaAgenda(agora, calendarId);
    return { status: "livre", horarios: sugerirHorarios(agora, ocupacoes) };
  } catch {
    return { status: "erro", mensagem: "Não conseguimos conferir a agenda agora. Tente mais tarde." };
  }
}

export async function reservarHorarioAction(inicio: string): Promise<EstadoAgenda> {
  if (!agendaGoogleConfigurada()) return { status: "legado" };
  const ctx = await contexto();
  const calendarId = calendarIdConfigurado();
  if (!ctx || !calendarId) return { status: "erro", mensagem: "Entre no negócio comprado para agendar." };
  const inicioDate = new Date(inicio);
  const agora = new Date();
  if (!Number.isFinite(inicioDate.getTime())) return { status: "erro", mensagem: "Escolha um horário válido." };
  const fimDate = new Date(inicioDate.getTime() + 25 * 60_000);
  const admin = createAdminClient();
  try {
    const anterior = await reservaAtiva(ctx.businessId);
    if (anterior) return estadoDaReserva(anterior);
    const ocupacoes = await ocupacoesDaAgenda(agora, calendarId);
    if (!sugerirHorarios(agora, ocupacoes).includes(inicioDate.toISOString())
      || !avaliarHorario({ inicio: inicioDate, agora, duracaoMinutos: 25, ocupacoes }).ok)
      return { status: "erro", mensagem: "Este horário não está mais disponível. Escolha outro." };
    const eventId = `v2g${randomUUID().replaceAll("-", "")}`;
    const { data: pendente, error: erroPendente } = await admin.from("onboarding_meetings")
      .insert({ business_id: ctx.businessId, order_id: ctx.orderId, cnpj: ctx.cnpj, calendar_id: calendarId,
        google_event_id: eventId, starts_at: inicioDate.toISOString(), ends_at: fimDate.toISOString(), status: "pending" })
      .select("id, business_id, calendar_id, google_event_id, google_etag, google_event_url, starts_at, ends_at, status")
      .single();
    if (erroPendente || !pendente) {
      const ativa = await reservaAtiva(ctx.businessId);
      return ativa ? estadoDaReserva(ativa) : { status: "erro", mensagem: "Este horário ou CNPJ já tem uma reserva ativa. Atualize as opções ou fale com a equipe." };
    }
    try {
      await criarEventoGoogle({ eventId, inicio: inicioDate.toISOString(), fim: fimDate.toISOString(),
        email: ctx.email, nome: ctx.nome, cnpj: ctx.cnpj, businessId: ctx.businessId });
    } catch {
      // A resposta pode ter se perdido depois de o Google criar o evento. A leitura decide.
    }
    const conciliada = await conciliarReservaAtiva(pendente as Reserva);
    revalidatePath("/onboarding/concluido");
    return conciliada ? estadoDaReserva(conciliada) :
      { status: "erro", mensagem: "O Google não confirmou a reserva. Escolha outro horário após atualizar a agenda." };
  } catch {
    return { status: "erro", mensagem: "Não conseguimos confirmar a reserva. Atualize para conferir antes de tentar novamente." };
  }
}

export async function cancelarReservaAction(): Promise<EstadoAgenda> {
  if (!agendaGoogleConfigurada()) return { status: "legado" };
  const ctx = await contexto();
  if (!ctx) return { status: "erro", mensagem: "Entre no negócio comprado para cancelar." };
  try {
    const reserva = await reservaAtiva(ctx.businessId);
    if (!reserva || reserva.status !== "confirmed" || !reserva.google_event_id)
      return carregarAgendaAction();
    const apagou = await apagarEventoGoogle(reserva.google_event_id);
    if (!apagou) return { status: "erro", mensagem: "Não conseguimos confirmar o cancelamento. Sua reunião continua marcada." };
    const { error } = await createAdminClient().from("onboarding_meetings")
      .update({ status: "cancelled" }).eq("business_id", ctx.businessId).eq("id", reserva.id).eq("status", "confirmed");
    if (error) return { status: "erro", mensagem: "O Google recebeu o cancelamento. Atualize esta página para conferir o registro." };
    revalidatePath("/onboarding/concluido");
    return carregarAgendaAction();
  } catch {
    return { status: "erro", mensagem: "Não conseguimos confirmar o cancelamento agora. Atualize esta página." };
  }
}
