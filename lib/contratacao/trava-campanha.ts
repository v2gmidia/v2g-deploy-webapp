export type PedidoDaCampanha = { id: string; status: string };
export type ContratoDaCampanha = { order_id: string; status: string };

/** Retorna o motivo para bloquear a ativação de uma compra nova. */
export function bloqueioContratualDaCampanha(
  pedidos: PedidoDaCampanha[],
  contratos: ContratoDaCampanha[],
): string | null {
  const ativos = pedidos.filter((pedido) => pedido.status !== "cancelled");
  if (ativos.length === 0) return null; // clientes anteriores à contratação nova
  if (ativos.some((pedido) => pedido.status !== "payment_approved")) {
    return "Existe um pedido desta empresa sem pagamento aprovado.";
  }
  const assinados = new Set(
    contratos.filter((contrato) => contrato.status === "signed")
      .map((contrato) => contrato.order_id),
  );
  if (ativos.some((pedido) => !assinados.has(pedido.id))) {
    return "O contrato desta empresa ainda não foi assinado por todas as partes.";
  }
  return null;
}
