create function public.evento_asaas_impede_confirmacao(p_event_type text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(p_event_type not in (
    'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
    'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED'
  ), true)
$$;
revoke all on function public.evento_asaas_impede_confirmacao(text) from public,anon,authenticated;
grant execute on function public.evento_asaas_impede_confirmacao(text) to service_role;

alter table public.commercial_payment_events
  drop constraint commercial_payment_events_event_type_check,
  add constraint commercial_payment_events_event_type_check check (event_type in (
    'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
    'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS',
    'PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED',
    'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
    'PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUNDED',
    'PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  ));


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
        'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_OVERDUE',
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
        'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_OVERDUE',
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
        'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
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
  if p_event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and v_order.status = 'awaiting_payment'
      and not exists(select 1 from public.commercial_payment_events e
        where e.order_id = p_order_id and e.provider_charge_id = p_charge_id
          and public.evento_asaas_impede_confirmacao(e.event_type)) then
    insert into public.commercial_events(order_id,source,external_event_id,event_type)
      values(p_order_id,'asaas',p_event_id,p_event_type);
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
        'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
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
  if p_event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and v_order.status = 'awaiting_payment'
      and not exists(select 1 from public.commercial_payment_events e
        where e.order_id = p_order_id and e.provider_charge_id = p_charge_id
          and public.evento_asaas_impede_confirmacao(e.event_type)) then
    insert into public.commercial_events(order_id,source,external_event_id,event_type)
      values(p_order_id,'asaas',p_event_id,p_event_type);
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
        and e.provider_charge_id = v_order.provider_charge_id and e.event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED'))
      or exists(select 1 from public.commercial_payment_events e where e.order_id = p_order_id
        and e.provider_charge_id = v_order.provider_charge_id
        and public.evento_asaas_impede_confirmacao(e.event_type))
      then return false; end if;
  update public.commercial_orders set subscription_creation_started_at = now(),
    provider_subscription_first_due_date = p_next_due_date, updated_at = now() where id = p_order_id;
  return true;
end;
$function$
;

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
      and e.provider_charge_id=p_charge_id and public.evento_asaas_impede_confirmacao(e.event_type)) then return false; end if;
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


  if exists(select 1 from public.commercial_payment_events e
      where e.order_id=p_order_id and e.provider_charge_id=p_charge_id
        and public.evento_asaas_impede_confirmacao(e.event_type)) then return false; end if;
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

-- LOCAL / REVISAVEL. Não aplicar sem backup e conciliação individual da cadeia.
-- NÃO cria as dependências faltantes, não habilita checkout nem escreve pedidos.
-- Dependências ordenadas no manifesto scripts/test-utils/checkout-schema.mjs e
-- docs/estado/n26-p1-compra-publica-local-05-11.md. Banco compartilhado com backend.

-- Grants explícitos que a execução pelo service_role requer, sem abrir acesso público.
-- Se uma tabela faltar, a transação inteira falha antes de qualquer publicação.
grant select, insert, update on public.commercial_orders to service_role;
grant select, insert, update on public.commercial_order_units to service_role;
grant select, insert on public.commercial_events to service_role;
grant select, insert on public.commercial_payment_events to service_role;
grant select, insert, update on public.commercial_payment_email_outbox to service_role;
grant select, insert, update, delete on public.checkout_3ds_context to service_role;
grant select, insert, delete on public.checkout_security_attempts to service_role;
grant select, insert, update on public.businesses to service_role;

-- Versão estrutural; NÃO certifica credenciais, conta Asaas, entrega ou pagamento.
create function public.checkout_producao_schema_v1()
returns integer language plpgsql stable security invoker set search_path = '' as $$
declare
  t text;
  sig text;
  f oid;
  v_access record;
  v_role text;
  v_privilege text;
begin
  foreach t in array array['businesses','commercial_orders','commercial_order_units',
    'commercial_events','commercial_payment_events','commercial_payment_email_outbox',
    'checkout_3ds_context','checkout_security_attempts'] loop
    if not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n
      on n.oid=c.relnamespace where n.nspname='public' and c.relname=t
      and c.relkind='r' and c.relrowsecurity) then return 0; end if;
    if not pg_catalog.has_table_privilege('service_role','public.'||t,'SELECT') then return 0; end if;
  end loop;
  -- has_table_privilege com lista de privilegios usa ANY. Cada permissao
  -- exigida pelos grants acima precisa passar individualmente (ALL).
  for v_access in select * from (values
    ('businesses','SELECT'),('businesses','INSERT'),('businesses','UPDATE'),
    ('commercial_orders','SELECT'),('commercial_orders','INSERT'),('commercial_orders','UPDATE'),
    ('commercial_order_units','SELECT'),('commercial_order_units','INSERT'),('commercial_order_units','UPDATE'),
    ('commercial_events','SELECT'),('commercial_events','INSERT'),
    ('commercial_payment_events','SELECT'),('commercial_payment_events','INSERT'),
    ('commercial_payment_email_outbox','SELECT'),('commercial_payment_email_outbox','INSERT'),('commercial_payment_email_outbox','UPDATE'),
    ('checkout_3ds_context','SELECT'),('checkout_3ds_context','INSERT'),('checkout_3ds_context','UPDATE'),('checkout_3ds_context','DELETE'),
    ('checkout_security_attempts','SELECT'),('checkout_security_attempts','INSERT'),('checkout_security_attempts','DELETE')
  ) as required_access(table_name,privilege) loop
    if not pg_catalog.has_table_privilege('service_role','public.'||v_access.table_name,v_access.privilege)
      then return 0; end if;
  end loop;
  foreach t in array array['commercial_payment_events','commercial_payment_email_outbox',
    'checkout_3ds_context','checkout_security_attempts'] loop
    if pg_catalog.has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE')
      or pg_catalog.has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE')
      then return 0; end if;
    -- Grants de coluna tambem podem abrir leitura/escrita sem grant da tabela.
    -- PUBLIC e herdado nas consultas efetivas destes dois papeis.
    foreach v_role in array array['anon','authenticated'] loop
      foreach v_privilege in array array['SELECT','INSERT','UPDATE'] loop
        if pg_catalog.has_any_column_privilege(v_role,'public.'||t,v_privilege)
          then return 0; end if;
      end loop;
    end loop;
  end loop;
  -- Todas as colunas lidas/escritas pelas portas de compra/efeitos.
  if exists (
    select 1 from (values
      ('commercial_orders','external_ref'),('commercial_orders','business_id'),
      ('commercial_orders','buyer_email'),('commercial_orders','buyer_name'),
      ('commercial_orders','buyer_whatsapp'),('commercial_orders','legal_name'),
      ('commercial_orders','cnpj'),('commercial_orders','contractor_document_type'),
      ('commercial_orders','status'),('commercial_orders','origin'),
      ('commercial_orders','payment_method'),('commercial_orders','billing_period'),
      ('commercial_orders','unit_count'),('commercial_orders','total_cents'),
      ('commercial_orders','provider_checkout_id'),('commercial_orders','provider_checkout_url'),
      ('commercial_orders','checkout_creation_started_at'),('commercial_orders','payment_attempt_count'),
      ('commercial_orders','payment_creation_started_at'),('commercial_orders','provider_customer_id'),
      ('commercial_orders','provider_charge_id'),('commercial_orders','provider_subscription_id'),
      ('commercial_orders','provider_first_due_date'),('commercial_orders','provider_card_flow'),
      ('commercial_orders','subscription_creation_started_at'),('commercial_orders','provider_subscription_first_due_date'),
      ('commercial_payment_events','provider_event_id'),('commercial_payment_events','order_id'),
      ('commercial_payment_events','provider_charge_id'),('commercial_payment_events','provider_subscription_id'),
      ('commercial_payment_events','event_type'),('commercial_payment_events','amount_cents'),('commercial_payment_events','due_date'),
      ('commercial_payment_email_outbox','id'),('commercial_payment_email_outbox','order_id'),
      ('commercial_payment_email_outbox','provider_charge_id'),('commercial_payment_email_outbox','payload'),
      ('commercial_payment_email_outbox','status'),('commercial_payment_email_outbox','provider_message_id'),
      ('commercial_payment_email_outbox','updated_at'),
      ('checkout_3ds_context','order_id'),('checkout_3ds_context','payer_ip'),('checkout_3ds_context','expires_at')
    ) as required(table_name,column_name)
    where not exists (select 1 from pg_catalog.pg_attribute a
      join pg_catalog.pg_class c on c.oid=a.attrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=required.table_name
        and a.attname=required.column_name and a.attnum>0 and not a.attisdropped)
  ) then return 0; end if;
  foreach sig in array array[
    'registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)',
    'aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
    'reservar_assinatura_apos_3ds(uuid,date)',
    'consumir_limite_checkout(text,text,text)', 'documento_contratante_valido(text)',
    'evento_asaas_impede_confirmacao(text)'
  ] loop
    f := pg_catalog.to_regprocedure('public.'||sig);
    if f is null then return 0; end if;
    if pg_catalog.has_function_privilege('anon',f,'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated',f,'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role',f,'EXECUTE')
      or exists (select 1 from pg_catalog.pg_proc where oid=f and prosecdef)
      then return 0; end if;
  end loop;
  -- Exige também a revisão de risco/RECEIVED, não apenas os nomes das RPCs.
  foreach sig in array array[
    'aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
    'reservar_assinatura_apos_3ds(uuid,date)'
  ] loop
    if not exists(select 1 from pg_catalog.pg_proc
      where oid=pg_catalog.to_regprocedure('public.'||sig)
        and pg_catalog.strpos(prosrc,'evento_asaas_impede_confirmacao')>0)
      then return 0; end if;
  end loop;
  if not public.evento_asaas_impede_confirmacao('PAYMENT_REFUNDED')
    or not public.evento_asaas_impede_confirmacao('PAYMENT_REPROVED_BY_RISK_ANALYSIS')
    or public.evento_asaas_impede_confirmacao('PAYMENT_AUTHORIZED') then return 0; end if;
  -- Unicidades são as barreiras para replay, referência e envio duplicado.
  if exists (select 1 from (values
    ('commercial_orders','external_ref'),
    ('commercial_orders','provider_charge_id'),('commercial_orders','provider_subscription_id'),
    ('commercial_events','source,external_event_id'),('commercial_order_units','order_id,ordinal'),
    ('commercial_payment_events','provider_event_id'),
    ('commercial_payment_email_outbox','order_id,provider_charge_id'),
    ('checkout_3ds_context','order_id')
  ) as required(table_name,columns) where not exists (
    select 1 from pg_catalog.pg_index i
      join pg_catalog.pg_class c on c.oid=i.indrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=required.table_name and i.indisunique
      and i.indisvalid and i.indpred is null and i.indexprs is null
      and (select pg_catalog.string_agg(a.attname,',' order by k.ord)
        from pg_catalog.unnest(i.indkey::smallint[]) with ordinality k(attnum,ord)
        join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum=k.attnum
        where k.ord<=i.indnkeyatts)=required.columns
  )) then return 0; end if;
  if not public.documento_contratante_valido('00000000191')
    or not public.documento_contratante_valido('11222333000181')
    or public.documento_contratante_valido('00000000192') then return 0; end if;
  return 1;
exception when undefined_table or undefined_function or insufficient_privilege then return 0;
end;
$$;
revoke all on function public.checkout_producao_schema_v1() from public,anon,authenticated;
grant execute on function public.checkout_producao_schema_v1() to service_role;

do $$ begin
  if public.checkout_producao_schema_v1() <> 1 then
    raise exception 'checkout_producao_precondicoes_ausentes_ou_divergentes';
  end if;
end $$;
comment on function public.checkout_producao_schema_v1() is
  'Gate estrutural v1 somente service_role. Sem homologacao externa ou leitura de pedidos. Zero se dependencias/ACL/RLS/unicidade divergirem.';
