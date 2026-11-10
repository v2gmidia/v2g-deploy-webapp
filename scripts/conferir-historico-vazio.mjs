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

async function pagina(resultado,{agencia=null,busca=intervalo,negocioId=businessId,chamadas=[]}={}){
  const nada=()=>null;
  const q={select(){return this;},eq(){return this;},order:async()=>({data:[]})};
  const {default:AnunciosPage}=ambienteTs({ports:{
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:profileId}}})},from:()=>q})},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>{chamadas.push('estado');return {negocioId,proximo:null,veiculacao:'nao_sabemos'};}},
    '@/lib/resultado/do-negocio':{resultadoDoNegocio:async()=>{chamadas.push('resultado');return resultado;}},
    '@/lib/backend':{anunciosDoNegocioSelecionado:async()=>{chamadas.push('meta');return {ok:true,contas:[]};}},
    '@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>agencia!==null},
    '@/lib/agencia/da-sessao':{carregarAgenciaDaSessao:async()=>agencia},
    '@/components/agencia/Comuns':{ClienteIndisponivel:()=>React.createElement('p',null,'Contexto indisponível')},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:nada},'@/components/ui/Pill':{Pill:nada},
    '@/components/ui/HeroDaEtapa':{HeroDaEtapa:nada},
    './PainelDeAnuncios':{PainelDeAnuncios:nada},'./AtualizacaoDaConsulta':{AtualizacaoDaConsulta:({children})=>children},
    '../inicio/SeletorDePeriodo':{SeletorDePeriodo:nada},
    './AnunciosMeta':{InventarioDeAnunciosMeta:()=>React.createElement('p',null,'Consulta Meta preservada')},
  }}).load('app/(protected)/anuncios/page.tsx');
  return renderToStaticMarkup(await AnunciosPage({searchParams:Promise.resolve(busca)}));
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

const agencia={status:'agencia',contexto:{businessId,agencia:'Agência fictícia',anunciante:'Anunciante fictício'}};
const link=(html,rotulo)=>new URL(html.match(new RegExp(`href="([^"]+)"[^>]*>${rotulo}</a>`))[1].replaceAll('&amp;','&'),'https://qa.invalid');

test('Anúncios real volta ao detalhe do anunciante com período, conta e filtros, sem cair na carteira',async()=>{
  const html=await pagina(await leitor().run(),{agencia,busca:{...intervalo,cliente:businessId,conta:'act_123',busca_carteira:'Dúú & outro',pendentes_carteira:'1',pagina_carteira:'2'}});
  const resumo=link(html,'Ver resumo deste período'),criativos=link(html,'Abrir criativos');
  assert.equal(resumo.pathname,'/inicio');assert.equal(resumo.searchParams.get('cliente'),businessId);
  for(const[k,v]of Object.entries(intervalo))assert.equal(resumo.searchParams.get(k),v);
  assert.equal(resumo.searchParams.get('conta'),'act_123');assert.equal(resumo.searchParams.get('busca_carteira'),'Dúú & outro');
  assert.equal(resumo.searchParams.get('pagina_carteira'),'2');assert.equal(resumo.searchParams.get('pendentes_carteira'),'1');
  assert.equal(criativos.pathname,'/criativos');assert.equal(criativos.searchParams.get('cliente'),businessId);
  assert.match(html,/Consulta Meta preservada/);assert.match(html,/Ainda não há rodadas/);
});

test('QA recusa cliente alheio, repetido e vazio antes de consultar estado ou métricas',async()=>{
  for(const cliente of [profileId,[businessId,businessId],'']){
    const chamadas=[];const html=await pagina(null,{agencia,busca:{...intervalo,cliente},chamadas});
    assert.deepEqual(chamadas,[]);assert.match(html,/Contexto indisponível/);assert.doesNotMatch(html,/Consulta Meta/);
  }
});

test('divergência entre contexto e estado não consulta Meta nem consolidado',async()=>{
  const chamadas=[];const html=await pagina(null,{agencia,negocioId:profileId,chamadas});
  assert.deepEqual(chamadas,['estado']);assert.match(html,/Contexto indisponível/);
});

test('falha ao conferir contexto QA não mostra resultados ou volta de outro cliente',async()=>{
  const chamadas=[];const html=await pagina(null,{agencia:{status:'indisponivel'},chamadas});
  assert.deepEqual(chamadas,[]);assert.match(html,/Contexto indisponível/);
});

test('fora do portão QA, os links diretos e o comportamento anterior são preservados',async()=>{
  const html=await pagina(await leitor().run());
  const resumo=link(html,'Ver resumo deste período');assert.equal(resumo.searchParams.has('cliente'),false);
  assert.equal(resumo.pathname,'/inicio');assert.equal(link(html,'Abrir criativos').pathname,'/criativos');
});

test('ramo de falha do histórico também preserva retorno do cliente sem inventar vazio',async()=>{
  const html=await pagina(await leitor({status:500}).run(),{agencia,busca:{...intervalo,cliente:businessId}});
  assert.equal(link(html,'Ver resumo deste período').searchParams.get('cliente'),businessId);
  assert.equal(link(html,'Abrir criativos').searchParams.get('cliente'),businessId);
  assert.doesNotMatch(html,/Ainda não há rodadas/);
});
