/** Caracterização da política VIGENTE, não homologação de revogação após estorno. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { negociosLiberados } from '../lib/multiconta/elegibilidade.ts';
import { escolherNegocio } from '../lib/multiconta/escolha.ts';
import { estadoPagamentoPublico } from '../lib/contratacao/estado-pagamento-publico.ts';
import { vincularComprasAprovadasComCliente } from '../lib/contratacao/vincular-core.ts';

const user={id:'perfil-fixture',email:'qa@example.invalid',email_confirmed_at:'2026-10-21T10:00:00Z'};
const antigo={id:'antigo',name:'Anterior pago',created_at:'2026-10-01T00:00:00Z'};
const novo={id:'novo',name:'Novo estornado',created_at:'2026-10-21T00:00:00Z'};
const pedido={id:'pedido-fixture',business_id:novo.id,status:'payment_approved',buyer_email:user.email,buyer_profile_id:null};
const entrada=(pedidos=[pedido])=>({negocios:[antigo,novo],pedidos,perfilId:user.id,emailVerificado:user.email,
  legadoEm:'2026-10-06T00:00:00Z',operador:false});

test('CARACTERIZACAO: tela financeira mostra estorno, elegibilidade ainda usa aprovacao historica',()=>{
  assert.equal(estadoPagamentoPublico('payment_approved',[{event_type:'PAYMENT_REFUNDED'}]),'refunded');
  assert.deepEqual(negociosLiberados(entrada()).map(b=>b.id),['antigo','novo']);
});
test('negocio novo cancelado nao remove negocio anterior nem autoriza cookie invalido',()=>{
  const liberados=negociosLiberados(entrada([{...pedido,status:'cancelled'}]));
  assert.deepEqual(liberados.map(b=>b.id),['antigo']);
  assert.equal(escolherNegocio(liberados,'novo').status,'selecao_invalida');
});
test('email semelhante ou pedido de outro perfil nao libera o negocio novo',()=>{
  for(const patch of [{buyer_email:'qaa@example.invalid'},{buyer_profile_id:'outro'}])
    assert.deepEqual(negociosLiberados(entrada([{...pedido,...patch}])).map(b=>b.id),['antigo']);
});
test('CARACTERIZACAO: claim atual nao consulta ledger de estorno; nao toma linha ja atribuida',async()=>{
  const rows={commercial_orders:[{...pedido}],businesses:[
    {id:'novo',profile_id:null,claim_email:user.email},
    {id:'alheio',profile_id:'outro',claim_email:user.email},
  ]};
  const consultas=[];
  const admin={from(table){
    consultas.push(table); assert.ok(Object.hasOwn(rows,table),'Mudanca de politica exige atualizar caracterizacao');
    let filtros=[],patch=null;
    const q={select:()=>q,order:()=>q,range:()=>q,not:(k,_op,v)=>{filtros.push(r=>r[k]!==v);return q;},
      eq:(k,v)=>{filtros.push(r=>r[k]===v);return q;},is:(k,v)=>{filtros.push(r=>r[k]===v);return q;},
      in:(k,v)=>{filtros.push(r=>v.includes(r[k]));return q;},update:value=>{patch=value;return q;},
      then(resolve,reject){const data=rows[table].filter(r=>filtros.every(f=>f(r)));if(patch)data.forEach(r=>Object.assign(r,patch));
        return Promise.resolve({data,error:null}).then(resolve,reject);}};
    return q;
  }};
  await vincularComprasAprovadasComCliente(admin,user);
  assert.equal(rows.businesses[0].profile_id,user.id);
  assert.equal(rows.businesses[1].profile_id,'outro');
  assert.equal(rows.commercial_orders[0].buyer_profile_id,user.id);
  assert.equal(consultas.includes('commercial_payment_events'),false);
});
