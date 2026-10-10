# Tarefas do gestor — correções locais de 10/10/2026

## 0. O que ainda precisa de prova

- Percorrer `/gestor/tarefas?negocio=<id>` com operador autenticado, inclusive uma conta fora das primeiras 1.000 linhas da carteira. O build não prova essa navegação nem o banco QA.
- Verificar no banco QA que uma tarefa manual com o mesmo título e tipo não impede a criação da pendência inicial com ID determinístico.
- As correções estão somente no checkout local; não foram publicadas em QA ou produção.

## Mudanças

- A preparação consulta os IDs determinísticos das três pendências iniciais. Antes, uma tarefa manual com o mesmo título e tipo podia ocultar uma pendência ainda não criada. Um ID ocupado por conteúdo divergente interrompe a preparação com erro explícito.
- O link direto para tarefas de um negócio consulta esse ID no banco. Antes, o negócio precisava constar nas primeiras 1.000 linhas da carteira geral para que sua página de tarefas abrisse.
- Nenhuma destas mudanças confirma reunião, pagamento, assinatura ou publicação.

## Verificação local

- `pnpm conferir:tarefas-gestor`: 4/4.
- `pnpm typecheck` e `pnpm build`: passaram. Nenhum servidor dev escutava nas portas 3000/3001 antes do build.
- Interface autenticada, banco QA e produção: não verificados neste lote.
