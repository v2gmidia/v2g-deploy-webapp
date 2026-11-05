import type { SupabaseClient, User } from "@supabase/supabase-js";
import { lerTodasPaginas } from "../multiconta/paginacao.ts";
import { acessosContratadosDoPerfil } from "./acesso-contratado.ts";
import { pedidosComDireito, type PedidoComPagamento } from "./direito-por-pedido.ts";
import { consultarEstadoPagamento } from "./consultar-estado-pagamento.ts";

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
  const concessoes = await acessosContratadosDoPerfil(supabase, user);
  for (const concessao of concessoes) {
    const negocio = await supabase.from("businesses").select("id")
      .eq("id", concessao.business_id).eq("profile_id", user.id).maybeSingle();
    if (!negocio.error && negocio.data) return true;
  }
  const pedidos = await lerTodasPaginas<PedidoComPagamento & {business_id:string}>((inicio, fim) => supabase
    .from("commercial_orders")
    .select("id, business_id, status, payment_method, provider_charge_id")
    .eq("buyer_profile_id", user.id)
    .eq("buyer_email", user.email?.trim().toLowerCase() ?? "")
    .eq("status", "payment_approved")
    .not("business_id", "is", null)
    .order("id", { ascending: true })
    .range(inicio, fim));
  if (!pedidos?.length) return false;
  // Ledger is service-only; candidate IDs came from this verified session under RLS.
  // Load administrative reader only for Asaas candidates; never change Auth/ownership here.
  let financeiro: SupabaseClient | undefined;
  const autorizados = await pedidosComDireito(pedidos, async pedido => {
    financeiro ??= (await import("../supabase/admin.ts")).createAdminClient();
    return consultarEstadoPagamento(financeiro,pedido);
  });
  const ids = [...new Set(autorizados.map((pedido) => pedido.business_id).filter(Boolean))];
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
