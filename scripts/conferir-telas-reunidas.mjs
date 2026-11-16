import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { lerTodasPaginas } from '../lib/multiconta/paginacao.ts';

function load(path, deps, extras = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, ...extras, require(id) {
    if (!(id in deps)) throw Error(`Import não previsto: ${id}`);
    return deps[id];
  }});
  return exports;
}
const css = {__esModule:true,default:new Proxy({}, {get:(_,k)=>String(k)})};
const html = renderToStaticMarkup;

function pendencias({falha = false, ajustes = 2, decisoes = 1, flag = true} = {}) {
  const consultas = [];
  const supabase = {from(table) {
    const filtros = []; let head = false;
    const result = () => ({data: head ? null : table === 'decisions' ? [{id:'d1',kind:'diagnosis',payload:{resumo:'Conferir oferta'},created_at:'2026-11-16T12:00:00Z'}] : [],
      count:table === 'decisions' ? decisoes : ajustes, error:falha ? {} : null});
    const q = { select(cols, opts) { head = !!opts?.head; consultas.push({table, cols, filtros}); return q; },
      eq(k,v) { filtros.push([k,v]); return q; }, in(k,v) { filtros.push([k,v]); return q; }, order() { return q; },
      range:async()=>result(), limit:async()=>result(), then(resolve,reject) { return Promise.resolve(result()).then(resolve,reject); } };
    return q;
  }};
  const modulo = load('components/ui/PendenciasDoNegocio.tsx', {'react/jsx-runtime':jsx,
    '@/lib/supabase/server':{createClient:async()=>supabase},
    '@/lib/decisoes/visibilidade':{TIPOS_VISIVEIS_AO_CLIENTE:['classification','diagnosis']},
    '@/lib/multiconta/paginacao':{lerTodasPaginas}}, {process:{env:{V2G_CREATIVE_REVIEW_ENABLED:String(flag)}}});
  return {modulo, consultas};
}
test('pendências ficam no negócio selecionado e apontam ao destino que resolve', async()=>{
  const {modulo,consultas}=pendencias();
  const h=html(await modulo.PendenciasNoInicio({businessId:'negocio-A'}));
  assert.match(h,/href="\/conta#negocio"/);assert.match(h,/href="\/criativos\?aba=revisao"/);
  assert.doesNotMatch(h,/\/alertas/);
  for(const q of consultas) assert.ok(q.filtros.some(([k,v])=>k==='business_id'&&v==='negocio-A'));
  assert.ok(consultas[1].filtros.some(([k,v])=>k==='status'&&v==='changes_requested'));
});
test('falha de pendências não vira tudo em dia; zero confirmado não ocupa o Início',async()=>{
  assert.match(html(await pendencias({falha:true}).modulo.PendenciasNoInicio({businessId:'A'})),/Não conseguimos conferir/);
  assert.equal(await pendencias({decisoes:0,ajustes:0}).modulo.PendenciasNoInicio({businessId:'A'}),null);
  const b=pendencias({flag:false,decisoes:0});await b.modulo.PendenciasNoInicio({businessId:'A'});
  assert.equal(b.consultas.length,1);
});
test('Conta conserva retorno do negócio e histórico sem misturar tipos internos',async()=>{
  const b=pendencias();const h=html(await b.modulo.PendenciasDoNegocio({businessId:'B'}));
  assert.match(h,/Conferir oferta/);assert.match(h,/Atualizações do negócio/);assert.match(h,/\/meu-negocio/);
  for(const q of b.consultas) {
    assert.ok(q.filtros.some(([k,v])=>k==='business_id'&&v==='B'));
    assert.deepEqual(Array.from(q.filtros.find(([k])=>k==='kind')[1]),['classification','diagnosis']);
  }
});
test('avisos antigos redirecionam e não permanecem no menu',()=>{
  const destino=[];
  load('app/(protected)/alertas/page.tsx',{'next/navigation':{redirect:v=>destino.push(v)}}).default();
  assert.deepEqual(destino,['/inicio']);
  assert.doesNotMatch(readFileSync('components/ui/Casco.tsx','utf8'),/href="\/alertas"/);
});
test('Conta compartilha composição, expõe pendência de conexão e preserva os slots reais',()=>{
  const {TelaDeConta}=load('app/(protected)/conta/TelaDeConta.tsx',{'react/jsx-runtime':jsx,'./conta-clean.module.css':css});
  const h=html(React.createElement(TelaDeConta,{secoes:[{id:'conexoes',titulo:'Conexões',resumo:'Facebook',detalhe:'Conta vinculada',acao:'Reconectar',aberta:true,
    conteudo:React.createElement('a',{href:'/conectar'},'Renovar conexão')}],saida:React.createElement('button',{},'Sair da conta')}));
  assert.match(h,/<details[^>]*open=""/);assert.match(h,/href="\/conectar"/);assert.match(h,/Sair da conta/);
  assert.doesNotMatch(h,/Prévia local/);
  const fonte=readFileSync('app/(protected)/conta/page.tsx','utf8');
  for(const componente of ['FormPerfil','TrocarPagina','Identidade','SeletorDeTema','signOutAction','PendenciasDoNegocio']) assert.ok(fonte.includes(componente));
  assert.doesNotMatch(fonte,/ContaClean|Cliente de exemplo|setConectada/);
});
test('reconexão respeita negócio ativo e não exibe erro bruto de provedor',async()=>{
  const consultas=[];
  const q={select:v=>{consultas.push(v);return q;},eq:(k,v)=>{consultas.push([k,v]);return q;},maybeSingle:async()=>({data:{status:'expired',last_error:'SEGREDO_PROVEDOR'},error:null})};
  const {FaixaReconectar}=load('components/ui/FaixaReconectar.tsx',{'react/jsx-runtime':jsx,
    '@/lib/supabase/server':{createClient:async()=>({from:()=>q})},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:'B'}})}});
  const h=html(await FaixaReconectar());assert.match(h,/\/conta#conexoes/);assert.doesNotMatch(h,/SEGREDO_PROVEDOR/);
  assert.ok(consultas.some(v=>Array.isArray(v)&&v[0]==='business_id'&&v[1]==='B'));
});
