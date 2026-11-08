import type { SupabaseClient } from "@supabase/supabase-js";

export type AcessoPilotoQa = {
  business_id: string;
  profile_id: string;
  ad_account_external_id: string;
  meta_page_id: string;
  expires_at: string;
  revoked_at: string | null;
};

const HOST_QA = "zskpijnqgkqwxksqmzmf.supabase.co";

/** Duas travas: a flag sozinha nunca habilita o piloto em outro banco. */
export function pilotoQaHabilitado(config: {
  flag?: string;
  supabaseUrl?: string;
} = {
  flag: process.env.V2G_QA_PILOT_ACCESS_ENABLED,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
}): boolean {
  if (config.flag !== "true" || !config.supabaseUrl) return false;
  try {
    const url = new URL(config.supabaseUrl);
    return url.protocol === "https:" && url.hostname === HOST_QA;
  } catch {
    return false;
  }
}

/** Só o servidor lê os grants; cliente e operador não recebem escrita direta. */
export async function acessosPilotoQa(
  admin: SupabaseClient,
  profileId: string,
  businessIds: string[],
): Promise<AcessoPilotoQa[]> {
  if (!pilotoQaHabilitado() || businessIds.length === 0) return [];
  const { data, error } = await admin.from("qa_pilot_access")
    .select("business_id, profile_id, ad_account_external_id, meta_page_id, expires_at, revoked_at")
    .eq("profile_id", profileId)
    .in("business_id", businessIds)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1000);
  if (error) {
    console.error("[piloto-qa] concessões indisponíveis");
    return [];
  }
  return data ?? [];
}
