/** Handler real, dados fictícios, ambiente isolado e rede proibida por padrão. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {configProducao} from './test-utils/config-producao.mjs';

const uuid='abcdefab-cdef-4abc-8def-abcdefabcdef';
function contexto(alterar=()=>{}, ambiente='production') {
  const s={orders:[],ledger:[],calls:[],countError:false,countNull:false,countThrow:false,
    lookupError:false,providerOk:true,providerThrow:false,schema:true,
    env:configProducao(),
    payload:{id:'evt_external31',event:'PAYMENT_CREATED',payment:{id:'pay_external31',
      customer:'cus_external31',value:500,billingType:'PIX',dueDate:'2026-11-11',
      externalReference:null,subscription:null,status:'PENDING'}}};
  s.canonical=structuredClone(s.payload.payment);
  alterar(s);
  // Os flags ativos existem apenas na VM de teste; nenhuma configuração real é lida.
  s.env.V2G_PRODUCTION_CHECKOUT_ENABLED='false';
  const admin={from(table) {
    assert.equal(table,'commercial_orders');
    const filters=[];let projection,options;
    const q={select(cols,opts){projection=cols;options=opts;return q;},
      eq(k,v){filters.push([k,v]);return q;},
      async maybeSingle(){s.calls.push(['lookup',filters]);
        return {data:s.orders.find(o=>filters.every(([k,v])=>o[k]===v))??null,error:s.lookupError};},
      async single(){return {data:{provider_card_flow:'direct'},error:null};},
      then(resolve,reject){s.calls.push(['count',projection,options,filters]);
        const promise=s.countThrow?Promise.reject(Error('fixture read failure')):Promise.resolve({
          count:s.countNull?null:s.orders.filter(o=>filters.every(([k,v])=>o[k]===v)).length,
          error:s.countError});
        return promise.then(resolve,reject);},
      update(){throw Error('escrita direta proibida');},insert(){throw Error('escrita direta proibida');},
      delete(){throw Error('escrita direta proibida');},upsert(){throw Error('escrita direta proibida');}};
    return q;
  },async rpc(name,args){
    s.calls.push(['rpc',name,args]);
    assert.equal(name,'registrar_evento_financeiro_asaas');
    const order=s.orders.find(o=>o.id===args.p_order_id);
    assert.equal(order.provider_customer_id,args.p_customer_id);
    if(!s.ledger.some(e=>e.p_event_id===args.p_event_id))s.ledger.push(structuredClone(args));
    return {data:true,error:null};
  }};
  const provider=env=>async path=>{s.calls.push(['GET',env,path]);
    if(s.providerThrow)throw Error('fixture provider failure');
    return {ok:s.providerOk,body:s.canonical};};
  const vm=ambienteTs({env:s.env,ports:{
    'next/server':{NextResponse:{json:(body,{status=200}={})=>({body,status})}},
    '@/lib/supabase/admin':{createAdminClient:()=>{s.calls.push(['admin']);return admin;}},
    '@/lib/contratacao/ambiente-checkout':{checkoutSandboxSeguroNesteServidor:()=>s.sandboxOff!==true},
    '@/lib/contratacao/asaas-sandbox':{asaasSandbox:provider('sandbox')},
    './asaas-producao':{asaasProducao:provider('production')},
    './provedor-compra':{schemaCompraPronto:async()=>s.schema},
    '@/lib/contratacao/ensaio-encerrado':{reconhecerEnsaioEncerrado:async()=>false},
    '@/lib/contratacao/processar-email-pagamento':{processarEmailPagamento:async()=>{throw Error('email proibido');}},
    '@/lib/contratacao/processar-assinatura-3ds':{processarAssinatura3ds:async()=>{throw Error('assinatura proibida');}},
  }});
  const {processarWebhookPagamento}=vm.load('lib/contratacao/webhook-pagamento.ts');
  s.notify=(headers={})=>processarWebhookPagamento({headers:new Headers({
    'asaas-access-token':ambiente==='production'?s.env.ASAAS_PRODUCTION_WEBHOOK_TOKEN:s.env.ASAAS_WEBHOOK_TOKEN,
    host:'app.v2gmidia.com.br','x-forwarded-proto':'https',...headers}),json:async()=>s.payload},ambiente);
  return s;
}
function dados(s){return structuredClone({orders:s.orders,ledger:s.ledger});}
async function pendente(alterar){const s=contexto(alterar),antes=dados(s),r=await s.notify();
  assert.equal(r.status,503);assert.equal(r.body.erro,'vinculo_pendente');assert.deepEqual(dados(s),antes);
  assert.equal(s.calls.filter(c=>c[0]==='rpc').length,0);return s;}

for(const ambiente of ['production','sandbox'])test(`externo confirmado: aceite sem efeitos em ${ambiente}`,async()=>{
  const s=contexto(()=>{},ambiente),antes=dados(s),r=await s.notify();
  assert.equal(r.status,200);assert.equal(r.body.externo,true);assert.equal(r.body.ignorado,true);
  assert.deepEqual(dados(s),antes);
  assert.deepEqual(s.calls.filter(c=>c[0]==='GET'),[['GET',ambiente,'/payments/pay_external31']]);
  const count=s.calls.find(c=>c[0]==='count');
  assert.equal(count[1],'id');assert.equal(count[2].count,'exact');assert.equal(count[2].head,true);
  assert.deepEqual(JSON.parse(JSON.stringify(count[3])),[['provider_customer_id','cus_external31']]);
  assert.equal(s.calls.filter(c=>c[0]==='rpc').length,0);
});

const tipos=ambienteTs().load('lib/contratacao/evento-financeiro.ts').EVENTOS_FINANCEIROS;
for(const tipo of tipos)test(`externo confirmado reconhecido em ${tipo}`,async()=>{
  const s=contexto(s=>{s.payload.event=tipo;
    if(tipo==='PAYMENT_CONFIRMED')s.payload.payment.status='CONFIRMED';
    if(tipo==='PAYMENT_RECEIVED')s.payload.payment.status='RECEIVED';
    s.canonical=structuredClone(s.payload.payment);});
  const antes=dados(s);assert.equal((await s.notify()).status,200);assert.deepEqual(dados(s),antes);
});
for(const tipo of tipos)test(`possivel pedido antecipado em ${tipo} nao e descartado`,async()=>{
  const s=await pendente(s=>{s.payload.event=tipo;s.payload.payment.externalReference=uuid;
    if(tipo==='PAYMENT_CONFIRMED')s.payload.payment.status='CONFIRMED';
    if(tipo==='PAYMENT_RECEIVED')s.payload.payment.status='RECEIVED';});
  assert.equal(s.calls.filter(c=>c[0]==='GET'||c[0]==='count').length,0);
});
test('assinatura externa e cartao sao conferidos no mesmo ambiente',async()=>{
  const s=contexto(s=>{s.payload.payment.billingType='CREDIT_CARD';
    s.payload.payment.subscription='sub_external31';s.canonical=structuredClone(s.payload.payment);});
  const antes=dados(s);assert.equal((await s.notify()).body.externo,true);assert.deepEqual(dados(s),antes);
});
test('Sandbox desligado impede consultas',async()=>{
  const s=contexto(s=>{s.sandboxOff=true;},'sandbox');
  assert.equal((await s.notify()).status,503);assert.equal(s.calls.length,0);
});
for(const ref of [undefined,'','manual-31'])test(`referencia externa ${String(ref)} conferida no provedor`,async()=>{
  const s=contexto(s=>{s.payload.payment.externalReference=ref;s.canonical.externalReference=ref;});
  assert.equal((await s.notify()).body.externo,true);
});
for(const ref of [uuid,uuid.toUpperCase(),`pedido:${uuid}`,` ${uuid} `])test(`indicio de pedido ${ref} preserva retentativa`,async()=>{
  const s=await pendente(s=>{s.payload.payment.externalReference=ref;s.canonical.externalReference=ref;});
  assert.equal(s.calls.filter(c=>c[0]==='GET').length,0);
});
for(const [nome,alterar] of [
  ['referencia UUID apenas canonica',s=>{s.canonical.externalReference=uuid;}],
  ['referencias diferentes',s=>{s.canonical.externalReference='outra';}],
  ['referencia recebida objeto',s=>{s.payload.payment.externalReference={};}],
  ['referencia canonica numerica',s=>{s.canonical.externalReference=42;}],
  ['provedor indisponivel',s=>{s.providerOk=false;}],
  ['provedor excecao',s=>{s.providerThrow=true;}],
  ['corpo canonico nulo',s=>{s.canonical=null;}],
  ['corpo canonico lista',s=>{s.canonical=[];}],
  ['cobranca divergente',s=>{s.canonical.id='pay_other';}],
  ['cliente divergente',s=>{s.canonical.customer='cus_other';}],
  ['assinatura divergente',s=>{s.canonical.subscription='sub_other';}],
  ['forma divergente',s=>{s.canonical.billingType='CREDIT_CARD';}],
  ['valor divergente',s=>{s.canonical.value=501;}],
  ['valor nao finito',s=>{s.canonical.value=NaN;}],
  ['valor com fracao de centavo',s=>{s.canonical.value=500.001;}],
  ['vencimento divergente',s=>{s.canonical.dueDate='2026-11-12';}],
  ['cobranca excluida',s=>{s.canonical.deleted=true;}],
  ['erro na contagem',s=>{s.countError=true;}],
  ['contagem ausente',s=>{s.countNull=true;}],
  ['excecao na contagem',s=>{s.countThrow=true;}],
  ['erro no vinculo inicial',s=>{s.lookupError=true;}],
])test(nome+' nao descarta evento',()=>pendente(alterar));

for(const status of ['awaiting_payment','payment_approved','cancelled'])test(`cliente local ${status} preserva evento mesmo sem referencia`,()=>pendente(s=>{
  s.orders.push({id:uuid,business_id:'businessA',origin:'assisted',status,
    provider_customer_id:s.payload.payment.customer,provider_charge_id:'pay_other'});
}));
test('outro cliente nao e contado nem recebe efeitos do evento externo',async()=>{
  const s=contexto(s=>{s.orders.push({id:uuid,business_id:'businessB',provider_customer_id:'cus_other'});});
  const antes=dados(s);assert.equal((await s.notify()).body.externo,true);assert.deepEqual(dados(s),antes);
});
test('multiplos pedidos do mesmo cliente continuam pendentes',()=>pendente(s=>{
  s.orders=[{id:uuid,business_id:'businessA',provider_customer_id:'cus_external31'},
    {id:'other',business_id:'businessB',provider_customer_id:'cus_external31'}];
}));

for(const [nome,alterar,headers,status] of [
  ['processamento desligado',s=>{s.env.V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED='false';},{},503],
  ['token invalido',()=>{},{'asaas-access-token':'errado'},401],
  ['dominio invalido',()=>{},{host:'outro.invalid'},403],
  ['HTTPS ausente',()=>{},{'x-forwarded-proto':'http'},403],
  ['schema pendente',s=>{s.schema=false;},{},503],
])test(nome+' bloqueia classificacao e efeitos',async()=>{
  const s=contexto(alterar);assert.equal((await s.notify(headers)).status,status);
  assert.equal(s.calls.filter(c=>['GET','count','lookup','rpc'].includes(c[0])).length,0);
  assert.deepEqual(s.ledger,[]);
});
test('evento antecipado espera vinculo; entrega posterior e replay usam registro existente',async()=>{
  const s=contexto(s=>{s.payload.payment.externalReference=uuid;s.canonical.externalReference=uuid;
    s.orders=[{id:uuid,business_id:'businessA',status:'awaiting_payment',origin:'self_service',
      payment_method:'asaas_pix',billing_period:'annual_upfront',total_cents:50000,
      provider_customer_id:'cus_external31',provider_charge_id:null,provider_checkout_id:null},
      {id:'other',business_id:'businessB',provider_customer_id:'cus_other',provider_charge_id:'pay_other'}];});
  const antes=dados(s);assert.equal((await s.notify()).status,503);assert.deepEqual(dados(s),antes);
  // Simula somente a conclusão da criação original, não uma reparação pelo webhook.
  s.orders[0].provider_charge_id=s.payload.payment.id;
  assert.equal((await s.notify()).status,200);
  assert.deepEqual((await Promise.all([s.notify(),s.notify()])).map(r=>r.status),[200,200]);
  assert.equal(s.ledger.length,1);assert.equal(s.ledger[0].p_order_id,uuid);
  assert.deepEqual(s.orders[1],antes.orders[1]);
  assert.equal(s.calls.filter(c=>c[0]==='count'||c[0]==='GET').length,0);
});
test('reentrega externa concorrente continua apenas leitura',async()=>{
  const s=contexto(),antes=dados(s);
  assert.deepEqual((await Promise.all([s.notify(),s.notify(),s.notify()])).map(r=>r.status),[200,200,200]);
  assert.deepEqual(dados(s),antes);assert.equal(s.calls.filter(c=>c[0]==='rpc').length,0);
});
