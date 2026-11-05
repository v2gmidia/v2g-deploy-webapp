/** Disposable LOCAL Postgres; real migration/RPCs/trigger, focused dependency schema. No network/.env. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE ?? 'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const read=f=>readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8');
test('N26-05: SQL real, primeiro acesso explicito e isolamento',async t=>{
 const db=new PGlite();
 const scalar=async(q,p=[])=>Object.values((await db.query(q,p)).rows[0])[0];
 const op=randomUUID(),u=randomUUID(),other=randomUUID(),unverified=randomUUID();
 const b=randomUUID(),b2=randomUUID(),orphan=randomUUID(),e=randomUUID(),e2=randomUUID(),g=randomUUID(),g2=randomUUID();
 const email='piloto@example.invalid',doc='00000000191';
 const actor=async id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 const issue=(evidence=e,id=g,operator=op,note='Conferencia autorizada ficticia')=>scalar('select emitir_acesso_contratado($1,$2,$3,$4)',[id,evidence,operator,note]);
 const accept=id=>scalar('select aceitar_acesso_contratado($1)',[id]);
 try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; create schema private;
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
   create table profiles(id uuid primary key,full_name text,whatsapp text);
   create table businesses(id uuid primary key,name text,profile_id uuid,claim_email text);
   alter table businesses enable row level security;
   grant select on businesses to authenticated;
   create policy own_business on businesses for select to authenticated using(profile_id=auth.uid());
   create table commercial_orders(id uuid primary key,business_id uuid,buyer_profile_id uuid,buyer_email text,cnpj text);
   create table manager_accounts(business_id uuid,operator_profile_id uuid);`);
  const original=read('0001_init.sql');
  const trigger=original.slice(original.indexOf('create function public.handle_new_user()'))
   .replaceAll('public.handle_new_user','private.handle_new_user');
  await db.exec(trigger);
  await db.exec(read('20261022200400_manual_contract_evidence.sql'));
  // Focused predecessor fixture: exact real checksum function + CPF shape, not a full-chain migration claim.
  const predecessor=read('20261025215302_cpf_cnpj_contratante_v0.sql');
  await db.exec(predecessor.slice(predecessor.indexOf('create or replace function public.documento_contratante_valido'),predecessor.indexOf('-- Validar novos documentos')));
  await db.exec("alter table commercial_manual_evidence drop constraint commercial_manual_evidence_claimed_cnpj_check; alter table commercial_manual_evidence add check(claimed_cnpj ~ '^([0-9]{11}|[0-9]{14})$')");
  await db.exec(read('20261104040711_historical_contract_access.sql'));
  await db.query("insert into businesses values($1,'Negocio A',null,null),($2,'Negocio B',null,null),($3,'Orfao por email',null,$4)",[b,b2,orphan,email]);
  const user=async(id,mail,confirmed=true,operator=false)=>db.query(`insert into auth.users values($1,$2,case when $3 then now() else null end,$4::jsonb,'{"access_flow":"historical_contract"}')`,[id,mail,confirmed,JSON.stringify(operator?{papel:'operador'}:{})]);
  await user(op,'operador@example.invalid',true,true); await user(u,email); await user(other,'outra@example.invalid'); await user(unverified,email,false);
  await db.query('insert into manager_accounts values($1,$3),($2,$3)',[b,b2,op]);
  const evidence=async(id,business,document=doc,status='checked',source='historical_contract')=>db.query(`insert into commercial_manual_evidence
   (id,business_id,claimed_email,claimed_cnpj,source_system,source_reference,source_date,recorded_by,status,reviewed_by,reviewed_at,review_note)
   values($1,$2,$3,$4,$5,$6,current_date,$7,$8,$7,now(),'Fonte e autoridade ficticias conferidas')`,[id,business,email,document,source,'fixture-'+id,op,status]);
  await evidence(e,b); await evidence(e2,b2,'11222333000181');
  await t.test('nao cria pagamento/pedido; signup historico nao reivindica por email',async()=>{
   assert.equal(await scalar('select profile_id from businesses where id=$1',[orphan]),null);
   assert.equal(await scalar('select count(*)::int from commercial_orders'),0);
   assert.equal(await issue(),g);
   assert.equal(await scalar('select profile_id from businesses where id=$1',[b]),null);
  });
  await t.test('guard preserva o cadastro tradicional e nao concede acesso por marcador',async()=>{
   const traditional=randomUUID(),oldBusiness=randomUUID();
   await db.query("insert into businesses values($1,'Legado fixture',null,'tradicional@example.invalid')",[oldBusiness]);
   await db.query("insert into auth.users values($1,'tradicional@example.invalid',null,'{}','{}')",[traditional]);
   assert.equal(await scalar('select profile_id from businesses where id=$1',[oldBusiness]),traditional);
   assert.equal(await scalar('select count(*)::int from historical_contract_access where accepted_by=$1',[traditional]),0);
  });
  await t.test('emissao exige operador + carteira + evidencia historica conferida',async()=>{
   await assert.rejects(issue(e2,g2,other),/concessao_nao_autorizada/);
   await db.query('delete from manager_accounts where business_id=$1',[b2]);
   await assert.rejects(issue(e2,g2),/carteira_nao_autorizada/);
   await db.query('insert into manager_accounts values($1,$2)',[b2,op]);
   const denied=randomUUID();await evidence(denied,b2,doc,'rejected');
   await assert.rejects(issue(denied,randomUUID()),/contratacao_nao_conferida/);
   const pix=randomUUID();await evidence(pix,b2,doc,'checked','direct_pix');
   await assert.rejects(issue(pix,randomUUID()),/contratacao_nao_conferida/);
  });
  await t.test('replay identico conserva concessao/auditoria; divergencia negada',async()=>{
   assert.equal(await issue(e,randomUUID()),g);
   assert.equal(await scalar("select count(*)::int from historical_contract_access_events where access_id=$1 and kind='issued'",[g]),1);
   await assert.rejects(issue(e,g,op,'Outro motivo divergente'),/reenvio_divergente/);
  });
  await t.test('sem sessao, email errado, nao confirmado e ID alheio negados',async()=>{
   await actor('');assert.equal(await accept(g),false);
   await actor(other);assert.equal(await accept(g),false);
   await actor(unverified);assert.equal(await accept(g),false);
   await actor(u);assert.equal(await accept(randomUUID()),false);
  });
  await t.test('aceite autenticado liga somente negocio indicado e replay nao duplica',async()=>{
   await actor(u);await db.exec('set role authenticated');
   try {assert.equal(await accept(g),true);assert.equal(await accept(g),true);
    assert.equal(await scalar('select count(*)::int from historical_contract_access'),1);
    assert.equal(await scalar('select count(*)::int from businesses'),1);
   } finally {await db.exec('reset role');}
   assert.equal(await scalar('select profile_id from businesses where id=$1',[b]),u);
   assert.equal(await scalar('select profile_id from businesses where id=$1',[b2]),null);
   assert.equal(await scalar("select count(*)::int from historical_contract_access_events where access_id=$1 and kind='accepted'",[g]),1);
  });
  await t.test('mesmo email com dois negocios exige duas concessoes/aceites',async()=>{
   assert.equal(await issue(e2,g2),g2);await actor(u);assert.equal(await accept(g2),true);
   assert.equal(await scalar('select count(*)::int from businesses where profile_id=$1',[u]),2);
   assert.equal(await scalar('select count(*)::int from commercial_orders'),0);
   assert.equal(await scalar('select contractor_document_type from historical_contract_access where id=$1',[g]),'cpf');
   assert.equal(await scalar('select contractor_document_type from historical_contract_access where id=$1',[g2]),'cnpj');
  });
  await t.test('revogacao e replay desfazem so o vinculo introduzido, preservando outro negocio',async()=>{
   const revoke=operator=>scalar('select revogar_acesso_contratado($1,$2,$3)',[g,operator,'Encerramento ficticio']);
   assert.equal(await revoke(other),false);assert.equal(await revoke(op),true);assert.equal(await revoke(op),true);
   await actor(u);assert.equal(await accept(g),false);assert.equal(await accept(g2),true);
   await db.exec('set role authenticated');try {assert.equal(await scalar('select count(*)::int from historical_contract_access'),1);}finally{await db.exec('reset role');}
   assert.equal(await scalar('select profile_id from businesses where id=$1',[b]),null);
   assert.equal(await scalar('select profile_id from businesses where id=$1',[b2]),u);
   await assert.rejects(issue(),/reenvio_divergente/);
  });
  await t.test('RLS/ACL: cliente nao emite, revoga, altera trilha nem enumera convites',async()=>{
   for(const role of ['anon','authenticated']) {
    assert.equal(await scalar("select has_function_privilege($1,'emitir_acesso_contratado(uuid,uuid,uuid,text)','EXECUTE')",[role]),false);
    assert.equal(await scalar("select has_function_privilege($1,'revogar_acesso_contratado(uuid,uuid,text)','EXECUTE')",[role]),false);
    assert.equal(await scalar("select has_table_privilege($1,'historical_contract_access','UPDATE')",[role]),false);
    assert.equal(await scalar("select has_table_privilege($1,'historical_contract_access_events','INSERT')",[role]),false);
   }
   await actor(other);await db.exec('set role authenticated');try{assert.equal(await scalar('select count(*)::int from historical_contract_access'),0);}finally{await db.exec('reset role');}
  });
  await t.test('convite expirado, negocio de terceiro e pedido financeiro existente negados',async()=>{
   const bb=randomUUID(),ee=randomUUID(),gg=randomUUID();
   await db.query("insert into businesses values($1,'Fixture expiracao',null,null)",[bb]);
   await db.query('insert into manager_accounts values($1,$2)',[bb,op]);await evidence(ee,bb);
   await issue(ee,gg);await db.query("update historical_contract_access set accept_before=now()-interval '1 day' where id=$1",[gg]);
   await actor(u);assert.equal(await accept(gg),false);
   await db.query("update historical_contract_access set accept_before=now()+interval '1 day' where id=$1",[gg]);
   await db.query('update businesses set profile_id=$2 where id=$1',[bb,other]);assert.equal(await accept(gg),false);
   await db.query('update businesses set profile_id=null where id=$1',[bb]);
   await db.query('insert into commercial_orders(id,business_id) values($1,$2)',[randomUUID(),bb]);assert.equal(await accept(gg),false);
  });
 } finally {await db.close();}
});
