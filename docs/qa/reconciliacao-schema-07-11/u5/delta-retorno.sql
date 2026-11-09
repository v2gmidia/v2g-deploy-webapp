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
  if new.email is not null then
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
  if p_ref is null or p_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    -- Papel validado por getUser()+app_metadata na action antes do cliente admin.
    -- RPC exclusiva do servidor; nao amplia grants nem consulta auth.users.
    or p_operator_id is null or not exists(select 1 from public.profiles p where p.id=p_operator_id)
    or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(v_email)>254
    or v_phone !~ '^[1-9][0-9]{9,10}$' or p_buyer_name is null or length(btrim(p_buyer_name)) not between 3 and 120
    or btrim(p_buyer_name) !~ '^[^[:space:]]+[[:space:]]+[^[:space:]]+'
    or p_legal_name is null or length(btrim(p_legal_name)) not between 2 and 200
    or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$' or p_unit_count is null or p_unit_count not between 1 and 100
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
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$' then
    raise exception 'referencia invalida';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 then
    raise exception 'email invalido';
  end if;
  if v_legal_name is null or length(v_legal_name) < 2 or length(v_legal_name) > 200
      or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'annual_upfront') then
    raise exception 'dados do pedido invalidos';
  end if;

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

  -- Uma compra adicional do mesmo comprador/CNPJ usa o negócio existente.
  select business_id into v_business_id from public.commercial_orders
    where buyer_email = v_email and cnpj = p_cnpj and business_id is not null
      and status = 'payment_approved'
    order by created_at desc limit 1;
  if v_business_id is null then
    insert into public.businesses(name, claim_email)
      values (v_legal_name, v_email) returning id into v_business_id;
  end if;

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
      or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
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

  select business_id into v_business_id from public.commercial_orders
    where buyer_email = v_email and cnpj = p_cnpj and business_id is not null
      and status = 'payment_approved'
    order by created_at desc limit 1;
  if v_business_id is null then
    insert into public.businesses(name, claim_email)
      values (v_legal_name, v_email) returning id into v_business_id;
  end if;

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
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$'
      or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 or v_buyer_name is null
      or length(v_buyer_name) not between 2 and 120
      or v_buyer_name !~ '^[^[:space:]]+[[:space:]]+[^[:space:]]+'
      or p_whatsapp is null or p_whatsapp !~ '^[0-9]{10,13}$'
      or v_name is null or length(v_name) < 2
      or length(v_name) > 200 or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'semiannual_upfront', 'annual_upfront')
      or p_payment_method not in ('asaas_pix', 'asaas_card')
      or (p_billing_period = 'monthly' and p_payment_method <> 'asaas_card') then
    raise exception 'dados do pedido invalidos';
  end if;

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

  select business_id into v_business_id from public.commercial_orders
    where buyer_email = v_email and cnpj = p_cnpj and business_id is not null
      and status = 'payment_approved'
    order by created_at desc limit 1;
  if v_business_id is null then
    insert into public.businesses(name, claim_email)
      values (v_name, v_email) returning id into v_business_id;
  end if;

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
drop trigger conferir_documento_contratante on public.commercial_orders;
alter table public.commercial_orders drop column contractor_document_type;
alter table public.commercial_orders drop constraint commercial_orders_cnpj_check;
alter table public.commercial_orders add constraint commercial_orders_cnpj_check CHECK ((cnpj ~ '^[0-9]{14}$'::text));
drop trigger conferir_documento_contratante on public.onboarding_meetings;
alter table public.onboarding_meetings drop column contractor_document_type;
alter table public.onboarding_meetings drop constraint onboarding_meetings_cnpj_check;
alter table public.onboarding_meetings add constraint onboarding_meetings_cnpj_check CHECK ((cnpj ~ '^[0-9]{14}$'::text));
drop index public.commercial_orders_contratante_lookup;
CREATE UNIQUE INDEX commercial_orders_one_open_direct_pix ON public.commercial_orders USING btree (lower(buyer_email), cnpj) WHERE ((payment_method = 'direct_pix'::text) AND (status = ANY (ARRAY['awaiting_payment'::text, 'proof_received'::text])));
CREATE UNIQUE INDEX commercial_orders_one_open_self_service ON public.commercial_orders USING btree (lower(buyer_email), cnpj) WHERE ((origin = 'self_service'::text) AND (status = 'awaiting_payment'::text));
CREATE UNIQUE INDEX commercial_orders_one_open_assisted_asaas ON public.commercial_orders USING btree (lower(buyer_email), cnpj) WHERE ((origin = 'assisted'::text) AND (payment_method = ANY (ARRAY['asaas_pix'::text, 'asaas_card'::text])) AND (status = 'awaiting_payment'::text));
CREATE UNIQUE INDEX onboarding_meetings_uma_ativa_por_cnpj ON public.onboarding_meetings USING btree (cnpj) WHERE (status = ANY (ARRAY['pending'::text, 'confirmed'::text]));
alter table public.fiscal_documents drop constraint fiscal_documents_obligation_order_fk;drop index public.fiscal_documents_obligation_idx;drop index public.fiscal_documents_one_authorized_per_obligation_idx;alter table public.fiscal_documents drop column obligation_id;
drop function public.aceitar_acesso_contratado(p_id uuid);
drop function public.emitir_acesso_contratado(p_id uuid, p_evidence_id uuid, p_operator_id uuid, p_note text);
drop function public.registrar_evidencia_manual(p_id uuid, p_business_id uuid, p_order_id uuid, p_profile_id uuid, p_email text, p_cnpj text, p_source text, p_reference text, p_source_date date, p_operator_id uuid);
drop function public.revisar_evidencia_manual(p_id uuid, p_business_id uuid, p_operator_id uuid, p_status text, p_note text, p_identity_checked boolean, p_source_checked boolean);
drop function public.revogar_acesso_contratado(p_id uuid, p_operator_id uuid, p_note text);
drop table public.historical_contract_access_events;
drop table public.historical_contract_access;
drop table public.commercial_manual_evidence;
drop table public.fiscal_obligations;
drop function public.conferir_documento_contratante_gravado();drop function public.documento_contratante_valido(text);
comment on column public.commercial_orders.cnpj is null;
comment on column public.commercial_orders.declares_cnpj is null;
comment on column public.onboarding_meetings.cnpj is null;
