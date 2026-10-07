import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Fail closed: só legado, operador marcado no app_metadata ou compra aprovada. */
export async function temAcessoWebApp(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  if (user.app_metadata?.papel === "operador") return true;

  const legado = await supabase
    .from("webapp_legacy_access")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (legado.error) return false;
  if (legado.data) return true;

  if (!user.email_confirmed_at) return false;
  const pedidos = await supabase
    .from("commercial_orders")
    .select("business_id")
    .eq("buyer_profile_id", user.id)
    .eq("status", "payment_approved")
    .not("business_id", "is", null);
  if (pedidos.error || !pedidos.data?.length) return false;
  const ids = pedidos.data.map((pedido) => pedido.business_id).filter(Boolean);
  const negocio = await supabase
    .from("businesses")
    .select("id")
    .in("id", ids)
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  return !negocio.error && !!negocio.data;
}
