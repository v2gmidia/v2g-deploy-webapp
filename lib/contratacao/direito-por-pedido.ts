import type { EstadoPagamentoPublico } from "./estado-pagamento-publico.ts";

export type PedidoComPagamento = {
  id: string; status: string; payment_method: string; provider_charge_id: string | null;
};
export type ConsultaFinanceiraPedido = (pedido: PedidoComPagamento) => Promise<EstadoPagamentoPublico>;

/** One purchase is one source of rights. A denied/unreadable purchase cannot deny another one. */
export async function pedidoMantemDireito(pedido: PedidoComPagamento, consultar: ConsultaFinanceiraPedido): Promise<boolean> {
  if (pedido.status !== "payment_approved") return false;
  if (pedido.payment_method === "direct_pix") return true;
  if (!["asaas_pix", "asaas_card"].includes(pedido.payment_method)) return false;
  try { return await consultar(pedido) === "payment_approved"; }
  catch { return false; }
}

export async function pedidosComDireito<T extends PedidoComPagamento>(pedidos: T[], consultar: ConsultaFinanceiraPedido): Promise<T[]> {
  const autorizados: T[] = [];
  for (const pedido of pedidos) if (await pedidoMantemDireito(pedido,consultar)) autorizados.push(pedido);
  return autorizados;
}
