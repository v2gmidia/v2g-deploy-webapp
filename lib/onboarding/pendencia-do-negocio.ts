import "server-only";
import { createClient } from "@/lib/supabase/server";
import { estadoDaConclusao, pendenciaDoOnboarding, type PendenciaDoOnboarding } from "./conclusao";
import { fluxoAguardaReuniao } from "./marca";

export interface LeituraDaPendencia {
  pendencia: PendenciaDoOnboarding | null;
  falha: boolean;
  reserva: { starts_at: string; ends_at: string } | null;
  /** Só true após conferir respostas operacionais e marca do negócio autorizado. */
  cadastroConcluido?: boolean;
}

export type AgendaConferidaParaInicio =
  | { status: "legado" | "livre" | "pendente" }
  | { status: "erro" }
  | { status: "confirmada"; inicio: string; fim: string };

/**
 * O Início só recebe uma reserva depois que a mesma leitura usada na página
 * da reunião conciliou o evento com o Google. Clique e linha local isolada
 * não são prova; erro de leitura também não preserva confirmação antiga.
 */
export function aplicarAgendaConferida(
  leitura: LeituraDaPendencia,
  agenda: AgendaConferidaParaInicio,
): LeituraDaPendencia {
  if (!leitura.cadastroConcluido) return leitura;
  if (agenda.status === "confirmada") return {
    ...leitura,
    pendencia: null,
    falha: false,
    reserva: { starts_at: agenda.inicio, ends_at: agenda.fim },
  };
  return {
    ...leitura,
    falha: agenda.status === "erro",
    reserva: null,
  };
}

/** Mesma leitura para Início e Avisos. Ausência de leitura não significa tudo em dia. */
export async function lerPendenciaDoNegocio(businessId: string): Promise<LeituraDaPendencia> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const indisponivel: LeituraDaPendencia = { pendencia: null, falha: true, reserva: null };
  if (!user) return indisponivel;
  const { data: jornada, error } = await supabase.from("businesses")
    .select("onboarding, site_url")
    .eq("id", businessId).eq("profile_id", user.id).maybeSingle();
  if (error || !jornada) return indisponivel;
  if (!fluxoAguardaReuniao(jornada.onboarding)) return { pendencia: null, falha: false, reserva: null };

  const cadastroConcluido = estadoDaConclusao(jornada).concluido;
  return {
    pendencia: pendenciaDoOnboarding(jornada, false),
    falha: false,
    reserva: null,
    cadastroConcluido,
  };
}
