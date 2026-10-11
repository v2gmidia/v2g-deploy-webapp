# Pedidos adicionais na carteira do gestor — 11/10/2026

## 0. Prova pendente

- Falta conferir a carteira em sessão de operador com dois pedidos no mesmo negócio. O Supabase de QA permanece pausado para priorizar o V2G Finance; não foi acessado nesta rodada.
- O estado de acesso autenticado pertence ao fluxo de Auth. Esta correção classifica pedidos na carteira, sem declarar se um usuário entrou no WebApp.

## Achado e correção local

A carteira usava apenas o pedido mais novo para escolher a próxima ação. Se uma segunda conta fosse comprada e ainda aguardasse pagamento, ocultava um comprovante ou contrato pendente da compra anterior. Também dizia “acesso ainda fechado”, mesmo quando já existia uma compra aprovada ou um acesso legado.

Agora a ação procura comprovante recebido e contrato pendente em todos os pedidos vinculados ao mesmo negócio. Um pedido adicional aguardando pagamento continua visível, mas não revoga nem mascara uma aprovação anterior. Sem compra aprovada, a tela informa apenas esse fato; não infere o estado de Auth. O rótulo `pedido` ainda representa o pedido mais recente para referência e não é usado como prova de acesso.

## Verificação

- `node --test scripts/conferir-gestor.mjs`: 21/21, incluindo pedido adicional pendente com compra anterior aprovada e comprovante antigo ainda por conferir.
- `pnpm typecheck` e `pnpm build` com dev parado: passaram.
- A verificação usa fixtures e compilação local; não prova a interface autenticada nem dados reais.
