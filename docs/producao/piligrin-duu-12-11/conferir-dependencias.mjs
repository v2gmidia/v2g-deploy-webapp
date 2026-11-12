import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
const {PGlite}=await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
test('oito tabelas propostas: DDL, RLS e privilégios explícitos em PostgreSQL descartável',async()=>{
 const db=new PGlite();let provas=0;
 const scalar=async(q,p=[])=>(await db.query(q,p)).rows[0].v;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;create schema private;create schema storage;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
   create table profiles(id uuid primary key,full_name text);
   create table businesses(id uuid primary key,profile_id uuid references profiles,name text,claim_email text);
   create table commercial_orders(id uuid primary key,business_id uuid,buyer_profile_id uuid,buyer_email text,cnpj text);
   create table ad_accounts(id uuid primary key,business_id uuid,external_id text,is_active boolean,status text);
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create function private.handle_new_user() returns trigger language plpgsql as $$begin
     if new.email is not null then perform 1;end if;return new;end$$;
   create function public.documento_contratante_valido(text) returns boolean language sql immutable as $$select $1 ~ '^[0-9]{14}$'$$;`);
  for(const nome of readdirSync(new URL('banco/',import.meta.url)).sort()) await db.exec(readFileSync(new URL('banco/'+nome,import.meta.url),'utf8'));
  const tabelas=['agency_advertisers','manager_accounts','manager_tasks','commercial_manual_evidence',
   'historical_contract_access','historical_contract_access_events','creative_review_requests','creative_publication_confirmations'];
  for(const tabela of tabelas){
   assert.equal(await scalar('select relrowsecurity v from pg_class where oid=$1::regclass',['public.'+tabela]),true);provas++;
   for(const papel of ['anon','authenticated'])for(const direito of ['INSERT','UPDATE','DELETE','TRUNCATE']){
    assert.equal(await scalar('select has_table_privilege($1,$2,$3) v',[papel,tabela,direito]),false);provas++;
   }
  }
  for(const tabela of ['manager_accounts','manager_tasks','creative_review_requests'])for(const direito of ['SELECT','INSERT','UPDATE','DELETE']){
   assert.equal(await scalar('select has_table_privilege(\'service_role\',$1,$2) v',[tabela,direito]),true);provas++;
  }
  assert.equal(await scalar("select public=false v from storage.buckets where id='creative-review'"),true);provas++;
  assert.equal(await scalar('select count(*)=0 v from commercial_orders'),true);provas++;
  assert.equal(await scalar('select count(*)=0 v from creative_publication_confirmations'),true);provas++;
  console.log(`${provas} provas locais de estrutura/privilégios; validador de documento é fixture estrutural, não prova de CPF/CNPJ real.`);
 }finally{await db.close();}
});
