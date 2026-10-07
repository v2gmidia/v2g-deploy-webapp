export type PedidoDaCampanha = { id: string; status: string };
export type ContratoDaCampanha = { order_id: string; status: string };

/** Cada conta usa o próprio pedido; uma compra adicional pendente não trava a anterior. */
export function pedidosAptosParaCampanha(
  pedidos: PedidoDaCampanha[],
  contratos: ContratoDaCampanha[],
): PedidoDaCampanha[] {
  const assinados = new Set(contratos.filter((contrato) => contrato.status === "signed")
    .map((contrato) => contrato.order_id));
  return pedidos.filter((pedido) => pedido.status === "payment_approved" && assinados.has(pedido.id));
}

/** A campanha nova só pode usar uma conta vinculada a uma unidade aprovada. */
export function bloqueioContaContratada(
  idContaDaCampanha: string | null,
  contasContratadas: { external_id: string }[],
): string | null {
  if (!idContaDaCampanha) return "A campanha não informa a conta de anúncio usada.";
  return contasContratadas.some((conta) => conta.external_id === idContaDaCampanha)
    ? null
    : "A conta de anúncio desta campanha não está vinculada a uma unidade contratada.";
}

/** Retorna o motivo para bloquear a ativação de uma compra nova. */
export function bloqueioContratualDaCampanha(
  pedidos: PedidoDaCampanha[],
  contratos: ContratoDaCampanha[],
  negocioCriadoEm: string,
  marcoLegadoEm: string | null,
): string | null {
  const ativos = pedidos.filter((pedido) => pedido.status !== "cancelled");
  if (ativos.length === 0) {
    const criadoEm = Date.parse(negocioCriadoEm);
    const legadoEm = marcoLegadoEm ? Date.parse(marcoLegadoEm) : NaN;
    if (!Number.isFinite(criadoEm) || !Number.isFinite(legadoEm)) {
      return "Não consegui confirmar se este negócio já era atendido antes da contratação nova.";
    }
    return criadoEm <= legadoEm ? null : "Este negócio novo ainda não tem pedido aprovado e contrato assinado.";
  }
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
