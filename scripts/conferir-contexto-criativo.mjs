import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';

const em='2026-10-27T12:00:00Z';
const resposta=texto=>({texto,origem:'texto',em});
const negocio=(id='a')=>({id,profile_id:'dono',name:`Negócio ${id}`,onboarding:{respostas:{
  nome:resposta(`Negócio ${id}`),oferta:resposta(`Serviço exclusivo ${id}`),publico:resposta(`Público ${id}`),
  descricao:resposta('Vários serviços gerais'),resultado:resposta('Entrega descrita, sem garantia')
}}});
const cores={valor:'#112233, #AABBCC',origem:'onboarding.marca.coresConfirmadas',registradoEm:em,estado:'confirmado_cliente'};
const marca=id=>({ok:true,businessId:id,linhas:[{uso:'logo'},{uso:'identidade',copy:{identidade:{tipoFoto:'fachada'}}},{uso:'identidade',copy:{}}],coresConfirmadas:cores});
function bancada(){
  const e={id:'a',linha:negocio(),usuario:'dono',erro:null,consultas:[],marca:marca('a')};
  const a=ambienteTs({ports:{
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>e.id?{status:'selecionado',negocio:{id:e.id}}:{status:'sem_sessao'}},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:e.usuario?{id:e.usuario}:null},error:null})},
      from(tabela){assert.equal(tabela,'businesses');const filtros=[];e.consultas.push(filtros);const q={
        select(colunas){assert.equal(colunas,'id, profile_id, name, onboarding');return q;},
        eq(c,v){filtros.push([c,v]);return q;},maybeSingle:async()=>({data:e.linha,error:e.erro})};return q;}})},
    './carregar-marca-da-sessao':{carregarMarcaDaSessao:async id=>{assert.equal(id,e.id);return e.marca;}},
    './referencias-do-nicho.module.css':{default:{}},
  }});
  return {e,load:()=>a.load('lib/criativos/contexto-do-negocio-da-sessao.ts').carregarContextoDoCriativo(e.id),a};
}

test('leitura sob sessão/ativo projeta somente este negócio, sem arquivos nem aprovação de IA',async()=>{
  const {e,load}=bancada();const c=await load();assert.equal(c.businessId,'a');assert.deepEqual(e.consultas[0],[['id','a'],['profile_id','dono']]);
  assert.equal(c.oferta.estado,'declarado_cliente');assert.equal(c.nome.estado,'declarado_cliente');
  assert.equal(c.cores.estado,'confirmado_cliente');assert.equal(c.cores.em,em);
  assert.equal(c.objetivo,null);assert.equal(c.materiais.logos,1);assert.equal(c.materiais.fotos,1);assert.equal(c.materiais.semTipo,1);
  for(const k of ['profile_id','storage_path','signedUrl','ia_autorizada'])assert.ok(!JSON.stringify(c).includes(k));
});
test('multiconta não aceita linha, dono ou marca de outro negócio e nega sem sessão',async()=>{
  for(const alterar of [e=>e.linha.id='b',e=>e.linha.profile_id='outro',e=>e.marca=marca('b'),
    e=>e.marca={ok:false,motivo:'negocio_nao_autorizado'},e=>e.usuario=null,e=>e.id=null]){
    const {e,load}=bancada();alterar(e);assert.equal(await load(),null);
  }
  const {e,a}=bancada();assert.equal(await a.load('lib/criativos/contexto-do-negocio-da-sessao.ts').carregarContextoDoCriativo('b'),null);assert.equal(e.consultas.length,0);
});
test('ausência e não sei não inventam oferta nem objetivo a partir de descrição/resultado',async()=>{
  const {e,load}=bancada();e.linha.onboarding.respostas.oferta={texto:'Ainda não sei explicar',origem:'chip',em};
  e.marca={ok:false,motivo:'consulta_falhou'};const c=await load();assert.equal(c.oferta,null);assert.equal(c.objetivo,null);assert.equal(c.cores,null);assert.equal(c.materiais,null);
  e.linha={id:'a',profile_id:'dono',name:'Meu negócio',onboarding:null};const vazio=await load();assert.equal(vazio.nome,null);assert.equal(vazio.apoio.length,0);
});
test('releitura pega dados persistidos novos sem cache global e ignora coluna ausente/erro',async()=>{
  const {e,load}=bancada();assert.equal((await load()).oferta.valor,'Serviço exclusivo a');
  e.linha.onboarding.respostas.oferta=resposta('Oferta revisada no cadastro');assert.equal((await load()).oferta.valor,'Oferta revisada no cadastro');
  e.id='b';e.linha=negocio('b');e.marca=marca('b');const b=await load();assert.equal(b.nome.valor,'Negócio b');assert.ok(!JSON.stringify(b).includes('Serviço exclusivo a'));
  delete e.linha.onboarding;assert.equal(await load(),null);e.erro={message:'falha'};assert.equal(await load(),null);
});
test('projeção de oferta livre continua declaração mesmo com confirmado=true forjado na resposta',()=>{
  const {a}=bancada();const {contextoDoNegocio,contextoDesteNegocio}=a.load('lib/criativos/contexto-do-negocio.ts');const n=negocio();
  n.onboarding.respostas.oferta.confirmado=true;const c=contextoDoNegocio(n,cores,null);
  assert.equal(c.oferta.estado,'declarado_cliente');assert.equal(contextoDesteNegocio(c,'b'),undefined);assert.equal(contextoDesteNegocio(c,'a'),c);
});
test('renderização preenche nome/cores/oferta, mostra procedência e exige conferência para cópia',async()=>{
  const {a,load}=bancada();const c=await load();const {OrientacaoExterna}=a.load('app/(protected)/criativos/OrientacaoExterna.tsx');
  const html=renderToStaticMarkup(React.createElement(OrientacaoExterna,{referenciaId:'700155112131034',contexto:c,
    dados:{objetivo:'Mensagens no WhatsApp',promocao:false,validade:null,hoje:'2026-10-27'}}));
  assert.match(html,/Negócio a/);assert.match(html,/#112233, #AABBCC/);assert.match(html,/Serviço exclusivo a/);
  assert.match(html,/Confirmado por você na etapa da marca/);assert.match(html,/Informado por você no cadastro/);
  assert.match(html,/Conferi os dados desta orientação/);assert.match(html,/disabled="">Copiar orientação/);
  assert.ok(!html.includes('name="identidade"'));assert.ok(!html.includes('<form'));
  const {OrigemDoCampo}=a.load('app/(protected)/criativos/ContextoDoNegocio.tsx');
  const editado=renderToStaticMarkup(React.createElement(OrigemDoCampo,{campo:c.oferta,valor:'Oferta corrigida agora'}));assert.match(editado,/Editado para este preparo/);
});
