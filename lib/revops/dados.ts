import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EtapaRevOps,
  EventoRevOps,
  StatusRevisaoHumana,
  TipoDeEvidencia,
  TipoDeInteracao,
} from "./contrato";

export interface InteracaoRevOps extends EventoRevOps {
  resumo: string;
  revisaoHumana: StatusRevisaoHumana;
  revisadoPorId: string | null;
  revisadoEm: string | null;
  fonte: {
    canal: string;
    sistema: string;
    referencia: string;
    autor: string | null;
  };
}

export interface OportunidadeRevOps {
  id: string;
  empresa: string;
  pessoas: string[];
  etapa: EtapaRevOps;
  responsavelId: string | null;
  proximoPasso: string | null;
  proximoPassoEm: string | null;
  desconhecido: string | null;
  diagnosticoInstagram: string;
  vinculos: {
    lp: boolean;
    pedido: boolean;
    negocio: boolean;
    prova: null | {
      registradaEm: string;
      registradaPorId: string;
      descricao: string;
    };
  };
  criadaEm: string;
  interacoes: InteracaoRevOps[];
}

interface LinhaOportunidade {
  id: string;
  stage: EtapaRevOps;
  owner_profile_id: string | null;
  next_step: string | null;
  next_step_due_at: string | null;
  unknown_state: string | null;
  lead_lp_id: number | null;
  commercial_order_id: string | null;
  business_id: string | null;
  linked_at: string | null;
  linked_by: string | null;
  link_evidence: string | null;
  created_at: string;
  revops_prospect_organizations: {
    declared_name: string;
    instagram_diagnostic: string;
  } | null;
}

interface LinhaPessoa {
  opportunity_id: string;
  revops_people: { display_name: string } | null;
}

interface LinhaInteracao {
  opportunity_id: string;
  revops_interactions: {
    id: string;
    interaction_type: TipoDeInteracao;
    evidence_kind: TipoDeEvidencia;
    summary: string;
    transcript_status: InteracaoRevOps["transcricao"];
    human_review_status: InteracaoRevOps["revisaoHumana"];
    reviewed_by: string | null;
    reviewed_at: string | null;
    occurred_at: string;
    revops_source_references: {
      channel: string;
      source_system: string;
      source_external_id: string;
      source_author: string | null;
    } | null;
  } | null;
}

export async function listarOportunidadesRevOps(): Promise<OportunidadeRevOps[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("revops_opportunities")
    .select("id, stage, owner_profile_id, next_step, next_step_due_at, unknown_state, lead_lp_id, commercial_order_id, business_id, linked_at, linked_by, link_evidence, created_at, revops_prospect_organizations(declared_name, instagram_diagnostic)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const oportunidades = (data ?? []) as unknown as LinhaOportunidade[];
  if (oportunidades.length === 0) return [];
  const ids = oportunidades.map((oportunidade) => oportunidade.id);

  const [respostaPessoas, respostaInteracoes] = await Promise.all([
    admin.from("revops_opportunity_people")
      .select("opportunity_id, revops_people(display_name)")
      .in("opportunity_id", ids),
    admin.from("revops_interaction_opportunities")
      .select("opportunity_id, revops_interactions(id, interaction_type, evidence_kind, summary, transcript_status, human_review_status, reviewed_by, reviewed_at, occurred_at, revops_source_references(channel, source_system, source_external_id, source_author))")
      .in("opportunity_id", ids),
  ]);
  if (respostaPessoas.error) throw respostaPessoas.error;
  if (respostaInteracoes.error) throw respostaInteracoes.error;

  const pessoas = (respostaPessoas.data ?? []) as unknown as LinhaPessoa[];
  const interacoes = (respostaInteracoes.data ?? []) as unknown as LinhaInteracao[];

  return oportunidades.map((oportunidade) => ({
    id: oportunidade.id,
    empresa: oportunidade.revops_prospect_organizations?.declared_name ?? "Empresa não informada",
    pessoas: pessoas
      .filter((linha) => linha.opportunity_id === oportunidade.id)
      .map((linha) => linha.revops_people?.display_name)
      .filter((nome): nome is string => Boolean(nome)),
    etapa: oportunidade.stage,
    responsavelId: oportunidade.owner_profile_id,
    proximoPasso: oportunidade.next_step,
    proximoPassoEm: oportunidade.next_step_due_at,
    desconhecido: oportunidade.unknown_state,
    diagnosticoInstagram:
      oportunidade.revops_prospect_organizations?.instagram_diagnostic ?? "not_assessed",
    vinculos: {
      lp: oportunidade.lead_lp_id !== null,
      pedido: oportunidade.commercial_order_id !== null,
      negocio: oportunidade.business_id !== null,
      prova: oportunidade.linked_at && oportunidade.linked_by && oportunidade.link_evidence
        ? {
          registradaEm: oportunidade.linked_at,
          registradaPorId: oportunidade.linked_by,
          descricao: oportunidade.link_evidence,
        }
        : null,
    },
    criadaEm: oportunidade.created_at,
    interacoes: interacoes
      .filter((linha) => linha.opportunity_id === oportunidade.id && linha.revops_interactions)
      .map((linha) => {
        const interacao = linha.revops_interactions!;
        return {
          id: interacao.id,
          tipo: interacao.interaction_type,
          evidencia: interacao.evidence_kind,
          resumo: interacao.summary,
          ocorreuEm: interacao.occurred_at,
          transcricao: interacao.transcript_status,
          revisaoHumana: interacao.human_review_status,
          revisadoPorId: interacao.reviewed_by,
          revisadoEm: interacao.reviewed_at,
          fonte: {
            canal: interacao.revops_source_references?.channel ?? "other",
            sistema: interacao.revops_source_references?.source_system ?? "other",
            referencia: interacao.revops_source_references?.source_external_id ?? "sem referência",
            autor: interacao.revops_source_references?.source_author ?? null,
          },
        };
      })
      .sort((a, b) => b.ocorreuEm.localeCompare(a.ocorreuEm)),
  }));
}

