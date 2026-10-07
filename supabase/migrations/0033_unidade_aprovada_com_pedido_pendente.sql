-- Uma compra adicional pendente não bloqueia unidade livre de compra já aprovada.
-- A função continua restrita a service_role e serializa pelo negócio.

create or replace function public.registrar_conta_contratada(
  p_business_id uuid,
  p_connection_id uuid,
  p_external_id text,
  p_name text,
  p_currency text,
  p_page_id text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_account_id uuid;
  v_unit_id uuid;
  v_created_at timestamptz;
  v_legacy_at timestamptz;
  v_has_order boolean;
begin
  if p_business_id is null or p_connection_id is null
      or p_external_id is null or length(btrim(p_external_id)) < 3
      or length(p_external_id) > 100
      or p_page_id is null or length(btrim(p_page_id)) < 2
      or length(p_page_id) > 100 then
    raise exception 'conta ou pagina invalida';
  end if;

  select created_at into v_created_at from public.businesses
    where id = p_business_id for update;
  if not found then raise exception 'negocio nao encontrado'; end if;
  if not exists (select 1 from public.meta_connections
      where id = p_connection_id and business_id = p_business_id) then
    raise exception 'conexao nao pertence ao negocio';
  end if;

  select exists (select 1 from public.commercial_orders
    where business_id = p_business_id and status <> 'cancelled')
    into v_has_order;

  if v_has_order then
    select id into v_account_id from public.ad_accounts
      where business_id = p_business_id and external_id = btrim(p_external_id);

    if not exists (select 1 from public.commercial_order_units u
        join public.commercial_orders o on o.id = u.order_id
        where o.business_id = p_business_id and o.status = 'payment_approved'
          and u.ad_account_id = v_account_id) then
      select u.id into v_unit_id from public.commercial_order_units u
        join public.commercial_orders o on o.id = u.order_id
        where o.business_id = p_business_id and o.status = 'payment_approved'
          and u.ad_account_id is null
        order by o.created_at, u.ordinal limit 1 for update of u;
      if v_unit_id is null then
        if exists (select 1 from public.commercial_orders
            where business_id = p_business_id
              and status in ('awaiting_payment', 'proof_received')) then
          raise exception 'pedido ainda nao aprovado';
        end if;
        raise exception 'sem unidade contratada disponivel';
      end if;
    end if;
  else
    select min(granted_at) into v_legacy_at from public.webapp_legacy_access;
    if v_legacy_at is null or v_created_at > v_legacy_at then
      raise exception 'negocio novo sem pedido aprovado';
    end if;
  end if;

  insert into public.ad_accounts(
    business_id, meta_connection_id, external_id, name, currency,
    ownership, status, is_active
  ) values (
    p_business_id, p_connection_id, btrim(p_external_id),
    coalesce(nullif(btrim(p_name), ''), btrim(p_external_id)),
    nullif(btrim(p_currency), ''), 'cliente', 'ok', true
  ) on conflict (business_id, external_id) do update set
    meta_connection_id = excluded.meta_connection_id,
    name = excluded.name,
    currency = excluded.currency,
    ownership = 'cliente', status = 'ok', is_active = true
  returning id into v_account_id;

  if v_unit_id is not null then
    update public.commercial_order_units set ad_account_id = v_account_id
      where id = v_unit_id;
  end if;
  update public.meta_connections set meta_page_id = btrim(p_page_id)
    where id = p_connection_id and business_id = p_business_id;
  return v_account_id;
end;
$$;

revoke execute on function public.registrar_conta_contratada(uuid,uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.registrar_conta_contratada(uuid,uuid,text,text,text,text)
  to service_role;
