import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolve} from 'node:path';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const operator='00000000-0000-4000-8000-000000000001',ref='00000000-0000-4000-8000-000000000002';
const base=()=>({id:ref,external_ref:ref,origin:'assisted',assisted_operator_id:operator,status:'awaiting_payment',
  payment_method:'asaas_pix',billing_period:'annual_upfront',total_cents:528000,buyer_email:'buyer@example.invalid',
  buyer_name:'Pessoa Ficticia',buyer_whatsapp:'11999990000',legal_name:'Ficticio',cnpj:'11222333000181',
  provider_customer_id:'cus_fake',provider_charge_id:null,provider_subscription_id:null,provider_checkout_id:null,
  checkout_creation_started_at:null,payment_creation_started_at:null,payment_attempt_count:0,
  provider_first_due_date:null,provider_card_flow:'direct'});
function database(order=base()) {
  const operations=[],events=new Set();
  const tables={commercial_orders:[order],commercial_payment_email_outbox:[],commercial_payment_events:[]};
  const db={from(table){let filters=[],patch=null,one=false,fields=null,head=false;
    const q={select:(cols,opts)=>{fields=cols;head=opts?.head;return q;},
      eq:(k,v)=>{filters.push(r=>r[k]===v);return q;},is:(k,v)=>{filters.push(r=>r[k]===v);return q;},
      in:(k,v)=>{filters.push(r=>v.includes(r[k]));return q;},not:(k,_op,v)=>{filters.push(r=>r[k]!==v);return q;},
      update:v=>{patch=v;return q;},single:()=>{one=true;return q;},maybeSingle:()=>{one=true;return q;},
      upsert:async row=>{if(!tables[table].length)tables[table].push({id:'email-fixture',status:'queued',...row});return {error:null};},
      then(resolve,reject){operations.push({table,fields,patch});
        const rows=tables[table].filter(r=>filters.every(f=>f(r)));
        if(patch)rows.forEach(r=>Object.assign(r,patch));
        const copies=rows.map(r=>Object.fromEntries(fields?.split(',').map(s=>s.trim()).filter(Boolean).map(k=>[k,r[k]])??Object.entries(r)));
        return Promise.resolve({data:head?null:one?copies[0]??null:copies,error:null,count:rows.length}).then(resolve,reject);}};
    return q;},async rpc(name,args){operations.push({rpc:name,args});
      if(name.startsWith('aprovar_pagamento_api_')||name.startsWith('registrar_evento_inicial_3ds'))order.status='payment_approved';
      events.add(args.p_event_id);return {error:null,data:true};}};
  return {db,order,tables,operations,events};
}
const form=()=>{const f=new FormData();for(const [k,v] of Object.entries({ref,email:'buyer@example.invalid',buyerName:'Pessoa Ficticia',
  whatsapp:'11999990000',legalName:'Ficticio',cnpj:'11222333000181',unitCount:'1',billingPeriod:'annual_upfront',
  paymentMethod:'asaas_pix',declaresCnpj:'yes',sellsByWhatsApp:'yes',vinculoLead:'atendimento_direto'}))f.set(k,v);return f;};
const providerModule=resolve('lib/contratacao/asaas-sandbox.ts');
function runtime(p,{actor={id:operator,app_metadata:{papel:'operador'}},enabled=true,api,subscription=async()=>false,mailFetch}={}) {
  const env={V2G_ASSISTED_ASAAS_ENABLED:enabled?'true':'false',V2G_LEAD_ORDER_LINK_ENABLED:'true',
    V2G_CHECKOUT_API_ENABLED:'true',ASAAS_WEBHOOK_TOKEN:'x'.repeat(32),V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'false',
    V2G_PAYMENT_EMAIL_ENABLED:'true',V2G_PAYMENT_EMAIL_FROM:'test@example.invalid',V2G_PAYMENT_EMAIL_RESEND_API_KEY:'fixture',
    V2G_PAYMENT_EMAIL_QA_TO:'victor.cabral@v2gmidia.com.br',NEXT_PUBLIC_SITE_URL:'https://v2g-webapp-qa.vercel.app'};
  const primitives=ambienteTs().load('lib/contratacao/asaas-sandbox.ts');
  const ports={'next/navigation':{redirect:url=>{throw Error('REDIRECT '+url);}},'next/cache':{revalidatePath(){}},
    'next/headers':{headers:async()=>new Headers()},'next/server':{NextResponse:{json:(body,{status=200}={})=>({body,status})}},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:actor},error:null})}})},
    '@/lib/supabase/admin':{createAdminClient:()=>p.db},
    [resolve('lib/contratacao/ambiente-checkout.ts')]:{checkoutSandboxSeguroNesteServidor:()=>true},
    [resolve('lib/seguranca/checkout.ts')]:{segurancaCheckoutAtiva:()=>false,ipConfiavelDaVercel:()=>null},
    [providerModule]:{...primitives,asaasSandbox:api??(async()=>({ok:true,status:200,body:{id:'pay_fake'}}))},
    '@/lib/contratacao/processar-assinatura-3ds':{processarAssinatura3ds:subscription}};
  return {env,load:ambienteTs({env,ports,fetch:mailFetch}).load};
}
test('action real exige operador, ignora ator/negocio do navegador e preserva lead opcional',async()=>{
  for(const actor of [null,{id:operator,app_metadata:{},user_metadata:{papel:'operador'}}]){
    const p=database();const a=runtime(p,{actor}).load('app/(protected)/pedidos/actions.ts');
    assert.ok((await a.criarPedidoAsaasAction({},form())).erro);assert.equal(p.operations.length,0);
  }
  for(const lead of [false,true]){
    const p=database();p.db.rpc=async(name,args)=>{p.operations.push({rpc:name,args});return {data:ref,error:null};};
    const a=runtime(p).load('app/(protected)/pedidos/actions.ts'),f=form();
    f.set('operatorId','invasor');f.set('businessId','outro-negocio');
    if(lead){f.set('vinculoLead','v2g_site');f.set('sourceLeadId','73');}
    await assert.rejects(a.criarPedidoAsaasAction({},f),/REDIRECT \/pedidos\?registro=asaas/);
    const call=p.operations[0];assert.equal(call.args.p_operator_id,operator);assert.equal(call.args.p_source_lead_id,lead?73:null);
    assert.equal(call.args.p_business_id,undefined);
  }
});
test('iniciador real reutiliza reserva: concorrencia e timeout nao criam segunda cobranca',async()=>{
  for(const ambiguous of [false,true]){
    const p=database();let calls=0;
    const r=runtime(p,{api:async(path,opts)=>{calls++;assert.equal(path,'/payments');assert.equal(opts.body.externalReference,ref);
      return ambiguous?{ok:false,status:0,body:null}:{ok:true,status:200,body:{id:'pay_fake'}};}});
    const pay=r.load('lib/contratacao/iniciar-pagamento.ts').iniciarPagamentoInterno;
    await Promise.allSettled([pay({},form()),pay({},form())]);
    assert.equal(calls,1);assert.ok(p.order.payment_creation_started_at);
    assert.equal(p.order.origin,'assisted');assert.equal(p.order.provider_charge_id,ambiguous?null:'pay_fake');
    assert.ok((await pay({},form())).erro);assert.equal(calls,1);
  }
});
test('legado, origem invalida, ator ausente e flag desligada nao chegam ao provedor',async()=>{
  for(const patch of [{origin:'outro'},{payment_method:'direct_pix'},{assisted_operator_id:null},{enabled:false}]){
    const p=database({...base(),...patch});let calls=0;const r=runtime(p,{enabled:patch.enabled!==false,api:async()=>{calls++;}});
    assert.ok((await r.load('lib/contratacao/iniciar-pagamento.ts').iniciarPagamentoInterno({},form())).erro);assert.equal(calls,0);
  }
});
test('self-service continua usando o iniciador existente com a nova flag desligada',async()=>{
  const p=database({...base(),origin:'self_service',assisted_operator_id:null});let calls=0;
  const r=runtime(p,{enabled:false,api:async()=>{calls++;return {ok:true,body:{id:'pay_fake'}};}});
  await assert.rejects(r.load('lib/contratacao/iniciar-pagamento.ts').iniciarPagamentoInterno({},form()),/REDIRECT/);
  assert.equal(calls,1);assert.equal(p.order.origin,'self_service');
});
test('formulario real deixa QA e plano claros, preservando o formulario legado',()=>{
  const Component=ambienteTs({ports:{[resolve('app/(protected)/pedidos/actions.ts')]:{
    criarPedidoAsaasAction:async()=>({}),criarPedidoPixAction:async()=>({}),
    registrarComprovantePixAction:async()=>({}),aprovarPixAssistidoAction:async()=>({}),
  }}}).load('app/(protected)/pedidos/Formularios.tsx').NovoPedidoPix;
  const html=renderToStaticMarkup(React.createElement(Component,{referencia:ref,asaasAtivo:true,vinculoLeadAtivo:true}));
  assert.match(html,/Asaas · QA/);assert.match(html,/name="buyerName"/);assert.match(html,/name="whatsapp"/);
  assert.match(html,/atendimento_direto/);assert.match(html,/v2g_site/);assert.match(html,/name="paymentMethod"/);
  assert.match(html,/somente plano à vista/);assert.doesNotMatch(html,/name="operatorId"|name="businessId"/);
  const legacy=renderToStaticMarkup(React.createElement(Component,{referencia:ref}));
  assert.match(legacy,/Registrar venda assistida por Pix/);assert.doesNotMatch(legacy,/name="paymentMethod"/);
});
const event=()=>({id:'evt_confirmed',event:'PAYMENT_CONFIRMED',payment:{id:'pay_fake',customer:'cus_fake',billingType:'PIX',
  status:'CONFIRMED',value:5280,dueDate:'2099-01-31',externalReference:ref}});
const request=payload=>({headers:new Headers({'asaas-access-token':'x'.repeat(32)}),json:async()=>payload});
test('webhook real exige consulta canonica e divergencias nao gravam nem notificam',async()=>{
  for(const patch of [{id:'pay_other'},{customer:'cus_other'},{value:1},{externalReference:'outro-negocio'},{subscription:'sub_other'},{status:'PENDING'}]){
    const p=database({...base(),provider_charge_id:'pay_fake'});let sends=0;
    const r=runtime(p,{api:async()=>({ok:true,body:{...event().payment,...patch}}),mailFetch:async()=>{sends++;}});
    const response=await r.load('app/api/webhooks/asaas-payment/route.ts').POST(request(event()));
    assert.equal(response.status,422);assert.equal(p.events.size,0);assert.equal(sends,0);assert.equal(p.order.status,'awaiting_payment');
  }
});
test('assistido anual: confirmacao correlacionada, RPC comercial e replay sem duplicar email',async()=>{
  const p=database({...base(),provider_charge_id:'pay_fake',source_system:'v2g_site',source_lead_id:73});let sends=0;
  const payload=event();const r=runtime(p,{api:async()=>({ok:true,body:payload.payment}),
    mailFetch:async()=>{sends++;return new Response('{"id":"email_fixture"}');}});
  const post=r.load('app/api/webhooks/asaas-payment/route.ts').POST;
  assert.equal((await post(request(payload))).status,200);
  assert.equal((await post(request(payload))).status,200);
  assert.equal(p.order.origin,'assisted');assert.equal(p.order.source_lead_id,73);assert.equal(sends,1);
  assert.ok(p.operations.some(c=>c.rpc==='aprovar_pagamento_api_comercial'));
  assert.ok(p.operations.some(c=>c.rpc==='registrar_evento_financeiro_comercial'));
});
test('3DS confirmado notifica uma vez mesmo com recorrencia pendente; replay retoma sem duplicar email',async()=>{
  const p=database({...base(),payment_method:'asaas_card',billing_period:'monthly',total_cents:50000,
    provider_card_flow:'initial_3ds',provider_charge_id:'pay_fake',provider_first_due_date:'2099-01-31'});
  const payload=event();Object.assign(payload.payment,{billingType:'CREDIT_CARD',value:500});
  let sends=0,subscriptions=0;
  const r=runtime(p,{api:async()=>({ok:true,body:payload.payment}),subscription:async()=>{subscriptions++;return false;},
    mailFetch:async()=>{sends++;return new Response('{"id":"email_fixture"}');}});
  r.env.V2G_CHECKOUT_3DS_SCHEMA_ENABLED='true';
  const post=r.load('app/api/webhooks/asaas-payment/route.ts').POST;
  for(let i=0;i<2;i++){
    const response=await post(request(payload));assert.equal(response.status,503);assert.equal(response.body.erro,'assinatura_requer_conciliacao');
    assert.equal(p.order.status,'payment_approved');assert.equal(p.order.provider_subscription_id,null);
  }
  assert.equal(sends,1);assert.equal(subscriptions,2);assert.equal(p.events.size,1);
  assert.equal(p.tables.commercial_payment_email_outbox[0].status,'accepted');
});
