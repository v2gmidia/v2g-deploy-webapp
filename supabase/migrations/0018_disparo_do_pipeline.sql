-- 0018 — O estado do disparo do pipeline, em `businesses`.
--
-- Desenho em docs/disparo-pipeline.md. Estas três colunas são a camada 1
-- da idempotência (§4.1): sem elas, um clique duplo cria duas execuções no
-- backend, e execução criada pode ser consumida pelo n8n e virar gasto de
-- LLM e de imagem.
--
-- POR QUE EM `businesses` E NÃO EM `execucoes`: a linha de `businesses`
-- existe ANTES da chamada; a de `execucoes` só depois dela. Uma trava que
-- mora na linha que ainda não existe não é trava.

alter table public.businesses
  add column if not exists cadastro_estado text
    check (cadastro_estado in ('enviando', 'enviado', 'falhou')),
  add column if not exists cadastro_iniciado_em timestamptz,
  add column if not exists cadastro_erro text;

comment on column public.businesses.cadastro_estado is
  'Disparo do POST /cadastro. NULL = nunca disparou. Ver docs/disparo-pipeline.md §4.';
comment on column public.businesses.cadastro_iniciado_em is
  'Quando a tentativa em curso começou. Base da trava de 2 min (§4.3).';
comment on column public.businesses.cadastro_erro is
  'Mensagem em português da última falha, já traduzida por lib/backend/erros.ts.';

-- Índice parcial: a varredura de "quem ficou preso em enviando" e a de
-- órfãs só olham as linhas que têm estado. As demais (a maioria, para
-- sempre) não entram no índice.
create index if not exists businesses_cadastro_estado_idx
  on public.businesses (cadastro_estado, cadastro_iniciado_em)
  where cadastro_estado is not null;

-- ============================================================
-- O QUE ESTA MIGRATION **NÃO** FAZ, e é decisão, não esquecimento.
-- ============================================================
--
-- 1. NÃO cria política de RLS em `public.execucoes`.
--
--    A tabela continua com RLS ligada e ZERO políticas — `default deny`,
--    só `service_role` alcança. Chegou a ser proposta uma política de
--    SELECT (`using (private.owns_business(business_id))`) para o cliente
--    dono ler a própria execução. A auditoria de 19/08/2026 recusou:
--    docs/auditoria-resultados.md.
--
--    O motivo curto: `resultados` mistura texto escrito PARA o cliente
--    ("você fica sem margem se a conversão cair") com raciocínio interno
--    sobre ele ("descrição é curta e vaga") e com estratégia de nicho
--    ("brecha explorada"), no mesmo jsonb, sem nenhuma marca que separe.
--    E saída de mock convive com saída real distinguível só por um
--    prefixo `[mock]` dentro do texto.
--
--    Uma política de RLS libera a LINHA. O problema é a COLUNA. Abrir
--    SELECT aqui não resolveria o vazamento e ainda daria a impressão de
--    ter resolvido.
--
-- 2. NÃO mexe em `confirmar_campo_do_cliente` nem na lista branca da
--    0015/0016.
--
--    As colunas `cadastro_*` são escritas por `service_role`, do servidor,
--    nunca pelo cliente via RPC. Se um dia alguma delas precisar entrar na
--    lista branca, é sinal de que alguém deixou o cliente escrever estado
--    de disparo — e aí a pergunta a fazer é por quê, não como.
--
--    `scripts/conferir-lista-branca.ts` continua verde sem alteração.
