export type EstadoPagamentoPublico = "awaiting_payment" | "payment_approved" | "cancelled"
  | "refunded" | "partially_refunded" | "refund_in_progress" | "payment_review"
  | "verification_unavailable";

export const OCORRENCIAS_PUBLICAS = [
  "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_REFUND_IN_PROGRESS",
  "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED",
] as const;

/** Projeção de exibição, não autorização de acesso nem mutação do pedido.
 * Estorno concluído não pode regredir por reenvio tardio de uma confirmação.
 * O chamador consulta somente a cobrança inicial, nunca outro ciclo mensal.
 */
export function estadoPagamentoPublico(status: string, ocorrencias: readonly { event_type: string }[],
  consultaIntegra = true): EstadoPagamentoPublico {
  if (!consultaIntegra) return "verification_unavailable";
  const tipos = new Set(ocorrencias.map(evento => evento.event_type));
  if (tipos.has("PAYMENT_REFUNDED")) return "refunded";
  if (tipos.has("PAYMENT_PARTIALLY_REFUNDED")) return "partially_refunded";
  if (tipos.has("PAYMENT_REFUND_IN_PROGRESS")) return "refund_in_progress";
  if (tipos.size > 0) return "payment_review";
  if (status === "payment_approved" || status === "cancelled") return status;
  return "awaiting_payment";
}

export function ehEstadoPagamentoPublico(valor: unknown): valor is EstadoPagamentoPublico {
  return typeof valor === "string" && ["awaiting_payment", "payment_approved", "cancelled",
    "refunded", "partially_refunded", "refund_in_progress", "payment_review",
    "verification_unavailable"].includes(valor);
}

export function mensagemEstadoPagamento(estado: EstadoPagamentoPublico): string {
  switch (estado) {
    case "payment_approved": return "Pagamento confirmado pelo Asaas. Você já pode criar seu acesso.";
    case "cancelled": return "Este pedido foi cancelado. Fale com a V2G antes de tentar novamente.";
    case "refunded": return "O Asaas confirmou o estorno integral desta cobrança. Fale com a V2G para conferir a situação da contratação.";
    case "partially_refunded": return "O Asaas registrou um estorno parcial desta cobrança. Fale com a V2G para conferir os valores e a situação da contratação.";
    case "refund_in_progress": return "O estorno desta cobrança está em processamento no Asaas. Aguarde a confirmação antes de considerar a devolução concluída.";
    case "payment_review": return "Há uma ocorrência nesta cobrança que precisa de conferência. Fale com a V2G antes de tentar pagar novamente.";
    case "verification_unavailable": return "Não foi possível conferir a situação financeira agora. Atualize a página ou fale com a V2G antes de pagar novamente.";
    default: return "Aguardando confirmação do Asaas. Esta página acompanha o estado do pedido automaticamente.";
  }
}
