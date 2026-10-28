// Servidor estritamente local da arte; não abre o app, .env, QA ou outros arquivos.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const permitidos = new Map([
  ['/', ['arte.html','text/html; charset=utf-8']],
  ['/previa', ['previa.html','text/html; charset=utf-8']],
  ['/archivo-latin.woff2', ['archivo-latin.woff2','font/woff2']],
  ['/v2g-negocio-anuncios-v3.png', ['v2g-negocio-anuncios-v3.png','image/png']],
]);
createServer((req,res)=>{
  const arquivo=permitidos.get(req.url);
  if(req.method!=='GET'||!arquivo){res.writeHead(404);res.end();return;}
  try{const bytes=readFileSync(new URL(arquivo[0],import.meta.url));res.writeHead(200,{'Content-Type':arquivo[1],'Cache-Control':'no-store'});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
}).listen(3189,'127.0.0.1',()=>console.log('Prévia da arte local em http://127.0.0.1:3189'));
