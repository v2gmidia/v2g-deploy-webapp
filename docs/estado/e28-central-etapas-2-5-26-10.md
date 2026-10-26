# Central — etapas 2–5 — 26/10/2026

## Autorização e objetivo

Victor informou push e autorizou avançar etapas 2–5: QA, percurso de revisão,
backend/métricas e geração pelo agente. Entrada do cliente-piloto fica na etapa6.
Piloto pago continua sem provedor/teto final aprovados. Produção fora do alvo.

## Etapa2 — publicação QA e recorte

- Git local limpo no início, HEAD `2ad1785e5dee4f27382912aa282550d8bffa9221`.
- Antes da intervenção, domínio fixo QA servia `46dca3f`; preview mais recente
  `dpl_CSgnY9KEBcQ5douJbDGwiT96aZFR` já continha `2ad1785`.
- Conferido projeto `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, nome `v2g-webapp-qa`,
  time `v2-g`. Papel e atribuição conferidos por consulta exata no Supabase QA.
- Configuradas nove variáveis não secretas, apenas target `production` DO
  projeto QA: três flags/IDs/nome/período do recorte e backend verified=false.
  `V2G_MANAGER_WORK_ENABLED` e `V2G_MANAGER_METRICS_READ_ENABLED` já eram true.
  `V2G_CREATIVE_REVIEW_ENABLED` já era true e foi preservada.
- Publicado o SHA exato por redeploy da fonte revisada, `withLatestCommit=false`:
  `dpl_4LcEPpbzeeBKZPoRtAE9pS9dhcvK`, READY, sem erro de alias.
- Alias estável `https://v2g-webapp-qa.vercel.app` atribuído à versão nova.

## Etapa3 — prova atual

- Chrome autenticado como operador abriu `/supergestor/homologacao`, com
  negócio fictício atribuído, duas peças e período20–26/10.
- Link abriu a fila do mesmo negócio. Peça `marca.png`, ainda pendente,
  recebeu pedido de ajuste de ensaio26/10. Banco confirmou
  `changes_requested`, operador exato e `reviewed_at` do bloco.
- Peça `v2g-clareza-feed-v1.png` preservou ajuste anterior. Nenhuma publicação.
- Retorno à homologação mostrou os dois estados persistidos.
- Sem cookies, GET respondeu307 para `/entrar?next=%2Fsupergestor%2Fhomologacao`.
- Parâmetros businessId e desde adulterados foram ignorados: recorte preservado.
- Cliente/operador não atribuído: testes locais anteriores cobrem negação;
  nova prova HTTPS com essas sessões NÃO EXECUTADA, pois Chrome está na conta
  operador. Não retirar papel nem fabricar sessão para simular esse aceite.
- Visão cliente do ajuste anterior foi comprovada no bloco anterior;
  retorno do novo ajuste26/10 na sessão cliente ainda pendente.
- Screenshot desktop fora do Git:
  `C:/Users/victo/.codex/visualizations/2026/10/04/01a104ed-4236-7303-86b9-26f3b012a09f/qa-homologacao-publicada-26-10.png`.

## Etapas4/5 — frentes em execução

- Central enviou blocos específicos aos chats05/06 e07/08, preservando donos.
-07/08 confirmou novamente HTTPS com502. Isso não prova versão/readiness.
- Victor autenticou o painel Easypanel. Central leu fonte do serviço
  `ia/backend-qa`: repositório `v2gmidia/backend_v2g`, main, build `/`,
  Dockerfile `infra/Dockerfile`. Não foi iniciada implantação/restart.
- Painel mostrou0B de memória e nenhum histórico de implantação no recorte
  visível. Não determina sozinho a causa do502. Ambiente/segredos não lidos.
- Backend verified permanecefalse e homologação mostra indisponibilidade.
-05/06 identificou porta real executando tentativa dentro do POST e contexto
  real não liberado;07/08 confirmou e prepara dispatcher durável local.
  Central repassou dependência, sem autorizar mudança do QA de leitura para escrita.
- Unidade1 já aplicada anteriormente; unidades2–9 exigem manifesto e aprovação
  específica conforme portão vigente. Nenhuma migration remota neste bloco.

## Próximo ato

Receber checkpoints novos, confrontar código/testes e contrato de dispatcher;
reconferir pacote de schema/configuração mínima do backend. Não chamar testes
locais de imagem real nem chamar502 de backend funcionando. Custos/provedor e
referências aprovadas continuam requisitos do piloto real.

## Fechamento recebido de07/08

Checkpoint lido:
`backend_v2g/docs/estado/e28-07-08-qa-readiness-dispatcher-local-26-10.md`.
Confirma30 campos ausentes em execucoes,10 em criativos e cinco tabelas ausentes;
não atribui a causa do502 somente a esse diagnóstico. Sem execução/métricas,
schema completo ainda precisa de fixture autorizada para provar200.

Dispatcher real separado doPOST entregue LOCALMENTE, sem alterar src/imagem.
POST202 enfileira; tick separado reivindica tentativa única; marcador anterior
à chamada impede retry automático depois de resultado incerto. Storage retoma
bytes persistidos. Nova porta `DependenciasGeracao.criar_contexto(sql,profile_id)`
foi repassada ao05/06 pela Central, junto com identidade e DTO finais.

Testes reportados e checkpoint conferido:10 cenários novos instrumentados,
2884 testes totais/9 ignorados, Ruff/mypy limpos. Não reexecutados pela Central;
nenhuma prova de modelo pago, Storage gerenciado ou HTTPS da geração.

Unidade2 SQL integral lida e SHA256 reconferido:
`b24448cb9dfdacb0fcc6a089b4b749cdfd77169d51229f3e630c708b82cd3156`.
Cópia de segurança do catálogo anterior (27colunas, constraints, índices, grants,
RLS, zero policies e ledger unidade1), fora do Git e sem dados pessoais:
`C:/Users/victo/v2g-backups/qa-unidade2-schema-before-20261026.json`.
Não é backup físico integral nem restauração pós-commit autorizada.
Solicitada confirmação nominal da unidade2; ainda não aplicada. Confirmar de
novo todas as colisões do preâmbulo e alvo imediatamente antes da aplicação.

### Atualização posterior — unidade2 autorizada e aplicada

Victor confirmou expressamente: “Autorizar somente a unidade 2 no QA”.
Projeto ACTIVE_HEALTHY/nome/ID reconferidos; hash integral inalterado; preflight
zero linhas, zero colisões de colunas/constraints/índices, RLStrue, zero policies,
baseline única presente e unidade2 ausente. Backup local conferido antes do ato.

Aplicada por `apply_migration`, nome `qa_bkd_0002_execucoes_completa`.
Ledger real: **20261026151322**. Pós-validação:30colunas novas/57total,
5constraints,4índices,zero linhas,RLStrue,zero policies,SELECT service_role true;
escrita service_role e acesso anon/authenticated false. Sem unidade3 aplicada.

Advisors não apontaram alteração de funções neste bloco (SQL não cria funções).
Relatam INFO de RLS sem policies nos objetos internos — intencional com ACL
fechada — e WARN em funções LP/claim_businesses e proteção de senha do projeto,
fora do SQL aplicado. Não foram modificadas ou auditadas essas funções aqui.
Referências do advisor para revisão separada:
[RPC pública SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[RPC autenticada SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[proteção de senha](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Unidade3 integral lida e hash reconferido d1cd68b1305f7b44e2bb879f3d97fc8f221de5aa9de77580740ed5ac00b70479.
Autorização nominal solicitada; sem execução antes da resposta.

### Atualização posterior — unidade 3 autorizada e aplicada

Victor respondeu: “Autorizar somente a unidade 3 no QA”. Projeto
`zskpijnqgkqwxksqmzmf` / `v2g-webapp-qa` ACTIVE_HEALTHY reconferido.
SHA256 do SQL integral inalterado:
`d1cd68b1305f7b44e2bb879f3d97fc8f221de5aa9de77580740ed5ac00b70479`.
Pré-validação: oito colunas, zero linhas, zero colisões, RLS ativa,
zero policies, unidades 1 e 2 registradas. Cópia do catálogo anterior,
sem dados pessoais, salva e conferida fora do Git (15.845 bytes):
`C:/Users/victo/v2g-backups/qa-unidade3-schema-before-20261026.json`.
É cópia de estrutura da tabela vazia, não backup físico integral do projeto.

SQL aplicado integralmente em transação explícita por `apply_migration`, nome
`qa_bkd_0003_criativos_completa`; ledger real **20261026151822**.
Consulta posterior comprovou 10 colunas novas / 18 totais, dois índices novos,
zero linhas, RLS ativa e zero policies. Serviço mantém SELECT e não escrita;
anon/authenticated sem acesso. Nenhuma alteração à tabela WebApp `creatives`.
Sem geração de imagem, publicação, deploy backend ou unidade 4 aplicada.
Parada antes da unidade 4 conforme autorização.

### Fechamento local de 05/06

Checkpoint conferido: `docs/estado/e28-05-06-preparo-geracao-real-26-10.md`.
44 testes locais únicos e typecheck/diff reportados; não reexecutados pela
Central. Integração instrumentada usa dispatcher real com provider substituído,
PGlite e Storage instrumentado, não modelo pago nem sessão humana real.
Montador do triângulo exige identidade/Pinterest/anúncio do nicho e versões/
direitos, mas não é catálogo persistente nem loader de fontes aprovadas.
Ainda faltam ponte de identidade humana, fontes persistentes aprovadas,
ambiente gravável isolado e piloto nominal com provedor/teto autorizados.
Não habilitar geração apenas mudando flag. Código novo permanece local.

### Atualização — unidades 4 e 5 autorizadas e aplicadas em sequência

Victor autorizou expressamente: “seguir o 4 e o 5, quando chegar no 6 me chama”.
Alvo conferido novamente: Supabase QA `zskpijnqgkqwxksqmzmf`, projeto
`v2g-webapp-qa`, ACTIVE_HEALTHY. Cada unidade foi executada isoladamente,
após cópia do catálogo anterior fora do Git, preflight e hash integral do SQL.

**Unidade 4:** `04_metricas_moeda_sem_backfill.sql`, SHA256
`ee8f11d9950296cd9e743da35a69c488bd389bca302fdeb8ca6ff4e6a3e7e039`.
Backup anterior: `C:/Users/victo/v2g-backups/qa-unidade4-schema-before-20261026.json`.
Antes: unidades 1–3 no ledger, `metricas_diarias` ausente, execuções e criativos
vazios, nenhum índice/constraint conflitante. Aplicada em transação explícita
por `apply_migration` como `qa_bkd_0004_metricas_moeda_sem_backfill`, ledger
**20261026153101**. Pós: tabela de 11 colunas e zero linhas, três índices
contando PK, quatro constraints; moeda anulável e sem default; conversões
`numeric(12,2)` como previsto antes da unidade 5. RLS ativa, zero policies,
service_role SELECT true/escrita false, anon/authenticated sem acesso.

**Unidade 5:** `05_metricas_precisao_decimal.sql`, SHA256
`e4ccb9cbdce18bf638f9e13a3f18f3ab6bd1e9cdda0975e2b66ce5793562670b`.
Backup anterior: `C:/Users/victo/v2g-backups/qa-unidade5-schema-before-20261026.json`.
Antes: unidade 4 no ledger, tabela vazia e conversões com escala 2. Aplicada
em transação explícita por `apply_migration` como
`qa_bkd_0005_metricas_precisao_decimal`, ledger **20261026153128**.
Pós: conversões `numeric` sem escala fixa, tabela ainda vazia, moeda sem
default/anulável, RLS e ACL preservadas. A consulta confirmou o tipo e a
escala; não inserimos linha remota nem fizemos ensaio de roundtrip nesta rodada.

Parada antes da **unidade 6**. Nenhum deploy do backend, fixture, campanha,
geração paga ou alteração em produção decorre destes DDLs. Serviço backend QA
continuava 502 na última prova válida; schema parcial não comprova boot.

### Atualização posterior — unidade 6 autorizada e aplicada

Victor autorizou expressamente apenas a unidade 6. Projeto QA
`zskpijnqgkqwxksqmzmf`/`v2g-webapp-qa` ACTIVE_HEALTHY reconferido; SQL
`06_respostas_do_dono.sql` SHA256
`801c9d91d8b700779d7852af08257d433d85728ab49959dd608792dd243ec673`.
Preflight: unidades 1–5 registradas; tabela e índice ausentes; execuções e
métricas vazias. Backup de catálogo anterior, sem linhas de negócio, salvo
fora do Git em
`C:/Users/victo/v2g-backups/qa-unidade6-schema-before-20261026.json`.

SQL aplicado em transação explícita por `apply_migration` como
`qa_bkd_0006_respostas_do_dono`; ledger real **20261026154234**. Consulta
posterior: tabela de nove colunas e zero linhas, dois índices contando PK,
seis constraints incluindo resposta não vazia, origem limitada a app/WhatsApp/
gestor, números não negativos e FK de execução. RLS ativa, zero policies;
service_role SELECT true/escrita false, anon/authenticated sem acesso.

**Parada antes da unidade 7.** Não foram inseridas respostas, vendas ou
receita; nenhum endpoint/deploy/métrica integrada foi homologado por este DDL.

### Atualização posterior — pacote de schema QA concluído até a unidade 9

Victor autorizou concluir após a unidade 6. Interpretação comunicada antes do
ato: completar as unidades 7, 8 e 9 do pacote QA. Cada SQL foi lido, hash
conferido com o manifesto, preflight e backup de catálogo separados, aplicado
em transação única e verificado antes de avançar. Projeto
`zskpijnqgkqwxksqmzmf`/`v2g-webapp-qa` ACTIVE_HEALTHY reconferido.

| Unidade | SQL SHA256 | Backup catálogo prévio fora Git | Ledger real | Pós-prova |
|---|---|---|---|---|
| 7 `qa_bkd_0007_execucoes_de_rotina` | `7a69dc6f22a8e97f4ba5604a277941cc391cb3691f49b9d85dfc28e64f0e3654` | `C:/Users/victo/v2g-backups/qa-unidade7-schema-before-20261026.json` | `20261026154345` | 9 colunas, 0 linhas; `ok`/fim anuláveis; PK e índice; RLS/ACL fechadas |
| 8 `qa_bkd_0008_perguntas_apresentadas` | `d6a43e3660efde32729837953cbef0667f9e93da5f4ba594a34933b39ab540cc` | `C:/Users/victo/v2g-backups/qa-unidade8-schema-before-20261026.json` | `20261026154408` | 6 colunas, 0 linhas; FK, origem e PK; PK e índice; RLS/ACL fechadas |
| 9 `qa_bkd_0009_campanhas_criacao` | `b8cd27fdf1a592e0f3dd41189ffdcffc3a81ef97ae6240a61a83ad3483d67b0b` | `C:/Users/victo/v2g-backups/qa-unidade9-schema-before-20261026.json` | `20261026154442` | 14 colunas, 0 linhas; idempotência e exceção de backfill verificadas; RLS/ACL fechadas |

Consulta final das **sete tabelas exigidas pela guarda de boot**: todas existem,
com RLS ativa, zero policies, `service_role` somente SELECT e nenhum acesso
para anon/authenticated. As nove unidades QA constam no ledger. São provas do
catálogo remoto, não da execução da guarda do backend: não foram inseridas
fixtures nem usada credencial de API neste ensaio.

Em 26/10, GET público de `https://ia-backend-qa.5hue9s.easypanel.host/saude`
ainda respondeu **502**. Não foi feita publicação/configuração Easypanel ou
WebApp por consequência dos DDLs. Próximo recorte: conferir versão/log e
presença (sem ler valores) das configurações do serviço QA; publicar a versão
QA com a cerca somente leitura e testar `/saude`, 401 sem token, 404 para
negócio indevido e 200 para negócio/fixture autorizados. Só depois validar
conta/período na tela e ativar o indicador de backend verificado.

### Diagnóstico do serviço backend QA — autorização posterior de Victor

No Easypanel, `ia/backend-qa` estava sem implantação e os logs aguardavam o
início do serviço. A fonte configurada é `v2gmidia/backend_v2g`, ramo `main`,
Dockerfile `infra/Dockerfile`. O domínio público apontava à porta 80, enquanto
o container escuta a porta 8000. A rota foi corrigida no painel para 8000;
o painel confirmou a atualização. O ambiente estava vazio: foram salvas e
reconferidas **somente pelos nomes** as 14 configurações não secretas da cerca
QA de leitura, conforme `backend_v2g/docs/qa/backend-qa-runtime-leitura-22-10.md`.
`API_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` não constavam na última conferência;
nenhum valor privado foi lido ou impresso. O backend não foi implantado e a
prova HTTPS de boot/autenticação/leitura segue pendente.

No Vercel, somente no projeto `v2g-webapp-qa`, target `production` do QA, foi
incluída a URL não secreta `V2G_BACKEND_URL` do serviço Easypanel. A variável
privada `V2G_BACKEND_TOKEN` ainda não constava. A alteração não entrou no
deployment QA existente; precisa de nova publicação depois de o backend
subir e de o token coincidir. O indicador
`V2G_QA_MANAGER_BACKEND_READ_VERIFIED` permanece `false`. Nenhuma métrica
foi consultada ou apresentada como real neste recorte.

Consulta somente leitura ao projeto QA confirmou que o negócio fictício do
ensaio existe (`dados_ficticios=true`) e tem uma atribuição exata ao operador,
mas tem **zero** `execucoes` no backend e `metricas_diarias` tem **zero** linhas
no projeto. Assim, mesmo após o boot, esse recorte deve retornar “sem execução”
até que uma fixture fictícia, identificada e reversível seja inserida com
autorização. Nenhum número de campanha real pode ser deduzido dessa base vazia.

### Prova posterior do backend QA no HTTPS

Após Victor salvar privadamente `SUPABASE_SERVICE_ROLE_KEY` e `API_TOKEN` no
Easypanel, a presença dos **nomes** foi conferida sem ler valores. O ramo
`main` remoto do backend apontava para `d4a75e80cab17e01130a1b935f5b791c7098e3a3`.
O serviço `ia/backend-qa` foi implantado pelo painel. GET público `/saude`
respondeu **200**, `ambiente=production`, `db` mock=false, provedores mock=true,
observador inativo, `esquema=true` e sete tabelas conferidas sem pendências.
GET do consolidado sem token e com token inválido respondeu **401** em HTTPS.

Como as tabelas estavam vazias, foi inserida **somente no projeto QA** uma
execução de ensaio e uma linha de métrica para o negócio marcado
`dados_ficticios=true` e já atribuído ao operador correto. Identificadores de
limpeza: execução `e2800000-0000-4000-8000-000000000026`, conta
`act_999000000026`, campanha `999000000026`, dia `2026-10-24`. Valores
fictícios: R$12,34 investidos, oito cliques, 400 impressões e 2,125 resultados
atribuídos; **não são resultados da V2G nem coleta da Meta**. A transação
verificou o negócio fictício, a atribuição e a ausência anterior dos IDs.
Depois dela havia exatamente uma execução e uma métrica dessa fixture.

Com o `API_TOKEN` lido **apenas pelo processo dentro do próprio container**,
sem expor seu valor no comando ou resultado, o GET HTTPS do consolidado
retornou **200** com o mesmo `business_id`, recorte `2026-10-20`–`2026-10-26`,
conta fictícia `act_999000000026`, 1234 centavos e oito cliques. O mesmo
negócio com `profile_id` divergente retornou **404**; GET de rota fora da lista
permitida retornou **403**. O serviço está de pé e a cerca de leitura foi
observada. A prova de isolamento por usuário humano ainda pertence ao WebApp.

Na última consulta ao Vercel, `V2G_BACKEND_TOKEN` continuava ausente do projeto
`v2g-webapp-qa`; o formulário Secret/Production ficou preparado para Victor
colar privadamente o token. Sem ele, não publicar o WebApp com backend verified.

### Fechamento das etapas 1–3 de leitura QA, após o token da Vercel

Victor salvou `V2G_BACKEND_TOKEN` no projeto **`v2g-webapp-qa`**, target
`production` desse projeto, tipo `sensitive`; o conector confirmou apenas nome,
tipo e alvo, sem descriptografar. A guarda `V2G_QA_MANAGER_BACKEND_READ_VERIFIED`
foi mudada para `true` apenas no mesmo projeto QA após a prova HTTPS
200/401/404/403 acima. Foi criado o deployment QA
`dpl_J3womZi4mhGocjUGzfuQ697cbJYU` usando o SHA exato
`2ad1785e5dee4f27382912aa282550d8bffa9221`, `withLatestCommit=false`,
sem incluir o HEAD mais novo de geração. Deployment **READY**, alias estável
`v2g-webapp-qa.vercel.app`, sem erro de alias.

Chrome autenticado como operador atribuído abriu
`/supergestor/homologacao` no alias estável. A tela exibiu o negócio
**FICTÍCIO**, conta `act_999000000026`, campanha `999000000026`, período
`20/10/2026`–`26/10/2026`, R$12,34, 400 impressões, oito cliques e 2,125
resultados atribuídos. Esses valores coincidem com a **fixture de ensaio**
da tabela backend, não com Meta real. A tela mostrou leitura parcial (um dia
observado) e não converteu resultados em conversas ou vendas. Parâmetros
`businessId` e `desde` adulterados na URL não mudaram negócio, conta, período
nem valor. GET da rota sem cookie retornou **307** para login. Operador
não atribuído e cliente externo não foram reensaiados nesta versão; a guarda
existente foi inspecionada no código, e as provas anteriores permanecem.

**Limite de evidência:** a linha sintética usa `canal=meta` e o contrato
traduz isso na UI como “Meta Marketing API”, embora a linha tenha sido inserida
manualmente para QA. O banner da página e o nome do negócio dizem “fictício”,
mas a fonte dentro da ficha pode induzir erro se alguém ignorar o contexto.
Antes de demonstrar métricas reais ou reaproveitar a tela para cliente,
substituir essa fixture por ingestão verificada e validar a fonte de ponta a
ponta. A fixture permanece no QA para reprodução; removê-la exige excluir
primeiro a métrica da campanha `999000000026` e depois a execução
`e2800000-0000-4000-8000-000000000026`, com nova autorização explícita.
Produção, Meta, cobrança e geração paga não foram alteradas neste recorte.
