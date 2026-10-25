/** Postgres descartavel, migrations reais; nenhuma rede, .env ou conta externa. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
const { PGlite } = process.env.V2G_PGLITE_MODULE
  ? await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href) : await import('@electric-sql/pglite');
const db = new PGlite();
const sql = name => readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
const scalar = async (query, args = []) => (await db.query(query, args)).rows[0].ok;
const migration = sql('20261022152629_asaas_estados_processamento.sql');
const intermediarios = ['PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED'];
const adversos = ['PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED','PAYMENT_REFUNDED'];
let conferencias = 0;
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
  for (const file of ['0026_contratacao_multiconta.sql','0029_pix_assistido.sql','0034_checkout_self_service.sql',
    '20261008223000_checkout_transparente_sandbox.sql','20261009015000_checkout_cartao_retentativa_qa.sql',
    '20261011140000_eventos_financeiros_sandbox.sql','20261013031434_qa_registrar_falha_desafio_3ds.sql',
    '20261018130000_ligar_lead_lp_pedido.sql','20261020021942_qa_cartao_mensal_3ds.sql','20261021042254_assisted_asaas_orders.sql'])
    await db.exec(sql(file));

  // Desvio conhecido deve abortar inclusive helper/constraint, sem instalacao parcial.
  const sig = 'public.reservar_assinatura_apos_3ds(uuid,date)';
  const original = await scalar('select pg_get_functiondef($1::regprocedure) as ok',[sig]);
  await db.exec(original.replace("e.event_type = 'PAYMENT_CONFIRMED'", "e.event_type = 'VERSAO_DIVERGENTE'"));
  await assert.rejects(db.exec(migration), /reserva divergente/);
  await db.exec('rollback');
  assert.equal(await scalar("select to_regprocedure('public.evento_asaas_impede_confirmacao(text)') is null as ok"), true);
  assert.equal((await scalar("select pg_get_constraintdef(oid) as ok from pg_constraint where conname='commercial_payment_events_event_type_check'"))
    .includes('PAYMENT_AUTHORIZED'), false);
  await db.exec(original);
  await db.exec(migration);
  conferencias++;

  const operator = randomUUID();
  await db.query('insert into profiles values($1)',[operator]);
  const create = async (assisted, initial = true) => {
    const ref = randomUUID(), email = ref + '@example.invalid';
    const args = [ref,email,'Pessoa Ficticia','11999990000','Negocio ficticio','11222333000181',1,
      initial ? 'monthly' : 'annual_upfront','asaas_card'];
    const id = assisted
      ? await scalar('select registrar_pedido_asaas_assistido($1,null,$2,$4,$3,$5,$6,$7,$8,$9,$10) as ok',[...args,operator])
      : await scalar('select registrar_pedido_self_service($1,$2,$3,$4,$5,$6,$7,$8,$9) as ok',args);
    const charge = 'pay_' + ref.replaceAll('-',''), customer = 'cus_' + ref.replaceAll('-','');
    await db.query(`update commercial_orders set provider_card_flow=$2,provider_charge_id=$3,
      provider_customer_id=$4,provider_first_due_date='2099-01-31' where id=$1`,
      [id,initial ? 'initial_3ds' : 'direct',charge,customer]);
    return { id,charge,customer,assisted,initial,amount:initial ? 50000 : 528000 };
  };
  const status = o => scalar('select status as ok from commercial_orders where id=$1',[o.id]);
  const register = (o,type,event='evt_'+randomUUID(),extra={}) => {
    const charge=extra.charge ?? o.charge, sub=extra.sub ?? null, due=extra.due ?? '2099-01-31';
    if (o.initial && !sub) return scalar(`select ${o.assisted ? 'registrar_evento_inicial_3ds_comercial' : 'registrar_evento_inicial_3ds'}($1,$2,$3,$4,$5,$6,$7) as ok`,
      [o.id,event,charge,o.customer,type,o.amount,due]);
    return scalar(`select ${o.assisted ? 'registrar_evento_financeiro_comercial' : 'registrar_evento_financeiro_asaas'}($1,$2,$3,$4,$5,$6,$7,$8) as ok`,
      [o.id,event,charge,sub,o.customer,type,o.amount,due]);
  };
  const approve = (o,type,event='evt_'+randomUUID()) => scalar(`select ${o.assisted ? 'aprovar_pagamento_api_comercial' : 'aprovar_pagamento_api_self_service'}($1,$2,null,$3,$4,$5,$6,$7) as ok`,
    [o.id,o.charge,o.customer,event,type,o.amount,'2099-01-31']);

  for (const assisted of [false,true]) for (const initial of [false,true]) {
    for (const paid of ['PAYMENT_CONFIRMED','PAYMENT_RECEIVED']) {
      const o = await create(assisted,initial);
      for (const type of intermediarios) {
        const event = 'evt_'+randomUUID();
        assert.equal(await register(o,type,event),true);
        assert.equal(await register(o,type,event),true);
        assert.equal(await register(o,'PAYMENT_AUTHORIZED',event),type === 'PAYMENT_AUTHORIZED');
        assert.equal(await status(o),'awaiting_payment');
      }
      assert.equal(await (initial ? register(o,paid) : approve(o,paid)),true);
      assert.equal(await status(o),'payment_approved');
      assert.equal(await scalar('select event_type as ok from commercial_events where order_id=$1 and source=$2',[o.id,'asaas']),paid);
      assert.equal(await (initial ? register(o,'PAYMENT_CONFIRMED') : approve(o,'PAYMENT_CONFIRMED')),true);
      assert.equal(await scalar('select count(*)::int as ok from commercial_events where order_id=$1 and source=$2',[o.id,'asaas']),1);
      // Intermediario atrasado conserva fato pago sem revogar nem reaprovar.
      assert.equal(await register(o,'PAYMENT_AWAITING_RISK_ANALYSIS'),true);
      assert.equal(await status(o),'payment_approved');
      if (initial) {
        assert.equal(await scalar('select reservar_assinatura_apos_3ds($1,$2) as ok',[o.id,'2099-02-28']),true);
        assert.equal(await scalar('select reservar_assinatura_apos_3ds($1,$2) as ok',[o.id,'2099-02-28']),false);
        assert.equal(await scalar('select provider_subscription_id as ok from commercial_orders where id=$1',[o.id]),null);
        const sub='sub_'+randomUUID().replaceAll('-','');
        await db.query('update commercial_orders set provider_subscription_id=$2 where id=$1',[o.id,sub]);
        const extra={ sub,charge:'pay_'+randomUUID().replaceAll('-',''),due:'2099-02-28' };
        for (const type of [...intermediarios,'PAYMENT_REPROVED_BY_RISK_ANALYSIS',paid]) {
          const event='evt_'+randomUUID();
          assert.equal(await register(o,type,event,extra),true);
          assert.equal(await register(o,type,event,extra),true);
        }
        assert.equal(await status(o),'payment_approved'); // Sem nova politica de suspensao.
        assert.equal(await scalar('select count(*)::int as ok from commercial_orders where id=$1',[o.id]),1);
      }
      conferencias++;
    }
    for (const adverse of adversos) {
      const o=await create(assisted,initial);
      assert.equal(await register(o,adverse),true);
      await (initial ? register(o,'PAYMENT_CONFIRMED') : approve(o,'PAYMENT_CONFIRMED'));
      assert.equal(await status(o),'awaiting_payment');
      assert.equal(await scalar('select reservar_assinatura_apos_3ds($1,$2) as ok',[o.id,'2099-02-28']),false);
      conferencias++;
    }
  }
  for (const type of intermediarios) assert.equal(await scalar('select evento_asaas_impede_confirmacao($1) as ok',[type]),false);
  for (const type of [...adversos,null,'EVENTO_DESCONHECIDO']) assert.equal(await scalar('select evento_asaas_impede_confirmacao($1) as ok',[type]),true);
  for (const role of ['anon','authenticated','service_role']) {
    for (const signature of ['evento_asaas_impede_confirmacao(text)',
      'registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
      'registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date)',
      'registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)',
      'registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date)',
      'aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date)',
      'aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)',
      'reservar_assinatura_apos_3ds(uuid,date)']) {
      assert.equal(await scalar('select has_function_privilege($1,$2,$3) as ok',[role,signature,'EXECUTE']),role==='service_role');
    }
  }
  console.log(`PASS: ${conferencias} cenarios SQL, cadeia real, quatro RPCs, ordem/replay, RECEIVED, reserva unica, renovacao, ACL e rollback por divergencia. LOCAL, nao QA.`);
} finally { await db.close(); }
