# Etapa 01 — vínculo, segurança e ciclo financeiro no QA — 19/10/2026

> COMPLEMENTO em 19/10: a tela de estorno foi corrigida localmente e o ciclo seguinte
> antecipado foi ensaiado com token, confirmação e limpeza. Ver [recibo seguinte](./etapa-01-estorno-publico-renovacao-19-10.md).
> Ainda não é prova de publicação da correção, 3DS real ou renovação natural.

## 0. Limites e próximas decisões

Vínculo assistido e controles de segurança foram ativados e ensaiados no QA.
Cartão Sandbox: primeira cobrança confirmada, acesso observado, assinatura
cancelada e estorno integral confirmado. Isso não libera produção nem certifica
3DS, renovação natural, Pix estornado ou chargeback.

- Produção: nenhuma migration, configuração ou cobrança deste lote foi aplicada nela.
- Cartão público com 3DS: a proposta avulsa → token → assinatura continua distinta
  da assinatura direta usada neste ensaio. Não foi certificada aqui.
- Estorno é ocorrência operacional: não revoga automaticamente acesso/campanha.
  O pedido conserva `payment_approved` como aprovação histórica. A página pública
  de pagamento lê esse estado e ainda não representa o estorno; não usá-la como
  posição financeira atual. O gestor mostra `PAYMENT_REFUNDED` e orienta conciliação.
- Etapa 02 permanece adiada por Victor; contrato/fiscal não foram fechados neste lote.
- Não apareceu solicitação de 2FA. As duas operações financeiras fictícias tiveram
  autorizações específicas do Victor no chat.

## Ambiente e alterações externas autorizadas

- Supabase QA: `zskpijnqgkqwxksqmzmf`.
- Alias: <https://v2g-webapp-qa.vercel.app>.
- Deploy READY: `dpl_As61jj2L45tQUCzMM5hmoundjBKk`, commit já publicado
  `8657751b18402a64baaeece14283951835945508`. Nenhum commit/push feito pelo agente.
- Snapshot pré-migration fora do repo:
  `C:\Users\victo\v2g-webapp-backups\2026-10-19_etapa01_qa_pre_migration.json`.
  Escopo: 18 pedidos, 16 unidades, 7 eventos, identificação dos negócios e metadados
  relevantes. Não é backup integral do banco/Auth/Storage.
- QA não tinha `leads_lp`: aplicados os dois SQLs existentes da LP como pré-requisitos,
  depois migrations do vínculo e segurança. Versões no ledger:
  `20261020010719`, `20261020010724`, `20261020010727`, `20261020010734`.
- Flags `V2G_LEAD_ORDER_LINK_ENABLED` e `V2G_CHECKOUT_SECURITY_ENABLED` ligadas
  apenas no QA; segredo HMAC próprio e Turnstile exclusivo do hostname QA.
- Webhook permanente QA preservado e ampliado para todos os 13 eventos financeiros
  suportados; verificado habilitado e sem fila interrompida.

## Evidências executadas

1. SQL com rollback: lead → pedido, unicidade, evento, snapshots de UTMs/consentimento,
   divergências de identidade/quantidade, grants/RLS e limites agregados passaram.
2. HTTPS autenticado: captura via RPC da LP e dois POSTs concorrentes reais em
   `/pedidos` geraram um único pedido e um evento `lead_convertido_em_pedido`.
   CNPJ, e-mail, WhatsApp e quantidade divergentes foram recusados.
3. `/pedidos` e `/gestor/compras` mostraram vínculo, origem, UTMs e consentimento.
   Cliente comum e anônimo não acessaram as telas internas.
4. Checkout HTTPS recusou CAPTCHA ausente/forjado sem criar pedido. Navegador
   atravessou o Turnstile válido. Uma tentativa de cartão com token inválido/expirado
   falhou antes do provedor, sem cobrança nem incremento da tentativa financeira;
   formulário recarregado permitiu seguir com token novo.
5. Cartão oficial de teste: cobrança R$ 500 confirmada pelo Asaas e webhook autêntico;
   página de confirmação observada. Negócio apareceu em `/escolher-negocio` e abriu
   no login existente após confirmação. Nenhuma aprovação manual simulada.
6. Dois reenvios do evento de confirmação retornaram 200, sem duplicar aprovação
   ou registro financeiro.
7. Assinatura cancelada: Asaas `deleted=true`, `status=INACTIVE`, uma cobrança.
8. Estorno integral: Asaas `REFUNDED`, devolução `DONE`, R$ 500. Webhook autêntico
   `PAYMENT_REFUNDED` persistido às 22:23:33 de 19/10, Brasília. Dois reenvios
   retornaram 200 e mantiveram um único registro de estorno.
9. Operador temporário leu `/gestor/compras` via HTTPS: alerta do estorno, ID da
   cobrança e aviso de que não há cancelamento automático do acesso passaram.

## Identificadores para conciliação

- Pedido: `809717c6-1b88-4b97-bacb-e118f2623f2d`.
- Negócio fictício: `ee1a2572-020c-49ae-8617-a5c73d995811`.
- Cobrança: `pay_hhcjxx7c3ytmt48x`.
- Assinatura encerrada: `sub_mef3uhzrknsk78bl`.
- Confirmação: `evt_15e444ff9b9ab9ec29294aa1abe68025&22767852`.
- Estorno: `evt_d313266b1bd58128da69a2a96d82e79e&22768176`.

Pedido e negócio financeiro foram preservados e marcados fictícios para rastreabilidade.
Fixtures exclusivas de vínculo e usuários temporários foram removidos pelos testes;
usuários existentes preservados. Navegador devolvido ao negócio B fictício original.

## Reexecução e verificações locais

- `scripts/qa-etapa01-banco.sql`: transação com rollback, somente QA.
- `scripts/qa-etapa01-http.mjs`: ensaio HTTPS com fixtures próprias; opção
  `--verificar-estorno` consulta o alerta específico deste recibo.
- `scripts/qa-etapa01-seguranca-http.mjs`: recusas de segurança via action publicada.
- `scripts/qa-etapa01-assinatura-sandbox.mjs`: conciliação do pedido autorizado;
  `--replay-estorno` verifica idempotência. Não repetir confirmação após estorno.
- `scripts/qa-etapa01-webhook-sandbox.mjs`: configuração/estorno específicos deste
  ensaio. Flags de escrita registram autorização desta operação, não autorização
  genérica para novas cobranças, pedidos ou ambientes.

Passaram: typecheck; vínculo 4/4; segurança 4/4; checkout 8/8; checkout-api 7/7.
O build remoto ficou READY. Não foi executada a suíte completa neste lote.
Advisors não ficaram sem alertas: tabelas internas com RLS sem policies são
intencionais; proteção de senha vazada desabilitada e outros avisos preexistentes
não foram tratados como resolvidos.
