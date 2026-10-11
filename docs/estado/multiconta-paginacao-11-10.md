# Multiconta: leitura completa antes de decidir acesso — 11/10/2026

## 0. Ainda pendente

- Confirmar o seletor em sessão autenticada com dois CNPJs e pedidos reais. O projeto Supabase de QA está pausado; não houve consulta ou alteração nele.
- Medir o tempo de leitura com volume representativo. A proteção interrompe após 50 páginas completas e apresenta falha de consulta, sem presumir que o conjunto está completo.

## Falha e correção local

`negocioAtivoDaSessao`, `/escolher-negocio` e a trava `temAcessoWebApp` liam listas sem paginação. O limite padrão de linhas podia omitir empresas ou pedidos aprovados, afetando a entrada, a escolha e a identificação por CNPJ. Agora as leituras usam páginas de 1.000 com ordenação estável; erro em qualquer página invalida o conjunto. A trava confere os IDs em lotes de 100 para não montar uma consulta longa. A autorização ainda depende de negócio pertencente ao perfil, comprador correspondente e pagamento aprovado.

## Verificação

- `node --test scripts/conferir-multiconta.mjs`: 14/14. O caso novo coloca o pedido aprovado na linha 1.001; outro simula falha na segunda página.
- `node --test scripts/conferir-acesso.mjs`: 6/6. O caso novo põe o único negócio próprio no pedido 1.001, percorre mais de 200 IDs em lotes e recusa leitura interrompida na segunda página.
- `pnpm typecheck`: passou.
- `pnpm build`, com dev parado: passou.
- Sem integração QA ou navegação autenticada nesta rodada. Código local não equivale a publicação.
