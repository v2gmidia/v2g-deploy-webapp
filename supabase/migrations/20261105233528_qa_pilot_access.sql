-- Acesso temporário de um titular a um negócio e a uma conta Meta exatos,
-- apenas para o piloto interno em QA. Não cria pedido, unidade ou direito de
-- ativar campanha. A aplicação ainda exige o projeto QA e uma flag explícita.
create table public.qa_pilot_access (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  profile_id uuid not null references auth.users(id),
  ad_account_external_id text not null check (ad_account_external_id ~ '^act_[0-9]{5,30}$'),
  meta_page_id text not null check (meta_page_id ~ '^[0-9]{5,30}$'),
  granted_by uuid not null references auth.users(id),
  reason text not null check (length(btrim(reason)) between 10 and 500),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint qa_pilot_access_expiry_check check (expires_at > created_at and expires_at <= created_at + interval '30 days'),
  constraint qa_pilot_access_scope_check check (
    business_id = '9cb85308-02cc-4ce7-bacf-15be77f9ba5e'::uuid
    and profile_id = '09e25ab4-b55b-48d1-bfde-181e41192bb6'::uuid
    and ad_account_external_id = 'act_1165478988908157'
    and meta_page_id = '206296256098753'
  )
);

create index qa_pilot_access_profile_idx on public.qa_pilot_access(profile_id, business_id);
alter table public.qa_pilot_access enable row level security;
revoke all on public.qa_pilot_access from public, anon, authenticated;
grant select, insert, update, delete on public.qa_pilot_access to service_role;

-- Executada somente pelo servidor depois de validar a conta e a Página com a
-- API Meta. A função repete a conferência do grant para que um erro na action
-- não transforme o piloto em caminho geral para burlar a compra.
create function public.registrar_conta_piloto_qa(
  p_business_id uuid,
  p_connection_id uuid,
  p_profile_id uuid,
  p_external_id text,
  p_name text,
  p_currency text,
  p_page_id text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_account_id uuid;
begin
  if p_business_id is null or p_connection_id is null or p_profile_id is null
      or p_external_id !~ '^act_[0-9]{5,30}$'
      or p_page_id is null or length(btrim(p_page_id)) < 2
      or length(p_page_id) > 100 then
    raise exception 'conta ou pagina invalida';
  end if;

  perform 1 from public.businesses b
    join public.qa_pilot_access g on g.business_id = b.id
    where b.id = p_business_id and b.profile_id = p_profile_id
      and g.profile_id = p_profile_id
      and g.ad_account_external_id = p_external_id
      and g.meta_page_id = btrim(p_page_id)
      and g.revoked_at is null and g.expires_at > now()
    for update of b, g;
  if not found then raise exception 'piloto qa nao autorizado'; end if;

  -- Pedido existente segue o fluxo comercial normal; o piloto não pode
  -- acrescentar uma unidade fora dele.
  if exists (select 1 from public.commercial_orders
      where business_id = p_business_id) then
    raise exception 'negocio com pedido deve usar fluxo contratado';
  end if;

  perform 1 from public.meta_connections
    where id = p_connection_id and business_id = p_business_id for update;
  if not found then raise exception 'conexao nao pertence ao negocio'; end if;

  if exists (select 1 from public.ad_accounts
      where business_id = p_business_id and is_active = true
        and external_id <> p_external_id) then
    raise exception 'piloto qa limitado a uma conta';
  end if;
  insert into public.ad_accounts (
    business_id, meta_connection_id, external_id, name, currency,
    ownership, status, is_active
  ) values (
    p_business_id, p_connection_id, p_external_id,
    coalesce(nullif(btrim(p_name), ''), p_external_id),
    nullif(btrim(p_currency), ''), 'cliente', 'ok', true
  ) on conflict (business_id, external_id) do update set
    meta_connection_id = excluded.meta_connection_id,
    name = excluded.name,
    currency = excluded.currency,
    ownership = 'cliente', status = 'ok', is_active = true
  returning id into v_account_id;

  update public.meta_connections set meta_page_id = btrim(p_page_id)
    where id = p_connection_id and business_id = p_business_id;
  return v_account_id;
end;
$$;

revoke execute on function public.registrar_conta_piloto_qa(uuid,uuid,uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.registrar_conta_piloto_qa(uuid,uuid,uuid,text,text,text,text)
  to service_role;
