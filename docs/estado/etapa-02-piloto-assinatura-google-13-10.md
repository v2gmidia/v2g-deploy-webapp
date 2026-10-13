# Etapa 02 — piloto de assinatura com Google Workspace, 13/10/2026

## Decisão operacional

Victor escolheu começar sem contratar outro provedor. O pedido aprovado fornece os dados de compra; a equipe prepara o contrato final aprovado e inicia **manualmente** a solicitação de assinatura eletrônica no Google Docs. A solicitação enviada pelo Google gera e-mail para os signatários, lembretes e cópia final após a conclusão. Não é necessário um e-mail do Asaas para convidar à assinatura. O evento de pagamento do Asaas serve para identificar que o pedido está apto a entrar na fila, não como prova de assinatura.

Este é o desenho do piloto. A minuta V2 atual é de teste e **não pode ser enviada para assinatura**; não há contrato assinado, provedor integrado nem emissão de NFS-e.

## Dados que existem e dados que faltam

O checkout coleta nome do comprador, e-mail, WhatsApp, razão social, CNPJ, quantidade de contas, plano e preço (`lib/contratacao/qualificacao.ts`; `supabase/migrations/0034_checkout_self_service.sql`). Esses campos permitem preparar o quadro-resumo e conciliar o pedido. O nome de quem compra não prova poderes para assinar pela pessoa jurídica.

Antes de gerar o documento final, a fila interna precisa confirmar: nome civil e e-mail do representante do cliente, cargo/capacidade, prova dos poderes ou procuração, dados completos da pessoa jurídica exigidos pela minuta e signatário da V2G. Valores e cláusulas saem de uma versão identificada e aprovada; não de texto livre nem da resposta do checkout. Registrar `order_id`, versão e SHA-256 do PDF, signatários conferidos e pendências. A função `lib/contratacao/preparo-assinatura.ts` já expressa essa trava, mas não envia documento.

## Operação inicial, pedido por pedido

1. Confirmar no WebApp o pagamento aprovado e o e-mail verificado. Separar o pedido da manifestação de interesse na LP; não gerar contrato a partir de um lead.
2. Conferir CNPJ, plano, valor, representante e poderes. Se faltar dado, solicitar complemento; não presumir que o pagador assina pela empresa.
3. Preencher **somente** a minuta final aprovada, produzir PDF e conferir visualmente dados e cláusulas. Arquivar versão e hash. A minuta de teste V2 não passa nesta etapa.
4. No Google Docs/Drive, iniciar a solicitação de assinatura eletrônica para os signatários aprovados e guardar identificador/link de acompanhamento. A equipe faz este clique manualmente no piloto. O Google envia o convite e seus lembretes aos signatários.
5. Conferir que **todas** as assinaturas exigidas foram concluídas; obter PDF final e trilha/comprovante do Google, guardar em local com acesso controlado e verificar a entrega da cópia. Só então registrar o contrato como assinado. E-mail de convite enviado, resposta do Gmail ou assinatura parcial não concluem o contrato.
6. A primeira publicação da campanha permanece bloqueada até essa comprovação. O acesso ao WebApp após pagamento segue a decisão vigente. Pedido sem assinatura no prazo segue a regra da **minuta final aprovada**, não uma decisão automática do n8n.

### Texto de acompanhamento para o piloto

Usar somente depois de conferir que a solicitação real foi enviada pelo Google e que a minuta final está aprovada. O e-mail do próprio Google contém o link de assinatura; a V2G não precisa criar nem encurtar esse link.

**Assunto:** Seu contrato V2G está pronto para assinatura

> Olá, [nome]. Enviamos pelo Google a solicitação de assinatura do contrato referente ao seu pedido [identificador]. Confira os dados da empresa, o plano e os valores antes de assinar. Se algum dado estiver incorreto ou você não for a pessoa autorizada a representar a empresa, responda a este e-mail antes de assinar. Após todas as assinaturas, você receberá a cópia final. Em caso de dúvida, fale com a V2G por este e-mail.

Não usar este texto como confirmação de que o contrato está assinado, de que a campanha foi publicada ou de que houve emissão fiscal.

O Gmail pode avisar a equipe sobre mensagens, mas não é fonte autoritativa para mudar `contract_documents.status` para `signed`. Não há API pública documentada do Google Docs/Drive que inicie a solicitação de assinatura eletrônica nem webhook de conclusão para esse produto; portanto o n8n não deve simular esses estados.

## Caminho pronto para aumentar volume

**Autentique** é a candidata técnica para a fase de envio automático, sem contratação agora. A documentação oficial consultada em 13/10 informa faixa gratuita de até **10 documentos por mês** via API e plano pago a partir de R$ 99/mês ao exceder essa faixa; preço e limite precisam ser conferidos antes da adesão. A API cria documento e signatários e oferece eventos de assinatura/conclusão. Ela exigirá teste com dados fictícios, configuração segura, conciliação por pedido e versão, armazenamento do PDF assinado e da trilha, e avaliação da versão jurídica aprovada. Não assumir que sua API permite o cliente assinar dentro do WebApp: o piloto e a opção futura usam convite/link hospedado pelo provedor.

O rascunho n8n da etapa 02 continua manual, não publicado e com `contract_action=BLOCKED`/`fiscal_action=BLOCKED`. O desenho futuro é: pagamento confirmado → reler pedido no servidor → completar poderes/dados → reservar `(order_id, template_version)` → criar documento no provedor por API → enviar link → conciliar eventos autenticados → arquivar prova. No piloto Google, substituir as etapas de API por tarefa humana registrada; não ativar envio real pelo n8n.

## Nota fiscal

A Contabilizei ainda precisa confirmar valores por competência, mês parcial, tomador fora de Curitiba, retenções e tratamento de cancelamento/estorno. A migration fiscal `20261013060000` está preparada, **não aplicada**. Nenhuma nota deve ser gerada pelo pedido, pelo pagamento ou pelo contrato assinado enquanto a configuração fiscal não estiver aprovada e testada.

## Referências consultadas

- [Google Workspace: solicitar assinaturas eletrônicas](https://support.google.com/docs/answer/12315692?hl=en-aa)
- [Google Docs API: operações disponíveis](https://developers.google.com/workspace/docs/api/concepts/request-response)
- [Google Drive API v3](https://developers.google.com/workspace/drive/api/reference/rest/v3)
- [Autentique: preços da API](https://docs.autentique.com.br/api/2/precos-para-uso-via-api)
- [Autentique: criação de documento](https://docs.autentique.com.br/api/2/mutations/criando-um-documento)
- [Autentique: webhooks](https://docs.autentique.com.br/api/integration-basics/webhooks)
