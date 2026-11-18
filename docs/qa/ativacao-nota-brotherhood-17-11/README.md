# Pacote para revisão — primeira contratação Nota → Brotherhood

17/11/2026. **Preparado, não aplicado. Cobranças e envios continuam desligados.**

## 1. Resultado proposto

Uma contratação válida da **Nota 360**, como agência, para **uma conta de anúncios da Brotherhood Barbershop**, por **R$ 500/mês**. Agência acompanha a carteira; cliente anunciante não recebe login. O gestor V2G usa a Mesa. Uma unidade paga não cobre os seis anunciantes da Nota.

O pacote mensal publicado usa **cartão com 3DS na primeira mensalidade** e pode criar **assinatura recorrente para o mês seguinte após a confirmação financeira**. Pix mensal não é modalidade automática desse checkout. Confirmar a escolha com o comprador antes de habilitar; não gerar cobrança aqui nem cobrar o ciclo já pago.

**Versan Logistic não entra na compra.** O pagamento relatado deve ser preservado e conciliado separadamente. Os outros quatro anunciantes e seus possíveis Pix não entram nesta primeira emissão. Verificar se Brotherhood já teve algum pagamento/cobrança posterior à escolha inicial, antes de cobrar qualquer período.

## 2. Exatamente o que será ligado após nova autorização

Somente no projeto WebApp oficial `v2g-deploy-webapp`, ambiente Production. Todos os controles abaixo estão `false` na leitura desta preparação; o alvo proposto é `true`.

| Ordem | Controles | Efeito |
|---|---|---|
| A · entrada | `V2G_COMMERCIAL_PRODUCTION_ENTRY_V1_ENABLED` | Permite a entrada/contexto comercial no domínio oficial. Não basta para cobrar. |
| B · processamento | `V2G_COMMERCIAL_FINANCIAL_V1_ENABLED`, `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED`, `V2G_PRODUCTION_URL_CONFIRMED` | Permite receber e conciliar pagamentos pelo caminho oficial. Não tratar retorno do navegador como pagamento. |
| B · mensagens | `V2G_COMMERCIAL_BUYER_PREPARE_ENABLED`, `V2G_COMMERCIAL_INTERNAL_NOTICE_ENABLED`, `V2G_COMMERCIAL_EMAIL_DISPATCH_V1_ENABLED`, `V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED` | Prepara/envia confirmação ao comprador e aviso interno após pagamento elegível; pode atuar sobre filas existentes, que devem ser conferidas antes. |
| B · direitos | `V2G_NOMINAL_COVERAGE_V1_ENABLED` | Consulta/concede cobertura correspondente à unidade paga e ao vínculo legítimo. Não concede operador à agência nem acesso aos clientes dela. |
| B · mensal | `V2G_COMMERCIAL_RECURRING_V1_ENABLED` | Habilita o fluxo que, após confirmação da primeira mensalidade e conferências, cria uma assinatura e concilia próximos ciclos. Não é apenas uma opção visual. |
| C · checkout, por último | `V2G_COMMERCIAL_CHECKOUT_V1_ENABLED`, `V2G_PRODUCTION_CHECKOUT_ENABLED`, `V2G_CHECKOUT_API_ENABLED`, `V2G_CHECKOUT_SECURITY_ENABLED`, `V2G_CHECKOUT_3DS_SCHEMA_ENABLED`, `V2G_CHECKOUT_3DS_ENABLED`, `V2G_PRODUCTION_3DS_CONFIRMED` | Permite ao comprador confirmar o pagamento real, com proteção e autenticação do cartão. Exige as configurações oficiais já preparadas e verificações em execução. |

**Asaas:** habilitar somente o webhook já cadastrado **V2G WebApp Produção - pagamentos** e sua fila; URL exata `https://app.v2gmidia.com.br/api/webhooks/asaas-production-payment`. Preservar os 17 eventos de pagamento existentes, token e chave. Saques/transferências permanecem desligados. Conferir backlog e cobranças externas antes de abrir a fila; eventos sem pedido não podem virar venda V2G. Não adicionar `SUBSCRIPTION_*` ou novos comandos financeiros.

**LP nesta primeira contratação:** mantém `V2G_COMMERCIAL_PRODUCTION_ENTRY_V1_ENABLED=0` e `V2G_COMMERCIAL_PUBLIC_PURCHASE_ENABLED=0`; não abrir compra pública nem alterar a ponte por consequência. O comprador poderá usar o endereço limpo `https://app.v2gmidia.com.br/contratar`, acompanhado por Victor. Sem um contexto/lead anterior autorizado, a origem será `compra_direta`; não inventar formulário ou atribuição. A prova da ponte LP→contratação continua necessária antes da abertura geral, em bloco próprio.

**Preservados OFF no WebApp:** `V2G_CHECKOUT_ENABLED`, `V2G_CHECKOUT_QA_DEPLOY_ENABLED`, `V2G_ASSISTED_ASAAS_ENABLED`, `V2G_PAYMENT_EMAIL_ENABLED`. Não ligar caminhos Sandbox/legados para compensar falha do oficial.

Nenhuma mudança no backend FastAPI, banco, DNS, Meta, verba, usuários/papéis ou páginas legais é proposta por esta matriz. A aplicação futura das variáveis exige uma publicação de configuração do WebApp e conferência do ambiente que a recebeu; não equivale a autorização para publicar mudanças locais de outros chats.

## 3. Limite de controle: acompanhado não significa exclusivo

**FATO:** os controles publicados são por ambiente, sem restrição específica Nota/Brotherhood no guard do checkout ou na action de pagamento. A LP sem botão reduz divulgação, mas quem alcançar o checkout habilitado ainda poderá comprar. Ver `lib/contratacao/ambiente-comercial-oficial-v1.ts:19-22` e `app/contratar/finalizar/actions.ts:24-44` da fonte publicada.

**Recomendação:** antes de executar uma ativação exclusivamente para Nota, implementar e testar na QA uma restrição no servidor ao contexto autorizado do piloto, comprador legitimamente verificado, uma unidade Brotherhood, R$ 500, mensal no cartão. A restrição precisa valer no preparo do pedido **e antes de qualquer criação Asaas**, incluindo retomada/action direta; não pode se apoiar somente em nome, CNPJ, querystring ou botão oculto. Não definir valor de documento/e-mail ou IDs por dedução.

**Decisão pendente:** Victor escolhe entre uma contratação acompanhada com esse limite global explícito ou o próximo bloco de implementação/testes da restrição antes da produção. A alternativa exclusiva é a recomendada. Nenhum bloqueio exclusivo foi implementado, publicado ou declarado testado neste pacote.

## 4. O que falta de Victor / comprador

| Item | Quem fornece/decide | Como registrar |
|---|---|---|
| Nome do representante e e-mail titular da Nota | Victor confirma com Matheus; Matheus verifica o próprio e-mail. | Usar a conta humana existente quando for a correta; não inventar senha nem criar nova conta desnecessariamente. |
| Razão social/documento e contato do contratante | Matheus preenche privadamente no aplicativo. | Documento não precisa passar pelo chat; não usar documento da Brotherhood no lugar do pagador Nota. |
| Mensal no cartão e valor de R$ 500 para uma conta | Victor e Matheus confirmam as condições. | Se preferir Pix mensal externo, interromper esta execução e preparar o caminho assistido apropriado; não mascarar como assinatura Asaas. |
| Primeiro vencimento, início do atendimento e ciclo já pago | Victor confere com Matheus/financeiro. | Não retroagir ao dia 15 só porque era o plano original; não recobrar Brotherhood ou Versan no mesmo período. |
| Condições de permanência/saída e versão contratual utilizável | Victor com responsável jurídico; fiscal com contabilidade. | Não enviar minuta marcada como teste. Pagamento, assinatura e NFS-e têm provas separadas; automação externa de contrato/NFS-e não está incluída. |
| Exclusividade do piloto | Victor decide o recorte, conforme seção 3. | Recomendação: próxima implementação restrita na QA antes de ligar em produção. |
| Autorização para execução concreta | Victor após revisar o pacote e encerrar os itens anteriores. | Incluir 17 opções, webhook/fila, publicação de configuração, envios reais e recorrência posterior à ação legítima do comprador. Nenhuma autorização é presumida desta preparação. |

**A Central resolve sem transferir a coleta técnica para Victor:** conferir IDs reais de agência/anunciante/conta, verificar se já existem antes de criar, conferir filas/pagamentos e consumidores de acesso, checar a configuração/ambiente e acompanhar a prova. Login privado ou confirmação de painel só serão pedidos quando a sessão realmente exigir. Não há nova cópia de chave/SMS pendente comprovada agora.

## 5. Execução futura e prova de aceite

1. Conferir condições e inexistência de cobrança/pagamento duplicado do ciclo. Preencher os IDs reais e o e-mail na ficha privada da execução; o `matriz.json` deste pacote mantém esses campos nulos.
2. Resolver a exclusividade; se escolhida a restrição, implementar/testar/aprovar/publicar o pacote próprio antes da ativação. Reconciliar composição publicada por pacote com a branch se houver nova publicação por Git.
3. Revalidar banco/filas e ambiente em leitura. Se houver mudança desde a base ou mensagem/assinatura já criada, conciliar antes de continuar. Não simular evento financeiro em produção.
4. Preparar o processamento, cobertura e mensagens. Conferir versões/callback e liberar webhook/fila sem nova compra habilitada. A habilitação pode processar backlog; precisa de autorização e acompanhamento.
5. Habilitar checkout por último. Matheus confere Nota, Brotherhood, uma conta, R$ 500/mês, vencimento e confirma o pagamento pessoalmente. Dados de cartão e 3DS são privados, sem transitar pelo chat ou arquivos deste pacote.
6. Conferir pedido, cobrança e pagamento canônico no Asaas, valor/período e ausência de duplicata. Conferir assinatura única de R$ 500 para o mês seguinte, sem recobrar o primeiro ciclo; timeout exige conciliação, nunca repetir pagamento/assinatura como atalho.
7. Conferir duas mensagens reais: comprador e `victor.cabral@v2gmidia.com.br`, remetente `pagamentos@send.v2gmidia.com.br`. O payload atual usa texto com link oficial. Provar recebimento nas caixas; aceite do Resend não basta. Identidade pode exigir um e-mail separado de confirmação/recuperação.
8. Pela sessão legítima de Matheus: abrir carteira Nota, vincular/selecionar somente a unidade Brotherhood paga, abrir o anunciante e voltar à carteira. Negócio não coberto/segunda unidade não podem herdar o direito. Não criar login para Brotherhood. A compra não conecta Meta nem publica anúncio.
9. Fechar novas compras após a janela acompanhada se não houver decisão de continuidade. Preservar processamento de pagamentos em trânsito, cobertura válida e auditoria. Publicação dos CTAs e prova da ponte LP são próximas decisões, não efeito automático desta compra.

Se a verificação do piloto exigir um segundo usuário ou outro negócio que ainda não existe, preparar a prova no ambiente adequado antes, sem forjar sessão/identidade nem criar dados produtivos fictícios.

**Fora da prova imediata:** renovação efetiva do próximo mês, NFS-e autorizada, assinatura contratual concluída, atribuição de vendas, conexão Meta do novo anunciante e operação de campanhas. Não marcar essas entregas como comprovadas pela primeira cobrança.

## 6. Verificação e fontes

- [Matriz revisável, não executável](./matriz.json): 17 alterações propostas, controles preservados e pendências.
- [Revisão anterior](../../estado/n26-revisao-abertura-vendas-17-11.md) e [fechamento das conexões](../../estado/n26-conexoes-oficiais-configuradas-off-17-11.md).
- Metadados Vercel consultados novamente: 17 opções propostas ainda `false`; LP `0/0`. Implantações oficiais `dpl_GXAYGCNRdAmcptRNz7m4qCydeAzw` e `dpl_35LuEFqrqJ29rMWxxkvabfR6x5XD` continuam READY, com aliases oficiais. Sem segredos revelados.
- Cópia da fonte publicada: `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-comercial-oficial-producao/source-webapp`; guards em `lib/contratacao/ambiente-comercial-oficial-v1.ts` e `ambiente-producao.ts`; fluxo em `checkout-contexto-v1.ts`, `processar-recorrencia-contexto-v1.ts`, `entrega-contexto-v1.ts` e `app/contratar/finalizar/actions.ts`.
- A verificação local desta matriz usa somente valores sintéticos e funções puras da cópia publicada, sem ler `.env`, chamar rede ou executar checkout. Ela não comprova chaves reais, webhook autenticado, recebimento de e-mail ou nova sessão.
- Resultado: **42 verificações aprovadas** em [verificacao-local.json](./verificacao-local.json). Foram conferidos o estado OFF observado, as fases de entrada/processamento/checkout, a recusa por ambiente divergente e a preservação de conciliação/cobertura ao fechar somente novas compras. Este ensaio novo valida a matriz proposta; não repete a suíte de produto encerrada.

**Parada deste bloco:** entregar pacote e pendências. Não aplicar configuração, publicar, criar cobrança/assinatura, enviar mensagem ou conceder acesso.
