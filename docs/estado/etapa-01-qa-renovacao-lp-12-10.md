# Etapa 01 — LP publicada e ciclo financeiro no QA (12/10/2026)

## Provas observadas nesta rodada

- A LP publicada respondeu HTTP 200 e continha CNPJ, consentimento, preço mensal de R$ 500 e anual de R$ 5.280. `POST /api/pre-cadastro` com JSON vazio respondeu 422 com erros de campos; nenhum lead válido foi enviado nesta rodada. Os conferidores locais `conferir-contato` e `conferir-jornada` passaram. Isso não prova a gravação de um lead real nem seu vínculo a um pedido.
- No Asaas Sandbox, a assinatura mensal fictícia `sub_66757y2lbk4fgyry` estava ativa, com primeira cobrança de R$ 500 confirmada e cobrança seguinte `pay_4c2civ8bhmqa3ggw` pendente para 08/11/2026. Não foi criada uma segunda assinatura nem uma cobrança adicional para o ensaio.
- O webhook do Sandbox `e341cd5c-5749-4115-9575-2977cc11f7fc`, apontado ao QA HTTPS, passou a observar também `PAYMENT_OVERDUE` e os três estados de estorno. Permaneceu ativo e sem fila interrompida.
- A operação oficial de Sandbox para forçar vencimento retornou HTTP 200 e `OVERDUE` na cobrança seguinte. O Asaas mudou o vencimento de teste para 09/10/2026. O webhook autêntico `PAYMENT_OVERDUE` chegou ao Supabase QA: uma linha para o novo ID de cobrança, R$ 500 e vencimento 09/10. O pedido inicial continuou `payment_approved`, vinculado à primeira cobrança, e conservou um único evento de aprovação. Esse ensaio prova vencimento e registro, não pagamento automático da segunda mensalidade.
- Uma solicitação de estorno integral da cobrança Pix fictícia `pay_qhc1uye9rp6pwoof` retornou HTTP 200 no Sandbox. A consulta separada de estornos mostrou `AWAITING_CRITICAL_ACTION_AUTHORIZATION`; a cobrança ainda estava `RECEIVED` e nenhum evento de estorno havia chegado ao QA. Portanto, **o estorno não foi concluído**. Não repetir a operação nem marcar reembolso como realizado. A autorização crítica pertence ao fluxo de segurança do Asaas.

## O que continua aberto

1. Primeiro acesso de comprador novo: entrega do e-mail, confirmação, login e vínculo do pedido em HTTPS. O teste anterior foi com e-mail já confirmado.
2. Envio positivo da LP e rastreio de origem/consentimento até o pedido. A LP é pré-cadastro; não há compra pública a partir dela.
3. Pagamento ou recusa efetiva de uma mensalidade seguinte. O ensaio desta rodada cobriu a cobrança seguinte **vencida**, não a tentativa automática de cartão na data real.
4. Conclusão do estorno após autorização crítica, evento final e tratamento operacional. Chargeback autêntico não foi provocado. O código apenas registra esses eventos e não revoga acesso ou pausa campanha.
5. Habilitação e contrato de tokenização/3DS da conta de produção, resposta específica do Asaas para assinatura mensal e prova em produção. O Sandbox não reproduz o desafio 3DS.

Não houve pagamento real, nota fiscal, assinatura de contrato, escrita na Meta, commit, push ou deploy nesta rodada.
