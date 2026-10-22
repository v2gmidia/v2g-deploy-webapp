/** Um ensaio 3DS de R$500 autorizado em 21/10. Nunca cria cobrança/assinatura. */
import assert from 'node:assert/strict';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT,'sandbox');
assert.ok(process.env.ASAAS_API_KEY);
const order='6ae800e5-b4a2-4f12-a6bd-882a5a6cfcaf';
const customer='cus_000009623360';
const charge='pay_j8ec6x5ibbhxk38a';
const subscriptionId='sub_6cv3fxk3b5z3424p';
async function api(path,method='GET',body){
  const r=await fetch('https://api-sandbox.asaas.com/v3'+path,{method,
    headers:{access_token:process.env.ASAAS_API_KEY,'User-Agent':'V2G-QA-3DSFinal/1.0','Content-Type':'application/json'},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error(`Asaas HTTP ${r.status}; conciliar antes de repetir`);
  return r.json();
}
let p=await api('/payments/'+charge);
function checkPayment(){assert.equal(p.id,charge);assert.equal(p.customer,customer);assert.equal(p.externalReference,order);assert.equal(p.value,500);assert.equal(p.billingType,'CREDIT_CARD');}
checkPayment();
async function subscriptions(){
  const r=await api('/subscriptions?externalReference='+order+'&limit=100');assert.equal(r.hasMore,false);
  const list=r.data.filter(s=>s.externalReference===order);
  assert.ok(list.length<=1,'Mais de uma assinatura; conciliar');
  for(const s of list){assert.equal(s.customer,customer);assert.equal(s.value,500);assert.equal(s.billingType,'CREDIT_CARD');assert.equal(s.cycle,'MONTHLY');}
  return list;
}
let subs=await subscriptions();
if(!subs.length){const known=await api('/subscriptions/'+subscriptionId);assert.equal(known.externalReference,order);assert.equal(known.customer,customer);assert.equal(known.value,500);subs=[known];}
const cycles=[];
for(const s of subs){
  const list=await api('/subscriptions/'+s.id+'/payments?limit=100');assert.equal(list.hasMore,false);
  for(const c of list.data){assert.equal(c.customer,customer);assert.equal(c.subscription,s.id);assert.equal(c.value,500);cycles.push(c);}
}
if(process.argv.includes('--cancelar')){
  for(const s of subs)if(!s.deleted)await api('/subscriptions/'+s.id,'DELETE');
  subs=await Promise.all(subs.map(s=>api('/subscriptions/'+s.id)));
  for(const s of subs){assert.equal(s.deleted,true);assert.equal(s.status,'INACTIVE');}
}
if(process.argv.includes('--limpar')){
  for(const s of subs)if(!s.deleted)await api('/subscriptions/'+s.id,'DELETE');
  if(['CONFIRMED','RECEIVED'].includes(p.status)){
    assert.equal((p.refunds??[]).filter(r=>r.status!=='CANCELLED').length,0,'Estorno anterior; conciliar');
    await api('/payments/'+charge+'/refund','POST',{value:500,description:'Limpeza do ensaio 3DS fictício autorizado por Victor em 21/10/2026.'});
  }else assert.ok(['REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS'].includes(p.status),'Pagamento exige conciliação');
  p=await api('/payments/'+charge);checkPayment();
  subs=await subscriptions();
  for(const s of subs)if(!s.deleted)await api('/subscriptions/'+s.id,'DELETE');
  for(const s of subs){const current=await api('/subscriptions/'+s.id);assert.equal(current.deleted,true);assert.equal(current.status,'INACTIVE');}
}
const future=await api('/payments/pay_4uug2r61qjq5vxsa');
assert.equal(future.customer,customer);assert.equal(future.subscription,subscriptionId);assert.equal(future.value,500);assert.equal(future.dueDate,'2026-11-21');
if(process.argv.includes('--limpar')&&!future.deleted){assert.equal(future.status,'PENDING');await api('/payments/'+future.id,'DELETE');}
const futureFinal=await api('/payments/'+future.id);
console.log(JSON.stringify({future:{id:futureFinal.id,status:futureFinal.status,deleted:futureFinal.deleted,referenceMatches:futureFinal.externalReference===order,billingType:futureFinal.billingType},cycles:cycles.map(c=>({id:c.id,status:c.status,value:c.value,dueDate:c.dueDate,deleted:c.deleted})),payment:{id:p.id,status:p.status,value:p.value,hasChallenge:Boolean(p.threeDSecureChallengeUrl),
  refunds:(p.refunds??[]).map(r=>({status:r.status,value:r.value}))},subscriptions:subs.map(s=>({id:s.id,status:s.status,deleted:s.deleted,nextDueDate:s.nextDueDate}))}));
