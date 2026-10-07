// Exercita o resolvedor real sem rede, banco ou cookies de cliente.
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowed = new Set([
  "lib/multiconta/ativo.ts", "lib/multiconta/escolha.ts",
  "lib/multiconta/elegibilidade.ts",
].map((p) => pathToFileURL(path.join(root, p)).href));
const mocks = {
  "server-only": "export {};",
  "next/headers": "export const cookies = async () => ({get: () => ({value:globalThis.__multicontaOffline.cookie})});",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__multicontaOffline.client();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__multicontaOffline.admin();",
};
const fetchBefore = globalThis.fetch;
globalThis.fetch = () => { throw Error("Rede proibida neste teste offline"); };
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mocks, specifier)) return { url: "offline:" + specifier, shortCircuit: true };
    if (specifier.startsWith("node:")) return nextResolve(specifier, context);
    let url;
    if (specifier.startsWith(".")) url = new URL(specifier, context.parentURL).href;
    else throw Error("Import externo bloqueado: " + specifier);
    if (!url.endsWith(".ts")) url += ".ts";
    if (!allowed.has(url)) throw Error("Import não autorizado: " + url);
    return { url, shortCircuit: true };
  },
  load(url, context, nextLoad) {
    if (url.startsWith("offline:")) return { format: "module", source: mocks[url.slice(8)], shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { negocioAtivoDaSessao } = await import("../lib/multiconta/ativo.ts");
after(() => { hooks.deregister(); globalThis.fetch = fetchBefore; delete globalThis.__multicontaOffline; });

const antigo = { id: "a", name: "Antigo", created_at: "2026-10-05T00:00:00Z" };
const novo = { id: "b", name: "Novo", created_at: "2026-10-07T00:00:00Z" };
const pendente = { business_id: "b", status: "proof_received", buyer_email: "cliente@exemplo.com", buyer_profile_id: null };
let estado;
beforeEach(() => {
  estado = {
    user: { id: "p1", email: "cliente@exemplo.com", email_confirmed_at: "2026-10-01T00:00:00Z", app_metadata: {} },
    businesses: [antigo, novo], legacy: { granted_at: "2026-10-06T00:00:00Z" },
    orders: [pendente], cookie: null, adminFails: false,
  };
});

globalThis.__multicontaOffline = {
  get cookie() { return estado.cookie; },
  client() {
    return {
      auth: { getUser: async () => ({ data: { user: estado.user }, error: null }) },
      from(table) {
        if (table === "businesses") return {
          select: (columns) => {
            assert.equal(columns, "id, name, created_at");
            return { eq: (column, value) => {
              assert.equal(column, "profile_id"); assert.equal(value, estado.user.id);
              return { order: async () => ({ data: estado.businesses, error: null }) };
            } };
          },
        };
        if (table === "webapp_legacy_access") return {
          select: (columns) => {
            assert.equal(columns, "granted_at");
            return { eq: (column, value) => {
              assert.equal(column, "profile_id"); assert.equal(value, estado.user.id);
              return { maybeSingle: async () => ({ data: estado.legacy, error: null }) };
            } };
          },
        };
        throw Error("Tabela inesperada sob RLS: " + table);
      },
    };
  },
  admin() {
    if (estado.adminFails) throw Error("Credencial administrativa indisponível");
    return { from(table) {
      assert.equal(table, "commercial_orders");
      return { select: (columns) => {
        assert.equal(columns, "business_id, status, buyer_email, buyer_profile_id");
        return { in: async (column, ids) => {
          assert.equal(column, "business_id");
          assert.deepEqual(ids, estado.businesses.map((b) => b.id));
          return { data: estado.orders, error: null };
        } };
      } };
    } };
  },
};

test("sessão legada com segunda compra pendente continua só no negócio antigo", async () => {
  const resultado = await negocioAtivoDaSessao();
  assert.equal(resultado.status, "selecionado");
  assert.equal(resultado.negocio.id, "a");
  assert.deepEqual(resultado.negocios.map((n) => n.id), ["a"]);
});

test("cookie do negócio pendente perde validade sem cair no negócio antigo", async () => {
  estado.cookie = "b";
  const resultado = await negocioAtivoDaSessao();
  assert.equal(resultado.status, "selecao_invalida");
  assert.deepEqual(resultado.negocios.map((n) => n.id), ["a"]);
});

test("aprovação traz a segunda escolha para o mesmo e-mail verificado", async () => {
  estado.orders = [{ ...pendente, status: "payment_approved" }];
  const resultado = await negocioAtivoDaSessao();
  assert.equal(resultado.status, "escolha_necessaria");
  assert.deepEqual(resultado.negocios.map((n) => n.id), ["a", "b"]);
});

test("pedido antigo não libera o negócio após mudar o e-mail verificado", async () => {
  estado.orders = [{ ...pendente, status: "payment_approved", buyer_profile_id: "p1" }];
  estado.user.email = "outro@exemplo.com";
  const resultado = await negocioAtivoDaSessao();
  assert.equal(resultado.status, "selecionado");
  assert.deepEqual(resultado.negocios.map((n) => n.id), ["a"]);
});

test("falha da consulta de pedidos mantém acesso fechado", async () => {
  estado.adminFails = true;
  assert.equal((await negocioAtivoDaSessao()).status, "falha_consulta");
});

test("sem sessão não consulta empresas nem pedidos", async () => {
  estado.user = null;
  assert.equal((await negocioAtivoDaSessao()).status, "sem_sessao");
});
