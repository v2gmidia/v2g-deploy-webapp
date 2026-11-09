-- Preparada, não aplicada. A obrigação mensal é única; uma nota rejeitada ou
-- cancelada pode ser substituída sem criar outra obrigação para a competência.
-- Não cria obrigações a partir da data do pagamento: início da prestação exige
-- confirmação operacional antes de qualquer gravação ou emissão.
create table public.fiscal_obligations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  competence_month date not null check (extract(day from competence_month) = 1),
  document_kind text not null check (document_kind = 'service'),
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  unique (order_id, competence_month, document_kind),
  unique (id, order_id)
);

alter table public.fiscal_documents
  add column obligation_id uuid,
  add constraint fiscal_documents_obligation_order_fk
    foreign key (obligation_id, order_id)
    references public.fiscal_obligations(id, order_id) on delete restrict;

create index fiscal_documents_obligation_idx
  on public.fiscal_documents(obligation_id) where obligation_id is not null;

-- Uma obrigação pode ter tentativas rejeitadas ou canceladas, mas nunca duas
-- NFS-e simultaneamente registradas como autorizadas para a mesma competência.
create unique index fiscal_documents_one_authorized_per_obligation_idx
  on public.fiscal_documents(obligation_id)
  where obligation_id is not null and status = 'authorized';

-- Documentos existentes permanecem sem vínculo até conferência da competência
-- na fonte fiscal. A migração não altera seu estado nem o converte em obrigação.
alter table public.fiscal_obligations enable row level security;
revoke all on public.fiscal_obligations from anon, authenticated;
grant select on public.fiscal_obligations to authenticated;
create policy fiscal_obligations_read_own on public.fiscal_obligations for select to authenticated
  using (exists (select 1 from public.commercial_orders o
    where o.id = order_id and o.buyer_profile_id = (select auth.uid())));

create function public.documento_contratante_valido(p_documento text)
returns boolean language plpgsql immutable security invoker set search_path='' as $validador$
declare n integer; tamanho integer; pos integer; soma integer; peso integer; digito integer;
begin
  if p_documento is null or p_documento !~ '^([0-9]{11}|[0-9]{14})$'
    or p_documento ~ '^([0-9])\1+$' then return false; end if;
  n:=length(p_documento);
  for tamanho in (n-2)..(n-1) loop
    soma:=0;
    for pos in 1..tamanho loop
      peso:=case when n=11 then tamanho+2-pos else ((tamanho-pos)%8)+2 end;
      soma:=soma+substr(p_documento,pos,1)::integer*peso;
    end loop;
    if n=11 then
      digito:=(soma*10)%11;
      if digito=10 then digito:=0; end if;
    else
      digito:=case when soma%11<2 then 0 else 11-soma%11 end;
    end if;
    if substr(p_documento,tamanho+1,1)::integer<>digito then return false; end if;
  end loop;
  return true;
end;
$validador$;
revoke all on function public.documento_contratante_valido(text) from public,anon,authenticated;
grant execute on function public.documento_contratante_valido(text) to service_role;

-- Validar novos documentos, sem invalidar atualizacao nao documental de CNPJ legado.
create function public.conferir_documento_contratante_gravado()
returns trigger language plpgsql security invoker set search_path='' as $trigger$
declare novo text; anterior text;
begin
  novo:=to_jsonb(new)->>TG_ARGV[0];
  if TG_OP='UPDATE' then
    anterior:=to_jsonb(old)->>TG_ARGV[0];
    if novo is not distinct from anterior then return new; end if;
  end if;
  if not public.documento_contratante_valido(novo) then raise exception 'documento_contratante_invalido'; end if;
  return new;
end;
$trigger$;
revoke all on function public.conferir_documento_contratante_gravado() from public,anon,authenticated;
grant execute on function public.conferir_documento_contratante_gravado() to service_role;


-- Proposta LOCAL. Registro documental e vinculo PROPOSTO; nunca concessao de acesso.
-- Depende da carteira e ledger financeiro existentes. Independe de ativar checkout/3DS.
-- Nao aplicar sem portao.

create table public.commercial_manual_evidence (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  order_id uuid references public.commercial_orders(id) on delete restrict,
  proposed_profile_id uuid references public.profiles(id) on delete restrict,
  claimed_email text not null check (claimed_email = lower(btrim(claimed_email)) and length(claimed_email) between 3 and 254
    and claimed_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  claimed_cnpj text not null check (claimed_cnpj ~ '^[0-9]{14}$'),
  source_system text not null check (source_system in ('direct_pix','historical_contract')),
  source_reference text not null check (source_reference=btrim(source_reference) and length(source_reference) between 5 and 300
    and source_reference !~ '[[:cntrl:]]'),
  source_date date not null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','checked','rejected')),
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text check (length(review_note) between 5 and 1000),
  check ((status='pending' and reviewed_by is null and reviewed_at is null and review_note is null)
    or (status in ('checked','rejected') and reviewed_by is not null and reviewed_at is not null and review_note is not null))
);
create unique index commercial_manual_evidence_source_idx on public.commercial_manual_evidence(source_system,lower(source_reference));
create index commercial_manual_evidence_business_idx on public.commercial_manual_evidence(business_id,recorded_at desc);
alter table public.commercial_manual_evidence enable row level security;
revoke all on public.commercial_manual_evidence from public,anon,authenticated,service_role;
grant select on public.commercial_manual_evidence to service_role;
grant insert(id,business_id,order_id,proposed_profile_id,claimed_email,claimed_cnpj,
  source_system,source_reference,source_date,recorded_by) on public.commercial_manual_evidence to service_role;
grant update(status,reviewed_by,reviewed_at,review_note) on public.commercial_manual_evidence to service_role;

-- O servidor autentica app_metadata.papel=operador; a RPC exige tambem carteira
-- explicita por negocio. Sem atribuicao, sem registro. Nao cria atribuicao.
create function public.registrar_evidencia_manual(
  p_id uuid,p_business_id uuid,p_order_id uuid,p_profile_id uuid,p_email text,p_cnpj text,
  p_source text,p_reference text,p_source_date date,p_operator_id uuid
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_old public.commercial_manual_evidence%rowtype; v_business public.businesses%rowtype;
  v_order public.commercial_orders%rowtype; v_email text:=lower(btrim(p_email)); v_ref text:=btrim(p_reference);
begin
  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.
  if p_id is null or p_business_id is null or p_operator_id is null
      or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(v_email)>254
      or p_cnpj is null or not public.documento_contratante_valido(p_cnpj)
      or p_source is null or p_source not in ('direct_pix','historical_contract')
      or v_ref is null or length(v_ref) not between 5 and 300
      or p_source_date is null or p_source_date>(now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'evidencia_invalida'; end if;
  perform 1 from public.manager_accounts where business_id=p_business_id and operator_profile_id=p_operator_id for share;
  if not found then raise exception 'carteira_nao_autorizada'; end if;
  select * into v_business from public.businesses where id=p_business_id for share;
  if not found or (v_business.profile_id is not null and v_business.profile_id is distinct from p_profile_id)
      or (v_business.claim_email is not null and lower(btrim(v_business.claim_email))<>v_email) then
    raise exception 'identidade_divergente'; end if;
  if p_order_id is not null then
    select * into v_order from public.commercial_orders where id=p_order_id for share;
    if not found or v_order.business_id is distinct from p_business_id
        or v_order.buyer_email is distinct from v_email or v_order.cnpj is distinct from p_cnpj
        or (v_order.buyer_profile_id is not null and v_order.buyer_profile_id is distinct from p_profile_id) then
      raise exception 'pedido_divergente'; end if;
  end if;
  insert into public.commercial_manual_evidence(id,business_id,order_id,proposed_profile_id,
    claimed_email,claimed_cnpj,source_system,source_reference,source_date,recorded_by)
    values(p_id,p_business_id,p_order_id,p_profile_id,v_email,p_cnpj,p_source,v_ref,p_source_date,p_operator_id)
    on conflict do nothing;
  select * into v_old from public.commercial_manual_evidence where id=p_id or (source_system=p_source and lower(source_reference)=lower(v_ref))
    order by (id=p_id) desc limit 1;
  if not found or v_old.business_id<>p_business_id or v_old.order_id is distinct from p_order_id
      or v_old.proposed_profile_id is distinct from p_profile_id or v_old.claimed_email<>v_email
      or v_old.claimed_cnpj<>p_cnpj or v_old.source_system<>p_source or v_old.source_reference<>v_ref
      or v_old.source_date<>p_source_date then raise exception 'evidencia_duplicada_divergente'; end if;
  return v_old.id;
end;
$$;

create function public.revisar_evidencia_manual(p_id uuid,p_business_id uuid,p_operator_id uuid,
  p_status text,p_note text,p_identity_checked boolean,p_source_checked boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_old public.commercial_manual_evidence%rowtype; v_business public.businesses%rowtype;
  v_order public.commercial_orders%rowtype;
begin
  if p_status is null or p_status not in ('checked','rejected') or p_note is null or length(btrim(p_note)) not between 5 and 1000
      or p_operator_id is null then return false; end if;
  perform 1 from public.manager_accounts where business_id=p_business_id and operator_profile_id=p_operator_id for share;
  if not found then return false; end if;
  select * into v_old from public.commercial_manual_evidence where id=p_id and business_id=p_business_id for update;
  if not found then return false; end if;
  if p_status='checked' then
    if p_identity_checked is distinct from true or p_source_checked is distinct from true then return false; end if;
    select * into v_business from public.businesses where id=p_business_id for share;
    if not found or (v_business.profile_id is not null and v_business.profile_id is distinct from v_old.proposed_profile_id)
        or (v_business.claim_email is not null and lower(btrim(v_business.claim_email))<>v_old.claimed_email) then return false; end if;
    if v_old.order_id is not null then
      select * into v_order from public.commercial_orders where id=v_old.order_id for share;
      if not found or v_order.business_id is distinct from p_business_id or v_order.status='cancelled'
          or v_order.buyer_email is distinct from v_old.claimed_email or v_order.cnpj is distinct from v_old.claimed_cnpj
          or (v_order.buyer_profile_id is not null and v_order.buyer_profile_id is distinct from v_old.proposed_profile_id)
          or exists(select 1 from public.commercial_payment_events e where e.order_id=v_order.id
            and e.provider_charge_id=v_order.provider_charge_id and e.event_type not in (
              'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
              'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED')) then
        return false; end if;
    end if;
  end if;
  if v_old.status<>'pending' then return v_old.status=p_status and v_old.review_note=btrim(p_note); end if;
  update public.commercial_manual_evidence set status=p_status,review_note=btrim(p_note),reviewed_by=p_operator_id,reviewed_at=now()
    where id=p_id;
  -- Nenhuma escrita em commercial_orders, businesses, Auth ou legacy_access.
  return true;
end;
$$;
revoke all on function public.registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid) from public,anon,authenticated;
revoke all on function public.revisar_evidencia_manual(uuid,uuid,uuid,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid) to service_role;
grant execute on function public.revisar_evidencia_manual(uuid,uuid,uuid,text,text,boolean,boolean) to service_role;

alter table public.commercial_orders drop constraint commercial_orders_cnpj_check;
alter table public.commercial_orders add constraint commercial_orders_cnpj_check check(cnpj ~ '^([0-9]{11}|[0-9]{14})$');
alter table public.commercial_orders add column contractor_document_type text generated always as(case length(cnpj) when 11 then 'cpf' when 14 then 'cnpj' end) stored;
create trigger conferir_documento_contratante before insert or update of cnpj on public.commercial_orders for each row execute function public.conferir_documento_contratante_gravado('cnpj');
comment on column public.commercial_orders.cnpj is 'CPF ou CNPJ do contratante, somente digitos; nome legado preservado. Tipo em contractor_document_type. Nao identifica o titular do cartao.';

alter table public.onboarding_meetings drop constraint onboarding_meetings_cnpj_check;
alter table public.onboarding_meetings add constraint onboarding_meetings_cnpj_check check(cnpj ~ '^([0-9]{11}|[0-9]{14})$');
alter table public.onboarding_meetings add column contractor_document_type text generated always as(case length(cnpj) when 11 then 'cpf' when 14 then 'cnpj' end) stored;
create trigger conferir_documento_contratante before insert or update of cnpj on public.onboarding_meetings for each row execute function public.conferir_documento_contratante_gravado('cnpj');
comment on column public.onboarding_meetings.cnpj is 'CPF ou CNPJ do contratante, somente digitos; nome legado preservado. Tipo em contractor_document_type. Nao identifica o titular do cartao.';

alter table public.commercial_manual_evidence drop constraint commercial_manual_evidence_claimed_cnpj_check;
alter table public.commercial_manual_evidence add constraint commercial_manual_evidence_claimed_cnpj_check check(claimed_cnpj ~ '^([0-9]{11}|[0-9]{14})$');
alter table public.commercial_manual_evidence add column contractor_document_type text generated always as(case length(claimed_cnpj) when 11 then 'cpf' when 14 then 'cnpj' end) stored;
create trigger conferir_documento_contratante before insert or update of claimed_cnpj on public.commercial_manual_evidence for each row execute function public.conferir_documento_contratante_gravado('claimed_cnpj');
comment on column public.commercial_manual_evidence.claimed_cnpj is 'CPF ou CNPJ do contratante, somente digitos; nome legado preservado. Tipo em contractor_document_type. Nao identifica o titular do cartao.';
comment on column public.commercial_orders.declares_cnpj is 'Confirmacao do documento informado pelo contratante (CPF ou CNPJ). Nome legado preservado; nao consulta cadastro.';
drop index public.commercial_orders_one_open_direct_pix;
drop index public.commercial_orders_one_open_self_service;
drop index public.commercial_orders_one_open_assisted_asaas;
drop index public.onboarding_meetings_uma_ativa_por_cnpj;
create index commercial_orders_contratante_lookup on public.commercial_orders(lower(buyer_email),cnpj);

CREATE OR REPLACE FUNCTION public.registrar_pedido_asaas_assistido(p_ref text, p_source_lead_id bigint, p_email text, p_whatsapp text, p_buyer_name text, p_legal_name text, p_cnpj text, p_unit_count integer, p_billing_period text, p_payment_method text, p_operator_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_email text:=lower(btrim(p_email));
  v_phone text:=regexp_replace(coalesce(p_whatsapp,''),'[^0-9]','','g');
  v_old public.commercial_orders%rowtype;
  v_lead public.leads_lp%rowtype;
  v_business uuid;
  v_order uuid;
begin
  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.
  if p_ref is null or p_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    -- Papel validado por getUser()+app_metadata na action antes do cliente admin.
    -- RPC exclusiva do servidor; nao amplia grants nem consulta auth.users.
    or p_operator_id is null or not exists(select 1 from public.profiles p where p.id=p_operator_id)
    or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(v_email)>254
    or v_phone !~ '^[1-9][0-9]{9,10}$' or p_buyer_name is null or length(btrim(p_buyer_name)) not between 3 and 120
    or btrim(p_buyer_name) !~ '^[^[:space:]]+[[:space:]]+[^[:space:]]+'
    or p_legal_name is null or length(btrim(p_legal_name)) not between 2 and 200
    or p_cnpj is null or not public.documento_contratante_valido(p_cnpj) or p_unit_count is null or p_unit_count not between 1 and 100
    or p_billing_period is null or p_billing_period not in ('monthly','semiannual_upfront','annual_upfront')
    or p_payment_method is null or p_payment_method not in ('asaas_pix','asaas_card')
    or (p_billing_period='monthly' and p_payment_method<>'asaas_card')
    or (p_source_lead_id is not null and p_source_lead_id<=0) then raise exception 'pedido_assistido_invalido'; end if;
  perform pg_advisory_xact_lock(hashtextextended('assisted-asaas-ref:'||p_ref,0));
  perform pg_advisory_xact_lock(hashtextextended('assisted-asaas-contact:'||v_email||':'||p_cnpj,0));
  if p_source_lead_id is not null then
    -- Mesmo namespace de lock do vinculo legado: concorrencia nao converte lead duas vezes.
    perform pg_advisory_xact_lock(hashtextextended('commercial_order:v2g_site:'||p_source_lead_id::text,0));
    select * into v_lead from public.leads_lp where id=p_source_lead_id;
    if not found or v_lead.cnpj is distinct from p_cnpj or lower(btrim(v_lead.email)) is distinct from v_email
      or regexp_replace(v_lead.whatsapp,'[^0-9]','','g') is distinct from v_phone
      or v_lead.vende_whatsapp is distinct from true or v_lead.consentimento_em is null
      or length(btrim(coalesce(v_lead.consentimento_texto,'')))<10 then raise exception 'lead_divergente'; end if;
  end if;
  select * into v_old from public.commercial_orders where external_ref=p_ref;
  if not found and p_source_lead_id is not null then
    select * into v_old from public.commercial_orders where source_system='v2g_site' and source_lead_id=p_source_lead_id;
  end if;
  if v_old.id is not null then
    if v_old.origin='assisted' and v_old.payment_method=p_payment_method and v_old.assisted_operator_id=p_operator_id
      and v_old.buyer_email=v_email and v_old.cnpj=p_cnpj and v_old.buyer_whatsapp=v_phone
      and v_old.buyer_name=btrim(p_buyer_name) and v_old.legal_name=btrim(p_legal_name)
      and v_old.unit_count=p_unit_count and v_old.billing_period=p_billing_period
      and v_old.source_lead_id is not distinct from p_source_lead_id then return v_old.id; end if;
    raise exception 'pedido_existente_divergente';
  end if;
  -- Nao recebe business_id do navegador e nao se apropria de negocio existente.
  insert into public.businesses(name,claim_email) values(btrim(p_legal_name),v_email) returning id into v_business;
  insert into public.commercial_orders(external_ref,buyer_email,buyer_name,buyer_whatsapp,business_id,legal_name,cnpj,
    declares_cnpj,sells_by_whatsapp,origin,payment_method,billing_period,unit_price_cents,discount_percent,unit_count,total_cents,
    status,assisted_operator_id,source_system,source_lead_id,source_lead_origin,source_lead_utm_source,source_lead_utm_medium,
    source_lead_utm_campaign,source_lead_utm_content,source_lead_consent_at,source_lead_consent_text,source_lead_linked_at)
  values(p_ref,v_email,btrim(p_buyer_name),v_phone,v_business,btrim(p_legal_name),p_cnpj,true,true,'assisted',p_payment_method,
    p_billing_period,50000,case p_billing_period when 'monthly' then 0 when 'semiannual_upfront' then 5 else 12 end,
    p_unit_count,p_unit_count*case p_billing_period when 'monthly' then 50000 when 'semiannual_upfront' then 285000 else 528000 end,
    'awaiting_payment',p_operator_id,case when p_source_lead_id is not null then 'v2g_site' end,p_source_lead_id,
    v_lead.pagina_origem,v_lead.utm_source,v_lead.utm_medium,v_lead.utm_campaign,v_lead.utm_content,
    v_lead.consentimento_em,v_lead.consentimento_texto,case when p_source_lead_id is not null then now() end)
  returning id into v_order;
  insert into public.commercial_order_units(order_id,ordinal) select v_order,generate_series(1,p_unit_count);
  insert into public.commercial_events(order_id,source,external_event_id,event_type,actor_profile_id)
    values(v_order,'operator','assisted-asaas:'||p_ref,'assisted_asaas_order_registered',p_operator_id);
  if p_source_lead_id is not null then
    insert into public.commercial_events(order_id,source,external_event_id,event_type,actor_profile_id)
      values(v_order,'operator','lead-converted:v2g_site:'||p_source_lead_id::text,'lead_convertido_em_pedido',p_operator_id);
  end if;
  return v_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_pedido_pix_assistido(p_ref text, p_email text, p_legal_name text, p_cnpj text, p_unit_count integer, p_billing_period text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(btrim(p_email));
  v_legal_name text := btrim(p_legal_name);
  v_existing public.commercial_orders%rowtype;
  v_business_id uuid;
  v_order_id uuid;
  v_total integer;
begin
  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$' then
    raise exception 'referencia invalida';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 then
    raise exception 'email invalido';
  end if;
  if v_legal_name is null or length(v_legal_name) < 2 or length(v_legal_name) > 200
      or p_cnpj is null or not public.documento_contratante_valido(p_cnpj)
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'annual_upfront') then
    raise exception 'dados do pedido invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('commercial-order-ref:'||p_ref,0));
  select * into v_existing from public.commercial_orders where external_ref = p_ref;
  if found then
    if v_existing.buyer_email = v_email and v_existing.legal_name = v_legal_name
        and v_existing.cnpj = p_cnpj and v_existing.unit_count = p_unit_count
        and v_existing.billing_period = p_billing_period
        and v_existing.payment_method = 'direct_pix' then
      return v_existing.id;
    end if;
    raise exception 'referencia ja utilizada';
  end if;

  -- Nova referencia cria negocio distinto; documento nao funde negocios.
  insert into public.businesses(name, claim_email)
      values (v_legal_name, v_email) returning id into v_business_id;

  v_total := p_unit_count * case p_billing_period
    when 'monthly' then 50000 else 528000 end;
  insert into public.commercial_orders(
    external_ref, buyer_email, business_id, legal_name, cnpj,
    declares_cnpj, sells_by_whatsapp, origin, payment_method,
    billing_period, unit_price_cents, discount_percent, unit_count,
    total_cents, status
  ) values (
    p_ref, v_email, v_business_id, v_legal_name, p_cnpj,
    true, true, 'assisted', 'direct_pix', p_billing_period,
    50000, case p_billing_period when 'monthly' then 0 else 12 end,
    p_unit_count, v_total, 'awaiting_payment'
  ) returning id into v_order_id;

  insert into public.commercial_order_units(order_id, ordinal)
    select v_order_id, generate_series(1, p_unit_count);
  return v_order_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_pedido_pix_assistido_com_lead(p_ref text, p_source_lead_id bigint, p_email text, p_whatsapp text, p_legal_name text, p_cnpj text, p_unit_count integer, p_billing_period text, p_operator_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(btrim(p_email));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_legal_name text := btrim(p_legal_name);
  v_lead public.leads_lp%rowtype;
  v_existing public.commercial_orders%rowtype;
  v_business_id uuid;
  v_order_id uuid;
  v_total integer;
begin
  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$' or p_operator_id is null then
    raise exception 'referencia_e_operador_obrigatorios';
  end if;
  if p_source_lead_id is null or p_source_lead_id <= 0 then
    raise exception 'lead_obrigatorio';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 or v_whatsapp !~ '^[1-9][0-9]{9,10}$' then
    raise exception 'contato_invalido';
  end if;
  if v_legal_name is null or length(v_legal_name) < 2 or length(v_legal_name) > 200
      or p_cnpj is null or not public.documento_contratante_valido(p_cnpj)
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'annual_upfront') then
    raise exception 'dados_do_pedido_invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'commercial_order:v2g_site:' || p_source_lead_id::text, 0
  ));

  select * into v_lead from public.leads_lp where id = p_source_lead_id;
  if not found then raise exception 'lead_nao_encontrado'; end if;
  if v_lead.cnpj is null or v_lead.cnpj <> p_cnpj
      or lower(btrim(v_lead.email)) <> v_email
      or regexp_replace(v_lead.whatsapp, '[^0-9]', '', 'g') <> v_whatsapp then
    raise exception 'lead_e_pedido_divergem';
  end if;
  if not v_lead.vende_whatsapp then
    raise exception 'lead_fora_da_qualificacao_vende_whatsapp';
  end if;

  select * into v_existing from public.commercial_orders
   where source_system = 'v2g_site' and source_lead_id = p_source_lead_id;
  if found then
    if v_existing.buyer_email = v_email and v_existing.cnpj = p_cnpj
        and regexp_replace(coalesce(v_existing.buyer_whatsapp, ''), '[^0-9]', '', 'g') = v_whatsapp
        and v_existing.unit_count = p_unit_count
        and v_existing.billing_period = p_billing_period
        and v_existing.payment_method = 'direct_pix' then
      return v_existing.id;
    end if;
    raise exception 'lead_ja_convertido_com_dados_divergentes';
  end if;

  insert into public.businesses(name, claim_email)
      values (v_legal_name, v_email) returning id into v_business_id;

  v_total := p_unit_count * case p_billing_period
    when 'monthly' then 50000 else 528000 end;
  insert into public.commercial_orders(
    external_ref, buyer_email, buyer_whatsapp, business_id, legal_name, cnpj,
    declares_cnpj, sells_by_whatsapp, origin, payment_method,
    billing_period, unit_price_cents, discount_percent, unit_count,
    total_cents, status, source_system, source_lead_id, source_lead_origin,
    source_lead_utm_source, source_lead_utm_medium, source_lead_utm_campaign,
    source_lead_utm_content, source_lead_consent_at, source_lead_consent_text,
    source_lead_linked_at
  ) values (
    p_ref, v_email, v_whatsapp, v_business_id, v_legal_name, p_cnpj,
    true, v_lead.vende_whatsapp, 'assisted', 'direct_pix', p_billing_period,
    50000, case p_billing_period when 'monthly' then 0 else 12 end,
    p_unit_count, v_total, 'awaiting_payment', 'v2g_site', v_lead.id,
    v_lead.pagina_origem, v_lead.utm_source, v_lead.utm_medium,
    v_lead.utm_campaign, v_lead.utm_content, v_lead.consentimento_em,
    v_lead.consentimento_texto, now()
  ) returning id into v_order_id;

  insert into public.commercial_order_units(order_id, ordinal)
    select v_order_id, generate_series(1, p_unit_count);

  insert into public.commercial_events(
    order_id, source, external_event_id, event_type, actor_profile_id
  ) values (
    v_order_id, 'operator',
    'lead-converted:v2g_site:' || v_lead.id::text,
    'lead_convertido_em_pedido', p_operator_id
  );

  return v_order_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_pedido_self_service(p_ref text, p_email text, p_buyer_name text, p_whatsapp text, p_legal_name text, p_cnpj text, p_unit_count integer, p_billing_period text, p_payment_method text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(btrim(p_email));
  v_name text := btrim(p_legal_name);
  v_buyer_name text := btrim(p_buyer_name);
  v_existing public.commercial_orders%rowtype;
  v_business_id uuid;
  v_order_id uuid;
begin
  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$'
      or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 or v_buyer_name is null
      or length(v_buyer_name) not between 2 and 120
      or v_buyer_name !~ '^[^[:space:]]+[[:space:]]+[^[:space:]]+'
      or p_whatsapp is null or p_whatsapp !~ '^[0-9]{10,13}$'
      or v_name is null or length(v_name) < 2
      or length(v_name) > 200 or p_cnpj is null or not public.documento_contratante_valido(p_cnpj)
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'semiannual_upfront', 'annual_upfront')
      or p_payment_method not in ('asaas_pix', 'asaas_card')
      or (p_billing_period = 'monthly' and p_payment_method <> 'asaas_card') then
    raise exception 'dados do pedido invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('commercial-order-ref:'||p_ref,0));
  select * into v_existing from public.commercial_orders where external_ref = p_ref;
  if found then
    if v_existing.buyer_email = v_email and v_existing.buyer_name = v_buyer_name
        and v_existing.buyer_whatsapp = p_whatsapp and v_existing.legal_name = v_name
        and v_existing.cnpj = p_cnpj and v_existing.unit_count = p_unit_count
        and v_existing.billing_period = p_billing_period
        and v_existing.payment_method = p_payment_method
        and v_existing.origin = 'self_service' then
      return v_existing.id;
    end if;
    raise exception 'referencia ja utilizada';
  end if;

  insert into public.businesses(name, claim_email)
      values (v_name, v_email) returning id into v_business_id;

  insert into public.commercial_orders(
    external_ref, buyer_email, buyer_name, buyer_whatsapp, business_id, legal_name, cnpj,
    declares_cnpj, sells_by_whatsapp, origin, payment_method,
    billing_period, unit_price_cents, discount_percent, unit_count,
    total_cents, status
  ) values (
    p_ref, v_email, v_buyer_name, p_whatsapp, v_business_id, v_name, p_cnpj,
    true, true, 'self_service', p_payment_method,
    p_billing_period, 50000, case p_billing_period
      when 'monthly' then 0 when 'semiannual_upfront' then 5 else 12 end,
    p_unit_count, p_unit_count * case p_billing_period
      when 'monthly' then 50000 when 'semiannual_upfront' then 285000 else 528000 end,
    'awaiting_payment'
  ) returning id into v_order_id;

  insert into public.commercial_order_units(order_id, ordinal)
    select v_order_id, generate_series(1, p_unit_count);
  return v_order_id;
end;
$function$
;

-- LOCAL N26-05. Prerequisites: manual_contract_evidence + cpf_cnpj_contratante_v0.
-- No Auth users, commercial orders, payments or legacy exceptions are created.

-- Keep the existing profile trigger, but suppress its email-based business claim
-- for this signup flow. User-editable marker can only DENY automatic claims.
-- Guard the exact installed definition; unknown versions abort instead of replacing blindly.
CREATE OR REPLACE FUNCTION private.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, whatsapp)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'whatsapp'
  );

  -- Reivindicação no primeiro login: o N8N pode ter criado o negócio
  -- antes de o dono se cadastrar. Não usa claim_businesses() porque
  -- aqui ainda não existe `auth.uid()` — a sessão não começou.
  if new.email is not null and (new.raw_user_meta_data ->> 'access_flow') is distinct from 'historical_contract' then
    update public.businesses b
       set profile_id  = new.id,
           claim_email = null
     where b.profile_id is null
       and b.claim_email is not null
       and lower(b.claim_email) = lower(new.email);
  end if;

  return new;
end;
$function$
;

create table public.historical_contract_access (
 id uuid primary key,
 evidence_id uuid not null unique references public.commercial_manual_evidence(id) on delete restrict,
 business_id uuid not null references public.businesses(id) on delete restrict,
 previous_profile_id uuid references public.profiles(id),
 recipient_email text not null check(recipient_email=lower(btrim(recipient_email))),
 contractor_document text not null check(public.documento_contratante_valido(contractor_document)),
 contractor_document_type text generated always as
   (case length(contractor_document) when 11 then 'cpf' else 'cnpj' end) stored,
 issued_by uuid not null references public.profiles(id),
 issued_at timestamptz not null default now(),
 issue_note text not null check(length(btrim(issue_note)) between 5 and 1000),
 accept_before timestamptz not null default(now()+interval '7 days'),
 accepted_by uuid references public.profiles(id), accepted_at timestamptz,
 revoked_by uuid references public.profiles(id), revoked_at timestamptz, revoke_note text,
 check((accepted_by is null)=(accepted_at is null)),
 check((revoked_by is null and revoked_at is null and revoke_note is null)
   or (revoked_by is not null and revoked_at is not null and length(btrim(revoke_note)) between 5 and 1000))
);
create table public.historical_contract_access_events (
 id bigint generated always as identity primary key,
 access_id uuid not null references public.historical_contract_access(id),
 kind text not null check(kind in ('issued','accepted','revoked')),
 actor_id uuid not null references public.profiles(id),
 occurred_at timestamptz not null default now(),
 unique(access_id,kind)
);
alter table public.historical_contract_access enable row level security;
alter table public.historical_contract_access_events enable row level security;
revoke all on public.historical_contract_access,public.historical_contract_access_events from public,anon,authenticated,service_role;
grant select on public.historical_contract_access,public.historical_contract_access_events to service_role;
grant select on public.historical_contract_access to authenticated;
-- Only accepted grants of the authenticated owner are readable. No invitation enumeration.
create policy historical_access_owner_read on public.historical_contract_access for select to authenticated
 using(accepted_by=(select auth.uid()) and revoked_at is null
   and exists(select 1 from public.businesses b where b.id=business_id and b.profile_id=(select auth.uid())));

-- Service-only: web action independently authenticates operator. Database repeats role + wallet checks.
create function public.emitir_acesso_contratado(p_id uuid,p_evidence_id uuid,p_operator_id uuid,p_note text)
 returns uuid language plpgsql security definer set search_path='' as $$
declare e public.commercial_manual_evidence%rowtype; b public.businesses%rowtype;
 old public.historical_contract_access%rowtype;
begin
 if p_id is null or p_note is null or length(btrim(p_note)) not between 5 and 1000
   or not exists(select 1 from auth.users where id=p_operator_id and raw_app_meta_data->>'papel'='operador')
 then raise exception 'concessao_nao_autorizada'; end if;
 select * into e from public.commercial_manual_evidence where id=p_evidence_id for share;
 if not found or e.status<>'checked' or e.source_system<>'historical_contract' or e.order_id is not null
   or e.reviewed_by is null or not public.documento_contratante_valido(e.claimed_cnpj)
 then raise exception 'contratacao_nao_conferida'; end if;
 perform 1 from public.manager_accounts where business_id=e.business_id and operator_profile_id=p_operator_id for share;
 if not found then raise exception 'carteira_nao_autorizada'; end if;
 select * into b from public.businesses where id=e.business_id for update;
 if not found then raise exception 'negocio_indisponivel'; end if;
 select * into old from public.historical_contract_access where evidence_id=e.id;
 if found then
   if old.issue_note<>btrim(p_note) or old.issued_by<>p_operator_id or old.revoked_at is not null
   then raise exception 'reenvio_divergente'; end if;
   return old.id;
 end if;
 -- No claim_email: the existing signup trigger must not claim this business by email.
 if b.claim_email is not null or b.profile_id is distinct from e.proposed_profile_id
   or exists(select 1 from public.commercial_orders where business_id=b.id)
   or exists(select 1 from public.historical_contract_access where business_id=b.id and revoked_at is null)
 then raise exception 'vinculo_requer_conferencia'; end if;
 if e.proposed_profile_id is not null and not exists(select 1 from auth.users where id=e.proposed_profile_id
   and email_confirmed_at is not null and lower(btrim(email))=e.claimed_email)
 then raise exception 'perfil_divergente'; end if;
 insert into public.historical_contract_access(id,evidence_id,business_id,previous_profile_id,recipient_email,contractor_document,issued_by,issue_note)
 values(p_id,e.id,b.id,b.profile_id,e.claimed_email,e.claimed_cnpj,p_operator_id,btrim(p_note));
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(p_id,'issued',p_operator_id);
 return p_id;
end $$;

-- Authenticated acceptance of an EXPLICIT grant ID; never scans email/document for businesses.
create function public.aceitar_acesso_contratado(p_id uuid) returns boolean
 language plpgsql security definer set search_path='' as $$
declare g public.historical_contract_access%rowtype; b public.businesses%rowtype;
 e public.commercial_manual_evidence%rowtype; u uuid:=auth.uid(); mail text;
begin
 select lower(btrim(email)) into mail from auth.users where id=u and email_confirmed_at is not null;
 if u is null or mail is null then return false; end if;
 select * into g from public.historical_contract_access where id=p_id for update;
 if not found or g.revoked_at is not null or g.recipient_email<>mail
   or (g.accepted_by is null and g.accept_before<=now())
   or (g.accepted_by is not null and g.accepted_by<>u) then return false; end if;
 select * into e from public.commercial_manual_evidence where id=g.evidence_id for share;
 if not found or e.status<>'checked' or e.source_system<>'historical_contract' or e.order_id is not null
   or e.business_id<>g.business_id or e.claimed_email<>mail or e.claimed_cnpj<>g.contractor_document
   or (e.proposed_profile_id is not null and e.proposed_profile_id<>u) then return false; end if;
 select * into b from public.businesses where id=g.business_id for update;
 if not found or b.claim_email is not null or (b.profile_id is not null and b.profile_id<>u)
   or exists(select 1 from public.commercial_orders where business_id=b.id) then return false; end if;
 if g.accepted_by=u then return b.profile_id=u; end if;
 update public.businesses set profile_id=u where id=g.business_id and (profile_id is null or profile_id=u);
 update public.historical_contract_access set accepted_by=u,accepted_at=now() where id=g.id;
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(g.id,'accepted',u);
 return true;
end $$;

create function public.revogar_acesso_contratado(p_id uuid,p_operator_id uuid,p_note text) returns boolean
 language plpgsql security definer set search_path='' as $$
declare g public.historical_contract_access%rowtype;
begin
 if p_note is null or length(btrim(p_note)) not between 5 and 1000
   or not exists(select 1 from auth.users where id=p_operator_id and raw_app_meta_data->>'papel'='operador') then return false; end if;
 select * into g from public.historical_contract_access where id=p_id for update;
 if not found or not exists(select 1 from public.manager_accounts where business_id=g.business_id and operator_profile_id=p_operator_id)
 then return false; end if;
 if g.revoked_at is not null then return g.revoked_by=p_operator_id and g.revoke_note=btrim(p_note); end if;
 -- Undo ONLY ownership introduced by this grant, never a pre-existing owner,
 -- another business or ownership supporting an independent commercial order.
 perform 1 from public.businesses where id=g.business_id for update;
 if g.previous_profile_id is null and g.accepted_by is not null
   and not exists(select 1 from public.commercial_orders where business_id=g.business_id)
   and not exists(select 1 from public.historical_contract_access where business_id=g.business_id and id<>g.id and revoked_at is null)
 then update public.businesses set profile_id=null where id=g.business_id and profile_id=g.accepted_by; end if;
 update public.historical_contract_access set revoked_by=p_operator_id,revoked_at=now(),revoke_note=btrim(p_note) where id=p_id;
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(p_id,'revoked',p_operator_id);
 return true;
end $$;
revoke all on function public.emitir_acesso_contratado(uuid,uuid,uuid,text),public.revogar_acesso_contratado(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.aceitar_acesso_contratado(uuid) from public,anon,service_role;
grant execute on function public.emitir_acesso_contratado(uuid,uuid,uuid,text),public.revogar_acesso_contratado(uuid,uuid,text) to service_role;
grant execute on function public.aceitar_acesso_contratado(uuid) to authenticated;

revoke all on public.fiscal_obligations from public,anon,authenticated,service_role;
grant select on public.fiscal_obligations to authenticated;
grant select,insert on public.fiscal_obligations to service_role;
revoke all on sequence public.historical_contract_access_events_id_seq from public,anon,authenticated,service_role;
