# Comercial: aprovações recuperadas e conexões conferidas — 11/11/2026

## 0. Avanço e dependências atuais

> RESOLVIDO em 11/11/2026: Victor concluiu os três logins e autorizou o delta público de URLs. Aplicação e leitura posterior concluídas, dois redirects anteriores preservados. Resend Verified; Asaas produtivo sem webhook; único widget Turnstile cobre apenas QA. [Novo estado, conexões privadas pendentes e limite do release](./n26-comercial-enderecos-aplicados-provedores-conferidos-11-11.md). Não repetir pedidos de login, ajuste de URL ou liberação histórica de 3DS/tokenização. O registro abaixo preserva o momento anterior.

**Banco permanece concluído em produção.** A tabela antiga que dizia faltar quatro tabelas/nove funções já foi superada pelo ato `20261111150656`; não repetir esse pacote.

Avanço deste bloco: relidas as respostas primárias do Asaas com liberação de **3DS em 22/10** e **tokenização em 23/10**; remetente de pagamento identificado por e-mails efetivamente recebidos; DNS correspondente presente; SMTP/template de acesso e URLs do Supabase produtivo inspecionados. Identificada configuração de retorno ainda no alias antigo, com ajuste exato preparado.

Dependências humanas distintas, já solicitadas sem pedir senha/chave:

1. Victor entrar privadamente nas abas Asaas, Resend e Cloudflare e informar quais concluiu. As três abriram sem sessão suficiente; não foi tentado reset, criação de conta ou leitura de senha/código.
2. Victor responder à proposta nominal de URLs: Site URL e callback no Supabase, mais `NEXT_PUBLIC_SITE_URL` somente em Production na Vercel. [Delta exato](../comercial/conexoes-producao-11-11/AJUSTE-ENDERECOS.md). Não aplicado. A confirmação foi solicitada porque é mudança de configuração de acesso em produção, além do ato anterior do banco.

Vendas e processamento de pagamentos continuam OFF. Não foi iniciada compra, enviado pedido ao suporte ou realizada outra aplicação de banco.

## 1. Asaas: aprovação formal já existe

Consulta Gmail limitada ao assunto/chamado e mensagens do Asaas, com busca `{from:asaas.com from:asaas.com.br} {3DS tokenização 1892329 1835325} after:2026/10/20`. Nove mensagens correspondentes, sem outra página. Conversa `1a135d14cd6dc36c`, respostas recentes relidas; último resultado adicional era pesquisa de satisfação, não nova decisão técnica.

- **22/10/2026, 11h51 BRT:** Alice confirmou liberação para prosseguimento com 3DS, após análise. Mensagem `1a16418e150b9a2e`, relacionada ao pedido 1892329.
- **22/10, 14h18 BRT:** esclareceu que reutilizar o token da primeira cobrança em assinatura produtiva também requer tokenização habilitada; abriu análise 1895741, sem exigir contrato para começar. Mensagem `1a1649eb43e637c5`.
- **23/10, 10h31 BRT:** informou que a solicitação de tokenização foi **aprovada**, sujeita a monitoramento/revisão. Mensagem `1a168f5bf8f55195`.
- A resposta técnica explicou primeira cobrança avulsa com 3DS e assinatura apenas a partir do mês seguinte, sem estender o 3DS da cobrança inicial às renovações. Nenhum token real foi obtido ou usado.

Fontes primárias privadas: [liberação 3DS](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a16418e150b9a2e), [aprovação tokenização](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a168f5bf8f55195).

Essas respostas não são prova do estado atual do painel, da credencial produtiva, da titularidade da sessão a abrir ou de uma cobrança real. A aprovação do fornecedor já foi recuperada; não reenviar a solicitação de liberação por dedução de uma pendência genérica antiga. Conferir conta atual/escopo de webhook quando Victor concluir o login.

## 2. E-mail de pagamento e DNS

Busca Gmail por assunto `[TESTE QA] V2G` desde 20/10, quatro resultados. Cabeçalhos de três mensagens efetivamente recebidas foram conferidos:

- `1a17f793457bd085`, 27/10, 19h26 BRT;
- `1a1be555013c8673` e `1a1be555597eef48`, 09/11, 00h23 BRT.

Remetente nos três: **`V2G <pagamentos@send.v2gmidia.com.br>`**; destino de teste empresarial de Victor. Esse é o candidato concreto ao FROM produtivo, não endereço inventado ou criação de caixa postal. Não foram reenviados e-mails nem refeito pagamento para obter a evidência.

DNS público atual: TXT e MX de `send.v2gmidia.com.br` presentes; TXT de `resend._domainkey.send.v2gmidia.com.br` presente. Nenhum valor de chave foi mostrado ou registro DNS alterado. Presença de DNS/entrega QA anterior não certifica a credencial produtiva nem o status Verified atual na conta Resend. O painel abriu no login, aguardando entrada privada.

## 3. Cadastro/recuperação produtivos: configuração observada

Projeto Supabase **V2G-SITE**, ref `ushccxpoxjikzqnwhgfd`, main/Production, confirmado na interface:

- Site URL: `https://v2g-deploy-webapp.vercel.app`;
- allowlist: `https://v2g-deploy-webapp.vercel.app/**` e `http://localhost:3000/**`;
- retorno `https://app.v2gmidia.com.br/auth/confirmar` ausente;
- Confirm sign up usa `{{ .ConfirmationURL }}`; Reset password usa a mesma variável, com texto V2G existente. Não foram editados templates ou enviados links de confirmação/recuperação;
- SMTP customizado ligado, host `smtp.resend.com`, porta `465`, nome público `V2G`. Senha/usuário de autenticação não foram lidos. O campo de remetente não foi certificado por esta captura e não foi contornado quando ocultado pela ferramenta.

A leitura inicial de `textContent` do editor não refletiu o valor visível; não foi usada para concluir ausência de `ConfirmationURL`. A evidência aceita é o conteúdo exibido no código/snapshot do template. Macros de template não são tokens de sessão reais.

O código de cadastro/recuperação usa `NEXT_PUBLIC_SITE_URL` e o caminho `/auth/confirmar`; o callback suporta as formas de confirmação previstas. A [documentação de redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) fundamenta a correspondência necessária com a allowlist. O ajuste foi preparado e apresentado, sem gravação no painel ou na Vercel.

## 4. Proteção e webhook

Cloudflare abriu em Sign in, com perfil V2G indicado como usado anteriormente. Não foi clicado fluxo de acordo/entrada nem criada configuração. Host exigido para o checkout: `app.v2gmidia.com.br`; confirmar widget existente/ambiente e domínios autorizados após login, sem ler/revelar chaves. [Regras de hostname Turnstile](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/) verificadas como referência; não substituem a leitura do widget real.

Webhook produtivo continua apenas proposto: `https://app.v2gmidia.com.br/api/webhooks/asaas-production-payment`, token exclusivo, processamento OFF. O handler atual ainda retorna 503 para cobrança sem vínculo, em `lib/contratacao/webhook-pagamento.ts:61`. Antes de ativar, conferir se a conta recebe outros pagamentos e qual é o escopo legítimo dos eventos. Não reativar fila antiga/QA nem ignorar todo órfão para forçar sucesso. Não foi feito POST de webhook, criado evento financeiro, lido payload com token de cartão ou alterado o handler.

## 5. Registro, preservação e limite

Estado seguro e proposta: `docs/comercial/conexoes-producao-11-11/conferencia.json` e `AJUSTE-ENDERECOS.md`. Evidência da URL atual salva em `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/`, pasta limitada a Victor/SYSTEM. Abas de login e configuração preservadas para a continuação; não arquivar/fechar o handoff antes da entrada do usuário.

Somente leituras e documentos locais neste bloco. Sem criação de credenciais, leitura de `.env`, alteração de Auth/SMTP/URL, flags, DNS, webhook, banco, permissões, contratos/legais, LP, Meta, n8n, commit/push ou publicação. Não foram repetidos testes encerrados ou dados fictícios produtivos.

Próximo ato após as respostas: conferir os painéis legitimamente autenticados e, se aprovado, aplicar somente o ajuste público nominal de URLs, preservando o restante. Continuar antes do ensaio financeiro e da abertura de vendas; nenhum prazo decorrido equivale a login ou aprovação.
