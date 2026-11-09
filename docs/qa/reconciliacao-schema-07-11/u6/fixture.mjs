import {readFileSync} from 'node:fs';
import {fixture as baseFixture,qi,backend,canonical} from '../u5/fixture.mjs';
export {qi,backend,canonical};
export const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
export const baseline=JSON.parse(read('baseline-u5.json')),measured=JSON.parse(read('metadados-qa.json'));
export const snapshot=async db=>(await db.query(read('snapshot.sql'))).rows[0]['?column?'];
const role=s=>s==='PUBLIC'?'public':qi(s);
export async function fixture(){
 const db=await baseFixture();
 try{
  await db.exec(read('../u5/u5-aplicar.sql'));
  await db.exec("insert into supabase_migrations.schema_migrations values('20261109012806','qa_reconciliacao_u5_documentos_acesso_historico_20261108');");
  for(const p of measured.snapshot.relations.filter(r=>['checkout_3ds_context','checkout_security_attempts','commercial_payment_email_outbox'].includes(r.relname))){
   const q='public.'+qi(p.relname);
   await db.exec('create table '+q+'('+p.columns.map(c=>qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')+');');
   for(const c of p.constraints??[])await db.exec('alter table '+q+' add constraint '+qi(c.name)+' '+c.def+';');
   for(const i of p.indexes??[])if(!p.constraints.some(c=>c.name===i.name))await db.exec(i.def+';');
   if(p.rls)await db.exec('alter table '+q+' enable row level security;');
   if(p.forced)await db.exec('alter table '+q+' force row level security;');
   for(const pol of p.policies??[])await db.exec('create policy '+qi(pol.name)+' on '+q+' for '+({r:'select',a:'insert',w:'update',d:'delete','*':'all'}[pol.cmd])+' to '+pol.roles.map(role).join(',')+(pol.using?' using('+pol.using+')':'')+(pol.check?' with check('+pol.check+')':'')+';');
   await db.exec('revoke all on '+q+' from public,anon,authenticated,service_role;');
   for(const a of p.table_acl??[])if(a.role!==p.owner)await db.exec('grant '+a.privilege+' on '+q+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
   for(const a of p.column_acl??[])await db.exec('grant '+a.privilege+'('+qi(a.column)+') on '+q+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  }
  for(const f of measured.definitions){
   await db.exec(f.definition);
   const sig='public.'+qi(f.name)+'('+f.identity+')';await db.exec('revoke all on function '+sig+' from public,anon,authenticated,service_role;');
   for(const a of measured.snapshot.functions.find(x=>x.name===f.name&&x.schema===f.schema&&x.identity===f.identity)?.acl??[])await db.exec('grant execute on function '+sig+' to '+role(a.role)+(a.grantable?' with grant option':'')+';');
  }
  for(const p of measured.snapshot.relations.filter(r=>['checkout_3ds_context','checkout_security_attempts','commercial_payment_email_outbox'].includes(r.relname)))for(const t of p.triggers??[])await db.exec(t.def+';');
  await db.exec('delete from supabase_migrations.schema_migrations;');for(const h of baseline.snapshot.ledger)await db.query('insert into supabase_migrations.schema_migrations values($1,$2)',[h.version,h.name]);
  return db;
 }catch(error){await db.close();throw error;}
}
