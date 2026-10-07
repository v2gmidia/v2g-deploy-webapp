export const CANAIS_REVOPS = [
  "lp", "instagram", "whatsapp", "referral", "meet", "phone", "email", "webapp", "other",
] as const;
export type CanalRevOps = (typeof CANAIS_REVOPS)[number];

export const TIPOS_DE_INTERACAO = [
  "interest_registered", "message", "meeting_scheduled", "meeting_held",
  "proposal_sent", "proposal_liked", "purchase_reported", "payment_approved",
  "campaign_live", "diagnosis", "guidance", "other",
] as const;
export type TipoDeInteracao = (typeof TIPOS_DE_INTERACAO)[number];

export const TIPOS_DE_EVIDENCIA = ["source_fact", "human_report", "inference"] as const;
export type TipoDeEvidencia = (typeof TIPOS_DE_EVIDENCIA)[number];

export const ROTULOS_INTERACAO: Record<TipoDeInteracao, string> = {
  interest_registered: "Interesse registrado",
  message: "Interação registrada",
  meeting_scheduled: "Reunião agendada",
  meeting_held: "Reunião realizada",
  proposal_sent: "Proposta enviada",
  proposal_liked: "Gostou da proposta",
  purchase_reported: "Compra relatada",
  payment_approved: "Pagamento aprovado",
  campaign_live: "Campanha no ar",
  diagnosis: "Diagnóstico registrado",
  guidance: "Orientação registrada",
  other: "Outro evento",
};

export const ROTULOS_EVIDENCIA: Record<TipoDeEvidencia, string> = {
  source_fact: "Fato da fonte",
  human_report: "Relato humano",
  inference: "Inferência pendente de revisão",
};

export interface EventoRevOps {
  id: string;
  tipo: TipoDeInteracao;
  evidencia: TipoDeEvidencia;
  ocorreuEm: string;
  transcricao: "not_applicable" | "pending" | "available" | "unavailable";
}

export function contagemDeVendasConfirmadas(eventos: readonly EventoRevOps[]): number {
  return eventos.filter((evento) => evento.tipo === "payment_approved").length;
}

export function alertasDeQualidade(eventos: readonly EventoRevOps[]): string[] {
  const tipos = new Set(eventos.map((evento) => evento.tipo));
  const alertas: string[] = [];
  if (tipos.has("purchase_reported") && !tipos.has("payment_approved")) {
    alertas.push("Venda relatada sem pagamento confirmado");
  }
  if (tipos.has("campaign_live") && !tipos.has("payment_approved")) {
    alertas.push("Campanha citada sem pagamento confirmado");
  }
  if (eventos.some((evento) => evento.tipo === "meeting_held" && evento.transcricao === "pending")) {
    alertas.push("Transcrição pendente");
  }
  return alertas;
}

export function diagnosticoInstagramPermiteCompra(
  diagnostico: "not_assessed" | "guidance_needed" | "adequate",
): true {
  void diagnostico;
  return true;
}

