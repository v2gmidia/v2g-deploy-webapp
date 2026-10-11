export const EVENTOS_FINANCEIROS = [
  "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_OVERDUE",
  "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
] as const;

export type EventoFinanceiro = {
  eventoId: string;
  tipo: typeof EVENTOS_FINANCEIROS[number];
  cobrancaId: string;
  clienteId: string;
  assinaturaId: string | null;
  forma: "PIX" | "CREDIT_CARD";
  valorCentavos: number;
  vencimento: string;
};

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}

/** Eventos sem confirmação financeira são registrados, mas nunca abrem acesso. */
export function lerEventoFinanceiro(payload: unknown): EventoFinanceiro | null {
  const evento = objeto(payload);
  const pagamento = evento && objeto(evento.payment);
  if (!evento || !pagamento || !EVENTOS_FINANCEIROS.includes(evento.event as EventoFinanceiro["tipo"])
      || typeof evento.id !== "string" || evento.id.length < 5
      || typeof pagamento.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(pagamento.id)
      || typeof pagamento.customer !== "string" || !/^cus_[A-Za-z0-9]+$/.test(pagamento.customer)
      || (pagamento.billingType !== "PIX" && pagamento.billingType !== "CREDIT_CARD")
      || typeof pagamento.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(pagamento.dueDate)
      || typeof pagamento.value !== "number" || !Number.isFinite(pagamento.value)) return null;
  const valorCentavos = Math.round(pagamento.value * 100);
  if (!Number.isSafeInteger(valorCentavos) || valorCentavos < 1
      || Math.abs(pagamento.value * 100 - valorCentavos) > 0.00001) return null;
  const assinaturaId = pagamento.subscription ?? null;
  if (assinaturaId !== null && (typeof assinaturaId !== "string"
      || !/^sub_[A-Za-z0-9]+$/.test(assinaturaId))) return null;
  return {
    eventoId: evento.id, tipo: evento.event as EventoFinanceiro["tipo"],
    cobrancaId: pagamento.id, clienteId: pagamento.customer,
    assinaturaId, forma: pagamento.billingType, valorCentavos,
    vencimento: pagamento.dueDate,
  };
}
