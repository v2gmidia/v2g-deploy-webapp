-- Preparação do checkout hospedado. Aplicar somente após reconciliar o ledger
-- das migrations e validar o fluxo completo em sandbox.
alter table public.commercial_orders
  add column provider_checkout_id text unique,
  add column provider_checkout_url text,
  add column checkout_creation_started_at timestamptz,
  add column buyer_name text,
  add column buyer_whatsapp text;

-- A antecipação semestral foi decidida antes da aplicação desta migration.
alter table public.commercial_orders
  drop constraint commercial_orders_billing_period_check,
  drop constraint commercial_orders_check,
  drop constraint commercial_orders_total_matches,
  add constraint commercial_orders_billing_period_check
    check (billing_period in ('monthly', 'semiannual_upfront', 'annual_upfront')),
  add constraint commercial_orders_discount_matches check (
    (billing_period = 'monthly' and discount_percent = 0) or
    (billing_period = 'semiannual_upfront' and discount_percent = 5) or
    (billing_period = 'annual_upfront' and discount_percent = 12)
  ),
  add constraint commercial_orders_total_matches check (
    total_cents = unit_count * case billing_period
      when 'monthly' then 50000
      when 'semiannual_upfront' then 285000
      else 528000
    end
  );

create unique index commercial_orders_one_open_self_service
  on public.commercial_orders(lower(buyer_email), cnpj)
  where origin = 'self_service' and status = 'awaiting_payment';

create function public.registrar_pedido_self_service(
  p_ref text, p_email text, p_buyer_name text, p_whatsapp text,
  p_legal_name text, p_cnpj text,
  p_unit_count integer, p_billing_period text, p_payment_method text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
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
$$;

revoke all on function public.registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)
  from public, anon, authenticated;
grant execute on function public.registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)
  to service_role;

create function public.aprovar_checkout_self_service(
  p_order_id uuid, p_checkout_id text, p_event_id text, p_customer_id text
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_order public.commercial_orders%rowtype;
begin
  if p_order_id is null or p_checkout_id is null or p_event_id is null
      or length(p_event_id) < 5 then return false; end if;
  select * into v_order from public.commercial_orders
    where id = p_order_id for update;
  if not found or v_order.origin <> 'self_service'
      or v_order.provider_checkout_id <> p_checkout_id then return false; end if;
  if exists (select 1 from public.commercial_events
      where source = 'asaas' and external_event_id = p_event_id) then
    return v_order.status = 'payment_approved';
  end if;
  if v_order.status <> 'awaiting_payment' then return false; end if;

  insert into public.commercial_events(
    order_id, source, external_event_id, event_type
  ) values (p_order_id, 'asaas', p_event_id, 'CHECKOUT_PAID');
  update public.commercial_orders set status = 'payment_approved',
    payment_approved_at = now(), provider_customer_id = p_customer_id,
    updated_at = now()
    where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.aprovar_checkout_self_service(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.aprovar_checkout_self_service(uuid,text,text,text)
  to service_role;

create function public.encerrar_checkout_self_service(
  p_order_id uuid, p_checkout_id text, p_event_id text, p_event_type text
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_order public.commercial_orders%rowtype;
begin
  if p_event_type not in ('CHECKOUT_CANCELED', 'CHECKOUT_EXPIRED')
      or p_event_id is null or length(p_event_id) < 5 then return false; end if;
  select * into v_order from public.commercial_orders
    where id = p_order_id for update;
  if not found or v_order.origin <> 'self_service'
      or v_order.provider_checkout_id <> p_checkout_id then return false; end if;
  if exists (select 1 from public.commercial_events
      where source = 'asaas' and external_event_id = p_event_id) then return true; end if;
  if v_order.status = 'payment_approved' then return false; end if;
  if v_order.status = 'cancelled' then return true; end if;
  insert into public.commercial_events(order_id, source, external_event_id, event_type)
    values (p_order_id, 'asaas', p_event_id, p_event_type);
  update public.commercial_orders set status = 'cancelled', updated_at = now()
    where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.encerrar_checkout_self_service(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.encerrar_checkout_self_service(uuid,text,text,text)
  to service_role;
