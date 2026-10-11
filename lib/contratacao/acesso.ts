import type { SupabaseClient, User } from "@supabase/supabase-js";
import { lerTodasPaginas } from "../multiconta/paginacao.ts";

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
  const pedidos = await lerTodasPaginas((inicio, fim) => supabase
    .from("commercial_orders")
    .select("business_id")
    .eq("buyer_profile_id", user.id)
    .eq("buyer_email", user.email?.trim().toLowerCase() ?? "")
    .eq("status", "payment_approved")
    .not("business_id", "is", null)
    .order("id", { ascending: true })
    .range(inicio, fim));
  if (!pedidos?.length) return false;
  const ids = [...new Set(pedidos.map((pedido) => pedido.business_id).filter(Boolean))];
  for (let inicio = 0; inicio < ids.length; inicio += 100) {
    const negocio = await supabase
      .from("businesses")
      .select("id")
      .in("id", ids.slice(inicio, inicio + 100))
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();
    if (negocio.error) return false;
    if (negocio.data) return true;
  }
  return false;
}
