# Paginação da fila de criativos — 11/10/2026

## 0. Limites

- Implementação somente local. Não foi testada com sessão autenticada nem no Supabase de QA, que segue pausado para priorizar o V2G Finance.
- A paginação por deslocamento pode mudar se peças forem decididas enquanto o operador navega. O total e os controles são recalculados a cada abertura; um link direto para a peça continua independente da página.
- Não houve commit, push, deploy, migration nem escrita na Meta.

## Correção

- A fila de revisão não para mais nas 100 peças pendentes mais antigas. Há páginas de 100 com ordem estável por data e ID, total da consulta e links anterior/próximo preservando o filtro do negócio.
- `?peca=<id>` continua buscando a peça exata, inclusive no histórico após uma decisão. Página inválida retorna à primeira com aviso; página que ficou além do total aponta de volta ao início.
- O limite técnico de 1.000 páginas é explícito; se for alcançado, a tela orienta filtrar por negócio. A aprovação interna continua separada da publicação manual.

## Evidência

- `pnpm conferir:revisao-criativos`: 7/7, incluindo faixa 1–100, 101–200, limites e parâmetros inválidos.
- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check`: passaram.
- Não há prova de navegação autenticada ou consulta real além de 100 registros.
