# Ensaio da compra única com pagamento e estorno

Data: 21/10/2026. Ensaio especificamente autorizado por Victor: uma primeira cobrança mensal fictícia de R$ 500 no Asaas Sandbox, cancelamento da assinatura e estorno ao encerrar; e-mail de teste somente para o destinatário empresarial aprovado. O teste financeiro e a limpeza passaram; e-mail e acesso ao novo negócio continuam sem prova ponta a ponta.

## 0. Próxima autorização necessária

Configurar remetente e credencial de envio de teste e publicar essa configuração somente no projeto QA; revisar a ativação QA de 3DS separadamente. Nenhuma mudança desse tipo foi executada. Nunca solicitar senha ou chave no chat nem enviar confirmação de pagamento após estorno como se ainda fosse pagamento válido.

Não criar nova cobrança para testar e-mail sob a autorização de uma única cobrança já consumida. O fluxo futuro com 3DS/e-mail requer novo ensaio financeiro autorizado quando estiver pronto. Clientes antigos e liberação manual de acesso continuam adiados por Victor.

## Descontos

Victor confirmou desconto à vista semestral e anual. Registrado em `docs/decisoes.md`, substituindo a ausência de desconto semestral de 06/10. Valores do código preservados: semestral 5%, R$ 2.850 por conta; anual 12%, R$ 5.280. Não houve recálculo, migration ou alteração de preço neste bloco.

## Pedido e segurança

- QA exclusivo `zskpijnqgkqwxksqmzmf`, página `https://v2g-webapp-qa.vercel.app/contratar` pela sessão QA04 indicada por Victor, sem papel de operador.
- Novo pedido `c947b641-1001-459c-8ba9-1dfc348a80be`, referência `495f27ee-c007-4319-9c5e-27e629585ad7`, negócio `5433a7bd-abb6-49e2-983f-af3a5baf99d2`.
- Identificação de teste: `V2G QA Compra Unica 21-10 — FICTICIA`, CNPJ sintético `11222333000262`, conta QA04 e telefone sintético. Negócio marcado `dados_ficticios=true` por update exato, antes do pagamento, sem disparar backend/Meta.
- Antes do ensaio havia 20 pedidos. Criado um pedido mensal de uma conta, R$ 500, inicialmente `awaiting_payment`, sem IDs de cobrança ou assinatura. Não foi criado outro pedido para repetir a tentativa.
- Usado somente cartão fictício da documentação oficial do Sandbox, sem persistir número/CCV: https://docs.asaas.com/docs/faq-sandbox . O código de cadastro de pagador mantém `notificationDisabled=true`.
- Primeira submissão de pagamento retornou falha na verificação de segurança. Consulta confirmou IDs nulos, reserva nula e zero tentativas externas contabilizadas. Após atualização da mesma página, o widget gerou resposta automaticamente; nenhuma leitura do valor do token, resolução de CAPTCHA pelo agente ou desativação de segurança. A segunda submissão seguiu normalmente.
- O navegador teve um timeout de observação após o envio. Em vez de repetir pagamento, consultado o pedido no QA para conciliar: pagamento já aprovado com uma cobrança e uma assinatura. Nenhuma terceira submissão financeira.

## Pagamento confirmado

- Pedido em `payment_approved`, `provider_card_flow=direct`, `payment_attempt_count=1`.
- Pagador `cus_000009620432`, cobrança `pay_tnsleg6pm6w8xszn`, assinatura `sub_ngps4nr5yh3z9upl`.
- `commercial_events`: um `PAYMENT_CONFIRMED` para o pedido. A página exibiu pagamento confirmado e ação de criar acesso.
- Este foi o fluxo direto de assinatura do Sandbox, não prova de 3DS. A tela não mostrou o texto próprio do 3DS e o fluxo gravado é `direct`. A documentação oficial também limita a prova do desafio no Sandbox: https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds .

## Cancelamento e estorno concluídos

Criado `scripts/qa-compra-unica-limpeza-20261021.mjs`, exclusivo para esses IDs e valor. O script exige ambiente Sandbox e URL do banco QA, confere no provedor cliente, referência do pedido, assinatura, cartão, periodicidade e valor antes de qualquer escrita. Não possui criação de cliente, assinatura, cobrança ou novo ciclo.

Executado com a configuração local existente, carregada pelo runtime sem imprimir credenciais nem editar `.env`. A inspeção exibiu somente resultados de guardas; nenhum valor secreto foi lido manualmente ou exposto. A limpeza permitida usa DELETE da assinatura e POST de estorno uma única vez, sem reenvio automático em estado ambíguo.

Resultado verificado por GET no Asaas: assinatura `deleted=true`, `status=INACTIVE`; única cobrança de R$ 500 em `REFUNDED`, com um estorno de R$ 500 em `DONE`. A lista da assinatura contém uma cobrança, sem geração de ciclo seguinte.

O webhook chegou ao QA: um `PAYMENT_REFUNDED` e um `PAYMENT_CREATED` no ledger financeiro; aprovação inicial mantida no evento comercial. Após atualizar a página, o aviso passou a estorno integral e desapareceu o convite de criar acesso.

Prova visual privada: `C:/Users/victo/v2g-backups/qa-compra-unica-estorno-20261021.png`. Referências oficiais: https://docs.asaas.com/reference/remover-assinatura e https://docs.asaas.com/reference/estornar-cobranca .

## E-mail e acesso ainda não comprovados

A outbox permaneceu sem linhas para o pedido. Inspeção de metadados de configuração Vercel com `decrypt=false`, retornando ao agente apenas NOMES e destinos de ambiente, não encontrou `V2G_PAYMENT_EMAIL_ENABLED`, `V2G_PAYMENT_EMAIL_FROM`, `V2G_PAYMENT_EMAIL_RESEND_API_KEY` ou `V2G_PAYMENT_EMAIL_QA_TO` no projeto QA. Também não encontrou os nomes de ativação `V2G_CHECKOUT_3DS_SCHEMA_ENABLED`/`V2G_CHECKOUT_3DS_ENABLED`. As configurações Turnstile existem. Nenhuma configuração foi criada/editada.

Não houve e-mail real enviado por este ensaio, nem prova de recebimento. Não usar envio manual fora do fluxo para declarar a integração concluída.

O pedido e negócio continuam sem reivindicação de perfil nessa consulta (`buyer_profile_id` e `profile_id` nulos); o teste não incluiu novo login/primeiro acesso antes do estorno. Portanto não certifica a liberação ao negócio correto. O `status=payment_approved` permanece como estado comercial histórico após o estorno, enquanto a página lê o ledger adverso; revisar a consistência das portas de cadastro/vínculo/acesso nesse caso antes da abertura real, sem promover nova compra ou alterar a conta de Victor para forçar prova.

## Limites

Sem produção, deploy, commit/push, nova migration, e-mail real, contrato ou nota. Nenhuma assinatura deste ensaio ficou ativa. O novo pedido/negócio fictício e seus eventos foram preservados como evidência, não apagados. A retirada do papel temporário de operador já havia sido concluída no bloco anterior.
