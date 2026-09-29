# HANDOFF — o webapp da V2G, por inteiro

Escrito em 28/09/2026 para a passagem do Claude Code para o Codex. Tudo
aqui foi medido contra o repositório e, onde diz "medido", contra o banco
de produção (`ushccxpoxjikzqnwhgfd`). O que não foi confirmado está na §10.

As regras de trabalho estão em `AGENTS.md`, na raiz. Este documento é o
mapa; aquele é o contrato.

---

## 1. Mapa de telas

**Cliente** (grupo `(protected)`, com sidebar; sessão exigida por
`proxy.ts:27-70`):

| rota | o que faz | de onde lê |
|---|---|---|
| `/inicio` | a cadeia de etapas: o que falta, o que já foi | `lib/estado/cliente.ts` — `businesses`, `creatives`, `campaigns`, `meta_connections` + `GET /negocios/{id}/execucao` e `/consolidado` |
| `/vendas` | quanto voltou | `metrics_daily` (**0 linhas**) |
| `/anuncios` | as peças e o estado delas | `creatives` + backend |
| `/alertas` | avisos | `decisions`, `campaigns` |
| `/conta` | perfil, conexão Meta, desconectar | `profiles`, `meta_connections`, `ad_accounts` + Graph ao vivo |
| `/meu-negocio` | o perfil do negócio, campo a campo | `businesses`, `pessoas_do_negocio`, `narrativa_negocio`, `identidade_visual` |
| `/campanhas`, `/criativos` | redirecionam para `/anuncios` | — |

**Fluxo** (grupo `(fluxo)`, sem sidebar, com sessão):
`/onboarding` · `/onboarding/contas` · `/conectar` · `/conectar/escolher`
· `/verba` · `/aprovar` · `/expectativas` · `/reprovado` ·
`/sem-instagram` · `/whatsapp-business`

**Operador** (`papel === "operador"` em `app_metadata`; `proxy.ts:76`):

| rota | o que faz |
|---|---|
| `/revisar-perfil` e `/revisar-perfil/[proposta]` | revisa a proposta de perfil extraída |
| `/saude-meta` | diagnóstico da conexão |
| `/ativar-campanha` | a fila: execuções com `campanha_meta` preenchido |
| `/ativar-campanha/[execucao]` | liga e desliga a entrega — **é aqui que o dinheiro começa a sair** |

**Público:** `/` (landing), `/entrar`, `/recuperar`, `/redefinir`,
`/exclusao-de-dados/[codigo]`.

**Rotas de API:** `app/auth/confirmar`, `app/auth/meta/iniciar`,
`app/auth/meta/callback`, `app/auth/meta/desautorizar`,
`app/auth/meta/exclusao-de-dados`.

**Bancada:** `/exemplo/[tela]` e dois endpoints de apoio. **Dev-only** —
`app/exemplo/[tela]/page.tsx:87` usa `process.env.NODE_ENV !==
"production"`, e em produção a rota responde 404.

---

## 2. Autenticação, papéis e identidade

**Duas camadas, por decisão** (`docs/arquitetura.md`, Decisão 3):
`proxy.ts` (middleware) confere a sessão, e o `layout.tsx` do grupo
protegido confere de novo, independente. Uma falha das duas não abre a
porta sozinha.

**Papel de operador:** é `auth.users.raw_app_meta_data->>'papel'`, nunca
`user_metadata` — este último o próprio usuário escreve, e qualquer
cliente poderia se promover. Rotas de operador respondem **`notFound()`**,
não redirect: para quem não é operador, a rota não existe. O bloqueio é
mudo de propósito — quem cair nele vai achar que a URL está errada.

**RLS:** ligada desde a `0001`, por `owns_business(business_id)`, com
policy explícita por operação. Nunca `for all`.

**O sistema de exceções — `lib/seguranca/excecoes.ts`.** É o registro dos
arquivos que endereçam uma linha do banco com um id vindo de fora
(`params`, `searchParams`, `formData`, `cookies`, `request`). Cada entrada
declara: o arquivo, o tipo de autorização (`posse` | `papel` | `prova`), o
que entra, e **por que aquilo é seguro**.

Por que existe: quando a leitura usa o cliente ADMIN — que ignora RLS —,
o que separa o dado de um cliente do de outro é um `.eq()` escrito à mão.
Apagar aquela linha não quebra teste, typecheck nem build. `pnpm
conferir:identidade` varre o repositório, exige declaração para cada caso
novo **e acusa declaração órfã**, que é o que obriga a lista a envelhecer
junto com o código.

**Lacuna conhecida do conferidor:** a análise de contaminação cobre
`params`, `searchParams`, `formData`, `cookies` e `request` — **não cobre
parâmetro de server action**. Um id que entre por ali não é acusado.

---

## 3. Comunicação com o backend

Tudo passa por `lib/backend/cliente.ts`. Uma função só (`chamar`) para GET
e POST, e é proposital: duas irmãs copiadas divergiriam no primeiro caso
novo. `import "server-only"` na primeira linha — o `X-V2G-Token` é segredo
entre máquinas e o build quebra se o módulo entrar num bundle de cliente.

**Erro normalizado** em `lib/backend/erros.ts`, por categoria:
`indisponivel` · `rede` · `certificado` · `tempo_esgotado` ·
`nao_autorizado` · `nao_encontrado` · `conflito` · `dados_invalidos` ·
`servidor` · `resposta_ilegivel`. Cada uma com frase em português. A
resposta original vai para o log, não para a tela — **com a exceção
declarada no próprio arquivo**, para `/ativar-campanha/[execucao]`.

**Formato:** `Resultado<T>` = `{ ok: true, dados: T }` ou
`{ ok: false, categoria, mensagem, http?, detalhe? }`. `detalhe` só é
preenchido quando quem chama pede `corpoDoErro: true` — hoje, uma rota só.

**Rotas consumidas** (10 funções em `lib/backend/`):

| rota | módulo |
|---|---|
| `POST /cadastro` | `cadastro.ts:118` |
| `GET /nichos` | `nichos.ts:100` |
| `GET /negocios/{id}/execucao` | `dia-seguinte.ts:74` |
| `GET /negocios/{id}/consolidado` | `dia-seguinte.ts:118` |
| `POST /execucoes/{id}/resposta-do-dono` | `dia-seguinte.ts:234` |
| `GET /perguntas-pendentes` | `dia-seguinte.ts:346` |
| `GET /execucoes-em-revisao` | `execucoes.ts:168` |
| `GET /execucoes/{id}` | `execucoes.ts:257` |
| `GET /campanhas/pre-requisitos` | `pre-requisitos.ts:97` |
| `POST /execucoes/{id}/fotos` e afins | `criativos-do-cliente.ts` |
| **`POST /campanhas/{id}/ativar`** e **`/pausar`** | `ativacao.ts:226` e `:241` |

As duas últimas são as únicas que fazem dinheiro sair.

---

## 4. Banco — o que o webapp toca

Tabelas em **inglês** (deste lado) e em **português** (do backend), no
mesmo schema `public`:

| tabela | uso no webapp |
|---|---|
| `businesses` | 36 acessos — a tabela central |
| `creatives` | 13 — peças, logo, foto de identidade |
| `meta_connections` | 10 — estado da conexão e `meta_page_id` |
| `campaigns` | 8 — **MORTA, ver abaixo** |
| `execucoes` | 7 — leitura, tabela do backend |
| `itens_da_proposta`, `decisions` | 6 cada |
| `ad_accounts` | 5 |
| `propostas_de_perfil` | 4 |
| `profiles`, `exclusoes_de_dados`, `entrevistas` | 3 cada |
| `narrativa_negocio`, `identidade_visual` | 1 cada |

### `campaigns` está morta — e ainda é lida

**Medido em 23/09 e confirmado em 28/09: zero linhas, e nenhum código de
nenhum dos dois repositórios insere nela.** Todos os 8 acessos são
`select` ou `update`; não existe um `insert` sequer. `publicarCampanha()`
(`lib/meta/publicar.ts:273`), que seria quem a alimentaria, **nunca foi
chamada por rota ou action nenhuma**.

Onde ela ainda aparece:

| arquivo:linha | o que acontece |
|---|---|
| `lib/estado/cliente.ts:355` | o `/inicio` lê os carimbos — **e por isso a fase "Publicar" está inerte** (§9) |
| `lib/campanha/pre-voo.ts:219` | lê `ad_account_id` para saber qual conta está marcada — **como a tabela é vazia, `conta.marcada` é sempre `false`** (§9, multicontas) |
| `lib/meta/publicar.ts:277,379,487,549,569,608` | a cadeia de publicação inteira, que nunca rodou |

As migrations `0024`/`0025` acrescentaram cinco colunas de carimbo a essa
tabela. Estão **aplicadas no banco** e continuam declaradas em
`supabase/objetos.ts` — mas nunca serão preenchidas pelo caminho novo,
onde quem carimba é `execucoes.aprovacoes`.

---

## 5. Variáveis de ambiente

**Só nomes. Nenhum valor aparece neste documento, e nenhum deve aparecer
em nenhum outro.** O template versionado é `.env.example`.

| NOME | função | obrigatória? | onde | segredo? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | endereço do projeto Supabase | sim | local + Vercel | não |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública, sujeita a RLS | sim | local + Vercel | não |
| `SUPABASE_SERVICE_ROLE_KEY` | ignora RLS — leitura de operador | sim | local + Vercel | **SIM** |
| `NEXT_PUBLIC_SITE_URL` | base do `redirect_uri` do OAuth | sim | local + Vercel | não |
| `V2G_BACKEND_URL` | base do `backend_v2g` | sim (para tudo que fala com o backend) | local + Vercel | não |
| `V2G_BACKEND_TOKEN` | `X-V2G-Token`, segredo de máquina | sim | local + Vercel | **SIM** |
| `META_APP_ID` | app da Meta | sim (OAuth) | local + Vercel | não |
| `META_APP_SECRET` | valida `signed_request` e troca código por token | sim (OAuth) | local + Vercel | **SIM** |
| `ANTHROPIC_API_KEY` | camada de IA | conforme a rota | local + Vercel | **SIM** |
| `OPENAI_API_KEY` | transcrição do onboarding (bancada) | não | local | **SIM** |
| `V2G_N8N_WEBHOOK_URL` | disparo do pipeline | conforme o fluxo | local + Vercel | não |
| `V2G_N8N_WEBHOOK_TOKEN` | autentica o webhook | conforme o fluxo | local + Vercel | **SIM** |
| `V2G_BUSINESS_DE_TESTE`, `V2G_PROFILE_DE_TESTE` | alvo dos conferidores de rede | não | local | não |
| `V2G_FIXTURE_INICIO`, `V2G_FIXTURE_ANALISE`, `V2G_PERGUNTA_APRESENTADA` | fixtures de desenvolvimento | não | local | não |
| `NODE_ENV` | dado pelo Next | — | — | não |

**`.gitignore` — conferido com `git check-ignore -v` em 28/09:**
`.env`, `.env.local` e `.env.development.local` **estão ignorados** (por
`.env` e `.env.*`). Só `.env.example` é rastreado, reaberto pelo `!`.
`git ls-files` não lista nenhum outro arquivo de ambiente.

---

## 6. Deploy

- **Vercel**, a partir da `main`. Push na `main` republica.
- **Domínio hoje:** `v2g-deploy-webapp.vercel.app` (respondeu 200 em
  23/09). **Domínio oficial:** `v2gmidia.com.br`, que hoje serve a
  landing de vendas (repositório `lp`), não este app.
- O `redirect_uri` registrado no painel da Meta precisa bater com
  `<NEXT_PUBLIC_SITE_URL>/auth/meta/callback`, **sem barra no fim**. É a
  falha nº 1 desse fluxo.
- `vercel` está bloqueado em `.claude/settings.json`: nenhum deploy sai
  de um agente.

---

## 7. Os 21 conferidores

`pnpm conferir` encadeia tudo por `&&` — o primeiro vermelho para a fila.

| # | conferidor | o que garante |
|---|---|---|
| 1 | `typecheck` | `tsc --noEmit` |
| 2 | `lista-branca` | o catálogo de campos bate com as listas brancas do banco |
| 3 | `estado` | a cadeia do "o que falta" e seus cortes de tempo |
| 4 | `verba` | as regras de verba e de alcance (lote QA-3) |
| 5 | `cadastro` | `montarCadastro()` contra o schema real do backend |
| 6 | `criativos` | a definição de "peça de anúncio" |
| 7 | `cascata` | nenhuma regra de CSS inerte (escrita, correta, e vencida) |
| 8 | `migrations` | o que as migrations dizem criar existe no banco |
| 9 | `nichos` | `GET /nichos` e a busca por termo |
| 10 | `dia-seguinte` | a pergunta diária e o consolidado |
| 11 | `apresentada` | a telemetria de apresentação degrada limpo |
| 12 | `signed-request` | o HMAC da Meta falha FECHADO em todos os casos |
| 13 | `identidade` | todo id de fora que endereça linha está declarado |
| 14 | `veiculacao` | "no ar" sai de uma fonte única; nenhuma tela escreve a própria frase |
| 15 | `resultado` | a camada de leitura do dashboard |
| 16 | `campanha-da-sessao` | de quem é a campanha que a tela mostra |
| 17 | `envio` | o que o cliente pode subir |
| 18 | `inicio` | a tela do Início |
| 19 | `analise` | a análise de peça |
| 20 | `portao` | onde a fixture pode ser nomeada |
| 21 | `escolha-de-campo` | a opção de campo fechado continua sendo escolha |

---

## 8. O fluxo de ativação — estado atual

**Concluído.** O operador abre `/ativar-campanha`, escolhe uma execução,
vê **de quem é** e **quanto gasta por dia** antes de o botão existir, e
liga ou desliga. A chamada vai para o `backend_v2g`, que fala com a Meta
com o token de System User da V2G.

**Testado contra a Meta real em 25/09**, com `"mock": false` e 200 nos
dois sentidos, na campanha `120251447950510234`. A trilha está em
`execucoes.aprovacoes` da execução `aed42ce7`: quatro registros —
intenção e retorno de cada sentido.

**O feedback visual está pronto** (`AcoesDaCampanha.tsx`, 28/09):

- `useActionState`, dois estados separados — não um para a seção. Fundir
  faria a resposta de pausar aparecer colada no botão de ativar
  (`conta/Identidade.tsx:53-59` registra a mesma correção).
- Os dois botões travam durante a chamada; rótulos "Ativando…" /
  "Pausando…".
- **Uma caixa por vez.** Um estado local guarda qual ação foi disparada
  por último, marcado no `onSubmit` — no mesmo instante do clique, não um
  quadro depois. Sem isso as duas caixas empilhavam e o operador lia a
  notícia velha primeiro.
- Três estados: `.form-notice`, `.form-warning`, `.form-error`. O do meio
  existe porque `completo: true` **com avisos** não é sucesso limpo.
- `mock: true` vira aviso em primeiro lugar: 200 sem ter tocado na Meta
  não pode sair verde.

**Decisões registradas no código:** o botão de pausar aparece SEMPRE,
inclusive com bloqueio e inclusive quando nossa leitura diz que já está
parada — o freio nunca depende de o resto estar em ordem. E a
reconferência que decide roda **dentro** da action, não na tela: o que a
tela mostra é informação, nunca autorização.

---

## 9. Pendências conhecidas

**1. Notificação ao cliente — a reconstruir.**
`avisarClienteQueCampanhaEstaNoAr()` foi removida em 24/09 junto com
`lib/meta/ativar.ts`, porque lia `campaigns`. O raciocínio continua
válido e está em **`git show 5edf9a7:lib/campanha/aviso.ts`**: canal é
WhatsApp; **não existe integração de envio em nenhum dos dois
repositórios** (varredura de 23/09: zero bibliotecas, zero chamadas, as
11 ocorrências de `wa.me` são links de entrada); e a decisão de registrar
a dívida em `decisions` com `status: 'pending'` em vez de um TODO que
some no log. Reescrever sobre `execucoes`, não do zero.

**2. A fase "Publicar" do `/inicio` está inerte.** `lib/estado/cliente.ts:355`
lê os quatro carimbos de `campaigns`, que nunca serão escritos. A tela
não mente — ela cai na evidência de veiculação do backend, que é o
comportamento anterior —, mas deixou de fazer o que foi construída para
fazer. **Deveria ler `execucoes.aprovacoes`**, que é onde o carimbo real
passou a viver. `lib/campanha/carimbos.ts` e os conferidores 3 e 18
acompanham essa mudança.

**3. A tela de ativação mostra o teto contratado, não o gasto real.**
O botão diz `monthly_budget ÷ 30`. Quem gasta é o `daily_budget` já
gravado no conjunto lá na Meta — a rota de ativar só muda `status`. A
tela já avisa isso por escrito, mas o número continua sendo o nosso.
Conserto honesto: ler o `daily_budget` do conjunto antes de desenhar.

**4. Multicontas — o que existe e o que falta.** Existe: `ad_accounts`
com uma linha por conta (medido: 3 contas para o negócio `a85c37a9`),
`is_active`, `status` e `min_daily_budget_cents`. Falta: **a marca de
escolha**. `lib/campanha/pre-voo.ts:219` lê qual conta está marcada de
`campaigns.ad_account_id` — tabela vazia —, então `conta.marcada` é
**sempre `false`** e o pré-voo nunca manda `id_conta_anuncio`. Medido em
15/09: a mesma rota devolveu `ok: true` sem conta e `ok: false` com uma
conta específica. Ou seja, o veredito que a tela mostra é sobre "alguma
conta", não sobre a conta certa. A marca precisa de lugar novo.

**5. Onboarding v4 está na bancada, não no produto.** `cores-da-logo.ts`
(extração de paleta no navegador, sem API) e `fala-ao-vivo.ts` (Web
Speech durante a fala + OpenAI ao terminar) vivem em
`app/exemplo/_onboarding/`. O `/onboarding` real **não importa nada de
lá** — confirmado por grep. Pendências específicas: o "segurar para
falar" não existe em nenhum dos dois, e a extração de cores devolve a
lista de propostas mas só uma cor é aproveitada adiante.

**6. `avisos` do backend aparecem só na ativação.** Outras rotas também
devolvem `avisos` e ninguém os lê.

**7. Nenhum `TODO`/`FIXME` no código.** Procurado em `app`, `lib` e
`components`: zero. Este repositório registra pendência em `docs/`, não
em comentário — quem procurar marcador não vai achar nada, e isso não
quer dizer que não há dívida.

**Riscos:** o cliente Supabase sem tipos gerados (coluna fora do `select`
vira `undefined` calado); `campaigns` ainda lida em 8 lugares, pronta
para alguém concluir que ela significa algo; e a cadeia de migrations
**não reconstrói o banco do zero** — `0009_backend_execucoes_criativos.sql`
não tem DDL, e as três tabelas que ele documenta vieram de fora
(`supabase/objetos.ts:188-215`).

---

## 10. Lacunas — o que eu não confirmei

1. **Se o histórico de `/ativar-campanha` atualiza sem reload.**
   `revalidatePath` é chamado em todas as saídas, e deveria bastar. Não
   medi com o servidor no ar e um clique — as actions falam com a Meta de
   verdade e o teste é do Victor. `router.refresh()` foi deliberadamente
   **não** acrescentado.
2. **Quais variáveis estão realmente configuradas na Vercel.** Não tenho
   acesso ao painel. A coluna "onde" da §5 é onde elas *precisam* estar,
   pelo que o código exige — não uma leitura do ambiente de produção.
3. **Se `v2gmidia.com.br` tem algum caminho apontando para este app.**
   Só confirmei que o `.vercel.app` responde.
4. **O estado da revisão da Meta** (App Review). O roteiro está em
   `docs/estado/roteiro-app-review-video.md`; se foi submetido, não sei.
5. **O `daily_budget` real dos conjuntos na Meta.** Só existe lá; nosso
   banco não guarda.
6. **Se a conta `act_2818009911919726` tem forma de pagamento ativa.**
7. **O lado n8n.** Fica fora dos dois repositórios. Pode haver nó de
   WhatsApp que eu não enxergo — o que mudaria a pendência 1.
8. **Cobertura dos conferidores 15 a 21.** Descrevi pelo cabeçalho de
   cada script; não li o corpo dos sete inteiros.
