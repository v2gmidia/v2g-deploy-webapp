import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const {estadoDaFilaValido,filaTerminal}=ambienteTs().load('lib/criativos/geracao/contrato-fila.ts');
const request='55555555-5555-4555-8555-555555555555',business='33333333-3333-4333-8333-333333333333';
const id='88888888-8888-4888-8888-888888888888',attempt='99999999-9999-4999-8999-999999999999';
const base={version:1,contract:'creative-generation-queue-v1',id,request_id:request,business_id:business,attempt_id:attempt,
  status:'queued',simulated:true,snapshot_hash:'a'.repeat(64),artifact_sha256:null,currency:'USD',estimated_usd:'0.000000000000000001',reserved_usd:'1',billed_usd:null,
  idempotency_key:`creative_generation_request:${request}:v1`,poll_after_ms:2000,error:null,cost:null,result:null};
test('estados pendentes permitem só intervalo de leitura definido pelo contrato',()=>{
  for(const status of ['queued','running','storage_pending','reconciliation_required']) {
    assert.equal(estadoDaFilaValido({...base,status},request,business),true);
    assert.equal(estadoDaFilaValido({...base,status,poll_after_ms:0},request,business),false);
    assert.equal(filaTerminal(status),false);
  }
});
test('failed/cancelled são terminais, sem nova consulta automática',()=>{
  for(const status of ['failed','cancelled']) {
    assert.equal(estadoDaFilaValido({...base,status,poll_after_ms:null},request,business),true);
    assert.equal(estadoDaFilaValido({...base,status},request,business),false);assert.equal(filaTerminal(status),true);
  }
});
test('resultado disponível exige todas as provas do arquivo e do custo simulado',()=>{
  const success={...base,status:'artifact_available',poll_after_ms:null,artifact_sha256:'b'.repeat(64),
    cost:{kind:'simulated',unit:'USD_MICRO',amount:'0'},result:{private_reference:id,creative_id:id,sha256:'b'.repeat(64),width:1088,height:1088,
      mime:'image/png',source:'fake-png-v1',authored_by:'11111111-1111-4111-8111-111111111111',simulated:true}};
  assert.equal(estadoDaFilaValido(success,request,business),true);
  for(const patch of [{result:null},{cost:null},{artifact_sha256:'c'.repeat(64)},{billed_usd:'0'},{result:{...success.result,source:'paid'}},
    {result:{...success.result,width:1}},{result:{...success.result,creative_id:attempt}},{cost:{kind:'simulated',unit:'USD_MICRO',amount:0}}])
    assert.equal(estadoDaFilaValido({...success,...patch},request,business),false);
});
test('contrato, pedido, negócio, identidade idempotente e precisão monetária são estritos',()=>{
  for(const patch of [{contract:'old'},{request_id:id},{business_id:id},{idempotency_key:'novo-id'},{estimated_usd:0.1},{reserved_usd:'1e-7'},
    {simulated:false},{status:'completed'},{error:'SQL privado'},{snapshot_hash:'ruim'}])
    assert.equal(estadoDaFilaValido({...base,...patch},request,business),false);
});
