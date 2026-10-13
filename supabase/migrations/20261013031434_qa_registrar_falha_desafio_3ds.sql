-- Aplicar somente ao QA depois de conferir o ledger; nunca ao banco real.
alter table public.commercial_payment_events
  drop constraint if exists commercial_payment_events_event_type_check;

alter table public.commercial_payment_events
  add constraint commercial_payment_events_event_type_check check (event_type in (
    'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_OVERDUE',
    'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
    'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
    'PAYMENT_REFUND_IN_PROGRESS', 'PAYMENT_PARTIALLY_REFUNDED', 'PAYMENT_REFUNDED',
    'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  ));

create or replace function public.registrar_evento_financeiro_asaas(
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
$$;
revoke all on function public.registrar_evento_financeiro_asaas(
  uuid,text,text,text,text,text,integer,date) from public, anon, authenticated;
grant execute on function public.registrar_evento_financeiro_asaas(
  uuid,text,text,text,text,text,integer,date) to service_role;
