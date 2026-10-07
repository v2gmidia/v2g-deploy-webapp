import assert from "node:assert/strict";
import { test } from "node:test";
import { temAcessoWebApp } from "../lib/contratacao/acesso.ts";

function cliente({ legado = false, pedido = false, negocioProprio = true, falha = false } = {}) {
  const consultas = [];
  return {
    consultas,
    from(tabela) {
      consultas.push(tabela);
      const query = {
        select: () => query,
        eq: () => query,
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
          data: pedido ? [{ business_id: "b1" }] : [],
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
