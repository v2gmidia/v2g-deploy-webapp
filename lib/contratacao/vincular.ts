import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/** Vincula compras aprovadas pelo e-mail verificado; falha mantém acesso fechado. */
export async function vincularComprasAprovadas(user: User): Promise<void> {
  if (!user.email || !user.email_confirmed_at) return;
  try {
    const admin = createAdminClient();
    const email = user.email.trim().toLowerCase();
    const { data: pedidos, error: erroPedidos } = await admin.from("commercial_orders")
      .select("id, business_id")
      .eq("buyer_email", email)
      .eq("status", "payment_approved")
      .not("business_id", "is", null);
    if (erroPedidos || !pedidos?.length) return;
    const businessIds = [...new Set(pedidos.map((pedido) => pedido.business_id).filter(Boolean))];
    const { error: erroNegocios } = await admin.from("businesses")
      .update({ profile_id: user.id, claim_email: null })
      .in("id", businessIds)
      .eq("claim_email", email)
      .is("profile_id", null);
    if (erroNegocios) return;
    await admin.from("commercial_orders")
      .update({ buyer_profile_id: user.id })
      .in("id", pedidos.map((pedido) => pedido.id))
      .is("buyer_profile_id", null);
  } catch {
    // A trava de acesso consulta o pedido vinculado e continua fechada.
  }
}
