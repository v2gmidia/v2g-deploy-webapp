-- PREPARADO, NAO AUTORIZADO PARA EXECUCAO REMOTA.
-- Canal DDL: apply_migration, project_id=zskpijnqgkqwxksqmzmf, apos backup/revisao.
-- O SQL nao autentica project_id: ver README. Sem RPC de negocio ou alteracao de linhas.
do $unit$
declare before_state jsonb; after_state jsonb; r record; parent_oid oid;
begin
 perform set_config('lock_timeout','3s',true);
 if current_user<>'postgres' then raise exception 'U1: papel executor inesperado'; end if;
 perform pg_advisory_xact_lock(7261107,1);
 lock table public.meta_connections,public.ad_accounts in access share mode;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname='marcar_conexao_meta_quebrada')
 then raise exception 'U1: funcao ja existe; conferir catalogo, nao repetir'; end if;
 for r in select * from (values
 ('ad_accounts','9d25f70426dd17f4cca36273399b5218','845226cd32fa9dbac26a7f9f10b68943','32ef2177914bae8c8022270246bb5000'),
 ('meta_connections','05403a4481df0f523a356cc6b8c5c0a7','68c03adaac87eb934f7aa331f5cb8e80','abfd872b81808d44f8cffeb05e1b5f99')
) v(name,constraints_md5,triggers_md5,policies_md5)
loop
 select c.oid into parent_oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname=r.name and c.relkind='r'
 and c.relowner::regrole::text='postgres' and c.relrowsecurity and not c.relforcerowsecurity;
 if parent_oid is null then raise exception 'U1: tabela-pai divergente %',r.name; end if;
 if (select md5(coalesce(string_agg(pg_get_constraintdef(k.oid),E'\n' order by k.conname),'')) from pg_constraint k where k.conrelid=parent_oid and k.contype<>'n')<>r.constraints_md5
 or (select md5(coalesce(string_agg(pg_get_triggerdef(t.oid),E'\n' order by t.tgname),'')) from pg_trigger t where t.tgrelid=parent_oid and not t.tgisinternal)<>r.triggers_md5
 or (select md5(coalesce(string_agg(p.polname||':'||p.polcmd::text||':'||coalesce(pg_get_expr(p.polqual,p.polrelid),'')||':'||coalesce(pg_get_expr(p.polwithcheck,p.polrelid),''),E'\n' order by p.polname),'')) from pg_policy p where p.polrelid=parent_oid)<>r.policies_md5
 then raise exception 'U1: fingerprint da tabela-pai divergente %',r.name; end if;
end loop;
for r in select * from (values
 ('ad_accounts','business_id','uuid',true),('ad_accounts','status','text',true),('ad_accounts','updated_at','timestamp with time zone',true),
 ('meta_connections','business_id','uuid',true),('meta_connections','status','text',true),('meta_connections','last_error','text',false),('meta_connections','updated_at','timestamp with time zone',true)
) v(tbl,col,typ,nn)
loop
 if not exists(select 1 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname=r.tbl and a.attname=r.col and a.attnum>0 and not a.attisdropped
 and format_type(a.atttypid,a.atttypmod)=r.typ and a.attnotnull=r.nn)
 then raise exception 'U1: coluna-pai divergente %.%',r.tbl,r.col; end if;
end loop;
 -- Nine backend tables: presence + RLS + zero policies + SELECT-only effective ACL.
if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
 and c.relname=any(array['clientes','execucoes','criativos','campanhas_meta','metricas_diarias','respostas_do_dono','execucoes_de_rotina','perguntas_apresentadas','campanhas_criacao']))<>9 then
 raise exception 'U1: backend incompleto'; end if;
for r in select c.* from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
 and c.relname=any(array['clientes','execucoes','criativos','campanhas_meta','metricas_diarias','respostas_do_dono','execucoes_de_rotina','perguntas_apresentadas','campanhas_criacao'])
loop
 if not r.relrowsecurity or exists(select 1 from pg_policy p where p.polrelid=r.oid)
  or not has_table_privilege('service_role',r.oid,'SELECT')
  or has_table_privilege('service_role',r.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  or has_any_column_privilege('service_role',r.oid,'INSERT,UPDATE,REFERENCES')
  or has_table_privilege('anon',r.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  or has_any_column_privilege('anon',r.oid,'SELECT,INSERT,UPDATE,REFERENCES')
  or has_table_privilege('authenticated',r.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  or has_any_column_privilege('authenticated',r.oid,'SELECT,INSERT,UPDATE,REFERENCES')
  or exists(select 1 from aclexplode(coalesce(r.relacl,acldefault('r',r.relowner))) a where a.grantee=0)
  or exists(select 1 from pg_attribute a cross join lateral aclexplode(a.attacl) x where a.attrelid=r.oid and x.grantee=0)
 then raise exception 'U1: protecao backend divergente em %',r.relname; end if;
end loop;

 before_state:=(select jsonb_build_object(
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
));
 execute $ddl$create function public.marcar_conexao_meta_quebrada(p_business_id uuid,p_status text,p_erro text)
 returns void language plpgsql security definer set search_path='' as $fn$
begin
  if p_status not in ('expired', 'revoked') then
    raise exception 'status invalido: %', p_status;
  end if;
  update public.meta_connections
     set status = p_status, last_error = p_erro, updated_at = now()
   where business_id = p_business_id;
  update public.ad_accounts
     set status = p_status, updated_at = now()
   where business_id = p_business_id;
end;
$fn$$ddl$;
 revoke all on function public.marcar_conexao_meta_quebrada(uuid,text,text) from public,anon,authenticated;
 grant execute on function public.marcar_conexao_meta_quebrada(uuid,text,text) to service_role;
 comment on function public.marcar_conexao_meta_quebrada(uuid,text,text) is 'V2G QA U1 reconciliacao 07-11-2026; additive-only';
 if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname='marcar_conexao_meta_quebrada')<>1
 or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
 where n.nspname='public' and p.proname='marcar_conexao_meta_quebrada'
 and pg_get_function_identity_arguments(p.oid)='p_business_id uuid, p_status text, p_erro text'
 and p.prorettype='void'::regtype and p.proowner::regrole::text='postgres' and l.lanname='plpgsql'
 and p.prosecdef and p.provolatile='v' and not p.proisstrict and p.proparallel='u' and not p.proleakproof and not p.proretset and p.prokind='f' and p.pronargdefaults=0 and p.provariadic=0 and p.proargmodes is null and p.proconfig=array['search_path=""']::text[]
 and p.prosrc=$expected$
begin
  if p_status not in ('expired', 'revoked') then
    raise exception 'status invalido: %', p_status;
  end if;
  update public.meta_connections
     set status = p_status, last_error = p_erro, updated_at = now()
   where business_id = p_business_id;
  update public.ad_accounts
     set status = p_status, updated_at = now()
   where business_id = p_business_id;
end;
$expected$
 and obj_description(p.oid,'pg_proc')='V2G QA U1 reconciliacao 07-11-2026; additive-only'
 and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('authenticated',p.oid,'EXECUTE')
 and has_function_privilege('service_role',p.oid,'EXECUTE')
 and not exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where (a.grantee not in (p.proowner, 'service_role'::regrole::oid)) or (a.grantee='service_role'::regrole::oid and a.is_grantable)))
 then raise exception 'U1: funcao/owner/corpo/ACL divergente'; end if;
 after_state:=(select jsonb_build_object(
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
));
 if before_state is distinct from after_state then raise exception 'U1: mudou catalogo protegido fora do delta'; end if;
end;
$unit$;

