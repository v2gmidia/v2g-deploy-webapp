import assert from "node:assert/strict";
import test from "node:test";
import { BUCKET_REVISAO, caminhoDaRevisao, podeRepetirEnvio,
  rotuloDaRevisao, TAMANHO_MAXIMO_REVISAO, tipoRealDaImagem } from "../lib/criativos/revisao.ts";
import { descricaoDaTarefaDeRevisao, ehTarefaDeRevisao, idDaTarefaDeRevisao,
  solicitacaoDaTarefaDeRevisao } from "../lib/gestor/revisao-pendente.ts";

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

test("uma solicitacao tem uma tarefa interna estavel e distinta", () => {
  const primeira = "00000000-0000-4000-8000-000000000001";
  const segunda = "00000000-0000-4000-8000-000000000002";
  const id = idDaTarefaDeRevisao(primeira);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(idDaTarefaDeRevisao(primeira), id);
  assert.notEqual(idDaTarefaDeRevisao(segunda), id);
  assert.match(descricaoDaTarefaDeRevisao(primeira, segunda), /publicação continua manual/);
  assert.equal(ehTarefaDeRevisao(id, segunda, descricaoDaTarefaDeRevisao(primeira, segunda)), true);
  assert.equal(ehTarefaDeRevisao(id, primeira, descricaoDaTarefaDeRevisao(primeira, segunda)), false);
  assert.equal(ehTarefaDeRevisao(idDaTarefaDeRevisao(segunda), segunda,
    descricaoDaTarefaDeRevisao(primeira, segunda)), false);
  assert.equal(ehTarefaDeRevisao(id, segunda, "Tarefa manual com mesmo título"), false);
  assert.equal(solicitacaoDaTarefaDeRevisao(id, segunda,
    descricaoDaTarefaDeRevisao(primeira, segunda)), primeira);
  assert.equal(solicitacaoDaTarefaDeRevisao(id, primeira,
    descricaoDaTarefaDeRevisao(primeira, segunda)), null);
});
