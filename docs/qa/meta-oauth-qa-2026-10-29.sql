-- QA ONLY: zskpijnqgkqwxksqmzmf. Nunca aplicar automaticamente em produção.
-- Recupera o contrato mínimo do OAuth Meta ausente no QA em 29/10/2026.
-- Origem: supabase/migrations/0005_oauth_meta_conexao.sql,
-- 0006_conectar_meta.sql e 0007_obter_token_meta.sql.
-- A tabela meta_connections foi conferida vazia antes desta migration.

alter table public.meta_connections
  add column instagram_account_id text,
  add column meta_user_id text,
  add column scopes text[],
  add column last_error text;

alter table public.meta_connections
  add constraint meta_connections_business_id_key unique (business_id),
  add constraint meta_connections_status_check
    check (status in ('disconnected', 'connected', 'expiring', 'expired', 'revoked'));

grant select (instagram_account_id, meta_user_id, scopes, last_error)
  on public.meta_connections to authenticated;

create function public.conectar_meta(
  p_business_id uuid,
  p_token text,
  p_expires_at timestamptz,
  p_meta_user_id text,
  p_scopes text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := 'meta_token_' || p_business_id::text;
  v_secret_id uuid;
  v_conn_id uuid;
begin
  select s.id into v_secret_id from vault.secrets s where s.name = v_nome;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_token, v_nome, 'Token de acesso do Meta');
  else
    perform vault.update_secret(v_secret_id, p_token);
  end if;

  insert into public.meta_connections as mc (
    business_id, token_secret_id, status, connected_at, expires_at,
    meta_user_id, scopes, last_error
  ) values (
    p_business_id, v_secret_id, 'connected', now(), p_expires_at,
    p_meta_user_id, p_scopes, null
  )
  on conflict (business_id) do update set
    token_secret_id = excluded.token_secret_id,
    status = 'connected',
    connected_at = now(),
    expires_at = excluded.expires_at,
    meta_user_id = excluded.meta_user_id,
    scopes = excluded.scopes,
    last_error = null,
    updated_at = now()
  returning mc.id into v_conn_id;

  return v_conn_id;
end;
$$;

revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from public;
revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from anon;
revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from authenticated;
grant execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) to service_role;

create function public.obter_token_meta(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_status text;
  v_token text;
begin
  select mc.token_secret_id, mc.status
    into v_secret_id, v_status
  from public.meta_connections mc
  where mc.business_id = p_business_id;

  if v_secret_id is null or v_status not in ('connected', 'expiring') then
    return null;
  end if;

  select ds.decrypted_secret into v_token
  from vault.decrypted_secrets ds
  where ds.id = v_secret_id;

  return v_token;
end;
$$;

revoke execute on function public.obter_token_meta(uuid) from public;
revoke execute on function public.obter_token_meta(uuid) from anon;
revoke execute on function public.obter_token_meta(uuid) from authenticated;
grant execute on function public.obter_token_meta(uuid) to service_role;
