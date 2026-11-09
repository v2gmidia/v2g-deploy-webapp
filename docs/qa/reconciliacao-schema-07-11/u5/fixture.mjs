// Somente PostgreSQL embarcado: nenhum cliente Auth, segredo, banco ou dado remoto.
import {readFileSync} from 'node:fs';
import {fixture as baseFixture,qi,backend} from '../u4/fixture.mjs';
import {canonical} from '../u3-ordenacao-acl-08-11/canonical.mjs';
export {qi,backend,canonical};
export const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
export const measured=JSON.parse(read('metadados-qa.json'));
export const events=JSON.parse(read('eventos-qa.json'));
export const baseline=JSON.parse(read('baseline-u4.json'));
export const snapshot=async db=>(await db.query(read('snapshot.sql'))).rows[0]['?column?'];
const role=s=>s==='PUBLIC'?'public':qi(s);
export async function fixture(){
 const db=await baseFixture();
 try{
 await db.exec(read('../u4/u4-aplicar.sql'));
 await db.exec("insert into supabase_migrations.schema_migrations values('20261109000622','qa_reconciliacao_u4_revops_pedido_criativo_20261108');create role supabase_auth_admin bypassrls;create role dashboard_user;grant usage,create on schema auth to supabase_auth_admin;grant usage on schema auth to dashboard_user;");
 // Substituir somente o Auth stub LOCAL pelo contrato de catalogo medido.
 await db.exec('alter table public.profiles drop constraint profiles_id_fkey;drop table auth.users;drop table public.commercial_order_units;');
 const targets=['users','commercial_order_units','fiscal_documents','onboarding_meetings','manager_accounts','commercial_payment_events'];
 const tables=[...targets.map(n=>measured.snapshot.relations.find(r=>r.relname===n)),...events.relations];
 for(const p of tables){
  const q=qi(p.nspname)+'.'+qi(p.relname);
  await db.exec('create table '+q+'('+p.columns.map(c=>{
   const d=measured.snapshot.column_details.find(x=>x.schema===p.nspname&&x.table===p.relname&&x.column===c.name);
   return qi(c.name)+' '+c.type+(d?.generated?' generated always as ('+c.default+') stored':d?.identity?' generated always as identity':c.default?' default '+c.default:'')+(c.notnull?' not null':'');
  }).join(',')+');');
  for(const k of p.constraints??[])await db.exec('alter table '+q+' add constraint '+qi(k.name)+' '+k.def+';');
  for(const i of p.indexes??[])if(!p.constraints.some(k=>k.name===i.name))await db.exec(i.def+';');
  if(p.rls)await db.exec('alter table '+q+' enable row level security;');
  if(p.forced)await db.exec('alter table '+q+' force row level security;');
  for(const pol of p.policies??[])await db.exec('create policy '+qi(pol.name)+' on '+q+' for '+({r:'select',a:'insert',w:'update',d:'delete','*':'all'}[pol.cmd])+' to '+pol.roles.map(role).join(',')+(pol.using?' using('+pol.using+')':'')+(pol.check?' with check('+pol.check+')':'')+';');
  if(p.owner!=='postgres')await db.exec('alter table '+q+' owner to '+qi(p.owner)+';set role '+qi(p.owner)+';');
  await db.exec('revoke all on '+q+' from public,anon,authenticated,service_role,postgres,dashboard_user;');
  for(const a of p.table_acl??[])await db.exec('grant '+a.privilege+' on '+q+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  if(p.owner!=='postgres')await db.exec('reset role;');
 }
 await db.exec('alter table public.profiles add constraint profiles_id_fkey foreign key(id) references auth.users(id) on delete cascade;');
 for(const f of measured.definitions){
  // CREATE OR REPLACE e usado apenas no motor descartavel, nunca em preparacao remota.
  await db.exec(f.definition);
  const identity=qi(f.schema)+'.'+qi(f.name)+'('+f.identity+')';
  if(f.owner!=='postgres')await db.exec('alter function '+identity+' owner to '+qi(f.owner)+';set role '+qi(f.owner)+';');
  await db.exec('revoke all on function '+identity+' from public,anon,authenticated,service_role,dashboard_user;');
  const m=measured.snapshot.functions.find(x=>x.schema===f.schema&&x.name===f.name&&x.identity===f.identity);
  for(const a of m.acl??[])await db.exec('grant execute on function '+identity+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  if(f.owner!=='postgres')await db.exec('reset role;');
 }
 for(const p of tables)for(const t of p.triggers??[])await db.exec(t.def+';');
 for(const d of measured.snapshot.column_details.filter(d=>d.comment))await db.exec('comment on column '+qi(d.schema)+'.'+qi(d.table)+'.'+qi(d.column)+" is '"+d.comment.replaceAll("'","''")+"';");
 await db.exec('delete from supabase_migrations.schema_migrations;');
 for(const h of baseline.snapshot.ledger)await db.query('insert into supabase_migrations.schema_migrations values($1,$2)',[h.version,h.name]);
 return db;
 }catch(error){await db.close();throw error;}
}
