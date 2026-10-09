import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cnpjTemDigitosValidos, validarCompra } from "../lib/contratacao/qualificacao.ts";
import { lerCheckoutPago } from "../lib/contratacao/checkout-evento.ts";
import { checkoutSandboxSeguro } from "../lib/contratacao/ambiente-checkout.ts";

const checkoutId = "131ca662-56c8-4479-b5b3-fd61a413fce7";
const referencia = "dcf4dff9-b080-425c-b234-765f2ffac0ae";
function formulario(extra = {}) {
  const dados = { referencia, nome: "Ana Silva", email: "ANA@EXEMPLO.COM",
    whatsapp: "(41) 99999-9999", razaoSocial: "Empresa da Ana Ltda",
    cnpj: "11.222.333/0001-81", contas: "2", periodo: "annual_upfront",
    metodo: "asaas_pix", vendeWhatsApp: "sim", ...extra };
  const form = new FormData();
  for (const [chave, valor] of Object.entries(dados)) form.set(chave, String(valor));
  return form;
}

test("qualificação exige nome completo, CNPJ válido e venda por WhatsApp", () => {
  assert.equal(validarCompra(formulario({ nome: "Ana" })).dados, undefined);
  assert.equal(validarCompra(formulario({ vendeWhatsApp: "nao" })).dados, undefined);
  assert.equal(validarCompra(formulario({ cnpj: "" })).dados, undefined);
  assert.equal(cnpjTemDigitosValidos("00000000000000"), false);
  assert.equal(validarCompra(formulario({ whatsapp: "123" })).dados, undefined);
  assert.equal(validarCompra(formulario({ contas: "0" })).dados, undefined);
  assert.equal(validarCompra(formulario({ periodo: "monthly", metodo: "asaas_pix" })).dados, undefined);
});

test("pedido anual multiplica por conta e preserva CNPJ e e-mail normalizados", () => {
  const { dados } = validarCompra(formulario());
  assert.equal(dados?.totalCentavos, 1_056_000);
  assert.equal(dados?.email, "ana@exemplo.com");
  assert.equal(dados?.cnpj, "11222333000181");
});

test("semestral à vista aplica 5% por conta e aceita Pix", () => {
  const { dados } = validarCompra(formulario({ periodo: "semiannual_upfront" }));
  assert.equal(dados?.totalCentavos, 570_000);
  assert.equal(dados?.metodo, "asaas_pix");
});

const evento = { id: "evt-checkout-1", event: "CHECKOUT_PAID",
  checkout: { id: checkoutId, status: "PAID", externalReference: referencia,
    customer: "cus-1", items: [{ name: "Gestão V2G", quantity: 2, value: 5280 }] } };
test("só checkout pago produz candidato a aprovação", () => {
  assert.equal(lerCheckoutPago(evento)?.totalCentavos, 1_056_000);
  assert.equal(lerCheckoutPago({ ...evento, event: "CHECKOUT_CREATED" }), null);
  assert.equal(lerCheckoutPago({ ...evento, checkout: { ...evento.checkout, status: "ACTIVE" } }), null);
  assert.equal(lerCheckoutPago({ ...evento, checkout: { ...evento.checkout, items: [] } }), null);
});

test("gravação e reenvio do webhook são protegidos pela transação SQL", () => {
  const sql = readFileSync(new URL("../supabase/migrations/0034_checkout_self_service.sql", import.meta.url), "utf8");
  assert.match(sql, /external_ref = p_ref/);
  assert.match(sql, /source = 'asaas' and external_event_id = p_event_id/);
  assert.match(sql, /for update/);
  assert.match(sql, /origin <> 'self_service'/);
  assert.match(sql, /provider_checkout_id <> p_checkout_id/);
  assert.match(sql, /semiannual_upfront.*then 285000/);
});

test("cadastro posterior confere CNPJ e pedido aprovado antes de criar usuário", () => {
  const action = readFileSync(new URL("../app/(public)/entrar/actions.ts", import.meta.url), "utf8");
  assert.match(action, /\.eq\("cnpj", cnpj\)/);
  assert.match(action, /\.eq\("status", "payment_approved"\)/);
  assert.ok(action.indexOf(".eq(\"status\", \"payment_approved\")") < action.indexOf("supabase.auth.signUp"));
});

test("sandbox jamais usa o banco real, mesmo com a flag de checkout ligada", () => {
  const base = { nodeEnv: "development", habilitado: "true", asaasAmbiente: "sandbox",
    supabaseUrl: "https://ushccxpoxjikzqnwhgfd.supabase.co", qaRef: "ushccxpoxjikzqnwhgfd" };
  assert.equal(checkoutSandboxSeguro(base), false);
  assert.equal(checkoutSandboxSeguro({ ...base, qaRef: "aaaaaaaaaaaaaaaaaaaa" }), false);
  assert.equal(checkoutSandboxSeguro({ ...base, nodeEnv: "production" }), false);
  assert.equal(checkoutSandboxSeguro({ ...base, supabaseUrl: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
    qaRef: "aaaaaaaaaaaaaaaaaaaa" }), true);
});
