/** Postgres efêmero. Nenhuma credencial, .env, Meta ou banco remoto. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {PGlite}=process.env.V2G_PGLITE_MODULE?await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href):await import('@electric-sql/pglite');
const db=new PGlite();
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',r='33333333-3333-4333-8333-333333333333',u='44444444-4444-4444-8444-444444444444',v='55555555-5555-4555-8555-555555555555',sha='a'.repeat(64);
let checks=0;
const eq=(x,y)=>{assert.deepEqual(x,y);checks++;};
const rpc=async(p={})=>{
 const x={review:r,business:a,sha,actor:u,account:'act_123',ad:'456',day:'2026-11-01',evidence:'Conferi esta versão no anúncio.',...p};
 return (await db.query('select confirmar_publicacao_criativo($1,$2,$3,$4,$5,$6,$7,$8) as result',Object.values(x))).rows[0].result;
};
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
 create table profiles(id uuid primary key);create table businesses(id uuid primary key,profile_id uuid);
 create table creative_review_requests(id uuid primary key,business_id uuid,sha256 text,status text);
 create table manager_accounts(business_id uuid,operator_profile_id uuid);
 create table ad_accounts(business_id uuid,external_id text,is_active boolean,status text);
 grant select on businesses to authenticated;grant select,update on creative_review_requests,manager_accounts,ad_accounts to service_role;
 insert into profiles values('${u}'),('${v}');insert into businesses values('${a}','${u}'),('${b}','${v}');
 insert into creative_review_requests values('${r}','${a}','${sha}','approved_for_manual_publish');
 insert into manager_accounts values('${a}','${u}');insert into ad_accounts values('${a}','act_123',true,'ok'),('${b}','act_999',true,'ok');`);
 await db.exec(readFileSync('supabase/migrations/20261109210135_creative_publication_confirmation.sql','utf8'));
 eq((await db.query("select relrowsecurity from pg_class where relname='creative_publication_confirmations'")).rows[0].relrowsecurity,true);
 for(const role of ['anon','authenticated']){
   eq((await db.query(`select has_function_privilege('${role}','public.confirmar_publicacao_criativo(uuid,uuid,text,uuid,text,text,date,text)','EXECUTE') as p`)).rows[0].p,false);
   for(const op of ['INSERT','UPDATE','DELETE'])eq((await db.query(`select has_table_privilege('${role}','creative_publication_confirmations','${op}') as p`)).rows[0].p,false);
 }
 eq((await db.query("select prosecdef from pg_proc where proname='confirmar_publicacao_criativo'")).rows[0].prosecdef,false);
 for(const p of [{actor:v},{business:b},{sha:'b'.repeat(64)},{account:'act_999'}])eq(await rpc(p),'not_allowed');
 for(const p of [{day:'2999-01-01'},{evidence:'ok'},{account:'123'},{ad:'x'},{actor:null}])eq(await rpc(p),'invalid');
 await db.exec("update creative_review_requests set status='awaiting_review'");eq(await rpc(),'not_allowed');
 await db.exec("update creative_review_requests set status='approved_for_manual_publish'");
 await db.exec('set role service_role');eq(await rpc(),'registered');eq(await rpc(),'already_registered');
 eq(await rpc({ad:'789'}),'conflict');await db.exec('reset role');
 eq((await db.query('select count(*)::int as n from creative_publication_confirmations')).rows[0].n,1);
 eq((await db.query('select status from creative_review_requests')).rows[0].status,'approved_for_manual_publish');
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${v}'`);
 eq((await db.query('select count(*)::int as n from creative_publication_confirmations')).rows[0].n,0);
 await db.exec(`set request.jwt.claim.sub='${u}'`);eq((await db.query('select count(*)::int as n from creative_publication_confirmations')).rows[0].n,1);
 await db.exec('reset role');
 eq((await db.query("select has_table_privilege('service_role','creative_publication_confirmations','UPDATE') as p")).rows[0].p,false);
 console.log(`PASS publicação criativo SQL: ${checks} verificações; aprovação preservada, isolamento, ACL, versão e replay.`);
}finally{await db.close();}
