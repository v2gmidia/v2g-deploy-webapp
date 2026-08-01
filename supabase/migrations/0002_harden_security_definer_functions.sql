-- ============================================================
-- V2G — endurecimento das funções security definer
--
-- Motivo: o advisor de segurança do Supabase apontou que
-- `owns_business()` e `handle_new_user()`, por viverem no schema
-- `public`, ficam chamáveis via `/rest/v1/rpc/<nome>` — `anon`
-- conseguia invocar `handle_new_user()` pela API REST.
--
-- `handle_new_user()` é função de trigger: ninguém deveria poder
-- chamá-la diretamente. `owns_business()` precisa continuar
-- executável por `authenticated` (as policies de RLS a avaliam com
-- os privilégios de quem consulta), mas não precisa — nem deve —
-- ser um endpoint HTTP.
--
-- Solução: schema `private`, que não está na lista de schemas
-- expostos pelo PostgREST. As policies e o trigger seguem a função
-- pelo OID, então continuam funcionando sem serem reescritos.
--
-- `claim_businesses()` fica em `public` de propósito: ela É para ser
-- chamada pelo usuário logado (caso o N8N crie o negócio depois de o
-- dono já existir). O WARN que sobra no advisor referente a ela é
-- aceito conscientemente — a função só age sobre negócios órfãos cujo
-- `claim_email` bate com o e-mail do próprio chamador.
-- ============================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;

-- `authenticated` precisa de USAGE no schema para que a avaliação da
-- policy consiga resolver `private.owns_business`.
grant usage on schema private to authenticated;

alter function public.owns_business(uuid) set schema private;
alter function public.handle_new_user() set schema private;

revoke execute on function private.handle_new_user() from public;
revoke execute on function private.handle_new_user() from anon;
revoke execute on function private.handle_new_user() from authenticated;

revoke execute on function private.owns_business(uuid) from public;
revoke execute on function private.owns_business(uuid) from anon;
grant execute on function private.owns_business(uuid) to authenticated;
