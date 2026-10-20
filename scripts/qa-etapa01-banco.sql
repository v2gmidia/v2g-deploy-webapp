-- Executar SOMENTE no QA zskpijnqgkqwxksqmzmf. Todos os dados sao revertidos.
begin;
do $$
declare
  v_result jsonb;
  v_lead bigint;
  v_order uuid;
  v_repeat uuid;
  v_actor uuid;
  v_blocked boolean;
  v_i integer;
  v_ip text := md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
  v_contact text := md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
begin
  if not exists (select 1 from pg_class where oid='public.leads_lp'::regclass and relrowsecurity)
    or not exists (select 1 from pg_class where oid='public.checkout_security_attempts'::regclass and relrowsecurity) then
    raise exception 'RLS ausente';
  end if;
  if has_table_privilege('anon','public.leads_lp','SELECT')
    or has_table_privilege('authenticated','public.leads_lp','SELECT')
    or has_table_privilege('anon','public.checkout_security_attempts','INSERT')
    or has_table_privilege('authenticated','public.checkout_security_attempts','SELECT')
    or has_function_privilege('anon','public.consumir_limite_checkout(text,text,text)','EXECUTE')
    or has_function_privilege('authenticated','public.registrar_pedido_pix_assistido_com_lead(text,bigint,text,text,text,text,integer,text,uuid)','EXECUTE') then
    raise exception 'Permissao publica indevida';
  end if;
  select id into strict v_actor from public.profiles order by created_at limit 1;
  set local role anon;
  v_result := public.inserir_lead_lp(
    'QA Etapa 01 Ficticio','11999990001','qa-etapa01@example.invalid',
    'QA Etapa 01 Ficticia','servicos_locais',null,'qa_etapa01','dono',
    true,false,null,null,'Consentimento ficticio para ensaio controlado de QA.',
    'qa-origem','qa-meio','qa-campanha','qa-conteudo','https://qa.invalid/lp',
    v_ip,'00000000000191');
  reset role;
  if v_result->>'ok' <> 'true' then raise exception 'LP recusou fixture: %',v_result; end if;
  select id into strict v_lead from public.leads_lp where ip_hash=v_ip;
  set local role service_role;
  v_order := public.registrar_pedido_pix_assistido_com_lead(
    gen_random_uuid()::text,v_lead,' QA-ETAPA01@EXAMPLE.INVALID ',
    '(11) 99999-0001','QA Etapa 01 Ficticia','00000000000191',2,'monthly',v_actor);
  v_repeat := public.registrar_pedido_pix_assistido_com_lead(
    gen_random_uuid()::text,v_lead,'qa-etapa01@example.invalid',
    '11999990001','QA Etapa 01 Ficticia','00000000000191',2,'monthly',v_actor);
  if v_repeat is distinct from v_order then raise exception 'Reenvio duplicou pedido'; end if;
  if not exists(select 1 from public.commercial_orders where id=v_order
    and source_system='v2g_site' and source_lead_id=v_lead
    and source_lead_origin='https://qa.invalid/lp' and source_lead_utm_source='qa-origem'
    and source_lead_utm_medium='qa-meio' and source_lead_utm_campaign='qa-campanha'
    and source_lead_utm_content='qa-conteudo' and source_lead_consent_at is not null
    and source_lead_consent_text='Consentimento ficticio para ensaio controlado de QA.'
    and source_lead_linked_at is not null and total_cents=100000
    and status='awaiting_payment' and payment_approved_at is null and buyer_profile_id is null) then
    raise exception 'Origem, consentimento, valor ou portao de acesso incorreto';
  end if;
  if (select count(*) from public.commercial_order_units where order_id=v_order) <> 2
    or (select count(*) from public.commercial_events where order_id=v_order
      and event_type='lead_convertido_em_pedido' and actor_profile_id=v_actor) <> 1 then
    raise exception 'Unidades ou evento duplicados';
  end if;
  foreach v_i in array array[1,2,3,4] loop
    v_blocked := false;
    begin
      perform public.registrar_pedido_pix_assistido_com_lead(gen_random_uuid()::text,v_lead,
        case when v_i=1 then 'outro@example.invalid' else 'qa-etapa01@example.invalid' end,
        case when v_i=2 then '11999990002' else '11999990001' end,'QA Etapa 01 Ficticia',
        case when v_i=3 then '00000000000272' else '00000000000191' end,
        case when v_i=4 then 3 else 2 end,'monthly',v_actor);
    exception when raise_exception then
      if sqlerrm not in ('lead_e_pedido_divergem','lead_ja_convertido_com_dados_divergentes') then raise; end if;
      v_blocked := true;
    end;
    if not v_blocked then raise exception 'Divergencia % aceita',v_i; end if;
  end loop;
  v_blocked := false;
  begin
    update public.commercial_orders set source_lead_id=null where id=v_order;
  exception when check_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception 'Constraint aceitou origem incompleta'; end if;
  for v_i in 1..3 loop
    if not public.consumir_limite_checkout('order',v_ip,v_contact) then raise exception 'Limite bloqueou cedo'; end if;
  end loop;
  if public.consumir_limite_checkout('order',repeat('a',64),v_contact) then
    raise exception 'Limite de contato pode ser contornado trocando IP';
  end if;
  for v_i in 1..2 loop
    if not public.consumir_limite_checkout('order',v_ip,md5(v_i::text)||md5(v_i::text)) then
      raise exception 'Limite por IP bloqueou cedo';
    end if;
  end loop;
  if public.consumir_limite_checkout('order',v_ip,repeat('b',64)) then
    raise exception 'Limite de IP pode ser contornado trocando contato';
  end if;
  for v_i in 1..5 loop
    if not public.consumir_limite_checkout('payment',v_ip,v_contact) then raise exception 'Pagamento bloqueado cedo'; end if;
  end loop;
  if public.consumir_limite_checkout('payment',repeat('c',64),v_contact) then
    raise exception 'Limite agregado de pagamento falhou';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: LP anon -> pedido service_role, snapshot, evento unico, idempotencia, quatro divergencias, constraints, RLS/grants e limites agregados. Dados revertidos.' as resultado;
