"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { TEXTO_DA_DECLARACAO } from "@/app/(protected)/conta/declaracao";

const BUCKET = "v2g-midia";
const LIMITE = 4 * 1024 * 1024;

export interface GuiaVisual {
  id: string;
  nome: string;
  url: string | null;
}

export async function carregarGuiaVisual(businessId: string): Promise<GuiaVisual | null> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== businessId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from("creatives")
    .select("id, file_name, storage_path")
    .eq("business_id", businessId).eq("uso", "referencia").eq("type", "guia_identidade_pdf")
    .is("arquivado_em", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data?.storage_path) return null;
  const { data: url } = await admin.storage.from(BUCKET).createSignedUrl(data.storage_path, 3600);
  return { id: data.id, nome: data.file_name ?? "Guia de identidade", url: url?.signedUrl ?? null };
}

export interface GuiaState { erro?: string; ok?: string }

export async function enviarGuiaVisualAction(_prev: GuiaState, formData: FormData): Promise<GuiaState> {
  const ativo = await negocioAtivoDaSessao();
  const esperado = formData.get("businessId");
  if (ativo.status !== "selecionado" || ativo.negocio.id !== esperado)
    return { erro: "O negócio selecionado mudou. Atualize a página antes de enviar." };
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size < 1 || arquivo.size > LIMITE)
    return { erro: "Escolha um PDF de identidade visual de até 4 MB." };
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const cabecalho = new TextDecoder().decode(bytes.slice(0, 5));
  if (cabecalho !== "%PDF-") return { erro: "O arquivo precisa ser um PDF válido." };
  const admin = createAdminClient();
  const businessId = ativo.negocio.id;
  const caminho = `identidade/${businessId}/guia-${randomUUID()}.pdf`;
  const nome = arquivo.name.trim().slice(0, 180) || "guia-de-identidade.pdf";
  const upload = await admin.storage.from(BUCKET).upload(caminho, bytes, {
    contentType: "application/pdf", upsert: false,
  });
  if (upload.error) return { erro: "Não foi possível guardar o PDF. Tente novamente." };
  const gravacao = await admin.from("creatives").insert({
    business_id: businessId, uso: "referencia", type: "guia_identidade_pdf",
    file_name: nome, storage_path: caminho, status: "draft",
    copy: { declaracao: { em: new Date().toISOString(), texto: TEXTO_DA_DECLARACAO } },
  }).select("id").single();
  if (gravacao.error || !gravacao.data) {
    await admin.storage.from(BUCKET).remove([caminho]);
    return { erro: "Não foi possível registrar o PDF. Tente novamente." };
  }
  // A versao anterior fica arquivada como evidencia; so a nova aparece.
  await admin.from("creatives").update({ arquivado_em: new Date().toISOString() })
    .eq("business_id", businessId).eq("uso", "referencia")
    .eq("type", "guia_identidade_pdf").is("arquivado_em", null).neq("id", gravacao.data.id);
  revalidatePath("/onboarding/marca");
  return { ok: "Guia de identidade salvo." };
}
