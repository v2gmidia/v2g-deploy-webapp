export type PagamentoConfirmado = {
  eventoId: string;
  tipo: "PAYMENT_CONFIRMED" | "PAYMENT_RECEIVED";
  cobrancaId: string;
  clienteId: string;
  assinaturaId: string | null;
  referencia: string | null;
  forma: "PIX" | "CREDIT_CARD";
  totalCentavos: number;
  vencimento: string | null;
};

function registro(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}

export function lerPagamentoConfirmado(payload: unknown): PagamentoConfirmado | null {
  const evento = registro(payload);
  const pagamento = evento && registro(evento.payment);
  if (!evento || !pagamento
      || (evento.event !== "PAYMENT_CONFIRMED" && evento.event !== "PAYMENT_RECEIVED")
      || (evento.event === "PAYMENT_CONFIRMED" && pagamento.status !== "CONFIRMED")
      || (evento.event === "PAYMENT_RECEIVED" && pagamento.status !== "RECEIVED")
      || typeof evento.id !== "string" || evento.id.length < 5
      || typeof pagamento.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(pagamento.id)
      || typeof pagamento.customer !== "string" || !/^cus_[A-Za-z0-9]+$/.test(pagamento.customer)
      || (pagamento.billingType !== "PIX" && pagamento.billingType !== "CREDIT_CARD")
      || typeof pagamento.value !== "number" || !Number.isFinite(pagamento.value)) return null;
  const totalCentavos = Math.round(pagamento.value * 100);
  if (totalCentavos < 1 || Math.abs(pagamento.value * 100 - totalCentavos) > 0.00001)
    return null;
  const assinaturaId = pagamento.subscription === null || pagamento.subscription === undefined
    ? null : pagamento.subscription;
  if (assinaturaId !== null && (typeof assinaturaId !== "string"
      || !/^sub_[A-Za-z0-9]+$/.test(assinaturaId))) return null;
  const vencimento = pagamento.dueDate === undefined || pagamento.dueDate === null
    ? null : pagamento.dueDate;
  if (vencimento !== null && (typeof vencimento !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(vencimento))) return null;
  if (assinaturaId !== null && vencimento === null) return null;
  return {
    eventoId: evento.id, tipo: evento.event,
    cobrancaId: pagamento.id, clienteId: pagamento.customer,
    assinaturaId, referencia: typeof pagamento.externalReference === "string"
      ? pagamento.externalReference : null,
    forma: pagamento.billingType, totalCentavos, vencimento,
  };
}
