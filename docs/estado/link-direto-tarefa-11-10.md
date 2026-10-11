# Link direto para tarefa do gestor — 11/10/2026

## 0. Limites

- Implementação apenas local. Não houve navegação autenticada nem teste no banco QA, que permanece pausado enquanto Victor prioriza o V2G Finance.
- Nenhum commit, push, deploy, migration ou ação externa nesta rodada.

## Correção

- Cada tarefa comum na fila pessoal agora aponta para a tarefa específica em `/gestor/tarefas?negocio=...&tarefa=...`.
- A tela valida os dois identificadores e consulta a tarefa junto com o negócio. O link continua mostrando o estado real caso a tarefa tenha sido concluída depois de gerar a fila.
- Se a tarefa não existir naquela conta, a tela mostra “não encontrada”, sem exibir outra tarefa com título semelhante. A navegação normal por filtros continua quando não há `tarefa` na URL.
- Tarefas de revisão de criativo continuam apontando diretamente para a peça, onde a decisão é registrada.

## Evidência

- `scripts/conferir-gestor.mjs`: 18/18, incluindo URL da tarefa específica, isolamento entre contas e operadores e deduplicação da revisão.
- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check`: passaram.
- A renderização autenticada e a consulta real por ID seguem sem prova nesta rodada.
