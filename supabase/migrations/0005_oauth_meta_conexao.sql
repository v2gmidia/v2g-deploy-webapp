-- ============================================================
-- V2G — o que o OAuth do Meta precisa no banco
-- Ver docs/oauth-meta.md §1.
--
-- Nenhuma tabela nova: `meta_connections` e `ad_accounts` já nasceram na
-- 0001 com RLS e 4 policies cada. As policies existentes cobrem as
-- colunas novas automaticamente — RLS é por linha, não por coluna.
--
-- ATENÇÃO ao grant do fim deste arquivo. A 0003 trocou o grant de TABELA
-- de `meta_connections` por grants de COLUNA, para proteger
-- `token_secret_id`. O efeito colateral é que toda coluna nova nasce
-- ILEGÍVEL para `authenticated` até ser concedida explicitamente. Sem o
-- grant lá embaixo, o app inseriria as colunas e nunca conseguiria
-- lê-las — e o erro apareceria como "coluna não existe" no PostgREST,
-- que manda procurar no lugar errado.
-- ============================================================

-- ------------------------------------------------------------
-- ad_accounts: de quem é a conta, e se ela ainda funciona
-- ------------------------------------------------------------
alter table public.ad_accounts
  add column ownership text not null default 'cliente',
  add column status    text not null default 'ok';

-- `v2g` ainda não acontece: hoje toda conta é do próprio cliente. A
-- coluna nasce sabendo do outro caso para não virar migration depois.
alter table public.ad_accounts
  add constraint ad_accounts_ownership_check check (ownership in ('cliente', 'v2g')),
  add constraint ad_accounts_status_check check (status in ('ok', 'expired', 'revoked', 'no_permission'));

-- ------------------------------------------------------------
-- meta_connections: o que o callback do OAuth aprende
-- ------------------------------------------------------------
alter table public.meta_connections
  add column instagram_account_id text,   -- qual Instagram o cliente escolheu
  add column meta_user_id         text,   -- quem autorizou (diagnóstico)
  add column scopes               text[], -- o que foi de fato concedido
  add column last_error           text;   -- subcódigo do último erro 190

-- Um negócio tem UMA conexão. É esta constraint que faz o `on conflict`
-- de `conectar_meta()` funcionar — reconectar substitui, não duplica.
alter table public.meta_connections
  add constraint meta_connections_business_id_key unique (business_id);

alter table public.meta_connections
  add constraint meta_connections_status_check
  check (status in ('disconnected', 'connected', 'expiring', 'expired', 'revoked'));

-- O grant que a 0003 tornou obrigatório. `token_secret_id` continua
-- de fora, que é o ponto.
grant select (instagram_account_id, meta_user_id, scopes, last_error)
  on public.meta_connections to authenticated;
