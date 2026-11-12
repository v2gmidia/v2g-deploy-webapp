-- PACOTE PENDENTE: fora de supabase/migrations principal. Não aplicado.
-- Nenhuma linha existente é movida, renomeada ou reatribuída.
create unique index businesses_agency_owner_key on public.businesses(id, profile_id);

create table public.agency_advertisers (
  agency_business_id uuid not null,
  advertiser_business_id uuid primary key,
  owner_profile_id uuid not null,
  advertiser_name text not null check (length(btrim(advertiser_name)) between 1 and 200),
  reference_key text not null check (reference_key ~ '^[a-z0-9_-]{1,80}$'),
  legacy_shared_business boolean not null default false,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  source text not null check (length(btrim(source)) between 10 and 500),
  unique (agency_business_id, reference_key),
  constraint agency_owner_fk foreign key (agency_business_id, owner_profile_id)
    references public.businesses(id, profile_id) on delete restrict on update restrict,
  constraint advertiser_owner_fk foreign key (advertiser_business_id, owner_profile_id)
    references public.businesses(id, profile_id) on delete restrict on update restrict,
  constraint agency_legacy_self_check check (
    (agency_business_id = advertiser_business_id) = legacy_shared_business)
);
create index agency_advertisers_owner_idx on public.agency_advertisers(owner_profile_id, agency_business_id);

-- Escrita só pelo pacote de implantação revisado; não há RPC de cadastro exposta.
alter table public.agency_advertisers enable row level security;
revoke all on public.agency_advertisers from public, anon, authenticated;
grant select on public.agency_advertisers to authenticated;
grant select, insert, update, delete on public.agency_advertisers to service_role;
create policy agency_advertisers_read_own on public.agency_advertisers
  for select to authenticated using (owner_profile_id = (select auth.uid()) and revoked_at is null);

-- Travamento determinístico serializa mudanças da árvore de um mesmo titular.
create function public.check_agency_advertiser_tree() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_profile_id::text, 0));
  if new.revoked_at is null and exists (
    select 1 from public.agency_advertisers a where a.revoked_at is null
      and not a.legacy_shared_business
      and (a.advertiser_business_id = new.agency_business_id
        or (not new.legacy_shared_business and a.agency_business_id = new.advertiser_business_id))
      and a.advertiser_business_id <> new.advertiser_business_id
  ) then raise exception 'agencia nao pode ser anunciante de outra agencia'; end if;
  return new;
end;
$$;
revoke all on function public.check_agency_advertiser_tree() from public, anon, authenticated;
grant execute on function public.check_agency_advertiser_tree() to service_role;
create trigger agency_advertisers_tree before insert or update on public.agency_advertisers
  for each row execute function public.check_agency_advertiser_tree();
