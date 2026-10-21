/** Restaura apenas o escopo vazio da fila QA em PGlite descartavel. Sem rede/segredos. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.env.V2G_PGLITE_MODULE ?? 'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const snapshot = JSON.parse(readFileSync(new URL('../../docs/qa/e28-21-10-fila-preflight.json', import.meta.url), 'utf8'));
assert.equal(snapshot.project_ref, 'zskpijnqgkqwxksqmzmf');
assert.equal(snapshot.row_count, 0);
assert.equal(snapshot.storage_count, 0);
assert.deepEqual(snapshot.triggers, []);
const db = new PGlite();
const ident = (s) => '"' + s.replaceAll('"','""') + '"';
try {
  await db.exec(`create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create table public.profiles(id uuid primary key);
    create table public.businesses(id uuid primary key,profile_id uuid references profiles);
    grant select on public.businesses to authenticated;`);
  await db.exec('create table public.creative_review_requests (' + snapshot.columns.map(c =>
    ident(c.name) + ' ' + c.type + (c.default ? ' default '+c.default : '') + (c.not_null ? ' not null' : '')).join(',') + ');');
  for (const c of snapshot.constraints) await db.exec('alter table public.creative_review_requests add constraint '+ident(c.name)+' '+c.sql);
  if(snapshot.rls) await db.exec('alter table public.creative_review_requests enable row level security');
  for(const p of snapshot.policies) await db.exec('create policy '+ident(p.policyname)+' on public.creative_review_requests as '+p.permissive+' for '+p.cmd+' to '+p.roles.map(ident).join(',')+(p.qual?' using ('+p.qual+')':'')+(p.with_check?' with check ('+p.with_check+')':''));
  for(const g of snapshot.grants) if(g.grantee!=='postgres') await db.exec('grant '+g.privilege+' on public.creative_review_requests to '+ident(g.grantee));
  // PGlite/Postgres 18 cataloga NOT NULL em pg_constraint; o QA Postgres 17 usa attnotnull.
  const restored=(await db.query("select conname as name,pg_get_constraintdef(oid) as sql from pg_constraint where conrelid='public.creative_review_requests'::regclass and contype <> 'n' order by conname")).rows;
  assert.deepEqual(restored,snapshot.constraints);
  const columns=(await db.query("select attname as name,format_type(atttypid,atttypmod) as type,attnotnull as not_null from pg_attribute where attrelid='public.creative_review_requests'::regclass and attnum>0 and not attisdropped order by attnum")).rows;
  assert.deepEqual(columns,snapshot.columns.map(({name,type,not_null})=>({name,type,not_null})));
  assert.equal((await db.query('select count(*)::int as n from public.creative_review_requests')).rows[0].n,0);
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.creative_review_requests'::regclass")).rows[0].relrowsecurity,true);
  assert.equal((await db.query("select has_table_privilege('authenticated','public.creative_review_requests','UPDATE') as ok")).rows[0].ok,false);
  await db.exec(readFileSync(new URL('../../supabase/migrations/20261021032617_creative_review_upload_intent.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("select count(*)::int as n from information_schema.columns where table_schema='public' and table_name='creative_review_requests' and column_name='upload_intent'")).rows[0].n,1);
  console.log('Snapshot QA vazio restaurado; constraints/RLS preservados; migration exata aplicada em memoria.');
} finally { await db.close(); }
