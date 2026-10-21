# Comercial: alertas e confirmacao — 21/10/2026

## Decisao e limite

Victor aprovou iniciar compra direta e atendimento assistido com cobranca pelo Asaas nos dois caminhos. O formulario deve permitir WhatsApp pessoal imediato (21 98035-1531) e alertar victor.cabral@v2gmidia.com.br, confirmado no perfil Gmail conectado. Registro operacional no Obsidian: `50 - V2G/Operação/Processo comercial - pré-venda e pós-venda.md`.

Este bloco e preparo local. Nao houve deploy, migration aplicada, cobranca ou envio real de e-mail. Nao altera os documentos centrais de prioridade nem declara checkout publico concluido. As restricoes de producao permanecem.

## Implementacao local

- LP: `assets/lp.v7.js` e `api/pre-cadastro.js` usam o WhatsApp pessoal, apos captura bem-sucedida. A pessoa clica para conversar; nenhum WhatsApp e enviado automaticamente.
- LP: `api/_alerta-lead.js` envia alerta textual ao destinatario fixo, com chave de idempotencia e ate duas tentativas imediatas. Falha nao perde o lead nem impede contato. **Nao e fila duravel**: falha final exige reconciliacao dos leads persistidos.
- Pagamento: `lib/contratacao/email-pagamento.ts` valida cobranca, cliente, assinatura, valor e estado aprovado; diferencia primeira compra e renovacao. Texto nao promete nota fiscal nem contrato.
- `lib/contratacao/processar-email-pagamento.ts` e webhook preparam envio exclusivo QA, apenas ao Victor. Flag desligada nao consulta a nova tabela. Depende tambem do schema 3DS ja preparado anteriormente.
- Migration local `20261021033313_commercial_payment_email_outbox.sql`: uma mensagem por pedido/cobranca, acesso restrito ao servidor, reserva exclusiva. Aceite pelo provedor nao comprova chegada; timeout/resultado ambiguo exige revisao, sem reenvio automatico cego. Nao existe worker agendado neste bloco.

## Para ativar — proximo bloco

1. Confirmar/configurar remetente verificado e credencial de envio em ambiente privado. Nenhum segredo foi lido, criado ou publicado neste bloco.
2. Autorizar separadamente backup e aplicacao da nova migration **somente QA**.
3. Configurar QA com `V2G_PAYMENT_EMAIL_ENABLED`, `V2G_PAYMENT_EMAIL_FROM`, `V2G_PAYMENT_EMAIL_RESEND_API_KEY`, `V2G_PAYMENT_EMAIL_QA_TO`. O destino QA precisa ser o e-mail confirmado do Victor. Testar inbox antes de clientes. Configuracao invalida com flag ligada retorna pendencia no webhook; nao ativar parcialmente.
4. LP: configurar `LEADS_ALERT_EMAIL_ENABLED`, `LEADS_ALERT_FROM`, `LEADS_ALERT_RESEND_API_KEY` e testar alerta real autorizado. Publicacao depende de autorizacao separada.
5. Checkout publico ainda requer concluir passagem segura LP/pedido, habilitacao do Asaas aplicavel ao fluxo, configuracao e prova em ambiente autorizado. O preparo do e-mail nao remove essa trava.
6. Migrar e-mails de pagamento de QA para destinatarios reais somente em novo bloco aprovado. Hoje o adaptador envia apenas teste ao Victor.

NFS-e automatica aguarda Contabilizei. Comprovante/confirmacao de pagamento nao substitui nota quando exigivel. Contrato permanece pendencia independente; pagamento nao significa aceite juridico concluido.

## Evidencia

Conferidores LP de contato, jornada e alerta passaram com rede simulada. Conferidores WebApp de e-mail, 3DS, estado publico, seguranca e API de checkout: 41 testes passaram; typecheck passou. Teste PostgreSQL isolado adicional valida a migration sem acessar Supabase. Nenhum desses resultados prova entrega em caixa, publicacao ou transacao real.
