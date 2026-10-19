import assert from "node:assert/strict";
import test from "node:test";
import { BUCKET_REVISAO, caminhoDaRevisao, podeRepetirEnvio,
  podeAnalisarAposEnvio, rotuloDaRevisao, TAMANHO_MAXIMO_REVISAO, tipoRealDaImagem } from "../lib/criativos/revisao.ts";
import { descricaoDaTarefaDeRevisao, ehTarefaDeRevisao, idDaTarefaDeRevisao,
  solicitacaoDaTarefaDeRevisao } from "../lib/gestor/revisao-pendente.ts";
import { destinoPaginaCriativos, faixaDeCriativos, paginaDeCriativos,
  ultimaPaginaCriativos } from "../lib/criativos/paginacao.ts";

test("fila de criativos pagina todas as pendências sem repetir o limite anterior", () => {
  assert.deepEqual(faixaDeCriativos(1), { inicio: 0, fim: 99 });
  assert.deepEqual(faixaDeCriativos(2), { inicio: 100, fim: 199 });
  assert.deepEqual(faixaDeCriativos(3), { inicio: 200, fim: 299 });
  assert.deepEqual(faixaDeCriativos(2, 30), { inicio: 30, fim: 59 });
  assert.equal(ultimaPaginaCriativos(0), 1);
  assert.equal(ultimaPaginaCriativos(100), 1);
  assert.equal(ultimaPaginaCriativos(101), 2);
  assert.equal(ultimaPaginaCriativos(31, 30), 2);
  assert.equal(destinoPaginaCriativos("negocio-1", 2), "/gestor/criativos?negocio=negocio-1&pagina=2");
  assert.equal(destinoPaginaCriativos(null, 2), "/gestor/criativos?pagina=2");
});

test("pagina externa inválida ou repetida volta à primeira com aviso", () => {
  for (const valor of ["0", "-1", "1.5", "1001", "999999999999", ["1", "2"], null, "abc"])
    assert.deepEqual(paginaDeCriativos(valor), { numero: 1, invalida: true });
  assert.deepEqual(paginaDeCriativos(undefined), { numero: 1, invalida: false });
  assert.deepEqual(paginaDeCriativos("1000"), { numero: 1000, invalida: false });
});

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

test("analise automatica tem piloto desligado e nao repete chamada em envio idempotente", () => {
  assert.equal(podeAnalisarAposEnvio(false, false, true), false);
  assert.equal(podeAnalisarAposEnvio(true, true, true), false);
  assert.equal(podeAnalisarAposEnvio(true, false, false), false);
  assert.equal(podeAnalisarAposEnvio(true, false, true), true);
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
