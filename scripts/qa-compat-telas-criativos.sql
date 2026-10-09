-- Somente v2g-webapp-qa. Espelha as colunas ja existentes em producao
-- que as telas /criativos, /alertas e /gestor/criativos consultam.
-- Nao e migration de producao e nao substitui as migrations historicas.
alter table public.businesses
  add column if not exists avg_ticket_min numeric,
  add column if not exists avg_ticket_max numeric,
  add column if not exists cadastro_estado text,
  add column if not exists cadastro_iniciado_em timestamptz,
  add column if not exists cep text,
  add column if not exists site_url text,
  add column if not exists instagram_handle text,
  add column if not exists atende_somente_no_local boolean default true;

alter table public.creatives
  add column if not exists uso text default 'campanha',
  add column if not exists status text,
  add column if not exists arquivado_em timestamptz;

alter table public.campaigns
  add column if not exists publish_state text,
  add column if not exists ativada_em timestamptz,
  add column if not exists ativada_por text,
  add column if not exists pausada_em timestamptz,
  add column if not exists pausada_por text;
