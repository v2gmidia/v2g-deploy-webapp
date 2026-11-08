-- SOMENTE LEITURA. Um SELECT, uma linha JSON; canal execute_sql no QA explicito.
with overloads as (
 select n.nspname as schema,p.oid::regprocedure::text as signature,pg_get_function_identity_arguments(p.oid) as identity_arguments
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in ('public','private') and p.proname='marcar_conexao_meta_quebrada'
)
select jsonb_build_object(
 'protected_snapshot',(select jsonb_build_object(
 'relations', (select jsonb_agg(jsonb_build_object(
  'name',c.relname,'owner',c.relowner::regrole::text,'acl',c.relacl::text,
  'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'options',c.reloptions,
  'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'acl',a.attacl::text,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
    from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
  'constraints',(select jsonb_agg(k.conname||':'||pg_get_constraintdef(k.oid) order by k.conname) from pg_constraint k where k.conrelid=c.oid),
  'indexes',(select jsonb_agg(pg_get_indexdef(i.indexrelid) order by i.indexrelid::regclass::text) from pg_index i where i.indrelid=c.oid),
  'triggers',(select jsonb_agg(pg_get_triggerdef(t.oid)||':'||md5(pg_get_functiondef(t.tgfoid)) order by t.tgname) from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal),
  'policies',(select jsonb_agg(jsonb_build_object('name',p.polname,'cmd',p.polcmd,'permissive',p.polpermissive,'roles',p.polroles::text,'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname) from pg_policy p where p.polrelid=c.oid),
  'effective_acl',(select jsonb_agg(jsonb_build_object('role',role_name,'select',has_table_privilege(role_name,c.oid,'SELECT'),'write',has_table_privilege(role_name,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),'column_select',has_any_column_privilege(role_name,c.oid,'SELECT'),'column_write',has_any_column_privilege(role_name,c.oid,'INSERT,UPDATE,REFERENCES')) order by role_name) from unnest(array['anon','authenticated','service_role']) roles_snapshot(role_name))
 ) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
  and c.relname in ('meta_connections','ad_accounts','clientes','execucoes','criativos','campanhas_meta','metricas_diarias','respostas_do_dono','execucoes_de_rotina','perguntas_apresentadas','campanhas_criacao')),
 'defaults',(select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d),
 'ledger_metadata',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version,name) from supabase_migrations.schema_migrations)
)),
 'target_function',(select jsonb_build_object(
 'signature',p.oid::regprocedure::text,'identity',pg_get_function_identity_arguments(p.oid),
 'return',p.prorettype::regtype::text,'owner',p.proowner::regrole::text,'language',l.lanname,
 'definer',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'leakproof',p.proleakproof,'returns_set',p.proretset,'acl',p.proacl::text,'config',p.proconfig,
 'body_md5',md5(p.prosrc),'comment',obj_description(p.oid,'pg_proc'),
 'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),
 'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
 'auth_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
 'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE')
) from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
where n.nspname='public' and p.oid=to_regprocedure('public.marcar_conexao_meta_quebrada(uuid,text,text)')),
 'target_overload_count',(select count(*)::int from overloads),
 'target_overloads',(select coalesce(jsonb_agg(to_jsonb(o) order by schema,signature),'[]'::jsonb) from overloads o)
) as receipt;
