/** Normalização local; só chamar após validar o token do webhook Asaas. */
export type VinculoAsaas = {
  cobrancaId: string;
  clienteId: string;
  valorCentavos: number;
};

export type ResultadoAsaas =
  | { tipo: "pagamento_recebido"; eventoId: string; cobrancaId: string }
  | { tipo: "nota_autorizada"; eventoId: string; notaId: string }
  | { tipo: "ignorar" | "revisar"; motivo: string };

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function centavos(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) return null;
  const resultado = Math.round(valor * 100);
  return Number.isSafeInteger(resultado) && Math.abs(resultado / 100 - valor) < 0.00001
    ? resultado : null;
}

/**
 * Só `PAYMENT_RECEIVED` libera o pedido nesta primeira integração.
 * `PAYMENT_CONFIRMED` informa pagamento efetuado, mas saldo ainda indisponível;
 * sua consequência comercial segue pendente. Outros eventos vão para triagem.
 */
export function normalizarEventoAsaas(
  payload: unknown,
  esperado: VinculoAsaas,
): ResultadoAsaas {
  const evento = objeto(payload);
  if (!evento) return { tipo: "revisar", motivo: "payload_invalido" };
  const eventoId = texto(evento.id);
  const tipo = texto(evento.event);
  if (!eventoId || !tipo) return { tipo: "revisar", motivo: "identificacao_ausente" };

  if (tipo === "PAYMENT_RECEIVED") {
    const pagamento = objeto(evento.payment);
    if (!pagamento || texto(pagamento.id) !== esperado.cobrancaId
      || texto(pagamento.customer) !== esperado.clienteId
      || centavos(pagamento.value) !== esperado.valorCentavos
      || pagamento.status !== "RECEIVED") {
      return { tipo: "revisar", motivo: "cobranca_divergente" };
    }
    return { tipo: "pagamento_recebido", eventoId, cobrancaId: esperado.cobrancaId };
  }

  if (tipo === "INVOICE_AUTHORIZED") {
    const nota = objeto(evento.invoice);
    const notaId = nota && texto(nota.id);
    if (!notaId || nota?.status !== "AUTHORIZED"
      || texto(nota.payment) !== esperado.cobrancaId
      || texto(nota.customer) !== esperado.clienteId) {
      return { tipo: "revisar", motivo: "nota_divergente" };
    }
    return { tipo: "nota_autorizada", eventoId, notaId };
  }

  return { tipo: "ignorar", motivo: "evento_sem_liberacao" };
}
