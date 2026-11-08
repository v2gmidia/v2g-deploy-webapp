# N26-P1 — proposta revisável do modo Asaas produção — 05/11/2026

> Atualização em 05/11: bloco LOCAL aprovado por Victor via Central e implementado.
> Resultado em `n26-p1-compra-publica-local-05-11.md`. A URL segue candidata;
> nenhuma configuração, migration ou publicação externa autorizada neste bloco.
> A proposta abaixo preserva o estado do mapeamento, anterior à implementação.

## 0. Aprovação pendente antes de implementar

**Este bloco é mapeamento/preparo documental. Nenhum código implementado.**
Direção recebida pelo Central: apresentar o recorte a Victor e aguardar a
aprovação prevista em `AGENTS.md` §2.2 antes da implementação local.

Decisão solicitada a Victor:

1. Confirmar se a URL canônica será
   `https://v2g-deploy-webapp.vercel.app/contratar` ou informar outra.
2. Aprovar o bloco LOCAL abaixo, com modo de produção independente e
   desligado por padrão, incluindo preparação SQL revisável e testes fictícios.

Não foi encontrada confirmação inequívoca dessa URL em `docs/decisoes.md`
ou nos dois turnos humanos mais recentes consultados no Central. Victor
priorizou o módulo e disse que havia definido um endereço, mas sem nomear a
URL nesses turnos. A menção técnica do Central continua sendo candidata.

Essa aprovação não inclui configurar painéis/credenciais, aplicar schema,
publicar, habilitar flags, enviar e-mail ou realizar cobrança real/fictícia externa.
LP e páginas legais ficam fora da implementação proposta; preço/plano preservados.

## 1. Estado atual verificado

- HEAD local: **`cb87775b29d2b8710586a83ca3144ff6a7777815`**.
- O commit tem 76 arquivos e inclui P1/P1b/N26-05, inclusive direito pós-estorno,
  primeiro cadastro e proposta SQL histórica. O título sobre Anúncios Meta não
  descreve todo o conteúdo efetivamente versionado.
- WebApp produção está **READY em cb87775**, deployment
  `dpl_3XPnBFR8S2uDrAxME2KQgABv4Tue`.
- QA continua **READY em `959e78ea4e528ed2caaed182d7b281b1ba26dc6f`**,
  deployment `dpl_2XUw4sXQyG7jVxudZsvRVonaWqYC`.
- GET atual: produção `/contratar` **404**; QA `/contratar` **200**.
- Portanto P1/P1b já estão no código publicado em produção pelo push humano,
  mas não foram homologados com usuário comum nesta versão. O modo de compra
  real ainda não existe. Os checkpoints anteriores descrevem a situação na
  data de cada bloco; não substituem esta leitura de publicação.
- Na abertura deste bloco, mudanças concorrentes eram `docs/decisoes.md` e
  `docs/estado/piloto-piligrin-caua-05-11.md`. Preservadas.

### Banco — somente leitura de presença de objetos

Não foram lidos dados de clientes, tokens ou valores de configuração.

| Objeto | QA | Produção |
|---|---|---|
| `commercial_orders`, `commercial_order_units`, `commercial_events` | Presentes | Presentes |
| `commercial_payment_events` | Presente | Ausente |
| `commercial_payment_email_outbox` | Presente | Ausente |
| `checkout_3ds_context` | Presente | Ausente |
| `registrar_pedido_self_service` | Presente | Ausente |
| `aprovar_pagamento_api_self_service` | Presente | Ausente |
| `registrar_evento_financeiro_asaas` | Presente | Ausente |
| `registrar_evento_inicial_3ds` | Presente | Ausente |
| `reservar_assinatura_apos_3ds` | Presente | Ausente |
| `consumir_limite_checkout` | Presente | Ausente |

Presença não certifica assinatura, definição, grants ou funcionamento. Não foi
aplicada migration. Não copiar toda a cadeia QA para o banco compartilhado.
O pacote SQL será preparado a partir das precondições reais e ensaiado localmente.

## 2. Arquitetura do bloco proposto

Separar transporte do provedor e identidade de ambiente, reutilizando as
regras de pedido, confirmação, reserva/outbox e direito por negócio existentes.
Não duplicar silenciosamente toda a lógica financeira em dois fluxos divergentes.

### Novos módulos próprios previstos

- `lib/contratacao/ambiente-compra.ts`: contexto resolvido no servidor:
  desabilitado, QA/Sandbox ou produção. Verifica projeto, host canônico e banco
  esperados, flags e configuração necessária. Nada é escolhido pelo browser.
- `lib/contratacao/asaas-producao.ts`: transporte server-only com origem de
  produção fixa aprovada, credencial própria, timeout e erros sanitizados.
  Sem fallback para Sandbox ou destino livre recebido do cliente.
- `lib/contratacao/provedor-compra.ts`: porta que entrega o cliente correto
  aos consumidores autorizados; não contém credencial no retorno para UI.
- Núcleo compartilhado de webhook/efeitos, extraído em arquivo próprio se
  necessário, com dependências explícitas de provedor, banco e e-mail.
- `app/api/webhooks/asaas-production-payment/route.ts`: endpoint de produção
  separado, default OFF, token próprio e regras financeiras compartilhadas.
  O endpoint Sandbox atual mantém endereço e configuração.
- Conferidores próprios de ambiente, percurso de produção fictício e replay.
- Migration aditiva de preparação do checkout público, criada pelo CLI somente
  após a aprovação. Nome/timestamp real será retornado pelo CLI; não há arquivo
  de migration criado neste mapeamento.

### Três controles com papéis diferentes

Nomes propostos, ainda não implementados/configurados:

| Controle | Semântica e padrão |
|---|---|
| `V2G_PRODUCTION_CHECKOUT_ENABLED` | OFF: não abre contratação nem cria novas cobranças. Para ligar, exige também processamento pronto e identidade de ambiente correta. |
| `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED` | OFF: novo processador produtivo fechado. Depois do lançamento, pode permanecer ligado para receber eventos/consultar pedidos/processar compromissos já iniciados mesmo se novas compras forem fechadas. |
| Exposição na LP | Fora deste bloco; futuramente OFF separado. Só ligar após comprovar o modo produtivo no destino confirmado. |

Desligar novas vendas não pode devolver 404/503 a confirmações financeiras de
pagamentos previamente iniciados. O processador só entra em produção após
autorização e configuração próprias; não será ativado neste bloco local.

Credenciais propostas independentes: `ASAAS_PRODUCTION_API_KEY` e
`ASAAS_PRODUCTION_WEBHOOK_TOKEN`, usadas apenas no servidor. QA preserva as
variáveis atuais e o guard `checkoutSandboxSeguro`. Configuração ausente,
incompleta, projeto/host/banco errado ou ambiente conflitante mantém fechado,
antes de RPC/fetch/escrita. Não reutilizar flag QA para liberar produção.

## 3. Consumidores exatos a adaptar

| Porta/arquivo atual | Mudança local proposta e limite |
|---|---|
| `app/contratar/page.tsx` | Resolver modo autorizado antes de renderizar. Default OFF continua 404 em produção. Preços/qualificação atuais preservados. |
| `app/contratar/actions.ts` | Pedido por referência estável e contexto de ambiente. Produção exige fluxo API; não cai no checkout hospedado Sandbox quando a flag API falta. |
| `lib/contratacao/iniciar-pagamento.ts` | Usar porta de provedor correta para cliente, Pix/cartão e confirmação inicial; reserva antes da tentativa e falha ambígua não criam segunda cobrança. Nenhum PAN/CVV em banco/log. |
| `app/contratar/pagamento/page.tsx`, `app/api/contratar/status/route.ts` | Ler somente pedido/cobrança autorizados no ambiente correspondente. Pix/QR e consulta do cartão usam o mesmo provedor. Retorno de navegador e polling não aprovam pagamento por si. |
| `lib/contratacao/cartao-3ds.ts` | Preservar `callback3dsQa`; acrescentar callback do modo produtivo baseado no host confirmado. Hoje o callback é fixo para QA, não basta trocar a API. |
| `lib/contratacao/processar-assinatura-3ds.ts` | Injetar contexto/provedor no adaptador e manter `garantirAssinaturaApos3ds`: primeira cobrança confirmada, reserva única, mês seguinte e ausência de assinatura duplicada. |
| Webhook de produção + núcleo financeiro | Token correto antes de processar; verificar canonicamente cobrança, cliente, valor, referência, método e ciclo. Persistência/replay por ID; falha de identidade não aprova. Confirmação tardia não apaga estorno. |
| `lib/contratacao/ensaio-encerrado.ts` | Continuar estritamente QA. Exceção de ensaio encerrado/fictício não vira autorização para ignorar evento produtivo desconhecido. |
| `lib/contratacao/processar-email-pagamento.ts` + adaptador/núcleo próprio | Preservar destinatário fixo e prefixo de teste no QA. Produção usa comprador do pedido confirmado e remetente validado, com outbox idempotente e estados honestos; timeout não dispara nova cobrança. |
| `cadastro-por-compra.ts`, `direito-por-pedido.ts`, `acesso.ts`, `vincular-core.ts`, `multiconta/ativo.ts` | Preservar P1/P1b; regressão real dos módulos com portas fictícias. Estorno A não derruba B válido. Nenhuma propriedade é concedida só pelo retorno do checkout. |
| SQL comercial/segurança/outbox | Preparar apenas dependências necessárias, com CPF/CNPJ e nova referência → negócio separado. Guards, precondições, RLS/ACL, unicidades e rollback documentados. Aplicação real fora do bloco. |
| Checkout hospedado e webhook `asaas-checkout` | Continuam legados/QA. Não ampliar produção por consequência deste trabalho. |
| LP / legais / Meta / backend de anúncios | Sem edição neste bloco. |

## 4. Oferta preservada

- R$ 500/mês por conta, mínimo de seis meses; mensal em cartão recorrente.
- R$ 2.850 por conta no semestral à vista (5%); Pix ou cartão.
- R$ 5.280 por conta no anual à vista (12%); Pix ou cartão.
- Verba de anúncios separada; documento do contratante pode ser CPF ou CNPJ
  conforme decisão vigente. Não alterar texto legal ou condição contratual.
- Quantidade, plano e total são recalculados no servidor; URL/formulário não
  escolhem valor, ambiente, credencial ou business_id autorizado.

Não é necessário pedir nova decisão de preço. A confirmação humana pendente
é a URL canônica e o recorte local da implementação.

## 5. Aceite local revisável

1. Flags ausentes/OFF: UI, criação e novo webhook produtivos fechados; zero
   RPC/fetch/transporte externo nas tentativas recusadas.
2. Matriz QA × produção: QA não seleciona transporte/credencial/banco de
   produção, e produção não seleciona transporte/credencial/banco Sandbox;
   host/projeto/banco incorretos e configuração parcial negam.
3. A action real de compra cria um pedido fictício por referência, calcula
   preço e deixa pagamento pendente. Reenvio não duplica pedido/cobrança.
4. Pix/cartão fictícios: resposta de criação, autorização de risco, desafio
   3DS, falha ou retorno ao site não concedem acesso. Confirmado recebido do
   provedor correto e conciliado aplica somente o pedido correspondente.
5. Assinatura mensal fictícia: primeira cobrança e ciclo seguinte separados,
   reserva e tentativa ambígua; replay não cria segunda assinatura.
6. Webhook: token ausente/errado, cobrança/cliente/valor/referência/ciclo
   divergentes negam; repetição idêntica é idempotente; conteúdo divergente
   no mesmo ID não sobrescreve o evento; estorno não regride por confirmação.
7. E-mail: destinatário correto por modo, outbox única por pedido/cobrança,
   sem reenvio automático ambíguo. Aceito pelo provedor não significa entregue.
8. Acesso: primeiro cadastro e conta já existente; estornado A + válido B,
   pendente, leitura financeira parcial/falha, cookie antigo, múltiplos negócios
   e liberação histórica legítima sem login global revogado.
9. Fechar novas compras mantém o processamento autorizado de pagamentos já
   iniciados; não reabre criação de cobranças nem a LP.
10. SQL descartável local: cadeia/precondições, repetição, unicidades,
    RLS/ACL e preservação de registros existentes. Sem migrations reais.

Depois: typecheck, conferidores dirigidos e diff por arquivo. Build somente
em ambiente isolado/coordenado; não interferir na `.next` compartilhada.
Nenhuma dessas provas locais será apresentada como operação financeira real.

## 6. Fontes oficiais e dependências do fornecedor

A documentação do Asaas distingue origem/chave/conta por ambiente:
[Sandbox e produção](https://docs.asaas.com/docs/sandbox) e
[chaves de API](https://docs.asaas.com/docs/chaves-de-api).
Produção usa a origem oficial `https://api.asaas.com/v3`; esse endereço é do
provedor e não confirma a URL de compra da V2G.

Webhooks podem ser reenviados e precisam de identidade persistida:
[idempotência](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks).
Token do webhook é distinto da API key, e a URL deve responder ao POST sem
redirect: [FAQ oficial](https://docs.asaas.com/docs/faq-de-webhooks).
Isso fundamenta a separação de endpoint e de segredos; não configura nada.

Disponibilidade real do fluxo de cartão/3DS/recorrência na conta produtiva
e a confirmação/entrega de e-mails permanecem prova externa específica. Se a
documentação/conta impedir reutilizar o fluxo previsto, registrar o bloqueio
antes de ampliar o escopo; não substituir por captura ou callback improvisado.

## 7. O que depende de Victor depois do código

| Ato externo posterior | Pacote que 01/02 deve apresentar antes |
|---|---|
| Aplicar banco | Backup e migrations individuais com precondições, objetos, efeitos e rollback; nunca a pasta inteira automaticamente. |
| Configurar ambientes | Projeto/host/banco, nomes dos segredos e flags; nenhum valor no chat. Chaves da conta produtiva só em configuração segura autorizada. |
| Configurar webhook/remetente | Endpoint final, eventos, token próprio e domínio/remetente, com dono da conferência. |
| Publicar | Commit exato/ambiente, processamento e novas compras inicialmente OFF; plano de verificação e reversão. |
| Ensaio financeiro | Conta, método, valor, recorrência, destinatário e limpeza apresentados. Autorização específica; antigas permissões de Sandbox não cobrem produção. |
| Abrir LP | Prova completa compra → confirmação → e-mail → negócio certo e estados adversos negados; depois autorização de exposição/reversão. |

Juridico/fiscal seguem procedimento manual separado. Este bloco não gera
contrato assinado, nota fiscal, aprovação de App Review ou campanha Meta.

## 8. Parada

Só este documento foi criado na etapa de mapeamento. Não foram repetidos os
82 testes anteriores como prova produtiva. Não foram lidos segredos, criados
usuários/pedidos/grants ou executadas cobranças, migração, configuração externa,
commit, push ou publicação. Aguardando as duas confirmações da seção 0.
