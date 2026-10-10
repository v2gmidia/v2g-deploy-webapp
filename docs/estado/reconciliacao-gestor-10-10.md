# Retomada da revisão de peças e carteira degradada — 10/10/2026

## 0. Provas ainda abertas

- A interface autenticada de cliente e dois gestores não foi percorrida. O navegador recusou `http://localhost:3000/entrar` por política de URL e proibiu contorno por outro navegador ou comando. Nenhuma Server Action foi verificada por clique. As fixtures temporárias preparadas para esse ensaio foram removidas do QA.
- O QA de checkout não replica todo o schema de operações. A carteira `/gestor` pode depender de outras tabelas ainda ausentes; o build não prova que ela abre autenticada nesse ambiente.
- O quadro FigJam de outubro retornou limite de chamadas do plano Starter nesta rodada. Nenhum estado do Figma foi alterado.

## Reconciliação da peça

- `sincronizarTarefaDeRevisao` usa a solicitação como fonte: cria a tarefa interna ausente com ID determinístico, confere a identidade em chamadas repetidas, atribui a pendência aberta ao gestor atual e a encerra quando já existe decisão. A função é chamada após o envio e após a decisão.
- A fila de criativos oferece **Conferir tarefa interna** ao gestor responsável para retomar uma falha parcial sem repetir a decisão. A action verifica papel e responsabilidade. O link da tarefa aponta para a peça específica, mesmo quando ela estaria fora da página inicial da fila.
- Isso não publica campanha nem envia aviso externo. Aprovar uma peça continua significando apenas aptidão para publicação manual.

## Carteira do gestor

- Falha na consulta de `execucoes` não derruba mais cadastro, pedidos, contas e tarefas da carteira. A página mostra aviso de fonte indisponível, oculta o filtro por campanhas e evita dizer que nenhuma execução existe. Estados da Meta não são inferidos.
- O conferidor existente `scripts/conferir-gestor.mjs` não executava no Node por dois imports relativos sem extensão em `portfolio.ts`. Os imports foram corrigidos para `.ts`, sem mudar as regras de negócio.

## Evidência

- Função real contra Supabase QA: inserção falha uma vez e é retomada; chamada duplicada mantém uma tarefa; conta sem gestor recebe atribuição posterior; tarefa aberta acompanha troca entre dois gestores; decisão repetida mantém conclusão; decisão anterior à tarefa cria a pendência já concluída. `scripts/qa-tarefas-gestor.mjs` passou e removeu suas fixtures.
- `pnpm conferir:revisao-criativos`: 5/5; `pnpm conferir:tarefas-gestor`: 4/4; `scripts/conferir-gestor.mjs`: 15/15 após correção dos imports. `pnpm conferir:multiconta`: 12/12; `pnpm conferir:onboarding-preservacao`: 33/33.
- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check` passaram. A suíte completa continua com bloqueio anterior de migrations divergentes; nenhuma migration foi executada nesta rodada.
- Código somente local. Nenhum commit, push, deploy, pagamento, reserva, nota ou escrita na Meta.
