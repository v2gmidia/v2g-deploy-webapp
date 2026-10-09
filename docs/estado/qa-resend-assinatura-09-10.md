# QA de e-mail e decisão de assinatura — 09/10/2026

## Estado conferido

- A conta Resend `v2g.midia` já existia. O domínio `send.v2gmidia.com.br` aparece como **Verified** no painel. Há chaves de envio preexistentes, mas seus valores completos não foram acessados nem reutilizados.
- O projeto Supabase **de QA** `zskpijnqgkqwxksqmzmf` continua com SMTP customizado **desligado**. O formulário foi deixado aberto com remetente `nao-responda@send.v2gmidia.com.br`, nome `V2G mídia`, host `smtp.resend.com`, porta 465 e usuário `resend`; estes campos ainda não foram salvos. Falta uma chave de envio exclusiva para QA no campo de senha. Nenhum e-mail foi disparado.
- O projeto Vercel **de QA** `v2g-webapp-qa` mostra `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` como variáveis sensíveis, sem leitura de valores. Ainda faltam `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do Supabase QA. A trava `V2G_CHECKOUT_QA_DEPLOY_ENABLED` continua desligada e não há deploy.
- Victor informou em 09/10 que o advogado aprovou o contrato. Esta aprovação é uma decisão informada pelo fundador; o **arquivo/versão final aprovado** ainda não foi identificado. O JSON `contrato-parametrico-outubro-06-10.json` continua um briefing para minuta e os contratos de setembro são históricos. Nenhum documento foi enviado para assinatura.

## Escolha técnica para a assinatura

Google Docs e Drive permitem criar, preencher, exportar e guardar o contrato por API. A documentação pública da API Docs lista `create`, `get` e `batchUpdate`; o procedimento de eSignature do Google exige envio pela interface. **Inferência baseada nas APIs públicas verificadas em 09/10:** não há operação documentada para iniciar a solicitação de eSignature nativa nem webhook de conclusão dessa solicitação. Isso permite automatizar a preparação no Google, mas não comprovar assinatura ponta a ponta sem ação manual por contrato.

Para o objetivo de Victor de envio e confirmação automáticos, manter o desenho já proposto em `assinatura-provedor-07-10.md`: Google Docs/Drive para gerar e arquivar; Clicksign API para envelope, signatários, envio e webhook. A Clicksign anuncia integração API no plano Start a partir de R$ 39/mês, com preço final dependente do volume e condições. Sandbox permite teste sem valor jurídico. **Fornecedor ainda não contratado, credenciais não criadas e integração não ativada.** Não confundir pagamento aprovado com assinatura concluída.

## Próximas dependências

1. Victor cria uma chave Resend de envio exclusiva para QA, limitada ao domínio verificado, e a insere diretamente no Supabase QA. Após salvar, verificar status e instalar/testar os templates de autenticação com caixa autorizada.
2. Victor insere as duas chaves do Supabase QA no Vercel QA diretamente no painel, sem compartilhá-las no chat ou no repositório.
3. Identificar o arquivo final aprovado pelo advogado e sua versão/data. Só esse texto poderá alimentar o gerador de contrato.
4. Depois de identificada a minuta, testar o fluxo de assinatura apenas no sandbox do provedor escolhido, com dados fictícios e validação de webhook e idempotência.

## Fontes

- [Resend SMTP](https://resend.com/docs/send-with-smtp)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Google Docs API](https://developers.google.com/workspace/docs/api/concepts/request-response)
- [Google eSignature](https://support.google.com/docs/answer/12315692?hl=en)
- [Clicksign API](https://developers.clicksign.com/)
- [Clicksign planos](https://www.clicksign.com/preco)
