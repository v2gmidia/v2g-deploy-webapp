import assert from "node:assert/strict";
import { test } from "node:test";
import { escolherNegocio } from "../lib/multiconta/escolha.ts";

const empresas = [
  { id: "empresa-a", name: "Empresa A" },
  { id: "empresa-b", name: "Empresa B" },
];

test("uma empresa entra sem escolha; duas exigem escolha explícita", () => {
  assert.deepEqual(escolherNegocio([], null), { status: "sem_negocio", negocios: [] });
  assert.deepEqual(escolherNegocio([empresas[0]], null), {
    status: "selecionado", negocio: empresas[0],
  });
  assert.equal(escolherNegocio(empresas, null).status, "escolha_necessaria");
});

test("a preferência não autoriza ID forjado ou acesso revogado", () => {
  assert.equal(escolherNegocio(empresas, "empresa-b").status, "selecionado");
  assert.equal(escolherNegocio(empresas, "empresa-c").status, "selecao_invalida");
  assert.equal(escolherNegocio([empresas[0]], "empresa-b").status, "selecao_invalida");
  assert.equal(escolherNegocio([], "empresa-a").status, "selecao_invalida");
});
