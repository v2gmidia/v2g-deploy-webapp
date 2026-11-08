import {readFileSync} from 'node:fs';
export const readiness='20261105194728_public_checkout_production_readiness.sql';
// Ordem de dependência de objetos reais. NÃO é instrução de push na produção.
export const cadeiaCheckout = [
  '0026_contratacao_multiconta.sql','0029_pix_assistido.sql','0034_checkout_self_service.sql',
  '20261008223000_checkout_transparente_sandbox.sql','20261009015000_checkout_cartao_retentativa_qa.sql',
  '20261009042000_gestor_responsaveis_tarefas.sql','20261011140000_eventos_financeiros_sandbox.sql',
  '20261013031434_qa_registrar_falha_desafio_3ds.sql','20261014030000_onboarding_reserva_unica.sql',
  '20261018130000_ligar_lead_lp_pedido.sql','20261018133000_checkout_security_controls.sql',
  '20261020021942_qa_cartao_mensal_3ds.sql','20261021033313_commercial_payment_email_outbox.sql',
  '20261021042254_assisted_asaas_orders.sql','20261022152629_asaas_estados_processamento.sql',
  '20261022200400_manual_contract_evidence.sql','20261025215302_cpf_cnpj_contratante_v0.sql',
];
export const sqlMigration = f=>readFileSync(new URL('../../supabase/migrations/'+f,import.meta.url),'utf8');
export async function prepararSchemaCheckout(db) {
  // Base mínima descartável; a cadeia comercial acima é SQL real sem recortes.
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create function auth.uid() returns uuid language sql as 'select null::uuid';
    create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
    create table profiles(id uuid primary key);
    create table businesses(id uuid primary key default gen_random_uuid(),name text,claim_email text,profile_id uuid);
    alter table businesses enable row level security;
    create table ad_accounts(id uuid primary key);
    create function public.set_updated_at() returns trigger language plpgsql as 'begin new.updated_at=now();return new;end';
    create table leads_lp(id bigint primary key,cnpj text,email text,whatsapp text,vende_whatsapp boolean,
      pagina_origem text,utm_source text,utm_medium text,utm_campaign text,utm_content text,consentimento_em timestamptz,consentimento_texto text);`);
  for(const f of cadeiaCheckout) await db.exec(sqlMigration(f));
}
