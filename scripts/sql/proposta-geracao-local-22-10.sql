-- SOMENTE LABORATORIO DESCARTAVEL. Proposta aditiva individual, NAO aplicada remotamente.
-- Nao e migration pronta para producao: bloqueia provedor real e arquivo acima de 1 MiB.
-- Pedido e biblioteca continuam nas entidades existentes; esta e a execucao da primeira tentativa.
begin;
create table public.creative_generation_runs (
  id uuid primary key,
  request_id uuid not null unique references public.creative_generation_requests(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  attempt_id uuid not null unique,
  snapshot jsonb not null,
  snapshot_hash text not null check(snapshot_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'running' check(status in
    ('running','storage_pending','artifact_available','failed','reconciliation_required')),
  lease_until timestamptz not null,
  provider text not null default 'fake-local-v1' check(provider='fake-local-v1'),
  simulated boolean not null default true check(simulated is true),
  currency text not null default 'USD' check(currency='USD'),
  estimated_minor integer not null check(estimated_minor>=0),
  reserved_minor integer not null check(reserved_minor>0),
  budget_minor integer not null check(budget_minor>0),
  reservation_state text not null default 'reserved'
    check(reservation_state in ('reserved','closed_simulated','retained_uncertain')),
  billed_minor integer check(billed_minor is null),
  usage_reported jsonb check(usage_reported is null),
  result_bytes bytea check(result_bytes is null or octet_length(result_bytes) between 1 and 1048576),
  artifact_path text,
  artifact_sha256 text check(artifact_sha256 is null or artifact_sha256 ~ '^[a-f0-9]{64}$'),
  largura integer check(largura between 1 and 512),
  altura integer check(altura between 1 and 512),
  created_at timestamptz not null default now(),
  check(estimated_minor<=reserved_minor and reserved_minor<=budget_minor),
  check(coalesce(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=131072
    and snapshot->>'version'='1' and snapshot->'simulated'='true'::jsonb
    and snapshot->>'requestId'=request_id::text and snapshot->>'businessId'=business_id::text
    and snapshot->>'requestedBy'=requested_by::text, false)),
  check(status not in ('storage_pending','artifact_available') or coalesce(
    (result_bytes is not null and artifact_sha256 is not null and largura is not null and altura is not null
      and artifact_path=('geracao-local/'||business_id||'/'||id||'/'||attempt_id||'.png')),false)),
  check((status in ('artifact_available','failed') and reservation_state='closed_simulated')
    or (status='reconciliation_required' and reservation_state='retained_uncertain')
    or (status='running' and reservation_state='reserved')
    or (status='storage_pending' and reservation_state in ('reserved','retained_uncertain')))
);
create index creative_generation_runs_business_created_idx on public.creative_generation_runs(business_id,created_at desc);
create index creative_generation_runs_requested_by_idx on public.creative_generation_runs(requested_by);
alter table public.creative_generation_runs enable row level security;
-- Nao herdar grants adversos do projeto, nem expor snapshot/bytes/custo pelo REST.
revoke all on public.creative_generation_runs from public, anon, authenticated, service_role;
grant select, insert, update on public.creative_generation_runs to service_role;
grant select(id,request_id,business_id,status,simulated,artifact_path,artifact_sha256,created_at)
  on public.creative_generation_runs to authenticated;
create policy creative_generation_runs_read_own on public.creative_generation_runs for select to authenticated
  using(exists(select 1 from public.businesses b where b.id=business_id and b.profile_id=(select auth.uid())));

create function public.conferir_execucao_geracao_local() returns trigger language plpgsql
  set search_path = '' as $$
begin
  if TG_OP='INSERT' and (new.status<>'running' or new.result_bytes is not null
    or new.artifact_path is not null or new.artifact_sha256 is not null) then
    raise exception 'inicio_invalido';
  end if;
  if not exists(select 1 from public.creative_generation_requests r join public.businesses b on b.id=r.business_id
    where r.id=new.request_id and r.business_id=new.business_id and r.requested_by=new.requested_by
      and b.profile_id=new.requested_by and r.content_hash=new.snapshot->>'requestHash') then
    raise exception 'pedido_divergente';
  end if;
  if TG_OP='UPDATE' then
    if row(new.id,new.request_id,new.business_id,new.requested_by,new.attempt_id,new.snapshot,new.snapshot_hash,
      new.estimated_minor,new.reserved_minor,new.budget_minor,new.currency,new.provider,new.simulated,new.lease_until,new.created_at)
      is distinct from row(old.id,old.request_id,old.business_id,old.requested_by,old.attempt_id,old.snapshot,old.snapshot_hash,
      old.estimated_minor,old.reserved_minor,old.budget_minor,old.currency,old.provider,old.simulated,old.lease_until,old.created_at) then
      raise exception 'execucao_imutavel';
    end if;
    if old.artifact_sha256 is not null and row(new.artifact_sha256,new.artifact_path,new.result_bytes,new.largura,new.altura)
      is distinct from row(old.artifact_sha256,old.artifact_path,old.result_bytes,old.largura,old.altura) then
      raise exception 'resultado_imutavel';
    end if;
    if new.status<>old.status and not (
      (old.status='running' and new.status in ('storage_pending','failed','reconciliation_required'))
      or (old.status='reconciliation_required' and new.status='storage_pending')
      or (old.status='storage_pending' and new.status='artifact_available')) then
      raise exception 'transicao_negada';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.conferir_execucao_geracao_local() from public,anon,authenticated,service_role;
create trigger conferir_execucao_geracao_local before insert or update on public.creative_generation_runs
  for each row execute function public.conferir_execucao_geracao_local();
commit;
