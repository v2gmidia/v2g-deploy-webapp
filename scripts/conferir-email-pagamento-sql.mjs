/** PostgreSQL isolado; nao acessa Supabase, Asaas, e-mail ou .env. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = process.env.V2G_PGLITE_MODULE
  ? await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href)
  : await import('@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role; alter default privileges in schema public grant all on tables to service_role; create table public.commercial_orders(id uuid primary key);');
  await db.exec(readFileSync(new URL('../supabase/migrations/20261021033313_commercial_payment_email_outbox.sql', import.meta.url), 'utf8'));
  const order = '00000000-0000-4000-8000-000000000001';
  await db.query('insert into commercial_orders values($1)', [order]);
  const insert = (charge, payload = {}, status = 'queued') => db.query(
    'insert into commercial_payment_email_outbox(order_id,provider_charge_id,payload,status) values($1,$2,$3,$4) returning id',
    [order, charge, JSON.stringify(payload), status]);
  const id = (await insert('pay_test')).rows[0].id;
  await assert.rejects(insert('pay_test'), /unique/i);
  await assert.rejects(insert('invalid'), /check/i);
  await assert.rejects(insert('pay_array', []), /check/i);
  await assert.rejects(insert('pay_accepted', {}, 'accepted'), /check/i);
  const reserve = () => db.query("update commercial_payment_email_outbox set status='sending' where id=$1 and status='queued' returning id", [id]);
  const attempts = await Promise.all([reserve(), reserve()]);
  assert.equal(attempts.reduce((n, r) => n + r.rows.length, 0), 1);
  await db.query("update commercial_payment_email_outbox set status='accepted',provider_message_id='email_test' where id=$1", [id]);
  assert.equal((await reserve()).rows.length, 0);
  for (const role of ['anon', 'authenticated']) {
    for (const permission of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      assert.equal((await db.query("select has_table_privilege($1,'public.commercial_payment_email_outbox',$2) as ok", [role, permission])).rows[0].ok, false);
    }
  }
  assert.equal((await db.query("select has_table_privilege('service_role','public.commercial_payment_email_outbox','UPDATE') as ok")).rows[0].ok, true);
  assert.equal((await db.query("select has_table_privilege('service_role','public.commercial_payment_email_outbox','DELETE') as ok")).rows[0].ok, false);
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.commercial_payment_email_outbox'::regclass")).rows[0].relrowsecurity, true);
  await db.exec(`create table profiles(id uuid primary key);
    create table commercial_events(order_id uuid,source text,external_event_id text unique,event_type text,actor_profile_id uuid);
    create table commercial_payment_events(order_id uuid,provider_charge_id text,event_type text);
    alter table commercial_orders add column status text default 'payment_approved';`);
  await db.query('insert into profiles values($1)', [order]);
  await db.query("update commercial_payment_email_outbox set status='review',provider_message_id=null where id=$1", [id]);
  const updated = (await db.query('select updated_at::text as value from commercial_payment_email_outbox where id=$1', [id])).rows[0].value;
  const parameters = { email_id:id, order_id:order, charge_id:'pay_test', expected_updated_at:updated,
    provider_id:'email_confirmado', actor_id:order, audit_ref:'00000000-0000-4000-8000-000000000002' };
  const template = readFileSync(new URL('./sql/conciliar-email-aceito-modelo.sql', import.meta.url), 'utf8');
  const sql = template.replace(/:'([a-z_]+)'/g, (_, key) => `'${parameters[key].replaceAll("'", "''")}'`);
  await db.exec(readFileSync(new URL('./sql/diagnosticar-email-pagamento.sql', import.meta.url), 'utf8'));
  await db.exec(sql);
  assert.equal((await db.query('select status from commercial_payment_email_outbox where id=$1', [id])).rows[0].status, 'review');
  assert.equal((await db.query('select count(*)::int as n from commercial_events')).rows[0].n, 0);
  // Somente nesta base efemera: verifica a compensacao que exigira autorizacao real.
  await db.exec(sql.replace(/rollback;\s*$/i, 'commit;'));
  assert.equal((await db.query('select status from commercial_payment_email_outbox where id=$1', [id])).rows[0].status, 'accepted');
  assert.equal((await db.query('select count(*)::int as n from commercial_events')).rows[0].n, 1);
  await assert.rejects(db.exec(sql), /alvo_divergente/);
  await db.exec('rollback;');
  console.log('PASS: PostgreSQL isolado; unicidade, payload, aceite, reserva exclusiva, replay, grants e RLS.');
  console.log('PASS: diagnostico sem payload; conciliacao com rollback padrao, aceite auditado e replay bloqueado.');
} finally { await db.close(); }
