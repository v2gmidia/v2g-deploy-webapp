-- Preparada, não aplicada. A obrigação mensal é única; uma nota rejeitada ou
-- cancelada pode ser substituída sem criar outra obrigação para a competência.
-- Não cria obrigações a partir da data do pagamento: início da prestação exige
-- confirmação operacional antes de qualquer gravação ou emissão.
create table public.fiscal_obligations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  competence_month date not null check (extract(day from competence_month) = 1),
  document_kind text not null check (document_kind = 'service'),
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  unique (order_id, competence_month, document_kind),
  unique (id, order_id)
);

alter table public.fiscal_documents
  add column obligation_id uuid,
  add constraint fiscal_documents_obligation_order_fk
    foreign key (obligation_id, order_id)
    references public.fiscal_obligations(id, order_id) on delete restrict;

create index fiscal_documents_obligation_idx
  on public.fiscal_documents(obligation_id) where obligation_id is not null;

-- Uma obrigação pode ter tentativas rejeitadas ou canceladas, mas nunca duas
-- NFS-e simultaneamente registradas como autorizadas para a mesma competência.
create unique index fiscal_documents_one_authorized_per_obligation_idx
  on public.fiscal_documents(obligation_id)
  where obligation_id is not null and status = 'authorized';

-- Documentos existentes permanecem sem vínculo até conferência da competência
-- na fonte fiscal. A migração não altera seu estado nem o converte em obrigação.
alter table public.fiscal_obligations enable row level security;
revoke all on public.fiscal_obligations from anon, authenticated;
grant select on public.fiscal_obligations to authenticated;
create policy fiscal_obligations_read_own on public.fiscal_obligations for select to authenticated
  using (exists (select 1 from public.commercial_orders o
    where o.id = order_id and o.buyer_profile_id = (select auth.uid())));
