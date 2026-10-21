-- MODELO para revisão humana, NÃO executar sem autorização de limpeza específica.
-- Parâmetros psql: review_id, business_id, actor_id, sha256. Somente um request do manifesto QA.
-- Não remove bucket, Storage, usuário, negócio ou tarefa. Termina em ROLLBACK.
begin;
select id,business_id,submitted_by,file_path,sha256,status
from public.creative_review_requests
where id=:'review_id'::uuid and business_id=:'business_id'::uuid
  and submitted_by=:'actor_id'::uuid and sha256=:'sha256'
  and original_name like 'E28-QA-%'
for update;

-- A tabela temporária exige um único alvo verificável antes de remover a linha.
create temporary table alvo_envio_qa on commit drop as
select r.id from public.creative_review_requests r
join public.businesses b on b.id=r.business_id
where r.id=:'review_id'::uuid and r.business_id=:'business_id'::uuid
  and r.submitted_by=:'actor_id'::uuid and r.sha256=:'sha256'
  and r.file_path=r.business_id::text||'/'||r.id::text
  and r.original_name like 'E28-QA-%' and b.dados_ficticios=true;
do $$ begin
  if (select count(*) from alvo_envio_qa) <> 1 then
    raise exception 'alvo_qa_divergente';
  end if;
end $$;
delete from public.creative_review_requests r using alvo_envio_qa a where r.id=a.id returning r.id;
rollback;
