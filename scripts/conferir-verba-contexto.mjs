import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';

async function render(overrides={}) {
  const negocio={id:'negocio',name:'Agência de teste',monthly_budget:3000,city:'Cidade da agência',cep:null,
    radius_km:null,geo_lat:null,geo_key:null,geo_label:null,geo_resolved_at:null,onboarding:{},...overrides};
  const cols=[];
  const client={from(table){const q={select(c){cols.push(c);return q;},eq(){return q;},
    maybeSingle:async()=>({data:table==='businesses'?negocio:{meta_page_id:null},error:null})};return q;}};
  const {load}=ambienteTs({ports:{
    '@/lib/supabase/server':{createClient:async()=>client},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:'negocio'}})},
    '@/components/ui/Marca':{Marca:()=>React.createElement('span',null,'V2G mídia')},
    './FormVerba':{FormVerba:()=>React.createElement('form',null)},
    '@/lib/meta/geo':{raioValido:n=>n>0?n:15},
    '../onboarding/onboarding-editorial.css':{},'./verba-editorial.css':{},
  }});
  const Page=load('app/(fluxo)/verba/page.tsx').default;
  return {html:renderToStaticMarkup(await Page()).replace(/<[^>]*>/g,' ').replace(/\s+/g,' '),cols};
}
test('raio ausente/ inválido não vira uma escolha de 15 km',async()=>{
  for(const radius_km of [null,0,-1,NaN,Infinity]){
    const {html}=await render({radius_km});assert.ok(html.includes('Região de atendimento a confirmar'));
    assert.ok(!html.includes('Você escolheu'));assert.ok(!html.includes('15 km'));
    assert.ok(html.includes('Salvar aqui não altera os orçamentos na Meta'));
  }
});
test('agência usa praça declarada do anunciante sem reutilizar geografia canônica',async()=>{
  const {html,cols}=await render({radius_km:5,geo_lat:1,geo_label:'Endereço da agência',onboarding:{respostas:{
    operador:{texto:'Uma agência ou gestor opera para o anunciante'},praca:{texto:'Brasil inteiro',echo:'Brasil inteiro'},
  }}});
  assert.ok(html.includes('Região informada para preparação'));assert.ok(html.includes('Brasil inteiro'));
  assert.ok(!html.includes('Endereço da agência'));assert.ok(!html.includes('Cidade da agência'));
  assert.ok(!html.includes('Num raio'));assert.ok(cols[0].split(',').map(x=>x.trim()).includes('onboarding'));
});
test('praça da agência sem resposta permanece pendente; cliente direto com raio válido continua legível',async()=>{
  const agencia=await render({onboarding:{respostas:{operador:{texto:'Uma agência ou gestor opera para o anunciante'}}}});
  assert.ok(agencia.html.includes('Confirmar região do anunciante'));assert.ok(!agencia.html.includes('15 km'));
  const direto=await render({radius_km:5,geo_lat:1,geo_label:'Ponto informado'});
  assert.ok(direto.html.includes('Num raio de 5 km'));assert.ok(direto.html.includes('Ponto informado'));
});
