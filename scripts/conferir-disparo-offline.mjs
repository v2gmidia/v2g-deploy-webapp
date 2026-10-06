// node --test scripts/conferir-disparo-offline.mjs
// Exercita a action real com banco e backend simulados. Rede é proibida.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";

const antes = {
  fetch: globalThis.fetch,
  url: process.env.V2G_N8N_WEBHOOK_URL,
  token: process.env.V2G_N8N_WEBHOOK_TOKEN,
};
process.env.V2G_N8N_WEBHOOK_URL = "https://exemplo.invalid/webhook";
process.env.V2G_N8N_WEBHOOK_TOKEN = "token-de-teste";
globalThis.fetch = () => { throw new Error("Rede proibida neste teste"); };

const mocks = {
  "server-only": "export {};",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__disparoOffline.client();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__disparoOffline.admin();",
  "@/lib/backend/cadastro": "export const enviarCadastro = async (...a) => globalThis.__disparoOffline.send(...a);",
  "@/lib/backend/cliente": "export const obter = async () => { throw Error('Consulta inesperada ao backend'); };",
  "@/lib/cadastro/montar": "export const COLUNAS_DO_CADASTRO = 'id, onboarding, cadastro_estado, cadastro_iniciado_em'; export const montarCadastro = () => ({ completo: true, payload: { nome_negocio: 'Teste' } });",
  "./relogios": "export const MINUTOS_ATE_DESTRAVAR_DISPARO = 5;",
  "@/lib/onboarding/marca": "export const fluxoAguardaReuniao = doc => Boolean(doc?.respostas || doc?.contas);",
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mocks, specifier)) return { url: `offline:${specifier}`, shortCircuit: true };
    if (context.parentURL?.startsWith("offline:")) throw Error(`Import inesperado: ${specifier}`);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("offline:")) return { format: "module", source: mocks[url.slice(8)], shortCircuit: true };
    return nextLoad(url, context);
  },
});

const { dispararSeCompleto } = await import("../lib/pipeline/disparar.ts");
let negocio;
let envios;
let travas;
let buscas;

beforeEach(() => {
  negocio = {
    id: "11111111-1111-4111-8111-111111111111",
    dados_ficticios: false,
    cadastro_estado: null,
    cadastro_iniciado_em: null,
    onboarding: {},
  };
  envios = 0;
  travas = 0;
  buscas = 0;
});

globalThis.__disparoOffline = {
  client() {
    return {
      auth: { getUser: async () => ({ data: { user: { id: "perfil-teste" } } }) },
      from(tabela) {
        assert.equal(tabela, "businesses");
        return {
          select() {
            const consulta = {
              eq(campo, valor) { assert.equal(campo, "profile_id"); assert.equal(valor, "perfil-teste"); return consulta; },
              order() { return consulta; },
              limit() { return consulta; },
              async maybeSingle() { return { data: structuredClone(negocio), error: null }; },
            };
            return consulta;
          },
        };
      },
    };
  },
  admin() {
    return {
      from(tabela) {
        if (tabela === "execucoes") return {
          select() {
            const consulta = {
              or() { return consulta; }, order() { return consulta; }, limit() { return consulta; },
              async maybeSingle() { buscas++; return { data: null, error: null }; },
            };
            return consulta;
          },
        };
        assert.equal(tabela, "businesses");
        return {
          update(campos) {
            let id;
            const atualizacao = {
              eq(campo, valor) { assert.equal(campo, "id"); id = valor; return atualizacao; },
              or(filtro) { assert.equal(filtro, "cadastro_estado.is.null,cadastro_estado.eq.falhou"); return atualizacao; },
              async select() {
                assert.equal(id, negocio.id);
                travas++;
                if (negocio.cadastro_estado !== null && negocio.cadastro_estado !== "falhou") return { data: [], error: null };
                Object.assign(negocio, campos);
                return { data: [{ id }], error: null };
              },
            };
            return atualizacao;
          },
        };
      },
    };
  },
  async send() {
    envios++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { ok: false, categoria: "tempo_esgotado", mensagem: "Resposta perdida" };
  },
};

after(() => {
  hooks.deregister();
  globalThis.fetch = antes.fetch;
  if (antes.url === undefined) delete process.env.V2G_N8N_WEBHOOK_URL;
  else process.env.V2G_N8N_WEBHOOK_URL = antes.url;
  if (antes.token === undefined) delete process.env.V2G_N8N_WEBHOOK_TOKEN;
  else process.env.V2G_N8N_WEBHOOK_TOKEN = antes.token;
  delete globalThis.__disparoOffline;
});

test("onboarding atual bloqueia duas tentativas mesmo com cadastro completo", async () => {
  negocio.onboarding = { respostas: { nome: { texto: "Teste" } } };
  const [a, b] = await Promise.all([dispararSeCompleto(), dispararSeCompleto()]);
  assert.deepEqual([a, b], [
    { fez: "nada", porque: "reuniao_pendente" },
    { fez: "nada", porque: "reuniao_pendente" },
  ]);
  assert.equal(envios, 0);
  assert.equal(travas, 0);
});

test("duas chamadas concorrentes do fluxo legado fazem um só POST", async () => {
  const [a, b] = await Promise.all([dispararSeCompleto(), dispararSeCompleto()]);
  assert.deepEqual([a.fez, b.fez].sort(), ["incerto", "nada"]);
  assert.equal(envios, 1);
  assert.equal(travas, 2);
  assert.equal(negocio.cadastro_estado, "enviando");
  assert.equal((await dispararSeCompleto()).porque, "ja_em_curso");
  assert.equal(envios, 1);
  assert.equal(buscas, 1);
});
