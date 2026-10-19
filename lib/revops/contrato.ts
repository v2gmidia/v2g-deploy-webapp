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

// Confirmações operacionais exigem integração e evidência verificável.
export const TIPOS_MANUAIS_DE_INTERACAO = TIPOS_DE_INTERACAO.filter(
  (tipo) => tipo !== "payment_approved" && tipo !== "campaign_live",
);

export const TIPOS_DE_EVIDENCIA = ["source_fact", "human_report", "inference"] as const;
export type TipoDeEvidencia = (typeof TIPOS_DE_EVIDENCIA)[number];
export type StatusRevisaoHumana = "not_applicable" | "pending" | "confirmed" | "rejected";

export const ETAPAS_REVOPS = [
  "interested", "qualification", "meeting", "proposal", "decision",
  "purchase_reported", "won_verified", "lost", "postponed",
] as const;
export type EtapaRevOps = (typeof ETAPAS_REVOPS)[number];
export type NaturezaDaEtapaRevOps = "marco" | "trabalho" | "resultado" | "espera";

export const METADADOS_ETAPA_REVOPS: Record<EtapaRevOps, {
  rotulo: string;
  natureza: NaturezaDaEtapaRevOps;
}> = {
  interested: { rotulo: "Interessado", natureza: "marco" },
  qualification: { rotulo: "Qualificação", natureza: "trabalho" },
  meeting: { rotulo: "Reunião", natureza: "trabalho" },
  proposal: { rotulo: "Proposta", natureza: "trabalho" },
  decision: { rotulo: "Decisão", natureza: "trabalho" },
  purchase_reported: { rotulo: "Compra relatada", natureza: "marco" },
  won_verified: { rotulo: "Venda verificada", natureza: "resultado" },
  lost: { rotulo: "Perdida", natureza: "resultado" },
  postponed: { rotulo: "Adiada", natureza: "espera" },
};

export const ROTULOS_NATUREZA_ETAPA: Record<NaturezaDaEtapaRevOps, string> = {
  marco: "Marco",
  trabalho: "Etapa",
  resultado: "Resultado",
  espera: "Espera",
};

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
  inference: "Inferência",
};

export function rotuloDaEvidencia(
  evidencia: TipoDeEvidencia,
  revisaoHumana: StatusRevisaoHumana = "not_applicable",
): string {
  if (evidencia !== "inference") return ROTULOS_EVIDENCIA[evidencia];
  if (revisaoHumana === "pending") return "Inferência pendente de revisão";
  if (revisaoHumana === "confirmed") return "Inferência marcada como confirmada";
  if (revisaoHumana === "rejected") return "Inferência marcada como rejeitada";
  return "Inferência sem estado de revisão";
}

export interface FonteRevOpsExibivel {
  canal: string;
  sistema: string;
  referencia: string;
  autor: string | null;
}

export function descricaoDaFonteRevOps(fonte: FonteRevOpsExibivel): string {
  const autor = fonte.autor ? `autor: ${fonte.autor}` : "autor não informado";
  return `${fonte.canal} · ${fonte.sistema} · ref. ${fonte.referencia} · ${autor}`;
}

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

export interface OportunidadeParaResumoRevOps {
  responsavelId: string | null;
  proximoPasso: string | null;
  interacoes: readonly EventoRevOps[];
}

export interface ResumoOperacionalRevOps {
  oportunidades: number;
  comResponsavel: number;
  comProximoPasso: number;
  reunioesRealizadas: number;
  comprasRelatadas: number;
  vendasVerificadas: number;
}

export function resumoOperacionalRevOps(
  oportunidades: readonly OportunidadeParaResumoRevOps[],
): ResumoOperacionalRevOps {
  // Uma interação pode pertencer a duas oportunidades. A métrica conta o fato
  // uma vez pelo ID, sem apagar sua presença nas duas linhas do tempo.
  const eventosUnicos = new Map<string, EventoRevOps>();
  for (const oportunidade of oportunidades) {
    for (const interacao of oportunidade.interacoes) {
      eventosUnicos.set(interacao.id, interacao);
    }
  }
  const eventos = [...eventosUnicos.values()];

  return {
    oportunidades: oportunidades.length,
    comResponsavel: oportunidades.filter((oportunidade) => oportunidade.responsavelId).length,
    comProximoPasso: oportunidades.filter((oportunidade) => oportunidade.proximoPasso).length,
    reunioesRealizadas: eventos.filter((evento) => evento.tipo === "meeting_held").length,
    comprasRelatadas: eventos.filter((evento) => evento.tipo === "purchase_reported").length,
    vendasVerificadas: contagemDeVendasConfirmadas(eventos),
  };
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

export interface ContextoDeQualidadeDaOportunidade {
  responsavelId: string | null;
  proximoPasso: string | null;
  proximoPassoEm: string | null;
  vinculos: {
    lp?: boolean;
    pedido: boolean;
    negocio: boolean;
    prova: null | {
      registradaEm: string;
      registradaPorId: string;
      descricao: string;
    };
  };
  interacoes: readonly (EventoRevOps & {
    revisaoHumana?: StatusRevisaoHumana;
    revisadoPorId?: string | null;
    revisadoEm?: string | null;
  })[];
}

export function alertasDaOportunidade(
  oportunidade: ContextoDeQualidadeDaOportunidade,
): string[] {
  const alertas = alertasDeQualidade(oportunidade.interacoes);

  if (!oportunidade.responsavelId) {
    alertas.push("Oportunidade sem responsável");
  }
  if (!oportunidade.proximoPasso) {
    alertas.push("Oportunidade sem próximo passo");
  } else if (!oportunidade.proximoPassoEm) {
    alertas.push("Próximo passo sem data");
  }
  if (oportunidade.vinculos.pedido && !oportunidade.vinculos.negocio) {
    alertas.push("Pedido sem negócio WebApp vinculado");
  }
  if (
    (oportunidade.vinculos.lp || oportunidade.vinculos.pedido || oportunidade.vinculos.negocio)
    && !oportunidade.vinculos.prova
  ) {
    alertas.push("Vínculo sem evidência completa");
  }
  if (oportunidade.interacoes.some(
    (interacao) => interacao.evidencia === "inference" && interacao.revisaoHumana === "pending",
  )) {
    alertas.push("Inferência sem revisão humana");
  }
  if (oportunidade.interacoes.some(
    (interacao) => interacao.evidencia === "inference"
      && (!interacao.revisaoHumana || interacao.revisaoHumana === "not_applicable"),
  )) {
    alertas.push("Inferência sem estado de revisão");
  }
  if (oportunidade.interacoes.some(
    (interacao) => interacao.evidencia === "inference"
      && (interacao.revisaoHumana === "confirmed" || interacao.revisaoHumana === "rejected")
      && (!interacao.revisadoPorId || !interacao.revisadoEm),
  )) {
    alertas.push("Revisão humana sem autoria e data");
  }

  return alertas;
}

export function diagnosticoInstagramPermiteCompra(
  diagnostico: "not_assessed" | "guidance_needed" | "adequate",
): true {
  void diagnostico;
  return true;
}
