-- ============================================================
-- V2G — migration inicial: profiles + businesses
-- Escopo deste PR: só o necessário para cadastro/login/tela protegida.
-- Nenhuma tabela nasce sem RLS + policies explícitas (regra do projeto).
-- ============================================================

-- gen_random_uuid() vem do pgcrypto; garantir que existe (idempotente).
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles: 1 linha por usuário autenticado, id = auth.users.id
-- ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  whatsapp   text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- select/insert/update/delete separados de propósito (nunca "for all"):
-- permite afinar cada operação depois sem reescrever as demais.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- businesses: dados do negócio, 1 profile pode ter mais de um
-- (a interface deste PR não cria linhas aqui ainda — a tabela existe
-- porque o onboarding futuro vai escrever nela; ver docs/mocks.md)
-- ------------------------------------------------------------
create table public.businesses (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  nome          text,
  segmento      text,
  cidade        text,
  raio_km       int,
  ticket_medio  numeric,
  onboarding    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index businesses_profile_id_idx on public.businesses (profile_id);

alter table public.businesses enable row level security;

create policy "businesses_select_own"
  on public.businesses for select
  using (auth.uid() = profile_id);

create policy "businesses_insert_own"
  on public.businesses for insert
  with check (auth.uid() = profile_id);

create policy "businesses_update_own"
  on public.businesses for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "businesses_delete_own"
  on public.businesses for delete
  using (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- Trigger: toda vez que um usuário é criado em auth.users (por
-- qualquer caminho — cadastro por e-mail/senha, login social no
-- futuro, convite por admin), a linha correspondente em profiles
-- nasce sozinha. Não depender do código do formulário de cadastro
-- pra isso é proposital: garante consistência não importa a porta
-- de entrada (ver docs/arquitetura.md, Decisão 4).
--
-- security definer: a trigger roda em auth.users com privilégios
-- restritos; sem isso, o insert em public.profiles esbarraria na
-- própria RLS que acabamos de criar (o "usuário" ainda não tem uma
-- sessão válida no momento exato da criação).
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, whatsapp)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nome',
    new.raw_user_meta_data ->> 'whatsapp'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
