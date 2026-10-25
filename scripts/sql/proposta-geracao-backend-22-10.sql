-- PROPOSTA REVISAVEL, NAO APLICADA. Dono unico: backend src/imagem/geracao_jobs.py.
-- Nao instalar junto com o laboratorio creative_generation_runs como segundo worker.
begin;
create table public.creative_generation_jobs (
 id uuid primary key,
 request_id uuid not null unique references public.creative_generation_requests(id),
 business_id uuid not null references public.businesses(id),
 requested_by uuid not null references public.profiles(id),
 attempt_id uuid not null unique,
 snapshot jsonb not null,
 snapshot_hash text not null check(snapshot_hash ~ '^[a-f0-9]{64}$'),
 provider text not null check(provider in ('mock','gpt-image-2')),
 simulated boolean not null,
 status text not null default 'running' check(status in ('running','storage_pending','artifact_available','reconciliation_required')),
 lease_until timestamptz not null,
 currency text not null default 'USD' check(currency='USD'),
 estimated_usd numeric not null check(estimated_usd>=0),
 reserved_usd numeric not null check(reserved_usd>0),
 budget_usd numeric not null check(budget_usd>=reserved_usd and reserved_usd>=estimated_usd),
 billed_usd numeric check(billed_usd>=0),
 usage_reported jsonb,
 provider_request_id text,
 result_bytes bytea,
 artifact_path text,
 artifact_sha256 text check(artifact_sha256 ~ '^[a-f0-9]{64}$'),
 width integer,
 height integer,
 created_at timestamptz not null default now(),
 check(simulated=(provider='mock')),
 check(not simulated or billed_usd is null),
 check(result_bytes is null or octet_length(result_bytes) between 1 and 10485760),
 check(status not in ('storage_pending','artifact_available') or
  (result_bytes is not null and artifact_path is not null and artifact_sha256 is not null
    and width is not null and height is not null and width=1088 and height=1088))
);
create index creative_generation_jobs_business on public.creative_generation_jobs(business_id,requested_by);
alter table public.creative_generation_jobs enable row level security;
revoke all on public.creative_generation_jobs from public,anon,authenticated,service_role;
-- A API autenticada do backend entrega DTO sanitizado. Nao expor snapshot/bytes pelo Data API.
grant select,insert,update on public.creative_generation_jobs to service_role;

create function public.conferir_job_geracao_backend() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.creative_generation_requests r join public.businesses b on b.id=r.business_id
  where r.id=new.request_id and r.business_id=new.business_id and r.requested_by=new.requested_by
  and b.profile_id=new.requested_by and r.content_hash=new.snapshot->>'request_hash') then
  raise exception 'pedido_divergente';
 end if;
 if TG_OP='INSERT' and (new.status<>'running' or new.result_bytes is not null or new.billed_usd is not null
   or new.artifact_path is not null or new.artifact_sha256 is not null or new.width is not null
   or new.height is not null or new.usage_reported is not null or new.provider_request_id is not null) then
  raise exception 'inicio_invalido';
 end if;
 if TG_OP='UPDATE' then
  if row(new.id,new.request_id,new.business_id,new.requested_by,new.attempt_id,new.snapshot,new.snapshot_hash,
   new.provider,new.simulated,new.lease_until,new.currency,new.estimated_usd,new.reserved_usd,new.budget_usd,new.created_at)
   is distinct from row(old.id,old.request_id,old.business_id,old.requested_by,old.attempt_id,old.snapshot,old.snapshot_hash,
   old.provider,old.simulated,old.lease_until,old.currency,old.estimated_usd,old.reserved_usd,old.budget_usd,old.created_at) then
   raise exception 'job_imutavel';
  end if;
  if old.artifact_sha256 is not null and row(new.result_bytes,new.artifact_path,new.artifact_sha256,new.width,new.height,
    new.usage_reported,new.provider_request_id,new.billed_usd) is distinct from
   row(old.result_bytes,old.artifact_path,old.artifact_sha256,old.width,old.height,old.usage_reported,old.provider_request_id,old.billed_usd) then
   raise exception 'resultado_imutavel';
  end if;
  if new.status<>old.status and not (
    (old.status='running' and new.status in ('storage_pending','reconciliation_required')) or
    (old.status='reconciliation_required' and new.status='storage_pending') or
    (old.status='storage_pending' and new.status='artifact_available')) then raise exception 'transicao_negada';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function public.conferir_job_geracao_backend() from public,anon,authenticated,service_role;
create trigger conferir_job_geracao_backend before insert or update on public.creative_generation_jobs
 for each row execute function public.conferir_job_geracao_backend();
commit;
