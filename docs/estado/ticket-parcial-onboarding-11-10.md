# Valor de venda com gravação parcial — 11/10/2026

## 0. Pendências

Percorrer a retomada com sessão autenticada e banco real quando o QA voltar; o projeto segue pausado. Uma operação concorrente em outra aba ainda requer prova com banco real. Não há garantia transacional entre as duas colunas sem contrato de banco adicional.

## Falha observada no código

`avg_ticket_min` e `avg_ticket_max` são gravadas em transações separadas. Se a segunda falha, a leitura anterior podia considerar a média do mínimo novo com o máximo antigo como valor confirmado e deixar o cadastro avançar. Em faixa aberta, um máximo antigo também podia permanecer preenchido e distorcer o valor mesmo quando ambas as chamadas restantes tinham sucesso.

## Correção local

Antes de alterar as colunas do valor de venda, a ação grava no documento do onboarding uma marca `emGravacao`. Enquanto ela existe, a leitura não trata as colunas como resposta concluída, o cadastro continua pendente e a tela reoferece a pergunta. A marca só sai quando a resposta final é mesclada. Se uma faixa aberta substitui uma tentativa que deixou máximo antigo, a ação limpa esse teto antes de finalizar. A repetição após releitura recompõe as colunas.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 53/53. Simulação da segunda coluna falhando confirmou que a leitura não apresentou média mista, o cadastro manteve pendência e a nova tentativa concluiu. Faixa aberta removeu o teto antigo.
- `pnpm conferir:cadastro`: passou, inclusive validação contra schema lido do backend; nenhum cadastro foi enviado.
- `pnpm conferir:estado`: 122 conferências passaram.
- `pnpm typecheck` e `pnpm build` com servidor de desenvolvimento parado: passaram.
- Supabase QA, RLS, concorrência real e interface autenticada: não verificados.

Sem migration, deploy ou escrita externa.
