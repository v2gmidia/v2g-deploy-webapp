import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { lerTodasPaginasEmLotes } from "./paginacao";

const BUCKET = "v2g-midia";
const VALIDADE_SEGUNDOS = 60 * 60;

/**
 * Assina apenas os logos dos negócios já liberados para a sessão chamadora.
 * Falha de imagem não pode esconder o menu nem ampliar a lista de negócios.
 */
export async function logosDosNegociosLiberados(ids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids)];
  const logos = new Map<string, string>();
  if (unicos.length === 0) return logos;

  try {
    const admin = createAdminClient();
    const linhas = await lerTodasPaginasEmLotes(unicos, (lote, inicio, fim) => admin
      .from("creatives")
      .select("business_id, storage_path, created_at")
      .in("business_id", lote)
      .eq("uso", "logo")
      .is("arquivado_em", null)
      .order("created_at", { ascending: false })
      .range(inicio, fim));
    if (!linhas) return logos;

    const caminhos = new Map<string, string>();
    for (const linha of linhas) {
      if (linha.business_id && linha.storage_path && !caminhos.has(linha.business_id)) {
        caminhos.set(linha.business_id, linha.storage_path);
      }
    }

    const pares = [...caminhos];
    for (let inicio = 0; inicio < pares.length; inicio += 100) {
      const lote = pares.slice(inicio, inicio + 100);
      const { data, error } = await admin.storage.from(BUCKET)
        .createSignedUrls(lote.map(([, caminho]) => caminho), VALIDADE_SEGUNDOS);
      if (error || !data) continue;
      const urls = new Map(data.filter((item) => item.path && item.signedUrl)
        .map((item) => [item.path!, item.signedUrl!]));
      for (const [businessId, caminho] of lote) {
        const url = urls.get(caminho);
        if (url) logos.set(businessId, url);
      }
    }
  } catch {
    // O nome do negócio continua sendo o identificador acessível.
  }

  return logos;
}
