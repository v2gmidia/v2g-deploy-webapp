# Etapa 04 — escolha de atividade por toque, 14/10/2026

## 0. Aberto

- Testar no QA publicado em celular: digitar uma atividade, tocar uma sugestão e tocar “Outros”. O teste local não simula a ordem de foco e clique do navegador móvel.

## Trabalho local

- O autocomplete fechava a lista no `blur` do campo. Em telas de toque, esse evento pode ocorrer antes do clique da sugestão, fazendo a opção desaparecer. Agora a lista fecha por toque fora do componente, `Escape` ou `Tab`; tocar em uma opção mantém a lista até o clique concluir a escolha.
- A busca, a opção “Outros” e a validação da resposta continuam com as regras anteriores.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm conferir:onboarding-preservacao`: 69/69. Esses casos não testam eventos de toque reais.

Sem commit, push, deploy, migração ou escrita na Meta.
