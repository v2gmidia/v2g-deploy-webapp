# Asaas — retorno humano e acompanhamento de 14/10/2026

## 0. Pendências

- Helen confirmou em 14/10 que `POST /v3/subscriptions` **não suporta 3DS**. Ainda não indicou um fluxo oficial de primeira cobrança avulsa autenticada, com assinatura iniciando no mês seguinte sem duplicar a cobrança.
- A tokenização da conta V2G em produção **não está liberada por esta resposta**. Helen informou que a liberação deve ser solicitada ao gerente de contas e depende de análise. A V2G pediu os requisitos e ainda aguarda retorno.
- O estorno dos dois testes Pix que terminaram `CANCELLED` não foi concluído. O suporte atribuiu o limite ao pagamento apenas simulado no Sandbox e orientou, para um novo teste, pagar um Pix de uma conta Sandbox com outra conta Asaas antes de estornar. Nenhum novo pagamento ou estorno foi feito neste bloco.
- O painel `asaas.com/dashboard/home` abriu no login do navegador integrado em 14/10; a sessão autenticada do Chrome não estava disponível para esta conversa. Não houve contato novo pelo chat do painel.

## Evidência de e-mail

- Ticket de integrações `1835325`, assunto **V2G | confirmação de tokenização, assinatura com 3DS e estornos Sandbox**.
- Helen respondeu em **13/10/2026, 16:47 UTC**. A resposta humana afirma que a tokenização deve ser feita pela API no backend, funciona no Sandbox para testes e exige pedido de liberação ao gerente de contas em produção. Para 3DS, remeteu aos eventos de webhook de cobrança, sem responder à compatibilidade específica com a criação de assinatura.
- Sobre o Pix, Helen explicou que a cobrança marcada como recebida no Sandbox é mock e pode não permitir simular o estorno completo. Sugeriu pagar de fato o Pix com uma segunda conta Asaas Sandbox para testar o fluxo de devolução. A afirmação genérica dela sobre produção não substitui prova de um estorno real da V2G.
- A V2G respondeu à Helen em **13/10/2026, 20:05 UTC**, com o estado de QA e dos controles de segurança e perguntas explícitas sobre os requisitos da conta, `remoteIp`, 3DS inicial em `/v3/subscriptions` e prevenção de duplicidade no primeiro mês. A busca na caixa em **14/10, perto de 10h de Brasília**, não encontrou resposta posterior do Asaas.
- Às **10h50 de Brasília em 14/10**, Helen respondeu à última mensagem: 3DS não está disponível em `POST /v3/subscriptions`; o 3DS de cobrança avulsa ou parcelamento não pode ser reaproveitado na assinatura. Ela afirmou que todas as medidas de segurança listadas anteriormente precisam ser implementadas para habilitar 3DS na conta e perguntou se a V2G quer continuar a solicitação. A resposta não confirmou liberação de tokenização em produção nem explicou como evitar cobrança duplicada no primeiro mês ou qual evento libera acesso nesse desenho.
- Às **11h de Brasília em 14/10**, a V2G respondeu na mesma conversa, aceitando continuar **a avaliação**, sem pedir ativação imediata. Solicitou requisitos próprios da tokenização, fluxo oficial para primeira cobrança avulsa com 3DS seguida de assinatura no mês seguinte e eventos/alternativa caso o fluxo não seja suportado. O envio Gmail `1a13ab807af4af8d` foi confirmado na pasta `Sent`. Nenhuma chave, token ou dado de cartão foi enviado.

## Limite da verificação de hoje

A leitura da caixa V2G comprova o teor dos e-mails e o envio da réplica. Não comprova ativação de tokenização ou 3DS, estado atual da conta de produção ou estorno concluído. Não foi criada cobrança, não se repetiu estorno e não se enviou segredo.
