-- Proposta LOCAL. Registro documental e vinculo PROPOSTO; nunca concessao de acesso.
-- Depende da carteira e ledger financeiro existentes. Independe de ativar checkout/3DS.
-- Nao aplicar sem portao.
begin;
create table public.commercial_manual_evidence (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  order_id uuid references public.commercial_orders(id) on delete restrict,
  proposed_profile_id uuid references public.profiles(id) on delete restrict,
  claimed_email text not null check (claimed_email = lower(btrim(claimed_email)) and length(claimed_email) between 3 and 254
    and claimed_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  claimed_cnpj text not null check (claimed_cnpj ~ '^[0-9]{14}$'),
  source_system text not null check (source_system in ('direct_pix','historical_contract')),
  source_reference text not null check (source_reference=btrim(source_reference) and length(source_reference) between 5 and 300
    and source_reference !~ '[[:cntrl:]]'),
  source_date date not null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','checked','rejected')),
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text check (length(review_note) between 5 and 1000),
  check ((status='pending' and reviewed_by is null and reviewed_at is null and review_note is null)
    or (status in ('checked','rejected') and reviewed_by is not null and reviewed_at is not null and review_note is not null))
);
create unique index commercial_manual_evidence_source_idx on public.commercial_manual_evidence(source_system,lower(source_reference));
create index commercial_manual_evidence_business_idx on public.commercial_manual_evidence(business_id,recorded_at desc);
alter table public.commercial_manual_evidence enable row level security;
revoke all on public.commercial_manual_evidence from public,anon,authenticated,service_role;
grant select on public.commercial_manual_evidence to service_role;
grant insert(id,business_id,order_id,proposed_profile_id,claimed_email,claimed_cnpj,
  source_system,source_reference,source_date,recorded_by) on public.commercial_manual_evidence to service_role;
grant update(status,reviewed_by,reviewed_at,review_note) on public.commercial_manual_evidence to service_role;

-- O servidor autentica app_metadata.papel=operador; a RPC exige tambem carteira
-- explicita por negocio. Sem atribuicao, sem registro. Nao cria atribuicao.
create function public.registrar_evidencia_manual(
  p_id uuid,p_business_id uuid,p_order_id uuid,p_profile_id uuid,p_email text,p_cnpj text,
  p_source text,p_reference text,p_source_date date,p_operator_id uuid
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_old public.commercial_manual_evidence%rowtype; v_business public.businesses%rowtype;
  v_order public.commercial_orders%rowtype; v_email text:=lower(btrim(p_email)); v_ref text:=btrim(p_reference);
begin
  if p_id is null or p_business_id is null or p_operator_id is null
      or v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(v_email)>254
      or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
      or p_source is null or p_source not in ('direct_pix','historical_contract')
      or v_ref is null or length(v_ref) not between 5 and 300
      or p_source_date is null or p_source_date>(now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'evidencia_invalida'; end if;
  perform 1 from public.manager_accounts where business_id=p_business_id and operator_profile_id=p_operator_id for share;
  if not found then raise exception 'carteira_nao_autorizada'; end if;
  select * into v_business from public.businesses where id=p_business_id for share;
  if not found or (v_business.profile_id is not null and v_business.profile_id is distinct from p_profile_id)
      or (v_business.claim_email is not null and lower(btrim(v_business.claim_email))<>v_email) then
    raise exception 'identidade_divergente'; end if;
  if p_order_id is not null then
    select * into v_order from public.commercial_orders where id=p_order_id for share;
    if not found or v_order.business_id is distinct from p_business_id
        or v_order.buyer_email is distinct from v_email or v_order.cnpj is distinct from p_cnpj
        or (v_order.buyer_profile_id is not null and v_order.buyer_profile_id is distinct from p_profile_id) then
      raise exception 'pedido_divergente'; end if;
  end if;
  insert into public.commercial_manual_evidence(id,business_id,order_id,proposed_profile_id,
    claimed_email,claimed_cnpj,source_system,source_reference,source_date,recorded_by)
    values(p_id,p_business_id,p_order_id,p_profile_id,v_email,p_cnpj,p_source,v_ref,p_source_date,p_operator_id)
    on conflict do nothing;
  select * into v_old from public.commercial_manual_evidence where id=p_id or (source_system=p_source and lower(source_reference)=lower(v_ref))
    order by (id=p_id) desc limit 1;
  if not found or v_old.business_id<>p_business_id or v_old.order_id is distinct from p_order_id
      or v_old.proposed_profile_id is distinct from p_profile_id or v_old.claimed_email<>v_email
      or v_old.claimed_cnpj<>p_cnpj or v_old.source_system<>p_source or v_old.source_reference<>v_ref
      or v_old.source_date<>p_source_date then raise exception 'evidencia_duplicada_divergente'; end if;
  return v_old.id;
end;
$$;

create function public.revisar_evidencia_manual(p_id uuid,p_business_id uuid,p_operator_id uuid,
  p_status text,p_note text,p_identity_checked boolean,p_source_checked boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_old public.commercial_manual_evidence%rowtype; v_business public.businesses%rowtype;
  v_order public.commercial_orders%rowtype;
begin
  if p_status is null or p_status not in ('checked','rejected') or p_note is null or length(btrim(p_note)) not between 5 and 1000
      or p_operator_id is null then return false; end if;
  perform 1 from public.manager_accounts where business_id=p_business_id and operator_profile_id=p_operator_id for share;
  if not found then return false; end if;
  select * into v_old from public.commercial_manual_evidence where id=p_id and business_id=p_business_id for update;
  if not found then return false; end if;
  if p_status='checked' then
    if p_identity_checked is distinct from true or p_source_checked is distinct from true then return false; end if;
    select * into v_business from public.businesses where id=p_business_id for share;
    if not found or (v_business.profile_id is not null and v_business.profile_id is distinct from v_old.proposed_profile_id)
        or (v_business.claim_email is not null and lower(btrim(v_business.claim_email))<>v_old.claimed_email) then return false; end if;
    if v_old.order_id is not null then
      select * into v_order from public.commercial_orders where id=v_old.order_id for share;
      if not found or v_order.business_id is distinct from p_business_id or v_order.status='cancelled'
          or v_order.buyer_email is distinct from v_old.claimed_email or v_order.cnpj is distinct from v_old.claimed_cnpj
          or (v_order.buyer_profile_id is not null and v_order.buyer_profile_id is distinct from v_old.proposed_profile_id)
          or exists(select 1 from public.commercial_payment_events e where e.order_id=v_order.id
            and e.provider_charge_id=v_order.provider_charge_id and e.event_type not in (
              'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
              'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED')) then
        return false; end if;
    end if;
  end if;
  if v_old.status<>'pending' then return v_old.status=p_status and v_old.review_note=btrim(p_note); end if;
  update public.commercial_manual_evidence set status=p_status,review_note=btrim(p_note),reviewed_by=p_operator_id,reviewed_at=now()
    where id=p_id;
  -- Nenhuma escrita em commercial_orders, businesses, Auth ou legacy_access.
  return true;
end;
$$;
revoke all on function public.registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid) from public,anon,authenticated;
revoke all on function public.revisar_evidencia_manual(uuid,uuid,uuid,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid) to service_role;
grant execute on function public.revisar_evidencia_manual(uuid,uuid,uuid,text,text,boolean,boolean) to service_role;
commit;
