-- ============================================================
-- 0008 — Estado de publicação no Meta
--
-- Colunas que a cadeia de publicação precisa. Nenhuma tabela nova:
-- publicar não é uma entidade, é um estado que `campaigns` passa a ter.
--
-- Desenho completo em docs/publicar-campanha.md §8.
-- ============================================================

-- ------------------------------------------------------------
-- campaigns: a máquina de estados da publicação
-- ------------------------------------------------------------
alter table public.campaigns
  add column if not exists publish_key        uuid,
  add column if not exists publish_state      text not null default 'draft',
  add column if not exists publish_error      text,
  add column if not exists publish_started_at timestamptz,
  add column if not exists external_adset_id  text,
  add column if not exists daily_budget_cents bigint;

-- `external_adset_id` também existe em `creatives`, desde a 0001. Não é
-- duplicação por descuido: no desenho original assumi 1 criativo = 1
-- anúncio = 1 conjunto. Para publicar isso não se sustenta — o conjunto
-- carrega ORÇAMENTO e SEGMENTAÇÃO, que são da campanha, não da peça.
-- Vários criativos dividem um conjunto.
--
-- A coluna em `creatives` fica para o dia em que houver mais de um
-- conjunto por campanha (teste A/B de público, por exemplo). Hoje, a
-- fonte da verdade é esta aqui. Quem ler `creatives.external_adset_id`
-- está lendo campo morto.
comment on column public.campaigns.external_adset_id is
  'Fonte da verdade do conjunto. creatives.external_adset_id esta morta ate existir mais de um conjunto por campanha.';

comment on column public.campaigns.daily_budget_cents is
  'Inteiro em CENTAVOS, como a Marketing API exige. R$ 80,00 = 8000. Erro de fator 100 aqui e 100x o gasto do cliente.';

alter table public.campaigns
  drop constraint if exists campaigns_publish_state_check;
alter table public.campaigns
  add constraint campaigns_publish_state_check
  check (publish_state in ('draft', 'publishing', 'published', 'failed'));

-- A trava de concorrência da camada 3 (§4) pergunta "existe publicação em
-- andamento para esta campanha?". Sem índice isso é seq scan; com ele é
-- imediato. Parcial porque só as linhas em 'publishing' interessam.
create index if not exists campaigns_publishing_idx
  on public.campaigns (id)
  where publish_state = 'publishing';

-- A camada 2 (busca por publish_key no nome do objeto remoto) precisa
-- reencontrar a linha local a partir da chave. Único porque duas
-- campanhas com a mesma chave tornariam a busca ambígua — que é
-- exatamente o problema que a chave existe para resolver.
create unique index if not exists campaigns_publish_key_idx
  on public.campaigns (publish_key)
  where publish_key is not null;

-- ------------------------------------------------------------
-- creatives: o que subiu e o que o Meta respondeu na revisão
-- ------------------------------------------------------------
alter table public.creatives
  add column if not exists external_image_hash text,
  add column if not exists status              text not null default 'draft';

alter table public.creatives
  drop constraint if exists creatives_status_check;
alter table public.creatives
  add constraint creatives_status_check
  check (status in ('draft', 'pending_review', 'approved', 'rejected', 'paused'));

-- `status` e `meta_status` são diferentes de propósito: `meta_status`
-- guarda o `effective_status` cru do Meta (mais de dez valores);
-- `status` guarda a nossa leitura, que a interface consulta. Traduzir na
-- leitura significaria espalhar o mapa por toda tela que mostra criativo.
comment on column public.creatives.status is
  'Leitura normalizada nossa (5 estados). meta_status guarda o effective_status cru do Meta.';

-- ------------------------------------------------------------
-- ad_accounts: o piso de orçamento, consultado e guardado
-- ------------------------------------------------------------
alter table public.ad_accounts
  add column if not exists min_daily_budget_cents bigint,
  add column if not exists min_budget_checked_at  timestamptz;

-- O mínimo varia por moeda, país e objetivo. Nenhum número fixo no
-- código: vem de GET /act_<id>/minimum_budgets. Guardado porque
-- consultar a cada publicação é requisição queimada para um dado que
-- muda em meses.
comment on column public.ad_accounts.min_daily_budget_cents is
  'Piso do Meta para esta conta, em centavos. Consultado em /minimum_budgets, nunca fixado no codigo.';

-- ------------------------------------------------------------
-- businesses: a cidade resolvida em coordenada
-- ------------------------------------------------------------
alter table public.businesses
  add column if not exists geo_lat         numeric,
  add column if not exists geo_lng         numeric,
  add column if not exists geo_key         text,
  add column if not exists geo_label       text,
  add column if not exists geo_resolved_at timestamptz;

-- `businesses.city` é texto livre ("São Paulo, SP"). A API precisa de
-- coordenada ou de uma chave de cidade do próprio Meta. A resolução é
-- GET /search?type=adgeolocation, e o resultado fica aqui: resolver a
-- mesma cidade a cada publicação é lento, frágil e desnecessário.
--
-- `geo_key` guarda a chave da cidade no Meta quando ela existe; é mais
-- precisa que lat/lng com raio, porque respeita o limite real do
-- município. `geo_label` guarda o nome que o Meta devolveu, para a
-- interface poder mostrar "vamos anunciar em: <label>" e o cliente
-- corrigir se a resolução errou a cidade.
comment on column public.businesses.geo_label is
  'Nome que o Meta devolveu para a cidade. Existe para a interface poder confirmar a resolucao com o cliente.';

-- ------------------------------------------------------------
-- Sem mudança de RLS.
--
-- Todas as tabelas acima já têm RLS com as quatro políticas por operação
-- desde a 0001, e as políticas filtram por `owns_business(business_id)`.
-- Coluna nova em tabela protegida nasce protegida — não há grant por
-- coluna aqui que precise ser refeito (diferente de meta_connections, ver
-- 0003).
--
-- A publicação em si roda com `service_role`, que passa por cima da RLS
-- por definição. O que protege o cliente ali não é a RLS: é a validação
-- de orçamento e o PAUSED.
-- ------------------------------------------------------------
