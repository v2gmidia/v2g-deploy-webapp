/** Migrations reais em Postgres efemero; nunca Supabase/Asaas/.env. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
const {PGlite}=process.env.V2G_PGLITE_MODULE ? await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href) : await import('@electric-sql/pglite');
const db=new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid';
    create table auth.users(id uuid primary key, raw_app_meta_data jsonb);
    create table profiles(id uuid primary key);
    create table businesses(id uuid primary key default gen_random_uuid(),name text,claim_email text,profile_id uuid);
    create table ad_accounts(id uuid primary key);
    create table leads_lp(id bigint primary key,cnpj text,email text,whatsapp text,vende_whatsapp boolean,
      pagina_origem text,utm_source text,utm_medium text,utm_campaign text,utm_content text,
      consentimento_em timestamptz,consentimento_texto text);`);
  for(const file of ['0026_contratacao_multiconta.sql','0029_pix_assistido.sql','0034_checkout_self_service.sql',
    '20261008223000_checkout_transparente_sandbox.sql','20261009015000_checkout_cartao_retentativa_qa.sql',
    '20261011140000_eventos_financeiros_sandbox.sql','20261013031434_qa_registrar_falha_desafio_3ds.sql',
    '20261018130000_ligar_lead_lp_pedido.sql','20261020021942_qa_cartao_mensal_3ds.sql','20261021042254_assisted_asaas_orders.sql'])
    await db.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  const operator=randomUUID(),other=randomUUID();
  for(const [id,metadata] of [[operator,{papel:'operador'}],[other,{}]]) {
    await db.query('insert into profiles values($1)',[id]);
    await db.query('insert into auth.users values($1,$2)',[id,JSON.stringify(metadata)]);
  }
  await db.exec(`insert into leads_lp values(73,'11222333000181','lead@example.invalid','11999990000',true,
    'https://www.v2gmidia.com.br/','ficticio','teste','ensaio','peca',now(),'Aceito o contato ficticio');`);
  const create=async({ref=randomUUID(),lead=null,email='direto@example.invalid',method='asaas_pix',period='annual_upfront',actor=operator}={})=>
    (await db.query('select registrar_pedido_asaas_assistido($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as id',
      [ref,lead,email,'11999990000','Pessoa Ficticia','Negocio ficticio','11222333000181',1,period,method,actor])).rows[0].id;
  const ref=randomUUID();
  const otherBusiness=randomUUID();
  await db.query('insert into businesses(id,name,claim_email,profile_id) values($1,$2,$3,$4)',
    [otherBusiness,'Outro negocio','direto@example.invalid',other]);
  const concurrent=await Promise.all([create({ref}),create({ref})]);
  assert.equal(concurrent[0],concurrent[1]);
  const direct=concurrent[0];
  const directRow=(await db.query('select * from commercial_orders where id=$1',[direct])).rows[0];
  assert.equal(directRow.origin,'assisted');assert.equal(directRow.source_lead_id,null);assert.equal(directRow.assisted_operator_id,operator);
  assert.notEqual(directRow.business_id,otherBusiness);
  assert.equal((await db.query('select profile_id from businesses where id=$1',[otherBusiness])).rows[0].profile_id,other);
  await assert.rejects(create({actor:other}),/pedido_assistido_invalido/);
  await assert.rejects(create({lead:73,email:'outro@example.invalid'}),/lead_divergente/);
  await assert.rejects(create({period:'monthly',method:'asaas_pix'}),/pedido_assistido_invalido/);
  const linked=await create({lead:73,email:'lead@example.invalid'});
  assert.equal(await create({lead:73,email:'lead@example.invalid'}),linked);
  assert.equal((await db.query('select source_lead_utm_campaign from commercial_orders where id=$1',[linked])).rows[0].source_lead_utm_campaign,'ensaio');
  assert.equal((await db.query("select count(*)::int as n from commercial_events where order_id=$1 and event_type='lead_convertido_em_pedido'",[linked])).rows[0].n,1);
  await db.query("update commercial_orders set provider_customer_id='cus_test',provider_charge_id='pay_test' where id=$1",[linked]);
  const approve=async({id=linked,charge='pay_test',customer='cus_test',value=528000,event='evt_confirmed'}={})=>
    (await db.query('select aprovar_pagamento_api_comercial($1,$2,null,$3,$4,$5,$6,$7) as ok',
      [id,charge,customer,event,'PAYMENT_CONFIRMED',value,'2099-01-01'])).rows[0].ok;
  assert.equal(await approve({value:1}),false);assert.equal(await approve({customer:'cus_other'}),false);
  assert.equal(await approve({charge:'pay_other'}),false);assert.equal(await approve({id:direct}),false);
  assert.equal(await approve(),true);assert.equal(await approve(),true);
  assert.equal((await db.query('select count(*)::int as n from commercial_payment_events where order_id=$1',[linked])).rows[0].n,1);
  const monthly=await create({email:'mensal@example.invalid',method:'asaas_card',period:'monthly'});
  await db.query("update commercial_orders set provider_card_flow='initial_3ds',provider_customer_id='cus_month',provider_charge_id='pay_month',provider_first_due_date='2099-01-31' where id=$1",[monthly]);
  const event3ds=async(id,event,customer='cus_month')=>(await db.query('select registrar_evento_inicial_3ds_comercial($1,$2,$3,$4,$5,50000,$6) as ok',
    [id,event,'pay_month',customer,'PAYMENT_CONFIRMED','2099-01-31'])).rows[0].ok;
  assert.equal(await event3ds(monthly,'evt_3ds_bad','cus_other'),false);
  assert.equal(await event3ds(monthly,'evt_3ds'),true);assert.equal(await event3ds(monthly,'evt_3ds'),true);
  const paid=(await db.query('select status,provider_subscription_id from commercial_orders where id=$1',[monthly])).rows[0];
  assert.equal(paid.status,'payment_approved');assert.equal(paid.provider_subscription_id,null);
  assert.equal((await db.query('select reservar_assinatura_apos_3ds($1,$2) as ok',[monthly,'2099-02-28'])).rows[0].ok,true);
  assert.equal((await db.query('select reservar_assinatura_apos_3ds($1,$2) as ok',[monthly,'2099-02-28'])).rows[0].ok,false);
  await db.query("update commercial_orders set provider_subscription_id='sub_month' where id=$1",[monthly]);
  const renewal=async(amount=50000)=>(await db.query('select registrar_evento_financeiro_comercial($1,$2,$3,$4,$5,$6,$7,$8) as ok',
    [monthly,'evt_renewal','pay_renewal','sub_month','cus_month','PAYMENT_CONFIRMED',amount,'2099-02-28'])).rows[0].ok;
  assert.equal(await renewal(),true);assert.equal(await renewal(),true);assert.equal(await renewal(49999),false);
  // Legado permanece direct_pix; variante comercial nunca o aprova.
  const legacy=(await db.query('select registrar_pedido_pix_assistido($1,$2,$3,$4,1,$5) as id',
    [randomUUID(),'legado@example.invalid','Legado ficticio','11222333000181','monthly'])).rows[0].id;
  assert.equal(await approve({id:legacy}),false);
  assert.equal((await db.query('select payment_method from commercial_orders where id=$1',[legacy])).rows[0].payment_method,'direct_pix');
  await db.exec("insert into leads_lp select 74,cnpj,'legadolead@example.invalid',whatsapp,vende_whatsapp,pagina_origem,utm_source,utm_medium,utm_campaign,utm_content,consentimento_em,consentimento_texto from leads_lp where id=73");
  const legacyLead=(await db.query('select registrar_pedido_pix_assistido_com_lead($1,74,$2,$3,$4,$5,1,$6,$7) as id',
    [randomUUID(),'legadolead@example.invalid','11999990000','Legado LP','11222333000181','monthly',operator])).rows[0].id;
  await assert.rejects(create({lead:74,email:'legadolead@example.invalid'}),/pedido_existente_divergente/);
  assert.equal((await db.query('select payment_method from commercial_orders where id=$1',[legacyLead])).rows[0].payment_method,'direct_pix');
  await db.query("update commercial_orders set provider_customer_id='cus_direct',provider_charge_id='pay_direct' where id=$1",[direct]);
  assert.equal((await db.query("select registrar_evento_financeiro_comercial($1,'evt_refund','pay_direct',null,'cus_direct','PAYMENT_REFUNDED',528000,'2099-01-01') as ok",[direct])).rows[0].ok,true);
  assert.equal(await approve({id:direct,charge:'pay_direct',customer:'cus_direct',event:'evt_late'}),false);
  assert.equal((await db.query('select status from commercial_orders where id=$1',[direct])).rows[0].status,'awaiting_payment');
  for(const role of ['anon','authenticated']) {
    for(const signature of ['registrar_pedido_asaas_assistido(text,bigint,text,text,text,text,text,integer,text,text,uuid)',
      'aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date)','registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date)'])
      assert.equal((await db.query('select has_function_privilege($1,$2,$3) as ok',[role,signature,'EXECUTE'])).rows[0].ok,false);
  }
  console.log('PASS: migrations reais, assistido com/sem lead, operador, replay, origem, valor/cliente/cobranca, 3DS pago sem assinatura, reserva unica e legado.');
}finally{await db.close();}
