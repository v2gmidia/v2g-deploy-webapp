import "server-only";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { ramoCompativelComBarbearia } from "./catalogo-barbearia";

/** Ramo livre do onboarding é apenas uma porta conservadora deste piloto. */
export async function catalogoBarbeariaDisponivel(businessId: string): Promise<boolean> {
  if (process.env.V2G_CREATIVE_REFERENCE_PILOT_ENABLED !== "true") return false;
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado" || ativo.negocio.id !== businessId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses").select("id, niche")
    .eq("id", businessId).maybeSingle();
  return !error && data?.id === businessId && ramoCompativelComBarbearia(data.niche);
}
