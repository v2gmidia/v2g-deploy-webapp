-- Preserva o acesso das contas existentes ao introduzir a trava comercial.
-- Futuras liberações dependem de pedido aprovado e e-mail confirmado.
create table public.webapp_legacy_access (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  reason text not null default 'existing_before_payment_gate'
    check (reason = 'existing_before_payment_gate'),
  granted_at timestamptz not null default now()
);

insert into public.webapp_legacy_access (profile_id)
select id from public.profiles;

alter table public.webapp_legacy_access enable row level security;
revoke all on public.webapp_legacy_access from anon, authenticated;
grant select on public.webapp_legacy_access to authenticated;
create policy legacy_access_read_own on public.webapp_legacy_access
  for select to authenticated using (profile_id = (select auth.uid()));
