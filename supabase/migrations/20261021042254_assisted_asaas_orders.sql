-- Proposta LOCAL individual. Nao aplicada. Preserva RPCs e direct_pix legados.
alter table public.commercial_orders
  add column assisted_operator_id uuid references public.profiles(id) on delete restrict,
  add constraint commercial_orders_assisted_asaas_actor check (
    not (origin='assisted' and payment_method in ('asaas_pix','asaas_card'))
    or assisted_operator_id is not null
  );
alter table public.commercial_orders drop constraint commercial_orders_3ds_matches;
alter table public.commercial_orders add constraint commercial_orders_3ds_matches check (
  provider_card_flow='direct' or (billing_period='monthly' and payment_method='asaas_card'
    and (origin='self_service' or (origin='assisted' and assisted_operator_id is not null)))
);
create unique index commercial_orders_one_open_assisted_asaas
  on public.commercial_orders(lower(buyer_email),cnpj)
  where origin='assisted' and payment_method in ('asaas_pix','asaas_card') and status='awaiting_payment';

create function public.pedido_asaas_comercial_elegivel(p_order_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.commercial_orders o where o.id=p_order_id
    and o.payment_method in ('asaas_pix','asaas_card')
    and (o.origin='self_service' or (o.origin='assisted' and o.assisted_operator_id is not null)));
$$;
revoke all on function public.pedido_asaas_comercial_elegivel(uuid) from public,anon,authenticated;
grant execute on function public.pedido_asaas_comercial_elegivel(uuid) to service_role;

create function public.registrar_pedido_asaas_assistido(
  p_ref text,p_source_lead_id bigint,p_email text,p_whatsapp text,p_buyer_name text,
  p_legal_name text,p_cnpj text,p_unit_count integer,p_billing_period text,p_payment_method text,p_operator_id uuid
) returns uuid language plpgsql security invoker set search_path='' as $$
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
$$;
revoke all on function public.registrar_pedido_asaas_assistido(text,bigint,text,text,text,text,text,integer,text,text,uuid) from public,anon,authenticated;
grant execute on function public.registrar_pedido_asaas_assistido(text,bigint,text,text,text,text,text,integer,text,text,uuid) to service_role;

-- Variante comercial; RPC historica preservada sem alterar origem.
create function public.aprovar_pagamento_api_comercial(
  p_order_id uuid, p_charge_id text, p_subscription_id text,
  p_customer_id text, p_event_id text, p_event_type text,
  p_total_cents integer, p_due_date date
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.commercial_orders%rowtype;
  v_event_order uuid;
begin
  if p_order_id is null or p_charge_id is null or p_charge_id !~ '^pay_[A-Za-z0-9]+$'
      or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
      or p_event_id is null or length(p_event_id) < 5
      or p_event_type not in ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED')
      or p_total_cents is null or p_total_cents < 1 then return false; end if;

  select * into v_order from public.commercial_orders
    where id = p_order_id for update;
  if not found or not public.pedido_asaas_comercial_elegivel(v_order.id)
      or v_order.provider_checkout_id is not null
      or v_order.provider_customer_id is distinct from p_customer_id
      or v_order.total_cents <> p_total_cents then return false; end if;

  if v_order.billing_period = 'monthly' then
    if v_order.payment_method <> 'asaas_card'
        or p_subscription_id is null
        or v_order.provider_subscription_id is distinct from p_subscription_id
        or v_order.provider_first_due_date is distinct from p_due_date
        or (v_order.provider_charge_id is not null
            and v_order.provider_charge_id <> p_charge_id) then return false; end if;
  elsif v_order.provider_subscription_id is not null
      or p_subscription_id is not null
      or v_order.provider_charge_id is distinct from p_charge_id then
    return false;
  end if;

  if exists(select 1 from public.commercial_payment_events e where e.order_id=p_order_id
      and e.provider_charge_id=p_charge_id and e.event_type not in
      ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED')) then return false; end if;
  if not public.registrar_evento_financeiro_comercial(p_order_id,p_event_id,p_charge_id,p_subscription_id,
      p_customer_id,p_event_type,p_total_cents,p_due_date) then return false; end if;
  select order_id into v_event_order from public.commercial_events
    where source = 'asaas' and external_event_id = p_event_id;
  if found then return v_event_order = p_order_id; end if;
  if v_order.status = 'payment_approved' then return true; end if;
  if v_order.status <> 'awaiting_payment' then return false; end if;

  insert into public.commercial_events(order_id, source, external_event_id, event_type)
    values (p_order_id, 'asaas', p_event_id, p_event_type);
  update public.commercial_orders
    set status = 'payment_approved', payment_approved_at = now(),
        provider_charge_id = p_charge_id, updated_at = now()
    where id = p_order_id;
  return true;
end;
$$;
revoke all on function public.aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date) from public,anon,authenticated;
grant execute on function public.aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date) to service_role;

-- Variante comercial; RPC historica preservada sem alterar origem.
create function public.registrar_evento_financeiro_comercial(
  p_order_id uuid, p_event_id text, p_charge_id text, p_subscription_id text,
  p_customer_id text, p_event_type text, p_amount_cents integer, p_due_date date
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.commercial_orders%rowtype;
  v_old public.commercial_payment_events%rowtype;
begin
  if p_order_id is null or p_event_id is null or length(p_event_id) < 5
      or p_charge_id is null or p_charge_id !~ '^pay_[A-Za-z0-9]+$'
      or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
      or p_amount_cents is null or p_amount_cents < 1 or p_due_date is null
      or p_event_type not in (
        'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_OVERDUE',
        'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', 'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
        'PAYMENT_REFUND_IN_PROGRESS', 'PAYMENT_PARTIALLY_REFUNDED', 'PAYMENT_REFUNDED',
        'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
        'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
      ) then return false; end if;

  select * into v_order from public.commercial_orders
    where id = p_order_id for update;
  if not found or not public.pedido_asaas_comercial_elegivel(v_order.id)
      or v_order.provider_checkout_id is not null
      or v_order.status not in ('awaiting_payment', 'payment_approved')
      or v_order.provider_customer_id is distinct from p_customer_id
      or v_order.total_cents <> p_amount_cents then return false; end if;

  if v_order.billing_period = 'monthly' then
    if v_order.payment_method <> 'asaas_card'
        or v_order.provider_subscription_id is distinct from p_subscription_id
        or p_subscription_id is null
        or v_order.provider_first_due_date is null
        or (p_due_date = v_order.provider_first_due_date
            and v_order.provider_charge_id is not null
            and p_charge_id <> v_order.provider_charge_id)
        or (p_due_date > v_order.provider_first_due_date
            and (v_order.status <> 'payment_approved'
              or p_charge_id = v_order.provider_charge_id))
        or p_due_date < v_order.provider_first_due_date then return false; end if;
  elsif p_subscription_id is not null
      or v_order.provider_charge_id is distinct from p_charge_id then
    return false;
  end if;

  select * into v_old from public.commercial_payment_events
    where provider_event_id = p_event_id;
  if found then
    return v_old.order_id = p_order_id
      and v_old.provider_charge_id = p_charge_id
      and v_old.provider_subscription_id is not distinct from p_subscription_id
      and v_old.due_date = p_due_date and v_old.event_type = p_event_type
      and v_old.amount_cents = p_amount_cents;
  end if;
  insert into public.commercial_payment_events(
    provider_event_id, order_id, provider_charge_id, provider_subscription_id,
    due_date, event_type, amount_cents
  ) values (p_event_id, p_order_id, p_charge_id, p_subscription_id,
    p_due_date, p_event_type, p_amount_cents);
  return true;
end;
$$;
revoke all on function public.registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date) from public,anon,authenticated;
grant execute on function public.registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date) to service_role;

-- Variante comercial; RPC historica preservada sem alterar origem.
create function public.registrar_evento_inicial_3ds_comercial(
  p_order_id uuid, p_event_id text, p_charge_id text, p_customer_id text,
  p_event_type text, p_amount_cents integer, p_due_date date
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.commercial_orders%rowtype;
  v_old public.commercial_payment_events%rowtype;
  v_event_order uuid;
begin
  if p_event_id is null or length(p_event_id) < 5 or p_charge_id is null
      or p_charge_id !~ '^pay_[A-Za-z0-9]+$' or p_customer_id is null
      or p_customer_id !~ '^cus_[A-Za-z0-9]+$' or p_due_date is null
      or p_amount_cents is null or p_amount_cents < 1 or p_event_type is null
      or p_event_type not in (
        'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
        'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
        'PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUNDED',
        'PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
      ) then return false; end if;
  select * into v_order from public.commercial_orders where id = p_order_id for update;
  if not found or v_order.provider_card_flow <> 'initial_3ds'
      or not public.pedido_asaas_comercial_elegivel(v_order.id) or v_order.payment_method <> 'asaas_card'
      or v_order.billing_period <> 'monthly' or v_order.provider_checkout_id is not null
      or v_order.status not in ('awaiting_payment','payment_approved')
      or v_order.provider_charge_id is distinct from p_charge_id
      or v_order.provider_customer_id is distinct from p_customer_id
      or v_order.total_cents <> p_amount_cents
      or v_order.provider_first_due_date is distinct from p_due_date then return false; end if;
  select * into v_old from public.commercial_payment_events where provider_event_id = p_event_id;
  if found then
    return v_old.order_id = p_order_id and v_old.provider_charge_id = p_charge_id
      and v_old.provider_subscription_id is null and v_old.event_type = p_event_type
      and v_old.amount_cents = p_amount_cents and v_old.due_date = p_due_date;
  end if;
  select order_id into v_event_order from public.commercial_events
    where source = 'asaas' and external_event_id = p_event_id;
  if found then return false; end if;
  insert into public.commercial_payment_events(provider_event_id,order_id,provider_charge_id,
    provider_subscription_id,event_type,amount_cents,due_date)
    values(p_event_id,p_order_id,p_charge_id,null,p_event_type,p_amount_cents,p_due_date);
  -- Falha/abandono, retorno de callback e criacao de cobranca nunca abrem acesso.
  -- Confirmacao recebida depois de estorno/contestacao nao reaprova a compra.
  if p_event_type = 'PAYMENT_CONFIRMED' and v_order.status = 'awaiting_payment'
      and not exists(select 1 from public.commercial_payment_events e
        where e.order_id = p_order_id and e.provider_charge_id = p_charge_id
          and e.event_type not in ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED')) then
    insert into public.commercial_events(order_id,source,external_event_id,event_type)
      values(p_order_id,'asaas',p_event_id,'PAYMENT_CONFIRMED');
    update public.commercial_orders set status = 'payment_approved',
      payment_approved_at = now(), updated_at = now() where id = p_order_id;
  end if;
  return true;
end;
$$;
revoke all on function public.registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date) from public,anon,authenticated;
grant execute on function public.registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date) to service_role;

