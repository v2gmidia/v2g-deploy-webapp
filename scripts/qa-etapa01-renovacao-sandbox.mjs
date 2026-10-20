/** Ensaio especifico autorizado por Victor: ate 2 x R$500 ficticios e limpeza. */
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { vencimentoNoMesSeguinte } from '../lib/contratacao/fluxo-cartao-mensal.ts';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const ref = 'b0068c60-7282-4e24-a893-c107b18ba267';
const email = 'qa-renovacao-20261019@example.invalid';
const nome = 'QA Etapa 01 Renovacao FICTICIA';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
async function api(path, method = 'GET', body, pdf = false) {
  const response = await fetch('https://api-sandbox.asaas.com/v3' + path, { method,
    headers: { access_token: process.env.ASAAS_API_KEY, 'User-Agent': 'V2G-QA-Renovacao/1.0',
      'Content-Type': 'application/json', accept: pdf ? 'application/pdf' : 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(65000) });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    console.log(JSON.stringify({ http: response.status, reasons: error?.errors?.map(e => ({
      code: e.code, exigeBoleto: /boleto/i.test(e.description ?? ''),
      restricaoCartao: /cart[aã]o/i.test(e.description ?? ''),
      dataInvalida: /data|vencimento|m[eê]s|ano/i.test(e.description ?? ''),
    })) }));
    throw Error(`Asaas ${method} ${path}: HTTP ${response.status}; conciliar antes de repetir.`);
  }
  if (pdf) { await response.arrayBuffer(); return null; }
  return response.json();
}
if (process.argv.includes('--preparar')) {
  const created = await admin.rpc('registrar_pedido_self_service', {
    p_ref: ref, p_email: email, p_buyer_name: 'Pessoa Ficticia QA', p_whatsapp: '11999990001',
    p_legal_name: nome, p_cnpj: '00000000000191', p_unit_count: 1,
    p_billing_period: 'monthly', p_payment_method: 'asaas_card',
  });
  assert.ifError(created.error);
}
const orderResult = await admin.from('commercial_orders')
  .select('id,business_id,status,buyer_email,legal_name,total_cents,provider_customer_id,provider_subscription_id,provider_charge_id,provider_first_due_date')
  .eq('external_ref', ref).single();
assert.ifError(orderResult.error);
const order = orderResult.data;
assert.equal(order.buyer_email, email);
assert.equal(order.legal_name, nome);
assert.equal(order.total_cents, 50000);
if (process.argv.includes('--preparar')) {
  const mark = await admin.from('businesses').update({ dados_ficticios: true }).eq('id', order.business_id).eq('claim_email', email);
  assert.ifError(mark.error);
}
console.log(JSON.stringify({ orderId: order.id, businessId: order.business_id, status: order.status,
  paymentUrl: 'https://v2g-webapp-qa.vercel.app/contratar/pagamento?ref=' + ref }));
if (!order.provider_subscription_id) {
  assert.ok(process.argv.includes('--preparar'), 'Primeira cobranca deve ser feita no checkout HTTPS');
  console.log('Pedido ficticio preparado; nenhuma cobranca criada por este script.');
  process.exit(0);
}
const subId = order.provider_subscription_id;
assert.match(subId, /^sub_[A-Za-z0-9]+$/);
let sub = await api('/subscriptions/' + subId);
assert.equal(sub.externalReference, order.id);
assert.equal(sub.customer, order.provider_customer_id);
assert.equal(sub.value, 500);
const proximo = vencimentoNoMesSeguinte(order.provider_first_due_date);
if (process.argv.includes('--limpar') && !sub.deleted) {
  await api('/subscriptions/' + subId, 'DELETE');
  sub = await api('/subscriptions/' + subId);
  assert.equal(sub.deleted, true);
}
async function listar() {
  const result = await api('/subscriptions/' + subId + '/payments?limit=100');
  assert.equal(result.hasMore, false);
  for (const p of result.data) {
    assert.equal(p.subscription, subId);
    assert.equal(p.customer, order.provider_customer_id);
    assert.equal(p.value, 500);
  }
  return result.data;
}
let payments = await listar();
if (process.argv.includes('--remover-excedente-pendente')) {
  const extras = payments.filter(p => p.dueDate > proximo);
  assert.equal(extras.length, 1);
  const extra = extras[0];
  assert.equal(extra.dueDate, vencimentoNoMesSeguinte(proximo));
  assert.equal(extra.status, 'PENDING');
  assert.notEqual(extra.id, order.provider_charge_id);
  await api('/payments/' + extra.id, 'DELETE');
  const removed = await api('/payments/' + extra.id);
  assert.equal(removed.deleted, true);
  payments = await listar();
  assert.equal(payments.length, 2);
  console.log('PASS: lancamento futuro excedente, nunca pago, removido de forma recuperavel no Asaas.');
}
if (process.argv.includes('--gerar-ciclo')) {
  assert.ok(payments.length <= 2, 'Teto autorizado de duas cobrancas');
  assert.equal(order.status, 'payment_approved');
  assert.notEqual(sub.deleted, true);
  assert.ok(payments.some(p => p.id === order.provider_charge_id && ['CONFIRMED', 'RECEIVED'].includes(p.status)));
  if (payments.length === 1) {
    await api(`/subscriptions/${subId}/paymentBook?month=${Number(proximo.slice(5,7))}&year=${proximo.slice(0,4)}`, 'GET', undefined, true);
    payments = await listar();
  }
  assert.equal(payments.length, 2);
  assert.ok(payments.some(p => p.id !== order.provider_charge_id && p.dueDate === proximo));
  console.log('PASS: ciclo seguinte antecipado pelo recurso oficial, sem pagamento pelo carne.');
}
if (process.argv.includes('--pagar-ciclo')) {
  assert.notEqual(sub.deleted, true);
  assert.equal(payments.length, 2);
  const next = payments.find(p => p.id !== order.provider_charge_id);
  assert.equal(next.dueDate, proximo);
  if (!['CONFIRMED', 'RECEIVED'].includes(next.status)) {
    assert.equal(next.status, 'PENDING', 'Nunca repetir estado ambiguo');
    const token = sub.creditCard?.creditCardToken;
    assert.equal(typeof token, 'string', 'Exige token do mesmo cliente, sem reenviar cartao');
    await api('/payments/' + next.id + '/payWithCreditCard', 'POST', { creditCardToken: token });
    payments = await listar();
  }
  console.log('Ciclo solicitado; confirmar resultado pelo provedor e webhook, nao apenas pelo retorno sincrono.');
}
if (process.argv.includes('--limpar')) {
  if (!sub.deleted) await api('/subscriptions/' + subId, 'DELETE');
  sub = await api('/subscriptions/' + subId);
  assert.equal(sub.deleted, true);
  for (const p of payments) {
    const current = await api('/payments/' + p.id);
    if (['CONFIRMED', 'RECEIVED'].includes(current.status))
      await api('/payments/' + p.id + '/refund', 'POST', { value: 500,
        description: 'Limpeza do ensaio ficticio de renovacao autorizado por Victor em 19/10/2026.' });
    else if (current.status === 'PENDING' && current.deleted !== true)
      await api('/payments/' + p.id, 'DELETE');
    else assert.ok(current.deleted || ['REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS'].includes(current.status),
      'Estado exige conciliacao antes de nova acao');
  }
  payments = await listar();
}
const ledger = await admin.from('commercial_payment_events')
  .select('provider_event_id,provider_charge_id,event_type,due_date,amount_cents').eq('order_id', order.id);
assert.ifError(ledger.error);
const approvals = await admin.from('commercial_events').select('id,event_type').eq('order_id', order.id);
assert.ifError(approvals.error);
if (process.argv.includes('--verificar-ciclo')) {
  assert.equal(order.status, 'payment_approved');
  assert.equal(payments.length, 2);
  const next = payments.find(p => p.id !== order.provider_charge_id);
  assert.equal(next.dueDate, proximo);
  assert.equal(next.status, 'CONFIRMED');
  assert.equal(approvals.data.filter(e => e.event_type === 'PAYMENT_CONFIRMED').length, 1);
  const original = ledger.data.filter(e => e.provider_charge_id === next.id && e.event_type === 'PAYMENT_CONFIRMED');
  assert.equal(original.length, 1, 'Exige webhook autentico do ciclo seguinte');
  assert.equal(original[0].due_date, proximo);
  assert.equal(original[0].amount_cents, 50000);
  const payment = await api('/payments/' + next.id);
  for (let i = 0; i < 2; i++) {
    const response = await fetch('https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN },
      body: JSON.stringify({ id: original[0].provider_event_id, event: 'PAYMENT_CONFIRMED', payment }),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200);
  }
  const count = await admin.from('commercial_payment_events').select('provider_event_id', { count: 'exact', head: true })
    .eq('order_id', order.id).eq('provider_event_id', original[0].provider_event_id);
  assert.ifError(count.error);
  assert.equal(count.count, 1);
  const unchanged = await admin.from('commercial_orders').select('provider_charge_id,status').eq('id', order.id).single();
  assert.ifError(unchanged.error);
  assert.equal(unchanged.data.provider_charge_id, order.provider_charge_id);
  assert.equal(unchanged.data.status, 'payment_approved');
  console.log('PASS: renovacao antecipada confirmada por webhook autentico; reenvios nao duplicam evento nem alteram cobranca inicial.');
}
if (process.argv.includes('--verificar-limpeza')) {
  assert.equal(sub.deleted, true);
  assert.equal(sub.status, 'INACTIVE');
  assert.equal(payments.length, 2);
  for (const p of payments) {
    assert.equal(p.status, 'REFUNDED');
    const receipts = ledger.data.filter(e => e.provider_charge_id === p.id && e.event_type === 'PAYMENT_REFUNDED');
    assert.equal(receipts.length, 1, 'Exige estorno autentico de cada ciclo');
    const current = await api('/payments/' + p.id);
    assert.ok(current.refunds?.some(r => r.status === 'DONE' && r.value === 500));
  }
  const extra = await api('/payments/pay_vg1phg5nh3dth64m');
  assert.equal(extra.subscription, subId);
  assert.equal(extra.deleted, true);
  assert.equal(extra.status, 'PENDING');
  assert.equal(approvals.data.filter(e => e.event_type === 'PAYMENT_CONFIRMED').length, 1);
  console.log('PASS: assinatura encerrada, dois estornos DONE/webhook e excedente nunca pago removido.');
}
console.log(JSON.stringify({ orderId: order.id, subscription: { id: subId, deleted: sub.deleted, status: sub.status },
  payments: payments.map(p => ({ id: p.id, status: p.status, dueDate: p.dueDate, value: p.value, deleted: p.deleted })),
  approvalEvents: approvals.data, financialEvents: ledger.data }, null, 2));
