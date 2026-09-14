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

## Raio: três tokens — APLICADA

Aplicada em 14/09/2026, a partir da proposta do lote 2a, com uma mudança
decidida pelo Victor: `--raio-controle` saiu de 4px para **8px**. Com 4px, o
raio quase não aparece num botão de 44px. E 18 das 66 linhas de botão (a
família `btn-linha`) já usavam 8px.

### Os valores finais

```
$ grep -nE "^\s*--raio-[a-z]+:" app/globals.css
168:  --raio-controle: 8px;   /* botão, campo, item de lista e de nav */
169:  --raio-cartao: 12px;    /* card, caixa, bloco */
170:  --raio-card: 12px;      /* card padrão */
171:  --raio-item: 10px;      /* item de lista, bloco de nav */
172:  --raio-interno: 8px;    /* elemento dentro de card */
173:  --raio-selo: 6px;       /* selo, aviso */
174:  --raio-micro: 4px;      /* campo, marcador */
175:  --raio-pilula: 999px;   /* pílula */
```

| Token | Valor | Para que serve |
|---|---|---|
| `--raio-controle` | **8px** | botão, campo, item de lista e item de navegação |
| `--raio-cartao` | **12px** | card, caixa e bloco |
| `--raio-pilula` | **999px** | chip, pílula e marcador redondo (já existia com esse nome e valor) |

Os três tokens só existem no `:root`. Nenhum bloco de tema escuro redefine
raio, porque o raio não muda com o tema.

```
javascript_tool → getComputedStyle(document.documentElement).getPropertyValue('--raio-*'), 375px, /entrar
{ "controle": "8px", "cartao": "12px", "pilula": "999px" }
```

### Para onde foi cada declaração

Antes da troca, `app/globals.css` tinha 111 declarações de raio. O script
listou cada uma com linha, valor e seletor, e depois trocou uma por uma
exigindo que o texto aparecesse exatamente uma vez na linha:
```
$ node raio-patch.cjs   (scratchpad; lê o inventário de 111 declarações e aplica o mapa)
4px → controle 6 · 4px → fica 3 · 6px → controle 1 · 6px → fica 9 · 8px → controle 6 · 8px → fica 7
10px → controle 24 · 12px → cartao 26 · 14px → cartao 5 · 999px → pilula 13 · 50% → fica 7 · 3px → fica 3 · 0 → fica 1
por destino: controle 37 · cartao 31 · pilula 13 · fica 30
```

| Valor antigo | Existiam | → controle | → cartão | → pílula | Ficou como estava |
|---|---:|---:|---:|---:|---:|
| 0 | 1 | | | | 1 |
| 3px | 3 | | | | 3 |
| 4px | 9 | 6 | | | 3 |
| 6px | 10 | 1 | | | 9 |
| 8px | 13 | 6 | | | 7 |
| 10px | 24 | 24 | | | |
| 12px | 26 | | 26 | | |
| 14px | 5 | | 5 | | |
| 999px | 13 | | | 13 | |
| 50% | 7 | | | | 7 |
| **Total** | **111** | **37** | **31** | **13** | **30** |

Quem foi para cada token:

- **controle, 37 declarações:**
  - 6 de 4px: `.field input`, `.cta`, `.fallback-field input` e
    `.city-row input`, `.mini-send`, `.field select`, `.btn-sm`;
  - 6 de 8px: `.btn-linha`, `.rev-corrigir input, textarea`,
    `.rc-editor input, textarea`, `.id-arquivo::file-selector-button`,
    `.acct-list .acct-row.destaque`, e o `var(--raio-interno)` do
    `.nav-item`, que a declaração seguinte da mesma regra já sobrescrevia;
  - 1 de 6px: `.pd-convite .botao-leve`;
  - 24 de 10px, por decisão do Victor, que colocou item de lista e de nav em
    controle: `.nav-item`, `.nav-item.active::before` (≤900px),
    `.side-account`, `.side-support`, `.support-block`, `.bubble`,
    `.espera-row`, `.ec-swap`, `.card`, `.alert-card`, `.empty-list`,
    `.list-row`, `.escolha-item`, `.fail-block`, `.rev-opcao`, `.id-aviso`,
    `.id-logo img`, `.id-galeria img`, `.rc-nao-sabemos`, `.fase`, `.sinal`,
    `.analise-alvo`, `.analise-aviso` e o literal `10px` do
    `.casa-vazio-ico`.
- **cartão, 31 declarações:** os 25 `var(--raio-card)` e o literal `12px` do
  `.casa-obra`. Mais os 5 literais de `14px`: `.auth-card`, `.empty-card`,
  `.rev-item`, `.casa-vazio` e `.casa-desenho`.
- **pílula, 13 declarações:** já liam `var(--raio-pilula)`. O nome e o valor
  não mudaram, e nenhuma linha foi editada.

### O que ficou fora da escala, por decisão

Estas 30 declarações não mudaram. O Victor decidiu cada grupo antes da edição.

- **Selos, avisos e peças pequenas que não são controle (19):**
  - `--raio-selo` 6px: `.form-error`, `.form-notice`, `.trust`,
    `.chip-lime`, `.diag-lista li`, `.diag-json`, `.res-barra`,
    `.analise-recusa`, `.analise-selo`;
  - `--raio-micro` 4px: `.campo-com-moeda .campo-moeda`, `.tema-amostra i`,
    `code`;
  - `--raio-interno` 8px: `.mark-plate`, `.ec-badge`, `.toast`,
    `.tema-amostra`, `.lr-erro`, `.id-recado`, `.analise-previa`.
- **Círculos em `50%` (7):** o `.ec-back` e mais seis peças quadradas:
  `.pill::before`, `.side-account .avatar`, `.empty-ico`, `.grp-dot`,
  `.res-num-ico` e `.res-falha-ico`.
- **Literais (4):** `3px` na ponta da `.bubble.ai`, na da `.bubble.user` e
  no `.tick`; `0` no `.nav-item` da barra inferior (≤900px).

### Tokens antigos

Por decisão, continuam definidos. Dois ficaram sem leitor:
```
$ grep -oE "var\(--raio-[a-z]+\)" app/globals.css | sort | uniq -c
     31 var(--raio-cartao)
     37 var(--raio-controle)
      7 var(--raio-interno)
      3 var(--raio-micro)
     13 var(--raio-pilula)
      9 var(--raio-selo)
```
`--raio-card` e `--raio-item` não aparecem na saída, porque têm 0 leitores.
`--raio-interno`, `--raio-selo` e `--raio-micro` ainda são lidos pelas 19
declarações que ficaram fora da escala.

Fora do `globals.css`, nenhum arquivo de `app`, `components`, `lib` ou
`scripts` lê `--raio-*`, e nenhum JSX tem `borderRadius`. Os tokens só são
citados em documentos.

### Antes e depois nos controles, em 375px

Os controles foram montados na cadeia de ancestrais real
(`docs/botoes.md` §0), dentro de `http://localhost:3000/entrar`, em 375×812
e tema claro. A mesma medição rodou antes e depois da edição.

| Aparência | Antes | Depois | Comando |
|---|---|---|---|
| B1 `chip-opt` | 999px | 999px | `getComputedStyle(el).border*Radius`, 4 cantos |
| B2 `btn-linha` | 8px | 8px | idem |
| B3 `btn-linha fraco` | 8px | 8px | idem |
| B4 `text-fallback` | 0px | 0px | idem |
| B5 `cta` | 4px | **8px** | idem |
| B6 `btn-linha forte` | 8px | 8px | idem |
| B7 `mini-send` (fallback) | 4px | **8px** | idem |
| B8 `cta ghost` | 4px | **8px** | idem |
| B9 `cta` desabilitado | 4px | **8px** | idem |
| B10 `acct-row` | 0px | 0px | idem |
| B11 `botao-leve` | 999px | 999px | idem |
| B12 `link-btn` (auth-foot) | 0px | 0px | idem |
| B13 `ec-back` | 50% | 50% | idem |
| B14 `ec-doubt` | 0px | 0px | idem |
| B15 `cta quiet` | 4px | **8px** | idem |
| B16 `tema-opcao picked` | 12px | 12px | idem |
| B17 `tema-opcao` | 12px | 12px | idem |
| B18 `botao-leve` (pd-convite) | 6px | **8px** | idem |
| B19 `mini-send` (pd-guardar) | 4px | **8px** | idem |
| B20 `link-btn` (sidebar) | 0px | 0px | idem |
| B21 `btn-texto` | 0px | 0px | idem |
| B22 `chip-opt picked` | 999px | 999px | idem |

| Campo | Antes | Depois | Comando |
|---|---|---|---|
| C1 `.field input` | 4px | **8px** | `getComputedStyle(el).border*Radius`, 4 cantos |
| C2 `.fallback-field input` / `.city-row input` | 4px | **8px** | idem |
| C3 `.rc-editor input, textarea` | 8px | 8px | idem |
| C4 `input[type=radio]` | 0px | 0px | idem |
| C5 `.field input` desabilitado | 4px | **8px** | idem |
| C6 `input[type=file].id-arquivo` | 0px | 0px | idem |
| C7 `.rev-corrigir input, textarea` | 8px | 8px | idem |
| C8 `input[type=file].sr-only` | 0px | 0px | idem |

Por linha:
```
javascript_tool → antes, 66 linhas de botão e 35 campos, 375px
botões: 4px 19 · 8px 18 · 0px 13 · 999px 12 · 12px 2 · 6px 1 · 50% 1
campos: 4px 22 · 8px 7 · 0px 6
javascript_tool → depois, mesma montagem
botões: 8px 38 · 0px 13 · 999px 12 · 12px 2 · 50% 1
campos: 8px 29 · 0px 6
```
Mudaram 20 linhas de botão (19 de 4px e 1 de 6px) e 22 campos. Todas foram
para 8px. Os 4 cantos saíram iguais em todas as 101 leituras.

**O que isto não mede:**

- **Os 29 contêineres que mudaram de valor**, os 24 de 10px para 8px e os 5
  de 14px para 12px. Não foram montados no navegador. A mudança está no CSS
  e nas contagens acima; o raio computado deles fica "não medido".
- **Rotas com sessão:** não abertas.
