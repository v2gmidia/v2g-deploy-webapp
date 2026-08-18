-- ============================================================
-- 0011 — Procedência para as três tabelas que a guardam
--
-- A 0010 criou coluna `procedencia` em `businesses`,
-- `identidade_visual` e `narrativa_negocio`, mas
-- `registrar_procedencia()` só sabia escrever em `businesses` — e é das
-- outras duas que vem a maior parte do que sai de uma transcrição
-- (`quem_somos`, `para_quem`, `tom_de_voz`). Achado registrado em
-- docs/extracao-perfil.md §7.
--
-- UMA função com lista branca, não três irmãs. Funções irmãs divergem:
-- uma ganha uma validação que a outra não ganha, e o bug aparece só na
-- tabela esquecida.
--
-- A assinatura antiga é REMOVIDA, não mantida como atalho. Não havia
-- nenhum chamador fora da própria 0010 — conferido antes. Deixar um
-- atalho de 5 argumentos que assume `businesses` seria criar hoje o
-- caminho que amanhã grava procedência na tabela errada por omissão.
-- ============================================================

drop function if exists public.registrar_procedencia(uuid, text, text, text, jsonb);
drop function if exists public.procedencia_do_campo(uuid, text);

create or replace function public.registrar_procedencia(
  p_tabela      text,
  p_business_id uuid,
  p_campo       text,
  p_origem      text,
  p_por         text,
  p_extra       jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entrada  jsonb;
  v_chave    text;
  v_afetadas int;
begin
  if p_origem not in ('confirmado', 'manual', 'extraido') then
    raise exception
      'origem invalida: %. Use confirmado (o cliente viu e disse que esta certo), manual (alguem da V2G anotou na conversa) ou extraido (o agente tirou da transcricao).',
      p_origem;
  end if;

  -- Lista branca E coluna de junção na mesma expressão. `businesses` é
  -- apontada por `id`; as outras duas por `business_id`. Separar as duas
  -- informações permitiria acrescentar uma tabela à lista e esquecer a
  -- chave.
  v_chave := case p_tabela
               when 'businesses'        then 'id'
               when 'identidade_visual' then 'business_id'
               when 'narrativa_negocio' then 'business_id'
             end;

  if v_chave is null then
    raise exception
      'tabela % nao guarda procedencia. As que guardam: businesses, identidade_visual, narrativa_negocio.',
      p_tabela;
  end if;

  -- Sem esta checagem, um erro de digitação vira chave que ninguém lê — e
  -- a ausência de procedência passa a significar duas coisas diferentes.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = p_tabela and column_name = p_campo
  ) then
    raise exception 'campo % nao existe em %', p_campo, p_tabela;
  end if;

  if p_campo = 'procedencia' then
    raise exception 'procedencia nao tem procedencia de si mesma';
  end if;

  v_entrada := jsonb_build_object('origem', p_origem, 'em', now(), 'por', p_por)
               || coalesce(p_extra, '{}'::jsonb);

  -- `updated_em` só em businesses: as outras duas têm gatilho
  -- set_atualizado_em, e mexer no campo à mão aqui esconderia um gatilho
  -- que parou de funcionar.
  execute format(
    'update public.%I set procedencia = coalesce(procedencia, ''{}''::jsonb) || jsonb_build_object($1, $2)%s where %I = $3',
    p_tabela,
    case when p_tabela = 'businesses' then ', updated_at = now()' else '' end,
    v_chave
  ) using p_campo, v_entrada, p_business_id;

  get diagnostics v_afetadas = row_count;

  if v_afetadas = 0 then
    if p_tabela = 'businesses' then
      raise exception 'negocio % nao encontrado', p_business_id;
    else
      -- NÃO cria a linha. Uma linha de identidade_visual toda nula criada
      -- de lado por um registro de procedência é um perfil que existe sem
      -- ninguém ter dito nada. Grave o valor primeiro; na transação de
      -- aplicar a proposta ele já vem antes.
      raise exception
        'nao existe linha em % para o negocio %. Grave o valor do campo antes de registrar a procedencia.',
        p_tabela, p_business_id;
    end if;
  end if;
end $$;

-- `authenticated` TAMBEM, e este era o furo da 0010: ela revogou de
-- `public, anon` e parou ali. O Supabase concede execute a anon e
-- authenticated por privilegio padrao no schema public, entao a revogacao
-- incompleta deixou qualquer usuario logado podendo chamar uma funcao
-- security definer que ignora RLS e escreve procedencia em QUALQUER
-- business_id. Conferir so `anon` nao mostra isso.
revoke all on function public.registrar_procedencia(text, uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.registrar_procedencia(text, uuid, text, text, text, jsonb)
  to service_role;

-- A leitura acompanha a escrita. Se só a escrita fosse generalizada, o
-- `diagnosticar-orcamento` continuaria sem enxergar a procedência de
-- `narrativa_negocio` — e leria 'desconhecida' para campo que tem origem.
create or replace function public.procedencia_do_campo(
  p_tabela      text,
  p_business_id uuid,
  p_campo       text
) returns text
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_chave  text;
  v_origem text;
begin
  v_chave := case p_tabela
               when 'businesses'        then 'id'
               when 'identidade_visual' then 'business_id'
               when 'narrativa_negocio' then 'business_id'
             end;

  if v_chave is null then
    raise exception
      'tabela % nao guarda procedencia. As que guardam: businesses, identidade_visual, narrativa_negocio.',
      p_tabela;
  end if;

  execute format(
    'select procedencia -> $1 ->> ''origem'' from public.%I where %I = $2',
    p_tabela, v_chave
  ) into v_origem using p_campo, p_business_id;

  -- 'desconhecida' cobre os três casos em que não há o que afirmar: campo
  -- sem procedência, linha sem procedência e linha inexistente. Quem
  -- pergunta "posso confiar neste numero?" recebe não nos três.
  return coalesce(v_origem, 'desconhecida');
end $$;

-- Mesma revogacao na leitura. Ela tambem e security definer e tambem
-- ignora RLS: com execute aberto, um logado consultava a procedencia de
-- qualquer negocio informando o uuid. Fica so service_role enquanto
-- nenhuma tela de cliente existe. Quando a tela de Conta chegar, o
-- caminho NAO e reabrir para authenticated e sim acrescentar
-- private.owns_business(p_business_id) dentro da funcao.
revoke all on function public.procedencia_do_campo(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.procedencia_do_campo(text, uuid, text)
  to service_role;
