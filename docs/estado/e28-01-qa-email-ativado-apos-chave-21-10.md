# E-mail de pagamento ativado somente no QA

Data: 21/10/2026. Victor informou ter cadastrado a chave e iniciado o redeploy. Sob a autorização anterior de configurar e publicar e-mail/3DS somente no QA, o envio foi ativado e a configuração publicada. Isso ainda não comprova credencial válida no Resend ou entrega na caixa de entrada.

## 0. Próximo passo

O ensaio financeiro anterior de R$ 500 já terminou cancelado e estornado; não reutilizar seu evento para enviar uma confirmação positiva. Nenhuma nova cobrança foi autorizada ou criada neste bloco. Para provar conjuntamente fluxo 3DS, confirmação por e-mail e acesso ao negócio correto, apresentar novo ensaio Sandbox com valor e limpeza delimitados e aguardar autorização. Autenticação, senha ou CAPTCHA ficam com Victor quando necessários.

## Configuração e segredo

- Projeto exclusivo `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`.
- `V2G_PAYMENT_EMAIL_RESEND_API_KEY` confirmado por metadados com tipo `sensitive` e target Production interno ao QA. Não descriptografado, copiado, fotografado ou lido o valor. Não acessado formulário do navegador que pudesse continuar exibindo o segredo.
- Conferidas internamente as configurações públicas esperadas: destinatário de teste empresarial de Victor, remetente `pagamentos@send.v2gmidia.com.br`, opções de schema/fluxo 3DS ligadas e opção de envio ligada. Retornados somente resultados booleanos dessas comparações; nenhum segredo exposto.
- `V2G_PAYMENT_EMAIL_ENABLED` foi alterada de desligada para ligada pelo agente. Não alteradas outras configurações, credenciais SMTP/Auth ou produção. Metadados não provam que a chave possui o escopo/domain restriction solicitado; esse ponto não foi apresentado como validado.

## Publicação

Ao iniciar a conferência, o alias ainda apontava ao deployment anterior, enquanto o redeploy de Victor `dpl_J4PcMmnCFxhiDwWaNcR1NCDY8A84` estava BUILDING. Aguardado até READY, preservando-o. Ele havia sido iniciado antes de ligar a opção de envio.

Depois da ativação, republicado esse mesmo deployment por ID, com `withLatestCommit=false`, sem arquivos locais. Novo deployment `dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`, URL `v2g-webapp-174nbhxpu-v2-g.vercel.app`, commit `fbf00ee3af7fb3cc8c06931138011a49bcd85236`, READY. Alias fixo `https://v2g-webapp-qa.vercel.app` confirmado, sem aliasError.

O target se chama Production dentro do projeto QA; não é o projeto de produção da V2G. Não houve commit/push, publicação de alterações locais pendentes ou publicação da LP.

## Verificação e limites

Regressão local de e-mail e cartão 3DS: 20 testes passaram, com transporte simulado. Nenhum teste local foi declarado como envio real. Não acionado webhook para forçar mensagem, não inserido evento financeiro nem e-mail falso no banco. Não enviada confirmação para pagamento já estornado.

Restam a comprovação de entrega do e-mail no fluxo integrado, o novo percurso de cartão com 3DS e a entrada no negócio correto como comprador. Configuração publicada não libera produção, assinatura contratual, emissão fiscal ou desafio bancário real.
