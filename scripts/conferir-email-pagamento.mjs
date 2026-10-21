import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { prepararEmailPagamento, despacharEmailPagamento } from '../lib/contratacao/email-pagamento.ts';
const pedido = { orderId: '00000000-0000-4000-8000-000000000001', email: 'comprador@example.invalid', negocio: 'Negocio ficticio',
  statusPedido: 'payment_approved', chargeId: 'pay_fake', customerId: 'cus_fake', subscriptionId: null, totalCentavos: 50000, primeiraCompra: true };
const pagamento = { id: 'pay_fake', customer: 'cus_fake', status: 'CONFIRMED', value: 500, subscription: null };
const site = 'https://v2g-webapp-qa.vercel.app';
test('confirmacao informa pagamento e acesso, sem nota fiscal ou senha inventada', () => {
  const mail = prepararEmailPagamento(pedido, pagamento, site);
  assert.deepEqual(mail.to, [pedido.email]); assert.match(mail.text, /500,00/);
  assert.match(mail.text, /nao é uma nota|não uma nota|não é uma nota/);
  assert.match(mail.text, /https:\/\/v2g-webapp-qa.vercel.app\/entrar/);
  assert.match(mail.text, /5521980351531/); assert.doesNotMatch(mail.text, /senha temporária/);
});
test('renovacao tem texto proprio e nao promete novo primeiro acesso', () => {
  const mail = prepararEmailPagamento({ ...pedido, primeiraCompra: false }, pagamento, site);
  assert.match(mail.text, /outro ciclo/); assert.doesNotMatch(mail.text, /criar seu primeiro acesso/);
});
test('cliente, cobranca, assinatura, valor, pagamento e URL precisam conferir', () => {
  for (const patch of [{ id: 'pay_outro' }, { customer: 'cus_outro' }, { subscription: 'sub_outro' },
    { value: 499.99 }, { value: 500.001 }, { value: NaN }, { status: 'PENDING' }, { status: 'REFUNDED' }, { deleted: true }])
    assert.equal(prepararEmailPagamento(pedido, { ...pagamento, ...patch }, site), null);
  assert.equal(prepararEmailPagamento({ ...pedido, statusPedido: 'proof_received' }, pagamento, site), null);
  for (const url of ['https://evil.example', 'http://v2g-webapp-qa.vercel.app', site + '/?next=evil', site + '/entrar', 'https://user@v2g-webapp-qa.vercel.app'])
    assert.equal(prepararEmailPagamento(pedido, pagamento, url), null);
});
test('duas entregas concorrentes reservam um unico envio', async () => {
  let reserved = false, sends = 0;
  const item = { id: 'email-id', status: 'queued', payload: { ...prepararEmailPagamento(pedido, pagamento, site), from: 'V2G <teste@example.invalid>' } };
  const deps = { reservar: async () => { if (reserved) return false; reserved = true; return true; },
    enviar: async (_payload, key) => { sends++; assert.equal(key, 'payment-confirmation/email-id'); return 'resend-id'; },
    registrar: async (status, id) => { assert.equal(status, 'accepted'); assert.equal(id, 'resend-id'); return true; } };
  const results = await Promise.all([despacharEmailPagamento(item, deps), despacharEmailPagamento(item, deps)]);
  assert.equal(sends, 1); assert.ok(results.includes('accepted')); assert.ok(results.includes('reserved_elsewhere'));
});
test('timeout e falha de registro nao permitem reenviar automaticamente', async () => {
  let sends = 0, stored;
  const item = { id: 'email-id', status: 'queued', payload: { ...prepararEmailPagamento(pedido, pagamento, site), from: 'V2G <teste@example.invalid>' } };
  const deps = { reservar: async () => true, enviar: async () => { sends++; throw Error('timeout'); },
    registrar: async status => { stored = status; return true; } };
  assert.equal(await despacharEmailPagamento(item, deps), 'review'); assert.equal(stored, 'review');
  for (const status of ['sending', 'review', 'accepted']) await despacharEmailPagamento({ ...item, status }, deps);
  assert.equal(sends, 1);
  assert.equal(await despacharEmailPagamento(item, { ...deps, enviar: async () => 'id-enviado', registrar: async () => false }), 'review');
});

const require = createRequire(import.meta.url), ts = require('typescript');
const source = readFileSync(new URL('../lib/contratacao/processar-email-pagamento.ts', import.meta.url), 'utf8');
function adaptador({ enabled = false, adverso = false, canonical = pagamento, flow = 'direct', sub = null, reserva = true } = {}) {
  const operations = []; let row = null, sends = 0;
  const data = { id: pedido.orderId, buyer_email: pedido.email, legal_name: pedido.negocio, status: pedido.statusPedido,
    total_cents: 50000, provider_customer_id: 'cus_fake', provider_charge_id: 'pay_fake', provider_subscription_id: sub,
    billing_period: 'monthly', provider_first_due_date: '2026-10-21', provider_card_flow: flow };
  const admin = { from(table) {
    operations.push(table); let mode = 'select';
    const q = { select: () => q, eq: () => q, in: async () => ({ count: adverso ? 1 : 0, error: null }),
      upsert: async body => { row ??= { id: 'email-id', status: 'queued', payload: body.payload }; return { error: null }; },
      update: values => { mode = 'update'; if (values.status !== 'sending' || reserva) Object.assign(row, values); return q; },
      maybeSingle: async () => ({ data: reserva ? { id: 'email-id' } : null, error: null }),
      single: async () => ({ data: table === 'commercial_orders' ? data : row, error: null }),
    }; return q;
  } };
  const modules = {
    'server-only': {}, './asaas-sandbox': { asaasSandbox: async () => ({ ok: true, body: canonical }) },
    './ambiente-checkout': { checkoutSandboxSeguroNesteServidor: () => true },
    './estado-pagamento-publico': { OCORRENCIAS_PUBLICAS: ['PAYMENT_REFUNDED'] },
    './email-pagamento': { prepararEmailPagamento, despacharEmailPagamento },
  };
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module: m, exports: m.exports, require: key => { assert.ok(key in modules); return modules[key]; },
      process: { env: { V2G_PAYMENT_EMAIL_ENABLED: String(enabled), V2G_PAYMENT_EMAIL_RESEND_API_KEY: 'ficticio',
        V2G_PAYMENT_EMAIL_FROM: 'teste@example.invalid', V2G_PAYMENT_EMAIL_QA_TO: 'victor.cabral@v2gmidia.com.br', NEXT_PUBLIC_SITE_URL: site } },
      Date, AbortSignal, JSON, console: { error() {} }, fetch: async (_url, opts) => {
        sends++; const body = JSON.parse(opts.body);
        assert.deepEqual(body.to, ['victor.cabral@v2gmidia.com.br']); assert.match(body.subject, /TESTE QA/);
        return new Response(JSON.stringify({ id: 'provider-id' }), { status: 200 });
      } });
  return { run: () => m.exports.processarEmailPagamento(admin, pedido.orderId, 'pay_fake'), operations,
    state: () => ({ row, sends }) };
}
test('flag desligada nao consulta banco nem envia; flag ligada percorre adaptador real com mocks', async () => {
  const off = adaptador(); assert.equal(await off.run(), true); assert.equal(off.operations.length, 0);
  const on = adaptador({ enabled: true }); assert.equal(await on.run(), true);
  assert.equal(on.state().row.status, 'accepted'); assert.equal(on.state().sends, 1);
  assert.equal(await on.run(), true); assert.equal(on.state().sends, 1);
});
test('estorno impede e-mail e avulsa 3DS inicial aceita assinatura posterior separada', async () => {
  const refund = adaptador({ enabled: true, adverso: true }); assert.equal(await refund.run(), true); assert.equal(refund.state().sends, 0);
  const flow = adaptador({ enabled: true, flow: 'initial_3ds', sub: 'sub_ja_criada' });
  assert.equal(await flow.run(), true); assert.equal(flow.state().sends, 1);
});
