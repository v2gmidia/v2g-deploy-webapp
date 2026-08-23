-- ============================================================
-- 0021 — `aproximacao`: a procedencia de quem escolheu na lista de reserva
--
-- POR QUE ESTA MIGRATION EXISTE. O seletor de nicho passou a ler a lista
-- viva do `GET /nichos`. Quando esse endpoint nao responde, a tela mostra
-- os cinco chips de reserva de `perguntas.ts` — e eles NAO SAO NICHOS:
-- "Clinica / Consultorio" cobre TRES nichos reais de uma vez, "Loja
-- fisica" nao cobre nenhum.
--
-- Sem esta migration a escolha feita nesses chips era gravada como
-- `confirmado`, o nivel MAIS ALTO da escala, indistinguivel de uma escolha
-- feita numa lista real. O gestor lendo a coluna nao teria como saber que
-- aquilo foi palpite de um momento em que o sistema estava degradado.
--
-- Desenho em docs/handoff-seletor-de-nicho.md §4.
--
-- ============================================================
-- `aproximacao` FICA ABAIXO DE `confirmado`, E ISSO JA FUNCIONA SOZINHO.
--
-- As duas travas que protegem o valor dito pelo cliente comparam com o
-- literal:
--
--   0013 (aplicar_proposta):          if v_atual = 'confirmado' and ...
--   0019 (escrever_apenas_se_livre):  if v_atual = 'confirmado' then
--
-- Um valor marcado `aproximacao` cai FORA das duas — ou seja, a proposta
-- de um agente e a escrita automatica PODEM corrigi-lo. E o certo: ele e
-- um palpite sobre uma lista errada, nao uma afirmacao do dono.
--
-- NAO "conserte" essas duas travas para incluir aproximacao. A omissao e
-- a funcionalidade.
-- ============================================================
--
-- ORDEM DE IMPLANTACAO, E ELA IMPORTA: esta migration vai ANTES do deploy
-- do codigo que usa `p_origem`. Codigo novo contra banco velho chama uma
-- assinatura de 6 argumentos que ainda nao existe, e o PostgREST responde
-- "function not found" — o que quebraria exatamente a resposta do cliente
-- num momento em que o backend ja esta fora.
-- ============================================================

-- ---------------------------------------------------------------- 1
-- `registrar_procedencia` passa a aceitar o quarto valor.
--
-- REESCRITA INTEIRA, nao remendada — mesma regra que a 0016 seguiu: nao
-- existe ALTER para um literal dentro de corpo plpgsql, e reescrever a mao
-- o que ja estava certo e como se perde uma checagem sem ninguem ver. O
-- corpo abaixo e copia mecanica da 0011 com a linha do dominio trocada; o
-- `git diff` entre os dois arquivos mostra exatamente isso.

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
  -- `aproximacao` acrescentado pela 0021. Ele nao e sinonimo de nenhum dos
  -- outros tres: o cliente TOCOU numa opcao, entao nao e `extraido` nem
  -- `manual`; mas a opcao que ele tocou nao era um nicho, entao tambem nao
  -- e `confirmado`.
  if p_origem not in ('confirmado', 'manual', 'extraido', 'aproximacao') then
    raise exception
      'origem invalida: %. Use confirmado (o cliente viu e disse que esta certo), manual (alguem da V2G anotou na conversa), extraido (o agente tirou da transcricao) ou aproximacao (o cliente escolheu numa lista de reserva, com o backend fora).',
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


-- Os grants sao repetidos por serem baratos e por `create or replace` nao
-- ser o unico caminho ate aqui. `public`, `anon` E `authenticated` — a
-- revogacao incompleta foi o furo da 0010.
revoke all on function public.registrar_procedencia(text, uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.registrar_procedencia(text, uuid, text, text, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------- 2
-- `confirmar_campo_do_cliente` ganha `p_origem`.
--
-- A ASSINATURA ANTIGA E REMOVIDA, nao mantida ao lado. Um `create or
-- replace` com argumento novo cria uma SEGUNDA funcao, e duas sobrecargas
-- com o mesmo nome deixam o PostgREST ambiguo — ele recusa a chamada em
-- vez de escolher. Derrubar a antiga e o unico caminho que nao deixa o
-- banco num estado que responde erro para todo mundo.
--
-- Nenhum chamador SQL: conferido antes de escrever isto. Os unicos
-- chamadores sao `lib/cadastro/procedencia.ts` e a Server Action da
-- /meu-negocio, e os dois passam por aquele modulo.

drop function if exists public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb);

create or replace function public.confirmar_campo_do_cliente(
  p_profile_id  uuid,
  p_business_id uuid,
  p_tabela      text,
  p_campo       text,
  -- Nulo = confirmar o que já está lá. Com valor = corrigir (se havia
  -- valor) ou preencher (se estava vazio). Ver `v_ato` abaixo.
  p_valor       jsonb default null,
  -- ACRESCENTADO PELA 0021. Default `confirmado`: todo chamador que existia
  -- antes desta migration continua gravando exatamente o que gravava.
  --
  -- Dois valores, e so dois. `manual` e `extraido` NAO entram: eles sao o
  -- vocabulario de outros canais (alguem da V2G anotou; o agente extraiu da
  -- transcricao), e deixar esta porta escreve-los seria o furo que a 0016
  -- descreve — o palpite de um agente sobrescrevendo em silencio o que o
  -- dono digitou com as proprias maos.
  p_origem      text default 'confirmado'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave      text;
  v_permitidos text[];
  v_tem_linha  boolean;
  v_atual      jsonb;
  v_anterior   text;
  v_tipo       text;
  v_ato        text;
  v_texto      text;
begin
  -- ---------- 0. A origem, e ela e restrita AQUI tambem ----------
  -- A `registrar_procedencia` aceita quatro valores; esta porta aceita
  -- dois. A restricao mais apertada e do lado de ca de proposito: esta
  -- funcao e chamada a partir de um caminho que comeca no navegador do
  -- cliente, e o que ele escolheu so pode ser uma afirmacao dele
  -- (`confirmado`) ou um palpite feito sobre uma lista de reserva
  -- (`aproximacao`).
  if p_origem not in ('confirmado', 'aproximacao') then
    raise exception
      'origem invalida para o ato do cliente: %. Esta porta produz confirmado (ele escolheu numa lista real) ou aproximacao (ele escolheu numa lista de reserva, com o backend fora).',
      p_origem;
  end if;

  -- ---------- 1. O dono, antes de qualquer outra coisa ----------
  -- A Server Action já conferiu isto com o cliente do próprio usuário,
  -- sob RLS. Aqui é a segunda camada: esta função é `security definer` e
  -- ignora RLS, então um erro na camada TypeScript viraria escrita em
  -- negócio alheio sem nada por baixo para segurar. Defesa em
  -- profundidade da Decisão 3, na camada de dados.
  if not exists (
    select 1 from public.businesses
     where id = p_business_id and profile_id = p_profile_id
  ) then
    raise exception 'o negocio % nao pertence a este perfil', p_business_id;
  end if;

  -- ---------- 2. Tabela e coluna de junção, na mesma expressão ----------
  -- Mesma forma da `registrar_procedencia()` da 0011, e pelo mesmo motivo:
  -- separar as duas informações permitiria acrescentar uma tabela à lista
  -- e esquecer a chave.
  v_chave := case p_tabela
               when 'businesses'        then 'id'
               when 'identidade_visual' then 'business_id'
               when 'narrativa_negocio' then 'business_id'
             end;

  if v_chave is null then
    raise exception
      'tabela % nao tem perfil revisavel pelo cliente. As que tem: businesses, identidade_visual, narrativa_negocio.',
      p_tabela;
  end if;

  -- ---------- 3. LISTA BRANCA DE COLUNAS, e ela é obrigatória ----------
  -- A `registrar_procedencia()` se contenta em conferir que a coluna
  -- existe, e para ela isso basta: ela só escreve dentro do jsonb de
  -- procedência, nunca na coluna. ESTA função escreve na coluna, e o nome
  -- dela vem de um caminho que começa no navegador do cliente. Conferir só
  -- existência aceitaria `profile_id` — ou seja, um POST forjado passando
  -- `p_campo = 'profile_id'` daria o negócio para outra pessoa.
  --
  -- A duplicação com `lib/agentes/campos.ts` é deliberada: aquele arquivo
  -- é a fonte única do que a TELA mostra; esta lista é o que o BANCO
  -- aceita, e ela precisa continuar valendo quando o TypeScript estiver
  -- errado. Campo novo no catálogo entra aqui também, e por migration.
  v_permitidos := case p_tabela
    when 'businesses' then array[
      -- os 18 do catálogo de extração
      'city', 'cep', 'niche', 'description', 'atende_somente_no_local',
      'business_hours', 'availability', 'delivery_time', 'payment_policy',
      'guarantee', 'differentiators', 'site_url', 'instagram_handle',
      'avg_ticket_min', 'avg_ticket_max', 'avg_direct_cost', 'monthly_budget',
      -- acrescentado pela 0016: entrou no catálogo com o bloco 2 do
      -- onboarding, e sem ele a conta 3 não tem como gravar.
      'target_profit_per_customer',
      -- e os dois que saíram do formulário da /conta e não vêm de extração
      'name', 'radius_km'
    ]
    when 'narrativa_negocio' then array[
      'quem_somos', 'historia', 'por_que_existe', 'para_quem', 'o_que_nao_fazemos'
    ]
    when 'identidade_visual' then array[
      -- cor e fonte ficam de fora pelo mesmo motivo do catálogo: são lidas
      -- pela geração de criativo como código de cor e nome de fonte, e o
      -- que o cliente escreve sobre a marca cabe em `observacoes`.
      'tom_de_voz', 'observacoes'
    ]
  end;

  if not (p_campo = any(v_permitidos)) then
    raise exception 'o cliente nao revisa o campo %.%', p_tabela, p_campo;
  end if;

  -- ---------- 4. O que está lá hoje ----------
  execute format('select exists(select 1 from public.%I where %I = $1)', p_tabela, v_chave)
    into v_tem_linha using p_business_id;

  if v_tem_linha then
    -- `to_jsonb` da coluna devolve NULL de SQL quando a coluna é nula — o
    -- que distingue "campo vazio" de "campo com valor". A linha ausente já
    -- foi separada acima, então null aqui quer dizer campo vazio e nada
    -- mais.
    execute format('select to_jsonb(t.%I) from public.%I t where t.%I = $1', p_campo, p_tabela, v_chave)
      into v_atual using p_business_id;
  end if;

  -- ---------- 5. O ATO É DERIVADO, NÃO INFORMADO ----------
  -- O desenho previa um argumento `p_ato`. Tirei: quem chama não tem por
  -- que ser acreditado sobre o que acabou de fazer. Com o ato derivado do
  -- estado real, "preencheu" nunca aparece num campo que tinha valor, e o
  -- registro histórico não depende de a aplicação estar certa.
  if p_valor is null or p_valor = 'null'::jsonb then
    if v_atual is null then
      raise exception
        'nao da para confirmar %.%: o campo esta vazio. Vazio se preenche, nao se confirma.',
        p_tabela, p_campo;
    end if;
    v_ato := 'confirmou';
  elsif v_atual is null then
    v_ato := 'preencheu';
  else
    v_ato := 'corrigiu';
  end if;

  -- Texto em branco não é valor. Sem isto, "salvar" com o campo vazio
  -- apagaria o valor e carimbaria `confirmado` em cima do apagamento.
  if v_ato <> 'confirmou' then
    v_texto := p_valor #>> '{}';
    if v_texto is not null and btrim(v_texto) = '' then
      raise exception 'o campo %.% nao aceita valor em branco', p_tabela, p_campo;
    end if;
  end if;

  v_anterior := public.procedencia_do_campo(p_tabela, p_business_id, p_campo);

  -- ---------- 6. A escrita do valor ----------
  if v_ato <> 'confirmou' then
    -- A linha filha pode não existir. Criada aqui e SÓ quando há valor
    -- para ela — mesma regra da 0011 e da 0013: uma `identidade_visual`
    -- toda nula criada de lado é um perfil que existe sem ninguém ter dito
    -- nada.
    if not v_tem_linha then
      if p_tabela = 'identidade_visual' then
        insert into public.identidade_visual (business_id)
        values (p_business_id) on conflict (business_id) do nothing;
      elsif p_tabela = 'narrativa_negocio' then
        insert into public.narrativa_negocio (business_id)
        values (p_business_id) on conflict (business_id) do nothing;
      else
        raise exception 'negocio % nao encontrado', p_business_id;
      end if;
    end if;

    select data_type into v_tipo
      from information_schema.columns
     where table_schema = 'public' and table_name = p_tabela and column_name = p_campo;

    -- `#>> '{}'` e NUNCA `->>`. O segundo devolve o escalar COM as aspas,
    -- e gravar `"Sorocaba"` com aspas dentro de uma coluna text é o tipo
    -- de erro que só aparece no anúncio publicado. Cicatriz da 0013.
    execute format(
      'update public.%I set %I = %s where %I = $2',
      p_tabela,
      p_campo,
      case v_tipo
        when 'numeric' then '($1 #>> ''{}'')::numeric'
        when 'integer' then '($1 #>> ''{}'')::integer'
        when 'boolean' then '($1 #>> ''{}'')::boolean'
        when 'ARRAY'   then 'array(select jsonb_array_elements_text($1))'
        else                '($1 #>> ''{}'')'
      end,
      v_chave
    ) using p_valor, p_business_id;
  end if;

  -- ---------- 7. A CIDADE INVALIDA A LOCALIZAÇÃO ----------
  -- `geo_key` é resolvido a partir de `businesses.city` e, até esta
  -- migration, NUNCA era limpo por ninguém em lugar nenhum do repositório.
  -- `garantirGeo()` (lib/meta/publicar.ts) devolve `geo_key` como segundo
  -- item da cascata, antes de tentar resolver de novo — então cidade
  -- corrigida sem esta limpeza é anúncio entregue na cidade antiga, sem
  -- erro em lugar nenhum.
  --
  -- `geo_lat/lng` NÃO entram: elas vêm do endereço da página do Facebook,
  -- não do nome da cidade, e a cascata já as prefere quando existem. Um
  -- endereço real vale mais que um nome digitado, e corrigir a cidade não
  -- é motivo para descartá-lo.
  --
  -- `cep` também não entra: ele não participa da resolução geográfica.
  if p_tabela = 'businesses'
     and p_campo = 'city'
     and v_ato <> 'confirmou'
     and v_atual is distinct from p_valor then
    update public.businesses
       set geo_key = null, geo_label = null, geo_resolved_at = null
     where id = p_business_id;
  end if;

  -- ---------- 8. A procedência ----------
  -- `confirmado` NOS TRÊS ATOS, e é a decisão central deste lote.
  --
  -- Corrigir e preencher poderiam parecer `manual`, mas `manual` está
  -- definido desde a 0010 como "alguém da V2G anotou durante a conversa" —
  -- e o cliente não é a V2G. Pior: a trava da 0013 recusa `aceito` sobre
  -- `confirmado` e deixa passar sobre `manual`. Se o ato do cliente
  -- gravasse `manual`, o palpite do agente numa proposta futura
  -- sobrescreveria em silêncio o número que o dono digitou com as próprias
  -- mãos — a inversão que a trava existe para impedir, entrando pela porta
  -- dos fundos.
  --
  -- A diferença entre os três atos sobrevive no `extra`, sem inflar a
  -- escala com um quarto nível que algum leitor esqueceria de tratar.
  perform public.registrar_procedencia(
    p_tabela,
    p_business_id,
    p_campo,
    -- Era o literal `'confirmado'` ate a 0021. Virou parametro para a
    -- reserva do seletor de nicho poder se marcar como palpite.
    p_origem,
    -- Montado aqui, não recebido: quem chama não escolhe como vai ser
    -- identificado. Segue a forma de `v2g:gabriel` do desenho da 0010.
    'cliente:' || p_profile_id::text,
    jsonb_build_object('ato', v_ato)
      || case when v_atual is not null
              then jsonb_build_object('valor_anterior', v_atual)
              else '{}'::jsonb end
      || case when v_anterior <> 'desconhecida'
              then jsonb_build_object('procedencia_anterior', v_anterior)
              else '{}'::jsonb end
  );

  return jsonb_build_object(
    'campo', p_tabela || '.' || p_campo,
    'ato', v_ato,
    -- Devolvido pela 0021: quem chama nao precisa deduzir o que foi
    -- gravado a partir do que mandou.
    'origem', p_origem,
    'procedencia_anterior', v_anterior
  );
end $$;


-- Decisao 10 do docs/arquitetura.md, inteira: `public`, `anon` E
-- `authenticated`. Revogar dos dois primeiros parece completo e nao e — o
-- Supabase concede execute a `anon` e a `authenticated` por privilegio
-- padrao no schema public, e foi exatamente esse o furo da 0010.
--
-- Assinatura NOVA, de seis argumentos. A antiga foi derrubada acima, entao
-- os grants dela morreram junto.
revoke all on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb, text)
  to service_role;

comment on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb, text) is
  'Unica porta que produz procedencia do ato do cliente: `confirmado` (escolheu numa lista real) ou `aproximacao` (escolheu numa lista de reserva, com o backend fora). Deriva o ato (confirmou/corrigiu/preencheu) do estado real da coluna, grava valor e procedencia na mesma transacao, e limpa geo_key quando a cidade muda. So service_role.';
