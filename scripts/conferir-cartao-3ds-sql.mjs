/** PostgreSQL isolado em memoria. Nao acessa Supabase, Asaas nem .env. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = process.env.V2G_PGLITE_MODULE
  ? await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href)
  : await import('@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table public.commercial_orders(id uuid primary key, origin text, payment_method text,
      billing_period text, status text, total_cents integer, provider_checkout_id text,
      provider_charge_id text, provider_customer_id text, provider_subscription_id text,
      provider_first_due_date date, payment_approved_at timestamptz, updated_at timestamptz);
    create table public.commercial_events(id uuid default gen_random_uuid(), order_id uuid,
      source text, external_event_id text, event_type text, unique(source,external_event_id));
    create table public.commercial_payment_events(provider_event_id text primary key, order_id uuid,
      provider_charge_id text,provider_subscription_id text,event_type text,amount_cents integer,due_date date);
  `);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261020021942_qa_cartao_mensal_3ds.sql', import.meta.url), 'utf8'));
  const id = '00000000-0000-4000-8000-000000000001';
  await db.query(`insert into commercial_orders(id,origin,payment_method,billing_period,status,total_cents,
    provider_charge_id,provider_customer_id,provider_first_due_date,provider_card_flow)
    values($1,'self_service','asaas_card','monthly','awaiting_payment',50000,'pay_fake','cus_fake','2099-01-31','initial_3ds')`, [id]);
  let checks = 0;
  async function evento(eventId, type, customer = 'cus_fake', value = 50000) {
    return (await db.query('select registrar_evento_inicial_3ds($1,$2,$3,$4,$5,$6,$7) as ok',
      [id,eventId,'pay_fake',customer,type,value,'2099-01-31'])).rows[0].ok;
  }
  const status = async () => (await db.query('select status from commercial_orders where id=$1', [id])).rows[0].status;
  assert.equal(await evento('evt_falha_cliente','PAYMENT_CONFIRMED','cus_outro'), false); checks++;
  assert.equal(await evento('evt_falha_valor','PAYMENT_CONFIRMED','cus_fake',49999), false); checks++;
  assert.equal(await evento('evt_criado','PAYMENT_CREATED'), true);
  assert.equal(await status(), 'awaiting_payment'); checks++;
  assert.equal(await evento('evt_confirmado','PAYMENT_CONFIRMED'), true);
  assert.equal(await status(), 'payment_approved'); checks++;
  assert.equal(await evento('evt_confirmado','PAYMENT_CONFIRMED'), true);
  assert.equal((await db.query('select count(*)::int as n from commercial_events')).rows[0].n, 1); checks++;
  assert.equal(await evento('evt_confirmado','PAYMENT_REFUNDED'), false); checks++;
  const reserve = due => db.query('select reservar_assinatura_apos_3ds($1,$2) as ok', [id,due]);
  assert.equal((await reserve('2099-01-31')).rows[0].ok, false); checks++;
  assert.equal((await reserve('2099-02-28')).rows[0].ok, true);
  assert.equal((await reserve('2099-02-28')).rows[0].ok, false); checks++;
  await db.query('update commercial_orders set subscription_creation_started_at=null where id=$1', [id]);
  assert.equal(await evento('evt_estorno','PAYMENT_REFUNDED'), true);
  assert.equal((await reserve('2099-02-28')).rows[0].ok, false); checks++;
  await db.query("update commercial_orders set status='awaiting_payment' where id=$1", [id]);
  assert.equal(await evento('evt_confirmacao_tardia','PAYMENT_CONFIRMED'), true);
  assert.equal(await status(), 'awaiting_payment'); checks++;
  for (const role of ['anon','authenticated']) {
    const grants = await db.query(`select
      has_function_privilege($1,'public.registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)','EXECUTE') as evento,
      has_function_privilege($1,'public.reservar_assinatura_apos_3ds(uuid,date)','EXECUTE') as reserva`, [role]);
    assert.equal(grants.rows[0].evento, false); assert.equal(grants.rows[0].reserva, false); checks++;
    const contexto = await db.query("select has_table_privilege($1,'public.checkout_3ds_context','SELECT') as ler, has_table_privilege($1,'public.checkout_3ds_context','INSERT') as inserir", [role]);
    assert.equal(contexto.rows[0].ler, false); assert.equal(contexto.rows[0].inserir, false); checks++;
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.checkout_3ds_context'::regclass")).rows[0].relrowsecurity, true); checks++;
  console.log(`PASS: ${checks} verificacoes PostgreSQL isoladas; confirmacao, identidade, valor, idempotencia, reserva, estorno, grants.`);
} finally { await db.close(); }
