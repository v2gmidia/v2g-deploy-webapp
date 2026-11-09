import assert from "node:assert/strict";
import { test } from "node:test";
import { ambienteTs } from "./test-utils/ts-isolado.mjs";

const conviteId = "11111111-1111-4111-8111-111111111111";
const usuarioConfirmado = {
  id: "perfil-fixture",
  email: "cliente@example.invalid",
  email_confirmed_at: "2026-11-08T10:00:00Z",
  app_metadata: {},
};

function paginaPublica(respostaAuth) {
  let admins = 0;
  let resumos = 0;
  const pagina = ambienteTs({ ports: {
    "next/navigation": { notFound: () => { throw Error("not-found"); } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => respostaAuth } }) },
    "@/lib/supabase/admin": { createAdminClient: () => { admins += 1; return { origem: "admin-fixture" }; } },
    "@/components/ui/EntradaEditorial": { EntradaEditorial: ({ children }) => children },
    "@/lib/contratacao/acesso-contratado": {
      acessoContratadoAtivo: () => true,
      ID_ACESSO_CONTRATADO: /^[0-9a-f-]{36}$/,
    },
    "@/lib/contratacao/cadastro-contratado": {
      resumoAcessoContratado: async (admin, id, user) => {
        resumos += 1;
        assert.equal(admin.origem, "admin-fixture");
        assert.equal(id, conviteId);
        assert.equal(user.id, usuarioConfirmado.id);
        return { nome: "Negócio fixture", documento: "00000000191", businessId: "22222222-2222-4222-8222-222222222222" };
      },
    },
    "@/lib/contratacao/documento-contratante": { identificarDocumentoContratante: () => "CPF" },
    "./Formulario": { FormularioAcessoContratado: () => null },
  } }).load("app/(public)/acesso-contratado/[id]/page.tsx").default;
  return {
    executar: () => pagina({ params: Promise.resolve({ id: conviteId }) }),
    contagens: () => ({ admins, resumos }),
  };
}

function consultaVazia() {
  const q = {
    select() { return q; },
    eq() { return q; },
    in() { return q; },
    order() { return q; },
    limit() { return q; },
    then(ok, erro) { return Promise.resolve({ data: [], error: null }).then(ok, erro); },
  };
  return q;
}

function paginaPedidos(respostaAuth) {
  let admins = 0;
  let consultas = 0;
  const pagina = ambienteTs({
    env: {},
    globals: { crypto: { randomUUID: () => "33333333-3333-4333-8333-333333333333" } },
    ports: {
      "next/navigation": { notFound: () => { throw Error("not-found"); } },
      "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => respostaAuth } }) },
      "@/lib/supabase/admin": { createAdminClient: () => {
        admins += 1;
        return { from: () => { consultas += 1; return consultaVazia(); } };
      } },
      "@/lib/contratacao/documento-contratante": { identificarDocumentoContratante: () => "CPF" },
      "@/lib/titulos": { tituloDaAba: () => ({ title: "Pedidos" }) },
      "@/lib/contratacao/documentos": { ultimoDocumentoPorPedido: () => new Map() },
      "./Formularios": { AprovarPix: () => null, ComprovantePix: () => null, NovoPedidoPix: () => null },
      "@/lib/contratacao/ambiente-checkout": { checkoutSandboxSeguroNesteServidor: () => false },
      "./ConferenciasManuais": { ConferenciasManuais: () => null },
    },
  }).load("app/(protected)/pedidos/page.tsx").default;
  return {
    executar: () => pagina({ searchParams: Promise.resolve({}) }),
    contagens: () => ({ admins, consultas }),
  };
}

test("página pública não usa admin quando Auth devolve usuário junto com erro", async () => {
  const caso = paginaPublica({ data: { user: usuarioConfirmado }, error: { message: "sessão incerta" } });
  await caso.executar();
  assert.deepEqual(caso.contagens(), { admins: 0, resumos: 0 });
});

test("página pública só consulta resumo com usuário confirmado e Auth sem erro", async () => {
  for (const user of [null, { ...usuarioConfirmado, email_confirmed_at: null }]) {
    const negado = paginaPublica({ data: { user }, error: null });
    await negado.executar();
    assert.deepEqual(negado.contagens(), { admins: 0, resumos: 0 });
  }
  const permitido = paginaPublica({ data: { user: usuarioConfirmado }, error: null });
  await permitido.executar();
  assert.deepEqual(permitido.contagens(), { admins: 1, resumos: 1 });
});

test("Pedidos recusa erro de Auth antes de criar cliente administrativo", async () => {
  const operador = { ...usuarioConfirmado, app_metadata: { papel: "operador" } };
  const caso = paginaPedidos({ data: { user: operador }, error: { message: "sessão incerta" } });
  await assert.rejects(caso.executar(), /not-found/);
  assert.deepEqual(caso.contagens(), { admins: 0, consultas: 0 });
});

test("Pedidos recusa sessão ausente, não confirmada ou sem papel antes da leitura", async () => {
  const casos = [
    null,
    { ...usuarioConfirmado, email_confirmed_at: null, app_metadata: { papel: "operador" } },
    { ...usuarioConfirmado, app_metadata: {} },
  ];
  for (const user of casos) {
    const caso = paginaPedidos({ data: { user }, error: null });
    await assert.rejects(caso.executar(), /not-found/);
    assert.deepEqual(caso.contagens(), { admins: 0, consultas: 0 });
  }
});

test("Pedidos mantém consulta existente para operador confirmado e Auth íntegro", async () => {
  const operador = { ...usuarioConfirmado, app_metadata: { papel: "operador" } };
  const caso = paginaPedidos({ data: { user: operador }, error: null });
  await caso.executar();
  assert.deepEqual(caso.contagens(), { admins: 1, consultas: 1 });
});
