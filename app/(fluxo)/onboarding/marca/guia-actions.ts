"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { TEXTO_DA_DECLARACAO } from "@/app/(protected)/conta/declaracao";
import { TETO_DO_NAVEGADOR_BYTES, TETO_DO_NAVEGADOR_MB } from "@/lib/criativos/limites.mjs";

const BUCKET = "v2g-midia";

export interface GuiaVisual {
  id: string;
  nome: string;
  url: string | null;
}

export async function carregarGuiaVisual(businessId: string): Promise<GuiaVisual | null> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== businessId)
    throw new Error("negocio_alterado_na_leitura_do_guia");
  const admin = createAdminClient();
  const { data, error } = await admin.from("creatives")
    .select("id, file_name, storage_path")
    .eq("business_id", businessId).eq("uso", "referencia").eq("type", "guia_identidade_pdf")
    .is("arquivado_em", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("falha_leitura_guia_identidade");
  if (!data) return null;
  if (!data.storage_path) throw new Error("guia_identidade_sem_arquivo");
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
  if (!(arquivo instanceof File) || arquivo.size < 1 || arquivo.size > TETO_DO_NAVEGADOR_BYTES)
    return { erro: `Escolha um PDF de identidade visual de até ${TETO_DO_NAVEGADOR_MB} MB.` };
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
  const novoId = randomUUID();
  const gravacao = await admin.from("creatives").insert({
    id: novoId,
    business_id: businessId, uso: "referencia", type: "guia_identidade_pdf",
    file_name: nome, storage_path: caminho, status: "draft",
    copy: { declaracao: { em: new Date().toISOString(), texto: TEXTO_DA_DECLARACAO } },
  }).select("id").single();
  if (gravacao.error || !gravacao.data) {
    // A resposta da inserção pode falhar depois de a linha existir. Nunca
    // remova do Storage um PDF que ainda pode ser referenciado no banco.
    const conferencia = await admin.from("creatives")
      .select("id").eq("id", novoId).eq("business_id", businessId)
      .eq("storage_path", caminho).maybeSingle();
    if (conferencia.error) {
      console.error("[marca] estado da gravação do guia é incerto");
      return { erro: "Não conseguimos confirmar o PDF. Atualize a página e confira o guia antes de tentar novamente." };
    }
    if (!conferencia.data) {
      const remocao = await admin.storage.from(BUCKET).remove([caminho]);
      if (remocao.error) console.error("[marca] PDF sem registro não pôde ser removido");
      return { erro: "Não foi possível registrar o PDF. Tente novamente." };
    }
  }
  // A versão anterior fica arquivada como evidência; só a nova aparece.
  // A troca não está concluída enquanto este arquivamento não for confirmado.
  const arquivoAnterior = await admin.from("creatives").update({ arquivado_em: new Date().toISOString() })
    .eq("business_id", businessId).eq("uso", "referencia")
    .eq("type", "guia_identidade_pdf").is("arquivado_em", null).neq("id", novoId)
    .select("id");
  if (arquivoAnterior.error || !arquivoAnterior.data) {
    // Mantém o PDF novo no Storage caso o registro não possa ser arquivado:
    // um registro ativo nunca deve apontar para um arquivo que apagamos.
    const desfazer = await admin.from("creatives")
      .update({ arquivado_em: new Date().toISOString() })
      .eq("id", novoId).eq("business_id", businessId)
      .is("arquivado_em", null).select("id");
    if (desfazer.error || desfazer.data?.length !== 1) {
      console.error("[marca] falha ao desfazer a troca do guia após erro de arquivamento");
      return { erro: "Não conseguimos confirmar a troca do PDF. Atualize a página e confira os arquivos antes de tentar novamente." };
    }
    await admin.storage.from(BUCKET).remove([caminho]);
    return { erro: "Não conseguimos confirmar a troca do PDF. Atualize a página e confira o guia antes de tentar novamente." };
  }
  revalidatePath("/onboarding/marca");
  return { ok: "Guia de identidade salvo." };
}
