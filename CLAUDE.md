# V2G — webapp

App do produto: SaaS que automatiza gestão de tráfego pago via IA para PMEs
brasileiras ("a Contabilizei do marketing", R$ 490/mês). Este repositório é o
**produto real**. Mockups e design system ficam em outro lugar (ver mapa abaixo).

---

## Mapa dos repositórios — leia antes de procurar arquivo

Quatro repositórios sob a org GitHub `v2gmidia`, todos clonados em
`C:\Users\victo\`:

| Pasta local | O que é | Estado |
|---|---|---|
| `v2g-deploy/webapp` | **Este repo.** Next.js + Supabase, o produto | Em construção |
| `v2g-deploy/lp` | Landing page de vendas | No ar em `v2gmidia.com.br` |
| `v2g-deploy/conteudo` | Protótipo estático de 18 telas | Congelado — só referência visual |
| `v2g_saas` | Mockups das 9 telas + design system | Referência de design |

**Se você abriu a sessão em `v2g_saas` e precisa mexer em código, você está no
repositório errado.** `v2g_saas` só tem mockups HTML. Feche e abra em
`v2g-deploy/webapp`.

---

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5.9
- Supabase (`@supabase/ssr`) — auth, Postgres, RLS ligado desde a migration 0001
- `@anthropic-ai/sdk` para a camada de IA
- pnpm 11, Node ≥ 20.9
- n8n como orquestrador do pipeline (fora do repo)
- Proteção em duas camadas: `proxy.ts` (middleware do Next 16) + verificação
  independente no `layout.tsx` do grupo protegido

**O cliente Supabase ainda não usa tipos gerados.** Isso já causou bug real
(predicado lendo coluna ausente do `select` e virando regra inerte — ver
`docs/regra-inerte.md`). Ao escrever query, confira que toda coluna lida pelo
código está no `select`.

---

## Comandos

```bash
pnpm dev                  # servidor local
pnpm build                # build de produção
pnpm typecheck            # tsc --noEmit

pnpm conferir             # SUÍTE COMPLETA — rode antes de qualquer commit
pnpm conferir:cadastro    # checagens individuais
pnpm conferir:estado
pnpm conferir:verba
pnpm conferir:criativos
pnpm conferir:cascata
pnpm conferir:migrations
pnpm conferir:lista-branca

pnpm db:migrate           # supabase db push
```

---

## Onde está escrito o quê — `docs/`

São ~45 documentos. **Não leia todos.** Escolha pelo assunto:

**Comece sempre por aqui**
- `docs/estado/indice.md` — **a lista dos documentos de estado e o que cada
  um cobre.** Comece por ele: o mais novo não substitui o mais velho, eles
  cobrem assuntos diferentes. O índice também diz quais pendências estão
  abertas em cada um.
- `docs/estado/` — o registro de cada sessão, por data.
- `docs/arquitetura.md` — as decisões estruturais e o porquê de cada uma

**Contratos e integração**
- `docs/contrato-front.md` — **documento de proposta, não de código.** A
  camada `lib/dados/` que ele desenha nunca foi construída; quem faz esse
  papel é `lib/backend/`. Vale pela §0, que registra um briefing que
  contradizia o repositório inteiro.
- `docs/backend-integracao.md` — como o app fala com o backend
- `docs/schema-consolidado.md` — o schema do banco
- `docs/disparo-pipeline.md` — o disparo do pipeline ponta a ponta
- `docs/n8n-repontamento.md` — o lado n8n

**Banco e migrations**
- `docs/migracao-banco.md`, `docs/migracao-execucoes.md`
- `docs/migration-no-repo-nao-e-migration-aplicada.md` — leia antes de assumir que uma migration rodou
- `docs/conferidor-de-migrations.md`

**Credenciais e integrações externas**
- `docs/token-vault.md`, `docs/oauth-meta.md`, `docs/smtp.md`
- `docs/superficie-do-token.md` — o `X-V2G-Token` é único, compartilhado e
  conecta com `service_role`. Onde ele vive, onde o `profile_id` nasce, e
  por que a separação entre clientes hoje é disciplina de código

**Produto e telas**
- `docs/onboarding-expandido.md`, `docs/perfil-empresa.md`, `docs/extracao-perfil.md`
- `docs/estado-do-cliente.md`, `docs/revisao-perfil-cliente.md`
- `docs/publicar-campanha.md`, `docs/tela-processando.md`, `docs/upload-identidade.md`

**Design**
- `docs/padrao-visual.md`, `docs/contraste.md`, `docs/escala-tipografica.md`
- `docs/navegacao-mobile.md`, `docs/impeccable.md`

**Defeitos conhecidos** — arquivos `docs/buraco-*.md`. Cada um descreve um
buraco mapeado e o conserto proposto. Antes de consertar algo, procure se já
existe um `buraco-` sobre isso.

**Lotes de trabalho** — arquivos `docs/lote-*.md` e `docs/qa*.md`, com o
desenho de cada lote entregue.

---

## Regras que não se quebram

**Produto**
- Zero jargão de tráfego na interface: nunca CTR/ROAS/CPM cru. Sempre "quanto
  voltou", "quantas vendas", "quanto investi".
- A palavra **"grátis" não existe no produto** — isca grátis + cobrança é o
  golpe que esse público já sofreu.
- Lima (`--lime`) nunca toca o ato de pagar.
- Caloroso sem diminutivo — nada de "perguntinhas" ou "relaxa".
- Celebração só depois de conquista real, nunca antes do pagamento.
- A porta de saída fica visível: cancelar em 2 toques.

**Código**
- Nomeie token de cor pelo **papel**, não pela cor. (`--navy` servindo de fundo
  e de texto já quebrou o tema escuro — virou `--plate`/`--plate-ink`.)
- Consertar a família, não a tela: se cinco lugares leem a mesma tabela e cada
  um decide sozinho o que aquilo significa, o conserto é extrair a definição.
- RLS com policy explícita por operação. Nunca `for all`.
- `pnpm conferir` limpo antes de commitar.

---

## Ações que exigem autorização humana explícita

Não execute sem pedir, mesmo que a tarefa pareça exigir:

- `git push`
- Aplicar migration contra banco real (`db:migrate`)
- `POST /cadastro` ou disparar o webhook do n8n
- Qualquer escrita na API da Meta
- Mexer em Easypanel, Vercel ou painel do Supabase
- Editar as páginas legais (`/privacidade`, `/termos`, `/exclusao-de-dados`)
- Gravar chave fora do `.env.local`

---

## Protocolo de handoff — como sessões trocam contexto

O objetivo é que nenhum humano precise copiar e colar texto entre sessões.

**Sessão → humano/chat.** Ao terminar um lote, escreva o resultado em
`docs/estado/<data>.md`, seguindo o formato dos arquivos que já estão lá:
o que foi feito, cada decisão tomada sozinho e o porquê, o que não deu certo,
o que ficou pela metade, e — na §0 — **o que depende de decisão humana**.

**Chat/humano → sessão.** Decisões de produto e arquitetura tomadas fora do
Claude Code entram em `docs/decisoes.md`, com data. Antes de começar qualquer
lote, leia esse arquivo: ele tem precedência sobre qualquer briefing colado no
prompt.

**Entre sessões na mesma máquina.** Sessões do Claude Code se enxergam e se
mandam mensagem direto. Se você precisa de algo que outra sessão está fazendo,
pergunte a ela em vez de esperar o humano intermediar.

**Se um briefing colado contradiz este repositório, o repositório vence.**
Diga a contradição em voz alta antes de escrever código — já aconteceu de um
briefing descrever outro backend, outro schema e outra paleta
(`docs/contrato-front.md` §0).
