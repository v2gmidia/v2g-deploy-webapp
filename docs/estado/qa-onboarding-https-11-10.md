# Primeiro acesso e multiconta no QA HTTPS — 11/10/2026

## 0. Pendente

- A interface nova de onboarding ainda não foi verificada em HTTPS: em 11/10, o projeto `v2g-webapp-qa` continuava no commit `0124c80`, enquanto o push mais recente (`8814b45`) foi publicado no projeto Vercel `v2g-deploy-webapp`. Não inserir dados fictícios nesse segundo projeto. A correção local para o ticket `Não sei` também precisa chegar especificamente ao QA antes de repetir esse caso.
- O envio final a `POST /cadastro`/n8n, uma reserva de reunião e a prova com dois usuários diferentes não foram executados. A conclusão do questionário não equivale a esses eventos.
- Em uma troca da Empresa 2 de volta para a Empresa 1, o botão ficou em `Abrindo…` por alguns segundos; após recarregar, `/inicio` mostrou a Empresa 1 ativa. Não houve erro no console nem cluster de erro na rota nos logs Vercel consultados. Reproduzir com instrumentação se voltar a acontecer; não afirmar defeito permanente a partir de uma ocorrência.

## Evidência observada

O projeto HTTPS de QA `v2g-webapp-qa` servia o deployment `dpl_EkqAA3weFGXMZBDHvReVWHREpmb9`, commit `0124c80c52d6a070c9090b02128ddfcbb889a886`. Victor entrou na conta de teste no próprio navegador e a página `/escolher-negocio` exibiu as duas empresas fictícias do mesmo login. O agente não usou nem leu a senha.

1. Seleção da Empresa 1 abriu `/inicio` com o nome correto. Em `/onboarding`, já constavam `nome = QA Empresa 1 — FICTÍCIA — Resposta A` e `ramo = Arquiteto`. Foi salva a descrição fictícia `Projeto arquitetônico residencial fictício para o teste da Empresa 1.`. Após recarregar, a descrição permaneceu e a pergunta seguinte apareceu.
2. Seleção da Empresa 2 abriu `/inicio` com o nome correto. Seu onboarding mostrou `nome = QA Empresa 2 — FICTÍCIA — Resposta B` e `ramo = Dentista`, sem a descrição da Empresa 1. Foi salva `Atendimento odontológico fictício para o teste da Empresa 2.`. O recarregamento preservou essa resposta.
3. Ao voltar para a Empresa 1, a descrição anterior continuava intacta. Leitura SQL no Supabase **QA** confirmou as duas descrições distintas em `businesses.onboarding.respostas.descricao`, uma por negócio. Todos os textos novos são sintéticos; nenhuma cobrança, campanha, reserva, contrato ou nota foi criada.

**Resultado:** login, escolha de dois CNPJs, gravação, retomada e isolamento dessas respostas foram observados no endereço HTTPS. Isso não demonstra que todas as etapas do onboarding nem a jornada de compra estão concluídas.

## Continuação observada no QA HTTPS — 11/10/2026

Ainda no deployment antigo `dpl_EkqAA3weFGXMZBDHvReVWHREpmb9`, a Empresa 1 percorreu as três contas com dados fictícios: ticket R$ 100, custo R$ 50 e sobra desejada R$ 25. A etapa de marca guardou a descrição fictícia, a declaração de ausência de site e Instagram vazio; o recarregamento preservou essas respostas. `/onboarding/concluido` mostrou a agenda como próximo passo e informou expressamente que abri-la não confirma uma reserva. Não foi criada reserva, campanha nem acesso à Meta.

O botão `Não sei` do ticket pediu a segunda confirmação, mas a gravação respondeu “Esta resposta não corresponde à etapa atual” e manteve o ticket vazio após recarregar. A regra local em `app/(fluxo)/onboarding/contas/regras.ts` foi corrigida para aceitar essa resposta sem inventar valor. O teste direcionado passou com 60 casos, incluindo falhas de escrita, repetição e troca de negócio; `pnpm typecheck` e `pnpm build` passaram com o servidor de desenvolvimento parado. **A correção ainda não está no QA.**

Ao selecionar a Empresa 2 no mesmo login, `/inicio` mostrou `0 de 4 etapas` e `/onboarding/contas` abriu com o ticket vazio, sem exibir os R$ 100 da Empresa 1. Essa observação reforça o isolamento de leitura nesse percurso; não testa simultaneidade entre usuários nem todas as permissões do banco.
