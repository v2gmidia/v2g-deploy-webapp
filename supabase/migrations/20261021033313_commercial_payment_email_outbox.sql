-- Proposta local: nao aplicada. Nunca considerar aceite de e-mail como entrega.
create table public.commercial_payment_email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id),
  provider_charge_id text not null check (provider_charge_id ~ '^pay_[A-Za-z0-9]+$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'queued' check (status in ('queued','sending','accepted','review')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, provider_charge_id),
  check (status <> 'accepted' or provider_message_id is not null)
);
alter table public.commercial_payment_email_outbox enable row level security;
revoke all on public.commercial_payment_email_outbox from public, anon, authenticated, service_role;
grant select, insert, update on public.commercial_payment_email_outbox to service_role;
comment on table public.commercial_payment_email_outbox is
  'Confirmacao por cobranca, payload imutavel pelo aplicativo; apenas service_role. sending/review nunca sao reenviados automaticamente apos resultado ambiguo. accepted nao comprova entrega na caixa.';
