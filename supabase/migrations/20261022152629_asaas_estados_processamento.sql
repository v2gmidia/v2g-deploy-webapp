-- LOCAL: aplicar individualmente no QA somente apos backup, revisao e autorizacao.
-- Nao chama Asaas, nao habilita flags, nao altera titularidade ou revoga acesso.
begin;

create function public.evento_asaas_impede_confirmacao(p_event_type text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(p_event_type not in (
    'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
    'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED'
  ), true)
$$;
revoke all on function public.evento_asaas_impede_confirmacao(text) from public,anon,authenticated;
grant execute on function public.evento_asaas_impede_confirmacao(text) to service_role;

alter table public.commercial_payment_events
  drop constraint commercial_payment_events_event_type_check,
  add constraint commercial_payment_events_event_type_check check (event_type in (
    'PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED','PAYMENT_RECEIVED',
    'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS',
    'PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED',
    'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED','PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED',
    'PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUNDED',
    'PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  ));

-- Ajustes cirurgicos nas RPCs ja instaladas: preservam identidade, locks, validacao
-- de origem/IDs e ACL. Qualquer desvio nas precondicoes aborta TODA a migration.
-- Nao aplicar se houver versao externa divergente: comparar e reconciliar antes.
do $migration$
declare
  sig text; src text; novo text; trecho text;
  predicado constant text := 'e[.]event_type not in[[:space:]]*[(]''PAYMENT_CREATED'',[[:space:]]*''PAYMENT_UPDATED'',[[:space:]]*''PAYMENT_CONFIRMED'',[[:space:]]*''PAYMENT_RECEIVED''[)]';
begin
  foreach sig in array array[
    'public.registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)',
    'public.registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date)',
    'public.registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
    'public.registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date)',
    'public.reservar_assinatura_apos_3ds(uuid,date)',
    'public.aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date)',
    'public.aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)'
  ] loop
    if to_regprocedure(sig) is null then raise exception 'dependencia ausente: %', sig; end if;
    select pg_get_functiondef(to_regprocedure(sig)) into src;
    novo := src;
    if sig like '%inicial_3ds%' or sig like '%reservar_assinatura%' or sig like '%api_comercial%' then
      if (select count(*) from regexp_matches(src,predicado,'g')) <> 1 then
        raise exception 'predicado divergente: %',sig;
      end if;
      novo := regexp_replace(novo,predicado,'public.evento_asaas_impede_confirmacao(e.event_type)');
    end if;
    if sig like '%registrar_evento%' then
      -- Depois de retirar o predicado, CREATED deve aparecer apenas na whitelist.
      if (select count(*) from regexp_matches(novo,'''PAYMENT_CREATED''','g')) <> 1 then
        raise exception 'whitelist divergente: %',sig;
      end if;
      novo := replace(novo,'''PAYMENT_CREATED''',
        '''PAYMENT_AWAITING_RISK_ANALYSIS'',''PAYMENT_APPROVED_BY_RISK_ANALYSIS'',''PAYMENT_REPROVED_BY_RISK_ANALYSIS'',''PAYMENT_AUTHORIZED'',''PAYMENT_CREATED''');
    end if;
    if sig like '%inicial_3ds%' then
      trecho := 'if p_event_type = ''PAYMENT_CONFIRMED'' and';
      if strpos(novo,trecho)=0 then raise exception 'aprovacao divergente: %',sig; end if;
      novo := replace(novo,trecho,'if p_event_type in (''PAYMENT_CONFIRMED'',''PAYMENT_RECEIVED'') and');
      trecho := 'p_event_id,''PAYMENT_CONFIRMED''';
      if strpos(novo,trecho)=0 then raise exception 'evento divergente: %',sig; end if;
      novo := replace(novo,trecho,'p_event_id,p_event_type');
    elsif sig like '%reservar_assinatura%' then
      trecho := 'e.event_type = ''PAYMENT_CONFIRMED''';
      if strpos(novo,trecho)=0 then raise exception 'reserva divergente: %',sig; end if;
      novo := replace(novo,trecho,'e.event_type in (''PAYMENT_CONFIRMED'',''PAYMENT_RECEIVED'')');
    elsif sig like '%api_self_service%' then
      trecho := '  select order_id into v_event_order from public.commercial_events';
      if strpos(novo,trecho)=0 then raise exception 'guarda divergente: %',sig; end if;
      novo := replace(novo,trecho,$guard$
  if exists(select 1 from public.commercial_payment_events e
      where e.order_id=p_order_id and e.provider_charge_id=p_charge_id
        and public.evento_asaas_impede_confirmacao(e.event_type)) then return false; end if;
  select order_id into v_event_order from public.commercial_events$guard$);
    end if;
    if novo=src then raise exception 'nenhum ajuste: %',sig; end if;
    execute novo;
  end loop;
end;
$migration$;

commit;
