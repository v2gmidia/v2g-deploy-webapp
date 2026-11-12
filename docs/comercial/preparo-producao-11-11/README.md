# Compra → pagamento confirmado → acesso: preparo de produção

> CONEXÕES OFF CONCLUÍDAS em 11/11/2026 após autorização nominal: 17 configurações públicas exatas e seis campos privados Secret/Production, webhook salvo/desativado com fila OFF e 17 eventos, hash independente concluído por Victor e gerador local encerrado. Deployment observado READY, mesma revisão, compra fechada. [Conferência consolidada](../../estado/n26-comercial-conexoes-off-concluidas-11-11.md). O manifesto e as pendências abaixo são a preparação histórica; não reabrir banco/credenciais já resolvidos nem tratá-los como ativação/prova financeira.

> ENDEREÇOS APLICADOS E PROVEDORES CONFERIDOS em 11/11/2026: Site URL/callback Supabase e `NEXT_PUBLIC_SITE_URL` Production salvos após autorização; variable ainda depende do próximo release autorizado. Resend Verified, Asaas sem webhook cadastrado, Turnstile existente exclusivo QA. [Estado atual e pacote privado restante](../../estado/n26-comercial-enderecos-aplicados-provedores-conferidos-11-11.md). Preparação e lacunas históricas abaixo não reabrem o banco nem autorizam ativação financeira.

> BANCO APLICADO em 11/11/2026 após autorização específica: [resultado da aplicação produtiva](../../estado/n26-comercial-banco-minimo-aplicado-producao-11-11.md). Dados preservados e controles financeiros OFF. As lacunas de banco descritas na captura abaixo são históricas; configuração de provedores e ensaio continuam pendentes.

> ATUALIZAÇÃO em 11/11/2026: a etapa de montagem/teste local do banco mínimo foi concluída em [pacote separado](../banco-minimo-local-11-11/README.md). Não aplicado. O roteiro abaixo preserva a preparação anterior; não tratar essa conclusão local como liberação financeira.

Preparado em **11/11/2026**, sem aplicar configuração, migração ou pagamento. Projeto `v2g-deploy-webapp`, banco `ushccxpoxjikzqnwhgfd`. Este pacote não é um arquivo de importação nem autorização para executar suas etapas.

## Onde estamos

O domínio e o HTTPS já foram concluídos no checkpoint `docs/estado/n26-dominio-app-dns-https-concluido-11-11.md`. A compra Sandbox existente chegou ao negócio correto na QA, conforme `docs/estado/n26-comercial-acesso-comprovado-10-11.md`. Essas provas não certificam cobrança, cadastro ou acesso novos em produção.

Em 11/11 às **10h49 de Brasília**, foi feita consulta de catálogos em transação **READ ONLY** no banco produtivo correto, sem ler linhas de pedidos, clientes, Auth, payloads ou segredos. A lista de projetos confirmou `V2G-SITE`, ACTIVE_HEALTHY. O histórico contém 42 migrations. Quatro das oito tabelas examinadas existem, com RLS; as outras quatro faltam. Nenhuma das nove assinaturas de função exigidas neste recorte existe.

O `commercial_orders` existente ainda impõe CNPJ de 14 dígitos e planos mensal/anual; o checkout atual prevê CPF/CNPJ e também semestral. Só configurar chaves não resolve essa diferença. Não aplicar isoladamente a migration de readiness: ela depende dos objetos ausentes.

Os nomes/tipos/destinos de variáveis foram relidos sem decriptar valores. Há zero variáveis produtivas ocultas. Nenhuma configuração comercial Asaas, checkout, segurança ou e-mail de pagamento aparece pelos nomes exigidos. `NEXT_PUBLIC_SITE_URL` e variáveis Supabase existem, mas **seus valores não foram lidos ou certificados**. O estado das variáveis automáticas da Vercel também precisa ser conferido no release autorizado.

## Pacote concreto

| Arquivo | Uso |
| --- | --- |
| `configuracao-preparada.json` | Nomes e destinos propostos, 13 controles explicitamente OFF, cinco segredos sem valor, remetente e chave pública Turnstile ainda sem preenchimento. `applyNow=false`. |
| `metadados-observados.json` | Catálogos, constraints, índices, permissões por tabela, histórico e nomes de variáveis observados; sem dados de clientes. Não é backup completo do banco nem certificado de RLS. |
| `preflight-somente-leitura.sql` | Consulta reproduzível usada no banco; retorna um único objeto JSON para evitar perder resultados intermediários do conector. Não executa RPC financeira. |
| `conferir-preparo.mjs` | Confere o manifesto contra o código real, flags OFF, separação dos ambientes e ausência de SQL de escrita. Só usa dados e credenciais fictícios em memória; não lê `.env`. |
| `resultado-preparo.json` | Resultado local, lacunas calculadas e hashes das duas fontes usadas. `validation=pass` e `productionReadiness=blocked` têm significados diferentes. |

Executar da raiz do WebApp: `node docs/comercial/preparo-producao-11-11/conferir-preparo.mjs`.

## Configuração proposta, ainda não gravada

| Grupo | Valores/destino |
| --- | --- |
| Aplicativo | `NEXT_PUBLIC_SITE_URL=https://app.v2gmidia.com.br`; `V2G_PRODUCTION_CHECKOUT_URL=https://app.v2gmidia.com.br/contratar`. Revisar o efeito sobre cadastro, recuperação e demais consumidores da origem antes de alterar. |
| Identidade | Projeto `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`; banco `https://ushccxpoxjikzqnwhgfd.supabase.co`; `ASAAS_ENVIRONMENT=production`. Variáveis automáticas da plataforma são verificações, não instruções de sobrescrita manual. |
| Segredos privados | `ASAAS_PRODUCTION_API_KEY`, `ASAAS_PRODUCTION_WEBHOOK_TOKEN`, `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `V2G_CHECKOUT_SECURITY_HASH_SECRET`. Nenhum valor preparado ou solicitado no chat. Webhook e hash exigem pelo menos 32 caracteres; chaves/tokens de produção não reutilizam Sandbox. |
| Proteção da compra | `TURNSTILE_SITE_KEY` de produção e `V2G_TURNSTILE_ALLOWED_HOSTNAMES=app.v2gmidia.com.br`. Host/action `checkout` precisam conferir; não usar chave de teste ou domínio de QA. |
| E-mail de pagamento | `V2G_PRODUCTION_PAYMENT_EMAIL_FROM` precisa de remetente verificado no Resend. Campo permanece vazio; não inferir pela presença de SPF/DKIM no DNS. Destinatário real vem do comprador conciliado, sem redirecionamento de QA. |
| Auth | Origem proposta `https://app.v2gmidia.com.br`; retorno exato `/auth/confirmar` tanto para cadastro como recuperação. Configuração e templates atuais do Auth não foram inspecionados. Preservar os retornos necessários já existentes; não desabilitar confirmação de e-mail. |

Todas as flags no manifesto ficam `false`, inclusive processamento, compras, e-mail, confirmação da URL/3DS e controles legados Sandbox. A confirmação da URL na variável ainda não foi gravada, apesar da prova DNS/HTTPS já concluída. Atributos de provedores não comprovados ficam pendentes, não aprovados automaticamente.

## Webhook proposto

- URL: `https://app.v2gmidia.com.br/api/webhooks/asaas-production-payment`.
- Método POST direto, sem redirect; header de autenticação `asaas-access-token`, segredo exclusivo. Configuração futura em produção, nunca substituir o endpoint Sandbox.
- Envio sequencial proposto; a lista de eventos é a constante `EVENTOS_FINANCEIROS` em `lib/contratacao/evento-financeiro.ts:1`, incluindo confirmação, recebimento, risco, recusa, estorno e chargeback. O campo `delivery` do manifesto descreve a intenção, não é payload executável da API do fornecedor.
- Callback 3DS: `https://app.v2gmidia.com.br/contratar/pagamento?ref=<referência-do-pedido>`. Voltar do banco ou obter autorização de risco não confirma pagamento.
- Confirmado/recebido exige cobrança canônica conciliada com pedido, cliente, valor, método e ciclo; replay não deve duplicar efeito ou apagar estorno.

**Dependência antes de cadastrar/ativar o webhook:** verificar se a conta Asaas recebe cobranças alheias ao novo checkout. O código atual devolve 503 para cobrança sem vínculo (`lib/contratacao/webhook-pagamento.ts:61`). Não ativar uma fila sequencial com eventos anteriores/desconhecidos sem resolver seu escopo: retentativas podem interrompê-la. Também não responder 200 a toda cobrança desconhecida, pois o evento legítimo pode chegar antes de o vínculo ser salvo. Esta preparação registra a dependência; não altera esse comportamento nem registra eventos fictícios.

O Asaas informa entrega repetida com o mesmo ID e exige HTTP 200 para confirmar recebimento. Referências verificadas: [FAQ de webhooks](https://docs.asaas.com/docs/faq-de-webhooks), [idempotência](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks).

## Sequência até vender, com uma prova por etapa

| Etapa | Trabalho e responsável | Prova para encerrar |
| --- | --- | --- |
| 1. Base mínima — próxima frente | Central prepara delta específico da base produtiva observada e ensaia localmente. Preservar pedidos/negócios anteriores, RLS, ACL e dados do backend compartilhado. | Pacote SQL nominal revisado, precondições, dependências, preservação, idempotência e retorno. **Ainda não há SQL de aplicação aprovado neste pacote.** |
| 2. Provedores e configuração privada | Central/Victor conferem conta Asaas, habilitação 3DS/recorrência, escopo do webhook, remetente Resend, Turnstile e Auth. Preencher segredos privadamente só após autorização do ato concreto. | Evidências dos provedores, nomes/destinos e retorno Auth corretos; valores nunca no repositório/chat. Todas as vendas/processamento permanecem OFF. |
| 3. Aplicação/release fechado | Com aprovação específica, capturar backup privado e aplicar somente o delta revisado; conferir readiness e preservar base. Preparar release exato e configuração inicialmente OFF. | Preservação antes/depois, readiness estrutural sob service_role e versão/configuração efetivamente publicadas conferidas. Não executar `db push` de toda a pasta QA. |
| 4. Processamento e ensaio nominal | Autorizar separadamente processamento/webhook e depois uma compra com conta, comprador, método, valor, recorrência e tratamento posterior explicitados. Victor realiza a etapa financeira. | Pedido → cobrança canônica → evento persistido → confirmação → e-mail recebido → sessão legítima → negócio correto. Não contar resposta de API como entrega de e-mail nem retorno do navegador como pagamento. |
| 5. Abertura comercial | Após aceite do ensaio, autorizar exposição pública da compra e encaminhamento da LP. | Preço/métodos corretos, comprador pendente sem acesso, sessão de outro comprador sem acesso, duplicação/estorno conferidos nos limites acordados e entrada pública funcionando. |

Ligar apenas processamento pode executar compromissos já iniciados, inclusive e-mail e criação de assinatura do mês seguinte. Não é modo somente leitura. Depois de abrir vendas, fechar compras não deve desligar automaticamente o processamento de obrigações existentes.

Nenhuma autorização de cobrança, estorno real, assinatura recorrente ou publicação está implícita aqui. O ensaio financeiro permanece sem conta, comprador, método, valor ou recorrência definidos, para evitar criar uma obrigação antes da autorização específica. Não reabrir a compra Sandbox de 27/10 para gerar outra cobrança.

O fornecedor exige habilitar 3DS na conta produtiva; isso ainda não foi conferido nesta conta: [cobrança 3DS](https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds). O retorno configurado do Auth deve coincidir com a URL usada pelo aplicativo: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Confirmar remetente no serviço de e-mail: [verificação de domínio Resend](https://resend.com/changelog/domain-verification-events).

## Lacunas precisas do banco, no recorte medido

- Tabelas ausentes: `commercial_payment_events`, `commercial_payment_email_outbox`, `checkout_3ds_context`, `checkout_security_attempts`.
- Funções ausentes: registro de pedido, aprovação financeira API, registro de evento financeiro, registro inicial 3DS, reserva de assinatura, limite de checkout, validação de documento, bloqueio por evento financeiro e readiness. Assinaturas completas no JSON observado.
- Das colunas verificadas pela fonte readiness, **13 faltam na tabela existente `commercial_orders`**; outras **17** pertencem às tabelas ainda ausentes. São 30 lacunas de coluna no total, não 30 alterações extras sobre tabelas existentes.
- Constraints de CNPJ, períodos/descontos e total do pedido precisam ser conciliadas. Nome/presença de migration não comprova definição, grant, isolamento ou compatibilidade com dados anteriores.
- A cadeia de teste `scripts/test-utils/checkout-schema.mjs` é referência de dependências, não pacote para aplicação direta. U1–U6 de QA não podem ser transplantadas como se a base produtiva tivesse o mesmo estado.

Inventário não inclui todas as policies/ACLs de coluna/corpos/objetos protegidos e não é backup para aplicar DDL. Esses itens precisam compor a captura privada e o ensaio da etapa 1. O SQL produtivo foi limitado aos catálogos; nenhuma RPC financeira/readiness ou escrita foi executada.

## Limite de encerramento

Preparo local conferido, banco/configuração produtivos continuam bloqueados para compra real. Sem mudanças em produto, `.env`, painéis, permissões, Auth, DNS, LP, legais, Meta, n8n, cobrança, assinatura, e-mail, commit, push ou deploy neste bloco. Próxima frente delimitada: **montar e testar localmente o delta mínimo do banco comercial**, antes de qualquer aplicação.
