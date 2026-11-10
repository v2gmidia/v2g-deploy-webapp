import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';

// Exportado de RespostaConsolidadoDoNegocio do backend, sem dados reais.
const corpo=JSON.parse(readFileSync(new URL('./fixtures/consolidado-sem-rodadas.json',import.meta.url),'utf8'));
const businessId=corpo.business_id,profileId='33333333-3333-4333-8333-333333333333';
const intervalo={desde:'2026-11-01',ate:'2026-11-07'};

function leitor({status=200,json=corpo}={}){
  const chamadas=[];
  const {consolidadoDoNegocio}=ambienteTs({env:{V2G_BACKEND_URL:'http://127.0.0.1',V2G_BACKEND_TOKEN:'ficticio'},
    fetch:async(url,opcoes)=>{chamadas.push({url:new URL(url),opcoes});return new Response(JSON.stringify(json),{status});},
  }).load('lib/backend/dia-seguinte.ts');
  const {resultadoDoNegocio}=ambienteTs({ports:{'@/lib/backend':{consolidadoDoNegocio,
    consolidadoDaExecucao:()=>{throw Error('Nao deve consultar uma execucao sem lista autorizada');},
    fichaDaExecucao:()=>{throw Error('Nao deve abrir ficha sem lista autorizada');},
  }}}).load('lib/resultado/do-negocio.ts');
  return {chamadas,run:()=>resultadoDoNegocio({businessId,profileId,intervalo})};
}

test('contrato vazio real vira sem-execucao, com titular e periodo enviados; sem consulta por ID de execucao',async()=>{
  const l=leitor(),r=await l.run();
  assert.equal(r.estado,'sem-execucao');assert.equal(r.campanhas.length,0);assert.equal(r.doDono,null);
  assert.equal(l.chamadas.length,1);const u=l.chamadas[0].url;
  assert.equal(u.pathname,`/negocios/${businessId}/consolidado`);
  assert.equal(u.searchParams.get('profile_id'),profileId);
  assert.equal(u.searchParams.get('desde'),intervalo.desde);assert.equal(u.searchParams.get('ate'),intervalo.ate);
  assert.equal(corpo.investiu_centavos,null);assert.equal(corpo.cliques,null);
});

for(const status of [404,401,500]) test(`HTTP ${status} continua indisponivel; nao se transforma em historico vazio`,async()=>{
  assert.equal((await leitor({status,json:{detail:'Falha simulada'}}).run()).estado,'indisponivel');
});

test('resposta de outro negocio ou contrato ilegivel nao esconde erro como ausencia de rodadas',async()=>{
  for(const json of [{...corpo,business_id:profileId},{...corpo,por_execucao:'invalido'},{...corpo,dias:null}])
    assert.equal((await leitor({json}).run()).estado,'indisponivel');
});

async function pagina(resultado){
  const nada=()=>null;
  const q={select(){return this;},eq(){return this;},order:async()=>({data:[]})};
  const {default:AnunciosPage}=ambienteTs({ports:{
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:profileId}}})},from:()=>q})},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>({negocioId:businessId,proximo:null,veiculacao:'nao_sabemos'})},
    '@/lib/resultado/do-negocio':{resultadoDoNegocio:async()=>resultado},
    '@/lib/backend':{anunciosDoNegocioSelecionado:async()=>({ok:true,contas:[]})},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:nada},'@/components/ui/Pill':{Pill:nada},
    '@/components/ui/HeroDaEtapa':{HeroDaEtapa:nada},
    './PainelDeAnuncios':{PainelDeAnuncios:nada},'./AtualizacaoDaConsulta':{AtualizacaoDaConsulta:({children})=>children},
    '../inicio/SeletorDePeriodo':{SeletorDePeriodo:nada},
    './AnunciosMeta':{InventarioDeAnunciosMeta:()=>React.createElement('p',null,'Consulta Meta preservada')},
  }}).load('app/(protected)/anuncios/page.tsx');
  return renderToStaticMarkup(await AnunciosPage({searchParams:Promise.resolve(intervalo)}));
}

test('pagina real apresenta ausencia de rodadas junto da consulta Meta sem afirmar ausencia de campanhas',async()=>{
  const html=await pagina(await leitor().run());
  assert.match(html,/Consulta Meta preservada/);assert.match(html,/Ainda não há rodadas da V2G para este negócio/);
  assert.doesNotMatch(html,/R\$|Nenhuma campanha|Não conseguimos atualizar/);
});

test('pagina real preserva aviso de falha e nao mostra vazio quando o consolidado falha',async()=>{
  const html=await pagina(await leitor({status:500}).run());
  assert.match(html,/Consulta Meta preservada/);assert.match(html,/Não conseguimos atualizar seus resultados agora/);
  assert.doesNotMatch(html,/Ainda não há rodadas/);
});
