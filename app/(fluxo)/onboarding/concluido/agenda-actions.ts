"use server";

import { randomUUID } from "node:crypto";
import { lerDocumentoContratante } from "@/lib/contratacao/documento-contratante";
import { revalidatePath } from "next/cache";
import { sugerirHorarios } from "@/lib/agenda/horarios";
import { avaliarHorario, podeRemarcar, type IntervaloOcupado } from "@/lib/agenda/regras";
import { calendarioDaReservaAindaConfigurado, horarioConfirmadoGoogle, selecionarReservaExterna,
  type VinculoEsperado } from "@/lib/agenda/conciliacao";
import { descricaoDaReuniao } from "@/lib/agenda/descricao-reuniao";
import { CriacaoGoogleRecusada } from "@/lib/agenda/falhas-criacao";
import { agendaGoogleConfigurada, agendaGoogleLeituraConfigurada, apagarEventoGoogle,
  calendarIdConfigurado, calendarIdLeituraConfigurado, criarEventoGoogle, lerEventoGoogle,
  listarEventosExternosGoogle, ocupacoesGoogle } from "@/lib/agenda/google";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { estadoDaConclusao } from "@/lib/onboarding/conclusao";
import { lerTodasPaginas } from "@/lib/multiconta/paginacao";
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
  | { status: "confirmada"; inicio: string; fim: string; url: string | null; podeRemarcar: boolean; gerenciadaNoApp: boolean };

async function contexto(businessIdEsperado: string): Promise<{
  businessId: string; orderId: string; cnpj: string; email: string; nome: string; descricao: string;
  onboardingConcluido: boolean; vinculosExternos: VinculoEsperado[];
} | null> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== businessIdEsperado) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at || !user.email) return null;
  const admin = createAdminClient();
  const pedidos = await lerTodasPaginas((inicio, fim) => admin.from("commercial_orders")
    .select("id, cnpj, buyer_name, buyer_email, buyer_profile_id")
    .eq("business_id", ativo.negocio.id).eq("status", "payment_approved")
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(inicio, fim));
  if (!pedidos) return null;
  const email = user.email.trim().toLowerCase();
  const pedido = pedidos.find((item) => lerDocumentoContratante(item.cnpj)
    && item.buyer_email?.trim().toLowerCase() === email
    && (!item.buyer_profile_id || item.buyer_profile_id === user.id));
  if (!pedido) return null;
  const mesmoDocumento = await lerTodasPaginas((inicio, fim) => admin.from("commercial_orders")
    .select("id, business_id, cnpj, buyer_email, buyer_profile_id, status")
    .eq("cnpj", pedido.cnpj).eq("status", "payment_approved")
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(inicio, fim));
  if (!mesmoDocumento) return null;
  const porNegocio = new Map<string, VinculoEsperado>();
  for (const item of mesmoDocumento) {
    if (!item.business_id || porNegocio.has(item.business_id)
      || item.buyer_email?.trim().toLowerCase() !== email
      || (item.buyer_profile_id && item.buyer_profile_id !== user.id)) continue;
    porNegocio.set(item.business_id, { businessId: item.business_id, orderId: item.id,
      paymentStatus: item.status, emailVerificado: email, cnpj: item.cnpj });
  }
  const { data: negocio, error: erroNegocio } = await supabase.from("businesses")
    .select("onboarding, site_url, avg_ticket_min, avg_ticket_max, avg_direct_cost, target_profit_per_customer")
    .eq("id", ativo.negocio.id).eq("profile_id", user.id).maybeSingle();
  if (erroNegocio || !negocio) return null;
  return { businessId: ativo.negocio.id, orderId: pedido.id, cnpj: pedido.cnpj,
    email, nome: pedido.buyer_name?.trim() || ativo.negocio.name,
    descricao: descricaoDaReuniao(negocio.onboarding, pedido.cnpj),
    onboardingConcluido: estadoDaConclusao(negocio).concluido,
    vinculosExternos: [...porNegocio.values()] };
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
  // Um evento criado em outro calendário não pode ser considerado ausente
  // apenas porque a configuração atual aponta para uma agenda diferente.
  // Falhar fechado preserva a reserva única até a equipe revisar a troca.
  if (!calendarioDaReservaAindaConfigurado(reserva.calendar_id, calendarIdLeituraConfigurado()))
    throw new Error("calendario_da_reserva_alterado");
  if (!reserva.google_event_id) return reserva;
  const evento = await lerEventoGoogle(reserva.google_event_id);
  const admin = createAdminClient();
  if (evento?.status === "confirmed") {
    const horario = horarioConfirmadoGoogle(evento.inicio, evento.fim);
    if (evento.businessId !== reserva.business_id || !evento.etag || !horario)
      throw new Error("evento_google_exige_revisao");
    if (reserva.status === "confirmed" && reserva.google_etag === evento.etag
      && Date.parse(reserva.starts_at) === Date.parse(horario.inicio)
      && Date.parse(reserva.ends_at) === Date.parse(horario.fim)) return reserva;
    const { data, error } = await admin.from("onboarding_meetings")
      .update({ status: "confirmed", google_etag: evento.etag, google_event_url: evento.htmlLink,
        starts_at: horario.inicio, ends_at: horario.fim })
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
  // Um status desconhecido não confirma a reunião nem libera a vaga.
  throw new Error("evento_google_exige_revisao");
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
  return { status: "confirmada", inicio: reserva.starts_at, fim: reserva.ends_at, url: segura,
    podeRemarcar: podeRemarcar(new Date(reserva.starts_at), new Date()), gerenciadaNoApp: agendaGoogleConfigurada() };
}

async function importarReservaExterna(ctx: NonNullable<Awaited<ReturnType<typeof contexto>>>, calendarId: string): Promise<Reserva | null> {
  const agora = new Date();
  const eventos = await listarEventosExternosGoogle(
    new Date(agora.getTime() - 24 * 60 * 60_000),
    new Date(agora.getTime() + 60 * 24 * 60 * 60_000),
  );
  const selecionada = selecionarReservaExterna(eventos, calendarId, ctx.vinculosExternos);
  if (selecionada.status === "ausente") return null;
  if (selecionada.status === "revisao") throw new Error(`reserva_externa_${selecionada.motivo}`);
  const evento = selecionada.evento;
  const horario = horarioConfirmadoGoogle(evento.inicio, evento.fim);
  if (!evento.etag || !horario) throw new Error("reserva_externa_incompleta");
  const admin = createAdminClient();
  const { data, error } = await admin.from("onboarding_meetings")
    .insert({ business_id: ctx.businessId, order_id: ctx.orderId, cnpj: ctx.cnpj,
      calendar_id: calendarId, google_event_id: evento.id, google_etag: evento.etag,
      google_event_url: evento.htmlLink, starts_at: horario.inicio, ends_at: horario.fim,
      status: "confirmed" })
    .select("id, business_id, calendar_id, google_event_id, google_etag, google_event_url, starts_at, ends_at, status")
    .single();
  if (!error && data) return data as Reserva;
  const concorrente = await reservaAtiva(ctx.businessId);
  if (concorrente) return conciliarReservaAtiva(concorrente);
  throw new Error("falha_importacao_reserva_externa");
}

export async function carregarAgendaAction(businessIdEsperado: string): Promise<EstadoAgenda> {
  if (!agendaGoogleLeituraConfigurada()) return { status: "legado" };
  const ctx = await contexto(businessIdEsperado);
  const calendarId = calendarIdLeituraConfigurado();
  if (!ctx || !calendarId) return { status: "erro", mensagem: "Não conseguimos conferir o negócio desta reunião." };
  try {
    const existente = await reservaAtiva(ctx.businessId);
    if (existente) {
      const conciliada = await conciliarReservaAtiva(existente);
      if (conciliada) return estadoDaReserva(conciliada);
    }
    const externa = await importarReservaExterna(ctx, calendarId);
    if (externa) return estadoDaReserva(externa);
    if (!agendaGoogleConfigurada()) return { status: "legado" };
    const agora = new Date();
    const ocupacoes = await ocupacoesDaAgenda(agora, calendarId);
    return { status: "livre", horarios: sugerirHorarios(agora, ocupacoes) };
  } catch {
    return { status: "erro", mensagem: "Não conseguimos conferir a agenda agora. Tente mais tarde." };
  }
}

export async function reservarHorarioAction(inicio: string, businessIdEsperado: string): Promise<EstadoAgenda> {
  if (!agendaGoogleConfigurada()) return { status: "legado" };
  const ctx = await contexto(businessIdEsperado);
  const calendarId = calendarIdConfigurado();
  // A página só mostra a agenda depois do onboarding; a action precisa
  // repetir o portão para bloquear chamadas diretas ou abas antigas.
  if (!ctx || !ctx.onboardingConcluido || !calendarId)
    return { status: "erro", mensagem: "Conclua o onboarding do negócio comprado para agendar." };
  const inicioDate = new Date(inicio);
  const agora = new Date();
  if (!Number.isFinite(inicioDate.getTime())) return { status: "erro", mensagem: "Escolha um horário válido." };
  const fimDate = new Date(inicioDate.getTime() + 25 * 60_000);
  const admin = createAdminClient();
  try {
    const anterior = await reservaAtiva(ctx.businessId);
    if (anterior) {
      const conciliada = await conciliarReservaAtiva(anterior);
      if (conciliada) return estadoDaReserva(conciliada);
    }
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
      const conciliada = ativa ? await conciliarReservaAtiva(ativa) : null;
      return conciliada ? estadoDaReserva(conciliada) : { status: "erro", mensagem: "Este horário ou negócio já tem uma reserva ativa. Atualize as opções ou fale com a equipe." };
    }
    try {
      await criarEventoGoogle({ eventId, inicio: inicioDate.toISOString(), fim: fimDate.toISOString(),
        email: ctx.email, nome: ctx.nome, businessId: ctx.businessId,
        descricao: ctx.descricao });
    } catch (erro) {
      if (erro instanceof CriacaoGoogleRecusada) {
        // Houve rejeição explícita do POST. Uma leitura do ID reservado ainda
        // confere que não existe evento antes de liberar a vaga local.
        const evento = await lerEventoGoogle(eventId);
        if (evento === null) {
          const { data: falha, error: erroFalha } = await admin.from("onboarding_meetings")
            .update({ status: "failed" }).eq("id", pendente.id)
            .eq("business_id", ctx.businessId).eq("status", "pending")
            .select("id").maybeSingle();
          if (erroFalha || !falha) throw new Error("falha_registro_recusa_google");
          revalidatePath("/onboarding/concluido");
          return { status: "erro", mensagem: "A agenda recusou esta reserva. Atualize os horários e tente novamente." };
        }
      }
      // Uma resposta incerta pode vir depois de o Google criar o evento.
      // Nesses casos, a reserva permanece pendente até a conciliação.
    }
    const conciliada = await conciliarReservaAtiva(pendente as Reserva);
    revalidatePath("/onboarding/concluido");
    return conciliada ? estadoDaReserva(conciliada) :
      { status: "pendente", inicio: pendente.starts_at };
  } catch {
    return { status: "erro", mensagem: "Não conseguimos confirmar a reserva. Atualize para conferir antes de tentar novamente." };
  }
}

export async function cancelarReservaAction(businessIdEsperado: string): Promise<EstadoAgenda> {
  if (!agendaGoogleConfigurada()) return { status: "legado" };
  const ctx = await contexto(businessIdEsperado);
  if (!ctx) return { status: "erro", mensagem: "Entre no negócio comprado para cancelar." };
  try {
    const atual = await reservaAtiva(ctx.businessId);
    const reserva = atual ? await conciliarReservaAtiva(atual) : null;
    if (!reserva || reserva.status !== "confirmed" || !reserva.google_event_id)
      return carregarAgendaAction(businessIdEsperado);
    // Cancelar aqui libera uma nova reserva; portanto é remarcação e respeita
    // o prazo de 25 minutos. Aviso de ausência continua pelo atendimento.
    if (!podeRemarcar(new Date(reserva.starts_at), new Date()))
      return estadoDaReserva(reserva);
    const apagou = await apagarEventoGoogle(reserva.google_event_id);
    if (!apagou) return { status: "erro", mensagem: "Não conseguimos confirmar o cancelamento. Sua reunião continua marcada." };
    const { error } = await createAdminClient().from("onboarding_meetings")
      .update({ status: "cancelled" }).eq("business_id", ctx.businessId).eq("id", reserva.id).eq("status", "confirmed");
    if (error) return { status: "erro", mensagem: "O Google recebeu o cancelamento. Atualize esta página para conferir o registro." };
    revalidatePath("/onboarding/concluido");
    return carregarAgendaAction(businessIdEsperado);
  } catch {
    return { status: "erro", mensagem: "Não conseguimos confirmar o cancelamento agora. Atualize esta página." };
  }
}
