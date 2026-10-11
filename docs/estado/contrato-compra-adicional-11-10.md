# Contrato na carteira após compra adicional — 11/10/2026

## 0. Ainda pendente

- Ver a ficha em uma sessão autenticada com dois pedidos do mesmo negócio. O QA segue pausado; esta correção existe somente no código local.
- Minuta jurídica e assinatura real continuam sem aprovação ou integração concluída.

## Correção

Se um negócio tinha pedido aprovado com documento registrado e abriu outra compra ainda pendente, o cálculo do portfólio buscava o contrato pelo pedido mais novo e perdia o estado anterior. O campo calculado agora usa o pedido aprovado mais recente. Esse campo ainda não é exibido na carteira; a tela de contratações é a fonte operacional visível. O novo pedido continua pendente e não é tratado como pagamento aprovado.

## Verificação

`node --test scripts/conferir-gestor.mjs`: 26/26, inclusive compra aprovada assinada seguida de pedido adicional pendente. `pnpm typecheck` e `pnpm build` passaram com o dev parado. Não houve consulta de assinatura externa.
