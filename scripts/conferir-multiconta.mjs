import assert from "node:assert/strict";
import { test } from "node:test";
import { escolherNegocio } from "../lib/multiconta/escolha.ts";
import { negociosLiberados } from "../lib/multiconta/elegibilidade.ts";
import { cnpjsDoComprador } from "../lib/multiconta/identificacao.ts";
import { lerTodasPaginas } from "../lib/multiconta/paginacao.ts";
import { pedidosAutorizadosParaVinculo, vincularComprasAprovadasComCliente } from "../lib/contratacao/vincular-core.ts";

const empresas = [
  { id: "empresa-a", name: "Empresa A" },
  { id: "empresa-b", name: "Empresa B" },
];

test("paginação reúne pedidos além do limite e preserva a autorização", async () => {
  const registros = Array.from({ length: 1001 }, (_, indice) => ({
    ...pendente, business_id: `outro-${indice}`,
  }));
  registros[1000] = { ...pendente, business_id: "b", status: "payment_approved" };
  const faixas = [];
  const pedidos = await lerTodasPaginas(async (inicio, fim) => {
    faixas.push([inicio, fim]);
    return { data: registros.slice(inicio, fim + 1), error: null };
  });
  assert.deepEqual(faixas, [[0, 999], [1000, 1999]]);
  assert.equal(pedidos.length, 1001);
  assert.deepEqual(negociosLiberados({ ...base, negocios: [antigo, novo], pedidos })
    .map((negocio) => negocio.id), ["a", "b"]);
});

test("erro na segunda página invalida toda a leitura", async () => {
  const resultado = await lerTodasPaginas(async (inicio) => inicio === 0
    ? { data: Array(1000).fill({ id: "negocio" }), error: null }
    : { data: null, error: new Error("falha de consulta") });
  assert.equal(resultado, null);
});

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

test("seletor mostra CNPJ de compra aprovada ainda vinculada só por e-mail verificado", () => {
  const pedidos = [
    { business_id: "empresa-a", cnpj: "11111111000111", buyer_email: "CLIENTE@EXEMPLO.COM", buyer_profile_id: null },
    { business_id: "empresa-a", cnpj: "99999999000199", buyer_email: "cliente@exemplo.com", buyer_profile_id: null },
    { business_id: "empresa-b", cnpj: "22222222000122", buyer_email: "outro@exemplo.com", buyer_profile_id: null },
    { business_id: "fora", cnpj: "33333333000133", buyer_email: "cliente@exemplo.com", buyer_profile_id: null },
  ];
  assert.deepEqual([...cnpjsDoComprador(["empresa-a", "empresa-b"], pedidos, "pessoa-a", "cliente@exemplo.com")],
    [["empresa-a", "11111111000111"]]);
  assert.equal(cnpjsDoComprador(["empresa-a"], pedidos, "pessoa-a", null).size, 0);
  assert.equal(cnpjsDoComprador(["empresa-a"], [{ ...pedidos[0], buyer_profile_id: "outra-pessoa" }],
    "pessoa-a", "cliente@exemplo.com").size, 0);
});

test("vínculo de compra só alcança negócio confirmado do perfil, sem tomar pedido alheio", () => {
  const pedidos = [
    { id: "novo", business_id: "meu", buyer_profile_id: null },
    { id: "repetido", business_id: "meu", buyer_profile_id: "pessoa-a" },
    { id: "outro-dono", business_id: "alheio", buyer_profile_id: null },
    { id: "outro-perfil", business_id: "meu", buyer_profile_id: "pessoa-b" },
    { id: "sem-negocio", business_id: null, buyer_profile_id: null },
  ];
  assert.deepEqual(pedidosAutorizadosParaVinculo(pedidos, ["meu"], "pessoa-a"), ["novo", "repetido"]);
  assert.deepEqual(pedidosAutorizadosParaVinculo(pedidos, [], "pessoa-a"), []);
});

function clienteDeTeste(respostas) {
  const chamadas = [];
  return {
    chamadas,
    from(tabela) {
      const chamada = { tabela, operacao: null, filtros: [] };
      chamadas.push(chamada);
      const consulta = {
        select(colunas) { chamada.operacao = ["select", colunas]; return this; },
        update(valores) { chamada.operacao = ["update", valores]; return this; },
        eq(...argumentos) { chamada.filtros.push(["eq", ...argumentos]); return this; },
        not(...argumentos) { chamada.filtros.push(["not", ...argumentos]); return this; },
        in(...argumentos) { chamada.filtros.push(["in", ...argumentos]); return this; },
        is(...argumentos) { chamada.filtros.push(["is", ...argumentos]); return this; },
        then(resolve, reject) {
          if (!respostas.length) return Promise.reject(new Error("Consulta inesperada")).then(resolve, reject);
          return Promise.resolve(respostas.shift()).then(resolve, reject);
        },
      };
      return consulta;
    },
  };
}

const usuarioVerificado = { id: "pessoa-a", email: "Cliente@Exemplo.com", email_confirmed_at: "2026-10-11T00:00:00Z" };

test("reivindicação parcial só grava pedido do negócio que passou a pertencer ao perfil", async () => {
  const cliente = clienteDeTeste([
    { data: [
      { id: "pedido-meu", business_id: "meu", buyer_profile_id: null },
      { id: "pedido-alheio", business_id: "alheio", buyer_profile_id: null },
      { id: "pedido-outro", business_id: "meu", buyer_profile_id: "pessoa-b" },
    ], error: null },
    { error: null },
    { data: [{ id: "meu" }], error: null },
    { error: null },
  ]);
  await vincularComprasAprovadasComCliente(cliente, usuarioVerificado);
  assert.equal(cliente.chamadas.length, 4);
  assert.deepEqual(cliente.chamadas[0].filtros.slice(0, 2), [
    ["eq", "buyer_email", "cliente@exemplo.com"], ["eq", "status", "payment_approved"],
  ]);
  assert.deepEqual(cliente.chamadas[3].filtros, [
    ["in", "id", ["pedido-meu"]], ["in", "business_id", ["meu"]], ["is", "buyer_profile_id", null],
  ]);
});

test("falha na conferência de propriedade mantém pedido sem vínculo", async () => {
  const pedido = { id: "pedido", business_id: "meu", buyer_profile_id: null };
  const semPropriedade = clienteDeTeste([
    { data: [pedido], error: null }, { error: null }, { data: [], error: null },
  ]);
  await vincularComprasAprovadasComCliente(semPropriedade, usuarioVerificado);
  assert.equal(semPropriedade.chamadas.length, 3);

  const falhaConsulta = clienteDeTeste([
    { data: [pedido], error: null }, { error: null }, { data: null, error: new Error("indisponível") },
  ]);
  await vincularComprasAprovadasComCliente(falhaConsulta, usuarioVerificado);
  assert.equal(falhaConsulta.chamadas.length, 3);
});

test("pedido já atribuído a outra pessoa não reivindica negócio", async () => {
  const cliente = clienteDeTeste([{ data: [
    { id: "pedido", business_id: "meu", buyer_profile_id: "pessoa-b" },
  ], error: null }]);
  await vincularComprasAprovadasComCliente(cliente, usuarioVerificado);
  assert.equal(cliente.chamadas.length, 1);
});

test("e-mail não verificado não reivindica negócio nem pedido", async () => {
  const cliente = clienteDeTeste([]);
  await vincularComprasAprovadasComCliente(cliente, { ...usuarioVerificado, email_confirmed_at: null });
  assert.equal(cliente.chamadas.length, 0);
});
