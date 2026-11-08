# N26-P1 — compra pública: implementação LOCAL de 05/11/2026

## 0. Resultado e limite

Bloco local autorizado por Victor e retomado por delegação do Central em 05/11.
Implementados transporte de produção, seleção de ambiente, compra/status,
webhook, 3DS/assinatura e e-mail. **Produção continua OFF por padrão.**
Não houve commit, push, build compartilhado, deploy, migration remota, ajuste
de painel/credencial, chamada Asaas/Resend/Turnstile real ou abertura da LP.
Os pedidos e pagamentos usados nos testes são fictícios, em memória/PGlite.

`https://v2g-deploy-webapp.vercel.app/contratar` continua **URL candidata**.
Configurar esse texto não aprova o endereço: exige confirmação humana explícita
e a flag `V2G_PRODUCTION_URL_CONFIRMED`. Outro hostname exige revisão da allowlist,
callback, confirmação de e-mail e projeto; não aceitar URL do navegador.

## 1. Comportamento implementado

- `ambiente-producao.ts`: exige projeto Vercel, ambiente de produção, banco
  produtivo e origem exatos; chave/token próprios, distintos dos de QA.
- `asaas-producao.ts`: origem fixa `https://api.asaas.com/v3`, sem redirect ou
  retry; caminhos e finalidade limitados. Compra cria cliente/cobrança; o
  processamento pode criar a assinatura validada. Nenhum transporte Sandbox é
  escolhido em produção. `provedor-compra.ts` mantém a seleção e o gate de schema.
- `/contratar`, action e pagamento: preço vem das regras atuais; CPF/CNPJ e
  e-mail da sessão preservados. Reserva antes do POST; timeout exige conciliação.
  Link hospedado legado permanece somente QA. Ref aleatória retoma o pedido.
- Pix à vista semestral/anual: R$ 2.850/R$ 5.280 por conta; mensal R$ 500 no
  cartão. A verba de mídia segue separada. Nenhuma mudança de preço/plano.
- Cartão produtivo mensal **e à vista** envia 3DS/dispositivo/callback produtivo.
  Apenas mensal grava contexto privado e temporário do IP para a continuação
  com assinatura no mês seguinte. PAN/CVV/token não são persistidos no banco.
- `/api/webhooks/asaas-production-payment`: token próprio, ambiente fixado
  pelo endpoint, schema validado; toda aprovação exige consulta canônica de
  cobrança/cliente/valor/método/data/assinatura/referência. Não recebe a exceção
  histórica de ensaio órfão do QA. Pendência, análise de risco e autorização
  são fatos separados; não aprovam compra, nem criam assinatura ou e-mail.
- `/api/webhooks/asaas-payment` permanece wrapper Sandbox. As regras comuns
  estão em `webhook-pagamento.ts`; preservadas RPCs, reservas e replay.
- Assinatura mensal: avulsa inicial confirmada/RECEIVED, reserva e próximo mês;
  retorno do desafio não aprova. Resultado ambíguo não repete POST; concilia.
- E-mail produtivo usa remetente/chave próprios e destinatário da compra;
  QA conserva destinatário confirmado e prefixo TESTE. Outbox única por
  pedido/cobrança; `sending/review` não reenvia automaticamente. Confirmação
  de pagamento não é NFS-e; aceite Resend não comprova entrega na caixa.
- Novas compras e processamento são controles independentes. Fechar novas
  compras (ou a API de criação) mantém status/webhook/recorrência/e-mail
  já autorizados enquanto o processamento produtivo estiver ligado.
- Acesso reutiliza `direito-por-pedido`, cadastro, vínculo e seleção existentes.
  Estorno A não autoriza A por status histórico e não derruba B independente.
  Não há novo grant geral, troca de dono ou logout global.

## 2. SQL revisável, sem aplicação

`20261105194728_public_checkout_production_readiness.sql` deixou de estar vazia:

1. transação com grants explícitos somente para `service_role` nas tabelas
   usadas pelo fluxo (sem abrir anon/authenticated);
2. RPC `checkout_producao_schema_v1`, `security invoker`, search_path vazio,
   somente service_role; confere tabelas/RLS, colunas, ACL das RPCs, proteção
   das tabelas financeiras, unicidades de referência/charge/sub/evento/outbox,
   validador CPF/CNPJ e revisão de estados de risco;
3. precondição final aborta toda a migration se algo faltar/divergir;
4. runtime exige retorno inteiro 1 antes de renderizar/escrever no modo produtivo.

Não recria silenciosamente as dependências. **Não executar db push da pasta.**
O mapa somente leitura anterior encontrou na produção `commercial_orders`,
`commercial_order_units` e `commercial_events`, mas não encontrou ledger de
pagamentos, outbox, contexto 3DS ou as RPCs financeiras/self-service consultadas.
Esse mapa não certificou definições/ACL atuais e não foi repetido nesta execução.

### Cadeia de dependências usada no ensaio SQL

A base de Auth/profiles/businesses/ad_accounts é mínima e descartável; os
arquivos abaixo são executados INTEGRALMENTE, sem extrair só o trecho favorável,
no PGlite. Manifesto executável: `scripts/test-utils/checkout-schema.mjs`.

1. `0026_contratacao_multiconta.sql`
2. `0029_pix_assistido.sql`
3. `0034_checkout_self_service.sql`
4. `20261008223000_checkout_transparente_sandbox.sql`
5. `20261009015000_checkout_cartao_retentativa_qa.sql`
6. `20261009042000_gestor_responsaveis_tarefas.sql`
7. `20261011140000_eventos_financeiros_sandbox.sql`
8. `20261013031434_qa_registrar_falha_desafio_3ds.sql`
9. `20261014030000_onboarding_reserva_unica.sql`
10. `20261018130000_ligar_lead_lp_pedido.sql`
11. `20261018133000_checkout_security_controls.sql`
12. `20261020021942_qa_cartao_mensal_3ds.sql`
13. `20261021033313_commercial_payment_email_outbox.sql`
14. `20261021042254_assisted_asaas_orders.sql`
15. `20261022152629_asaas_estados_processamento.sql`
16. `20261022200400_manual_contract_evidence.sql`
17. `20261025215302_cpf_cnpj_contratante_v0.sql`
18. `20261105194728_public_checkout_production_readiness.sql`

É um grafo de dependências, NÃO uma ordem para reaplicar arquivos já presentes
na produção. CPF/CNPJ depende também de agenda/evidência/carteira; a revisão de
risco depende das RPCs assistidas. Objetos instalados exigem comparação de
definições, constraints, dados e grants antes de selecionar cada unidade a aplicar.
Não afirmar que só a migration nova torna o banco produtivo pronto.

Antes de aplicar: backup de schema/definições/ACL/linhas afetadas, comparação por
objeto, autorização por unidade e conferência pós-aplicação. A readiness não
compara o hash integral de todos os corpos/constraints nem certifica todo o
schema compartilhado. Rollback desse arquivo: compras OFF; remover a RPC nova
e restaurar ACL anteriores pelo backup. Nunca apagar pedidos/eventos para voltar.

## 3. Configuração futura — apenas nomes, nenhum segredo lido

Configurações específicas novas:

- `V2G_PRODUCTION_URL_CONFIRMED`, `V2G_PRODUCTION_CHECKOUT_URL`.
- `V2G_PRODUCTION_CHECKOUT_ENABLED`: OFF por padrão.
- `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED`: OFF por padrão; manter ON para
  confirmações já iniciadas quando só fechar novas compras.
- `V2G_PRODUCTION_3DS_CONFIRMED`: confirmação de habilitação na conta produtiva.
- `ASAAS_PRODUCTION_API_KEY`, `ASAAS_PRODUCTION_WEBHOOK_TOKEN` (token próprio,
  mínimo 32 caracteres; não reutilizar QA).
- `V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED`,
  `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY`, `V2G_PRODUCTION_PAYMENT_EMAIL_FROM`.

Também exigidos: `ASAAS_ENVIRONMENT=production`, configuração normal do projeto,
site/banco produtivos, `V2G_CHECKOUT_API_ENABLED`, controles de segurança/3DS,
chaves Turnstile e lista de hostname, hash de segurança com mínimo de 32 caracteres.
Nenhum desses valores foi consultado, gravado ou habilitado nesta rodada.

Webhook produtivo futuro: `/api/webhooks/asaas-production-payment` na origem
confirmada, com POST direto e eventos de `EVENTOS_FINANCEIROS`.
Callback 3DS: `/contratar/pagamento?ref=<referencia-aleatoria>` na mesma origem.

## 4. Verificação local

- `pnpm conferir:checkout-producao`: **27/27 PASS**, incluindo SQL descartável.
  Modos/host/chaves, action e adaptadores reais com HTTP fictício, Pix à vista,
  cartão mensal/anual 3DS, timeout, token/canônico, pendência/estorno/replay,
  assinatura no mês seguinte, e-mail e separação A/B.
- Rodada final conjunta: **195/195 PASS, zero falhas**, incluindo os 27 novos
  casos e regressões de QA, primeiro acesso, direito pós-estorno e multiconta.
  Log: `docs/qa/n26-p1-compra-publica-05-11/testes.txt` (sem rede real).
- `pnpm typecheck`: PASS. `git diff --check`: PASS (avisos de LF/CRLF apenas).
- Conferidor antigo da jornada passou a usar o carregador isolado e o ledger
  fictício explícito; não deixa import admin escapar para o ambiente real.
- Manifesto incluiu também a migration de referência criativa já existente que
  estava sem entrada (só constraints; não cria objetos OpenAPI). Sem alterar seu SQL.

Não é build de produção, prova HTTPS/Auth real, cobrança/estorno real, e-mail
entregue, RLS/Storage remotos ou integração Meta. Não executado build compartilhado.
Verificação por pedido também não é prova de atomicidade entre consulta de direito
e escrita concorrente nem certifica revogação direta de DB/Storage.

## 5. O que impede abrir a compra pública

1. **Endereço:** Victor confirmar a URL candidata ou informar a definitiva.
2. **Banco:** conciliar as dependências no banco produtivo compartilhado,
   apresentar backup/unidades/rollback e obter autorização específica antes de
   aplicar. Conferir readiness=1 e acesso por sessão após cada unidade pertinente.
3. **Conta/configuração:** confirmar Asaas produtivo habilitado para 3DS e fluxo
   de recorrência/token; configurar chaves, webhook, Turnstile e remetente Resend
   autorizados, sem colar segredos no chat. Domínio Auth/redirects também precisa
   corresponder à origem final. A documentação exige habilitar 3DS pelo suporte.
4. **Publicação:** Victor commitar/push; publicação coordenada autorizada, com
   processamento e compras inicialmente OFF. Validar versão, roteamento e defaults.
5. **Homologação:** ensaio externo explicitamente autorizado por conta/método/
   valor/recorrência/limpeza, provando compra → provedor → webhook → confirmação
   por e-mail → primeiro acesso → negócio correto e negativa após ocorrência.
6. **LP:** somente depois do aceite completo, autorização para ligar o botão da
   LP ao endereço confirmado. A LP permanece fora deste diff.

Menor próxima ação de Victor: confirmar o endereço e revisar o pacote local;
não é preciso redefinir senha, refazer QA04 ou criar outra compra para isso.
O bloco local termina aqui. Abertura pública não está concluída.

Fontes oficiais verificadas em 05/11:
[ambientes/chaves Asaas](https://docs.asaas.com/docs/chaves-de-api),
[cobrança 3DS e habilitação pelo suporte](https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds).

## 6. Arquivos do recorte para revisão/commit humano

Runtime novo:
`lib/contratacao/{ambiente-producao,asaas-producao,provedor-compra,webhook-pagamento}.ts`,
`app/api/webhooks/asaas-production-payment/route.ts`.

Runtime alterado:
`app/contratar/{page.tsx,actions.ts,pagamento/page.tsx,pagamento/PagamentoFormulario.tsx}`,
`app/api/contratar/status/route.ts`, `app/api/webhooks/asaas-payment/route.ts`,
`lib/contratacao/{iniciar-pagamento,processar-assinatura-3ds,processar-email-pagamento}.ts`.

SQL/manifesto/comando:
`supabase/migrations/20261105194728_public_checkout_production_readiness.sql`,
`supabase/objetos.ts` (adições deste recorte e registro do SQL criativo já existente),
`package.json` (comando `conferir:checkout-producao`).

Testes novos: `scripts/conferir-checkout-producao{,-sql}.mjs`,
`scripts/test-utils/{admin-memoria,checkout-schema,config-producao}.mjs`.
Adaptados ao core extraído: `scripts/conferir-{cartao-3ds-integrado,email-pagamento,jornada-comercial-portas}.mjs`.
Documentação: este checkpoint, adendo na proposta anterior, linha no índice e
`docs/qa/n26-p1-compra-publica-05-11/{README.md,testes.txt}`.

O working tree tem alterações concorrentes de Meta, piloto e multiconta;
não foram revertidas nem são declaradas autoria deste recorte. Selecionar
somente os hunks pertinentes em arquivos compartilhados. O checkpoint de senha
de 05/11 pertence à conferência anterior, não foi refeito para este bloco.
