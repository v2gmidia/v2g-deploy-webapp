-- Registro humano separado da aprovação. Não escreve na Meta nem atesta entrega.
begin;
create unique index creative_review_version_identity
  on public.creative_review_requests(id, business_id, sha256);

create table public.creative_publication_confirmations (
  review_request_id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  ad_account_id text not null check (ad_account_id ~ '^act_[0-9]{1,40}$'),
  ad_id text not null check (ad_id ~ '^[0-9]{1,40}$'),
  published_on date not null,
  evidence text not null check (char_length(btrim(evidence)) between 10 and 2000),
  confirmed_by uuid not null references public.profiles(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  source text not null default 'manager_declaration' check (source = 'manager_declaration'),
  foreign key (review_request_id, business_id, content_sha256)
    references public.creative_review_requests(id, business_id, sha256) on delete cascade
);
create index creative_publication_business_idx on public.creative_publication_confirmations(business_id);
alter table public.creative_publication_confirmations enable row level security;
revoke all on public.creative_publication_confirmations from public, anon, authenticated, service_role;
grant select on public.creative_publication_confirmations to authenticated;
grant select, insert on public.creative_publication_confirmations to service_role;
create policy creative_publication_read_own on public.creative_publication_confirmations
  for select to authenticated using (exists (
    select 1 from public.businesses b where b.id = business_id and b.profile_id = (select auth.uid())
  ));

create function public.confirmar_publicacao_criativo(
  p_review uuid, p_business uuid, p_sha text, p_actor uuid,
  p_account text, p_ad text, p_day date, p_evidence text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  revisao public.creative_review_requests%rowtype;
  existente public.creative_publication_confirmations%rowtype;
begin
  if p_actor is null or p_account is null or p_ad is null or p_day is null or p_evidence is null
    or p_account !~ '^act_[0-9]{1,40}$' or p_ad !~ '^[0-9]{1,40}$'
    or char_length(btrim(p_evidence)) not between 10 and 2000
    or p_day > (now() at time zone 'America/Sao_Paulo')::date then return 'invalid'; end if;
  select * into revisao from public.creative_review_requests where id = p_review for update;
  if not found or revisao.business_id is distinct from p_business or revisao.sha256 is distinct from p_sha
    or revisao.status <> 'approved_for_manual_publish' then return 'not_allowed'; end if;
  perform 1 from public.manager_accounts where business_id = p_business and operator_profile_id = p_actor for share;
  if not found then return 'not_allowed'; end if;
  perform 1 from public.ad_accounts where business_id = p_business and external_id = p_account
    and is_active is true and status = 'ok' for share;
  if not found then return 'not_allowed'; end if;
  select * into existente from public.creative_publication_confirmations where review_request_id = p_review;
  if found then
    if existente.ad_account_id = p_account and existente.ad_id = p_ad
      and existente.published_on = p_day and existente.evidence = btrim(p_evidence)
      then return 'already_registered'; end if;
    return 'conflict';
  end if;
  insert into public.creative_publication_confirmations
    (review_request_id,business_id,content_sha256,ad_account_id,ad_id,published_on,evidence,confirmed_by)
    values (p_review,p_business,p_sha,p_account,p_ad,p_day,btrim(p_evidence),p_actor);
  return 'registered';
end;
$$;
revoke all on function public.confirmar_publicacao_criativo(uuid,uuid,text,uuid,text,text,date,text)
  from public, anon, authenticated;
grant execute on function public.confirmar_publicacao_criativo(uuid,uuid,text,uuid,text,text,date,text) to service_role;
comment on table public.creative_publication_confirmations is
  'Confirmação manual da publicação de uma versão exata da peça. Não é leitura da Meta nem prova de entrega atual.';
commit;
