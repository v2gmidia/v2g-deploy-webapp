import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { lerDispositivo3ds, callback3dsQa, urlDesafio3ds } from '../lib/contratacao/cartao-3ds.ts';
import { garantirAssinaturaApos3ds } from '../lib/contratacao/assinatura-apos-3ds.ts';
import { MIGRATIONS } from '../supabase/objetos.ts';
import { prioridadeDaCompra, filtrarCompras } from '../lib/gestor/compras.ts';

const base = { id: '00000000-0000-4000-8000-000000000001', status: 'payment_approved', total_cents: 50000,
  provider_card_flow: 'initial_3ds', provider_charge_id: 'pay_initial', provider_customer_id: 'cus_fake',
  provider_first_due_date: '2099-01-31', provider_subscription_id: null,
  subscription_creation_started_at: null, provider_subscription_first_due_date: null };
const payment = { id: base.provider_charge_id, customer: base.provider_customer_id, externalReference: base.id,
  billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 500, dueDate: base.provider_first_due_date,
  subscription: null, creditCard: { creditCardToken: 'token-ficticio-apenas-em-memoria' } };
const sub = { id: 'sub_fake', customer: base.provider_customer_id, externalReference: base.id,
  billingType: 'CREDIT_CARD', cycle: 'MONTHLY', value: 500, nextDueDate: '2099-02-28', status: 'ACTIVE', deleted: false };
function deps(overrides = {}) {
  const calls = [];
  let locked = false;
  return { calls,
    lerCobranca: async () => payment,
    lerIpPagador: async () => '203.0.113.1',
    buscarAssinaturas: async () => [],
    semOcorrencias: async () => true,
    reservar: async due => { calls.push(['reservar', due]); if (locked) return false; locked = true; return true; },
    criar: async body => { calls.push(['criar', body]); return sub; },
    salvar: async (id, due) => { calls.push(['salvar', id, due]); return true; }, ...overrides };
}
test('dispositivo valida fuso em horas e usa IP e agente fornecidos pelo servidor', () => {
  const raw = { colorDepth: 24, screenHeight: 900, screenWidth: 1440, timeZoneOffset: 3, language: 'pt-BR', remoteIp: 'forjado', userAgent: 'forjado' };
  const result = lerDispositivo3ds(JSON.stringify(raw), '203.0.113.1', 'browser-observado');
  assert.equal(result.remoteIp, '203.0.113.1');
  assert.equal(result.userAgent, 'browser-observado');
  assert.equal(result.timeZoneOffset, 3);
  for (const patch of [{ timeZoneOffset: 180 }, { screenWidth: -1 }, { colorDepth: 99 }, { language: '<script>' }])
    assert.equal(lerDispositivo3ds(JSON.stringify({ ...raw, ...patch }), '203.0.113.1', 'browser'), null);
  assert.equal(lerDispositivo3ds('x'.repeat(2001), '203.0.113.1', 'browser'), null);
});
test('desafio exige HTTPS do provedor sem destino local, IP, credencial ou URL fornecida pelo pagador', () => {
  assert.equal(urlDesafio3ds('https://emissor.example.com/challenge?token=ficticio'), 'https://emissor.example.com/challenge?token=ficticio');
  for (const url of ['javascript:alert(1)', 'http://bank.com', 'https://127.0.0.1/x', 'https://localhost/x',
    'https://foo.local/x', 'https://user:pass@bank.com/x', 'https://bank.com:8080/x', '//bank.com', 'https://bank.com\\@evil.com'])
    assert.equal(urlDesafio3ds(url), null);
  assert.equal(callback3dsQa(base.id), `https://v2g-webapp-qa.vercel.app/contratar/pagamento?ref=${base.id}`);
});
test('cria assinatura so apos confirmacao e com inicio no mes seguinte, sem cartao completo', async () => {
  const d = deps();
  assert.equal(await garantirAssinaturaApos3ds(base, d, '2099-01-31'), true);
  const body = d.calls.find(c => c[0] === 'criar')[1];
  assert.equal(body.nextDueDate, '2099-02-28');
  assert.equal(body.externalReference, base.id);
  assert.ok(body.creditCardToken);
  assert.equal(body.remoteIp, '203.0.113.1');
  assert.equal(body.creditCard, undefined);
  assert.equal(body.creditCardHolderInfo, undefined);
  assert.deepEqual(d.calls.map(c => c[0]), ['reservar', 'criar', 'salvar']);
});
test('callback ou pedido pendente nao cria assinatura', async () => {
  const d = deps();
  assert.equal(await garantirAssinaturaApos3ds({ ...base, status: 'awaiting_payment' }, d, '2099-01-31'), false);
  assert.equal(d.calls.length, 0);
});
test('pagamento, cliente, valor, data, origem e status precisam coincidir com a consulta canonica', async () => {
  for (const change of [{ status: 'PENDING' }, { status: 'RECEIVED' }, { customer: 'cus_outro' },
    { id: 'pay_outro' }, { value: 501 }, { externalReference: 'outro' }, { deleted: true },
    { dueDate: '2099-02-01' }, { subscription: 'sub_outro' }]) {
    const d = deps({ lerCobranca: async () => ({ ...payment, ...change }) });
    assert.equal(await garantirAssinaturaApos3ds(base, d, '2099-01-31'), false);
    assert.equal(d.calls.length, 0);
  }
});
test('token ausente, estorno/contestacao e vencimento passado bloqueiam nova recorrencia', async () => {
  for (const [d, hoje] of [
    [deps({ lerCobranca: async () => ({ ...payment, creditCard: null }) }), '2099-01-31'],
    [deps({ semOcorrencias: async () => false }), '2099-01-31'], [deps(), '2099-02-28'],
    [deps({ lerIpPagador: async () => null }), '2099-01-31'],
  ]) {
    assert.equal(await garantirAssinaturaApos3ds(base, d, hoje), false);
    assert.equal(d.calls.length, 0);
  }
});
test('duas entregas concorrentes fazem apenas um POST ao provedor', async () => {
  const d = deps();
  const results = await Promise.all([garantirAssinaturaApos3ds(base, d, '2099-01-31'), garantirAssinaturaApos3ds(base, d, '2099-01-31')]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(d.calls.filter(c => c[0] === 'criar').length, 1);
});
test('timeout e reserva anterior nao repetem POST; reconciliacao recupera uma assinatura compativel', async () => {
  const pending = { ...base, subscription_creation_started_at: '2099-01-31T12:00:00Z' };
  const d = deps();
  assert.equal(await garantirAssinaturaApos3ds(pending, d, '2099-01-31'), false);
  assert.equal(d.calls.length, 0);
  const found = deps({ buscarAssinaturas: async () => [sub] });
  assert.equal(await garantirAssinaturaApos3ds(pending, found, '2099-01-31'), true);
  assert.deepEqual(found.calls, [['salvar', 'sub_fake', '2099-02-28']]);
  const timeout = deps({ criar: async () => null });
  assert.equal(await garantirAssinaturaApos3ds(base, timeout, '2099-01-31'), false);
  assert.equal(timeout.calls.filter(c => c[0] === 'salvar').length, 0);
});
test('assinatura divergente ou duplicada exige conciliacao e nao e vinculada', async () => {
  const pending = { ...base, subscription_creation_started_at: '2099-01-31T12:00:00Z' };
  for (const list of [[sub, sub], [{ ...sub, value: 501 }], [{ ...sub, nextDueDate: '2099-01-31' }], [{ ...sub, deleted: true }]]) {
    const d = deps({ buscarAssinaturas: async () => list });
    assert.equal(await garantirAssinaturaApos3ds(pending, d, '2099-01-31'), false);
    assert.equal(d.calls.length, 0);
  }
});
test('assinatura ja vinculada com data correta nao gera nova chamada externa', async () => {
  const d = deps();
  assert.equal(await garantirAssinaturaApos3ds({ ...base, provider_subscription_id: 'sub_fake', provider_subscription_first_due_date: '2099-02-28' }, d, '2099-01-31'), true);
  assert.equal(d.calls.length, 0);
});
test('operador ve recorrencia pendente mesmo com perfil ja vinculado', () => {
  const row = { ...base, buyer_profile_id: 'perfil-ficticio', buyer_email: 'qa@example.invalid',
    legal_name: 'QA Ficticio', cnpj: '00000000000191', created_at: '2099-01-31T12:00:00Z' };
  assert.equal(prioridadeDaCompra(row), 1);
  assert.equal(filtrarCompras([row], '', 'atencao').length, 1);
  assert.equal(filtrarCompras([{ ...row, provider_subscription_id: 'sub_fake' }], '', 'atencao').length, 0);
});
test('todos os arquivos de migration tem manifesto, sem fingir aplicacao no banco', () => {
  const files = readdirSync(new URL('../supabase/migrations/', import.meta.url)).filter(f => f.endsWith('.sql')).sort();
  assert.deepEqual(MIGRATIONS.map(m => m.arquivo).sort(), files);
});
test('integracao liga formulario, cobranca avulsa, persistencia e webhook sem permitir producao', () => {
  const source = readFileSync(new URL('../lib/contratacao/iniciar-pagamento.ts', import.meta.url), 'utf8');
  const form = readFileSync(new URL('../app/contratar/pagamento/PagamentoFormulario.tsx', import.meta.url), 'utf8');
  const webhook = readFileSync(new URL('../app/api/webhooks/asaas-payment/route.ts', import.meta.url), 'utf8');
  assert.match(source, /checkoutSandboxSeguroNesteServidor\(\)/);
  assert.match(source, /V2G_CHECKOUT_3DS_SCHEMA_ENABLED/);
  assert.match(source, /V2G_CHECKOUT_3DS_ENABLED/);
  assert.match(source, /threeDSecure: \{ callbackUrl: callback3dsQa\(referencia\) \}/);
  assert.match(form, /getTimezoneOffset\(\) \/ 60/);
  assert.match(webhook, /registrar_evento_inicial_3ds/);
  assert.match(webhook, /processarAssinatura3ds\(admin, pedido.id\)/);
  assert.ok(source.indexOf('if (erroSalvar || !salvo)') < source.indexOf('redirect(desafio)'));
});
