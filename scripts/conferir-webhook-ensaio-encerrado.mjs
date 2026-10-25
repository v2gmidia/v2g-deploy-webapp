/** Handler e verificador reais; portas em memória, IDs fictícios, zero rede. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const id = '00000000-0000-4000-8000-000000000025';
function contexto(alterar = () => {}) {
  const estado = {
    pedido: { id, business_id:'businessFixture', status:'payment_approved', origin:'self_service',
      payment_method:'asaas_card', billing_period:'monthly', total_cents:50000,
      provider_customer_id:'cus_fixture',provider_charge_id:'pay_initial',provider_subscription_id:null,
      provider_first_due_date:'2026-10-21',provider_checkout_id:null,provider_card_flow:'initial_3ds',
      subscription_creation_started_at:'2026-10-21T20:00:00Z',provider_subscription_first_due_date:'2026-11-21' },
    parcela: { id:'pay_future',customer:'cus_fixture',subscription:'sub_fixture',value:500,
      billingType:'CREDIT_CARD',dueDate:'2026-11-21',externalReference:id,status:'PENDING',deleted:true },
    assinatura: { id:'sub_fixture',customer:'cus_fixture',value:500,externalReference:id,
      billingType:'CREDIT_CARD',cycle:'MONTHLY',nextDueDate:'2026-12-21',status:'INACTIVE',deleted:true },
    inicial: { id:'pay_initial',customer:'cus_fixture',subscription:null,value:500,billingType:'CREDIT_CARD',
      dueDate:'2026-10-21',externalReference:id,status:'REFUNDED',refunds:[{status:'DONE',value:500}] },
    ficticio:true,ledger:1,erroLedger:false,erroVinculo:false,erroPedido:false,erroNegocio:false,
    provedorOk:true,schema:true,
  };
  const payload = { id:'evt_fixtureCreated25',event:'PAYMENT_CREATED',
    payment:{...estado.parcela,deleted:false} };
  alterar(estado,payload);
  const calls=[];
  const admin = { from(tabela) {
    const filtros=[];
    const q={ select(colunas) { calls.push(['select',tabela,colunas]); return q; },
      eq(key,value) { filtros.push([key,value]);return q; },
      is(key,value) { filtros.push([key,value]);return q; },
      in(key,value) { filtros.push([key,value]);return q; },
      async maybeSingle() {
        calls.push(['read',tabela,Object.fromEntries(filtros)]);
        if(tabela==='businesses') return {data:{id:'businessFixture',dados_ficticios:estado.ficticio},error:estado.erroNegocio};
        const direto=filtros.some(([key])=>key==='provider_subscription_id'||key==='provider_charge_id');
        return {data:direto ? null : estado.pedido,error:direto ? estado.erroVinculo : estado.erroPedido};
      },
      then(resolve,reject) {
        assert.equal(tabela,'commercial_payment_events');
        calls.push(['ledger',Object.fromEntries(filtros)]);
        return Promise.resolve({count:estado.ledger,error:estado.erroLedger}).then(resolve,reject);
      },
      update() {calls.push(['WRITE']);throw Error('Escrita proibida');},
      insert() {calls.push(['WRITE']);throw Error('Escrita proibida');},
      upsert() {calls.push(['WRITE']);throw Error('Escrita proibida');},
      delete() {calls.push(['WRITE']);throw Error('Escrita proibida');},
    }; return q;
  },rpc() {calls.push(['RPC']);throw Error('RPC proibida');} };
  const provedor={asaasSandbox:async path=>{
    calls.push(['GET',path]);
    const body=path==='/payments/pay_future' ? estado.parcela
      : path==='/subscriptions/sub_fixture' ? estado.assinatura
      : path==='/payments/pay_initial' ? estado.inicial : null;
    return {ok:estado.provedorOk&&body!==null,body};
  }};
  const mod=ambienteTs({env:{ASAAS_WEBHOOK_TOKEN:'x'.repeat(32),V2G_CHECKOUT_3DS_SCHEMA_ENABLED:String(estado.schema)},ports:{
    'next/server':{NextResponse:{json:(body,{status=200}={})=>({body,status})}},
    '@/lib/supabase/admin':{createAdminClient:()=>admin},
    '@/lib/contratacao/ambiente-checkout':{checkoutSandboxSeguroNesteServidor:()=>true},
    '@/lib/contratacao/asaas-sandbox':provedor,
    './asaas-sandbox':provedor,
    '@/lib/contratacao/processar-assinatura-3ds':{processarAssinatura3ds:async()=>{calls.push(['ASSINATURA']);throw Error('Proibido');}},
    '@/lib/contratacao/processar-email-pagamento':{processarEmailPagamento:async()=>{calls.push(['EMAIL']);throw Error('Proibido');}},
  }}).load('app/api/webhooks/asaas-payment/route.ts');
  return {calls,notify:(token='x'.repeat(32))=>mod.POST({headers:new Headers({'asaas-access-token':token}),json:async()=>payload})};
}
function semEfeitos(c) {
  assert.equal(c.calls.filter(x=>['WRITE','RPC','ASSINATURA','EMAIL'].includes(x[0])).length,0);
}
test('orfao excluido com identidade integral e evidencia persistida recebe aceite historico',async()=>{
  const c=contexto();const r=await c.notify();
  assert.equal(r.status,200);assert.equal(r.body.historico,true);assert.equal(r.body.ignorado,true);semEfeitos(c);
  assert.deepEqual(c.calls.filter(x=>x[0]==='GET').map(x=>x[1]),
    ['/payments/pay_future','/subscriptions/sub_fixture','/payments/pay_initial']);
  assert.deepEqual(JSON.parse(JSON.stringify(c.calls.find(x=>x[0]==='ledger')[1])),{order_id:id,provider_charge_id:'pay_initial',
    provider_subscription_id:null,event_type:['PAYMENT_CONFIRMED','PAYMENT_RECEIVED'],amount_cents:50000,due_date:'2026-10-21'});
});
test('replay e concorrencia repetem apenas leituras sem fabricar idempotencia no ledger',async()=>{
  const c=contexto();const respostas=await Promise.all([c.notify(),c.notify(),c.notify()]);
  assert.deepEqual(respostas.map(r=>r.status),[200,200,200]);semEfeitos(c);
  assert.equal((await c.notify()).status,200);semEfeitos(c);
});
for(const [nome,alterar] of [
  ['novo ativo sem vinculo',s=>{s.parcela.deleted=false;}],
  ['pedido desconhecido',s=>{s.pedido=null;}],
  ['cliente divergente',s=>{s.parcela.customer='cus_other';}],
  ['cobranca divergente',s=>{s.parcela.id='pay_other';}],
  ['assinatura divergente',s=>{s.parcela.subscription='sub_other';}],
  ['valor divergente',s=>{s.parcela.value=501;}],
  ['forma divergente',s=>{s.parcela.billingType='PIX';}],
  ['vencimento divergente',s=>{s.parcela.dueDate='2026-11-22';}],
  ['referencia divergente',s=>{s.parcela.externalReference='00000000-0000-4000-8000-000000000026';}],
  ['assinatura ainda ativa',s=>{s.assinatura.status='ACTIVE';}],
  ['assinatura nao excluida',s=>{s.assinatura.deleted=false;}],
  ['assinatura de outro cliente',s=>{s.assinatura.customer='cus_other';}],
  ['assinatura de outra referencia',s=>{s.assinatura.externalReference='outra';}],
  ['proxima parcela nao corresponde',s=>{s.assinatura.nextDueDate='2027-01-21';}],
  ['primeira cobranca ainda paga',s=>{s.inicial.status='CONFIRMED';}],
  ['estorno parcial',s=>{s.inicial.refunds[0].value=100;}],
  ['estorno sem valor valido',s=>{s.inicial.refunds[0].value=NaN;}],
  ['estorno com compensacao negativa',s=>{s.inicial.refunds=[{status:'DONE',value:600},{status:'DONE',value:-100}];}],
  ['estorno em andamento',s=>{s.inicial.refunds[0].status='PENDING';}],
  ['primeira cobranca de outro pedido',s=>{s.inicial.externalReference='outra';}],
  ['negocio nao marcado ficticio',s=>{s.ficticio=false;}],
  ['sem confirmacao persistida',s=>{s.ledger=0;}],
  ['falha no ledger',s=>{s.erroLedger=true;}],
  ['falha na consulta inicial',s=>{s.erroVinculo=true;}],
  ['falha na consulta do pedido',s=>{s.erroPedido=true;}],
  ['falha na consulta do negocio',s=>{s.erroNegocio=true;}],
  ['provedor indisponivel',s=>{s.provedorOk=false;}],
  ['schema desligado',s=>{s.schema=false;}],
  ['sem reserva persistida',s=>{s.pedido.subscription_creation_started_at=null;}],
  ['reserva de outro vencimento',s=>{s.pedido.provider_subscription_first_due_date='2026-12-21';}],
  ['pedido ainda pendente',s=>{s.pedido.status='awaiting_payment';}],
  ['fluxo direto',s=>{s.pedido.provider_card_flow='direct';}],
  ['periodo anual',s=>{s.pedido.billing_period='annual';}],
  ['novo vinculo presente',s=>{s.pedido.provider_subscription_id='sub_other';}],
  ['evento de pagamento nao recebe excecao',(s,p)=>{p.event='PAYMENT_CONFIRMED';p.payment.status='CONFIRMED';}],
]) test(nome+' permanece pendente sem efeitos',async()=>{
  const c=contexto(alterar);assert.equal((await c.notify()).status,503);semEfeitos(c);
  if(nome==='falha na consulta inicial'||nome==='schema desligado') assert.equal(c.calls.filter(x=>x[0]==='GET').length,0);
});
test('autenticacao invalida nao consulta pedido, provedor ou ledger',async()=>{
  const c=contexto();assert.equal((await c.notify('invalido')).status,401);assert.equal(c.calls.length,0);
});
