/** Comparacao OFFLINE do handler do commit QA medido com a arvore local.
 * Somente git show, fixtures e portas em memoria. Nao le .env nem chama rede. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const require=createRequire(import.meta.url), ts=require('typescript');
const revision='fbf00ee3af7fb3cc8c06931138011a49bcd85236'; // QA observado em 23/10; nao e consulta live.
const token='fixture-sem-credencial-'.repeat(3), order='00000000-0000-4000-8000-000000000023';
const payload={id:'evt_fixture_comparacao_23',event:'PAYMENT_CONFIRMED',payment:{id:'pay_fixture',customer:'cus_fixture',
  subscription:null,value:500,billingType:'CREDIT_CARD',dueDate:'2026-10-21',externalReference:order,status:'CONFIRMED'}};
function snapshot(file,ports={}) {
  const source=execFileSync('git',['show',`${revision}:${file}`],{encoding:'utf8',windowsHide:true});
  const mod={exports:{}};
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require:name=>{
    if(Object.hasOwn(ports,name))return ports[name];
    if(name.startsWith('node:'))return require(name);
    throw Error('porta ausente no snapshot: '+name);
  },process:{env:{ASAAS_WEBHOOK_TOKEN:token,V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'true'}},Buffer,Headers,Response,console});
  return mod.exports;
}
function contexto(antigo,{canonicalStatus='REFUNDED',registered=true,rpcOk=true,originOk=true,canonicalPatch={}}={}) {
  const calls=[];
  const row={id:order,status:'payment_approved',origin:'self_service',payment_method:'asaas_card',billing_period:'monthly',
    total_cents:50000,provider_charge_id:'pay_fixture',provider_customer_id:'cus_fixture',provider_subscription_id:null,
    provider_first_due_date:'2026-10-21',provider_checkout_id:null};
  const admin={from(table){
    const filters=[],q={select:()=>q,eq:(k,v)=>{filters.push([k,v]);return q;},is:(k,v)=>{filters.push([k,v]);return q;},
      maybeSingle:async()=>({data:row,error:null}),single:async()=>({data:{provider_card_flow:'initial_3ds'},error:null}),
      then(resolve,reject){assert.equal(table,'commercial_payment_events');calls.push(['ledger',filters]);
        return Promise.resolve({count:registered?1:0,error:null}).then(resolve,reject);}};return q;
  },rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:rpcOk,error:null};}};
  const ports={
    'next/server':{NextResponse:{json:(body,{status=200}={})=>({body,status})}},
    '@/lib/supabase/admin':{createAdminClient:()=>admin},
    '@/lib/contratacao/ambiente-checkout':{checkoutSandboxSeguroNesteServidor:()=>true},
    '@/lib/contratacao/origem-asaas-servidor':{origemAsaasNoServidor:async()=>originOk},
    '@/lib/contratacao/asaas-sandbox':{asaasSandbox:async()=>({ok:true,body:{...payload.payment,status:canonicalStatus,...canonicalPatch}})},
    '@/lib/contratacao/processar-email-pagamento':{processarEmailPagamento:async()=>{calls.push(['email']);return true;}},
    '@/lib/contratacao/processar-assinatura-3ds':{processarAssinatura3ds:async()=>{calls.push(['subscription']);return false;}},
  };
  let handler;
  if(antigo) {
    for(const name of ['evento-financeiro','pagamento-evento','confirmacao-canonica'])
      ports['@/lib/contratacao/'+name]=snapshot('lib/contratacao/'+name+'.ts');
    handler=snapshot('app/api/webhooks/asaas-payment/route.ts',ports);
  } else handler=ambienteTs({env:{ASAAS_WEBHOOK_TOKEN:token,V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'true'},ports}).load('app/api/webhooks/asaas-payment/route.ts');
  return {calls,run:(p=payload)=>handler.POST({headers:new Headers({'asaas-access-token':token}),json:async()=>p})};
}
test('commit QA reproduz 422 no replay pago apos estorno; local aceita apenas o fato ja persistido',async()=>{
  const before=contexto(true),after=contexto(false);
  assert.equal((await before.run()).body.erro,'confirmacao_divergente');
  assert.equal((await contexto(true).run()).status,422);
  assert.equal((await after.run()).status,200);
  assert.deepEqual(after.calls.map(c=>c[0]),['ledger']);
  assert.equal(before.calls.length,0);
});
test('evento nao registrado permanece 422 nas duas versoes: nao confirmar fato perdido',async()=>{
  for(const old of [true,false]) {
    const c=contexto(old,{registered:false});assert.equal((await c.run()).status,422);
    assert.equal(c.calls.some(x=>['rpc','email','subscription'].includes(x[0])),false);
  }
});
test('estorno original alcanca RPC nas duas versoes; 422 remoto nao se deduz so do nome REFUNDED',async()=>{
  for(const old of [true,false]) {
    const c=contexto(old);assert.equal((await c.run({...payload,event:'PAYMENT_REFUNDED',payment:{...payload.payment,status:'REFUNDED'}})).status,200);
    assert.equal(c.calls[0][0],'rpc');assert.equal(c.calls[0][2].p_event_type,'PAYMENT_REFUNDED');
  }
});
test('RPC que recusa identidade/persistencia gera evento_divergente 422, diferente da consulta canonica',async()=>{
  for(const old of [true,false]) {
    const c=contexto(old,{rpcOk:false});const result=await c.run({...payload,event:'PAYMENT_REFUNDED'});
    assert.equal(result.status,422);assert.equal(result.body.erro,'evento_divergente');
    assert.equal(c.calls.filter(x=>x[0]==='rpc').length,1);
  }
});
test('parser e origem produzem outros 422 sem gravacao: corpo da resposta e indispensavel',async()=>{
  for(const old of [true,false]) {
    const invalid=contexto(old);const a=await invalid.run({...payload,payment:{...payload.payment,value:0}});
    assert.equal(a.status,422);assert.equal(a.body.erro,'evento_invalido');assert.equal(invalid.calls.length,0);
    const origin=contexto(old,{originOk:false});const b=await origin.run();
    assert.equal(b.status,422);assert.equal(b.body.erro,'pedido_divergente');assert.equal(origin.calls.length,0);
  }
});
test('replay local estornado com identidade divergente nao recebe historico 200',async()=>{
  const c=contexto(false,{canonicalPatch:{customer:'cus_other'}});
  const r=await c.run();assert.equal(r.status,422);assert.equal(r.body.erro,'confirmacao_divergente');
  assert.equal(c.calls.some(x=>['rpc','email','subscription'].includes(x[0])),false);
});
