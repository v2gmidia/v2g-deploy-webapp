import {readFileSync} from 'node:fs';
import {fixture as baseFixture,qi,backend} from '../u3-ordenacao-acl-08-11/fixture.mjs';
import {canonical} from '../u3-ordenacao-acl-08-11/canonical.mjs';
export {qi,backend,canonical};
export const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
export const M=JSON.parse(read('manifesto.json'));
export const baseline=JSON.parse(read('baseline-u3.json'));
export const parents=JSON.parse(read('pais-adicionais-qa.json')).relations;
export const snapshot=async db=>(await db.query(read('snapshot.sql'))).rows[0].jsonb_build_object;
export async function fixture(){
 const db=await baseFixture();
 await db.exec(read('../u3-ordenacao-acl-08-11/u3-aplicar.sql'));
 await db.exec("insert into supabase_migrations.schema_migrations values('20261108113154','qa_reconciliacao_u3_perfil_procedencia_20261108');create table auth.users(id uuid primary key);");
 for(const p of [...parents].sort((a,b)=>a.relname==='profiles'?-1:b.relname==='profiles'?1:0)){
  const q='public.'+qi(p.relname),existing=p.relname==='profiles';
  if(existing){for(const c of p.columns.filter(c=>c.name!=='id'))await db.exec('alter table '+q+' add column '+qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')+';');}
  else await db.exec('create table '+q+'('+p.columns.map(c=>qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')+');');
  for(const k of p.constraints??[])if(!(existing&&k.name==='profiles_pkey'))await db.exec('alter table '+q+' add constraint '+qi(k.name)+' '+k.def+';');
  for(const i of p.indexes??[])if(!p.constraints.some(k=>k.name===i.name))await db.exec(i.def+';');
  for(const t of p.triggers??[])await db.exec(t.def+';');
  if(p.rls)await db.exec('alter table '+q+' enable row level security;');
  if(p.forced)await db.exec('alter table '+q+' force row level security;');
  const cmds={r:'select',a:'insert',w:'update',d:'delete','*':'all'};
  for(const t of p.policies??[])await db.exec('create policy '+qi(t.name)+' on '+q+' as '+(t.permissive?'permissive':'restrictive')+' for '+cmds[t.cmd]+' to '+t.roles.map(qi).join(',')+(t.using?' using('+t.using+')':'')+(t.check?' with check('+t.check+')':'')+';');
  await db.exec('revoke all on '+q+' from public,anon,authenticated,service_role;');
  for(const a of p.table_acl??[])if(a.role!==p.owner)await db.exec('grant '+a.privilege+' on '+q+' to '+qi(a.role)+(a.grantable?' with grant option':'')+';');
 }
 // Somente no motor descartavel: reproduzir os 47 pares aprovados de metadados,
 // em vez de congelar historico ficticio como se fosse o QA. Nenhuma escrita remota.
 await db.exec('delete from supabase_migrations.schema_migrations;');
 for(const h of baseline.snapshot.ledger)await db.query('insert into supabase_migrations.schema_migrations values($1,$2)',[h.version,h.name]);
 return db;
}
