# 3DS ativado no QA e e-mail aguardando credencial

Data: 21/10/2026. Autorização direta de Victor para configurar e-mails e ativar 3DS com publicação somente no projeto QA, sem nova cobrança ou alteração de produção. Destinatário de teste autorizado: `victor.cabral@v2gmidia.com.br`.

**Atualização posterior:** Victor informou a chave cadastrada e redeploy iniciado. A chave foi confirmada somente por metadados como Secret no QA; o agente ativou a opção de envio e concluiu nova publicação QA READY. A parte manual de inserção não está mais pendente. Entrega de e-mail e novo ensaio 3DS continuam sem prova; ver `e28-01-qa-email-ativado-apos-chave-21-10.md`. As seções abaixo preservam o histórico do preparo.

## 0. Parte que depende de Victor

Victor confirmou conta existente no Resend e abriu a sessão em `https://resend.com/emails`. O domínio `send.v2gmidia.com.br` foi conferido como Verified. As credenciais existentes incluem outros usos; nenhuma foi reutilizada, alterada, removida ou revelada.

Preparado, sem criação, o formulário Resend com nome `V2G QA Pagamentos`. **Ainda é necessário selecionar Sending access e o domínio send.v2gmidia.com.br antes de criar a chave.** O formulário estava no padrão Full access; o agente não confirmou criação com essa permissão. Victor deve criar a chave restrita e copiá-la diretamente para o campo secreto da Vercel, sem enviar no chat.

Preparada a aba de Environment Variables do projeto `v2g-webapp-qa`, com `V2G_PAYMENT_EMAIL_RESEND_API_KEY`, tipo Secret e destino Production interno ao QA. Campo Value vazio; não salvo pelo agente. Victor deve colar a chave ali e salvar. Não ler o campo, capturar screenshot ou expor a chave após a colagem. Não editar credenciais SMTP/Auth existentes.

Depois de salvo: conferir existência por metadados, habilitar o envio QA sob a autorização já dada, republicar somente QA e verificar configuração. Não gerar nova cobrança sem nova autorização. Não enviar confirmação positiva do pagamento já estornado para forçar prova de entrega.

## Conferências antes da ativação

- Projeto Vercel `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`, slug confirmado `v2-g`.
- Deployment anterior fixo: `dpl_5fhdiTVStUg2RLSp3F2iuSsjPvnp`, commit `fbf00ee3af7fb3cc8c06931138011a49bcd85236`.
- Banco QA: tabela `checkout_3ds_context`, colunas e duas RPCs esperadas existentes. RLS ativa; anon/authenticated sem SELECT; service_role com operações necessárias. Nenhuma migration aplicada neste bloco.
- Regressão local de cartão 3DS e e-mail: 20 testes passaram, sem chamadas pagas ou envio real.
- Não havia nomes de configurações de envio no `.env.local` carregado pelo runtime; a inspeção retornou somente NOMES, sem valores. Metadados Vercel também confirmaram ausência das novas configurações. Não foi feita leitura manual ou impressão de segredos.

## Configuração alterada somente no projeto QA

Criadas em `target=production` **dentro do projeto QA**, sem upsert de configuração alheia:

- `V2G_CHECKOUT_3DS_SCHEMA_ENABLED=true`.
- `V2G_CHECKOUT_3DS_ENABLED=true`.
- `V2G_PAYMENT_EMAIL_QA_TO=victor.cabral@v2gmidia.com.br`.
- `V2G_PAYMENT_EMAIL_ENABLED=false`, deliberadamente enquanto falta credencial.

Depois da conferência do domínio, preparado `V2G_PAYMENT_EMAIL_FROM=pagamentos@send.v2gmidia.com.br`. Esse endereço é remetente técnico do domínio verificado, não criação de caixa postal nem troca do e-mail pessoal de Victor. A configuração FROM foi adicionada após o deploy abaixo e entrará na próxima publicação autorizada quando a credencial estiver pronta.

Não criado valor vazio, fictício ou compartilhado para a chave Resend; não ativar envio parcialmente configurado. Nenhuma chave gravada fora do local seguro da plataforma.

## Publicação QA concluída

Redeploy do deployment anterior por `deploymentId`, mesmo projeto e commit, sem withLatestCommit e sem arquivos locais. A primeira conferência do script de orquestração abortou antes da chamada por usar o campo de ID do projeto no nível errado; corrigida para o objeto `project.id`. Nenhum deploy duplicado foi disparado por essa checagem.

Novo deployment `dpl_8uza89ZdBeyuA67Zqzwk5cVqTTTb`, URL `v2g-webapp-as0lyw1zo-v2-g.vercel.app`, estado READY, commit `fbf00ee3af7fb3cc8c06931138011a49bcd85236`. Alias `https://v2g-webapp-qa.vercel.app` confirmado, sem aliasError. Código local pendente e mudanças da LP não entraram nessa publicação de configuração.

Ativação/configuração e regressão local não são prova de cobrança 3DS real ou de desafio bancário. Nenhum pedido/cartão foi submetido para novo pagamento neste bloco. O ensaio anterior continua encerrado e estornado. O teste futuro de pagamento/e-mail precisa de nova autorização financeira e participação de Victor caso haja autenticação.

## Limites

Sem commit/push, produção, cobranças novas, emissão fiscal, contrato ou mensagem de confirmação de pagamento real. Não acessar e-mails ou logs de credenciais sem necessidade. O envio QA continua desligado e não é apresentado como entregue. Uso das skills de configuração/publicação preservou o projeto e o commit exatos; documentação separa configuração publicada de resultado financeiro.
