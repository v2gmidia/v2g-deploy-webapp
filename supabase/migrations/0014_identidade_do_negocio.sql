-- ============================================================
-- 0014 — Logo e fotos de identidade do negócio
--
-- Desenho em docs/upload-identidade.md.
--
-- SEM TABELA NOVA. `creatives` já tem `business_id`, `storage_path`, RLS
-- por dono desde a 0001, e as colunas `uso` e `pessoa_id` da 0010. O que
-- o cliente manda aqui é `uso in ('logo','identidade')`.
-- ============================================================

-- ---------- 1. Arquivar sem apagar ----------
-- POR QUE COLUNA NOVA E NÃO UM VALOR EM `status`:
-- `status` é o ciclo de revisão do Meta — draft, pending_review, approved,
-- rejected, paused. São estados de UMA peça diante da plataforma de
-- anúncio. "Este arquivo ainda é o logo vigente?" é outra pergunta, do
-- nosso lado, e enfiar a resposta no mesmo campo faria `rejected` e
-- `removido` disputarem a mesma coluna — quando uma peça pode
-- perfeitamente ser as duas coisas.
alter table public.creatives
  add column if not exists arquivado_em timestamptz;

comment on column public.creatives.arquivado_em is
  'Quando deixou de ser o arquivo vigente. NAO apaga o objeto no storage: o arquivo continua la porque pode ter sido insumo de campanha no ar. A remocao fisica acontece so no fluxo de exclusao da LGPD, por prefixo.';

-- ---------- 2. Um logo vigente por negócio ----------
-- Trocar o logo é SUBSTITUIR, não empilhar. Sem isto, dois logos ativos
-- coexistem e a tela precisa escolher qual é o certo — decisão que ela não
-- tem como tomar. O banco recusa o segundo.
--
-- O filtro `arquivado_em is null` é o que permite a troca: o antigo sai do
-- índice ao ser arquivado, e o novo entra.
create unique index if not exists creatives_um_logo_por_negocio
  on public.creatives (business_id)
  where uso = 'logo' and arquivado_em is null;

-- ---------- 3. A consulta da tela ----------
-- "Quais são as imagens de identidade deste negócio" roda a cada
-- carregamento da /conta. Sem o índice, varre junto todas as peças de
-- campanha — que é a parte da tabela que cresce sem limite.
create index if not exists creatives_identidade_do_negocio_idx
  on public.creatives (business_id, uso, created_at desc)
  where uso in ('logo', 'identidade') and arquivado_em is null;
