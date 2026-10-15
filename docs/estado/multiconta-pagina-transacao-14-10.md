# Etapa 03 — Página compartilhada protegida na transação, 14/10/2026

## 0. Aberto

- A migration `20261015011547_proteger_pagina_compartilhada_multiconta.sql` foi **criada localmente, não aplicada**. Revisar e obter autorização específica antes de aplicá-la no QA; depois testar duas abas escolhendo contas e Páginas distintas ao mesmo tempo e uma troca de Página na tela Conta concorrendo com a segunda conta.
- Páginas diferentes por conta de anúncios continuam fora do modelo: a coluna `meta_connections.meta_page_id` é única por negócio. Suportá-las exige modelagem nova no banco compartilhado, publicador, pré-voo e interface.
- A suíte completa de migrations já apontava 20 divergências anteriores e não há ledger local vinculado. Não há prova de execução SQL desta migration nem de comportamento no QA.

## Achado e ajuste local

- A ação de escolha e a tela Conta já recusavam troca de Página se detectassem outra conta ativa, mas a conferência acontecia antes da gravação. Duas requisições simultâneas podiam passar.
- A RPC `registrar_conta_contratada` agora bloqueia a linha do negócio e a da conexão, verifica as outras contas ativas e recusa Página diferente **antes** de vincular uma conta ou consumir unidade comercial.
- Um trigger na conexão recusa a mudança da Página quando já existem duas ou mais contas ativas. Ele cobre a corrida com a ação da tela Conta, que ainda atualiza `meta_connections` diretamente. A RPC atualiza a Página sem mudar o valor ao adicionar uma segunda conta que usa a mesma Página.
- As duas ações exibem erro compreensível quando essa recusa vier do banco, sem mostrar a resposta crua.

## Conferências

- `pnpm typecheck`: passou.
- `git diff --check`: sem erro de whitespace; avisos de fim de linha.
- Não havia `psql` nem `pglast` disponíveis para executar ou analisar o SQL localmente. A migration foi revisada estaticamente, mas ainda precisa de aplicação e teste no QA.

Sem commit, push, deploy, migração aplicada ou escrita na Meta.
