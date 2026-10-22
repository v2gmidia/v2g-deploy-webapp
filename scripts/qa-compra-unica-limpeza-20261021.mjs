/** Somente o ensaio de R$500 autorizado por Victor em 21/10. Sem novas cobranças. */
import assert from 'node:assert/strict';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT,'sandbox');
assert.ok(process.env.ASAAS_API_KEY,'Credencial Sandbox indisponível');
const order='c947b641-1001-459c-8ba9-1dfc348a80be';
const customer='cus_000009620432';
const subscription='sub_ngps4nr5yh3z9upl';
const charge='pay_tnsleg6pm6w8xszn';
async function api(path,method='GET',body) {
  const response=await fetch('https://api-sandbox.asaas.com/v3'+path,{
    method,headers:{access_token:process.env.ASAAS_API_KEY,'User-Agent':'V2G-QA-CompraUnica/1.0','Content-Type':'application/json'},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw Error(`Asaas retornou HTTP ${response.status}; conciliar antes de repetir.`);
  return response.json();
}
let sub=await api('/subscriptions/'+subscription);
let payment=await api('/payments/'+charge);
function validate() {
  assert.equal(sub.id,subscription);assert.equal(sub.customer,customer);assert.equal(sub.externalReference,order);
  assert.equal(sub.value,500);assert.equal(sub.billingType,'CREDIT_CARD');assert.equal(sub.cycle,'MONTHLY');
  assert.equal(payment.id,charge);assert.equal(payment.customer,customer);assert.equal(payment.externalReference,order);
  assert.equal(payment.subscription,subscription);assert.equal(payment.value,500);assert.equal(payment.billingType,'CREDIT_CARD');
}
validate();
if(process.argv.includes('--limpar')) {
  if(!sub.deleted)await api('/subscriptions/'+subscription,'DELETE');
  sub=await api('/subscriptions/'+subscription);
  assert.equal(sub.deleted,true,'Cancelamento não confirmado; conciliar');
  if(['CONFIRMED','RECEIVED'].includes(payment.status)) {
    // Nunca repetir um estorno já solicitado ou de resultado ambíguo.
    assert.equal((payment.refunds??[]).filter(r=>r.status!=='CANCELLED').length,0,'Estorno já existe; conciliar');
    await api('/payments/'+charge+'/refund','POST',{value:500,description:'Limpeza do ensaio fictício de compra única autorizado em 21/10/2026.'});
  } else assert.ok(['REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS'].includes(payment.status),'Estado financeiro exige conciliação');
  payment=await api('/payments/'+charge);
  validate();
}
const list=await api('/subscriptions/'+subscription+'/payments?limit=100');
assert.equal(list.hasMore,false);
assert.ok(list.data.every(p=>p.customer===customer&&p.subscription===subscription&&p.value===500),'Cobrança inesperada; conciliar');
console.log(JSON.stringify({subscription:{deleted:sub.deleted,status:sub.status},payment:{status:payment.status,value:payment.value,
  refunds:(payment.refunds??[]).map(r=>({status:r.status,value:r.value}))},charges:list.data.map(p=>({id:p.id,status:p.status,value:p.value,deleted:p.deleted}))}));
