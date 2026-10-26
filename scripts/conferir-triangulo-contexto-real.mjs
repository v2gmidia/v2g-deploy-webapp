import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const a=ambienteTs();
const {prepararTrianguloDoServidor}=a.load('lib/criativos/geracao/triangulo-contexto.ts');
const {hashDoPedido}=a.load('lib/criativos/pedido-imagem.ts');
const business='33333333-3333-4333-8333-333333333333',request='55555555-5555-4555-8555-555555555555',perfil='11111111-1111-4111-8111-111111111111';
const ids=['66666666-6666-4666-8666-666666666666','77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888'];
function entrada() {
  const em='2026-10-25T15:00:00Z';const payload={versao:1,objetivo:'Fixture sem geração',oferta:'Oferta FICTICIA',acao:'WhatsApp FICTICIO',promocao:false,validade:null};
  const central={tipo:'central',versao:'fixture-central-v1',nichoId:null,conteudo:'REGRA FICTICIA. Não inventar fachada.',revisadoPor:'fixture',revisadoEm:em};
  return {pedido:{id:request,business_id:business,requested_by:perfil,content_hash:hashDoPedido(payload),payload,status:'awaiting_configuration',created_at:em},
    profileId:perfil,agora:'2026-10-26T15:00:00Z',nichoId:'barbearia-fixture',nichoConfirmado:true,
    cores:{businessId:business,valores:['#123ABC','#FEDC00'],origem:'onboarding.marca.coresConfirmadas',confirmadoEm:em},
    documentos:{central,nicho:{...central,tipo:'nicho',versao:'fixture-nicho-v1',nichoId:'barbearia-fixture'}},escopoDocumentos:{central:null,nicho:null},
    materiais:['identidade_cliente','pinterest','anuncios_nicho'].map((classe,i)=>({id:ids[i],businessId:business,classe,
      nichoId:i===0?null:'barbearia-fixture',caminho:`${i===0?'identidade':'referencias'}/${business}/${ids[i]}.png`,sha256:String(i+1).repeat(64),versao:'fixture-v1',
      fonte:i===0?`arquivo_proprio:${ids[i]}`:i===1?'https://br.pinterest.com/pin/fixture/':'https://www.facebook.com/ads/library/?id=fixture',
      observadoEm:em,condicaoDeUso:'FICTICIO: material próprio do teste, sem publicação ou terceiro',revisadoPor:'fixture',revisadoEm:em,
      aprovacao:{id:'fixture-direito-'+i,businessId:business,requestId:request,materialId:ids[i],sha256:String(i+1).repeat(64),finalidade:'gerar_imagem',destino:'gpt-image-2',por:'fixture',em}})),
    autorizacaoPiloto:{id:'fixture-aprovacao-sem-efeito',businessId:business,requestId:request,por:'fixture',em,destino:'gpt-image-2',quantidade:1,
      estimativaUsd:'0.000000000000000001',reservaUsd:'0.000000000000000002',limiteUsd:'0.000000000000000003'},politicaVersao:'fixture-v1'};
}
test('triângulo completo preserva origem, revisão, autorização, versão e decimais sem gerar',()=>{
  const e=entrada(),r=prepararTrianguloDoServidor(e);assert.equal(r.ok,true);assert.equal(r.manifesto.materiais.length,3);
  const fontes=r.manifesto.materiais.map(m=>JSON.parse(m.fonte));assert.deepEqual(new Set(fontes.map(x=>x.classe)),new Set(['identidade_cliente','pinterest','anuncios_nicho']));
  assert.ok(fontes.every(f=>f.autorizacao.requestId===request&&f.materialVersao==='fixture-v1'));assert.equal(r.manifesto.estimativa_usd,'0.000000000000000001');
  const oldHash=r.hash;e.documentos.central.conteudo='MUDOU';assert.equal(r.manifesto.central.conteudo.includes('REGRA'),true);assert.notEqual(prepararTrianguloDoServidor(e).hash,oldHash);
});
test('saída é aceita pelo ContextoAprovado real do backend em validação offline',()=>{
  const r=prepararTrianguloDoServidor(entrada());assert.equal(r.ok,true);
  const backend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
  const py=spawnSync(backend+'/.venv/Scripts/python.exe',['-X','utf8','-c',
    'import sys; from src.imagem.geracao_contrato import ContextoAprovado; c=ContextoAprovado.model_validate_json(sys.stdin.read()); print(c.destino_autorizado, len(c.materiais), c.estimativa_usd)'],
    {cwd:backend,input:JSON.stringify(r.manifesto),encoding:'utf8',timeout:15000});
  assert.equal(py.status,0,py.stderr);assert.match(py.stdout,/gpt-image-2 3 1E-18/);
});
test('nenhuma das três fontes pode ser omitida ou substituída por outro nicho',()=>{
  for(const classe of ['identidade_cliente','pinterest','anuncios_nicho']) {const e=entrada();e.materiais=e.materiais.filter(m=>m.classe!==classe);assert.equal(prepararTrianguloDoServidor(e).ok,false);}
  const e=entrada();e.materiais[2].nichoId='manicure-fixture';assert.equal(prepararTrianguloDoServidor(e).ok,false);
});
test('link da biblioteca não prova direito; autorização precisa coincidir com pedido, material e hash',()=>{
  for(const alterar of [e=>e.materiais[1].aprovacao=null,e=>e.materiais[1].aprovacao.sha256='a'.repeat(64),e=>e.materiais[1].aprovacao.requestId=ids[0],
    e=>e.materiais[1].businessId=ids[0],e=>e.materiais[1].fonte='https://pinterest.com.evil.invalid/pin/1',e=>e.materiais[2].fonte='https://www.facebook.com/outro']){
    const e=entrada();alterar(e);assert.equal(prepararTrianguloDoServidor(e).ok,false);
  }
});
test('documentos/nicho/dono/prazo/caminho e conteúdo do pedido não admitem fallback',()=>{
  for(const alterar of [e=>e.documentos.nicho=null,e=>e.escopoDocumentos.central=ids[0],e=>e.profileId=ids[0],e=>e.pedido.payload.oferta='ALTERADA',
    e=>e.materiais[1].caminho=`referencias/${business}/../outro.png`,e=>e.nichoConfirmado=false,e=>e.materiais[2].sha256=e.materiais[1].sha256]) {
    const e=entrada();alterar(e);assert.equal(prepararTrianguloDoServidor(e).ok,false);
  }
});
test('piloto exige aprovação nominal de uma imagem e valores exatos coerentes',()=>{
  for(const alterar of [e=>e.autorizacaoPiloto=null,e=>e.autorizacaoPiloto.quantidade=2,e=>e.autorizacaoPiloto.requestId=ids[0],e=>e.autorizacaoPiloto.estimativaUsd='0',
    e=>e.autorizacaoPiloto.reservaUsd='1e-18',e=>e.autorizacaoPiloto.reservaUsd='0.000000000000000004',e=>e.autorizacaoPiloto.reservaUsd=0.1]) {
    const e=entrada();alterar(e);assert.equal(prepararTrianguloDoServidor(e).ok,false);
  }
});
test('validade da promoção usa São Paulo e inclui o último dia',()=>{
  const e=entrada();e.agora='2026-10-27T01:00:00Z';e.pedido.payload.promocao=true;e.pedido.payload.validade='2026-10-26';e.pedido.content_hash=hashDoPedido(e.pedido.payload);
  assert.equal(prepararTrianguloDoServidor(e).ok,true);e.agora='2026-10-27T04:00:00Z';assert.equal(prepararTrianguloDoServidor(e).ok,false);
});
