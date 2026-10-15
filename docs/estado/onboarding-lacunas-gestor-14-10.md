# Etapa 04 — lacunas na conversa do gestor, 14/10/2026

## 0. Aberto

- A ficha interna precisa ser conferida no QA autenticado após publicação manual. O teste local valida a seleção das lacunas, não o que aparece numa reunião real.
- A etapa 04 segue aberta: perguntas guiadas, três contas, materiais de marca e agenda autenticada ainda requerem trabalho e prova. A etapa 03 segue pendente de ensaio autenticado com dois CNPJs.

## Trabalho local

- A ficha “Preparar conversa com o cliente” agora destaca somente pontos que o cliente deixou explicitamente para conferir: comprador, necessidade, entrega e diferencial. Uma resposta ainda ausente não é tratada como uma declaração de “não sei”.
- A antiga resposta sobre o primeiro anúncio aparece apenas quando existe no histórico e é identificada como histórica. O gestor continua responsável por decidir o foco com o cliente; clientes novos não recebem essa pergunta.
- Nenhuma informação foi inferida ou enviada para a agenda.

## Conferências

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-onboarding-preservacao.mjs`: 67/67 passaram, incluindo lacuna explícita e sua remoção depois de o cliente responder.
- `git diff --check`: passou, com avisos de finais de linha.

Sem commit, push, deploy, migração ou escrita na Meta.
