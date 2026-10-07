# Assinatura eletrônica — escolha técnica e preparo, 07/10/2026

## Resposta à dúvida do Google

O Google Workspace **faz assinatura eletrônica** em Google Docs e PDFs no Drive quando o plano e o administrador habilitam o recurso. O fluxo oficial pede que alguém abra o documento, adicione os campos, clique em “Request signature”, informe os e-mails e envie. Depois, permite acompanhar o status pela interface e entrega o PDF final às partes. Fontes: [eSignature do Workspace](https://support.google.com/drive/answer/16704506) e [procedimento de envio](https://support.google.com/drive/answer/12315692).

As APIs públicas de [Docs](https://developers.google.com/workspace/docs/api/concepts/request-response) e [Drive](https://developers.google.com/workspace/drive/api/reference/rest/v3) permitem criar, preencher, copiar e guardar documentos, mas não documentam uma operação para **criar/enviar solicitação de eSignature** nem um evento próprio de conclusão da assinatura para o WebApp. Isso é uma conclusão sobre as APIs públicas verificadas em 07/10, não afirmação de impossibilidade permanente. Portanto, o Google serve para **gerar a minuta preenchida e assinar manualmente**; ele não atende hoje ao requisito de Victor de envio e confirmação automáticos pelo produto, com estado comprovado e sem intervenção por contrato.

## Menor caminho de custo identificado

A página oficial de [preços da Clicksign](https://www.clicksign.com/preco) mostra plano **Start a partir de R$ 39/mês** e inclui integração via API e assinatura por e-mail. O preço final depende da quantidade escolhida de documentos e dos excedentes; confirmar na contratação. Começar com dois signatários por e-mail, sem WhatsApp, SMS, biometria ou add-ons, reduz o custo variável. O caminho híbrido de menor plano é copiar o modelo jurídico aprovado com a API do Google Docs, preencher apenas variáveis validadas, exportar o PDF pelo Drive e enviar o PDF à Clicksign; assim não se depende da automação de modelos da Clicksign. A [API v3](https://developers.clicksign.com/docs/primeiros-passos) permite envelope, upload de PDF, signatários, requisitos, notificação e eventos. Não contratar plano nem enviar documentos reais antes da minuta aprovada e do teste sandbox.

Comparação de custo a validar: a [Autentique publica preços de API](https://docs.autentique.com.br/api/2/precos-para-uso-via-api), inclusive plano gratuito limitado e cobrança por criação/solicitação. Ela pode ser mais barata em baixo volume, mas Victor indicou Clicksign como alternativa ao Google. Não declarar a Clicksign a mais barata do mercado sem cotação equivalente para o volume e nível de autenticação escolhidos.

## Assinatura da V2G

A [assinatura automática da Clicksign](https://developers.clicksign.com/docs/assinatura-automatica) exige que Victor assine antes um **Termo de Assinatura Automática** com a conta PJ; só então a plataforma aceita `auto_signature` para ele. Isso não autoriza assinar em nome do cliente: o representante da empresa cliente assina pessoalmente. Até o termo estar válido e a minuta jurídica aprovada, Victor continua como signatário manual. O estado `signed` só pode ser gravado depois de todas as assinaturas necessárias confirmadas pelo provedor.

## Contrato técnico para a próxima integração

1. Entrada: `order_id`, `business_id`, versão da minuta aprovada, hash do PDF gerado, e-mail verificado da compra, dados da pessoa jurídica e das unidades contratadas. Capturar separadamente nome, e-mail, CPF, cargo/poderes do signatário do cliente e endereço contratual; esses campos **não** estão completos em `commercial_orders` hoje. Não inferir poderes pela posse do e-mail.
2. Saída para Clicksign: um envelope por `(order_id, template_version)`; usar `contract_documents.provider_document_id` para associar o ID externo. A unicidade já existe para essa chave interna. Em erro depois de criar envelope, consultar o ID antes de tentar de novo; evitar cobrança/documento duplicado.
3. Assinantes: Victor e representante do cliente por e-mail, com requisitos de autenticação e qualificação aceitos na minuta. Notificação somente após ativar envelope. Tratar `draft`, `sent`, `partially_signed`, `signed`, `voided`, `failed` sem afirmar conclusão prematura.
4. Retorno: webhook HTTPS com validação de integridade conforme a [segurança de webhooks](https://developers.clicksign.com/v3.0/docs/melhores-praticas-webhooks); conferir envelope/documento diretamente na API quando necessário, casar IDs, registrar evento idempotente em `commercial_events` e só então atualizar o contrato. Arquivar PDF final e trilha de auditoria, registrar entrega ao cliente e manter a trava de campanha até confirmação.
5. Testes antes de produção: falta de signatário, e-mail divergente, minuta sem aprovação, duas tentativas, falha depois de criar envelope, webhook falso/repetido/fora de ordem, assinatura só de Victor, assinatura de ambos, documento cancelado, entrega falhada. Nenhum desses eventos foi disparado ao provedor nesta etapa.

## Portões ainda fechados

Minuta jurídica revisada e versionada; conta Clicksign e plano com API confirmados; termo de assinatura automática da V2G se Victor quiser contrassinar sem ação por contrato; dados dos signatários e do endereço; armazenamento seguro do PDF; configuração do webhook/credenciais em sandbox. O código atual conserva a assinatura como pendente e impede publicar a primeira campanha por esse caminho.

## Verificação desta passagem

`pnpm typecheck`, `conferir:contratacao` (4 cenários) e `conferir:preco-contratacao` (3 cenários) passaram. A suíte `pnpm conferir` parou em `conferir:migrations` porque os objetos da migration RevOps local ainda não constam no banco compartilhado; a migration não foi aplicada. O build não foi repetido nesta passagem porque já havia um servidor Next ouvindo na porta 3000 e o repositório divide `.next` entre desenvolvimento e build. Nenhum envio de contrato, assinatura, nota ou cobrança foi realizado.
