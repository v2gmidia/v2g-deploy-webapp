-- ============================================================
-- V2G — schema consolidado (projeto V2G-SITE)
--
-- Substitui a 0001 anterior (profiles + businesses em português),
-- que nunca chegou a ser aplicada em nenhum projeto. A partir da
-- primeira aplicação desta migration, todo rename vira migration nova.
--
-- Convenção: inglês, snake_case, sem exceção. Ver docs/schema-consolidado.md.
--
-- Regras estruturais deste arquivo:
--   * RLS ligado em TODAS as tabelas, com 4 policies explícitas
--     (select/insert/update/delete). Nenhuma `for all`.
--   * Toda função `security definer` com `set search_path = ''` e
--     referências totalmente qualificadas.
--   * Token do Meta nunca em coluna — só a referência ao Vault.
--   * Índice em toda FK que será filtrada com frequência.
--
-- Extensões: `pgcrypto` (schema `extensions`) e `supabase_vault`
-- (schema `vault`) já vêm habilitadas no projeto; não são recriadas
-- aqui. `gen_random_uuid()` é core no Postgres 17.
-- ============================================================


-- ============================================================
-- 1. FUNÇÕES DE APOIO
-- ============================================================

-- ------------------------------------------------------------
-- updated_at automático. Não é security definer (roda com os
-- privilégios de quem escreve na tabela), mas fixa search_path
-- mesmo assim: `now()` deve resolver para pg_catalog.now e nada mais.
-- ------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 2. PROFILES
-- ============================================================

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  whatsapp   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ============================================================
-- 3. BUSINESSES
--
-- `profile_id` é NULÁVEL de propósito: o N8N cria negócios antes de
-- existir um usuário no webapp. Um negócio nesse estado é "órfão" —
-- invisível para toda policy de usuário, acessível só por
-- service_role. Ver seção 8 (órfãos e reivindicação).
-- ============================================================

create table public.businesses (
  id                         uuid primary key default gen_random_uuid(),
  profile_id                 uuid references public.profiles (id) on delete cascade,
  claim_email                text,
  short_id                   text unique,
  name                       text not null,
  niche                      text,
  city                       text,
  radius_km                  int,
  description                text,
  avg_ticket                 numeric,
  avg_direct_cost            numeric,
  target_profit_per_customer numeric,
  monthly_budget             numeric,
  differentiators            text[],
  guarantee                  text,
  delivery_time              text,
  payment_policy             text,
  availability               text,
  business_hours             text,
  onboarding                 jsonb not null default '{}'::jsonb,
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index businesses_profile_id_idx on public.businesses (profile_id);

-- Índice parcial: só as linhas órfãs, que é exatamente o conjunto
-- consultado pela reivindicação e pela listagem administrativa.
create index businesses_unclaimed_idx
  on public.businesses (lower(claim_email))
  where profile_id is null;

alter table public.businesses enable row level security;

-- `profile_id is not null` explícito nas quatro policies: ver a nota
-- em owns_business(). Um órfão nunca é visível por esta via.
create policy "businesses_select_own"
  on public.businesses for select to authenticated
  using (profile_id is not null and profile_id = (select auth.uid()));

-- No insert o usuário só pode criar negócio já com o dono sendo ele
-- mesmo — o cliente não consegue fabricar órfãos.
create policy "businesses_insert_own"
  on public.businesses for insert to authenticated
  with check (profile_id is not null and profile_id = (select auth.uid()));

create policy "businesses_update_own"
  on public.businesses for update to authenticated
  using (profile_id is not null and profile_id = (select auth.uid()))
  with check (profile_id is not null and profile_id = (select auth.uid()));

create policy "businesses_delete_own"
  on public.businesses for delete to authenticated
  using (profile_id is not null and profile_id = (select auth.uid()));

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- owns_business(): a regra de autorização do projeto inteiro, num
-- lugar só. Toda tabela que descende de um negócio usa esta função
-- nas suas policies.
--
-- Definida DEPOIS de `businesses` de propósito: o corpo de uma função
-- `language sql` é validado na criação, então a tabela referenciada
-- precisa já existir.
--
-- security definer é necessário: a função precisa consultar
-- `businesses` ignorando a RLS de `businesses` (senão a checagem
-- se auto-referencia). `set search_path = ''` é obrigatório — sem
-- ele, um schema controlado pelo chamador poderia sequestrar a
-- resolução de `businesses` dentro de uma função que roda com
-- privilégios do owner. Isso é escalonamento de privilégio real,
-- não teoria.
--
-- `profile_id is not null` é EXPLÍCITO de propósito. Sem isso, um
-- negócio órfão (profile_id nulo) faria `null = auth.uid()` avaliar
-- para NULL, que a RLS trata como "não passou" — o comportamento
-- certo, mas por acidente. Escrito assim, a intenção fica no código.
--
-- Nota: a 0002 move esta função para o schema `private`, para que ela
-- deixe de ser chamável via `/rest/v1/rpc/`. Ela nasce em `public`
-- aqui e é movida lá — a história das migrations reflete isso.
-- ------------------------------------------------------------
create function public.owns_business(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.profile_id is not null
      and b.profile_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_business(uuid) from public, anon;
grant execute on function public.owns_business(uuid) to authenticated;


-- ============================================================
-- 4. META_CONNECTIONS
--
-- `token_secret_id` guarda SÓ a referência ao segredo em
-- `vault.secrets`. O valor do token nunca fica em coluna de tabela.
-- Além da RLS, a coluna tem o privilégio de SELECT revogado de
-- anon/authenticated — defesa em profundidade: mesmo uma policy
-- futura mal escrita não expõe a referência via PostgREST.
-- ============================================================

create table public.meta_connections (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  meta_page_id    text,
  token_secret_id uuid,
  status          text not null default 'disconnected',
  connected_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index meta_connections_business_id_idx on public.meta_connections (business_id);

alter table public.meta_connections enable row level security;

create policy "meta_connections_select_own"
  on public.meta_connections for select to authenticated
  using (public.owns_business(business_id));

create policy "meta_connections_insert_own"
  on public.meta_connections for insert to authenticated
  with check (public.owns_business(business_id));

create policy "meta_connections_update_own"
  on public.meta_connections for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "meta_connections_delete_own"
  on public.meta_connections for delete to authenticated
  using (public.owns_business(business_id));

create trigger meta_connections_set_updated_at
  before update on public.meta_connections
  for each row execute function public.set_updated_at();

-- ATENÇÃO: esta linha é um NO-OP. Está preservada porque foi o que
-- realmente rodou nesta migration, mas ela NÃO protege a coluna — um
-- grant de SELECT no nível da tabela (que o Supabase concede a
-- `authenticated` por padrão) já cobre todas as colunas, e um revoke
-- de coluna não recorta um grant de tabela. O teste de isolamento
-- pegou isso: o usuário lia o `token_secret_id` sem obstáculo.
-- A proteção de verdade está na 0003. Não confie nesta linha.
revoke select (token_secret_id) on public.meta_connections from anon, authenticated;


-- ============================================================
-- 5. AD_ACCOUNTS
-- ============================================================

create table public.ad_accounts (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses (id) on delete cascade,
  meta_connection_id uuid references public.meta_connections (id) on delete set null,
  external_id        text not null,
  name               text,
  currency           text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (business_id, external_id)
);

create index ad_accounts_business_id_idx on public.ad_accounts (business_id);
create index ad_accounts_meta_connection_id_idx on public.ad_accounts (meta_connection_id);

alter table public.ad_accounts enable row level security;

create policy "ad_accounts_select_own"
  on public.ad_accounts for select to authenticated
  using (public.owns_business(business_id));

create policy "ad_accounts_insert_own"
  on public.ad_accounts for insert to authenticated
  with check (public.owns_business(business_id));

create policy "ad_accounts_update_own"
  on public.ad_accounts for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "ad_accounts_delete_own"
  on public.ad_accounts for delete to authenticated
  using (public.owns_business(business_id));

create trigger ad_accounts_set_updated_at
  before update on public.ad_accounts
  for each row execute function public.set_updated_at();


-- ============================================================
-- 6. ANALYSIS_RUNS
--
-- Âncora de correlação de um run do N8N. `input_snapshot` guarda o
-- que a IA recebeu como entrada naquele momento — `businesses` guarda
-- o valor atual, que muda com o tempo. Sem o snapshot, um diagnóstico
-- antigo fica impossível de reproduzir.
-- ============================================================

create table public.analysis_runs (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  input_snapshot jsonb not null default '{}'::jsonb,
  status         text not null default 'generated',
  needs_review   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index analysis_runs_business_id_idx on public.analysis_runs (business_id);

alter table public.analysis_runs enable row level security;

create policy "analysis_runs_select_own"
  on public.analysis_runs for select to authenticated
  using (public.owns_business(business_id));

create policy "analysis_runs_insert_own"
  on public.analysis_runs for insert to authenticated
  with check (public.owns_business(business_id));

create policy "analysis_runs_update_own"
  on public.analysis_runs for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "analysis_runs_delete_own"
  on public.analysis_runs for delete to authenticated
  using (public.owns_business(business_id));

create trigger analysis_runs_set_updated_at
  before update on public.analysis_runs
  for each row execute function public.set_updated_at();


-- ============================================================
-- 7. OFFERS
-- ============================================================

create table public.offers (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs (id) on delete set null,
  name            text,
  payload         jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index offers_business_id_idx on public.offers (business_id);
create index offers_analysis_run_id_idx on public.offers (analysis_run_id);

alter table public.offers enable row level security;

create policy "offers_select_own"
  on public.offers for select to authenticated
  using (public.owns_business(business_id));

create policy "offers_insert_own"
  on public.offers for insert to authenticated
  with check (public.owns_business(business_id));

create policy "offers_update_own"
  on public.offers for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "offers_delete_own"
  on public.offers for delete to authenticated
  using (public.owns_business(business_id));

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();


-- ============================================================
-- 8. CAMPAIGNS
--
-- `external_campaign_id` é o id da campanha no Meta. O nível de
-- anúncio (adset/ad/creative) vive em `creatives` — ver
-- docs/schema-consolidado.md §1.4 e o limite conhecido dessa escolha.
-- ============================================================

create table public.campaigns (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses (id) on delete cascade,
  ad_account_id        uuid references public.ad_accounts (id) on delete set null,
  offer_id             uuid references public.offers (id) on delete set null,
  analysis_run_id      uuid references public.analysis_runs (id) on delete set null,
  name                 text,
  objective            text,
  structure            jsonb not null default '{}'::jsonb,
  external_campaign_id text,
  meta_status          text,
  status               text not null default 'draft',
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index campaigns_business_id_idx on public.campaigns (business_id);
create index campaigns_ad_account_id_idx on public.campaigns (ad_account_id);
create index campaigns_offer_id_idx on public.campaigns (offer_id);
create index campaigns_analysis_run_id_idx on public.campaigns (analysis_run_id);
create index campaigns_external_campaign_id_idx on public.campaigns (external_campaign_id);

alter table public.campaigns enable row level security;

create policy "campaigns_select_own"
  on public.campaigns for select to authenticated
  using (public.owns_business(business_id));

create policy "campaigns_insert_own"
  on public.campaigns for insert to authenticated
  with check (public.owns_business(business_id));

create policy "campaigns_update_own"
  on public.campaigns for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "campaigns_delete_own"
  on public.campaigns for delete to authenticated
  using (public.owns_business(business_id));

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();


-- ============================================================
-- 9. CREATIVES
--
-- Absorve o nível de anúncio do antigo `campanhas_meta`: assume
-- 1 criativo = 1 anúncio. Quando formos gerenciar orçamento e
-- segmentação por adset, entra uma tabela `ad_sets` e as colunas
-- `external_adset_id` migram para lá.
-- ============================================================

create table public.creatives (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses (id) on delete cascade,
  campaign_id          uuid references public.campaigns (id) on delete set null,
  analysis_run_id      uuid references public.analysis_runs (id) on delete set null,
  type                 text,
  file_name            text,
  storage_path         text,
  vision_description   text,
  copy                 jsonb not null default '{}'::jsonb,
  external_adset_id    text,
  external_creative_id text,
  external_ad_id       text,
  meta_status          text,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index creatives_business_id_idx on public.creatives (business_id);
create index creatives_campaign_id_idx on public.creatives (campaign_id);
create index creatives_analysis_run_id_idx on public.creatives (analysis_run_id);

alter table public.creatives enable row level security;

create policy "creatives_select_own"
  on public.creatives for select to authenticated
  using (public.owns_business(business_id));

create policy "creatives_insert_own"
  on public.creatives for insert to authenticated
  with check (public.owns_business(business_id));

create policy "creatives_update_own"
  on public.creatives for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "creatives_delete_own"
  on public.creatives for delete to authenticated
  using (public.owns_business(business_id));

create trigger creatives_set_updated_at
  before update on public.creatives
  for each row execute function public.set_updated_at();


-- ============================================================
-- 10. METRICS_DAILY
--
-- Granularidade dia × campanha × criativo. A unique com
-- `nulls not distinct` (Postgres 15+) torna a ingestão idempotente
-- mesmo quando `creative_id` é nulo (métrica só de campanha):
-- reprocessar o mesmo dia faz upsert, não duplica.
-- ============================================================

create table public.metrics_daily (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  campaign_id   uuid references public.campaigns (id) on delete cascade,
  creative_id   uuid references public.creatives (id) on delete cascade,
  ad_account_id uuid references public.ad_accounts (id) on delete set null,
  date          date not null,
  impressions   bigint  not null default 0,
  clicks        bigint  not null default 0,
  spend         numeric not null default 0,
  conversions   numeric not null default 0,
  revenue       numeric not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique nulls not distinct (campaign_id, creative_id, date)
);

create index metrics_daily_business_id_idx on public.metrics_daily (business_id);
create index metrics_daily_campaign_id_idx on public.metrics_daily (campaign_id);
create index metrics_daily_creative_id_idx on public.metrics_daily (creative_id);
create index metrics_daily_business_date_idx on public.metrics_daily (business_id, date desc);

alter table public.metrics_daily enable row level security;

create policy "metrics_daily_select_own"
  on public.metrics_daily for select to authenticated
  using (public.owns_business(business_id));

create policy "metrics_daily_insert_own"
  on public.metrics_daily for insert to authenticated
  with check (public.owns_business(business_id));

create policy "metrics_daily_update_own"
  on public.metrics_daily for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "metrics_daily_delete_own"
  on public.metrics_daily for delete to authenticated
  using (public.owns_business(business_id));

create trigger metrics_daily_set_updated_at
  before update on public.metrics_daily
  for each row execute function public.set_updated_at();


-- ============================================================
-- 11. DECISIONS
--
-- Tabela própria, separada de `analysis_runs`: run é a execução,
-- decision é o julgamento. Um run produz N decisions (classificação,
-- diagnóstico, e no futuro decisões operacionais como pausar campanha
-- ou remanejar orçamento) — e uma decision pode nascer fora de um run,
-- por isso `run_id` é nulável.
-- ============================================================

create table public.decisions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  run_id       uuid references public.analysis_runs (id) on delete set null,
  campaign_id  uuid references public.campaigns (id) on delete set null,
  kind         text not null,
  payload      jsonb not null default '{}'::jsonb,
  needs_review boolean not null default false,
  status       text not null default 'pending',
  applied_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index decisions_business_id_idx on public.decisions (business_id);
create index decisions_run_id_idx on public.decisions (run_id);
create index decisions_campaign_id_idx on public.decisions (campaign_id);

-- Fila de revisão: o filtro mais provável da interface.
create index decisions_needs_review_idx
  on public.decisions (business_id, created_at desc)
  where needs_review;

alter table public.decisions enable row level security;

create policy "decisions_select_own"
  on public.decisions for select to authenticated
  using (public.owns_business(business_id));

create policy "decisions_insert_own"
  on public.decisions for insert to authenticated
  with check (public.owns_business(business_id));

create policy "decisions_update_own"
  on public.decisions for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "decisions_delete_own"
  on public.decisions for delete to authenticated
  using (public.owns_business(business_id));

create trigger decisions_set_updated_at
  before update on public.decisions
  for each row execute function public.set_updated_at();


-- ============================================================
-- 12. NEGÓCIOS ÓRFÃOS — LISTAGEM E REIVINDICAÇÃO
--
-- Um negócio com `profile_id` nulo não aparece em nenhuma policy de
-- usuário. Isso é seguro, mas é invisível — e invisível sem erro é
-- exatamente como uma falha de RLS passa despercebida. As duas
-- ferramentas abaixo existem para tornar esse estado observável.
--
-- Por que função e não view: uma view em `public` é exposta pelo
-- PostgREST. Com `security_invoker = true` ela herda a RLS e nunca
-- mostra órfão nenhum (inútil); com `security_invoker = false` ela
-- ignora a RLS e passa a ser um caminho de leitura sem dono
-- alcançável por qualquer role com select (perigoso). Uma função
-- com EXECUTE revogado de anon/authenticated não tem esse dilema.
-- ============================================================

create function public.list_orphan_businesses()
returns table (
  id          uuid,
  short_id    text,
  name        text,
  claim_email text,
  created_at  timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select b.id, b.short_id, b.name, b.claim_email, b.created_at
  from public.businesses b
  where b.profile_id is null
  order by b.created_at desc;
$$;

-- Só service_role (o N8N e rotinas de backend). Nunca o usuário final.
revoke execute on function public.list_orphan_businesses() from public, anon, authenticated;


-- ------------------------------------------------------------
-- claim_businesses(): vincula ao usuário logado todo negócio órfão
-- cujo `claim_email` bate com o e-mail dele. Idempotente — rodar de
-- novo não faz nada porque a linha deixa de ser órfã.
--
-- Chamada automaticamente no primeiro login pelo trigger
-- `handle_new_user()`. Exposta também como função chamável para o
-- caso do negócio ser criado pelo N8N DEPOIS do usuário já existir.
-- ------------------------------------------------------------
create function public.claim_businesses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id    uuid := (select auth.uid());
  current_user_email text;
  claimed_count      integer;
begin
  if current_user_id is null then
    return 0;
  end if;

  select u.email into current_user_email
  from auth.users u
  where u.id = current_user_id;

  if current_user_email is null then
    return 0;
  end if;

  update public.businesses b
     set profile_id  = current_user_id,
         claim_email = null
   where b.profile_id is null
     and b.claim_email is not null
     and lower(b.claim_email) = lower(current_user_email);

  get diagnostics claimed_count = row_count;
  return claimed_count;
end;
$$;

revoke execute on function public.claim_businesses() from public, anon;
grant execute on function public.claim_businesses() to authenticated;


-- ============================================================
-- 13. TRIGGER DE CRIAÇÃO DE USUÁRIO
--
-- Cria a linha em `profiles` e reivindica negócios órfãos na mesma
-- transação. Vive no banco, não no código do formulário, porque
-- `auth.users` pode receber linhas por vários caminhos (e-mail/senha,
-- login social, convite por admin) — ver docs/arquitetura.md, Decisão 4.
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, whatsapp)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'whatsapp'
  );

  -- Reivindicação no primeiro login: o N8N pode ter criado o negócio
  -- antes de o dono se cadastrar. Não usa claim_businesses() porque
  -- aqui ainda não existe `auth.uid()` — a sessão não começou.
  if new.email is not null then
    update public.businesses b
       set profile_id  = new.id,
           claim_email = null
     where b.profile_id is null
       and b.claim_email is not null
       and lower(b.claim_email) = lower(new.email);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
