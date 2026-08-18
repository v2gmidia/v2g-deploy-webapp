-- ============================================================
-- 0013 — Aplicar a proposta revisada ao perfil
--
-- POR QUE ISTO É UMA FUNÇÃO DE BANCO, e não código TypeScript:
-- "transação única" não é figura de linguagem. Aplicar 20 campos são 40
-- escritas (o valor e a procedência de cada um) em três tabelas
-- diferentes. O cliente JS do Supabase manda um statement por chamada:
-- se a décima falhar, as nove primeiras já estão gravadas, e o perfil
-- fica metade novo metade antigo — sem nenhum registro de onde foi o
-- corte. Esse é o estado que ninguém consegue depurar depois.
--
-- Dentro de uma função plpgsql tudo roda numa transação só: ou os 20
-- campos entram com suas procedências, ou nenhum entra.
-- ============================================================

create or replace function public.aplicar_proposta(
  p_proposta_id uuid,
  p_por         text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prop      record;
  v_item      record;
  v_tipo      text;
  v_valor     jsonb;
  v_origem    text;
  v_atual     text;
  v_aplicados int := 0;
begin
  -- `for update` segura a linha até o fim da transação. Sem isso, dois
  -- operadores clicando em aplicar ao mesmo tempo passariam os dois pela
  -- checagem de estado e escreveriam o perfil duas vezes.
  select * into v_prop
    from public.propostas_de_perfil
   where id = p_proposta_id
     for update;

  if not found then
    raise exception 'proposta % nao encontrada', p_proposta_id;
  end if;

  if v_prop.estado <> 'aberta' then
    raise exception
      'a proposta ja esta %. So proposta aberta pode ser aplicada.', v_prop.estado;
  end if;

  -- Aplicar com item pendente gravaria só parte da conversa e fecharia a
  -- proposta, deixando o resto sem chance de ser revisado nunca.
  if exists (
    select 1 from public.itens_da_proposta
     where proposta_id = p_proposta_id and decisao = 'pendente'
  ) then
    raise exception 'ainda ha itens pendentes. Decida todos antes de aplicar.';
  end if;

  for v_item in
    select * from public.itens_da_proposta
     where proposta_id = p_proposta_id
       and decisao in ('aceito', 'corrigido')
     order by tabela_alvo, campo
  loop
    -- `corrigido` guarda o valor digitado; `aceito` mantém o do agente.
    v_valor  := coalesce(v_item.valor_final, v_item.valor_proposto);
    v_origem := case v_item.decisao when 'corrigido' then 'manual' else 'extraido' end;

    -- ---------- A trava do valor confirmado ----------
    -- `confirmado` quer dizer que o CLIENTE olhou e disse que está certo.
    -- Deixar uma extração passar por cima disso em silêncio inverteria a
    -- escala de procedência: o palpite do agente valeria mais que a
    -- palavra do dono do negócio.
    --
    -- `aceito` é recusado e `corrigido` passa porque são atos diferentes.
    -- Aceitar é não fazer nada — é o clique que se dá em vinte itens
    -- seguidos sem ler. Corrigir é alguém ter digitado o valor com o
    -- aviso do conflito na tela. O primeiro não pode vencer o cliente; o
    -- segundo é uma pessoa assumindo a troca.
    v_atual := public.procedencia_do_campo(
      v_item.tabela_alvo, v_prop.business_id, v_item.campo
    );

    if v_atual = 'confirmado' and v_item.decisao = 'aceito' then
      raise exception
        'o campo %.% ja foi confirmado pelo cliente. Aceitar a proposta do agente o sobrescreveria: corrija a mao (assumindo a troca) ou descarte o item.',
        v_item.tabela_alvo, v_item.campo;
    end if;

    -- A linha filha pode não existir ainda. Criada aqui e SÓ quando há
    -- campo para ela — uma `identidade_visual` toda nula criada de lado é
    -- um perfil que existe sem ninguém ter dito nada.
    if v_item.tabela_alvo = 'identidade_visual' then
      insert into public.identidade_visual (business_id)
      values (v_prop.business_id) on conflict (business_id) do nothing;
    elsif v_item.tabela_alvo = 'narrativa_negocio' then
      insert into public.narrativa_negocio (business_id)
      values (v_prop.business_id) on conflict (business_id) do nothing;
    end if;

    select data_type into v_tipo
      from information_schema.columns
     where table_schema = 'public'
       and table_name = v_item.tabela_alvo
       and column_name = v_item.campo;

    if v_tipo is null then
      raise exception 'campo %.% nao existe', v_item.tabela_alvo, v_item.campo;
    end if;

    -- `valor_final`/`valor_proposto` são jsonb e a coluna de destino não
    -- é. `#>> '{}'` extrai o escalar como texto SEM as aspas que `->>`
    -- deixaria — gravar `"Sorocaba"` com aspas dentro de uma coluna text
    -- é o tipo de erro que só aparece no anúncio publicado.
    execute format(
      'update public.%I set %I = %s where %I = $2',
      v_item.tabela_alvo,
      v_item.campo,
      case v_tipo
        when 'numeric' then '($1 #>> ''{}'')::numeric'
        when 'integer' then '($1 #>> ''{}'')::integer'
        when 'boolean' then '($1 #>> ''{}'')::boolean'
        when 'ARRAY'   then 'array(select jsonb_array_elements_text($1))'
        else                '($1 #>> ''{}'')'
      end,
      case when v_item.tabela_alvo = 'businesses' then 'id' else 'business_id' end
    ) using v_valor, v_prop.business_id;

    -- A procedência carrega de onde veio. Sem `proposta_id` e
    -- `entrevista_id` aqui, daqui a um ano "de que conversa saiu este
    -- valor" volta a não ter resposta.
    perform public.registrar_procedencia(
      v_item.tabela_alvo,
      v_prop.business_id,
      v_item.campo,
      v_origem,
      p_por,
      jsonb_build_object(
        'proposta_id',   p_proposta_id,
        'item_id',       v_item.id,
        'entrevista_id', v_prop.entrevista_id
      )
    );

    v_aplicados := v_aplicados + 1;
  end loop;

  update public.propostas_de_perfil
     set estado = 'aplicada', aplicada_em = now(), aplicada_por = p_por
   where id = p_proposta_id;

  return jsonb_build_object('aplicados', v_aplicados);
end $$;

-- Decisão 10 de docs/arquitetura.md: `public`, `anon` E `authenticated`.
-- Revogar dos dois primeiros parece completo e não é.
revoke all on function public.aplicar_proposta(uuid, text) from public, anon, authenticated;
grant execute on function public.aplicar_proposta(uuid, text) to service_role;
