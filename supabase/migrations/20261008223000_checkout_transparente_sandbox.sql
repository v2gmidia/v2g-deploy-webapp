-- Estrutura aditiva para pagamento por API. Nao aplicar ao banco real sem
-- revisao do ledger, seguranca e autorizacao de Victor.
alter table public.commercial_orders
  add column provider_subscription_id text unique,
  add column payment_creation_started_at timestamptz,
  add column provider_first_due_date date;

-- A aprovacao exige IDs persistidos do Asaas e um evento unico. O evento
-- recebido antes da persistencia do vinculo deve ser reenviado pelo webhook.
create function public.aprovar_pagamento_api_self_service(
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
$$;

revoke all on function public.aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)
  from public, anon, authenticated;
grant execute on function public.aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)
  to service_role;
