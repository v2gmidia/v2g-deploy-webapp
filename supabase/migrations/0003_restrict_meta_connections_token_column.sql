-- ============================================================
-- V2G — proteção real da coluna `meta_connections.token_secret_id`
--
-- A 0001 tentou proteger essa coluna com:
--     revoke select (token_secret_id) on public.meta_connections
--       from anon, authenticated;
--
-- Isso NÃO funciona, e o teste de isolamento provou: o usuário
-- autenticado continuava lendo a coluna normalmente (HTTP 200 com o
-- uuid no corpo). O motivo é como o Postgres resolve privilégio de
-- coluna: um GRANT no nível da TABELA já concede acesso a todas as
-- colunas, e um REVOKE de coluna não recorta um grant de tabela.
-- O Supabase concede `select` de tabela a `authenticated` por padrão,
-- então o revoke de coluna era um no-op.
--
-- A forma correta é inverter: tirar o grant de tabela e conceder
-- explicitamente só as colunas permitidas.
--
-- Consequência prática para o app: `select=*` em `meta_connections`
-- passa a retornar 403. Qualquer leitura dessa tabela precisa listar
-- as colunas explicitamente. Isso é intencional — `*` numa tabela que
-- guarda referência a segredo é justamente o que queremos impedir.
--
-- `anon` perde todo acesso à tabela (não tinha policy nenhuma que o
-- permitisse ler, mas privilégio e policy são camadas diferentes e as
-- duas devem dizer não).
-- ============================================================

revoke all on public.meta_connections from anon;

revoke select, insert, update on public.meta_connections from authenticated;

grant select (id, business_id, meta_page_id, status, connected_at, expires_at, created_at, updated_at)
  on public.meta_connections to authenticated;

grant insert (id, business_id, meta_page_id, status, connected_at, expires_at, created_at, updated_at)
  on public.meta_connections to authenticated;

-- Update é mais restrito ainda: `business_id` não deve ser reescrito
-- pelo cliente (seria uma forma de mover a conexão para outro negócio).
grant update (meta_page_id, status, connected_at, expires_at, updated_at)
  on public.meta_connections to authenticated;
