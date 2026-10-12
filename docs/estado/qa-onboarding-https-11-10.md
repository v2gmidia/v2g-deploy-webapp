# Primeiro acesso e multiconta no QA HTTPS — 11/10/2026

## 0. Pendente

- O onboarding completo, o envio final a `POST /cadastro`/n8n, as etapas de marca e reunião e a prova com dois usuários diferentes não foram executados. Não tratar a prova de duas respostas como jornada concluída.
- Em uma troca da Empresa 2 de volta para a Empresa 1, o botão ficou em `Abrindo…` por alguns segundos; após recarregar, `/inicio` mostrou a Empresa 1 ativa. Não houve erro no console nem cluster de erro na rota nos logs Vercel consultados. Reproduzir com instrumentação se voltar a acontecer; não afirmar defeito permanente a partir de uma ocorrência.

## Evidência observada

O projeto HTTPS de QA `v2g-webapp-qa` servia o deployment `dpl_EkqAA3weFGXMZBDHvReVWHREpmb9`, commit `0124c80c52d6a070c9090b02128ddfcbb889a886`. Victor entrou na conta de teste no próprio navegador e a página `/escolher-negocio` exibiu as duas empresas fictícias do mesmo login. O agente não usou nem leu a senha.

1. Seleção da Empresa 1 abriu `/inicio` com o nome correto. Em `/onboarding`, já constavam `nome = QA Empresa 1 — FICTÍCIA — Resposta A` e `ramo = Arquiteto`. Foi salva a descrição fictícia `Projeto arquitetônico residencial fictício para o teste da Empresa 1.`. Após recarregar, a descrição permaneceu e a pergunta seguinte apareceu.
2. Seleção da Empresa 2 abriu `/inicio` com o nome correto. Seu onboarding mostrou `nome = QA Empresa 2 — FICTÍCIA — Resposta B` e `ramo = Dentista`, sem a descrição da Empresa 1. Foi salva `Atendimento odontológico fictício para o teste da Empresa 2.`. O recarregamento preservou essa resposta.
3. Ao voltar para a Empresa 1, a descrição anterior continuava intacta. Leitura SQL no Supabase **QA** confirmou as duas descrições distintas em `businesses.onboarding.respostas.descricao`, uma por negócio. Todos os textos novos são sintéticos; nenhuma cobrança, campanha, reserva, contrato ou nota foi criada.

**Resultado:** login, escolha de dois CNPJs, gravação, retomada e isolamento dessas respostas foram observados no endereço HTTPS. Isso não demonstra que todas as etapas do onboarding nem a jornada de compra estão concluídas.
