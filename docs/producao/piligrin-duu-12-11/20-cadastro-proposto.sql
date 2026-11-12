-- PROPOSTA LOCAL. Não aplicar neste bloco. Não cria acesso financeiro nem ligação Meta.
-- Antes: backup privado completo do escopo, conferência do projeto e aprovação nominal.
begin;
do $guard$
begin
  if current_setting('v2g.projeto_aprovado',true) is distinct from 'ushccxpoxjikzqnwhgfd'
     or current_setting('v2g.pacote_aprovado',true) is distinct from 'piligrin-duu-12-11-revisao-1'
  then raise exception 'destino_ou_pacote_nao_confirmado'; end if;
  if to_regclass('public.agency_advertisers') is null then raise exception 'estrutura_agencia_ausente'; end if;
  if not exists(select 1 from auth.users where id='6ef1a6d0-ae43-4dd7-8b10-769aa0467777'
    and lower(btrim(email))='victorcabralns@piligrin.com.br' and email_confirmed_at is not null)
  then raise exception 'titular_nao_confirmado'; end if;
end $guard$;

create temporary table v2g_antes on commit drop as select id,to_jsonb(b) as linha from public.businesses b;
create temporary table v2g_pedido_antes on commit drop as select count(*) as quantidade from public.commercial_orders;
-- O executor recebe JSON canônico do manifesto aprovado pela sessão, nunca SQL concatenado.
create temporary table v2g_payload on commit drop as
  select current_setting('v2g.dados_aprovados',true)::jsonb as dados;

do $dados$
declare p jsonb; raiz public.businesses%rowtype; filho public.businesses%rowtype;
  vinculo public.agency_advertisers%rowtype;
begin
  select dados into p from v2g_payload;
  if p is null or p->>'titularProducao' is distinct from '6ef1a6d0-ae43-4dd7-8b10-769aa0467777'
    or p->>'agenciaProducao' is distinct from '54df1a9b-f1ca-444a-8282-67cf7301a257'
    or p->>'anuncianteProposto' is distinct from '8b916e82-11dc-47ce-a5ac-988b44d83344'
    or p->>'name' is distinct from 'Dúú Gomes' or p->>'monthly_budget' is distinct from '3000'
    or p->'onboarding'->>'versao' is distinct from '2'
  then raise exception 'payload_divergente'; end if;
  select * into raiz from public.businesses where id=(p->>'agenciaProducao')::uuid for update;
  if not found or raiz.profile_id is distinct from (p->>'titularProducao')::uuid
    or raiz.name not in ('Meu negócio','Piligrin') or raiz.onboarding<>'{}'::jsonb
    or raiz.monthly_budget is not null
  then raise exception 'raiz_alterada_preservar_e_revisar'; end if;
  if raiz.name='Meu negócio' then update public.businesses set name='Piligrin' where id=raiz.id; end if;
  select * into filho from public.businesses where id=(p->>'anuncianteProposto')::uuid for update;
  if found then
    if filho.profile_id is distinct from raiz.profile_id or filho.name is distinct from p->>'name'
      or filho.onboarding is distinct from p->'onboarding'
      or filho.monthly_budget is distinct from 3000::numeric
      or filho.description is distinct from p->>'description'
    then raise exception 'anunciante_existente_divergente_preservado'; end if;
  else
    insert into public.businesses(id,profile_id,name,description,monthly_budget,site_url,instagram_handle,onboarding,procedencia)
    values((p->>'anuncianteProposto')::uuid,raiz.profile_id,p->>'name',p->>'description',3000,null,
      p->>'instagram_handle',p->'onboarding',jsonb_build_object('promocao_agencia',p->'origem'));
  end if;
  select * into vinculo from public.agency_advertisers where advertiser_business_id=(p->>'anuncianteProposto')::uuid for update;
  if found then
    if vinculo.agency_business_id<>raiz.id or vinculo.owner_profile_id<>raiz.profile_id
      or vinculo.advertiser_name<>'Dúú Gomes' or vinculo.reference_key<>'piligrin-duu-producao'
      or vinculo.legacy_shared_business or vinculo.revoked_at is not null
    then raise exception 'vinculo_divergente_preservado'; end if;
  else
    insert into public.agency_advertisers(agency_business_id,advertiser_business_id,owner_profile_id,
      advertiser_name,reference_key,legacy_shared_business,source)
    values(raiz.id,(p->>'anuncianteProposto')::uuid,raiz.profile_id,'Dúú Gomes','piligrin-duu-producao',false,
      'Pacote revisado Piligrin/Dúú de 12/11; cadastro operacional selecionado da QA, sem importar permissões.');
  end if;
  if exists(select 1 from v2g_antes a left join public.businesses b on b.id=a.id
    where a.id<>raiz.id and a.linha is distinct from to_jsonb(b))
    or exists(select 1 from v2g_antes a join public.businesses b on b.id=a.id where a.id=raiz.id
      and (a.linha-array['name','updated_at']) is distinct from (to_jsonb(b)-array['name','updated_at']))
    or (select count(*) from public.commercial_orders)<>(select quantidade from v2g_pedido_antes)
  then raise exception 'preservacao_reprovada'; end if;
end $dados$;
commit;
