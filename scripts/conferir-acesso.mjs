import assert from "node:assert/strict";
import { test } from "node:test";
import { temAcessoWebApp } from "../lib/contratacao/acesso.ts";
import { destinoLocalSeguro } from "../lib/auth-destino.ts";

function cliente({ legado = false, pedido = false, negocioProprio = true, falha = false,
  emailDaCompra = "cliente@exemplo.com" } = {}) {
  const consultas = [];
  return {
    consultas,
    from(tabela) {
      consultas.push(tabela);
      let emailConsultado = null;
      const query = {
        select: () => query,
        eq: (coluna, valor) => {
          if (tabela === "commercial_orders" && coluna === "buyer_email") emailConsultado = valor;
          return query;
        },
        in: () => query,
        not: () => query,
        limit: () => query,
        maybeSingle: async () => ({
          data: tabela === "webapp_legacy_access"
            ? (legado ? { profile_id: "u1" } : null)
            : (negocioProprio ? { id: "b1" } : null),
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
