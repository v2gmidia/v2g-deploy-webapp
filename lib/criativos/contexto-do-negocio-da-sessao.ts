import "server-only";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { createClient } from "@/lib/supabase/server";
import { carregarMarcaDaSessao } from "./carregar-marca-da-sessao";
import { tipoFotoRegistrado } from "../identidade/tipo-foto";
import { contextoDoNegocio, type ContextoDoCriativo } from "./contexto-do-negocio";

/** SELECT sob sessão/RLS. Não retorna caminhos, bytes, URLs, consentimento ou documento bruto. */
export async function carregarContextoDoCriativo(negocioEsperado: string): Promise<ContextoDoCriativo | null> {
  const ativo = await negocioAtivoDaSessao();
  if (!negocioEsperado || ativo.status !== "selecionado" || ativo.negocio.id !== negocioEsperado) return null;
  const supa = await createClient();
  const { data: { user }, error: erroAuth } = await supa.auth.getUser();
  if (erroAuth || !user) return null;
  const { data, error } = await supa.from("businesses").select("id, profile_id, name, onboarding")
    .eq("id", negocioEsperado).eq("profile_id", user.id).maybeSingle();
  if (error || !data || data.id !== negocioEsperado || data.profile_id !== user.id
    || !("name" in data) || !("onboarding" in data)) return null;
  const marca = await carregarMarcaDaSessao(negocioEsperado);
  if (!marca.ok && marca.motivo === "negocio_nao_autorizado") return null;
  if (marca.ok && marca.businessId !== negocioEsperado) return null;
  const materiais = marca.ok ? {
    logos: marca.linhas.filter(l => l.uso === "logo").length,
    fotos: marca.linhas.filter(l => l.uso === "identidade" && tipoFotoRegistrado(l.copy)).length,
    semTipo: marca.linhas.filter(l => l.uso === "identidade" && !tipoFotoRegistrado(l.copy)).length,
  } : null;
  return contextoDoNegocio(data, marca.ok ? marca.coresConfirmadas : null, materiais);
}
