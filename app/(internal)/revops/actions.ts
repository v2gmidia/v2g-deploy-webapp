"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioRevOps } from "@/lib/revops/sessao";
import { CANAIS_REVOPS, TIPOS_DE_EVIDENCIA, TIPOS_MANUAIS_DE_INTERACAO } from "@/lib/revops/contrato";

export type RevOpsActionState = { ok?: string; erro?: string };

const ehUuid = (valor: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
const em = <T extends readonly string[]>(valor: string, lista: T): valor is T[number] => lista.includes(valor);

function instante(valor: FormDataEntryValue | null): string | null {
  const data = new Date(String(valor ?? ""));
  return Number.isNaN(data.valueOf()) ? null : data.toISOString();
}

export async function registrarInteressadoAction(
  _anterior: RevOpsActionState,
  formData: FormData,
): Promise<RevOpsActionState> {
  const user = await usuarioRevOps();
  if (!user) return { erro: "Acesso não autorizado." };

  const sourceExternalId = String(formData.get("sourceExternalId") ?? "").trim();
  const personName = String(formData.get("personName") ?? "").trim();
  const personEmail = String(formData.get("personEmail") ?? "").trim();
  const personPhone = String(formData.get("personPhone") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const channel = String(formData.get("channel") ?? "");
  const evidenceKind = String(formData.get("evidenceKind") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const occurredAt = instante(formData.get("occurredAt"));
  const nextStep = String(formData.get("nextStep") ?? "").trim();
  const instagramDiagnostic = String(formData.get("instagramDiagnostic") ?? "");

  if (!ehUuid(sourceExternalId) || personName.length < 2 || organizationName.length < 2
    || summary.length < 2 || !occurredAt || !em(channel, CANAIS_REVOPS)
    || !em(evidenceKind, TIPOS_DE_EVIDENCIA)) {
    return { erro: "Confira pessoa, empresa, origem, data e evidência." };
  }
  if (personEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personEmail)) {
    return { erro: "Confira o e-mail ou deixe o campo vazio." };
  }
  if (!em(instagramDiagnostic, ["not_assessed", "guidance_needed", "adequate"] as const)) {
    return { erro: "Escolha um estado válido para o diagnóstico do Instagram." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("revops_register_interest", {
      p_source_external_id: sourceExternalId,
      p_person_name: personName,
      p_person_email: personEmail,
      p_person_phone: personPhone,
      p_organization_name: organizationName,
      p_channel: channel,
      p_evidence_kind: evidenceKind,
      p_summary: summary,
      p_occurred_at: occurredAt,
      p_next_step: nextStep,
      p_instagram_diagnostic: instagramDiagnostic,
      p_actor_profile_id: user.id,
    });
    if (error) throw error;
  } catch (error) {
    console.error("[revops] falha ao registrar interessado ::",
      error instanceof Error ? error.message : "erro desconhecido");
    return { erro: "Não foi possível registrar. Confira se a estrutura local já foi aplicada ao banco." };
  }
  revalidatePath("/revops");
  return { ok: "Interessado registrado sem conciliação automática." };
}

export async function registrarInteracaoAction(
  _anterior: RevOpsActionState,
  formData: FormData,
): Promise<RevOpsActionState> {
  const user = await usuarioRevOps();
  if (!user) return { erro: "Acesso não autorizado." };

  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const sourceSystem = String(formData.get("sourceSystem") ?? "");
  const sourceExternalId = String(formData.get("sourceExternalId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "");
  const sourceAuthor = String(formData.get("sourceAuthor") ?? "").trim();
  const interactionType = String(formData.get("interactionType") ?? "");
  const evidenceKind = String(formData.get("evidenceKind") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const occurredAt = instante(formData.get("occurredAt"));
  const transcriptStatus = String(formData.get("transcriptStatus") ?? "not_applicable");

  const sistemas = ["manual", "lp", "instagram", "whatsapp", "meet", "referral", "commercial_order", "webapp", "other"] as const;
  const transcricoes = ["not_applicable", "pending", "available", "unavailable"] as const;
  if (!ehUuid(opportunityId) || !em(sourceSystem, sistemas) || sourceExternalId.length < 1
    || sourceExternalId.length > 300 || !em(channel, CANAIS_REVOPS)
    || !em(interactionType, TIPOS_MANUAIS_DE_INTERACAO) || !em(evidenceKind, TIPOS_DE_EVIDENCIA)
    || summary.length < 2 || !occurredAt || !em(transcriptStatus, transcricoes)) {
    return { erro: "Confira oportunidade, fonte, data, tipo e evidência." };
  }
  if (interactionType === "meeting_held" && transcriptStatus === "not_applicable") {
    return { erro: "Informe se a transcrição está pendente, disponível ou indisponível." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("revops_register_interaction", {
      p_opportunity_id: opportunityId,
      p_source_system: sourceSystem,
      p_source_external_id: sourceExternalId,
      p_channel: channel,
      p_source_author: sourceAuthor,
      p_interaction_type: interactionType,
      p_evidence_kind: evidenceKind,
      p_summary: summary,
      p_occurred_at: occurredAt,
      p_transcript_status: transcriptStatus,
      p_actor_profile_id: user.id,
    });
    if (error) throw error;
  } catch (error) {
    console.error("[revops] falha ao registrar interação ::",
      error instanceof Error ? error.message : "erro desconhecido");
    return { erro: "Não foi possível registrar. Repetir a mesma referência não cria outro evento." };
  }
  revalidatePath("/revops");
  return { ok: "Interação registrada. A fonte repetida mantém um único evento." };
}
