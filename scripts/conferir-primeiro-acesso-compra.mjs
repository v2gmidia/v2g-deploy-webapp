/** Actual signup action and payment projection; fictitious DB/Auth ports, network forbidden. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const email='comprador@example.invalid',cpf='00000000191',cnpj='11222333000181';
const order=(id,doc=cpf,method='asaas_card',status='payment_approved')=>({id,business_id:'business-'+id,buyer_email:email,cnpj:doc,payment_method:method,status,provider_charge_id:'pay_'+id});
function scenario(orders,events=[],broken=false){
 const signup=[],queries=[];
 const admin={from(table){let filters=[],single=false,start=0,end=Infinity,max=Infinity;
  const q={select:()=>q,eq:(k,v)=>{queries.push([table,k,v]);filters.push(r=>r[k]===v);return q;},
   not:(k,_op,v)=>{filters.push(r=>r[k]!==v);return q;},in:(k,vs)=>{filters.push(r=>vs.includes(r[k]));return q;},
   order:()=>q,limit:n=>{max=n;return q;},range:(a,b)=>{start=a;end=b;return q;},maybeSingle:()=>{single=true;return q;},
   then(ok,bad){const rows=(table==='commercial_orders'?orders:events).filter(r=>filters.every(f=>f(r))).slice(start,Math.min(end+1,start+max));
    return Promise.resolve({data:broken&&table==='commercial_payment_events'?null:single?(rows[0]??null):rows,error:broken&&table==='commercial_payment_events'?{code:'unavailable'}:null}).then(ok,bad);}};return q;}};
 const {signUpAction}=ambienteTs({env:{NEXT_PUBLIC_SITE_URL:'https://qa.example.invalid'},ports:{
  '@/lib/supabase/admin':{createAdminClient:()=>admin},
  '@/lib/supabase/server':{createClient:async()=>({auth:{signUp:async p=>{signup.push(p);return {data:{session:null},error:null};}}})},
  'next/navigation':{redirect:()=>{throw Error('unexpected navigation');}},
 }}).load('app/(public)/entrar/actions.ts');
 return {signup,queries,run:async(doc=cpf)=>{const f=new FormData();for(const [k,v]of Object.entries({nome:'Pessoa Fixture',whatsapp:'11999990000',email,cnpj:doc,senha:'Fixture!2026abc',confirmarSenha:'Fixture!2026abc'}))f.set(k,v);return signUpAction({},f);}};
}
test('regressao: compra A estornada nao cria conta apesar de status historico aprovado',async()=>{
 const s=scenario([order('A')],[{order_id:'A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUNDED'}]);
 await s.run();assert.equal(s.signup.length,0);
});
test('A/B: estorno A nao bloqueia compra B valida, nem documento B autoriza A',async()=>{
 const s=scenario([order('A'),order('B',cnpj,'asaas_pix')],[{order_id:'A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUNDED'}]);
 await s.run();assert.equal(s.signup.length,0);await s.run(cnpj);assert.equal(s.signup.length,1);
 assert.ok(s.queries.some(([table,k,v])=>table==='commercial_payment_events'&&k==='provider_charge_id'&&v==='pay_B'));
});
test('pendente, cancelado e sem pedido nao chamam Auth',async()=>{
 for(const status of ['awaiting_payment','cancelled','payment_failed']){const s=scenario([order('A',cpf,'asaas_card',status)]);await s.run();assert.equal(s.signup.length,0);}
 const s=scenario([]);await s.run();assert.equal(s.signup.length,0);
});
test('Pix/cartao confirmados permitem cadastro; charge de outro ciclo nao estorna a inicial',async()=>{
 for(const method of ['asaas_pix','asaas_card']) {const s=scenario([order('A',cpf,method)],[{order_id:'A',provider_charge_id:'pay_outrociclo',event_type:'PAYMENT_REFUNDED'}]);await s.run();assert.equal(s.signup.length,1);}
});
test('estorno parcial/em processamento, contestacao, sem charge e consulta indisponivel negam cadastro',async()=>{
 for(const event_type of ['PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUND_IN_PROGRESS','PAYMENT_CHARGEBACK_REQUESTED']) {
  const s=scenario([order('A')],[{order_id:'A',provider_charge_id:'pay_A',event_type}]);await s.run();assert.equal(s.signup.length,0);
 }
 const missing=scenario([{...order('A'),provider_charge_id:null}]);await missing.run();assert.equal(missing.signup.length,0);
 const broken=scenario([order('A')],[],true);await broken.run();assert.equal(broken.signup.length,0);
});
test('mesmo email/documento: outra compra valida permite cadastro sem fundir negocios',async()=>{
 const s=scenario([order('A'),order('B')],[{order_id:'A',provider_charge_id:'pay_A',event_type:'PAYMENT_REFUNDED'}]);await s.run();assert.equal(s.signup.length,1);
});
