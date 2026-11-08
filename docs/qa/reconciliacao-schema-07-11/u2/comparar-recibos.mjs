
import assert from 'node:assert/strict';
import {M,read} from './fixture.mjs';
import {normalize,delta} from './modelo.mjs';
const expected=JSON.parse(read('modelo-delta.json'));
export function conferirRecibos(pre,post,phase='apply') {
 assert.ok(['apply','return'].includes(phase));
 for(const r of [pre,post]){assert.deepEqual(r.normalized,normalize(r.snapshot),'normalizacao SQL diverge da especificacao local');assert.deepEqual(r.delta,delta(r.snapshot),'delta SQL diverge da especificacao local');}
 assert.deepEqual(pre.delta,expected[phase==='apply'?'before':'after'],'PRE divergente');
 assert.deepEqual(post.delta,expected[phase==='apply'?'after':'before'],'POS divergente');
 const before=pre.snapshot.ledger??[],after=post.snapshot.ledger??[];
 assert.equal(before.length,phase==='apply'?45:46,'baseline historico mudou; revisar antes do ato');
 assert.equal(after.length,before.length+1,'quantidade inesperada de entradas POS');
 const name=phase==='apply'?M.applyName:M.returnName;
 assert.equal(before.some(x=>x.name===name),false,'nome ja existe no PRE');
 assert.equal(new Set(after.map(x=>x.version)).size,after.length,'versao duplicada');
 const additions=after.filter(x=>!before.some(b=>b.version===x.version));
 assert.equal(additions.length,1,'esperada uma entrada de ledger');assert.equal(additions[0].name,name,'nome inesperado');
 assert.deepEqual(after.filter(x=>before.some(b=>b.version===x.version)),before,'historico anterior mudou');
 const a=structuredClone(pre.normalized),b=structuredClone(post.normalized);delete a.ledger;delete b.ledger;
 assert.deepEqual(b,a,'mudanca fora do delta autorizado');
 return {ok:true,phase,added:additions[0],protectedBackend:9};
}
