import assert from "node:assert/strict";
import { test } from "node:test";
import { temAcessoWebApp } from "../lib/contratacao/acesso.ts";
import { destinoLocalSeguro } from "../lib/auth-destino.ts";

function cliente({ legado = false, pedido = false, negocioProprio = true, falha = false,
  totalPedidos = pedido ? 1 : 0, falhaSegundaPagina = false,
  emailDaCompra = "cliente@exemplo.com" } = {}) {
  const consultas = [];
  return {
    consultas,
    from(tabela) {
      consultas.push(tabela);
      let emailConsultado = null;
      let idsConsultados = [];
      const query = {
        select: () => query,
        eq: (coluna, valor) => {
          if (tabela === "commercial_orders" && coluna === "buyer_email") emailConsultado = valor;
          return query;
        },
        in: (_coluna, ids) => { idsConsultados = ids; return query; },
        not: () => query,
        order: () => query,
        range: async (inicio, fim) => ({
          data: pedido && emailConsultado === emailDaCompra
            ? Array.from({ length: Math.max(0, Math.min(totalPedidos, fim + 1) - inicio) },
              (_, indice) => ({ business_id: indice + inicio === totalPedidos - 1
                ? "b1" : `outro-${indice + inicio}` }))
            : [],
          error: falha || (falhaSegundaPagina && inicio === 1000)
            ? { message: "indisponivel" } : null,
        }),
        limit: () => query,
        maybeSingle: async () => ({
          data: tabela === "webapp_legacy_access"
            ? (legado ? { profile_id: "u1" } : null)
            : (negocioProprio && idsConsultados.includes("b1") ? { id: "b1" } : null),
          error: falha ? { message: "indisponivel" } : null,
        }),
        then: (resolve) => resolve({
          data: pedido && emailConsultado === emailDaCompra ? [{ business_id: "b1" }] : [],
          error: falha ? { message: "indisponivel" } : null,
        }),
      };
      return query;
    },
  };
}

const usuario = {
  id: "u1", email: "cliente@exemplo.com", email_confirmed_at: "2026-10-06T12:00:00Z",
  app_metadata: {},
};

test("cliente antigo preserva acesso sem compra nova", async () => {
  const supabase = cliente({ legado: true });
  assert.equal(await temAcessoWebApp(supabase, usuario), true);
  assert.deepEqual(supabase.consultas, ["webapp_legacy_access"]);
});

test("compra aprovada libera somente e-mail confirmado", async () => {
  assert.equal(await temAcessoWebApp(cliente({ pedido: true }), usuario), true);
  assert.equal(await temAcessoWebApp(cliente({ pedido: true, negocioProprio: false }), usuario), false);
  assert.equal(await temAcessoWebApp(cliente({ pedido: true }), {
    ...usuario, email_confirmed_at: undefined,
  }), false);
  assert.equal(await temAcessoWebApp(cliente({ pedido: true }), {
    ...usuario, email: "outro@exemplo.com",
  }), false);
});

test("sem compra e falha de leitura não liberam acesso", async () => {
  assert.equal(await temAcessoWebApp(cliente(), usuario), false);
  assert.equal(await temAcessoWebApp(cliente({ falha: true, pedido: true }), usuario), false);
});

test("pedido aprovado na página 2 libera só negócio próprio", async () => {
  assert.equal(await temAcessoWebApp(cliente({ pedido: true, totalPedidos: 1001 }), usuario), true);
  assert.equal(await temAcessoWebApp(cliente({ pedido: true, totalPedidos: 201 }), usuario), true);
  assert.equal(await temAcessoWebApp(cliente({ pedido: true, totalPedidos: 1001,
    falhaSegundaPagina: true }), usuario), false);
});

test("papel interno assinado pelo servidor continua com acesso", async () => {
  assert.equal(await temAcessoWebApp(cliente(), {
    ...usuario, app_metadata: { papel: "operador" },
  }), true);
});

test("retorno do login preserva somente rotas locais seguras", () => {
  assert.equal(destinoLocalSeguro("/gestor/tarefas?filtro=minhas#fila"),
    "/gestor/tarefas?filtro=minhas#fila");
  for (const destino of ["https://outro.example", "//outro.example", "/\\outro.example",
    "/entrar?next=/inicio", "/inicio\nLocation: https://outro.example", ""])
    assert.equal(destinoLocalSeguro(destino), "/inicio");
  assert.equal(destinoLocalSeguro("//outro.example", "/redefinir"), "/redefinir");
});
