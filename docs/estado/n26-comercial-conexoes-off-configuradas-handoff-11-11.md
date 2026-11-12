# Comercial: configuração OFF salva, credenciais em etapa privada — 11/11/2026

## 0. Estado atual e ação humana indispensável

> ESTADO MAIS RECENTE em 11/11/2026: Victor criou o widget/salvou os dois nomes Turnstile e fez redeploy. Publicação conferida até READY, domínio correto, compra fechada e controles false. Resposta posterior deixou incerto o pareamento das chaves; preparada substituição privada somente da Secret key. [Resultado e próxima ação](./n26-comercial-redeploy-usuario-conferido-protecao-pendente-11-11.md). As referências abaixo a ausência de nova publicação descrevem o momento anterior ao redeploy feito por Victor.

> AVANÇO em 11/11/2026: Victor confirmou criação da chave Resend e salvamento privado na Vercel. Conferência somente por metadados: `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY` única, tipo Secret (`sensitive`), somente Production; total 29→30 variáveis e os 29 metadados anteriores preservados. Valor nunca lido, nenhum e-mail enviado. Janela View API Key fechada sem ler conteúdo. Evidência: `docs/comercial/conexoes-producao-11-11/email-credencial-metadados-conferidos.json`. Próximo handoff preparado: criar o widget **V2G Checkout Produção**, host **app.v2gmidia.com.br**, Managed/sem pre-clearance, e transferir Site key/Secret key para os dois campos nominais vazios já preparados na Vercel, ambos Secret/somente Production. A chave pública pode ser guardada como Secret nesta configuração; isso não a torna secreta no protocolo, e ela continua sendo disponibilizada pelo servidor ao widget quando o fluxo autorizado for ligado. Não há prefixo NEXT_PUBLIC nesses dois nomes. Fechamento de e-mail é prova de configuração/metadados, não de entrega ou ensaio financeiro.

Victor autorizou: **“Autorizar conexões com tudo desligado”**, para o pacote de proteção, Asaas, webhook e e-mail financeiro de produção, sem publicação de código/cobrança e com criação/entrada das credenciais concluídas por ele privadamente.

**Salvas e relidas 17 configurações não secretas somente em Production na Vercel.** Treze controles comerciais explicitamente `false`, mais ambiente Asaas, URL da compra, domínio Turnstile permitido e remetente financeiro. As 12 configurações anteriores foram preservadas. Sem novo deployment, banco, cobrança, e-mail, anúncio ou abertura comercial.

Handoff atual, já solicitado: Victor finalizar a chave Resend preparada e copiá-la diretamente para o campo Secret da Vercel, somente Production; salvar sem Redeploy e fechar a exibição da chave antes de avisar. A criação/entrada de credenciais é uma etapa privada do usuário, não nova solicitação de autorização do mesmo pacote. Não pedir chave, token, senha ou código no chat.

Depois da confirmação, Central confere **somente metadados** (nome, tipo, destino), sem reler valores, e prepara a próxima transferência privada: Turnstile, chave Asaas, token exclusivo do webhook e segredo de hash. Configuração integral ainda **pendente**; não marcar as integrações concluídas por haver formulários preenchidos.

## 1. Aplicação e preservação na Vercel

Alvo: projeto `v2g-deploy-webapp`, ID `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`. Inventário inicial lido sem decriptar: 12 nomes/metadados, zero variáveis produtivas ocultas. Nenhum dos 17 nomes existia. Criação única em lote, sem upsert; resultado 17 criadas, zero falhas. Leitura posterior: 29 metadados, todos os alvos somente Production e valores públicos esperados exatos; 12 metadados anteriores idênticos.

| Grupo | Valores salvos |
| --- | --- |
| Produção — cinco controles OFF | `V2G_PRODUCTION_CHECKOUT_ENABLED`, `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED`, `V2G_PRODUCTION_URL_CONFIRMED`, `V2G_PRODUCTION_3DS_CONFIRMED`, `V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED`: todos `false`. |
| Demais controles — oito OFF | `V2G_CHECKOUT_API_ENABLED`, `V2G_CHECKOUT_SECURITY_ENABLED`, `V2G_CHECKOUT_3DS_SCHEMA_ENABLED`, `V2G_CHECKOUT_3DS_ENABLED`, `V2G_CHECKOUT_ENABLED`, `V2G_CHECKOUT_QA_DEPLOY_ENABLED`, `V2G_ASSISTED_ASAAS_ENABLED`, `V2G_PAYMENT_EMAIL_ENABLED`: todos `false`. |
| Ambiente do provedor | `ASAAS_ENVIRONMENT=production`. |
| Compra futura | `V2G_PRODUCTION_CHECKOUT_URL=https://app.v2gmidia.com.br/contratar`. |
| Host de proteção | `V2G_TURNSTILE_ALLOWED_HOSTNAMES=app.v2gmidia.com.br`. Isso não cria widget nem valida desafio. |
| Remetente financeiro | `V2G_PRODUCTION_PAYMENT_EMAIL_FROM=pagamentos@send.v2gmidia.com.br`. Não foi enviado e-mail. |

Todas são configurações não secretas; nenhum valor privado foi criado, transferido ou lido pelo agente. `NEXT_PUBLIC_SITE_URL` já resolvida no bloco anterior não foi gravada outra vez. Nenhuma variável de plataforma/Supabase/QA/Preview/Development foi sobrescrita.

**Correção nominal de proposta:** o checkpoint anterior usava o formato exibido no cabeçalho recebido `V2G <pagamentos@send.v2gmidia.com.br>` também como destino de configuração. O código real aceita apenas endereço simples em `lib/contratacao/ambiente-producao.ts:42`; um nome de exibição bloquearia a compra. A divergência foi explicada antes da gravação e foi salvo somente o endereço verificado, sem mudar o código.

Registro seguro: `docs/comercial/conexoes-producao-11-11/configuracao-off-aplicada.json`. Captura antes e leitura depois: `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/configuracao-privada-antes-metadados.json` e `configuracao-off-depois.json`. Não contêm segredos. O pacote selado de banco e o manifesto histórico de preparo não foram alterados.

## 2. Preparação dos painéis — sem concluir criação

| Painel | Formulário preparado | Limite / próximo responsável |
| --- | --- | --- |
| Resend | Nome **V2G Produção Pagamentos**, **Sending access**, domínio **send.v2gmidia.com.br**. Botão final Add não acionado pelo agente. Cinco chaves anteriores observadas apenas por nomes/permissões; nenhuma reutilizada/alterada. | Victor cria privadamente; copia a chave uma única vez diretamente para a Vercel. Central não captura o valor. |
| Vercel | Add Environment Variable aberto para `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY`, tipo **Secret**, ambiente **Production**, comentário com limite de domínio e OFF; Value vazio antes do handoff. | Victor cola e salva; não clica Redeploy. Conferência por metadados após confirmação. |
| Cloudflare | Add Widget preparado: **V2G Checkout Produção**, hostname efetivamente adicionado ao rascunho **app.v2gmidia.com.br**, modo **Managed**, pre-clearance desligado. Create não acionado. Widget QA preservado. | Em próximo passo privado, Victor cria, salva sitekey/secret nos destinos próprios da Vercel e fecha a exibição antes de avisar. Não reenviar chaves aqui. |
| Asaas / chave | Página Chaves de API produtiva indica estado inicial, sem chave listada; botão Gerar chave de API não acionado. O painel informa acesso total da chave. | Victor conclui criação/entrada privada, depois Central confere metadados. Não presumir chave com escopo de leitura se o fornecedor não oferece tal limitação. |
| Asaas / webhook | Rascunho com nome **V2G WebApp Produção - pagamentos**, URL produtiva nominal, e-mail operacional da conta preenchido, API **v3**, envio **Sequencial**. Webhook **desligado**, fila **desligada**, token vazio. Salvar/Gerar Token não acionados. | Antes de salvar, ainda é necessário selecionar os 17 eventos e concluir token privadamente. Estado preparado não é cadastro remoto criado. |

Houve tentativas de seleção dos eventos no Asaas, mas não produziram mudança verificada; nenhum evento foi marcado. A seção real continuou recolhida, embora o snapshot expusesse controles ocultos. Não repetir os mesmos cliques nem declarar sucesso; a abertura/seleção precisa ser concluída pela interface real com Victor. Versão/tipo de envio passaram a refletir v3/Sequencial depois de abrir os campos visíveis corretos, em vez das opções ocultas.

Os 17 nomes previstos estão em `lib/contratacao/evento-financeiro.ts:1`; todos foram encontrados entre as opções do painel. Não selecionar “Todos”, que inclui eventos fora do contrato. Nenhuma criação remota ou geração de token foi realizada para contornar o limite da interface.

Capturas anteriores à entrada privada em `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/`: `resend-chave-producao-preparada.png`, `vercel-chave-email-preparada.png`, `cloudflare-widget-producao-preparado.png`. As abas estão em handoff e devem continuar abertas. Não ler snapshots/capturas de telas com credenciais geradas enquanto Victor faz a transferência; esperar fechamento e confirmação.

## 3. Provas e limites

Nova consulta confirmou o mesmo deployment produtivo `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, READY, commit `13f8943471b391bd22e9dd8362f5748653ad9c5b`. Nenhuma nova publicação foi solicitada ou feita. Salvar variável não prova aplicação ao runtime atual.

Validação deste bloco: correspondência exata dos 17 valores não secretos, alvos Production, zero falhas de criação, metadados anteriores preservados e deployment idêntico. Sem edição de produto/banco: não repetir suíte/build encerrados nem chamar endpoints financeiros. Nenhuma prova de cobrança/e-mail/acesso produtivos foi realizada.

Antes de ativar o webhook/filas, manter pendente o tratamento/escopo de eventos sem vínculo registrado no checkpoint anterior (`lib/contratacao/webhook-pagamento.ts:61`). Não ligar processamento para testar a conectividade; isso pode criar efeitos financeiros e e-mails. Credenciais configuradas não autorizam release, pagamento, assinatura ou abertura da LP.

Fontes de configuração verificadas em 11/11: [Asaas — criar webhook, enabled/interrupted e token](https://docs.asaas.com/reference/criar-novo-webhook), [Resend — permissões e restrição por domínio](https://resend.com/docs/dashboard/api-keys/introduction), [Cloudflare — criação de widget e chaves](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/). Nenhum exemplo Sandbox dessas páginas foi utilizado como endpoint produtivo.

Sequência mantida: credenciais/configuração OFF → release fechado autorizado → ensaio nominal com comprador/método/valor/recorrência definidos e ação financeira de Victor → comprovação de e-mail/acesso → abertura comercial separada. Responsável atual da única ação pendente solicitada: **Victor, chave Resend → Vercel**, sem exposição no chat.
