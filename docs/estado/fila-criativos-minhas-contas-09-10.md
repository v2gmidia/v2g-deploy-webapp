# Fila de criativos por gestor — 09/10/2026

## Mudança local

- `/gestor/criativos` agora alterna entre toda a fila interna e “Minhas contas”. O segundo filtro usa as atribuições de `manager_accounts` do operador autenticado antes de consultar as peças no banco. Também funciona junto com `?negocio=` e avisa quando uma conta informada não pertence à carteira desse gestor.
- Sem contas atribuídas, a tela mostra um estado vazio explícito. Se o limite de 1.000 atribuições for alcançado, avisa que o resultado pode ser parcial. A visão completa permanece disponível aos operadores; este filtro organiza o trabalho, não substitui autorização.
- O upload do cliente continua em `creative_review_requests`; não se criou uma segunda tarefa que pudesse divergir do estado real da revisão. Decisão interna não publica campanha nem envia aviso.

## Verificação

- `node --env-file=.env.local scripts/qa-prioridade-criativos.mjs` passou no Supabase QA nomeado. Com duas contas e uma atribuição, “Minhas contas” retornou só a peça da conta atribuída; a pendência antiga continuou aparecendo antes do histórico. As fixtures sintéticas foram removidas pelo ensaio.
- `pnpm typecheck` e `pnpm build` passaram com a porta 3000 sem servidor dev no momento do build. O build foi repetido após o ajuste final do aviso e passou novamente.
- Ainda não houve percurso da interface com sessão real de operador; o ensaio valida a consulta e o isolamento dos dados, não a apresentação no navegador. A migração da fila de criativos e das atribuições continua sem aplicação em produção.
