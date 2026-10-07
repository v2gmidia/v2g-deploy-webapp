# Pix assistido — entrega local de 06/10/2026

O operador autenticado em `/pedidos` registra uma venda assistida a partir das declarações de CNPJ e venda pelo WhatsApp, e-mail da compra, razão social, CNPJ, quantidade de contas de anúncio e período. O preço é R$ 500 por conta/mês ou R$ 5.280 por conta/ano à vista. A tela não cobra nem envia chave Pix. O operador informa os dados de pagamento no atendimento, registra uma referência do comprovante recebido e aprova o acesso separadamente. O cliente ainda precisa confirmar o e-mail e entrar com o e-mail da compra.

A migration `0029_pix_assistido.sql` foi aplicada ao projeto V2G-SITE como `pix_assistido_20261006`. As três funções executam criação de negócio/pedido/unidades, registro do comprovante e aprovação em transações do banco. IDs de repetição são únicos, e uma compra Pix em aberto por e-mail/CNPJ é permitida. As funções só concedem `EXECUTE` a `service_role`; o proxy, a página e cada action conferem papel de operador. Um comprovante registrado não libera acesso. A aprovação exige comprovante e negócio vinculado. O evento e a mudança de status ocorrem na mesma transação.

## Evidência

- Antes da migration: 0 pedidos, 6 negócios, 10 perfis, 0 vínculos multiconta. Depois: mesmas contagens; três funções presentes.
- Teste SQL transacional com dados fictícios e reversão: mesma referência não duplicou pedido; duas unidades geradas; registro repetido de comprovante e aprovação repetida deixaram dois eventos ao todo; status final aprovado dentro do teste. Após a reversão: 0 pedidos e 6 negócios. `anon` e `authenticated` não executam a função de aprovação; `service_role` executa.
- Outro teste revertido recusou aprovação sem comprovante e rejeitou e-mail inválido. As contagens permaneceram em 0 pedidos e 6 negócios.
- `pnpm conferir` e `pnpm build` passaram. A rota `/pedidos` sem sessão redirecionou para `/entrar?next=%2Fpedidos` no servidor local. Não houve teste visual autenticado como operador, compra real, mensagem enviada ou pagamento.

## Limites

- A referência do comprovante é anotação operacional; não há upload do documento nem conciliação bancária. Victor aceitou o comprovante como base da conferência manual. A interface não afirma liquidação no banco.
- A página mostra no máximo 100 pedidos recentes e ainda não tem busca, cancelamento ou reconciliação. O caminho self-service e cartão Asaas continuam pendentes de conta e integração.
- O contrato não é enviado para assinatura e a NFS-e não é emitida por este fluxo. As travas existentes mantêm a publicação da primeira campanha dependente de assinatura no WebApp; o backend precisa aplicar a mesma regra.
- O ledger remoto usa nomes distintos dos arquivos locais desde a `0026`; não executar `pnpm db:migrate` sem reconciliar.
