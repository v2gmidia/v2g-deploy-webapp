/** Postgres WASM descartável. Nenhuma conexão, migração ou escrita em QA/produção. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {test} from 'node:test';
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE ?? 'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const migration=readFileSync('docs/qa/agencia-anunciante-piligrin/supabase/migrations/20261110193942_agency_advertisers_qa.sql','utf8');
const seed=readFileSync('docs/qa/agencia-anunciante-piligrin/preparar-piligrin.sql','utf8');
const P='9cb85308-02cc-4ce7-bacf-15be77f9ba5e',U='09e25ab4-b55b-48d1-bfde-181e41192bb6';
const OTHER='11111111-1111-4111-8111-111111111111',OTHER_B='22222222-2222-4222-8222-222222222222';
test('estrutura QA: preservação, repetição segura, grants, RLS, isolamento e retorno',async()=>{
  const db=new PGlite();let provas=0;
  const ok=(v)=>{assert.ok(v);provas++;};
  const scalar=async(sql,args=[])=>(await db.query(sql,args)).rows[0].v;
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table businesses(id uuid primary key default gen_random_uuid(), profile_id uuid, name text not null,
        onboarding jsonb not null default '{}',monthly_budget numeric,logo text,created_at timestamptz default now());
      alter table businesses enable row level security;
      grant select,insert,update,delete on businesses to authenticated,service_role;
      grant usage on schema auth to authenticated;
      create policy own_business on businesses for all to authenticated using(profile_id=auth.uid()) with check(profile_id=auth.uid());
      create table creative_review_requests(id uuid primary key, business_id uuid references businesses, sha256 text);
      create table ad_accounts(id uuid primary key,business_id uuid references businesses,external_id text);
      alter table creative_review_requests enable row level security;alter table ad_accounts enable row level security;
      grant select on creative_review_requests,ad_accounts to authenticated;
      create policy review_own on creative_review_requests for select to authenticated using(exists(select 1 from businesses b where b.id=business_id and b.profile_id=auth.uid()));
      create policy account_own on ad_accounts for select to authenticated using(exists(select 1 from businesses b where b.id=business_id and b.profile_id=auth.uid()));`);
    await db.query('insert into businesses(id,profile_id,name,onboarding,monthly_budget,logo) values($1,$2,\'Piligrin\',$3,3000,\'logo-duu\')',[P,U,JSON.stringify({respostas:{nome:{texto:'Dúú Gomes'},praca:{texto:'Todo o estado do Rio de Janeiro'}}})]);
    await db.query('insert into businesses(id,profile_id,name) values($1,$2,\'Outra agência\')',[OTHER_B,OTHER]);
    await db.query('insert into creative_review_requests values($1,$2,$3)',['33333333-3333-4333-8333-333333333333',P,'a'.repeat(64)]);
    await db.query('insert into ad_accounts values($1,$2,\'act_1165478988908157\')',['44444444-4444-4444-8444-444444444444',P]);
    const original=await scalar('select row_to_json(b)::text v from businesses b where id=$1',[P]);
    await db.exec(migration);
    await assert.rejects(db.exec(seed),/destino QA nao confirmado/);await db.exec('rollback');provas++;
    ok(await scalar('select count(*)=0 v from agency_advertisers'));
    await db.exec("set v2g.qa_project='zskpijnqgkqwxksqmzmf'");await db.exec(seed);
    const F=await scalar("select advertiser_business_id v from agency_advertisers where reference_key='piligrin-famfire'");
    ok(F&&F!==P);ok(original===await scalar('select row_to_json(b)::text v from businesses b where id=$1',[P]));
    ok(await scalar('select count(*)=0 v from ad_accounts where business_id=$1',[F]));
    ok(await scalar('select count(*)=0 v from creative_review_requests where business_id=$1',[F]));
    const f=(await db.query('select * from businesses where id=$1',[F])).rows[0];
    ok(f.monthly_budget===null&&f.logo===null);ok(!f.onboarding.respostas.praca);ok(f.onboarding.respostas.nome.texto==='FamFire');
    await db.query("update businesses set onboarding=onboarding||'{\"nota_preservada\":\"cadastro posterior\"}'::jsonb where id=$1",[F]);
    const famfireAntes=await scalar('select row_to_json(b)::text v from businesses b where id=$1',[F]);
    await db.exec(seed);ok(await scalar('select count(*)=3 v from businesses'));ok(await scalar('select count(*)=2 v from agency_advertisers'));
    ok(famfireAntes===await scalar('select row_to_json(b)::text v from businesses b where id=$1',[F]));
    for(const role of ['anon','authenticated'])for(const privilege of ['INSERT','UPDATE','DELETE','TRUNCATE'])
      ok(await scalar('select not has_table_privilege($1,\'agency_advertisers\',$2) v',[role,privilege]));
    ok(await scalar("select not has_table_privilege('anon','agency_advertisers','SELECT') v"));
    ok(await scalar("select not has_function_privilege('authenticated','check_agency_advertiser_tree()','EXECUTE') v"));
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${U}'`);
    ok(await scalar('select count(*)=2 v from agency_advertisers'));
    ok(await scalar('select count(*)=0 v from creative_review_requests where business_id=$1',[F]));
    ok(await scalar('select count(*)=0 v from ad_accounts where business_id=$1',[F]));
    await db.exec(`set request.jwt.claim.sub='${OTHER}'`);ok(await scalar('select count(*)=0 v from agency_advertisers'));
    ok(await scalar('select count(*)=0 v from creative_review_requests where business_id=$1',[P]));
    await assert.rejects(db.query("insert into agency_advertisers(agency_business_id,advertiser_business_id,owner_profile_id,advertiser_name,reference_key,source) values($1,$2,$3,'Forjado','forjado','origem forjada')",[P,OTHER_B,OTHER]),/permission denied/);provas++;
    await db.exec('reset role');
    await assert.rejects(db.query("insert into agency_advertisers(agency_business_id,advertiser_business_id,owner_profile_id,advertiser_name,reference_key,source) values($1,$2,$3,'Cruzado','cruzado','origem de teste')",[P,OTHER_B,U]),/foreign key/);provas++;
    await assert.rejects(db.query('update businesses set profile_id=$1 where id=$2',[OTHER,F]),/foreign key/);provas++;
    await assert.rejects(db.query("insert into agency_advertisers(agency_business_id,advertiser_business_id,owner_profile_id,advertiser_name,reference_key,source) values($1,$1,$2,'FamFire agência','ciclo','origem de teste')",[F,U]),/agencia nao pode|check constraint/);provas++;
    await db.query('update agency_advertisers set revoked_at=now() where advertiser_business_id=$1',[F]);
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${U}'`);
    ok(await scalar('select count(*)=1 v from agency_advertisers'));await db.exec('reset role');
    ok(original===await scalar('select row_to_json(b)::text v from businesses b where id=$1',[P]));
    ok(await scalar('select count(*)=1 v from creative_review_requests where business_id=$1',[P]));
    console.log(`${provas} provas SQL locais: nenhum banco remoto acessado`);
  } finally {await db.close();}
});
