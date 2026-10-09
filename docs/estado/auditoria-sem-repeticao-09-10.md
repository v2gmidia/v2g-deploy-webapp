# Auditoria de progresso sem repetição — 09/10/2026

Este registro atualiza a leitura dos handoffs anteriores. O `guia-outubro-08-10.md` é um retrato de 08/10 e sua linha “compra direta: construir” ficou superada pelos ensaios de 08–09/10. Não usar aquela linha como estado atual.

## Compra: provas já obtidas, não repetir por rotina

- O checkout por API dentro da V2G foi ensaiado no Asaas Sandbox com banco QA e webhook HTTPS temporário. Pix semestral de R$ 2.850, cartão anual de R$ 5.280 e a **primeira cobrança** de assinatura mensal de R$ 500 chegaram a `payment_approved` após evento do provedor. Antes do evento, o pedido permanecia `awaiting_payment`. Reenvio do evento Pix não criou segunda aprovação. Fonte: `checkout-self-service-08-10.md`, seção “Teste integrado do pagamento por API no QA”.
- O pedido antigo do checkout hospedado, QR Pix, recusa de cartão e limite de três tentativas foram verificados em recortes próprios. A recusa conhecida foi observada na API e a liberação de reserva foi exercitada com fixture no QA; **a retentativa completa pela action em HTTPS estável não foi provada**. Fonte: mesmo handoff, seções “Revisão da implementação local” e “Bloco seguinte no QA”.
- A action de cadastro criou Auth para um pedido **fictício aprovado sem transação**, o e-mail de confirmação chegou e um cadastro sem pedido aprovado foi barrado. O link não foi aberto; login e vínculo após confirmação não foram provados. Fonte: mesmo handoff, “Bloco seguinte no QA”.
- Um ensaio HTTP autenticado no QA abriu dois negócios do mesmo usuário e manteve peças/alertas separados; um pedido pendente foi enviado para `acesso-pendente`. Os pedidos aprovados ali eram fixtures, **não pagamentos Asaas**. Fonte: `qa-jornada-alertas-email-09-10.md`.

Não repetir Pix, cartão anual ou primeira cobrança mensal apenas para produzir novamente o mesmo sinal verde. Repetir somente diante de alteração nessa cadeia ou para provar uma borda ainda aberta.

## O próximo marco comprovável

1. **Fechar o acesso após a compra**, com confirmação do link de e-mail, login, vínculo do pedido aprovado e seleção de dois CNPJs em uma mesma jornada. O SMTP e os modelos aparecem salvos no Supabase QA, mas não há prova de entrega após essa configuração. Um **primeiro deployment HTTPS de QA** ficou `READY` e mostrou `/entrar`; `/contratar` ainda respondeu 404 porque a trava do checkout está desligada. Isso não prova Auth nem pagamento nessa publicação. Conferir as variáveis e a proteção do ambiente antes de qualquer ensaio. Fontes: `qa-auth-contrato-seguimento-09-10.md` e `qa-primeiro-deploy-09-10.md`.
2. **Provar somente as bordas do pagamento ainda abertas:** retentativa de cartão pela action sob HTTPS estável, erro ambíguo com conciliação, mensalidade seguinte e estorno/chargeback. Essas provas não desfazem o sucesso da primeira compra no Sandbox. Não abrir produção com elas pendentes.
3. **Contrato e NFS-e:** identificar a versão juridicamente aprovada, configurar provedor de assinatura e dados fiscais, depois testar sandbox e evidência de conclusão. O arquivo local se declara minuta interna com 15 decisões pendentes; nenhuma assinatura nem NFS-e foi emitida. Fonte: `qa-auth-contrato-seguimento-09-10.md`.
4. **Onboarding, agenda e gestor:** a conclusão do questionário e as filas existem; falta percurso de navegador com cliente/operador e conciliação do evento da agenda. Link aberto não é reunião marcada. A primeira campanha continua manual.

## Regra para as próximas rodadas automáticas

Escolher uma prova ou uma falha do próximo marco e levá-la até resultado observável. Se a etapa depende de deploy, documento legal aprovado ou credencial externa ausente, registrar o bloqueio uma vez e avançar em outro item independente de alto impacto. Não gastar rodadas em pequenas alterações laterais nem voltar a anunciar como pendente um teste Sandbox já concluído.
