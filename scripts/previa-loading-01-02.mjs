/** Prévia React real isolada: actions substituídas antes de resolver imports.
 * Sem Next/.env/Auth/DB/Asaas. Sem build ou restart do dev compartilhado.
 */
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=resolve('.'),require=createRequire(import.meta.url),modules=[],ids=new Map(),css=new Set();
const fixture=`module.exports={iniciarCompra:()=>window.ensaioAcao('pedido'),iniciarPagamento:()=>window.ensaioAcao('pagamento'),
recuperarAction:()=>window.ensaioAcao('recuperacao'),redefinirAction:()=>window.ensaioAcao('senha')};`;
function add(key,source,parent=root){
 if(ids.has(key))return ids.get(key);const id=modules.length;ids.set(key,id);modules.push('');
 let js=/\.[cm]?js$/.test(key)&&!key.includes('virtual')?source:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const deps={};
 for(const [,name] of js.matchAll(/require\(["']([^"']+)["']\)/g)){
  if(name==='next/image'){deps[name]=add('virtual-image',`module.exports={__esModule:true,default:p=>require('react').createElement('img',{src:p.src,alt:p.alt,width:p.width,height:p.height,className:p.className})}`);continue;}
  if(name==='next/link'){deps[name]=add('virtual-link',`module.exports={__esModule:true,default:p=>require('react').createElement('a',p,p.children)}`);continue;}
  if(name==='@/components/seguranca/Turnstile'){deps[name]=add('virtual-turnstile',`module.exports={Turnstile:()=>null}`);continue;}
  let file=name.startsWith('@/')?resolve(root,name.slice(2)):name.startsWith('.')?resolve(parent,name):createRequire(resolve(parent,'__preview.cjs')).resolve(name);
  if(!existsSync(file)){for(const ext of ['.ts','.tsx','.js'])if(existsSync(file+ext)){file+=ext;break;}}
  if(file.endsWith('.css')){css.add(file);deps[name]=add('virtual-css','module.exports={}');continue;}
  if(file.endsWith('/actions.ts')||file.endsWith('\\actions.ts')){deps[name]=add('virtual-actions',fixture);continue;}
  if(/supabase|asaas|backend|server-only/.test(file))throw Error('Import externo proibido na prévia: '+name);
  deps[name]=add(file,readFileSync(file,'utf8'),dirname(file));
 }
 modules[id]=`function(module,exports){const require=n=>__load(${JSON.stringify(deps)}[n]);${js}\n}`;return id;
}
const entry=add('virtual-entry',`
const React=require('react'),{createRoot}=require('react-dom/client');
const {TelaEntrada}=require('./app/(public)/entrar/TelaEntrada.tsx');
const {RedefinirForm}=require('./app/(public)/redefinir/Form.tsx');
const Recuperar=require('./app/(public)/recuperar/page.tsx').default;
const {EntradaEditorial}=require('./components/ui/EntradaEditorial.tsx');
const {FormularioContratar}=require('./app/contratar/FormularioContratar.tsx');
const {PagamentoFormulario}=require('./app/contratar/pagamento/PagamentoFormulario.tsx');
const {EstadoPagamento}=require('./app/contratar/pagamento/EstadoPagamento.tsx');
const SkeletonCompra=require('./app/contratar/loading.tsx').default;
const SkeletonPagamento=require('./app/contratar/pagamento/loading.tsx').default;
const {CarregandoAcesso}=require('./app/(public)/entrar/CarregandoAcesso.tsx');
const h=React.createElement,root=createRoot(document.getElementById('app'));let count=0;
window.ensaioAcao=async tipo=>{const inicio=performance.now();count++;document.getElementById('envios').textContent='Envios simulados: '+count;
 await new Promise(r=>setTimeout(r,Number(document.getElementById('tempo').value)));
 document.getElementById('medicao').textContent='Duração da simulação: '+Math.round(performance.now()-inicio)+' ms';
 if(document.getElementById('falha').checked)throw Error('falha ficticia de transporte');
 if(tipo==='recuperacao')return {enviado:true};
 return tipo==='pedido'||tipo==='pagamento'?{erro:'SIMULAÇÃO: resposta recebida, sem criar pedido ou cobrança. Dados não sensíveis preservados.'}:{error:'SIMULAÇÃO: resposta recebida, sem autenticar nem alterar senha.'};};
window.fetch=async()=>{await new Promise(r=>setTimeout(r,Number(document.getElementById('tempo').value)));if(document.getElementById('falha').checked)throw Error('offline ficticio');return new Response(JSON.stringify({status:document.getElementById('estado').value}));};
function render(){const tela=document.getElementById('tela').value;
 const ref='00000000-0000-4000-8000-000000000001';let view;
 if(tela==='login'||tela==='cadastro')view=h(TelaEntrada,{mode:tela,signInAction:()=>window.ensaioAcao('login'),signUpAction:()=>window.ensaioAcao('cadastro')});
 else if(tela==='recuperar')view=h(Recuperar);
 else if(tela==='redefinir')view=h(EntradaEditorial,null,h('h1',null,'Defina sua nova senha.'),h(RedefinirForm));
 else if(tela==='compra')view=h('main',{className:'contratar-shell'},h('div',{className:'contratar-grid'},h('section',{className:'contratar-intro'},h('h1',null,'Sua contratação.'),h('p',null,'Prévia fictícia dos estados do formulário real.')),h(FormularioContratar,{referencia:ref,apiAtiva:true})));
 else if(tela==='pagamento')view=h('main',{className:'contratar-shell'},h('div',{className:'contratar-pagamento'},h(PagamentoFormulario,{referencia:ref,metodo:'asaas_card',usa3ds:true,sandbox:true})));
 else if(tela==='estado')view=h('main',{className:'contratar-shell'},h('div',{className:'contratar-pagamento'},h(EstadoPagamento,{referencia:ref,inicial:'awaiting_payment'})));
 else view=tela==='skeleton-compra'?h(SkeletonCompra):tela==='skeleton-pagamento'?h(SkeletonPagamento):h(CarregandoAcesso);
 root.render(h(React.Fragment,{key:tela},view));}
document.getElementById('tela').addEventListener('change',render);render();
`);
const bundle=`(()=>{const process={env:{NODE_ENV:'development'}},__modules=[${modules.join(',')}],__cache={};function __load(id){if(__cache[id])return __cache[id].exports;const m={exports:{}};__cache[id]=m;__modules[id](m,m.exports);return m.exports;}__load(${entry});})();`;
const style=['app/globals.css','app/entrada-editorial.css','app/contratar/contratar.css',...css].map(f=>readFileSync(f,'utf8')).join('\n');
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loading 01/02 — prévia fictícia</title><style>${style}
*{box-sizing:border-box}.previa-controles{padding:16px;background:#ECF5F2;color:#102A35;border-bottom:1px solid #70877E;font:16px system-ui;display:flex;flex-wrap:wrap;gap:12px;align-items:center}.previa-controles label{display:flex;gap:8px;align-items:center}.previa-controles select{min-height:44px;max-width:100%;font:inherit}.previa-controles strong{flex-basis:100%}body{margin:0;font-family:Archivo,system-ui,sans-serif}.contratar-pagamento-form{max-width:700px}.previa-controles output{overflow-wrap:anywhere}</style><body>
<div class="previa-controles"><strong>PRÉVIA SIMULADA — sem cobrança, envio, acesso ou alteração de senha. Use somente dados fictícios.</strong>
<label>Tela <select id="tela"><option>login</option><option>cadastro</option><option>recuperar</option><option>redefinir</option><option>compra</option><option>pagamento</option><option>estado</option><option>skeleton-compra</option><option>skeleton-pagamento</option><option>skeleton-acesso</option></select></label>
<label>Resposta <select id="tempo"><option value="250">Rápida (250 ms)</option><option value="4000">Lenta (4 s)</option><option value="12000">Longa (12 s)</option></select></label><label><input id="falha" type="checkbox">Falha simulada</label>
<label>Estado fictício <select id="estado"><option value="awaiting_payment">Pendente</option><option value="payment_approved">Confirmado</option><option value="refunded">Estornado</option></select></label><output id="envios">Envios simulados: 0</output><output id="medicao">Duração: ainda não medida</output></div>
<div id="app"></div><script src="/preview.js"></script></body></html>`;
createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; form-action 'none'; base-uri 'none'");
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
 if(path==='/preview.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(bundle);return;}
 if(path==='/marca-editorial.svg'){res.setHeader('Content-Type','image/svg+xml');res.end(readFileSync('public/marca-editorial.svg'));return;}
 res.writeHead(404);res.end();
}).listen(4316,'127.0.0.1',()=>console.log('Prévia isolada 01/02: http://127.0.0.1:4316 — sem operações externas.'));
