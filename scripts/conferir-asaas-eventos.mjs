import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizarEventoAsaas } from "../lib/contratacao/asaas-eventos.ts";

const pedido = { cobrancaId: "pay-1", clienteId: "cus-1", valorCentavos: 50_000 };
const pagamento = {
  id: "evt-1", event: "PAYMENT_RECEIVED",
  payment: { id: "pay-1", customer: "cus-1", value: 500, status: "RECEIVED" },
};

test("recebimento exige cobrança, cliente, valor e status vinculados", () => {
  assert.deepEqual(normalizarEventoAsaas(pagamento, pedido), {
    tipo: "pagamento_recebido", eventoId: "evt-1", cobrancaId: "pay-1",
  });
  assert.equal(normalizarEventoAsaas({ ...pagamento, payment: { ...pagamento.payment, value: 499 } }, pedido).tipo, "revisar");
  assert.equal(normalizarEventoAsaas({ ...pagamento, payment: { ...pagamento.payment, id: "pay-outro" } }, pedido).tipo, "revisar");
  assert.equal(normalizarEventoAsaas({ ...pagamento, payment: { ...pagamento.payment, status: "PENDING" } }, pedido).tipo, "revisar");
});

test("confirmação sem saldo disponível e payload inválido não liberam", () => {
  assert.equal(normalizarEventoAsaas({ ...pagamento, event: "PAYMENT_CONFIRMED" }, pedido).tipo, "ignorar");
  assert.equal(normalizarEventoAsaas(null, pedido).tipo, "revisar");
});

test("nota exige autorização e vínculo com cobrança e cliente", () => {
  const nota = {
    id: "evt-nf-1", event: "INVOICE_AUTHORIZED",
    invoice: { id: "inv-1", status: "AUTHORIZED", payment: "pay-1", customer: "cus-1" },
  };
  assert.deepEqual(normalizarEventoAsaas(nota, pedido), {
    tipo: "nota_autorizada", eventoId: "evt-nf-1", notaId: "inv-1",
  });
  assert.equal(normalizarEventoAsaas({ ...nota, invoice: { ...nota.invoice, status: "SCHEDULED" } }, pedido).tipo, "revisar");
  assert.equal(normalizarEventoAsaas({ ...nota, invoice: { ...nota.invoice, payment: "pay-outro" } }, pedido).tipo, "revisar");
});
