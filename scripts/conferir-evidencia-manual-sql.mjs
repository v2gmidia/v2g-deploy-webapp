/** Cadeia SQL real em Postgres descartavel. Nao acessa .env, QA ou Asaas. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
const {PGlite}=process.env.V2G_PGLITE_MODULE ? await import(pathToFileURL(process.env.V2G_PGLITE_MODULE).href) : await import('@electric-sql/pglite');
const db=new PGlite();
const scalar=async(sql,args=[])=>(await db.query(sql,args)).rows[0].ok;
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create function auth.uid() returns uuid language sql as 'select null::uuid';
    create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
    create table profiles(id uuid primary key);
    create table businesses(id uuid primary key default gen_random_uuid(),name text,claim_email text,profile_id uuid);
    create table ad_accounts(id uuid primary key);
    create table leads_lp(id bigint primary key,cnpj text,email text,whatsapp text,vende_whatsapp boolean,
      pagina_origem text,utm_source text,utm_medium text,utm_campaign text,utm_content text,consentimento_em timestamptz,consentimento_texto text);`);
  for(const f of ['0026_contratacao_multiconta.sql','0029_pix_assistido.sql','0034_checkout_self_service.sql',
    '20261008223000_checkout_transparente_sandbox.sql','20261009015000_checkout_cartao_retentativa_qa.sql',
    '20261009042000_gestor_responsaveis_tarefas.sql','20261011140000_eventos_financeiros_sandbox.sql',
    '20261013031434_qa_registrar_falha_desafio_3ds.sql','20261018130000_ligar_lead_lp_pedido.sql',
    '20261020021942_qa_cartao_mensal_3ds.sql','20261022200400_manual_contract_evidence.sql'])
    await db.exec(readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
  const op=randomUUID(),other=randomUUID(),buyer=randomUUID();
  for(const id of [op,other,buyer]) await db.query('insert into profiles values($1)',[id]);
  const order=await scalar('select registrar_pedido_pix_assistido($1,$2,$3,$4,1,$5) as ok',
    [randomUUID(),'cliente@example.invalid','Negocio Ficticio','11222333000181','monthly']);
  const business=await scalar('select business_id as ok from commercial_orders where id=$1',[order]);
  const b2=randomUUID(),owned=randomUUID();
  await db.query('insert into businesses(id,name,claim_email) values($1,$2,$3)',[b2,'Outro ficticio','cliente@example.invalid']);
  await db.query('insert into businesses(id,name,profile_id) values($1,$2,$3)',[owned,'Anterior do cliente',buyer]);
  for(const b of [business,b2,owned]) await db.query('insert into manager_accounts(business_id,operator_profile_id,assigned_by) values($1,$2,$2)',[b,op]);
  const draft={id:randomUUID(),business,order,profile:null,email:'cliente@example.invalid',cnpj:'11222333000181',source:'direct_pix',reference:'pix-ficticio-0001',date:'2026-10-20',operator:op};
  const register=(d={})=>{const r={...draft,...d};return scalar('select registrar_evidencia_manual($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as ok',
    [r.id,r.business,r.order,r.profile,r.email,r.cnpj,r.source,r.reference,r.date,r.operator]);};
  const review=(id,status='checked',extra={})=>scalar('select revisar_evidencia_manual($1,$2,$3,$4,$5,$6,$7) as ok',
    [id,extra.business??business,extra.operator??op,status,extra.note??'Credito e identidade conferidos na fonte ficticia.',extra.identity??true,extra.source??true]);
  const count=()=>scalar('select count(*)::int as ok from commercial_manual_evidence');
  // Estado inicial, replay de ID e chave natural, sem segunda compra.
  assert.equal(await register(),draft.id);
  assert.equal(await register(),draft.id);
  assert.equal(await register({id:randomUUID()}),draft.id);
  assert.equal(await count(),1);
  assert.equal(await scalar('select status as ok from commercial_manual_evidence where id=$1',[draft.id]),'pending');
  assert.equal(await scalar('select count(*)::int as ok from commercial_orders'),1);
  assert.equal(await scalar('select status as ok from commercial_orders where id=$1',[order]),'awaiting_payment');
  await assert.rejects(register({email:'parecido@example.invalid'}),/identidade_divergente|pedido_divergente/);
  await assert.rejects(register({id:randomUUID(),reference:draft.reference.toUpperCase()}),/evidencia_duplicada_divergente/);
  await assert.rejects(register({business:b2}),/pedido_divergente/);
  await assert.rejects(register({order:null,business:b2,id:randomUUID()}),/evidencia_duplicada_divergente/);
  await assert.rejects(register({reference:'outro-ficticio',operator:other}),/carteira_nao_autorizada/);
  await assert.rejects(register({id:randomUUID(),reference:'outro-ficticio',business:owned,order:null,profile:other}),/identidade_divergente/);
  await assert.rejects(register({date:'2099-01-01'}),/evidencia_invalida/);
  await assert.rejects(register({cnpj:'00000000000000'}),/pedido_divergente/);
  // Identidade/pagamento conferidos NAO significam acesso; carteira e negocio seguem obrigatorios.
  assert.equal(await review(draft.id,'checked',{identity:false}),false);
  assert.equal(await review(draft.id,'checked',{source:false}),false);
  assert.equal(await review(draft.id,'checked',{operator:other}),false);
  assert.equal(await review(draft.id,'checked',{business:b2}),false);
  assert.equal(await review(draft.id),true);
  assert.equal(await review(draft.id),true);
  assert.equal(await review(draft.id,'rejected'),false);
  assert.equal(await scalar('select status as ok from commercial_orders where id=$1',[order]),'awaiting_payment');
  assert.equal(await scalar('select profile_id as ok from businesses where id=$1',[business]),null);
  assert.equal(await scalar('select profile_id as ok from businesses where id=$1',[owned]),buyer);
  assert.equal(await scalar('select count(*)::int as ok from commercial_events'),0);
  const rejected={id:randomUUID(),reference:'contrato-recusado',source:'historical_contract',order:null};
  assert.equal(await register(rejected),rejected.id);
  assert.equal(await review(rejected.id,'rejected',{identity:false,source:false}),true);
  assert.equal(await review(rejected.id,'checked'),false);
  // Pedido estornado nunca sustenta uma nova conferencia ativa.
  await db.query("update commercial_orders set provider_charge_id='pay_initial' where id=$1",[order]);
  await db.query("insert into commercial_payment_events(provider_event_id,order_id,provider_charge_id,event_type,amount_cents,due_date) values('evt_refund_fixture',$1,'pay_initial','PAYMENT_REFUNDED',50000,'2026-10-20')",[order]);
  const refunded={id:randomUUID(),reference:'pix-ficticio-estornado'};
  assert.equal(await register(refunded),refunded.id);
  assert.equal(await review(refunded.id),false);
  assert.equal(await review(draft.id),false); // Replay nao revalida evidencia antiga apos estorno.
  assert.equal(await scalar('select profile_id as ok from businesses where id=$1',[owned]),buyer);
  assert.equal(await scalar('select count(*)::int as ok from commercial_orders'),1);
  // Privilegios reais, inclusive colunas imutaveis e negacao da Data API ao cliente.
  assert.equal(await scalar("select relrowsecurity as ok from pg_class where oid='commercial_manual_evidence'::regclass"),true);
  for(const role of ['anon','authenticated']) {
    assert.equal(await scalar("select has_table_privilege($1,'commercial_manual_evidence','SELECT') as ok",[role]),false);
    for(const sig of ['registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid)','revisar_evidencia_manual(uuid,uuid,uuid,text,text,boolean,boolean)'])
      assert.equal(await scalar('select has_function_privilege($1,$2,$3) as ok',[role,sig,'EXECUTE']),false);
  }
  assert.equal(await scalar("select has_column_privilege('service_role','commercial_manual_evidence','source_reference','UPDATE') as ok"),false);
  assert.equal(await scalar("select has_column_privilege('service_role','commercial_manual_evidence','review_note','UPDATE') as ok"),true);
  assert.equal(await scalar("select has_table_privilege('service_role','commercial_manual_evidence','DELETE') as ok"),false);
  await db.exec('grant select,update on businesses,commercial_orders,manager_accounts to service_role; grant select on commercial_payment_events to service_role; set role service_role');
  try {
    const service={id:randomUUID(),reference:'registro-role-servidor',order:null};
    assert.equal(await register(service),service.id);
    assert.equal(await review(service.id,'rejected'),true);
    await assert.rejects(db.query("update commercial_manual_evidence set source_reference='alterada' where id=$1",[service.id]),/permission denied/);
  } finally { await db.exec('reset role'); }
  console.log('PASS: verificacoes dirigidas + ACL/role. Registro, revisao, identidade, carteira, replay, estorno e ausencia de concessao/revogacao global. Postgres LOCAL.');
} finally {await db.close();}
