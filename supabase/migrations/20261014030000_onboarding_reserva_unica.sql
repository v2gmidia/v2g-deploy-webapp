-- Agenda própria: autorizada por Victor somente para o projeto Supabase de QA.
-- Uma reunião ativa por negócio; evento Google persistido para exibição e reconciliação.
create table if not exists public.onboarding_meetings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.commercial_orders(id),
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  calendar_id text not null,
  google_event_id text,
  google_etag text,
  google_event_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_meetings_intervalo check (ends_at > starts_at),
  constraint onboarding_meetings_confirmacao check (
    status <> 'confirmed' or (google_event_id is not null and google_etag is not null)
  )
);

create unique index if not exists onboarding_meetings_uma_ativa_por_negocio
  on public.onboarding_meetings(business_id)
  where status in ('pending', 'confirmed');

create unique index if not exists onboarding_meetings_uma_ativa_por_cnpj
  on public.onboarding_meetings(cnpj)
  where status in ('pending', 'confirmed');

create unique index if not exists onboarding_meetings_evento_google
  on public.onboarding_meetings(calendar_id, google_event_id)
  where google_event_id is not null;

create unique index if not exists onboarding_meetings_um_negocio_por_horario
  on public.onboarding_meetings(calendar_id, starts_at)
  where status in ('pending', 'confirmed');

create index if not exists onboarding_meetings_intervalo_ativo
  on public.onboarding_meetings(calendar_id, starts_at, ends_at)
  where status in ('pending', 'confirmed');

alter table public.onboarding_meetings enable row level security;
revoke all on public.onboarding_meetings from anon, authenticated;
-- O servidor faz a leitura com service role após conferir o negócio da sessão.
-- O QA não possui owns_business(uuid); não abrimos leitura direta ao cliente.

create trigger onboarding_meetings_set_updated_at
  before update on public.onboarding_meetings
  for each row execute function public.set_updated_at();
