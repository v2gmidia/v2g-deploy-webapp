export type PedidoDaFila = {
  id: string;
  buyer_email: string;
  legal_name: string;
  cnpj: string;
  origin: string;
  payment_method: string;
  billing_period: string;
  unit_count: number;
  total_cents: number;
  status: string;
  business_id: string | null;
  buyer_profile_id: string | null;
  provider_charge_id?: string | null;
  provider_subscription_id?: string | null;
  payment_creation_started_at?: string | null;
  created_at: string;
};

export function situacaoDaCompra(pedido: PedidoDaFila): string {
  if (pedido.status === "payment_approved") return pedido.origin === "self_service"
    ? "Pagamento confirmado pelo provedor" : "Pedido aprovado pela equipe";
  if (pedido.status === "proof_received") return "Comprovante recebido; aprovação pendente";
  if (pedido.status === "cancelled") return "Pedido cancelado";
  if (pedido.status !== "awaiting_payment") return "Estado não reconhecido; conferir registro";
  if (pedido.origin === "assisted") return "Aguardando comprovante";
  if (pedido.payment_creation_started_at && !pedido.provider_charge_id && !pedido.provider_subscription_id)
    return "Tentativa de pagamento a conciliar";
  return "Aguardando confirmação do pagamento";
}

export function periodoDaCompra(periodo: string): string {
  if (periodo === "annual_upfront") return "Anual à vista";
  if (periodo === "semiannual_upfront") return "Semestral à vista";
  if (periodo === "monthly") return "Mensal";
  return "Período a conferir";
}

export type FiltroDeCompras = "todas" | "atencao" | "pagamento" | "aprovadas" | "canceladas";

export function prioridadeDaCompra(pedido: PedidoDaFila): number {
  if (pedido.status === "proof_received") return 0;
  if (pedido.status === "awaiting_payment" && pedido.payment_creation_started_at
      && !pedido.provider_charge_id && !pedido.provider_subscription_id) return 1;
  if (pedido.status === "payment_approved" && !pedido.buyer_profile_id) return 2;
  if (pedido.status === "awaiting_payment") return 3;
  if (pedido.status === "payment_approved") return 4;
  if (pedido.status === "cancelled") return 6;
  return 1;
}

export function filtrarCompras(pedidos: PedidoDaFila[], busca: string, filtro: FiltroDeCompras): PedidoDaFila[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  return pedidos.filter((pedido) => {
    const corresponde = !termo || [pedido.legal_name, pedido.buyer_email, pedido.cnpj, pedido.id]
      .some((campo) => campo.toLocaleLowerCase("pt-BR").includes(termo));
    if (!corresponde) return false;
    const prioridade = prioridadeDaCompra(pedido);
    if (filtro === "atencao") return prioridade <= 2;
    if (filtro === "pagamento") return pedido.status === "awaiting_payment" || pedido.status === "proof_received";
    if (filtro === "aprovadas") return pedido.status === "payment_approved";
    if (filtro === "canceladas") return pedido.status === "cancelled";
    return true;
  }).sort((a, b) => prioridadeDaCompra(a) - prioridadeDaCompra(b)
    || b.created_at.localeCompare(a.created_at));
}
