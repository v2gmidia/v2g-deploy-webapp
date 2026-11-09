# U6 — eventos financeiros e readiness: preparação local

**Não aplicada.** Grupos 15/19, dois nomes ausentes, mas delta com sete corpos financeiros existentes alterados, CHECK de eventos atualizado, dois helpers novos e grants declarados para oito tabelas. Nenhuma chamada Asaas, pagamento/cobrança, webhook externo, configuração, flag, produção, Git ou deploy foi realizada pelo preparador.

Propriedade desta pasta e, após autorização específica da Central, somente dois arquivos adicionais: `supabase/migrations/20261105194728_public_checkout_production_readiness.sql` e `scripts/conferir-checkout-producao-sql.mjs`. Os 127 arquivos selados U1–U5 não foram alterados. Nenhum runner antigo que reescreve relatório selado foi executado; somente suas fixtures foram importadas. Mudanças legítimas de runtime de outras frentes não são incorporadas nem congeladas neste pacote.

## Dependências e delta real

Baseline: PÓS U5 aprovado, 49 pares version/name, versão `20261109012806`, origem privada SHA-256 `bb77c660bdb8ede4ae13852a2d50a00be0939247412376597818aa3e26196a6e`. `baseline-u5.json` é cópia de metadata de preparação, não backup U6 de aplicação.

Uma consulta estrita de catálogo QA, preservada em `capturar-metadados.sql` / `metadados-qa.json`, mediu 49 relações, 35 funções e nove definições completas relevantes: sete RPCs financeiras, `pedido_asaas_comercial_elegivel` e `consumir_limite_checkout`. Outbox, contexto 3DS e security_attempts foram medidos integralmente, incluindo índices, constraints, ACL/colunas e RLS. Não foram lidos pedidos, IPs, payloads de e-mail, linhas de clientes/Auth/Vault ou segredos. Nenhuma leitura de produção.

As sete funções são:

- registrar_evento_financeiro_asaas e registrar_evento_financeiro_comercial;
- registrar_evento_inicial_3ds e registrar_evento_inicial_3ds_comercial;
- reservar_assinatura_apos_3ds;
- aprovar_pagamento_api_comercial e aprovar_pagamento_api_self_service.

Fontes: `20261022152629_asaas_estados_processamento.sql` e a fonte de readiness acima, com o endurecimento autorizado descrito adiante. O delta é explícito: corpos novos derivados das definições atuais medidas, não replay de migrations nem substituição cega. O mecanismo histórico de regex/contagem é usado só para derivar e exigir correspondência local; não é enviado para reconciliar versões desconhecidas no banco.

Mudanças financeiras preservam identidade, preço, valor, origem, charge/customer/subscription, locks e ACL: whitelist ganha os estados de processamento/risco; predicados impeditivos passam pelo novo helper; inicial 3DS aceita CONFIRMED/RECEIVED; reserva mensal aceita o fato pago correspondente; a aprovação self-service passa a conferir eventos impeditivos da mesma charge. O CHECK da tabela acompanha a whitelist. Nenhuma regra de preço, união de negócio, CPF/CNPJ, Auth ou direito foi alterada por conveniência.

Todas as funções novas e as sete financeiras permanecem SECURITY INVOKER, search_path vazio e EXECUTE owner/serviço; clientes/anon não as executam. Os grants de execução declarados na fonte para as oito tabelas são **no-op no catálogo medido**. As ACLs existentes são iguais antes/depois; não se removeu MAINTAIN, TRUNCATE, grant option ou outro privilégio legado para tornar o modelo artificialmente mínimo. Também não se ampliou nenhum deles. A outbox já tem somente serviço SELECT/INSERT/UPDATE, sem DELETE. Contexto/security_attempts possuem privilégios de serviço mais amplos herdados e preservados; o gate exige o contrato necessário, não uma limpeza global.

## Falso positivo reproduzido e correção da fonte

Antes da correção local, foi reproduzido o caso concreto: readiness retornava **1** sob service_role mesmo após revogar INSERT de commercial_orders, com has_table_privilege INSERT=false. A fonte verificava somente SELECT.

A Central autorizou o menor ajuste na própria fonte e no teste correspondente do repositório: verificar **cada um dos 23 privilégios** necessários, por tabela/permissão, e negar grants efetivos por coluna para anon/authenticated nas quatro tabelas financeiras fechadas. PUBLIC é herdado nessas consultas. Não se usa uma lista de privilégios como se significasse ALL: has_table_privilege com vírgulas significa ANY. O teste revoga cada requisito individualmente e exige 0; com o estado íntegro, exige 1 **sob service_role**.

O gerador lê a mesma fonte corrigida do repositório; delta e código da migration permanecem coerentes. A lista de grants não ganhou privilégios fora do contrato. Testes incluem SELECT/INSERT/UPDATE por coluna para anon, authenticated e PUBLIC, com grant option onde permitido, além de RLS, coluna, unicidade e ACL de RPC. O pacote não abre acesso para retirar aviso de segurança.

Readiness retorna versão estrutural, não credencial: não consulta provedor, entrega, conta Asaas, assinatura ou pagamento real. Integridade exata de corpos/atributos/policies/defaults é conferida pelas guardas e recibos do pacote, além das verificações enumeradas do gate. Não se transforma o valor 1 em prova global de segurança/integração. Flags e valores remotos não foram medidos ou alterados; instalar a função pode satisfazer um requisito de futuros chamadores, mas não certifica disponibilidade final do checkout ou produção.

## Guardas, histórico e bancada

O estado completo dos oito alvos de grants/CHECK e dos sete corpos é guardado antes/depois. O contexto restante preserva U1–U5, Auth, documento, acesso histórico, helpers, defaults de argumentos, RLS/ACL e todas as metadata capturadas. Defaults não são apenas salvos no modelo: protectedDetails é comparado nos DOs e comparador. Corpo adulterado com marcador preservado é recusado. Checks/índices homônimos divergentes e defaults inesperados abortam atomicamente.

Histórico compara os 49 pares version/name completos, não só contagem ou última versão. Guards aceitam somente a entrada nominal da chamada, registrada pelo canal antes/depois do corpo; PRE somente leitura exige 49 sem U6. Aplicação prevista 49→50; retorno 50→51, sem reparo de ledger. Ordenação C explícita e chaves JSON íntegras; a expressão real é testada com histórico embaralhado. A sequência histórica da U5 continua com bigint como texto exato, sem arredondamento.

A fixture reconstrói dependências a partir dos metadados reais. Somente as nove tabelas backend não usadas pelos corpos financeiros continuam fixtures mínimas; não são congeladas como schema real. SELECT-only/RLS e ausência de privilégios indevidos nesses objetos são verificados; extras legítimos são preservados e todo metadata PRE/PÓS fora do delta é comparado.

PGlite existente em v2g-finance, sem instalar dependências. Registros, claims, e-mails, cobranças, IDs de provedor, IP de documentação e payloads são fictícios e locais. Auth é estrutura/handler medido com claims locais simulados; Vault continua stub herdado. Não há HTTP/JWT real, provedor, inbox, 3DS bancário, concorrência multissessão ou dinheiro. Fixtures antigas são importadas sem executar seus runners/alterar relatórios selados.

## Ensaios

```text
node docs/qa/reconciliacao-schema-07-11/u6/executar-local.mjs
node --test scripts/conferir-checkout-producao-sql.mjs
```

`resultado-ensaio.json` registra **28 grupos aprovados** e hashes das duas fontes autorizadas, estáveis durante o ensaio. A suíte do repositório corrigida passou com **8 testes**; são comandos/provas separados, sem inflar uma contagem única. Não se repetiu a suíte baseline antiga antes de corrigir a fonte.

Provas do pacote incluem:

- DOs/recibos SQL=JS, restauração dos sete corpos, metadata e pares históricos;
- 23 permissões individuais e grants por coluna efetivos, inclusive PUBLIC;
- quatro vias self-service/assistido × direto/inicial 3DS, com intermediários sem aprovação e CONFIRMED/RECEIVED com replay único;
- adversos da mesma charge impedindo confirmação e reserva; outra charge de renovação registra fatos sem novo pedido ou suspensão automática;
- IDs, cliente, valor, vencimento e tipo divergentes, sem parcial; evento repetido divergente não invade outro pedido;
- reserva 3DS única com mês correto, sem criar assinatura;
- estorno A preserva B; o contrato real de direito trata o fato financeiro, sem usar só o status bruto;
- outbox única, reserva queued→sending uma vez, accepted com ID mas sem provar entrega;
- contexto privado com FK/unicidade/expiração; rate limit por scope/IP/contato e NULL/formato inválidos atomizados;
- drift de corpo, CHECK, índices, ACL, defaults e ledger; retorno recusado por uso/dependência posterior;
- 127 selos anteriores intactos.

## Limites financeiros preservados

Os nomes dos estados refletem a política da fonte, não verificação externa do Asaas. Aprovação de risco e AUTHORIZED não equivalem a pagamento; evento desconhecido/NULL é impeditivo no helper. OVERDUE, reprovação, captura recusada, estorno e contestação são impeditivos segundo a whitelist da fonte. Recuperação/precedência temporal diferente exigiria regra própria, não alteração silenciosa para conseguir verde.

Registrar evento adverso após um pagamento não revoga titularidade/status por DDL nem cria política de suspensão de renovação. Os consumers de direito são testados com os fatos por charge; o status payment_approved isolado não é prova de direito atual. Estes SQLs não concedem carteira, e-mail, propriedade ou pedido por semelhança de contato. Não se afirma pagamento real ou liberação de acesso remoto.

Rate limit SQL recebe hashes de formato válido; o ensaio não certifica HMAC/segredo/transporte real. Payload da outbox é objeto e chave única por pedido/charge; o banco não impõe imutabilidade absoluta a um serviço que já tem UPDATE, nem accepted comprova entrega. O contexto guarda IP privado para fluxo existente; a prova usa só endereço de documentação local. Essas dependências não foram ativadas/refatoradas.

## Retorno conservador

Sem marcador confiável de qual versão processou cada fato, o retorno automático é deliberadamente conservador: recusa qualquer commercial_payment_events, evento comercial source=asaas ou pedido Asaas já aprovado/com reserva de assinatura iniciada. **Pode recusar registros legados também**; a existência real deles não foi consultada nesta preparação. Não se apagam dados nem se relaxa a guarda para forçar retorno. Uma avaliação/correção aditiva poderá ser necessária.

O retorno restaura definições antigas medidas, o CHECK anterior e remove somente os dois nomes novos, sem CASCADE. Não restaura dinheiro, pedidos, assinatura, acesso, e-mail ou efeitos externos. Caminhos sem escrita podem ter sido chamados mesmo sem registros; ausência de fatos não certifica ausência de uso. Requer autorização própria, backup atual e avaliação do PÓS original. Dependência/view/CHECK posterior ou drift impede o ato, com rollback integral.

## Arquivos e próximo passo

u6-conferir-pre.sql e u6-verificar.sql são read only, sem locks/advisory ou chamadas financeiras. u6-preflight.sql/u6-pos.sql retornam um SELECT/uma linha receipt JSON, só catálogo. u6-aplicar.sql e u6-retornar.sql têm um DO sem BEGIN/COMMIT externos; aplicar contém apenas a avaliação estrutural pura da fonte readiness, sem executar RPC financeira. delta.sql/delta-retorno.sql são auxiliares, nunca comandos remotos isolados. Geradores reescrevem arquivos: não regenerar pacote selado durante o ato.

ATO.md e RELATORIO-MONTAGEM.md separam preparação, autorização/backup futuros e limites. Aplicação QA pertence exclusivamente à Central após revisão, backup privado e conferência. Não foi aplicada por este preparador e não certifica produção, cliente completo, configuração ou deploy.
