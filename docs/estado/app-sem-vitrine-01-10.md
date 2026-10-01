# O app deixa de ter vitrine — 01/10/2026

Branch `main`, a partir de `584eb8e`. **Sem commit, sem push, sem deploy.**

A vitrine pública da V2G passa a ser só v2gmidia.com.br (repositório V2G-LP).
O app é ferramenta de quem já é cliente.

## 0. O que depende de decisão humana

1. **Trocar o `robots.ts` para `Disallow` em ~30 dias (revisar perto de
   31/10/2026).** Hoje ele está em `Allow: /` de propósito: quem bloqueia é o
   `noindex` do layout raiz, e o Google precisa voltar às páginas já indexadas
   para lê-lo. A vitrine antiga esteve no ar e indexável desde 06/08/2026. Com
   `Disallow` agora, ela poderia continuar no índice, sem trecho mas com o
   endereço. Conferir antes de trocar: `site:v2g-deploy-webapp.vercel.app` no
   Google sem resultado.
2. **O comentário de `app/globals.css:502-519` está desatualizado.** O bloco
   `[data-tema="claro"]` continua necessário, porque é ele que aplica o claro
   quando a pessoa escolhe esse tema, mas o comentário justifica o bloco pela
   landing de `app/(marketing)/`, que não existe mais. **Corrigir junto com a
   troca de tokens da identidade nova**, que vai mexer no mesmo bloco. Não foi
   corrigido aqui porque este lote não tocava em token.
3. **`v2gapp.vercel.app` continua no ar e indexável**: protótipo antigo,
   `robots.txt` 404, sem `noindex`. Está fora deste repositório; apagar ou
   redirecionar é no painel da Vercel.

## 1. O que foi feito

| Mudança | Onde |
|---|---|
| Vitrine removida | `app/(marketing)/page.tsx`, `lp.css`, `ComportamentoLP.tsx` (−1071 linhas) |
| `/` só redireciona: sem sessão → `/entrar`, com sessão → `/inicio` | `app/page.tsx` (novo) |
| `noindex, nofollow` em toda página | `app/layout.tsx`, `metadata.robots` |
| `robots.txt` com `Allow: /` (ver §0.1) | `app/robots.ts` (novo) |
| Rodapé do `/entrar` com "Conheça a V2G", "Termos de uso" e "Política de privacidade", apontando para v2gmidia.com.br | `app/(public)/entrar/page.tsx` |
| Valores do protótipo (R$ 2.646 / R$ 4.704) tirados do inventário | `docs/entrar-vs-prototipo.md` |

O que a vitrine tinha e o app deixa de publicar: preço de plano, número
ilustrativo e um rodapé com `V2G Tecnologia LTDA · CNPJ 00.000.000/0001-00`.
`git grep` por `00.000.000`, `4.704` e `2.646`: zero ocorrências.

## 2. Decisões tomadas sozinho

- **O redirecionamento mora na página, não no `proxy.ts`.** "/" continua
  fora de `PROTECTED_PREFIXES`; ela só não tem conteúdo. Mexer na lista de
  rotas protegidas era risco sem ganho.
- **O rodapé usa `.auth-foot`, que já existia**, e fica fora do condicional
  de modo: aparece no cadastro e no login. Nenhuma linha de CSS mudou.
- **Termos e privacidade são link, não cópia.** O webapp não tinha cópia
  nenhuma; o cadastro não linkava nem uma nem outra.

## 3. O que não deu certo de primeira

O primeiro `pnpm build` falhou: `.next/dev/types/validator.ts`, sobra de um
`next dev` antigo, ainda importava a página apagada, e o `tsconfig` inclui
esse caminho. Removi só `.next/dev`, que é cache de dev e está no
`.gitignore`. O `next dev` recria a pasta.

## 4. Como foi verificado

`pnpm typecheck`, `pnpm build` e `pnpm conferir` (9/9) limpos. Depois, o
build servido localmente, **só com GET** e sem sessão:

| Rota | Resposta |
|---|---|
| `/` | 307 → `/entrar` |
| `/entrar`, `/recuperar`, `/redefinir` | 200, com `noindex, nofollow` |
| `/exclusao-de-dados/<código falso>` | 200 — "Não encontramos esse pedido" |
| `/auth/confirmar`, `/auth/meta/iniciar`, `/auth/meta/callback` | 307, cada um para o seu erro ou login |
| `/auth/meta/exclusao-de-dados`, `/auth/meta/desautorizar` | 405 no GET (são POST da Meta; não foram chamados com POST) |
| `/exemplo/*` | 404 |

**Não medido:** o ramo com sessão de `/` (→ `/inicio`), porque exigiria
login real. A lógica é a da página antiga, copiada linha por linha.
