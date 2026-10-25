# E28 01 e 02 Retomada Asaas e diagnóstico do 422

## Prova visual recebida em 25/10 — acesso após estorno reproduzido

**Fonte:** conferência autenticada do Central com Victor, comunicada a este
chat após o bloco CPF/CNPJ. Não houve nova navegação ou consulta remota aqui.
Na QA04, o seletor exibiu cinco negócios. Foi aberto primeiro
**V2G QA Multiconta B — FICTÍCIA**; depois, pelo menu,
**V2G QA 3DS Final 21-10 — FICTICIA**. O aplicativo navegou para `/inicio` e
exibiu este último como negócio ativo. O pedido correspondente já estava
classificado como estornado na auditoria financeira abaixo.

Isso eleva a pendência de acesso de inferência por código/dados para
**lacuna reproduzida na interface autenticada**. Não é compra ativa nem nova
concessão pelo webhook. Não foi implementada revogação global, suspensão da
conta ou alteração dos demais negócios. Tratamento futuro deve distinguir o
pedido/negócio estornado e preservar direitos independentes.

As correções locais posteriores de senha/retorno, sem alterar essa política,
ficam no checkpoint `e28-01-02-senha-retorno-acesso-25-10.md`.

## Conferência somente leitura de 25/10 às 18h42 BRT — persistência e acesso

**Fonte direta:** SELECTs pelo conector Supabase no QA, medidos entre
21:42:17 e 21:42:48 UTC, e leitura das policies atuais. Sem impersonar sessão,
navegar pelo login, reenviar evento, chamar provedor ou alterar dados. Não foram
lidos tokens, senhas, payloads de e-mail ou metadados completos da conta.

### Fatos persistidos

- Exatamente um pedido do ensaio. A cobrança inicial e o business_id continuam
  correspondentes aos registros anteriores; e-mail e buyer_profile_id coincidem
  com a QA04. Negócio **V2G QA 3DS Final 21-10 — FICTICIA**, ativo, marcado fictício,
  pertencente à QA04 e sem claim_email pendente.
- Ledger do pedido: exatamente um PAYMENT_CREATED inicial, um PAYMENT_CONFIRMED
  inicial e **um PAYMENT_REFUNDED**, recebido em 25/10 às 18:34:48 BRT. O estorno
  confere cobrança inicial, valor de R$ 500, vencimento e assinatura nula. Não há
  duplicata desse tipo para o pedido.
- A função real `estadoPagamentoPublico`, avaliada localmente com o status e o
  tipo de ocorrência lidos, retorna **refunded**. É prova da projeção sobre dados
  reais, não de uma tela autenticada ou de alteração de `commercial_orders.status`.
  O status bruto do pedido continua **payment_approved**, deliberadamente separado
  da projeção financeira.
- Zero linhas no ledger para a parcela futura ignorada ou sua assinatura; zero
  pedidos vinculados a esses identificadores. Assinatura do pedido continua nula.
  A cobrança inicial corresponde a um único pedido.
- O único evento comercial do pedido é a confirmação original de 21/10. A única
  linha da outbox permanece accepted, criada/atualizada em 21/10; zero mudanças
  na outbox da QA04 em 25/10. Aprovação/updated_at do pedido continuam em 21/10;
  updated_at do negócio é de 21/10. Zero pedidos, negócios ou eventos comerciais
  da QA04 criados em 25/10.

Esses dados comprovam ausência dos efeitos extras nesses registros do QA e são
coerentes com o ramo somente leitura publicado. Não há trilha completa de todas
as concessões anteriores; timestamps não substituem esse histórico. Ausência de
nova cobrança/assinatura/e-mail no provedor é a evidência do Central registrada
abaixo, não uma nova consulta externa deste bloco. Não foi criado evento falso.

### Acesso: pendência separada da conciliação financeira

Uma única conta QA04, e-mail verificado, sem papel operador e sem acesso legado.
Ela possui cinco negócios, todos com pedido historicamente payment_approved:
**v2g teste**, **V2G QA Multiconta B — FICTÍCIA**,
**QA Etapa 01 Seguranca FICTICIA**,
**V2G QA Compra Unica 21-10 — FICTICIA** e
**V2G QA 3DS Final 21-10 — FICTICIA**. Os três últimos têm estorno inicial no ledger.

As policies SELECT atuais restringem businesses pelo profile_id e pedidos pelo
buyer_profile_id; não conferem estorno. Em `lib/contratacao/acesso.ts` e
`lib/multiconta/elegibilidade.ts`, a elegibilidade ainda usa a aprovação histórica,
identidade do comprador e propriedade do negócio, sem a projeção financeira.
Logo, pelos dados e regras lidos, **os cinco continuam elegíveis**, inclusive o
ensaio estornado. Isso não é compra ativa nem prova autenticada de navegação.
O webhook não concedeu esse acesso agora; os vínculos já existiam. Não foi
revogado acesso, alterado proprietário ou corrigida política neste bloco.

### Roteiro curto para Victor e Central conferirem lado a lado

Conta em todas as etapas: **victor.cabral+v2gqa04@v2gmidia.com.br**, usando a senha
recuperada pelo próprio Victor; não compartilhar senha/código.

| URL/ação | Tela e negócio esperados | Critério PASS/FAIL |
|---|---|---|
| `https://v2g-webapp-qa.vercel.app/entrar?modo=login&adicionar=1` → entrar | Conta QA04; conferir o e-mail em Conta | PASS se a identidade for QA04; outra conta invalida o ensaio |
| `https://v2g-webapp-qa.vercel.app/escolher-negocio` | Pela regra atual, os cinco negócios listados acima; verificar nomes, sem selecionar empresa real | PASS de correspondência se forem os negócios da QA04; empresa alheia é FAIL de isolamento |
| Selecionar **V2G QA Multiconta B — FICTÍCIA** → `https://v2g-webapp-qa.vercel.app/conta` | Nome do negócio selecionado e e-mail QA04 | PASS de navegação se ambos coincidirem e não houver tela vazia; não certifica compra ativa |
| Voltar ao seletor e observar **V2G QA 3DS Final 21-10 — FICTICIA** | O código atual permite esse negócio apesar do estorno | Se aparecer/abrir, confirma a pendência conhecida; é FAIL para o objetivo de bloquear acesso por compra estornada, sem invalidar o estorno financeiro |
| No navegador original do ensaio, `https://v2g-webapp-qa.vercel.app/contratar` → **Retomar meu pedido de teste** | Pedido original, mensagem de estorno integral e nenhum formulário para pagar | PASS financeiro se mostrar estorno integral, sem convidar a criar acesso/pagar novamente. Se o pedido retomado não for o ensaio final ou o link não existir, BLOQUEADO por contexto do navegador; não criar pedido para contornar |

O link de pagamento completo contém referência privada e não foi copiado.
Saldo desta rodada: **estorno persistido e projeção aceitos; efeitos extras não
observados no QA; controle de acesso pós-estorno pendente; prova visual humana
a realizar**. Próximo bloco precisa tratar o acesso por negócio sem suspensão
global, preservando direitos independentes; nenhuma mudança foi iniciada aqui.

## Prova remota de 25/10 — bloqueio do webhook resolvido no QA

**Fonte:** evidência comunicada pelo Central após conferência remota; não foi
reexecutada neste bloco documental. Este registro substitui os próximos portões
de publicação/retomada e o estado penalizado descritos nos adendos abaixo,
preservados como histórico.

- Commit `d2af20f` promovido somente no projeto `v2g-webapp-qa`; deployment READY
  e `/entrar` do alias estável respondeu HTTP 200. O destino chamado production
  pela Vercel pertence ao projeto QA; produção real da V2G não foi alterada.
- Na configuração atual **V2G WebApp QA pagamentos**, foi removida a penalização
  de exatamente um evento. A configuração temporária antiga permaneceu pausada.
- A reentrega original PAYMENT_CREATED retornou HTTP 200 com
  `{"ok":true,"historico":true,"ignorado":true}`.
- O PAYMENT_REFUNDED seguinte retornou HTTP 200 com `{"ok":true}`. A configuração
  atual deixou de aparecer penalizada.
- Segundo a conferência do Central, não houve nova cobrança, assinatura, e-mail
  ou concessão de acesso, nem alteração em produção real.

**Aceito neste recorte:** recuperação segura da sequência histórica no endpoint
QA, incluindo a entrega do estorno. Isso não certifica produção, compra nova,
acesso correto pós-estorno ou encerramento integral das etapas 01/02. A resposta
HTTP não substitui uma consulta independente ao ledger/estado para afirmar a
conciliação persistida; essa consulta não integra a evidência recebida aqui.

Próxima prova útil é a conferência somente leitura do evento e estado financeiro
persistidos no QA, sem novo replay ou operação financeira. Os demais portões
comerciais, de acesso, contrato e fiscal continuam separados. Neste bloco foi
editado apenas este checkpoint; não foram executados eventos ou testes externos
nem reproduzidos identificadores de cobrança, cliente, assinatura ou deployment.

## Atualização de 25/10 — órfão PAYMENT_CREATED após limpeza do ensaio

**Evidência nova recebida do Central:** após publicação e reativação autorizadas,
o PAYMENT_CONFIRMED histórico passou com HTTP 200 `{"ok":true,"historico":true}`.
O próximo evento sequencial, PAYMENT_CREATED da parcela futura excluída do
ensaio, retornou HTTP 503 `{"erro":"vinculo_pendente"}`. A configuração atual
foi penalizada novamente. Isso substitui o bloqueador e a versão remota descritos
no adendo de 17h41; não foi feita outra leitura externa neste bloco.

**Causa no código:** a consulta inicial procura o pedido por
`provider_subscription_id` quando o evento contém assinatura. Com esse vínculo
nulo, retorna 503 antes de consultar a cobrança canônica. A ausência do vínculo
é conhecida; não se deduz daqui quando ou por que ele ficou nulo.

**Correção somente local:** `lib/contratacao/ensaio-encerrado.ts` e ramo restrito
no handler. Só executa após autenticação, guard QA/Sandbox, schema 3DS ativo e
consulta inicial sem pedido e sem erro. Consulta a cobrança pelo seu ID; só usa
o `externalReference` canônico para procurar o pedido se ele também coincidir
com o payload. Não há lista de IDs reais nem exceção por contato/semelhança.

Para retornar 200 histórico/ignorado, exige cumulativamente:

- PAYMENT_CREATED/PENDING de cartão, IDs de cobrança/cliente/assinatura, valor,
  vencimento e referência exatos; parcela canônica PENDING e deleted=true.
- Pedido self_service/payment_approved, monthly/asaas_card/initial_3ds, sem
  checkout ou assinatura vinculada, cobrança inicial distinta, cliente e valor
  iguais; reserva de criação persistida e primeiro vencimento da assinatura
  exatamente no ciclo seguinte ao inicial e igual ao da parcela recebida.
- Negócio do pedido explicitamente marcado `dados_ficticios=true`; confirmação
  inicial persistida no ledger com pedido, cobrança, assinatura nula, valor e
  vencimento correspondentes.
- Assinatura canônica do mesmo cliente/pedido/valor/forma, MONTHLY,
  INACTIVE/deleted=true, nextDueDate no ciclo imediatamente posterior à parcela.
- Cobrança inicial canônica com mesma identidade, sem assinatura, REFUNDED e
  estornos DONE somando o valor integral. Estorno pendente, parcial ou inválido
  impede o aceite.

São apenas leituras. Não grava vínculo, evento, aprovação, pedido ou acesso;
não cria assinatura/cobrança, não envia e-mail e não modifica flags. Falha de
consulta, 404, ausência de prova ou qualquer divergência mantém 503
`vinculo_pendente`. Compra nova/ativa não recebe aceite silencioso. O ramo normal
de eventos com vínculo preserva o comportamento existente. Nenhuma coluna ou
migration nova é necessária: reserva, ledger e marca fictícia já são evidências
persistidas; seus valores atuais ainda serão conferidos pelo runtime no QA.

**Prova local:** `node --test scripts/conferir-webhook-ensaio-encerrado.mjs
scripts/conferir-webhook-estorno-handler.mjs`: 49/49. Inclui órfão encerrado,
novo sem vínculo, identidade divergente, assinatura/parcela ativa, prova ausente,
estorno incompleto/inválido, indisponibilidade, schema/token, replay concorrente
e ausência de efeitos. Testes executam handler e verificador reais com portas
em memória e IDs fictícios; não provam a entrega remota. `pnpm typecheck`: PASS.
Manifesto local inclui hashes do novo helper e do novo teste.

**Menor próximo portão:** revisar/versionar o pacote e publicar somente QA por
Victor/Central; depois, com autorização própria para retomar a configuração
atual, observar a reentrega original e a sequência até REFUNDED. Se alguma prova
exigida estiver ausente no QA, preservar 503 e obter a evidência faltante; não
inventar ledger nem afrouxar identidade. Neste bloco não houve commit, push,
deploy, migration, acesso a painéis, alteração de configuração ou operação
financeira; não se removeu nem reprocessou evento.

## Atualização de 25/10 às 17h41 BRT — bloqueador identificado

Este adendo atualiza as hipóteses/portões de 23/10 abaixo, preservados como
histórico. Um bloco encerrado, sem deploy, migration, reativação, replay remoto,
cobrança, estorno, criação de assinatura ou acesso. Não há novo documento paralelo.

### A Causa comprovada e limite da conclusão

O Central conferiu diretamente no Sandbox a configuração **V2G WebApp QA
pagamentos**, endpoint fixo `/api/webhooks/asaas-payment`, ainda INTERROMPIDA,
não apagada. O bloqueador é PAYMENT_CONFIRMED do ensaio de R$ 500 já conhecido,
posteriormente estornado; as tentativas de 21–22/10 retornaram exatamente
`{"erro":"confirmacao_divergente"}`. Não reabri a investigação, não pedi novamente
logs/login e não confundi com a fila temporária antiga. Fonte desta evidência:
passagem do Central em 25/10, após leitura direta do painel.

Confronto de código + teste confirma o defeito: o handler antigo consulta o
estado financeiro atual e rejeita a confirmação histórica quando a cobrança já
está REFUNDED, antes de verificar o evento persistido. O ramo de resposta está
identificado pelo corpo exato. A falta da correção no QA mantém esse bloqueador
sem recuperação segura. Isso não determina retroativamente o estado canônico
ou a causa da PRIMEIRA tentativa de 21/10, antes do estorno; não inventei esse
timestamp. A sequência atual necessária já está identificada.

### B Correção existente e preservação

Git começou limpo, HEAD **`1abc8b62e31a3c6024222a845d4801ff034529cf`**. A correção
de replay entrou em **`3d85890520f32271fd0ae147dd63c2e906dec5ee`** e está no HEAD:
`app/api/webhooks/asaas-payment/route.ts:60` e
`lib/contratacao/confirmacao-canonica.ts:21`. O helper permanece idêntico ao
commit de introdução, confirmado pelo diff. Não dupliquei nem reescrevi runtime.

O aceite histórico exige MESMO evento, pedido, cobrança, assinatura, valor,
vencimento e identidade canônica. Devolve 200 histórico sem RPC de aprovação,
sem e-mail/assinatura ou atualização de acesso. Evento ausente, consulta falha
ou divergência real continuam recusados. Estorno original vai à RPC idempotente;
não se fabrica REFUNDED para apagar a pendência.

Acrescentei somente uma regressão em `scripts/conferir-webhook-estorno-handler.mjs`:
três reentregas concorrentes da confirmação estornada, inclusive com pedido
pendente, retornam histórico sem gravar/reaprovar nem executar efeitos.

**Limite de acesso preservado:** o webhook não concede novo acesso por esse
replay. Já `vincular-core`, `acesso.ts` e elegibilidade ainda usam aprovação
histórica; esse caminho de login/concessão continua com a pendência comercial
e de implementação registrada abaixo. Não afirmei acesso correto por mera
chegada de REFUNDED, nem ativei revogação global/alterei direitos anteriores.

### C Testes dirigidos

- `node scripts/conferir-webhook-estorno-handler.mjs`: **11/11**, incluindo a
  nova regressão concorrente, aceite histórico exato e negativa de divergência.
- `node scripts/conferir-422-versao-publicada.mjs`: **6/6**, commit QA antigo vs
  árvore atual com fixtures. O 422 reproduzido coincide com a resposta do painel.
- `pnpm typecheck`: PASS. Sem build/reinício, suíte global ou ensaio financeiro.
- Nenhum teste enviou evento ao QA/Asaas; HTTP 200 é prova LOCAL, não entrega real.

### D Versão servida pelo QA fixo e banco — leitura de 25/10

Vercel confirmou o mesmo alias `https://v2g-webapp-qa.vercel.app`, projeto
`prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, deploy READY
`dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`, ainda no commit
**`fbf00ee3af7fb3cc8c06931138011a49bcd85236`**. Push informado por Victor não
atualizou esse alias. Não usei GET/HEAD como prova de webhook. Produção não tocada.

SELECT QA `zskpijnqgkqwxksqmzmf`: o pedido conhecido continua com CREATED e
CONFIRMED, sem REFUNDED; aprovação histórica e vínculo de perfil presentes,
assinatura nula. A RPC inicial 3DS existe. Os objetos das duas novas migrations
financeira/documental continuam ausentes. Não foi aplicado SQL.

### E Sequência exata e menor autorização externa

1. **Publicação escolhida e backup.** Victor/Central fixa a versão QA. A correção
   mínima de replay já contida em `3d85890` usa o ledger/RPC existentes: não exige
   migration nova só para esse ramo. Se publicar o pacote completo atual
   `1abc8b6`, antes aplicar individualmente a migration financeira
   `20261022152629_asaas_estados_processamento.sql`, após backup e preflight do
   manifesto. Ela é necessária aos novos estados de risco/RECEIVED, não ao
   reconhecimento histórico isolado. Hash permanece
   `F2E6A009626F68CAE310546B4510EC789C30FFEC8F1B5C527A3BD5AFCF6B7F15`.
2. A migration documental `20261022200400_manual_contract_evidence.sql`, hash
   `B66218D8F34CB6795C99C90937B5DA61B517E061969D163EF77A44376550E4DA`, é unidade
   independente para a conferência histórica; não é condição para escoar este
   webhook. Cada aplicação tem autorização própria. Nada de db push geral.
3. Publicar **somente no QA** a versão revisada, conferir SHA/alias/projeto e
   banco/ACL. Guardar versão anterior e backup para recuperação. A aprovação de
   publicação não implica reativar webhook. Não habilitar novas flags por dedução.
4. Com autorização ESPECÍFICA posterior, retomar apenas **V2G WebApp QA pagamentos**.
   A retomada permite reentrega dos eventos existentes; não cria nova cobrança.
   Não apagar, remover, marcar entregue manualmente nem mexer na fila temporária.
   Não assumo que o painel permita testar um evento mantendo a fila interrompida:
   se não permitir, o primeiro HTTP real só será provado depois desta retomada.
5. Acompanhar o mesmo PAYMENT_CONFIRMED: exigir 200 histórico no log e uma única
   ocorrência já existente no ledger, sem assinatura/e-mail/aprovação novos. Então
   exigir o REFUNDED original com 2xx, exatamente uma gravação da mesma cobrança
   e projeção pública refunded. Se faltar evento retido, parar e solicitar
   recuperação específica; não forjar dado. Se voltar erro, interromper o ensaio
   da configuração atual conforme plano autorizado, preservar resposta e estado.
6. Conferir identidade/negócio e ausência de nova concessão por esse replay.
   Não homologar compra ativa usando este pedido estornado. Preservar Auth e
   negócios anteriores; o aceite amplo de concessão por negócio continua separado.

Menor ato para destravar agora: **autorizar a publicação QA de uma versão que
contenha a correção**, escolhendo explicitamente hotfix de replay ou pacote
completo com a unidade financeira prévia. Depois, autorização separada para
retomar a configuração atual e acompanhar os dois eventos. Não faltam mais as
informações do painel solicitadas em 23/10. O manifesto existente continua sendo
`scripts/manifesto-qa-01-02.mjs`; seus dados externos embutidos são snapshot de
23/10, e este adendo registra a leitura atual, sem apresentar o script como live.

---

23/10/2026, manhã de Brasília. Bloco de diagnóstico e preparação concluído.
Leituras externas: Gmail, metadata de deploy, SELECT no QA e calendário.
Sem envio, escrita no banco, replay remoto, nova cobrança, publicação ou acesso
real concedido. Nenhum código de runtime precisou ser duplicado/corrigido.

## Funciona hoje e novidade confirmada

Alice aprovou a tokenização no chamado **1895741**, em 23/10 às 10h31 BRT.
A liberação é monitorada e pode ser revista. A mensagem foi lida diretamente:
[aprovação](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a168f5bf8f55195).
Substitui a pendência de aguardar a aprovação, não comprova configuração ou uso
em produção. Liberação de 3DS de 22/10 preservada; não se estende automaticamente
às mensalidades. Central já respondeu, recibo SENT `1a1690358e6bbd78`; nada reenviado.

Preservadas as provas anteriores de Pix semestral, cartão anual, primeira
mensalidade e confirmação por e-mail. O ensaio de R$ 500 foi estornado e a
assinatura cancelada no Asaas, conforme checkpoint anterior; não repeti a operação
nem usei esse pedido como prova de compra ativa. O estorno ainda não consta no QA.

## O que foi resolvido neste bloco

1. Correlacionei o commit efetivamente publicado com o comportamento de 422 e
   reproduzi o defeito offline, executando o handler/parsers do próprio commit.
2. Reconfirmei no QA o pedido, ledger financeiro, versões remotas e precondições
   das sete RPCs. Identifiquei os timestamps remotos diferentes dos arquivos
   locais: ausência do timestamp original não significa migration ausente.
3. Preparei **um manifesto executável**, somente leitura, com hashes dos arquivos
   e de cada SQL, dependências, equivalências QA, backup, sequência e recuperação.
4. Atualizei a situação de tokenização e separei falha reproduzida de causa remota
   ainda não confirmada. Não afrouxei aceite de evento perdido para devolver 200.

## Evidência do QA e diferença de versões

Leitura Vercel em 23/10:

- Projeto `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, alias
  `https://v2g-webapp-qa.vercel.app`, deploy READY
  `dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`.
- Commit publicado **`fbf00ee3af7fb3cc8c06931138011a49bcd85236`**.
- HEAD local lido pelo manifesto: `7374227997848a5e2b8b99b5ada4e67c36eabfc0`,
  mais mudanças não commitadas. HEAD sozinho não contém a entrega inteira.
- `target=production` no retorno refere-se ao projeto QA, não ao projeto de
  produção da V2G. Produção não foi reinspecionada neste bloco.

SELECT no Supabase QA **`zskpijnqgkqwxksqmzmf`**, sem escrita:

- Pedido `6ae800e5-b4a2-4f12-a6bd-882a5a6cfcaf`: self_service, initial_3ds,
  mensal, R$ 500, aprovação histórica, assinatura nula, negócio
  `3e683d9b-498a-4e07-91b2-8e840c4226ed` e perfil comprador já preenchido.
- Cobrança `pay_j8ec6x5ibbhxk38a`, cliente `cus_000009623360`, vencimento 21/10.
- Ledger continua somente com CREATED e CONFIRMED, recebidos em 21/10 às
  22:59:52 UTC. **Nenhum REFUNDED**, sem inferir que a fila esteja hoje interrompida.
- As quatro RPCs registradoras antigas existem e ainda não aceitam AUTHORIZED
  nas whitelists. O classificador `evento_asaas_impede_confirmacao` está ausente.
- `commercial_manual_evidence` também está ausente. Portanto as duas unidades
  novas continuam não aplicadas, comprovado por objetos além do ledger.

O preflight SELECT das sete funções financeiras retornou: todas presentes,
security invoker, search_path vazio, precondições de trechos compatíveis,
EXECUTE negado a anon/authenticated e permitido a service_role. **Isso é
compatibilidade de preparação, não aplicação nem ensaio de pagamento.**

## Diagnóstico do 422

O [aviso da fila QA](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a1634641bfed835)
foi lido. Identifica `V2G WebApp QA pagamentos`, destino `/api/webhooks/asaas-payment`,
HTTP 422 e horário 22/10 08:00:58 no próprio aviso. Não contém ID do evento,
tipo, cobrança ou corpo JSON da resposta. A falha de 21/10 informada pelo
Central não foi atribuída por dedução a esse horário de aviso.

O aviso de 14 dias da fila `V2G QA checkout temporario`, com destino trycloudflare
antigo, é outra fila, conforme passagem do Central. Não foi usado como prova de
interrupção atual do webhook QA. Não reativei nem removi nenhuma fila.

### Defeito de versão demonstrado e já corrigido localmente

O handler no commit QA `fbf00ee` rejeita uma confirmação reenviada quando a
consulta canônica já retorna REFUNDED. Isso acontece antes de consultar o evento
anterior: devolve `422 { erro: "confirmacao_divergente" }`.

A árvore local já trata o caso em `app/api/webhooks/asaas-payment/route.ts:60` e
`lib/contratacao/confirmacao-canonica.ts:21`: só reconhece como histórico quando
existe EXATAMENTE o mesmo evento, pedido, cobrança, assinatura, valor e vencimento,
e a identidade canônica confere. Não grava estorno artificial, não aprova compra,
não cria assinatura nem repete e-mail. Evento não persistido/divergente continua
recusado. Não há novo patch de runtime a inventar para esse defeito.

### Outros 422 possíveis que precisam do corpo da resposta

| Resposta | Etapa | Evidência local |
|---|---|---|
| evento_invalido | Parser financeiro ou status de confirmação inválido | `route.ts:35`, `:38`; `evento-financeiro.ts:32`, `pagamento-evento.ts` |
| pedido_divergente | Origem, forma, referência, cliente, valor ou vínculo incompatível | `route.ts:50`, `:80`, `:114`, `:118` |
| confirmacao_divergente | Consulta canônica não confirma o mesmo fato; inclui replay estornado na versão antiga | `route.ts:58`, `:75`; `confirmacao-canonica.ts:4` |
| evento_divergente | RPC devolveu false, por identidade, estado, evento ou valor incompatível | `route.ts:88`, `:140`; RPC `registrar_evento_inicial_3ds` |

Token incorreto produz 401; erro de consulta/gravação ou conciliação de assinatura
produz 503, não 422. Novos estados de risco não suportados eram **ignorados** pelo
parser antigo; não os declarei causa do 422 sem evento. Publicar parser novo sem
a migration correspondente, por outro lado, pode fazer a RPC recusar esses estados.

**HIPÓTESE remota mais aderente ao defeito reproduzido:** confirmação antiga
retida na entrega sequencial volta após estorno; o QA antigo a recusa e o estorno
original não chega ao ledger. **Não é causa remota confirmada.** O teste também
mostrou que o estorno original válido alcança a RPC nas duas versões; o nome
REFUNDED sozinho não explica um 422.

### Dado mínimo ausente

ID/tipo do evento, cobrança, horário/tentativa, corpo da resposta 422, estado
atual e retenção da fila correta. Central já solicitou ao suporte. Alternativa:
Victor entra no **Sandbox** e disponibiliza Integrações → Logs de Webhooks para
leitura desses campos, sem segredo/cartão ou botão de reenvio. A navegação desta
rodada abriu só a página pública, sem painel autenticado; encerrei a aba sem
novo login, reset, leitura de credencial ou tentativa de contornar autenticação.

## Manifesto único e execução futura do QA

Inventário revisável: **`node scripts/manifesto-qa-01-02.mjs`**.
O comando foi executado com sucesso e calcula os SHA256 atuais dos arquivos e
de **15 migrations catalogadas**. Não conecta à rede, não aplica SQL, não publica
e não lê `.env`. Datas/versões externas embutidas são snapshot de 23/10, não uma
consulta live. Catálogo de dependências não é autorização para aplicar 15 SQLs.

Preflight reutilizável: `scripts/sql/qa-01-02-preflight.sql`, **SELECT somente**,
executado nesta rodada no QA fixado. Checa definições/precondições/ACL das sete
funções. Antes de aplicar, refazer a leitura porque o banco pode mudar.

As equivalências já medidas incluem:

| Arquivo local | Versão QA observada |
|---|---|
| 0026 / 0029 / 0034 | 20261008225606 / 20261008225618 / 20261008225620 |
| checkout_transparente / retentativa | 20261009010911 / 20261009013753 |
| gestor_responsaveis_tarefas | 20261009041246 |
| eventos_financeiros / falha_desafio | 20261011141908 / 20261013031434 |
| ligar_lead / security_controls | 20261020010727 / 20261020010734 |
| cartao_mensal_3ds / email_outbox | 20261020023349 / 20261021134245 |
| assisted_asaas_orders, variante server_authorization | 20261021203643 |

Essa equivalência foi estabelecida pelo nome/objetos/precondições. Não declara
igualdade byte a byte com SQL remoto nem permite reaplicar por nome/timestamp.

**Únicas duas novas migrations propostas neste pacote:**

- `20261022152629_asaas_estados_processamento.sql`, SHA256
  `F2E6A009626F68CAE310546B4510EC789C30FFEC8F1B5C527A3BD5AFCF6B7F15`.
  Depende das funções comerciais/3DS existentes. Precondições compatíveis hoje.
- `20261022200400_manual_contract_evidence.sql`, SHA256
  `B66218D8F34CB6795C99C90937B5DA61B517E061969D163EF77A44376550E4DA`.
  Depende das tabelas comerciais, ledger e carteira existentes, **não** da primeira
  migration nova nem de ativar checkout/3DS. Não concede acesso.

Sequência preparada, ainda não executada:

1. Victor fixa o commit de entrega, incluindo arquivos não commitados revisados,
   e confirma só projeto QA. Manifesto inclui o helper de replay, além do handler.
2. Antes de cada unidade: SELECT do ledger/objetos e backup protegido dos dados
   comerciais/carteira, definições SQL, constraints, ACL e versão QA anterior.
   Registrar local, hash, horário e responsável do backup, sem chaves no relatório.
3. Autorizar e aplicar cada unidade nova individualmente em transação; verificar
   e parar entre unidades. Não usar push geral, reparar ledger por conveniência
   ou reaplicar dependências remotas com timestamp diferente.
4. Após verificar banco/ACL, Victor publica o commit aprovado **somente no QA**.
   Conferir alias, projeto, deploy e SHA; não basta preview/arquivo local/READY.
5. Executar a matriz autenticada abaixo com manifesto de atores/dados aprovado.
   A retomada de fila/replay é portão separado, só depois do log e versão correta.

Recuperação: erro SQL deve reverter a unidade inteira; conferir antes de nova
tentativa. Se já aplicada e houver problema de código, rollback QA para versão
anterior registrada, mediante autorização, preservando evidências e ledger.
Não apagar tabela ou direito, desfazer estorno, restaurar produção ou repetir
cobrança como limpeza. Com SELECT somente neste bloco, não há dado remoto criado
a limpar. Futura limpeza de fixtures deve nomear IDs/objetos e ser autorizada;
as provas financeiras históricas não são descartáveis por inferência.

## Matriz de validação de confirmação e acesso

| Passo | Prova necessária | Parada / negação |
|---|---|---|
| Pagamento e pedido | Evento original + consulta canônica + ledger, cliente/valor/cobrança iguais | Não usar callback, captura autorizada ou análise aprovada como pagamento |
| Identidade | Sessão do comprador exato, e-mail confirmado e user_id esperado | Outro perfil ou e-mail não confirmado não reivindica a compra |
| Negócio | business_id do pedido, claim_email exato e releitura da propriedade | Não associar por semelhança nem pelo cookie escolhido |
| Vínculo | buyer_profile_id correto e negócio realmente do comprador | Pedido de outro negócio não abre seu conteúdo |
| Acesso vigente | Compra ativa ou direito por negócio aprovado por política explícita | Pedido estornado não homologa compra ativa; política nova ainda não implementada |
| Isolamento | Usuário não autorizado negado; demais negócios anteriores preservados | Não revogar Auth/perfil inteiro por evento de uma compra |
| Histórico/Pix | Evidência por negócio, responsável, fonte, data e revisão | Documento conferido não fabrica Asaas, identidade autenticada ou grant |
| Saída do ensaio | IDs/resultado/logs registrados; plano de limpeza autorizado cumprido | Não criar outra cobrança, convite ou acesso real neste bloco |

Fontes de implementação: `lib/contratacao/vincular-core.ts:25`, `:42`, `:56`;
`lib/contratacao/acesso.ts:19`; `lib/multiconta/elegibilidade.ts:41`.
O código atual continua usando aprovação histórica sem filtro de estorno no
vínculo/acesso. A projeção visual de estorno NÃO ativa uma política de revogação.
Preservar a proposta mínima: impedir nova concessão sustentada exclusivamente
em compra integralmente estornada, sem retirar outros direitos; **aguarda decisão
humana e implementação própria**. Não concedi acesso nesta retomada.

## Etapa 02 com verificação posterior

Reutilizado o procedimento existente, sem novo módulo jurídico/fiscal. A busca
Gmail posterior a 21/10 por Contabilizei, nota/NFS-e, contrato final e advogado
não encontrou confirmação final; retornou correspondência ao Asaas e o e-mail
de teste. A resposta enviada em 22/10 ainda condicionava o complemento ao
instrumento/alteração de valor/situação fiscal confirmados pelos responsáveis.
Isso não prova inexistência em outros canais. Não pedir de novo o que Victor
já possa ter no jurídico/contabilidade: solicitar a referência concreta.

No pedido fictício inspecionado: zero contrato signed e zero nota authorized.
Não extrapolar essa contagem para clientes reais. Continuam sem prova neste
recorte: instrumento final aplicável, poderes/signatário, evidência de assinatura
e nota/competência correspondente quando cabível. Tokenização aprovada não
substitui nenhum desses atos, e contrato ser opcional para análise Asaas não o
transforma em obrigação dispensada na relação comercial.

## Testes e limites

- Novo `node scripts/conferir-422-versao-publicada.mjs`: **6/6**. Snapshot do
  próprio commit QA vs árvore local, com dados fictícios; identifica diferenças
  de resposta e prova que evento ausente/divergente não recebe 200 histórico.
  O script lê Git e módulos reais, sem rede, `.env` ou eventos reais.
- Manifesto executado com sucesso; todos os arquivos/SQLs catalogados existem e
  foram hasheados. Preflight SELECT executado no QA, sete funções compatíveis.
- Runtime TS/TSX/SQL de migrations não foi alterado nesta rodada; não repeti
  typecheck nem suites financeiras/manuais já verdes sem risco novo. Nenhum build
  ou reinício de dev compartilhado. Teste offline não confirma a causa remota.

## Até cinco faltas em ordem e pedido pronto para revisão

1. **Logs do evento 422 e fila atual**, com os campos mínimos acima. Dono:
   Asaas/Alice (pedido já enviado pelo Central) ou sessão Sandbox de Victor.
2. **Autorização individual de banco QA após backup**, para as duas unidades
   nomeadas e hasheadas, sem outras migrations. Dono: Victor/Central; executor
   do próximo bloco explicitamente autorizado. A unidade 1 backend não cobre isso.
3. **Commit e publicação QA exatos**, seguidos da conciliação controlada do
   estorno/fila quando autorizada. Dono: Victor/Central. Não pedir cobrança nova.
4. **Prova autenticada do negócio correto e política de concessão**, inclusive
   piloto histórico, isolamentos e alerta/WhatsApp da LP. Dono: 01/02 + Victor;
   depende da versão correta e da identificação do piloto/decisão por negócio.
5. **Referência final jurídica/fiscal** e execução manual de cada ato. Donos:
   Victor, jurídico e contabilidade. Automação posterior, sem assinatura/emissão aqui.

Menor ação de Victor para adiantar o bloqueio causal: abrir o Sandbox em
Integrações → Logs de Webhooks e avisar, sem senha/código no chat; alternativamente,
aguardar a resposta à solicitação que o Central já enviou. O pedido de execução
QA deve citar projeto, commit a fixar, as duas versões/hashes e backup; não é
uma autorização genérica de publicar/reativar/cobrar.

## Fontes de coordenação e preservação

Decisões e os três checkpoints anteriores foram relidos. Calendário original
relido via metadata e ranges `Agora — Victor!A1:E9`, `Resumo 01-08!A1:I6` e
`Plano diário 20-31!A1:P9`: ainda refletem fechamento de 22/10/análise Asaas.
Atualização de aprovação veio da mensagem primária de 23/10, não dos quadros.
Figma **NÃO RELIDO**, quota conhecida, sem insistência; usado espelho local v6
`docs/execucao-evento-28-10.md` e passagem humana atual. Quadros pertencem ao Central.

Skills de deploy/Supabase orientaram pinagem de alvo, conferência de versão,
ledger e permissões em leitura; skills Drive/Sheets orientaram leitura limitada.
Não houve edição de onboarding, criativos, backend, páginas legais, credenciais,
flags, quadros ou arquivos concorrentes. Bloco encerrado; Central faz o handoff.
