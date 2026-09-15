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
| `--body` | `var(--font-archivo), "Segoe UI", system-ui, -apple-system, Roboto, sans-serif` | texto corrido. Desde o lote 2b (15/09/2026) começa por Archivo, com a pilha de sistema como reserva. Medição em `docs/tipografia-pendente.md` §6. |

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

---

## Raio: lote 2b — APLICADA

Aplicada em 15/09/2026, por pedido do Victor: `--raio-controle` de 8px para
**12px** e `--raio-cartao` de 12px para **16px**. Contra as referências que
ele mandou (Mercado Pago, PicPay, Nubank, Santander, Contabilizei), 8 e 12
ficaram quadrados demais. `--raio-pilula` não mudou.

```
$ grep -nE "^\s*--raio-(controle|cartao):" app/globals.css
--raio-controle: 12px;  /* botão, campo, item de lista e de nav */
--raio-cartao: 16px;    /* card, caixa, bloco */
javascript_tool → getComputedStyle(document.documentElement).getPropertyValue('--raio-*'), /entrar, 375px
{ "controle": "12px", "cartao": "16px", "pilula": "999px" }
```

Quem lê cada token não mudou: só o valor.
```
$ grep -oE "var\(--raio-(controle|cartao)\)" app/globals.css | sort | uniq -c
     31 var(--raio-cartao)
     37 var(--raio-controle)
```

### Antes e depois nas 22 aparências e nos 35 campos, 375px

Montagem de `docs/botoes.md` §0, tema claro. O "antes" foi lido com o CSS de
antes da edição. O "depois" foi lido com o `globals.css` do disco já
recarregado; o script confere que a folha carregada tem
`--raio-controle: 12px` antes de medir. Uma simulação feita antes da edição
deu exatamente os mesmos números.
```
javascript_tool → __bancada.rodar({tema:"claro"}) antes da edição; depois: folhaTem12 === true, rodar de novo; borderTopLeftRadius por linha
```

| Aparência | Antes | Depois |
|---|---|---|
| B1 `chip-opt` | 999px | 999px |
| B2 `btn-linha` | 8px | **12px** |
| B3 `btn-linha fraco` | 8px | **12px** |
| B4 `text-fallback` | 0px | 0px |
| B5 `cta` | 8px | **12px** |
| B6 `btn-linha forte` | 8px | **12px** |
| B7 `mini-send` (ao lado de campo) | 8px | **12px** |
| B8 `cta ghost` | 8px | **12px** |
| B9 `cta` desabilitado | 8px | **12px** |
| B10 `acct-row` | 0px | 0px |
| B11 `botao-leve` | 999px | 999px |
| B12 `link-btn` (auth-foot) | 0px | 0px |
| B13 `ec-back` | 50% | 50% |
| B14 `ec-doubt` | 0px | 0px |
| B15 `cta quiet` | 8px | **12px** (sem fundo nem borda: não aparece) |
| B16 `tema-opcao picked` | 12px | **16px** (lê `--raio-cartao`) |
| B17 `tema-opcao` | 12px | **16px** (lê `--raio-cartao`) |
| B18 `botao-leve` (pd-convite) | 8px | **12px** |
| B19 `mini-send` (pd-guardar) | 8px | **12px** |
| B20 `link-btn` (barra lateral) | 0px | 0px |
| B21 `btn-texto` | 0px | 0px |
| B22 `chip-opt picked` | 999px | 999px |

| Campo | Antes | Depois |
|---|---|---|
| C1 `.field input` | 8px | **12px** |
| C2 `.fallback-field input` / `.city-row input` | 8px | **12px** |
| C3 `.rc-editor input, textarea` | 8px | **12px** |
| C4 `input[type=radio]` | 0px | 0px |
| C5 `.field input` desabilitado | 8px | **12px** |
| C6 `input[type=file].id-arquivo` | 0px | 0px |
| C7 `.rev-corrigir input, textarea` | 8px | **12px** |
| C8 `input[type=file].sr-only` | 0px | 0px |

Por linha:
```
javascript_tool → contagem de borderTopLeftRadius, antes e depois
botões antes:  8px 38 · 50% 1 · 0px 13 · 999px 12 · 12px 2
botões depois: 12px 38 · 50% 1 · 0px 13 · 999px 12 · 16px 2
campos antes:  0px 6 · 8px 29
campos depois: 0px 6 · 12px 29
altura de alguma das 101 linhas mudou: nenhuma
```
Mudaram 40 linhas de botão e 29 campos.

**O que isto não mede:**

- **Os contêineres.** São 37 declarações de controle e 31 de cartão; entre
  elas, os itens de lista e de navegação que o lote raio colocou em
  controle (`.nav-item`, `.card`, `.list-row`, `.bubble`, `.fase`…) e todos
  os cartões. A mudança está no CSS e na contagem acima; o raio computado
  deles fica "não medido".
- **Rotas com sessão:** não abertas.

---

## Escala de texto: lote 2b — APLICADA

Aplicada em 15/09/2026, com seis degraus: **12 · 14 · 16 · 20 · 24 · 30**.
O Victor recusou a proposta de cinco, que está logo abaixo e fica registrada:
juntar título de tela e título de bloco custava hierarquia. Os seis nomes
continuaram os mesmos, e só os valores mudaram. Os papéis dos controles e o
campo em 16px foram aplicados **depois** da escala, lendo dela.

```
$ grep -nE "^\s*--fs-(legenda|corpo|titulo|bloco|tela|destaque):" app/globals.css
--fs-legenda: 12px · --fs-corpo: 14px · --fs-titulo: 16px · --fs-bloco: 20px · --fs-tela: 24px · --fs-destaque: 30px
$ node scripts/gerar-design-md.mjs
escala: 6 degraus (12px, 14px, 16px, 20px, 24px, 30px)
```

| Token | Antes | Depois | Declarações que leem (globals.css) |
|---|---|---|---:|
| `--fs-legenda` | 11px | **12px** | 73 |
| `--fs-corpo` | 13px | **14px** | 112 |
| `--fs-titulo` | 15px | **16px** | 39 |
| `--fs-bloco` | 18px | **20px** | 7 |
| `--fs-tela` | 22px | **24px** | 10 |
| `--fs-destaque` | 26px | **30px** | 3 |

A contagem de leitores é a do `node -e` da proposta abaixo. Os papéis dos
controles e o campo acrescentaram leitores de `--fs-corpo` e
`--fs-titulo`.

### O detector passa

```
$ node .claude/skills/impeccable/scripts/detect.mjs --json app/globals.css
7 achados: side-tab ×4 · layout-transition · codex-grid-background · design-system-color (rgb(0 0 0 / 0.9))
```
São os mesmos 7 de antes do lote, e nenhum é de tamanho. O teste de dois
lados, num arquivo temporário apagado em seguida:
```
$ node .claude/skills/impeccable/scripts/detect.mjs --json app/__t2b/t.css   (.a 14px · .b 16px · .c 13px · .d 15px)
2 achados: font-size: 13px is off the DESIGN.md type ramp · font-size: 15px is off the DESIGN.md type ramp
```
A rampa nova aceita 14 e 16 e reprova os valores velhos.

### Antes e depois nas rotas públicas, 375px

A escala nova é a do CSS real; a velha foi injetada por cima, e os dois
lados foram comparados elemento a elemento pelo índice.
```
javascript_tool → por rota, iframe 375×812: fontSize, número de linhas do texto, scrollWidth > clientWidth, altura da página; CSS real × :root{--fs-*: valores velhos}
```

| Rota | Elementos que mudaram de tamanho | Mudaram de número de linhas | Passaram a transbordar | Página vaza |
|---|---:|---|---:|---|
| `/` | 0 | 0 | 0 | não |
| `/entrar` | 14 | 0 | 0 | não (altura 953 → 974) |
| `/recuperar` | 9 | 1: o `p` "Nunca dizemos se um e-mail está ou não…", 3 → 4 | 0 | não |
| `/redefinir` | 7 | 1: o `h1.auth-h` "Este link não é mais válido.", 1 → 2 | 0 | não |
| `/exclusao-de-dados/x` | 2 | 0 | 0 | não |

A `/` não muda: o `lp.css` escreve tamanho em px e não lê `--fs-*`.
```
$ grep -rn "var(--fs-" app components --include=*.tsx "app/(marketing)/lp.css"
(vazio)
```

**Não medido:** as 21 rotas com sessão.

### Os três tokens de papel e a escala de espaço

- Os três tokens de papel da proposta mais abaixo (`--fundo-controle`,
  `--texto-discreto`, `--texto-discreto-sobre-placa`) foram **aprovados e
  aplicados** com os valores de lá.
- Entraram também três alturas: `--alt-principal` 54px, `--alt-campo` 48px
  e `--alt-controle` 44px.
- A medição com eles aplicados está em `docs/botoes.md` §12.
- **A escala de espaço continua NÃO aplicada.** Por decisão do Victor, vira
  lote próprio.

---

## PROPOSTA — escala de texto, lote 2b, 15/09/2026 — SUBSTITUÍDA pela de seis degraus acima

Nada abaixo está no `globals.css`. Os números são para aprovar.

### O que existe hoje, declarado

```
$ grep -rhoE "(^|[;{ \t])font-size\s*:\s*[^;}]*" app --include=*.css | sed -E "s/^[;{ \t]*//; s/\s+/ /g; s/ *$//; s/ !important//" | sort | uniq -c | sort -rn
$ for f in app/globals.css "app/(marketing)/lp.css"; do grep -oE "font-size\s*:" "$f" | wc -l; done
globals.css: 252 · lp.css: 51
```

No `globals.css` todo tamanho passa por token. Os literais em px vêm todos
do `lp.css`, que é a rota `/`.

| Valor | Declarações | Arquivo |
|---|---:|---|
| `var(--fs-corpo)` 13px | 112 | globals.css |
| `var(--fs-legenda)` 11px | 73 | globals.css |
| `var(--fs-titulo)` 15px | 39 | globals.css |
| `var(--fs-tela)` 22px | 10 | globals.css |
| `var(--fs-bloco)` 18px | 7 | globals.css |
| `var(--fs-destaque)` 26px | 3 | globals.css |
| `var(--fs-hero-*)` (6 tokens, `clamp()`) | 7 | globals.css |
| `var(--fs-code)` 0.92em | 1 | globals.css |
| `14px` | 7 | lp.css |
| `12px` | 5 | lp.css |
| `19px` · `17px` · `14.5px` · `13px` | 4 cada | lp.css |
| `16px` · `15px` · `13.5px` | 3 cada | lp.css |
| `9.5px` · `16.5px` | 2 cada | lp.css |
| `62px` · `22px` · `20px` · `17.5px` · `12.5px` · `11px` · `11.5px` | 1 cada | lp.css |
| `clamp(34px, 5.2vw, 60px)` · `clamp(28px, 4vw, 46px)` · `clamp(27px, 3.6vw, 42px)` | 1 cada | lp.css |

### O que existe hoje, sem ninguém ter declarado

O `13.33px` é o tamanho padrão do Chromium para `<button>` e `<input>`
que não recebem `font-size` de regra nenhuma.
```
javascript_tool → fontSize computado das 66 linhas de botão e dos 35 campos, montagem de docs/botoes.md §0, /entrar, 375px, tema claro
13.3333px: B10 ×2, B13 ×1, B16 ×1, B17 ×1 (5 botões) · C4 ×3, C8 ×1 (4 campos)
```

Nas rotas públicas, o que aparece na tela, elemento com texto visível:
```
javascript_tool → por rota, iframe 375×812: fontSize computado dos elementos com nó de texto próprio e visíveis
```

| Rota | Tamanhos computados |
|---|---|
| `/` | 9.5px ×3 · 11px ×1 · 11.5px ×1 · 12px ×10 · 12.5px ×3 · 13px ×12 · 13.5px ×7 · 14px ×14 · 14.5px ×14 · 15px ×6 · 16px ×8 · 16.5px ×10 · 17px ×11 · 17.5px ×1 · 19px ×7 · 20px ×2 · 22px ×1 · 27px ×8 · 28px ×2 · 34px ×2 · 62px ×1 |
| `/entrar` | 11px ×6 · 13px ×4 · 15px ×2 · 18px ×1 · 22px ×1 |
| `/recuperar` | 11px ×2 · 13px ×3 · 15px ×2 · 18px ×1 · 22px ×1 |
| `/redefinir` | 11px ×1 · 13px ×3 · 15px ×1 · 18px ×1 · 22px ×1 |
| `/exclusao-de-dados/x` | 11px ×1 · 16px ×1 · 18px ×1 · 32px ×1 |

Os `16px` e `32px` da `/exclusao-de-dados/x` não saem de nenhum `--fs-*`. A
regra de onde vêm não foi lida.

Rotas com sessão: **não medido**, exige login.

### A proposta: cinco degraus

| Degrau | Token | Hoje | Declarações que mudam de valor (globals.css) |
|---|---|---|---:|
| **12px** | `--fs-legenda` | 11px | 73 |
| **14px** | `--fs-corpo` | 13px | 112 |
| **16px** | `--fs-titulo` | 15px | 39 |
| **20px** | `--fs-bloco` + `--fs-tela` | 18px e 22px | 7 + 10 |
| **28px** | `--fs-destaque` | 26px | 3 |

```
$ node -e '...lê globals.css sem comentário, conta font-size: var(--fs-*) por token, aplica o mapa acima...'
bloco 7 (18→20) · legenda 73 (11→12) · titulo 39 (15→16) · corpo 112 (13→14) · destaque 3 (26→28) · tela 10 (22→20) · 7 hero-* e 1 code fora da escala
```

**Por que esses cinco:**

- **16px precisa existir.** Abaixo dele o Safari do iPhone dá zoom no campo
  (item 2). E é o tamanho da principal e da secundária do item 1.
- **14px precisa existir.** É o tamanho da discreta e da escolha do item 1.
- **Hoje o 14 e o 16 são reprovados pelo detector.** A simulação do item 1
  foi rodada nele:
  ```
  $ node .claude/skills/impeccable/scripts/detect.mjs --json app/__sim2b/t.css   (cópia temporária da simulação, apagada em seguida)
  design-system-font-size: "font-size: 16px is off the DESIGN.md type ramp" ×2 · "font-size: 14px …" ×2
  ```
  Por isso os itens 1 e 2 dependem desta escala aprovada. Sem ela, o jeito
  de passar no detector seria abrir exceção, e isso não foi feito.
- **Cada degrau fica a 2px ou mais do vizinho.** É a regra do comentário da
  escala no `globals.css`: o detector aceita qualquer valor a até 0,5px de um
  degrau, e degraus próximos demais deixam de ser distintos para ele.
- **A legenda sobe de 11px para 12px.** São 73 declarações, quase todas
  etiqueta em caixa alta, nota e data, lidas por um público de 40+ no
  celular.

**O que se perde, dito em número:** título de tela (22) e título de bloco
(18) viram o mesmo degrau, 20px. São 17 declarações. A diferença entre os
dois passa a ser só de peso e de espaço. Com o teto de cinco, é o par mais
próximo e o de menos uso.

**Fora da escala, como hoje:** os 6 `--fs-hero-*` (`clamp()`) e o
`--fs-code` (`em`).

**O `lp.css` não está nesta proposta.** Hoje ele já não segue a escala (48
literais). O degrau mais perto de cada literal, só como informação:
```
$ node -e '...font-size literal do lp.css → degrau mais perto de [12,14,16,20,28]...'
9.5→12 ×2 · 11→12 ×1 · 11.5→12 ×1 · 12→12 ×5 · 12.5→12 ×1 · 13→12 ×4 · 13.5→14 ×3 · 14→14 ×7 · 14.5→14 ×4 · 15→14 ×3 · 16→16 ×3 · 16.5→16 ×2 · 17→16 ×4 · 17.5→16 ×1 · 19→20 ×4 · 20→20 ×1 · 22→20 ×1 · 62→28 ×1
```
O `62px` é número de herói. Ele não cabe em escala de interface.

**Não medido, porque não foi aplicado:** quanto cada texto cresce na tela e
onde passa a quebrar linha. Com 13 → 14 no corpo, o texto fica cerca de 7,7%
mais largo. Isso só dá para medir nas rotas públicas; nas 21 com sessão,
não.

---

## PROPOSTA — escala de espaço, lote 2b, 15/09/2026 — NÃO APLICADA

### O que existe hoje

Cada comprimento conta sozinho: `padding: 14px 16px` são dois.
```
$ grep -oE "(^|[;{ \t])padding(-[a-z]+)?\s*:\s*[^;}]*" app/globals.css | sed -E "s/^[;{ \t]*padding(-[a-z]+)?\s*:\s*//; s/!important//" | tr ' ' '\n' | grep -E "^-?[0-9.]+(px|em|rem|%)?$|^auto$" | sed -E 's/^-//' | sort | uniq -c | sort -rn
$ (idem para margin, e para "app/(marketing)/lp.css")
```

**`globals.css`, padding** (178 declarações, 104 valores distintos por
declaração):
43×0 · 29×18px · 26×14px · 24×12px · 23×16px · 20×20px · 12×22px · 11×13px ·
10×26px · 10×15px · 10×11px · 9×9px · 9×10px · 7×8px · 6×6px · 6×34px ·
6×30px · 5×4px · 4×5px · 4×24px · 3×32px · 2×56px · 2×40px · 2×38px · 2×2px ·
2×28px · 2×17px · 1×7px · 1×36px · 1×1px

**`globals.css`, margin** (262 declarações, 82 valores distintos por
declaração):
207×0 · 32×10px · 25×14px · 23×8px · 23×6px · 18×12px · 15×22px · 11×auto ·
11×4px · 11×2px · 10×18px · 10×16px · 9×3px · 7×5px · 6×1px · 5×20px · 3×7px ·
2×9px · 2×28px · 2×26px · 2×15px · 1×46px · 1×38px · 1×24px · 1×11px

**Com `var()` ou `calc()`, fora da contagem acima** (4):
`padding: 40px var(--sangria) 36px` · `padding: 20px 18px calc(var(--barra-h) + 24px)` ·
`padding-bottom: calc(var(--barra-h) + 24px)` · `margin: 0 calc(-1 * var(--sangria)) 22px`

**`lp.css`, padding:** 11×0 · 4×26px · 4×24px · 4×22px · 3×28px · 3×20px ·
3×14px · 2×7px · 2×76px · 2×54px · 2×44px · 2×40px · 2×18px · 2×15px · 2×13px ·
2×12px · 2×11px · 1×66px · 1×60px · 1×5px · 1×56px · 1×46px · 1×34px · 1×32px ·
1×30px · 1×1px · 1×19px · 1×17px · 1×10px

**`lp.css`, margin:** 41×0 · 8×auto · 5×14px · 3×8px · 3×4px · 3×18px ·
3×16px · 3×10px · 2×30px · 2×26px · 2×22px · 2×20px · 1×6px · 1×42px ·
1×40px · 1×3px · 1×24px · 1×1px · 1×15px · 1×12px

`gap` não foi pedido e fica de fora. Tem 24 valores distintos
(`docs/varredura-visual.md` §2.4).

### A proposta: seis degraus

**4 · 8 · 12 · 16 · 24 · 32**, com `0` e `auto` fora, porque não são
degraus.

```
$ node -e '...cada comprimento px ≠ 0 de padding/margin do globals.css → degrau mais perto de [4,8,12,16,24,32]...'
ESPAÇO globals.css: 469 comprimentos px ≠ 0 · já no degrau 129 · mudariam 340
```

| Hoje → degrau | Comprimentos |
|---|---|
| → **4** | 1 ×7 · 2 ×13 · 3 ×9 · 4 ×16 · 5 ×11 · 6 ×29 |
| → **8** | 7 ×4 · 8 ×30 · 9 ×11 · 10 ×41 |
| → **12** | 11 ×11 · 12 ×42 · 13 ×11 · 14 ×51 |
| → **16** | 15 ×12 · 16 ×33 · 17 ×2 · 18 ×39 · 20 ×25 |
| → **24** | 22 ×27 · 24 ×5 · 26 ×12 · 28 ×4 |
| → **32** | 30 ×6 · 32 ×3 · 34 ×6 · 36 ×1 · 38 ×3 · 40 ×2 · 46 ×1 · 56 ×2 |

**Onde a proposta pesa, para decidir antes:**

- **340 de 469 comprimentos mudam de valor.** É muito mais mexida que a
  escala de texto, e quase toda cai nas telas com sessão, onde não dá para
  medir.
- **Os ajustes de 1 a 3px (29) viram 4.** São acertos ópticos: ícone meio
  pixel acima, rótulo encostado. Arredondar move coisa que foi posta ali de
  propósito. A alternativa é deixá-los fora da escala, como exceção
  declarada, e a escala passa a ter sete valores.
- **O 20px vai para 16, e não para 24.** Os dois estão a 4 dele; o desempate
  foi para baixo. São 25 comprimentos, quase todos padding de cartão.
- **Os de 36 a 56 (9) viram 32.** São os respiros grandes da `/inicio` e da
  casa do criativo, e encolhem visivelmente.

---

## PROPOSTA — três tokens de papel para os controles (item 1), 15/09/2026 — NÃO APLICADA

Seguem o padrão da camada de papéis: no `:root` apontam para a paleta; nos
dois blocos escuros, o valor escrito direto.

| Token | Claro | Escuro | Serve |
|---|---|---|---|
| `--fundo-controle` | `rgb(var(--navy-rgb) / 0.06)` | `rgb(210 224 240 / 0.06)` | o "cinza claro" da secundária, da escolha e do ícone |
| `--texto-discreto` | `var(--ink-mute)` → #5A6977 | `#7D8CA1` | a discreta sobre fundo claro (página, cartão) |
| `--texto-discreto-sobre-placa` | `var(--sidebar-ink)` → `rgb(var(--plate-ink-rgb) / 0.78)` | `rgb(233 239 248 / 0.66)` | a discreta sobre a placa escura (barra lateral) |

**`--fundo-controle` é o mesmo tingimento que o `.ec-back` já usa.** O
"cinza claro" do desenho (`--fraca` #EDF2F5) não existe na paleta. E, por
ser translúcido, ele acompanha o fundo onde cai, cartão ou página, nos dois
temas.

### Por que a discreta precisa de dois tokens

A cor do desenho (#9FB3C4) está sobre o cartão escuro da pergunta do dia.
Sobre fundo claro ela reprova.
```
$ node -e '...razão WCAG de cada candidato contra cada fundo...'
```

| Candidato | canvas #F1F6F7 | surface #FEFEFE | surface-2 #FFFFFF | ice-soft #E3F6FE | canvas esc. #050A13 | surface esc. #0C1523 | surface-2 esc. #111C2E | ice-soft esc. #0E2231 | plate #111E2F | barra esc. #080E1A |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desenho #9FB3C4 | **1,98** | **2,14** | **2,16** | **1,94** | 9,18 | 8,47 | 7,91 | 7,52 | 7,77 | 8,93 |
| `--ink-mute` claro #5A6977 | 5,18 | 5,59 | 5,64 | 5,07 | **3,51** | **3,24** | **3,03** | **2,88** | **2,98** | **3,42** |
| `--ink-mute` escuro #7D8CA1 | **3,14** | **3,39** | **3,42** | **3,08** | 5,79 | 5,35 | 4,99 | 4,75 | 4,91 | 5,64 |
| `--ink-soft` claro #485A6B | 6,53 | 7,06 | 7,12 | 6,40 | **2,79** | **2,57** | **2,40** | **2,28** | **2,36** | **2,71** |
| `--ink-soft` escuro #9FB0C6 | **2,03** | **2,19** | **2,21** | **1,99** | 8,97 | 8,28 | 7,73 | 7,35 | 7,60 | 8,73 |

Nenhum tom passa de 4,5 nos dois grupos de fundo. Por isso são dois
tokens: um para fundo claro e um para a placa escura. Cada um troca de valor
com o tema.

Medido na montagem, com o mapeamento simulado:
```
javascript_tool → razão da tinta contra o fundo composto (fundo do controle sobre os ancestrais), /entrar, 375px, data-tema claro e escuro, com a proposta injetada
```

| Uso | Claro | Escuro |
|---|---:|---:|
| discreta sobre cartão (`--texto-discreto`) | 5,59 | 5,35 |
| discreta sobre página (`--texto-discreto`) | 5,18 | 5,79 |
| discreta na barra lateral (`--texto-discreto-sobre-placa`) | 9,77 | 7,56 |
| secundária: cobalto sobre `--fundo-controle`, em cartão / em página | 6,50 / 6,03 | 4,89 / 5,45 |
| escolha: `--texto-forte` sobre `--fundo-controle`, em cartão / em página | 14,80 / 13,71 | 13,98 / 15,57 |
| `--fundo-controle` contra o fundo, em cartão / em página | 1,13 / 1,12 | 1,13 / 1,10 |

A última linha não é contraste de texto. É o quanto o preenchimento se
destaca do fundo: pouco, e é o que o desenho pede. O texto do botão é o que
o identifica.
