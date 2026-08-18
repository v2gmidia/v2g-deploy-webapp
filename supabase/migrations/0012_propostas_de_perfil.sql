-- ============================================================
-- 0012 — Propostas de perfil + marcação de dados fictícios
--
-- Desenho em docs/extracao-perfil.md §2 e §9.
--
-- A proposta é o que existe ENTRE a extração e a confirmação. Fica no
-- banco e não em memória porque entre uma coisa e outra passam dias: a
-- entrevista é na terça, o operador revisa na quinta, e no meio disso o
-- processo Node reinicia num deploy.
-- ============================================================

-- ---------- 1. O cabeçalho: uma extração de uma entrevista ----------
create table if not exists public.propostas_de_perfil (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  entrevista_id  uuid not null references public.entrevistas (id) on delete cascade,

  -- Daqui a seis meses a pergunta útil diante de uma proposta esquisita
  -- não é "o modelo errou", é QUAL prompt e QUAL modelo produziram isto.
  -- Sem estas duas colunas a pergunta não tem resposta.
  prompt_versao  text not null,
  modelo         text not null,

  estado         text not null default 'aberta',
  criado_em      timestamptz not null default now(),
  aplicada_em    timestamptz,
  aplicada_por   text,

  tokens_entrada integer,
  tokens_saida   integer,

  -- O que a verificação do §3(d) recusou, com motivo. Não vira item —
  -- mas some do lugar errado, não do registro.
  descartados    jsonb not null default '[]'::jsonb,

  constraint propostas_estado_check
    check (estado in ('aberta', 'aplicada', 'descartada')),
  -- Estado terminal exige carimbo. Sem isto, "aplicada" sem data é um
  -- registro que não responde quando.
  constraint propostas_aplicada_carimbada_check
    check ((estado = 'aplicada') = (aplicada_em is not null and aplicada_por is not null))
);

create index if not exists propostas_de_perfil_business_idx
  on public.propostas_de_perfil (business_id, criado_em desc);

-- UMA proposta aberta por entrevista. Clicar duas vezes em "extrair" não
-- cria duas listas divergentes da mesma conversa — que é exatamente o
-- estado em que alguém aceita metade de uma e metade da outra sem notar.
create unique index if not exists propostas_uma_aberta_por_entrevista
  on public.propostas_de_perfil (entrevista_id) where estado = 'aberta';

-- ---------- 2. O item: um campo ----------
create table if not exists public.itens_da_proposta (
  id            uuid primary key default gen_random_uuid(),
  proposta_id   uuid not null references public.propostas_de_perfil (id) on delete cascade,

  -- Só as três tabelas que têm coluna `procedencia`. `pessoas_do_negocio`
  -- fica de fora de propósito: extrair pessoa é criar LINHA, não preencher
  -- campo, e misturar as duas formas numa tabela só é o que faria a tela
  -- de revisão precisar de dois modos.
  tabela_alvo   text not null,
  campo         text not null,

  valor_proposto jsonb not null,
  confianca      text not null,
  trecho         text not null,
  trecho_verificado boolean not null default false,

  -- Números: o que a pessoa da V2G anotou à mão, quando diverge do que o
  -- agente extraiu. A anotação é `manual` e vence — quem anotou ouviu com
  -- o ouvido, não com o transcritor.
  divergencia_anotacao boolean not null default false,
  valor_anotado        jsonb,

  decisao       text not null default 'pendente',
  valor_final   jsonb,
  decidido_por  text,
  decidido_em   timestamptz,

  criado_em     timestamptz not null default now(),

  constraint itens_tabela_alvo_check
    check (tabela_alvo in ('businesses', 'identidade_visual', 'narrativa_negocio')),
  constraint itens_confianca_check
    check (confianca in ('explicito', 'inferido')),
  constraint itens_decisao_check
    check (decisao in ('pendente', 'aceito', 'corrigido', 'descartado')),

  -- `corrigido` sem valor digitado seria uma correção que não corrigiu
  -- nada; `pendente` ou `descartado` COM valor final seria um valor que
  -- ninguém escolheu esperando para ser gravado.
  constraint itens_valor_final_coerente_check
    check (
      (decisao = 'corrigido' and valor_final is not null)
      or (decisao = 'aceito')
      or (decisao in ('pendente', 'descartado') and valor_final is null)
    ),
  constraint itens_decisao_carimbada_check
    check ((decisao = 'pendente') = (decidido_em is null and decidido_por is null)),

  constraint itens_anotacao_coerente_check
    check (divergencia_anotacao = false or valor_anotado is not null),

  -- Um item por campo por proposta.
  constraint itens_campo_unico unique (proposta_id, tabela_alvo, campo)
);

create index if not exists itens_da_proposta_proposta_idx
  on public.itens_da_proposta (proposta_id);

-- Consulta da tela: "ainda falta decidir alguma coisa?"
create index if not exists itens_da_proposta_pendentes_idx
  on public.itens_da_proposta (proposta_id) where decisao = 'pendente';

-- ---------- 3. RLS: ligada, sem política nenhuma ----------
-- Ligar RLS sem criar política é NEGAR para todo mundo que não seja
-- service_role. É intencional: enquanto a tela do cliente não existe, o
-- cliente não tem o que ver aqui. Uma proposta é o palpite do agente
-- ANTES de qualquer revisão, e mostrar isso como se fosse o perfil dele é
-- o erro que este desenho inteiro existe para evitar.
alter table public.propostas_de_perfil enable row level security;
alter table public.itens_da_proposta   enable row level security;

-- RLS filtra linha; não tira o privilegio de tabela. Os dois juntos.
revoke all on public.propostas_de_perfil from anon, authenticated;
revoke all on public.itens_da_proposta   from anon, authenticated;

-- ---------- 4. Dados fictícios ----------
-- No NEGÓCIO, não na entrevista. O que contamina não é o texto que entra,
-- é o perfil que sai dele: um negócio de mentira com perfil preenchido
-- entra em contagem, em fila de operador e, no pior caso, em campanha.
-- Marcando o negócio, tudo que pendura nele herda — e toda consulta que
-- já filtra por negócio ganha o filtro de graça.
--
-- `default false`: nenhum negócio existente muda, sem backfill e sem
-- janela em que alguém real fica marcado por engano.
alter table public.businesses
  add column if not exists dados_ficticios boolean not null default false;

comment on column public.businesses.dados_ficticios is
  'Negocio de teste. lib/meta/publicar.ts recusa a cadeia quando true. Apagar o negocio apaga o subtree por cascade — nao se apaga entrevista, que e append-only.';
