import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { acessoContratadoAtivo, ID_ACESSO_CONTRATADO } from "./acesso-contratado";
import type { User } from "@supabase/supabase-js";

/** Explicit invitation only. This permits signup, never ownership/access before verified acceptance. */
export async function permiteCadastroContratado(admin: SupabaseClient, id: string, email: string, documento: string) {
  if (!acessoContratadoAtivo() || !ID_ACESSO_CONTRATADO.test(id)) return false;
  const {data:g,error} = await admin.from("historical_contract_access")
    .select("id, business_id, recipient_email, contractor_document, accepted_by, revoked_at, accept_before")
    .eq("id",id).maybeSingle();
  if (error || !g || g.recipient_email !== email || g.contractor_document !== documento
    || g.accepted_by || g.revoked_at || !(Date.parse(g.accept_before) > Date.now())) return false;
  const b = await admin.from("businesses").select("id, profile_id, claim_email").eq("id",g.business_id).maybeSingle();
  return !b.error && !!b.data && b.data.claim_email === null && b.data.profile_id === null;
}

/** Details only after verified recipient matches the explicit grant. */
export async function resumoAcessoContratado(admin: SupabaseClient, id: string, user: User) {
  if (!acessoContratadoAtivo() || !user.email_confirmed_at || !user.email || !ID_ACESSO_CONTRATADO.test(id)) return null;
  const {data:g,error} = await admin.from("historical_contract_access")
    .select("id, business_id, recipient_email, contractor_document, revoked_at, accepted_by, accept_before")
    .eq("id",id).maybeSingle();
  if (error || !g || g.recipient_email !== user.email.trim().toLowerCase() || g.revoked_at
    || (g.accepted_by && g.accepted_by !== user.id)
    || (!g.accepted_by && !(Date.parse(g.accept_before) > Date.now()))) return null;
  const b = await admin.from("businesses").select("id, name, profile_id, claim_email").eq("id",g.business_id).maybeSingle();
  if (b.error || !b.data || b.data.claim_email !== null || (b.data.profile_id && b.data.profile_id !== user.id)) return null;
  return {businessId:g.business_id, nome:b.data.name, documento:g.contractor_document};
}
