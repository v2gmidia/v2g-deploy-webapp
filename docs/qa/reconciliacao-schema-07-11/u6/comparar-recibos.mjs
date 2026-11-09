import assert from 'node:assert/strict';
import {read,baseline,canonical} from './fixture.mjs';
import {M,normalize,delta} from './modelo.mjs';
const model=JSON.parse(read('modelo-delta.json'));
export function conferirRecibos(pre,post,phase='apply'){
 pre=canonical(pre);post=canonical(post);assert.ok(['apply','return'].includes(phase));
 for(const r of [pre,post]){
  assert.deepEqual(r.normalized,normalize(r.snapshot));assert.deepEqual(r.delta,delta(r.snapshot));assert.deepEqual(r.snapshot.ledger.filter(h=>![M.applyName,M.returnName].includes(h.name)),canonical(baseline.snapshot.ledger,'ledger'));
  assert.deepEqual(r.normalized.functions,model.protectedFunctions);assert.deepEqual(r.normalized.u3_function_details,model.protectedDetails);assert.deepEqual(r.normalized.relations.filter(r=>model.protectedParents.some(p=>p.nspname===r.nspname&&p.relname===r.relname)),model.protectedParents);
 }
 assert.deepEqual(pre.delta,model[phase==='apply'?'before':'after']);assert.deepEqual(post.delta,model[phase==='apply'?'after':'before']);
 const a=pre.snapshot.ledger,b=post.snapshot.ledger,name=phase==='apply'?M.applyName:M.returnName;assert.equal(a.length,phase==='apply'?49:50);assert.equal(b.length,a.length+1);assert.ok(!a.some(h=>h.name===name));assert.equal(new Set(b.map(h=>h.version)).size,b.length);assert.deepEqual(b.filter(h=>a.some(x=>x.version===h.version)),a);const added=b.filter(h=>!a.some(x=>x.version===h.version));assert.equal(added.length,1);assert.equal(added[0].name,name);
 const x=structuredClone(pre.normalized),y=structuredClone(post.normalized);delete x.ledger;delete y.ledger;assert.deepEqual(x,y);return {ok:true,phase,added:added[0],protectedBackend:9};
}
