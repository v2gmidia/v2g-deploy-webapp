-- ============================================================
-- REGISTRAR QUE A REUNIÃO ACONTECEU, SEM COLAR A TRANSCRIÇÃO.
--
-- `entrevistas` (migration 0010) já é exatamente "reunião com data e
-- condutor": tem `realizada_em` e `conduzida_por`. O que impedia usá-la
-- para marcar a etapa do cliente era uma linha:
--
--     transcricao text not null
--
-- Quem marca "a reunião foi feita" logo depois da call não tem a
-- transcrição em mãos — ela chega depois, quando chega. Exigir as duas
-- coisas juntas faz a marca esperar pelo documento, e o cliente fica
-- vendo "reunião pendente" numa reunião que já aconteceu.
--
-- Medido em 23/09/2026: NENHUMA linha do webapp escreve nesta tabela
-- (as três referências em `lib/agentes/proposta.ts:62`,
-- `lib/agentes/revisao.ts:84` e `lib/perfil/revisao-cliente.ts:160` são
-- `select`), e o backend também não. A tabela existe, e a porta de
-- entrada nunca foi construída.
-- ============================================================

alter table public.entrevistas
  alter column transcricao drop not null;

comment on column public.entrevistas.transcricao is
  'A transcricao da reuniao. NULO e estado valido: a reuniao foi registrada antes de a transcricao existir. Quem consome ja se defende disso — ver extrairPerfil().';

-- ============================================================
-- POR QUE NÃO PRECISA DE DEFESA NOVA DO LADO DE QUEM LÊ.
--
-- O único consumidor que depende do conteúdo é `extrairPerfil()`
-- (`lib/agentes/extrair-perfil.ts:97-100`), e ele já trata o caso:
--
--     const transcricao = pedido.transcricao?.trim() ?? "";
--     if (transcricao.length < MINIMO_DE_TRANSCRICAO) {
--       return falha("transcricao_vazia");
--     }
--
-- `null` vira `""`, cai no piso, e a recusa tem frase escrita:
-- "Essa entrevista não tem transcrição suficiente para extrair nada."
-- (`lib/agentes/erros.ts:67-68`). Ou seja: extrair perfil de uma reunião
-- sem transcrição já era um caminho previsto e nomeado; esta migration
-- só torna esse estado alcançável pelo banco.
--
-- Os outros dois leitores pedem `realizada_em`, não a transcrição.
-- ============================================================

-- ============================================================
-- O QUE ESTA MIGRATION NÃO FAZ:
--
-- NÃO exige que algo seja preenchido no lugar. Nada de
-- `check (transcricao is not null or anotacoes_numeros is not null)` — o
-- caso que ela existe para permitir é justamente o registro mínimo:
-- "a reunião aconteceu nesta data, conduzida por esta pessoa", e nada
-- mais. Obrigar um substituto recriaria o problema com outro nome.
-- ============================================================
