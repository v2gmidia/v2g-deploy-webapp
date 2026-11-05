// Bancada estática do componente real. Dados FICTÍCIOS; só loopback; sem app/QA/Meta.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as contrato from '../lib/anuncios/contrato-meta.ts';
import * as periodo from '../lib/inicio/periodo.ts';

const gestor=process.argv.includes('--gestor');
const integracao=gestor||process.argv.includes('--integracao');
const pasta=gestor?'docs/qa/n26-01-02-paridade-04-11':integracao?'docs/qa/anuncios-meta-integracao-29-10':'docs/qa/anuncios-meta-29-10';
mkdirSync(pasta,{recursive:true});
const cssModulo=readFileSync('app/(protected)/anuncios/anuncios-meta.module.css','utf8');
const classes=[...new Set([...cssModulo.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m=>m[1]))];
const styles=Object.fromEntries(classes.map(c=>[c,`meta_${c}`]));
const css=classes.reduce((s,c)=>s.replaceAll(`.${c}`,`.meta_${c}`),cssModulo);
const exports={};
const deps={'react/jsx-runtime':jsxRuntime,'@/lib/anuncios/contrato-meta':contrato,'@/lib/inicio/periodo':periodo,
  '@/components/ui/Pill':{Pill:({children,tone})=>React.createElement('span',{className:`pill ${tone}`},children)},
  './anuncios-meta.module.css':{__esModule:true,default:styles}};
const codigo=ts.transpileModule(readFileSync('app/(protected)/anuncios/AnunciosMeta.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
vm.runInNewContext(codigo,{exports,Intl,Date,require:id=>{if(!(id in deps))throw Error('Import não permitido');return deps[id];}});
const objeto=(id,nome,sem=false)=>({id,nome,statusConfigurado:'ACTIVE',statusEfetivo:'IN_PROCESS',metricas:{
  estado:sem?'sem_dados':'zero_medido',gasto:sem?null:0,impressoes:sem?null:0,cliques:sem?null:0,conversas:null,
  dias:sem?[]:['2026-10-28'],entregaObservada:sem?null:false}});
const dados={businessId:'11111111-1111-4111-8111-111111111111',contaId:'act_9001',periodo:{desde:'2026-10-28',ate:'2026-10-28'},
  moeda:'BRL',fuso:'America/Sao_Paulo',coletadoEm:'2026-10-29T12:00:00Z',campanha:{...objeto('10001','Campanha FICTÍCIA'),
    conjuntos:[{...objeto('20001','Conjunto FICTÍCIO'),campanhaId:'10001',anuncios:[
      {...objeto('30001','Anúncio FICTÍCIO — sem medições',true),campanhaId:'10001',conjuntoId:'20001'}]}]}};
function renderizar({conta='act_9001',estado='normal'}={}) {
  const contas=[{id:'act_9001'},{id:'act_9003'}];
  const inventario={ok:true,contas,contaSelecionada:conta,dados:{...dados,contaId:conta,campanhas:estado==='vazio'?[]:[dados.campanha]}};
  const erro={ok:false,motivo:'indisponivel',mensagem:'Não conseguimos consultar os dados agora. Tente novamente mais tarde.',contas:[],contaSelecionada:null};
  const componente=integracao?React.createElement(exports.InventarioDeAnunciosMeta,{resultado:estado==='erro'?erro:inventario,periodo:dados.periodo,
    ...(gestor?{negocioDoGestor:dados.businessId}:{})}):React.createElement(exports.AnunciosMeta,{resultado:{ok:true,dados}});
  const falha=integracao?React.createElement(exports.InventarioDeAnunciosMeta,{resultado:erro,periodo:dados.periodo}):React.createElement(exports.AnunciosMeta,{resultado:erro});
const globais=['app/globals.css','app/produto-editorial.css','app/anuncios-editorial.css'].map(f=>readFileSync(f,'utf8')).join('\n');
return `<!doctype html><html lang="pt-BR" data-tema="claro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia local de Anúncios — dados fictícios</title><style>${globais}\n${css}\n@font-face{font-family:Archivo;src:url('/archivo.woff2')}body{font-family:Archivo,sans-serif}.qa-wrap{grid-column:1/-1;width:100%;max-width:1120px;padding:32px 24px;margin:auto}.qa-nota{padding:16px;border:1px solid var(--line);margin-bottom:24px;line-height:1.6}*{box-sizing:border-box}</style><body><main class="app-shell v2g-editorial"><div class="qa-wrap"><p class="qa-nota"><b>PRÉVIA LOCAL — DADOS FICTÍCIOS.</b> Sem consulta real a cliente, QA ou Meta. ${integracao?'Integração local testada com Auth/RLS/HTTP substituídos. Esta bancada demonstra somente a interface.':'Teste visual do componente novo, ainda desconectado da aba real.'}</p><div class="page-head"><h1>Anúncios</h1><p>Campanha, conjuntos e anúncios em um único lugar.</p></div>${renderToStaticMarkup(componente)}<hr><h2>Exemplo de falha de leitura</h2>${renderToStaticMarkup(falha)}</div></main></body></html>`;
}
const html=renderizar();
writeFileSync(`${pasta}/previa.html`,html);
const fonte=readFileSync('docs/qa/campanha-v2g-evento-28-10/arte-local-v5/archivo-latin.woff2');
createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(req.method!=='GET'||!['/','/anuncios','/supergestor','/vazio','/erro','/archivo.woff2'].includes(url.pathname)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':url.pathname==='/archivo.woff2'?'font/woff2':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(url.pathname==='/archivo.woff2'?fonte:renderizar({conta:url.searchParams.get('conta')==='act_9003'?'act_9003':'act_9001',estado:url.pathname==='/vazio'?'vazio':url.pathname==='/erro'?'erro':'normal'}));
}).listen(gestor?3194:integracao?3193:3192,'127.0.0.1',()=>console.log(`Prévia isolada: http://127.0.0.1:${gestor?3194:integracao?3193:3192} — dados fictícios.`));
