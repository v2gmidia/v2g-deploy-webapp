# Preparação da primeira reunião na fila do gestor — 09/10/2026

## 0. Dependências para validar

- Percorrer `/gestor/tarefas?negocio=<id>` com uma sessão real de operador, conta atribuída e banco completo. O botão novo ainda não foi testado na interface autenticada.
- A preparação não consulta nem confirma agenda, acesso concedido, contrato assinado ou publicação na Meta. A transferência de tarefas se o gestor responsável mudar segue sem fluxo próprio.

## O que mudou

- Quando uma conta já tem gestor responsável, a página de tarefas oferece **Criar pendências iniciais**. A ação registra avaliação do Instagram antes da chamada, conferência de acessos e definição do primeiro criativo. Não define prazo sem reunião confirmada.
- Cada pendência tem ID estável por negócio e tipo. Repetir o botão consulta as tarefas existentes e não cria outra cópia; se uma gravação falhar no meio, a resposta pede conferir a fila e uma repetição completa somente o que faltar.
- A action verifica novamente operador autenticado, negócio real e responsável antes de usar a escrita interna. O botão não altera serviços externos.

## Evidência

- `corepack pnpm typecheck`: passou.
- `corepack pnpm conferir:tarefas-gestor`: 3/3, incluindo IDs estáveis e três tarefas específicas.
- `node --env-file-if-exists=.env.local scripts/qa-tarefas-gestor.mjs`: no projeto Supabase QA nomeado, criou as três tarefas atribuídas, confirmou bloqueio de ID repetido e os controles de leitura/escrita anteriores. A consulta posterior encontrou zero negócios e zero tarefas da fixture.
- `corepack pnpm build`: passou sem servidor dev na porta 3000.
- Esses testes não exercem o clique nem a action sob uma sessão de navegador. Nenhuma migration, publicação, cobrança ou escrita na Meta foi feita neste lote.
