# Mesa do gestor — contrato local de escopo por agência (19/10/2026)

## §0. Depende de Victor e de integração

- Confirmar a primeira agência, negócio piloto e IDs/e-mails de convite. O e-mail identifica o convite; permissão real deverá se prender ao usuário autenticado e ao vínculo ativo.
- Aprovar o modelo persistente de agência, associação negócio–agência, múltiplos gestores, capacidades e revogação antes de qualquer migration ou concessão real.
- O papel global `operador` continua exclusivo da operação interna atual. Não atribuí-lo a gestor de agência: a rota `/gestor` atual lê a carteira com `service_role` e não isola agências.
- Integrar o contrato primeiro na consulta de IDs autorizados, depois em cada leitura/action/arquivo e em RLS. Não ligar papéis novos na rota atual antes desse isolamento e de QA autenticado entre duas agências.

## Fato observado

- `app/(protected)/gestor/page.tsx` exige `app_metadata.papel === "operador"`, lê `businesses` e dados operacionais com cliente administrativo e usa `manager_accounts` para o filtro de minhas contas depois das leituras. Isso atende à operação interna atual, não à futura agência.
- `supabase/migrations/20261009042000_gestor_responsaveis_tarefas.sql` dá a `manager_accounts` uma linha por `business_id` e um `operator_profile_id`; não representa agência nem múltiplos responsáveis. A tabela tem RLS habilitado e acesso direto de `authenticated` revogado.

## Feito neste bloco

- Criado `lib/gestor/escopo-da-mesa.ts`, contrato puro e ainda não conectado: cliente negado; gestor V2G limitado a atribuições ativas; gestor de agência exige simultaneamente atribuição ativa, agência do negócio igual e vínculo ativo do usuário à agência; administrador V2G tem escopo global apenas com papel explícito. Falha de identidade ou consulta incompleta nega acesso.
- Criado `scripts/conferir-escopo-mesa.mjs`: 7 testes sintéticos para cliente, duas agências, revogação, atribuição divergente, gestor interno, administrador e consulta truncada.

## Verificação e limite da prova

- `node scripts/conferir-escopo-mesa.mjs`: 7/7.
- `pnpm typecheck`: passou.
- Nenhum acesso real foi concedido; não houve leitura/escrita de dados de cliente, migration ou mudança da rota `/gestor`. O contrato recebe dados confiáveis do futuro carregador; sozinho ele não verifica JWT, banco ou RLS.

## Próximo recorte proposto

Desenhar as leituras mínimas e a matriz de capacidade por rota/action, com negação de acesso antes da consulta de dados detalhados. O vínculo de agência e a autorização persistente ainda não existem; não simular isso com o papel global de operador.
