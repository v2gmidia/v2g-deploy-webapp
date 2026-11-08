// Somente loopback. Não inicia/reinicia Next, não herda .env, não chama API externa.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import webpackModule from 'next/dist/compiled/webpack/webpack.js';
const pasta=resolve('docs/qa/loading-05-06-06-11'),root=resolve('.');
const webpack=webpackModule.webpack;
const compiler=webpack({mode:'development',devtool:false,entry:resolve(pasta,'entrada.tsx'),
  output:{path:resolve(pasta,'bundle'),filename:'ensaio.js'},
  resolve:{extensions:['.tsx','.ts','.mjs','.js'],alias:{'@':root}},
  module:{rules:[{test:/\.(tsx?|css)$/,exclude:/node_modules/,use:[resolve(pasta,'loader.cjs')]}]},
  plugins:[new webpack.NormalModuleReplacementPlugin(/next\/navigation|\.\/(actions|revisao-actions|geracao-actions|ReferenciasDoNicho)$/,(resource)=>{
    if(resource.request==='next/navigation'||resource.context.endsWith('criativos'))resource.request=resolve(pasta,'portas.ts');
  })],performance:{hints:false}});
await new Promise((ok,bad)=>compiler.run((error,stats)=>{if(error||stats.hasErrors())bad(error??Error(stats.toString({all:false,errors:true})));else ok();}));
compiler.close(()=>{});
if(process.argv.includes('--build-only'))process.exit(0);
const css=['app/globals.css','app/produto-editorial.css','app/criativos-editorial.css','app/anuncios-editorial.css'].map(p=>readFileSync(p,'utf8')).join('\n');
const html=`<!doctype html><html lang="pt-BR" data-tema="claro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ensaio local 05/06 — fictício</title><style>${css}\n@font-face{font-family:Archivo;src:url(/archivo.woff2)}:root{--font-archivo:Archivo}.bancada{font-family:Archivo,system-ui,sans-serif;max-width:1100px;width:100%;margin:auto;padding:24px;min-width:0;grid-column:1/-1}.bancada>fieldset{display:flex;flex-wrap:wrap;gap:16px;padding:20px;margin-bottom:20px}.bancada>fieldset label{display:flex;align-items:center;gap:8px}.bancada output{display:block;overflow-wrap:anywhere}.bancada button,.bancada select{min-height:44px}.bancada :focus-visible{outline:2px solid var(--cobalt-ink);outline-offset:4px}.bancada .criativos-envio{display:block}@media(max-width:640px){.bancada{padding:16px}.bancada>fieldset{display:grid;min-width:0}.bancada>fieldset label{flex-wrap:wrap}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}</style><div id="root"></div><script src="/ensaio.js"></script></html>`;
createServer(async(req,res)=>{
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(path==='/archivo.woff2'){res.writeHead(200,{'Content-Type':'font/woff2'});res.end(readFileSync('docs/qa/campanha-v2g-evento-28-10/arte-local-v5/archivo-latin.woff2'));return;}
  if(path==='/ensaio.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(readFileSync(resolve(pasta,'bundle/ensaio.js')));return;}
  if(path==='/imagem-lenta.svg'){await new Promise(r=>setTimeout(r,2500));res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1088" height="1088"><rect width="1088" height="1088" fill="#ECF5F2"/><text x="70" y="500" font-size="60" fill="#102A35">PRÉVIA FICTÍCIA</text></svg>');return;}
  if(path!=='/'&&path!=='/anuncios'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"connect-src 'none'; img-src 'self' blob: data:; font-src 'self'"});res.end(html);
}).listen(3196,'127.0.0.1',()=>console.log('Bancada FICTÍCIA: http://127.0.0.1:3196 — sem Next ou serviços externos.'));
