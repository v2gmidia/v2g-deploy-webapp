import type { OportunidadeRevOps } from "@/lib/revops/dados";

// SENTINELA_FIXTURE_REVOPS_DEV_ONLY
const fonteCompartilhada = {
  canal: "meet", sistema: "meet", referencia: "meet-ficticio-grupo-001", autor: "Pessoa fictícia",
};

const reuniaoCompartilhada = {
  id: "f0000000-0000-4000-8000-000000000010",
  tipo: "meeting_held" as const,
  evidencia: "source_fact" as const,
  resumo: "Reunião fictícia com duas empresas mantidas como oportunidades separadas.",
  ocorreuEm: "2026-10-06T17:00:00.000Z",
  transcricao: "pending" as const,
  revisaoHumana: "not_applicable" as const,
  fonte: fonteCompartilhada,
};

export const OPORTUNIDADES_REVOPS_FICTICIAS: OportunidadeRevOps[] = [
  {
    id: "f0000000-0000-4000-8000-000000000001",
    empresa: "Estúdio Horizonte (fictício)",
    pessoas: ["Ana Exemplo"],
    etapa: "proposal",
    proximoPasso: "Confirmar quem decide e registrar retorno da proposta",
    proximoPassoEm: "2026-10-09T17:00:00.000Z",
    desconhecido: null,
    diagnosticoInstagram: "guidance_needed",
    vinculos: { lp: false, pedido: false, negocio: false },
    criadaEm: "2026-10-05T14:00:00.000Z",
    interacoes: [
      {
        id: "f0000000-0000-4000-8000-000000000011",
        tipo: "proposal_liked",
        evidencia: "human_report",
        resumo: "A responsável disse ter gostado da proposta; compra ainda não confirmada.",
        ocorreuEm: "2026-10-07T15:30:00.000Z",
        transcricao: "not_applicable",
        revisaoHumana: "not_applicable",
        fonte: { canal: "whatsapp", sistema: "manual", referencia: "fixture-msg-001", autor: "Ana Exemplo" },
      },
      reuniaoCompartilhada,
    ],
  },
  {
    id: "f0000000-0000-4000-8000-000000000002",
    empresa: "Oficina Aurora (fictícia)",
    pessoas: ["Ana Exemplo"],
    etapa: "purchase_reported",
    proximoPasso: null,
    proximoPassoEm: null,
    desconhecido: "proximo_passo_nao_informado",
    diagnosticoInstagram: "not_assessed",
    vinculos: { lp: false, pedido: true, negocio: false },
    criadaEm: "2026-10-05T14:05:00.000Z",
    interacoes: [
      {
        id: "f0000000-0000-4000-8000-000000000012",
        tipo: "purchase_reported",
        evidencia: "human_report",
        resumo: "Compra relatada em fixture; pagamento continua sem confirmação.",
        ocorreuEm: "2026-10-07T16:00:00.000Z",
        transcricao: "not_applicable",
        revisaoHumana: "not_applicable",
        fonte: { canal: "whatsapp", sistema: "manual", referencia: "fixture-msg-002", autor: "Registro fictício" },
      },
      reuniaoCompartilhada,
    ],
  },
];

