import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepararReferenciaDePreco,lerReferenciaDePreco} from '../lib/onboarding/referencia-preco.ts';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const input = (overrides={}) => ({minimo:'69',maximo:'70',unidade:'fardo',certeza:'aproximado',...overrides});
const parse = data => prepararReferenciaDePreco(data,'Relato confirmado na sessão','2026-11-09T16:00:00Z');
test('faixa por fardo mantém unidade, precisão, fonte e data sem virar ticket',()=>{
  const r=parse(input());assert.equal(r.estado,'pronto');assert.deepEqual(r.referencia,{
    moeda:'BRL',valor_min:69,valor_max:70,unidade:'fardo',certeza:'aproximado',fonte:'Relato confirmado na sessão',observado_em:'2026-11-09T16:00:00Z',
  });assert.ok(!('ticket_medio' in r.referencia));
});
test('vazio preserva; zero exige confirmação; moeda não arredonda casas extras',()=>{
  assert.equal(parse(input({minimo:'',maximo:''})).estado,'sem_alteracao');
  assert.equal(parse(input({minimo:'0',maximo:''})).estado,'erro');
  assert.equal(parse(input({minimo:'0',maximo:'',certeza:'confirmado'})).referencia.valor_min,0);
  for(const minimo of ['-1','NaN','Infinity','1e3','69,999','1,234','true']) assert.equal(parse(input({minimo,maximo:''})).estado,'erro',minimo);
  assert.equal(parse(input({minimo:'1.234,56',maximo:''})).referencia.valor_min,1234.56);
  assert.equal(parse(input({minimo:'69.50',maximo:''})).referencia.valor_min,69.5);
});
test('unidade/certeza são necessárias para um preço; faixa invertida não passa',()=>{
  for(const data of [input({unidade:''}),input({certeza:''}),input({minimo:'71',maximo:'70'})]) assert.equal(parse(data).estado,'erro');
  const p=parse(input()).referencia;
  assert.deepEqual(lerReferenciaDePreco({respostas:{_oferta:{preco_referencia:p}}}),p);
  assert.equal(lerReferenciaDePreco({contas:{ticket:{calculado:69}}}),null);
});

function fixture({user={id:'perfil'},active='negocio',dbError=null,rpcError=null,rpcResult=true,conferencia={fez:'nada',porque:'incompleto'}}={}){
  const calls=[];
  const anterior={moeda:'BRL',valor_min:60,unidade:'fardo',certeza:'aproximado',fonte:'Fonte anterior',observado_em:'2026-11-08T16:00:00Z'};
  const source={versao:2,respostas:{descricao:{texto:'Bebida para empresas'},_oferta:{descricao:'Oferta preservada',preco_referencia:anterior}},contas:{custo:{naoSei:true}},marca:{em:'legado'}};
  const original=JSON.stringify(source);
  const client={auth:{getUser:async()=>({data:{user},error:null})},from(table){calls.push(['table',table]);const q={
    select(cols){calls.push(['select',cols]);return q;},eq(k,v){calls.push(['eq',k,v]);return q;},
    maybeSingle:async()=>({data:dbError?null:{id:'negocio',onboarding:source},error:dbError}),
  };return q;},rpc:async(name,body)=>{calls.push(['rpc',name,body]);return {data:rpcResult,error:rpcError};}};
  const {load}=ambienteTs({ports:{'next/cache':{revalidatePath:path=>calls.push(['revalidate',path])},
    '@/lib/supabase/server':{createClient:async()=>client},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>active?{status:'selecionado',negocio:{id:active}}:{status:'selecao_invalida'}},
    '@/lib/pipeline/conferir-cadastro-operacional':{conferirCadastroOperacionalSeCompleto:async()=>{calls.push(['conferir']);return conferencia;}},
  }});
  return {save:load('app/(fluxo)/onboarding/contas/referencia-actions.ts').salvarReferenciaPrecoAction,calls,source,original,anterior};
}
function form(overrides={}){const f=new FormData();for(const [k,v]of Object.entries({businessId:'negocio',...input(),...overrides}))f.set(k,v);return f;}
test('ação recusa sessão ausente e outro negócio antes de consultar/gravar',async()=>{
  for(const config of [{user:null},{active:'outro'},{active:null}]){const f=fixture(config);assert.ok((await f.save({},form())).erro);assert.deepEqual(f.calls,[]);}
});
test('ação só mescla oferta; não altera colunas financeiras, respostas ou marca',async()=>{
  const f=fixture();const r=await f.save({},form());assert.ok(r.ok);assert.equal(JSON.stringify(f.source),f.original);
  assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='negocio'));
  assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='profile_id'&&c[2]==='perfil'));
  const rpc=f.calls.find(c=>c[0]==='rpc');assert.equal(rpc[1],'mesclar_blocos_onboarding');
  assert.deepEqual(Object.keys(rpc[2].p_patch),['respostas']);assert.deepEqual(Object.keys(rpc[2].p_patch.respostas),['_oferta']);
  const oferta=rpc[2].p_patch.respostas._oferta;assert.equal(oferta.descricao,'Oferta preservada');assert.deepEqual(JSON.parse(JSON.stringify(oferta.historico_precos)),[f.anterior]);
  assert.equal(oferta.preco_referencia.valor_min,69);assert.equal(oferta.informado_por,'perfil');
  assert.equal(f.calls.filter(c=>c[0]==='conferir').length,1);
});
test('omissão/entrada inválida não envia zero nem altera o banco',async()=>{
  for(const [overrides,kind]of [[{minimo:'',maximo:''},'ok'],[{minimo:'-1'},'erro']]){
    const f=fixture();assert.ok((await f.save({},form(overrides)))[kind]);assert.equal(f.calls.some(c=>c[0]==='rpc'),false);
  }
});
test('falha de leitura/gravação não afirma sucesso; falha de conferência preserva sucesso local',async()=>{
  for(const config of [{dbError:{message:'interno'}},{rpcError:{message:'interno'}},{rpcResult:false}]){
    const f=fixture(config);const r=await f.save({},form());assert.ok(r.erro);assert.equal(r.ok,undefined);assert.equal(f.calls.some(c=>c[0]==='conferir'),false);
  }
  for(const conferencia of [{fez:'falhou',porque:'resposta_ilegivel'},{fez:'conferiu',persistidoLocalmente:false}]){
    const f=fixture({conferencia});const r=await f.save({},form());assert.ok(r.ok);assert.ok(r.aviso);
  }
});

test('referência é opcional e impede continuar enquanto a gravação está pendente',()=>{
  for(const pendente of [false,true]){
    const {load}=ambienteTs({ports:{react:{...React,useActionState:()=>[{},()=>{},pendente]},
      './referencia-actions':{salvarReferenciaPrecoAction:async()=>({})}}});
    const {ReferenciaDePreco}=load('app/(fluxo)/onboarding/contas/ReferenciaDePreco.tsx');
    const html=renderToStaticMarkup(React.createElement(ReferenciaDePreco,{businessId:'negocio',atual:null}));
    assert.ok(html.includes('Continuar sem informar preço'));
    assert.equal(html.includes('href="/onboarding/marca"'),!pendente);
    assert.equal(html.includes('aria-disabled="true"'),pendente);
    assert.equal(html.includes('<fieldset disabled=""'),pendente);
    assert.ok(!html.includes('name="ticket_medio"')&&!html.includes('name="custo"')&&!html.includes('name="lucro"'));
  }
});
