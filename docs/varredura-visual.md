# Varredura visual — 14/09/2026

Somente leitura. Nenhum arquivo do repositório foi alterado além deste.

- Base: `main` em `58d335b` (árvore limpa no início da sessão).
- Comandos rodados no Git Bash a partir de `C:\Users\victo\v2g-deploy\webapp`.
- Medições de navegador feitas no painel de navegador do Claude contra
  `https://v2g-deploy-webapp.vercel.app`, **sem sessão**. Só rotas públicas
  foram abertas. Não fiz login.
- Toda contagem por `grep` conta **texto**: pega comentário, pega `var(--white)`
  quando se procura `white`. Onde isso distorce, está dito.

---

## 1. Mapa de rotas

### 1.1 Quantas

```
$ find app -name page.tsx | wc -l
26
$ for g in "(protected)" "(fluxo)" "(public)" "(marketing)"; do find "app/$g" -name page.tsx | wc -l; done
(protected): 11   (fluxo): 10   (public): 4   (marketing): 1
```

Mais 5 `route.ts` em `app/auth/` (handlers HTTP, não renderizam tela) e 1
`loading.tsx` (`/anuncios`). Não há `error.tsx` nem `not-found.tsx`:

```
$ find app -name loading.tsx -o -name error.tsx -o -name not-found.tsx
app/(protected)/anuncios/loading.tsx
```

### 1.2 Tabela

Linhas:
```
$ find app -name 'page.tsx' -o -name 'loading.tsx' -o -name 'route.ts' | sort | xargs -d '\n' wc -l
```

Sessão: lista `PROTECTED_PREFIXES` em `proxy.ts:28-68` + o layout do grupo
(`(protected)` e `(fluxo)` fazem `redirect("/entrar")` sem usuário;
`(public)` e `(marketing)` não).

Título declarado:
```
$ grep -rn "metadata\|title:\|generateMetadata\|<title" app --include=*.tsx --include=*.ts | grep -v "app_metadata\|user_metadata\|metadata_json\|raw_user"
app/(protected)/meu-negocio/page.tsx:22:export const metadata = { title: "Seu negócio — V2G" };
app/(protected)/revisar-perfil/page.tsx:37:export const metadata = { title: "Quem está esperando — V2G" };
app/(protected)/revisar-perfil/[proposta]/page.tsx:28:export const metadata = { title: "Revisar perfil — V2G" };
app/(protected)/saude-meta/page.tsx:33:export const metadata = { title: "Fila de revisão — V2G" };
app/layout.tsx:17:  title: "V2G",
```
Não há `template` no título raiz: toda rota sem `metadata` própria herda `"V2G"`.

Título real em produção:
```
$ for u in / /entrar /recuperar /redefinir /inicio /exclusao-de-dados/abc; do curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "https://v2g-deploy-webapp.vercel.app$u"; curl -sL "https://v2g-deploy-webapp.vercel.app$u" | grep -oE "<title>[^<]*</title>" | head -1; done
/ -> 200 <title>V2G</title>
/entrar -> 200 <title>V2G</title>
/recuperar -> 200 <title>V2G</title>
/redefinir -> 200 <title>V2G</title>
/inicio -> 307 https://v2g-deploy-webapp.vercel.app/entrar?next=%2Finicio  <title>V2G</title>   (é o título da /entrar)
/exclusao-de-dados/abc -> 200 <title>V2G</title>
```
Confirmado também por `document.title` no navegador nas mesmas 5 rotas públicas
(ver §5.3). **Título real das rotas com sessão: não medido** — exige login, e
não loguei. A coluna abaixo mostra o declarado no código para essas.

| URL | Arquivo | Linhas | Acesso | `<title>` |
|---|---|---:|---|---|
| `/` | `app/(marketing)/page.tsx` | 379 | pública (com sessão → `redirect("/inicio")`) | `V2G` (medido) |
| `/entrar` | `app/(public)/entrar/page.tsx` | 166 | pública | `V2G` (medido) |
| `/recuperar` | `app/(public)/recuperar/page.tsx` | 58 | pública | `V2G` (medido) |
| `/redefinir` | `app/(public)/redefinir/page.tsx` | 53 | pública | `V2G` (medido) |
| `/exclusao-de-dados/[codigo]` | `app/(public)/exclusao-de-dados/[codigo]/page.tsx` | 148 | pública | `V2G` (medido) |
| `/inicio` | `app/(protected)/inicio/page.tsx` | 1013 | sessão | `V2G` (declarado, herdado) |
| `/criativos` | `app/(protected)/criativos/page.tsx` | 113 | sessão | `V2G` (declarado, herdado) |
| `/anuncios` | `app/(protected)/anuncios/page.tsx` (+ `loading.tsx` 65) | 820 | sessão | `V2G` (declarado, herdado) |
| `/alertas` | `app/(protected)/alertas/page.tsx` | 219 | sessão | `V2G` (declarado, herdado) |
| `/conta` | `app/(protected)/conta/page.tsx` | 463 | sessão | `V2G` (declarado, herdado) |
| `/vendas` | `app/(protected)/vendas/page.tsx` | 336 | sessão (fora da barra) | `V2G` (declarado, herdado) |
| `/meu-negocio` | `app/(protected)/meu-negocio/page.tsx` | 140 | sessão (fora da barra) | `Seu negócio — V2G` (declarado) |
| `/campanhas` | `app/(protected)/campanhas/page.tsx` | 17 | sessão | — só `permanentRedirect("/anuncios")` |
| `/saude-meta` | `app/(protected)/saude-meta/page.tsx` | 536 | sessão + `papel=operador` | `Fila de revisão — V2G` (declarado) |
| `/revisar-perfil` | `app/(protected)/revisar-perfil/page.tsx` | 180 | sessão + `papel=operador` | `Quem está esperando — V2G` (declarado) |
| `/revisar-perfil/[proposta]` | `app/(protected)/revisar-perfil/[proposta]/page.tsx` | 480 | sessão + `papel=operador` | `Revisar perfil — V2G` (declarado) |
| `/onboarding` | `app/(fluxo)/onboarding/page.tsx` | 86 | sessão | `V2G` (declarado, herdado) |
| `/onboarding/contas` | `app/(fluxo)/onboarding/contas/page.tsx` | 53 | sessão | `V2G` (declarado, herdado) |
| `/expectativas` | `app/(fluxo)/expectativas/page.tsx` | 22 | sessão | `V2G` (declarado, herdado) |
| `/conectar` | `app/(fluxo)/conectar/page.tsx` | 174 | sessão | `V2G` (declarado, herdado) |
| `/conectar/escolher` | `app/(fluxo)/conectar/escolher/page.tsx` | 235 | sessão | `V2G` (declarado, herdado) |
| `/verba` | `app/(fluxo)/verba/page.tsx` | 288 | sessão | `V2G` (declarado, herdado) |
| `/aprovar` | `app/(fluxo)/aprovar/page.tsx` | 181 | sessão | `V2G` (declarado, herdado) |
| `/reprovado` | `app/(fluxo)/reprovado/page.tsx` | 170 | sessão | `V2G` (declarado, herdado) |
| `/sem-instagram` | `app/(fluxo)/sem-instagram/page.tsx` | 120 | sessão | `V2G` (declarado, herdado) |
| `/whatsapp-business` | `app/(fluxo)/whatsapp-business/page.tsx` | 145 | sessão | `V2G` (declarado, herdado) |

Handlers sem tela: `app/auth/confirmar/route.ts` (117),
`app/auth/meta/callback/route.ts` (115), `app/auth/meta/desautorizar/route.ts`
(65), `app/auth/meta/exclusao-de-dados/route.ts` (123),
`app/auth/meta/iniciar/route.ts` (85). `/auth` não está em
`PROTECTED_PREFIXES`.

Layouts:
```
$ wc -l app/layout.tsx app/\(*\)/layout.tsx app/globals.css app/\(marketing\)/lp.css
101 app/layout.tsx · 60 app/(fluxo)/layout.tsx · 239 app/(protected)/layout.tsx · 15 app/(public)/layout.tsx · 4497 app/globals.css · 598 app/(marketing)/lp.css
```

### 1.3 Onde está a landing page

**Existe em dois lugares.**

1. **Rota `/` deste repositório.** `app/(marketing)/page.tsx` (379 linhas) +
   `app/(marketing)/lp.css` (598 linhas). O comentário do arquivo diz que foi
   portada de `design/landing.html` do repositório de design. Em produção
   (`v2g-deploy-webapp.vercel.app/`) responde 200 com `<title>V2G</title>`.
2. **Repositório separado `../lp`**, site estático:
   ```
   $ ls ../lp
   README.md assets docs exclusao-de-dados.html index.html privacidade.html termos.html vercel.json
   $ wc -l lp/index.html
   448 lp/index.html
   $ curl -sL https://v2gmidia.com.br/ | grep -oE "<title>[^<]*</title>" | head -1
   <title>V2G — O gestor de tráfego que sua empresa merecia ter, sem pagar preço de agência.</title>
   ```
   Links absolutos que saem do `lp/index.html`:
   ```
   $ grep -oE "href=\"https?://[^\"]*\"" lp/index.html | sort | uniq -c
   1 href="https://api.whatsapp.com/send/?phone=5521936182176&..."
   ```
   Nenhum link absoluto para o webapp.

`docs/decisoes.md` não diz qual das duas é a canônica. A busca só achou uma
entrada, e ela trata do cartão do herói da LP:
```
$ grep -niE "landing|\blp\b|v2gmidia\.com\.br|rota \"/\"" webapp/docs/decisoes.md
484:### 2026-08-22 — Cartão do herói da LP: marcar como exemplo
490:**Registro:** commit `df19ec0` na LP, ...
```

As páginas legais `/privacidade` e `/termos` **não existem** como rota neste
repositório. Os arquivos são `lp/privacidade.html`, `lp/termos.html` e
`lp/exclusao-de-dados.html`. Aqui só existe a rota dinâmica
`/exclusao-de-dados/[codigo]`.

---

## 2. Linguagem visual que já existe

### 2.1 Onde as cores são definidas

**Sem Tailwind:**
```
$ ls tailwind.config* postcss.config*
ls: cannot access 'tailwind.config*': No such file or directory
ls: cannot access 'postcss.config*': No such file or directory
```
`package.json` não lista `tailwindcss` nas dependências (dependências:
`@anthropic-ai/sdk`, `@supabase/ssr`, `@supabase/supabase-js`, `next`,
`react`, `react-dom`, `server-only`).

**CSS custom properties, num arquivo só:**
```
$ grep -nE "^\s*(:root|html|\[data-tema|@media \(prefers-color-scheme|:root\[data-tema|html\[data-tema)" app/globals.css app/\(marketing\)/lp.css
app/globals.css:13::root {
app/globals.css:301:@media (prefers-color-scheme: dark) {
app/globals.css:302:  :root:not([data-tema="claro"]) {
app/globals.css:357::root[data-tema="escuro"] {
app/globals.css:409::root[data-tema="escuro"] { color-scheme: dark; }
app/globals.css:410::root[data-tema="claro"] { color-scheme: light; }
app/globals.css:2543:  :root { --sangria: 22px; }
app/globals.css:2550:  :root { --sangria: 18px; }
```
`lp.css` não define token próprio:
```
$ grep -nE "^\s*--[a-z0-9-]+\s*:" "app/(marketing)/lp.css"
(vazio)
```

```
$ grep -cE "^\s*--[a-z0-9-]+\s*:" app/globals.css
151
```
São 151 definições. Os tokens de cor aparecem 3 vezes cada: claro, escuro por
`prefers-color-scheme` e escuro por `data-tema`.

#### Valores dos tokens de cor (claro → escuro)

```
$ sed -n 1,300p app/globals.css | grep -vE "^\s*(\*|/\*|//)" | grep -E "^\s*--|:root|^\s*\}"
$ sed -n 300,412p app/globals.css | grep -vE "^\s*(\*|/\*)" | grep -E "^\s*--|:root|@media|\}"
```

| Token | Claro | Escuro |
|---|---|---|
| `--offwhite` | `#F1F6F7` | `#050A13` |
| `--canvas` | `var(--offwhite)` | `#050A13` |
| `--navy` | `#111E2F` | `#E9EFF8` |
| `--ink` | `#111E2F` | `#E9EFF8` |
| `--ink-soft` | `#485A6B` | `#9FB0C6` |
| `--ink-mute` | `#5A6977` | `#7D8CA1` |
| `--line` | `#D9E3E6` | `#1C2840` |
| `--surface` | `#FEFEFE` | `#0C1523` |
| `--surface-2` | `#FFFFFF` | `#111C2E` |
| `--white` | `#FFFFFF` | `#FFFFFF` |
| `--black` | `#000C08` | (não redefinido) |
| `--cobalt` | `#0743DC` | `#0239C7` |
| `--cobalt-dark` | `#0532A5` | `#1B4BE8` |
| `--cobalt-ink` | `var(--cobalt)` | `#5C88FA` |
| `--lime` | `#E8FC65` | `#D5EF25` |
| `--ice` | `#B0E9FD` | `#8FD9F5` |
| `--ice-soft` | `#E3F6FE` | `#0E2231` |
| `--good` / `--good-soft` | `#237644` / `#E2F3E8` | `#4FC57E` / `#0E2418` |
| `--warn` / `--warn-soft` | `#8D6116` / `#FAEFD8` | `#E0A63C` / `#2A1F0A` |
| `--crit` / `--crit-soft` | `#AD3E38` / `#F9E4E2` | `#E8756D` / `#2C1210` |
| `--plate` / `--plate-ink` | `#111E2F` / `#F1F6F7` | (não redefinido) |
| `--sidebar-bg` | `var(--plate)` | `#080E1A` |
| `--sidebar-ink` | `rgb(var(--plate-ink-rgb) / 0.78)` | `rgb(233 239 248 / 0.66)` |
| `--sidebar-ink-strong` | `#FFFFFF` | `#FFFFFF` |
| `--sidebar-active-bg` | `rgb(255 255 255 / 0.15)` | `#1B44E5` |
| `--sidebar-line` | `rgb(255 255 255 / 0.16)` | `rgb(233 239 248 / 0.10)` |
| `--card-ice-bg` / `-ink` | `#DCEEFB` / `var(--navy)` | `#0B1E2C` / `#E9EFF8` |
| `--card-cobalt-bg` / `-ink` | `var(--cobalt)` / `#FFFFFF` | `#0B1A38` / `#E9EFF8` |
| `--card-lime-bg` / `-ink` | `var(--lime)` / `var(--black)` | `#1B2110` / `var(--lime)` |
| `--*-rgb` (canais) | `cobalt 7 67 220`, `navy 17 30 47`, `offwhite 241 246 247`, `ice 176 233 253`, `lime 232 252 101`, `surface 254 254 254`, `white 255 255 255`, `plate-ink 241 246 247` | `cobalt 2 57 199`, `navy 210 224 240`, `offwhite 5 10 19`, `ice 143 217 245`, `lime 213 239 37`, `surface 12 21 35` |

#### Todos os valores hex, com contagem

```
$ grep -rhoiE "#[0-9a-f]{3,8}\b" app components --include=*.css --include=*.tsx --include=*.ts | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn
```

| Qtd | Valor | Qtd | Valor | Qtd | Valor | Qtd | Valor |
|---:|---|---:|---|---:|---|---:|---|
| 10 | `#ffffff` | 3 | `#0b1a38` | 2 | `#0e2231` | 1 | `#8d6116` |
| 10 | `#e9eff8` | 2 | `#e8756d` | 2 | `#0b1e2c` | 1 | `#78899a` |
| 7 | `#050a13` | 2 | `#e0a63c` | 1 | `#fefefe` | 1 | `#5a6977` |
| 5 | `#5c88fa` | 2 | `#9fb0c6` | 1 | `#faefd8` | 1 | `#485a6b` |
| 5 | `#0239c7` | 2 | `#8fd9f5` | 1 | `#f9e4e2` | 1 | `#2e9e5b` |
| 4 | `#f1f6f7` | 2 | `#7d8ca1` | 1 | `#e3f6fe` | 1 | `#2b4cce` |
| 4 | `#d5ef25` | 2 | `#6c7d95` | 1 | `#e2f3e8` | 1 | `#237644` |
| 4 | `#080e1a` | 2 | `#4fc57e` | 1 | `#dceefb` | 1 | `#100` ¹ |
| 4 | `#0743dc` | 2 | `#2c1210` | 1 | `#d9e3e6` | 1 | `#0b40da` |
| 3 | `#e8fc65` | 2 | `#2a1f0a` | 1 | `#c24a44` | 1 | `#0b1b2b` |
| 3 | `#1b44e5` | 2 | `#1c2840` | 1 | `#b97f1d` | 1 | `#0a0c00` |
| 3 | `#111e2f` | 2 | `#1b4be8` | 1 | `#b0e9fd` | 1 | `#0532a5` |
| 3 | `#0c1523` | 2 | `#1b2110` | 1 | `#ad3e38` | 1 | `#001624` |
| — | — | 2 | `#111c2e` | 1 | `#abeafd` | 1 | `#000c08` |
| — | — | 2 | `#0e2418` | — | — | — | — |

¹ Falso positivo: `app/(fluxo)/whatsapp-business/page.tsx:9` é um código de
erro da Meta dentro de comentário.

A contagem inclui hex dentro de comentário, como os valores "era #2E9E5B" ao
lado dos tokens, os de `lp.css:6-7` e o de `Marca.tsx:31`.

Por arquivo:
```
$ grep -rciE "#[0-9a-f]{3,8}\b" app components --include=*.css --include=*.tsx --include=*.ts | grep -v ':0$'
app/(fluxo)/whatsapp-business/page.tsx:1
app/(marketing)/lp.css:2        (3 ocorrências em 2 linhas — 6 e 7, ambas em comentário)
app/(protected)/conta/SeletorDeTema.tsx:8   (12 ocorrências em 8 linhas)
app/globals.css:103             (109 ocorrências)
components/ui/Marca.tsx:1       (comentário)
```
```
$ awk 'NR>412 && /#[0-9a-fA-F]{3,8}\b/ {print NR": "$0}' app/globals.css
(vazio)
```
Nenhum hex em `globals.css` depois da linha 412: todos estão nos blocos de
token ou em comentário junto deles.

Hex **em código** fora do CSS: só `app/(protected)/conta/SeletorDeTema.tsx`,
linhas 64–80, em `style={{ background: "#..." }}`. São as amostras do
seletor de tema:
```
$ grep -rnoiE "#[0-9a-f]{3,8}\b" app components --include=*.tsx --include=*.ts "app/(marketing)/lp.css"
SeletorDeTema.tsx:64 #F1F6F7 · :65 #0743DC · :67 #050A13 · :68 #D5EF25 · :76 #F1F6F7 #050A13 · :77 #0743DC #1B44E5 · :79 #FFFFFF #0C1523 · :80 #E8FC65 #D5EF25
```

#### `rgb()` e afins

```
$ grep -rhoE "rgba?\(" app components --include=*.css --include=*.tsx | sort | uniq -c
89 rgb(
 1 rgba(
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -oE "rgba?\(" "$f" | wc -l; done
globals.css: 64 · lp.css: 26
```
Mais usados:
```
$ grep -rhoiE "(rgba?|hsla?|oklch|oklab|color-mix)\([^;]*\)" app components --include=*.css --include=*.tsx | sort | uniq -c | sort -rn | head -60
6 rgb(var(--navy-rgb) / 0.06)   4 rgb(var(--white-rgb) / 0.72)   4 rgb(var(--offwhite-rgb) / 0.82)
3 rgb(var(--navy-rgb) / 0.04)   3 rgb(var(--navy-rgb) / 0.03)
2 cada: offwhite-rgb/0.66, offwhite-rgb/0.6, navy-rgb/0.6, navy-rgb/0.55, navy-rgb/0.18, navy-rgb/0.07,
        ice-rgb/0.14, cobalt-rgb/0.16, rgb(255 255 255 / 0.16), rgb(233 239 248 / 0.66), rgb(233 239 248 / 0.10)
1 cada: rgba(7, 67, 220, 0.09) e mais 42 combinações token/alfa distintas (saída truncada em 60 linhas)
```
Literais sem token: `rgb(255 255 255 / …)`, `rgb(233 239 248 / …)`,
`rgba(7, 67, 220, 0.09)` e `rgb(0 0 0 / 0.9)`. Nenhum `hsl`, `oklch` ou
`color-mix`.

**Nomes de cor CSS** (`white`, `black`, `transparent`): **não medido com
precisão**. O `grep` que rodei conta `var(--white)` como `white` e a
tentativa de separar usou `\b` no `awk`, que não é borda de palavra. O número
bruto (36 `white`, 19 `transparent`, 14 `black`, 3 `currentcolor`) **não** é
contagem de nome de cor literal.

**`style={{…}}` inline:**
```
$ grep -rhoE "style=\{\{" app components --include=*.tsx | wc -l
47
$ grep -rcE "style=\{\{" app components --include=*.tsx | grep -v ':0$' | sort -t: -k2 -rn
SeletorDeTema.tsx 8 · conta/page.tsx 5 · anuncios/loading.tsx 5 · saude-meta 3 · verba/page 3 · vendas 2 · alertas 2 · (marketing)/page 2 · reprovado 2 · conectar/page 2 · conectar/escolher/page 2 · conectar/escolher/Formulario 2 · aprovar 2 · HeroDaEtapa 1 · meu-negocio 1 · inicio 1 · anuncios/page 1 · whatsapp-business 1 · sem-instagram 1 · onboarding/Trilha 1
```
São 20 arquivos.

#### Uso de cada token

```
$ grep -rhoE "var\(--[a-z0-9-]+" app components --include=*.css --include=*.tsx | sed 's/var(//' | sort | uniq -c | sort -rn
```
| Qtd | Token | Qtd | Token | Qtd | Token | Qtd | Token |
|---:|---|---:|---|---:|---|---:|---|
| 113 | `--display` | 22 | `--white` | 9 | `--good` | 2 | `--surface-2` |
| 109 | `--fs-corpo` | 21 | `--ice-soft` | 9 | `--crit-soft` | 2 | `--sidebar-line` |
| 91 | `--line` | 21 | `--crit` | 8 | `--body` | 2 | `--sidebar-active-bg` |
| 76 | `--fs-legenda` | 17 | `--offwhite` | 7 | `--sidebar-ink-strong` | 2 | `--sangria` |
| 75 | `--ink-mute` | 15 | `--warn` | 7 | `--plate-ink` | 2 | `--fs-hero-frase` |
| 69 | `--navy` | 14 | `--white-rgb` | 7 | `--plate` | 2 | `--card-cobalt-ink` |
| 69 | `--ink-soft` | 13 | `--raio-pilula` | 7 | `--fs-bloco` | 2 | `--canvas` |
| 55 | `--cobalt` | 13 | `--raio-interno` | 5 | `--sidebar-ink` | 2 | `--auth-max` |
| 49 | `--ink` | 13 | `--cobalt-rgb` | 4 | `--px` | 2 | `--auth-card` |
| 45 | `--cobalt-ink` | 13 | `--black` | 4 | `--cobalt-dark` | 1 | `--x-rgb` (comentário) |
| 40 | `--surface` | 12 | `--offwhite-rgb` | 4 | `--barra-h` | 1 | `--sidebar-w` |
| 39 | `--fs-titulo` | 12 | `--ice-rgb` | 3 | `--plate-ink-rgb` | 1 | `--sidebar-bg` |
| 34 | `--lime` | 11 | `--warn-soft` | 3 | `--good-soft` | 1 | `--shell-max` |
| 25 | `--raio-card` | 10 | `--raio-selo` | 3 | `--fs-destaque` | 1 | `--mark-c` |
| 24 | `--navy-rgb` | 10 | `--fs-tela` | — | — | 1 | `--fs-hero-sub`, `--fs-hero-num-card`, `--fs-hero-num`, `--fs-hero-legenda`, `--fs-hero-card`, `--fs-code`, `--font-archivo`, `--card-lime-bg`, `--card-cobalt-bg` |
| 24 | `--ice` | 9 | `--raio-micro` | — | — | — | — |
| 23 | `--raio-item` | — | — | — | — | — | — |

Tokens definidos sem nenhum `var()` encontrado:
`--card-ice-bg`, `--card-ice-ink`, `--card-lime-ink`, `--surface-rgb`,
`--lime-rgb` (comparação da lista de definições com a lista de uso acima).

`lp.css` consome estes tokens:
```
$ grep -oE "var\(--[a-z0-9-]+" "app/(marketing)/lp.css" | sort | uniq -c | sort -rn
28 --display · 25 --navy · 15 --offwhite · 12 --cobalt · 11 --offwhite-rgb · 11 --lime · 10 --ice-rgb · 9 --white · 9 --ink-soft · 8 --line · 7 --ice · 4 --ink · 4 --ice-soft · 4 --black · 3 --navy-rgb · 3 --crit · 2 --ink-mute · 2 --body · 1 --x-rgb · 1 --crit-soft · 1 --cobalt-rgb · 1 --cobalt-dark
```

### 2.2 Fontes

**Carregamento** (`app/layout.tsx:2-14`): `Archivo` via `next/font/google`,
`subsets: ["latin"]`, `variable: "--font-archivo"`, `display: "swap"`,
auto-hospedada no build.
```
$ grep -n "weight" app/layout.tsx
11:  weight: ["500", "700"],
```
Nenhuma outra fonte é carregada:
```
$ grep -rnE "@import|@font-face|next/font|fonts.googleapis" app components --include=*.css --include=*.tsx
app/globals.css:120 (comentário) · app/globals.css:121 (comentário) · app/layout.tsx:2
```

**Famílias** (tokens em `globals.css`):
- `--display: var(--font-archivo), system-ui, sans-serif`
- `--body: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif`. Não é
  carregada: depende do sistema.
- Duas pilhas monoespaçadas escritas direto no CSS.

```
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -oE "font-family\s*:[^;]*" "$f" | sed -E 's/\s+/ /g' | sort | uniq -c | sort -rn; done
globals.css: 85 var(--display) · 6 var(--body) · 2 ui-monospace, "Cascadia Mono", "Consolas", monospace · 2 "Consolas", "SFMono-Regular", "Courier New", monospace · 1 inherit
lp.css:      28 var(--display) · 2 var(--body)
```
Nenhum `fontFamily` inline em TSX (`grep -rhoE "fontFamily:[^,}]*" app components --include=*.tsx` → vazio).

Medido no navegador (produção, 375px): `h1` da `/` →
`Archivo, "Archivo Fallback", system-ui, sans-serif`, peso 700; `body` da
`/entrar` → `"Segoe UI", system-ui, -apple-system, Roboto, sans-serif`.

**Pesos:**
```
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -oE "font-weight\s*:\s*[0-9a-z]+" "$f" | sed 's/ //g' | sort | uniq -c | sort -rn; done
globals.css: 41 × 700 · 20 × 600 · 7 × 500 · 2 × 400
lp.css:      15 × 700 ·  2 × 600 · 2 × 400
```
Nenhum `fontWeight` inline em TSX. O Archivo é carregado em 500 e 700.

Quantas regras usam 600 ou 400 com `--display` no mesmo bloco:
```
$ awk 'BEGIN{RS="}"} {...font-weight 600|400 ... font-family var(--display) no mesmo bloco...}' app/globals.css "app/(marketing)/lp.css"
globals.css: peso 600 blocos=20, com --display no mesmo bloco=1 · peso 400 blocos=2, com --display=0
lp.css:      peso 600 blocos=2,  com --display=0            · peso 400 blocos=2, com --display=0
```
A família herdada nos blocos sem `font-family` declarada **não foi medida**.

### 2.3 Escala de texto

Tokens (`app/globals.css`):

| Token | Valor |
|---|---|
| `--fs-legenda` | 11px |
| `--fs-corpo` | 13px |
| `--fs-titulo` | 15px |
| `--fs-bloco` | 18px |
| `--fs-tela` | 22px |
| `--fs-destaque` | 26px |
| `--fs-hero-num` | `clamp(56px, 11vw, 104px)` |
| `--fs-hero-num-card` | `clamp(52px, 16.5cqi, 104px)` |
| `--fs-hero-frase` | `clamp(26px, 3.4vw, 40px)` |
| `--fs-hero-legenda` | `clamp(15px, 1.8vw, 19px)` |
| `--fs-hero-sub` | `clamp(14px, 1.5vw, 16px)` |
| `--fs-hero-card` | `clamp(24px, 2.6vw, 34px)` |
| `--fs-code` | 0.92em |

Por arquivo:
```
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -oE "font-size\s*:[^;]*" "$f" | wc -l; grep -oE "font-size\s*:\s*[0-9.]+px" "$f" | wc -l; grep -oE "font-size\s*:\s*var\(" "$f" | wc -l; grep -oE "font-size\s*:\s*clamp" "$f" | wc -l; done
globals.css: total 252 · px literal 0  · var() 252 · clamp 0
lp.css:      total 51  · px literal 48 · var() 0   · clamp 3
```

Valores usados, por frequência (os dois arquivos juntos):
```
$ grep -rhoE "(^|[;{ \t])font-size(-[a-z]+)?\s*:\s*[^;}]*" app components --include=*.css | sed -E "s/^[;{ \t]*//; s/\s+/ /g; s/ *$//" | sort | uniq -c | sort -rn
```
109 `var(--fs-corpo)` · 75 `var(--fs-legenda)` (+1 com `!important`) · 39 `var(--fs-titulo)` · 10 `var(--fs-tela)` · 7 `var(--fs-bloco)` · 7 `14px` · 5 `12px` · 4 `19px` · 4 `17px` · 4 `14.5px` · 4 `13px` · 3 `var(--fs-destaque)` · 3 `16px` · 3 `15px` · 3 `13.5px` · 2 `var(--fs-hero-frase)` · 2 `9.5px` · 2 `16.5px` · 1 cada: `var(--fs-hero-sub)`, `var(--fs-hero-num-card)`, `var(--fs-hero-num)`, `var(--fs-hero-legenda)`, `var(--fs-hero-card)`, `var(--fs-code)`, `clamp(34px, 5.2vw, 60px)`, `clamp(28px, 4vw, 46px)`, `clamp(27px, 3.6vw, 42px)`, `62px`, `22px`, `20px`, `17.5px`, `12.5px`, `11px`, `11.5px`.

Todos os valores em px vêm do `lp.css`.
```
$ ... | sort -u | wc -l        (font-size, app/**/*.css)
35 valores distintos
```

### 2.4 Espaçamento

Contagem por **string da declaração** (um `padding: 14px 16px` conta como um
valor), `globals.css` + `lp.css`:
```
$ for p in padding margin gap; do grep -rhoE "(^|[;{ \t])$p(-[a-z]+)?\s*:\s*[^;}]*" app --include=*.css | wc -l; ... | sort -u | wc -l; done
padding: 212 declarações · 125 valores distintos
margin:  311 declarações ·  94 valores distintos
gap:     149 declarações ·  24 valores distintos
```
Não há token de espaçamento: nenhum `--espaco-*` ou `--space-*` na lista
de definições da §2.1. `--sangria` (34/22/18px) é o único token de medida
lateral.

Mais frequentes:
```
$ grep -rhoE "(^|[;{ \t])padding(-[a-z]+)?\s*:\s*[^;}]*" app components --include=*.css | sed ... | sort | uniq -c | sort -rn | head -45
```
- **padding:** 22 `0` · 7 `20px` · 7 `14px 16px` · 5 `16px 18px` · 5 `12px 14px` · 5 `11px 12px` · 4 `26px` · 4 `padding-left: 18px` · 3 `9px 15px` · 3 `34px 32px` · 3 `26px 24px` · 3 `14px` · 3 `13px 14px` · 3 `12px 13px` · 3 `padding-top: 20px` · 3 `padding-top: 12px` · e 29 valores com 2 ou 1 ocorrência só entre os 45 primeiros.
- **margin:** 46 `0` · 11 `0 0 10px` · 10 `10px 0 0` · 9 `margin-bottom: 14px` · 8 `8px 0 0` · 8 `0 0 14px` · 8 `margin-top: 14px` · 8 `margin-bottom: 8px` · 8 `margin-bottom: 6px` · 7 `margin-top: 10px` · 7 `margin-left: auto` · 7 `margin-bottom: 22px` · 6 `0 auto` · 6 `0 0 12px` · 6 `margin-top: 1px` · 5 cada: `margin-top: 6px/4px/3px/2px/22px`, `margin-bottom: 4px/3px/18px/16px`.
- **gap** (lista completa): 23 `12px` · 21 `10px` · 15 `8px` · 14 `14px` · 9 `9px` · 8 `18px` · 8 `11px` · 6 `16px` · 5 `3px` · 5 `2px` · 5 `22px` · 5 `20px` · 4 `7px` · 4 `6px` · 4 `5px` · 3 `4px` · 2 `26px` · 2 `0` · 1 cada: `8px 20px`, `52px`, `40px`, `32px`, `24px`, `13px`.

Letter-spacing e line-height, pelo mesmo comando:
- **letter-spacing:** 16 valores distintos. Mais comuns: `0.14em` (7),
  `0.1em` (5), `0.08em` (5), `0.04em` (5).
- **line-height:** 26 valores distintos. Mais comuns: `1.5` (32), `1.55` (31),
  `1.6` (22), `1.45` (14).

### 2.5 Raio, sombra, borda

Tokens de raio: `--raio-card` 12px · `--raio-item` 10px · `--raio-interno` 8px · `--raio-selo` 6px · `--raio-micro` 4px · `--raio-pilula` 999px.

```
$ grep -rhoE "(^|[;{ \t])border-radius\s*:\s*[^;}]*" app components --include=*.css | sed ... | sort | uniq -c | sort -rn
```
**border-radius** (133 declarações, 20 valores distintos): 25 `var(--raio-card)` · 23 `var(--raio-item)` · 13 `var(--raio-pilula)` · 13 `var(--raio-interno)` · 10 `var(--raio-selo)` · 9 `var(--raio-micro)` · 9 `14px` · 8 `50%` · 5 `10px` · 4 `16px` · 3 `999px` · 2 `18px` · 2 `12px` · 1 cada: `9px`, `8px`, `7px`, `6px`, `3px`, `22px`, `0`.
Somando: 93 com token e 40 com valor literal.

**box-shadow** (11 declarações, 11 valores distintos, nenhuma repetida, nenhum token):
`inset 0 0 0 1.5px currentColor` · `0 40px 80px -30px rgb(var(--navy-rgb) / 0.6)` · `0 18px 36px -16px rgb(var(--navy-rgb) / 0.6)` · `0 18px 36px -14px rgb(var(--navy-rgb) / 0.55)` · `0 10px 30px -12px rgb(var(--ice-rgb) / 0.6)` · `0 0 0 6px rgb(var(--cobalt-rgb) / 0)` · `0 0 0 3px rgb(var(--cobalt-rgb) / 0.16)` · `0 0 0 3px rgb(var(--cobalt-rgb) / 0.14)` · `0 0 0 1px rgb(var(--navy-rgb) / 0.12) inset` · `0 0 0 0 rgb(var(--cobalt-rgb) / 0.35)` · `0 -10px 24px -18px rgb(var(--navy-rgb) / 0.55)`.

```
$ grep -rhoE "(^|[;{ \t])border(-(top|bottom|left|right))?\s*:\s*[^;}]*" app --include=*.css | sed ... | sort | uniq -c | sort -rn | head -12; ... | wc -l
```
**border** (132 declarações): 43 `1.5px solid var(--line)` · 11 `none` · 11 `1px solid var(--line)` · 11 `1.5px solid var(--ice)` · 10 `border-top: 1px solid var(--line)` · 4 `border-top: 1px dashed var(--line)` · 3 `border-bottom: 1px solid var(--line)` · 2 `1.5px solid var(--crit)` · 2 `1.5px solid var(--cobalt)` · 2 `1.5px dashed var(--line)` · 2 `border-top: none` · 2 `border-left: 2px solid var(--line)`.
Espessuras de borda que aparecem: `1px`, `1.4px`, `1.5px`, `2px`.

### 2.6 Tema escuro

**Existe.** Como é implementado:
- `app/layout.tsx` lê o cookie `v2g_tema` no servidor. `"claro"` e
  `"escuro"` viram `data-tema` no `<html>`; `"sistema"` não gera atributo.
- `app/globals.css:301-302`: `@media (prefers-color-scheme: dark)` sobre
  `:root:not([data-tema="claro"])` redefine os tokens.
- `app/globals.css:357`: `:root[data-tema="escuro"]` repete as mesmas
  redefinições.
- `app/globals.css:409-410` define `color-scheme`.
- O seletor fica em `app/(protected)/conta/SeletorDeTema.tsx`, com
  `tema-actions.ts`.

**Quais rotas respeitam:**
- Pelo código, todas as 26: o `globals.css` entra pelo layout raiz
  (`app/layout.tsx:4`) e o `lp.css` usa os tokens (§2.1). Não achei rota com
  paleta própria fora dos tokens.
- Exceção: as amostras de `SeletorDeTema.tsx:64-80` são hex fixo.
- `lp.css` não referencia `data-tema` nem `prefers-color-scheme`:
  ```
  $ grep -nE "data-tema|prefers-color-scheme" "app/(marketing)/lp.css"
  (vazio)
  ```
  Ele troca de cor só porque os tokens trocam.

**Medido no navegador** (375×812, `prefers-color-scheme` emulado, sem cookie,
`data-tema` nulo), com `getComputedStyle`:

| Rota | Elemento | Claro (fundo / texto) | Escuro (fundo / texto) |
|---|---|---|---|
| `/entrar` | `body` | — | `rgb(5,10,19)` / `rgb(233,239,248)` |
| `/entrar` | `.auth-card` | — | `rgb(12,21,35)` / `rgb(233,239,248)` |
| `/entrar` | `input` | — | `rgb(12,21,35)` / `rgb(233,239,248)` |
| `/entrar` | `.cta` | — | `rgb(2,57,199)` / `rgb(255,255,255)` |
| `/` | `.lp` | `rgb(241,246,247)` / `rgb(17,30,47)` | `rgb(5,10,19)` / `rgb(233,239,248)` |
| `/` | `header.hero` | `rgb(17,30,47)` / `rgb(241,246,247)` | `rgb(233,239,248)` / `rgb(5,10,19)` |
| `/` | `.lp-nav` | `rgba(17,30,47,0.92)` | `rgba(210,224,240,0.92)` / texto `rgb(233,239,248)` |

Na `/`, a faixa do herói é escura no tema claro e **clara no tema escuro**.
O fundo vem de `var(--navy)` (`lp.css:139`) e de `rgb(var(--navy-rgb) / 0.92)`
(`lp.css:57`); os dois tokens invertem no escuro. Na captura do tema escuro, o
subtítulo "TRÁFEGO NO PILOTO" da nav aparece em tom claro sobre a nav clara.

Rotas com sessão (`(protected)`, `(fluxo)`) no escuro: **não medido no
navegador**, exige login.

---

## 3. Componentes

### 3.1 Compartilhados (`components/ui/` — não existe outra pasta de componentes)

```
$ find components -type f | sort ; wc -l components/ui/*.tsx
$ for c in $(ls components/ui | sed 's/\.tsx$//'); do grep -rlE "from \"@/components/ui/$c\"" app components --include=*.tsx | sort; done
$ grep -rnE "from \"\./|from \"\.\./" app --include=page.tsx --include=layout.tsx --include=loading.tsx   (para ligar arquivo importador → rota)
```

| Componente | Arquivo | Linhas | Arquivos que importam | Rotas |
|---|---|---:|---:|---|
| `Marca` | `components/ui/Marca.tsx` | 84 | 3 (os layouts `(fluxo)`, `(protected)`, `(public)`) | 25 `page.tsx` sob esses layouts (uma delas, `/campanhas`, só redireciona). **Não** é usado na `/`. |
| `NavItem` | `components/ui/NavItem.tsx` | 36 | 1 (`(protected)/layout.tsx`) | 11 `page.tsx` do grupo `(protected)` |
| `Saudacao` / `DataDeHoje` | `components/ui/Saudacao.tsx` | 65 | 1 (`(protected)/layout.tsx`) | 11 `page.tsx` do grupo `(protected)` |
| `Button` | `components/ui/Button.tsx` | 17 | 7 | 5: `/entrar`, `/recuperar`, `/redefinir`, `/conta` (3 arquivos), `/conectar/escolher` |
| `FaixaReconectar` | `components/ui/FaixaReconectar.tsx` | 67 | 3 | 3: `/inicio`, `/anuncios`, `/vendas` |
| `ProofCard` | `components/ui/ProofCard.tsx` | 19 | 3 | 3: `/entrar`, `/recuperar`, `/redefinir` |
| `PixelMark` | `components/ui/PixelMark.tsx` | 40 | 2 (`onboarding/Trilha.tsx`, `alertas/page.tsx`) | 3: `/onboarding`, `/onboarding/contas`, `/alertas` |
| `Bubble` | `components/ui/Bubble.tsx` | 17 | 2 | 2: `/onboarding`, `/expectativas` |
| `HeroDaEtapa` | `components/ui/HeroDaEtapa.tsx` | 36 | 2 | 2: `/inicio`, `/anuncios` |
| `NumeroQueConta` | `components/ui/NumeroQueConta.tsx` | 76 | 2 | 2: `/inicio`, `/vendas` |
| `Pill` | `components/ui/Pill.tsx` | 48 | 1 | 1: `/anuncios` |
| `SeletorDeNicho` | `components/ui/SeletorDeNicho.tsx` | 262 | 1 (`onboarding/Chat.tsx`) | 1: `/onboarding` |

Total: `767` linhas (`wc -l components/ui/*.tsx`).

Não existe componente de campo, card, cabeçalho de página, estado vazio,
carregamento ou aviso em `components/ui/`: a lista acima é a pasta inteira.

### 3.2 Inventário de duplicação — padrões escritos à mão em 2+ telas

Todos os números saem de `grep` sobre `className` em `app/` e `components/`.
O CSS de cada classe é compartilhado em `globals.css`; o que se repete em cada
arquivo é o **markup**.

**Botão**
```
$ grep -rcE "<Button\b" app --include=*.tsx | grep -v ':0$'
9 usos do componente em 7 arquivos
$ grep -rcE "<button\b" app --include=*.tsx | grep -v ':0$'
59 <button> crus em 16 arquivos: onboarding/contas/Contas 11 · meu-negocio/Campo 9 · revisar-perfil/[proposta] 7 · inicio/PerguntaDoDia 6 · expectativas/Combinados 5 · onboarding/Chat 4 · conta/page 3 · criativos/Analisar 3 · aprovar 2 · conta/Identidade 2 · entrar 2 · verba/FormVerba 1 · verba/page 1 · conta/SeletorDeTema 1 · criativos/CriarPeca 1 · (protected)/layout 1
$ grep -rlE "className=[^>]*\b(cta)\b" app components --include=*.tsx | sort
25 arquivos com a classe `cta` escrita direto (inclui Button.tsx, FaixaReconectar.tsx, HeroDaEtapa.tsx)
$ grep -rlE "className=[^>]*\b(btn-linha)\b" app components --include=*.tsx
3 arquivos: conta/Identidade.tsx, meu-negocio/Campo.tsx, revisar-perfil/[proposta]/page.tsx
```
A `/` tem um sistema de botão separado: `.btn`, `.btn-light`, `.btn-lg`,
`.btn-nav`, `.btn-primary` em `lp.css` (a partir da linha 100).

**Card**
```
$ grep -rlE "className=[^>]*\b(card)\b" app components --include=*.tsx | sort
29 arquivos
$ for cls in auth-card ...; do grep -rlE "className=[\"{\`][^\"]*\b$cls[a-z-]*\b" app components --include=*.tsx | wc -l; done
auth-card: 14 arquivos
```
`ProofCard` (componente) é usado em 3.

**Campo de formulário**
```
$ grep -rcE "<(input|textarea|select)\b" app components --include=*.tsx | grep -v ':0$'
72 elementos em 16 arquivos: revisar-perfil/[proposta] 23 · meu-negocio/Campo 9 · entrar 8 · conectar/escolher/Formulario 6 · conta/Identidade 6 · conta/Formularios 4 · onboarding/Chat 2 · onboarding/contas/Contas 2 · conta/TrocarPagina 2 · inicio/PerguntaDoDia 2 · redefinir/Form 2 · SeletorDeNicho 2 · verba/FormVerba 1 · criativos/Analisar 1 · criativos/CriarPeca 1 · recuperar 1
$ grep -rlE "className=[^>]*\b(field)\b" app components --include=*.tsx
9 arquivos com `.field`: onboarding/Chat, onboarding/contas/Contas, verba/FormVerba, conta/Formularios, inicio/PerguntaDoDia, entrar, recuperar, redefinir/Form, SeletorDeNicho
```
`meu-negocio/Campo.tsx` e `revisar-perfil/[proposta]/page.tsx` têm campos e não
usam `.field` (a classe `fallback-field` aparece 8 vezes na contagem geral de
classes).

**Cabeçalho de tela**: quatro famílias.
```
$ grep -rlE "className=[^>]*\b(page-head)\b" app components --include=*.tsx | sort
15 arquivos: aprovar, reprovado, sem-instagram, verba, whatsapp-business, alertas, anuncios/loading, anuncios, conta, criativos, meu-negocio, revisar-perfil/[proposta], revisar-perfil, saude-meta, vendas
$ grep -rlE "className=[^>]*\b(auth-h)\b" app components --include=*.tsx | sort
10 arquivos: conectar/escolher, conectar, expectativas/Combinados, onboarding/Chat, onboarding/contas/Contas, onboarding/contas/page, onboarding/page, entrar, recuperar, redefinir
$ grep -rlE "className=[^>]*\b(section-title)\b" app components --include=*.tsx | sort
16 arquivos
$ grep -rlE "className=[^>]*\b(eyebrow)\b" app components --include=*.tsx | sort
18 arquivos
```
`/inicio` não usa `page-head` e usa `HeroDaEtapa`. Em `(fluxo)`, cinco telas
usam `page-head` e cinco usam `auth-h`.

**Estado vazio**
```
$ grep -rlE "className=[^>]*\b(empty-[a-z]+|casa-vazio[a-z-]*|[a-z-]*-vazio)\b" app components --include=*.tsx | sort
8 arquivos: verba/FormVerba, verba/page, alertas, anuncios, conta/Identidade, criativos/MinhasPecas, revisar-perfil/page, vendas
$ grep -nE "^\.(empty-[a-z]+|casa-vazio)" app/globals.css
.empty-hero (1797) · .empty-card (1824) · .empty-ico (1834) ; .casa-vazio-ico (4389)
```

**Carregamento**
```
$ grep -rlE "pending|useFormStatus|aria-busy|Carregando|Enviando|Salvando|Analisando" app components --include=*.tsx | sort
11 arquivos: conectar/escolher/Formulario, onboarding/Chat, onboarding/contas/Contas, verba/FormVerba, anuncios/loading, conta/Formularios, conta/TrocarPagina, inicio/PerguntaDoDia, recuperar, redefinir/Form, Button.tsx (comentário)
$ for cls in skeleton carregando loading; do grep -rlE "className=[\"{\`][^\"]*\b$cls[a-z-]*\b" app components --include=*.tsx | wc -l; done
0 · 0 · 0
```
Único `loading.tsx`: `/anuncios`, com 5 `style={{}}` inline.

**Aviso de erro / sucesso**
```
$ grep -rlE "className=[^>]*\b(form-error)\b" app components --include=*.tsx | sort
11 arquivos: conectar/escolher/Formulario, conectar, onboarding/Chat, onboarding/contas/Contas, verba/FormVerba, conta/Formularios, conta/TrocarPagina, inicio/PerguntaDoDia, entrar, recuperar, redefinir/Form
$ grep -rlE "className=[^>]*\b(form-notice)\b" app components --include=*.tsx | sort
6 arquivos: conectar, onboarding/contas/Contas, verba/FormVerba, conta/Formularios, entrar, recuperar
$ grep -rnoE "className=\"[^\"]*\b(ok|sucesso|salvo|toast|feito|form-ok|notice-ok)[a-z-]*\b[^\"]*\"" app components --include=*.tsx
app/(protected)/conta/TrocarPagina.tsx:48 className="form-ok"
app/(protected)/meu-negocio/Campo.tsx:122 className="rc-ok"
$ grep -rcE "role=\"(alert|status)\"|aria-live" app components --include=*.tsx | grep -v ':0$'
13 arquivos
```
Há duas classes de sucesso diferentes (`form-ok`, `rc-ok`), uma em cada tela.

**Bloco "fale com gente"**
```
$ grep -rlE "className=[^>]*\b(support-block)\b" app components --include=*.tsx | sort
7 arquivos: alertas, anuncios, conta, inicio, meu-negocio, saude-meta, vendas
```
Mais o `.side-support` no layout, o `.topbar-help` no layout e o `.auth-help`
no layout `(fluxo)`. O mesmo link `https://wa.me/5521936182176` está escrito à
mão nos dois layouts.

**Lista de passos numerados**: markup em 3 arquivos, CSS em duplicata.
```
$ grep -rnE "Trilha\"|Amostra\"|passos\"|Combinados\"" app --include=*.tsx
app/(fluxo)/sem-instagram/page.tsx:49 <ol className="passos">
app/(fluxo)/whatsapp-business/page.tsx:70 <ol className="passos">
app/(protected)/criativos/CriarPeca.tsx:88 <ol className="casa-passos">
```
`globals.css:2318-2324` (`.passos`, `.passos > li`, `.passo-num` 30×30) e
`globals.css:4441-4447` (`.casa-passos`, `.casa-passos > li`,
`.casa-passo-num` 30×30) têm as mesmas declarações de lista, item e número
(saída do `sed -n` na §5).

**Classes mais repetidas no markup** (top 20):
```
$ grep -rhoE "className=\"[^\"]+\"" app components --include=*.tsx | sed -E 's/className="//; s/"$//' | tr ' ' '\n' | grep . | sort | uniq -c | sort -rn | head -70
40 section-title · 39 cta · 38 title · 30 eyebrow · 28 card · 26 trust · 25 reveal · 23 hint · 21 auth-card · 20 ar-text · 20 acct-row · 19 page-head · 19 auth-grid · 16 btn-linha · 14 field · 14 auth-sub · 14 auth-h · 13 wa · 12 solo · 12 form-error
```
Esse `grep` só pega `className="…"` literal; `className={…}` fica de fora.

---

## 4. O casco

**Quem desenha a barra de cinco itens:** `app/(protected)/layout.tsx`.
```
$ grep -n '<NavItem|className="sidebar"|className="side-nav"|className="app-shell"' "app/(protected)/layout.tsx"
109 <div className="app-shell"> · 110 <aside className="sidebar"> · 113 <nav className="side-nav">
154 NavItem /inicio · 157 NavItem /criativos · 160 NavItem /anuncios · 163 NavItem /alertas · 166 NavItem /conta
```
- Cada item é o componente `NavItem` (`components/ui/NavItem.tsx`), com o
  rótulo "Início", "Criativos", "Anúncios", "Avisos", "Conta".
- É **o mesmo DOM** no desktop e no celular. Acima de 900px é sidebar lateral;
  em `@media (max-width: 900px)` (`globals.css:962`) a `.sidebar` vira
  `position: fixed` embaixo, com `height: var(--barra-h)` (56px).
- Nesse modo ficam escondidos `.side-brand`, `.side-spacer`, `.side-support`,
  `.side-account` e `.nav-eyebrow`.
- O mesmo layout desenha a `.topbar` com `Saudacao`, a data e `.topbar-help`,
  que só aparece abaixo de 900px.

**Rotas que ficam fora do casco:**

| Grupo | Rotas | O que têm no lugar |
|---|---|---|
| `(fluxo)` — `app/(fluxo)/layout.tsx` | `/onboarding`, `/onboarding/contas`, `/expectativas`, `/conectar`, `/conectar/escolher`, `/verba`, `/aprovar`, `/reprovado`, `/sem-instagram`, `/whatsapp-business` (10) | `.auth-top`: `Marca` com link para `/inicio` e o link "Falar com uma pessoa" |
| `(public)` — `app/(public)/layout.tsx` | `/entrar`, `/recuperar`, `/redefinir`, `/exclusao-de-dados/[codigo]` (4) | `.auth-top`: só `Marca` com link para `/entrar` |
| `(marketing)` — sem layout de grupo | `/` (1) | nav própria `.lp-nav` dentro da página: marca, 3 âncoras (escondidas abaixo de 720px, `lp.css:95`) e "Começar agora" |

**Sem navegação nenhuma:** nenhuma rota renderizável fica sem nenhum clicável
de saída, pelo código. `(public)` é a mais magra: um link, a marca. As rotas
de `app/auth/*` não renderizam tela.

Dentro do casco, mas fora dos cinco itens: `/vendas`, `/meu-negocio`,
`/saude-meta`, `/revisar-perfil`, `/revisar-perfil/[proposta]`. `/campanhas`
redireciona para `/anuncios`.

---

## 5. Responsividade

### 5.1 Mobile-first ou desktop com breakpoint?

**Os dois, separados por região do arquivo.**
```
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -nE "^\s*@media" "$f" | grep -oE "(min|max)-width|prefers-[a-z-]+" | sort | uniq -c; grep -nE "^\s*@media[^{]*max-width" "$f" | cut -d: -f1; grep -nE "^\s*@media[^{]*min-width" "$f" | cut -d: -f1; done
app/globals.css: 17 max-width · 8 min-width · 1 prefers-color-scheme · 3 prefers-reduced-motion
  linhas max-width: 796 800 962 1060 1318 1657 1660 1979 2531 2542 2545 2549 2557 2766 2870 3048 3237
  linhas min-width: 2369 2381 3115 3513 3850 3990 4317 4493
app/(marketing)/lp.css: 3 max-width · 0 min-width · 1 prefers-reduced-motion
  linhas max-width: 95 545 551
```
Evidência de ordem:
- **Até a linha 2369 de `globals.css` só há `max-width`**, o que indica base
  desktop com redução para baixo. Isso inclui o casco: sidebar na regra base,
  barra inferior em `max-width: 900px` na linha 962.
- **Da linha 3237 em diante só há `min-width`**, e dois comentários declaram
  "Mobile primeiro":
  ```
  $ grep -nE "@media" app/globals.css
  3542: Mobile primeiro. Toda regra `@media` desta seção vem DEPOIS da regra
  3871: Mobile primeiro, e cada `@media` depois da sua regra base.
  ```
- **`lp.css` é só `max-width`:** base desktop.

Breakpoints usados:
```
$ grep -rhoE "@media[^{]*" app components --include=*.css | sed -E 's/\s+/ /g; s/ $//' | sort | uniq -c | sort -rn
7 max-width: 620px · 6 max-width: 900px · 5 min-width: 900px · 4 prefers-reduced-motion · 3 max-width: 720px · 1 cada: min-width 720px, 640px, 620px; max-width 1080px, 760px, 700px, 560px; prefers-color-scheme
```
Somam 9 valores de largura distintos: 560, 620, 640, 700, 720, 760, 900 e
1080px. Alguns aparecem nas duas direções.

### 5.2 Larguras fixas e overflow provável (código)

```
$ grep -nE "(^|[ ;{])(min-)?width\s*:\s*([3-9][0-9]{2}|[0-9]{4,})px" app/globals.css "app/(marketing)/lp.css"
(vazio — nenhuma width/min-width ≥ 300px literal)
$ grep -rnE "100vw" app components --include=*.css --include=*.tsx
(vazio)
$ grep -cE "white-space\s*:\s*nowrap" app/globals.css "app/(marketing)/lp.css"
globals.css: 3 · lp.css: 1
$ grep -nE "overflow-x" app/globals.css "app/(marketing)/lp.css"
app/globals.css:2610  overflow-x: auto;   (corpo cru do /saude-meta)
$ grep -rnoE "(width|minWidth|maxWidth):\s*[0-9]+" app components --include=*.tsx
app/(protected)/anuncios/page.tsx:379 width: 17
```
Medidas em token: `--sidebar-w` 252px, `--auth-card` 480px, `--auth-max`
1040px, `--shell-max` 1240px. Se entram como `width` ou `max-width` em cada
uso **não foi medido**.

Grades com coluna em px fixo:
```
$ grep -nE "grid-template-columns\s*:[^;]*[0-9]{3}px" app/globals.css "app/(marketing)/lp.css"
$ awk '...profundidade de chaves...' app/globals.css      (depth=1 = regra base, fora de @media)
$ grep -nE "\.(espera-row|dash-grid|empty-card)\b[^{]*\{" app/globals.css
```
| Linha | Seletor | Colunas | Base ou @media | Sobrescrita depois |
|---|---|---|---|---|
| 1294 | `.espera-row` | `minmax(160px,1fr) 88px minmax(200px,1.4fr)` (mínimo 448px + gaps) | base | 1319, dentro de `max-width: 720px` (1318) → `1fr` |
| 1689 | `.dash-grid` | `minmax(0,1fr) 340px` | base | 2532, dentro de `max-width: 1080px` (2531) → `1fr` |
| 1830 | `.empty-card` | `72px minmax(0,1fr) 300px` | base | 2534 (1080px), 2559, 3958, 3992 |
| 3852 | `.inicio-topo` / `.inicio-cols` (3858) | `minmax(0,1fr) 360px` | dentro de `min-width: 900px` (3850) | — |
| 2626 | (auto-fit) | `repeat(auto-fit, minmax(150px, 1fr))` | — | — |
| 2827 | `.id-galeria` | `repeat(auto-fill, minmax(120px, 1fr))` | — | — |

Rotas que usam `.espera-row`, `.dash-grid` ou `.empty-card`:
```
$ grep -rlE "\b(espera-row|dash-grid|empty-card)\b" app --include=*.tsx | sort
alertas, anuncios, conta, revisar-perfil/page, saude-meta, vendas
```
Overflow horizontal **renderizado** nessas rotas: **não medido**, exige sessão.

### 5.3 Medido no navegador — rotas públicas, 375×812

Script em `javascript_tool`, por rota:
- compara `document.documentElement.scrollWidth` com `clientWidth`;
- lista `a, button, input, select, textarea, summary, [role=button]` visíveis
  com largura ou altura menor que 44px (`getBoundingClientRect`);
- lista elementos cujo `right` passa da viewport.

| Rota | `clientWidth` | `scrollWidth` | Overflow | Interativos | < 44px | Quais (classe · texto · L×A) |
|---|---:|---:|---|---:|---:|---|
| `/` | 375 | 375 | não | 17 | 7 | `a.brand` "V2G TRÁFEGO NO PILOTO" 150×32 · `a.btn.btn-light.btn-nav` "Começar agora" 142×35 · `a` "Como funciona" 88×17 · `a` "Preço" 32×17 · `a` "Dúvidas" 46×17 · `a` "Entrar" 34×17 · `a` "Ver as telas" 64×17 |
| `/entrar` | 375 | 375 | não | 7 | 0 | — |
| `/recuperar` | 375 | 375 | não | 4 | 1 | `a` "← Voltar para o login" 121×17 |
| `/redefinir` | 375 | 375 | não | 2 | 1 | `a` "← Pedir novo link" 100×17 |
| `/exclusao-de-dados/x` | 375 | 375 | não | 1 | 0 | — |

Onde estão no código:
```
$ grep -nE "Como funciona|>Preço<|Dúvidas|>Entrar<|Ver as telas|Começar agora" "app/(marketing)/page.tsx"; grep -n "Entrar|Ver as telas" (Grep)
(marketing)/page.tsx:61 btn-nav "Começar agora" · :366-368 "Como funciona"/"Preço"/"Dúvidas" (rodapé; as da nav, 58-60, estão display:none < 720px) · :369 "Entrar" · :370 "Ver as telas"
$ grep -nE "Voltar para o login" "app/(public)/recuperar/page.tsx"
46
$ grep -nE "Pedir novo link" "app/(public)/redefinir/page.tsx"
34
```

Rotas com sessão (21 `page.tsx` de `(protected)` e `(fluxo)`): toque, overflow
e layout renderizado **não medidos**, porque exigem login.

O que o CSS declara, sem render:
```
$ grep -nE "min-height\s*:\s*4[4-8]px" app/globals.css "app/(marketing)/lp.css" | wc -l
15
```
São 15 declarações de `min-height` entre 44 e 48px.

Outras dimensões declaradas abaixo de 44px (`grep -nE "(min-)?height\s*:\s*([0-9]|[1-3][0-9]|4[0-3])px"`):
- A maioria são ícones e marcadores. Exemplos: `.nav-item .ico` 20px
  (1933), `.pill::before` 6px (603), `.tema-amostra i` 14px (2401).
- Com classe aplicada em elemento que pode ser clicável: `.ec-back` 30×30
  (`globals.css:1508`), usada em `app/(fluxo)/expectativas/Combinados.tsx:48`.
  Se é `<button>` e qual é a área de toque real: **não medido**.
- A barra inferior tem comentário no CSS com 75×56 por célula em 375px. Esse
  número é do comentário, **não é medição minha**.

---

## Achados que me incomodaram

1. `proxy.ts:47` diz que `/criativos` "virou `/anuncios`" e "continua existindo como redirecionamento"; `app/(protected)/criativos/page.tsx` tem 113 linhas, é item da barra e não contém `redirect`.
2. Na `/` com o aparelho em tema escuro, o herói (`lp.css:139`, `background: var(--navy)`) e a nav (`lp.css:57`) ficam claros, porque `--navy` inverte. É o mesmo tipo de token-por-cor que o `CLAUDE.md` diz já ter quebrado o escuro.
3. `app/layout.tsx:11` carrega Archivo só em 500 e 700; `globals.css` declara `font-weight: 600` em 20 blocos e `lp.css` em 2.
4. `app/globals.css:279` diz `--fs-hero-card … hoje sem uso`; `app/globals.css:2105` usa.
5. Toda rota sem `metadata` tem aba "V2G": a medição e o `grep` batem para as públicas, e o código dá o mesmo para 17 das 21 com sessão (`app/layout.tsx:17`, sem `template`).
6. `app/(protected)/conta/SeletorDeTema.tsx:64-80`: 12 hex copiados dos tokens de `globals.css`. Se um token mudar, a amostra não muda junto.
7. `app/(marketing)/page.tsx:366-370`: cinco links do rodapé da `/` com 17px de altura medidos a 375px; `app/(public)/recuperar/page.tsx:46` e `app/(public)/redefinir/page.tsx:34` também medem 17px.
8. `globals.css:2318-2324` e `globals.css:4441-4447`: a lista numerada de passos existe duas vezes com nomes diferentes (`.passos` e `.casa-passos`).
9. Duas landing pages vivas (`app/(marketing)/page.tsx` e `../lp/index.html`) com títulos diferentes, e `docs/decisoes.md` não diz qual é a canônica.
10. `app/(protected)/conta/TrocarPagina.tsx:48` usa `form-ok` e `app/(protected)/meu-negocio/Campo.tsx:122` usa `rc-ok` para o mesmo papel, a confirmação de sucesso.
