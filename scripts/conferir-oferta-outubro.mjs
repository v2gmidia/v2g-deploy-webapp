import assert from "node:assert/strict";
import { test } from "node:test";
import { OFERTA_OUTUBRO, avaliarQualificacao, mensalidadeBaseCentavos } from "../lib/comercial/oferta.ts";

test("a cobrança base é mensal por conta de anúncios e não aplica desconto indefinido", () => {
  assert.equal(OFERTA_OUTUBRO.permanenciaMinimaMeses, 6);
  assert.equal(OFERTA_OUTUBRO.descontoAntecipacaoPercentual, null);
  assert.equal(mensalidadeBaseCentavos(1), 50_000);
  assert.equal(mensalidadeBaseCentavos(2), 100_000);
  assert.equal(mensalidadeBaseCentavos(0), null);
  assert.equal(mensalidadeBaseCentavos(1.5), null);
  assert.equal(mensalidadeBaseCentavos(Number.MAX_SAFE_INTEGER), null);
});

test("sem declaração positiva de CNPJ e venda por WhatsApp não há qualificação", () => {
  assert.deepEqual(avaliarQualificacao({ declaraTerCnpj: true, declaraVenderPeloWhatsApp: true }), {
    apto: true, motivos: [],
  });
  assert.deepEqual(avaliarQualificacao({ declaraTerCnpj: null, declaraVenderPeloWhatsApp: true }), {
    apto: false, motivos: ["cnpj_nao_declarado"],
  });
  assert.deepEqual(avaliarQualificacao({ declaraTerCnpj: true, declaraVenderPeloWhatsApp: false }), {
    apto: false, motivos: ["venda_por_whatsapp_nao_declarada"],
  });
});
