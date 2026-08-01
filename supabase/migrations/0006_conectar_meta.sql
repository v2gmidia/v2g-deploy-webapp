-- ============================================================
-- V2G — a transação que grava o token do Meta
--
-- POR QUE ESTAS FUNÇÕES FICAM EM `public` E NÃO EM `private`.
--
-- O desenho em docs/oauth-meta.md dizia `private.conectar_meta()`, pela
-- mesma lógica da 0002: schema `private` não é exposto pelo PostgREST,
-- então a função não vira endpoint. A 0005 chegou a criá-la lá — e isso
-- estava errado.
--
-- O motivo: o app chama esta função por RPC (`supabase.rpc(...)`), e RPC
-- passa pelo PostgREST. O que não é exposto não é chamável por NINGUÉM
-- via RPC — nem por `service_role`. A função em `private` só seria
-- alcançável por uma conexão Postgres direta, que a aplicação não tem.
--
-- A proteção equivalente, para função que precisa ser chamável: manter
-- em `public` e revogar EXECUTE de `public`, `anon` e `authenticated`,
-- concedendo só a `service_role`. É exatamente o desenho de
-- `list_orphan_businesses()` na 0001, que o teste de isolamento do lote 2
-- confirmou devolver HTTP 403 para usuário autenticado. O advisor de
-- segurança também não reclama quando EXECUTE está revogado dos dois
-- papéis públicos.
--
-- Consequência prática: o token trafega como parâmetro de um POST sob
-- TLS e nunca volta na resposta (a função devolve o uuid da conexão). Ele
-- não fica em coluna, não é logado pela aplicação e não passa em nenhum
-- `select`.
-- ============================================================

drop function if exists private.conectar_meta(uuid, text, timestamptz, text, text[]);

-- ------------------------------------------------------------
-- conectar_meta(): Vault + meta_connections numa transação só.
--
-- Segredo no Vault sem linha em `meta_connections` vira órfão que
-- ninguém sabe que existe. Linha sem segredo vira conexão que nunca
-- funciona. Fazendo tudo aqui dentro, os dois deixam de ser possíveis:
-- se qualquer passo falhar, a transação inteira volta atrás.
--
-- O nome do segredo é determinístico (`meta_token_<business_id>`), então
-- reconectar ATUALIZA o segredo existente em vez de acumular lixo no
-- Vault a cada reautorização.
-- ------------------------------------------------------------
create function public.conectar_meta(
  p_business_id  uuid,
  p_token        text,
  p_expires_at   timestamptz,
  p_meta_user_id text,
  p_scopes       text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome      text := 'meta_token_' || p_business_id::text;
  v_secret_id uuid;
  v_conn_id   uuid;
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
  )
  values (
    p_business_id, v_secret_id, 'connected', now(), p_expires_at,
    p_meta_user_id, p_scopes, null
  )
  on conflict (business_id) do update set
    token_secret_id = excluded.token_secret_id,
    status          = 'connected',
    connected_at    = now(),
    expires_at      = excluded.expires_at,
    meta_user_id    = excluded.meta_user_id,
    scopes          = excluded.scopes,
    last_error      = null,
    updated_at      = now()
  returning mc.id into v_conn_id;

  return v_conn_id;
end;
$$;

revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from public;
revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from anon;
revoke execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) from authenticated;
grant execute on function public.conectar_meta(uuid, text, timestamptz, text, text[]) to service_role;


-- ------------------------------------------------------------
-- marcar_conexao_meta_quebrada(): o outro lado do ciclo.
--
-- Chamada por quem descobrir que o token morreu — o app OU o N8N, que
-- normalmente descobre primeiro, porque é ele que usa o token de
-- madrugada. Marca a conexão e todas as contas de anúncio do negócio,
-- para a faixa de reconexão aparecer na interface.
--
-- Não apaga o segredo do Vault: apagar na hora atrapalha o diagnóstico
-- ("o token estava lá quando parou?"). A limpeza é rotina separada.
-- ------------------------------------------------------------
create function public.marcar_conexao_meta_quebrada(
  p_business_id uuid,
  p_status      text,
  p_erro        text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('expired', 'revoked') then
    raise exception 'status invalido: %', p_status;
  end if;

  update public.meta_connections
     set status = p_status, last_error = p_erro, updated_at = now()
   where business_id = p_business_id;

  update public.ad_accounts
     set status = p_status, updated_at = now()
   where business_id = p_business_id;
end;
$$;

revoke execute on function public.marcar_conexao_meta_quebrada(uuid, text, text) from public;
revoke execute on function public.marcar_conexao_meta_quebrada(uuid, text, text) from anon;
revoke execute on function public.marcar_conexao_meta_quebrada(uuid, text, text) from authenticated;
grant execute on function public.marcar_conexao_meta_quebrada(uuid, text, text) to service_role;
