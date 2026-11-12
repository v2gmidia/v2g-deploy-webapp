# Comercial — eventos sem pedido: correção local pronta para revisão

Data: 11/11/2026. Escopo autorizado: corrigir e testar localmente, preservando dados e mantendo vendas/pagamentos desligados. Sem publicação ou cobrança.

## 0. Resultado e próxima ação

**Pacote local pronto para revisão.** A ausência de pedido deixou de ser tratada como uma única situação: cobrança comprovadamente externa pode receber aceite sem efeitos; evento possivelmente V2G continua em retentativa. Não foi instalado em QA nem em produção.

Próxima ação: Victor/revisor conferir este pacote e decidir a publicação em bloco próprio, mantendo os controles desligados. A prova real de pagamento → e-mail recebido → acesso ao negócio correto continua separada e ainda não foi realizada por esta correção. Não é necessário gerar credenciais novamente.

## 1. Comportamento implementado

| Situação sem pedido localizado | Resultado | Efeito financeiro |
|---|---|---|
| Referência recebida contém UUID, inclusive em texto/maiúsculas | 503 `vinculo_pendente`, permitindo nova tentativa | Nenhum |
| Referência ausente/livre, cobrança canônica corresponde integralmente, referência canônica também externa e igual, cliente sem nenhum pedido local | 200 `{ok:true, ignorado:true, externo:true}` | Nenhum; não confirma pagamento nem concede acesso |
| Cliente da cobrança está em qualquer pedido local, inclusive outro negócio/origem/status | 503 `vinculo_pendente` | Nenhum; não tenta vincular automaticamente |
| Consulta falha, provedor indisponível, identidade diverge, referência é ambígua ou cobrança está excluída | 503 `vinculo_pendente` | Nenhum |
| Pedido aparece após a criação original terminar e o evento é reenviado | Segue o processamento já existente e suas verificações | Somente o fluxo financeiro anterior |

O reconhecimento histórico restrito do Sandbox permanece antes da classificação nova e foi testado sem alteração. Pedidos já localizados mantêm o processamento anterior. Permanecem as verificações de autenticação, ambiente, domínio/HTTPS e prontidão do schema antes da classificação.

## 2. Arquivos e fundamento

- `lib/contratacao/evento-sem-pedido.ts`: verificação somente de leitura, com GET canônico no cliente do ambiente e contagem exata de pedidos por `provider_customer_id`, sem filtro de negócio/origem/status.
- `lib/contratacao/webhook-pagamento.ts:62`: chamada somente após a consulta inicial bem-sucedida não localizar pedido e após a exceção histórica do Sandbox.
- `scripts/conferir-webhook-sem-pedido.mjs`: handler real com fronteiras de banco/provedor em memória, ambiente sintético e rede bloqueada.
- `package.json`: comando dedicado `pnpm conferir:webhook-sem-pedido`; incluído também em `conferir:checkout-producao`. Sem dependência nova.

FATO no fluxo de criação: `lib/contratacao/iniciar-pagamento.ts:149` salva o cliente antes da criação da cobrança/assinatura; `:169` e `:174` enviam `pedido.id` como `externalReference`; `:215` salva o vínculo retornado pelo provedor. O pedido já existe antes dessas chamadas.

INTERPRETAÇÃO usada na correção: a combinação de referência canônica sem indício de UUID e ausência de cliente em todos os pedidos locais permite reconhecer os casos externos claros. A ausência do vínculo de cobrança, isoladamente, não permite isso. Referências com UUID permanecem conservadoramente pendentes mesmo que sejam de cobranças externas; não há descarte genérico de órfãos nem criação de uma fila persistente nova.

Base primária: o Asaas documenta entregas repetidas/retentativas e aceite HTTP 200 na [FAQ de webhooks](https://docs.asaas.com/docs/faq-de-webhooks), além da [idempotência](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks). A [consulta de cobrança](https://docs.asaas.com/reference/recuperar-uma-unica-cobranca) fundamenta a conferência canônica. O tratamento não antecipa aceite de eventos possivelmente legítimos sem registro financeiro.

## 3. Prova local

1. Antes da correção, os novos casos externos reproduziram 503 indevido; os casos conservadores continuaram pendentes.
2. **78 testes novos passaram**: 17 tipos financeiros como externos claros e como possíveis pedidos antecipados; referências canônicas; cliente/valor/forma/data/assinatura; indisponibilidade; contagem; isolamento; replay; concorrência; controles OFF e autenticação/origem.
3. **108 testes de regressão passaram**, nos sete arquivos abaixo. O conjunto inicial teve 167 testes aprovados (incluía os primeiros 59 novos); após acrescentar 19 casos apenas no arquivo de testes, seus 78 casos foram executados novamente e aprovados. Total de casos distintos na versão final: **186**, sem falhas ou skips.
4. `pnpm typecheck` passou. Código de execução não mudou depois dessa conferência; somente casos adicionais de teste e documentação foram acrescentados.

Regressões executadas com `node --test`: `conferir-webhook-estorno-handler.mjs`, `conferir-webhook-ensaio-encerrado.mjs`, `conferir-checkout-producao.mjs`, `conferir-checkout-producao-sql.mjs`, `conferir-cartao-3ds-integrado.mjs`, `conferir-asaas-eventos.mjs` e `conferir-fluxo-cartao-mensal.mjs`, todos em `scripts/`.

O teste SQL usa PGlite descartável e as funções/migrations existentes: verifica isolamento entre A/B, estorno/replay e permissões. Nenhum banco remoto foi acessado. O replay no novo handler usa uma porta em memória; sua unicidade simulada não é apresentada como prova de concorrência PostgreSQL. A regressão SQL existente cobre a unicidade persistida e o isolamento sem alterar funções.

Evidência detalhada dos 78 casos: `docs/comercial/eventos-sem-pedido-local-11-11/testes-novos.tap`. Síntese e fingerprints: `resultado-local.json` e `antes-fingerprints.json` na mesma pasta.

## 4. Preservação e limites

Comparação SHA-256 sobre 805 arquivos preexistentes de código/configuração: somente `webhook-pagamento.ts` e `package.json` alterados; adicionados somente o verificador e seu teste nesse universo. Demais fontes, migrations, lockfile e configuração TypeScript preservados. Documentação e evidências são novas, com uma linha acrescentada no índice.

Não foram lidos valores de `.env`, credenciais ou sessões. Não houve consulta/configuração remota, migração, escrita em dados de clientes, envio de e-mail, cobrança, assinatura, commit, push, merge ou publicação. Os flags e o webhook remotos não foram alterados nem relidos nesta tarefa; o estado OFF é o do último checkpoint de conexões, não uma nova medição de produção.

Não foi feito build nem teste financeiro real. Foram usados handler e módulos reais em testes isolados, além de TypeScript e SQL local. Esta prova não certifica o conteúdo das credenciais, entrega de webhook/e-mail ou primeiro acesso em produção. Não abrir vendas em consequência deste resultado local.
