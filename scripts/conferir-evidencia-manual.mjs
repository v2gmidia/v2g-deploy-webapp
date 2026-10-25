import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {validarEvidenciaManual,situacaoEvidencia} from '../lib/contratacao/evidencia-manual.ts';

const id='00000000-0000-4000-8000-000000000001',business='00000000-0000-4000-8000-000000000002',
  other='00000000-0000-4000-8000-000000000003',operator='00000000-0000-4000-8000-000000000004';
const base={id,businessId:business,orderId:'',profileId:'',email:'cliente@example.invalid',cnpj:'11.222.333/0001-81',
  source:'direct_pix',reference:'banco-restrito/registro-ficticio-0001',sourceDate:'2026-10-20'};
const evidence={id,business_id:business,order_id:null,proposed_profile_id:null,claimed_email:base.email,
  claimed_cnpj:'11222333000181',source_system:'direct_pix',source_reference:base.reference,source_date:base.sourceDate,
  recorded_by:operator,recorded_at:'2026-10-22T20:00:00Z',status:'checked',reviewed_by:operator,
  reviewed_at:'2026-10-22T20:10:00Z',review_note:'Fonte e identidade ficticias conferidas.'};
function form(patch={}) {const f=new FormData();for(const [k,v] of Object.entries({...base,...patch}))f.set(k,v);return f;}
function contexto(options={}) {
  const calls=[];
  const rows={manager_accounts:{business_id:business,operator_profile_id:options.assigned===false?other:operator},
    businesses:{id:business,name:'Negocio Ficticio',claim_email:base.email,profile_id:options.owner??null},
    commercial_orders:{id:other,business_id:options.orderBusiness??business,buyer_email:base.email,cnpj:'11222333000181',buyer_profile_id:null},
    commercial_manual_evidence:{...evidence,...options.evidence}};
  const admin={from(table){const eq=[];const q={select(cols){calls.push(['select',table,cols]);return q;},
    eq(k,v){eq.push([k,v]);return q;},async maybeSingle(){calls.push(['read',table,eq]);
      return {data:options.readError===table?null:eq.every(([k,v])=>rows[table]?.[k]===v)?rows[table]:null,error:options.readError===table?{}:null};}};return q;},
    auth:{admin:{async getUserById(profile){calls.push(['identity',profile]);return {data:{user:{id:profile,
      email:options.userEmail??base.email,email_confirmed_at:options.unverified?null:'2026-10-20T12:00:00Z'}},error:null};}}},
    async rpc(name,args){calls.push(['rpc',name,args]);return {data:options.rpcError?null:name==='registrar_evidencia_manual'?id:options.reviewOk??true,error:options.rpcError?{}:null};}};
  const mod=ambienteTs({ports:{'next/cache':{revalidatePath:p=>calls.push(['revalidate',p])},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:options.anonymous?null:{id:operator,
      app_metadata:{papel:options.role??'operador'},user_metadata:{papel:'operador'}}},error:null})}})},
    '@/lib/supabase/admin':{createAdminClient:()=>{calls.push(['admin']);return admin;}}}})
    .load('app/(protected)/pedidos/evidencias-actions.ts');
  return {mod,calls};
}
test('valida identidade exata, fonte localizavel e data real, sem antecipar aprovacao',()=>{
  assert.ok(validarEvidenciaManual(form(),'2026-10-22').dados);
  for(const patch of [{businessId:'invalido'},{profileId:'invalido'},{orderId:'invalido'},{email:'invalido'},
    {cnpj:'00000000000000'},{source:'asaas_confirmed'},{reference:'x'},{reference:'x\nsecreto'},
    {sourceDate:'2026-02-30'},{sourceDate:'2026-10-23'}]) assert.ok(validarEvidenciaManual(form(patch),'2026-10-22').erro);
});
test('papel em user_metadata nao autoriza nem cria admin',async()=>{
  for(const options of [{anonymous:true},{role:'cliente'}]) {
    const c=contexto(options); assert.ok((await c.mod.registrarEvidenciaManualAction({},form())).erro);assert.equal(c.calls.length,0);
    assert.ok((await c.mod.revisarEvidenciaManualAction({},form({status:'rejected',note:'Fonte divergente'}))).erro);assert.equal(c.calls.length,0);
  }
});
test('operador fora da carteira e consulta indisponivel negam antes de negocio ou RPC',async()=>{
  for(const options of [{assigned:false},{readError:'manager_accounts'}]) {
    const c=contexto(options);assert.ok((await c.mod.registrarEvidenciaManualAction({},form())).erro);
    assert.equal(c.calls.some(x=>x[0]==='rpc'),false);
    assert.equal(c.calls.some(x=>x[1]==='businesses'),false);
  }
});
test('registro recebe ator da sessao, nao do formulario, e chama apenas RPC documental',async()=>{
  const c=contexto();assert.ok((await c.mod.registrarEvidenciaManualAction({},form({operatorId:other,status:'payment_approved'}))).ok);
  const rpc=c.calls.find(x=>x[0]==='rpc');assert.equal(rpc[1],'registrar_evidencia_manual');
  assert.equal(rpc[2].p_operator_id,operator);assert.equal(rpc[2].p_business_id,business);
  assert.equal(rpc[2].p_order_id,null);assert.equal(rpc[2].p_profile_id,null);assert.equal(rpc[2].p_status,undefined);
});
test('perfil e-mail divergente, nao confirmado ou dono diferente nao vira proposta valida',async()=>{
  for(const [options,patch] of [[{userEmail:'outra@example.invalid'},{profileId:other}],
    [{unverified:true},{profileId:other}],[{owner:operator},{profileId:other}]]) {
    const c=contexto(options);assert.ok((await c.mod.registrarEvidenciaManualAction({},form(patch))).erro);
    assert.equal(c.calls.some(x=>x[0]==='rpc'),false);
  }
});
test('pedido de outro negocio e falha na gravacao nao recebem sucesso',async()=>{
  const c=contexto({orderBusiness:other});assert.ok((await c.mod.registrarEvidenciaManualAction({},form({orderId:other}))).erro);
  assert.equal(c.calls.some(x=>x[0]==='rpc'),false);
  const failed=contexto({rpcError:true});assert.ok((await failed.mod.registrarEvidenciaManualAction({},form())).erro);
  assert.equal(failed.calls.some(x=>x[0]==='revalidate'),false);
});
test('revisao exige conferencias explicitas e rele o registro do negocio, nao identidade do formulario',async()=>{
  const c=contexto();const f=form({status:'checked',note:'Fonte e CNPJ conferidos'});
  assert.ok((await c.mod.revisarEvidenciaManualAction({},f)).erro);assert.equal(c.calls.length,0);
  f.set('identityChecked','yes');f.set('sourceChecked','yes');f.set('email','outro@example.invalid');
  assert.ok((await c.mod.revisarEvidenciaManualAction({},f)).ok);
  const rpc=c.calls.find(x=>x[0]==='rpc');assert.equal(rpc[1],'revisar_evidencia_manual');assert.equal(rpc[2].p_operator_id,operator);
});
test('revisao fora da carteira, negocio trocado ou RPC adversa nao libera nada',async()=>{
  for(const options of [{assigned:false},{evidence:{business_id:other}},{reviewOk:false}]) {
    const c=contexto(options);assert.ok((await c.mod.revisarEvidenciaManualAction({},form({status:'checked',note:'Revisao ficticia',identityChecked:'yes',sourceChecked:'yes'}))).erro);
    assert.equal(c.calls.some(x=>x[0]==='revalidate'),false);
  }
});
test('estorno tardio invalida exibicao ativa apenas do pedido e negocio correspondentes',()=>{
  const e={...evidence,order_id:other};const order={id:other,business_id:business,status:'payment_approved',provider_charge_id:'pay_initial'};
  const refund={order_id:other,provider_charge_id:'pay_initial',event_type:'PAYMENT_REFUNDED'};
  assert.equal(situacaoEvidencia(e,order,[refund]),'blocked');
  assert.equal(situacaoEvidencia(e,order,[{...refund,provider_charge_id:'pay_renewal'}]),'checked');
  assert.equal(situacaoEvidencia(e,order,[{...refund,order_id:id}]),'checked');
  assert.equal(situacaoEvidencia(e,{...order,business_id:other},[]),'verification_unavailable');
  assert.equal(situacaoEvidencia(e,order,[],false),'verification_unavailable');
  assert.equal(situacaoEvidencia(e,{...order,status:'cancelled'},[]),'blocked');
  assert.equal(situacaoEvidencia(evidence,null,[]),'checked'); // Apenas documento, sem grant.
});
test('formulario real tem labels, estados e CTA documental, sem concessao de acesso',()=>{
  const state={};const env=ambienteTs({ports:{react:{...React,useActionState:()=>[state,()=>{},false]},
    './evidencias-actions':{registrarEvidenciaManualAction:()=>{},revisarEvidenciaManualAction:()=>{}},
    './evidencia.module.css':{default:{campos:'campos',confirmacoes:'confirmacoes'}}}});
  const {EvidenciaForm,RevisarEvidenciaForm}=env.load('app/(protected)/pedidos/EvidenciaForm.tsx');
  const html=renderToStaticMarkup(React.createElement(EvidenciaForm,{businessId:business,referencia:id,hoje:'2026-10-22'}));
  assert.match(html,/Registrar evidência pendente/);assert.match(html,/type="date"/);assert.match(html,/max="2026-10-22"/);
  for(const key of ['email','cnpj','order','profile','source','date','reference']) assert.match(html,new RegExp(`for="evidencia-${key}"`));
  const review=renderToStaticMarkup(React.createElement(RevisarEvidenciaForm,{id,businessId:business}));
  assert.match(review,/não concede acesso/);assert.match(review,/Conferida pela equipe/);assert.match(review,/Recusada/);
  state.erro='Fonte indisponivel';assert.match(renderToStaticMarkup(React.createElement(RevisarEvidenciaForm,{id,businessId:business})),/role="alert"/);
});
