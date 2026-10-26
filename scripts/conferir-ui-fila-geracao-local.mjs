import assert from 'node:assert/strict';
import {before,beforeEach,after,test} from 'node:test';
import {criarHarnessFila,A,B,BA,BB,ID} from './test-utils/fila-geracao-local.mjs';
let h;
before(async()=>{h=await criarHarnessFila();});
beforeEach(async()=>{await h.reset();assert.equal((await h.preparar()).ok,true);});
after(async()=>{await h?.close();});

test('action -> POST202 fila -> worker fake -> consulta -> imagem privada na biblioteca única',async()=>{
  assert.equal((await h.consultar()).motivo,'nao_iniciado');
  const q=await h.consultar('submeter');assert.equal(q.ok,true);assert.equal(q.status,'queued');assert.equal(q.consultarEm,2000);assert.equal(q.requestId,ID);
  assert.equal(await h.count('creative_generation_fake_receipts'),0);
  await h.worker();const r=await h.consultar();assert.equal(r.status,'artifact_available');assert.equal(r.consultarEm,null);
  assert.ok(!JSON.stringify(r).includes('snapshot_hash'));assert.ok(!JSON.stringify(r).includes('billed'));
  const img=await h.imagem();assert.equal(img.status,200);assert.equal(img.headers.get('Content-Type'),'image/png');assert.match(img.headers.get('Cache-Control'),/no-store/);
  const bytes=Buffer.from(await img.arrayBuffer());assert.equal(bytes.readUInt32BE(16),1088);assert.equal(bytes.readUInt32BE(20),1088);
  assert.equal(await h.count('creatives'),3);assert.equal(await h.count('creative_generation_fake_receipts'),1);
});
test('replay concorrente, recarga dos pedidos e reinício preservam request/job/arquivo/custo fake',async()=>{
  const rs=await Promise.all([h.consultar('submeter'),h.consultar('submeter')]);assert.ok(rs.every(r=>r.ok));assert.equal(rs[0].jobId,rs[1].jobId);
  await h.reboot();const saved=await h.pedidos();assert.equal(saved.pedidos[0].id,ID);assert.equal((await h.consultar()).jobId,rs[0].jobId);
  await h.worker();await h.consultar('submeter');await h.reboot();assert.equal((await h.consultar()).jobId,rs[0].jobId);
  assert.equal(await h.count('creative_generation_jobs'),1);assert.equal(await h.count('creative_generation_fake_receipts'),1);
});
test('resposta POST perdida: consultar o mesmo pedido, sem replay automático',async()=>{
  h.perderResposta();const r=await h.consultar('submeter');assert.equal(r.ok,false);assert.equal((await h.consultar()).status,'queued');
  assert.equal(h.requests.filter(x=>x.method==='POST').length,1);assert.equal(await h.count('creative_generation_jobs'),1);
});
test('troca de negócio e outro ator negam consulta/imagem sem revelar resultado anterior',async()=>{
  await h.consultar('submeter');await h.worker();h.ator(B,BB);
  assert.equal((await h.consultar('consultar',BA)).motivo,'negocio_mudou');assert.equal((await h.imagem(BA)).status,404);
  assert.equal((await h.pedidos()).pedidos.length,0);assert.equal((await h.consultar()).ok,false);
  h.ator(B,BA);assert.equal((await h.consultar()).ok,false);assert.equal((await h.imagem()).status,404);
  h.ator(A,BA);assert.equal((await h.imagem()).status,200);
});
test('cancelamento queued é terminal; replay não reenfileira',async()=>{
  await h.consultar('submeter');assert.equal((await h.consultar('cancelar')).status,'cancelled');
  assert.equal((await h.consultar('submeter')).status,'cancelled');assert.equal((await h.worker()).body.worked,false);
  assert.equal(await h.count('creative_generation_fake_receipts'),0);
});
test('falha e erro privado normalizados, sem botão de retry pago no contrato',async()=>{
  await h.consultar('submeter');await h.ctrl({revogado:true});await h.worker();
  const r=await h.consultar();assert.equal(r.ok,false);assert.ok(!JSON.stringify(r).includes('traceback'));
  assert.equal((await h.imagem()).status,404);assert.equal(await h.count('creative_generation_fake_receipts'),0);
});
test('tentativas fake esgotadas retornam failed terminal e não reenfileiram em replay',async()=>{
  await h.consultar('submeter');await h.falharProcessamento();
  const r=await h.consultar();assert.equal(r.ok,true);assert.equal(r.status,'failed');assert.equal(r.consultarEm,null);
  assert.equal((await h.consultar('submeter')).status,'failed');assert.equal(await h.count('creative_generation_fake_receipts'),0);
});
test('backend OFF recusa antes de HTTP, imagem não abre, pedido continua recuperável',async()=>{
  h.env.V2G_CREATIVE_BACKEND_ENABLED='false';const n=h.requests.length;
  assert.equal((await h.consultar('submeter')).motivo,'indisponivel');assert.equal((await h.imagem()).status,404);assert.equal(h.requests.length,n);
  assert.equal((await h.pedidos()).pedidos[0].id,ID);
});
test('biblioteca persistida independe da geração OFF, inclusive em releitura e troca de negócio',async()=>{
  await h.consultar('submeter');await h.worker();const antes=await h.biblioteca();assert.equal(antes.itens.length,1);
  h.env.V2G_CREATIVE_BACKEND_ENABLED='false';assert.equal((await h.consultar()).motivo,'indisponivel');
  const depois=await h.biblioteca();assert.equal(depois.falhou,false);assert.equal(depois.itens.length,1);assert.equal(depois.itens[0].id,antes.itens[0].id);
  assert.equal((await h.biblioteca()).itens.length,1);h.ator(B,BB);assert.equal((await h.biblioteca()).itens.length,0);
  h.ator(A,BA);h.env.V2G_CREATIVE_BACKEND_ENABLED='true';assert.equal((await h.biblioteca()).itens[0].id,antes.itens[0].id);
  assert.equal(await h.count('creative_generation_jobs'),1);assert.equal(await h.count('creative_generation_fake_receipts'),1);
});
test('falha da própria fonte da biblioteca é distinta de resultado vazio',async()=>{
  await h.consultar('submeter');await h.worker();h.falharBiblioteca(true);assert.equal((await h.biblioteca()).falhou,true);
  h.falharBiblioteca(false);assert.equal((await h.biblioteca()).itens.length,1);assert.equal(await h.count('creative_generation_fake_receipts'),1);
});
test('bucket público, download falho e bytes adulterados nunca abrem imagem',async()=>{
  await h.consultar('submeter');await h.worker();h.bucketPublico(true);assert.equal((await h.imagem()).status,404);
  h.bucketPublico(false);h.downloadFalha(true);assert.equal((await h.imagem()).status,404);h.downloadFalha(false);
  await h.db.query("update local_object_store set bytes=$1 where path like 'geracao/%'",[Buffer.from('ALTERADO')]);assert.equal((await h.imagem()).status,404);
});
