# Onboarding, Início, paleta e menu multicontas — 16/10/2026

## 0. O que depende do Victor

- Revisar e publicar por commit/push manual se o lote estiver aprovado. Nenhum commit, push, merge ou deploy foi feito nesta sessão.
- Depois da publicação, repetir no QA autenticado a troca entre os dois negócios e o retorno “Já marquei meu horário”. O ensaio local não comprova o estado publicado, a sessão real nem a confirmação do Google.
- O item 2 da revisão sobre limites de imagens ficou deliberadamente intacto, conforme correção expressa do Victor.

## Escopo implementado

- A mensagem final da conversa ganhou separação clara antes de “Continuar para as contas”, sem cartão ou caixa nova.
- A paleta preserva cores já escolhidas, ordena novas sugestões priorizando a logo principal e usa fotos/aplicações como apoio. Toda cor continua removível, ajustável e dependente de confirmação manual. O tom `#F1C6BA` não recebeu origem inventada nem bloqueio específico.
- A escolha de negócio continua levando a `/inicio`. Negócios da jornada nova permanecem ali e recebem uma pendência explícita para perguntas, contas, visual da marca ou reunião, em vez de redirecionamento automático. Negócios legados fora dessa jornada não ganham pendência nova.
- O menu desktop mantém Início, Criativos, Anúncios, Avisos, Conta e o canal humano visíveis quando aberto. A própria sidebar e a lista de negócios têm rolagem local quando falta altura.
- A agenda externa oferece “Já marquei meu horário” para voltar ao Início. O texto e o estado deixam explícito que esse clique não comprova reserva no Google.

## Verificações

- `pnpm typecheck`: passou.
- `pnpm build`: passou, com 43 páginas estáticas geradas e rotas compiladas.
- `pnpm conferir:multiconta`: 28/28 testes passaram.
- `pnpm conferir:onboarding-preservacao`: 72/72 testes passaram.
- `pnpm conferir:inicio`: 39/39 conferências passaram.
- `pnpm conferir:estado`: 122 conferências passaram.
- Conferidor da paleta: 3/3 testes passaram, inclusive prioridade da logo sem apagar cor salva.
- Conferidor novo da pendência do onboarding: 3/3 testes passaram, cobrindo reunião externa pendente, reserva confirmada e respostas incompletas.
- QA visual local em 1280 × 720: menu aberto manteve os cinco destinos visíveis; a lista coube com rolagem local e não avançou sobre o conteúdo.
- QA visual local em 390 × 844: barra inferior e menu de conta permaneceram disponíveis, sem rolagem horizontal.

## Limites da prova

- A bancada local usa dados fictícios e não prova isolamento, cookie, RLS ou comportamento autenticado no QA publicado.
- Nenhuma reserva externa foi criada ou consultada. O botão apenas navega; a confirmação segue dependente de evidência do Google.
- Nenhuma migration, banco, Meta, Vercel, Easypanel ou painel do Supabase foi alterado.
