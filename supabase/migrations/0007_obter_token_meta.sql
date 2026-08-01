-- ============================================================
-- V2G — leitura do token do Meta a partir da referência
--
-- Único caminho de leitura do segredo. Usada por dois consumidores:
--   * o app, para listar as contas de anúncio na tela de escolha;
--   * o N8N, para operar as campanhas (ver docs/n8n-repontamento.md §6).
--
-- `EXECUTE` só para `service_role`. Uma função que devolve token em
-- texto exposta a `authenticated` seria PIOR que a coluna original que
-- esta arquitetura veio substituir — porque pareceria segura.
--
-- A função devolve `null` (não erro) quando não há conexão ou quando o
-- status indica token morto. Quem chama trata `null` como "precisa
-- reconectar", que é a única resposta útil: o Meta não devolve token
-- novo sem o usuário reautorizar no navegador.
-- ============================================================

create function public.obter_token_meta(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_status    text;
  v_token     text;
begin
  select mc.token_secret_id, mc.status
    into v_secret_id, v_status
  from public.meta_connections mc
  where mc.business_id = p_business_id;

  if v_secret_id is null then
    return null;
  end if;

  -- `expiring` ainda funciona: é só o aviso de que faltam menos de 7
  -- dias. `expired` e `revoked` não — devolver token morto faria o
  -- chamador queimar uma chamada no Meta para descobrir o óbvio.
  if v_status not in ('connected', 'expiring') then
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
