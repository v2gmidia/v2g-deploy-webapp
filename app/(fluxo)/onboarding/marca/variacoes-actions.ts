"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { TEXTO_DA_DECLARACAO } from "@/app/(protected)/conta/declaracao";
import { TETO_DO_NAVEGADOR_BYTES } from "@/lib/criativos/limites.mjs";
import { lerDimensao, tipoReal } from "@/lib/identidade/dimensoes";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "v2g-midia";
const TIPO = "variacao_logo";
const MAX_ARQUIVOS = 6;
const MAX_BYTES = 4 * 1024 * 1024;

export interface VariacaoVisual { id: string; nome: string; url: string | null }
export interface VariacoesState { erro?: string; ok?: string }

export async function carregarVariacoesVisuais(businessId: string): Promise<VariacaoVisual[]> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== businessId) return [];
  const admin = createAdminClient();
  const { data, error } = await admin.from("creatives")
    .select("id, file_name, storage_path")
    .eq("business_id", businessId).eq("uso", "referencia").eq("type", TIPO)
    .is("arquivado_em", null).order("created_at", { ascending: false }).limit(MAX_ARQUIVOS);
  if (error || !data) return [];
  const paths = data.map((item) => item.storage_path).filter((path): path is string => Boolean(path));
  const { data: signed } = paths.length
    ? await admin.storage.from(BUCKET).createSignedUrls(paths, 3600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((item) => [item.path ?? "", item.signedUrl ?? null]));
  return data.map((item) => ({
    id: item.id, nome: item.file_name ?? "Imagem da marca", url: urls.get(item.storage_path ?? "") ?? null,
  }));
}

export async function enviarVariacoesAction(_prev: VariacoesState, formData: FormData): Promise<VariacoesState> {
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== formData.get("businessId"))
    return { erro: "O negócio selecionado mudou. Atualize a página." };
  const arquivos = formData.getAll("arquivos");
  if (!arquivos.length || arquivos.some((item) => !(item instanceof File)))
    return { erro: "Escolha uma ou mais imagens PNG ou JPG." };
  const candidatos = arquivos as File[];
  if (candidatos.length > MAX_ARQUIVOS)
    return { erro: `Envie até ${MAX_ARQUIVOS} imagens por vez.` };
  if (candidatos.reduce((total, arquivo) => total + arquivo.size, 0) > TETO_DO_NAVEGADOR_BYTES)
    return { erro: "Este envio passa de 9 MB. Divida as imagens em dois envios." };
  const preparados: { bytes: Uint8Array; nome: string; extensao: "png" | "jpg"; tipo: string }[] = [];
  for (const arquivo of candidatos) {
    if (!arquivo.size || arquivo.size > MAX_BYTES)
      return { erro: `A imagem ${arquivo.name} deve ter até 4 MB.` };
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = tipoReal(bytes);
    const dimensao = lerDimensao(bytes);
    if ((tipo !== "png" && tipo !== "jpeg") || !dimensao || Math.min(dimensao.largura, dimensao.altura) < 512)
      return { erro: `A imagem ${arquivo.name} precisa ser PNG ou JPG com pelo menos 512 pixels de cada lado.` };
    preparados.push({ bytes, nome: arquivo.name.trim().slice(0, 180) || "imagem-da-marca", extensao: tipo === "png" ? "png" : "jpg", tipo: tipo === "png" ? "image/png" : "image/jpeg" });
  }
  const admin = createAdminClient();
  const businessId = ativo.negocio.id;
  const { count, error: erroContagem } = await admin.from("creatives")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId).eq("uso", "referencia").eq("type", TIPO).is("arquivado_em", null);
  if (erroContagem) return { erro: "Não conseguimos conferir seus arquivos agora." };
  if ((count ?? 0) + preparados.length > MAX_ARQUIVOS)
    return { erro: `O limite é ${MAX_ARQUIVOS} imagens adicionais. Escolha menos arquivos.` };

  const salvos: { id: string; path: string }[] = [];
  for (const arquivo of preparados) {
    const path = `identidade/${businessId}/variacao-${randomUUID()}.${arquivo.extensao}`;
    const upload = await admin.storage.from(BUCKET).upload(path, arquivo.bytes, { contentType: arquivo.tipo, upsert: false });
    if (upload.error) break;
    const gravacao = await admin.from("creatives").insert({
      business_id: businessId, uso: "referencia", type: TIPO,
      file_name: arquivo.nome, storage_path: path, status: "draft",
      copy: { declaracao: { em: new Date().toISOString(), texto: TEXTO_DA_DECLARACAO } },
    }).select("id").single();
    if (gravacao.error || !gravacao.data) {
      await admin.storage.from(BUCKET).remove([path]);
      break;
    }
    salvos.push({ id: gravacao.data.id, path });
  }
  if (salvos.length !== preparados.length) {
    // O lote é indivisível: se um arquivo falhar, arquivamos as linhas novas e removemos os objetos.
    for (const item of salvos) {
      await admin.from("creatives").update({ arquivado_em: new Date().toISOString() })
        .eq("business_id", businessId).eq("id", item.id);
    }
    if (salvos.length) await admin.storage.from(BUCKET).remove(salvos.map((item) => item.path));
    return { erro: "Não conseguimos salvar todas as imagens. Tente novamente." };
  }
  revalidatePath("/onboarding/marca");
  return { ok: `${salvos.length} imagem(ns) da marca salva(s).` };
}
