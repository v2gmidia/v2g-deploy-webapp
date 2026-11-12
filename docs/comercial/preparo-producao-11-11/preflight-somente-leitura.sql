begin transaction read only;
select jsonb_build_object(
'observed_at',current_timestamp,'database',current_database(),'read_only',current_setting('transaction_read_only'),
'tables',(select jsonb_agg(jsonb_build_object('name',v.name,'present',c.oid is not null,'rls',c.relrowsecurity,
'columns',(select jsonb_agg(a.attname order by a.attnum) from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
'grants',(select jsonb_agg(jsonb_build_object('role',r.name,'privilege',priv.name,'allowed',pg_catalog.has_table_privilege(r.name,c.oid,priv.name))) from (values ('anon'),('authenticated'),('service_role')) r(name) cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) priv(name) where c.oid is not null),
'indexes',(select jsonb_agg(pg_catalog.pg_get_indexdef(i.indexrelid) order by i.indexrelid) from pg_catalog.pg_index i where i.indrelid=c.oid),
'constraints',(select jsonb_agg(jsonb_build_object('name',k.conname,'definition',pg_catalog.pg_get_constraintdef(k.oid)) order by k.conname) from pg_catalog.pg_constraint k where k.conrelid=c.oid)
) order by v.name)
from (values ('businesses'),('commercial_orders'),('commercial_order_units'),('commercial_events'),('commercial_payment_events'),('commercial_payment_email_outbox'),('checkout_3ds_context'),('checkout_security_attempts')) v(name)
left join pg_catalog.pg_namespace n on n.nspname='public'
left join pg_catalog.pg_class c on c.relnamespace=n.oid and c.relname=v.name and c.relkind='r'),
'functions',(select jsonb_agg(jsonb_build_object('name',v.signature,'present',p.oid is not null,'security_definer',p.prosecdef,'volatility',p.provolatile,'body_md5',md5(p.prosrc),'service_role_execute',pg_catalog.has_function_privilege('service_role',p.oid,'EXECUTE'),'anon_execute',pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated_execute',pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE')) order by v.signature)
from (values ('checkout_producao_schema_v1()'),('registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)'),('aprovar_pagamento_api_self_service(uuid,text,text,text,text,text,integer,date)'),('registrar_evento_financeiro_asaas(uuid,text,text,text,text,text,integer,date)'),('registrar_evento_inicial_3ds(uuid,text,text,text,text,integer,date)'),('reservar_assinatura_apos_3ds(uuid,date)'),('consumir_limite_checkout(text,text,text)'),('documento_contratante_valido(text)'),('evento_asaas_impede_confirmacao(text)')) v(signature)
left join pg_catalog.pg_proc p on p.oid=pg_catalog.to_regprocedure('public.'||v.signature))
) as metadata;
commit;
