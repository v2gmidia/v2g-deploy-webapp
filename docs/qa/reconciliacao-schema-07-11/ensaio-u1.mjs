/** Ensaio offline: nenhum fetch, .env, QA, Auth, Vault ou RPC de negocio.
 * PostgreSQL PGlite descartavel; policies/triggers auxiliares sao stubs de fixture,
 * nao uma reproducao funcional do backend. O SQL da unidade e executado sem substituicoes.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {conferirRecibos,APPLY_NAME,RETURN_NAME} from './comparar-recibos.mjs';
const {PGlite}=await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const apply=read('u1-aplicar.sql'),undo=read('u1-retornar.sql'),verify=read('u1-verificar.sql'),snapshot=read('snapshot-protegido.sql');
const defs=JSON.parse(read('fixture-metadados-pais.json'));
const backend=['clientes','execucoes','criativos','campanhas_meta','metricas_diarias','respostas_do_dono','execucoes_de_rotina','perguntas_apresentadas','campanhas_criacao'];
const qi=s=>'"'+s.replaceAll('"','""')+'"';
async function fixture() {
 const db=new PGlite();
 await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema private;
  create function private.owns_business(uuid) returns boolean language sql as 'select false';
  create function public.set_updated_at() returns trigger language plpgsql as 'begin return new; end';
  create function public.impedir_troca_pagina_compartilhada() returns trigger language plpgsql as 'begin return new; end';
  create table public.businesses(id uuid primary key);
  create schema supabase_migrations;
  create table supabase_migrations.schema_migrations(version text primary key,name text);
  insert into supabase_migrations.schema_migrations values ('fixture','historico-ficticio');
 `);
 // Todas as definicoes de estrutura abaixo sao metadados; nenhuma linha veio do QA.
 for (const name of ['meta_connections','ad_accounts']) {
  const d=defs.find(x=>x.relname===name);
  await db.exec('create table public.'+qi(name)+' ('+d.columns.map(c=>qi(c.name)+' '+c.type+(c.notnull?' not null':'')).join(',')+');');
  for(const c of d.constraints) await db.exec('alter table public.'+qi(name)+' add constraint '+qi(c.name)+' '+c.def+';');
  await db.exec('alter table public.'+qi(name)+' enable row level security; grant select,update on public.'+qi(name)+' to service_role;');
  for(const t of d.triggers) await db.exec(t.def+';');
  const commands={r:'select',a:'insert',w:'update',d:'delete'};
  for(const p of d.policies) await db.exec('create policy '+qi(p.name)+' on public.'+qi(name)+' for '+commands[p.cmd]+' to '+p.roles.map(qi).join(',')+(p.using?' using ('+p.using+')':'')+(p.check?' with check ('+p.check+')':'')+';');
 }
 for(const name of backend) await db.exec('create table public.'+qi(name)+'(id int primary key); alter table public.'+qi(name)+' enable row level security; grant select on public.'+qi(name)+' to service_role; insert into public.'+qi(name)+' values (1);');
 await db.exec(`
 insert into public.businesses values ('11111111-1111-4111-8111-111111111111');
 insert into public.meta_connections(id,business_id,status,created_at,updated_at,last_error)
 values ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','connected',now(),now(),'fixture-preservada');
 insert into public.ad_accounts(id,business_id,external_id,is_active,created_at,updated_at,ownership,status)
 values ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','fixture',true,now(),now(),'cliente','ok');
 `);
 return db;
}
const snap=async db=>(await db.query(snapshot)).rows[0].jsonb_build_object;
const absent=async db=>(await db.query("select to_regprocedure('public.marcar_conexao_meta_quebrada(uuid,text,text)') is null as absent")).rows[0].absent;
const reject=async(db,sql,re)=>{await assert.rejects(db.exec(sql),re);await db.exec('rollback;');};
test('U1: SQL exato aplica, ACL minima, verificacao readonly e retorno preservam catalogo/linhas ficticias',async()=>{
 const db=await fixture();try{
  const before=await snap(db);
  const pre=(await db.exec(read('u1-preflight.sql')))[0].rows[0].receipt;
  assert.equal(pre.target_overload_count,0);assert.deepEqual(pre.target_overloads,[]);
  assert.equal(pre.target_function,null);
  assert.deepEqual(pre.protected_snapshot,before);
  await db.exec(apply); await db.exec(verify);
  const post=(await db.exec(read('u1-pos.sql')))[0].rows[0].receipt;
  assert.equal(post.target_overload_count,1);
  assert.equal(post.target_overloads[0].schema,'public');
  assert.equal(post.target_function.owner,'postgres');
  assert.deepEqual(post.protected_snapshot,before);
  assert.equal(await absent(db),false);
  assert.deepEqual(await snap(db),before);
  const acl=(await db.query("select has_function_privilege('anon','public.marcar_conexao_meta_quebrada(uuid,text,text)','EXECUTE') a,has_function_privilege('authenticated','public.marcar_conexao_meta_quebrada(uuid,text,text)','EXECUTE') b,has_function_privilege('service_role','public.marcar_conexao_meta_quebrada(uuid,text,text)','EXECUTE') c")).rows[0];
  assert.deepEqual(acl,{a:false,b:false,c:true});
  await db.exec(undo);assert.equal(await absent(db),true);assert.deepEqual(await snap(db),before);
  assert.equal((await db.query('select last_error from public.meta_connections')).rows[0].last_error,'fixture-preservada');
  assert.equal((await db.query('select status from public.ad_accounts')).rows[0].status,'ok');
  for(const name of backend) assert.equal((await db.query('select count(*)::int as n from public.'+qi(name))).rows[0].n,1);
 }finally{await db.close();}
});
test('U1: definicao divergente dos pais aborta sem criar funcao',async()=>{
 const db=await fixture();try{await db.exec('alter table public.ad_accounts drop constraint ad_accounts_status_check;');
 await reject(db,apply,/fingerprint da tabela-pai divergente/);assert.equal(await absent(db),true);}finally{await db.close();}
});
test('U1: recibo PRE lista overloads divergentes em public e private sem perder captura',async()=>{
 const db=await fixture();try{
  await db.exec("create function private.marcar_conexao_meta_quebrada(text) returns void language plpgsql as 'begin return; end'; create function public.marcar_conexao_meta_quebrada(integer) returns void language plpgsql as 'begin return; end';");
  const pre=(await db.exec(read('u1-preflight.sql')))[0].rows[0].receipt;
  assert.equal(pre.target_overload_count,2);
  assert.deepEqual(pre.target_overloads.map(x=>x.schema),['private','public']);
  assert.equal(pre.target_function,null);
  await reject(db,apply,/funcao ja existe/);
 }finally{await db.close();}
});
test('U1: objeto preexistente/prod-like ou commit ja feito nao e sobrescrito nem repetido',async()=>{
 const db=await fixture();try{await db.exec(apply);await reject(db,apply,/funcao ja existe/);await db.exec(verify);}finally{await db.close();}
});
test('U1: ACL backend divergente bloqueia antes do delta',async()=>{
 const db=await fixture();try{await db.exec('grant update on public.execucoes to service_role;');await reject(db,apply,/protecao backend divergente/);assert.equal(await absent(db),true);}finally{await db.close();}
});
test('U1: mudanca fora do delta entre snapshots causa rollback integral',async()=>{
 const db=await fixture();try{const injected=apply.replace('after_state:=','grant update on public.execucoes to service_role;\n after_state:=');
 await reject(db,injected,/mudou catalogo protegido/);assert.equal(await absent(db),true);
 assert.equal((await db.query("select has_table_privilege('service_role','public.execucoes','UPDATE') as allowed")).rows[0].allowed,false);}finally{await db.close();}
});
test('U1: retorno recusa corpo adulterado, sem apagar funcao divergente',async()=>{
 const db=await fixture();try{await db.exec(apply);await db.exec("alter function public.marcar_conexao_meta_quebrada(uuid,text,text) owner to service_role;");
 await reject(db,undo,/funcao\/owner\/corpo\/ACL divergente/);assert.equal(await absent(db),false);}finally{await db.close();}
});
test('U1: retorno RESTRICT preserva dependencia posterior, sem CASCADE',async()=>{
 const db=await fixture();try{await db.exec(apply);
 await db.exec("create view public.fixture_dependencia as select 1 as id where public.marcar_conexao_meta_quebrada(null,'expired','fixture') is null;");
 await reject(db,undo,/depend|cannot drop/);assert.equal(await absent(db),false);
 assert.ok((await db.query("select to_regclass('public.fixture_dependencia') as v")).rows[0].v);}finally{await db.close();}
});
test('U1: papel executor inesperado e recusado',async()=>{
 const db=await fixture();try{await db.exec('set role authenticated;');await reject(db,apply,/papel executor inesperado/);await db.exec('reset role;');assert.equal(await absent(db),true);}finally{await db.close();}
});
test('U1: default EXECUTE inesperado para terceiro aborta sem mudar default nem deixar funcao',async()=>{
 const db=await fixture();try{
  await db.exec('create role terceiro_fixture; alter default privileges for role postgres grant execute on functions to terceiro_fixture;');
  const before=await snap(db);
  await reject(db,apply,/funcao\/owner\/corpo\/ACL divergente/);
  assert.equal(await absent(db),true);assert.deepEqual(await snap(db),before);
 }finally{await db.close();}
});
test('U1: grant option ao servico e atributo STRICT adulterado bloqueiam retorno',async()=>{
 const db=await fixture();try{await db.exec(apply);
  await db.exec('grant execute on function public.marcar_conexao_meta_quebrada(uuid,text,text) to service_role with grant option;');
  await reject(db,undo,/funcao\/owner\/corpo\/ACL divergente/);
  await db.exec('revoke grant option for execute on function public.marcar_conexao_meta_quebrada(uuid,text,text) from service_role; alter function public.marcar_conexao_meta_quebrada(uuid,text,text) strict;');
  await reject(db,undo,/funcao\/owner\/corpo\/ACL divergente/);assert.equal(await absent(db),false);
 }finally{await db.close();}
});
const receipt=async db=>(await db.exec(read('u1-pos.sql')))[0].rows[0].receipt;
// Modelo LOCAL do endpoint: transacao externa + registro gerido pelo chamador.
// Nao e implementacao comprovada da API remota. Ensaiar ambas as ordens de ledger.
async function managed(db,sql,name,version,order='after') {
 assert.doesNotMatch(sql,/^\s*(begin|commit)\s*;/mi,'payload nao pode controlar transacao externa');
 await db.transaction(async tx=>{
  const record=()=>tx.query('insert into supabase_migrations.schema_migrations(version,name) values ($1,$2)',[version,name]);
  if(order==='before')await record();
  await tx.exec(sql);
  if(order==='after')await record();
 });
}
for(const order of ['before','after']) test('U1: modelo gerido '+order+' preserva historico e acrescenta apply/retorno',async()=>{
 const db=await fixture();try{
  const pre=await receipt(db);
  await managed(db,apply,APPLY_NAME,'fixture-u1-apply',order);
  await db.exec(verify);const post=await receipt(db);
  assert.equal(conferirRecibos(pre,post).ok,true);
  await managed(db,undo,RETURN_NAME,'fixture-u1-return',order);
  const returned=await receipt(db);assert.equal(conferirRecibos(post,returned,'return').ok,true);
  assert.equal(returned.protected_snapshot.ledger_metadata.length,3);
 }finally{await db.close();}
});
test('U1: falha no payload gerido reverte tambem registro antecipado na fixture',async()=>{
 const db=await fixture();try{
  await db.exec('create role terceiro_fixture; alter default privileges for role postgres grant execute on functions to terceiro_fixture;');
  const pre=await receipt(db);
  await assert.rejects(managed(db,apply,APPLY_NAME,'fixture-u1-failed','before'),/funcao\/owner\/corpo\/ACL divergente/);
  assert.deepEqual(await receipt(db),pre);
 }finally{await db.close();}
});
test('U1: recibo detecta historico alterado e resultado incerto; nao admite retry cego',async()=>{
 const db=await fixture();try{
  const pre=await receipt(db);await managed(db,apply,APPLY_NAME,'fixture-u1-apply');const post=await receipt(db);
  for(const mutate of [
   r=>r.protected_snapshot.ledger_metadata.shift(),
   r=>r.protected_snapshot.ledger_metadata.push({version:'extra',name:'outro'}),
   r=>{r.target_function=null;r.target_overload_count=0;},
   r=>{r.protected_snapshot.ledger_metadata=r.protected_snapshot.ledger_metadata.filter(x=>x.name!==APPLY_NAME);},
  ]) {const bad=structuredClone(post);mutate(bad);assert.throws(()=>conferirRecibos(pre,bad));}
 }finally{await db.close();}
});

