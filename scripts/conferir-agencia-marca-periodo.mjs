import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const A='11111111-1111-4111-8111-111111111111',D='22222222-2222-4222-8222-222222222222';
const load=ambienteTs().load;
const {identidadeDoMenuDaAgencia:identidade}=load('lib/agencia/identidade-do-menu.ts');
const menu=()=>[{id:A,name:'Piligrin',logoUrl:'https://fixture.invalid/logo-duu.jpg'},
 {id:D,name:'Dúú Gomes',logoUrl:'https://fixture.invalid/logo-duu.jpg'}];

test('marca compartilhada sai só da agência; arquivo e marca do anunciante são preservados',()=>{
 const antes=menu(),original=JSON.stringify(antes);
 const novo=identidade(antes,{status:'agencia',agencyBusinessId:A,marcaAgenciaCompartilhada:true});
 assert.equal(novo[0].logoUrl,null);assert.equal(novo[0].name,'Piligrin');
 assert.equal(novo[1],antes[1]);assert.equal(JSON.stringify(antes),original);
});
test('marca própria de agência separada e conta direta continuam disponíveis',()=>{
 const dados=menu();dados[0].logoUrl='https://fixture.invalid/logo-piligrin.jpg';
 for(const contexto of [null,{status:'direto'},{status:'agencia',agencyBusinessId:A,marcaAgenciaCompartilhada:false}])
  assert.equal(identidade(dados,contexto),dados);
});
test('nome parecido e contexto de outra agência não substituem a marca de um cliente',()=>{
 const dados=menu();
 assert.deepEqual(JSON.parse(JSON.stringify(identidade(dados,{status:'agencia',agencyBusinessId:D+'x',marcaAgenciaCompartilhada:true}))),dados);
});
function casco(negocios,ativo=A){
 const {Casco}=ambienteTs({ports:{
  'next/image':{default:({src,alt,width,height})=>React.createElement('img',{src,alt,width,height})},
  'next/navigation':{usePathname:()=>'/inicio',useSearchParams:()=>new URLSearchParams('cliente='+D)},
  '@/components/ui/NavItem':{NavItem:({href,children})=>React.createElement('a',{href},children)},
  '@/components/ui/PreferenciaDeTema':{PreferenciaDeTema:()=>null},
  '@/components/ui/Saudacao':{Saudacao:()=>React.createElement('b',null,'Olá'),DataDeHoje:()=>React.createElement('span',null,'Dia atual')},
  '@/components/ui/ListaNegociosMenu':{ListaNegociosMenu:({children})=>React.createElement('form',null,children)},
 }}).load('components/ui/Casco.tsx');
 return renderToStaticMarkup(React.createElement(Casco,{nome:'Victor',nomeNegocio:negocios.find(n=>n.id===ativo).name,
  negocioAtivoId:ativo,rotuloDaConta:negocios.find(n=>n.id===ativo).name,inicial:'P',negocios,children:null}));
}
test('cabeçalho e menu reais mostram P na Piligrin e mantêm a imagem do Dúú',()=>{
 const html=casco(identidade(menu(),{status:'agencia',agencyBusinessId:A,marcaAgenciaCompartilhada:true}));
 const summaries=[...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map(x=>x[1]);
 assert.ok(summaries.length>=2);
 for(const texto of summaries){assert.match(texto,/class="avatar"[^>]*>P<\/span>/);assert.doesNotMatch(texto,/<img/);assert.match(texto,/Piligrin/);}
 assert.match(html,/value="22222222-2222-4222-8222-222222222222"[\s\S]*?<img src="https:\/\/fixture.invalid\/logo-duu.jpg"/);
});
test('cabeçalho do anunciante mantém sua própria imagem ao selecionar o Dúú',()=>{
 const html=casco(identidade(menu(),{status:'agencia',agencyBusinessId:A,marcaAgenciaCompartilhada:true}),D);
 assert.match(html,/<summary[^>]*>[\s\S]*?<img src="https:\/\/fixture.invalid\/logo-duu.jpg"[\s\S]*?<b>Dúú Gomes<\/b>/);
});

const css={default:new Proxy({},{get:(_,k)=>k})};
const {InicioDoCliente}=ambienteTs({ports:{'./agencia.module.css':css,'./inicio-cliente.module.css':css,
 '@/app/(protected)/inicio/SeletorDePeriodo':{SeletorDePeriodo:({intervalo})=>React.createElement('output',{'aria-label':'Calendário'},intervalo.desde+' / '+intervalo.ate)},
 '@/app/(protected)/inicio/AtualizarInicio':{AtualizarInicio:()=>null},
}}).load('components/agencia/InicioDoCliente.tsx');
function inicio(periodo,gasto){
 const dados={businessId:D,contaId:'act_123',moeda:'BRL',periodo,fuso:'America/Sao_Paulo',coletadoEm:'2026-11-12T12:00:00Z',
 campanhas:[{id:'1',metricas:{estado:'observado',gasto,cliques:2,impressoes:20,entregaObservada:true,
  serieDiaria:{estado:'disponivel',dias:[{dia:periodo.desde,gasto,cliques:2,impressoes:20}]}}}]};
 const {resumirMeta}=load('lib/inicio/resumo-meta.ts');
 return renderToStaticMarkup(React.createElement(InicioDoCliente,{
  detalhe:{contexto:{businessId:D,agencyBusinessId:A,agencia:'Piligrin',anunciante:'Dúú Gomes',praca:'Ensaio local',verbaMensal:3000},
    retorno:{busca:'Dúú',pendentes:false,pagina:1},resumo:{temPendencia:false}},
  dados,resumo:resumirMeta(dados),resultado:{ok:true,dados,contas:[{id:'act_123'}]},intervalo:periodo,
  anterior:false,pendencia:null,falhaPendencia:false,faixa:null,complemento:null,
 }));
}
test('datas completas identificam o resumo e o gasto no mesmo recorte do calendário',()=>{
 const html=inicio({desde:'2026-11-01',ate:'2026-11-07'},28180);
 assert.match(html,/aria-describedby="inicio-resumo-periodo"/);
 assert.match(html,/<p id="inicio-resumo-periodo"[^>]*><strong>01\/11\/2026 – 07\/11\/2026<\/strong>/);
 assert.match(html,/Investido no período/);assert.match(html,/281,80/);
 assert.match(html,/Calendário[^>]*>2026-11-01 \/ 2026-11-07/);
});
test('troca de período/ano atualiza datas, total, gráfico e link para Anúncios juntos',()=>{
 const html=inicio({desde:'2027-01-02',ate:'2027-01-03'},1200);
 assert.match(html,/02\/01\/2027 – 03\/01\/2027/);assert.doesNotMatch(html,/01\/11\/2026|281,80/);
 assert.match(html,/Investido no período/);assert.match(html,/12,00/);
 assert.match(html,/desde=2027-01-02(?:&amp;|&)ate=2027-01-03/);
 assert.match(html,/2027-01-02/);
});
