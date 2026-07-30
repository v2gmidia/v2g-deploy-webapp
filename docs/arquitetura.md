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
