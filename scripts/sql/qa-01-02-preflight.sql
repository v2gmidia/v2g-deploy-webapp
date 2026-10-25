-- SOMENTE LEITURA. Executar com alvo explicitamente fixado em zskpijnqgkqwxksqmzmf.
-- Sem gravacao, lock de linhas, credenciais, payload bruto ou dados de cartao.
with required(signature,kind) as (values
  ('public.registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)','registrar'),
  ('public.registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date)','registrar'),
  ('public.registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)','inicial'),
  ('public.registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date)','inicial'),
  ('public.reservar_assinatura_apos_3ds(uuid,date)','reserva'),
  ('public.aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date)','comercial'),
  ('public.aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)','self_service')
), definitions as (
  select r.*,p.oid,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) as src
  from required r left join pg_proc p on p.oid=to_regprocedure(r.signature)
), checked as (
  select d.*,
    (select count(*) from regexp_matches(src,'e[.]event_type not in[[:space:]]*[(]''PAYMENT_CREATED'',[[:space:]]*''PAYMENT_UPDATED'',[[:space:]]*''PAYMENT_CONFIRMED'',[[:space:]]*''PAYMENT_RECEIVED''[)]','g')) as predicate_matches,
    regexp_replace(src,'e[.]event_type not in[[:space:]]*[(]''PAYMENT_CREATED'',[[:space:]]*''PAYMENT_UPDATED'',[[:space:]]*''PAYMENT_CONFIRMED'',[[:space:]]*''PAYMENT_RECEIVED''[)]','public.evento_asaas_impede_confirmacao(e.event_type)') as replaced
  from definitions d
)
select signature,oid is not null as exists,md5(src) as definition_md5,
  not prosecdef as security_invoker,proconfig as settings,
  case when kind in ('inicial','reserva','comercial') then predicate_matches=1 else true end as predicate_compatible,
  case when kind in ('registrar','inicial') then
    (select count(*) from regexp_matches(replaced,'''PAYMENT_CREATED''','g'))=1 else true end as whitelist_compatible,
  case when kind='inicial' then strpos(src,'if p_event_type = ''PAYMENT_CONFIRMED'' and')>0 and strpos(src,'p_event_id,''PAYMENT_CONFIRMED''')>0
    when kind='reserva' then strpos(src,'e.event_type = ''PAYMENT_CONFIRMED''')>0
    when kind='self_service' then strpos(src,'  select order_id into v_event_order from public.commercial_events')>0
    else true end as body_compatible,
  case when oid is not null then has_function_privilege('anon',oid,'EXECUTE') else null end as anon_execute,
  case when oid is not null then has_function_privilege('authenticated',oid,'EXECUTE') else null end as authenticated_execute,
  case when oid is not null then has_function_privilege('service_role',oid,'EXECUTE') else null end as service_execute
from checked order by signature;
