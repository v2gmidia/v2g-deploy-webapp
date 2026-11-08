
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
export const M=JSON.parse(read('manifesto.json'));
export const parents=JSON.parse(read('metadados-pais-qa.json'));
export const qi=s=>'"'+s.replaceAll('"','""')+'"';
export const backend=['clientes','execucoes','criativos','campanhas_meta','metricas_diarias','respostas_do_dono','execucoes_de_rotina','perguntas_apresentadas','campanhas_criacao'];
export const snapshotSql=read('snapshot.sql');
export const snapshot=async db=>(await db.query(snapshotSql)).rows[0].jsonb_build_object;
const role=s=>s==='PUBLIC'?'public':qi(s);
export async function fixture() {
 const {PGlite}=await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create role supabase_admin;create schema auth;create function auth.uid() returns uuid language sql as 'select null::uuid';create schema private;create schema vault;grant usage on schema vault to postgres,service_role,supabase_admin;create function vault._crypto_aead_det_noncegen() returns bytea language sql as 'select decode('''',''hex'')';create function private.owns_business(uuid) returns boolean language sql as 'select false';create table public.profiles(id uuid primary key);create table public.analysis_runs(id uuid primary key);create table public.offers(id uuid primary key);create schema supabase_migrations;create table supabase_migrations.schema_migrations(version text primary key,name text);insert into supabase_migrations.schema_migrations values ('fixture0','historico-ficticio');");
 for(const h of JSON.parse(read('metadados-handlers-qa.json'))) await db.exec(h.definition.replace('CREATE OR REPLACE FUNCTION','CREATE FUNCTION'));
 const order=['businesses','meta_connections','ad_accounts','campaigns','creatives','metrics_daily','secrets'];
 for(const name of order) {
  const p=parents.find(t=>t.relname===name),qualified=qi(p.nspname)+'.'+qi(name);
  await db.exec('create table '+qualified+' ('+p.columns.map(c=>qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')+');');
  for(const k of p.constraints??[])await db.exec('alter table '+qualified+' add constraint '+qi(k.name)+' '+k.def+';');
  for(const i of p.indexes??[])if(!(p.constraints??[]).some(c=>c.name===i.name))await db.exec(i.def+';');
  if(p.rls)await db.exec('alter table '+qualified+' enable row level security;');
  if(p.forced)await db.exec('alter table '+qualified+' force row level security;');
  for(const t of p.triggers??[])await db.exec(t.def+';');
  const cmds={r:'select',a:'insert',w:'update',d:'delete','*':'all'};
  for(const policy of p.policies??[])await db.exec('create policy '+qi(policy.name)+' on '+qualified+' as '+(policy.permissive?'permissive':'restrictive')+' for '+cmds[policy.cmd]+' to '+policy.roles.map(role).join(',')+(policy.using?' using ('+policy.using+')':'')+(policy.check?' with check ('+policy.check+')':'')+';');
  if(p.owner!=='postgres')await db.exec('alter table '+qualified+' owner to '+qi(p.owner)+';set role '+qi(p.owner)+';');
  await db.exec('revoke all on '+qualified+' from public,anon,authenticated,service_role;');
  for(const a of p.table_acl??[])if(a.role!==p.owner)await db.exec('grant '+a.privilege+' on '+qualified+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  for(const a of p.column_acl??[])await db.exec('grant '+a.privilege+'('+qi(a.column)+') on '+qualified+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  if(p.owner!=='postgres')await db.exec('reset role;');
 }
 await db.exec('create table public.commercial_order_units(id uuid primary key,business_id uuid references public.businesses(id),ad_account_id uuid, constraint commercial_order_units_ad_account_id_fkey foreign key(ad_account_id) references public.ad_accounts(id) on delete set null);');
 for(const n of backend)await db.exec('create table public.'+qi(n)+'(id int primary key);alter table public.'+qi(n)+' enable row level security;grant select on public.'+qi(n)+' to service_role;insert into public.'+qi(n)+' values(1);');
 await db.exec(read('../u1-aplicar.sql'));
 await db.exec("insert into supabase_migrations.schema_migrations values('20261108001903','qa_reconciliacao_u1_meta_reconexao_20261107');");
 for(let i=1;i<=43;i++)await db.query('insert into supabase_migrations.schema_migrations values($1,$2)',['fixture-historico-'+String(i).padStart(2,'0'),'historico-ficticio-'+i]);
 return db;
}
export function canonicalParents(rows) {
 return rows.map(t=>{const p=structuredClone(t);
 p.table_acl?.sort((a,b)=>(a.role+':'+a.privilege+':'+a.grantor).localeCompare(b.role+':'+b.privilege+':'+b.grantor,'en'));
 p.column_acl?.sort((a,b)=>(a.column+':'+a.role+':'+a.privilege).localeCompare(b.column+':'+b.role+':'+b.privilege,'en'));
 return p;});
}
