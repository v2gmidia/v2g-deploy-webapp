import assert from 'node:assert/strict';
import {test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const business='33333333-3333-4333-8333-333333333333',id='88888888-8888-4888-8888-888888888888';
const registro={id,business_id:business,copy:{generation:{requestId:'55555555-5555-4555-8555-555555555555',simulated:true}},
  file_name:'SIMULADO-PERSISTIDO.png',storage_path:`geracao/${business}/${id}/99999999-9999-4999-8999-999999999999.png`,
  status:'draft',uso:'campanha',published_at:null,external_ad_id:null,created_at:'2026-10-25T15:00:00Z',updated_at:'2026-10-25T15:00:00Z',arquivado_em:null};
async function pagina({geracao='false',falha=false,revisaoFalhou=false}={}) {
  const consultas=[];
  const a=ambienteTs({env:{V2G_CREATIVE_REQUESTS_ENABLED:'true',V2G_CREATIVE_BACKEND_ENABLED:geracao,V2G_CREATIVE_REVIEW_ENABLED:revisaoFalhou?'true':'false'},ports:{
    '@/lib/estado/cliente':{estadoDoCliente:async()=>({negocioId:business,diaSeguinte:{execucao:null}})},
    '@/lib/titulos':{tituloDaAba:()=>({})},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:business}})},
    '@/lib/criativos/pedidos-da-sessao':{carregarPedidosDaSessao:async()=>({pedidos:[],falhou:false})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}},error:null})},
      from(table){consultas.push(table);const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},then(resolve,reject){
        return Promise.resolve(table==='creatives'?{data:falha?null:[registro],error:falha?{message:'PRIVADO_NAO_MOSTRAR'}:null}
          :{data:null,error:{message:'PRIVADO_NAO_MOSTRAR'}}).then(resolve,reject);}};return q;}})},
    '@/lib/supabase/admin':{createAdminClient:()=>({storage:{from(){throw Error('Geração não entra em assinatura genérica');}}})},
    '@/lib/criativos/geracao/backend-da-sessao':{filaPeloBackend(){throw Error('Biblioteca não consulta geração para listar registros');}},
    './PedidoDeImagem':{PedidoDeImagem:()=>null},'./Analisar':{Analisar:()=>null},'./Amostra':{AmostraDeVereditos:()=>null},'./PedirRevisao':{PedirRevisao:()=>null},
  }});
  const render=a.load('app/(protected)/criativos/page.tsx').default;
  return {html:renderToStaticMarkup(await render()),consultas};
}
test('página real conserva card e Biblioteca 1 com serviço de geração ON ou OFF',async()=>{
  for(const geracao of ['true','false']) {
    const {html,consultas}=await pagina({geracao});assert.match(html,/SIMULADO-PERSISTIDO\.png/);
    assert.match(html,/Biblioteca<span>1<\/span>/);assert.ok(!html.includes('Nenhuma peça aqui.'));assert.deepEqual(consultas,['creatives']);
  }
});
test('página real mostra erro da fonte e contagem desconhecida, sem estado vazio ou erro privado',async()=>{
  const {html}=await pagina({falha:true});assert.match(html,/biblioteca está indisponível/);assert.match(html,/Biblioteca<span>—<\/span>/);
  assert.ok(!html.includes('Nenhuma peça aqui.'));assert.ok(!html.includes('PRIVADO_NAO_MOSTRAR'));
});
test('fonte parcial mantém card conhecido e deixa explícita a leitura incompleta',async()=>{
  const {html}=await pagina({revisaoFalhou:true});assert.match(html,/SIMULADO-PERSISTIDO\.png/);assert.match(html,/Não foi possível conferir toda a biblioteca/);
  assert.match(html,/Biblioteca<span>—<\/span>/);assert.ok(!html.includes('Nenhuma peça aqui.'));
});
