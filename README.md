# V2G Webapp

Next.js (App Router) + TypeScript + Supabase.

**O que existe hoje:** cadastro e login, recuperação de senha, onboarding
que grava a cada resposta, conta editável, e as telas de dashboard,
campanhas, criativos e avisos — todas com estado vazio como caminho
principal, porque é o que um cliente novo vê primeiro. A conexão OAuth com
o Meta vai até conectar e listar contas.

**O que ainda não existe:** publicar campanha, gerar criativo, upload de
arquivo e pagamento. Ver `docs/arquitetura.md` para o porquê de cada
decisão, e os outros documentos em `docs/` para os desenhos que ainda não
viraram código.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Supabase (Postgres + Auth), via `@supabase/ssr`
- CSS puro (sem biblioteca de UI) — tokens portados do design system do
  protótipo (`v2gapp`), fonte trocada de Bahnschrift (só Windows) para
  Archivo via `next/font`
- pnpm

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local   # preencha com os valores do seu projeto Supabase
pnpm run dev                  # http://localhost:3000
```

Variáveis necessárias em `.env.local` (nomes em `.env.example`):

| Variável | Onde pegar | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Painel Supabase → Settings → API | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Painel Supabase → Settings → API | pública, protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → Settings → API | **segredo** — nunca prefixar com `NEXT_PUBLIC_`, usada só em `lib/supabase/admin.ts` (não usada por nenhuma rota deste PR) |

## Aplicar as migrations

Todo o schema mora em `supabase/migrations/`. Nunca altere nada pelo
painel do Supabase — se precisar mudar algo, crie uma nova migration.

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push          # aplica as migrations pendentes no projeto linkado
```

Ou, para desenvolvimento 100% local (requer Docker):

```bash
npx supabase start            # sobe Postgres + Auth + Studio localmente
npx supabase db reset         # aplica as migrations do zero no banco local
```

### Migration `0001_init.sql`

Cria `profiles` e `businesses`, com RLS ligado nas duas tabelas desde o
início e policies explícitas por operação (select/insert/update/delete —
nunca `for all`). Um trigger em `auth.users` cria a linha em `profiles`
automaticamente quando um usuário se cadastra, lendo `nome`/`whatsapp` de
`raw_user_meta_data` (que é o que `signUpAction` envia via
`options.data` no `supabase.auth.signUp()`).

## O que foi verificado nesta sessão (e o que não foi)

**Verificado, com evidência reproduzível:**

- `pnpm run typecheck` (`tsc --noEmit`) — sem erros.
- `pnpm run build` — build de produção limpo, zero warnings.
- Servidor rodando localmente (`pnpm run dev`) com variáveis de ambiente
  **fictícias** (só para o processo subir, sem bater em nenhum Supabase
  real), testado com `curl`:
  - `GET /inicio` sem cookie de sessão → `307` para `/entrar?next=%2Finicio`.
  - `GET /` sem sessão → `307` para `/entrar`.
  - `GET /entrar` sem sessão → `200`, formulário renderizado.
  - `GET /inicio` **com um cookie de sessão forjado** (JWT inválido) →
    ainda `307` para `/entrar`, em ~125ms, sem travar tentando validar
    contra um host inexistente. Este era o teste que mais importava: o
    achado mais grave da auditoria do protótipo (`v2gapp`) era que toda
    tela era acessível por URL direta sem login — isso não se repete aqui.

**NÃO verificado** (faltam credenciais reais de um projeto Supabase, e
não há Docker disponível neste ambiente para rodar Supabase local):

- A migration `0001_init.sql` nunca foi aplicada contra um Postgres real.
  Foi revisada linha a linha contra o padrão oficial e amplamente
  documentado da Supabase (trigger `security definer` + RLS por
  operação), mas "revisado com cuidado" não é o mesmo que "testado".
- O fluxo de cadastro/login de ponta a ponta (criar conta de verdade,
  confirmar e-mail se exigido, logar, ver o nome vindo do banco) não foi
  exercitado contra um Supabase real — só a renderização das telas e o
  comportamento do proxy foram verificados.
- Antes de considerar este PR pronto para produção, alguém com acesso a
  um projeto Supabase real precisa: linkar o projeto, rodar
  `supabase db push`, preencher `.env.local` de verdade, e passar pelo
  fluxo de cadastro → confirmação → login → `/inicio` manualmente.

## Estrutura

Ver `docs/arquitetura.md` — inclui a árvore de pastas comentada e o
porquê de cada decisão (por que dois grupos de rotas, por que RLS
explícito por operação, por que a fonte mudou, etc.).
