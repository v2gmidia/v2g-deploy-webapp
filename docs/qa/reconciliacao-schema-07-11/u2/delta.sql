alter table public.campaigns add column publish_key uuid;

alter table public.campaigns add column publish_error text;

alter table public.campaigns add column publish_started_at timestamp with time zone;

alter table public.campaigns add column external_adset_id text;

alter table public.campaigns add column daily_budget_cents bigint;

alter table public.creatives add column external_image_hash text;

alter table public.ad_accounts add column min_daily_budget_cents bigint;

alter table public.ad_accounts add column min_budget_checked_at timestamp with time zone;

alter table public.businesses add column geo_lat numeric;

alter table public.businesses add column geo_lng numeric;

alter table public.businesses add column cadastro_erro text;

alter table public.businesses add column whatsapp_do_anuncio text;

alter table public.campaigns add column ativando_em timestamp with time zone;

alter table public.campaigns add constraint campaigns_publish_state_check check (publish_state in ('draft','publishing','published','failed','ativando','ativa','pausada'));

alter table public.creatives add constraint creatives_status_check check (status in ('draft','pending_review','approved','rejected','paused'));

alter table public.businesses add constraint businesses_cadastro_estado_check check (cadastro_estado in ('enviando','enviado','falhou'));

alter table public.meta_connections add constraint meta_connections_meta_user_id_nao_vazio check (meta_user_id is null or length(btrim(meta_user_id))>0);

alter table public.campaigns add constraint campaigns_ativacao_carimbada_check check ((ativada_em is null)=(ativada_por is null));

alter table public.campaigns add constraint campaigns_ativa_exige_carimbo_check check (publish_state<>'ativa' or (ativada_em is not null and ativada_por is not null));

alter table public.campaigns add constraint campaigns_pausa_carimbada_check check ((pausada_em is null)=(pausada_por is null));

alter table public.campaigns add constraint campaigns_pausada_exige_carimbo_check check (publish_state<>'pausada' or (pausada_em is not null and pausada_por is not null));

create table public.exclusoes_de_dados(codigo text primary key,meta_user_id text not null,business_ids uuid[] not null default '{}',solicitado_em timestamptz not null default now(),concluido_em timestamptz,o_que_foi_apagado jsonb not null default '{}'::jsonb,erro text);
alter table public.exclusoes_de_dados enable row level security;
revoke all on public.exclusoes_de_dados from public,anon,authenticated,service_role;
grant select on public.exclusoes_de_dados to service_role;
grant insert(codigo,meta_user_id) on public.exclusoes_de_dados to service_role;
grant update(concluido_em,o_que_foi_apagado,business_ids,erro) on public.exclusoes_de_dados to service_role;

create index campaigns_publishing_idx on public.campaigns(id) where publish_state='publishing';

create unique index campaigns_publish_key_idx on public.campaigns(publish_key) where publish_key is not null;

create index campaigns_ativando_idx on public.campaigns(id) where publish_state='ativando';

create index campaigns_esperando_ativacao_idx on public.campaigns(business_id,published_at desc) where publish_state in ('published','pausada');

create index businesses_cadastro_estado_idx on public.businesses(cadastro_estado,cadastro_iniciado_em) where cadastro_estado is not null;

create index exclusoes_de_dados_meta_user_id_idx on public.exclusoes_de_dados(meta_user_id);

create function public.desautorizar_meta(p_meta_user_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_n       integer := 0;
begin
  if p_meta_user_id is null or length(btrim(p_meta_user_id)) = 0 then
    raise exception 'meta_user_id vazio';
  end if;

  for v_negocio in
    select business_id from public.meta_connections
     where meta_user_id = p_meta_user_id
  loop
    -- O segredo sai do Vault. Aqui, diferente da
    -- `marcar_conexao_meta_quebrada`, apagar é o certo: lá o token
    -- morreu sozinho e guardá-lo ajuda o diagnóstico; aqui a pessoa
    -- retirou a autorização, e manter a credencial dela seria guardar
    -- acesso que ela acabou de tirar.
    delete from vault.secrets where name = 'meta_token_' || v_negocio::text;

    update public.meta_connections
       set token_secret_id = null,
           status          = 'revoked',
           last_error      = 'desautorizado_pelo_usuario',
           updated_at      = now()
     where business_id = v_negocio;

    update public.ad_accounts
       set status = 'revoked', updated_at = now()
     where business_id = v_negocio;

    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

create function public.apagar_dados_da_meta(p_meta_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio    uuid;
  v_negocios   uuid[] := '{}';
  v_segredos   integer := 0;
  v_conexoes   integer := 0;
  v_contas     integer := 0;
  v_metricas   integer := 0;
  v_campanhas  integer := 0;
  v_criativos  integer := 0;
  v_n          integer;
begin
  if p_meta_user_id is null or length(btrim(p_meta_user_id)) = 0 then
    raise exception 'meta_user_id vazio';
  end if;

  for v_negocio in
    select business_id from public.meta_connections
     where meta_user_id = p_meta_user_id
  loop
    v_negocios := v_negocios || v_negocio;

    with apagados as (
      delete from vault.secrets
       where name = 'meta_token_' || v_negocio::text
      returning 1
    )
    select count(*) into v_n from apagados;
    v_segredos := v_segredos + v_n;

    with apagados as (
      delete from public.metrics_daily where business_id = v_negocio returning 1
    )
    select count(*) into v_n from apagados;
    v_metricas := v_metricas + v_n;

    with apagados as (
      delete from public.ad_accounts where business_id = v_negocio returning 1
    )
    select count(*) into v_n from apagados;
    v_contas := v_contas + v_n;

    -- Só as COLUNAS da Meta. A linha é nossa: nome, objetivo e a
    -- estrutura que o pipeline montou não vieram de lá.
    with mexidos as (
      update public.campaigns
         set external_campaign_id = null, meta_status = null, updated_at = now()
       where business_id = v_negocio
         and (external_campaign_id is not null or meta_status is not null)
      returning 1
    )
    select count(*) into v_n from mexidos;
    v_campanhas := v_campanhas + v_n;

    -- Idem: `copy`, `storage_path` e `vision_description` são nossos e
    -- do cliente, e continuam onde estão.
    with mexidos as (
      update public.creatives
         set external_adset_id = null, external_creative_id = null,
             external_ad_id = null, meta_status = null, updated_at = now()
       where business_id = v_negocio
         and (external_adset_id is not null or external_creative_id is not null
              or external_ad_id is not null or meta_status is not null)
      returning 1
    )
    select count(*) into v_n from mexidos;
    v_criativos := v_criativos + v_n;

    with apagados as (
      delete from public.meta_connections where business_id = v_negocio returning 1
    )
    select count(*) into v_n from apagados;
    v_conexoes := v_conexoes + v_n;
  end loop;

  return jsonb_build_object(
    'negocios',   v_negocios,
    'segredos',   v_segredos,
    'conexoes',   v_conexoes,
    'contas',     v_contas,
    'metricas',   v_metricas,
    'campanhas',  v_campanhas,
    'criativos',  v_criativos
  );
end;
$$;

create function public.status_da_exclusao(p_codigo text)
returns table(solicitado_em timestamptz,concluido_em timestamptz,o_que_foi_apagado jsonb,teve_erro boolean)
language sql security definer set search_path='' as $public_status$
 select e.solicitado_em,e.concluido_em,
  (select coalesce(jsonb_strip_nulls(jsonb_object_agg(k,
    case when jsonb_typeof(e.o_que_foi_apagado->k)='number'
      and (e.o_que_foi_apagado->k)::text ~ '^[0-9]{1,10}$'
     then case when ((e.o_que_foi_apagado->k)::text)::bigint<=2147483647
      then e.o_que_foi_apagado->k else 'null'::jsonb end
     else 'null'::jsonb end)), '{}'::jsonb)
   from unnest(array['conexoes','segredos','contas','metricas','campanhas','criativos']) k),
  e.erro is not null
 from public.exclusoes_de_dados e where e.codigo=p_codigo;
$public_status$;

revoke all on function public.desautorizar_meta(text) from public,anon,authenticated,service_role;

revoke all on function public.apagar_dados_da_meta(text) from public,anon,authenticated,service_role;

revoke all on function public.status_da_exclusao(text) from public,anon,authenticated,service_role;

grant execute on function public.desautorizar_meta(text),public.apagar_dados_da_meta(text) to service_role;

grant execute on function public.status_da_exclusao(text) to anon,authenticated,service_role;
