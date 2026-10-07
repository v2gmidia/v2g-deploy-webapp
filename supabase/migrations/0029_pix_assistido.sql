-- Venda assistida por Pix: a criação do pedido, suas unidades e os eventos
-- são transações únicas. As funções são chamadas somente pelo servidor com
-- service_role, depois de autenticar e autorizar o operador no WebApp.

alter table public.commercial_orders
  add column proof_reference text,
  add column proof_received_at timestamptz,
  add column proof_received_by uuid references public.profiles(id) on delete set null;

alter table public.commercial_orders
  add constraint commercial_orders_direct_pix_proof_check check (
    payment_method <> 'direct_pix' or status in ('awaiting_payment', 'cancelled') or
    (proof_reference is not null and length(btrim(proof_reference)) > 0
      and proof_received_at is not null and proof_received_by is not null)
  ),
  add constraint commercial_orders_direct_pix_approval_actor_check check (
    payment_method <> 'direct_pix' or status <> 'payment_approved' or
    payment_approved_by is not null
  );

create unique index commercial_orders_one_open_direct_pix
  on public.commercial_orders(lower(buyer_email), cnpj)
  where payment_method = 'direct_pix' and status in ('awaiting_payment', 'proof_received');

create function public.registrar_pedido_pix_assistido(
  p_ref text,
  p_email text,
  p_legal_name text,
  p_cnpj text,
  p_unit_count integer,
  p_billing_period text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
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
$$;

create function public.registrar_comprovante_pix(
  p_order_id uuid, p_reference text, p_operator_id uuid
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_order public.commercial_orders%rowtype;
begin
  if p_reference is null or length(btrim(p_reference)) < 3
      or length(btrim(p_reference)) > 300 or p_operator_id is null then
    raise exception 'referencia do comprovante invalida';
  end if;
  select * into v_order from public.commercial_orders
    where id = p_order_id and payment_method = 'direct_pix' for update;
  if not found then raise exception 'pedido nao encontrado'; end if;
  if v_order.status = 'proof_received' and v_order.proof_reference = btrim(p_reference) then
    return true;
  end if;
  if v_order.status <> 'awaiting_payment' then
    raise exception 'pedido nao aguarda comprovante';
  end if;
  update public.commercial_orders set status = 'proof_received',
    proof_reference = btrim(p_reference), proof_received_at = now(),
    proof_received_by = p_operator_id, updated_at = now()
    where id = p_order_id;
  insert into public.commercial_events(order_id, source, external_event_id,
    event_type, actor_profile_id)
    values (p_order_id, 'operator', 'proof:' || p_order_id::text,
      'comprovante_pix_recebido', p_operator_id);
  return true;
end;
$$;

create function public.aprovar_pix_assistido(
  p_order_id uuid, p_operator_id uuid
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_order public.commercial_orders%rowtype;
begin
  if p_operator_id is null then raise exception 'operador obrigatorio'; end if;
  select * into v_order from public.commercial_orders
    where id = p_order_id and payment_method = 'direct_pix' for update;
  if not found then raise exception 'pedido nao encontrado'; end if;
  if v_order.status = 'payment_approved' then return true; end if;
  if v_order.status <> 'proof_received' or v_order.business_id is null
      or v_order.proof_reference is null then
    raise exception 'comprovante e negocio obrigatorios';
  end if;
  update public.commercial_orders set status = 'payment_approved',
    payment_approved_at = now(), payment_approved_by = p_operator_id,
    updated_at = now() where id = p_order_id;
  insert into public.commercial_events(order_id, source, external_event_id,
    event_type, actor_profile_id)
    values (p_order_id, 'operator', 'approve:' || p_order_id::text,
      'pix_aprovado_por_operador', p_operator_id);
  return true;
end;
$$;

revoke execute on function public.registrar_pedido_pix_assistido(text,text,text,text,integer,text)
  from public, anon, authenticated;
revoke execute on function public.registrar_comprovante_pix(uuid,text,uuid)
  from public, anon, authenticated;
revoke execute on function public.aprovar_pix_assistido(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.registrar_pedido_pix_assistido(text,text,text,text,integer,text)
  to service_role;
grant execute on function public.registrar_comprovante_pix(uuid,text,uuid)
  to service_role;
grant execute on function public.aprovar_pix_assistido(uuid,uuid)
  to service_role;
