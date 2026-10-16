# Multiconta — proteção de Página aplicada no QA, 16/10/2026

## 0. Ainda depende de decisão ou prova

- A mudança existe somente no Supabase `v2g-webapp-qa`. Produção não recebeu esta migration; qualquer aplicação lá exige autorização específica.
- Falta ensaio concorrente com duas sessões gravando ao mesmo tempo e prova com duas contas de anúncios reais do mesmo CNPJ. O ensaio abaixo foi sequencial, dentro de uma transação revertida.
- Falta ensaio de perda real de acesso a um negócio. O vínculo da empresa fictícia não foi revogado para obtê-lo.
- Falta integrar e testar a conexão real com a Meta e a contratação pública de outro CNPJ. Não houve escrita na Meta nem cobrança neste bloco.
- Os ajustes locais de interface continuam dependendo da publicação habitual por Victor; não houve commit, push nem deploy aqui.

## Autorização e aplicação

- Victor autorizou expressamente a versão revisada de `supabase/migrations/20261015011547_proteger_pagina_compartilhada_multiconta.sql` somente para o projeto de QA. A autorização incluiu criar `ownership`/`status` quando faltassem e retirar a escrita direta de `anon`/`authenticated` em `ad_accounts`.
- Antes da aplicação, `get_project` confirmou o projeto `v2g-webapp-qa`, ID `zskpijnqgkqwxksqmzmf`, ativo em PostgreSQL 17.11. O ledger não continha a migration. A RPC, função, trigger e colunas estavam ausentes; `anon` tinha INSERT e `authenticated` tinha UPDATE em `ad_accounts`.
- A aplicação do conteúdo local via `apply_migration` retornou `success: true`. O ledger remoto registra `20261016031941_qa_proteger_pagina_compartilhada_multiconta_20261015`.

## Verificação após aplicação

- SQL somente de leitura confirmou `public.registrar_conta_contratada(uuid,uuid,text,text,text,text)`, a função `public.impedir_troca_pagina_compartilhada()`, o trigger `meta_connections_pagina_compartilhada`, as colunas `ad_accounts.ownership`/`status` e seus checks.
- `anon` e `authenticated` não têm INSERT, UPDATE ou DELETE em `ad_accounts`; `service_role` tem os três privilégios. `anon` e `authenticated` não podem executar a RPC; `service_role` pode.
- Um bloco SQL em `BEGIN` criou uma conexão e duas contas fictícias para um negócio fictício do QA. A tentativa de trocar a Página dessa conexão para outra Página falhou com `pagina compartilhada entre contas`. A RPC recusou uma terceira conta com a Página diferente e vinculou uma unidade aprovada quando recebeu a Página original. Cada resultado foi conferido no próprio bloco; ele terminava em `ROLLBACK`.
- Consulta separada depois do rollback confirmou `meta_connections = 0`, `ad_accounts = 0` e nenhuma unidade vinculada para o negócio usado no ensaio; a unidade original permaneceu presente. Nenhum dado sintético do ensaio ficou gravado.

Essas provas cobrem a proteção no banco para a sequência testada. Não demonstram ainda duas gravações simultâneas, integração Meta ou funcionamento completo do fluxo multiconta na interface publicada.

`pnpm typecheck` passou; `pnpm conferir:multiconta` passou 28/28; `git diff --check` saiu sem erro (apenas avisos de fim de linha em arquivos já modificados).
