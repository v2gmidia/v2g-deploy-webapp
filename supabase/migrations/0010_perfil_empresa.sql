-- ============================================================
-- 0010 — Perfil da empresa
--
-- Aplicada em 17/08/2026, em duas partes: `perfil_empresa` (schema) e
-- `perfil_empresa_rls_e_escrita` (políticas e funções). Este arquivo é o
-- registro consolidado das duas.
--
-- Desenho aprovado em docs/perfil-empresa.md.
--
-- QUATRO GRUPOS, e as PESSOAS separadas dos fatos do negócio. Dado de
-- pessoa física tem regime de LGPD que dado de empresa não tem: "apagar
-- os dados do João" precisa ser uma consulta, não uma cirurgia dentro de
-- uma tabela que metade do sistema lê.
-- ============================================================

-- ---------- 1. FATOS: expande `businesses`, não cria tabela ----------
alter table public.businesses
  add column if not exists cep                     text,
  add column if not exists atende_somente_no_local boolean default true,
  add column if not exists site_url                text,
  add column if not exists instagram_handle        text,
  -- Chave = nome da coluna. Valor = { origem, em, por, ... }.
  -- `origem` é 'confirmado' | 'manual' | 'extraido', e a ordem é
  -- precedência. `manual` vale mais que `extraido` porque quem anota o
  -- número à mão na conversa não confunde "dois mil" com "duzentos" — a
  -- transcrição confunde.
  add column if not exists procedencia jsonb not null default '{}'::jsonb;

-- ---------- 2. PESSOAS ----------
create table if not exists public.pessoas_do_negocio (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  nome        text not null,
  papel       text,
  aparece_em_criativo        boolean not null default false,
  -- Consentimento sob a LGPD precisa ser DEMONSTRÁVEL, e "clicou sim" não
  -- demonstra a quê. Guardar a redação vigente no momento do aceite é o
  -- que permite responder, dois anos depois, o que foi autorizado.
  consentimento_imagem_em    timestamptz,
  consentimento_imagem_texto text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pessoas_do_negocio_business_id_idx
  on public.pessoas_do_negocio (business_id);

-- ---------- 3. IDENTIDADE VISUAL: só as definições ----------
-- Os ARQUIVOS ficam em `creatives`, que já tem storage, RLS e vínculo com
-- o negócio. Um segundo lugar faria "onde está a foto do João" ter duas
-- respostas.
create table if not exists public.identidade_visual (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null unique references public.businesses (id) on delete cascade,
  cor_primaria   text,
  cor_secundaria text,
  cor_destaque   text,
  fonte_titulo   text,
  fonte_corpo    text,
  tom_de_voz     text,
  observacoes    text,
  procedencia    jsonb not null default '{}'::jsonb,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- ---------- 4. NARRATIVA ----------
create table if not exists public.narrativa_negocio (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null unique references public.businesses (id) on delete cascade,
  quem_somos        text,
  historia          text,
  por_que_existe    text,
  para_quem         text,
  -- Impede a copy de prometer o que o negócio não entrega — causa nº 1 de
  -- reprovação na revisão do Meta.
  o_que_nao_fazemos text,
  procedencia       jsonb not null default '{}'::jsonb,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- ---------- 5. CREATIVES: de quem é a foto ----------
alter table public.creatives
  add column if not exists pessoa_id uuid references public.pessoas_do_negocio (id) on delete set null,
  add column if not exists uso       text default 'campanha';

alter table public.creatives drop constraint if exists creatives_uso_check;
alter table public.creatives
  add constraint creatives_uso_check
  check (uso in ('logo', 'identidade', 'campanha', 'referencia'));

-- É ESTE ÍNDICE que responde ao pedido de remoção de imagem. Sem ele,
-- "achar as fotos do João" é varrer a tabela inteira.
create index if not exists creatives_pessoa_id_idx
  on public.creatives (pessoa_id) where pessoa_id is not null;

-- ---------- 6. ENTREVISTAS: append-only ----------
create table if not exists public.entrevistas (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  realizada_em      timestamptz not null,
  conduzida_por     text not null,
  transcricao       text not null,
  ferramenta        text,
  -- O par da transcrição: os números anotados à mão durante a conversa.
  -- É deles que sai a procedência 'manual'.
  anotacoes_numeros jsonb,
  criado_em         timestamptz not null default now()
);
create index if not exists entrevistas_business_id_idx
  on public.entrevistas (business_id, realizada_em desc);

-- ---------- 7. EXECUCOES: fase 1 da ligação ----------
-- Só acrescenta a coluna. As colunas que o backend escreve hoje continuam
-- existindo e sendo escritas: nada quebra.
alter table public.execucoes
  add column if not exists business_id uuid references public.businesses (id) on delete set null;
create index if not exists execucoes_business_id_idx on public.execucoes (business_id);

-- ============================================================
-- RLS — nenhuma tabela do perfil nasce sem política.
--
-- O predicado é `private.owns_business`, no schema `private` e NÃO no
-- `public`. É o mesmo que protege `campaigns` e `creatives` desde a 0001.
-- ============================================================
alter table public.pessoas_do_negocio enable row level security;
alter table public.identidade_visual  enable row level security;
alter table public.narrativa_negocio  enable row level security;
alter table public.entrevistas        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pessoas_do_negocio','identidade_visual','narrativa_negocio'] loop
    execute format($f$
      drop policy if exists "%1$s_select_own" on public.%1$I;
      create policy "%1$s_select_own" on public.%1$I for select to authenticated
        using (private.owns_business(business_id));
      drop policy if exists "%1$s_insert_own" on public.%1$I;
      create policy "%1$s_insert_own" on public.%1$I for insert to authenticated
        with check (private.owns_business(business_id));
      drop policy if exists "%1$s_update_own" on public.%1$I;
      create policy "%1$s_update_own" on public.%1$I for update to authenticated
        using (private.owns_business(business_id))
        with check (private.owns_business(business_id));
      drop policy if exists "%1$s_delete_own" on public.%1$I;
      create policy "%1$s_delete_own" on public.%1$I for delete to authenticated
        using (private.owns_business(business_id));
    $f$, t);
  end loop;
end $$;

-- ENTREVISTAS: LER SIM, REESCREVER NUNCA.
-- O cliente lê a própria entrevista — é dele o direito de acesso do
-- art. 18 da LGPD. Mas sem update nem delete: registro de origem que
-- alguém pode reescrever não serve para nada, e quem reescreveria é
-- justamente quem for questionado sobre o dado.
drop policy if exists "entrevistas_select_own" on public.entrevistas;
create policy "entrevistas_select_own" on public.entrevistas for select to authenticated
  using (private.owns_business(business_id));

revoke insert, update, delete on public.entrevistas from authenticated, anon;

-- ============================================================
-- A FUNÇÃO DE ESCRITA DA PROCEDÊNCIA
--
-- `jsonb` não é validado pelo banco: nada impede gravar
-- {"origem":"chutado"}. Um CHECK resolveria, mas a mensagem de erro de
-- check sobre jsonb é ilegível para quem for depurar às duas da manhã.
-- Uma função com mensagem própria custa o mesmo e explica o que houve.
-- ============================================================
create or replace function public.registrar_procedencia(
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
  v_entrada jsonb;
begin
  if p_origem not in ('confirmado', 'manual', 'extraido') then
    raise exception
      'origem invalida: %. Use confirmado (o cliente viu e disse que esta certo), manual (alguem da V2G anotou na conversa) ou extraido (o agente tirou da transcricao).',
      p_origem;
  end if;

  -- Sem esta checagem, um erro de digitação vira chave que ninguém lê — e
  -- a ausência de procedência passa a significar duas coisas diferentes.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'businesses' and column_name = p_campo
  ) then
    raise exception 'campo % nao existe em businesses', p_campo;
  end if;

  v_entrada := jsonb_build_object('origem', p_origem, 'em', now(), 'por', p_por)
               || coalesce(p_extra, '{}'::jsonb);

  update public.businesses
     set procedencia = coalesce(procedencia, '{}'::jsonb) || jsonb_build_object(p_campo, v_entrada),
         updated_at  = now()
   where id = p_business_id;

  if not found then
    raise exception 'negocio % nao encontrado', p_business_id;
  end if;
end $$;

revoke all on function public.registrar_procedencia(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.registrar_procedencia(uuid, text, text, text, jsonb) to service_role;

-- A leitura que o pipeline usa: "posso confiar neste número?" sem quem
-- chama conhecer o formato do jsonb.
create or replace function public.procedencia_do_campo(
  p_business_id uuid,
  p_campo       text
) returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(procedencia -> p_campo ->> 'origem', 'desconhecida')
    from public.businesses where id = p_business_id;
$$;

grant execute on function public.procedencia_do_campo(uuid, text) to authenticated, service_role;

-- `atualizado_em` por gatilho. Existe porque no Oregon NÃO havia gatilho
-- nenhum e o campo dependia de a aplicação lembrar — campo de data que
-- depende de alguém lembrar congela em silêncio, sem erro.
create or replace function public.set_atualizado_em()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['pessoas_do_negocio','identidade_visual','narrativa_negocio'] loop
    execute format('drop trigger if exists %1$s_atualizado_em on public.%1$I', t);
    execute format('create trigger %1$s_atualizado_em before update on public.%1$I for each row execute function public.set_atualizado_em()', t);
  end loop;
end $$;
