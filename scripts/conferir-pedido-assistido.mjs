import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import { validarConferenciaPix, validarPedidoAssistido } from "../lib/contratacao/pedido-assistido.ts";

const ref = "00000000-0000-4000-8000-000000000001";
function formulario(extra = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ref, email: "comprador@example.invalid",
    legalName: "Empresa fictícia", cnpj: "00000000000353", unitCount: "1", billingPeriod: "monthly",
    declaresCnpj: "yes", sellsByWhatsApp: "yes", vinculoLead: "atendimento_direto", ...extra }))
    form.set(key, value);
  return form;
}

test("atendimento direto funciona com vínculo LP ativo sem inventar lead", () => {
  const { dados, erro } = validarPedidoAssistido(formulario(), true);
  assert.equal(erro, undefined); assert.equal(dados.lead, null);
});

test("LP exige ID seguro e WhatsApp, mantendo dados para a conferência exata no banco", () => {
  const form = formulario({ vinculoLead: "v2g_site", sourceLeadId: "42", whatsapp: "(11) 99999-0000" });
  assert.deepEqual(validarPedidoAssistido(form, true).dados.lead, { id: 42, whatsapp: "11999990000" });
  for (const id of ["", "1e2", "0", "-1", "1.5", "9007199254740992"])
    assert.ok(validarPedidoAssistido(formulario({ vinculoLead: "v2g_site", sourceLeadId: id, whatsapp: "11999990000" }), true).erro);
  form.set("whatsapp", "123"); assert.ok(validarPedidoAssistido(form, true).erro);
});

test("origem omitida ou desconhecida e tentativa de descartar lead são recusadas", () => {
  for (const extra of [{ vinculoLead: "" }, { vinculoLead: "outra" }, { sourceLeadId: "42" }, { whatsapp: "11999990000" }])
    assert.ok(validarPedidoAssistido(formulario(extra), true).erro);
});

test("flag desligada preserva caminho legado, mas não aceita perder dados da LP", () => {
  assert.equal(validarPedidoAssistido(formulario({ vinculoLead: "" }), false).dados.lead, null);
  assert.ok(validarPedidoAssistido(formulario({ vinculoLead: "v2g_site", sourceLeadId: "42", whatsapp: "11999990000" }), false).erro);
  assert.ok(validarPedidoAssistido(formulario({ sourceLeadId: "42" }), false).erro);
});

test("CNPJ inválido é barrado antes do pedido, com a mesma regra do primeiro acesso", () => {
  for (const cnpj of ["00000000000000", "12345678901234", "00000000000354", "123"])
    assert.ok(validarPedidoAssistido(formulario({ cnpj }), true).erro);
  assert.equal(validarPedidoAssistido(formulario({ cnpj: "00.000.000/0003-53" }), true).erro, undefined);
});

test("limites, declarações e períodos seguem o Pix assistido existente", () => {
  for (const extra of [{ unitCount: "101" }, { unitCount: "0" }, { unitCount: "1.5" },
    { billingPeriod: "semiannual_upfront" }, { declaresCnpj: "no" }, { sellsByWhatsApp: "no" },
    { email: "x" }, { legalName: "x".repeat(201) }, { ref: "-".repeat(36) }])
    assert.ok(validarPedidoAssistido(formulario(extra), true).erro);
  assert.equal(validarPedidoAssistido(formulario({ billingPeriod: "annual_upfront", unitCount: "100" }), true).erro, undefined);
});

test("aprovação exige declaração explícita de conferência bancária, não só comprovante", () => {
  for (const value of ["", "true", "on", "no"])
    assert.ok(validarConferenciaPix(formulario({ pagamentoConferido: value })));
  assert.equal(validarConferenciaPix(formulario({ pagamentoConferido: "yes" })), null);
});

// Executa o corpo real das actions com adaptadores falsos; nenhuma rede ou .env.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../app/(protected)/pedidos/actions.ts", import.meta.url), "utf8");
function actions({ autorizado = true, retorno, falha = false, flag = true } = {}) {
  const calls = [];
  const module = { exports: {} };
  const api = {
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect(path) { throw new Error(`REDIRECT:${path}`); } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({
      data: { user: autorizado ? { id: "operador-ficticio", app_metadata: { papel: "operador" } } : null }, error: null,
    }) } }) },
    "@/lib/supabase/admin": { createAdminClient: () => ({ rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: retorno === undefined ? (name.startsWith("registrar_pedido") ? ref : true) : retorno,
        error: falha ? { message: "erro ficticio" } : null };
    } }) },
    "@/lib/contratacao/pedido-assistido": { validarConferenciaPix, validarPedidoAssistido },
    "@/lib/contratacao/ambiente-checkout": { checkoutSandboxSeguroNesteServidor: () => false },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports: module.exports, module,
    require: name => { assert.ok(name in api, `import inesperado: ${name}`); return api[name]; },
    process: { env: { V2G_LEAD_ORDER_LINK_ENABLED: String(flag) } },
    console: { error() {} }, FormData });
  return { ...module.exports, calls };
}

test("actions reais recusam usuário não operador antes de chamar banco", async () => {
  const api = actions({ autorizado: false });
  for (const action of [api.criarPedidoPixAction, api.registrarComprovantePixAction, api.aprovarPixAssistidoAction])
    assert.match((await action({}, formulario())).erro, /não autorizado/);
  assert.equal(api.calls.length, 0);
});

test("action real escolhe RPC direta ou LP sem desativar a flag global", async () => {
  for (const lp of [false, true]) {
    const api = actions();
    const form = lp ? formulario({ vinculoLead: "v2g_site", sourceLeadId: "42", whatsapp: "11999990000" }) : formulario();
    await assert.rejects(api.criarPedidoPixAction({}, form), /REDIRECT:\/pedidos\?registro=criado/);
    assert.equal(api.calls.length, 1);
    assert.equal(api.calls[0].name, lp ? "registrar_pedido_pix_assistido_com_lead" : "registrar_pedido_pix_assistido");
    assert.equal(api.calls[0].args.p_source_lead_id, lp ? 42 : undefined);
    assert.equal(api.calls[0].args.p_cnpj, "00000000000353");
  }
});

test("action real não aprova sem conferência; false, null e erro nunca viram êxito", async () => {
  const semConferencia = actions();
  assert.ok((await semConferencia.aprovarPixAssistidoAction({}, formulario({ orderId: ref }))).erro);
  assert.equal(semConferencia.calls.length, 0);
  for (const config of [{ retorno: false }, { retorno: null }, { falha: true }]) {
    const api = actions(config);
    const form = formulario({ orderId: ref, reference: "evidencia ficticia", pagamentoConferido: "yes" });
    assert.ok((await api.criarPedidoPixAction({}, form)).erro);
    assert.ok((await api.registrarComprovantePixAction({}, form)).erro);
    assert.ok((await api.aprovarPixAssistidoAction({}, form)).erro);
  }
  const api = actions();
  await assert.rejects(api.aprovarPixAssistidoAction({}, formulario({ orderId: ref, pagamentoConferido: "yes" })), /registro=aprovado/);
  assert.equal(api.calls.length, 1);
});

test("formulário renderiza as duas origens e não oferece aprovação por imagem isolada", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const formularioSource = readFileSync(new URL("../app/(protected)/pedidos/Formularios.tsx", import.meta.url), "utf8");
  for (const origem of ["", "atendimento_direto", "v2g_site"]) {
    const module = { exports: {} };
    const imports = {
      react: { ...React, useState: () => [origem, () => {}], useActionState: () => [{}, undefined, false] },
      "react/jsx-runtime": require("react/jsx-runtime"),
      "./actions": {},
    };
    vm.runInNewContext(ts.transpileModule(formularioSource, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText, { module, exports: module.exports,
      require: name => { assert.ok(name in imports); return imports[name]; } });
    const html = renderToStaticMarkup(React.createElement(module.exports.NovoPedidoPix, { referencia: ref, vinculoLeadAtivo: true }));
    assert.match(html, /name="vinculoLead"/);
    assert.match(html, /atendimento_direto/);
    assert.equal(html.includes('name="sourceLeadId"'), origem === "v2g_site");
    assert.equal(html.includes('name="whatsapp"'), origem === "v2g_site");
    const aprovacao = renderToStaticMarkup(React.createElement(module.exports.AprovarPix, { orderId: ref }));
    assert.match(aprovacao, /name="pagamentoConferido"/);
    assert.match(aprovacao, /crédito efetivo na conta recebedora/);
    assert.match(aprovacao, /não assina contrato, emite nota ou publica anúncio/);
    assert.doesNotMatch(aprovacao, /Aprovar acesso pelo comprovante/);
  }
});
