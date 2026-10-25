import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenciaManual } from "./evidencia-manual";

export async function carteiraDaEvidencia(admin: SupabaseClient, businessId: string, operatorId: string) {
  const r=await admin.from("manager_accounts").select("business_id, operator_profile_id")
    .eq("business_id",businessId).eq("operator_profile_id",operatorId).maybeSingle();
  return !r.error && r.data?.business_id===businessId && r.data.operator_profile_id===operatorId;
}

/** Perfil, quando indicado, precisa ser o ID autenticavel com e-mail confirmado.
 * Sem perfil, registra apenas a proposta documental para cliente ainda sem conta. */
export async function identidadeDaEvidenciaConfere(admin: SupabaseClient, d: Pick<EvidenciaManual,
  "business_id"|"order_id"|"proposed_profile_id"|"claimed_email"|"claimed_cnpj">) {
  const r=await admin.from("businesses").select("id, profile_id, claim_email").eq("id",d.business_id).maybeSingle();
  const b=r.data;
  if (r.error || !b || b.id!==d.business_id || (b.profile_id && b.profile_id!==d.proposed_profile_id)
    || (b.claim_email && b.claim_email.trim().toLowerCase()!==d.claimed_email)) return false;
  if (d.proposed_profile_id) {
    const u=await admin.auth.admin.getUserById(d.proposed_profile_id);
    if (u.error || u.data.user?.id!==d.proposed_profile_id || !u.data.user.email_confirmed_at
      || u.data.user.email?.trim().toLowerCase()!==d.claimed_email) return false;
  }
  if (d.order_id) {
    const o=await admin.from("commercial_orders").select("id, business_id, buyer_email, cnpj, buyer_profile_id")
      .eq("id",d.order_id).eq("business_id",d.business_id).maybeSingle();
    if (o.error || !o.data || o.data.id!==d.order_id || o.data.business_id!==d.business_id
      || o.data.buyer_email!==d.claimed_email || o.data.cnpj!==d.claimed_cnpj
      || (o.data.buyer_profile_id && o.data.buyer_profile_id!==d.proposed_profile_id)) return false;
  }
  return true;
}
