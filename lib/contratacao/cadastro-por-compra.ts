import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerTodasPaginas } from "../multiconta/paginacao";
import { consultarEstadoPagamento } from "./consultar-estado-pagamento";
import { pedidoMantemDireito } from "./direito-por-pedido";

type PedidoCadastro = {
  id: string; business_id: string; status: string;
  payment_method: string; provider_charge_id: string | null;
};
/** Permits signup only; never claims a business or grants access to an existing account.
 * null = incomplete verification. Other independent purchases can still qualify.
 */
export async function permiteCadastroPorCompra(admin: SupabaseClient, email: string, documento: string): Promise<boolean | null> {
  const pedidos = await lerTodasPaginas<PedidoCadastro>((start,end) => admin.from("commercial_orders")
    .select("id, business_id, status, payment_method, provider_charge_id")
    .eq("buyer_email",email).eq("cnpj",documento).eq("status","payment_approved")
    .not("business_id","is",null).order("id",{ascending:true}).range(start,end));
  if (!pedidos) return null;
  let incompleto = false;
  for (const pedido of pedidos) {
    if (await pedidoMantemDireito(pedido, async p => {
      const estado = await consultarEstadoPagamento(admin,p);
      if (estado === "verification_unavailable") incompleto = true;
      return estado;
    })) return true;
  }
  return incompleto ? null : false;
}
