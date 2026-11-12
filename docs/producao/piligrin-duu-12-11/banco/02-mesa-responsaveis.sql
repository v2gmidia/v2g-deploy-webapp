-- Carteira operacional interna. Nao representa estado da Meta, pagamento,
-- assinatura, reuniao ou nota fiscal. Somente o servidor operador escreve.
create table public.manager_accounts (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  operator_profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index manager_accounts_operator_idx
  on public.manager_accounts(operator_profile_id, business_id);

create table public.manager_tasks (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_type text not null check (task_type in
    ('prepare_meeting', 'review_instagram', 'collect_access',
     'choose_first_creative', 'prepare_first_campaign', 'support', 'other')),
  title text not null check (char_length(title) between 5 and 160),
  description text check (char_length(description) <= 2000),
  status text not null default 'open' check (status in ('open', 'done')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  completed_by uuid references public.profiles(id) on delete set null,
  completion_note text check (char_length(completion_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint manager_task_done_matches check (
    (status = 'open' and completed_by is null and completed_at is null)
    or (status = 'done' and completed_by is not null and completed_at is not null
        and char_length(trim(coalesce(completion_note, ''))) >= 5)
  )
);
create index manager_tasks_open_due_idx on public.manager_tasks(due_at, created_at)
  where status = 'open';
create index manager_tasks_business_idx on public.manager_tasks(business_id, created_at desc);
create index manager_tasks_assignee_idx on public.manager_tasks(assigned_to, due_at)
  where status = 'open';

alter table public.manager_accounts enable row level security;
alter table public.manager_tasks enable row level security;
revoke all on public.manager_accounts, public.manager_tasks from anon, authenticated;
-- Nao criar policy geral para authenticated: cada consulta e mutacao usa
-- service_role depois de conferir app_metadata.papel=operador no servidor.
