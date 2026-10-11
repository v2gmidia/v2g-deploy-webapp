# Histórico de revisões do cliente — 11/10/2026

## 0. Limites

- Apenas código local. Não houve acesso ao Supabase QA pausado, navegação autenticada, commit ou deploy.
- A paginação usa deslocamento: uma nova peça pode alterar a composição das páginas enquanto o cliente navega. A consulta mantém ordem por data e ID e recalcula o total a cada abertura.

## Correção

- `/criativos` permite percorrer todo o histórico de revisões do negócio selecionado, em páginas de 30. Antes mostrava somente os 30 envios mais recentes.
- A lista continua consultada com a sessão do cliente e filtrada por `business_id`. Página inválida volta ao início com aviso; página além do histórico oferece retorno.
- A orientação ao lado da análise aponta para o formulário de revisão na própria página quando ele está habilitado. A análise automática continua separada do envio para o gestor e da publicação manual.

## Evidência

- `pnpm conferir:revisao-criativos`: 7/7, inclusive faixas de 30 e 100 itens, total e parâmetro inválido.
- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check`: passaram.
- Persistência, RLS e navegação com duas contas permanecem sem verificação nesta rodada.
