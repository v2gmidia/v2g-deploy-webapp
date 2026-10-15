# Etapa 04 — ajuste das contas exige confirmação do valor exibido

## 0. Aberto

- Falta percorrer a etapa de contas com cliente autenticado no QA, incluindo ajuste manual de custo e valor a manter. Nada foi publicado neste bloco.

## Achado

Na tela de confirmação, “não, deixa eu ajustar” enviava o novo número já com `confirmando: true`. A action aceitava qualquer número no pedido de confirmação, mesmo diferente da estimativa que o cliente tinha visto, e o gravava como valor confirmado.

## Ajuste local

- Um ajuste digitado agora vira nova proposta ainda não confirmada. A tela apresenta o número atualizado e pede a confirmação explícita no passo seguinte.
- A action só grava custo ou valor a manter como confirmado quando o número recebido coincide com a proposta pendente no registro do negócio. Uma aba antiga ou chamada alterada não consegue confirmar outro valor.

## Conferência

- `pnpm typecheck` passou.
- 72 testes locais de preservação do onboarding passaram, incluindo ajuste de custo e tentativa de confirmar lucro diferente do exibido.

Sem alteração de banco, evento externo, commit, push ou deploy.
