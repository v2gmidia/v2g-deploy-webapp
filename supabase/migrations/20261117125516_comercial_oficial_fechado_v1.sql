-- Production closed official release; composed from sealed candidate.
begin;
lock table public."ad_accounts",public."agency_advertisers",public."analysis_runs",public."business_memberships",public."businesses",public."campaigns",public."campanhas_criacao",public."campanhas_criacao_arquivadas_20260923",public."campanhas_meta",public."checkout_3ds_context",public."checkout_security_attempts",public."commercial_events",public."commercial_manual_evidence",public."commercial_order_units",public."commercial_orders",public."commercial_payment_email_outbox",public."commercial_payment_events",public."contract_documents",public."creative_publication_confirmations",public."creative_review_requests",public."creatives",public."criativos",public."criativos_arquivados_20260923",public."decisions",public."divergencias_de_cadastro",public."entrevistas",public."exclusoes_de_dados",public."execucoes",public."execucoes_arquivadas_20260924",public."execucoes_de_rotina",public."execucoes_teste_arquivadas_20260914",public."execucoes_teste_arquivadas_20260923",public."fiscal_documents",public."historical_contract_access",public."historical_contract_access_events",public."identidade_visual",public."itens_da_proposta",public."leads_lp",public."manager_accounts",public."manager_tasks",public."meta_connections",public."metricas_diarias",public."metricas_diarias_arquivadas_20260924",public."metrics_daily",public."narrativa_negocio",public."offers",public."perguntas_apresentadas",public."pessoas_do_negocio",public."profiles",public."propostas_de_perfil",public."respostas_do_dono",public."webapp_legacy_access" in share row exclusive mode;
do $v2g_preserve$
declare r record; n bigint; h text; expr text;
begin
 for r in select * from jsonb_to_recordset($v2g_expected$[{"name":"ad_accounts","checksum":"688300bad7e3a52c468bf466c435eeaa","row_count":5},{"name":"agency_advertisers","checksum":"822345d6aa324004eeb23d937108a3a7","row_count":1},{"name":"analysis_runs","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"business_memberships","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"businesses","checksum":"44952520dd799d5a9389c5e848cf4985","row_count":9},{"name":"campaigns","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"campanhas_criacao","checksum":"6b5b5e142eff10027cbd9e983701e706","row_count":1},{"name":"campanhas_criacao_arquivadas_20260923","checksum":"6f7b75275267936ccb9da6bd0f1a633a","row_count":5},{"name":"campanhas_meta","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"checkout_3ds_context","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"checkout_security_attempts","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_events","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_manual_evidence","checksum":"957d3e092056ac5811f1da492a5f4a98","row_count":1},{"name":"commercial_order_units","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_orders","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_payment_email_outbox","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_payment_events","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"contract_documents","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creative_publication_confirmations","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creative_review_requests","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creatives","checksum":"05718646553c097c3f8f6172ca8b10de","row_count":11},{"name":"criativos","checksum":"18c4fc9fcc4b03226cd8ac7a88a062d5","row_count":3},{"name":"criativos_arquivados_20260923","checksum":"690506c229442c4a3830a2a8f3956d64","row_count":22},{"name":"decisions","checksum":"263ca269c2f9f7e5198b89d93c15683a","row_count":29},{"name":"divergencias_de_cadastro","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"entrevistas","checksum":"3bc309b1dd246bb4f69c47c499673fc6","row_count":1},{"name":"exclusoes_de_dados","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"execucoes","checksum":"6489644f6173a9f315e1e4ba002b1905","row_count":26},{"name":"execucoes_arquivadas_20260924","checksum":"69aa127315de6f194ee2b0d527dfba36","row_count":2},{"name":"execucoes_de_rotina","checksum":"4ee081cba3f4c497b39ceeead7c68ee4","row_count":222},{"name":"execucoes_teste_arquivadas_20260914","checksum":"931b3097ba6b09dbd6615cc5691e52ad","row_count":20},{"name":"execucoes_teste_arquivadas_20260923","checksum":"21e66eb481ec373ce5d6d39defb24ef7","row_count":8},{"name":"fiscal_documents","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"historical_contract_access","checksum":"a8ecc880375949d5a5ed95c86d68b595","row_count":1},{"name":"historical_contract_access_events","checksum":"dae11f9e522468e211d15916ab737e6c","row_count":2},{"name":"identidade_visual","checksum":"c2f45d795c7bdf52e9bb883304dd8630","row_count":2},{"name":"itens_da_proposta","checksum":"231066ba8d45876e4b7426d0ec731790","row_count":40},{"name":"leads_lp","checksum":"cbccbb6cb2c96ab7836fbf53023fd7b9","row_count":2},{"name":"manager_accounts","checksum":"8428d884960677d275ba81087d4453f0","row_count":1},{"name":"manager_tasks","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"meta_connections","checksum":"2f70c483b188543eb00b49db88ef5831","row_count":3},{"name":"metricas_diarias","checksum":"8bd6edb6efe63ac0b722761a1a15e78e","row_count":3},{"name":"metricas_diarias_arquivadas_20260924","checksum":"9aa955cc247b248b94e0ff56ecbb242d","row_count":24},{"name":"metrics_daily","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"narrativa_negocio","checksum":"6c6bf680321ec33583f1ccaa172d6b73","row_count":2},{"name":"offers","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"perguntas_apresentadas","checksum":"4a9b166948bae40fe50fa7d8eaedfa03","row_count":37},{"name":"pessoas_do_negocio","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"profiles","checksum":"80c1dc66c6fddfcd3e98468e8eb90834","row_count":10},{"name":"propostas_de_perfil","checksum":"09ff36a115afe4577a0a37c82acabcaf","row_count":2},{"name":"respostas_do_dono","checksum":"d64ee1f764a173f1b09846d6c2865f70","row_count":5},{"name":"webapp_legacy_access","checksum":"7c48c950e9844c029fdb082fdd447b19","row_count":10}]$v2g_expected$::jsonb) as x(name text,row_count bigint,checksum text) loop
  expr:=case r.name when 'commercial_orders' then $e$to_jsonb(t)-array['intake_context_id','intake_snapshot','intake_source','contractor_type']$e$
   when 'commercial_order_units' then $e$to_jsonb(t)-array['intake_context_id','intake_unit_id','advertiser_name','advertiser_business_id']$e$ else 'to_jsonb(t)' end;
  execute format('select count(*),md5(coalesce(string_agg((%s)::text,'''' order by (%s)::text),'''')) from public.%I t',expr,expr,r.name) into n,h;
  if n is distinct from r.row_count or h is distinct from r.checksum then raise exception 'v2g_preservacao_divergente: %',r.name; end if;
 end loop;
end $v2g_preserve$;

-- CANDIDATO LOCAL OFICIAL. NÃO APLICADO. Projeto de destino: ushccxpoxjikzqnwhgfd.
-- Aplicação transacional única; identificação do projeto deve ser conferida externamente.

lock table public.commercial_orders,public.commercial_order_units,public.commercial_payment_events,public.businesses,public.agency_advertisers in share row exclusive mode;
do $preflight$
declare n text;
begin
 if (select md5(p.prosrc) from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='private' and p.proname='handle_new_user' and p.pronargs=0) is distinct from 'd48490e0ecc1986e5ee504b861eabdac' then raise exception 'comercial_oficial_cadastro_baseline_divergente';end if;
 foreach n in array array['commercial_intake_contexts','commercial_intake_units','commercial_intake_audit','commercial_internal_notice_outbox','commercial_nominal_contractors_v1','commercial_nominal_unit_bindings_v1','commercial_nominal_audit_v1','commercial_nominal_subscriptions_v1','commercial_nominal_cycles_v1','commercial_nominal_renewal_events_v1']loop
 if to_regclass('public.'||n) is not null then raise exception 'comercial_oficial_objeto_ja_existente:%',n;end if;end loop;
 if to_regprocedure('public.comercial_oficial_schema_v1()') is not null then raise exception 'comercial_oficial_prontidao_ja_existente';end if;
 if not exists(select 1 from pg_attribute where attrelid='public.ad_accounts'::regclass and attname='business_id' and not attisdropped) then raise exception 'comercial_oficial_conta_sem_negocio';end if;
 if (select md5(prosrc) from pg_proc where oid=to_regprocedure('public.documento_contratante_valido(text)')) is distinct from '94aba718a81c9fb4a93c9bd4d6fc6a42' then raise exception 'comercial_oficial_documento_baseline_divergente';end if;
end $preflight$;
-- Dependência selada: docs/qa/comercial-v1/migration.sql
-- Aplicado exclusivamente na QA zskpijnqgkqwxksqmzmf em 16/11/2026.
-- Ledger MCP 20261116040803; evidência e hash do SQL aplicado em applied-qa.json.
-- Não depende de nem altera businesses/orders/Auth/Asaas/Meta/entitlements.

create table public.commercial_intake_contexts (
 id uuid primary key,
 schema_version text not null default 'v2g.comercial.v1' check(schema_version='v2g.comercial.v1'),
 original_data jsonb not null check(jsonb_typeof(original_data)='object'),
 confirmed_data jsonb check(jsonb_typeof(confirmed_data)='object'),
 source jsonb not null check(jsonb_typeof(source)='object' and source->>'kind' in ('compra_direta','lead_lp')),
 recipient_email text not null check(recipient_email=lower(btrim(recipient_email))),
 session_hash text not null check(session_hash ~ '^[0-9a-f]{64}$'),
 resume_hash text not null check(resume_hash ~ '^[0-9a-f]{64}$'),
 exchanged_at timestamptz,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '30 minutes',
 confirmed_at timestamptz,
 confirmed_by uuid,
 check((confirmed_data is null and confirmed_at is null) or (confirmed_data is not null and confirmed_at is not null))
);
create unique index commercial_intake_source_once on public.commercial_intake_contexts((source->>'sourceSystem'),(source->>'leadId')) where source->>'kind'='lead_lp';
create table public.commercial_intake_units (
 context_id uuid not null references public.commercial_intake_contexts(id) on delete restrict,
 id uuid not null,
 ordinal integer not null check(ordinal between 1 and 100),
 advertiser_name text not null check(length(btrim(advertiser_name)) between 2 and 200),
 primary key(context_id,id), unique(context_id,ordinal)
);
create table public.commercial_intake_audit (
 id bigint generated always as identity primary key,
 context_id uuid not null references public.commercial_intake_contexts(id) on delete restrict,
 event_type text not null check(event_type in ('created','confirmed')),
 actor_profile_id uuid,
 actor_kind text not null check(actor_kind in ('lp_server','browser_session','verified_profile')),
 before_data jsonb, after_data jsonb not null,
 recorded_at timestamptz not null default now(), unique(context_id,event_type)
);
alter table public.commercial_intake_contexts enable row level security;
alter table public.commercial_intake_units enable row level security;
alter table public.commercial_intake_audit enable row level security;
revoke all on public.commercial_intake_contexts,public.commercial_intake_units,public.commercial_intake_audit from public,anon,authenticated;
revoke all on public.commercial_intake_contexts,public.commercial_intake_units,public.commercial_intake_audit from service_role;
grant select,insert on public.commercial_intake_contexts to service_role;
grant update(session_hash,exchanged_at,confirmed_data,confirmed_at,confirmed_by) on public.commercial_intake_contexts to service_role;
grant select,insert on public.commercial_intake_units,public.commercial_intake_audit to service_role;
grant usage,select on sequence public.commercial_intake_audit_id_seq to service_role;

create function public.commercial_intake_validate_final(p jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare n integer; u jsonb; ids uuid[] := '{}'; uid uuid; expected integer; k text;
begin
 foreach k in array array['schemaVersion','contractorType','referencia','email','nome','razaoSocial','whatsapp','cnpj','periodo','metodo','vendeWhatsApp'] loop
  if jsonb_typeof(p->k) is distinct from 'string' or p->>k ~ '[[:cntrl:]]' then return false; end if;
 end loop;
 if jsonb_typeof(p->'contas') is distinct from 'number' or jsonb_typeof(p->'totalCentavos') is distinct from 'number' then return false; end if;
 if jsonb_typeof(p)<>'object' or p->>'schemaVersion'<>'v2g.comercial.v1'
   or p->>'contractorType' not in ('direct','agency') or p->>'referencia' is null
   or p->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   or p->>'email'<>lower(btrim(p->>'email'))
   or length(p->>'nome') not between 3 and 120 or p->>'nome' !~ '^[^[:space:]]+[[:space:]]+[^[:space:]]+'
   or length(p->>'razaoSocial') not between 2 and 200 or p->>'whatsapp' !~ '^[0-9]{10,13}$'
   or not public.documento_contratante_valido(p->>'cnpj')
   or p->>'periodo' not in ('monthly','semiannual_upfront','annual_upfront')
   or p->>'metodo' not in ('asaas_pix','asaas_card')
   or p->>'vendeWhatsApp'<>'sim'
   or (p->>'periodo'='monthly' and p->>'metodo'<>'asaas_card')
   or jsonb_typeof(p->'units')<>'array' or p->>'contas' !~ '^[1-9][0-9]{0,2}$' then return false; end if;
 n := (p->>'contas')::integer;
 if n not between 1 and 100 or jsonb_array_length(p->'units')<>n or (p->>'contractorType'='direct' and n<>1) then return false; end if;
 expected := n*case p->>'periodo' when 'monthly' then 50000 when 'semiannual_upfront' then 285000 else 528000 end;
 if (p->>'totalCentavos')::integer is distinct from expected then return false; end if;
 for u in select value from jsonb_array_elements(p->'units') loop
   if jsonb_typeof(u) is distinct from 'object' or jsonb_typeof(u->'id') is distinct from 'string'
     or jsonb_typeof(u->'advertiserName') is distinct from 'string' then return false; end if;
   uid := (u->>'id')::uuid;
   if uid is null or uid=any(ids) or u->>'advertiserName' is null or length(btrim(u->>'advertiserName')) not between 2 and 200
      or u->>'advertiserName' ~ '[[:cntrl:]]' then return false; end if;
   ids:=array_append(ids,uid);
 end loop;
 -- Missing required JSON keys must not pass SQL NULL comparisons.
 return p ?& array['contractorType','schemaVersion','referencia','email','nome','razaoSocial','whatsapp','cnpj','periodo','metodo','contas','units','totalCentavos']
   and not exists(select 1 from jsonb_each(p) e where e.value='null'::jsonb);
exception when others then return false;
end $$;

create function public.criar_contexto_comercial_v1(p_id uuid,p_original jsonb,p_source jsonb,p_session_hash text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.commercial_intake_contexts%rowtype; email text;
begin
 if p_id is null or p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$'
   or jsonb_typeof(p_original) is distinct from 'object' or jsonb_typeof(p_source) is distinct from 'object'
   or p_source->>'kind' is null or p_source->>'kind' not in ('compra_direta','lead_lp') then raise exception 'contexto_invalido'; end if;
 if (p_source->>'kind'='compra_direta' and (not public.commercial_intake_validate_final(p_original) or (p_original->>'referencia')::uuid<>p_id))
   or (p_source->>'kind'='lead_lp' and (p_original->>'schemaVersion' is distinct from 'v2g.comercial.lead.v1'
       or (p_original->>'reference')::uuid is distinct from p_id or p_source->>'sourceSystem' is distinct from 'v2g_site.commercial_leads.v1'
       or p_source->>'leadId' is null or p_source->>'leadId' !~ '^[1-9][0-9]{0,18}$'
       or (p_source->>'leadId')::numeric>9223372036854775807)) then raise exception 'origem_invalida'; end if;
 email:=lower(btrim(p_original->>'email'));
 if email is null or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'destinatario_invalido'; end if;
 perform pg_advisory_xact_lock(hashtextextended('commercial-intake:'||p_id::text,0));
 select * into r from public.commercial_intake_contexts where id=p_id for update;
 if found then
   if r.original_data=p_original and r.source=p_source and r.resume_hash=p_session_hash then return r.id; end if;
   raise exception 'referencia_divergente';
 end if;
 insert into public.commercial_intake_contexts(id,original_data,source,recipient_email,session_hash,resume_hash)
 values(p_id,p_original,p_source,email,p_session_hash,p_session_hash);
 insert into public.commercial_intake_audit(context_id,event_type,actor_kind,after_data)
 values(p_id,'created',case when p_source->>'kind'='lead_lp' then 'lp_server' else 'browser_session' end,p_original);
 return p_id;
end $$;

create function public.confirmar_contexto_comercial_v1(p_id uuid,p_final jsonb,p_session_hash text,p_actor uuid,p_verified_email text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.commercial_intake_contexts%rowtype; u jsonb; ordinal integer := 0;
begin
 select * into r from public.commercial_intake_contexts where id=p_id for update;
 if not found or r.expires_at<=now() then raise exception 'contexto_indisponivel'; end if;
 -- Values below are supplied only by authenticated server code. Public roles cannot execute.
 if not ((coalesce(r.session_hash=p_session_hash,false) and (r.source->>'kind'='compra_direta' or r.exchanged_at is not null))
   or (p_actor is not null and r.recipient_email=p_verified_email)) then raise exception 'contexto_indisponivel'; end if;
 if not public.commercial_intake_validate_final(p_final) or (p_final->>'referencia')::uuid is distinct from p_id
   or p_final->>'email' is distinct from r.recipient_email then raise exception 'confirmacao_invalida'; end if;
 if r.confirmed_data is not null then
   if r.confirmed_data=p_final then return r.id; end if;
   raise exception 'confirmacao_divergente';
 end if;
 update public.commercial_intake_contexts set confirmed_data=p_final,confirmed_at=now(),confirmed_by=p_actor where id=p_id;
 for u in select value from jsonb_array_elements(p_final->'units') loop
   ordinal:=ordinal+1;
   insert into public.commercial_intake_units(context_id,id,ordinal,advertiser_name) values(p_id,(u->>'id')::uuid,ordinal,btrim(u->>'advertiserName'));
 end loop;
 insert into public.commercial_intake_audit(context_id,event_type,actor_profile_id,actor_kind,before_data,after_data)
 values(p_id,'confirmed',p_actor,case when p_actor is null then 'browser_session' else 'verified_profile' end,r.original_data,p_final);
 return p_id;
end $$;
create function public.trocar_retomada_comercial_v1(p_id uuid,p_resume_hash text,p_session_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 update public.commercial_intake_contexts set session_hash=p_session_hash,exchanged_at=now()
 where id=p_id and source->>'kind'='lead_lp' and resume_hash=p_resume_hash
   and exchanged_at is null and confirmed_at is null and expires_at>now();
 return found;
end $$;
revoke all on function public.commercial_intake_validate_final(jsonb),public.criar_contexto_comercial_v1(uuid,jsonb,jsonb,text),public.confirmar_contexto_comercial_v1(uuid,jsonb,text,uuid,text) from public,anon,authenticated;
grant execute on function public.commercial_intake_validate_final(jsonb),public.criar_contexto_comercial_v1(uuid,jsonb,jsonb,text),public.confirmar_contexto_comercial_v1(uuid,jsonb,text,uuid,text) to service_role;
revoke all on function public.trocar_retomada_comercial_v1(uuid,text,text) from public,anon,authenticated;
grant execute on function public.trocar_retomada_comercial_v1(uuid,text,text) to service_role;


-- Dependência selada: docs/qa/comercial-financeiro-v1/migration.sql
-- RASCUNHO LOCAL, NÃO APLICADO. Pré-requisitos: schema comercial v1 QA e ledger
-- financeiro consolidado. Não redefine funções/tabelas/policies anteriores.

alter table public.commercial_orders
 add column intake_context_id uuid unique references public.commercial_intake_contexts(id),
 add column intake_snapshot jsonb,
 add column intake_source jsonb,
 add column contractor_type text check(contractor_type in ('direct','agency')),
 add constraint commercial_order_intake_snapshot check(intake_context_id is null or
  (intake_snapshot is not null and jsonb_typeof(intake_snapshot)='object'
   and intake_source is not null and jsonb_typeof(intake_source)='object' and contractor_type is not null));
create unique index commercial_orders_intake_pair on public.commercial_orders(id,intake_context_id);
alter table public.commercial_order_units
 add column intake_context_id uuid,
 add column intake_unit_id uuid,
 add column advertiser_name text,
 add column advertiser_business_id uuid references public.businesses(id),
 add constraint commercial_unit_intake_order foreign key(order_id,intake_context_id)
  references public.commercial_orders(id,intake_context_id),
 add constraint commercial_unit_intake_original foreign key(intake_context_id,intake_unit_id)
  references public.commercial_intake_units(context_id,id),
 add constraint commercial_unit_intake_nominal check(
  (intake_context_id is null and intake_unit_id is null and advertiser_name is null and advertiser_business_id is null) or
  (intake_context_id is not null and intake_unit_id is not null and advertiser_name is not null
   and length(btrim(advertiser_name)) between 2 and 200));
create unique index commercial_unit_intake_once on public.commercial_order_units(intake_context_id,intake_unit_id)
 where intake_context_id is not null;

create table public.commercial_internal_notice_outbox (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.commercial_orders(id),
 provider_charge_id text not null,
 notice_type text not null check(notice_type='payment_confirmed'),
 status text not null default 'blocked' check(status in ('blocked','queued','sending','accepted','review')),
 payload jsonb, provider_message_id text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(order_id,provider_charge_id,notice_type),
 check(status='blocked' or (payload is not null and jsonb_typeof(payload)='object')),
 check(status<>'accepted' or provider_message_id is not null)
);
alter table public.commercial_internal_notice_outbox enable row level security;
revoke all on public.commercial_internal_notice_outbox from public,anon,authenticated,service_role;
grant select,insert on public.commercial_internal_notice_outbox to service_role;
grant update(status,payload,provider_message_id,updated_at) on public.commercial_internal_notice_outbox to service_role;

create function public.preservar_pedido_contexto_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.intake_context_id is not null then raise exception 'pedido_contexto_utilizado_preservar'; end if;
  return old;
 end if;
 if old.intake_context_id is null and new.intake_context_id is not null then raise exception 'pedido_legado_preservar'; end if;
 if old.intake_context_id is not null and
  (row(new.intake_context_id,new.intake_snapshot,new.intake_source,new.contractor_type,new.external_ref,
   new.buyer_email,new.legal_name,new.cnpj,new.unit_count,new.total_cents,new.billing_period,new.payment_method)
   is distinct from row(old.intake_context_id,old.intake_snapshot,old.intake_source,old.contractor_type,old.external_ref,
   old.buyer_email,old.legal_name,old.cnpj,old.unit_count,old.total_cents,old.billing_period,old.payment_method)
   or new.business_id is not null) then raise exception 'pedido_contexto_imutavel_acesso_pendente'; end if;
 return new;
end $$;
create trigger commercial_order_intake_immutable before update or delete on public.commercial_orders
 for each row execute function public.preservar_pedido_contexto_v1();
create function public.preservar_unidade_contexto_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.commercial_orders%rowtype; nominal jsonb;
begin
 if TG_OP='INSERT' then
  select * into parent from public.commercial_orders where id=new.order_id for key share;
  if not found then return new; end if; -- FK existente continua responsável por pai ausente.
  if parent.intake_context_id is null then
   if new.intake_context_id is not null or new.intake_unit_id is not null or new.advertiser_name is not null
     or new.advertiser_business_id is not null then raise exception 'unidade_legada_preservar'; end if;
   return new;
  end if;
  if new.intake_context_id is distinct from parent.intake_context_id or new.intake_unit_id is null
    or new.ordinal is null or new.ordinal not between 1 and parent.unit_count
    or new.advertiser_business_id is not null or new.ad_account_id is not null then raise exception 'unidade_contexto_insercao_divergente'; end if;
  nominal:=parent.intake_snapshot->'units'->(new.ordinal-1);
  if (nominal->>'id')::uuid is distinct from new.intake_unit_id
    or btrim(nominal->>'advertiserName') is distinct from new.advertiser_name
    or not exists(select 1 from public.commercial_intake_units u where u.context_id=parent.intake_context_id
      and u.id=new.intake_unit_id and u.advertiser_name=new.advertiser_name) then raise exception 'unidade_contexto_insercao_divergente'; end if;
  return new;
 end if;
 if TG_OP='DELETE' then
  if old.intake_context_id is not null then raise exception 'unidade_contexto_utilizada_preservar'; end if;
  return old;
 end if;
 -- UPDATE também deve respeitar o destino: MATCH SIMPLE não impede que uma
 -- linha legada sem metadados seja movida para um pedido v1.
 select * into parent from public.commercial_orders where id=new.order_id for key share;
 if found and parent.intake_context_id is not null and
  (old.intake_context_id is null or new.intake_context_id is distinct from parent.intake_context_id)
  then raise exception 'unidade_contexto_update_destino_divergente'; end if;
 if (old.intake_context_id is null and new.intake_context_id is not null) or
   (old.intake_context_id is not null and (row(new.id,new.order_id,new.ordinal,new.intake_context_id,new.intake_unit_id,new.advertiser_name)
    is distinct from row(old.id,old.order_id,old.ordinal,old.intake_context_id,old.intake_unit_id,old.advertiser_name)
    or new.advertiser_business_id is not null or new.ad_account_id is not null)) then raise exception 'unidade_contexto_imutavel_escopo_pendente'; end if;
 return new;
end $$;
create trigger commercial_unit_intake_immutable before insert or update or delete on public.commercial_order_units
 for each row execute function public.preservar_unidade_contexto_v1();

create function public.criar_pedido_contexto_v1(p_context uuid,p_session_hash text,p_actor uuid,p_verified_email text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.commercial_intake_contexts%rowtype; o public.commercial_orders%rowtype;
 d jsonb; unit jsonb; uid uuid; count_units integer; n integer;
begin
 select * into c from public.commercial_intake_contexts where id=p_context for update;
 if not found or c.confirmed_at is null or not public.commercial_intake_validate_final(c.confirmed_data)
  or not ((coalesce(c.session_hash=p_session_hash,false) and (c.source->>'kind'='compra_direta' or c.exchanged_at is not null))
   or (p_actor is not null and p_verified_email=c.recipient_email)) then raise exception 'contexto_indisponivel'; end if;
 -- Capacidade autoriza o rascunho, não autoriza associar a pessoa ativa errada.
 if (p_actor is null)<>(p_verified_email is null) then raise exception 'ator_email_inconsistentes'; end if;
 if p_actor is not null then
  if p_verified_email is distinct from c.recipient_email then raise exception 'ator_email_inconsistentes'; end if;
  -- Papel servidor sem SELECT Auth: getUser() na action atesta este par.
  -- Nunca aceitar ator/e-mail do formulário; service_role é a autoridade aqui.
 end if;
 select * into o from public.commercial_orders where intake_context_id=p_context;
 -- Replay de um pedido já criado não depende do relógio do rascunho, mas continua autorizado.
 if found then
  if o.intake_snapshot is distinct from c.confirmed_data or o.intake_source is distinct from c.source then raise exception 'contexto_divergente_do_pedido'; end if;
  return o.id;
 end if;
 if c.expires_at<=now() then raise exception 'contexto_expirado'; end if;
 d:=c.confirmed_data; n:=(d->>'contas')::integer;
 select count(*) into count_units from public.commercial_intake_units where context_id=p_context;
 if count_units<>n or d->>'email' is distinct from c.recipient_email then raise exception 'unidades_divergentes'; end if;
 for unit in select value from jsonb_array_elements(d->'units') loop
  if not exists(select 1 from public.commercial_intake_units u where u.context_id=p_context
   and u.id=(unit->>'id')::uuid and u.advertiser_name=btrim(unit->>'advertiserName')) then raise exception 'unidades_divergentes'; end if;
 end loop;
 -- Não cria/reaproveita businesses nem chama a função self_service legada.
 insert into public.commercial_orders(external_ref,buyer_email,buyer_name,buyer_whatsapp,buyer_profile_id,business_id,
  legal_name,cnpj,declares_cnpj,sells_by_whatsapp,origin,payment_method,billing_period,unit_price_cents,
  discount_percent,unit_count,total_cents,status,intake_context_id,intake_snapshot,intake_source,contractor_type)
 values('commercial-v1:'||p_context::text,c.recipient_email,d->>'nome',d->>'whatsapp',p_actor,null,
  d->>'razaoSocial',d->>'cnpj',true,true,'self_service',d->>'metodo',d->>'periodo',50000,
  case d->>'periodo' when 'monthly' then 0 when 'semiannual_upfront' then 5 else 12 end,n,
  (d->>'totalCentavos')::integer,'awaiting_payment',p_context,d,c.source,d->>'contractorType') returning id into uid;
 n:=0;
 for unit in select value from jsonb_array_elements(d->'units') loop
  n:=n+1;
  insert into public.commercial_order_units(order_id,ordinal,intake_context_id,intake_unit_id,advertiser_name)
   values(uid,n,p_context,(unit->>'id')::uuid,btrim(unit->>'advertiserName'));
 end loop;
 return uid;
exception when unique_violation then raise exception 'conflito_de_contexto_sem_reaproveitar_pagador';
end $$;

create function public.reservar_pagamento_contexto_v1(p_order uuid,p_customer text,p_due date)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_customer is null or p_customer !~ '^cus_[A-Za-z0-9]+$' or p_due is null then return false; end if;
 update public.commercial_orders set payment_creation_started_at=now(),provider_customer_id=p_customer,
  provider_first_due_date=p_due,updated_at=now()
 where id=p_order and intake_context_id is not null and status='awaiting_payment'
  and payment_creation_started_at is null and provider_charge_id is null and provider_subscription_id is null;
 return found;
end $$;

create function public.vincular_cobranca_contexto_v1(p_order uuid,p_customer text,p_charge text,p_due date)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;
begin
 if p_charge is null or p_charge !~ '^pay_[A-Za-z0-9]+$' then return false; end if;
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or o.intake_context_id is null or o.payment_creation_started_at is null
  or o.provider_customer_id is distinct from p_customer or o.provider_first_due_date is distinct from p_due then return false; end if;
 if o.provider_charge_id is not null then return o.provider_charge_id=p_charge; end if;
 if o.status<>'awaiting_payment' or o.provider_subscription_id is not null then return false; end if;
 update public.commercial_orders set provider_charge_id=p_charge,updated_at=now() where id=p_order;
 return true;
end $$;

create function public.registrar_pagamento_contexto_v1(p_order uuid,p_event text,p_type text,p_customer text,
 p_charge text,p_amount integer,p_due date)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype; prior public.commercial_payment_events%rowtype; negative boolean;
begin
 if p_event is null or length(p_event) not between 5 and 200 or p_type is null or p_type not in
 ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_AUTHORIZED','PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
  'PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL') then return false; end if;
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or o.intake_context_id is null or o.provider_charge_id is null
  or o.provider_charge_id is distinct from p_charge or o.provider_customer_id is distinct from p_customer
  or o.total_cents is distinct from p_amount or o.provider_first_due_date is distinct from p_due
  or o.status not in ('awaiting_payment','payment_approved') then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended('financial-event:'||p_event,0));
 select * into prior from public.commercial_payment_events where provider_event_id=p_event;
 if found then return prior.order_id=p_order and prior.provider_charge_id=p_charge and prior.event_type=p_type
   and prior.provider_subscription_id is null and prior.amount_cents=p_amount and prior.due_date=p_due; end if;
 if exists(select 1 from public.commercial_events where source='asaas' and external_event_id=p_event) then return false; end if;
 insert into public.commercial_payment_events(provider_event_id,order_id,provider_charge_id,provider_subscription_id,event_type,amount_cents,due_date)
 values(p_event,p_order,p_charge,null,p_type,p_amount,p_due);
 if p_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') then
  select exists(select 1 from public.commercial_payment_events where order_id=p_order and provider_charge_id=p_charge
    and event_type in ('PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
    'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED','PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED',
    'PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL')) into negative;
  if not negative then
   update public.commercial_orders set status='payment_approved',payment_approved_at=coalesce(payment_approved_at,now()),updated_at=now() where id=p_order;
   insert into public.commercial_events(order_id,source,external_event_id,event_type) values(p_order,'asaas',p_event,p_type);
   insert into public.commercial_internal_notice_outbox(order_id,provider_charge_id,notice_type)
    values(p_order,p_charge,'payment_confirmed') on conflict(order_id,provider_charge_id,notice_type) do nothing;
  end if;
 end if;
 return true;
end $$;

create function public.preparar_efeitos_contexto_v1(p_order uuid,p_charge text,p_buyer jsonb,p_internal jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype; existing jsonb;
begin
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or o.intake_context_id is null or o.status<>'payment_approved' or o.provider_charge_id is distinct from p_charge
  or exists(select 1 from public.commercial_payment_events where order_id=p_order and provider_charge_id=p_charge
   and event_type not in ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_AUTHORIZED','PAYMENT_AWAITING_RISK_ANALYSIS',
    'PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE')) then return false; end if;
 if p_buyer is not null then
  if jsonb_typeof(p_buyer) is distinct from 'object' or jsonb_typeof(p_buyer->'to') is distinct from 'array'
   or jsonb_array_length(p_buyer->'to')<>1 or jsonb_typeof(p_buyer->'to'->0) is distinct from 'string'
   or jsonb_typeof(p_buyer->'text') is distinct from 'string' or jsonb_typeof(p_buyer->'from') is distinct from 'string'
   or p_buyer->>'from' ~ '[[:cntrl:]]' then return false; end if;
  select payload into existing from public.commercial_payment_email_outbox where order_id=p_order and provider_charge_id=p_charge;
  if found and existing is distinct from p_buyer then return false; end if;
  insert into public.commercial_payment_email_outbox(order_id,provider_charge_id,payload)
   values(p_order,p_charge,p_buyer) on conflict(order_id,provider_charge_id) do nothing;
 end if;
 if p_internal is not null then
  if jsonb_typeof(p_internal) is distinct from 'object' or jsonb_typeof(p_internal->'to') is distinct from 'array'
   or jsonb_array_length(p_internal->'to')<>1 or jsonb_typeof(p_internal->'to'->0) is distinct from 'string'
   or jsonb_typeof(p_internal->'text') is distinct from 'string' then raise exception 'preparacao_invalida'; end if;
  select payload into existing from public.commercial_internal_notice_outbox where order_id=p_order and provider_charge_id=p_charge and notice_type='payment_confirmed';
  if existing is not null and existing is distinct from p_internal then raise exception 'preparacao_divergente'; end if;
  update public.commercial_internal_notice_outbox set payload=p_internal,status='queued',updated_at=now()
   where order_id=p_order and provider_charge_id=p_charge and notice_type='payment_confirmed' and status='blocked';
 end if;
 return true;
end $$;

revoke all on function public.preservar_pedido_contexto_v1(),public.preservar_unidade_contexto_v1(),public.criar_pedido_contexto_v1(uuid,text,uuid,text),
 public.reservar_pagamento_contexto_v1(uuid,text,date),public.vincular_cobranca_contexto_v1(uuid,text,text,date),
 public.registrar_pagamento_contexto_v1(uuid,text,text,text,text,integer,date),public.preparar_efeitos_contexto_v1(uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.preservar_pedido_contexto_v1(),public.preservar_unidade_contexto_v1(),public.criar_pedido_contexto_v1(uuid,text,uuid,text),
 public.reservar_pagamento_contexto_v1(uuid,text,date),public.vincular_cobranca_contexto_v1(uuid,text,text,date),
 public.registrar_pagamento_contexto_v1(uuid,text,text,text,text,integer,date),public.preparar_efeitos_contexto_v1(uuid,text,jsonb,jsonb) to service_role;


-- Dependência selada: docs/qa/cobertura-nominal-v1/migration.sql
-- CANDIDATO LOCAL QA. Não aplicado. Requer intake, financeiro 6DB e agência QA.

create unique index commercial_nominal_unit_identity on public.commercial_order_units(id,order_id,intake_context_id,intake_unit_id);
create unique index commercial_nominal_account_business on public.ad_accounts(id,business_id);
create table public.commercial_nominal_contractors_v1(
 order_id uuid primary key,context_id uuid not null,owner_profile_id uuid not null references public.profiles(id),
 buyer_email text not null,contractor_business_id uuid not null,selection jsonb not null,created_at timestamptz not null default now(),
 foreign key(order_id,context_id) references public.commercial_orders(id,intake_context_id),
 foreign key(contractor_business_id,owner_profile_id) references public.businesses(id,profile_id),
 unique(order_id,context_id,owner_profile_id,buyer_email,contractor_business_id)
);
create table public.commercial_nominal_unit_bindings_v1(
 order_id uuid not null,context_id uuid not null,unit_id uuid primary key,intake_unit_id uuid not null,
 owner_profile_id uuid not null,buyer_email text not null,contractor_business_id uuid not null,
 advertiser_business_id uuid not null,ad_account_id uuid,selection jsonb not null,
 created_at timestamptz not null default now(),account_bound_at timestamptz,
 foreign key(unit_id,order_id,context_id,intake_unit_id) references public.commercial_order_units(id,order_id,intake_context_id,intake_unit_id),
 foreign key(order_id,context_id,owner_profile_id,buyer_email,contractor_business_id)
 references public.commercial_nominal_contractors_v1(order_id,context_id,owner_profile_id,buyer_email,contractor_business_id),
 foreign key(advertiser_business_id,owner_profile_id) references public.businesses(id,profile_id),
 foreign key(ad_account_id,advertiser_business_id) references public.ad_accounts(id,business_id),
 unique(order_id,ad_account_id),check((ad_account_id is null)=(account_bound_at is null))
);
create table public.commercial_nominal_audit_v1(
 id bigint generated always as identity primary key,unit_id uuid not null references public.commercial_nominal_unit_bindings_v1(unit_id),
 event_type text not null check(event_type in ('unit_bound','account_bound')),
 binding jsonb not null,created_at timestamptz not null default now(),unique(unit_id,event_type)
);
alter table public.commercial_nominal_contractors_v1 enable row level security;
alter table public.commercial_nominal_unit_bindings_v1 enable row level security;
alter table public.commercial_nominal_audit_v1 enable row level security;
revoke all on public.commercial_nominal_contractors_v1,public.commercial_nominal_unit_bindings_v1,public.commercial_nominal_audit_v1 from public,anon,authenticated,service_role;
grant select,insert on public.commercial_nominal_contractors_v1,public.commercial_nominal_unit_bindings_v1,public.commercial_nominal_audit_v1 to service_role;
grant update(ad_account_id,account_bound_at) on public.commercial_nominal_unit_bindings_v1 to service_role;
grant usage on sequence public.commercial_nominal_audit_v1_id_seq to service_role;

create function public.commercial_nominal_paid_v1(p_order uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.commercial_orders o where o.id=p_order and o.intake_context_id is not null
 and o.status='payment_approved' and o.external_ref='commercial-v1:'||o.intake_context_id::text
 and o.provider_charge_id is not null and o.provider_customer_id is not null and o.provider_first_due_date is not null
 and public.commercial_intake_validate_final(o.intake_snapshot)
 and o.contractor_type=o.intake_snapshot->>'contractorType' and o.unit_count=(o.intake_snapshot->>'contas')::integer
 and o.total_cents=(o.intake_snapshot->>'totalCentavos')::integer and o.buyer_email=o.intake_snapshot->>'email'
 and o.legal_name=o.intake_snapshot->>'razaoSocial' and o.cnpj=o.intake_snapshot->>'cnpj'
 and o.payment_method=o.intake_snapshot->>'metodo' and o.billing_period=o.intake_snapshot->>'periodo'
 and exists(select 1 from public.commercial_intake_contexts c where c.id=o.intake_context_id
  and c.confirmed_data=o.intake_snapshot and c.source=o.intake_source and c.recipient_email=o.buyer_email and c.confirmed_at is not null)
 and (select count(*) from public.commercial_order_units u where u.order_id=o.id)=o.unit_count
 and not exists(select 1 from public.commercial_order_units u where u.order_id=o.id
  and (u.intake_context_id is distinct from o.intake_context_id or u.intake_unit_id is null or u.ordinal not between 1 and o.unit_count
   or u.intake_unit_id is distinct from (o.intake_snapshot->'units'->(u.ordinal-1)->>'id')::uuid
   or u.advertiser_name is distinct from btrim(o.intake_snapshot->'units'->(u.ordinal-1)->>'advertiserName')))
 and exists(select 1 from public.commercial_payment_events e where e.order_id=o.id
  and e.provider_charge_id=o.provider_charge_id and e.provider_subscription_id is null
  and e.event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and e.amount_cents=o.total_cents and e.due_date=o.provider_first_due_date)
 and not exists(select 1 from public.commercial_payment_events e where e.order_id=o.id
  and e.provider_charge_id=o.provider_charge_id and (e.provider_subscription_id is not null
   or e.amount_cents is distinct from o.total_cents or e.due_date is distinct from o.provider_first_due_date
   or e.event_type not in ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_AUTHORIZED','PAYMENT_AWAITING_RISK_ANALYSIS',
    'PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE'))))
$$;

create function public.commercial_nominal_selection_v1(s jsonb,advertiser boolean) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(s)='object' and (
  (s->>'mode'='existing' and (s-'mode'-'businessId')='{}'::jsonb and jsonb_typeof(s->'businessId')='string'
   and s->>'businessId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  or (s->>'mode'='new' and (s-'mode'-'name')='{}'::jsonb and jsonb_typeof(s->'name')='string'
   and length(s->>'name') between 2 and 200 and length(btrim(s->>'name'))>=2 and s->>'name'!~'[[:cntrl:]]')
  or (advertiser and s->>'mode'='unit' and (s-'mode'-'unitId')='{}'::jsonb and jsonb_typeof(s->'unitId')='string'
   and s->>'unitId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  or (advertiser and s=jsonb_build_object('mode','contractor'))),false)
$$;
create function public.commercial_nominal_dto_v1(d jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(d)='object' and
  (d-'schemaVersion'-'orderId'-'contextId'-'unitId'-'intakeUnitId'-'contractor'-'advertiser'-'adAccountId'-'confirmSelection')='{}'::jsonb
  and d->>'schemaVersion'='v2g.cobertura.nominal.v1' and d->'confirmSelection'='true'::jsonb
  and public.commercial_nominal_selection_v1(d->'contractor',false) and public.commercial_nominal_selection_v1(d->'advertiser',true)
  and d ? 'adAccountId' and (d->'adAccountId'='null'::jsonb or (jsonb_typeof(d->'adAccountId')='string'
   and d->>'adAccountId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
  and not exists(select 1 from unnest(array['orderId','contextId','unitId','intakeUnitId']) k
   where jsonb_typeof(d->k) is distinct from 'string' or d->>k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),false)
$$;

-- Os recibos também validam pagamento/ownership/relação sob o mesmo lock.
-- INSERT privilegiado não contorna esses requisitos; service_role continua autoridade da identidade.
create function public.commercial_nominal_receipt_guard_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype; a public.agency_advertisers%rowtype;
begin
 if TG_OP='DELETE' then raise exception 'nominal_preservar'; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.owner_profile_id::text,0));
 select * into o from public.commercial_orders where id=new.order_id for update;
 if not found or not public.commercial_nominal_paid_v1(o.id) or new.context_id is distinct from o.intake_context_id
  or new.buyer_email is distinct from o.buyer_email or (o.buyer_profile_id is not null and o.buyer_profile_id<>new.owner_profile_id)
  or not exists(select 1 from public.businesses where id=new.contractor_business_id and profile_id=new.owner_profile_id)
  then raise exception 'nominal_compra_titular_invalido'; end if;
 if TG_TABLE_NAME='commercial_nominal_contractors_v1' then
  if TG_OP<>'INSERT' then raise exception 'nominal_contratante_imutavel'; end if;
  if not public.commercial_nominal_selection_v1(new.selection,false) or not coalesce(
    ((new.selection->>'mode'='existing' and new.selection->>'businessId'=new.contractor_business_id::text
      and (new.selection-'mode'-'businessId')='{}'::jsonb)
     or (new.selection->>'mode'='new' and (new.selection-'mode'-'name')='{}'::jsonb
      and exists(select 1 from public.businesses where id=new.contractor_business_id and name=new.selection->>'name'))),false)
    then raise exception 'nominal_selecao_invalida'; end if;
  return new;
 end if;
 if TG_OP='UPDATE' and ((to_jsonb(new)-'ad_account_id'-'account_bound_at') is distinct from
  (to_jsonb(old)-'ad_account_id'-'account_bound_at') or old.ad_account_id is not null or new.ad_account_id is null)
  then raise exception 'nominal_destino_imutavel'; end if;
 if not exists(select 1 from public.commercial_nominal_contractors_v1 c where c.order_id=new.order_id
  and c.contractor_business_id=new.contractor_business_id and c.owner_profile_id=new.owner_profile_id
  and (new.selection->'contractor'=c.selection or new.selection->'contractor'=jsonb_build_object('mode','existing','businessId',c.contractor_business_id::text)))
  or (TG_OP='INSERT' and (new.selection->>'adAccountId')::uuid is distinct from new.ad_account_id)
  then raise exception 'nominal_selecao_destino_divergente'; end if;
 if not public.commercial_nominal_dto_v1(new.selection)
  or not exists(select 1 from public.businesses where id=new.advertiser_business_id and profile_id=new.owner_profile_id)
  or new.selection->>'orderId' is distinct from new.order_id::text
  or new.selection->>'contextId' is distinct from new.context_id::text
  or new.selection->>'unitId' is distinct from new.unit_id::text
  or new.selection->>'intakeUnitId' is distinct from new.intake_unit_id::text
  or new.selection->>'confirmSelection' is distinct from 'true'
  then raise exception 'nominal_unidade_invalida'; end if;
 if not coalesce((new.selection->'advertiser'->>'mode'='existing' and new.selection->'advertiser'->>'businessId'=new.advertiser_business_id::text)
  or (new.selection->'advertiser'->>'mode'='new' and (TG_OP='UPDATE' or exists(select 1 from public.businesses
   where id=new.advertiser_business_id and name=new.selection->'advertiser'->>'name')))
  or (new.selection->'advertiser'->>'mode'='unit' and exists(select 1 from public.commercial_nominal_unit_bindings_v1 x
   where x.unit_id=(new.selection->'advertiser'->>'unitId')::uuid and x.order_id=new.order_id
    and x.advertiser_business_id=new.advertiser_business_id and x.owner_profile_id=new.owner_profile_id and x.unit_id<>new.unit_id))
  or (o.contractor_type='direct' and new.selection->'advertiser'=jsonb_build_object('mode','contractor')),false)
  then raise exception 'nominal_selecao_destino_divergente'; end if;
 if o.contractor_type='direct' then
  if new.contractor_business_id<>new.advertiser_business_id or new.selection->'advertiser'<>jsonb_build_object('mode','contractor')
   then raise exception 'nominal_direto_invalido'; end if;
 else
  select * into a from public.agency_advertisers where advertiser_business_id=new.advertiser_business_id for key share;
  if not found or a.revoked_at is not null or a.owner_profile_id<>new.owner_profile_id
   or a.agency_business_id<>new.contractor_business_id or a.legacy_shared_business then raise exception 'nominal_relacao_invalida'; end if;
 end if;
 if new.ad_account_id is not null and not exists(select 1 from public.ad_accounts
   where id=new.ad_account_id and business_id=new.advertiser_business_id) then raise exception 'nominal_conta_invalida'; end if;
 return new;
end $$;
create trigger nominal_contractor_guard before insert or update or delete on public.commercial_nominal_contractors_v1
 for each row execute function public.commercial_nominal_receipt_guard_v1();
create trigger nominal_binding_guard before insert or update or delete on public.commercial_nominal_unit_bindings_v1
 for each row execute function public.commercial_nominal_receipt_guard_v1();

create function public.commercial_nominal_audit_guard_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP<>'INSERT' then raise exception 'nominal_auditoria_imutavel'; end if;
 if not exists(select 1 from public.commercial_nominal_unit_bindings_v1 b where b.unit_id=new.unit_id
  and to_jsonb(b)=new.binding and (new.event_type='unit_bound' or b.ad_account_id is not null))
  then raise exception 'nominal_auditoria_divergente'; end if;
 return new;
end $$;
create trigger nominal_audit_guard before insert or update or delete on public.commercial_nominal_audit_v1
 for each row execute function public.commercial_nominal_audit_guard_v1();
create function public.commercial_nominal_audit_append_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 insert into public.commercial_nominal_audit_v1(unit_id,event_type,binding)
 values(new.unit_id,case when TG_OP='INSERT' then 'unit_bound' else 'account_bound' end,to_jsonb(new));
 return new;
end $$;
create trigger nominal_audit_append after insert or update on public.commercial_nominal_unit_bindings_v1
 for each row execute function public.commercial_nominal_audit_append_v1();

-- Ledger nominal append-only: inclusive negativos não podem ser apagados/reclassificados.
create function public.commercial_nominal_ledger_guard_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;
begin
 if TG_OP<>'INSERT' then
  if exists(select 1 from public.commercial_orders where id=old.order_id and intake_context_id is not null)
    then raise exception 'nominal_ledger_imutavel'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if;
 select * into o from public.commercial_orders where id=new.order_id for update;
 if found and o.intake_context_id is not null and (TG_OP<>'INSERT' or new.provider_charge_id is distinct from o.provider_charge_id
  or new.provider_subscription_id is not null or new.amount_cents is distinct from o.total_cents
  or new.due_date is distinct from o.provider_first_due_date or o.provider_charge_id is null)
  then raise exception 'nominal_ledger_divergente'; end if;
 return new;
end $$;
create trigger nominal_ledger_guard before insert or update or delete on public.commercial_payment_events
 for each row execute function public.commercial_nominal_ledger_guard_v1();

create function public.commercial_nominal_order_insert_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.intake_context_id is not null and new.business_id is not null then raise exception 'nominal_contratante_sem_recibo'; end if;
 return new;
end $$;
create trigger nominal_order_insert before insert on public.commercial_orders
 for each row execute function public.commercial_nominal_order_insert_v1();

create or replace function public.preservar_pedido_contexto_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.intake_context_id is not null then raise exception 'pedido_contexto_utilizado_preservar'; end if;
  return old;
 end if;
 if old.intake_context_id is null and new.intake_context_id is not null then raise exception 'pedido_legado_preservar'; end if;
 if old.intake_context_id is not null then
  if row(new.intake_context_id,new.intake_snapshot,new.intake_source,new.contractor_type,new.external_ref,new.buyer_email,
   new.legal_name,new.cnpj,new.unit_count,new.total_cents,new.billing_period,new.payment_method)
   is distinct from row(old.intake_context_id,old.intake_snapshot,old.intake_source,old.contractor_type,old.external_ref,old.buyer_email,
   old.legal_name,old.cnpj,old.unit_count,old.total_cents,old.billing_period,old.payment_method)
   then raise exception 'pedido_contexto_imutavel'; end if;
  if (old.provider_charge_id is not null and new.provider_charge_id is distinct from old.provider_charge_id)
   or (old.provider_customer_id is not null and new.provider_customer_id is distinct from old.provider_customer_id)
   or (old.provider_first_due_date is not null and new.provider_first_due_date is distinct from old.provider_first_due_date)
   then raise exception 'nominal_cobranca_imutavel'; end if;
  if new.business_id is distinct from old.business_id or new.buyer_profile_id is distinct from old.buyer_profile_id then
   if old.business_id is not null or (old.buyer_profile_id is not null and new.buyer_profile_id is distinct from old.buyer_profile_id)
    or not public.commercial_nominal_paid_v1(old.id) or not exists(select 1 from public.commercial_nominal_contractors_v1 r
     where r.order_id=old.id and r.context_id=old.intake_context_id and r.contractor_business_id=new.business_id
      and r.owner_profile_id=new.buyer_profile_id and r.buyer_email=old.buyer_email)
    then raise exception 'nominal_contratante_sem_recibo'; end if;
  end if;
 end if;
 return new;
end $$;

create or replace function public.preservar_unidade_contexto_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.commercial_orders%rowtype; nominal jsonb;
begin
 if TG_OP='INSERT' then
  select * into parent from public.commercial_orders where id=new.order_id for key share;
  if not found then return new; end if;
  if parent.intake_context_id is null then
   if new.intake_context_id is not null or new.intake_unit_id is not null or new.advertiser_name is not null
    or new.advertiser_business_id is not null then raise exception 'unidade_legada_preservar'; end if;
   return new;
  end if;
  if new.intake_context_id is distinct from parent.intake_context_id or new.intake_unit_id is null
   or new.ordinal is null or new.ordinal not between 1 and parent.unit_count
   or new.advertiser_business_id is not null or new.ad_account_id is not null then raise exception 'unidade_contexto_insercao_divergente'; end if;
  nominal:=parent.intake_snapshot->'units'->(new.ordinal-1);
  if (nominal->>'id')::uuid is distinct from new.intake_unit_id or btrim(nominal->>'advertiserName') is distinct from new.advertiser_name
   or not exists(select 1 from public.commercial_intake_units u where u.context_id=parent.intake_context_id
    and u.id=new.intake_unit_id and u.advertiser_name=new.advertiser_name) then raise exception 'unidade_contexto_insercao_divergente'; end if;
  return new;
 end if;
 if TG_OP='DELETE' then
  if old.intake_context_id is not null then raise exception 'unidade_contexto_utilizada_preservar'; end if;
  return old;
 end if;
 select * into parent from public.commercial_orders where id=new.order_id for key share;
 if found and parent.intake_context_id is not null and (old.intake_context_id is null or new.intake_context_id is distinct from parent.intake_context_id)
  then raise exception 'unidade_contexto_update_destino_divergente'; end if;
 if (old.intake_context_id is null and new.intake_context_id is not null) or
  (old.intake_context_id is not null and row(new.id,new.order_id,new.ordinal,new.intake_context_id,new.intake_unit_id,new.advertiser_name)
   is distinct from row(old.id,old.order_id,old.ordinal,old.intake_context_id,old.intake_unit_id,old.advertiser_name))
  then raise exception 'unidade_contexto_imutavel'; end if;
 if old.intake_context_id is not null and row(new.advertiser_business_id,new.ad_account_id) is distinct from row(old.advertiser_business_id,old.ad_account_id) then
  if (old.advertiser_business_id is not null and new.advertiser_business_id is distinct from old.advertiser_business_id)
   or (old.ad_account_id is not null and new.ad_account_id is distinct from old.ad_account_id)
   or not public.commercial_nominal_paid_v1(old.order_id)
   or not exists(select 1 from public.commercial_nominal_unit_bindings_v1 r where r.unit_id=old.id and r.order_id=old.order_id
    and r.context_id=old.intake_context_id and r.intake_unit_id=old.intake_unit_id
    and r.advertiser_business_id=new.advertiser_business_id and r.ad_account_id is not distinct from new.ad_account_id)
   then raise exception 'nominal_unidade_sem_recibo'; end if;
 end if;
 return new;
end $$;

create function public.atribuir_cobertura_nominal_v1(p_binding jsonb,p_actor uuid,p_email text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype; u public.commercial_order_units%rowtype;
 r public.commercial_nominal_contractors_v1%rowtype; b public.commercial_nominal_unit_bindings_v1%rowtype;
 a public.agency_advertisers%rowtype; root_id uuid; advertiser_id uuid; account_id uuid; s jsonb;
begin
 if p_actor is null or p_email is null or not public.commercial_nominal_dto_v1(p_binding) or jsonb_typeof(p_binding) is distinct from 'object'
  or (p_binding-'schemaVersion'-'orderId'-'contextId'-'unitId'-'intakeUnitId'-'contractor'-'advertiser'-'adAccountId'-'confirmSelection')<>'{}'::jsonb
  or (select count(*) from jsonb_object_keys(p_binding))<>9
  or p_binding->>'schemaVersion' is distinct from 'v2g.cobertura.nominal.v1'
  or p_binding->'confirmSelection' is distinct from 'true'::jsonb then raise exception 'nominal_selecao_invalida'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select * into o from public.commercial_orders where id=(p_binding->>'orderId')::uuid for update;
 if not found or not public.commercial_nominal_paid_v1(o.id) or p_email is distinct from o.buyer_email
  or o.intake_context_id is distinct from (p_binding->>'contextId')::uuid
  or (o.buyer_profile_id is not null and o.buyer_profile_id<>p_actor) then raise exception 'nominal_compra_titular_invalido'; end if;
 select * into u from public.commercial_order_units where id=(p_binding->>'unitId')::uuid and order_id=o.id for update;
 if not found or u.intake_context_id is distinct from o.intake_context_id
  or u.intake_unit_id is distinct from (p_binding->>'intakeUnitId')::uuid then raise exception 'nominal_unidade_invalida'; end if;
 account_id:=(p_binding->>'adAccountId')::uuid;
 s:=p_binding->'contractor';
 if jsonb_typeof(s) is distinct from 'object' or not coalesce(
   (s->>'mode'='existing' and (s-'mode'-'businessId')='{}'::jsonb and (select count(*) from jsonb_object_keys(s))=2)
   or (s->>'mode'='new' and (s-'mode'-'name')='{}'::jsonb and jsonb_typeof(s->'name')='string'
    and length(btrim(s->>'name')) between 2 and 200 and s->>'name'!~'[[:cntrl:]]'),false)
   then raise exception 'nominal_selecao_invalida'; end if;
 select * into r from public.commercial_nominal_contractors_v1 where order_id=o.id;
 if found then
  if r.owner_profile_id<>p_actor or (s is distinct from r.selection and not(s->>'mode'='existing' and s->>'businessId'=r.contractor_business_id::text))
   then raise exception 'nominal_destino_imutavel'; end if;
  root_id:=r.contractor_business_id;
 else
  if s->>'mode'='existing' then
   select id into root_id from public.businesses where id=(s->>'businessId')::uuid and profile_id=p_actor for key share;
   if not found then raise exception 'nominal_negocio_nao_proprio'; end if;
  else
   insert into public.businesses(name,profile_id) values(btrim(s->>'name'),p_actor) returning id into root_id;
  end if;
  insert into public.commercial_nominal_contractors_v1(order_id,context_id,owner_profile_id,buyer_email,contractor_business_id,selection)
   values(o.id,o.intake_context_id,p_actor,p_email,root_id,s);
  update public.commercial_orders set business_id=root_id,buyer_profile_id=p_actor where id=o.id;
 end if;
 select * into b from public.commercial_nominal_unit_bindings_v1 where unit_id=u.id;
 s:=p_binding->'advertiser';
 if found then
  if s is distinct from b.selection->'advertiser' and not(s->>'mode'='existing' and s->>'businessId'=b.advertiser_business_id::text)
   then raise exception 'nominal_destino_imutavel'; end if;
  if account_id is not null and b.ad_account_id is not null and account_id<>b.ad_account_id then raise exception 'nominal_destino_imutavel'; end if;
  -- Replay ainda revalida a relação e a identidade; não apaga conta já preenchida.
  if o.contractor_type='agency' and not exists(select 1 from public.agency_advertisers where advertiser_business_id=b.advertiser_business_id
   and agency_business_id=root_id and owner_profile_id=p_actor and revoked_at is null and not legacy_shared_business)
   then raise exception 'nominal_relacao_invalida'; end if;
  if account_id is not null and b.ad_account_id is null then
   update public.commercial_nominal_unit_bindings_v1 set ad_account_id=account_id,account_bound_at=now() where unit_id=u.id returning * into b;
   update public.commercial_order_units set ad_account_id=account_id where id=u.id;
  end if;
  return to_jsonb(b);
 end if;
 if o.contractor_type='direct' then
  if s is distinct from jsonb_build_object('mode','contractor') then raise exception 'nominal_direto_invalido'; end if;
  advertiser_id:=root_id;
 else
  if jsonb_typeof(s) is distinct from 'object' then raise exception 'nominal_selecao_invalida'; end if;
  if s->>'mode'='existing' and (s-'mode'-'businessId')='{}'::jsonb then
   select id into advertiser_id from public.businesses where id=(s->>'businessId')::uuid and profile_id=p_actor for key share;
   if not found then raise exception 'nominal_negocio_nao_proprio'; end if;
  elsif s->>'mode'='new' and (s-'mode'-'name')='{}'::jsonb and jsonb_typeof(s->'name')='string'
   and length(btrim(s->>'name')) between 2 and 200 and s->>'name'!~'[[:cntrl:]]' then
   insert into public.businesses(name,profile_id) values(btrim(s->>'name'),p_actor) returning id into advertiser_id;
  elsif s->>'mode'='unit' and (s-'mode'-'unitId')='{}'::jsonb then
   select advertiser_business_id into advertiser_id from public.commercial_nominal_unit_bindings_v1
    where unit_id=(s->>'unitId')::uuid and order_id=o.id and owner_profile_id=p_actor;
   if not found then raise exception 'nominal_unidade_referencia_invalida'; end if;
  else raise exception 'nominal_selecao_invalida'; end if;
  if advertiser_id=root_id then raise exception 'nominal_relacao_invalida'; end if;
  select * into a from public.agency_advertisers where advertiser_business_id=advertiser_id for update;
  if found then
   if a.agency_business_id<>root_id or a.owner_profile_id<>p_actor or a.revoked_at is not null or a.legacy_shared_business
    then raise exception 'nominal_relacao_invalida'; end if;
  else
   insert into public.agency_advertisers(agency_business_id,advertiser_business_id,owner_profile_id,advertiser_name,reference_key,source)
    select root_id,advertiser_id,p_actor,name,'commercial-'||u.id::text,'commercial nominal order '||o.id::text||' unit '||u.id::text
    from public.businesses where id=advertiser_id;
  end if;
 end if;
 insert into public.commercial_nominal_unit_bindings_v1(order_id,context_id,unit_id,intake_unit_id,owner_profile_id,buyer_email,
  contractor_business_id,advertiser_business_id,ad_account_id,selection,account_bound_at)
 values(o.id,o.intake_context_id,u.id,u.intake_unit_id,p_actor,p_email,root_id,advertiser_id,account_id,p_binding,
  case when account_id is not null then now() end) returning * into b;
 update public.commercial_order_units set advertiser_business_id=advertiser_id,ad_account_id=account_id where id=u.id;
 return to_jsonb(b);
end $$;

revoke all on function public.commercial_nominal_paid_v1(uuid),public.commercial_nominal_receipt_guard_v1(),
 public.commercial_nominal_selection_v1(jsonb,boolean),public.commercial_nominal_dto_v1(jsonb),public.commercial_nominal_audit_append_v1(),
 public.commercial_nominal_order_insert_v1(),
 public.commercial_nominal_audit_guard_v1(),public.commercial_nominal_ledger_guard_v1(),public.atribuir_cobertura_nominal_v1(jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.commercial_nominal_paid_v1(uuid),public.commercial_nominal_receipt_guard_v1(),
 public.commercial_nominal_selection_v1(jsonb,boolean),public.commercial_nominal_dto_v1(jsonb),public.commercial_nominal_audit_append_v1(),
 public.commercial_nominal_order_insert_v1(),
 public.commercial_nominal_audit_guard_v1(),public.commercial_nominal_ledger_guard_v1(),public.atribuir_cobertura_nominal_v1(jsonb,uuid,text) to service_role;


-- Dependência selada: docs/qa/cobertura-nominal-v1/signup-guard.sql
-- COMPLEMENTO LOCAL QA, NÃO APLICADO. Não modifica o SQL nominal BF0.
-- Fonte instalada conhecida: baseline-u5 (u6), corpo d48490e0ecc1986e5ee504b861eabdac.
-- Amplia somente uma condição DENY-ONLY do trigger existente; sem novo definer/grant/Auth SELECT.

do $nominal_signup$
declare f regprocedure:=to_regprocedure('private.handle_new_user()'); before_fn pg_proc%rowtype;
 after_fn pg_proc%rowtype; definition text; old_clause text;
 new_clause text;
begin
 if f is null then raise exception 'nominal_signup_trigger_ausente'; end if;
 select * into before_fn from pg_proc where oid=f;
 old_clause:='if new.email is not null and (new.raw_user_meta_data ->> ''access_flow'') is distinct from ''historical_contract'' then';
 new_clause:='if new.email is not null and (new.raw_user_meta_data ->> ''access_flow'') is distinct from ''historical_contract'' and (new.raw_user_meta_data ->> ''access_flow'') is distinct from ''nominal_coverage'' then';
 if md5(before_fn.prosrc)<>'d48490e0ecc1986e5ee504b861eabdac'
  or not before_fn.prosecdef or before_fn.prorettype<>'trigger'::regtype
  or before_fn.prokind<>'f' or before_fn.pronargs<>0
  or before_fn.proconfig is distinct from array['search_path=""']::text[]
  or position(old_clause in before_fn.prosrc)=0
  or length(before_fn.prosrc)-length(replace(before_fn.prosrc,old_clause,''))<>length(old_clause)
  then raise exception 'nominal_signup_versao_instalada_divergente'; end if;
 if not exists(select 1 from pg_trigger t where t.tgrelid='auth.users'::regclass and t.tgname='on_auth_user_created'
  and t.tgfoid=f and not t.tgisinternal and t.tgenabled='O'
  and pg_get_triggerdef(t.oid)='CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user()')
  then raise exception 'nominal_signup_trigger_divergente'; end if;
 definition:=pg_get_functiondef(f);
 -- CREATE OR REPLACE derivado da definição exata preserva o definer JÁ existente.
 -- Não declara função nova, não concede permissão e não muda owner/config.
 execute replace(definition,old_clause,new_clause);
 select * into after_fn from pg_proc where oid=f;
 if after_fn.prosrc is distinct from replace(before_fn.prosrc,old_clause,new_clause)
  or (to_jsonb(after_fn)-'prosrc') is distinct from (to_jsonb(before_fn)-'prosrc')
  then raise exception 'nominal_signup_metadados_alterados'; end if;
end $nominal_signup$;


-- Dependência selada: docs/qa/cobertura-nominal-v1/compatibilidade-pagamento.sql
-- QA ONLY zskpijnqgkqwxksqmzmf. Compatibilidade com a regra real de 0028.
-- Recibo inicial historico permite pagamento antes da escolha explicita.
-- Elegibilidade e acesso continuam exigindo commercial_nominal_paid_v1 sem negativos.

lock table public.commercial_orders in access exclusive mode;
do $$ begin
 if (select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.commercial_orders'::regclass and conname='commercial_orders_paid_business_check') is distinct from $old$CHECK (((status <> 'payment_approved'::text) OR (business_id IS NOT NULL)))$old$ then raise exception 'compatibilidade: constraint divergente'; end if;
end $$;
create function public.commercial_nominal_initial_receipt_v1(p_order uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.commercial_orders o where o.id=p_order and o.intake_context_id is not null
 and o.external_ref='commercial-v1:'||o.intake_context_id::text
 and o.provider_charge_id is not null and o.provider_customer_id is not null and o.provider_first_due_date is not null
 and public.commercial_intake_validate_final(o.intake_snapshot)
 and o.contractor_type=o.intake_snapshot->>'contractorType' and o.unit_count=(o.intake_snapshot->>'contas')::integer
 and o.total_cents=(o.intake_snapshot->>'totalCentavos')::integer and o.buyer_email=o.intake_snapshot->>'email'
 and o.legal_name=o.intake_snapshot->>'razaoSocial' and o.cnpj=o.intake_snapshot->>'cnpj'
 and o.payment_method=o.intake_snapshot->>'metodo' and o.billing_period=o.intake_snapshot->>'periodo'
 and exists(select 1 from public.commercial_intake_contexts c where c.id=o.intake_context_id
  and c.confirmed_data=o.intake_snapshot and c.source=o.intake_source and c.recipient_email=o.buyer_email and c.confirmed_at is not null)
 and (select count(*) from public.commercial_order_units u where u.order_id=o.id)=o.unit_count
 and not exists(select 1 from public.commercial_order_units u where u.order_id=o.id
  and (u.intake_context_id is distinct from o.intake_context_id or u.intake_unit_id is null or u.ordinal not between 1 and o.unit_count
   or u.intake_unit_id is distinct from (o.intake_snapshot->'units'->(u.ordinal-1)->>'id')::uuid
   or u.advertiser_name is distinct from btrim(o.intake_snapshot->'units'->(u.ordinal-1)->>'advertiserName')))
 and exists(select 1 from public.commercial_payment_events e where e.order_id=o.id
  and e.provider_charge_id=o.provider_charge_id and e.provider_subscription_id is null
  and e.event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and e.amount_cents=o.total_cents and e.due_date=o.provider_first_due_date))
$$;
revoke all on function public.commercial_nominal_initial_receipt_v1(uuid) from public,anon,authenticated;
grant execute on function public.commercial_nominal_initial_receipt_v1(uuid) to service_role;
alter table public.commercial_orders drop constraint commercial_orders_paid_business_check;
alter table public.commercial_orders add constraint commercial_orders_paid_business_check check(status<>'payment_approved' or business_id is not null or (intake_context_id is not null and public.commercial_nominal_initial_receipt_v1(id)));


-- Dependência selada: docs/qa/recorrencia-nominal-v1/20261116212354_recorrencia_nominal_qa.sql
-- CANDIDATO LOCAL QA. Não aplicado. Não chama Asaas, não altera flags.
-- Dependências: intake + financeiro + cobertura nominal + compatibilidade.

create table public.commercial_nominal_subscriptions_v1(
 order_id uuid primary key references public.commercial_orders(id),
 first_due_date date not null,reserved_at timestamptz not null default now(),
 provider_subscription_id text unique check(provider_subscription_id ~ '^sub_[A-Za-z0-9]+$'),bound_at timestamptz,
 unique(order_id,provider_subscription_id),check((provider_subscription_id is null)=(bound_at is null))
);
create table public.commercial_nominal_cycles_v1(
 order_id uuid not null,provider_subscription_id text not null,due_date date not null,
 provider_charge_id text not null unique check(provider_charge_id ~ '^pay_[A-Za-z0-9]+$'),
 created_at timestamptz not null default now(),primary key(order_id,due_date),unique(order_id,provider_charge_id,due_date),
 foreign key(order_id,provider_subscription_id) references public.commercial_nominal_subscriptions_v1(order_id,provider_subscription_id)
);
create table public.commercial_nominal_renewal_events_v1(
 provider_event_id text primary key check(length(provider_event_id) between 5 and 200),order_id uuid not null,
 provider_charge_id text not null,provider_subscription_id text not null,event_type text not null,
 amount_cents integer not null check(amount_cents>0),due_date date not null,received_at timestamptz not null default now(),
 foreign key(order_id,provider_charge_id,due_date) references public.commercial_nominal_cycles_v1(order_id,provider_charge_id,due_date)
);
create index nominal_renewal_events_cycle on public.commercial_nominal_renewal_events_v1(order_id,due_date);
alter table public.commercial_nominal_subscriptions_v1 enable row level security;
alter table public.commercial_nominal_cycles_v1 enable row level security;
alter table public.commercial_nominal_renewal_events_v1 enable row level security;
revoke all on public.commercial_nominal_subscriptions_v1,public.commercial_nominal_cycles_v1,public.commercial_nominal_renewal_events_v1 from public,anon,authenticated,service_role;
grant select,insert on public.commercial_nominal_subscriptions_v1,public.commercial_nominal_cycles_v1,public.commercial_nominal_renewal_events_v1 to service_role;
grant update(provider_subscription_id,bound_at) on public.commercial_nominal_subscriptions_v1 to service_role;

create function public.ciclo_mensal_nominal_v1(p_first date,p_day date) returns date
language plpgsql immutable security invoker set search_path='' as $$
declare d date:=p_first; n date;
begin
 if d is null or p_day is null or p_day<d then return null; end if;
 for i in 1..1200 loop
  n:=(d+interval '1 month')::date;
  if p_day<n then return d; end if;
  d:=n;
 end loop;
 return null;
end $$;

create function public.recorrencia_nominal_schema_v1() returns text
language sql stable security invoker set search_path='' as $$select 'v2g.recorrencia.nominal.v1'::text$$;

-- O primeiro mês nunca é regravado em nome de uma renovação.
create function public.recorrencia_nominal_guard_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;s public.commercial_nominal_subscriptions_v1%rowtype;
begin
 if TG_OP='DELETE' then raise exception 'recorrencia_preservar'; end if;
 select * into o from public.commercial_orders where id=new.order_id for update;
 if not found or o.intake_context_id is null or o.billing_period<>'monthly' or o.payment_method<>'asaas_card'
  or o.provider_card_flow<>'initial_3ds' or not public.commercial_nominal_initial_receipt_v1(o.id)
  then raise exception 'recorrencia_contrato_invalido'; end if;
 if TG_TABLE_NAME='commercial_nominal_subscriptions_v1' then
  if new.first_due_date is distinct from (o.provider_first_due_date+interval '1 month')::date
   or o.subscription_creation_started_at is null or o.provider_subscription_first_due_date is distinct from new.first_due_date
   then raise exception 'recorrencia_reserva_divergente'; end if;
  if TG_OP='UPDATE' and ((to_jsonb(new)-'provider_subscription_id'-'bound_at') is distinct from (to_jsonb(old)-'provider_subscription_id'-'bound_at')
   or old.provider_subscription_id is not null or new.provider_subscription_id is null or new.bound_at is null)
   then raise exception 'recorrencia_recibo_imutavel'; end if;
  if TG_OP='INSERT' and (new.provider_subscription_id is not null or new.bound_at is not null) then raise exception 'recorrencia_sem_reserva'; end if;
  return new;
 end if;
 if TG_OP<>'INSERT' then raise exception 'recorrencia_ledger_imutavel'; end if;
 select * into s from public.commercial_nominal_subscriptions_v1 where order_id=o.id;
 if not found or s.provider_subscription_id is null or s.provider_subscription_id is distinct from new.provider_subscription_id
  or o.provider_subscription_id is distinct from s.provider_subscription_id
  or new.provider_charge_id=o.provider_charge_id
  or public.ciclo_mensal_nominal_v1(s.first_due_date,new.due_date) is distinct from new.due_date
  then raise exception 'recorrencia_ciclo_divergente'; end if;
 if TG_TABLE_NAME='commercial_nominal_renewal_events_v1' then
  if new.amount_cents is distinct from o.total_cents or new.event_type not in (
   'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS',
   'PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
   'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
   'PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED',
   'PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL')
   or exists(select 1 from public.commercial_payment_events where provider_event_id=new.provider_event_id)
   then raise exception 'recorrencia_evento_divergente'; end if;
 end if;
 return new;
end $$;
create trigger nominal_subscription_guard before insert or update or delete on public.commercial_nominal_subscriptions_v1
 for each row execute function public.recorrencia_nominal_guard_v1();
create trigger nominal_cycle_guard before insert or update or delete on public.commercial_nominal_cycles_v1
 for each row execute function public.recorrencia_nominal_guard_v1();
create trigger nominal_renewal_guard before insert or update or delete on public.commercial_nominal_renewal_events_v1
 for each row execute function public.recorrencia_nominal_guard_v1();

create function public.reservar_checkout_mensal_contexto_v1(p_order uuid,p_ip inet) returns boolean
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;
begin
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or o.intake_context_id is null or o.external_ref<>'commercial-v1:'||o.intake_context_id::text
  or o.billing_period<>'monthly' or o.payment_method<>'asaas_card' or o.status<>'awaiting_payment'
  or not public.commercial_intake_validate_final(o.intake_snapshot) or p_ip is null or masklen(p_ip) not in (32,128)
  or o.checkout_creation_started_at is not null or o.payment_creation_started_at is not null
  or o.provider_customer_id is not null or o.provider_charge_id is not null or o.provider_subscription_id is not null
  then return false; end if;
 update public.commercial_orders set checkout_creation_started_at=now(),provider_card_flow='initial_3ds' where id=o.id;
 insert into public.checkout_3ds_context(order_id,payer_ip) values(o.id,p_ip);
 return true;
end $$;

create function public.reservar_assinatura_nominal_v1(p_order uuid,p_due date) returns boolean
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;
begin
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or not public.commercial_nominal_paid_v1(o.id) or o.billing_period<>'monthly' or o.payment_method<>'asaas_card'
  or o.provider_card_flow<>'initial_3ds' or o.subscription_creation_started_at is not null or o.provider_subscription_id is not null
  or p_due is null or p_due is distinct from (o.provider_first_due_date+interval '1 month')::date
  or p_due<=(now() at time zone 'America/Sao_Paulo')::date then return false; end if;
 update public.commercial_orders set subscription_creation_started_at=now(),provider_subscription_first_due_date=p_due where id=o.id;
 insert into public.commercial_nominal_subscriptions_v1(order_id,first_due_date) values(o.id,p_due);
 return true;
end $$;
create function public.vincular_assinatura_nominal_v1(p_order uuid,p_subscription text,p_due date) returns boolean
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;s public.commercial_nominal_subscriptions_v1%rowtype;
begin
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or not public.commercial_nominal_paid_v1(o.id) or p_subscription is null or p_subscription!~'^sub_[A-Za-z0-9]+$' then return false; end if;
 select * into s from public.commercial_nominal_subscriptions_v1 where order_id=o.id for update;
 if not found or p_due is distinct from s.first_due_date then return false; end if;
 if s.provider_subscription_id is not null then return s.provider_subscription_id=p_subscription and o.provider_subscription_id=p_subscription; end if;
 if o.provider_subscription_id is not null then return false; end if;
 update public.commercial_nominal_subscriptions_v1 set provider_subscription_id=p_subscription,bound_at=now() where order_id=o.id;
 update public.commercial_orders set provider_subscription_id=p_subscription where id=o.id;
 delete from public.checkout_3ds_context where order_id=o.id;
 return true;
end $$;

create function public.preservar_assinatura_nominal_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.intake_context_id is null then return new; end if;
 if (old.provider_card_flow='initial_3ds' and new.provider_card_flow is distinct from old.provider_card_flow)
  or (old.subscription_creation_started_at is not null and row(new.subscription_creation_started_at,new.provider_subscription_first_due_date)
    is distinct from row(old.subscription_creation_started_at,old.provider_subscription_first_due_date))
  or (old.provider_subscription_id is not null and new.provider_subscription_id is distinct from old.provider_subscription_id)
  then raise exception 'recorrencia_cabecalho_imutavel'; end if;
 if new.provider_subscription_id is distinct from old.provider_subscription_id and not exists(
  select 1 from public.commercial_nominal_subscriptions_v1 s where s.order_id=new.id
   and s.provider_subscription_id=new.provider_subscription_id and s.first_due_date=new.provider_subscription_first_due_date and s.bound_at is not null)
  then raise exception 'recorrencia_assinatura_sem_recibo'; end if;
 return new;
end $$;
create trigger nominal_subscription_header before update on public.commercial_orders for each row execute function public.preservar_assinatura_nominal_v1();

create function public.preservar_id_evento_renovacao_nominal_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.commercial_nominal_renewal_events_v1 where provider_event_id=new.provider_event_id)
  then raise exception 'recorrencia_evento_ja_utilizado'; end if;
 return new;
end $$;
create trigger nominal_cross_ledger before insert on public.commercial_payment_events for each row execute function public.preservar_id_evento_renovacao_nominal_v1();

create function public.registrar_renovacao_nominal_v1(p_order uuid,p_event text,p_type text,p_customer text,p_subscription text,p_charge text,p_amount integer,p_due date) returns boolean
language plpgsql security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;s public.commercial_nominal_subscriptions_v1%rowtype;e public.commercial_nominal_renewal_events_v1%rowtype;
begin
 select * into o from public.commercial_orders where id=p_order for update;
 if not found or o.intake_context_id is null or o.provider_customer_id is distinct from p_customer
  or o.provider_subscription_id is null or o.provider_subscription_id is distinct from p_subscription
  or o.total_cents is distinct from p_amount or p_charge is null or p_charge!~'^pay_[A-Za-z0-9]+$'
  or p_charge=o.provider_charge_id or p_event is null or length(p_event) not between 5 and 200 then return false; end if;
 select * into s from public.commercial_nominal_subscriptions_v1 where order_id=o.id;
 if not found or s.provider_subscription_id is distinct from p_subscription or p_due is null
  or public.ciclo_mensal_nominal_v1(s.first_due_date,p_due) is distinct from p_due then return false; end if;
 select * into e from public.commercial_nominal_renewal_events_v1 where provider_event_id=p_event;
 if found then return e.order_id=p_order and e.provider_charge_id=p_charge and e.provider_subscription_id=p_subscription
  and e.event_type=p_type and e.amount_cents=p_amount and e.due_date=p_due; end if;
 if exists(select 1 from public.commercial_payment_events where provider_event_id=p_event)
  or exists(select 1 from public.commercial_nominal_cycles_v1 where order_id=p_order and due_date=p_due and provider_charge_id<>p_charge)
  then return false; end if;
 insert into public.commercial_nominal_cycles_v1(order_id,provider_subscription_id,due_date,provider_charge_id)
  values(p_order,p_subscription,p_due,p_charge) on conflict(order_id,due_date) do nothing;
 insert into public.commercial_nominal_renewal_events_v1(provider_event_id,order_id,provider_charge_id,provider_subscription_id,event_type,amount_cents,due_date)
  values(p_event,p_order,p_charge,p_subscription,p_type,p_amount,p_due);
 return true;
end $$;

create function public.estado_renovacao_nominal_v1(p_order uuid,p_charge text) returns text
language plpgsql stable security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;c public.commercial_nominal_cycles_v1%rowtype;
begin
 select * into o from public.commercial_orders where id=p_order;
 select * into c from public.commercial_nominal_cycles_v1 where order_id=p_order and provider_charge_id=p_charge;
 if o.id is null or c.order_id is null or not public.commercial_nominal_paid_v1(p_order)
  or o.provider_subscription_id is distinct from c.provider_subscription_id then return 'awaiting_payment'; end if;
 if exists(select 1 from public.commercial_nominal_renewal_events_v1 where order_id=p_order and provider_charge_id=p_charge and event_type='PAYMENT_REFUNDED') then return 'refunded'; end if;
 if exists(select 1 from public.commercial_nominal_renewal_events_v1 where order_id=p_order and provider_charge_id=p_charge and event_type not in (
  'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED')) then return 'payment_review'; end if;
 if exists(select 1 from public.commercial_nominal_renewal_events_v1 where order_id=p_order and provider_charge_id=p_charge
  and event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and amount_cents=o.total_cents and due_date=c.due_date and provider_subscription_id=c.provider_subscription_id)
  then return 'payment_approved'; end if;
 return 'awaiting_payment';
end $$;

create function public.estado_ciclo_nominal_v1(p_order uuid,p_day date default (now() at time zone 'America/Sao_Paulo')::date) returns text
language plpgsql stable security invoker set search_path='' as $$
declare o public.commercial_orders%rowtype;s public.commercial_nominal_subscriptions_v1%rowtype;d date;charge text;
begin
 select * into o from public.commercial_orders where id=p_order;
 if not found or not public.commercial_nominal_paid_v1(p_order) then return 'awaiting_payment'; end if;
 if o.billing_period<>'monthly' then return 'payment_approved'; end if;
 d:=(o.provider_first_due_date+interval '1 month')::date;
 if p_day is null or p_day<o.provider_first_due_date then return 'awaiting_payment'; end if;
 if p_day<d then return 'payment_approved'; end if;
 select * into s from public.commercial_nominal_subscriptions_v1 where order_id=p_order;
 if not found or s.provider_subscription_id is null or s.provider_subscription_id is distinct from o.provider_subscription_id or s.first_due_date<>d then return 'awaiting_payment'; end if;
 d:=public.ciclo_mensal_nominal_v1(s.first_due_date,p_day);
 select provider_charge_id into charge from public.commercial_nominal_cycles_v1 where order_id=p_order and due_date=d;
 if not found then return 'awaiting_payment'; end if;
 return public.estado_renovacao_nominal_v1(p_order,charge);
end $$;

-- Aplicar o mesmo limite financeiro na atribuição SQL, não só na tela.
create function public.cobertura_ciclo_nominal_guard_v1() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if public.estado_ciclo_nominal_v1(new.order_id)<>'payment_approved' then raise exception 'nominal_ciclo_nao_pago'; end if;
 return new;
end $$;
create trigger nominal_contractor_cycle before insert on public.commercial_nominal_contractors_v1 for each row execute function public.cobertura_ciclo_nominal_guard_v1();
create trigger nominal_binding_cycle before insert or update on public.commercial_nominal_unit_bindings_v1 for each row execute function public.cobertura_ciclo_nominal_guard_v1();

create function public.preparar_efeitos_renovacao_nominal_v1(p_order uuid,p_charge text,p_buyer jsonb,p_internal jsonb) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.commercial_orders where id=p_order for update;
 if public.estado_renovacao_nominal_v1(p_order,p_charge)<>'payment_approved' then return false; end if;
 if p_buyer is not null then
  insert into public.commercial_payment_email_outbox(order_id,provider_charge_id,status,payload) values(p_order,p_charge,'queued',p_buyer)
   on conflict(order_id,provider_charge_id) do nothing;
 end if;
 if p_internal is not null then
  insert into public.commercial_internal_notice_outbox(order_id,provider_charge_id,notice_type,status,payload) values(p_order,p_charge,'payment_confirmed','queued',p_internal)
   on conflict(order_id,provider_charge_id,notice_type) do nothing;
 end if;
 return true;
end $$;

-- Nenhum acesso a Auth; nenhuma execução para anon/authenticated.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
 and p.proname in ('ciclo_mensal_nominal_v1','recorrencia_nominal_schema_v1','recorrencia_nominal_guard_v1','reservar_checkout_mensal_contexto_v1',
 'reservar_assinatura_nominal_v1','vincular_assinatura_nominal_v1','preservar_assinatura_nominal_v1','registrar_renovacao_nominal_v1',
 'estado_renovacao_nominal_v1','estado_ciclo_nominal_v1','cobertura_ciclo_nominal_guard_v1','preparar_efeitos_renovacao_nominal_v1','preservar_id_evento_renovacao_nominal_v1') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;

create function public.comercial_oficial_schema_v1() returns integer language plpgsql stable security invoker set search_path='' as $ready$
declare n text;f regprocedure;
begin
 foreach n in array array['commercial_intake_contexts','commercial_intake_units','commercial_intake_audit','commercial_internal_notice_outbox','commercial_nominal_contractors_v1','commercial_nominal_unit_bindings_v1','commercial_nominal_audit_v1','commercial_nominal_subscriptions_v1','commercial_nominal_cycles_v1','commercial_nominal_renewal_events_v1']loop
 if not exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relname=n and c.relkind='r' and c.relrowsecurity) then return 0;end if;
 if has_table_privilege('anon','public.'||n,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated','public.'||n,'SELECT,INSERT,UPDATE,DELETE') then return 0;end if;end loop;
 foreach n in array array['public.atribuir_cobertura_nominal_v1(jsonb,uuid,text)','public.ciclo_mensal_nominal_v1(date,date)','public.cobertura_ciclo_nominal_guard_v1()','public.commercial_intake_validate_final(jsonb)','public.commercial_nominal_audit_append_v1()','public.commercial_nominal_audit_guard_v1()','public.commercial_nominal_dto_v1(jsonb)','public.commercial_nominal_initial_receipt_v1(uuid)','public.commercial_nominal_ledger_guard_v1()','public.commercial_nominal_order_insert_v1()','public.commercial_nominal_paid_v1(uuid)','public.commercial_nominal_receipt_guard_v1()','public.commercial_nominal_selection_v1(jsonb,boolean)','public.confirmar_contexto_comercial_v1(uuid,jsonb,text,uuid,text)','public.criar_contexto_comercial_v1(uuid,jsonb,jsonb,text)','public.criar_pedido_contexto_v1(uuid,text,uuid,text)','public.estado_ciclo_nominal_v1(uuid,date)','public.estado_renovacao_nominal_v1(uuid,text)','public.preparar_efeitos_contexto_v1(uuid,text,jsonb,jsonb)','public.preparar_efeitos_renovacao_nominal_v1(uuid,text,jsonb,jsonb)','public.preservar_assinatura_nominal_v1()','public.preservar_id_evento_renovacao_nominal_v1()','public.preservar_pedido_contexto_v1()','public.preservar_unidade_contexto_v1()','public.recorrencia_nominal_guard_v1()','public.recorrencia_nominal_schema_v1()','public.registrar_pagamento_contexto_v1(uuid,text,text,text,text,integer,date)','public.registrar_renovacao_nominal_v1(uuid,text,text,text,text,text,integer,date)','public.reservar_assinatura_nominal_v1(uuid,date)','public.reservar_checkout_mensal_contexto_v1(uuid,inet)','public.reservar_pagamento_contexto_v1(uuid,text,date)','public.trocar_retomada_comercial_v1(uuid,text,text)','public.vincular_assinatura_nominal_v1(uuid,text,date)','public.vincular_cobranca_contexto_v1(uuid,text,text,date)']loop
 f:=to_regprocedure(n);if f is null then return 0;end if;
 if has_function_privilege('anon',f,'EXECUTE') or has_function_privilege('authenticated',f,'EXECUTE') then return 0;end if;end loop;
 if (select md5(p.prosrc) from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='private' and p.proname='handle_new_user' and p.pronargs=0) is distinct from 'f26441e373529ce216217dbefad1c52c' then return 0;end if;
 if not exists(select 1 from pg_constraint k where k.conrelid='public.commercial_orders'::regclass and k.conname='commercial_orders_paid_business_check' and position('commercial_nominal_initial_receipt_v1' in pg_get_constraintdef(k.oid))>0) then return 0;end if;
 if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace s on s.oid=c.relnamespace where s.nspname='auth' and c.relname='users' and t.tgname='on_auth_user_created' and t.tgenabled='O' and not t.tgisinternal) then return 0;end if;
 return 1;
end $ready$;
revoke all on function public.comercial_oficial_schema_v1() from public,anon,authenticated;
grant execute on function public.comercial_oficial_schema_v1() to service_role;

-- CANDIDATO LOCAL OFICIAL. NAO APLICADO. Preserva leads_lp.

create table public.commercial_leads_v1 (
  id bigint generated always as identity primary key,
  source_system text not null default 'v2g_site.commercial_leads.v1'
    check (source_system = 'v2g_site.commercial_leads.v1'),
  reference uuid not null unique,
  criado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (char_length(email) <= 160),
  whatsapp text not null check (whatsapp ~ '^[1-9][0-9]{9,10}$'),
  razao_social text not null check (char_length(razao_social) between 2 and 120),
  cnpj text not null check (cnpj ~ '^([0-9]{11}|[0-9]{14})$'),
  document_type text generated always as (case when length(cnpj)=11 then 'cpf' else 'cnpj' end) stored,
  contractor_type text not null check (contractor_type in ('direct', 'agency')),
  contas integer not null check (contas between 1 and 100),
  unidades jsonb not null check (jsonb_typeof(unidades) = 'array'),
  briefing_direto jsonb,
  attribution jsonb not null,
  pagina_origem text,
  consentimento_em timestamptz not null,
  consentimento_texto text not null check (char_length(consentimento_texto) between 10 and 500),
  snapshot_original jsonb not null,
  registro_original jsonb not null,
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  constraint comercial_qa_unidades_contagem check (jsonb_array_length(unidades) = contas),
  constraint comercial_qa_direto_conta check (contractor_type <> 'direct' or contas = 1)
);
comment on table public.commercial_leads_v1 is
  'Fonte oficial; ID exige ambiente e namespace v2g_site.commercial_leads.v1.';
create index commercial_leads_v1_ip_em on public.commercial_leads_v1(ip_hash, criado_em desc);
alter table public.commercial_leads_v1 enable row level security;
revoke all on table public.commercial_leads_v1 from public, anon, authenticated,service_role;

create function public.inserir_lead_comercial_v1(p_record jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_data jsonb;
  v_consent jsonb;
  v_attribution jsonb;
  v_id bigint;
  v_reference uuid;
  v_contas integer;
  v_anterior record;
begin
  if p_record is null or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  if to_regprocedure('public.comercial_oficial_schema_v1()') is null then return jsonb_build_object('ok',false,'motivo','indisponivel');end if;
  if public.comercial_oficial_schema_v1()<>1 then return jsonb_build_object('ok',false,'motivo','indisponivel');end if;
  v_data := p_record->'data';
  v_consent := p_record->'consent';
  v_attribution := p_record->'attribution';
  if v_data->>'schemaVersion' is distinct from 'v2g.comercial.lead.v1'
     or v_data->>'reference' is null
     or p_record->>'reference' is distinct from v_data->>'reference'
     or v_data->>'contractorType' not in ('direct','agency')
     or v_data->>'nome' is null or v_data->>'email' is null
     or v_data->>'whatsapp' is null or v_data->>'razaoSocial' is null
     or v_data->>'cnpj' is null or v_data->'units' is null
     or v_data ?| array['periodo','metodo','vendeWhatsApp','preco']
     or jsonb_typeof(v_data->'units') is distinct from 'array'
     or jsonb_typeof(v_attribution) is distinct from 'object'
     or v_consent->>'text' is null or v_consent->>'at' is null then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  if not public.documento_contratante_valido(v_data->>'cnpj') then return jsonb_build_object('ok',false,'motivo','invalido');end if;
  if exists(select 1 from jsonb_array_elements(v_data->'units') u where jsonb_typeof(u) is distinct from 'object' or jsonb_typeof(u->'id') is distinct from 'string' or u->>'id' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' or jsonb_typeof(u->'advertiserName') is distinct from 'string' or length(btrim(u->>'advertiserName')) not between 2 and 200)
    or (select count(distinct u->>'id') from jsonb_array_elements(v_data->'units') u)<>jsonb_array_length(v_data->'units') then return jsonb_build_object('ok',false,'motivo','invalido');end if;
  begin
    v_reference := (p_record->>'reference')::uuid;
    v_contas := (v_data->>'contas')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;
  if v_contas not between 1 and 100 or jsonb_array_length(v_data->'units') <> v_contas then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('commercial_leads_v1_ref:' || v_reference::text, 0));
  select id, ip_hash, registro_original into v_anterior
    from public.commercial_leads_v1 where reference = v_reference;
  if found then
    if v_anterior.ip_hash = p_ip_hash and
       (v_anterior.registro_original #- '{consent,at}') = (p_record #- '{consent,at}') then
      return jsonb_build_object('ok', true, 'id', v_anterior.id::text, 'record', v_anterior.registro_original);
    end if;
    return jsonb_build_object('ok', false, 'motivo', 'divergente');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('commercial_leads_v1_ip:' || p_ip_hash, 0));
  select count(*) into v_contas from public.commercial_leads_v1
    where ip_hash = p_ip_hash and criado_em > now() - interval '1 hour';
  if v_contas >= 5 then return jsonb_build_object('ok', false, 'motivo', 'limite'); end if;
  begin
    insert into public.commercial_leads_v1(
      reference, nome, email, whatsapp, razao_social, cnpj, contractor_type, contas,
      unidades, briefing_direto, attribution, pagina_origem, consentimento_em,
      consentimento_texto, snapshot_original, registro_original, ip_hash
    ) values (
      v_reference, v_data->>'nome', v_data->>'email', v_data->>'whatsapp',
      v_data->>'razaoSocial', v_data->>'cnpj', v_data->>'contractorType',
      (v_data->>'contas')::integer, v_data->'units', p_record->'briefingDireto',
      v_attribution, p_record->>'paginaOrigem', (v_consent->>'at')::timestamptz,
      v_consent->>'text', v_data, p_record, p_ip_hash
    ) returning id into v_id;
  exception when check_violation or not_null_violation or string_data_right_truncation
               or invalid_datetime_format or unique_violation then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;
  return jsonb_build_object('ok', true, 'id', v_id::text, 'record', p_record);
end;
$$;
revoke all on function public.inserir_lead_comercial_v1(jsonb,text)
  from public, anon, authenticated, service_role;
grant execute on function public.inserir_lead_comercial_v1(jsonb,text) to service_role;

do $v2g_preserve$
declare r record; n bigint; h text; expr text;
begin
 for r in select * from jsonb_to_recordset($v2g_expected$[{"name":"ad_accounts","checksum":"688300bad7e3a52c468bf466c435eeaa","row_count":5},{"name":"agency_advertisers","checksum":"822345d6aa324004eeb23d937108a3a7","row_count":1},{"name":"analysis_runs","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"business_memberships","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"businesses","checksum":"44952520dd799d5a9389c5e848cf4985","row_count":9},{"name":"campaigns","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"campanhas_criacao","checksum":"6b5b5e142eff10027cbd9e983701e706","row_count":1},{"name":"campanhas_criacao_arquivadas_20260923","checksum":"6f7b75275267936ccb9da6bd0f1a633a","row_count":5},{"name":"campanhas_meta","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"checkout_3ds_context","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"checkout_security_attempts","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_events","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_manual_evidence","checksum":"957d3e092056ac5811f1da492a5f4a98","row_count":1},{"name":"commercial_order_units","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_orders","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_payment_email_outbox","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"commercial_payment_events","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"contract_documents","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creative_publication_confirmations","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creative_review_requests","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"creatives","checksum":"05718646553c097c3f8f6172ca8b10de","row_count":11},{"name":"criativos","checksum":"18c4fc9fcc4b03226cd8ac7a88a062d5","row_count":3},{"name":"criativos_arquivados_20260923","checksum":"690506c229442c4a3830a2a8f3956d64","row_count":22},{"name":"decisions","checksum":"263ca269c2f9f7e5198b89d93c15683a","row_count":29},{"name":"divergencias_de_cadastro","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"entrevistas","checksum":"3bc309b1dd246bb4f69c47c499673fc6","row_count":1},{"name":"exclusoes_de_dados","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"execucoes","checksum":"6489644f6173a9f315e1e4ba002b1905","row_count":26},{"name":"execucoes_arquivadas_20260924","checksum":"69aa127315de6f194ee2b0d527dfba36","row_count":2},{"name":"execucoes_de_rotina","checksum":"4ee081cba3f4c497b39ceeead7c68ee4","row_count":222},{"name":"execucoes_teste_arquivadas_20260914","checksum":"931b3097ba6b09dbd6615cc5691e52ad","row_count":20},{"name":"execucoes_teste_arquivadas_20260923","checksum":"21e66eb481ec373ce5d6d39defb24ef7","row_count":8},{"name":"fiscal_documents","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"historical_contract_access","checksum":"a8ecc880375949d5a5ed95c86d68b595","row_count":1},{"name":"historical_contract_access_events","checksum":"dae11f9e522468e211d15916ab737e6c","row_count":2},{"name":"identidade_visual","checksum":"c2f45d795c7bdf52e9bb883304dd8630","row_count":2},{"name":"itens_da_proposta","checksum":"231066ba8d45876e4b7426d0ec731790","row_count":40},{"name":"leads_lp","checksum":"cbccbb6cb2c96ab7836fbf53023fd7b9","row_count":2},{"name":"manager_accounts","checksum":"8428d884960677d275ba81087d4453f0","row_count":1},{"name":"manager_tasks","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"meta_connections","checksum":"2f70c483b188543eb00b49db88ef5831","row_count":3},{"name":"metricas_diarias","checksum":"8bd6edb6efe63ac0b722761a1a15e78e","row_count":3},{"name":"metricas_diarias_arquivadas_20260924","checksum":"9aa955cc247b248b94e0ff56ecbb242d","row_count":24},{"name":"metrics_daily","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"narrativa_negocio","checksum":"6c6bf680321ec33583f1ccaa172d6b73","row_count":2},{"name":"offers","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"perguntas_apresentadas","checksum":"4a9b166948bae40fe50fa7d8eaedfa03","row_count":37},{"name":"pessoas_do_negocio","checksum":"d41d8cd98f00b204e9800998ecf8427e","row_count":0},{"name":"profiles","checksum":"80c1dc66c6fddfcd3e98468e8eb90834","row_count":10},{"name":"propostas_de_perfil","checksum":"09ff36a115afe4577a0a37c82acabcaf","row_count":2},{"name":"respostas_do_dono","checksum":"d64ee1f764a173f1b09846d6c2865f70","row_count":5},{"name":"webapp_legacy_access","checksum":"7c48c950e9844c029fdb082fdd447b19","row_count":10}]$v2g_expected$::jsonb) as x(name text,row_count bigint,checksum text) loop
  expr:=case r.name when 'commercial_orders' then $e$to_jsonb(t)-array['intake_context_id','intake_snapshot','intake_source','contractor_type']$e$
   when 'commercial_order_units' then $e$to_jsonb(t)-array['intake_context_id','intake_unit_id','advertiser_name','advertiser_business_id']$e$ else 'to_jsonb(t)' end;
  execute format('select count(*),md5(coalesce(string_agg((%s)::text,'''' order by (%s)::text),'''')) from public.%I t',expr,expr,r.name) into n,h;
  if n is distinct from r.row_count or h is distinct from r.checksum then raise exception 'v2g_preservacao_divergente: %',r.name; end if;
 end loop;
end $v2g_preserve$;

commit;
