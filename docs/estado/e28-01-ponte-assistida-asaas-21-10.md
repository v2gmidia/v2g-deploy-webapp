# E28-01-A/B — ponte assistida Asaas, preparo LOCAL

Data: 21/10/2026, America/Sao_Paulo. Bloco local solicitado pelo Central em continuidade a decisao direta de Victor. **Implementado e testado localmente; nao publicado/homologado no QA real.**

## Resultado

- `/pedidos` ganha modo Asaas exclusivamente QA, atras de `V2G_ASSISTED_ASAAS_ENABLED=false` por padrao, `V2G_CHECKOUT_API_ENABLED` e guard Sandbox existentes. Sem flag, mantem formulario e pedidos Pix direto antigos.
- Action nova autentica por `getUser()` e `app_metadata.papel=operador` antes de criar cliente admin. Cria pedido, nao cobranca; nenhum cartao/token e recebido pelo operador nesta action. Nome/WhatsApp e plano/metodo sao validados. Mensal exige cartao; semestral/anual aceitam Asaas Pix/cartao conforme precos existentes.
- Origem permanece `assisted`. Lead opcional e explicito; com lead, CNPJ/email/WhatsApp/consentimento sao conferidos no servidor. Atendimento direto nao recebe lead inventado. `business_id` e ator enviados no formulario nao sao usados; novo negocio nao toma propriedade de outro negocio com contato semelhante.
- Link privado de pagamento usa `external_ref` lido do banco. Pagador segue o iniciador existente (cartao/3DS/reserva/tokenizacao posterior), agora autorizado para origem assistida registrada por operador, sem fingir self_service. Nao houve envio do link a ninguem.
- Webhook distingue RPCs comerciais novas das RPCs self-service antigas. Confirmacoes assistidas e iniciais 3DS exigem consulta canonica server-to-server: pedido/referencia, cobranca, cliente, valor, forma, vencimento, assinatura e estado aprovado precisam conferir. Falha de consulta e pendencia; divergencia nao grava/aprova/notifica.
- Aprovacao assistida preserva evento financeiro e nao reaprova depois de ocorrencia adversa. `direct_pix` antigo nunca passa a ser Asaas nem e aprovado pelo novo webhook. Actions antigas de comprovante/aprovacao tambem continuam limitadas por RPC a direct_pix.
- Na inicial 3DS, apos gravacao financeira confirmada, tenta email e recorrencia independentemente, inclusive se a outra parte falhar. Recorrencia pendente retorna 503 para retomada, sem desfazer pagamento. Outbox impede email duplicado; assinatura usa a reserva/conciliacao existente. Email diz pagamento, nao recorrencia ativa.

## APIs e RPCs

### Application

- `criarPedidoAsaasAction` em `app/(protected)/pedidos/actions.ts`: autenticacao/validacao e RPC, sem API paga.
- `lib/contratacao/origem-asaas.ts` + `origem-asaas-servidor.ts`: metodo Asaas, origem conhecida e marcador de operador. A coluna nova so e consultada para assistidos com flag ativa; self-service e flag OFF nao dependem dela.
- `lib/contratacao/iniciar-pagamento.ts`: fluxo de pagamento existente, mesma reserva contra concorrencia/timeout, sem campo de bypass publico novo.
- `app/contratar/pagamento/page.tsx`, `app/api/contratar/status/route.ts`: aceitam assistido autorizado; status publica apenas estado, nao identificadores/contatos/payload.
- `app/api/webhooks/asaas-payment/route.ts`, `lib/contratacao/confirmacao-canonica.ts`: correlacao e independencia pagamento/recorrencia. Token do webhook e guards Sandbox preservados.

### Migration ADITIVA nova e individual — nao aplicada

`supabase/migrations/20261021042254_assisted_asaas_orders.sql`, criada pelo CLI oficial fixado 2.121.0.

SHA-256: **3148ADD141D926D83427AEBD9330F32D267C528B293F59D379D8BBA40D839547**.

Adiciona `assisted_operator_id` (FK profiles), constraint para assistidos Asaas terem ator, indice unico de compra assistida Asaas pendente por email/CNPJ; amplia constraint 3DS somente para assistidos com marcador. Nao converte nenhum pedido anterior.

Novas RPCs (security invoker, search_path fixo, EXECUTE negado public/anon/authenticated, concedido service_role):

1. `registrar_pedido_asaas_assistido(text,bigint,text,text,text,text,text,integer,text,text,uuid)` — tambem confere papel atual em `auth.users.raw_app_meta_data`, alem da action. Locks de referencia, contato e mesmo namespace de lead legado. Retorno idempotente exige dados/ator/origem compativeis. Transacao cria negocio, pedido, unidades e eventos.
2. `pedido_asaas_comercial_elegivel(uuid)` — fonte de elegibilidade em banco, sem aceitar origem/ator do pagador.
3. `aprovar_pagamento_api_comercial(uuid,text,text,text,text,text,integer,date)` — variante comercial, registra fato financeiro e verifica ocorrencias antes de aprovar.
4. `registrar_evento_financeiro_comercial(uuid,text,text,text,text,text,integer,date)` — variante de ledger com comparacao de replay e ciclos; aceita tambem falha de desafio 3DS.
5. `registrar_evento_inicial_3ds_comercial(uuid,text,text,text,text,integer,date)` — inicial avulsa assistida, preserva regras de confirmacao e ocorrencias.

RPCs historicas e seus arquivos NAO foram reescritos. `reservar_assinatura_apos_3ds` existente e reaproveitada, pois ja decide pelo pagamento inicial comprovado e reserva unica, nao pelo rotulo self_service. Variantes novas mantem verificacoes existentes, sem mutacao temporaria da origem.

## Provas locais

- `scripts/conferir-assistido-asaas.mjs`: **8 testes**, executando actions, iniciador, helper de origem, handler webhook, adaptador/outbox de email reais via `scripts/test-utils/ts-isolado.mjs`; fronteiras de Next/Auth/Supabase/Asaas/transportes sao portas ficticias, sem .env e com rede negada por padrao.
  - Ator ausente/nao operador/user_metadata falso: negados antes de admin.
  - Assistido com/sem lead; ator/negocio do navegador ignorados.
  - Duas chamadas concorrentes e timeout ambiguo: uma chamada ao provedor simulado, reserva retida, nenhum acesso indevido.
  - Origem invalida, direct_pix, marcador ausente, flag OFF: sem chamada financeira.
  - Self-service preservado com flag nova OFF.
  - Formulario real renderizado em SSR, campos rotulados, QA/metodo/plano explicitos, legado separado.
  - Divergencias na cobranca canonica, cliente, valor, referencia de outro negocio, assinatura e estado: sem gravacao/aprovacao/email.
  - Assistido anual confirma/reenvia com RPC comercial e um unico email simulado.
  - Inicial 3DS paga mas recorrencia pendente: pagamento continua aprovado, assinatura continua nula, 503 de conciliacao, replay gera um email simulado apenas.
- `scripts/conferir-assistido-asaas-sql.mjs`: passou **cadeia real de migrations** em PGlite 0.5.8 efemero. Com/sem lead, snapshot UTM, papel atual de operador, evento de conversao unico, referencia idempotente, divergencias, negocio alheio intacto, reserva 3DS, renovacao/replay, confirmacao tardia apos estorno negada, direct_pix (inclusive lead ja convertido) nao migrado e grants de funcoes negados a anon/authenticated.
- Regressao dirigida: **62 testes passaram**, somando o novo teste e suites email, jornada comercial de portas, Pix assistido legado, cartao 3DS, API checkout, estado publico e seguranca checkout. Adaptadores antigos de teste foram atualizados apenas para os novos imports e a nomenclatura do legado; assertions de seguranca preservadas.
- `pnpm typecheck`: passou ao final. Durante trabalho houve erro temporario em arquivo de outra frente (`lib/gestor/contrato-metricas.ts`), nao editado por mim; na ultima execucao nao apareceu. Manifesto local atualizado com a migration sem substituir entradas de outras frentes.
- Diff check dirigido sem erros (avisos CRLF de Git nao sao falhas). Sem build/restart de dev.

## Limites da prova e decisao de acesso

- Nenhum Supabase QA, Asaas Sandbox real, email real, navegador HTTPS, cartao, token, cobranca, assinatura ou usuario real foi criado/consultado neste bloco. SSR nao prova layout responsivo, hidratacao ou desafio bancario. Nao houve inspecao visual em navegador para nao interferir no dev compartilhado; CSS/layout existentes preservados.
- PGlite executa Postgres real, mas uma instancia de processo local: chamadas SQL simultaneas sao serializadas; nao e prova de locks entre duas conexoes remotas nem da configuracao de Auth/RLS/grants do QA. Isso e requisito de homologacao futura.
- **Nao amplia direito de acesso:** compra aprovada continua dependendo de email proprio confirmado e propriedade relida do negocio (`vincular-core.ts`, `acesso.ts`, sem alteracao). Recorrencia pendente nao muda esse portao existente; contrato e primeira publicacao continuam independentes. Estorno nao revoga acesso/campanhas automaticamente: preservada politica existente, requer decisao operacional separada.
- Referencia de checkout continua segredo de posse; nao expor em campanha ou publicar link generico. Prova de entrega em caixa continua pendente. Accepted nao e delivered. Reconciliacao de cobranca ambigua continua manual/controlada; nenhuma segunda cobranca automatica foi adicionada.
- IDs de lead ainda sao localizados pelo operador no registro interno; nao foram inventados nem colocados como dados publicos do visitante. Falha de alerta LP continua sem fila duravel, conforme checkpoint anterior.
- Figma/planilha nao relidos nesta rodada; usado espelho/brief Central e decisao direta recente. Nenhuma afirmacao de quadro sincronizado.

## Dependencias QA e aplicacao futura individual

1. Autorizacao especifica do Victor, backup comercial consistente e janela coordenada conforme `e28-01-02-pacote-qa-21-10.md`. Esta rodada NAO concede aplicacao/configuracao/deploy.
2. Confirmar QA `zskpijnqgkqwxksqmzmf`, nunca producao `ushccxpoxjikzqnwhgfd`. Conferir ledger e schema: base comercial/assistida/self-service, CNPJ+consentimento LP, vinculo lead, ledger financeiro, tentativas cartao e 3DS. Timestamp 3DS remoto historico `20261020023349` difere do arquivo `20261020021942`; comparar definicoes, nao reaplicar cegamente.
3. Pre-checar se existem linhas `origin=assisted` com metodo Asaas antes da nova migration; se existirem sem marcador, parar para conciliacao, NAO preencher ator retroativamente para forcar constraint. Confirmar `auth.users` e `profiles` do operador; verificar permissoes service_role para SELECT de `auth.users.id/raw_app_meta_data` e USAGE em auth. Nao conceder acesso novo a auth sem revisao explicita. Novo indice tambem exige ausencia de duplicatas pendentes assistidas Asaas.
4. Aplicar **somente** `20261021042254_assisted_asaas_orders.sql` em transacao individual depois das dependencias conferidas; nunca db push em lote com migrations de criativos. Em seguida conferir coluna/FK/constraints/indice/RPCs/grants e contagens originais. Outbox `20261021033313_commercial_payment_email_outbox.sql` e outra operacao individual, previamente autorizada e necessaria apenas para email ligado.
5. Novo codigo e flags sao ativacoes separadas. `V2G_ASSISTED_ASAAS_ENABLED` permanece false; depende de `V2G_CHECKOUT_API_ENABLED` e Sandbox. Flags de schema/3DS/email e variaveis do remetente continuam independentes. Codigo pode ficar desligado antes da migration; coluna nova nao e consultada nesse estado.
6. Homologar com fixture autorizada: operador real, LP/direto, origem preservada, concorrencia em duas conexoes, callback sem autoridade, canonicalidade, email unico e pedido/negocio certo. Cobrar/enviar mensagem, mesmo Sandbox, exige autorizacao nova; nao repetir os pagamentos historicos como se fossem deste bloco.
7. Rollback operacional: flags OFF, preservar pedidos/IDs/eventos/reservas. Nao converter para direct_pix, apagar fila, resetar reserva ou remover coluna com dados. Falha/timeout de migration exige ler ledger/schema antes de repetir; DDL em transacao deve fazer rollback daquela operacao. Restauracao/destruicao requer plano novo.

## Arquivos tocados e proximo passo

Novos: migration acima; `lib/contratacao/origem-asaas.ts`, `origem-asaas-servidor.ts`, `confirmacao-canonica.ts`; `scripts/conferir-assistido-asaas.mjs`, `conferir-assistido-asaas-sql.mjs`, `scripts/test-utils/ts-isolado.mjs`; este checkpoint.

Alterados no recorte: pedidos/actions/Formularios/page, iniciar-pagamento, pagamento/page, contratar/status, asaas-payment webhook, pedido-assistido, `.env.example`, manifesto `supabase/objetos.ts`, adaptadores de `conferir-pedido-assistido.mjs` e `conferir-jornada-comercial-portas.mjs`. Sem codigo de outras frentes/documentos centrais alterado.

**Proximo passo executavel:** Central revisa este patch e programa homologacao QA individual quando Victor autorizar banco/publicacao/configuracao/teste. Bloco encerrado; nao criar automacao, pedir novamente autorizacao pendente ou repetir auditorias sem fato novo. Nao e conclusao de E28-01 publicado nem de etapa juridico/fiscal.
