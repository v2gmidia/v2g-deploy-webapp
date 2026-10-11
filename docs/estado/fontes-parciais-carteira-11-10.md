# Fontes parciais na carteira do gestor — 11/10/2026

## 0. Pendência de prova

- Verificar a interface autenticada e consultas com mais de 1.000 pedidos, contas, unidades, contratos ou execuções. O Supabase de QA está pausado; não houve acesso ao banco nesta sessão.

## Correção local

A carteira calculava e ordenava “próxima ação” por negócio mesmo quando uma das fontes operacionais tinha atingido o limite de 1.000 linhas ou a leitura de execuções falhava. Nessa condição, a ausência de um pedido ou vínculo no recorte não prova ausência no negócio.

Agora a carteira deixa de apresentar a prioridade calculada e ordena os negócios por nome quando a fonte operacional está incompleta. Mostra um aviso, remete às telas específicas, suspende filtros dependentes desses dados e não apresenta a contagem de pedidos como completa. O número de contas passa a ser identificado como “retornadas”; o vínculo de unidade não é negado quando pedidos, contas ou unidades chegaram ao limite. O link para as contratações continua acessível para cada negócio.

Isso não resolve paginação global nem substitui a consulta específica da conta. A regra é conservadora: ao atingir exatamente 1.000 linhas, considera o recorte possivelmente incompleto, mesmo que não exista uma linha seguinte.

## Verificação

- `node --test scripts/conferir-gestor.mjs`: 23/23, incluindo o veredito de ação sob fonte incompleta.
- `pnpm typecheck` e `pnpm build`, com servidor de desenvolvimento parado: passaram.
- A suíte `pnpm conferir` foi interrompida em `conferir:migrations`, que tentou resolver o endereço do Supabase pausado. Não será repetida enquanto QA estiver indisponível. Nenhum dado foi alterado.
- Esses testes não provam interface autenticada, banco QA ou ambiente publicado.
