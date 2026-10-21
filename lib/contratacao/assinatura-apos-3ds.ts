import { vencimentoNoMesSeguinte } from "./fluxo-cartao-mensal.ts";

export type PedidoParaAssinatura3ds = {
  id: string; status: string; total_cents: number;
  provider_card_flow: string; provider_charge_id: string | null;
  provider_customer_id: string | null; provider_first_due_date: string | null;
  provider_subscription_id: string | null;
  subscription_creation_started_at: string | null;
  provider_subscription_first_due_date: string | null;
};
type Registro = Record<string, unknown>;
export type DependenciasAssinatura3ds = {
  lerCobranca: (id: string) => Promise<Registro | null>;
  lerIpPagador: () => Promise<string | null>;
  buscarAssinaturas: (orderId: string) => Promise<Registro[] | null>;
  semOcorrencias: () => Promise<boolean>;
  reservar: (vencimento: string) => Promise<boolean>;
  criar: (corpo: Registro) => Promise<Registro | null>;
  salvar: (id: string, vencimento: string) => Promise<boolean>;
};

/** Executa no servidor depois de confirmação reconciliada. Não persiste tokens.
 * Reserva atômica antes do POST. Reenvio/timeout só consulta, nunca repete criação.
 */
export async function garantirAssinaturaApos3ds(pedido: PedidoParaAssinatura3ds,
  deps: DependenciasAssinatura3ds, hoje: string): Promise<boolean> {
  if (pedido.provider_card_flow !== "initial_3ds" || pedido.status !== "payment_approved"
      || !pedido.provider_charge_id || !pedido.provider_customer_id || !pedido.provider_first_due_date)
    return false;
  const vencimento = vencimentoNoMesSeguinte(pedido.provider_first_due_date);
  if (pedido.provider_subscription_id)
    return pedido.provider_subscription_first_due_date === vencimento;
  if (vencimento <= hoje || !await deps.semOcorrencias()) return false;
  const payment = await deps.lerCobranca(pedido.provider_charge_id);
  if (!payment || payment.id !== pedido.provider_charge_id || payment.customer !== pedido.provider_customer_id
      || payment.externalReference !== pedido.id || payment.billingType !== "CREDIT_CARD"
      || payment.status !== "CONFIRMED" || payment.deleted === true
      || payment.value !== pedido.total_cents / 100 || payment.dueDate !== pedido.provider_first_due_date
      || payment.subscription != null) return false;
  const valida = (sub: Registro) => typeof sub.id === "string" && /^sub_[A-Za-z0-9]+$/.test(sub.id)
    && sub.customer === pedido.provider_customer_id && sub.externalReference === pedido.id
    && sub.billingType === "CREDIT_CARD" && sub.cycle === "MONTHLY"
    && sub.value === pedido.total_cents / 100 && sub.nextDueDate === vencimento
    && sub.deleted !== true && sub.status === "ACTIVE";
  if (pedido.subscription_creation_started_at) {
    const existentes = await deps.buscarAssinaturas(pedido.id);
    if (!existentes || existentes.length !== 1 || !valida(existentes[0]!)) return false;
    return deps.salvar(existentes[0]!.id as string, vencimento);
  }
  const card = payment.creditCard && typeof payment.creditCard === "object"
    ? payment.creditCard as Registro : null;
  const token = card?.creditCardToken;
  if (typeof token !== "string" || token.length < 10 || token.length > 500) return false;
  const remoteIp = await deps.lerIpPagador();
  if (!remoteIp) return false;
  if (!await deps.reservar(vencimento)) return false;
  const subscription = await deps.criar({ customer: pedido.provider_customer_id,
    billingType: "CREDIT_CARD", cycle: "MONTHLY", nextDueDate: vencimento,
    value: pedido.total_cents / 100, externalReference: pedido.id,
    description: "Gestão de anúncios V2G", creditCardToken: token, remoteIp });
  if (!subscription || !valida(subscription)) return false;
  return deps.salvar(subscription.id as string, vencimento);
}
