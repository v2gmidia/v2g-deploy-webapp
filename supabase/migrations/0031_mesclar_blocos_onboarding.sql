-- Mescla somente as chaves do bloco enviado no JSON atual do banco.
-- Evita que uma aba antiga do bloco 1 substitua contas ou marca gravadas
-- por outra aba entre a leitura e a escrita.

create function public.mesclar_blocos_onboarding(
  p_business_id uuid,
  p_patch jsonb
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_chave text;
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

  update public.businesses
    set onboarding = coalesce(onboarding, '{}'::jsonb) || p_patch
    where id = p_business_id and profile_id = (select auth.uid());
  return found;
end;
$$;

revoke execute on function public.mesclar_blocos_onboarding(uuid,jsonb)
  from public, anon;
grant execute on function public.mesclar_blocos_onboarding(uuid,jsonb)
  to authenticated;
