# Contratações por negócio na carteira — 11/10/2026

## 0. Prova pendente

- Abrir a carteira autenticada como operador e conferir o link com um negócio que tenha pedido direto, assistido e pedido antigo. O QA está pausado e não foi acessado.
- A tela ainda limita a 200 pedidos por negócio e avisa quando atinge esse limite; não oferece paginação completa.

## Correção local

A próxima ação de compra em `/gestor` levava a `/pedidos`, que é a operação de Pix assistido. Essa rota não representa a fila completa de contratação por API. A fila interna `/gestor/compras` inclui os dois caminhos, mas antes lia apenas os 200 pedidos mais recentes do sistema inteiro, então buscar ali um pedido antigo podia falhar.

O link da carteira agora abre `/gestor/compras?negocio=<id>`. A consulta filtra `business_id` no banco antes de aplicar o limite e busca os documentos apenas dos pedidos retornados. O identificador deve ser UUID válido; uma tentativa inválida não abre a lista geral. Busca e filtro da página preservam o negócio selecionado, e há um link explícito para voltar a todas as contratações. A autorização continua exigindo papel de operador antes da leitura administrativa.

## Verificação

- `pnpm typecheck`, `pnpm build` com dev parado e `git diff --check`: passaram.
- Sem teste autenticado ou banco nesta rodada; compilação não prova que a consulta retorna os pedidos esperados.
