/** Ensaio de portas locais, nao certificacao HTTP/DB/Auth/provedor. Nenhuma rede. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { validarPedidoAssistido } from '../lib/contratacao/pedido-assistido.ts';
import { lerPagamentoConfirmado } from '../lib/contratacao/pagamento-evento.ts';
import { EVENTOS_FINANCEIROS, lerEventoFinanceiro } from '../lib/contratacao/evento-financeiro.ts';
import { vincularComprasAprovadasComCliente } from '../lib/contratacao/vincular-core.ts';
import { temAcessoWebApp } from '../lib/contratacao/acesso.ts';
import { pendenciaDoOnboarding } from '../lib/onboarding/conclusao.ts';
import { prepararEmailPagamento } from '../lib/contratacao/email-pagamento.ts';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
const require = createRequire(import.meta.url), ts = require('typescript');
const buyer = { id:'perfil-ficticio', email:'lead@example.invalid', email_confirmed_at:'2026-10-21T12:00:00Z', app_metadata:{} };
const initial = () => ({ id:'00000000-0000-4000-8000-000000000001', source_system:'v2g_site', source_lead_id:73,
  status:'awaiting_payment', origin:'self_service', payment_method:'asaas_pix', billing_period:'annual_upfront',
  total_cents:528000, provider_customer_id:'cus_fake', provider_charge_id:'pay_fake',
  provider_subscription_id:null, provider_checkout_id:null, buyer_email:buyer.email, buyer_profile_id:null, business_id:'negocio-certo' });
function ports(order) {
  const rows = { commercial_orders:[order], businesses:[{ id:'negocio-certo', profile_id:null, claim_email:buyer.email },
    { id:'negocio-outro', profile_id:'outro-perfil', claim_email:buyer.email }], webapp_legacy_access:[] };
  const events = new Set(); let mails = 0;
  const admin = { from(table) {
    let filters = [], patch = null, single = false;
    const q = { select:()=>q, order:()=>q, range:()=>q, limit:()=>q,
      eq:(key,value)=>{ filters.push(r=>r[key]===value); return q; },
      is:(key,value)=>{ filters.push(r=>r[key]===value); return q; },
      in:(key,values)=>{ filters.push(r=>values.includes(r[key])); return q; },
      not:(key,_op,value)=>{ filters.push(r=>r[key]!==value); return q; },
      update:value=>{ patch=value; return q; },
      maybeSingle:()=>{ single=true; return q; },
      then(resolve,reject) { const found=rows[table].filter(r=>filters.every(f=>f(r)));
        if(patch) found.forEach(r=>Object.assign(r,patch));
        return Promise.resolve({ data:single ? found[0]??null : found, error:null }).then(resolve,reject); } };
    return q;
  }, async rpc(name, args) {
    // Porta de persistencia simulada: nao substitui teste da RPC PostgreSQL.
    events.add(args.p_event_id);
    if(name==='aprovar_pagamento_api_self_service') order.status='payment_approved';
    return { data:true,error:null };
  } };
  const deps = {
    'node:crypto':require('node:crypto'),
    'next/server':{ NextResponse:{ json:(body,{status=200}={})=>({body,status}) } },
    '@/lib/supabase/admin':{ createAdminClient:()=>admin },
    '@/lib/contratacao/ambiente-checkout':{ checkoutSandboxSeguroNesteServidor:()=>true },
    '@/lib/contratacao/pagamento-evento':{ lerPagamentoConfirmado },
    '@/lib/contratacao/evento-financeiro':{ EVENTOS_FINANCEIROS,lerEventoFinanceiro },
    '@/lib/contratacao/origem-asaas-servidor':ambienteTs().load('lib/contratacao/origem-asaas-servidor.ts'),
    '@/lib/contratacao/confirmacao-canonica':ambienteTs().load('lib/contratacao/confirmacao-canonica.ts'),
    '@/lib/contratacao/asaas-sandbox':{asaasSandbox:()=>{throw Error('fora do recorte legado/self-service sem 3DS');}},
    '@/lib/contratacao/processar-assinatura-3ds':{ processarAssinatura3ds:()=>{throw Error('fora deste recorte');} },
    '@/lib/contratacao/processar-email-pagamento':{ processarEmailPagamento:async()=>{
      const message=prepararEmailPagamento({ orderId:order.id,email:order.buyer_email,negocio:'Ficticio',statusPedido:order.status,
        chargeId:'pay_fake',customerId:'cus_fake',subscriptionId:null,totalCentavos:order.total_cents,primeiraCompra:true },
      { id:'pay_fake',customer:'cus_fake',status:'CONFIRMED',value:5280 },'https://v2g-webapp-qa.vercel.app');
      assert.ok(message); mails++; return true;
    } },
  };
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/api/webhooks/asaas-payment/route.ts',import.meta.url),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports:module.exports,module,require:key=>{if(!deps[key])throw Error(key);return deps[key];},Buffer,
      process:{env:{ASAAS_WEBHOOK_TOKEN:'x'.repeat(32),V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'false'}}});
  const notify=async(payload)=>module.exports.POST({headers:new Headers({'asaas-access-token':'x'.repeat(32)}),json:async()=>payload});
  return {admin,rows,events,notify,get mails(){return mails;}};
}
const confirmed = { id:'evt_fake',event:'PAYMENT_CONFIRMED',payment:{id:'pay_fake',customer:'cus_fake',billingType:'PIX',
  status:'CONFIRMED',value:5280,dueDate:'2099-01-01',externalReference:initial().id} };

test('Pix legado da LP permanece separado: webhook Asaas nao o aprova',async()=>{
  // Handler LP real, com RPC e alerta como portas simuladas; sem .env ou rede.
  let captured,alertFailures=0,response;
  const lp={exports:{}};
  const leadRequire=createRequire(new URL('../../lp/api/pre-cadastro.js',import.meta.url));
  vm.runInNewContext(readFileSync(new URL('../../lp/api/pre-cadastro.js',import.meta.url),'utf8'),{
    module:lp,exports:lp.exports,require:key=>key==='./_alerta-lead'
      ? {alertarNovoLead:async()=>{alertFailures++;return {estado:'pendente',referencia:'fixture'};}} : leadRequire(key),
    process:{env:{LEADS_SIMULAR:'0',LEADS_CNPJ_RPC_ENABLED:'1',SUPABASE_URL:'https://qa.example.invalid',
      SUPABASE_ANON_KEY:'fixture',IP_HASH_SALT:'fixture'}},Buffer,URL,AbortSignal,
    console:{error(){},log(){}},fetch:async(_url,options)=>{captured=JSON.parse(options.body);return new Response('{"ok":true}');},
  });
  const res={setHeader(){},end(raw){response=JSON.parse(raw);}};
  await lp.exports({method:'POST',headers:{accept:'application/json',host:'localhost',origin:'http://localhost'},socket:{remoteAddress:'127.0.0.1'},
    body:{nome:'Pessoa ficticia',negocio:'Negocio ficticio',email:buyer.email,whatsapp:'11999990000',cnpj:'11222333000181',
      instagram:'teste',perfil:'dono',nicho:'servicos_locais',vende_whatsapp:'sim',investe_anuncios:'nao',consentimento:'sim',
      pagina_origem:'https://www.v2gmidia.com.br/',utm_campaign:'ensaio-ficticio'}},res);
  assert.equal(res.statusCode,200);assert.equal(alertFailures,1);
  assert.equal(new URL(response.contato_url).pathname,'/5521980351531');
  assert.equal(captured.p_cnpj,'11222333000181');assert.equal(captured.p_email,buyer.email);
  const form=new FormData();
  for(const [key,value] of Object.entries({ref:initial().id,email:buyer.email,legalName:'Negocio ficticio',cnpj:'11222333000181',
    unitCount:'1',billingPeriod:'annual_upfront',declaresCnpj:'yes',sellsByWhatsApp:'yes',vinculoLead:'v2g_site',sourceLeadId:'73',whatsapp:'11999990000'})) form.set(key,value);
  const valid=validarPedidoAssistido(form,true); assert.equal(valid.dados.lead.id,73);
  const p=ports({...initial(),origin:'assisted',payment_method:'direct_pix'});
  assert.equal((await p.notify(confirmed)).status,422);
  assert.equal(p.events.size,0); assert.equal(p.mails,0);
  await vincularComprasAprovadasComCliente(p.admin,buyer);
  assert.equal(await temAcessoWebApp(p.admin,buyer),false);
});
test('porta self-service encadeia webhook, email preparado, propriedade relida e proximo onboarding sem tomar outro negocio',async()=>{
  const order=initial(),p=ports(order);
  await vincularComprasAprovadasComCliente(p.admin,buyer);
  assert.equal(await temAcessoWebApp(p.admin,buyer),false);
  assert.equal((await p.notify({...confirmed,payment:{...confirmed.payment,value:1}})).status,422);
  assert.equal((await p.notify({comprovante:true,retornoNavegador:'pago'})).status,422);
  assert.equal(p.events.size,0);
  assert.equal((await p.notify(confirmed)).status,200);
  await vincularComprasAprovadasComCliente(p.admin,{...buyer,email_confirmed_at:null});
  assert.equal(order.buyer_profile_id,null);
  await vincularComprasAprovadasComCliente(p.admin,buyer);
  assert.equal(await temAcessoWebApp(p.admin,buyer),true);
  assert.equal(p.rows.businesses[0].profile_id,buyer.id);
  assert.equal(p.rows.businesses[1].profile_id,'outro-perfil');
  assert.equal(order.source_lead_id,73);
  assert.equal(pendenciaDoOnboarding({onboarding:{},avg_ticket_min:null,avg_ticket_max:null,avg_direct_cost:null,target_profit_per_customer:null},false).href,'/onboarding');
  assert.equal(p.mails,1);
});
