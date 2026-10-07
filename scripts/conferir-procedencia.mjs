import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const alvo = pathToFileURL(path.join(root, "lib/cadastro/procedencia.ts")).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === alvo) return nextResolve(specifier, context);
    if (specifier === "server-only" || specifier === "@/lib/supabase/admin") {
      return { url: `offline:${specifier}`, shortCircuit: true };
    }
    if (specifier.startsWith("node:")) return nextResolve(specifier, context);
    throw Error(`Import inesperado: ${specifier}`);
  },
  load(url, context, nextLoad) {
    if (url === "offline:server-only") return { format: "module", source: "export {};", shortCircuit: true };
    if (url === "offline:@/lib/supabase/admin") return {
      format: "module",
      source: "export const createAdminClient = () => globalThis.__procedenciaOffline.criar();",
      shortCircuit: true,
    };
    if (url !== alvo) throw Error(`Arquivo inesperado: ${url}`);
    return nextLoad(url, context);
  },
});
const { gravarCamposDoCliente } = await import(alvo);
after(() => { hooks.deregister(); delete globalThis.__procedenciaOffline; });

let chamadas;
let criar;
beforeEach(() => {
  chamadas = [];
  criar = () => ({ rpc: async (_nome, args) => {
    chamadas.push(args.p_campo);
    return { data: { ato: "preencheu", procedencia_anterior: "desconhecida" }, error: null };
  } });
  globalThis.__procedenciaOffline = { criar: () => criar() };
});

const base = {
  profileId: "perfil", businessId: "negocio", tabela: "businesses",
  campos: [{ campo: "name", valor: "Negócio" }, { campo: "city", valor: "Curitiba" }],
};

test("falha ao iniciar gravação devolve erro de campo sem marcar sucesso", async () => {
  criar = () => { throw Error("cliente indisponível"); };
  const resultado = await gravarCamposDoCliente(base);
  assert.deepEqual(resultado, {
    ok: false, erro: "Não conseguimos salvar essa resposta. Tente de novo.",
    campoQueFalhou: "name", gravados: [],
  });
  assert.deepEqual(chamadas, []);
});

test("falha na segunda chamada conserva o primeiro ato e aponta o campo restante", async () => {
  criar = () => ({ rpc: async (_nome, args) => {
    chamadas.push(args.p_campo);
    if (args.p_campo === "city") throw Error("rede indisponível");
    return { data: { ato: "corrigiu", procedencia_anterior: "cliente" }, error: null };
  } });
  const resultado = await gravarCamposDoCliente(base);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.campoQueFalhou, "city");
  assert.deepEqual(resultado.gravados, [
    { campo: "name", ato: "corrigiu", procedenciaAnterior: "cliente" },
  ]);
  assert.deepEqual(chamadas, ["name", "city"]);
});

test("sem campos não inicializa o cliente admin", async () => {
  criar = () => { throw Error("não deveria criar cliente"); };
  assert.deepEqual(await gravarCamposDoCliente({ ...base, campos: [] }), { ok: true, atos: [] });
});
