/** PostgreSQL descartável local, sem rede/.env. Fixtures não são backup produtivo. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
const {PGlite}=await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const payload=JSON.parse(read('dados-propostos.json')),seed=read('20-cadastro-proposto.sql');
const A=payload.agenciaProducao,B=payload.anuncianteProposto,U=payload.titularProducao,X='11111111-1111-4111-8111-111111111111',Y='22222222-2222-4222-8222-222222222222';
test('cadastro proposto: preservação, replay, drift, isolamento e nenhuma cobrança',async()=>{
 const db=new PGlite();let provas=0;const ok=v=>{assert.ok(v);provas++;};
 const scalar=async(q,p=[])=>(await db.query(q,p)).rows[0].v;
 const fail=async(regex)=>{await assert.rejects(db.exec(seed),regex);await db.exec('rollback');provas++;};
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;create function auth.uid() returns uuid language sql stable as
   $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
   create table businesses(id uuid primary key,profile_id uuid,name text not null,description text,monthly_budget numeric,
    onboarding jsonb not null default '{}',procedencia jsonb default '{}',site_url text,instagram_handle text,
    avg_direct_cost numeric,created_at timestamptz default now(),updated_at timestamptz default now());
   alter table businesses enable row level security;grant select on businesses to authenticated;
   create policy own_business on businesses for select to authenticated using(profile_id=auth.uid());
   create table commercial_orders(id uuid primary key,business_id uuid);
   create table ad_accounts(id uuid primary key,business_id uuid);`);
  await db.query("insert into auth.users values($1,'victorcabralns@piligrin.com.br',now())",[U]);
  await db.query("insert into businesses(id,profile_id,name) values($1,$2,'Meu negócio'),($3,$4,'Outro cliente')",[A,U,Y,X]);
  const antes=await scalar('select to_jsonb(b)::text v from businesses b where id=$1',[Y]);
  await db.exec(read('banco/01-agencia.sql'));
  await fail(/destino_ou_pacote_nao_confirmado/);
  await db.query("select set_config('v2g.projeto_aprovado',$1,false),set_config('v2g.pacote_aprovado',$2,false),set_config('v2g.dados_aprovados',$3,false)",
   ['ushccxpoxjikzqnwhgfd','piligrin-duu-12-11-revisao-1',JSON.stringify(payload)]);
  await db.exec(seed);
  ok(await scalar("select name='Piligrin' and onboarding='{}' and monthly_budget is null v from businesses where id=$1",[A]));
  ok(await scalar("select name='Dúú Gomes' and monthly_budget=3000 and avg_direct_cost is null and site_url is null v from businesses where id=$1",[B]));
  ok(await scalar("select onboarding->'respostas'->'praca'->>'texto'='Todo o estado do Rio de Janeiro' v from businesses where id=$1",[B]));
  ok(await scalar('select count(*)=0 v from commercial_orders'));ok(await scalar('select count(*)=0 v from ad_accounts'));
  ok(await scalar('select count(*)=1 v from agency_advertisers where agency_business_id=$1 and advertiser_business_id=$2 and not legacy_shared_business',[A,B]));
  ok(antes===await scalar('select to_jsonb(b)::text v from businesses b where id=$1',[Y]));
  const novo=await scalar('select to_jsonb(b)::text v from businesses b where id=$1',[B]);
  await db.exec(seed);ok(novo===await scalar('select to_jsonb(b)::text v from businesses b where id=$1',[B]));
  ok(await scalar('select count(*)=3 v from businesses'));
  await db.query("update businesses set description='Edição posterior preservada' where id=$1",[B]);
  await fail(/anunciante_existente_divergente_preservado/);
  ok(await scalar("select description='Edição posterior preservada' v from businesses where id=$1",[B]));
  for(const papel of ['anon','authenticated'])for(const privilege of ['INSERT','UPDATE','DELETE','TRUNCATE'])
   ok(await scalar("select not has_table_privilege($1,'agency_advertisers',$2) v",[papel,privilege]));
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${U}'`);ok(await scalar('select count(*)=1 v from agency_advertisers'));
  await db.exec(`set request.jwt.claim.sub='${X}'`);ok(await scalar('select count(*)=0 v from agency_advertisers'));
  ok(await scalar('select count(*)=0 v from businesses where id=$1',[B]));await db.exec('reset role');
  await assert.rejects(db.query("update agency_advertisers set owner_profile_id=$1 where advertiser_business_id=$2",[X,B]),/foreign key/);provas++;
  console.log(`${provas} provas SQL locais aprovadas; nenhum banco remoto acessado.`);
 }finally{await db.close();}
});
