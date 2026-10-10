# Fila pessoal do gestor — 10/10/2026

## 0. Pendências e limites

- A fila foi implementada somente no código local. Não houve commit, deploy nem teste de navegação autenticada. A ferramenta de navegador recusou anteriormente a abertura do localhost por política de URL; a restrição foi respeitada.
- A seção depende de `V2G_MANAGER_WORK_ENABLED=true`. A revisão de peças depende também de `V2G_CREATIVE_REVIEW_ENABLED=true`.
- Não foi possível atualizar o board do Figma nesta rodada: o conector havia atingido o limite do plano na consulta anterior. Manter o status como **código local**, sem marcar como publicado.

## Entrega

- `/gestor` reúne peças aguardando decisão e tarefas abertas das contas atribuídas ao operador autenticado. Peças continuam visíveis mesmo se a gravação da tarefa correspondente falhou.
- Quando a peça também tem tarefa interna, ela aparece uma vez; a decisão continua sendo registrada na fila de criativos. Tarefas atribuídas a outro operador e contas de outro gestor não entram na fila pessoal.
- A ordem destaca peças, depois tarefas vencidas ou sem responsável. Cada item aponta para a fila da conta; peças apontam para a solicitação exata.
- Se qualquer fonte necessária falhar ou atingir o limite da consulta, a seção mostra indisponibilidade e encaminha às filas específicas, sem afirmar que não existem pendências.
- A lista não lê resultados da Meta, reserva, pagamento nem assinatura e não infere campanha publicada.

## Verificação

- `scripts/conferir-gestor.mjs`: 17/17, incluindo isolamento entre contas e operadores, peça sem tarefa, deduplicação e prioridade.
- `pnpm typecheck`, `pnpm build` com servidor dev parado e `git diff --check`: passaram.
- Banco QA e interface autenticada desta seção: **não verificados**. O teste de integração de criação e retomada de tarefas no Supabase QA está registrado em `reconciliacao-gestor-10-10.md`; não cobre a renderização desta fila.
