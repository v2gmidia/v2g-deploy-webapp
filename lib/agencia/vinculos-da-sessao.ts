import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { conferirVinculos, COLUNAS_VINCULO, type VinculoAnunciante } from "./vinculos";

export type LeituraDeVinculos = { estado: "pronto"; vinculos: VinculoAnunciante[] }
  | { estado: "nao_instalado" | "indisponivel" };

/** Chamador valida Auth antes. A consulta continua sob RLS do mesmo usuário. */
export async function lerVinculosDaSessao(supabase: SupabaseClient, perfilId: string): Promise<LeituraDeVinculos> {
  try {
    const r = await supabase.from("agency_advertisers").select(COLUNAS_VINCULO)
      .eq("owner_profile_id", perfilId).is("revoked_at", null)
      .order("advertiser_business_id").limit(501);
    // Compatibilidade deliberada enquanto este pacote ainda não foi aplicado.
    if (r.error?.code === "PGRST205" || r.error?.code === "42P01") return { estado: "nao_instalado" };
    if (r.error) return { estado: "indisponivel" };
    const vinculos = conferirVinculos(r.data, perfilId);
    return vinculos ? { estado: "pronto", vinculos } : { estado: "indisponivel" };
  } catch { return { estado: "indisponivel" }; }
}
