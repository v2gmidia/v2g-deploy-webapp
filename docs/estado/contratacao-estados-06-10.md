# Contratação — núcleo local de estados, 06/10/2026

`lib/contratacao/estado.ts` define as transições que o WebApp poderá aplicar **depois** de verificar a origem de cada evento. Não há endpoint de pagamento, assinatura ou emissão ligado a ele.

O módulo cobre apenas a **primeira liberação**. Renovação mensal, atraso, estorno, chargeback, cancelamento de NFS-e e efeito de saída antecipada exigem estados próprios e decisão operacional; não usar os booleanos locais para revogar ou manter acesso após esses eventos.

- Um comprovante Pix recebido só registra o documento; a aprovação identificada do operador muda o pagamento para aprovado.
- Um evento do Asaas só deve chegar ao núcleo depois da validação da assinatura do webhook, identidade da cobrança, valor, unidade comprada e estado efetivamente pago. Retorno de página de sucesso não é confirmação.
- O acesso depende de pagamento aprovado. A primeira campanha depende também de contrato assinado, além das conferências operacionais e da publicação manual pelo gestor.
- “Nota emitida” depende de autorização do emissor, não da simples solicitação de emissão.
- IDs de evento são idempotentes dentro do pedido. O armazenamento futuro precisa impor unicidade por provedor, objeto e evento; repetição ou chegada fora de ordem não pode criar cobrança, contrato, nota ou aviso em duplicidade.

`scripts/conferir-contratacao.mjs` prova localmente comprovante insuficiente, acesso antes da assinatura, campanha travada até assinatura, repetição de evento e nota somente após autorização. Não prova autenticidade de webhook, autorização no banco, entrega de e-mail, pagamento real, assinatura real ou emissão fiscal. As migrations posteriores estão registradas em `contratacao-banco-06-10.md`.
