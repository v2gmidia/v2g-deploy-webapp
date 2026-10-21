-- Leitura localmente preparada. Nao executada no QA neste bloco.
begin read only;
select current_database(), current_user;
select version,name from supabase_migrations.schema_migrations
where version in ('0026','0029','0030','0034','20261008223000','20261009015000',
  '20261011140000','20261018130000','20261018133000','20261020021942',
  '20261020023349','20261021033313') order by version;
select table_name,column_name,data_type from information_schema.columns
where table_schema='public' and (
  (table_name='commercial_orders' and column_name in ('id','source_system','source_lead_id',
    'provider_customer_id','provider_charge_id','provider_subscription_id','provider_first_due_date',
    'provider_card_flow','subscription_creation_started_at','provider_subscription_first_due_date'))
  or table_name in ('commercial_payment_email_outbox','checkout_3ds_context'))
order by table_name,ordinal_position;
select proname,pg_get_function_identity_arguments(oid) as assinatura
from pg_proc where pronamespace='public'::regnamespace and proname in (
  'registrar_pedido_pix_assistido_com_lead','registrar_evento_inicial_3ds',
  'reservar_assinatura_apos_3ds','registrar_evento_financeiro_asaas','aprovar_pagamento_api_self_service');
select 'orders' as entidade,count(*) as quantidade from public.commercial_orders
union all select 'events',count(*) from public.commercial_events
union all select 'payment_events',count(*) from public.commercial_payment_events;
rollback;
