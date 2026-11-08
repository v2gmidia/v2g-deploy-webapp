begin read only;
do $verify$ declare r record; parent_oid oid;
begin
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
end; $verify$;
commit;

