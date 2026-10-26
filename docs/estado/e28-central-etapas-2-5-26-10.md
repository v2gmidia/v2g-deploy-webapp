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
