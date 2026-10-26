/** Somente execução manual: servidor loopback do ensaio fictício. Não lê .env. */
import {createServer} from 'node:http';
import {criarHarnessFila,A,B,BA,BB,ID} from './test-utils/fila-geracao-local.mjs';
const h=await criarHarnessFila();
let serial=Promise.resolve();
const server=createServer((req,res)=>{serial=serial.then(()=>atender(req,res),()=>atender(req,res));});
async function atender(req,res) {
  const origin=req.headers.origin;
  if(origin&&origin!=='http://localhost:3000'&&origin!=='http://127.0.0.1:3000'){res.writeHead(403);res.end();return;}
  res.setHeader('Access-Control-Allow-Origin',origin??'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  try {
    const u=new URL(req.url,'http://127.0.0.1:3106');let input={};
    if(req.method==='POST'){let text='';for await(const b of req){text+=b;if(text.length>2048)throw Error('input_fixture');}input=JSON.parse(text||'{}');}
    const biz=input.businessId??u.searchParams.get('negocio')??BA;
    if(![BA,BB].includes(biz))throw Error('scope_fixture');h.ator(biz===BA?A:B,biz);
    let value;
    if(u.pathname==='/preparar'&&req.method==='POST'){value=await h.preparar();}
    else if(u.pathname==='/andamento'&&req.method==='POST'&&['consultar','submeter','cancelar'].includes(input.operacao)){
      value=await h.consultar(input.operacao,biz,input.requestId??ID);
    } else if(u.pathname==='/worker'&&req.method==='POST'){value=await h.worker();}
    else if(u.pathname==='/controle'&&req.method==='POST'){
      if(input.caso==='off')h.env.V2G_CREATIVE_BACKEND_ENABLED='false';
      else if(input.caso==='on')h.env.V2G_CREATIVE_BACKEND_ENABLED='true';
      else if(input.caso==='perder_resposta')h.perderResposta();
      else if(input.caso==='falhar')await h.ctrl({revogado:true});
      else if(input.caso==='esgotar')await h.falharProcessamento();
      else if(input.caso==='biblioteca_off')h.falharBiblioteca(true);
      else if(input.caso==='biblioteca_on')h.falharBiblioteca(false);
      value={ok:true};
    } else if(u.pathname==='/reset'&&req.method==='POST'){await h.reset();value={ok:true};}
    else if(u.pathname==='/biblioteca'){
      value=await h.biblioteca();
      if(value.falhou){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,motivo:'conferir_biblioteca'}));return;}
    } else if(u.pathname==='/evidencias'){
      const pedidos=await h.pedidos();
      if(pedidos.falhou){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,motivo:'conferir_estado'}));return;}
      value={businessId:biz,requestId:ID,pedidos:pedidos.pedidos.map(p=>p.id),
        jobs:await h.count('creative_generation_jobs'),recibos:await h.count('creative_generation_fake_receipts'),
        posts:h.requests.filter(x=>x.method==='POST').length,gets:h.requests.filter(x=>x.method==='GET').length};
    } else if(u.pathname===`/criativos/imagem-gerada/${ID}`){
      const image=await h.imagem(biz);res.writeHead(image.status,Object.fromEntries(image.headers));res.end(Buffer.from(await image.arrayBuffer()));return;
    } else {res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));
  } catch {res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,motivo:'conferir_estado'}));}
}
server.listen(3106,'127.0.0.1',()=>console.log('Ensaio FICTICIO em 127.0.0.1:3106; sem rede externa, dados reais ou gerador pago.'));
async function close(){server.close();await h.close();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
