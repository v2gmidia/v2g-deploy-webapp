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
