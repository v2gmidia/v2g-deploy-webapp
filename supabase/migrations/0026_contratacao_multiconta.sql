-- Estrutura aditiva para o funil comercial. Nenhum cliente existente é alterado.
-- As transições são feitas exclusivamente no servidor após verificar a origem.

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (business_id, profile_id)
);
create index business_memberships_profile_active_idx
  on public.business_memberships(profile_id, business_id) where revoked_at is null;

create table public.commercial_orders (
  id uuid primary key default gen_random_uuid(),
  external_ref text not null unique,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  buyer_email text not null,
  business_id uuid references public.businesses(id) on delete set null,
  legal_name text not null,
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  declares_cnpj boolean not null check (declares_cnpj),
  sells_by_whatsapp boolean not null check (sells_by_whatsapp),
  origin text not null check (origin in ('assisted', 'self_service')),
  payment_method text not null check (payment_method in ('direct_pix', 'asaas_pix', 'asaas_card')),
  billing_period text not null check (billing_period in ('monthly', 'annual_upfront')),
  unit_price_cents integer not null check (unit_price_cents = 50000),
  discount_percent integer not null check (
    (billing_period = 'monthly' and discount_percent = 0) or
    (billing_period = 'annual_upfront' and discount_percent = 12)
  ),
  unit_count integer not null check (unit_count > 0),
  total_cents integer not null check (total_cents > 0),
  status text not null default 'awaiting_payment' check
    (status in ('awaiting_payment', 'proof_received', 'payment_approved', 'cancelled')),
  payment_approved_at timestamptz,
  payment_approved_by uuid references public.profiles(id) on delete set null,
  provider_customer_id text,
  provider_charge_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_orders_total_matches check (
    total_cents = unit_count * case billing_period
      when 'monthly' then 50000
      else 528000
    end
  ),
  constraint commercial_orders_approval_matches check (
    (status = 'payment_approved' and payment_approved_at is not null) or
    (status <> 'payment_approved' and payment_approved_at is null)
  )
);
create index commercial_orders_buyer_idx on public.commercial_orders(buyer_profile_id);
create index commercial_orders_business_idx on public.commercial_orders(business_id);

create table public.commercial_order_units (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  ad_account_id uuid references public.ad_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (order_id, ordinal),
  unique (order_id, ad_account_id)
);

create table public.commercial_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  source text not null check (source in ('operator', 'asaas', 'signature_provider')),
  external_event_id text not null,
  event_type text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  unique (source, external_event_id)
);
create index commercial_events_order_idx on public.commercial_events(order_id, occurred_at);

create table public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  template_version text not null,
  provider_document_id text unique,
  status text not null default 'draft' check
    (status in ('draft', 'sent', 'partially_signed', 'signed', 'voided', 'failed')),
  v2g_signer text not null default 'Victor Cabral Nascimento Silva',
  customer_signer_name text,
  customer_signer_capacity text,
  signed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, template_version),
  constraint contract_signed_matches check (status <> 'signed' or signed_at is not null)
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete restrict,
  provider text not null check (provider in ('asaas', 'other')),
  provider_invoice_id text,
  status text not null default 'pending' check
    (status in ('pending', 'requested', 'authorized', 'rejected', 'cancelled')),
  authorized_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_invoice_id),
  constraint fiscal_authorized_matches check (status <> 'authorized' or authorized_at is not null)
);
create index fiscal_documents_order_idx on public.fiscal_documents(order_id);

-- Nada é exposto ao papel anônimo. O usuário apenas lê o próprio vínculo/pedido.
-- Gravações exigem service_role em rota autenticada ou webhook verificado.
alter table public.business_memberships enable row level security;
alter table public.commercial_orders enable row level security;
alter table public.commercial_order_units enable row level security;
alter table public.commercial_events enable row level security;
alter table public.contract_documents enable row level security;
alter table public.fiscal_documents enable row level security;

revoke all on public.business_memberships, public.commercial_orders,
  public.commercial_order_units, public.commercial_events,
  public.contract_documents, public.fiscal_documents from anon, authenticated;
grant select on public.business_memberships, public.commercial_orders,
  public.commercial_order_units, public.contract_documents,
  public.fiscal_documents to authenticated;

create policy memberships_read_own on public.business_memberships for select to authenticated
  using (profile_id = (select auth.uid()) and revoked_at is null);
create policy orders_read_own on public.commercial_orders for select to authenticated
  using (buyer_profile_id = (select auth.uid()));
create policy units_read_own on public.commercial_order_units for select to authenticated
  using (exists (select 1 from public.commercial_orders o
    where o.id = order_id and o.buyer_profile_id = (select auth.uid())));
create policy contracts_read_own on public.contract_documents for select to authenticated
  using (exists (select 1 from public.commercial_orders o
    where o.id = order_id and o.buyer_profile_id = (select auth.uid())));
create policy fiscal_read_own on public.fiscal_documents for select to authenticated
  using (exists (select 1 from public.commercial_orders o
    where o.id = order_id and o.buyer_profile_id = (select auth.uid())));
