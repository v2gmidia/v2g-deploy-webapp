import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { provenienciaDoUploadCliente } from "../lib/identidade/proveniencia-upload.ts";

const raiz = new URL("../", import.meta.url);
const ler = (caminho) => readFileSync(new URL(caminho, raiz), "utf8");

test("upload registra origem, versão e hash sem fabricar autorização para IA", () => {
  const prova = provenienciaDoUploadCliente(new TextEncoder().encode("arquivo-ficticio"), "2026-10-26T12:00:00.000Z");
  assert.deepEqual(prova, {
    versao: 1,
    origem: "upload_cliente",
    sha256: "07f2e106083261c562445ab15ec8f1555a0fb11be44acd00a996122bbb36ed63",
    registradoEm: "2026-10-26T12:00:00.000Z",
    finalidadeDoUpload: "identidade_visual",
  });
  assert.equal("autorizadoParaGeracao" in prova, false);
  assert.equal("autorizacao" in prova, false);
});

test("onboarding avisa que upload não autoriza IA", () => {
  const tela = ler("app/(fluxo)/onboarding/marca/Marca.tsx");
  const aviso = ler("app/(protected)/conta/declaracao.ts");
  assert.match(tela, /Envio não autoriza uso por IA/);
  assert.match(aviso, /autorização será pedida separadamente/);
});

test("variações são descritas somente como logo, sem classificar foto por inferência", () => {
  const tela = ler("app/(fluxo)/onboarding/marca/VariacoesDaMarca.tsx");
  assert.match(tela, /Outras versões do logo/);
  assert.match(tela, /precisam ser classificadas separadamente/);
  assert.doesNotMatch(tela, /imagens próprias em que as cores/);
});

test("os três caminhos de upload novo registram a mesma proveniência", () => {
  for (const caminho of [
    "lib/identidade/armazenar.ts",
    "app/(fluxo)/onboarding/marca/variacoes-actions.ts",
    "app/(fluxo)/onboarding/marca/guia-actions.ts",
  ]) {
    const fonte = ler(caminho);
    assert.match(fonte, /origemMaterial:\s*provenienciaDoUploadCliente/);
  }
});
