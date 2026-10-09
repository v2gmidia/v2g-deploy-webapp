import assert from "node:assert/strict";
import { test } from "node:test";
import { lerPagamentoConfirmado } from "../lib/contratacao/pagamento-evento.ts";
import { validarDadosCartao } from "../lib/contratacao/dados-cartao.ts";
import { urlCheckoutHospedadoSandbox } from "../lib/contratacao/url-checkout.ts";
import { cartaoRecusadoSemCobranca, MAX_TENTATIVAS_CARTAO } from "../lib/contratacao/retentativa-cartao.ts";

const eventoPix = { id: "evt_teste_0001", event: "PAYMENT_RECEIVED", payment: {
  id: "pay_teste001", customer: "cus_teste001", subscription: null,
  externalReference: "dcf4dff9-b080-425c-b234-765f2ffac0ae",
  billingType: "PIX", status: "RECEIVED", value: 5, dueDate: "2026-10-08",
} };

test("somente pagamento confirmado com valor monetario exato vira candidato", () => {
  assert.equal(lerPagamentoConfirmado(eventoPix)?.totalCentavos, 500);
  assert.equal(lerPagamentoConfirmado({ ...eventoPix, event: "PAYMENT_CREATED" }), null);
  assert.equal(lerPagamentoConfirmado({ ...eventoPix, payment: { ...eventoPix.payment, status: "PENDING" } }), null);
  assert.equal(lerPagamentoConfirmado({ ...eventoPix, payment: { ...eventoPix.payment, value: 5.001 } }), null);
  assert.equal(lerPagamentoConfirmado({ ...eventoPix, payment: { ...eventoPix.payment, id: "outro" } }), null);
});

test("assinatura de cartao preserva o vinculo de origem", () => {
  const cartao = { ...eventoPix, event: "PAYMENT_CONFIRMED", payment: {
    ...eventoPix.payment, subscription: "sub_teste001",
    billingType: "CREDIT_CARD", status: "CONFIRMED",
  } };
  assert.equal(lerPagamentoConfirmado(cartao)?.assinaturaId, "sub_teste001");
  assert.equal(lerPagamentoConfirmado(cartao)?.vencimento, "2026-10-08");
  assert.equal(lerPagamentoConfirmado({ ...cartao, payment: { ...cartao.payment, status: "RECEIVED" } }), null);
  assert.equal(lerPagamentoConfirmado({ ...cartao, payment: { ...cartao.payment, subscription: "outra" } }), null);
  assert.equal(lerPagamentoConfirmado({ ...cartao, payment: { ...cartao.payment, dueDate: null } }), null);
});

test("formulario do cartao rejeita documento e validade invalidos antes da API", () => {
  const form = new FormData();
  const dados = { holderName: "Cliente Exemplo", holderDocument: "12345678909",
    cardNumber: "4111111111111111", expiryMonth: "12", expiryYear: "2030",
    ccv: "123", postalCode: "01001000", addressNumber: "10" };
  for (const [campo, valor] of Object.entries(dados)) form.set(campo, valor);
  assert.ok(validarDadosCartao(form).dados);
  form.set("holderDocument", "00000000000");
  assert.equal(validarDadosCartao(form).dados, undefined);
  form.set("holderDocument", dados.holderDocument);
  form.set("expiryMonth", "13");
  assert.equal(validarDadosCartao(form).dados, undefined);
});

test("pedido antigo so retoma no checkout hospedado do Sandbox", () => {
  assert.equal(urlCheckoutHospedadoSandbox("https://sandbox.asaas.com/checkout/abc"),
    "https://sandbox.asaas.com/checkout/abc");
  assert.equal(urlCheckoutHospedadoSandbox("https://sandbox.asaas.com.evil.test/checkout"), null);
  assert.equal(urlCheckoutHospedadoSandbox("http://sandbox.asaas.com/checkout"), null);
});

test("nova tentativa so segue recusa explicita sem cobranca persistida", () => {
  assert.equal(cartaoRecusadoSemCobranca(400, "invalid_creditCard"), true);
  assert.equal(cartaoRecusadoSemCobranca(400, "invalid_action",
    "Transação não autorizada. Verifique os dados do cartão de crédito e tente novamente."), true);
  assert.equal(cartaoRecusadoSemCobranca(400, "invalid_action", "Ação inválida."), false);
  assert.equal(cartaoRecusadoSemCobranca(400, "outro_codigo"), false);
  assert.equal(cartaoRecusadoSemCobranca(0, null), false);
  assert.equal(cartaoRecusadoSemCobranca(500, null), false);
  assert.equal(MAX_TENTATIVAS_CARTAO, 3);
});
