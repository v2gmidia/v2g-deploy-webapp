import "server-only";
import { createClient } from "@/lib/supabase/server";
import { carregarAgenciaDaSessao } from "./da-sessao";
import { resumirCarteira } from "./resumo";
import { COLUNAS_PUBLICACAO } from "@/lib/criativos/publicacao";

export async function carregarResumoDaCarteira(businessId: string) {
  const c = await carregarAgenciaDaSessao();
  if (c.status !== "agencia" || !(c.clientes ?? [c.contexto]).some(cliente => cliente.businessId === businessId)) return resumirCarteira(businessId, [], [], true);
  try {
    const supabase = await createClient();
    const [revisoes, publicacoes] = await Promise.all([
      supabase.from("creative_review_requests").select("id, business_id, sha256, status")
        .eq("business_id", businessId).order("created_at", { ascending: false }).limit(121),
      supabase.from("creative_publication_confirmations").select(COLUNAS_PUBLICACAO)
        .eq("business_id", businessId).limit(121),
    ]);
    const falhou = Boolean(revisoes.error || publicacoes.error || !Array.isArray(revisoes.data)
      || !Array.isArray(publicacoes.data) || revisoes.data.length > 120 || publicacoes.data.length > 120);
    return resumirCarteira(businessId, revisoes.data ?? [], publicacoes.data ?? [], falhou);
  } catch { return resumirCarteira(businessId, [], [], true); }
}
