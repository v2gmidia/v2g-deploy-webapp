import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {validarPublicacao,lerPublicacao,textoDaPublicacao} from '../lib/criativos/publicacao.ts';
const id='11111111-1111-4111-8111-111111111111', business='22222222-2222-4222-8222-222222222222', actor='33333333-3333-4333-8333-333333333333';
const pedido={id,business_id:business,sha256:'a'.repeat(64),status:'approved_for_manual_publish',file_path:`${business}/${id}`};
const base={id,conta:'act_123',anuncio:'456',dia:'2026-11-09',evidencia:'Conferi a arte no anúncio 456.',confirmo:'on'};
const registro={review_request_id:id,business_id:business,content_sha256:pedido.sha256,ad_account_id:'act_123',ad_id:'456',published_on:'2026-11-09',evidence:base.evidencia,confirmed_by:actor,confirmed_at:'2026-11-09T18:00:00Z',source:'manager_declaration'};
test('publicação requer IDs exatos, data real e confirmação explícita; não aceita futuro',()=>{
  assert.ok(validarPublicacao(base,'2026-11-09'));
  for(const patch of [{confirmo:null},{id:'nome'},{conta:'123'},{anuncio:'4e5'},{anuncio:'https://meta/456'},
    {dia:'2026-02-30'},{dia:'2026-11-10'},{evidencia:'ok'},{evidencia:'a'.repeat(2001)}])
    assert.equal(validarPublicacao({...base,...patch},'2026-11-09'),null);
});
test('aprovação sozinha não confirma; leitura vincula versão, negócio, pedido e fonte humana',()=>{
  assert.equal(textoDaPublicacao(null),'Ainda sem confirmação de publicação.');
  assert.ok(lerPublicacao(registro,pedido));
  assert.match(textoDaPublicacao(registro),/Confirmada pelo gestor.*09\/11\/2026.*não confirma entrega atual/);
  for(const patch of [{review_request_id:business},{business_id:id},{content_sha256:'b'.repeat(64)},
    {source:'meta'},{published_on:'2026-02-30'},{confirmed_by:'nome'},{confirmed_at:'ontem'},{evidence:''}])
    assert.equal(lerPublicacao({...registro,...patch},pedido),null);
  assert.equal(lerPublicacao(registro,{...pedido,status:'awaiting_review'}),null);
  assert.match(textoDaPublicacao(null,true),/Não foi possível consultar/);
});
function fixture({user={id:actor,app_metadata:{papel:'operador'}},authError=null,row=pedido,assignment={business_id:business,operator_profile_id:actor},result='registered',rpcError=null,throws=false}={}){
  const calls=[];
  const admin={from(table){calls.push(['table',table]);const q={select(){return q;},eq(){return q;},
    async maybeSingle(){return {data:table==='creative_review_requests'?row:assignment,error:null};}};return q;},
    async rpc(name,args){calls.push(['rpc',name,args]);if(throws)throw Error('privado');return {data:result,error:rpcError};}};
  const {load}=ambienteTs({env:{V2G_CREATIVE_REVIEW_ENABLED:'true'},ports:{
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:authError})}})},
    '@/lib/supabase/admin':{createAdminClient:()=>admin},'next/cache':{revalidatePath:p=>calls.push(['revalidate',p])},
    '@/lib/criativos/intencao-envio':{hojeEmSaoPaulo:()=> '2026-11-09'},
  }});
  const save=load('app/(protected)/gestor/criativos/publicacao-actions.ts').confirmarPublicacaoAction;
  return {save:(patch={})=>{const f=new FormData();for(const [k,v]of Object.entries({...base,...patch}))if(v!==null)f.set(k,v);return save({},f);},calls};
}
test('ação recusa cliente, sessão inválida e ausência de confirmação antes de qualquer consulta',async()=>{
  for(const config of [{user:null},{authError:{}},{user:{id:actor,app_metadata:{papel:'cliente'}}},
    {user:{id:actor,user_metadata:{papel:'operador'}}}]){const f=fixture(config);assert.ok((await f.save()).erro);assert.deepEqual(f.calls,[]);}
  const f=fixture();assert.ok((await f.save({confirmo:null})).erro);assert.deepEqual(f.calls,[]);
});
test('peça não aprovada, caminho de outro negócio e gestor errado não chegam à RPC',async()=>{
  for(const config of [{row:null},{row:{...pedido,status:'awaiting_review'}},{row:{...pedido,file_path:`${id}/${business}`}},
    {assignment:null},{assignment:{business_id:id,operator_profile_id:actor}},{assignment:{business_id:business,operator_profile_id:id}}]){
    const f=fixture(config);assert.ok((await f.save()).erro);assert.equal(f.calls.some(c=>c[0]==='rpc'),false);
  }
});
test('ação usa identidade da sessão e versão da peça; replay é seguro e falhas nunca viram sucesso',async()=>{
  for(const result of ['registered','already_registered']){
    const f=fixture({result});assert.ok((await f.save()).ok);
    const rpc=f.calls.find(c=>c[0]==='rpc');assert.equal(rpc[1],'confirmar_publicacao_criativo');
    assert.equal(rpc[2].p_actor,actor);assert.equal(rpc[2].p_business,business);assert.equal(rpc[2].p_sha,pedido.sha256);
    assert.equal(f.calls.filter(c=>c[0]==='revalidate').length,2);
  }
  for(const config of [{result:'conflict'},{result:'not_allowed'},{result:'invalid'},{result:null},{rpcError:{message:'privado'}},{throws:true}]){
    const f=fixture(config),r=await f.save();assert.ok(r.erro);assert.equal(r.ok,undefined);assert.ok(!r.erro.includes('privado'));
    assert.equal(f.calls.some(c=>c[0]==='revalidate'),false);
  }
});
test('formulário bloqueia duplicação durante envio e preserva mensagens junto da ação',()=>{
  for(const pending of [false,true]){
    const {load}=ambienteTs({ports:{react:{...React,useActionState:()=>[{},()=>{},pending]},'./revisao.module.css':{default:{}},
      './publicacao-actions':{confirmarPublicacaoAction:async()=>({})}}});
    const {ConfirmarPublicacao}=load('app/(protected)/gestor/criativos/ConfirmarPublicacao.tsx');
    const html=renderToStaticMarkup(React.createElement(ConfirmarPublicacao,{id,contas:['act_123'],hoje:'2026-11-09'}));
    assert.equal(html.includes('<fieldset disabled=""'),pending);assert.ok(html.includes('name="confirmo"'));
    assert.ok(html.includes('name="anuncio"')&&html.includes('name="dia"')&&html.includes('name="evidencia"'));
  }
});
