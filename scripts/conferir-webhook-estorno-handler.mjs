/** Handler real, portas em memória: nenhuma rede, evento reenviado ou escrita externa. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const id = '00000000-0000-4000-8000-000000000021';
const confirmado = { id: 'evt_15e444ff9b9ab9ec29294aa1abe68025&23026390', event: 'PAYMENT_CONFIRMED',
  payment: { id: 'pay_fixture', customer: 'cus_fixture', subscription: null, value: 500,
    billingType: 'CREDIT_CARD', dueDate: '2026-10-21', externalReference: id, status: 'CONFIRMED' } };
function contexto({ registrado = true, falhaLedger = false, statusCanonico = 'REFUNDED' } = {}) {
  const calls = [], eventos = new Set();
  const pedido = { id, status: 'payment_approved', origin: 'self_service', payment_method: 'asaas_card',
    billing_period: 'monthly', total_cents: 50000, provider_customer_id: 'cus_fixture', provider_charge_id: 'pay_fixture',
    provider_subscription_id: null, provider_first_due_date: '2026-10-21', provider_checkout_id: null };
  const admin = { from(tabela) {
    const filtros = [];
    const q = { select: () => q, eq: (key, value) => { filtros.push([key,value]); return q; },
      is: (key,value) => { filtros.push([key,value]); return q; },
      maybeSingle: async () => ({ data: pedido, error: null }),
      single: async () => ({ data: { provider_card_flow: 'initial_3ds' }, error: null }),
      then(resolve, reject) {
        assert.equal(tabela, 'commercial_payment_events');
        calls.push(['ledger', filtros]);
        return Promise.resolve({ count: registrado ? 1 : 0, error: falhaLedger ? {} : null }).then(resolve,reject);
      } };
    return q;
  }, rpc: async (nome,args) => { calls.push(['rpc', nome, args]); eventos.add(args.p_event_id); return { data:true, error:null }; } };
  const mod = ambienteTs({ env: { ASAAS_WEBHOOK_TOKEN:'x'.repeat(32), V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'true' }, ports: {
    'next/server': { NextResponse: { json: (body, { status=200 }={}) => ({body,status}) } },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/contratacao/ambiente-checkout': { checkoutSandboxSeguroNesteServidor: () => true },
    '@/lib/contratacao/origem-asaas-servidor': { origemAsaasNoServidor: async () => true },
    '@/lib/contratacao/asaas-sandbox': { asaasSandbox: async () => ({ ok:true, body:{...confirmado.payment,status:statusCanonico} }) },
    '@/lib/contratacao/processar-assinatura-3ds': { processarAssinatura3ds: async () => { calls.push(['assinatura']); return false; } },
    '@/lib/contratacao/processar-email-pagamento': { processarEmailPagamento: async () => { calls.push(['email']); return true; } },
  } }).load('app/api/webhooks/asaas-payment/route.ts');
  return { calls,eventos,notify: (payload,token='x'.repeat(32)) => mod.POST({
    headers: new Headers({'asaas-access-token':token}), json: async () => payload,
  }) };
}
test('replay do evento registrado apos estorno recebe 200 sem recorrencia ou email', async () => {
  const c=contexto();
  assert.equal((await c.notify(confirmado)).status,200);
  assert.equal(c.calls.length,1);
  const filtros=Object.fromEntries(c.calls[0][1]);
  assert.deepEqual(filtros,{ provider_event_id:confirmado.id,order_id:id,provider_charge_id:'pay_fixture',
    event_type:'PAYMENT_CONFIRMED',amount_cents:50000,due_date:'2026-10-21',provider_subscription_id:null });
});
test('evento nao persistido ou ledger indisponivel nunca recebe aceite historico', async () => {
  for(const opcoes of [{registrado:false},{falhaLedger:true}]) {
    const c=contexto(opcoes);
    assert.equal((await c.notify(confirmado)).status,422);
    assert.equal(c.calls.filter(x=>['rpc','email','assinatura'].includes(x[0])).length,0);
  }
});
test('estorno original e seu replay chegam a RPC idempotente sem nova aprovacao', async () => {
  const c=contexto();
  const estorno={...confirmado,id:'evt_refund_fixture',event:'PAYMENT_REFUNDED',payment:{...confirmado.payment,status:'REFUNDED'}};
  assert.equal((await c.notify(estorno)).status,200);
  assert.equal((await c.notify(estorno)).status,200);
  assert.equal(c.eventos.size,1); // Porta em memória, não prova a RPC PostgreSQL.
  assert.equal(c.calls.filter(x=>x[0]==='rpc').length,2);
  assert.equal(c.calls[0][1],'registrar_evento_inicial_3ds');
  assert.equal(c.calls[0][2].p_event_type,'PAYMENT_REFUNDED');
  assert.equal(c.calls.filter(x=>['email','assinatura'].includes(x[0])).length,0);
});
test('confirmacao ainda paga persiste antes da conciliacao pendente e nao finge conclusao', async () => {
  const c=contexto({statusCanonico:'CONFIRMED'});
  assert.equal((await c.notify(confirmado)).status,503);
  assert.deepEqual(c.calls.map(x=>x[0]),['rpc','email','assinatura']);
});
test('token invalido bloqueia antes de banco ou provedor', async () => {
  const c=contexto();
  assert.equal((await c.notify(confirmado,'invalido')).status,401);
  assert.equal(c.calls.length,0);
});
