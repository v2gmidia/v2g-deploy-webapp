# Arquitetura — V2G Webapp (Next.js + Supabase)

> Este documento é escrito **antes** do código, conforme pedido. Ele existe para
> que qualquer pessoa (humana ou outro agente) entenda o porquê de cada pasta
> sem precisar ler o código primeiro.

## Contexto

Este é um repositório **novo**, separado do `v2gapp` (18 telas HTML estáticas,
sem backend — ver `docs/handoff-estado-atual-APP.md` naquele repositório para
o diagnóstico completo). O `v2gapp` é **referência de design, só leitura**:
usamos os tokens de cor/tipografia e a estrutura visual de lá, mas nenhum
arquivo é importado ou copiado diretamente sem adaptação — o HTML de lá tem
JavaScript decorativo (troca de `data-state` na mesma página) que não faz
sentido num app com rotas e sessão reais.

Escopo fechado deste PR: **cadastro → login → uma tela protegida com o nome
do usuário vindo do banco.** Nada de onboarding, campanhas, criativos ou Meta
Ads aqui — isso é dívida intencional, documentada, não esquecida.

## Decisão 1 — Dois grupos de rotas, espelhando os dois "shells" do design

O design em `v2g-desktop.css` já separava visualmente duas experiências:

- `.auth-*` — **sem sidebar, um caminho só** (quem ainda não entrou não tem
  para onde navegar). Usado nas telas de cadastro/login/pagamento do protótipo.
- `.app-shell` — **sidebar fixa**, usado nas telas do produto logado.

Isso mapeia diretamente para **route groups** do App Router:

```
app/(public)/     -> usa o layout com visual .auth-*
app/(protected)/  -> usa o layout com visual .app-shell (sidebar)
```

Route groups (`(public)`, `(protected)`) não aparecem na URL — são só uma
forma de dar layouts diferentes a conjuntos de rotas diferentes sem afetar o
caminho. A separação em pastas também deixa claro, batendo o olho, o que é
público e o que exige sessão — o que ajuda a não repetir o erro do protótipo
atual, onde toda tela é acessível por URL direta sem login nenhum.

## Decisão 2 — Onde a "camada de dados" vive

Criei `lib/supabase/` com três arquivos, cada um com uma responsabilidade e
uma fronteira de execução diferente — isso é o ponto mais sensível de
segurança do projeto (regra inegociável nº 3 do briefing), então a separação
é física (arquivos diferentes), não só por comentário:

- `lib/supabase/client.ts` — cliente de **browser**. Só a anon key (pública,
  protegida por RLS). Importado só por Client Components.
- `lib/supabase/server.ts` — cliente de **servidor** (Server Components,
  Route Handlers, Server Actions), que lê/escreve cookies de sessão via
  `next/headers`. Também só a anon key — a autorização real vem do RLS +
  do JWT do usuário logado, não de um segredo.
- `lib/supabase/admin.ts` — cliente com a **service_role key**, que ignora
  RLS. Tem `import 'server-only'` no topo (pacote da Vercel que quebra o
  build se esse arquivo for puxado para um bundle de cliente) e um
  comentário em bloco explicando por que ele existe e por que não deve ser
  usado em rotas de usuário comum. Neste PR, **nada o importa ainda** — ele
  existe pronto para o dia em que precisarmos, por exemplo, de uma rotina
  de backend que rode como admin (o worker Python mencionado no briefing,
  ou uma Route Handler de manutenção). Documentado aqui para não ser
  esquecido nem usado incorretamente quando esse dia chegar.

## Decisão 3 — Proxy (middleware) + verificação na própria página (defesa em profundidade)

O achado mais grave da auditoria do protótipo era: **qualquer tela é
acessível por URL direta, sem login**. Para não repetir isso, a proteção
existe em **duas camadas independentes**:

1. `proxy.ts` — roda antes de qualquer página, intercepta requests para
   `/inicio` (e qualquer rota futura sob `(protected)`), verifica a sessão via
   cookie e redireciona para `/entrar` se não houver. Chama-se `proxy.ts`,
   não `middleware.ts`: no Next.js 16 o antigo `middleware.ts` foi renomeado
   para `proxy.ts` (mesmo mecanismo, arquivo e export renomeados — ver
   [middleware-to-proxy](https://nextjs.org/docs/messages/middleware-to-proxy)).
   Como este projeto já nasce na v16, usei a convenção atual em vez de
   começar com um nome que o próprio framework já marca como depreciado.
2. `app/(protected)/layout.tsx` — mesmo que o proxy falhe ou seja mal
   configurado no futuro (ex.: alguém edita o matcher e esquece uma rota),
   o próprio layout Server Component verifica a sessão de novo antes de
   renderizar qualquer página protegida, e redireciona se não houver. É
   redundante de propósito — segurança não deveria depender de uma única
   linha de defesa.

Verifiquei isso manualmente com `curl` sem cookie de sessão contra `/inicio`
em produção local, confirmando o redirecionamento (ver seção de testes no
`README.md`). Não escrevi teste E2E automatizado porque o briefing pediu
explicitamente para não criar nenhum.

## Decisão 4 — Trigger de banco, não código de aplicação, para criar o profile

O briefing pede que a criação de usuário em `auth.users` crie automaticamente
a linha em `profiles`. Isso vive como **trigger de Postgres** na migration
(`handle_new_user()` + `on_auth_user_created`), não como código Next.js.
Motivo: `auth.users` é uma tabela gerenciada pelo Supabase Auth — usuários
podem ser criados por múltiplos caminhos (cadastro por e-mail/senha, e no
futuro login social, convite por admin, etc.), e só um trigger de banco
garante que a linha em `profiles` nasce sempre, não importa por qual porta
o usuário entrou. Se essa lógica vivesse só no código do formulário de
cadastro, um usuário criado por outro caminho ficaria sem `profile`.

## Decisão 5 — RLS explícito por operação, não `FOR ALL`

O briefing pediu policies separadas para select/insert/update/delete, não uma
única `FOR ALL`. Fiz isso literalmente. A razão prática, além da pedida: com
policies separadas, é possível no futuro afrouxar uma operação sem afetar as
outras (ex.: permitir que um admin veja `businesses` de todo mundo via uma
policy de `SELECT` adicional, sem tocar em insert/update/delete). Uma
`FOR ALL` obrigaria reescrever a policy inteira para qualquer ajuste fino.

## Decisão 6 — Fonte: Bahnschrift → Archivo

A auditoria já tinha identificado isso como risco: Bahnschrift é exclusiva
do Windows e não estava embutida em lugar nenhum. Troquei por **Archivo**
via `next/font/google`, que tem um caráter geométrico/condensado parecido
com Bahnschrift (ambas são grotescas de baixo contraste, boas em títulos
grandes) e é auto-hospedada pelo Next.js no build — sem chamada de rede em
runtime, sem flash de fonte errada. `--body` continua em `Segoe UI`/system
stack porque texto corrido de sistema não precisa de tratamento especial e
carregar uma segunda fonte custaria performance sem ganho perceptível — mas
adicionei `system-ui` no começo da pilha para não depender só de fontes
proprietárias da Microsoft em SOs não-Windows.

## Decisão 7 — Sem CSS-in-JS, sem Tailwind, um `globals.css` só

O briefing veta biblioteca de UI. Para não reinventar isso com uma solução
"quase-framework", mantive a abordagem do protótipo: **CSS puro com
variáveis nativas**, um arquivo (`app/globals.css`) com os tokens no
`:root` (mesmos nomes de `assets/v2g.css` do `v2gapp`) mais os componentes
extraídos. Isso também respeita a regra de não "melhorar" a paleta — os
valores hex são copiados, não reinterpretados.

## Decisão 8 — O que virou componente de `components/ui/`

Segui literalmente o critério do briefing ("só os que aparecem em 3+
telas"). Neste PR só existem 2 telas de produto (`/entrar` e `/inicio`), o
que tecnicamente tornaria esse critério impossível de cumprir olhando só
para este PR. Resolvi isso olhando para as **18 telas do protótipo**
(`v2gapp`) como referência do que *vai* se repetir, já que é o roadmap
conhecido — botão (`.cta`), badge/pill (`.pill`), e card de prova
(`.proof-card`) aparecem em praticamente todas. Extraí esses três agora,
como Server/Client Components conforme a necessidade de interatividade,
para não ter que retrabalhar o CSS-em-HTML-inline do protótipo tela por
tela no futuro. Deixei documentado abaixo quais NÃO extraí e por quê.

## Decisão 9 — Migrations pelo CLI, nunca pelo painel

`supabase/migrations/0001_init.sql` é o único lugar onde o schema nasce.
`supabase/config.toml` fixa a versão do Postgres/Studio local. O README
documenta `supabase link` + `supabase db push` como o único caminho
legítimo para aplicar em produção. Isso é regra do briefing (nº 5), e eu
não tenho, nesta sessão, um projeto Supabase real linkado (sem credenciais
fornecidas) — então a migration está escrita e validada localmente por
leitura, mas **não foi aplicada contra um banco real**. Isso está registrado
explicitamente no README e no relatório final, para não passar a falsa
impressão de que já rodou contra produção.

### O texto acima descreve uma prática que o projeto não segue mais

Escrito em 19/08/2026, e não é ajuste de redação: **é um doc dizendo uma
coisa e sete migrations fazendo outra.** Alguém lendo só a Decisão 9 daqui a
três meses aplica pelo caminho errado, ou pior, supõe que o banco está atrás
do repositório quando não está.

Da 0009 em diante nada foi aplicado por `supabase db push`. Todas foram pela
ferramenta MCP do Supabase (`apply_migration`), contra o `V2G-SITE`
(`ushccxpoxjikzqnwhgfd`) direto. A lista aplicada, lida de
`supabase_migrations.schema_migrations`, bate com os cabeçalhos dos arquivos:

```
20260818000449  backend_execucoes_criativos
20260818004950  perfil_empresa
20260818005122  perfil_empresa_rls_e_escrita
20260818130048  procedencia_generalizada
20260818130135  procedencia_fecha_execute
20260818134837  propostas_de_perfil
20260818145052  aplicar_proposta
20260819135117  identidade_do_negocio
20260819…       confirmacao_do_cliente
```

Repare que a 0010 e a 0011 entraram **em duas partes cada** — os arquivos
`0010_` e `0011_` são consolidações escritas depois, e não o que rodou. Isso
é consequência direta da prática: `apply_migration` recebe um bloco de SQL e
um nome, não um arquivo, então o arquivo do repositório passa a ser um
registro do que foi aplicado em vez de ser a coisa aplicada. Enquanto os dois
não forem a mesma coisa, o arquivo é uma cópia que pode divergir sem ninguém
notar.

**Isto está registrado como divergência, não resolvido.** As duas saídas são
excludentes e nenhuma é minha para escolher sozinho:

- **a decisão muda** — a Decisão 9 passa a dizer MCP, o README acompanha, e
  fica escrito que o arquivo numerado é o registro consolidado, com o dever
  de bater com o que rodou;
- **a prática volta** — `supabase link` + `db push`, e antes disso alguém
  concilia as sete: o banco tem nove linhas de migration e o repositório tem
  quinze arquivos numerados, com correspondência de um para dois em duas
  delas.

Enquanto não se decidir, quem for aplicar migration confere esta seção antes
da Decisão 9, e não depois.

## Decisão 10 — Toda função `security definer` revoga de `public`, `anon` **e** `authenticated`

**Escrito porque erramos.** A migration 0010 fez
`revoke all on function ... from public, anon` e parou ali. Parece completo.
Não é.

O Supabase concede `execute` **por privilégio padrão** no schema `public` a
`anon` **e** a `authenticated`. `revoke ... from public` derruba a concessão do
pseudo-papel `PUBLIC`, mas não toca nas duas concessões explícitas. Revogar de
`public, anon` deixa `authenticated` intacto — ou seja, qualquer usuário logado
podia chamar `registrar_procedencia()`, que é `security definer`, ignora RLS, e
escreve procedência em **qualquer** `business_id`. Passou por uma conferência
que perguntou "anon tem execute?" e recebeu "não".

A regra, para toda função nova:

```sql
create or replace function public.minha_funcao(...) ...
  security definer set search_path = public as $$ ... $$;

revoke all on function public.minha_funcao(...) from public, anon, authenticated;
grant execute on function public.minha_funcao(...) to service_role;
```

Três coisas que vêm junto:

- **A revogação fica coladinha na criação, na mesma migration.** `create or
  replace` preserva a ACL existente, mas uma função nova nasce com o padrão. Se
  a revogação estiver em outro arquivo, existe uma janela — e a janela pode
  durar meses.
- **A assinatura completa em ambas as linhas.** `revoke` e `grant` resolvem por
  assinatura; mudar a lista de argumentos cria uma função nova, com ACL padrão,
  e a revogação antiga passa a apontar para uma função que não existe mais **sem
  dar erro**.
- **Conferir lendo o `proacl` inteiro**, não perguntando por um papel:

  ```sql
  select p.proname, pg_get_function_identity_arguments(p.oid), p.proacl::text
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef;
  ```

  Perguntar "anon tem?" responde sobre anon. Ler a ACL responde sobre todos —
  e é a diferença entre as duas perguntas que deixou o furo passar.

**Quando um papel precisar mesmo executar**, o caminho não é reabrir o
`execute`: é a função checar dono por dentro, com `private.owns_business(...)`.
Uma função `security definer` aberta para `authenticated` é RLS desligada com
outro nome.

## Decisão 11 — A escrita de `procedencia` é garantida por convenção, não pelo banco

Registrado em 19/08/2026, durante o lote do onboarding expandido
(`docs/onboarding-expandido.md`, D5). **Não foi consertado — foi medido e
deixado explícito**, que é diferente de não ter sido visto.

`registrar_procedencia()` e `confirmar_campo_do_cliente()` são
`security definer` e só `service_role` executa. Isso parece fazer delas o
único caminho de escrita da coluna `procedencia`. Não faz:

```
information_schema.role_table_grants, tabela businesses
→ authenticated: UPDATE (nível de TABELA)
```

Com `UPDATE` no nível da tabela, o usuário logado escreve direto em
`businesses.procedencia` da própria linha, com qualquer conteúdo, sem passar
pela lista branca de origem nem pela checagem de campo existente que as
funções fazem.

**A armadilha ao consertar é a mesma do token do Meta.** Um
`revoke update (procedencia) on businesses from authenticated` é **no-op**
enquanto existir o grant de `UPDATE` no nível da tabela — foi exatamente
assim que a coluna de token de `meta_connections` ficou legível por qualquer
usuário autenticado até a migration 0003. Revogar na coluna não desfaz o que
foi concedido na tabela. O conserto real é trocar o grant de tabela por
grants de coluna explícitos, e isso alcança **toda** escrita em `businesses`
— por isso é passo próprio, e não um remendo no meio de outro lote.

E a revogação, quando vier, tem que cobrir `public`, `anon` **e**
`authenticated`. Ver a Decisão 10: conferir um e concluir sobre os dois já
abriu escrita em perfil alheio aqui.

**O impacto hoje é baixo, e vale dizer para não inflar o risco:** a RLS
confina a escrita à linha do próprio dono, e ele poderia declarar o mesmo
valor pela interface, legitimamente. O que se perde é a garantia de que toda
entrada de `procedencia` passou pela validação — e isso passa a importar no
dia em que a origem `confirmado` decidir orçamento sozinha, que é
exatamente o que o `diagnosticar-orcamento` deve fazer.

**Contraste deliberado:** `esvaziar_campos_do_cliente()` (0017) é a única
das quatro funções de procedência que é `security invoker`, e a única que
`authenticated` executa. Apagar o próprio campo é escrita que a RLS já
autoriza; com `definer` seria preciso reescrever a checagem de dono dentro
da função, que é o `if` que se esquece. **Menos poder quando o poder não é
necessário** — e é por isso que ela não contradiz a Decisão 10.

## Decisão 12 — Quem escreve o quê em `execucoes`, e o que `cliente_id` significa

Registrado em 19/08/2026, no lote do disparo do pipeline
(`docs/disparo-pipeline.md`). Existe porque `execucoes` passou a ser
escrita por **dois** lados: o backend do Gabriel (via n8n) e o webapp.
Duas mãos na mesma tabela sem regra escrita é como nascem as colunas que
metade do código preenche e a outra metade ignora.

| Coluna | Quem escreve | Quando |
|---|---|---|
| `execucoes.*` (tudo, menos abaixo) | backend / n8n | durante o pipeline |
| `execucoes.business_id` | **webapp**, `service_role` | logo após o `POST /cadastro` |
| `execucoes.cliente_id` | backend, com o valor que **mandamos** | no `POST /cadastro` |
| `businesses.*` | webapp | onboarding, perfil, `/conta` |
| `businesses.cadastro_*` | webapp | disparo (migration 0018) |

`business_id` é a **única** coluna de `execucoes` que o webapp escreve.

**E `cliente_id` não é um segundo dono.** Ele é o eco do que a gente
mandou na ida — a marca de transporte que permite reencontrar uma execução
cuja resposta se perdeu. Nenhuma consulta de produto o lê; quem lê é só a
reconciliação de `lib/pipeline/disparar.ts`, e ela existe justamente para
preencher `business_id`.

Isso **revisa** a decisão do `perfil-empresa.md` §4, que mandava o campo
morrer. O motivo da revisão, e ele não é gosto: `business_id` só pode ser
escrito depois da resposta chegar, e a resposta é exatamente o que o
timeout come. Sem marca na ida, uma execução órfã é indistinguível de uma
execução que nunca nasceu, e a retomada duplica — o que aqui custa token
de LLM e de imagem, não um objeto pausado como no `publicar.ts`.

**A consequência de leitura**, que é a parte que se esquece:
`execucoes` continua com RLS ligada e **zero políticas** — `default deny`,
só `service_role`. Não foi esquecimento; foi decidido depois da auditoria
de `docs/auditoria-resultados.md`, que achou raciocínio interno da IA
sobre o negócio do cliente, estratégia de nicho e saída de mock nas mesmas
colunas que o texto escrito para ele. Uma política de RLS libera a
**linha**; o problema é a **coluna**. Quando uma tela de cliente precisar
ler execução, ela pede `status` e `atualizado_em` por uma função de
servidor — nunca `select *`.

> **Isso deixou de ser hipótese em 20/08/2026.** A função existe:
> `lib/pipeline/execucao-do-cliente.ts`, duas colunas, `service_role`, com
> o `business_id` vindo de um `select` sob RLS. Ver a Decisão 13 abaixo e
> `docs/tela-processando.md` §4.

## Decisão 13 — Estado de pipeline não decide etapa concluída. O artefato decide.

Registrado em 20/08/2026, no lote da `/processando`
(`docs/tela-processando.md`). Vale para **qualquer** código que leia
estado de pipeline daqui para frente, não só para a etapa que a motivou.

A regra, numa frase:

> **Uma etapa do cliente está concluída quando existe o ARTEFATO dela, não
> quando um sistema nosso diz que terminou de produzi-lo.**

| a pergunta | a resposta errada | a resposta certa |
|---|---|---|
| a peça do anúncio ficou pronta? | `execucoes.status = 'estrutura_pronta'` | existe `creatives` com `uso='campanha'` e `copy` escrita |
| o anúncio está no ar? | o backend disse que publicou | `campaigns.published_at` preenchido |
| os números chegaram? | a campanha está ativa | existe linha em `metrics_daily` |

**Por que isto custou uma decisão numerada.** `estrutura_pronta` parece
significar "acabou", e significa — para o backend. O que vem depois dele é
a fila de revisão do gestor (`GET /execucoes-em-revisao`), um humano nosso,
e só então o cliente tem uma peça na mão. Se `estrutura_pronta` fechasse a
etapa, a cadeia do `estadoDoCliente()` avançaria e o `/inicio` diria "tem
peça esperando você" com o `/aprovar` vazio.

Isso é a mesma classe de defeito da §11.3 do `estado-do-cliente.md` — a
**verdade vazia**, o predicado que é verdadeiro porque o conjunto está
vazio, não porque o serviço foi prestado. Aquele caso escreveu "A sua
aprovação · Já está feito" para quem nunca aprovou nada.

**O que o estado do pipeline PODE fazer**, e é o motivo de ele ser lido:
dizer **de quem é a bola** e **se a coisa está andando** enquanto a etapa
está aberta. Ele detalha por dentro a resposta que o artefato já deu; não
dá uma segunda resposta. Uma execução em `pipeline_texto_rodando` com peça
pronta em `creatives` avança a cadeia — o artefato manda, sempre.

**O corolário que fecha o buraco de audiência:** como o status nunca
decide estado, ele nunca precisa ser confiável a ponto de justificar
abrir a tabela. Duas colunas bastam, e é por isso que a Decisão 12 se
sustenta sem exceção.

### A lição que veio junto: caso "teórico" é medição, não impressão

Registrada aqui e não numa nota de rodapé porque ela vale para todo
documento deste projeto, e porque foi cometida **no mesmo lote que produziu
a Decisão 13**, a poucas horas de distância.

> **Antes de registrar que um caso é teórico, meça se existe dado que o
> exercita. E confira em qual corpus você está medindo.**

O que aconteceu: o lote F registrou que `aguardando_fotos` "pode nunca ser
percorrido", apoiado numa inferência (`origem_criativo` é fixo em
`"gerar"`, logo a IA não pede foto) e num número — zero execuções naquele
estado. O número estava certo e era **das 5 linhas do `V2G-SITE`**.

O histórico de verdade tem 49 linhas e mora no Oregon, e lá
`aguardando_fotos` aparece **7 vezes, 14% do corpus**. O caso não é
teórico; é 1 em cada 7. E a inferência que o sustentava está refutada, não
confirmada. Ver `docs/buraco-fotos-execucao.md` §4.

**O erro não foi de raciocínio, foi de corpus.** As 5 linhas do V2G-SITE
são 4 escolhidas a dedo *por cobertura* na migração mais uma nova — uma
amostra curada, e uma amostra curada responde à pergunta para a qual foi
curada, não à sua.

As três formas que este erro toma, e todas já apareceram aqui:

| forma | como se parece | o que a desarma |
|---|---|---|
| corpus curado | "medi e deu zero" numa base que foi escolhida a dedo | perguntar **de onde vieram** as linhas antes de contar |
| corpus parcial | contar num banco quando existem dois | listar as fontes antes de agregar |
| ausência como prova | "não há linha, logo não acontece" | tabela vazia não prova ausência de evento, do mesmo jeito que log vazio não prova |

É a mesma família de `log vazio não prova ausência` e de `tela vazia não
prova ausência de dado`, que este projeto já pagou duas vezes. A diferença
é o custo: aqui o registro errado ia fazer um beco sem saída de 1-em-7
passar por curiosidade arquivada.

**A regra operacional, curta:** um documento pode dizer "não medi". Pode
dizer "medi em X e deu N". O que ele não pode fazer é transformar o
segundo no primeiro sem dizer qual era o X.

## Estrutura de pastas

```
webapp/
├── docs/
│   ├── arquitetura.md          # este arquivo
│   └── mocks.md                 # todo MOCK_* usado, e por quê
├── supabase/
│   ├── config.toml               # config do CLI (versão do Postgres local, etc.)
│   └── migrations/
│       └── 0001_init.sql          # profiles, businesses, RLS, trigger — única fonte de schema
├── proxy.ts                        # 1ª camada de proteção (o "middleware" do Next 16) — roda antes de qualquer rota
├── lib/
│   └── supabase/
│       ├── client.ts               # cliente de browser (Client Components) — só anon key
│       ├── server.ts                # cliente de servidor (Server Components/Actions) — só anon key
│       └── admin.ts                 # cliente com service_role — 'server-only', não usado ainda
├── components/
│   └── ui/
│       ├── Button.tsx               # .cta do design system — usado em cadastro, login, futuras telas
│       ├── Pill.tsx                  # .pill — usado em status (dashboard futuro, alertas futuro)
│       └── ProofCard.tsx             # .proof-card — usado na coluna de prova do fluxo de entrada
├── app/
│   ├── globals.css                  # tokens (:root) + estilos base, portados de v2g.css/v2g-desktop.css
│   ├── layout.tsx                    # RootLayout: só <html>/<body> e a fonte via next/font
│   ├── page.tsx                      # "/" — Server Component, só decide o redirect (sessão? /inicio : /entrar)
│   ├── (public)/
│   │   ├── layout.tsx                 # visual .auth-* (barra superior + coluna centralizada)
│   │   └── entrar/
│   │       ├── page.tsx                # cadastro + login (Client Component, useActionState)
│   │       └── actions.ts               # signUpAction / signInAction ("use server")
│   └── (protected)/
│       ├── layout.tsx                 # visual .app-shell (sidebar + topbar) + verificação de sessão
│       ├── actions.ts                  # signOutAction ("use server")
│       └── inicio/
│           └── page.tsx                # Server Component: busca profile, mostra "Olá, {nome}"
├── .env.example                     # só os NOMES das variáveis, nunca valores
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```

### O que NÃO existe aqui e por quê (fronteiras explícitas)

- **`app/(protected)/onboarding|campanhas|criativos/`** — fora de escopo
  deste PR, e por isso a sidebar **só mostra "Início"**, o único item que
  de fato existe. O design de referência (`v2gapp`) tem 5 itens de
  navegação, mas replicar os outros 4 como itens visuais sem link
  funcional repetiria exatamente o problema que a auditoria do protótipo
  apontou: interface prometendo algo que o sistema não entrega (lá foi
  "suas respostas ficam guardadas" sem persistência real; aqui seria um
  menu cheio de seções que levam a lugar nenhum). Prefiro uma sidebar
  visualmente incompleta, mas honesta, a uma cheia e enganosa. Os itens
  futuros entram um a um, conforme as rotas forem existindo de verdade.
- **Pasta para o worker Python** — não existe neste repositório. O
  briefing menciona "o que futuramente será chamado pelo worker Python":
  isso, quando existir, deve ser um serviço separado (fora do Next.js, que
  roda em runtime Node/Edge, não Python) — provavelmente chamando Route
  Handlers deste app como uma API, ou lendo direto do Postgres via o próprio
  Supabase. Não há código de integração para isso ainda porque não há nada
  do outro lado para integrar (ver seção 12 do relatório de auditoria do
  App: Meta Ads, geração de criativo e LLM são todos inexistentes hoje).
  Deixo aqui só a decisão de fronteira: quando o worker existir, ele deve
  falar com este app via Route Handlers documentadas (`app/api/.../route.ts`)
  ou via acesso direto ao Postgres com sua própria service_role key — nunca
  importando código deste repositório Next.js diretamente.
- **Testes automatizados, CI, analytics** — vetados explicitamente pelo
  briefing. A verificação de segurança da rota protegida foi feita
  manualmente (`curl`), documentada no README, não como suite de testes.
