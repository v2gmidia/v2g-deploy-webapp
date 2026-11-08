/** Código real em VM sem env herdado; transporte/DB explicitamente fictícios. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {configProducao} from './test-utils/config-producao.mjs';
import {adminMemoria} from './test-utils/admin-memoria.mjs';
const id='00000000-0000-4000-8000-000000000001';
const policy=ambienteTs().load('lib/contratacao/ambiente-producao.ts');
const qa=ambienteTs().load('lib/contratacao/ambiente-checkout.ts');
const jsonPort={'next/server':{NextResponse:{json:(body,{status=200}={})=>({body,status})}}};
const headersApp=(patch={})=>new Headers({host:'app.v2gmidia.com.br','x-forwarded-proto':'https',...patch});
test('produção default OFF; nenhuma configuração parcial, preview ou QA abre compras',()=>{
  assert.equal(policy.novasComprasProducaoSeguras({}),false);
  assert.equal(policy.processamentoProducaoSeguro({}),false);
  const env=configProducao();assert.equal(policy.novasComprasProducaoSeguras(env),true);
  for(const name of Object.keys(env).filter(n=>!['ASAAS_API_KEY','ASAAS_WEBHOOK_TOKEN'].includes(n))) {
    assert.equal(policy.novasComprasProducaoSeguras({...env,[name]:undefined}),false,name);
  }
  for(const patch of [{VERCEL_ENV:'preview'},{ASAAS_ENVIRONMENT:'sandbox'},
    {NEXT_PUBLIC_SUPABASE_URL:'https://zskpijnqgkqwxksqmzmf.supabase.co'},
    {V2G_PRODUCTION_CHECKOUT_URL:env.V2G_PRODUCTION_CHECKOUT_URL+'?next=evil'},
    {ASAAS_PRODUCTION_API_KEY:env.ASAAS_API_KEY},{ASAAS_PRODUCTION_WEBHOOK_TOKEN:env.ASAAS_WEBHOOK_TOKEN},
    {V2G_CHECKOUT_SECURITY_HASH_SECRET:'curto'}])
    assert.equal(policy.novasComprasProducaoSeguras({...env,...patch}),false);
  const runtime=ambienteTs({env}).load('lib/contratacao/ambiente-checkout.ts');
  assert.equal(runtime.checkoutSandboxSeguroNesteServidor(),false);
  assert.ok(qa.checkoutSandboxSeguro);
});
test('fechar novas compras preserva processamento de pagamentos em voo',()=>{
  const env={...configProducao(),V2G_PRODUCTION_CHECKOUT_ENABLED:'false'};
  assert.equal(policy.novasComprasProducaoSeguras(env),false);
  assert.equal(policy.processamentoProducaoSeguro(env),true);
});

test('origem produtiva é exclusivamente app V2G; domínio de projeto não autoriza preview nem alias antigo',()=>{
  const env=configProducao();
  assert.equal(policy.URL_COMPRA_PRODUCAO,'https://app.v2gmidia.com.br/contratar');
  for(const host of ['v2g-deploy-webapp.vercel.app','v2gmidia.com.br','www.v2gmidia.com.br',
    'v2g-webapp-qa.vercel.app','preview.vercel.app','app.v2gmidia.com.br.evil.example']) {
    const other={...env,NEXT_PUBLIC_SITE_URL:`https://${host}`,V2G_PRODUCTION_CHECKOUT_URL:`https://${host}/contratar`,
      VERCEL_PROJECT_PRODUCTION_URL:host,V2G_TURNSTILE_ALLOWED_HOSTNAMES:host};
    assert.equal(policy.processamentoProducaoSeguro(other),false,host);
    assert.equal(policy.novasComprasProducaoSeguras(other),false,host);
    assert.equal(policy.requisicaoProducaoSegura(headersApp({host}),false,env),false,host);
  }
  assert.equal(policy.processamentoProducaoSeguro({...env,VERCEL_PROJECT_PRODUCTION_URL:'v2g-deploy-webapp.vercel.app'}),false);
  assert.equal(policy.processamentoProducaoSeguro({...env,VERCEL_ENV:'preview'}),false);
  assert.equal(policy.processamentoProducaoSeguro({...env,VERCEL_PROJECT_ID:'prj_outro'}),false);
  assert.equal(policy.novasComprasProducaoSeguras({...env,V2G_TURNSTILE_ALLOWED_HOSTNAMES:'app.v2gmidia.com.br,v2g-deploy-webapp.vercel.app'}),false);
  assert.equal(policy.processamentoProducaoSeguro({...env,VERCEL_URL:'deployment-gerado.vercel.app'}),true);
  assert.equal(policy.processamentoProducaoSeguro({...env,V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED:undefined}),false);
  assert.equal(policy.novasComprasProducaoSeguras({...env,V2G_PRODUCTION_CHECKOUT_ENABLED:undefined}),false);
});
test('requisição produtiva exige HTTPS, host exato e origem do app para mutações',()=>{
  const env=configProducao();
  assert.equal(policy.requisicaoProducaoSegura(headersApp(),false,env),true);
  assert.equal(policy.requisicaoProducaoSegura(headersApp(),true,env),false);
  assert.equal(policy.requisicaoProducaoSegura(headersApp({origin:'https://app.v2gmidia.com.br'}),true,env),true);
  for(const patch of [{'x-forwarded-proto':'http'},{host:'app.v2gmidia.com.br:444'},
    {host:'evil.example','x-forwarded-host':'app.v2gmidia.com.br'},
    {origin:'https://v2gmidia.com.br'},{origin:'https://v2g-deploy-webapp.vercel.app'},
    {origin:'null'},{origin:'https://app.v2gmidia.com.br.evil.example'}])
    assert.equal(policy.requisicaoProducaoSegura(headersApp(patch),false,env),false);
});
test('transporte produtivo: host/chave próprios, sem redirect/retry; caminhos inválidos não chamam rede',async()=>{
  const env=configProducao(),calls=[];
  const m=ambienteTs({env,fetch:async(url,opts)=>{calls.push({url,opts});return new Response('{"id":"pay_fixture"}');}})
    .load('lib/contratacao/asaas-producao.ts');
  assert.equal((await m.asaasProducao('/payments',{method:'POST',body:{value:5280}},'purchase')).ok,true);
  assert.equal(calls[0].url,'https://api.asaas.com/v3/payments');
  assert.equal(calls[0].opts.headers.access_token,env.ASAAS_PRODUCTION_API_KEY);
  assert.equal(calls[0].opts.redirect,'error');assert.equal(calls[0].opts.cache,'no-store');
  for(const path of ['https://evil.example','//evil.example','/../payments','/payments/../customers',
    '/payments/%2e%2e/customers','/payments/pay_%2fetc','/customers','/payments#x'])
    assert.equal((await m.asaasProducao(path)).ok,false,path);
  assert.equal((await m.asaasProducao('/subscriptions',{method:'POST'},'purchase')).ok,false);
  assert.equal(calls.length,1);
  env.V2G_PRODUCTION_CHECKOUT_ENABLED='false';
  assert.equal((await m.asaasProducao('/payments',{method:'POST'},'purchase')).ok,false);
  assert.equal((await m.asaasProducao('/payments/pay_fixture')).ok,true);
  assert.equal(calls.length,2);
  env.V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED='false';
  assert.equal((await m.asaasProducao('/payments/pay_fixture')).ok,false);assert.equal(calls.length,2);
});
test('bridge escolhe produção, callback próprio e fecha se readiness faltar',async()=>{
  const env=configProducao();const m=ambienteTs({env}).load('lib/contratacao/provedor-compra.ts');
  assert.equal(m.callback3dsCompra(id),`https://app.v2gmidia.com.br/contratar/pagamento?ref=${id}`);
  for(const r of [{data:null,error:{}},{data:0,error:null},{data:true,error:null}])
    assert.equal(await m.schemaCompraPronto({rpc:async()=>r}),false);
  assert.equal(await m.schemaCompraPronto({rpc:async()=>({data:1,error:null})}),true);
  assert.equal(await m.schemaCompraPronto({rpc:async()=>{throw Error('db');}}),false);
});
test('QA real continua no host/chave de teste e callback QA, sem depender do modo produção',async()=>{
  const env={NODE_ENV:'production',V2G_CHECKOUT_ENABLED:'true',ASAAS_ENVIRONMENT:'sandbox',
    NEXT_PUBLIC_SUPABASE_URL:'https://zskpijnqgkqwxksqmzmf.supabase.co',
    V2G_CHECKOUT_SANDBOX_DB_REF:'zskpijnqgkqwxksqmzmf',V2G_CHECKOUT_QA_DEPLOY_ENABLED:'true',
    VERCEL_PROJECT_ID:'prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn',VERCEL_PROJECT_PRODUCTION_URL:'v2g-webapp-qa.vercel.app',
    NEXT_PUBLIC_SITE_URL:'https://v2g-webapp-qa.vercel.app',ASAAS_API_KEY:'qa-fixture',ASAAS_PRODUCTION_API_KEY:'production-fixture'};
  const calls=[];const m=ambienteTs({env,fetch:async(url,opts)=>{calls.push({url,opts});return new Response('{"id":"pay_fixture"}');}})
    .load('lib/contratacao/provedor-compra.ts');
  assert.equal(m.compraDisponivel(),true);assert.equal(policy.processamentoProducaoSeguro(env),false);
  assert.equal(m.callback3dsCompra(id),`https://v2g-webapp-qa.vercel.app/contratar/pagamento?ref=${id}`);
  assert.equal(await m.schemaCompraPronto({rpc:()=>{throw Error('QA não exige nova migration');}}),true);
  await m.provedorDaCompra('purchase')('/payments',{method:'POST',body:{value:500}});
  assert.equal(calls[0].url,'https://api-sandbox.asaas.com/v3/payments');assert.equal(calls[0].opts.headers.access_token,env.ASAAS_API_KEY);
});
test('status de produção continua disponível com compras/API novas fechadas; resposta não expõe dados',async()=>{
  const env={...configProducao(),V2G_PRODUCTION_CHECKOUT_ENABLED:'false',V2G_CHECKOUT_API_ENABLED:'false'};
  const order={id,external_ref:id,status:'payment_approved',origin:'self_service',payment_method:'asaas_pix',provider_charge_id:'pay_fixture'};
  const db=adminMemoria({commercial_orders:[order],commercial_payment_events:[]},async()=>({data:1,error:null}));
  const m=ambienteTs({env,ports:{...jsonPort,'@/lib/supabase/admin':{createAdminClient:()=>db.admin}}})
    .load('app/api/contratar/status/route.ts');
  const r=await m.GET({headers:headersApp(),nextUrl:new URL(`https://app.v2gmidia.com.br/api/contratar/status?ref=${id}`)});
  assert.equal(r.status,200);assert.equal(r.body.status,'payment_approved');assert.deepEqual(Object.keys(r.body),['status']);
  const antigo=await m.GET({headers:headersApp({host:'v2g-deploy-webapp.vercel.app'}),
    nextUrl:new URL(`https://v2g-deploy-webapp.vercel.app/api/contratar/status?ref=${id}`)});
  assert.equal(antigo.status,403);
});

test('páginas reais de compra/pagamento negam alias antigo antes de consultar Auth ou banco',async()=>{
  for(const host of ['v2g-deploy-webapp.vercel.app','v2gmidia.com.br','preview.vercel.app']) {
    let db=0,auth=0;
    const runtime=ambienteTs({env:configProducao(),ports:{
      'next/navigation':{notFound:()=>{throw Error('NOT_FOUND_FIXTURE');},redirect:()=>{throw Error('não redirecionar');}},
      'next/headers':{headers:async()=>headersApp({host}),cookies:()=>{throw Error('não ler cookies');}},
      'next/link':{default:()=>null},'@/components/ui/Marca':{Marca:()=>null},
      '@/lib/supabase/admin':{createAdminClient:()=>{db++;throw Error('não consultar banco');}},
      '@/lib/supabase/server':{createClient:()=>{auth++;throw Error('não consultar Auth');}},
      './FormularioContratar':{FormularioContratar:()=>null},'./contratar.css':{},'../contratar.css':{},
      './PagamentoFormulario':{PagamentoFormulario:()=>null},'./EstadoPagamento':{EstadoPagamento:()=>null},'./CopiarPix':{CopiarPix:()=>null},
    }});
    await assert.rejects(runtime.load('app/contratar/page.tsx').default(),/NOT_FOUND_FIXTURE/);
    await assert.rejects(runtime.load('app/contratar/pagamento/page.tsx').default({searchParams:Promise.resolve({ref:id})}),/NOT_FOUND_FIXTURE/);
    assert.equal(db,0);assert.equal(auth,0);
  }
});

const payment={id:'pay_fixture',customer:'cus_fixture',subscription:null,billingType:'PIX',
  value:5280,status:'CONFIRMED',dueDate:'2026-11-05',externalReference:id};
const event=(type='PAYMENT_CONFIRMED',patch={})=>({id:'evt_'+type,event:type,payment:{...payment,...patch}});
function webhook({env=configProducao(),schema=1,orderPatch={},missing=false,canonicalPatch={},canonicalOk=true,requestPatch={},
  registered=false,flow='direct',rpcOk=true}={}) {
  const calls=[],seen=new Set();
  const order={id,status:'awaiting_payment',origin:'self_service',payment_method:'asaas_pix',
    billing_period:'annual_upfront',total_cents:528000,provider_customer_id:'cus_fixture',provider_charge_id:'pay_fixture',
    provider_subscription_id:null,provider_first_due_date:null,provider_checkout_id:null,...orderPatch};
  const admin={from(table){const filters={};const q={select:()=>q,eq:(k,v)=>{filters[k]=v;return q;},
    is:(k,v)=>{filters[k]=v;return q;},
    maybeSingle:async()=>({data:missing?null:order,error:null}),
    single:async()=>({data:{provider_card_flow:flow},error:null}),
    then(resolve,reject){assert.equal(table,'commercial_payment_events');calls.push(['ledger',filters]);
      return Promise.resolve({count:registered?1:0,error:null}).then(resolve,reject);}};return q;},
    rpc:async(name,args)=>{if(name==='checkout_producao_schema_v1')return {data:schema,error:null};
      calls.push(['rpc',name,args]);seen.add(args.p_event_id);
      if(rpcOk&&name.startsWith('aprovar_'))order.status='payment_approved';return {data:rpcOk,error:null};}};
  const runtime=ambienteTs({env,ports:{...jsonPort,
    '@/lib/supabase/admin':{createAdminClient:()=>admin},
    './asaas-producao':{asaasProducao:async path=>{calls.push(['canonical',path]);return {ok:canonicalOk,body:{...payment,...canonicalPatch}};}},
    '@/lib/contratacao/asaas-sandbox':{asaasSandbox:()=>{throw Error('produção nunca usa QA');}},
    '@/lib/contratacao/ensaio-encerrado':{reconhecerEnsaioEncerrado:()=>{throw Error('produção não aceita exceção QA');}},
    '@/lib/contratacao/processar-email-pagamento':{processarEmailPagamento:async(_a,_id,_charge,mode)=>{calls.push(['email',mode]);return true;}},
    '@/lib/contratacao/processar-assinatura-3ds':{processarAssinatura3ds:async(_a,_id,mode)=>{calls.push(['subscription',mode]);return true;}},
  }});
  const prod=runtime.load('app/api/webhooks/asaas-production-payment/route.ts');
  const sandbox=runtime.load('app/api/webhooks/asaas-payment/route.ts');
  const req=(payload,token=env.ASAAS_PRODUCTION_WEBHOOK_TOKEN)=>({headers:headersApp({'asaas-access-token':token??'',...requestPatch}),json:async()=>payload});
  return {calls,seen,order,notify:(e,token)=>prod.POST(req(e,token)),qa:e=>sandbox.POST(req(e))};
}
test('endpoint de produção exige modo/token/schema; endpoint QA não aceita configuração produção',async()=>{
  const off=webhook({env:{}});assert.equal((await off.notify(event())).status,503);assert.equal(off.calls.length,0);
  const c=webhook();assert.equal((await c.notify(event(),'errado')).status,401);assert.equal(c.calls.length,0);
  assert.equal((await c.qa(event())).status,503);
  assert.equal((await webhook({schema:0}).notify(event())).status,503);
});
test('webhook produtivo no alias Vercel antigo ou host indevido não lê banco nem chama provedor',async()=>{
  for(const requestPatch of [{host:'v2g-deploy-webapp.vercel.app'},{host:'v2gmidia.com.br'},{'x-forwarded-proto':'http'}]) {
    const c=webhook({requestPatch});assert.equal((await c.notify(event())).status,403);assert.equal(c.calls.length,0);
  }
});
test('produção Pix confirmado consulta o provedor; persistência antecede email, replay não reaprovado',async()=>{
  const c=webhook();assert.equal((await c.notify(event())).status,200);
  assert.deepEqual(c.calls.map(x=>x[0]),['canonical','rpc','email']);
  assert.equal(c.calls[1][1],'aprovar_pagamento_api_self_service');assert.equal(c.calls[2][1],'production');
  assert.equal((await c.notify(event())).status,200);assert.equal(c.seen.size,1);
  assert.equal(c.calls.filter(x=>x[1]==='aprovar_pagamento_api_self_service').length,1);
});
test('produção não aceita confirmação pendente, divergente ou indisponível nem pedido órfão',async()=>{
  for(const config of [{canonicalPatch:{status:'PENDING'}},{canonicalPatch:{status:'AUTHORIZED'}},
    {canonicalPatch:{externalReference:'outro-negocio'}},{canonicalPatch:{value:500}},{canonicalOk:false},{missing:true}]) {
    const c=webhook(config);assert.ok([422,503].includes((await c.notify(event())).status));
    assert.equal(c.calls.filter(x=>['rpc','email','subscription'].includes(x[0])).length,0);
  }
  const c=webhook();assert.equal((await c.notify(event('PAYMENT_CONFIRMED',{status:'PENDING'}))).status,422);
  assert.equal(c.calls.length,0);
});
test('pendência/autorização/risco persistem sem aprovação, assinatura ou email',async()=>{
  for(const type of ['PAYMENT_CREATED','PAYMENT_AUTHORIZED','PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS']) {
    const c=webhook();assert.equal((await c.notify(event(type,{status:'PENDING'}))).status,200);
    assert.equal(c.order.status,'awaiting_payment');assert.deepEqual(c.calls.map(x=>x[0]),['rpc']);
    assert.equal(c.calls[0][1],'registrar_evento_financeiro_asaas');
  }
});
test('estorno/replay não envia email nem cria assinatura; confirmação antiga estornada exige registro exato',async()=>{
  const c=webhook({orderPatch:{status:'payment_approved'}});
  for(let i=0;i<2;i++)assert.equal((await c.notify(event('PAYMENT_REFUNDED',{status:'REFUNDED'}))).status,200);
  assert.equal(c.seen.size,1);assert.ok(c.calls.every(x=>x[0]==='rpc'));
  const old=webhook({registered:true,canonicalPatch:{status:'REFUNDED'}});
  assert.equal((await old.notify(event())).body.historico,true);
  assert.deepEqual(old.calls.map(x=>x[0]),['canonical','ledger']);
  assert.equal((await webhook({canonicalPatch:{status:'REFUNDED'}}).notify(event())).status,422);
});
test('mensal 3DS produtivo usa RPC inicial e efeitos no modo produção; novas compras fechadas não perdem confirmação',async()=>{
  const c=webhook({env:{...configProducao(),V2G_PRODUCTION_CHECKOUT_ENABLED:'false'},flow:'initial_3ds',
    orderPatch:{billing_period:'monthly',payment_method:'asaas_card',total_cents:50000,provider_first_due_date:'2026-11-05'},
    canonicalPatch:{billingType:'CREDIT_CARD',value:500}});
  assert.equal((await c.notify(event('PAYMENT_CONFIRMED',{billingType:'CREDIT_CARD',value:500}))).status,200);
  assert.deepEqual(c.calls.map(x=>x[0]),['canonical','rpc','email','subscription']);
  assert.equal(c.calls[1][1],'registrar_evento_inicial_3ds');
  assert.equal(c.calls[2][1],'production');assert.equal(c.calls[3][1],'production');
});
test('origem assistida ou valor de outro pedido recusa sem efeitos',async()=>{
  for(const patch of [{origin:'assisted'},{total_cents:50000},{provider_customer_id:'cus_outro'}]) {
    const c=webhook({orderPatch:patch});assert.equal((await c.notify(event())).status,422);
    assert.equal(c.calls.filter(x=>['rpc','email','subscription'].includes(x[0])).length,0);
  }
});

function emailProd({canonicalStatus='CONFIRMED',adverso=false,envPatch={},schema=1}={}) {
  const env={...configProducao(),...envPatch};let row=null,sends=0;const calls=[];
  const order={id,buyer_email:'comprador@example.invalid',legal_name:'Negocio Ficticio',status:'payment_approved',total_cents:528000,
    provider_customer_id:'cus_fixture',provider_charge_id:'pay_fixture',provider_subscription_id:null,billing_period:'annual_upfront',provider_card_flow:'direct'};
  const admin={rpc:async()=>({data:schema,error:null}),from(table){const q={select:()=>q,eq:()=>q,
    in:async()=>({count:adverso?1:0,error:null}),
    upsert:async body=>{row??={id:'email-fixture',status:'queued',payload:body.payload};return {error:null};},
    update:patch=>{Object.assign(row,patch);return q;},maybeSingle:async()=>({data:{id:row.id},error:null}),
    single:async()=>({data:table==='commercial_orders'?order:row,error:null})};return q;}};
  const m=ambienteTs({env,ports:{
    './asaas-producao':{asaasProducao:async()=>{calls.push('canonical');return {ok:true,body:{...payment,status:canonicalStatus}};}},
    './asaas-sandbox':{asaasSandbox:()=>{throw Error('produção não usa QA');}},
  },fetch:async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sends++;
    assert.equal(options.headers.Authorization,`Bearer ${env.V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY}`);
    const body=JSON.parse(options.body);assert.deepEqual(body.to,[order.buyer_email]);
    assert.doesNotMatch(body.subject,/TESTE/);assert.match(body.text,/https:\/\/app\.v2gmidia\.com\.br\/entrar/);
    return new Response('{"id":"email-provider-fixture"}');}}).load('lib/contratacao/processar-email-pagamento.ts');
  return {run:()=>m.processarEmailPagamento(admin,id,'pay_fixture','production'),state:()=>({row,sends,calls})};
}
test('email produtivo confirma comprador, usa chave própria e outbox impede reenvio',async()=>{
  const c=emailProd({envPatch:{V2G_PRODUCTION_CHECKOUT_ENABLED:'false'}});
  assert.equal(await c.run(),true);assert.equal(await c.run(),true);
  assert.equal(c.state().sends,1);assert.equal(c.state().row.status,'accepted');
});
test('email pendente/estornado/ocorrência ou modo/schema desabilitados não envia',async()=>{
  for(const config of [{canonicalStatus:'PENDING'},{canonicalStatus:'REFUNDED'},{adverso:true},{schema:0},
    {envPatch:{V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED:'false'}},{envPatch:{V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED:'false'}}]) {
    const c=emailProd(config);await c.run();assert.equal(c.state().sends,0);
  }
});

function compra({method='asaas_card',period='monthly',schema=1,timeout=false,envPatch={},requestPatch={},turnstilePatch={}}={}) {
  const env={...configProducao(),...envPatch},calls=[],rpcCalls=[];
  const order={id,external_ref:id,status:'awaiting_payment',origin:'self_service',buyer_email:'comprador@example.invalid',
    buyer_name:'Pessoa Ficticia',buyer_whatsapp:'11999990000',legal_name:'Negocio Ficticio',cnpj:'00000000191',
    payment_method:method,billing_period:period,total_cents:period==='monthly'?50000:period==='semiannual_upfront'?285000:528000,
    provider_card_flow:'direct',payment_attempt_count:0,provider_checkout_id:null,provider_checkout_url:null,
    provider_customer_id:null,provider_charge_id:null,provider_subscription_id:null,checkout_creation_started_at:null,
    payment_creation_started_at:null,provider_first_due_date:null};
  const rows={commercial_orders:[order],checkout_3ds_context:[]};
  const db=adminMemoria(rows,async(name,args)=>{rpcCalls.push([name,args]);
    return {data:name==='checkout_producao_schema_v1'?schema:name==='registrar_pedido_self_service'?id:true,error:null};});
  const redir=url=>{throw Object.assign(Error('redirect'),{url});};
  const runtime=ambienteTs({env,ports:{
    'next/navigation':{redirect:redir},
    'next/headers':{headers:async()=>headersApp({'x-vercel-id':'fixture','x-vercel-forwarded-for':'203.0.113.1',
      origin:'https://app.v2gmidia.com.br','user-agent':'fixture-browser',...requestPatch}),cookies:async()=>({set:()=>{}})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null}})}})},
    '@/lib/supabase/admin':{createAdminClient:()=>db.admin},
  },fetch:async(url,opts)=>{
    calls.push({url,opts});
    if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify')
      return new Response(JSON.stringify({success:true,hostname:'app.v2gmidia.com.br',action:'checkout',...turnstilePatch}));
    assert.equal(opts.headers.access_token,env.ASAAS_PRODUCTION_API_KEY);
    if(url==='https://api.asaas.com/v3/customers') return new Response('{"id":"cus_fixture"}');
    assert.equal(url,'https://api.asaas.com/v3/payments');
    if(timeout) throw Error('timeout fictício');
    return new Response(JSON.stringify({id:'pay_fixture',status:'PENDING',threeDSecureChallengeUrl:method==='asaas_card'?'https://emissor.example.com/challenge':null}));
  }});
  const form=new FormData();
  for(const [k,v] of Object.entries({referencia:id,nome:'Pessoa Ficticia',email:order.buyer_email,whatsapp:order.buyer_whatsapp,
    razaoSocial:order.legal_name,cnpj:order.cnpj,contas:'1',periodo:period,metodo:method,vendeWhatsApp:'sim','cf-turnstile-response':'fixture-token'}))form.set(k,v);
  const card=new FormData();
  for(const [k,v] of Object.entries({ref:id,holderName:'Pessoa Ficticia',holderDocument:'00000000191',cardNumber:'4111111111111111',
    expiryMonth:'12',expiryYear:String(new Date().getFullYear()+2),ccv:'123',postalCode:'01001000',addressNumber:'1','cf-turnstile-response':'fixture-token',
    deviceInfo:JSON.stringify({colorDepth:24,screenHeight:900,screenWidth:1440,timeZoneOffset:3,language:'pt-BR'})}))card.set(k,v);
  return {env,order,calls,rpcCalls,writes:db.writes,rows,
    start:()=>runtime.load('app/contratar/actions.ts').iniciarCompra({},form),
    pay:()=>runtime.load('lib/contratacao/iniciar-pagamento.ts').iniciarPagamentoInterno({},card)};
}
test('entrada de compra default OFF não acessa Auth/DB/rede; schema ausente não registra pedido',async()=>{
  let auth=0;const runtime=ambienteTs({ports:{
    'next/navigation':{redirect:()=>{throw Error('não permitido');}},
    'next/headers':{},'@/lib/supabase/server':{createClient:()=>{auth++;throw Error('não permitido');}},
    '@/lib/supabase/admin':{createAdminClient:()=>{throw Error('não permitido');}},
  }});
  const r=await runtime.load('app/contratar/actions.ts').iniciarCompra({},new FormData());
  assert.ok(r.erro);assert.equal(auth,0);
  const c=compra({schema:0});assert.ok((await c.start()).erro);
  assert.equal(c.rpcCalls.filter(x=>x[0]==='registrar_pedido_self_service').length,0);assert.equal(c.calls.length,0);
});
test('actions reais recusam host/origem antigos antes de pedido, cartão ou HTTP; Turnstile de outro host não cria pedido',async()=>{
  for(const requestPatch of [{host:'v2g-deploy-webapp.vercel.app'},{origin:'https://v2gmidia.com.br'},
    {origin:'https://v2g-deploy-webapp.vercel.app'},{'x-forwarded-proto':'http'}]) {
    const c=compra({requestPatch});assert.ok((await c.start()).erro);assert.ok((await c.pay()).erro);
    assert.equal(c.rpcCalls.length,0);assert.equal(c.writes.length,0);assert.equal(c.calls.length,0);
  }
  for(const turnstilePatch of [{hostname:'v2g-deploy-webapp.vercel.app'},
    {hostname:'v2g-webapp-qa.vercel.app'},{hostname:'v2gmidia.com.br'},
    {hostname:'evil.example'},{action:'outra'},{success:false}]) {
    const c=compra({turnstilePatch});assert.ok((await c.start()).erro);
    assert.equal(c.rpcCalls.filter(x=>x[0]==='registrar_pedido_self_service').length,0);
    assert.equal(c.calls.filter(x=>x.url.startsWith('https://api.asaas.com')).length,0);
    assert.equal(c.writes.length,0);
  }
});
test('Pix produtivo: action -> RPC -> reserva -> cliente/cobrança, mantendo referência e descontos à vista',async()=>{
  for(const period of ['annual_upfront','semiannual_upfront']) {
  const c=compra({method:'asaas_pix',period});
  await assert.rejects(c.start(),e=>e.url===`/contratar/pagamento?ref=${id}`);
  const paymentCall=c.calls.find(x=>x.url==='https://api.asaas.com/v3/payments');
  assert.ok(paymentCall);const body=JSON.parse(paymentCall.opts.body);
  assert.equal(body.billingType,'PIX');assert.equal(body.value,period==='annual_upfront'?5280:2850);assert.equal(body.externalReference,id);
  assert.equal(c.order.provider_charge_id,'pay_fixture');assert.equal(c.order.status,'awaiting_payment');
  const before=c.calls.length;assert.ok((await c.pay()).erro);assert.equal(c.calls.length,before);
  }
});
test('mensal e anual no cartão produtivo pedem 3DS; só mensal guarda IP e prepara recorrência',async()=>{
  for(const period of ['monthly','annual_upfront']) {
    const c=compra({period});await assert.rejects(c.start(),e=>e.url===`/contratar/pagamento?ref=${id}`);
    assert.equal(c.calls.filter(x=>x.url.startsWith('https://api.asaas.com')).length,0);
    await assert.rejects(c.pay(),e=>e.url==='https://emissor.example.com/challenge');
    const body=JSON.parse(c.calls.find(x=>x.url==='https://api.asaas.com/v3/payments').opts.body);
    assert.equal(body.threeDSecure.callbackUrl,`https://app.v2gmidia.com.br/contratar/pagamento?ref=${id}`);
    assert.equal(body.deviceInfo.remoteIp,'203.0.113.1');assert.equal(body.deviceInfo.userAgent,'fixture-browser');
    assert.equal(body.value,period==='monthly'?500:5280);
    assert.equal(c.order.provider_card_flow,period==='monthly'?'initial_3ds':'direct');
    assert.equal(c.rows.checkout_3ds_context.length,period==='monthly'?1:0);
    assert.doesNotMatch(JSON.stringify(c.writes),/4111111111111111|"ccv"|creditCardToken|creditCardHolderInfo/);
    assert.equal(c.order.status,'awaiting_payment'); // Retorno/challenge não aprova pagamento.
  }
});
test('timeout da cobrança preserva reserva: reenvio não faz outro POST',async()=>{
  const c=compra({timeout:true});assert.ok((await c.pay()).erro);
  const before=c.calls.length;assert.ok((await c.pay()).erro);assert.equal(c.calls.length,before);
  assert.equal(c.calls.filter(x=>x.url==='https://api.asaas.com/v3/payments').length,1);
  assert.equal(c.order.provider_charge_id,null);assert.ok(c.order.payment_creation_started_at);
});
function assinaturaProd({timeout=false,envPatch={}}={}) {
  const env={...configProducao(),V2G_PRODUCTION_CHECKOUT_ENABLED:'false',...envPatch},calls=[];
  const order={id,status:'payment_approved',total_cents:50000,provider_card_flow:'initial_3ds',
    provider_charge_id:'pay_fixture',provider_customer_id:'cus_fixture',provider_first_due_date:'2099-01-31',
    provider_subscription_id:null,subscription_creation_started_at:null,provider_subscription_first_due_date:null};
  const rows={commercial_orders:[order],commercial_payment_events:[],
    checkout_3ds_context:[{order_id:id,payer_ip:'203.0.113.1',expires_at:'2099-02-01T00:00:00Z'}]};
  const db=adminMemoria(rows,async(name,args)=>{
    if(name==='checkout_producao_schema_v1')return {data:1,error:null};
    assert.equal(name,'reservar_assinatura_apos_3ds');
    if(order.subscription_creation_started_at)return {data:false,error:null};
    order.subscription_creation_started_at='2099-01-31T00:00:00Z';order.provider_subscription_first_due_date=args.p_next_due_date;
    return {data:true,error:null};
  });
  const sub={id:'sub_fixture',customer:'cus_fixture',externalReference:id,billingType:'CREDIT_CARD',
    cycle:'MONTHLY',value:500,nextDueDate:'2099-02-28',status:'ACTIVE',deleted:false};
  const m=ambienteTs({env,fetch:async(url,opts)=>{
    calls.push({url,opts});assert.equal(opts.headers.access_token,env.ASAAS_PRODUCTION_API_KEY);
    if(url.endsWith('/payments/pay_fixture'))return new Response(JSON.stringify({...payment,billingType:'CREDIT_CARD',value:500,
      dueDate:'2099-01-31',creditCard:{creditCardToken:'token-ficticio-somente-em-memoria'}}));
    if(url.includes('/subscriptions?'))return new Response(JSON.stringify({hasMore:false,data:timeout?[]:[sub]}));
    assert.equal(url,'https://api.asaas.com/v3/subscriptions');assert.equal(opts.method,'POST');
    const body=JSON.parse(opts.body);assert.equal(body.nextDueDate,'2099-02-28');assert.equal(body.remoteIp,'203.0.113.1');
    assert.equal(body.creditCard,undefined);assert.equal(body.creditCardHolderInfo,undefined);
    if(timeout)throw Error('timeout fictício');return new Response(JSON.stringify(sub));
  }}).load('lib/contratacao/processar-assinatura-3ds.ts');
  return {calls,order,writes:db.writes,run:()=>m.processarAssinatura3ds(db.admin,id,'production')};
}
test('adaptador mensal real continua com checkout fechado, cria mês seguinte uma vez e não persiste token',async()=>{
  const c=assinaturaProd();assert.equal(await c.run(),true);assert.equal(await c.run(),true);
  assert.equal(c.order.provider_subscription_id,'sub_fixture');
  assert.equal(c.calls.filter(x=>x.opts.method==='POST').length,1);
  assert.doesNotMatch(JSON.stringify(c.writes),/creditCardToken|token-ficticio|4111111111111111/);
});
test('assinatura ambígua só consulta no replay, não cria outra; processamento OFF não chama provedor',async()=>{
  const c=assinaturaProd({timeout:true});assert.equal(await c.run(),false);assert.equal(await c.run(),false);
  assert.equal(c.calls.filter(x=>x.opts.method==='POST').length,1);
  const off=assinaturaProd({envPatch:{V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED:'false'}});
  assert.equal(await off.run(),false);assert.equal(off.calls.length,0);
});
