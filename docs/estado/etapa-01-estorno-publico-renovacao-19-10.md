# Etapa 01 — estorno público e ciclo seguinte antecipado — 19/10/2026

## 0. O que ainda impede concluir a etapa inteira

1. Os ajustes de tela deste lote estão **locais**, ainda sem commit/push/deploy.
   Victor publica o código pelo fluxo manual do repositório. Repetir o ensaio da
   página e API no HTTPS QA depois de publicar.
2. O checkout vigente cria assinatura direta no Sandbox. O fluxo avulsa com 3DS
   → confirmação reconciliada → token → assinatura começando no mês seguinte
   ainda precisa de implementação integrada. O arquivo `fluxo-cartao-mensal.ts`
   continua sendo política pura; seus testes não certificam essa integração.
3. O Asaas informa que o Sandbox não executa o desafio real do banco. Para
   produção, também depende de habilitação do 3DS e tokenização/análise da conta.
   Não houve confirmação nova dessa liberação na busca de e-mail deste lote.
4. O ciclo de novembro foi antecipado e pago via API com token. Não houve espera
   até novembro, execução natural da agenda ou prova de débito automático no vencimento.
5. A suíte geral interrompeu em `conferir:migrations`: 18 falhas no QA, incluindo
   arquivos ausentes do manifesto e objetos de outras áreas não existentes nesse
   banco. Não aplicar em lote migrations de Meta, RevOps ou fiscal para tornar a
   suíte verde. É necessário reconciliar o manifesto e o recorte do ambiente.

Nenhum código, configuração ou banco de produção foi alterado. Etapa 02 segue adiada.

## Ajustes implementados localmente

- `lib/contratacao/estado-pagamento-publico.ts`: estado de exibição distinto da
  aprovação histórica. Representa estorno integral/parcial/em andamento, revisão
  e falha de consulta. Não revoga acesso nem altera campanhas.
- `lib/contratacao/consultar-estado-pagamento.ts`: consulta somente a cobrança
  inicial daquele pedido. Não mistura estorno de renovação com a compra inicial.
  Falha e limite de leitura atingido não viram aprovação.
- Página de pagamento e API de status usam a mesma consulta. API entrega apenas
  estado resumido; não entrega contato, IDs do provedor ou payload bruto.
- `EstadoPagamento.tsx`: mensagem textual, sem CTA de cadastro quando há ocorrência;
  continua consultando após aprovação para observar mudanças enquanto a página
  está aberta; sem requisições simultâneas, com timeout e cancelamento ao desmontar.
- Mantidos layout, identidade e classes de feedback existentes, conforme Impeccable.
- Build acusou export inválido `temaDoCookie` no layout Next. Função, tipo e nome
  do cookie foram movidos para `lib/tema.ts`, com os consumidores atualizados.
  Mesma normalização e comportamento de tema, cobertos por teste.

## Prova local com dados reais do QA, somente leitura

- Pedido estornado do bloco anterior:
  `809717c6-1b88-4b97-bacb-e118f2623f2d`.
- Helper consultou o QA e retornou `refunded`, embora a aprovação histórica
  permaneça `payment_approved`.
- Navegador no servidor local exibiu estorno integral, sem “Criar meu acesso”.
- API local retornou HTTP 200 e `{ "status": "refunded" }`, com `no-store`;
  referência inválida retornou 400 e inexistente 404, sem dados privados.
- Turbopack dev devolveu HTML 404 nessa API. Com o compilador webpack, página e
  API funcionaram. O build de produção Turbopack passou após corrigir o export
  do layout. Não atribuir o 404 transitório à lógica financeira sem nova prova.
- Captura: `C:\Users\victo\.codex\visualizations\2026\10\19\etapa01-qa\estorno-pagina-corrigida-local.png`.

## Ensaio de renovação autorizado no chat

Victor autorizou até dois pagamentos fictícios de R$ 500 e limpeza ao final.
Criado pedido próprio via RPC existente, com e-mail `example.invalid`, negócio
marcado fictício e sem criar usuário de cliente. Primeiro pagamento realizado no
checkout HTTPS QA com cartão de teste; confirmação veio do webhook, não de alteração
manual do estado.

- Pedido: `f480515b-0149-4d31-9869-482f3c0612c0`.
- Negócio: `a8f89a77-ff22-4214-b616-f02b7ffcf108`.
- Referência: `b0068c60-7282-4e24-a893-c107b18ba267`.
- Assinatura: `sub_i7ialxqw0h4kmqp4`.
- Inicial: `pay_advkkug76x8r7vxr`, vencimento 19/10/2026, R$ 500.
- Ciclo seguinte: `pay_p7p5i8v1ykvu4xht`, vencimento 19/11/2026, R$ 500.

### Incidente do recurso de carnê

A chamada oficial de antecipação com mês 11/ano 2026 retornou HTTP 400, mas gerou
lançamentos pendentes de novembro **e dezembro**. A conciliação detectou o efeito
mesmo com erro; nenhuma nova geração foi enviada. O terceiro lançamento,
`pay_vg1phg5nh3dth64m`, de 19/12/2026, estava `PENDING` e nunca foi pago.
Foi removido de forma recuperável no Asaas e verificado `deleted=true`.
O histórico `PAYMENT_CREATED` permanece no ledger; não é prova de pagamento.
Não reusar esse endpoint assumindo que HTTP 400 significa ausência de efeito
ou que os parâmetros restringem necessariamente a um único ciclo.

### Pagamento, webhook e idempotência

Novembro foi pago com o token da mesma assinatura/cliente, mantido somente em
memória, sem reenviar os dados completos do cartão. Asaas retornou `CONFIRMED`.
O webhook autêntico `evt_15e444ff9b9ab9ec29294aa1abe68025&22771034` registrou
R$ 500 e vencimento de novembro. Dois reenvios retornaram 200, mantendo um evento,
uma aprovação comercial e o ID da cobrança inicial inalterado.

### Limpeza confirmada

- Assinatura `deleted=true`, `INACTIVE`.
- Ambos os pagamentos `REFUNDED`, com devoluções `DONE` de R$ 500 cada.
- Um `PAYMENT_REFUNDED` autêntico por cobrança no QA:
  - novembro: `evt_d313266b1bd58128da69a2a96d82e79e&22771071`;
  - outubro: `evt_d313266b1bd58128da69a2a96d82e79e&22771074`.
- Excedente de dezembro continuou removido e nunca pago.
- Evidência financeira e negócio fictício preservados para auditoria. Nenhum
  dinheiro real movimentado; nenhuma recorrência ativa deixada por este ensaio.

## Testes e limites

Passaram `pnpm build`, `pnpm typecheck` e 39 testes focados:
pagamento público 9, checkout 8, checkout-api 7, cartão mensal 6, eventos 3,
acesso 6. Detector de interface sem achados nos arquivos conferidos.
`pnpm conferir` não concluiu: interrompeu nas 18 divergências de migrations descritas
na §0. As fases posteriores da suíte geral não podem ser declaradas aprovadas.

Scripts novos:

- `scripts/conferir-estado-pagamento-publico.mjs` — lógica, consulta, componente
  real renderizado e regressão de tema; sem rede.
- `scripts/qa-etapa01-estado-publico.mjs` — leitura do pedido estornado específico;
  `--preview --webpack` abre servidor só em loopback; `--http` verifica sua API.
- `scripts/qa-etapa01-renovacao-sandbox.mjs` — somente a fixture autorizada;
  `--verificar-limpeza` é a verificação final. Não reutilizar os flags de escrita
  como autorização para outro teste ou restaurar a assinatura encerrada.

## Fontes do provedor consultadas

- [3DS: campos, callback, webhook e limitação de desafio no Sandbox](https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds).
- [Antecipação de cobranças de assinatura](https://docs.asaas.com/docs/como-gerar-novas-cobran%C3%A7as-de-uma-assinatura).
- [Endpoint de geração de carnê](https://docs.asaas.com/reference/gerar-carne-de-assinatura).
- [Pagamento de uma cobrança com cartão/token](https://docs.asaas.com/reference/pagar-uma-cobranca-com-cartao-de-credito).
