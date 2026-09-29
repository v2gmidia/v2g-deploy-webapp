# AGENTS.md — como trabalhar neste repositório

## 1. O que é

A V2G é um SaaS que cuida dos anúncios de PMEs brasileiras com IA — "a
Contabilizei do marketing", R$ 490/mês. **Este repositório é o produto
real**: as telas do cliente e as telas do operador.

Duas coisas que decidem quase tudo aqui:

- **Toda fala com a Meta passa pelo `backend_v2g`** (FastAPI, Python).
  Este repo não cria, ativa nem pausa nada na Graph API por conta.
- **O banco Supabase é COMPARTILHADO** com o backend. As tabelas em
  inglês (`businesses`, `creatives`) são deste lado; as em português
  (`execucoes`, `criativos`) são do backend. Mesmo schema `public`.

## 2. Regras invioláveis

1. **Nunca commitar, empurrar, mesclar ou fazer deploy.** O Victor
   commita à mão pelo GitHub Desktop. Push por terminal nesta máquina
   devolve 403 — a credencial é de outra conta.
2. **Trabalhe em blocos:** mapear (só leitura) → apresentar → esperar
   aprovação → implementar → **parar e relatar**. Não emende o bloco
   seguinte sem confirmação.
3. **Nunca invente dado.** Se não mediu, diga que não mediu. Separe FATO
   (com `arquivo:linha`) de INTERPRETAÇÃO. Um verde pelo motivo errado é
   pior que um vermelho.
4. **Nunca exponha segredo.** Não leia nem imprima valor de `.env*`,
   token, chave ou senha. Só o NOME da variável.
5. **Resposta crua de backend não vai para a tela.** A regra está em
   `lib/backend/erros.ts`. Existe **uma** exceção, declarada lá dentro:
   `/ativar-campanha/[execucao]` mostra o texto cru do Meta, porque é
   tela de operador e porque a frase da Meta é a única informação sobre o
   que impediu. Ampliar isso é decisão nova.
6. **Se um briefing contradiz o repositório, o repositório vence.** Diga
   a contradição em voz alta antes de escrever código.

## 3. Pegadinhas que já custaram caro

- **`pnpm build` e `pnpm dev` dividem a pasta `.next`.** Rodar o build
  com o dev no ar derruba o dev. Derrube, construa, suba de novo.
- **O cliente Supabase não usa tipos gerados.** Coluna lida e não
  incluída no `select` vira `undefined` em silêncio — ver
  `docs/regra-inerte.md`. Confira que toda coluna lida está no `select`.
- **Padrão de feedback da casa:** `useActionState` + action devolvendo
  `{ ok?, erro? }`, renderizado em `.form-notice` (sucesso),
  `.form-error` (falha) e `.form-warning` (sucesso com ressalva ou
  parcial). Exemplo: `app/(fluxo)/verba/FormVerba.tsx`. **Não existe lib
  de toast** e não há `Toaster` em layout nenhum.
- **`campaigns` é tabela MORTA.** Zero linhas, ninguém insere. Sete
  leituras ainda apontam para ela — ver `docs/HANDOFF.md` §4.
- **A bancada `/exemplo/[tela]` é dev-only** por
  `process.env.NODE_ENV !== "production" ? await import(...) : null`.
  Em produção responde 404, comprovado por build.
- **`?passo=` do onboarding é 1-based**, não 0-based.
- **Shell:** um comando por vez. Sem `cd &&`, `;` ou pipe encadeado —
  várias leituras viram um script curto.
- **Heredoc come contrabarra:** `\n` vira quebra real e bloco grande
  estoura o parser. Escreva o conteúdo em arquivo.

## 4. Comandos que existem de verdade

```bash
pnpm dev          # servidor local
pnpm build        # build de produção
pnpm typecheck    # tsc --noEmit
pnpm conferir     # a suíte — 21 conferidores encadeados por &&
pnpm db:migrate   # supabase db push — exige autorização humana
```

**NÃO EXISTE `pnpm lint`.** Não há script, não há config de ESLint, não
há a dependência. Quem procurar por ele não vai achar — e instalar um
não é consequência de nenhuma tarefa. O `next build` já reprova tipo e
import quebrados.

Fora da suíte, de propósito (dependem de rede ou não dão veredito):
`conferir:admin`, `conferir:rota-apresentada`, `diagnostico:card`,
`medir:peca`.

## 5. Mapa das pastas

| pasta | o que é |
|---|---|
| `app/(marketing)` | landing pública |
| `app/(public)` | entrar, recuperar, redefinir, exclusão de dados |
| `app/(fluxo)` | onboarding, conectar, verba, aprovar — sem sidebar |
| `app/(protected)` | o produto logado, com sidebar |
| `app/auth` | callbacks: Supabase e os quatro da Meta |
| `app/exemplo` | bancada de telas, **dev-only** |
| `lib/backend/` | o cliente do `backend_v2g` — único lugar com o token |
| `lib/meta/` | OAuth e Graph API diretos (publicação, ainda não ligada) |
| `lib/campanha/` | pré-voo e conferência antes de ativar |
| `lib/estado/` | a cadeia de etapas que o `/inicio` desenha |
| `lib/seguranca/` | o registro de exceções de identidade |
| `scripts/` | os conferidores |
| `supabase/migrations/` | as migrations deste lado |
| `docs/` | ~45 documentos. Comece por `docs/estado/indice.md` |

Rotas: ver `docs/HANDOFF.md` §1.

## 6. Travas a recriar fora do Claude Code

Hoje `.claude/settings.json` **bloqueia por configuração**, não por
disciplina:

| bloqueado | efeito |
|---|---|
| `git commit` | o agente não consegue commitar, mesmo se tentar |
| `git push` | idem |
| `git reset` | protege trabalho não commitado |
| `git rebase` | idem |
| `vercel` | nenhum deploy sai daqui |

E **pergunta antes** de qualquer outro `git`.

Ao migrar para outra ferramenta, **recrie estes cinco bloqueios**. Eles
não são preferência: são o que impede um agente de publicar sozinho um
produto que gasta dinheiro de cliente na Meta. Sem eles, a regra 2.1
vira promessa em vez de trava.

Ações que exigem autorização humana explícita, sempre:
`git push` · `pnpm db:migrate` · `POST /cadastro` ou o webhook do n8n ·
qualquer escrita na API da Meta · mexer em Easypanel, Vercel ou painel
do Supabase · editar as páginas legais · gravar chave fora do
`.env.local`.
