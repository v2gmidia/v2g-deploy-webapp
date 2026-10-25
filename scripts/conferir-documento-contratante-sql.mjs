/** Postgres descartavel LOCAL. Sem .env, rede, QA ou dados reais. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
const { PGlite } = await import(pathToFileURL(process.env.V2G_PGLITE_MODULE
  ?? 'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const migration='20261025215302_cpf_cnpj_contratante_v0.sql';
const ler=f=>readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8');

test('migration CPF/CNPJ: cadeia real, legado, RPCs, identidade, agenda, evidencia, ACL e rollback',async t=>{
  const db=new PGlite();
  const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0];
  const scalar=async(sql,args=[])=>Object.values(await one(sql,args))[0];
  const cpf='00000000191',cnpj='11222333000181',email='contratante@example.invalid';
  const criar=(doc,ref=randomUUID())=>scalar('select registrar_pedido_self_service($1,$2,$3,$4,$5,$6,1,$7,$8)',
    [ref,email,'Pessoa Ficticia','11999990000','Negocio Ficticio',doc,'monthly','asaas_card']);
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create function auth.uid() returns uuid language sql as 'select null::uuid';
      create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
      create table profiles(id uuid primary key);
      create table businesses(id uuid primary key default gen_random_uuid(),name text,claim_email text,profile_id uuid);
      create table ad_accounts(id uuid primary key);
      create function public.set_updated_at() returns trigger language plpgsql as 'begin new.updated_at=now();return new;end';
      create table leads_lp(id bigint primary key,cnpj text,email text,whatsapp text,vende_whatsapp boolean,
        pagina_origem text,utm_source text,utm_medium text,utm_campaign text,utm_content text,consentimento_em timestamptz,consentimento_texto text);`);
    for(const f of ['0026_contratacao_multiconta.sql','0029_pix_assistido.sql','0034_checkout_self_service.sql',
      '20261008223000_checkout_transparente_sandbox.sql','20261009015000_checkout_cartao_retentativa_qa.sql',
      '20261009042000_gestor_responsaveis_tarefas.sql','20261011140000_eventos_financeiros_sandbox.sql',
      '20261013031434_qa_registrar_falha_desafio_3ds.sql','20261014030000_onboarding_reserva_unica.sql',
      '20261018130000_ligar_lead_lp_pedido.sql','20261020021942_qa_cartao_mensal_3ds.sql',
      '20261021042254_assisted_asaas_orders.sql','20261022200400_manual_contract_evidence.sql']) await db.exec(ler(f));
    const legado=await criar(cnpj),legadoInvalido=await criar('12345678901234');
    const antes=await one('select id,business_id,cnpj from commercial_orders where id=$1',[legado]);
    await db.exec(ler(migration));
    await db.exec(ler(migration)); // Reexecucao deliberada no banco efemero.
    await t.test('CNPJ anterior preserva numero/IDs; tipo explicito e legado invalido nao e apagado',async()=>{
      const depois=await one('select id,business_id,cnpj,contractor_document_type from commercial_orders where id=$1',[legado]);
      assert.deepEqual(depois,{...antes,contractor_document_type:'cnpj'});
      await db.query('update commercial_orders set updated_at=now() where id=$1',[legadoInvalido]);
      assert.equal(await scalar('select cnpj from commercial_orders where id=$1',[legadoInvalido]),'12345678901234');
    });
    await t.test('checksum SQL aceita ambos, rejeita digitos/repeticao/mascara e nao consulta cadastro',async()=>{
      for(const d of [cpf,cnpj]) assert.equal(await scalar('select documento_contratante_valido($1)',[d]),true);
      for(const d of ['00000000192','11222333000182','00000000000','00000000000000','123','000.000.001-91','x'+cpf,null])
        assert.equal(await scalar('select documento_contratante_valido($1)',[d]),false);
      await assert.rejects(criar('00000000192'),/dados do pedido invalidos/);
      await assert.rejects(criar('12345678901234'),/dados do pedido invalidos/);
    });
    await db.query("update commercial_orders set status='payment_approved',payment_approved_at=now() where id=$1",[legado]);
    const ref=randomUUID(),p=await criar(cpf,ref),p2=await criar(cpf),p3=await criar(cnpj);
    const business=await scalar('select business_id from commercial_orders where id=$1',[p]);
    await t.test('CPF em compra; retry da mesma referencia e negocios separados mesmo email/documento',async()=>{
      assert.equal(await criar(cpf,ref),p);
      assert.equal(await scalar('select contractor_document_type from commercial_orders where id=$1',[p]),'cpf');
      const rows=(await db.query('select business_id from commercial_orders where id=any($1::uuid[])',[[legado,p,p2,p3]])).rows;
      assert.equal(new Set(rows.map(r=>r.business_id)).size,4);
      assert.equal(await scalar('select count(*)::int from commercial_orders where external_ref=$1',[ref]),1);
      await assert.rejects(criar(cnpj,ref),/referencia ja utilizada/);
      await assert.rejects(db.query("update commercial_orders set contractor_document_type='cnpj' where id=$1",[p]),/generated|DEFAULT/i);
      await assert.rejects(db.query("update commercial_orders set cnpj='00000000192' where id=$1",[p]),/documento_contratante_invalido/);
    });
    const operador=randomUUID();await db.query('insert into profiles values($1)',[operador]);
    await t.test('Pix direto e Asaas assistido aceitam CPF e preservam negocio por referencia',async()=>{
      const pix=await scalar('select registrar_pedido_pix_assistido($1,$2,$3,$4,1,$5)',[randomUUID(),email,'Pix Ficticio',cpf,'monthly']);
      assert.equal(await scalar('select contractor_document_type from commercial_orders where id=$1',[pix]),'cpf');
      const asaas=await scalar('select registrar_pedido_asaas_assistido($1,null,$2,$3,$4,$5,$6,1,$7,$8,$9)',
        [randomUUID(),email,'11999990000','Pessoa Ficticia','Asaas Ficticio',cpf,'monthly','asaas_card',operador]);
      assert.equal(await scalar('select contractor_document_type from commercial_orders where id=$1',[asaas]),'cpf');
    });
    await t.test('lead explicito conserva verificacoes e deduplicacao por ID sem fusao por documento',async()=>{
      await db.query("insert into leads_lp(id,cnpj,email,whatsapp,vende_whatsapp,consentimento_em,consentimento_texto) values(1,$1,$2,'11999990000',true,now(),'Consentimento ficticio de teste')",[cpf,email]);
      const args=[randomUUID(),email,'11999990000','Lead Ficticio',cpf,operador];
      const call=()=>scalar("select registrar_pedido_pix_assistido_com_lead($1,1,$2,$3,$4,$5,1,'monthly',$6)",args);
      const linked=await call();assert.equal(await call(),linked);
      assert.equal(await scalar('select contractor_document_type from commercial_orders where id=$1',[linked]),'cpf');
      assert.notEqual(await scalar('select business_id from commercial_orders where id=$1',[linked]),business);
    });
    await t.test('agenda aceita CPF/CNPJ e dois negocios com mesmo CPF, mantendo unicidade por negocio/horario',async()=>{
      const business2=await scalar('select business_id from commercial_orders where id=$1',[p2]);
      const agenda=(b,o,d,start)=>db.query("insert into onboarding_meetings(business_id,order_id,cnpj,calendar_id,starts_at,ends_at,status) values($1,$2,$3,'fixture',$4::timestamptz,$4::timestamptz+interval '25 minutes','pending')",[b,o,d,start]);
      await agenda(business,p,cpf,'2026-12-01T13:00:00Z');
      await agenda(business2,p2,cpf,'2026-12-01T14:00:00Z');
      await agenda(antes.business_id,legado,cnpj,'2026-12-01T15:00:00Z');
      assert.equal(await scalar("select count(*)::int from onboarding_meetings where contractor_document_type='cpf'"),2);
      await assert.rejects(agenda(business,p,cpf,'2026-12-02T13:00:00Z'),/unique/);
      await assert.rejects(agenda(business2,p2,'00000000192','2026-12-03T13:00:00Z'),/documento_contratante_invalido/);
    });
    await t.test('evidencia CPF exige pedido/negocio exatos, continua apenas documental',async()=>{
      await db.query('insert into manager_accounts(business_id,operator_profile_id,assigned_by) values($1,$2,$2)',[business,operador]);
      const evidence=randomUUID();
      const args=[evidence,business,p,email,cpf,operador];
      const call=()=>scalar("select registrar_evidencia_manual($1,$2,$3,null,$4,$5,'direct_pix','fixture-documento-25','2026-10-20',$6)",args);
      assert.equal(await call(),evidence);assert.equal(await call(),evidence);
      await assert.rejects(scalar("select registrar_evidencia_manual($1,$2,$3,null,$4,$5,'direct_pix','fixture-documento-divergente','2026-10-20',$6)",
        [randomUUID(),business,p,email,cnpj,operador]),/pedido_divergente/);
      assert.equal(await scalar('select contractor_document_type from commercial_manual_evidence where id=$1',[evidence]),'cpf');
      assert.equal(await scalar('select status from commercial_orders where id=$1',[p]),'awaiting_payment');
      assert.equal(await scalar('select profile_id from businesses where id=$1',[business]),null);
      assert.equal(await scalar('select count(*)::int from commercial_events where order_id=$1',[p]),0);
    });
    await t.test('RLS e ACL preservadas; validadores/RPCs nao abrem leitura nem escrita publica',async()=>{
      for(const table of ['commercial_orders','onboarding_meetings','commercial_manual_evidence'])
        assert.equal(await scalar('select relrowsecurity from pg_class where oid=$1::regclass',[table]),true);
      for(const role of ['anon','authenticated']) {
        assert.equal(await scalar("select has_table_privilege($1,'commercial_manual_evidence','SELECT')",[role]),false);
        assert.equal(await scalar("select has_function_privilege($1,'documento_contratante_valido(text)','EXECUTE')",[role]),false);
        assert.equal(await scalar("select has_function_privilege($1,'registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)','EXECUTE')",[role]),false);
      }
      await db.exec('grant select,insert,update on businesses,commercial_orders,commercial_order_units to service_role; set role service_role');
      try { assert.ok(await criar(cpf)); } finally { await db.exec('reset role'); }
    });
    await t.test('falha de precondicao aborta sem parcial; transacao explicitamente revertida',async()=>{
      await db.exec('alter table commercial_orders rename constraint commercial_orders_cnpj_check to unexpected_document_shape');
      await assert.rejects(db.exec(ler(migration)),/constraint_documental_divergente/);
      await db.exec('rollback');
      assert.equal(await scalar('select count(*)::int from commercial_orders where id=$1',[p]),1);
      assert.equal(await scalar('select contractor_document_type from commercial_orders where id=$1',[p]),'cpf');
    });
  } finally { await db.close(); }
});
