-- LOCAL / REVISAVEL. Não aplicar sem backup e conciliação individual da cadeia.
-- NÃO cria as dependências faltantes, não habilita checkout nem escreve pedidos.
-- Dependências ordenadas no manifesto scripts/test-utils/checkout-schema.mjs e
-- docs/estado/n26-p1-compra-publica-local-05-11.md. Banco compartilhado com backend.
begin;

-- Grants explícitos que a execução pelo service_role requer, sem abrir acesso público.
-- Se uma tabela faltar, a transação inteira falha antes de qualquer publicação.
grant select, insert, update on public.commercial_orders to service_role;
grant select, insert, update on public.commercial_order_units to service_role;
grant select, insert on public.commercial_events to service_role;
grant select, insert on public.commercial_payment_events to service_role;
grant select, insert, update on public.commercial_payment_email_outbox to service_role;
grant select, insert, update, delete on public.checkout_3ds_context to service_role;
grant select, insert, delete on public.checkout_security_attempts to service_role;
grant select, insert, update on public.businesses to service_role;

-- Versão estrutural; NÃO certifica credenciais, conta Asaas, entrega ou pagamento.
create or replace function public.checkout_producao_schema_v1()
returns integer language plpgsql stable security invoker set search_path = '' as $$
declare
  t text;
  sig text;
  f oid;
begin
  foreach t in array array['businesses','commercial_orders','commercial_order_units',
    'commercial_events','commercial_payment_events','commercial_payment_email_outbox',
    'checkout_3ds_context','checkout_security_attempts'] loop
    if not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n
      on n.oid=c.relnamespace where n.nspname='public' and c.relname=t
      and c.relkind='r' and c.relrowsecurity) then return 0; end if;
    if not pg_catalog.has_table_privilege('service_role','public.'||t,'SELECT') then return 0; end if;
  end loop;
  foreach t in array array['commercial_payment_events','commercial_payment_email_outbox',
    'checkout_3ds_context','checkout_security_attempts'] loop
    if pg_catalog.has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE')
      or pg_catalog.has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE')
      then return 0; end if;
  end loop;
  -- Todas as colunas lidas/escritas pelas portas de compra/efeitos.
  if exists (
    select 1 from (values
      ('commercial_orders','external_ref'),('commercial_orders','business_id'),
      ('commercial_orders','buyer_email'),('commercial_orders','buyer_name'),
      ('commercial_orders','buyer_whatsapp'),('commercial_orders','legal_name'),
      ('commercial_orders','cnpj'),('commercial_orders','contractor_document_type'),
      ('commercial_orders','status'),('commercial_orders','origin'),
      ('commercial_orders','payment_method'),('commercial_orders','billing_period'),
      ('commercial_orders','unit_count'),('commercial_orders','total_cents'),
      ('commercial_orders','provider_checkout_id'),('commercial_orders','provider_checkout_url'),
      ('commercial_orders','checkout_creation_started_at'),('commercial_orders','payment_attempt_count'),
      ('commercial_orders','payment_creation_started_at'),('commercial_orders','provider_customer_id'),
      ('commercial_orders','provider_charge_id'),('commercial_orders','provider_subscription_id'),
      ('commercial_orders','provider_first_due_date'),('commercial_orders','provider_card_flow'),
      ('commercial_orders','subscription_creation_started_at'),('commercial_orders','provider_subscription_first_due_date'),
      ('commercial_payment_events','provider_event_id'),('commercial_payment_events','order_id'),
      ('commercial_payment_events','provider_charge_id'),('commercial_payment_events','provider_subscription_id'),
      ('commercial_payment_events','event_type'),('commercial_payment_events','amount_cents'),('commercial_payment_events','due_date'),
      ('commercial_payment_email_outbox','id'),('commercial_payment_email_outbox','order_id'),
      ('commercial_payment_email_outbox','provider_charge_id'),('commercial_payment_email_outbox','payload'),
      ('commercial_payment_email_outbox','status'),('commercial_payment_email_outbox','provider_message_id'),
      ('commercial_payment_email_outbox','updated_at'),
      ('checkout_3ds_context','order_id'),('checkout_3ds_context','payer_ip'),('checkout_3ds_context','expires_at')
    ) as required(table_name,column_name)
    where not exists (select 1 from pg_catalog.pg_attribute a
      join pg_catalog.pg_class c on c.oid=a.attrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=required.table_name
        and a.attname=required.column_name and a.attnum>0 and not a.attisdropped)
  ) then return 0; end if;
  foreach sig in array array[
    'registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)',
    'aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
    'reservar_assinatura_apos_3ds(uuid,date)',
    'consumir_limite_checkout(text,text,text)', 'documento_contratante_valido(text)',
    'evento_asaas_impede_confirmacao(text)'
  ] loop
    f := pg_catalog.to_regprocedure('public.'||sig);
    if f is null then return 0; end if;
    if pg_catalog.has_function_privilege('anon',f,'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated',f,'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role',f,'EXECUTE')
      or exists (select 1 from pg_catalog.pg_proc where oid=f and prosecdef)
      then return 0; end if;
  end loop;
  -- Exige também a revisão de risco/RECEIVED, não apenas os nomes das RPCs.
  foreach sig in array array[
    'aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)',
    'registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)',
    'reservar_assinatura_apos_3ds(uuid,date)'
  ] loop
    if not exists(select 1 from pg_catalog.pg_proc
      where oid=pg_catalog.to_regprocedure('public.'||sig)
        and pg_catalog.strpos(prosrc,'evento_asaas_impede_confirmacao')>0)
      then return 0; end if;
  end loop;
  if not public.evento_asaas_impede_confirmacao('PAYMENT_REFUNDED')
    or not public.evento_asaas_impede_confirmacao('PAYMENT_REPROVED_BY_RISK_ANALYSIS')
    or public.evento_asaas_impede_confirmacao('PAYMENT_AUTHORIZED') then return 0; end if;
  -- Unicidades são as barreiras para replay, referência e envio duplicado.
  if exists (select 1 from (values
    ('commercial_orders','external_ref'),
    ('commercial_orders','provider_charge_id'),('commercial_orders','provider_subscription_id'),
    ('commercial_events','source,external_event_id'),('commercial_order_units','order_id,ordinal'),
    ('commercial_payment_events','provider_event_id'),
    ('commercial_payment_email_outbox','order_id,provider_charge_id'),
    ('checkout_3ds_context','order_id')
  ) as required(table_name,columns) where not exists (
    select 1 from pg_catalog.pg_index i
      join pg_catalog.pg_class c on c.oid=i.indrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=required.table_name and i.indisunique
      and i.indisvalid and i.indpred is null and i.indexprs is null
      and (select pg_catalog.string_agg(a.attname,',' order by k.ord)
        from pg_catalog.unnest(i.indkey::smallint[]) with ordinality k(attnum,ord)
        join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum=k.attnum
        where k.ord<=i.indnkeyatts)=required.columns
  )) then return 0; end if;
  if not public.documento_contratante_valido('00000000191')
    or not public.documento_contratante_valido('11222333000181')
    or public.documento_contratante_valido('00000000192') then return 0; end if;
  return 1;
exception when undefined_table or undefined_function or insufficient_privilege then return 0;
end;
$$;
revoke all on function public.checkout_producao_schema_v1() from public,anon,authenticated;
grant execute on function public.checkout_producao_schema_v1() to service_role;

do $$ begin
  if public.checkout_producao_schema_v1() <> 1 then
    raise exception 'checkout_producao_precondicoes_ausentes_ou_divergentes';
  end if;
end $$;
comment on function public.checkout_producao_schema_v1() is
  'Gate estrutural v1 somente service_role. Sem homologacao externa ou leitura de pedidos. Zero se dependencias/ACL/RLS/unicidade divergirem.';
commit;
