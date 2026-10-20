/** Conciliacao/cancelamento SOMENTE da assinatura ficticia autorizada em 19/10/2026. */
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const expectedOrder = '809717c6-1b88-4b97-bacb-e118f2623f2d';
const expectedReference = 'fb6c4adb-aeeb-4aa1-9123-dda12a181d21';
const expectedSubscription = 'sub_mef3uhzrknsk78bl';
const result = await admin.from('commercial_orders').select('id,external_ref,legal_name,status,total_cents,provider_customer_id,provider_charge_id,provider_subscription_id,business_id')
  .eq('id', expectedOrder).eq('external_ref', expectedReference).single();
assert.ifError(result.error);
const order = result.data;
assert.equal(order.legal_name, 'QA Etapa 01 Seguranca FICTICIA');
assert.equal(order.total_cents, 50000);
assert.equal(order.provider_subscription_id, expectedSubscription);
async function call(path, method = 'GET') {
  const response = await fetch('https://api-sandbox.asaas.com/v3' + path, {
    method, headers: { access_token: process.env.ASAAS_API_KEY,
      'User-Agent': 'V2G-QA-Etapa01/1.0', accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.ok, true, `Asaas ${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
const subscription = await call('/subscriptions/' + expectedSubscription);
assert.equal(subscription.id, expectedSubscription);
assert.equal(subscription.externalReference, expectedOrder);
assert.equal(subscription.customer, order.provider_customer_id);
assert.equal(subscription.value, 500);
const payment = await call('/payments/' + order.provider_charge_id);
assert.equal(payment.externalReference, expectedOrder);
assert.equal(payment.subscription, expectedSubscription);
assert.equal(payment.value, 500);
const payments = await call('/subscriptions/' + expectedSubscription + '/payments?limit=100');
const events = await admin.from('commercial_events').select('external_event_id,event_type,source,occurred_at').eq('order_id', expectedOrder);
assert.ifError(events.error);
console.log(JSON.stringify({ orderId: expectedOrder, orderStatus: order.status,
  payment: { id: payment.id, status: payment.status, value: payment.value, subscription: payment.subscription },
  subscription: { id: subscription.id, deleted: subscription.deleted, status: subscription.status, nextDueDate: subscription.nextDueDate },
  paymentCount: payments.totalCount, events: events.data }, null, 2));
if (process.argv.includes('--replay-confirmacao')) {
  assert.equal(payment.status, 'CONFIRMED');
  const event = events.data.find(e => e.event_type === 'PAYMENT_CONFIRMED' && e.source === 'asaas');
  assert.ok(event, 'Exige evento autentico recebido antes do replay');
  for (let i = 0; i < 2; i++) {
    const replay = await fetch('https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN },
      body: JSON.stringify({ id: event.external_event_id, event: event.event_type, payment }),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(replay.status, 200, 'Replay do mesmo evento deve ser idempotente');
  }
  const approvals = await admin.from('commercial_events').select('id', { count: 'exact', head: true })
    .eq('order_id', expectedOrder).eq('external_event_id', event.external_event_id);
  const ledger = await admin.from('commercial_payment_events').select('provider_event_id', { count: 'exact', head: true })
    .eq('order_id', expectedOrder).eq('provider_event_id', event.external_event_id);
  assert.ifError(approvals.error);
  assert.ifError(ledger.error);
  assert.equal(approvals.count, 1);
  assert.equal(ledger.count, 1);
  console.log('PASS: dois reenvios do evento autentico retornaram 200 sem duplicar aprovacao/registro financeiro.');
}
if (process.argv.includes('--replay-estorno')) {
  assert.equal(payment.status, 'REFUNDED');
  assert.equal(subscription.deleted, true);
  const original = await admin.from('commercial_payment_events').select('provider_event_id,event_type')
    .eq('order_id', expectedOrder).eq('event_type', 'PAYMENT_REFUNDED').single();
  assert.ifError(original.error);
  for (let i = 0; i < 2; i++) {
    const replay = await fetch('https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN },
      body: JSON.stringify({ id: original.data.provider_event_id, event: original.data.event_type, payment }),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(replay.status, 200);
  }
  const refunded = await admin.from('commercial_payment_events').select('provider_event_id', { count: 'exact', head: true })
    .eq('order_id', expectedOrder).eq('event_type', 'PAYMENT_REFUNDED');
  assert.ifError(refunded.error);
  assert.equal(refunded.count, 1);
  console.log('PASS: estorno autentico reenviado duas vezes sem duplicar registro financeiro.');
}
const marked = await admin.from('businesses').update({ dados_ficticios: true })
  .eq('id', order.business_id).eq('name', 'QA Etapa 01 Seguranca FICTICIA');
assert.ifError(marked.error);
if (process.argv.includes('--cancelar-autorizado')) {
  assert.ok(['CONFIRMED', 'RECEIVED'].includes(payment.status), 'Preservar cobranca aprovada durante o cancelamento');
  if (subscription.deleted !== true) {
    const deleted = await call('/subscriptions/' + expectedSubscription, 'DELETE');
    assert.equal(deleted.id, expectedSubscription);
    assert.equal(deleted.deleted, true);
  }
  const verification = await call('/subscriptions/' + expectedSubscription);
  assert.equal(verification.deleted, true, 'Recorrencia ficticia deve ficar encerrada');
  const paid = await call('/payments/' + order.provider_charge_id);
  assert.ok(['CONFIRMED', 'RECEIVED'].includes(paid.status), 'Pagamento deve continuar como evidencia');
  console.log('PASS: assinatura ficticia cancelada no Sandbox; cobranca paga preservada.');
}
