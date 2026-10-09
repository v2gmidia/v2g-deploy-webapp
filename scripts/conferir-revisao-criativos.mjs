import assert from "node:assert/strict";
import test from "node:test";
import { BUCKET_REVISAO, caminhoDaRevisao, podeRepetirEnvio,
  rotuloDaRevisao, TAMANHO_MAXIMO_REVISAO, tipoRealDaImagem } from "../lib/criativos/revisao.ts";

test("somente assinatura de JPEG e PNG e aceita", () => {
  assert.equal(tipoRealDaImagem(new Uint8Array([0xff, 0xd8, 0xff, 0x01])), "image/jpeg");
  assert.equal(tipoRealDaImagem(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), "image/png");
  assert.equal(tipoRealDaImagem(new Uint8Array([0x25, 0x50, 0x44, 0x46])), null);
  assert.equal(tipoRealDaImagem(new Uint8Array()), null);
});

test("mesma solicitacao usa o mesmo caminho privado", () => {
  assert.equal(BUCKET_REVISAO, "creative-review");
  assert.equal(caminhoDaRevisao("negocio", "solicitacao"), "negocio/solicitacao");
  assert.equal(TAMANHO_MAXIMO_REVISAO, 9 * 1024 * 1024);
});

test("falha pode ser repetida; envio recente nao compete com si mesmo", () => {
  const agora = Date.parse("2026-10-09T03:50:00Z");
  assert.equal(podeRepetirEnvio("upload_failed", new Date(agora).toISOString(), agora), true);
  assert.equal(podeRepetirEnvio("uploading", new Date(agora - 30_000).toISOString(), agora), false);
  assert.equal(podeRepetirEnvio("uploading", new Date(agora - 121_000).toISOString(), agora), true);
  assert.equal(podeRepetirEnvio("awaiting_review", new Date(agora - 300_000).toISOString(), agora), false);
});

test("aprovacao interna nao vira estado de publicacao", () => {
  assert.match(rotuloDaRevisao("approved_for_manual_publish"), /publicação manual pendente/);
  assert.match(rotuloDaRevisao("awaiting_review"), /revisão do gestor/);
});
