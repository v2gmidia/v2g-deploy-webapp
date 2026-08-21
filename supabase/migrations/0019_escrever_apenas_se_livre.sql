-- ============================================================
-- Escrita automática em `businesses` que respeita a conferência do cliente.
--
-- Desenho aprovado em 21/08/2026. Existe porque a trava do valor
-- confirmado mora DENTRO do `aplicar_proposta` (0013) e não protege
-- ninguém além dele: `UPDATE` direto, `registrar_procedencia` e qualquer
-- escritor novo passam ao largo. Ver docs/buraco-trava-procedencia.md.
--
-- A REGRA: `confirmado` quer dizer que o cliente olhou o próprio negócio
-- na /meu-negocio e disse que está certo. O cadastro é preenchido por
-- quem monta a campanha, acontece UMA vez, e a conferência acontece
-- quando o cliente quiser. Quando os dois discordam, quem viu o negócio
-- ganha.
--
-- POR QUE PULA E NÃO LEVANTA EXCEÇÃO: um cadastro escreve N campos. Abortar
-- no primeiro confirmado descartaria os outros N-1, que estavam livres.
-- ============================================================

-- ---------- O rastro da divergência ----------
-- Sem tela, e de propósito. O que não pode é o valor do formulário sumir
-- sem deixar registro de que existiu e de que perdeu.
create table if not exists public.divergencias_de_cadastro (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  execucao_id         uuid,
  campo               text not null,
  valor_recusado      jsonb not null,
  valor_mantido       jsonb,
  procedencia_mantida text not null,
  origem_tentada      text not null,
  por                 text,
  em                  timestamptz not null default now()
);

comment on table public.divergencias_de_cadastro is
  'Valor que a escrita automatica trouxe e NAO gravou, porque o campo ja '
  'estava confirmado pelo cliente. Rastro, nao fila de trabalho.';

create index if not exists idx_divergencias_business on public.divergencias_de_cadastro (business_id);
create index if not exists idx_divergencias_execucao on public.divergencias_de_cadastro (execucao_id);

-- RLS ligada com zero politicas: `default deny`, so `service_role` entra.
alter table public.divergencias_de_cadastro enable row level security;

-- ---------- A porta ----------
create or replace function public.escrever_apenas_se_livre(
  p_business_id uuid,
  p_campo       text,
  p_valor       jsonb,
  p_origem      text,
  p_por         text,
  p_execucao_id uuid default null
) returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_atual        text;
  v_valor_atual  jsonb;
  v_afetadas     int;
begin
  -- `confirmado` NAO entra aqui. Ele so nasce em `confirmar_campo_do_cliente`,
  -- que e a unica porta que representa o cliente. Uma escrita automatica
  -- alegando confirmacao seria afirmacao falsa sobre quem disse o que.
  if p_origem not in ('manual', 'extraido') then
    raise exception
      'origem invalida para escrita automatica: %. Use manual (alguem da V2G anotou na conversa) ou extraido (o agente tirou da transcricao). `confirmado` so sai de confirmar_campo_do_cliente.',
      p_origem;
  end if;

  if p_campo in ('id', 'profile_id', 'procedencia', 'created_at', 'updated_at',
                 'dados_ficticios', 'claim_email') then
    raise exception 'campo % nao e escrivel por esta porta', p_campo;
  end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'businesses' and column_name = p_campo
  ) then
    raise exception 'campo % nao existe em businesses', p_campo;
  end if;

  if not exists (select 1 from public.businesses where id = p_business_id) then
    raise exception 'negocio % nao encontrado', p_business_id;
  end if;

  -- Valor nulo nao apaga. Ausente no cadastro significa "nao falamos disso",
  -- nunca "apaga o que estava la" — mesma regra do `exclude_unset` do
  -- /onboarding/call.
  if p_valor is null or jsonb_typeof(p_valor) = 'null' then
    return 'sem_valor';
  end if;

  v_atual := public.procedencia_do_campo('businesses', p_business_id, p_campo);

  execute format('select to_jsonb(b.%I) from public.businesses b where b.id = $1', p_campo)
     into v_valor_atual using p_business_id;

  -- ---------- A trava ----------
  if v_atual = 'confirmado' then
    -- Mesmo valor nao e divergencia: o formulario so concorda com o cliente.
    if v_valor_atual is not distinct from p_valor then
      return 'ja_igual';
    end if;

    insert into public.divergencias_de_cadastro
      (business_id, execucao_id, campo, valor_recusado, valor_mantido,
       procedencia_mantida, origem_tentada, por)
    values
      (p_business_id, p_execucao_id, p_campo, p_valor, v_valor_atual,
       v_atual, p_origem, p_por);

    return 'pulado_confirmado';
  end if;

  -- ---------- A escrita, valor e procedencia na mesma transacao ----------
  -- `jsonb_populate_record` faz a coercao de tipo pela propria definicao da
  -- tabela: text, numeric, boolean e text[] saem certos sem cast a mao, e sem
  -- o `->>` que devolveria escalar com aspas.
  execute format(
    'update public.businesses set %I = v.%I, updated_at = now() '
    'from (select * from jsonb_populate_record(null::public.businesses, '
    '                                          jsonb_build_object(%L, $1))) as v '
    'where public.businesses.id = $2',
    p_campo, p_campo, p_campo
  ) using p_valor, p_business_id;

  get diagnostics v_afetadas = row_count;
  if v_afetadas = 0 then
    raise exception 'negocio % nao encontrado na escrita de %', p_business_id, p_campo;
  end if;

  perform public.registrar_procedencia(
    'businesses', p_business_id, p_campo, p_origem, p_por,
    case when p_execucao_id is null then '{}'::jsonb
         else jsonb_build_object('execucao_id', p_execucao_id) end
  );

  return 'gravado';
end $function$;

-- `service_role` e mais nada. O Supabase concede a `public`, `anon` e
-- `authenticated` por padrao, e os tres precisam sair explicitamente.
revoke all on function public.escrever_apenas_se_livre(uuid, text, jsonb, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.escrever_apenas_se_livre(uuid, text, jsonb, text, text, uuid)
  to service_role;
