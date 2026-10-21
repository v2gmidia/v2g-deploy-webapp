import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";

const mocks = {
  "server-only": "export {};",
  "@/lib/identidade/regras": "export const MAXIMO_DE_FOTOS = 10;",
  "@/lib/multiconta/ativo": "export const negocioAtivoDaSessao = async () => globalThis.__marcaOffline.ativo();",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__marcaOffline.cliente();",
};
const fetchAntes = globalThis.fetch;
globalThis.fetch = () => { throw Error("Rede proibida neste teste offline"); };
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mocks, specifier)) return { url: `offline:${specifier}`, shortCircuit: true };
    if (specifier === "@/lib/onboarding/marca")
      return { url: new URL("../lib/onboarding/marca.ts", import.meta.url).href, shortCircuit: true };
    if (specifier.startsWith("node:")) return nextResolve(specifier, context);
    if (specifier === "./selecionar-marca") return { url: "offline:tipo-marca", shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("offline:")) return {
      format: "module", source: mocks[url.slice(8)] ?? "export {};", shortCircuit: true,
    };
    return nextLoad(url, context);
  },
});
const { carregarMarcaDaSessao } = await import("../lib/criativos/carregar-marca-da-sessao.ts");
after(() => { hooks.deregister(); globalThis.fetch = fetchAntes; delete globalThis.__marcaOffline; });

const id = "negocio-a";
const logo = { id: "logo-1", business_id: id, uso: "logo",
  storage_path: `identidade/${id}/logo.png`, created_at: "2026-10-20T00:00:00Z",
  arquivado_em: null, copy: {} };
let estado;
beforeEach(() => {
  estado = { ativo: { status: "selecionado", negocio: { id } }, linhas: [logo], erro: null,
    negocio: { id, onboarding: { marca: { coresConfirmadas: ["#112233", "#AABBCC"],
      em: "2026-10-20T00:00:00Z", aparenciaNaoSei: false } } }, erroNegocio: null,
    consultas: 0, assinatura: 0 };
});
globalThis.__marcaOffline = {
  ativo: () => estado.ativo,
  cliente: () => ({
    from(tabela) {
      estado.consultas++;
      if (tabela === "businesses") {
        const consulta = {
          select(colunas) { assert.equal(colunas, "id, onboarding"); return consulta; },
          eq(coluna, valor) { assert.equal(coluna, "id"); assert.equal(valor, id); return consulta; },
          maybeSingle() { return { data: estado.negocio, error: estado.erroNegocio }; },
        };
        return consulta;
      }
      assert.equal(tabela, "creatives");
      const consulta = {
        select(colunas) {
          assert.equal(colunas, "id, business_id, uso, storage_path, created_at, arquivado_em, copy");
          return consulta;
        },
        eq(coluna, valor) { assert.equal(coluna, "business_id"); assert.equal(valor, id); return consulta; },
        in(coluna, valores) { assert.equal(coluna, "uso"); assert.deepEqual(valores, ["logo", "identidade"]); return consulta; },
        is(coluna, valor) { assert.equal(coluna, "arquivado_em"); assert.equal(valor, null); return consulta; },
        order(coluna) { assert.equal(coluna, "created_at"); return consulta; },
        limit(valor) { assert.equal(valor, 12); return { data: estado.linhas, error: estado.erro }; },
      };
      return consulta;
    },
  }),
};

test("negócio ativo carrega somente metadados filtrados, sem URL assinada", async () => {
  const resultado = await carregarMarcaDaSessao(id);
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.linhas, [logo]);
  assert.deepEqual(resultado.coresConfirmadas, { valor: "#112233, #AABBCC",
    origem: "onboarding.marca.coresConfirmadas", registradoEm: "2026-10-20T00:00:00Z",
    estado: "confirmado_cliente" });
  assert.equal(estado.consultas, 2);
  assert.equal(JSON.stringify(resultado).includes("signedUrl"), false);
});

test("ID de outro negócio e ausência de sessão não chegam à consulta", async () => {
  assert.deepEqual(await carregarMarcaDaSessao("negocio-b"),
    { ok: false, motivo: "negocio_nao_autorizado" });
  estado.ativo = { status: "sem_sessao" };
  assert.deepEqual(await carregarMarcaDaSessao(id),
    { ok: false, motivo: "negocio_nao_autorizado" });
  assert.equal(estado.consultas, 0);
});

test("falha de leitura e resultado truncado fecham acesso", async () => {
  estado.erro = { message: "falha" };
  assert.deepEqual(await carregarMarcaDaSessao(id), { ok: false, motivo: "consulta_falhou" });
  estado.erro = null;
  estado.linhas = Array.from({ length: 12 }, (_, i) => ({ ...logo, id: `logo-${i}` }));
  assert.deepEqual(await carregarMarcaDaSessao(id), { ok: false, motivo: "resultado_incompleto" });
});

test("coluna ausente, linha de outro negócio ou arquivada não são usadas", async () => {
  for (const linha of [
    { ...logo, copy: undefined },
    { ...logo, business_id: "negocio-b" },
    { ...logo, storage_path: "identidade/negocio-b/logo.png" },
    { ...logo, arquivado_em: "2026-10-20T01:00:00Z" },
  ]) {
    estado.linhas = [linha];
    assert.deepEqual(await carregarMarcaDaSessao(id), { ok: false, motivo: "resultado_incompleto" });
  }
});

test("cor sem confirmação íntegra continua pendente, nunca inferida do logo", async () => {
  for (const marca of [
    { coresConfirmadas: [], em: "2026-10-20T00:00:00Z" },
    { coresConfirmadas: ["#112233"], em: "data-invalida" },
    { coresConfirmadas: ["#112233", "cor-invalida"], em: "2026-10-20T00:00:00Z" },
    { coresConfirmadas: ["#112233"], em: "2026-10-20T00:00:00Z", aparenciaNaoSei: true },
  ]) {
    estado.negocio = { id, onboarding: { marca } };
    const resultado = await carregarMarcaDaSessao(id);
    assert.equal(resultado.ok, true);
    assert.equal(resultado.coresConfirmadas, null);
  }
});

test("falha, negócio trocado ou coluna ausente não produzem cor", async () => {
  estado.erroNegocio = { message: "falha" };
  assert.deepEqual(await carregarMarcaDaSessao(id), { ok: false, motivo: "consulta_falhou" });
  estado.erroNegocio = null;
  for (const negocio of [{ id: "outro", onboarding: {} }, { id }]) {
    estado.negocio = negocio;
    assert.deepEqual(await carregarMarcaDaSessao(id), { ok: false, motivo: "resultado_incompleto" });
  }
});
