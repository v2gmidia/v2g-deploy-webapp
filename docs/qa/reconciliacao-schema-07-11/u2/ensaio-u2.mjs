
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fixture,read,M,backend} from './fixture.mjs';
import {conferirRecibos} from './comparar-recibos.mjs';
const apply=read('u2-aplicar.sql'),undo=read('u2-retornar.sql'),verify=read('u2-verificar.sql');
const receipt=async db=>(await db.query(read('u2-preflight.sql'))).rows[0].receipt;
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const ids={A:'11111111-1111-4111-8111-111111111111',B:'22222222-2222-4222-8222-222222222222',C:'33333333-3333-4333-8333-333333333333'};
const cid={A:'41111111-1111-4111-8111-111111111111',B:'42222222-2222-4222-8222-222222222222',C:'43333333-3333-4333-8333-333333333333'};
const aid={A:'51111111-1111-4111-8111-111111111111',B:'52222222-2222-4222-8222-222222222222',C:'53333333-3333-4333-8333-333333333333'};
function checkU1Seals() {
 for(const line of read('../SHA256SUMS.txt').trim().split(/\r?\n/)){
  const [hash,name]=line.split('  ');
  const data=readFileSync(new URL('../'+name,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),hash,'selo U1 '+name);
 }
}
async function managed(db,sql,name,version,order='after') {
 assert.doesNotMatch(sql,/^\s*(begin|commit)\s*;/mi);
 await db.transaction(async tx=>{
  const add=()=>tx.query('insert into supabase_migrations.schema_migrations values($1,$2)',[version,name]);
  if(order==='before')await add();await tx.exec(sql);if(order==='after')await add();
 });
}
async function rows(db,table){return (await db.query('select to_jsonb(t) as r from '+table+' t order by id')).rows.map(r=>r.r);}
async function seed(db) {
 for(const x of ['A','B','C']){
  const id=ids[x],mid=x==='C'?'meta-outro-ficticio':'meta-compartilhado-ficticio';
  await db.query('insert into public.businesses(id,name) values($1,$2)',[id,'Negocio FICTICIO '+x]);
  await db.query('insert into public.meta_connections(id,business_id,meta_user_id,status) values($1,$2,$3,\'connected\')',[cid[x],id,mid]);
  await db.query('insert into public.ad_accounts(id,business_id,meta_connection_id,external_id) values($1,$2,$3,$4)',[aid[x],id,cid[x],'act_FICTICIO_'+x]);
  await db.query("insert into public.campaigns(id,business_id,ad_account_id,external_campaign_id,meta_status,publish_state,published_at,name) values($1,$1,$2,'external-FICTICIO','PAUSED','published','2026-01-01','campanha-propria')",[id,aid[x]]);
  await db.query("insert into public.creatives(id,business_id,campaign_id,external_adset_id,external_creative_id,external_ad_id,meta_status,storage_path,copy,vision_description) values($1,$1,$1,'adset-FICTICIO','creative-FICTICIO','ad-FICTICIO','PAUSED','arquivo-proprio', '{\"titulo\":\"texto-proprio\"}','descricao-propria')",[id]);
  await db.query("insert into public.metrics_daily(id,business_id,campaign_id,creative_id,ad_account_id,date) values($1,$1,$1,$1,$2,'2026-01-01')",[id,aid[x]]);
  await db.query('insert into public.commercial_order_units(id,business_id,ad_account_id) values($1,$1,$2)',[id,aid[x]]);
  await db.query("insert into vault.secrets(id,name,secret) values($1,$2,'SEGREDO-FICTICIO-NAO-REAL')",[id,'meta_token_'+id]);
 }
}
test('U2: selos U1 intactos antes e depois do conjunto',()=>checkU1Seals());
test('U2: delta real em dados existentes, recibo unico, ledger novo e retorno sem perda',async()=>{
 const db=await fixture();try{
  await seed(db);const tables=['businesses','campaigns','creatives','ad_accounts'];
  const beforeData=Object.fromEntries(await Promise.all(tables.map(async t=>[t,await rows(db,'public.'+t)])));
  const pre=await receipt(db);
  assert.equal(pre.snapshot.ledger.length,45);
  await managed(db,apply,M.applyName,'fixture-u2');await db.exec(verify);
  const post=(await db.query(read('u2-pos.sql'))).rows[0].receipt;
  assert.equal(post.snapshot.ledger.length,46);
  assert.equal(conferirRecibos(pre,post).ok,true);
  for(const t of tables)for(const [i,row] of (await rows(db,'public.'+t)).entries()){
   for(const key of Object.keys(beforeData[t][i]))assert.deepEqual(row[key],beforeData[t][i][key],t+'.'+key);
  }
  // Linha nova só com campos antigos: retorno deve preservá-la.
  await db.query("insert into public.businesses(id,name) values('99999999-9999-4999-8999-999999999999','novo-ficticio-preservar')");
  await managed(db,undo,M.returnName,'fixture-u2-return');
  const returned=await receipt(db);assert.equal(conferirRecibos(post,returned,'return').ok,true);
  assert.equal(returned.snapshot.ledger.length,47);
  assert.equal((await db.query('select count(*)::int n from public.businesses')).rows[0].n,4);
  for(const n of backend)assert.equal((await db.query('select count(*)::int n from public.'+n)).rows[0].n,1);
 }finally{await db.close();checkU1Seals();}
});
test('U2: drift de tipo/constraint antes da aplicacao aborta sem delta nem ledger',async()=>{
 const db=await fixture();try{
  await db.exec('alter table public.campaigns alter column publish_state set default \'drift\';');
  const before=await receipt(db);await assert.rejects(managed(db,apply,M.applyName,'failed'),/pais\/definicoes\/ACL divergiram/);
  assert.deepEqual(await receipt(db),before);
 }finally{await db.close();}
});
test('U2: valor legado incompativel nao e corrigido ou apagado para validar CHECK',async()=>{
 const db=await fixture();try{
  await db.query("insert into public.businesses(id,name,cadastro_estado) values($1,'FICTICIO','estado-nao-suportado')",[ids.A]);
  const before=await receipt(db);await assert.rejects(managed(db,apply,M.applyName,'failed'),/check constraint/);
  assert.deepEqual(await receipt(db),before);
  assert.equal((await db.query('select cadastro_estado from public.businesses')).rows[0].cadastro_estado,'estado-nao-suportado');
 }finally{await db.close();}
});
test('U2: ACL backend ou default EXECUTE inesperado aborta a unidade',async()=>{
 for(const change of ['grant update on public.execucoes to service_role','grant maintain on public.execucoes to service_role','grant select on public.execucoes to service_role with grant option','grant select(id) on public.execucoes to service_role with grant option','create role terceiro_fixture;alter default privileges grant execute on functions to terceiro_fixture']){
  const db=await fixture();try{await db.exec(change);const before=await receipt(db);
   await assert.rejects(managed(db,apply,M.applyName,'failed'),/protecao backend|delta\/ACL\/definicao divergente/);
   assert.deepEqual(await receipt(db),before);
  }finally{await db.close();}
 }
});
test('U2: callbacks com conexoes reais da fixture; sem antecipar U3, preserva dados proprios/backend',async()=>{
 const db=await fixture();try{
  await seed(db);await managed(db,apply,M.applyName,'fixture-u2');
  await db.exec('set role service_role');
  assert.equal((await db.query("select public.desautorizar_meta('meta-compartilhado-ficticio') n")).rows[0].n,2);
  await db.exec('reset role');
  assert.equal((await db.query("select count(*)::int n from public.meta_connections where status='revoked'")).rows[0].n,2);
  assert.equal((await db.query('select count(*)::int n from vault.secrets')).rows[0].n,1);
  // Rota administrativa: registra antes; resumo.negocios continua disponível para business_ids.
  await db.exec('set role service_role');
  await db.query("insert into public.exclusoes_de_dados(codigo,meta_user_id) values('codigo-ficticio','meta-compartilhado-ficticio')");
  const summary=(await db.query("select public.apagar_dados_da_meta('meta-compartilhado-ficticio') as r")).rows[0].r;
  assert.deepEqual(summary.negocios.sort(),[ids.A,ids.B]);assert.equal(summary.conexoes,2);assert.equal(summary.contas,2);assert.equal(summary.metricas,2);
  await db.query("update public.exclusoes_de_dados set business_ids=$1,o_que_foi_apagado=$2,concluido_em=now() where codigo='codigo-ficticio'",[summary.negocios,summary]);
  await db.exec('reset role');
  for(const t of ['businesses','campaigns','creatives','commercial_order_units'])assert.equal((await db.query('select count(*)::int n from public.'+t)).rows[0].n,3);
  assert.equal((await db.query("select count(*)::int n from public.creatives where storage_path='arquivo-proprio' and copy->>'titulo'='texto-proprio'")).rows[0].n,3);
  assert.equal((await db.query("select count(*)::int n from public.campaigns where name='campanha-propria' and published_at='2026-01-01'")).rows[0].n,3);
  assert.equal((await db.query('select count(*)::int n from public.commercial_order_units where ad_account_id is null')).rows[0].n,2);
  assert.equal((await db.query('select count(*)::int n from public.meta_connections')).rows[0].n,1);
  for(const n of backend)assert.equal((await db.query('select count(*)::int n from public.'+n)).rows[0].n,1);
  await assert.rejects(managed(db,undo,M.returnName,'failed-return'),/registro de exclusao posterior/);
 }finally{await db.close();}
});
test('U2: status publico projeta seis contagens, nunca IDs/segredos/arrays/objetos extras',async()=>{
 const db=await fixture();try{
  await managed(db,apply,M.applyName,'fixture-u2');
  const secret='SEGREDO-FICTICIO-NAO-REAL',payload={negocios:[ids.A],business_ids:[ids.B],meta_user_id:'ID-FICTICIO',extra:{segredo:secret},conexoes:{negocios:[ids.A],secret},segredos:1,contas:2,metricas:[secret],campanhas:ids.C,criativos:'3'};
  await db.query("insert into public.exclusoes_de_dados(codigo,meta_user_id,business_ids,o_que_foi_apagado,erro) values('privacidade-ficticia','ID-FICTICIO',$1,$2,$3)",[[ids.A],payload,secret]);
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   const out=(await db.query("select * from public.status_da_exclusao('privacidade-ficticia')")).rows[0];
   assert.deepEqual(out.o_que_foi_apagado,{segredos:1,contas:2});assert.equal(out.teve_erro,true);
   for(const x of [ids.A,ids.B,ids.C,secret,'ID-FICTICIO','negocios','business_ids','extra'])assert.equal(JSON.stringify(out).includes(x),false,x);
   await assert.rejects(db.query('select * from public.exclusoes_de_dados'),/permission denied/);
   await assert.rejects(db.query("select public.apagar_dados_da_meta('ID-FICTICIO')"),/permission denied/);
   await assert.rejects(db.query("select public.desautorizar_meta('ID-FICTICIO')"),/permission denied/);
   assert.equal((await db.query("select * from public.status_da_exclusao('desconhecido')")).rows.length,0);
   await db.exec('reset role');
  }
  await db.query("update public.exclusoes_de_dados set o_que_foi_apagado=$1",[{conexoes:0,segredos:2147483648,contas:-1,metricas:1.5,campanhas:null,criativos:3}]);
  assert.deepEqual((await db.query("select * from public.status_da_exclusao('privacidade-ficticia')")).rows[0].o_que_foi_apagado,{conexoes:0,criativos:3});
 }finally{await db.close();}
});
test('U2: retorno recusa conteudo novo em cada uma das 13 colunas',async()=>{
 const db=await fixture();try{
  await seed(db);await managed(db,apply,M.applyName,'fixture-u2');
  for(const [t,n,ty] of M.columns){
   const value=ty==='uuid'?quote(ids.A)+'::uuid':ty==='timestamp with time zone'?"'2026-01-01'::timestamptz":ty==='bigint'||ty==='numeric'?'1':"'conteudo-ficticio-posterior'";
   const key=t==='businesses'?'id':'business_id';
   const changed=await db.query('update public.'+t+' set '+n+'='+value+' where '+key+'=$1 returning 1 as changed',[ids.A]);
   assert.equal(changed.rows.length,1,'preencher exatamente uma linha ficticia');
   await assert.rejects(managed(db,undo,M.returnName,'failed-return'),/coluna com conteudo posterior/);
   await db.query('update public.'+t+' set '+n+'=null where '+key+'=$1',[ids.A]);
  }
 }finally{await db.close();}
});
test('U2: retorno recusa indice e CHECK posteriores sobre coluna ainda nula, antes de DROP COLUMN',async()=>{
 for(const [create,drop] of [
 ['create index posterior_fixture on public.businesses(whatsapp_do_anuncio)','drop index public.posterior_fixture'],
 ['alter table public.businesses add constraint posterior_fixture check(whatsapp_do_anuncio is null)','alter table public.businesses drop constraint posterior_fixture'],
 ]){
  const db=await fixture();try{
   await managed(db,apply,M.applyName,'fixture-u2');await db.exec(create);const before=await receipt(db);
   await assert.rejects(managed(db,undo,M.returnName,'failed-return'),/pais\/definicoes\/ACL divergiram/);
   assert.deepEqual(await receipt(db),before);
   await db.exec(drop);
  }finally{await db.close();}
 }
});
test('U2: views e FKs dependentes bloqueiam retorno RESTRICT e preservam objetos',async()=>{
 for(const sql of [
  'create view public.posterior_fixture as select whatsapp_do_anuncio from public.businesses',
  'create table public.posterior_fixture(id text references public.exclusoes_de_dados(codigo))',
 ]){
  const db=await fixture();try{await managed(db,apply,M.applyName,'fixture-u2');await db.exec(sql);
   await assert.rejects(managed(db,undo,M.returnName,'failed-return'),/depend|cannot drop/);
   assert.ok((await db.query("select to_regclass('public.posterior_fixture') r")).rows[0].r);
   await db.exec(verify);
  }finally{await db.close();}
 }
});
test('U2: comparador rejeita corpo/ACL modificados, indice fora da allowlist e ledger adulterado',async()=>{
 const db=await fixture();try{
  const pre=await receipt(db);await managed(db,apply,M.applyName,'fixture-u2');const post=await receipt(db);
  for(const mutate of [
   r=>{r.snapshot.functions.find(f=>f.name==='status_da_exclusao').body_md5='alterado';},
   r=>{r.snapshot.relations.find(t=>t.relname==='businesses').table_acl=[];},
   r=>{r.snapshot.ledger[0].name='historico-adulterado';},
   r=>{r.snapshot.ledger.push({version:'extra',name:'extra'});},
  ]){const bad=structuredClone(post);mutate(bad);assert.throws(()=>conferirRecibos(pre,bad));}
 }finally{await db.close();checkU1Seals();}
});
