-- A versão 0031 mesclava blocos no topo. Esta versão também mescla as
-- respostas individuais de um mesmo bloco, para duas abas não se apagarem.
create or replace function public.mesclar_blocos_onboarding(
  p_business_id uuid,
  p_patch jsonb
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_chave text;
  v_atual jsonb;
  v_proximo jsonb;
  v_respostas jsonb;
  v_contas jsonb;
begin
  if p_business_id is null or p_patch is null
      or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise exception 'patch de onboarding invalido';
  end if;
  for v_chave in select jsonb_object_keys(p_patch) loop
    if v_chave not in ('versao', 'passo', 'respostas', 'contas', 'marca', 'conclusao') then
      raise exception 'chave de onboarding nao permitida';
    end if;
  end loop;
  if (p_patch ? 'respostas' and jsonb_typeof(p_patch->'respostas') <> 'object')
      or (p_patch ? 'contas' and jsonb_typeof(p_patch->'contas') <> 'object')
      or (p_patch ? 'marca' and jsonb_typeof(p_patch->'marca') <> 'object')
      or (p_patch ? 'conclusao' and jsonb_typeof(p_patch->'conclusao') <> 'object') then
    raise exception 'bloco de onboarding invalido';
  end if;

  select onboarding into v_atual from public.businesses
    where id = p_business_id and profile_id = (select auth.uid()) for update;
  if not found then return false; end if;
  if jsonb_typeof(v_atual) <> 'object' then v_atual := '{}'::jsonb; end if;
  v_proximo := v_atual || (p_patch - 'respostas' - 'contas');

  if p_patch ? 'respostas' then
    v_respostas := case when jsonb_typeof(v_atual->'respostas') = 'object'
      then v_atual->'respostas' else '{}'::jsonb end;
    -- As chaves 2 e 4 não têm equivalente atual; permanecem como histórico.
    if v_respostas ? '0' and not v_respostas ? 'inicio' then
      v_respostas := jsonb_set(v_respostas, '{inicio}', v_respostas->'0');
    end if;
    if v_respostas ? '1' and not v_respostas ? 'ramo' then
      v_respostas := jsonb_set(v_respostas, '{ramo}', v_respostas->'1');
    end if;
    if v_respostas ? '3' and not v_respostas ? 'praca' then
      v_respostas := jsonb_set(v_respostas, '{praca}', v_respostas->'3');
    end if;
    v_respostas := (v_respostas - '0' - '1' - '3') || (p_patch->'respostas');
    v_proximo := jsonb_set(v_proximo, '{respostas}', v_respostas);
  end if;
  if p_patch ? 'contas' then
    v_contas := case when jsonb_typeof(v_atual->'contas') = 'object'
      then v_atual->'contas' else '{}'::jsonb end;
    v_proximo := jsonb_set(v_proximo, '{contas}', v_contas || p_patch->'contas');
  end if;

  update public.businesses set onboarding = v_proximo
    where id = p_business_id and profile_id = (select auth.uid());
  return found;
end;
$$;

revoke execute on function public.mesclar_blocos_onboarding(uuid,jsonb)
  from public, anon;
grant execute on function public.mesclar_blocos_onboarding(uuid,jsonb)
  to authenticated;
