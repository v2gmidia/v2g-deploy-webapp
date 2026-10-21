import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";
import { hojeEmSaoPaulo, validarIntencaoDoEnvio, lerIntencaoDoEnvio,
  mesmaIntencaoDoEnvio, resumoDaIntencao, impedimentoParaAprovarEnvio } from "../lib/criativos/intencao-envio.ts";

const base = { objetivo: "whatsapp_messages", promocao: false, validade: null, confirmado: true };
const intencao = { version: 1, objective: "whatsapp_messages", promotionEndsOn: null, confirmedAt: "2026-10-21T03:00:00.000Z" };
test("só os dois objetivos fechados e confirmação explícita são aceitos", () => {
  for (const objetivo of ["whatsapp_messages", "instagram_visits"])
    assert.equal(validarIntencaoDoEnvio({ ...base, objetivo }, "2026-10-21").ok, true);
  for (const objetivo of ["vender", "", null, {}, ["whatsapp_messages"]])
    assert.equal(validarIntencaoDoEnvio({ ...base, objetivo }, "2026-10-21").ok, false);
  assert.equal(validarIntencaoDoEnvio({ ...base, confirmado: false }, "2026-10-21").ok, false);
});
test("promoção exige data real e não vencida; sem prazo não inventa validade", () => {
  for (const validade of ["2026-02-30", "2026-13-01", "2026-10-20", "", null, "2026-10-21T00:00Z"])
    assert.equal(validarIntencaoDoEnvio({ ...base, promocao: true, validade }, "2026-10-21").ok, false);
  assert.equal(validarIntencaoDoEnvio({ ...base, promocao: true, validade: "2026-10-21" }, "2026-10-21").ok, true);
  assert.equal(validarIntencaoDoEnvio({ ...base, validade: "2026-10-22" }, "2026-10-21").ok, false);
});
test("dia da validade é inclusivo em São Paulo, não em UTC", () => {
  assert.equal(hojeEmSaoPaulo(new Date("2026-10-22T01:30:00Z")), "2026-10-21");
  assert.equal(hojeEmSaoPaulo(new Date("2026-10-22T03:00:00Z")), "2026-10-22");
});
test("legado não é confundido com metadado incompleto ou novo objetivo presumido", () => {
  assert.match(resumoDaIntencao(null, "2026-10-21"), /envio antigo/);
  assert.match(resumoDaIntencao(undefined, "2026-10-21"), /inconsistentes/);
  for (const valor of [{}, [], { ...intencao, version: 2 }, { ...intencao, confirmado: true },
    { ...intencao, promotionEndsOn: "2026-02-30" }, { ...intencao, confirmedAt: "ontem" }])
    assert.equal(lerIntencaoDoEnvio(valor), null);
});
test("replay preserva confirmação original e compara objetivo/prazo", () => {
  assert.equal(mesmaIntencaoDoEnvio(intencao, { ...intencao, confirmedAt: "2026-10-22T03:00:00.000Z" }), true);
  assert.equal(mesmaIntencaoDoEnvio(intencao, { ...intencao, objective: "instagram_visits" }), false);
  assert.equal(mesmaIntencaoDoEnvio(null, intencao), false);
});
test("histórico vencido continua legível, mas não autoriza aprovação", () => {
  const oferta = { ...intencao, promotionEndsOn: "2026-10-21" };
  assert.equal(impedimentoParaAprovarEnvio(oferta, "2026-10-21"), null);
  assert.match(impedimentoParaAprovarEnvio(oferta, "2026-10-22"), /terminou/);
  assert.match(resumoDaIntencao(oferta, "2026-10-22"), /21\/10\/2026 — prazo encerrado/);
  assert.match(impedimentoParaAprovarEnvio(undefined, "2026-10-22"), /Confira/);
});

// Executa as actions reais com portas de sessão/Storage/banco substituídas.
// Nenhuma rede, credencial, imagem privada ou provedor pago participa.
const flags = ["V2G_CREATIVE_REVIEW_ENABLED", "V2G_MANAGER_WORK_ENABLED", "V2G_CREATIVE_AUTO_ANALYSIS_ENABLED"];
const anteriores = flags.map((nome) => process.env[nome]);
const fetchAnterior = globalThis.fetch;
const mocks = {
  "next/cache": "export const revalidatePath = p => globalThis.__envioOffline.revalidacoes.push(p);",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__envioOffline.cliente();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__envioOffline.admin();",
  "@/lib/multiconta/ativo": "export const negocioAtivoDaSessao = async () => globalThis.__envioOffline.ativo();",
  "@/lib/estado/cliente": "export const estadoDoCliente = async () => { throw Error('análise deve permanecer desligada'); };",
  "@/lib/gestor/sincronizar-revisao": "export const sincronizarTarefaDeRevisao = async () => { globalThis.__envioOffline.tarefas++; };",
};
const arquivos = {
  "@/lib/criativos/intencao-envio": "../lib/criativos/intencao-envio.ts",
  "@/lib/criativos/revisao": "../lib/criativos/revisao.ts",
};
const hooks = registerHooks({
  resolve(s, c, next) {
    if (Object.hasOwn(mocks, s)) return { url: `envio-offline:${s}`, shortCircuit: true };
    if (Object.hasOwn(arquivos, s)) return { url: new URL(arquivos[s], import.meta.url).href, shortCircuit: true };
    return next(s, c);
  },
  load(u, c, next) {
    if (u.startsWith("envio-offline:")) return { format: "module", source: mocks[u.slice(14)], shortCircuit: true };
    return next(u, c);
  },
});
globalThis.fetch = () => { throw Error("Rede proibida neste ensaio"); };
const { solicitarRevisaoAction } = await import("../app/(protected)/criativos/revisao-actions.ts");
const { revisarPecaAction } = await import("../app/(protected)/gestor/criativos/actions.ts");
after(() => {
  hooks.deregister(); globalThis.fetch = fetchAnterior; delete globalThis.__envioOffline;
  flags.forEach((nome, i) => { if (anteriores[i] === undefined) delete process.env[nome]; else process.env[nome] = anteriores[i]; });
});
const negocio = "12345678-1234-4234-8234-123456789012";
const perfil = "22345678-1234-4234-8234-123456789012";
const id = "32345678-1234-4234-8234-123456789012";
let estado;
beforeEach(() => {
  process.env.V2G_CREATIVE_REVIEW_ENABLED = "true";
  process.env.V2G_MANAGER_WORK_ENABLED = "true";
  process.env.V2G_CREATIVE_AUTO_ANALYSIS_ENABLED = "false";
  estado = { linhas: [], bytes: new Map(), perfil, negocio, papel: "operador", consultas: 0,
    insercoes: 0, uploads: 0, tarefas: 0, revalidacoes: [], falhaBanco: false, falhaUpload: false, responsavel: perfil };
});
globalThis.__envioOffline = {
  get revalidacoes() { return estado.revalidacoes; },
  get tarefas() { return estado.tarefas; }, set tarefas(n) { estado.tarefas = n; },
  ativo: () => ({ status: "selecionado", negocio: { id: estado.negocio } }),
  cliente: () => ({ auth: { getUser: async () => ({ data: { user: estado.perfil ?
    { id: estado.perfil, app_metadata: { papel: estado.papel } } : null }, error: null }) } }),
  admin: () => ({
    from(tabela) {
      estado.consultas++;
      assert.ok(["creative_review_requests", "manager_accounts"].includes(tabela));
      let alteracao, colunas;
      const filtros = {};
      const consulta = {
        select(c) { colunas = c; return consulta; },
        eq(k, v) { filtros[k] = v; return consulta; },
        update(v) { alteracao = v; return consulta; },
        async maybeSingle() { return executar(); },
        then(resolve, reject) { return Promise.resolve(executar()).then(resolve, reject); },
        async insert(linha) {
          if (estado.falhaBanco) return { error: { message: "segredo-nao-exibir" } };
          if (estado.linhas.some((l) => l.id === linha.id)) return { error: { code: "23505" } };
          estado.insercoes++;
          estado.linhas.push({ ...structuredClone(linha), updated_at: new Date().toISOString() });
          return { error: null };
        },
      };
      function executar() {
        if (estado.falhaBanco) return { data: null, error: { message: "segredo-nao-exibir" } };
        if (tabela === "manager_accounts") return { data: { operator_profile_id: estado.responsavel }, error: null };
        const linha = estado.linhas.find((l) => Object.entries(filtros).every(([k, v]) => l[k] === v));
        if (linha && alteracao) Object.assign(linha, alteracao);
        return { data: linha ? Object.fromEntries(colunas.split(",").map((c) => [c.trim(), structuredClone(linha[c.trim()])])) : null, error: null };
      }
      return consulta;
    },
    storage: { from(bucket) { assert.equal(bucket, "creative-review"); return {
      async upload(caminho, bytes, opcoes) {
        estado.uploads++;
        assert.equal(opcoes.upsert, true);
        if (estado.falhaUpload) return { error: {} };
        estado.bytes.set(caminho, new Uint8Array(bytes)); return { error: null };
      },
      async download(caminho) { return { data: estado.bytes.get(caminho) ?? null, error: null }; },
    }; } },
  }),
};
function formulario(extra = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ submissaoId: id, businessId: negocio,
    objetivo: "whatsapp_messages", promocao: "nao", validade: "", confirmado: "sim", ...extra })) f.set(k, v);
  f.set("arquivo", new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "fixture.png", { type: "image/png" }));
  return f;
}
test("action grava arquivo privado e intenção; replay mantém uma peça e confirmação original", async () => {
  assert.deepEqual(await solicitarRevisaoAction(formulario()), { ok: true, id, repetido: false, analisarAgora: false });
  const salvo = structuredClone(estado.linhas[0]);
  assert.equal(salvo.upload_intent.objective, "whatsapp_messages");
  assert.equal(salvo.upload_intent.promotionEndsOn, null);
  assert.equal(salvo.submitted_by, perfil);
  assert.equal(salvo.status, "awaiting_review");
  assert.ok(estado.bytes.has(`${negocio}/${id}`));
  assert.equal((await solicitarRevisaoAction(formulario())).repetido, true);
  assert.equal(estado.insercoes, 1); assert.equal(estado.uploads, 1);
  assert.deepEqual(estado.linhas[0].upload_intent, salvo.upload_intent);
  assert.ok(estado.revalidacoes.includes("/criativos"));
});
test("replay com outro objetivo não troca intenção nem arquivo", async () => {
  await solicitarRevisaoAction(formulario());
  assert.equal((await solicitarRevisaoAction(formulario({ objetivo: "instagram_visits" }))).ok, false);
  assert.equal(estado.uploads, 1); assert.equal(estado.linhas[0].upload_intent.objective, "whatsapp_messages");
});
test("promoção persiste o prazo e não pode ser alterada no replay", async () => {
  const f = formulario({ promocao: "sim", validade: "2099-10-28" });
  assert.equal((await solicitarRevisaoAction(f)).ok, true);
  assert.equal(estado.linhas[0].upload_intent.promotionEndsOn, "2099-10-28");
  assert.equal((await solicitarRevisaoAction(formulario({ promocao: "sim", validade: "2099-10-29" }))).ok, false);
  assert.equal(estado.uploads, 1);
});
test("mesmo id com outro perfil ou arquivo não sobrescreve o original", async () => {
  await solicitarRevisaoAction(formulario());
  estado.perfil = "outro-perfil";
  assert.equal((await solicitarRevisaoAction(formulario())).ok, false);
  estado.perfil = perfil;
  const f = formulario();
  f.set("arquivo", new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1])], "alterado.png", { type: "image/png" }));
  assert.equal((await solicitarRevisaoAction(f)).ok, false);
  assert.equal(estado.uploads, 1);
});
test("arquivo de outro tipo disfarçado não chega ao Storage", async () => {
  const f = formulario();
  f.set("arquivo", new File(["%PDF-1.7"], "imagem.png", { type: "image/png" }));
  assert.equal((await solicitarRevisaoAction(f)).ok, false);
  assert.equal(estado.uploads, 0); assert.equal(estado.insercoes, 0);
});
test("sem sessão, aba de outro negócio e confirmação ausente não escrevem", async () => {
  estado.perfil = null;
  assert.equal((await solicitarRevisaoAction(formulario())).ok, false);
  estado.perfil = perfil; estado.negocio = "outro";
  assert.equal((await solicitarRevisaoAction(formulario())).ok, false);
  estado.negocio = negocio;
  assert.equal((await solicitarRevisaoAction(formulario({ confirmado: "nao" }))).ok, false);
  assert.equal(estado.consultas, 0); assert.equal(estado.uploads, 0);
});
test("coluna/banco indisponível não degrada para envio sem intenção nem vaza erro", async () => {
  estado.falhaBanco = true;
  const r = await solicitarRevisaoAction(formulario());
  assert.equal(r.ok, false); assert.doesNotMatch(r.recado, /segredo/);
  assert.equal(estado.uploads, 0); assert.equal(estado.insercoes, 0);
});
test("falha parcial de Storage retoma mesmo id, arquivo e intenção", async () => {
  estado.falhaUpload = true;
  assert.equal((await solicitarRevisaoAction(formulario())).ok, false);
  assert.equal(estado.linhas[0].status, "upload_failed");
  estado.falhaUpload = false;
  assert.equal((await solicitarRevisaoAction(formulario())).ok, true);
  assert.equal(estado.insercoes, 1); assert.equal(estado.linhas[0].status, "awaiting_review");
});
test("aprovação interna recusa prazo vencido, mas permite solicitar ajustes", async () => {
  await solicitarRevisaoAction(formulario());
  estado.linhas[0].upload_intent.promotionEndsOn = "2020-01-01";
  const f = new FormData(); f.set("id", id); f.set("decisao", "approved_for_manual_publish"); f.set("nota", "");
  assert.match((await revisarPecaAction({}, f)).erro, /terminou/);
  assert.equal(estado.linhas[0].status, "awaiting_review");
  f.set("decisao", "changes_requested"); f.set("nota", "Atualizar a validade da promoção.");
  assert.ok((await revisarPecaAction({}, f)).ok);
  assert.equal(estado.linhas[0].status, "changes_requested");
});
test("outro gestor e papel de cliente não conseguem decidir a revisão", async () => {
  await solicitarRevisaoAction(formulario());
  const f = new FormData(); f.set("id", id); f.set("decisao", "approved_for_manual_publish"); f.set("nota", "");
  estado.responsavel = "outro";
  assert.match((await revisarPecaAction({}, f)).erro, /responsável/);
  estado.papel = "cliente";
  assert.match((await revisarPecaAction({}, f)).erro, /não autorizado/);
  assert.equal(estado.linhas[0].status, "awaiting_review");
});
