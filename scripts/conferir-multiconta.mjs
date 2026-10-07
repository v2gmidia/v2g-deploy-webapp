import assert from "node:assert/strict";
import { test } from "node:test";
import { escolherNegocio } from "../lib/multiconta/escolha.ts";
import { negociosLiberados } from "../lib/multiconta/elegibilidade.ts";

const empresas = [
  { id: "empresa-a", name: "Empresa A" },
  { id: "empresa-b", name: "Empresa B" },
];

test("uma empresa entra sem escolha; duas exigem escolha explícita", () => {
  assert.deepEqual(escolherNegocio([], null), { status: "sem_negocio", negocios: [] });
  assert.deepEqual(escolherNegocio([empresas[0]], null), {
    status: "selecionado", negocio: empresas[0], negocios: [empresas[0]],
  });
  assert.equal(escolherNegocio(empresas, null).status, "escolha_necessaria");
});

test("a preferência não autoriza ID forjado ou acesso revogado", () => {
  assert.equal(escolherNegocio(empresas, "empresa-b").status, "selecionado");
  assert.equal(escolherNegocio(empresas, "empresa-c").status, "selecao_invalida");
  assert.equal(escolherNegocio([empresas[0]], "empresa-b").status, "selecao_invalida");
  assert.equal(escolherNegocio([], "empresa-a").status, "selecao_invalida");
});

const base = {
  perfilId: "pessoa-a",
  emailVerificado: "cliente@exemplo.com",
  operador: false,
  legadoEm: "2026-10-06T00:00:00Z",
};
const antigo = { id: "a", name: "Antigo", created_at: "2026-10-05T00:00:00Z" };
const novo = { id: "b", name: "Compra pendente", created_at: "2026-10-07T00:00:00Z" };
const pendente = {
  business_id: "b", status: "proof_submitted", buyer_email: "cliente@exemplo.com",
  buyer_profile_id: null,
};

test("compra pendente não libera outro negócio do mesmo perfil legado", () => {
  assert.deepEqual(negociosLiberados({ ...base, negocios: [antigo, novo], pedidos: [pendente] }), [
    { id: "a", name: "Antigo" },
  ]);
});

test("aprovação do pedido libera o novo negócio ao comprador verificado", () => {
  assert.deepEqual(negociosLiberados({
    ...base, negocios: [antigo, novo],
    pedidos: [{ ...pendente, status: "payment_approved" }],
  }).map((negocio) => negocio.id), ["a", "b"]);
  assert.deepEqual(negociosLiberados({
    ...base, emailVerificado: null, negocios: [novo],
    pedidos: [{ ...pendente, status: "payment_approved" }],
  }), []);
});

test("novo perfil sem pedido não ganha acesso pela propriedade da linha", () => {
  assert.deepEqual(negociosLiberados({
    ...base, legadoEm: null, negocios: [novo], pedidos: [],
  }), []);
  assert.deepEqual(negociosLiberados({
    ...base, legadoEm: null, negocios: [novo], pedidos: [pendente],
  }), []);
  assert.deepEqual(negociosLiberados({
    ...base, legadoEm: null, negocios: [novo],
    pedidos: [{ ...pendente, status: "payment_approved", buyer_email: "outro@exemplo.com" }],
  }), []);
  assert.deepEqual(negociosLiberados({
    ...base, legadoEm: null, negocios: [novo],
    pedidos: [{ ...pendente, status: "payment_approved", buyer_profile_id: "outra-pessoa" }],
  }), []);
});

test("legado sem negócio anterior consegue iniciar um cadastro próprio", () => {
  assert.deepEqual(negociosLiberados({ ...base, negocios: [novo], pedidos: [] }), [
    { id: "b", name: "Compra pendente" },
  ]);
  assert.deepEqual(negociosLiberados({
    ...base, negocios: [novo, { ...novo, id: "c" }], pedidos: [],
  }).length, 1);
  assert.deepEqual(negociosLiberados({
    ...base, negocios: [novo, { ...novo, id: "c" }], pedidos: [pendente],
  }), []);
  assert.deepEqual(negociosLiberados({
    ...base, legadoEm: "data inválida", negocios: [novo], pedidos: [],
  }), []);
});
