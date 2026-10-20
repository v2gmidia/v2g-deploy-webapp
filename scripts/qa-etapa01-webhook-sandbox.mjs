/** Webhook QA e estorno do unico pagamento ficticio autorizado nesta rodada. */
import assert from 'node:assert/strict';
import { EVENTOS_FINANCEIROS } from '../lib/contratacao/evento-financeiro.ts';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const paymentId = 'pay_hhcjxx7c3ytmt48x';
const orderId = '809717c6-1b88-4b97-bacb-e118f2623f2d';
async function call(path, method = 'GET', body) {
  const response = await fetch('https://api-sandbox.asaas.com/v3' + path, {
    method, headers: { access_token: process.env.ASAAS_API_KEY,
      'User-Agent': 'V2G-QA-Etapa01/1.0', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    console.log(JSON.stringify({ path, method, http: response.status, ok: false }));
    throw new Error('Operacao Asaas sem confirmacao; conciliar antes de repetir.');
  }
  return response.json();
}
const webhooks = await call('/webhooks?limit=100');
const target = webhooks.data.filter(w => w.url === 'https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment');
assert.equal(target.length, 1, 'Exige um unico webhook permanente QA');
let webhook = target[0];
console.log(JSON.stringify({ webhook: { id: webhook.id, name: webhook.name, url: webhook.url,
  enabled: webhook.enabled, interrupted: webhook.interrupted, events: webhook.events } }, null, 2));
if (process.argv.includes('--configurar-webhook')) {
  const events = [...new Set([...webhook.events, ...EVENTOS_FINANCEIROS])];
  if (events.length !== webhook.events.length) {
    await call('/webhooks/' + webhook.id, 'PUT', { events });
    webhook = await call('/webhooks/' + webhook.id);
  }
  assert.ok(EVENTOS_FINANCEIROS.every(event => webhook.events.includes(event)));
  assert.equal(webhook.enabled, true);
  assert.equal(webhook.interrupted, false);
  console.log('PASS: webhook QA observa todos os eventos financeiros suportados, com fila ativa.');
}
if (process.argv.includes('--estornar-autorizado')) {
  const payment = await call('/payments/' + paymentId);
  assert.equal(payment.id, paymentId);
  assert.equal(payment.externalReference, orderId);
  assert.equal(payment.value, 500);
  assert.equal(payment.subscription, 'sub_mef3uhzrknsk78bl');
  assert.equal(payment.billingType, 'CREDIT_CARD');
  assert.ok(EVENTOS_FINANCEIROS.every(event => webhook.events.includes(event)));
  assert.equal(webhook.interrupted, false);
  if (payment.status === 'REFUNDED') {
    console.log('Estorno ja confirmado; nenhuma nova solicitacao enviada.');
  } else {
    assert.ok(['CONFIRMED', 'RECEIVED'].includes(payment.status), 'Exige estado pago conhecido');
    const refunded = await call('/payments/' + paymentId + '/refund', 'POST', {
      value: 500, description: 'Estorno integral de teste ficticio autorizado por Victor - QA Etapa 01.',
    });
    console.log(JSON.stringify({ paymentId: refunded.id, status: refunded.status,
      value: refunded.value, refundStates: refunded.refunds?.map(r => ({ status: r.status, value: r.value })) }));
  }
}
