# Tokens de papel — a segunda camada

Criados em 14/09/2026 em `app/globals.css`, em três lugares:

- no `:root`, logo depois de `--plate-ink-rgb`, apontando para a paleta;
- no bloco `@media (prefers-color-scheme: dark)`, redefinidos pelo valor;
- no bloco `:root[data-tema="escuro"]`, redefinidos pelo valor.

```
$ grep -cE "^\s*--(fundo-pagina|fundo-superficie|fundo-topo|fundo-barra|texto-forte|texto-fraco|linha-divisoria|texto-sobre-escuro):" app/globals.css
24
```
São 8 tokens em 3 blocos.

## A tabela

| Token | Claro | Escuro | Para que serve |
|---|---|---|---|
| `--fundo-pagina` | `var(--offwhite)` → #F1F6F7 | #050A13 | fundo da página |
| `--fundo-superficie` | `var(--surface)` → #FEFEFE | #0C1523 | fundo de card, campo e botão sobre a página |
| `--fundo-topo` | `var(--offwhite)` → #F1F6F7 | #050A13 | fundo do cabeçalho das telas de app |
| `--fundo-barra` | `var(--plate)` → #111E2F | #080E1A | fundo da barra de navegação |
| `--texto-forte` | `var(--navy)` → #111E2F | #E9EFF8 | título, nome e valor |
| `--texto-fraco` | `var(--ink-soft)` → #485A6B | #9FB0C6 | legenda, data e explicação |
| `--linha-divisoria` | `var(--line)` → #D9E3E6 | #1C2840 | borda e linha entre regiões |
| `--texto-sobre-escuro` | `var(--white)` → #FFFFFF | #FFFFFF | texto e ícone sobre fundo escuro |

No escuro o valor é escrito direto, sem passar pelo nome da paleta. Os
valores escuros são os mesmos que os tokens de paleta correspondentes já
tinham nesses blocos.

## Famílias de fonte

| Token | Valor | Para que serve |
|---|---|---|
| `--display` | `var(--font-archivo), system-ui, sans-serif` | Archivo, a fonte da marca. Títulos, e desde o lote 2a todos os controles: `button`, os `input` de texto, `select` e `textarea`. |
| `--body` | `"Segoe UI", system-ui, -apple-system, Roboto, sans-serif` | pilha de sistema, usada no texto corrido; controles usam --display (Archivo). Divisão provisória, pendente do lote de tipografia. |

O que já foi medido sobre `--body` está em `docs/tipografia-pendente.md`.

## Quem lê cada papel hoje

Só o casco de `app/(protected)/layout.tsx`, ou seja, as regras CSS do topo e
da barra de navegação. O `layout.tsx` não usa token direto; quem usa são as
regras de `globals.css` que desenham os elementos dele. **As telas continuam
na paleta.**

```
$ grep -oE "var\(--(fundo-pagina|fundo-superficie|fundo-topo|fundo-barra|texto-forte|texto-fraco|linha-divisoria|texto-sobre-escuro)\)" app/globals.css | sort | uniq -c
      1 var(--fundo-barra)
      1 var(--fundo-superficie)
      2 var(--linha-divisoria)
      3 var(--texto-forte)
      2 var(--texto-fraco)
      7 var(--texto-sobre-escuro)
```
`--fundo-pagina` e `--fundo-topo` não aparecem na saída porque não têm
leitor. O `.topbar` não declara fundo, e o que aparece atrás dele é o fundo
da página.

| Token | Regra que lê | Antes lia |
|---|---|---|
| `--fundo-barra` | `.sidebar` (background) | `--sidebar-bg` |
| `--texto-sobre-escuro` | `.nav-item:hover`, `.nav-item.active`, `.side-account .avatar`, `.side-account .who b`, `.side-brand .wm`, `.sidebar .link-btn:hover`, `.sidebar :focus-visible` (outline) | `--sidebar-ink-strong` |
| `--texto-forte` | `.topbar .hi`, `.greet .sub b`, `.side-support b` | `--navy` |
| `--texto-fraco` | `.greet .sub`, `.side-support p` | `--ink-soft` |
| `--linha-divisoria` | `.topbar` (border-bottom), `.topbar-help` (border) | `--line` |
| `--fundo-superficie` | `.topbar-help` (background) | `--surface` |

### O que no casco continuou como estava

Nenhum dos oito papéis cobre estes usos, e o lote não criou papel além dos
oito pedidos:

- `--sidebar-ink`: texto fraco sobre a barra. Leem `.nav-item`,
  `.nav-eyebrow`, `.side-brand .wm small`, `.sidebar .link-btn` e
  `.side-account .who span`.
- `--sidebar-active-bg` e `--sidebar-line`, além dos literais
  `rgb(255 255 255 / 0.08)` e `rgb(255 255 255 / 0.16)` no hover e no avatar.
- O card `.side-support`: `--ice-soft` e `--ice`. O botão lima dele usa
  `--lime`, `--black` e `--ice` no hover. O anel de foco usa `--cobalt-ink`.
- `.topbar-help`: cor `--cobalt-ink` e borda de hover `--cobalt`.
- **A sombra da barra inferior** (`rgb(var(--navy-rgb) / 0.55)`, dentro de
  `@media (max-width: 900px)`). No tema escuro ela sai **clara**, porque
  `--navy-rgb` inverte:
  ```
  javascript_tool → getComputedStyle(.sidebar).boxShadow, 375px, data-tema="escuro"
  rgba(210, 224, 240, 0.55) 0px -10px 24px -18px
  ```
  Não foi trocada, por dois motivos: não há papel de sombra entre os oito, e
  o comentário da regra diz que no escuro "a linha e a sombra são o que
  separa a barra do conteúdo". Se é defeito ou intenção fica para decisão.

### Tokens que ficaram sem leitor

```
$ grep -cE "var\(--sidebar-ink-strong\)|var\(--sidebar-bg\)" app/globals.css
0
```
`--sidebar-bg` e `--sidebar-ink-strong` continuam definidos nos três blocos,
mas nenhuma regra os lê mais. Não foram apagados neste lote.

## A prova de que nenhuma cor mudou

A troca foi de nome, não de valor. Para medir, montei o markup do casco de
`app/(protected)/layout.tsx` dentro de `http://localhost:3000/entrar`, porque
as telas com sessão não abrem sem login. Li 7 propriedades em 22 elementos,
com `data-tema="claro"` e com `data-tema="escuro"`, antes de editar o CSS e
depois de editar. Depois comparei o texto das duas leituras:

- **Propriedades:** `color`, `background-color`, `border-top-color`,
  `border-right-color`, `border-bottom-color`, `box-shadow` e
  `outline-color`.
- **Elementos:** `.sidebar`, `.side-brand .wm`, `.side-brand .wm small`,
  `.nav-eyebrow`, `.nav-item.active`, `.nav-item`, `.side-support`,
  `.side-support b`, `.side-support p`, `.side-support .cta`,
  `.side-account`, `.side-account .avatar`, `.side-account .who b`,
  `.side-account .link-btn`, `.main`, `.topbar`, `.topbar .hi`,
  `.greet .sub`, `.greet .sub b`, `.topbar-help`, `.canvas` e `body`.

```
javascript_tool → snapshot antes (colado no script) × snapshot depois, 375×812
{ "largura": 375, "comparacoes": 44, "diferencas": [] }
javascript_tool → idem, 1280×800
{ "largura": 1280, "comparacoes": 44, "diferencas": [] }
```

Em 1280px, `.side-support .cta` saiu com o lima claro também no tema escuro,
nas duas leituras:
```
javascript_tool → getComputedStyle(.side-support .cta).transition
background 0.15s
```
A leitura cai no meio da transição de fundo, e a cena se repetiu igual antes
e depois. Essa regra não foi tocada.

**O que isto não prova:**

- **Markup montado à mão.** O casco foi montado a partir do `layout.tsx`, não
  renderizado com sessão. Um elemento que o `layout.tsx` desenha e que ficou
  de fora da montagem não foi comparado.
- **Hover e foco:** não medidos.
- **Rotas com sessão:** não abertas.

---

## Raio: proposta de três tokens — NÃO APLICADA

Lote 2a, 14/09/2026. Os três números abaixo esperam aprovação do Victor.
Nenhum `border-radius` do código mudou.

### O que existe hoje

Nos controles medidos (as tabelas de `docs/botoes.md`):
```
$ grep -E "^\| [0-9]+ \| \`.*\| B[0-9]+ \|$" docs/botoes.md | awk -F'|' '{gsub(/^ +| +$/,"",$8); print $8}' | sort | uniq -c | sort -rn
19 4px · 18 8px · 13 0 · 12 999px · 2 12px · 1 6px · 1 50%
$ grep -E "^\| [0-9]+ \| \`.*\| C[0-9]+ \|$" docs/botoes.md | awk -F'|' '{gsub(/^ +| +$/,"",$8); print $8}' | sort | uniq -c | sort -rn
22 4px · 7 8px · 6 0
```
Os primeiros 66 valores são das linhas de botão; os outros 35, dos campos
visíveis.

No CSS inteiro:
```
$ grep -oE "border-radius:\s*[^;]+" app/globals.css | sed -E 's/\s+/ /g' | sort | uniq -c | sort -rn
25 var(--raio-card) · 23 var(--raio-item) · 13 var(--raio-pilula) · 13 var(--raio-interno) · 10 var(--raio-selo) · 9 var(--raio-micro) · 7 50% · 5 14px · 1 cada: 3px, 12px, 10px, 0
```
Tokens de hoje: `--raio-card` 12px, `--raio-item` 10px, `--raio-interno`
8px, `--raio-selo` 6px, `--raio-micro` 4px e `--raio-pilula` 999px.

### A proposta

| Token | Valor | Justificativa (uma linha) |
|---|---|---|
| `--raio-controle` | **4px** | É o raio de 41 dos 101 controles medidos (19 botões + 22 campos), contra 25 em 8px. |
| `--raio-cartao` | **12px** | Já é o `--raio-card`, o token de raio mais lido do CSS (25 declarações), e é o do `tema-opcao`, o único controle em forma de cartão. |
| `--raio-pilula` | **999px** | Já existe com esse nome e valor (13 declarações) e é o raio de 12 chips. |

O `50%` do `ec-back` fica fora da escala: é botão redondo.

### O que mudaria se aprovada (para decidir, não aplicado)

- **Controles em 8px que iriam para 4px:** `btn-linha` (18 linhas de botão)
  e os campos C3 e C7 (7).
- **Controle em 6px que iria para 4px:** o `botao-leve` do `.pd-convite`
  (B18, 1 linha).
- **Controles com raio 0:** 13 botões e 6 campos. São link, texto ou nativo,
  sem fundo nem borda, então o raio não aparece. Ficam de fora.
- **Fora dos controles**, a proposta não diz para onde vão: `--raio-item`
  (10px, 23 declarações), `--raio-selo` (6px, 10), os `14px` literais (5) e
  o `3px` (1). É assunto de cartão e lista, não de controle.
