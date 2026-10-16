import assert from "node:assert/strict";
import { test } from "node:test";
import {
  avaliarFluxoCartaoMensal, vencimentoNoMesSeguinte,
} from "../lib/contratacao/fluxo-cartao-mensal.ts";

const base = {
  orderId: "pedido-1",
  primeiraCobrancaId: "pay_1",
  primeiroVencimentoCobranca: "2026-10-16",
  eventoPagamentoConfirmadoId: "evt_confirmado_1",
  tokenCartaoDisponivel: true,
  assinaturaId: null,
  primeiroVencimentoAssinatura: null,
};

test("cobra avulso antes de qualquer assinatura", () => {
  assert.deepEqual(avaliarFluxoCartaoMensal({ ...base, primeiraCobrancaId: null,
    eventoPagamentoConfirmadoId: null, tokenCartaoDisponivel: false }),
  { tipo: "criar_cobranca_avulsa_3ds" });
});

test("não cria assinatura antes do PAYMENT_CONFIRMED conciliado", () => {
  assert.deepEqual(avaliarFluxoCartaoMensal({ ...base, eventoPagamentoConfirmadoId: null }),
    { tipo: "aguardar_pagamento_confirmado" });
});

test("pagamento confirmado sem token não pede cartão nem inventa assinatura", () => {
  assert.deepEqual(avaliarFluxoCartaoMensal({ ...base, tokenCartaoDisponivel: false }),
    { tipo: "bloqueado_token_ausente" });
});

test("assinatura começa no mês seguinte com chave estável", () => {
  assert.deepEqual(avaliarFluxoCartaoMensal(base), {
    tipo: "criar_assinatura",
    primeiroVencimento: "2026-11-16",
    chaveIdempotencia: "pedido-1:assinatura-mensal",
  });
  assert.equal(vencimentoNoMesSeguinte("2027-01-31"), "2027-02-28");
  assert.equal(vencimentoNoMesSeguinte("2028-01-31"), "2028-02-29");
});

test("assinatura existente com vencimento divergente exige revisão", () => {
  assert.deepEqual(avaliarFluxoCartaoMensal({ ...base, assinaturaId: "sub_1",
    primeiroVencimentoAssinatura: "2026-10-16" }), {
    tipo: "revisar_vencimento_assinatura",
    primeiroVencimentoEsperado: "2026-11-16",
  });
  assert.deepEqual(avaliarFluxoCartaoMensal({ ...base, assinaturaId: "sub_1",
    primeiroVencimentoAssinatura: "2026-11-16" }), { tipo: "concluido" });
});

test("datas inválidas não viram vencimento", () => {
  assert.throws(() => vencimentoNoMesSeguinte("2026-02-30"), /inválido/);
});
