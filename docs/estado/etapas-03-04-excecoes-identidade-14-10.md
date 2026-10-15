# Etapas 03 e 04 — conferência de identidade, 14/10/2026

## 0. Aberto

- As declarações abaixo registram o motivo da autorização; o conferidor não prova a semântica do código nem substitui o ensaio autenticado no QA.
- A suíte completa ainda para em `conferir:migrations` pelas divergências do schema vivo descritas em `multiconta-pagina-compartilhada-14-10.md`.

## Trabalho local

- `conferir:identidade` encontrou cinco rotas que usam IDs recebidos na requisição sem declaração na lista de exceções. Revisei os portões antes de declarar: duas rotas deste lote (variações da marca e materiais do gestor) e três filas antigas do operador (compras, criativos e tarefas).
- `lib/seguranca/excecoes.ts` agora explicita posse no envio/remoção de variações e papel de operador nas quatro telas internas. A rota nova da marca confere o papel antes de ler `params.id` e criar o cliente admin; a remoção de variação reconfere o negócio ativo e filtra também `business_id`.

## Conferências

- `pnpm conferir:identidade`: 6/6, com 17 exceções declaradas; o resultado confirma cobertura da lista, não autorização real em produção.
- `pnpm typecheck`: passou.
- `pnpm conferir:multiconta`: 28/28; `pnpm conferir:onboarding-preservacao`: 69/69.

Sem commit, push, deploy, migração ou escrita na Meta.
