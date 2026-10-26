/** Action WebApp -> dispatcher REAL 26/10 -> provider SUBSTITUÍDO por fixture. Sem API paga. */
import assert from 'node:assert/strict';
import {before,beforeEach,after,test} from 'node:test';
import {criarHarnessFila,A,B,BA,BB,ID} from './test-utils/fila-geracao-local.mjs';
let h;
before(async()=>{h=await criarHarnessFila({dispatcherReal:true});});
beforeEach(async()=>{await h.reset();assert.equal((await h.preparar()).ok,true);});
after(async()=>{await h?.close();});
test('portão real continua OFF e recusa submissão sem abrir HTTP',async()=>{
  assert.equal((await h.consultar('submeter')).motivo,'submissao_real_pendente');assert.equal(h.requests.length,0);assert.equal(await h.count('local_provider_calls'),0);
});
test('action POST202 só enfileira; GET/replay não executam; tick entrega PNG privado com fatura desconhecida',async()=>{
  h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';
  const q=await h.consultar('submeter');assert.equal(q.ok,true);assert.equal(q.status,'queued');assert.equal(q.simulada,false);
  assert.equal(await h.count('local_provider_calls'),0);await h.consultar();assert.equal(await h.count('local_provider_calls'),0);
  await h.worker();const r=await h.consultar();assert.equal(r.status,'artifact_available');assert.equal(r.simulada,false);assert.equal(r.consultarEm,null);
  assert.equal((await h.imagem()).status,200);assert.equal(await h.count('local_provider_calls'),1);assert.equal(await h.count('creative_generation_real_dispatch'),1);
  const job=(await h.db.query('select * from creative_generation_jobs where request_id=$1',[ID])).rows[0];assert.equal(job.billed_usd,null);assert.equal(job.simulated,false);
  assert.equal((await h.biblioteca()).itens.length,1);assert.ok(!JSON.stringify(r).includes('billed_usd'));
});
test('concorrência, resposta perdida e reinício retomam mesmos IDs sem segunda chamada ao provider substituído',async()=>{
  h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';h.perderResposta();assert.equal((await h.consultar('submeter')).ok,false);
  const q=await h.consultar();assert.equal(q.status,'queued');
  const rs=await Promise.all([h.consultar('submeter'),h.consultar('submeter')]);assert.ok(rs.every(r=>r.jobId===q.jobId));
  await h.reboot();assert.equal((await h.consultar()).jobId,q.jobId);await h.worker();await h.worker();await h.consultar('submeter');
  assert.equal(await h.count('creative_generation_jobs'),1);assert.equal(await h.count('local_provider_calls'),1);assert.equal((await h.imagem()).status,200);
});
test('resultado incerto vira reconciliação terminal, sem polling/retry automático ou custo zero inventado',async()=>{
  h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';await h.consultar('submeter');await h.ctrl({provider_fails:true});await h.worker();
  const r=await h.consultar();assert.equal(r.ok,true);assert.equal(r.status,'reconciliation_required');assert.equal(r.consultarEm,null);assert.equal(r.imagemUrl,null);
  await h.reboot();await h.consultar('submeter');await h.worker();assert.equal(await h.count('local_provider_calls'),1);
});
test('escopo/autoria e cancelamento real permanecem fechados',async()=>{
  h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';await h.consultar('submeter');h.ator(B,BB);
  assert.equal((await h.consultar('consultar',BA)).motivo,'negocio_mudou');assert.equal((await h.imagem(BA)).status,404);
  h.ator(A,BA);const n=h.requests.length;assert.equal((await h.consultar('cancelar')).motivo,'submissao_real_pendente');assert.equal(h.requests.length,n);
});
test('sessão ausente ou token humano inválido não criam job nem chamam provider',async()=>{
  h.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='true';
  h.definirTokenDeEnsaio('');
  assert.equal((await h.consultar('submeter')).motivo,'negocio_mudou');
  assert.equal(h.requests.length,0);
  h.definirTokenDeEnsaio('fixture-token-invalido');
  assert.equal((await h.consultar('submeter')).ok,false);
  assert.equal(await h.count('creative_generation_jobs'),0);
  assert.equal(await h.count('local_provider_calls'),0);
});
