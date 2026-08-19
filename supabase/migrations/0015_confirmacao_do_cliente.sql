-- ============================================================
-- 0015 — O cliente confirma, corrige e preenche o próprio perfil
--
-- Desenho em docs/revisao-perfil-cliente.md.
--
-- É A ÚNICA PORTA QUE PRODUZ `confirmado`. Até aqui a escala de
-- procedência tinha três níveis e só dois eram alcançáveis: o operador
-- produz `extraido` e `manual` (0013), e `confirmado` significa "o cliente
-- viu e disse que está certo" — coisa que ninguém tinha onde dizer.
--
-- POR QUE UMA FUNÇÃO E NÃO DOIS UPDATE NA APLICAÇÃO:
-- são duas escritas, o valor e a procedência. Se a segunda falhar, sobra
-- um valor do cliente carregando a origem antiga — e aí um `aceito` de uma
-- proposta futura passa pela trava da 0013 sem bater nela e sobrescreve em
-- silêncio o número que o dono digitou. É exatamente o defeito que este
-- lote existe para consertar, recriado por acidente. Uma função plpgsql
-- roda as duas na mesma transação.
-- ============================================================

create or replace function public.confirmar_campo_do_cliente(
  p_profile_id  uuid,
  p_business_id uuid,
  p_tabela      text,
  p_campo       text,
  -- Nulo = confirmar o que já está lá. Com valor = corrigir (se havia
  -- valor) ou preencher (se estava vazio). Ver `v_ato` abaixo.
  p_valor       jsonb default null
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
      -- os 17 do catálogo de extração
      'city', 'cep', 'niche', 'description', 'atende_somente_no_local',
      'business_hours', 'availability', 'delivery_time', 'payment_policy',
      'guarantee', 'differentiators', 'site_url', 'instagram_handle',
      'avg_ticket_min', 'avg_ticket_max', 'avg_direct_cost', 'monthly_budget',
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
    'confirmado',
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
    'procedencia_anterior', v_anterior
  );
end $$;

-- Decisão 10 do docs/arquitetura.md, inteira: `public`, `anon` E
-- `authenticated`. Revogar dos dois primeiros parece completo e não é — o
-- Supabase concede execute a `anon` e a `authenticated` por privilégio
-- padrão no schema public, e foi exatamente esse o furo da 0010.
--
-- Só `service_role`: a chamada vem de uma Server Action que já conferiu a
-- sessão. Abrir para `authenticated` exigiria `private.owns_business()`
-- aqui dentro, que depende de `auth.uid()` e obrigaria a chamada a vir do
-- cliente do usuário — o oposto do que este desenho quer.
revoke all on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb)
  to service_role;

comment on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb) is
  'Unica porta que produz procedencia `confirmado`. Deriva o ato (confirmou/corrigiu/preencheu) do estado real da coluna, grava valor e procedencia na mesma transacao, e limpa geo_key quando a cidade muda. So service_role.';
