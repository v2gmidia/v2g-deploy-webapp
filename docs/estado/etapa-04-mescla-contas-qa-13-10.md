# Etapa 04 — uma resposta de contas apagava a anterior no QA (13/10/2026)

## Reproduzido em HTTPS

Na Empresa 4 fictícia do QA, foram salvas as seis respostas do bloco "Sobre seu negócio". O catálogo de ramos não carregou; a alternativa de texto livre aceitou "Loja fictícia de peças decorativas de madeira". No bloco "Suas contas", o cliente confirmou "Não sei" para o ticket e depois para o custo. A segunda resposta fez a primeira voltar a ser perguntada. Recarregar manteve a falha. A leitura **somente leitura** da linha no Supabase QA mostrou `onboarding.contas` com apenas `custo`; repetir o ticket deixou apenas `ticket`. Nenhum valor financeiro foi inventado nas colunas.

## Causa comprovada

A função `mesclar_blocos_onboarding` publicada no QA ainda usa a expressão da migration `0032`:

O ledger do QA registra essa definição como `20261011154108_qa_0032_mesclar_respostas_por_chave`; a correção `20261013070000` não aparece no ledger (consulta de 13/10, apenas leitura).

```sql
v_contas || p_patch->'contas'
```

Uma consulta SQL de leitura no próprio QA mostrou que o PostgreSQL avalia isso como `(v_contas || p_patch)->'contas'`: o resultado fica só com a chave nova. A expressão com `v_contas || (p_patch->'contas')` preserva as duas chaves. Isso explica a perda sem atribuí-la à interface ou a duas abas.

## Correção preparada

`supabase/migrations/20261013070000_corrigir_mescla_contas_onboarding.sql` recria a função com os parênteses. A migration **não foi aplicada**: `AGENTS.md` exige autorização específica para `pnpm db:migrate`/alteração no painel Supabase, e não houve essa autorização para esta alteração durante a noite. O CLI Supabase não está disponível neste checkout, então o arquivo foi criado a partir da função versionada `0032`. Antes de aplicar, conferir o ledger do QA, revisar a diff única e manter o banco de produção intocado.

A revisão de diff confirmou uma única mudança executável em relação à `0032`: os parênteses em `p_patch->'contas'`. O ledger já foi conferido; falta a autorização específica e a aplicação apenas no QA.

`pnpm conferir:onboarding-preservacao` passou com **60/60 cenários locais** em 13/10. Isso não invalida a falha em HTTPS: os cenários simulam a gravação de JSON e não executam a função SQL publicada no QA. A prova decisiva é reaplicar o teste de respostas após a migration autorizada.

Após a aplicação autorizada, repetir no QA: ticket "Não sei" + custo "Não sei" + lucro "Não sei", recarregar e verificar as três respostas financeiras e a ida para marca. Repetir também com ticket numérico, custo confirmado e lucro, inclusive duas abas. Até essa prova, o onboarding não está concluído.
