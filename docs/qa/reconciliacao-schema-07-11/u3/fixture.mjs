// Exclusivamente local. Auth/Vault e historico sinteticos nao comprovam integracao remota.
import {readFileSync} from 'node:fs';
import {fixture as fixtureU2,read as readU2,qi,backend,canonicalParents} from '../u2/fixture.mjs';
export {qi,backend,canonicalParents};
export const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
export const M=JSON.parse(read('manifesto.json'));
export const deps=JSON.parse(read('dependencias-qa.json'));
export const baseline=JSON.parse(read('baseline-u2.json'));
export const snapshot=async db=>(await db.query(read('snapshot.sql'))).rows[0].jsonb_build_object;
export async function fixture(){
 const db=await fixtureU2();
 await db.exec(readU2('u2-aplicar.sql'));
 await db.exec("insert into supabase_migrations.schema_migrations values('20261108005549','qa_reconciliacao_u2_operacional_meta_20261107');");
 // Substituicao APENAS dos stubs da bancada por dependencias medidas no QA.
 await db.exec("create or replace function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.fixture_uid',true),'')::uuid$$;grant usage on schema private,auth to authenticated,service_role;");
 for(const f of deps.functions){
  await db.exec(f.name==='owns_business'?f.definition:f.definition.replace('CREATE OR REPLACE FUNCTION','CREATE FUNCTION'));
  const identity=f.schema+'.'+f.name+(f.name==='owns_business'?'(uuid)':f.name==='set_atualizado_em'?'()':f.name==='procedencia_do_campo'?'(text,uuid,text)':'(text,uuid,text,text,text,jsonb)');
  await db.exec('revoke all on function '+identity+' from public,anon,authenticated,service_role;');
  if(f.name==='set_atualizado_em')await db.exec('grant execute on function '+identity+' to public,anon,authenticated,service_role;');
  else await db.exec('grant execute on function '+identity+' to service_role'+(f.name==='owns_business'?',authenticated':'')+';');
 }
 for(const p of deps.relations){
  const q='public.'+qi(p.relname);
  await db.exec('create table '+q+'('+p.columns.map(c=>qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')+');');
  for(const k of p.constraints??[])await db.exec('alter table '+q+' add constraint '+qi(k.name)+' '+k.def+';');
  for(const i of p.indexes??[])if(!p.constraints.some(k=>k.name===i.name))await db.exec(i.def+';');
  for(const t of p.triggers??[])await db.exec(t.def+';');
  if(p.rls)await db.exec('alter table '+q+' enable row level security;');
  if(p.forced)await db.exec('alter table '+q+' force row level security;');
  const cmds={r:'select',a:'insert',w:'update',d:'delete','*':'all'};
  for(const t of p.policies??[])await db.exec('create policy '+qi(t.name)+' on '+q+' as '+(t.permissive?'permissive':'restrictive')+' for '+cmds[t.cmd]+' to '+t.roles.map(qi).join(',')+(t.using?' using('+t.using+')':'')+(t.check?' with check('+t.check+')':'')+';');
  await db.exec('revoke all on '+q+' from public,anon,authenticated,service_role;');
  for(const a of p.table_acl??[])if(a.role!==p.owner)await db.exec('grant '+a.privilege+' on '+q+' to '+qi(a.role)+(a.grantable?' with grant option':'')+';');
 }
 return db;
}
