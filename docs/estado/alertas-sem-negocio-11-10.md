# Avisos sem negócio identificável — 11/10/2026

## 0. Ainda pendente

- Provar a tela com sessão sem negócio e com falha de leitura no ambiente QA, atualmente pausado.

## Correção local

`estadoDoCliente` retorna `negocioId: null` tanto quando ainda não há negócio quanto quando a leitura da empresa falha. `/alertas` agora interrompe a consulta de avisos nesse caso e oferece o seletor de negócios, sem afirmar “Tudo em dia” para um negócio que não conseguiu identificar.

## Verificação

`pnpm typecheck` e `pnpm build` passaram com o dev parado. Os 3 testes de regras de pendências de avisos passaram. Não houve clique autenticado ou banco QA nesta rodada.
