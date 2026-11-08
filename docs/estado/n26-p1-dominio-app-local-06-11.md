# N26-P1 — domínio do aplicativo: bloco LOCAL de 06/11/2026

## 0. Entrega

Victor decidiu no Central: LP em `v2gmidia.com.br`; compra/aplicativo em
`app.v2gmidia.com.br`; contratação em `https://app.v2gmidia.com.br/contratar`.
Autorização nominal recebida para ajustar/testar este bloco local e parar.
O endereço Vercel antigo não é a origem produtiva aprovada.

**Implementado e testado localmente. Compra e processamento continuam OFF
por padrão.** Nenhuma flag/configuração foi gravada. Sem LP, DNS, painel,
segredos, banco remoto/inventário, migration, cobrança, envio, build, commit,
push ou deploy. Alterações concorrentes de compra, Meta e piloto preservadas.
As menções à URL candidata no checkpoint de 05/11 são históricas e foram
superadas pela decisão humana de 06/11, registrada em `docs/decisoes.md`.

## 1. Regra da Vercel e implementação

Fonte oficial consultada em 06/11:
[System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_project_production_url).
`VERCEL_PROJECT_PRODUCTION_URL` contém um domínio produtivo do projeto,
selecionando o menor domínio próprio, com fallback para `vercel.app` quando não
houver domínio próprio. Também existe em previews e não inclui protocolo.

Consequência adotada: exigir `app.v2gmidia.com.br` nessa variável e nas origens
canônicas, mantendo `VERCEL_ENV=production`, projeto e banco produtivos exatos,
HTTPS, chaves/token separados e flags explícitas. Se a variável ainda informar
o alias antigo, a configuração fecha. `VERCEL_URL` gerada não define a origem
canônica. A configuração real da Vercel NÃO foi consultada/alterada.

A variável do projeto não identifica o alias de cada requisição. Por isso este
bloco acrescentou um pequeno guard comum nas portas de compra: host exato
`app.v2gmidia.com.br`, `x-forwarded-proto=https` e Origin do próprio aplicativo
para as duas actions. GET/webhook podem omitir Origin; origem divergente é
recusada. Não usar `x-forwarded-host` como alternativa. Isso mantém o alias
Vercel antigo bloqueado nessas portas mesmo com configuração canônica correta.
Essa extensão é necessária à negação do host antigo pedida neste bloco; não
altera as rotas gerais de Auth, as permissões do comprador ou o restante do app.

Também ajustados:

- Turnstile produtivo exige lista somente com o host app. Validação HTTP real
  do adaptador continua exigindo success/hostname/action; respostas QA/LP/alias
  antigo não criam pedidos. QA conserva sua configuração e seu transporte.
- E-mail de pagamento e renovação permite app V2G ou o QA existente, recusando
  alias produtivo antigo, LP e hosts indevidos. O texto de primeiro acesso
  aponta para `https://app.v2gmidia.com.br/entrar`.
- Callback 3DS deriva da origem validada e mantém referência aleatória. A
  action continua pendente após criar a cobrança/desafio; retorno não aprova.
- Action real de primeiro cadastro ensaiada com configuração app: solicita
  confirmação em `https://app.v2gmidia.com.br/auth/confirmar`, somente quando
  houver compra elegível. Nenhum runtime de Auth foi alterado.

## 2. Arquivos e hunks deste bloco

| Arquivo | Delta específico de 06/11 |
|---|---|
| `lib/contratacao/ambiente-producao.ts` | URL decidida, host app, lista Turnstile exclusiva e validador de requisição; defaults OFF preservados |
| `lib/contratacao/email-pagamento.ts` | Troca somente da origem produtiva permitida; QA mantido |
| `lib/contratacao/provedor-compra.ts` | Expõe guard de requisição com bypass somente no ambiente QA já validado; callback usa origem canônica existente |
| `app/contratar/page.tsx` | Guard antes de Auth/banco |
| `app/contratar/pagamento/page.tsx` | Guard antes de ler pedido ou mostrar pagamento/desafio |
| `app/contratar/actions.ts` | Guard de mutação antes de Auth/pedido |
| `lib/contratacao/iniciar-pagamento.ts` | Guard de mutação antes de pedido/cartão/HTTP |
| `app/api/contratar/status/route.ts` | Guard antes de ler status |
| `lib/contratacao/webhook-pagamento.ts` | Guard produtivo após autenticação, antes de payload/banco/efeitos; Sandbox preservado |
| `scripts/test-utils/config-producao.mjs` | Configuração sintética usa app V2G; flags true apenas nas fixtures autorizadas |
| `scripts/conferir-checkout-producao.mjs` | Origem/configuração/requisição, páginas/actions/status/webhook, Turnstile, e-mail e callback 3DS |
| `scripts/conferir-email-pagamento.mjs` | Primeiro acesso/renovação no domínio app e destinos indevidos recusados |
| `scripts/conferir-primeiro-acesso-compra.mjs` | Prova do emailRedirectTo da action real e compra pendente sem cadastro |
| `docs/decisoes.md` | Entrada humana de 06/11, preservando decisões concorrentes |
| `docs/estado/indice.md` | Linha deste checkpoint |

O diff contra HEAD `cb87775` também contém o bloco de compra de 05/11 e outras
frentes. Não tratar o diff cumulativo como exclusivo desta troca de domínio.
`ambiente-producao.ts`, `provedor-compra.ts`, `webhook-pagamento.ts` e fixtures
de produção estavam sem rastreamento; revisar seu conteúdo diretamente, além
do diff dos arquivos rastreados. Nenhum SQL/manifesto foi alterado neste bloco.

## 3. Verificação executada

**119/119 testes PASS, zero falhas**, no comando dirigido:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test
  scripts/conferir-checkout-producao.mjs
  scripts/conferir-email-pagamento.mjs
  scripts/conferir-primeiro-acesso-compra.mjs
  scripts/conferir-seguranca-checkout.mjs
  scripts/conferir-documento-contratante.mjs
  scripts/conferir-assistido-asaas.mjs
  scripts/conferir-webhook-estorno-handler.mjs
  scripts/conferir-webhook-ensaio-encerrado.mjs
```

A quebra de linhas acima é apenas apresentação, não comando PowerShell para
copiar literalmente. Não repetida a suíte anterior de 195, nem SQL/banco ou
suítes de Meta/piloto. Regressões de Sandbox foram incluídas porque as portas
compartilhadas receberam guard novo. HTTP, DB e Auth são fronteiras fictícias;
carregador isolado não herda .env e proíbe rede não substituída.

Casos medidos: defaults/flags faltantes, projeto/banco/preview, host e Origin,
HTTPS, páginas reais com host indevido recusadas antes de Auth/banco, actions
sem efeitos em origem indevida, Turnstile falso, callback no novo host,
confirmação por e-mail/primeiro cadastro e regressões QA de replay/3DS.
`pnpm typecheck`: PASS. `git diff --check`: PASS (avisos de LF/CRLF apenas).

## 4. Limites e próximo ato

Não comprova DNS/certificado, domínio atribuído, cabeçalhos HTTPS da implantação,
redirects/templates de Auth remotos, habilitação de 3DS, webhook entregue,
pagamento real ou e-mail recebido. Até configurar o domínio futuramente, o
modo produtivo deve permanecer fechado. Não há redirecionamento da LP neste diff.

Próximo ato previsto: revisão independente pelo Central/05-06. Configuração e
publicação externas, reconciliação do banco e ensaio completo continuam com seus
portões próprios; só depois entra o encaminhamento futuro `/contratar` da LP.
Não há nova pergunta para Victor neste bloco já aprovado. Implementação encerrada.

## 5. Aceite independente recebido pela Central

Em 06/11, o chat 05/06 revisou o snapshot estável e executou **12/12 testes
dirigidos com sucesso**, sem encontrar defeito concreto. Conferiu a recusa do
alias antigo nas páginas/actions/status/webhook mesmo com configuração app,
callback 3DS, links de pagamento/primeiro acesso e preservação do QA/defaults.
Não editou arquivos nem repetiu a suíte completa. Os 119 testes e typecheck
da seção 3 continuam atribuídos ao 01/02. Fonte: parecer final do chat
`01a14518-055f-7de3-a904-f05147067fb4`, turno `01a1b215-b95b-7322-9d6e-3bfe65c11a87`.
Aceite exclusivamente LOCAL; não amplia as provas externas da seção 4.
