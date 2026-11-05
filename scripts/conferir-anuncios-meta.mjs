// Dados FICTÍCIOS de teste. Nenhuma rede, sessão real ou Meta.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as contrato from '../lib/anuncios/contrato-meta.ts';
import * as periodo from '../lib/inicio/periodo.ts';

const business = '11111111-1111-4111-8111-111111111111';
const esperado = { businessId:business, contaId:'act_9001', campanhaId:'10001', periodo:{desde:'2026-10-28',ate:'2026-10-28'} };
function base() {
  const metricas = () => ({estado:'zero_medido',gasto_centavos:0,impressoes:0,cliques_totais:0,cliques_no_link:null,
    conversas_whatsapp:null,dias_com_observacao:['2026-10-28'],entrega_observada_no_periodo:false,motivos:[]});
  const objeto = (id,nome) => ({id,nome,status_configurado:'ACTIVE',status_efetivo:'IN_PROCESS',metricas:metricas()});
  return {versao:'e28-meta-ads-read-v1',business_id:business,conta_id:'act_9001',id_execucao:null,
    origem_vinculo:'ad_accounts',fonte:'meta_marketing_api',periodo:{...esperado.periodo},moeda:'BRL',fuso:'America/Sao_Paulo',
    coletado_em:'2026-10-29T12:00:00+00:00',avisos:[],campanha:{...objeto('10001','Campanha FICTÍCIA'),
      conjuntos:[{...objeto('20001','Conjunto FICTÍCIO'),campanha_id:'10001',destino:'WHATSAPP',atribuicao:null,
        anuncios:[{...objeto('30001','Anúncio FICTÍCIO'),campanha_id:'10001',conjunto_id:'20001'}]}]}};
}
const ler = v => contrato.lerContratoMeta(v,esperado);
test('campanha manual não exige execução; preserva zero e não medido',()=>{
  const r=ler(base());assert.ok(r);assert.equal(r.campanha.metricas.gasto,0);
  assert.equal(r.campanha.metricas.conversas,null);assert.equal(r.campanha.conjuntos[0].anuncios[0].id,'30001');
});
for(const [nome,mudar] of [
  ['negócio trocado',v=>v.business_id='22222222-2222-4222-8222-222222222222'],
  ['conta trocada',v=>v.conta_id='act_9002'],
  ['campanha trocada',v=>v.campanha.id='10002'],
  ['conjunto de outra campanha',v=>v.campanha.conjuntos[0].campanha_id='10002'],
  ['anúncio de outro conjunto',v=>v.campanha.conjuntos[0].anuncios[0].conjunto_id='20002'],
  ['anúncio de outra campanha',v=>v.campanha.conjuntos[0].anuncios[0].campanha_id='10002'],
  ['ID duplicado',v=>v.campanha.conjuntos[0].anuncios.push(structuredClone(v.campanha.conjuntos[0].anuncios[0]))],
  ['período divergente',v=>v.periodo.ate='2026-10-29'],
  ['data impossível',v=>v.campanha.metricas.dias_com_observacao=['2026-02-30']],
  ['dia fora do período',v=>v.campanha.metricas.dias_com_observacao=['2026-10-27']],
  ['dia duplicado',v=>v.campanha.metricas.dias_com_observacao.push('2026-10-28')],
  ['gasto negativo',v=>v.campanha.metricas.gasto_centavos=-1],
  ['gasto fora da precisão',v=>v.campanha.metricas.gasto_centavos=Number.MAX_SAFE_INTEGER+1],
  ['zero alegado com gasto',v=>v.campanha.metricas.gasto_centavos=100],
  ['moeda desconhecida com gasto',v=>v.moeda=null],
  ['contagem inválida',v=>v.campanha.metricas.conversas_whatsapp='NaN'],
  ['execução fabricada',v=>v.id_execucao='execucao-nao-existe'],
  ['versão futura',v=>v.versao='v999'],
  ['origem desconhecida',v=>v.fonte='mock_meta'],
  ['campo não selecionado',v=>delete v.campanha.metricas.impressoes],
]) test(`lote inteiro é recusado: ${nome}`,()=>{const v=base();mudar(v);assert.equal(ler(v),null);});

test('ausência de medição não é zero, mesmo que haja campanha',()=>{
  const v=base();const m=v.campanha.metricas;
  Object.assign(m,{estado:'sem_dados',gasto_centavos:null,impressoes:null,cliques_totais:null,
    dias_com_observacao:[],entrega_observada_no_periodo:null});
  assert.equal(ler(v).campanha.metricas.gasto,null);
  m.gasto_centavos=0;assert.equal(ler(v),null);
});
test('parcial preserva números medidos sem completar campos vazios',()=>{
  const v=base();Object.assign(v.campanha.metricas,{estado:'parcial',gasto_centavos:300,impressoes:null,
    entrega_observada_no_periodo:true});
  const r=ler(v);assert.equal(r.campanha.metricas.gasto,300);assert.equal(r.campanha.metricas.impressoes,null);
});
test('31 dias são aceitos; 32, datas normalizadas e intervalo invertido são recusados',()=>{
  assert.equal(contrato.periodoMetaValido({desde:'2026-10-01',ate:'2026-10-31'}),true);
  for(const p of [{desde:'2026-09-30',ate:'2026-10-31'},{desde:'2026-02-30',ate:'2026-03-01'},
    {desde:'2026-10-29',ate:'2026-10-28'}]) assert.equal(contrato.periodoMetaValido(p),false);
});
test('status configurado não é usado como entrega atual nem substitui efetivo em preparo',()=>{
  assert.equal(contrato.rotuloStatusMeta('ACTIVE'),'Ativado na Meta');
  assert.equal(contrato.rotuloStatusMeta('IN_PROCESS'),'Preparando');
  assert.equal(contrato.rotuloStatusMeta('UNKNOWN_PRIVATE_TOKEN'),'Status não informado');
  assert.equal(contrato.rotuloStatusMeta(null),'Status não informado');
});

export function componente() {
  const codigo=ts.transpileModule(readFileSync('app/(protected)/anuncios/AnunciosMeta.tsx','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
  }).outputText;
  const exports={};const deps={
    'react/jsx-runtime':jsxRuntime,
    '@/components/ui/Pill':{Pill:({children})=>React.createElement('span',{},children)},
    '@/lib/inicio/periodo':periodo,'@/lib/anuncios/contrato-meta':contrato,
    './anuncios-meta.module.css':{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})},
  };
  vm.runInNewContext(codigo,{exports,Intl,Date,require:id=>{
    if(!(id in deps))throw Error(`Dependência não permitida: ${id}`);return deps[id];
  }});
  return exports.AnunciosMeta;
}
const Tela=componente();
test('renderiza hierarquia, IDs e zero; conversas ausentes não viram zero',()=>{
  const html=renderToStaticMarkup(React.createElement(Tela,{resultado:{ok:true,dados:ler(base())}}));
  assert.match(html,/Campanha FICTÍCIA/);assert.match(html,/Conjunto FICTÍCIO/);assert.match(html,/Anúncio FICTÍCIO/);
  for(const id of ['10001','20001','30001'])assert.ok(html.includes(id));
  assert.match(html,/Preparando/);assert.match(html,/Zero medido/);assert.match(html,/R\$.*0,00/);
  assert.match(html,/Conversas no WhatsApp<\/dt><dd class="ausente">Não medido/);
});
test('erro de leitura fica fora do caminho vazio ou zero, sem detalhe cru',()=>{
  const html=renderToStaticMarkup(React.createElement(Tela,{resultado:{ok:false,motivo:'indisponivel',mensagem:'Tente novamente mais tarde.'}}));
  assert.match(html,/Não foi possível consultar/);assert.doesNotMatch(html,/Campanha FICTÍCIA|Investido|R\$/);
});
test('nomes da fonte são escapados; sem componentes de publicação/ativação',()=>{
  const v=base();v.campanha.nome='<script>segredo</script>';
  const html=renderToStaticMarkup(React.createElement(Tela,{resultado:{ok:true,dados:ler(v)}}));
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
  const fonte=readFileSync('app/(protected)/anuncios/AnunciosMeta.tsx','utf8');
  assert.doesNotMatch(fonte,/fetch\(|process\.env|\.post\(|ativarCampanha/);
});
