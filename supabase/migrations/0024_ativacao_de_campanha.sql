-- ============================================================
-- A ATIVAÇÃO DE CAMPANHA — o carimbo de quem tirou do pausado.
--
-- Contexto: até aqui TUDO que a V2G cria no Meta nasce `PAUSED`, e não
-- existe caminho de código que ative (`lib/meta/publicar.ts`, invariante
-- 1). Ativar passa a existir, operado SÓ pelo time. Como a ação gasta
-- dinheiro de terceiro, ela precisa deixar rastro com dono.
--
-- O molde é `propostas_de_perfil` (migration 0012): carimbo de tempo e
-- carimbo de pessoa, amarrados por CHECK para que nunca exista um sem o
-- outro.
-- ============================================================

-- ------------------------------------------------------------
-- 1. As duas colunas do carimbo
-- ------------------------------------------------------------
alter table public.campaigns
  add column if not exists ativada_em  timestamptz,
  add column if not exists ativada_por text,
  add column if not exists pausada_em  timestamptz,
  add column if not exists pausada_por text,
  add column if not exists ativando_em timestamptz;

comment on column public.campaigns.ativada_em is
  'Quando a campanha foi tirada de PAUSED na Meta, pela ULTIMA vez. Nulo = nunca foi ativada.';
comment on column public.campaigns.ativada_por is
  'Quem ativou — o e-mail do operador, nao um uuid. Ver 0012 para o mesmo padrao em propostas_de_perfil.aplicada_por.';
comment on column public.campaigns.pausada_em is
  'Quando a campanha foi pausada pela ULTIMA vez. Nulo = nunca foi pausada por nos.';
comment on column public.campaigns.pausada_por is
  'Quem pausou. Mesmo formato de ativada_por.';
comment on column public.campaigns.ativando_em is
  'Quando a ativacao COMECOU. E a trava de concorrencia: ver o bloco dela nesta migration.';

-- ============================================================
-- OS QUATRO CAMPOS CONVIVEM, E CADA PAR CONTA A SUA HISTORIA.
--
-- Ativar e pausar nao se apagam: uma campanha ativada em segunda, pausada
-- em quarta e reativada em sexta tem os quatro preenchidos, e a leitura
-- correta e pela COMPARACAO das duas datas, nao pela presenca de uma:
--
--     ativada_em > pausada_em   -> rodando agora
--     pausada_em > ativada_em   -> parada, ja rodou
--     ativada_em sem pausada_em -> rodando desde a primeira vez
--     nenhuma das duas          -> nunca saiu do pausado
--
-- Cada par guarda a ULTIMA vez, nao a primeira. O historico completo de
-- idas e voltas vive em `decisions`, que registra cada chamada.
-- ============================================================

-- ------------------------------------------------------------
-- 2. O domínio de `publish_state` ganha os dois estados novos
-- ------------------------------------------------------------
-- ============================================================
-- POR QUE AQUI, E NÃO NUMA COLUNA NOVA.
--
-- `campaigns` já tem TRÊS colunas de estado: `status` (texto livre, sem
-- domínio), `meta_status` (o `effective_status` cru da Meta) e
-- `publish_state` (a nossa máquina de estados, com domínio fechado desde
-- a 0008). Uma quarta coluna só para "ativa" seria a quinta fonte a falar
-- da mesma coisa.
--
-- `publish_state` já é a leitura NOSSA do ciclo de vida da publicação, e
-- ativar é o degrau seguinte de `published`:
--
--     draft -> publishing -> published -> ativa -> pausada -> ativa -> ...
--
-- `published` continua querendo dizer "os objetos existem no Meta,
-- pausados", que é o que ele sempre quis dizer. Nada do que já está
-- escrito muda de sentido.
-- ============================================================
alter table public.campaigns
  drop constraint if exists campaigns_publish_state_check;
alter table public.campaigns
  add constraint campaigns_publish_state_check
  check (publish_state in ('draft', 'publishing', 'published', 'failed',
                           'ativando', 'ativa', 'pausada'));

-- ------------------------------------------------------------
-- 3. O CHECK do carimbo — e ele NÃO é cópia literal da 0012
-- ------------------------------------------------------------
-- ============================================================
-- A 0012 ESCREVE ISTO, E AQUI ELE NÃO SERVE:
--
--     check ((estado = 'aplicada') = (aplicada_em is not null
--                                     and aplicada_por is not null))
--
-- Aquele `=` é bidirecional, e funciona lá porque `aplicada` é ESTADO
-- TERMINAL: uma proposta aplicada não volta a ser aberta.
--
-- Ativação não é terminal. O caminho de volta existe e é obrigatório
-- (pausar). Uma campanha ativada e depois pausada tem `publish_state =
-- 'pausada'` E `ativada_em` preenchido — e a versão bidirecional
-- REPROVARIA essa linha, tornando impossível pausar o que foi ativado.
-- O CHECK proibiria justamente o freio.
--
-- Então a garantia vira duas, as duas unidirecionais, e juntas elas dizem
-- o mesmo que a 0012 queria dizer:
-- ============================================================

-- 3.1 O carimbo nunca é escrito pela metade. "Quando" sem "quem" é um
--     registro que não responde a pergunta que a auditoria faz.
alter table public.campaigns
  drop constraint if exists campaigns_ativacao_carimbada_check;
alter table public.campaigns
  add constraint campaigns_ativacao_carimbada_check
  check ((ativada_em is null) = (ativada_por is null));

-- 3.2 Estar ativa EXIGE carimbo de ativacao. A volta não vale: pausada
--     com carimbo de ativacao é o estado normal de quem já rodou e parou.
alter table public.campaigns
  drop constraint if exists campaigns_ativa_exige_carimbo_check;
alter table public.campaigns
  add constraint campaigns_ativa_exige_carimbo_check
  check (publish_state <> 'ativa'
         or (ativada_em is not null and ativada_por is not null));

-- 3.3 O carimbo de PAUSA, com a mesma disciplina dos dois acima: nunca
--     pela metade, e estar pausada exige o par preenchido.
alter table public.campaigns
  drop constraint if exists campaigns_pausa_carimbada_check;
alter table public.campaigns
  add constraint campaigns_pausa_carimbada_check
  check ((pausada_em is null) = (pausada_por is null));

alter table public.campaigns
  drop constraint if exists campaigns_pausada_exige_carimbo_check;
alter table public.campaigns
  add constraint campaigns_pausada_exige_carimbo_check
  check (publish_state <> 'pausada'
         or (pausada_em is not null and pausada_por is not null));

-- ------------------------------------------------------------
-- 4. A TRAVA DE CONCORRÊNCIA
-- ------------------------------------------------------------
-- ============================================================
-- A TRAVA NÃO É O ÍNDICE. É O `UPDATE` CONDICIONAL.
--
-- Um índice único parcial sobre `campaigns(id)` não trava nada: `id` já é
-- chave primária, então ele seria único de qualquer jeito. E o predicado
-- de um índice parcial não pode olhar outra tabela, então "campaign_id
-- sem `decisions` fechado" não é expressável como índice.
--
-- O que trava de verdade é uma troca condicional de estado, feita pelo
-- próprio banco, em uma instrução:
--
--     update campaigns
--        set publish_state = 'ativando', ativando_em = now()
--      where id = ?
--        and publish_state in ('published', 'pausada')
--
-- Dois operadores clicando junto disputam a MESMA linha. O Postgres
-- serializa: o primeiro muda o estado, o segundo encontra `publish_state`
-- já em 'ativando' e a condição do `where` não casa — ele afeta ZERO
-- linhas e sabe disso pela contagem. Não há janela entre ler e escrever,
-- porque não há leitura separada.
--
-- POR QUE ISTO É SUFICIENTE, e o `lib/meta/publicar.ts` não é.
-- Lá a camada 3 LÊ `publish_state === 'publishing'` e desiste
-- (`publicar.ts:290-301`). Entre a leitura e a escrita existe uma janela,
-- e duas chamadas simultâneas podem passar as duas. Lá isso custa objeto
-- órfão pausado, que não gasta. Aqui custaria duas ativações, e a segunda
-- chamada ao Meta num objeto que já está ACTIVE — este arquivo não pode
-- se dar ao luxo daquela janela.
--
-- `ativando_em` existe para o destravamento: uma ativação que morreu no
-- meio (processo caiu, deploy no meio da chamada) deixaria a campanha
-- presa em 'ativando' para sempre. Passado o teto de tempo, a próxima
-- tentativa retoma — é o mesmo remédio do `publish_started_at`.
--
-- O ÍNDICE ABAIXO NÃO TRAVA: ele só torna barata a pergunta "tem alguma
-- ativação presa?", que é o que a tela do operador precisa para mostrar
-- e para destravar.
-- ============================================================
create index if not exists campaigns_ativando_idx
  on public.campaigns (id)
  where publish_state = 'ativando';

-- ------------------------------------------------------------
-- 5. O índice da fila do operador
-- ------------------------------------------------------------
-- A tela do time pergunta "o que está publicado esperando ativação?".
-- Parcial porque só essas linhas interessam — as outras nunca entram na
-- fila.
create index if not exists campaigns_esperando_ativacao_idx
  on public.campaigns (business_id, published_at desc)
  where publish_state in ('published', 'pausada');

-- ============================================================
-- O QUE ESTA MIGRATION NÃO FAZ, e é decisão, não esquecimento:
--
-- 1. NÃO guarda o HISTÓRICO de idas e voltas. Os quatro carimbos
--    respondem "quando foi a última vez, e por quem" — não "quantas vezes
--    já foi ativada". Quem tem a sequência inteira é `decisions`, uma
--    linha por chamada. Se um dia a pergunta virar "quantas vezes esta
--    campanha parou no mês", a resposta sai de lá, não daqui.
--
-- 2. NÃO mexe em RLS. As quatro políticas de `campaigns` continuam por
--    posse (`owns_business`), e o operador não possui o negócio do
--    cliente — ele não enxerga essas linhas sob RLS normal. Quem resolve
--    isso é a trava de identidade do Bloco 2, à mão, com cliente admin.
--    Abrir política por papel aqui seria dar ao operador acesso a TODA
--    campanha de TODO cliente no nível do banco, que é mais do que a
--    tela precisa.
-- ============================================================
