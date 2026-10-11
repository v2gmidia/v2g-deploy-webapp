# Fila de responsáveis com consulta parcial — 11/10/2026

## 0. Pendência

Conferir a tela com operador autenticado e mais de 1.000 atribuições no banco QA quando ele voltar. O resultado aqui é local; não comprova RLS nem paginação real.

## Falha e correção

A fila de tarefas lê no máximo 1.000 atribuições. Quando chegava ao limite, uma conta cuja atribuição ficou fora do recorte podia aparecer como “sem responsável”, com ação **Assumir conta**. A ação do servidor faz conferências próprias, mas a interface orientava uma decisão usando ausência não comprovada.

Com consulta parcial, a lista de contas sem responsável deixa de ser apresentada e a tela pede a abertura da conta específica para conferir. Uma tarefa atribuída ao operador, mas com atribuição da conta fora do recorte, passa a indicar responsabilidade **não confirmada**, em vez de afirmar que ele perdeu a conta. Na consulta completa, a lista continua funcionando.

## Verificação

- `node --test scripts/conferir-gestor.mjs`: 26/26. Cenário com atribuições completas lista somente a conta realmente sem responsável; consulta parcial não oferece nenhuma como vaga.
- `pnpm typecheck` e `pnpm build` com servidor de desenvolvimento parado: passaram.
- Interface autenticada e banco QA: não verificados, pois o QA está pausado.

Sem alteração de permissões, deploy ou migration.
