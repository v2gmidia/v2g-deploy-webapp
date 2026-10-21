import assert from "node:assert/strict";
import { test } from "node:test";
import { prepararAssinatura } from "../lib/contratacao/preparo-assinatura.ts";

const base = {
  orderId: "pedido-1", businessId: "negocio-1", paymentStatus: "payment_approved",
  buyerEmailVerified: true, templateVersion: "contrato-v2g-aprovado-v1",
  approvedTemplateVersion: "contrato-v2g-aprovado-v1", pdfSha256: "a".repeat(64),
  approvedPdfSha256: "a".repeat(64),
  providerConfigured: true, signerName: "Representante Teste",
  signerEmail: "representante@example.com", signerCapacity: "sócio administrador",
  signerPowersVerified: true,
};

test("pedido apto produz chave estável para um envelope por versão", () => {
  assert.deepEqual(prepararAssinatura(base), {
    pronto: true, chaveIdempotencia: "pedido-1:contrato-v2g-aprovado-v1",
  });
});

test("minuta interna nunca é liberada mesmo se configurada como aprovada", () => {
  const resultado = prepararAssinatura({ ...base, templateVersion: "minuta-interna-2026-10-09-v1",
    approvedTemplateVersion: "minuta-interna-2026-10-09-v1" });
  assert.equal(resultado.pronto, false);
  assert.ok(resultado.pendencias.includes("minuta_aprovada"));
});

test("identificador real da V2 de teste e suas variantes nunca liberam envio", () => {
  for (const templateVersion of ["teste-interno-2026-10-13-v2", " TESTE-INTERNO-2026-10-13-v2 ",
    "contrato-v2g-teste-2026-10-13-v2", "minuta-interna"]) {
    const resultado = prepararAssinatura({ ...base, templateVersion, approvedTemplateVersion: templateVersion });
    assert.equal(resultado.pronto, false);
    assert.ok(resultado.pendencias.includes("minuta_aprovada"));
  }
});

test("pedido pendente, e-mail não verificado e provedor ausente bloqueiam", () => {
  const resultado = prepararAssinatura({ ...base, paymentStatus: "awaiting_payment",
    buyerEmailVerified: false, providerConfigured: false });
  assert.deepEqual(resultado.pendencias, ["pagamento", "email_comprador", "provedor"]);
});

test("signatário incompleto ou sem poderes não passa", () => {
  const resultado = prepararAssinatura({ ...base, signerEmail: "invalido", signerPowersVerified: false });
  assert.deepEqual(resultado.pendencias, ["signatario", "poderes_representacao"]);
});

test("PDF sem SHA-256 válido bloqueia o envio", () => {
  const resultado = prepararAssinatura({ ...base, pdfSha256: "sem-hash" });
  assert.deepEqual(resultado.pendencias, ["pdf_aprovado"]);
});

test("PDF diferente do artefato aprovado não pode usar a mesma versão", () => {
  const diferente = prepararAssinatura({ ...base, pdfSha256: "b".repeat(64) });
  assert.deepEqual(diferente.pendencias, ["pdf_aprovado"]);
  const semHashAprovado = prepararAssinatura({ ...base, approvedPdfSha256: null });
  assert.deepEqual(semHashAprovado.pendencias, ["pdf_aprovado"]);
});
