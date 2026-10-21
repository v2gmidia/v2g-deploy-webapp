import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const fixture = JSON.parse(readFileSync("C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/tests/fixtures/e28_07_contrato_handoff.json", "utf8"));
const casos = fixture.cenarios;
const businessId = casos.vinculo_manual.business_id;
const execucaoId = casos.vinculo_manual.requisicao.id_execucao;
const operador = "33333333-3333-4333-8333-333333333333";
const dono = "44444444-4444-4444-8444-444444444444";
const base = casos.sucesso_com_dados.contrato;
const envelope = (c = base, extras = {}) => ({ business_id: businessId, desde: c.desde, ate: c.ate,
  investiu_centavos: 9999999, conversas: 9999999,
  por_execucao: [{ id_execucao: execucaoId, contrato_de_leitura: structuredClone(c), ...extras }] });
const mocks = {
  "server-only": "export {};",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__leituraSSR.cliente();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__leituraSSR.admin();",
};
const hook = registerHooks({
  resolve(s, c, next) {
    if (Object.hasOwn(mocks, s)) return { url: `ssr-mock:${s}`, shortCircuit: true };
    let url;
    if (s.startsWith("@/")) url = new URL(`../${s.slice(2)}`, import.meta.url);
    else if (s.startsWith(".") && c.parentURL?.startsWith("file:")) url = new URL(s, c.parentURL);
    if (url) {
      for (const sufixo of ["", ".ts", ".tsx"]) {
        const alvo = new URL(`${url.href}${sufixo}`);
        if (existsSync(alvo) && /\.(tsx?|css)$/.test(alvo.pathname)) return { url: alvo.href, shortCircuit: true };
      }
    }
    return next(s, c);
  },
  load(u, c, next) {
    if (u.startsWith("ssr-mock:")) return { format: "module", source: mocks[u.slice(9)], shortCircuit: true };
    if (u.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, {get:(_,k)=>String(k)});", shortCircuit: true };
    if (u.startsWith("file:") && /\.tsx?$/.test(u)) return { format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(u), "utf8"), { fileName: fileURLToPath(u),
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText };
    return next(u, c);
  },
});
let estado;
const fetchAnterior = globalThis.fetch;
// Credenciais fictícias apenas neste processo isolado; nenhum .env é carregado.
process.env.V2G_BACKEND_URL = "https://backend-ficticio.invalid";
process.env.V2G_BACKEND_TOKEN = "token-ficticio-ssr";
globalThis.fetch = async (url, opcoes) => {
  estado.rede.push(String(url));
  assert.equal(opcoes.method, "GET"); assert.equal(opcoes.cache, "no-store");
  assert.deepEqual(estado.ordem, ["sessao", "manager_accounts", "businesses"]);
  assert.equal(new URL(url).searchParams.get("profile_id"), dono);
  return new Response(JSON.stringify(estado.resposta), { status: estado.http, headers: { "Content-Type": "application/json" } });
};
globalThis.__leituraSSR = {
  cliente: () => ({ auth: { getUser: async () => {
    estado.ordem.push("sessao"); return { data: { user: estado.user }, error: null };
  } } }),
  admin: () => ({ from(tabela) {
    assert.ok(["manager_accounts", "businesses"].includes(tabela));
    estado.ordem.push(tabela);
    const filtros = {}; let colunas;
    const q = { select(c) { colunas = c; return q; }, eq(k, v) { filtros[k] = v; return q; },
      async maybeSingle() {
        const linha = tabela === "manager_accounts"
          ? { business_id: businessId, operator_profile_id: estado.atribuido ? operador : "outro" }
          : { id: businessId, profile_id: dono };
        const achou = Object.entries(filtros).every(([k, v]) => linha[k] === v);
        return { data: achou ? Object.fromEntries(colunas.split(",").map(k => [k.trim(), linha[k.trim()]])) : null, error: null };
      } };
    return q;
  } }),
};
const { LeituraDaConta } = await import("../components/gestor/leitura/LeituraDaConta.tsx");
const renderizar = async (c = base) => renderToStaticMarkup(await LeituraDaConta({ businessId, nome: "Fictício <teste>", desde: c.desde, ate: c.ate }));
const valor = (html, campo) => html.match(new RegExp(`data-campo="${campo}"[\\s\\S]*?<td[^>]*data-valor="([^"]+)"[^>]*>([\\s\\S]*?)</td>`))?.slice(1);
beforeEach(() => {
  process.env.V2G_MANAGER_METRICS_READ_ENABLED = "true";
  estado = { user: { id: operador, app_metadata: { papel: "operador" } }, atribuido: true,
    ordem: [], rede: [], http: 200, resposta: envelope() };
});
after(() => { globalThis.fetch = fetchAnterior; delete globalThis.__leituraSSR; hook.deregister(); });

test("consumidor real: flag ausente ou false não abre sessão nem backend", async () => {
  for (const flag of [undefined, "false"]) {
    if (flag === undefined) delete process.env.V2G_MANAGER_METRICS_READ_ENABLED;
    else process.env.V2G_MANAGER_METRICS_READ_ENABLED = flag;
    assert.equal(await renderizar(), "");
  }
  assert.deepEqual(estado.ordem, []); assert.deepEqual(estado.rede, []);
});
test("SSR: sessão ausente, cliente e agência não consultam carteira/rede", async () => {
  for (const user of [null, { id: operador, app_metadata: { papel: "cliente" } },
    { id: operador, app_metadata: { papel: "gestor_agencia" } }, { id: operador, user_metadata: { papel: "operador" } }]) {
    estado.user = user;
    const html = await renderizar(); assert.match(html, /Leitura não autorizada/);
    assert.doesNotMatch(html, /data-campo/);
  }
  assert.ok(estado.ordem.every(o => o === "sessao")); assert.deepEqual(estado.rede, []);
});
test("SSR: conta fora da atribuição é negada antes do backend", async () => {
  estado.atribuido = false; assert.match(await renderizar(), /Leitura não autorizada/);
  assert.deepEqual(estado.ordem, ["sessao", "manager_accounts"]); assert.deepEqual(estado.rede, []);
});
test("SSR: contrato ausente não usa agregados antigos nem valores inventados", async () => {
  delete estado.resposta.por_execucao[0].contrato_de_leitura;
  const html = await renderizar(); assert.match(html, /Contrato de leitura ausente ou incompatível/);
  assert.doesNotMatch(html, /data-campo|9999999/); assert.equal(estado.rede.length, 1);
});
for (const nome of ["sucesso_com_dados", "sem_dados", "zero_real", "parcial_desatualizado", "metricas_origem_heterogenea"]) {
  test(`consumidor real SSR + fixture canônica: ${nome}`, async () => {
    const c = casos[nome].contrato;
    estado.resposta = envelope(c, nome === "metricas_origem_heterogenea" ? { investiu_centavos: 1000, cliques: 99 } : {});
    const html = await renderizar(c);
    assert.match(html, /Fictício &lt;teste&gt;/); assert.match(html, /Período solicitado/);
    assert.match(html, /Fonte/); assert.match(html, /Última coleta/); assert.match(html, /UTC/);
    assert.equal(estado.rede.length, 1); assert.doesNotMatch(html, /9999999|saudável|vendas confirmadas/);
    if (nome === "sucesso_com_dados") {
      assert.deepEqual(valor(html, "cliquesTotais"), ["observado", "8"]);
      assert.deepEqual(valor(html, "cliquesNoLink"), ["ausente", "Não informado"]);
      assert.deepEqual(valor(html, "conversas"), ["ausente", "Não informado"]);
      assert.match(html, /Não confirma conversas nem vendas/);
    }
    if (nome === "sem_dados") {
      assert.match(html, /Ausência de dado não significa resultado zero/);
      assert.equal((html.match(/data-valor="ausente"/g) ?? []).length, 6);
    }
    if (nome === "zero_real") {
      assert.match(html, /Zero observado na coleta/);
      assert.deepEqual(valor(html, "cliquesTotais"), ["observado", "0"]);
      assert.deepEqual(valor(html, "investimentoCentavos"), ["ausente", "Não informado"]);
    }
    if (nome === "parcial_desatualizado") assert.match(html, /Leitura parcial ou desatualizada/);
    if (nome === "metricas_origem_heterogenea") {
      assert.match(html, /Os números foram retirados/);
      assert.equal((html.match(/data-valor="ausente"/g) ?? []).length, 6);
      assert.equal((html.match(/data-valor="observado"/g) ?? []).length, 0);
    }
  });
}
test("SSR: erro cru da resposta nunca chega à tela", async () => {
  estado.http = 500; estado.resposta = { detail: "detalhe-privado-proibido", token: "nao-expor" };
  const html = await renderizar(); assert.match(html, /Leitura indisponível/);
  assert.doesNotMatch(html, /detalhe-privado|nao-expor|data-campo/);
});
test("SSR: gasto só aparece quando fornecido no recorte validado, com moeda explícita", async () => {
  estado.resposta = envelope(base, { investiu_centavos: 12345, moeda: "BRL" });
  const html = await renderizar();
  assert.equal(valor(html, "investimentoCentavos")[0], "observado");
  assert.match(valor(html, "investimentoCentavos")[1], /R\$.*123,45/);
});
test("SSR: motivos e avisos livres do backend não viram texto de interface", async () => {
  const c = structuredClone(casos.metricas_origem_heterogenea.contrato);
  c.motivos_de_ausencia.totais = "detalhe-interno-nao-expor";
  c.motivos_de_ausencia.conversas = "outro-detalhe-interno";
  estado.resposta = envelope(c);
  const html = await renderizar(c);
  assert.match(html, /Valor retirado por inconsistência/);
  assert.doesNotMatch(html, /detalhe-interno|outro-detalhe/);
});
test("ligação em /gestor e /supergestor, seleção restrita e preview DEV sem adaptador de rede", () => {
  const pagina = readFileSync(new URL("../app/(protected)/gestor/page.tsx", import.meta.url), "utf8");
  assert.match(pagina, /leituraDisponivel && typeof parametros.metricas/);
  assert.match(pagina, /parametros.metricas && minhasContas.has\(l.id\)/);
  assert.match(pagina, /negocioDaLeitura && <Suspense/); assert.match(pagina, /<LeituraDaConta businessId=/);
  assert.match(pagina, /leituraDisponivel && minhasContas.has\(linha.id\)/);
  assert.match(readFileSync(new URL("../app/(supergestor)/supergestor/page.tsx", import.meta.url), "utf8"), /<GestorPage searchParams=/);
  const preview = readFileSync(new URL("../app/exemplo/mesa-gestor/PreviaLeitura.tsx", import.meta.url), "utf8");
  assert.match(preview, /process.env.NODE_ENV === "production"/);
  assert.doesNotMatch(preview, /lerMetricasDaCarteira|fetch\(/);
  assert.match(preview, /fixture canônica/);
});
