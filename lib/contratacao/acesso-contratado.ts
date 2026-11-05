import type { SupabaseClient, User } from "@supabase/supabase-js";
import { lerTodasPaginas } from "../multiconta/paginacao.ts";

export const ID_ACESSO_CONTRATADO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function acessoContratadoAtivo() {
  return process.env.V2G_HISTORICAL_ACCESS_ENABLED === "true";
}
export function idDoRetornoContratado(next: string): string | null {
  const id = next.match(/^\/acesso-contratado\/([^/?#]+)$/)?.[1];
  return id && ID_ACESSO_CONTRATADO.test(id) ? id : null;
}
export type AcessoContratado = {
  id: string; business_id: string; recipient_email: string; contractor_document: string;
  accepted_by: string | null; accepted_at: string | null; revoked_at: string | null;
};
/** Only own, accepted, unrevoked grants. Missing migration/read failure denies this path. */
export async function acessosContratadosDoPerfil(s: SupabaseClient, user: Pick<User,"id"|"email"|"email_confirmed_at">): Promise<AcessoContratado[]> {
  if (!acessoContratadoAtivo() || !user.email_confirmed_at || !user.email) return [];
  try {
    return await lerTodasPaginas<AcessoContratado>((start,end) => s.from("historical_contract_access")
      .select("id, business_id, recipient_email, contractor_document, accepted_by, accepted_at, revoked_at")
      .eq("accepted_by",user.id).eq("recipient_email",user.email!.trim().toLowerCase())
      .is("revoked_at",null).not("accepted_at","is",null)
      .order("id",{ascending:true}).range(start,end)) ?? [];
  } catch { return []; }
}
