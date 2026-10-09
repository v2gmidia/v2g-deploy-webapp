# HTTPS de QA, Auth e SMTP — 09/10/2026

## Estado conferido nesta sessão

- Vercel: projeto novo e isolado `v2g-webapp-qa` (`prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`), no time V2G. O domínio `v2g-webapp-qa.vercel.app` consta como atribuído e verificado. **Ainda não há deployment nem página funcional**. A proteção SSO da Vercel consta ativa para os domínios Vercel desse projeto.
- Supabase: somente no projeto de QA `zskpijnqgkqwxksqmzmf`, o Site URL foi salvo como `https://v2g-webapp-qa.vercel.app`. A lista de retornos contém exatamente `https://v2g-webapp-qa.vercel.app/auth/confirmar` e `http://localhost:3000/auth/confirmar`. A página foi recarregada para conferir a persistência.
- Vercel QA: foram gravadas somente variáveis **não secretas** para o target Production **deste projeto de QA**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `V2G_CHECKOUT_SANDBOX_DB_REF`, `ASAAS_ENVIRONMENT`, `V2G_CHECKOUT_ENABLED`, `V2G_CHECKOUT_API_ENABLED`, `V2G_CHECKOUT_QA_DEPLOY_ENABLED` e `V2G_CHECKOUT_RETURN_BASE_URL`. A última trava de publicação `V2G_CHECKOUT_QA_DEPLOY_ENABLED` permanece `false`.
- Vercel aceitou a atualização `autoExposeSystemEnvs=true` no projeto QA; o painel confirmou a opção “Enable access to System Environment Variables” marcada.
- Supabase QA: SMTP customizado está desligado. O painel informa que os templates só podem ser editados depois de configurar SMTP próprio. Assim, os HTMLs em `docs/auth-email/` continuam **somente locais**.
- O código local aceita o checkout Sandbox num build HTTPS apenas quando batem simultaneamente o projeto Vercel de QA, o domínio fixo, a URL e a ref do Supabase QA, o ambiente Asaas Sandbox e a flag explícita. O projeto Vercel principal e o Supabase real continuam recusados. Mudança ainda não publicada.

## Pendências para um teste HTTPS real

1. No projeto Vercel **de QA**, configurar `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a chave publicável do **Supabase QA** e, como variáveis sensíveis de servidor, `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`, sempre com os valores do **Supabase QA** e do **Asaas Sandbox**. Não copiar credenciais de produção. A chave pública precisa corresponder ao banco QA; as demais ficam só no servidor.
2. O guard usa as variáveis automáticas `VERCEL_PROJECT_ID` e `VERCEL_PROJECT_PRODUCTION_URL`, habilitadas no painel. Quando tudo estiver completo, mudar a flag de QA para `true` e publicar **somente** este projeto após revisão do diff. A versão atualmente em Git não contém o guard de QA deste documento.
3. A proteção SSO da Vercel também barra webhooks externos. Antes de configurar o Asaas Sandbox, habilitar um **Protection Bypass for Automation** exclusivo do projeto QA e acrescentar seu segredo como query parameter `x-vercel-protection-bypass` à URL `https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment`. Manter também o token Asaas próprio de pelo menos 32 caracteres, validado pelo app. O bypass é segredo: não registrar sua URL completa no repositório ou relatório. Esse endereço só ficará ativo depois do deployment. Verificar entrega, reenvio idempotente, Pix e cartão com dados fictícios. A existência do webhook não prova cobrança real.
4. Escolha de SMTP: Resend para autenticação, com subdomínio dedicado, inicialmente em QA. A conta, domínio verificado, API key de envio e registros DNS ainda não existem como evidência nesta sessão. Não ativar `Enable custom SMTP` até o domínio e o remetente estarem verificados. Depois configurar SMTP no Supabase QA e só então instalar `confirmar.html` e `recuperar.html`, ensaiando com uma caixa autorizada. Evitar rastreamento de links de autenticação.
5. A minuta do contrato ainda aguarda revisão jurídica; o provedor de assinatura de produção, preço da API e parâmetros fiscais não estão fechados. O fluxo alvo é pagamento confirmado → acesso → contrato parametrizado → assinatura comprovada de Victor e representante do cliente → PDF e evidência arquivados/enviados → só então primeira publicação pelo gestor. Nenhum evento de assinatura, nota ou campanha deve ser inferido do pagamento.

## Verificação local

- `corepack pnpm typecheck` passou.
- `node --experimental-strip-types --test scripts/conferir-checkout-self-service.mjs`: 8 testes passaram, incluindo aceitação no QA identificado e recusa para projeto Vercel errado, banco real, Asaas fora do Sandbox e flag desligada.
- `corepack pnpm build` passou; não havia servidor na porta 3000 antes do build.
- Sem deploy, não houve ensaio HTTPS, e-mail de cliente, SMTP, webhook remoto ou NFS-e nesta sessão.

## Fontes de configuração

- Supabase: <https://supabase.com/docs/guides/auth/auth-smtp> e <https://supabase.com/docs/guides/auth/auth-email-templates>.
- Vercel: <https://vercel.com/docs/environment-variables/system-environment-variables>.
- Bypass de webhook com proteção: <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection>.
- Resend SMTP: <https://resend.com/docs/send-with-smtp>.
