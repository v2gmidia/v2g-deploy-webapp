import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const user={id:'perfil',email:'cliente@example.invalid',email_confirmed_at:'2026-11-01',app_metadata:{},user_metadata:{}};
const business=id=>({id,name:id,created_at:'2026-11-01',profile_id:user.id,claim_email:null});
const order=(id,status='payment_approved')=>({id:'order-'+id,business_id:id,status,payment_method:'asaas_card',provider_charge_id:'pay_'+id,buyer_profile_id:user.id,buyer_email:user.email});
function scenario({orders=[order('A'),order('B')],businesses=[business('A'),business('B')],events=[{order_id:'order-A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUNDED'}],broken=false,grants=[],cookie=null}={}) {
 const writes=[],calls=[];
 const db={auth:{getUser:async()=>({data:{user},error:null})},from(table){let filters=[],single=false,start=0,end=Infinity,max=Infinity,patch,charge;
  const rows=()=>({commercial_orders:orders,businesses,commercial_payment_events:events,historical_contract_access:grants,webapp_legacy_access:[]}[table]??[]);
  const q={select:()=>q,eq:(k,v)=>{if(k==='provider_charge_id')charge=v;filters.push(r=>r[k]===v);return q;},in:(k,vs)=>{filters.push(r=>vs.includes(r[k]));return q;},is:(k,v)=>{filters.push(r=>r[k]===v);return q;},
   not:(k,_op,v)=>{filters.push(r=>r[k]!==v);return q;},order:()=>q,range:(a,b)=>{start=a;end=b;return q;},limit:n=>{max=n;return q;},maybeSingle:()=>{single=true;return q;},
   update:value=>{patch=value;return q;},then(ok,bad){calls.push(table);let selected=rows().filter(r=>filters.every(f=>f(r))).slice(start,Math.min(end+1,start+max));
    if(patch){writes.push({table,ids:selected.map(r=>r.id),patch});selected.forEach(r=>Object.assign(r,patch));}
    const failure=table==='commercial_payment_events'&&(typeof broken==='function'?broken(charge):broken);
    return Promise.resolve({data:failure?null:single?(selected[0]??null):selected,error:failure?{code:'unavailable'}:null}).then(ok,bad);}};return q;}};
 const load=ambienteTs({env:{V2G_HISTORICAL_ACCESS_ENABLED:'true'},ports:{
  '@/lib/supabase/server':{createClient:async()=>db},'@/lib/supabase/admin':{createAdminClient:()=>db},
  '../supabase/admin.ts':{createAdminClient:()=>db},
  'next/headers':{cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})},
 }}).load;
 return {writes,calls,db,orders,businesses,
  access:()=>load('lib/contratacao/acesso.ts').temAcessoWebApp(db,user),
  active:()=>load('lib/multiconta/ativo.ts').negocioAtivoDaSessao(),
  link:()=>load('lib/contratacao/vincular-core.ts').vincularComprasAprovadasComCliente(db,user)};
}
test('conta aceita antes do estorno perde somente a autorizacao por A',async()=>{
 const s=scenario({orders:[order('A')],businesses:[business('A')]});
 assert.equal(await s.access(),false);
 const active=await s.active();assert.deepEqual(Array.from(active.negocios,n=>n.id),[]);
 assert.equal(s.businesses[0].profile_id,user.id); // no ownership/auth mutation
 await s.link();assert.equal(s.writes.length,0);
});
test('A estornado + B valido: login preservado, seletor so B e cookie A nao autoriza',async()=>{
 const s=scenario({cookie:'A'});assert.equal(await s.access(),true);
 const active=await s.active();assert.deepEqual(Array.from(active.negocios,n=>n.id),['B']);
 assert.notEqual(active.status,'selecionado');assert.equal(s.writes.length,0);
});
test('pendente, parcial ou falha financeira nao liberam; leitura parcial de 100 ocorrencias tambem nao',async()=>{
 for(const input of [
  {orders:[order('A','awaiting_payment')]},
  {broken:true,orders:[order('A')]},
  {orders:[order('A')],events:[{order_id:'order-A',provider_charge_id:'pay_A',event_type:'PAYMENT_PARTIALLY_REFUNDED'}]},
  {orders:[order('A')],events:Array.from({length:100},()=>({order_id:'order-A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUND_IN_PROGRESS'}))},
 ]) {const s=scenario({...input,businesses:[business('A')]});assert.equal(await s.access(),false);assert.equal((await s.active()).negocios.length,0);}
});
test('vinculo nao toma A estornado; B aprovado e verificado pode ser vinculado',async()=>{
 const s=scenario({orders:[{...order('A'),buyer_profile_id:null},{...order('B'),buyer_profile_id:null}],businesses:[{...business('A'),profile_id:null,claim_email:user.email},{...business('B'),profile_id:null,claim_email:user.email}]});
 await s.link();assert.equal(s.businesses[0].profile_id,null);assert.equal(s.businesses[1].profile_id,user.id);
 assert.equal(s.orders[0].buyer_profile_id,null);assert.equal(s.orders[1].buyer_profile_id,user.id);
 assert.ok(s.writes.every(w=>!w.ids.includes('A')&&!w.ids.includes('order-A')));
});
test('compra independente do mesmo negocio preserva direito; outro ciclo nao estorna inicial',async()=>{
 const s=scenario({orders:[order('A'),{...order('A'),id:'order-A2',provider_charge_id:'pay_A2'}],businesses:[business('A')]});
 assert.equal(await s.access(),true);assert.deepEqual(Array.from((await s.active()).negocios,n=>n.id),['A']);
 const renewal=scenario({orders:[order('A')],businesses:[business('A')],events:[{order_id:'order-A',provider_charge_id:'pay_outrociclo',event_type:'PAYMENT_REFUNDED'}]});
 assert.equal(await renewal.access(),true);
});
test('liberacao historica aceita independente e compra B continuam legitimas',async()=>{
 const grant={id:'grant-fixture',business_id:'A',accepted_by:user.id,accepted_at:'2026-11-01',recipient_email:user.email,contractor_document:'00000000191',revoked_at:null};
 const s=scenario({grants:[grant]});assert.equal(await s.access(),true);
 assert.deepEqual(Array.from((await s.active()).negocios,n=>n.id),['A','B']);
});
test('falha de leitura em A nao derruba B valido',async()=>{
 const s=scenario({broken:charge=>charge==='pay_A',events:[]});
 assert.equal(await s.access(),true);assert.deepEqual(Array.from((await s.active()).negocios,n=>n.id),['B']);
});
test('vinculo aceito e sessao existente sao reavaliados depois do estorno, sem logout global',async()=>{
 const events=[];const s=scenario({orders:[order('A')],businesses:[business('A')],events});
 assert.equal(await s.access(),true);assert.equal((await s.active()).negocio.id,'A');
 events.push({order_id:'order-A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUNDED'});
 assert.equal(await s.access(),false);assert.equal((await s.active()).negocios.length,0);
 assert.equal(s.businesses[0].profile_id,user.id);assert.equal(s.orders[0].buyer_profile_id,user.id);assert.equal(s.writes.length,0);
});
