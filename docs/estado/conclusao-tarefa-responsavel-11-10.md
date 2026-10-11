# Conclusão de tarefa após mudança de gestor — 11/10/2026

## 0. Pendências e limite

- Somente código local; sem sessão autenticada ou banco QA nesta rodada. O projeto QA permanece pausado enquanto Victor prioriza o V2G Finance.
- A conferência de responsabilidade e a atualização da tarefa são duas operações no banco; uma troca simultânea entre elas ainda exige operação transacional no banco para garantia estrita. Nenhuma migration foi criada ou aplicada.
- A transferência de tarefas abertas ao novo gestor continua sem fluxo próprio. Tarefas com atribuição antiga ficam visíveis na fila da equipe, mas não podem ser concluídas pelo antigo gestor por este caminho.

## Correção

- A ação de concluir tarefa agora consulta o responsável atual da conta e exige que ele seja o operador autenticado, além de exigir que a tarefa esteja aberta e atribuída a esse operador.
- A tela omite o formulário de conclusão quando a atribuição da conta diverge e explica ao operador por que ele deve conferir a responsabilidade.
- A regra não se aplica a revisão de peça: a decisão continua na fila de criativos, que já confere o gestor responsável.

## Evidência

- `pnpm conferir:tarefas-gestor`: 5/5, incluindo tarefa aberta, concluída, atribuída a outro operador e conta transferida.
- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check`: passaram.
- O teste real de transferência e conclusão autenticada fica pendente de um ambiente QA disponível.
