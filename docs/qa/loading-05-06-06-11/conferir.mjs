// Testes determinísticos de concorrência/timers dos componentes reais. Sem rede/DOM externo.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import * as veredito from '../../../lib/criativos/veredito.ts';
import * as intencao from '../../../lib/criativos/intencao-envio.ts';
const contexto={contextoDesteNegocio:()=>undefined}; // Contexto ausente; não testa extração de marca.
import * as fila from '../../../lib/criativos/geracao/contrato-fila.ts';
import * as periodo from '../../../lib/inicio/periodo.ts';
const pasta='app/(protected)/criativos/';
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};
function runner(){
  const valores=[],deps=[],limpezas=[];let indice=0,efeitos=[],agora=0,id=0,timers=new Map();
  const iguais=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const react={useState(inicial){const i=indice++;if(!(i in valores))valores[i]=typeof inicial==='function'?inicial():inicial;return [valores[i],v=>{valores[i]=typeof v==='function'?v(valores[i]):v;}];},
    useRef(v){const i=indice++;return valores[i]??(valores[i]={current:v});},useId(){return 'fixture-'+indice++;},
    useEffect(fn,d){const i=indice++;if(!iguais(deps[i],d)){deps[i]=d;efeitos.push(()=>{limpezas[i]?.();limpezas[i]=fn();});}},
    useCallback(fn,d){const i=indice++;if(!iguais(deps[i],d)){deps[i]=d;valores[i]=fn;}return valores[i];}};
  const ambiente={setTimeout(fn,ms){timers.set(++id,{fn,at:agora+ms});return id;},clearTimeout(i){timers.delete(i);}};
  return {react,ambiente,render(fn){indice=0;efeitos=[];const r=fn();for(const e of efeitos)e();return r;},
    tick(ms){agora+=ms;for(const [i,t]of [...timers])if(t.at<=agora){timers.delete(i);t.fn();}},
    close(){for(const l of limpezas)l?.();},timers};
}
function load(path,deps,r,extras={}){
  const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(resolve(path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,
    {exports,console,URL,FormData,File,crypto,Date,Intl,...r.ambiente,...extras,require:n=>{
      if(n==='react')return r.react;if(n==='react/jsx-runtime')return jsx;if(n in deps)return deps[n];throw Error('Import proibido no ensaio: '+n);
    }});return exports;
}
const elements=tree=>Array.isArray(tree)?tree.flatMap(elements):!tree||typeof tree!=='object'?[]:[tree,...[].concat(tree.props?.children??[]).flatMap(elements)];
const text=tree=>Array.isArray(tree)?tree.map(text).join(' '):!tree?'':typeof tree==='string'?tree:typeof tree==='number'?String(tree):[].concat(tree.props?.children??[]).map(text).join(' ');
const first=(tree,p)=>{const e=elements(tree).find(p);assert.ok(e,'elemento do componente real presente');return e;};
test('feedback real: 150 ms sem indicador; 1 s status; 10 s demora; cleanup e repetição não reutilizam status',()=>{
  const r=runner(),{useEsperaLocal}=load(pasta+'useEsperaLocal.ts',{},r);let op='upload';const render=()=>r.render(()=>useEsperaLocal(op));
  assert.equal(render().visivel,false);r.tick(150);assert.equal(render().visivel,false);
  op=null;assert.equal(render().visivel,false);assert.equal(r.timers.size,0);
  op='upload';assert.equal(render().visivel,false);r.tick(999);assert.equal(render().visivel,false);r.tick(1);assert.equal(render().visivel,true);
  r.tick(8999);assert.equal(render().longa,false);r.tick(1);assert.equal(render().longa,true);
  op='analise';assert.equal(render().visivel,false);r.tick(1000);assert.equal(render().visivel,true);
  r.close();assert.equal(r.timers.size,0);
});
test('análise: seleção concorrente dispara uma chamada; timeout não permite repetir enquanto a chamada original continua',async()=>{
  const r=runner(),validacao=defer(),chamada=defer(),espera=defer();let analises=0;class EsperaEstourou extends Error{}
  const {Analisar}=load(pasta+'Analisar.tsx',{'@/lib/backend':{},'@/lib/criativos/envio':{conferirArquivo:()=>validacao.promise,LADO_MINIMO_PX:1024,TETO_DO_NAVEGADOR_MB:9,ACEITOS_NO_INPUT:'image/png'},
    '@/lib/criativos/espera':{comTetoDeEspera:()=>espera.promise,EsperaEstourou},'@/lib/criativos/veredito':veredito,
    './actions':{analisarPecaAction:()=>{analises++;return chamada.promise;}},'./useEsperaLocal':{useEsperaLocal:()=>({visivel:true,longa:true})}},r);
  const render=()=>r.render(()=>Analisar({businessId:'A',podeEnviar:true}));let tree=render();const campo=first(tree,e=>e.type==='input');
  const evento={target:{files:[new File(['FICTICIO'],'fixture.png',{type:'image/png'})]}};
  const p=campo.props.onChange(evento);await campo.props.onChange(evento);validacao.resolve(null);await flush();assert.equal(analises,1);
  espera.reject(new EsperaEstourou());await p;tree=render();
  const resultado=first(tree,e=>typeof e.type==='function'&&'emCurso'in e.props);assert.equal(resultado.props.emCurso,true);
  await campo.props.onChange(evento);assert.equal(analises,1);
  chamada.resolve({ok:false,recado:'Falha fictícia'});await flush();tree=render();
  assert.equal(first(tree,e=>typeof e.type==='function'&&'emCurso'in e.props).props.emCurso,false);r.close();
});
test('envio: dois submits geram um upload; falha conserva UUID e retry usa o mesmo pedido',async()=>{
  const r=runner();let emCurso=defer(),uploads=[];const router={refresh(){}};
  const {PedirRevisao}=load(pasta+'PedirRevisao.tsx',{'next/navigation':{useRouter:()=>router},
    '@/lib/criativos/espera':{comTetoDeEspera:p=>p,EsperaEstourou:class extends Error{}},'@/lib/criativos/revisao':{TAMANHO_MAXIMO_REVISAO:9*1024*1024},
    '@/lib/criativos/veredito':veredito,'./actions':{analisarPecaAction:()=>{throw Error('não analisar envio incerto');}},
    './revisao-actions':{solicitarRevisaoAction:d=>{uploads.push(d.get('submissaoId'));return emCurso.promise;}},
    '@/lib/criativos/intencao-envio':intencao,'./PedirRevisao.module.css':{default:{}},'./ReferenciasDoNicho':{ReferenciasDoNicho:()=>null},
    '@/lib/criativos/contexto-do-negocio':contexto,'./useEsperaLocal':{useEsperaLocal:()=>({visivel:true,longa:true})}},r);
  const render=()=>r.render(()=>PedirRevisao({businessId:'A',hoje:'2026-11-06'}));let tree=render();
  first(tree,e=>e.type==='input'&&e.props.type==='file').props.onChange({target:{files:[new File(['FICTICIO'],'fixture.png',{type:'image/png'})]}});
  tree=render();first(tree,e=>e.type==='input'&&e.props.type==='radio').props.onChange();tree=render();
  await tree.props.onSubmit({preventDefault(){}});tree=render();first(tree,e=>e.type==='input'&&e.props.type==='checkbox'&&e.props.required).props.onChange({target:{checked:true}});tree=render();
  const p=tree.props.onSubmit({preventDefault(){}});await tree.props.onSubmit({preventDefault(){}});assert.equal(uploads.length,1);
  emCurso.reject(Error('rede fictícia'));await p;tree=render();assert.match(text(tree),/Confira a galeria/);
  emCurso=defer();const retry=tree.props.onSubmit({preventDefault(){}});assert.equal(uploads.length,2);assert.equal(uploads[0],uploads[1]);
  emCurso.resolve({ok:false,recado:'Conferir o mesmo envio'});await retry;r.close();
});
test('geração: consulta lenta mantém estado; falha mantém último confirmado; retry só consulta e troca de negócio descarta resposta antiga',async()=>{
  const r=runner(),chamadas=[];let b='A',req='R';const router={refresh(){}};
  const consultar=(business,request,op)=>{const d=defer();chamadas.push({business,request,op,...d});return d.promise;};
  const {AndamentoDaImagem}=load(pasta+'AndamentoDaImagem.tsx',{'next/navigation':{useRouter:()=>router},'./geracao-actions':{},
    '@/lib/criativos/geracao/contrato-fila':fila,'./pedido-de-imagem.module.css':{default:{}},'./useEsperaLocal':{useEsperaLocal:()=>({visivel:true,longa:true})}},r);
  const render=()=>r.render(()=>AndamentoDaImagem({businessId:b,requestId:req,habilitada:true,consultar}));
  const good={ok:true,businessId:'A',requestId:'R',status:'running',simulada:true,consultarEm:null,imagemUrl:null};
  render();chamadas[0].resolve(good);await flush();let tree=render();assert.match(text(tree),/Criando imagem/);
  const atualizar=first(tree,e=>e.type==='button'&&text(e).includes('Atualizar andamento'));atualizar.props.onClick();atualizar.props.onClick();assert.equal(chamadas.length,2);
  tree=render();assert.match(text(tree),/Criando imagem/);chamadas[1].resolve({ok:false,motivo:'conferir_estado'});await flush();tree=render();
  assert.match(text(tree),/último estado confirmado/);assert.match(text(tree),/Criando imagem/);
  first(tree,e=>e.type==='button'&&text(e).includes('Atualizar andamento')).props.onClick();assert.ok(chamadas.every(c=>c.op==='consultar'));
  b='B';req='S';tree=render();assert.doesNotMatch(text(tree),/Criando imagem/);
  chamadas[2].resolve(good);await flush();tree=render();assert.doesNotMatch(text(tree),/Criando imagem/);r.close();
});
test('filtros locais preservam datas implícitas e conteúdo anterior; duplicidade e período inválido não navegam',()=>{
  const r=runner(),urls=[];let pendente=false;
  r.react.useTransition=()=>[pendente,fn=>{pendente=true;fn();}];
  class Form{constructor(periodo=false){this.periodo=periodo;this.campos={conta:'act_9002',desde:'2026-11-01',ate:'2026-11-06'};this.classList={contains:n=>periodo&&n==='periodo-form'};}
    hasAttribute(n){return n==='data-consulta-anuncios';}closest(){return null;}}
  const {AtualizacaoDaConsulta}=load('app/(protected)/anuncios/AtualizacaoDaConsulta.tsx',{'next/navigation':{useRouter:()=>({push:u=>urls.push(u),refresh:()=>urls.push('refresh')})},
    '@/lib/inicio/periodo':periodo,'../criativos/useEsperaLocal':{useEsperaLocal:()=>({visivel:true,longa:true})}},r,
    {HTMLFormElement:Form,FormData:class{constructor(f){this.f=f;}get(n){return this.f.campos[n]??null;}},URLSearchParams,
      window:{location:{pathname:'/anuncios',search:''}}});
  const render=()=>r.render(()=>AtualizacaoDaConsulta({hoje:'2026-11-06',children:'LEITURA ANTERIOR act_9001'}));
  let tree=render();const f=new Form();const event={target:f,preventDefault(){},stopPropagation(){}};
  tree.props.onSubmitCapture(event);tree.props.onSubmitCapture(event);assert.equal(urls.length,1);
  const url=new URL(urls[0],'https://fixture.invalid');assert.equal(url.searchParams.get('conta'),'act_9002');assert.equal(url.searchParams.get('desde'),'2026-11-01');assert.equal(url.searchParams.get('ate'),'2026-11-06');
  tree=render();assert.match(text(tree),/LEITURA ANTERIOR/);assert.match(text(tree),/consulta anterior/);
  pendente=false;tree=render();const invalido=new Form(true);invalido.campos.desde='2026-11-07';tree.props.onSubmitCapture({...event,target:invalido});assert.equal(urls.length,1);assert.ok(text(render()).includes('LEITURA ANTERIOR'));r.close();
});
