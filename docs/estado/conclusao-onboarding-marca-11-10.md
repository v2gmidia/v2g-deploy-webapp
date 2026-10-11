# Conclusão do onboarding exige a marca — 11/10/2026

## 0. Dependência humana

- Percurso autenticado e persistência real permanecem sem prova. O Supabase de QA está pausado e não foi acessado nesta sessão.

## Defeito e correção local

`app/(fluxo)/onboarding/marca/actions.ts` considerava o onboarding concluído quando havia `conclusao`, perguntas básicas e contas, mesmo se o bloco `marca` estivesse ausente ou incompleto. A tela final então oferecia o próximo passo sem a resposta visual ou sem a declaração de que não há site.

O veredito agora mora em `lib/onboarding/conclusao.ts` e é usado pela etapa da marca, pela entrada `/inicio` e pela carteira `/gestor`. Exige o bloco da marca, descrição ou escolha explícita de “não sei”, e consistência entre site salvo e “não tenho site”. Quando um registro antigo tem marcador de conclusão mas ainda falta dado, `/inicio` manda para a etapa certa (perguntas, contas ou marca), `/onboarding/concluido` não oferece a agenda e a carteira não informa que o onboarding terminou. Se houver site salvo junto com a escolha contraditória “não tenho site”, o cliente pode desmarcá-la na tela para corrigir. A correção não grava dados nem cria reserva por si só.

## Provas e limites

- `node --test scripts/conferir-onboarding-preservacao.mjs scripts/conferir-gestor.mjs`: 54/54, inclusive conclusão antiga sem marca, marca incompleta, carteira sem falsa conclusão e recuperação de site contraditório.
- `pnpm typecheck` e `pnpm build`: passaram com o servidor local parado.
- `git diff --check`: sem erro de whitespace.
- Somente código local. QA, interface autenticada e Figma não foram verificados.
