-- Somente leitura. NÃO executado contra QA/produção por este pacote.
-- Confirmar projeto/conexão FORA do SQL; current_database() não distingue projetos Supabase.
begin read only;
select current_database() as banco, current_user as papel, version() as postgres;
select to_regclass('supabase_migrations.schema_migrations') as ledger,
  to_regclass('public.creative_review_requests') as fila,
  to_regclass('public.manager_accounts') as carteira,
  to_regclass('public.businesses') as negocios,
  to_regclass('public.profiles') as perfis;

-- Se o ledger não existe/é inacessível, a consulta seguinte falha: PARAR e reconciliar.
select version, name from supabase_migrations.schema_migrations
where version in ('20261009034500','20261009042000','20261021032617')
  or name in ('fila_revisao_criativos','gestor_responsaveis_tarefas','creative_review_upload_intent',
    'qa_fila_revisao_criativos','qa_gestor_responsaveis_tarefas','qa_creative_review_upload_intent')
order by version;
-- O QA registra versões próprias para a aplicação individual. Comparar também
-- definição/ACL/policies abaixo; versão diferente não autoriza reaplicar DDL.

select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public' and (
  table_name='creative_review_requests'
  or (table_name='manager_accounts' and column_name in ('business_id','operator_profile_id'))
  or (table_name='businesses' and column_name in ('id','profile_id','dados_ficticios'))
  or (table_name='profiles' and column_name='id'))
order by table_name,ordinal_position;

select c.conname,pg_get_constraintdef(c.oid) as definicao
from pg_constraint c where c.conrelid='public.creative_review_requests'::regclass order by c.conname;
select relrowsecurity,relforcerowsecurity,relacl::text as grants
from pg_class where oid='public.creative_review_requests'::regclass;
select policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename='creative_review_requests' order by policyname;
select grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='creative_review_requests' order by grantee,privilege_type;
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='creative-review';
select count(*) as quantidade_fila from public.creative_review_requests;
rollback;
