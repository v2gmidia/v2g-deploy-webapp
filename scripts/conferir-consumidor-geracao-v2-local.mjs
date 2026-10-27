/** WebApp real -> API/loader/worker Python reais -> PostgreSQL efêmero -> PNG FAKE privado.
 * Só fixtures e portas explícitas; sem .env, Supabase remoto, provider ou chamadas pagas.
 */
import assert from 'node:assert/strict';
import {before,beforeEach,after,test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {criarHarnessFila,A,B,BA,BB,ID} from './test-utils/fila-geracao-local.mjs';
let h;
before(async()=>{h=await criarHarnessFila({pedidoV2:true});});
beforeEach(async()=>{await h.reset();assert.equal((await h.preparar()).ok,true);});
after(async()=>{await h?.close();});

async function concluir(){const r=await h.consultar('submeter');assert.equal(r.ok,true,JSON.stringify({r,http:h.requests}));assert.equal(r.status,'queued');await h.worker();return h.consultar();}
async function renderizarPagina() {
  const a=ambienteTs({env:h.env,ports:{
    '@/lib/estado/cliente':{estadoDoCliente:async()=>({negocioId:BA,diaSeguinte:{execucao:null}})},
    '@/lib/titulos':{tituloDaAba:()=>({})},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:BA}})},
    '@/lib/supabase/server':{createClient:async()=>h.clienteSessao()},
    '@/lib/supabase/admin':{createAdminClient:()=>({storage:{from(){throw Error('Não assinar imagem gerada pela porta genérica');}}})},
    './PedidoDeImagem':{PedidoDeImagem:()=>null},'./Analisar':{Analisar:()=>null},'./Amostra':{AmostraDeVereditos:()=>null},'./PedirRevisao':{PedirRevisao:()=>null},
  }});
  return renderToStaticMarkup(await a.load('app/(protected)/criativos/page.tsx').default());
}

test('pedido v2 real e fontes persistidas chegam a fila fake, PNG privado e pagina/biblioteca',async()=>{
  const antes=await h.pedidos();assert.equal(antes.pedidos[0].payload.versao,2);assert.equal(antes.pedidos[0].payload.referenciaId,'700155112131034');
  const r=await concluir();assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.status,'artifact_available');assert.equal(r.simulada,true);
  assert.ok(!JSON.stringify(r).includes('approvals_sha256'));const response=await h.imagem();assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/private.*no-store/);assert.equal(response.headers.get('Content-Type'),'image/png');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.readUInt32BE(16),1088);
  const job=(await h.db.query('select * from creative_generation_jobs where request_id=$1',[ID])).rows[0];
  assert.equal(job.snapshot.payload.referenciaId,'700155112131034');assert.equal(job.snapshot.versao_contexto,2);
  assert.equal(job.simulated,true);assert.equal(job.billed_usd,null);assert.equal(await h.count('local_provider_calls'),0);
  const pagina=await renderizarPagina();assert.match(pagina,/Biblioteca<span>1<\/span>/);assert.ok(pagina.includes(`/criativos/imagem-gerada/${ID}?negocio=${BA}`));
});

test('replay concorrente, reinicio e nova sessao preservam um pedido/job/arquivo e biblioteca',async()=>{
  const rs=await Promise.all([h.consultar('submeter'),h.consultar('submeter')]);assert.ok(rs.every(r=>r.ok));assert.equal(rs[0].jobId,rs[1].jobId);
  await h.worker();await h.reboot();h.ator(null,BA);assert.equal((await h.imagem()).status,404);h.ator(A,BA);
  assert.equal((await h.preparar()).repetido,true);assert.equal((await h.pedidos()).pedidos[0].id,ID);
  const r=await h.consultar();assert.equal(r.jobId,rs[0].jobId);assert.equal((await h.imagem()).status,200);
  assert.equal((await h.biblioteca()).itens.length,1);assert.match(await renderizarPagina(),/Biblioteca<span>1<\/span>/);
  assert.equal(await h.count('creative_generation_jobs'),1);assert.equal(await h.count('creative_generation_fake_receipts'),1);
  h.env.V2G_CREATIVE_BACKEND_ENABLED='false';assert.equal((await h.biblioteca()).itens.length,1);
  assert.match(await renderizarPagina(),/Biblioteca<span>1<\/span>/);
});

test('outro negocio, outro usuario e autor errado nao recebem bytes',async()=>{
  await concluir();h.ator(B,BB);assert.equal((await h.imagem(BA)).status,404);assert.equal((await h.consultar('consultar',BA)).ok,false);
  assert.equal((await h.biblioteca()).itens.length,0);h.ator(B,BA);assert.equal((await h.imagem(BA)).status,404);
  h.ator(A,BA);h.alterarResposta(r=>{if(r.result)r.result.authored_by=B;});assert.equal((await h.consultar()).ok,false);assert.equal((await h.imagem()).status,404);
});

test('proof ausente, ID/versao/hash/material/autoridade divergentes negam consulta e arquivo',async()=>{
  await concluir();
  for(const alterar of [r=>delete r.context_proof,
    r=>r.request_id=B,r=>r.business_id=BB,
    r=>r.context_proof.reference_id='1077371334754860',r=>r.context_proof.catalog_version++,r=>r.context_proof.catalog_sha256='a'.repeat(64),
    r=>r.context_proof.brand_material_id=B,r=>r.context_proof.brand_sha256='a'.repeat(64),r=>r.context_proof.approvals_sha256='a'.repeat(64),
    r=>r.context_proof.version=1,r=>r.context_proof.extra=true]) {
    h.alterarResposta(alterar);assert.equal((await h.consultar()).ok,false);assert.equal((await h.imagem()).status,404);
  }
  h.alterarResposta(null);assert.equal((await h.imagem()).status,200);
});

test('contexto revogado depois de gerar nao pode recuperar arquivo por prova antiga',async()=>{
  await concluir();await h.db.query('update creative_generation_context_approvals set revoked_at=now() where request_id=$1',[ID]);
  const n=h.requests.length;assert.equal((await h.consultar()).motivo,'contexto_pendente');assert.equal((await h.imagem()).status,404);assert.equal(h.requests.length,n);
});

test('proof no formulario nao concede aprovacao nem substitui fonte revogada',async()=>{
  await h.db.query('update creative_generation_context_approvals set revoked_at=now() where request_id=$1',[ID]);
  const f=new FormData();for(const [k,v]of Object.entries({requestId:ID,businessId:BA,objetivo:'FICTICIO local',oferta:'Corte com horário fictício',acao:'WhatsApp fictício',confirmado:'on',referenciaId:'700155112131034',context_proof:'{"version":2,"approved":true}'}))f.set(k,v);
  assert.equal((await h.actions.guardarPedidoAction({},f)).repetido,true);
  const pedido=(await h.pedidos()).pedidos[0];assert.equal(Object.hasOwn(pedido.payload,'context_proof'),false);
  const n=h.requests.length;assert.equal((await h.consultar('submeter')).motivo,'contexto_pendente');assert.equal(h.requests.length,n);
  assert.equal(await h.count('creative_generation_jobs'),0);
});

test('logo vigente/proveniencia alterada bloqueia mesmo com DTO antigo coerente',async()=>{
  await concluir();const id=h.fixtureV2.marca.manifest.logo.id;await h.db.query("update creatives set copy='{}'::jsonb where id=$1",[id]);
  assert.equal((await h.consultar()).motivo,'contexto_pendente');assert.equal((await h.imagem()).status,404);
});

test('mudar para modo real com flags de teste ON nao libera submissao v2 nem fake como real',async()=>{
  h.env.V2G_CREATIVE_APP_MODE='real_dispatch';h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';
  const n=h.requests.length;assert.equal((await h.consultar('submeter')).motivo,'submissao_real_pendente');assert.equal(h.requests.length,n);
  assert.equal((await h.consultar()).motivo,'contexto_pendente');assert.equal(await h.count('creative_generation_jobs'),0);
  h.env.V2G_CREATIVE_APP_MODE='fila_ficticia';
});

test('trocar tentativa/caminho ou bytes nao abre imagem; nao existe segundo artefato',async()=>{
  await concluir();const row=(await h.db.query("select id,copy,storage_path from creatives where copy->'generation' is not null")).rows[0];
  h.alterarResposta(r=>{r.attempt_id=B;});assert.equal((await h.imagem()).status,404);h.alterarResposta(null);
  const alterado=structuredClone(row.copy);alterado.generation.attemptId=B;
  await h.db.query('update creatives set copy=$1 where id=$2',[JSON.stringify(alterado),row.id]);assert.equal((await h.imagem()).status,404);
  await h.db.query('update creatives set copy=$1 where id=$2',[JSON.stringify(row.copy),row.id]);
  await h.db.query("update creatives set storage_path=replace(storage_path,'geracao/','identidade/') where id=$1",[row.id]);
  assert.equal((await h.imagem()).status,404);await h.db.query('update creatives set storage_path=$1 where id=$2',[row.storage_path,row.id]);
  await h.db.query('update local_object_store set bytes=$1 where path=$2',[Buffer.from('ADULTERADO FICTICIO'),row.storage_path]);
  assert.equal((await h.imagem()).status,404);assert.equal(await h.count('creative_generation_fake_receipts'),1);
});
