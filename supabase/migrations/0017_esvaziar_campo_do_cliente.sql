-- ============================================================
-- 0017 — O cliente esvazia um campo, e a procedência vai junto
--
-- A 0015 cobre confirmar, corrigir e preencher. Ela NÃO cobre esvaziar, e
-- se recusa a isso de propósito: "Vazio se preenche, nao se confirma" —
-- não existe procedência de campo vazio.
--
-- Mas alguém precisa cobrir. O formulário da `/conta` tem campos
-- opcionais, e apagar um deles com um `update` solto deixaria a coluna
-- nula com a procedência ainda afirmando `confirmado` sobre ela. Isso é
-- pior que não ter procedência: um `aceito` de proposta futura bate na
-- trava da 0013 e é recusado, para proteger um valor que não existe mais.
--
-- POR QUE `security invoker`, AO CONTRÁRIO DAS IRMÃS
--
-- A 0011, a 0013 e a 0015 são `security definer` porque precisam ignorar
-- a RLS — a 0015 escreve em nome do cliente a partir de uma Server Action
-- que usa `service_role`. Esta aqui não precisa de nada disso: apagar o
-- próprio campo é uma escrita que a RLS já autoriza. Com `invoker`, quem
-- decide de quem é a linha é a política da tabela, e não um `if` dentro
-- da função que alguém pode esquecer de escrever. Menos poder é o
-- desenho certo quando o poder não é necessário.
--
-- Consequência: ela é a ÚNICA das quatro que `authenticated` executa. E
-- pode ser, porque sem RLS ela não faz nada.
-- ============================================================

create or replace function public.esvaziar_campos_do_cliente(
  p_business_id uuid,
  p_campos      text[]
) returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_permitidos text[] := array[
    'niche', 'city', 'radius_km', 'cep', 'description',
    'avg_ticket_min', 'avg_ticket_max', 'avg_direct_cost',
    'target_profit_per_customer', 'monthly_budget',
    'business_hours', 'availability', 'delivery_time', 'payment_policy',
    'guarantee', 'differentiators', 'site_url', 'instagram_handle'
  ];
  v_campo   text;
  v_sets    text[] := '{}';
  v_afetadas integer;
begin
  -- `name` NÃO está na lista, e a ausência é a regra: a coluna é
  -- `not null`. Deixá-lo entrar aqui trocaria uma mensagem clara de
  -- validação por um erro de constraint vindo do banco.
  --
  -- `profile_id` também não, pelo motivo óbvio — é ele que diz de quem é
  -- o negócio. Uma lista branca que só confere existência de coluna
  -- aceitaria os dois.
  if p_campos is null or array_length(p_campos, 1) is null then
    return 0;
  end if;

  foreach v_campo in array p_campos loop
    if not (v_campo = any(v_permitidos)) then
      raise exception 'o cliente nao esvazia o campo businesses.%', v_campo;
    end if;
    v_sets := v_sets || format('%I = null', v_campo);
  end loop;

  -- UM ÚNICO `update`, e é o ponto inteiro desta função. Zerar a coluna
  -- num statement e limpar a procedência noutro abre uma janela em que o
  -- campo está vazio e a procedência ainda afirma quem o disse. Curta,
  -- mas é exatamente o estado que a trava da 0013 lê para decidir se
  -- aceita uma proposta.
  --
  -- `procedencia - p_campos` remove as chaves; o operador `-` de jsonb
  -- com text[] ignora chave ausente sem reclamar, que é o que se quer
  -- para um campo que nunca teve procedência.
  execute format(
    'update public.businesses set %s, procedencia = procedencia - $1, updated_at = now() where id = $2',
    array_to_string(v_sets, ', ')
  ) using p_campos, p_business_id;

  get diagnostics v_afetadas = row_count;

  -- Zero linhas aqui significa que a RLS barrou (negócio de outra
  -- pessoa) ou que o id não existe. As duas merecem erro: devolver 0 em
  -- silêncio faria a tela dizer "salvo" sobre uma escrita que não houve.
  if v_afetadas = 0 then
    raise exception 'negocio % nao encontrado ou nao e seu', p_business_id;
  end if;

  return array_length(p_campos, 1);
end $$;

-- `authenticated` PODE executar — ver o cabeçalho. `anon` não: sem
-- sessão não há linha própria para apagar, e deixar a rota aberta seria
-- convite a sondagem de id.
revoke all on function public.esvaziar_campos_do_cliente(uuid, text[])
  from public, anon;
grant execute on function public.esvaziar_campos_do_cliente(uuid, text[])
  to authenticated, service_role;

comment on function public.esvaziar_campos_do_cliente(uuid, text[]) is
  'Zera colunas de perfil e remove a procedencia delas no MESMO update. security invoker: quem autoriza e a RLS. Irma da confirmar_campo_do_cliente, que cobre confirmar/corrigir/preencher e recusa esvaziar.';
