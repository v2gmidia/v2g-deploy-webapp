/** Comparacao local de recibos de metadados; zero rede/segredos. */
import assert from 'node:assert/strict';
export const APPLY_NAME='qa_reconciliacao_u1_meta_reconexao_20261107';
export const RETURN_NAME='qa_reconciliacao_u1_meta_reconexao_retorno_20261107';
export function conferirRecibos(pre,post,phase='apply') {
 assert.ok(['apply','return'].includes(phase),'fase invalida');
 const expectedName=phase==='apply'?APPLY_NAME:RETURN_NAME;
 const before=pre.protected_snapshot.ledger_metadata??[],after=post.protected_snapshot.ledger_metadata??[];
 assert.equal(before.some(x=>x.name===expectedName),false,'nome ja estava no PRE');
 assert.equal(new Set(before.map(x=>x.version)).size,before.length,'versao duplicada PRE');
 assert.equal(new Set(after.map(x=>x.version)).size,after.length,'versao duplicada POS');
 const additions=after.filter(x=>!before.some(b=>b.version===x.version));
 assert.equal(additions.length,1,'esperada exatamente uma entrada nova');
 assert.equal(additions[0].name,expectedName,'nome de migration inesperado');
 assert.deepEqual(after.filter(x=>before.some(b=>b.version===x.version)),before,'ledger anterior mudou');
 const a=structuredClone(pre.protected_snapshot),b=structuredClone(post.protected_snapshot);
 delete a.ledger_metadata;delete b.ledger_metadata;assert.deepEqual(b,a,'catalogo protegido mudou');
 if(phase==='apply') {
  assert.equal(pre.target_overload_count,0,'PRE nao vazio');assert.equal(pre.target_function,null);
  assert.equal(post.target_overload_count,1,'POS nao tem apenas alvo');
  assert.equal(post.target_overloads[0].schema,'public');
  assert.ok(post.target_function,'funcao ausente com ledger presente');
  assert.equal(post.target_function.owner,'postgres');
  assert.equal(post.target_function.anon_execute,false);assert.equal(post.target_function.auth_execute,false);
  assert.equal(post.target_function.service_execute,true);assert.equal(post.target_function.public_execute,false);
 } else {
  assert.equal(pre.target_overload_count,1);assert.ok(pre.target_function);
  assert.equal(post.target_overload_count,0);assert.equal(post.target_function,null);
 }
 return {migration:additions[0],phase,ok:true};
}

