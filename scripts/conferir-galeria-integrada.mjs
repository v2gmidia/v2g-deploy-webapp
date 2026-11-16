import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';

const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const P='33333333-3333-4333-8333-333333333333', U='44444444-4444-4444-8444-444444444444';
function bancada({titular=true, selecionadaBusiness=A, ajuste=false, erroAjustes=false}={}) {
  const consultas=[],assinados=[];
  const peca={id:P,business_id:selecionadaBusiness,file_name:'Peça antiga',storage_path:'arquivo.png',status:'approved',external_ad_id:'123',created_at:'2026-11-01T12:00:00Z'};
  const pedido={id:P,business_id:A,original_name:'Ajuste antigo',file_path:'inconsistente',status:'changes_requested',created_at:'2026-01-01T12:00:00Z'};
  const supabase={auth:{getUser:async()=>({data:{user:{id:U}},error:null})},from(table){
    const filtros=[];
    const resultado=()=>({data:table==='businesses'? titular?{id:A,profile_id:U}:null
      :table==='creatives'?filtros.some(([k])=>k==='id')?peca:[]
      :table==='creative_review_requests'&&filtros.some(([k])=>k==='status')&&ajuste?[pedido]:[],
      error:erroAjustes&&filtros.some(([k])=>k==='status')?{}:null});
    const q={select(cols){consultas.push({table,cols,filtros});return q;},eq(k,v){filtros.push([k,v]);return q;},in(){return q;},order(){return q;},limit(){return q;},
      range:async()=>resultado(),maybeSingle:async()=>resultado(),then(resolve,reject){return Promise.resolve(resultado()).then(resolve,reject);}};
    return q;
  }};
  const admin={storage:{from:()=>({createSignedUrls:async paths=>{assinados.push(...paths);return {data:paths.map(path=>({path,signedUrl:'https://example.invalid/image'})),error:null};}})}};
  const {carregarGaleriaDoNegocio}=ambienteTs({ports:{'@/lib/supabase/server':{createClient:async()=>supabase},'@/lib/supabase/admin':{createAdminClient:()=>admin},'./geracao/imagem-privada':{urlImagemGerada:()=>{throw Error('imagem gerada não esperada');}}}}).load('lib/criativos/galeria-da-sessao.ts');
  return {ler:()=>carregarGaleriaDoNegocio(A,{revisaoHabilitada:true,geracaoHabilitada:false,selecionado:`peca-${P}`,incluirAjustes:true}),consultas,assinados};
}
test('peça antiga abre pelo ID exato dentro do negócio e conserva associação ao anúncio',async()=>{
  const b=bancada(),r=await b.ler();assert.equal(r.itens.length,1);assert.equal(r.itens[0].id,`peca-${P}`);
  assert.equal(r.itens[0].associacoes[0].href,'/anuncios?anuncio=123');
  const q=b.consultas.find(q=>q.table==='creatives'&&q.filtros.some(([k])=>k==='id'));
  assert.ok(q.filtros.some(([k,v])=>k==='business_id'&&v===A));assert.ok(q.filtros.some(([k,v])=>k==='uso'&&v==='campanha'));
});
test('resposta com peça de outro negócio não gera imagem nem assinatura',async()=>{
  const b=bancada({selecionadaBusiness:B}),r=await b.ler();assert.equal(r.itens.length,0);assert.equal(b.assinados.length,0);
});
test('titular não confirmado impede leituras e assinatura de criativos',async()=>{
  const b=bancada({titular:false}),r=await b.ler();assert.equal(r.falhaDaGaleria,true);assert.equal(b.consultas.length,1);assert.equal(b.assinados.length,0);
});
test('ajustes antigos continuam na revisão sem assinar caminho inconsistente',async()=>{
  const b=bancada({ajuste:true}),r=await b.ler();assert.ok(r.itens.some(i=>i.nome==='Ajuste antigo'&&i.grupo==='revisao'));assert.equal(r.revisaoInconsistente,true);assert.ok(!b.assinados.includes('inconsistente'));
});
test('falha ao ler ajustes antigos não é apresentada como galeria completa',async()=>{
  assert.equal((await bancada({erroAjustes:true}).ler()).falhaDaGaleria,true);
});
