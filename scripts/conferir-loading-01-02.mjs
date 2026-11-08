import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {executarComFeedback} from '../app/(public)/entrar/acao-local.ts';
const require=createRequire(import.meta.url),ts=require('typescript');
const ler=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function hooks(){
 const cells=[],effects=[],timers=new Map();let cursor=0,now=0,seq=0;
 const react={useRef:value=>{const n=cursor++;return cells[n]??=( {current:value});},
  useState:value=>{const n=cursor++;if(!(n in cells))cells[n]=value;return [cells[n],v=>{cells[n]=typeof v==='function'?v(cells[n]):v;}];},
  useEffect:(fn,deps)=>{const n=cursor++;const old=cells[n];if(!old||deps.some((d,i)=>d!==old.deps[i])){
    effects.push(()=>{old?.cleanup?.();cells[n]={deps,cleanup:fn()};});}}};
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(ler('app/(public)/entrar/EsperaFormulario.tsx'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
   exports:m.exports,module:m,require:n=>n==='react'?react:n.endsWith('.css')?{}:require(n),
   setTimeout:(fn,ms)=>{const n=++seq;timers.set(n,{at:now+ms,fn});return n;},clearTimeout:n=>timers.delete(n),
 });
 return {api:m.exports,render:(name,...args)=>{cursor=0;const result=m.exports[name](...args);while(effects.length)effects.shift()();return result;},
  advance:ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}},timers};
}
test('trava síncrona cobre duplo clique/Enter; erro libera uma nova tentativa',()=>{
 const h=hooks();let prevenidos=0;const event={preventDefault:()=>prevenidos++};
 let state=h.render('useEsperaFormulario',false);assert.equal(state.permitir(event),true);
 assert.equal(state.permitir(event),false);assert.equal(prevenidos,1);
 h.render('useEsperaFormulario',true);h.render('useEsperaFormulario',false);
 state=h.render('useEsperaFormulario',false);assert.equal(state.permitir(event),true);
});
test('rápido não pisca; 2–10s e >10s têm texto localizado e timers são limpos',()=>{
 const h=hooks();h.render('useEsperaFormulario',true);h.advance(250);assert.equal(h.render('useEsperaFormulario',true).fase,0);
 h.render('useEsperaFormulario',false);assert.equal(h.timers.size,0);
 h.render('useEsperaFormulario',true);h.advance(1999);assert.equal(h.render('useEsperaFormulario',true).fase,0);
 h.advance(1);assert.equal(h.render('useEsperaFormulario',true).fase,1);
 h.advance(8000);assert.equal(h.render('useEsperaFormulario',true).fase,2);
 h.render('useEsperaFormulario',false);assert.equal(h.render('useEsperaFormulario',false).fase,0);
 assert.equal(h.timers.size,0);
});
test('mensagem tem live region sem spinner ou percentual; foco só após resultado',()=>{
 const h=hooks(),p=h.api.EsperaFormulario({pendente:true,fase:0,lenta:'lenta',longa:'longa'});
 assert.equal(p.props.children,'');assert.equal(p.props.role,'status');assert.equal(p.props['aria-live'],'polite');
 assert.equal(h.api.EsperaFormulario({pendente:true,fase:2,lenta:'lenta',longa:'longa'}).props.children,'longa');
 let focos=0;const ref=h.render('useFocoResultado',true,undefined);ref.current={focus:()=>focos++};
 h.render('useFocoResultado',true,'erro');assert.equal(focos,0);
 h.render('useFocoResultado',false,'erro');assert.equal(focos,1);
});
test('falha ambígua conserva mensagem honesta; navegação Next não é engolida',async()=>{
 const fallback={erro:'Resultado não confirmado; acompanhe o mesmo pedido.'};
 assert.equal(await executarComFeedback(async()=>{throw Error('segredo');},fallback),fallback);
 assert.deepEqual(await executarComFeedback(async()=>({ok:true}),fallback),{ok:true});
 const redirect=Object.assign(Error('redirect'),{digest:'NEXT_REDIRECT;replace;/inicio;307;'});
 await assert.rejects(executarComFeedback(async()=>{throw redirect;},fallback),e=>e===redirect);
});
test('formulários reais ligam busy, trava, foco e textos sem alegar sucesso',()=>{
 for(const file of ['app/contratar/FormularioContratar.tsx','app/contratar/pagamento/PagamentoFormulario.tsx',
  'app/(public)/recuperar/page.tsx','app/(public)/redefinir/Form.tsx','app/(public)/entrar/TelaEntrada.tsx']){
  const s=ler(file);assert.match(s,/aria-busy=/,file);assert.match(s,/\.permitir\(/,file);
  assert.match(s,/EsperaFormulario/,file);assert.match(s,/tabIndex=\{-1\}/,file);
 }
 const card=ler('app/contratar/pagamento/PagamentoFormulario.tsx');assert.doesNotMatch(card,/formulario\.reset\(/);
 assert.match(card,/\["cardNumber","ccv"\]/);assert.match(card,/\.\.\.campo\("holderName"\)/);
 const consulta=ler('app/contratar/pagamento/EstadoPagamento.tsx');
 assert.match(consulta,/setFalha\(true\)/);assert.doesNotMatch(consulta,/setEstado\("verification_unavailable"\)/);
 assert.match(consulta,/pendente \|\| document.visibilityState/);assert.match(consulta,/controller.abort\(\)/);
 assert.match(consulta,/entrega do e-mail e a criação do seu acesso são etapas separadas/);
});
test('skeletons de rota usam estrutura e texto acessível, sem movimento obrigatório',()=>{
 for(const f of ['app/contratar/loading.tsx','app/contratar/pagamento/loading.tsx']){
  const s=ler(f);assert.match(s,/role="status"/);assert.match(s,/aria-hidden="true"/);assert.match(s,/contratar-esqueleto/);
 }
 assert.match(ler('app/(public)/entrar/CarregandoAcesso.tsx'),/aria-hidden="true"/);
 for(const f of ['app/(public)/entrar/espera-local.css','app/contratar/contratar.css'])
  assert.doesNotMatch(ler(f),/@keyframes|animation:/);
});
