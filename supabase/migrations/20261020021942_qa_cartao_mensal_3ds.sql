-- Preparacao QA. Nao habilita flags, nao chama Asaas e nao libera producao.
-- Preserva todas as RPCs legadas de assinatura direta/Pix.
alter table public.commercial_orders
  add column provider_card_flow text not null default 'direct'
    check (provider_card_flow in ('direct', 'initial_3ds')),
  add column subscription_creation_started_at timestamptz,
  add column provider_subscription_first_due_date date,
  add constraint commercial_orders_3ds_matches check (
    provider_card_flow = 'direct' or
    (origin = 'self_service' and billing_period = 'monthly' and payment_method = 'asaas_card')
  );

-- O Asaas exige o IP original tambem na criacao posterior da assinatura.
-- Nunca usar o IP do webhook/servidor. Contexto separado, sem cartao ou token.
create table public.checkout_3ds_context (
  order_id uuid primary key references public.commercial_orders(id) on delete cascade,
  payer_ip inet not null,
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index checkout_3ds_context_expiration on public.checkout_3ds_context(expires_at);
alter table public.checkout_3ds_context enable row level security;
revoke all on public.checkout_3ds_context from public, anon, authenticated;
grant select, insert, update, delete on public.checkout_3ds_context to service_role;

-- Somente a cobranca avulsa inicial, identificada antes de aceitar o webhook.
create function public.registrar_evento_inicial_3ds(
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
$$;

-- Reserva de uma unica criacao externa; timeout nunca libera automaticamente.
create function public.reservar_assinatura_apos_3ds(p_order_id uuid, p_next_due_date date)
returns boolean language plpgsql security invoker set search_path = '' as $$
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
$$;
revoke all on function public.registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)
  from public, anon, authenticated;
grant execute on function public.registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)
  to service_role;
revoke all on function public.reservar_assinatura_apos_3ds(uuid,date) from public, anon, authenticated;
grant execute on function public.reservar_assinatura_apos_3ds(uuid,date) to service_role;
