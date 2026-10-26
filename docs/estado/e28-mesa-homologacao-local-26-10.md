# Mesa do gestor — homologação isolada — 26/10/2026

## 0. Próximo ato e limite

Victor autorizou implementar um bloco LOCAL após a revisão autenticada da mesa.
Rota entregue: `/supergestor/homologacao`. Não foi publicada, configurada nem
percorrida em HTTPS. Não houve migration, escrita externa ou alteração de papel.
O QA do ciclo cliente → gestor → pedido de ajuste ocorreu anteriormente; não é
prova desta rota nova. O backend QA continua sem nova prova neste bloco.

Para abrir a rota após a publicação manual, configurar o recorte no projeto QA
aprovado. Valores de identidade devem ser reconferidos no QA; não usar e-mail
como autorização. O código não contém e-mails ou IDs dos usuários/negócios reais.

## Implementação

- `lib/gestor/homologacao-qa.ts`: configuração server-side, default OFF, pin do
  projeto Vercel QA, host canônico e URL exata do banco QA. Valida UUIDs, nome
  exato e período fixado. Host/Origin, query e cookies não definem o recorte.
- `lib/gestor/carregar-homologacao.ts`: sessão `getUser`, papel em `app_metadata`
  e operador exato antes de criar admin; atribuição exata antes de ler negócio;
  exige `dados_ficticios=true`, nome exato e dono válido. Só então lê a fila
  desse negócio, até 20 peças, com erro distinto de zero.
- `app/(supergestor)/supergestor/homologacao/page.tsx`: usa o shell da mesa, CSS
  da carteira e `DadosDaConta`. Aviso permanente de dados fictícios, período,
  estado das peças e link à fila existente. Sem novas actions ou botões de
  publicação. Mantidos proxy/layout atuais e ausência de entrada no menu cliente.
- `scripts/conferir-homologacao-gestor.mjs`: renderiza a página real com
  dependências instrumentadas, fixtures sintéticas e contagem de consultas.

Preservados `montarPortfolio` e `.eq("dados_ficticios", false)` da carteira
principal. Não transformar fixture em cliente real para fazê-la aparecer.

## Configuração necessária, ainda não gravada

Todas as flags são estritamente `true`; ausência ou divergência nega a página:

- `V2G_QA_MANAGER_METRICS_REHEARSAL_ENABLED`
- `V2G_MANAGER_WORK_ENABLED`
- `V2G_MANAGER_METRICS_READ_ENABLED`

Identidade do servidor:

- `VERCEL_PROJECT_ID`: projeto QA `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- `VERCEL_PROJECT_PRODUCTION_URL`: `v2g-webapp-qa.vercel.app`.
- `NEXT_PUBLIC_SITE_URL`: `https://v2g-webapp-qa.vercel.app`.
- `NEXT_PUBLIC_SUPABASE_URL`: `https://zskpijnqgkqwxksqmzmf.supabase.co`.

Recorte server-only, sem defaults:

- `V2G_QA_MANAGER_BUSINESS_ID`
- `V2G_QA_MANAGER_OPERATOR_PROFILE_ID`
- `V2G_QA_MANAGER_BUSINESS_NAME`
- `V2G_QA_MANAGER_DESDE` e `V2G_QA_MANAGER_ATE` (`YYYY-MM-DD`, ordenados).

A fila pode ser conferida sem backend. A leitura de métricas só chama a porta
existente quando `V2G_QA_MANAGER_BACKEND_READ_VERIFIED=true` e
`V2G_BACKEND_URL=https://ia-backend-qa.5hue9s.easypanel.host`, destino observado
no checkpoint 07/08 (anteriormente 502). Esta flag é um portão de operação,
não uma verificação automática de disponibilidade: só configurar depois de
07/08 comprovar ambiente/versão/cerca de leitura/credencial exclusiva QA.
Sem aprovação, mostra indisponibilidade e não faz GET. Falha após a aprovação
usa a normalização e o DTO existentes, sem preencher valores de reserva.

## Provas locais

- 11 testes da rota: flags, ambiente errado, UUID/data/recorte inválidos,
  anônimo/cliente/agência/outro operador/user_metadata/erro de Auth, atribuição
  ausente ou errada, negócio real/nome/dono divergentes, fila exata e escapada,
  backend fechado, origem errada, query ignorada, erro de fila e estado desconhecido.
- 13 testes existentes de consumidor/porta de métricas passaram. Exercitam
  autorização, DTO ausente, zero/ausência/inconsistência e mensagens normalizadas.
- `pnpm typecheck`: passou.
- `pnpm build`: passou, rota dinâmica listada. Porta 3000 sem listener antes
  do build; nenhum servidor compartilhado foi parado ou reiniciado.
- Detector visual na página: zero achados. Isso não certifica aparência em
  navegador nem contraste efetivo; não houve captura desta rota autenticada.

## Próxima prova externa

Após publicação/configuração QA autorizadas: abrir com operador do recorte,
conferir negócio/nome/período/fila; abrir com cliente e outro operador e conferir
negação; testar leitura válida e indisponível depois da prova 07/08. O layout
pode redirecionar anônimo ao login antes do `notFound` da página. As contagens
zero dos testes referem-se às consultas desta página, não a todo o shell.

Não houve commit, push ou deploy. Etapas 05/06 completas e métricas reais
continuam NÃO COMPROVADAS por este bloco.
