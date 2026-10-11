-- QA-only compatibility base for the onboarding/profile RPCs.
-- The original 0010 cannot be replayed wholesale here: this isolated QA
-- database does not contain backend_v2g.execucoes. Production is untouched.

alter table public.businesses
  add column if not exists procedencia jsonb not null default '{}'::jsonb,
  add column if not exists geo_key text,
  add column if not exists geo_label text,
  add column if not exists geo_resolved_at timestamptz;

create table if not exists public.identidade_visual (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  cor_primaria text,
  cor_secundaria text,
  cor_destaque text,
  fonte_titulo text,
  fonte_corpo text,
  tom_de_voz text,
  observacoes text,
  procedencia jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.narrativa_negocio (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  quem_somos text,
  historia text,
  por_que_existe text,
  para_quem text,
  o_que_nao_fazemos text,
  procedencia jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.identidade_visual enable row level security;
alter table public.narrativa_negocio enable row level security;
revoke all on public.identidade_visual, public.narrativa_negocio from anon;
grant select, insert, update, delete on public.identidade_visual, public.narrativa_negocio to authenticated;

create policy identidade_visual_select_own on public.identidade_visual
  for select to authenticated using (private.owns_business(business_id));
create policy identidade_visual_insert_own on public.identidade_visual
  for insert to authenticated with check (private.owns_business(business_id));
create policy identidade_visual_update_own on public.identidade_visual
  for update to authenticated using (private.owns_business(business_id))
  with check (private.owns_business(business_id));
create policy identidade_visual_delete_own on public.identidade_visual
  for delete to authenticated using (private.owns_business(business_id));

create policy narrativa_negocio_select_own on public.narrativa_negocio
  for select to authenticated using (private.owns_business(business_id));
create policy narrativa_negocio_insert_own on public.narrativa_negocio
  for insert to authenticated with check (private.owns_business(business_id));
create policy narrativa_negocio_update_own on public.narrativa_negocio
  for update to authenticated using (private.owns_business(business_id))
  with check (private.owns_business(business_id));
create policy narrativa_negocio_delete_own on public.narrativa_negocio
  for delete to authenticated using (private.owns_business(business_id));

create or replace function public.set_atualizado_em()
returns trigger language plpgsql set search_path = public as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger identidade_visual_atualizado_em before update on public.identidade_visual
  for each row execute function public.set_atualizado_em();
create trigger narrativa_negocio_atualizado_em before update on public.narrativa_negocio
  for each row execute function public.set_atualizado_em();
