CREATE OR REPLACE FUNCTION public.aprovar_pagamento_api_comercial(p_order_id uuid, p_charge_id text, p_subscription_id text, p_customer_id text, p_event_id text, p_event_type text, p_total_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.aprovar_pagamento_api_self_service(p_order_id uuid, p_charge_id text, p_subscription_id text, p_customer_id text, p_event_id text, p_event_type text, p_total_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  if not found or v_order.origin <> 'self_service'
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
$function$
;
CREATE OR REPLACE FUNCTION public.registrar_evento_financeiro_asaas(p_order_id uuid, p_event_id text, p_charge_id text, p_subscription_id text, p_customer_id text, p_event_type text, p_amount_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
        'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
        'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
        'PAYMENT_REFUND_IN_PROGRESS', 'PAYMENT_PARTIALLY_REFUNDED', 'PAYMENT_REFUNDED',
        'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
        'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
      ) then return false; end if;

  select * into v_order from public.commercial_orders
    where id = p_order_id for update;
  if not found or v_order.origin <> 'self_service'
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
$function$
;
CREATE OR REPLACE FUNCTION public.registrar_evento_financeiro_comercial(p_order_id uuid, p_event_id text, p_charge_id text, p_subscription_id text, p_customer_id text, p_event_type text, p_amount_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.registrar_evento_inicial_3ds(p_order_id uuid, p_event_id text, p_charge_id text, p_customer_id text, p_event_type text, p_amount_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
      or v_order.origin <> 'self_service' or v_order.payment_method <> 'asaas_card'
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
$function$
;
CREATE OR REPLACE FUNCTION public.registrar_evento_inicial_3ds_comercial(p_order_id uuid, p_event_id text, p_charge_id text, p_customer_id text, p_event_type text, p_amount_cents integer, p_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.reservar_assinatura_apos_3ds(p_order_id uuid, p_next_due_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_order public.commercial_orders%rowtype;
begin
  select * into v_order from public.commercial_orders where id = p_order_id for update;
  if not found or v_order.provider_card_flow <> 'initial_3ds'
      or v_order.status <> 'payment_approved'
      or v_order.provider_subscription_id is not null
      or v_order.subscription_creation_started_at is not null
      or v_order.provider_charge_id is null or v_order.provider_customer_id is null
      or v_order.provider_first_due_date is null or p_next_due_date is null
      or p_next_due_date <> (v_order.provider_first_due_date + interval '1 month')::date
      or p_next_due_date <= (now() at time zone 'America/Sao_Paulo')::date
      or not exists(select 1 from public.commercial_payment_events e where e.order_id = p_order_id
        and e.provider_charge_id = v_order.provider_charge_id and e.event_type = 'PAYMENT_CONFIRMED')
      or exists(select 1 from public.commercial_payment_events e where e.order_id = p_order_id
        and e.provider_charge_id = v_order.provider_charge_id
        and e.event_type not in ('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED'))
      then return false; end if;
  update public.commercial_orders set subscription_creation_started_at = now(),
    provider_subscription_first_due_date = p_next_due_date, updated_at = now() where id = p_order_id;
  return true;
end;
$function$
;
drop function public.checkout_producao_schema_v1();drop function public.evento_asaas_impede_confirmacao(text);
alter table public.commercial_payment_events drop constraint commercial_payment_events_event_type_check;
alter table public.commercial_payment_events add constraint commercial_payment_events_event_type_check CHECK ((event_type = ANY (ARRAY['PAYMENT_CREATED'::text, 'PAYMENT_UPDATED'::text, 'PAYMENT_OVERDUE'::text, 'PAYMENT_CONFIRMED'::text, 'PAYMENT_RECEIVED'::text, 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'::text, 'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED'::text, 'PAYMENT_REFUND_IN_PROGRESS'::text, 'PAYMENT_PARTIALLY_REFUNDED'::text, 'PAYMENT_REFUNDED'::text, 'PAYMENT_CHARGEBACK_REQUESTED'::text, 'PAYMENT_CHARGEBACK_DISPUTE'::text, 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'::text])));
