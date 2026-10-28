// Servidor da arte local: somente arquivos explicitamente permitidos, em loopback.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const arquivos = new Map([
  ['/', ['arte.html','text/html; charset=utf-8']],
  ['/previa', ['previa.html','text/html; charset=utf-8']],
  ['/archivo-latin.woff2', ['archivo-latin.woff2','font/woff2']],
  ['/v2g-gestao-sem-gestor-v5.png', ['v2g-gestao-sem-gestor-v5.png','image/png']],
]);
createServer((req,res)=>{
  const arquivo=arquivos.get(req.url);
  if(req.method!=='GET'||!arquivo){res.writeHead(404);res.end();return;}
  try{const bytes=readFileSync(new URL(arquivo[0],import.meta.url));res.writeHead(200,{'Content-Type':arquivo[1],'Cache-Control':'no-store'});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
}).listen(3191,'127.0.0.1',()=>console.log('Prévia V5 em http://127.0.0.1:3191'));
