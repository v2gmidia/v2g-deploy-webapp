import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { agendaGoogleLeituraConfigurada } from "@/lib/agenda/google";
import { estadoDaConclusao, pendenciaDoOnboarding, type PendenciaDoOnboarding } from "./conclusao";
import { fluxoAguardaReuniao } from "./marca";

export interface LeituraDaPendencia {
  pendencia: PendenciaDoOnboarding | null;
  falha: boolean;
  reserva: { starts_at: string; ends_at: string } | null;
  /** Só true após conferir respostas, contas e marca do negócio autorizado. */
  cadastroConcluido?: boolean;
}

/** Mesma leitura para Início e Avisos. Ausência de leitura não significa tudo em dia. */
export async function lerPendenciaDoNegocio(businessId: string): Promise<LeituraDaPendencia> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const indisponivel: LeituraDaPendencia = { pendencia: null, falha: true, reserva: null };
  if (!user) return indisponivel;
  const { data: jornada, error } = await supabase.from("businesses")
    .select("onboarding, site_url, avg_ticket_min, avg_ticket_max, avg_direct_cost, target_profit_per_customer")
    .eq("id", businessId).eq("profile_id", user.id).maybeSingle();
  if (error || !jornada) return indisponivel;
  if (!fluxoAguardaReuniao(jornada.onboarding)) return { pendencia: null, falha: false, reserva: null };

  const cadastroConcluido = estadoDaConclusao(jornada).concluido;
  let reserva: LeituraDaPendencia["reserva"] = null;
  if (cadastroConcluido && agendaGoogleLeituraConfigurada()) {
    // Só após comprovar propriedade do negócio sob sessão/RLS.
    const resposta = await createAdminClient().from("onboarding_meetings")
      .select("starts_at, ends_at").eq("business_id", businessId).eq("status", "confirmed")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (resposta.error) return { ...indisponivel, cadastroConcluido };
    reserva = resposta.data;
  }
  return { pendencia: pendenciaDoOnboarding(jornada, Boolean(reserva)), falha: false, reserva, cadastroConcluido };
}
