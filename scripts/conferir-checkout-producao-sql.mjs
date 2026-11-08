import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {prepararSchemaCheckout,sqlMigration,readiness} from './test-utils/checkout-schema.mjs';
import {pedidosComDireito} from '../lib/contratacao/direito-por-pedido.ts';
import {estadoPagamentoPublico,OCORRENCIAS_PUBLICAS} from '../lib/contratacao/estado-pagamento-publico.ts';
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE
  ??'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);

test('SQL produção revisável: precondições, ACL, RPCs reais e isolamento A/B',async t=>{
  const db=new PGlite();
  const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
  try {
    await prepararSchemaCheckout(db);
    await db.exec(sqlMigration(readiness));
    await db.exec(sqlMigration(readiness));
    await t.test('readiness retorna 1, somente service_role; sem leitura pública financeira',async()=>{
      assert.equal(await scalar('select checkout_producao_schema_v1()'),1);
      for(const role of ['anon','authenticated'])
        assert.equal(await scalar("select has_function_privilege($1,'checkout_producao_schema_v1()','EXECUTE')",[role]),false);
      await db.exec('set role service_role');
      assert.equal(await scalar('select checkout_producao_schema_v1()'),1);
      await db.exec('reset role');
    });
    await t.test('coluna, RLS, ACL ou unicidade ausentes fecham gate; migration parcial reverte',async()=>{
      for(const change of [
        'alter table checkout_3ds_context disable row level security',
        'grant select on commercial_payment_events to anon',
        'alter table commercial_orders rename column provider_card_flow to broken_flow',
        'alter table commercial_payment_email_outbox drop constraint commercial_payment_email_outbox_order_id_provider_charge_id_key',
        'grant execute on function reservar_assinatura_apos_3ds(uuid,date) to public',
      ]) {
        await db.exec('begin');await db.exec(change);
        assert.equal(await scalar('select checkout_producao_schema_v1()'),0,change);
        await db.exec('rollback');
      }
      await db.exec('alter table checkout_3ds_context disable row level security');
      await assert.rejects(db.exec(sqlMigration(readiness)),/precondicoes/);
      await db.exec('rollback');
      await db.exec('alter table checkout_3ds_context enable row level security');
      assert.equal(await scalar('select checkout_producao_schema_v1()'),1);
    });
    await t.test('SQL mensal 3DS: autorização não aprova; RECEIVED permite uma reserva; negativa prévia impede liberação',async()=>{
      for(const risk of [false,true]) {
        const monthly=await scalar("select registrar_pedido_self_service($1,'mensal@example.invalid','Pessoa Ficticia','11999990000','Mensal Ficticio','00000000191',1,'monthly','asaas_card')",[randomUUID()]);
        const charge=risk?'pay_Risk':'pay_Monthly',customer=risk?'cus_Risk':'cus_Monthly';
        await db.query("update commercial_orders set provider_card_flow='initial_3ds',provider_charge_id=$2,provider_customer_id=$3,provider_first_due_date='2099-01-31' where id=$1",[monthly,charge,customer]);
        const ev=(name,type)=>scalar("select registrar_evento_inicial_3ds($1,$2,$3,$4,$5,50000,'2099-01-31')",[monthly,name,charge,customer,type]);
        assert.equal(await ev('evt_authorized_'+charge,'PAYMENT_AUTHORIZED'),true);
        assert.equal(await scalar('select status from commercial_orders where id=$1',[monthly]),'awaiting_payment');
        if(risk)assert.equal(await ev('evt_risk_'+charge,'PAYMENT_REPROVED_BY_RISK_ANALYSIS'),true);
        assert.equal(await ev('evt_received_'+charge,'PAYMENT_RECEIVED'),true);
        assert.equal(await scalar('select status from commercial_orders where id=$1',[monthly]),risk?'awaiting_payment':'payment_approved');
        assert.equal(await scalar("select reservar_assinatura_apos_3ds($1,'2099-02-28')",[monthly]),!risk);
        assert.equal(await scalar("select reservar_assinatura_apos_3ds($1,'2099-02-28')",[monthly]),false);
      }
    });
    const criar=ref=>scalar("select registrar_pedido_self_service($1,'ficticio@example.invalid','Pessoa Ficticia','11999990000','Negocio Ficticio','00000000191',1,'annual_upfront','asaas_pix')",[ref]);
    const ref=randomUUID(),a=await criar(ref),b=await criar(randomUUID());
    await t.test('mesmo email/CPF não funde negócios; mesma referência preserva o pedido',async()=>{
      assert.equal(await criar(ref),a);
      assert.notEqual(await scalar('select business_id from commercial_orders where id=$1',[a]),
        await scalar('select business_id from commercial_orders where id=$1',[b]));
    });
    for(const [id,charge,customer] of [[a,'pay_A','cus_A'],[b,'pay_B','cus_B']]) {
      await db.query('update commercial_orders set provider_charge_id=$2,provider_customer_id=$3 where id=$1',[id,charge,customer]);
      assert.equal(await scalar("select aprovar_pagamento_api_self_service($1,$2,null,$3,$4,'PAYMENT_CONFIRMED',528000,'2026-11-05')",
        [id,charge,customer,'evt_'+charge]),true);
    }
    await t.test('estorno/replay A bloqueiam apenas A; B preserva direito; evento divergente recusa',async()=>{
      const refund=()=>scalar("select registrar_evento_financeiro_asaas($1,'evt_refund_A','pay_A',null,'cus_A','PAYMENT_REFUNDED',528000,'2026-11-05')",[a]);
      assert.equal(await refund(),true);assert.equal(await refund(),true);
      assert.equal(await scalar("select registrar_evento_financeiro_asaas($1,'evt_refund_A','pay_B',null,'cus_B','PAYMENT_REFUNDED',528000,'2026-11-05')",[b]),false);
      assert.equal(await scalar("select count(*)::int from commercial_payment_events where provider_event_id='evt_refund_A'"),1);
      const orders=(await db.query('select id,status,payment_method,provider_charge_id from commercial_orders where id=any($1::uuid[])',[[a,b]])).rows;
      const eligible=await pedidosComDireito(orders,async order=>{
        const events=(await db.query('select event_type,provider_charge_id from commercial_payment_events where order_id=$1',[order.id])).rows;
        return estadoPagamentoPublico(order.status,events.filter(e=>e.provider_charge_id===order.provider_charge_id && OCORRENCIAS_PUBLICAS.includes(e.event_type)));
      });
      assert.deepEqual(eligible.map(x=>x.id),[b]);
    });
  } finally {await db.close();}
});
