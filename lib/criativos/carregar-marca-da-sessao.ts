import "server-only";

import { MAXIMO_DE_FOTOS } from "@/lib/identidade/regras";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { lerMarca } from "@/lib/onboarding/marca";
import { createClient } from "@/lib/supabase/server";
import type { CampoDoContexto } from "./briefing-geracao";
import type { LinhaDeMarca } from "./selecionar-marca";

/**
 * Só metadados, sempre sob a sessão do cliente e RLS. Não assina URL,
 * lê bytes, atesta consentimento para IA ou permite geração.
 */
export async function carregarMarcaDaSessao(negocioEsperado: string): Promise<
  | { ok: true; businessId: string; linhas: LinhaDeMarca[]; coresConfirmadas: CampoDoContexto | null }
  | { ok: false; motivo: "negocio_nao_autorizado" | "consulta_falhou" | "resultado_incompleto" }
> {
  const ativo = await negocioAtivoDaSessao();
  if (!negocioEsperado || ativo.status !== "selecionado"
    || ativo.negocio.id !== negocioEsperado) {
    return { ok: false, motivo: "negocio_nao_autorizado" };
  }

  const supabase = await createClient();
  // Cada coluna consumida pelo seletor está explícita: sem tipos gerados,
  // omitir uma coluna em select viraria undefined silencioso.
  const limite = MAXIMO_DE_FOTOS + 2;
  const { data, error } = await supabase.from("creatives")
    .select("id, business_id, uso, storage_path, created_at, arquivado_em, copy")
    .eq("business_id", ativo.negocio.id)
    .in("uso", ["logo", "identidade"])
    .is("arquivado_em", null)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error || !data) return { ok: false, motivo: "consulta_falhou" };
  if (data.length >= limite || data.some((linha) =>
    !linha || typeof linha.id !== "string" || !linha.id
    || linha.business_id !== ativo.negocio.id
    || (linha.uso !== "logo" && linha.uso !== "identidade")
    || typeof linha.storage_path !== "string"
    || !linha.storage_path.startsWith(`identidade/${ativo.negocio.id}/`)
    || typeof linha.created_at !== "string"
    || !Number.isFinite(Date.parse(linha.created_at))
    || !linha.copy || typeof linha.copy !== "object" || Array.isArray(linha.copy)
    || linha.arquivado_em !== null)) {
    return { ok: false, motivo: "resultado_incompleto" };
  }

  const negocio = await supabase.from("businesses")
    .select("id, onboarding").eq("id", ativo.negocio.id).maybeSingle();
  if (negocio.error) return { ok: false, motivo: "consulta_falhou" };
  if (!negocio.data || negocio.data.id !== ativo.negocio.id
    || !("onboarding" in negocio.data))
    return { ok: false, motivo: "resultado_incompleto" };

  const marca = lerMarca(negocio.data.onboarding);
  // Uma lista parcialmente inválida não pode virar paleta "confirmada".
  const coresBrutas = negocio.data.onboarding && typeof negocio.data.onboarding === "object"
    && !Array.isArray(negocio.data.onboarding)
    ? (negocio.data.onboarding as Record<string, unknown>).marca : null;
  const coresDaFonte = coresBrutas && typeof coresBrutas === "object" && !Array.isArray(coresBrutas)
    ? (coresBrutas as Record<string, unknown>).coresConfirmadas : null;
  const coresConfirmadas: CampoDoContexto | null = marca && !marca.aparenciaNaoSei
    && Number.isFinite(Date.parse(marca.em)) && Array.isArray(coresDaFonte)
    && coresDaFonte.length > 0 && coresDaFonte.length <= 6
    && coresDaFonte.every((cor, indice) => cor === marca.coresConfirmadas[indice])
    ? { valor: marca.coresConfirmadas.join(", "), origem: "onboarding.marca.coresConfirmadas",
      registradoEm: marca.em, estado: "confirmado_cliente" }
    : null;

  return { ok: true, businessId: ativo.negocio.id, linhas: data as LinhaDeMarca[], coresConfirmadas };
}
