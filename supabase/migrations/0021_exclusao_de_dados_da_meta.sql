-- ============================================================
-- V2G — os dois callbacks obrigatórios do app da Meta
--
-- A Meta não publica app sem duas URLs: desautorização e solicitação de
-- exclusão de dados. Sem app publicado não dá para atuar em conta de
-- cliente. Esta migration é o que faz esses dois endpoints APAGAREM
-- alguma coisa, em vez de devolverem 200.
--
-- ============================================================
-- ESCOPO ESTRITO, E ISSO É DECISÃO DE PRODUTO (Victor, 04/09/2026).
--
-- Apaga o que veio DA META. **Não apaga a conta.**
--
-- O `signed_request` prova que quem pediu é o mesmo usuário do Meta —
-- não prova que ele quer perder a conta que paga. Apagar tudo por um
-- clique dentro do Facebook, sem confirmação e sem desfazer, é
-- destrutivo demais para uma ação que a pessoa pode ter feito sem
-- entender. A página de status diz o que saiu, o que ficou, e como pedir
-- o resto.
-- ============================================================
--
-- ============================================================
-- DESAUTORIZAR ≠ EXCLUIR. São duas funções, e de propósito.
--
-- Desautorizar é "tirei o app do meu Facebook": some o acesso, ficam os
-- dados. Excluir é "apaga o que você pegou de lá". Tratar as duas como a
-- mesma coisa destruiria o histórico de um cliente ativo porque ele
-- mexeu numa configuração.
-- ============================================================
-- ============================================================


-- ------------------------------------------------------------
-- 1. `meta_user_id` NUNCA pode ser string vazia.
--
-- É a chave pela qual o callback de exclusão acha o que apagar. Vazio
-- casa com todos os outros vazios: o pedido de uma pessoa varreria a
-- conexão de todas as que também vieram sem id.
--
-- A primeira camada é o app — `TokenSemDono` em `lib/meta/oauth.ts`
-- recusa a conexão antes de chegar aqui. Esta é a segunda, e é a que não
-- depende de o outro lado estar certo.
--
-- `null` continua permitido: são as linhas anteriores à 0005, e barrá-las
-- exigiria backfill de dado que não existe. O que se barra é o `''`, que
-- é o valor que MENTE — parece preenchido e não identifica ninguém.
--
-- Medido antes de escrever: 1 linha, `meta_user_id` preenchido, zero
-- vazias. A constraint entra sem backfill.
-- ------------------------------------------------------------
alter table public.meta_connections
  add constraint meta_connections_meta_user_id_nao_vazio
  check (meta_user_id is null or length(btrim(meta_user_id)) > 0);


-- ------------------------------------------------------------
-- 2. O REGISTRO DA SOLICITAÇÃO
--
-- A Meta exige devolver um código de confirmação e uma URL onde o estado
-- do pedido possa ser consultado. Sem esta tabela o código não significa
-- nada — e código que ninguém consegue verificar é conformidade
-- declarada, não conformidade. Ver `docs/exclusao-de-dados-meta.md`.
--
-- `o_que_foi_apagado` guarda a CONTAGEM por categoria, nunca o dado. Ela
-- é a prova de que o endpoint fez algo, e é o que a página de status
-- mostra em português.
-- ------------------------------------------------------------
create table public.exclusoes_de_dados (
  codigo         text primary key,
  meta_user_id   text not null,
  -- Quais negócios foram alcançados. Fica como registro do pedido mesmo
  -- depois de a conexão sumir — sem isto, "o que este código apagou?"
  -- não teria resposta cinco minutos depois.
  business_ids   uuid[] not null default '{}',
  solicitado_em  timestamptz not null default now(),
  concluido_em   timestamptz,
  o_que_foi_apagado jsonb not null default '{}'::jsonb,
  erro           text
);

create index exclusoes_de_dados_meta_user_id_idx
  on public.exclusoes_de_dados (meta_user_id);

alter table public.exclusoes_de_dados enable row level security;

-- SEM POLICY NENHUMA, e é a escolha certa: RLS ligada sem policy nega
-- tudo para `anon` e `authenticated`. Quem escreve é `service_role` (o
-- callback roda sem sessão); quem lê o estado é a função da §5, que
-- devolve só o que pode ser público.
revoke all on public.exclusoes_de_dados from anon, authenticated;


-- ------------------------------------------------------------
-- 3. DESAUTORIZAR — o acesso some, os dados ficam.
--
-- Trata N conexões de propósito. Um mesmo usuário do Meta pode ter mais
-- de um negócio conosco, e não há (nem deve haver) índice único em
-- `meta_user_id`. Um `maybeSingle` aqui deixaria de fora justamente o
-- segundo negócio da pessoa.
--
-- ESTA É A MESMA FUNÇÃO QUE O BOTÃO DA `/conta` VAI CHAMAR, quando ele
-- existir — por negócio em vez de por usuário do Meta. É o que impede o
-- estado da desautorização automática divergir do estado que a pessoa
-- cria à mão. Ver `docs/exclusao-de-dados-meta.md` §4.
-- ------------------------------------------------------------
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

revoke execute on function public.desautorizar_meta(text) from public, anon, authenticated;
grant execute on function public.desautorizar_meta(text) to service_role;


-- ------------------------------------------------------------
-- 4. EXCLUIR — o que veio da Meta sai, e só isso.
--
-- Devolve o que foi apagado, por categoria. O retorno é a prova: sem
-- ele, "apagou" seria afirmação de quem chamou, e o registro na
-- `exclusoes_de_dados` seria uma declaração sobre si mesma.
--
-- O QUE SAI, e cada linha foi medida no schema antes de entrar aqui:
--
--   vault.secrets  meta_token_<business_id>       o access token
--   meta_connections  a linha inteira             page/instagram/user id,
--                                                 scopes, expiração
--   ad_accounts    as linhas                      a lista veio da Graph API
--   metrics_daily  as linhas                      medição da Meta, toda
--   campaigns      external_campaign_id, meta_status   ids que a Meta deu
--   creatives      external_adset_id, external_creative_id,
--                  external_ad_id, meta_status
--
-- O QUE FICA, e é o que a página de status precisa dizer em voz alta:
-- `businesses` inteiro, entrevistas, narrativa, propostas, a identidade
-- visual e os arquivos no Storage, `offers`, `analysis_runs`,
-- `decisions`, o perfil e o login. Nada disso veio da Meta — o cliente
-- digitou ou subiu.
--
-- `campaigns.published_at` FICA de propósito: é o carimbo da nossa
-- própria ação, não um dado que a Meta nos deu. Apagá-lo deixaria
-- `status = 'published'` sem data, que é pior que a verdade.
-- ------------------------------------------------------------
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

revoke execute on function public.apagar_dados_da_meta(text) from public, anon, authenticated;
grant execute on function public.apagar_dados_da_meta(text) to service_role;


-- ------------------------------------------------------------
-- 5. O ESTADO DO PEDIDO, para a página pública.
--
-- A Meta exige uma URL consultável, e quem abre não tem sessão. Esta
-- função é o único caminho de leitura: devolve o estado e as contagens,
-- e **nunca** `meta_user_id` nem `business_ids`.
--
-- Isso importa: o código de confirmação viaja por e-mail e por tela do
-- Facebook. Se a página devolvesse o id do usuário do Meta, um código
-- vazado entregaria junto a identidade de quem pediu.
-- ------------------------------------------------------------
create function public.status_da_exclusao(p_codigo text)
returns table (
  solicitado_em     timestamptz,
  concluido_em      timestamptz,
  o_que_foi_apagado jsonb,
  teve_erro         boolean
)
language sql
security definer
set search_path = ''
as $$
  select e.solicitado_em, e.concluido_em, e.o_que_foi_apagado, e.erro is not null
    from public.exclusoes_de_dados e
   where e.codigo = p_codigo;
$$;

revoke execute on function public.status_da_exclusao(text) from public;
grant execute on function public.status_da_exclusao(text) to anon, authenticated, service_role;
