import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { caminhosDaMarcaNoNegocio } from "../lib/gestor/caminhos-marca.ts";

const negocio = "11111111-1111-4111-8111-111111111111";
const outro = "22222222-2222-4222-8222-222222222222";
const linha = (storage_path) => ({ storage_path });

test("aceita somente arquivos sob o negócio selecionado", () => {
  const caminho = `identidade/${negocio}/logo-a1.jpg`;
  assert.deepEqual(caminhosDaMarcaNoNegocio(negocio, [linha(caminho)]),
    { ok: true, caminhos: [caminho] });
  assert.deepEqual(caminhosDaMarcaNoNegocio(negocio, []), { ok: true, caminhos: [] });
});

test("recusa lote inteiro se uma linha aponta a outro negócio ou não tem arquivo", () => {
  const valido = linha(`identidade/${negocio}/logo-a1.jpg`);
  assert.deepEqual(caminhosDaMarcaNoNegocio(negocio, [valido, linha(`identidade/${outro}/guia-a1.pdf`)]), { ok: false });
  assert.deepEqual(caminhosDaMarcaNoNegocio(negocio, [valido, linha(null)]), { ok: false });
});

test("recusa prefixo parecido, subdiretório e segmento ambíguo", () => {
  for (const path of [`identidade/${negocio}-extra/logo.jpg`,
    `identidade/${negocio}/../logo.jpg`, `identidade/${negocio}/sub/logo.jpg`,
    `identidade/${negocio}/%2Flogo.jpg`]) {
    assert.deepEqual(caminhosDaMarcaNoNegocio(negocio, [linha(path)]), { ok: false });
  }
});

test("a página valida o lote antes de criar URLs assinadas", () => {
  const fonte = readFileSync("app/(protected)/gestor/negocio/[id]/marca/page.tsx", "utf8");
  const valida = fonte.indexOf("caminhosDaMarcaNoNegocio(id,");
  const negacao = fonte.indexOf("if (!escopoDosArquivos.ok)", valida);
  const assina = fonte.indexOf(".createSignedUrls(escopoDosArquivos.caminhos", negacao);
  assert.ok(valida >= 0 && negacao > valida && assina > negacao);
});
