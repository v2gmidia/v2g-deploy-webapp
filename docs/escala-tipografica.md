# Escala tipográfica — levantamento e proposta

**Lote A. Este documento é o passo 1: medição e proposta. Nada foi
alterado no CSS.**

Medido em 19/08/2026 sobre `app/globals.css`, por varredura com parser de
blocos (rastreia `{`/`}` e associa cada `font-size` ao seletor do bloco que
o contém), não por olho nem por `grep` de linha. O script está em
`scratchpad/fs2.js`; o que importa dele é que conta *declarações*, não
ocorrências de texto, e por isso os números abaixo diferem dos registrados
em `padrao-visual.md` §2 — ver §10.

---

## 1. O que foi medido

| | |
|---|---|
| Declarações de `font-size` em `app/globals.css` | **162** |
| Valores distintos | **28** |
| — em `px` fixo | **22 valores, 156 declarações** |
| — relativo (`0.92em`, em `code`) | 1 valor, 1 declaração |
| — fluido (`clamp()`) | 5 valores, 5 declarações |
| `font-size` fora do `globals.css` (TSX/TS, inline, `style=`) | **zero** |

A última linha importa: `globals.css` é a superfície inteira do app. Não há
`fontSize` em componente nenhum — medido com varredura em `app/` e
`components/` por `fontSize` e `font-size`, ambos com zero achados. Portanto
tokenizar o `:root` resolve 100% do app, sem caçada em componente.

Fora do escopo, mas medido para dimensionar a consequência: `app/(marketing)/lp.css`
tem **51 declarações em 21 valores distintos** (ver §9.3).

---

## 2. Os 22 tamanhos fixos, por peso de uso

Ordenado por quantas vezes aparece. É essa coluna que decide âncora e ruído.

| Tamanho | Decl. | Seletores |
|---|---:|---|
| **13px** | **32** | `.form-error` `.form-notice` `.auth-foot` `.link-btn` `.mini-send` `.trust b` `.proof-actions .cta` `.ec-receipt li` `.toast` `.alert-card p` `.support-block` `.hero-note` `.navy-card .nc-head` `.card.noturno .nc-head` `.est-link` `.mission-slot p` `.passo-aviso`※ `.cobranca p` `.lr-erro` `.faixa-reconectar span` `.faixa-reconectar .cta` `.fail-block p` `.diag-lista li code` `.dc-valor` `.rev-corrigir input, textarea` `.btn-linha` `.rev-explica` `.id-aviso p` `.id-recado` `.id-vazio` `.id-arquivo` `.id-arquivo::file-selector-button` |
| **12.5px** | **19** | `.proof-card p` `.auth-top .auth-help` `.side-account .who b` `.chip-opt` `.proof-list li` `.ec-outlink` `.ec-doubt` `.section-title a` `.st-note, .side-note` `.hint` `.empty-list li, .tips-list li` `.side-support b` `.side-support .cta` `.greet .sub` `.navy-card p` `.card.noturno p` `.command-card .limit` `.stepper .s-copy span` `.rev-dica` |
| **12px** | **18** | `.text-fallback` `.trust` `.ec-count` `.foot-line` `.log-row` `.empty-hero .eh-note` `.empty-note` `.ar-text span` `.list-row .lr-nums` `.grp-count` `.btn-sm` `.escolhido > span` `.tema-opcao span` `.lr-pecas` `.esc-texto span` `.card-note` `.diag-meta` `.rev-quem` |
| **14px** | **17** | `.proof-card b.title` `.auth-sub` `.nav-item` `.side-account .avatar` `.ec-swap p` `.ar-text b` `.support-block b` `.command-card b.title` `.passo-num` `.passos p` `.peca-corpo` `.tema-opcao b` `.esc-texto b` `.fail-block b` `.rev-texto` `.rev-corrigido` `.id-cabeca b` |
| **15px** | **12** | `.field input` `.cta` `.section-title h2` `.field select` `.alert-card b` `.list-row .lr-title` `.list-row .lr-nums b` `.mission-slot b` `.escolhido b` `.passos > li > div > b` `.cobranca b` `.faixa-reconectar b` |
| **11.5px** | **10** | `.field .note` `.field .error` `.rail-note` `.assemble .hint` `.list-footnote` `.chip-lime` `.navy-card .nc-foot` `.card.noturno .nc-foot` `.diag-json` `.rev-coluna` |
| **13.5px** | **10** | `.bubble` `.fallback-field input, .city-row input` `.page-head p` `.empty-hero p` `.empty-body` `.tips-title` `.rev-erro` `.rev-trecho blockquote` `.rev-bloqueio` `.id-aviso b` |
| **10px** | **7** | `.wordmark .wm small` `.pill` `.time-label` `.metric .m-label` `.mission-slot .ms-tag` `.stepper .split-tag` `.dc-rotulo` |
| **11px** | **7** | `.field label` `.eyebrow` `.ec-label` `.side-support p` `.metric .m-delta` `.list-row .lr-fresh` `.rev-etiqueta` |
| **10.5px** | **6** | `.side-account .who span, .link-btn` `.qcount` `.mission-tag` `.ec-swap-label` `.alert-card time` `.badge` |
| **18px** | 3 | `.wordmark .wm` `.ec-badge` `.rev-de` |
| **22px** | 3 | `.auth-h`↓620 `.ec-h`↓620 `.empty-head` |
| **9.5px** | 2 | `.rail-labels span` `.nav-eyebrow` |
| **26px** | 2 | `.ec-h` `.page-head h1` |
| **14.5px** | 1 | `.rev-rotulo` |
| **15.5px** | 1 | `.stepper .s-copy b` |
| **16px** | 1 | `.peca-titulo` |
| **17px** | 1 | `.peca-oferta` |
| **20px** | 1 | `.topbar .hi` |
| **21px** | 1 | `.metric .m-value` |
| **24px** | 1 | `.empty-hero h3` |
| **27px** | 1 | `.auth-h` |

※ `.passo-aviso` é o único `font-size: 13px !important` do arquivo. Ele
briga com `.passos p { font-size: 14px }`. Depois da escala, os dois caem em
degraus diferentes e a briga pode acabar — anotado, não resolvido aqui.

**Leitura:** oito dos 22 valores aparecem uma única vez. Os quatro mais
usados — 13, 12.5, 12, 14 — somam 86 das 156 declarações e cabem numa faixa
de 2px. Isso é a definição do problema: o peso está concentrado onde as
diferenças são invisíveis.

---

## 3. Mesmo papel, valores diferentes

Não é palpite: cada agrupamento abaixo foi confirmado por propriedades que
o próprio CSS declara junto do tamanho — `text-transform`, `letter-spacing`,
`font-family` e `color`.

### Papel 1 — etiqueta em caixa alta · 17 declarações, 4 tamanhos

Todas com `text-transform: uppercase` + `letter-spacing`, quase todas na
`--display`. É um papel só, escrito em quatro tamanhos:

- **9.5px** — `.rail-labels span`, `.nav-eyebrow`
- **10px** — `.wordmark .wm small`, `.pill`, `.time-label`, `.metric .m-label`, `.mission-slot .ms-tag`, `.stepper .split-tag`, `.dc-rotulo`
- **10.5px** — `.qcount`, `.mission-tag`, `.ec-swap-label`, `.badge`
- **11px** — `.field label`, `.eyebrow`, `.ec-label`, `.rev-etiqueta`

O `letter-spacing` desse grupo varia de `0.04em` a `0.18em` sem relação com
o tamanho — mais um sinal de que os valores foram escolhidos um a um, não
derivados.

### Papel 2 — legenda e nota · 15 declarações, 3 tamanhos

Pequeno, **sem** caixa alta, quase sempre `--ink-mute`:

- **10.5px** — `.side-account .who span`, `.alert-card time`
- **11px** — `.side-support p`, `.metric .m-delta`, `.list-row .lr-fresh`
- **11.5px** — as 10 (`.field .note`, `.field .error`, `.rail-note`, `.assemble .hint`, `.list-footnote`, `.chip-lime`, `.navy-card .nc-foot`, `.card.noturno .nc-foot`, `.diag-json`, `.rev-coluna`)

### Papel 3 — texto de apoio · 37 declarações, 2 tamanhos a 0,5px

**12px e 12.5px.** Meio pixel de diferença, 37 declarações. Ninguém vê essa
distinção; ela existe porque foi digitada, não porque foi decidida.

### Papel 4 — corpo · 42 declarações, 2 tamanhos a 0,5px

**13px e 13.5px.** Mesma história, com o valor mais usado do arquivo dentro.

### Papel 5 — corpo forte e título de item · 32 declarações, 5 tamanhos em 2px

**14, 14.5, 15, 15.5, 16px.** Cinco valores espremidos em dois pixels.
Dentro do grupo há duas coisas diferentes, e dá para separá-las pelo CSS:
as que têm `font-family: var(--display)` ou são `b` são **título**; as que
têm `line-height` de parágrafo (1.5–1.65) são **corpo**.

### Papel 6 — título · 13 declarações, 8 tamanhos

**17, 18, 20, 21, 22, 24, 26, 27px.** Oito valores para treze usos. Quatro
deles (17, 20, 21, 24) aparecem uma vez cada.

---

## 4. A proposta: 6 degraus

```
--fs-legenda   11px
--fs-corpo     13px
--fs-titulo    15px
--fs-bloco     18px
--fs-tela      22px
--fs-destaque  26px
```

Mais a faixa fluida do herói, que **não entra na rampa** e continua em
`clamp()` — ver §9.1.

### Por que exatamente 6 — e não 5, e não 7

O número não veio de gosto. Veio de um limite do detector que eu medi.

**O detector aceita qualquer valor a até 0,5px de um degrau declarado.**
Está em `detector/design-system.mjs:22` (`FONT_SIZE_TOLERANCE_PX = 0.5`) e
em `fontSizeStepStatus` (linha 670), e eu confirmei rodando: com uma rampa
de teste `11 / 13 / 15`, o detector **reprovou** `9.5`, `10`, `12`, `14` e
`20`, e **aprovou** `11.5`, `12.5`, `13.5` e `14.5`.

A consequência é dura e vale escrever: **dois degraus a menos de 2px um do
outro não são degraus distintos para a ferramenta** — tudo entre eles passa.
Uma rampa com degraus a 1,5px de distância existe no papel e não existe na
fiscalização.

Daí:

- **Não 7 (nem mais).** Um sétimo degrau na faixa 11–15, onde está o peso,
  cairia a 1 ou 1,5px de um vizinho. Seria um degrau que a ferramenta não
  consegue separar do de baixo — exatamente o problema que este lote existe
  para acabar.
- **Não 5.** Tirar `18` ou `22` empurra `.topbar .hi`, `.ec-badge`,
  `.rev-de` e `.empty-head` para saltos de 4 a 6px. Aí a mudança deixa de
  ser saneamento e vira redesenho de tela.
- **6 é o maior número de degraus que sobrevive à regra dos 2px** dentro da
  amplitude que o app realmente usa (9,5px a 27px).

### Por que estes valores, e não outros

Todos os seis já existem no arquivo, e cinco deles são os mais pesados da
sua faixa. **13px é a âncora** — 32 declarações, o valor mais usado — e por
isso não se mexe. `15`, `18`, `22` e `26` idem. `11` é o topo do papel 1+2.

Confirmação independente de que o topo está certo: `.auth-h` e `.ec-h` já
encolhem para **22px** abaixo de 620px. O degrau `22` não foi inventado — é
o que o CSS já escolheu quando precisou escolher.

### Como fica a hierarquia

Os componentes que hoje têm três níveis continuam com três, porque os
degraus preservam as distâncias que já existiam:

| Componente | Hoje | Depois |
|---|---|---|
| `.alert-card` — `b` / `p` / `time` | 15 / 13 / 10.5 | 15 / 13 / **11** |
| `.list-row` — título / números / rótulo / frescor | 15 / 15 / 12 / 11 | 15 / 15 / **13** / 11 |
| `.empty-hero` — `h3` / `p` / nota | 24 / 13.5 / 12 | **22 ou 26** / **13** / **11** |
| `.stepper .s-copy` — `b` / `span` | 15.5 / 12.5 | **15** / **13** |

---

## 5. Mapeamento de cada tamanho atual

| Hoje | Decl. | Vira | Δ | Perceptível? |
|---|---:|---|---|---|
| 9.5px | 2 | 11px | **+1,5** | **sim — §6** |
| 10px | 7 | 11px | +1,0 | limiar |
| 10.5px | 6 | 11px | +0,5 | não |
| 11px | 7 | 11px | 0 | — |
| 11.5px | 10 | 11px | −0,5 | não |
| 12px | 18 | **11 ou 13** | ±1,0 | limiar — §5.1 |
| 12.5px | 19 | 13px | +0,5 | não |
| 13px | 32 | 13px | 0 | — |
| 13.5px | 10 | 13px | −0,5 | não |
| 14px | 17 | **13 ou 15** | ±1,0 | limiar — §5.2 |
| 14.5px | 1 | 15px | +0,5 | não |
| 15px | 12 | 15px | 0 | — |
| 15.5px | 1 | 15px | −0,5 | não |
| 16px | 1 | 15px | −1,0 | limiar |
| 17px | 1 | 18px | +1,0 | limiar |
| 18px | 3 | 18px | 0 | — |
| 20px | 1 | **18 ou 22** | **±2,0** | **sim — §6** |
| 21px | 1 | 22px | +1,0 | limiar |
| 22px | 3 | 22px | 0 | — |
| 24px | 1 | **22 ou 26** | **±2,0** | **sim — §6** |
| 26px | 2 | 26px | 0 | — |
| 27px | 1 | 26px | −1,0 | limiar |

**Resumo do impacto, em declarações:**

| | Decl. | % |
|---|---:|---:|
| Não mudam nada | 59 | 38% |
| Mudam ≤ 0,5px (imperceptível) | 47 | 30% |
| Mudam exatamente 1px | 46 | 29% |
| Mudam **mais** de 1px | **4** | **3%** |

Ou seja: **106 das 156 declarações mudam meio pixel ou nada**, e só quatro
exigem decisão sua.

### 5.1 O grupo dos 12px se divide — e o critério está no próprio CSS

As 18 declarações de 12px não vão todas para o mesmo lugar, e o critério
não é meu: **é a cor que elas já declaram.**

- **`color: var(--ink-mute)` → 11px** (é legenda): `.text-fallback`,
  `.foot-line`, `.empty-hero .eh-note`, `.grp-count`, `.lr-pecas`,
  `.card-note`, `.diag-meta`, `.rev-quem` — 8 declarações.
- **`--ink-soft` / `--ink` / `--navy` → 13px** (é texto de apoio):
  `.trust`, `.ec-count`, `.log-row`, `.empty-note`, `.ar-text span`,
  `.list-row .lr-nums`, `.btn-sm`, `.escolhido > span`, `.tema-opcao span`,
  `.esc-texto span` — 10 declarações.

A correlação é perfeita nas 18. Não é coincidência: quem escreveu já
separava "nota apagada" de "texto secundário" pela cor — só não separava
pelo tamanho.

Duas declarações de **12.5px** também são `--ink-mute` (`.st-note, .side-note`
e `.rev-dica`) e pelo mesmo critério iriam para 11px. Mas isso é −1,5px, que
cruza o seu limiar. **Proponho deixar as duas em 13px** e tratá-las como
exceção consciente, para não abrir uma quinta decisão caso a caso. Se
preferir a coerência do critério, elas entram na lista da §6.

### 5.2 O grupo dos 14px também se divide

Mesmo raciocínio, critério também no CSS — `--display`/`b` é título,
`line-height` de parágrafo é corpo:

- **→ 15px** (título, 11): `.proof-card b.title`, `.nav-item`,
  `.side-account .avatar`, `.ar-text b`, `.support-block b`,
  `.command-card b.title`, `.passo-num`, `.tema-opcao b`, `.esc-texto b`,
  `.fail-block b`, `.id-cabeca b`
- **→ 13px** (corpo, 6): `.auth-sub`, `.ec-swap p`, `.passos p`,
  `.peca-corpo`, `.rev-texto`, `.rev-corrigido`

Um de olho: **`.nav-item` 14 → 15px** é 1px no elemento mais visto do app
(os cinco itens do menu). Está dentro do limiar, mas é o que eu olharia
primeiro na verificação.

---

## 6. As quatro mudanças acima de 1px — medidas no navegador

**Método.** Servidor de desenvolvimento em `localhost:3000`, página `/entrar`
(pública), onde a Archivo real está carregada — confirmado com
`document.fonts.check('700 11px Archivo')` → `true`. Os componentes foram
montados no DOM com a marcação e as classes reais, e medidos por
`getBoundingClientRect` e por `Range.getClientRects()` para contar caixas de
linha. As telas em si estão atrás de autenticação, então o que foi medido é
a geometria dos componentes, não a captura das telas — e geometria é o que
essas quatro perguntas eram.

Uma limitação, dita: o painel do navegador não estava sendo exibido nesta
sessão, então **não houve captura de tela** — `innerWidth` fica em 0 e o
compositor não desenha quadro. Medida de layout funciona assim mesmo (o
motor calcula), captura não. As quatro respostas abaixo não dependiam de
olhar.

### 1. `.rail-labels span` · 9.5 → 11px · **aplicar**

Três rótulos `flex: 1` numa linha; em 375px o canvas dá 339px e cada célula
fica com **109,7px**. Os rótulos travados carregam ainda o cadeado de 9px
mais 4px de `gap`, sobrando 96,7px de texto.

| Rótulo | Precisa @9.5px | Precisa @11px | Caixa | Linhas hoje | Linhas a 11px |
|---|---:|---:|---:|:-:|:-:|
| `1 · Seu negócio` (em `.now`, negrito) | 87,8 | **101,6** | 109,7 | 1 | **1** |
| `2 · Sua marca` (travado) | 75,3 | 87,1 | 96,7 | 1 | 1 |
| `3 · Aprovar e decolar` (travado) | 125,7 | 145,5 | 96,7 | **2** | **2** |

**O terceiro rótulo já quebra em duas linhas hoje** — a 9,5px ele precisa de
125,7px numa caixa de 96,7px. A 11px continua em duas. **Nenhuma quebra
nova aparece.** O que muda é a folga do primeiro rótulo, que cai de 21,9px
para 8,1px: continua cabendo, mas deixa de ter margem para copy mais longa.
Fica anotado — se o rótulo do passo 1 crescer, ele quebra.

### 2. `.nav-eyebrow` · 9.5 → 11px · **aplicar, e abrir defeito separado**

Aqui a medição contradiz a suspeita, e para o lado que libera a mudança.

Geometria real da sidebar colapsada: `padding: 22px 16px 18px` no
`.sidebar`, `padding: 0 12px 8px` no `.nav-eyebrow`. Com `--sidebar-w: 76px`
abaixo de 900px, a caixa de texto do rótulo é de **20px**.

| | Caixa de texto | "SEU NEGÓCIO" precisa | Linhas | Altura |
|---|---:|---:|:-:|---:|
| Sidebar 252px (desktop), hoje 9.5px | 196px | 81,6px | 1 | 18px |
| Sidebar 252px, a 11px | 196px | 94,5px | **1** | 20px |
| Sidebar 76px (≤900px), hoje 9.5px | **20px** | 81,6px | **2** | 28px |
| Sidebar 76px, a 11px | **20px** | 94,5px | **2** | 32px |

**O 9,5px não está protegendo nada.** Numa caixa de 20px, nem a palavra
"SEU" cabe — o texto já transborda hoje, em duas linhas, e transborda por
81,6px em vez de por 94,5px. A diferença entre estar quebrado a 9,5px e
estar quebrado a 11px não é uma diferença que valha manter um tamanho fora
da escala.

No desktop, que é onde o elemento funciona, sobram 196px para 94,5px de
texto: uma linha, com folga de mais que o dobro.

Então: **11px entra**, e o transbordo na sidebar colapsada vira defeito
próprio. A correção provável é esconder o `.nav-eyebrow` abaixo de 900px
junto dos outros três (`.side-brand .wm`, `.nav-item span`,
`.side-account .who`) — que é mudança de layout e não é deste lote.

### 3. `.topbar .hi` · 20 → **18px**

Sem restrição de caixa: a saudação "Olá, Marina" precisa de 108,5px hoje,
97,6px a 18px e 119,3px a 22px, numa topbar de largura livre — uma linha nos
três casos. A decisão é de hierarquia, não de espaço.

Vai para **18px**. A 22px ela ficaria do tamanho de `.empty-head` e da
`.auth-h` em mobile, isto é, do tamanho de um título de tela — e a saudação
não é o assunto de tela nenhuma, é moldura que aparece em todas. O par
`.hi` / `.greet .sub` passa de 20/12,5 para 18/13, e o bloco inteiro encolhe
de 41px para 39px de altura.

### 4. `.empty-hero h3` · 24 → **22px**

Caixa de 277px em 375px. "Tudo em dia por aqui." (a copy real da `/alertas`)
precisa de 241,2px a 24px, **221,1px a 22px** e 261,3px a 26px — uma linha
nos três, mas a folga vai de 35,8px para 55,9px indo a 22, e despenca para
**15,7px** indo a 26.

Vai para **22px**, por dois motivos que se somam: é o que sobra com margem
para copy um pouco mais longa em 375px, e é o tamanho que `.empty-head` já
usa nas telas irmãs (`/anuncios`, `/vendas`). Hoje os dois estados vazios do
app falam em tamanhos diferentes — 24 numa tela, 22 na outra — sem que nada
justifique a diferença. Passam a falar no mesmo.

---

## 7. Valores que podem ter motivo estrutural

Levantei todos os casos onde o tamanho pequeno pode estar segurando um
layout. Nenhum deles pode ser tocado antes de medir no navegador:

| Elemento | Hoje | Risco |
|---|---|---|
| `.rail-labels span` | 9.5px | `flex: 1` de 3 células; quebra de linha em 375px |
| `.nav-eyebrow` | 9.5px | sidebar de 76px abaixo de 900px |
| `.side-account .avatar` | 14px | inicial dentro de círculo de 34px fixo — a 15px ainda cabe, mas o centro óptico muda |
| `.passo-num` | 14px | número dentro de marcador de passo |
| `.pill` | 10px | `white-space: nowrap` + `padding: 4px 9px`; a 11px a pílula alarga |
| `.badge` | 10.5px | `width: max-content` com `0.18em` de tracking |
| `.metric .m-label` | 10px | três métricas lado a lado com `min-width: 0`; a 11px o rótulo pode quebrar antes |
| `.chip-lime` | 11.5px | chip com padding fixo |

Os seis últimos mudam ≤1px e a expectativa é que caibam. Os dois primeiros
são os da §6.

---

## 8. Onde a aparência muda de forma perceptível

Reunindo §5 e §6, as telas onde eu esperaria notar diferença:

- **Onboarding** (`/onboarding`) — a trilha (§6.1) e a bolha do chat
  (13.5 → 13). O rail é o ponto sensível da tela.
- **Sidebar, em qualquer tela** — `.nav-eyebrow` (§6.2) e `.nav-item`
  (14 → 15). São os elementos presentes em todas as telas logadas.
- **Topo de todas as telas logadas** — `.topbar .hi` 20 → 18 (§6.3).
- **Estados vazios** — `.empty-hero h3` (§6.4), mais `.eh-note` 12 → 11 e
  `.empty-body` 13.5 → 13. É a tela que mais muda no conjunto.
- **Painel** (`/inicio`) — `.metric .m-label` 10 → 11, `.m-value` 21 → 22,
  `.m-delta` 11 → 11. O bloco de métricas fica ligeiramente maior nas três
  linhas ao mesmo tempo, que é o tipo de mudança que se nota junto.
- **Cartão de campanha** (`.list-row`) — os números sobem de 12 para 13
  enquanto o título fica em 15; a diferença entre título e números diminui
  de 3px para 2px.
- **`.peca-*`** (17/16/14 → 18/15/13) — é o único bloco onde os três níveis
  se afastam de verdade: os intervalos passam de 1px/2px para 3px/2px. É
  melhora de hierarquia, mas é redesenho visível de um componente.

Onde eu **não** esperaria notar nada: telas de operador (`.diag-*`,
`.rev-*`, `.id-*`), formulários (`.field`), autenticação — quase tudo ali
mexe ≤0,5px.

---

## 9. O que a proposta não cobre — e por quê

### 9.1 Os cinco `clamp()` ficam fora da rampa

| Seletor | Valor | Uso |
|---|---|---|
| `.hero-num` | `clamp(56px, 11vw, 104px)` | o número que domina a faixa cobalto |
| `.hero-destaque .hero-frase` | `clamp(26px, 3.4vw, 40px)` | frase-título quando não há número |
| `.hero-destaque .hero-legenda` | `clamp(15px, 1.8vw, 19px)` | o rótulo em lima |
| `.hero-destaque .hero-sub` | `clamp(14px, 1.5vw, 16px)` | linha de apoio |
| `.hero-phrase` | `clamp(24px, 2.6vw, 34px)` | **sem uso** — ver 9.4 |

São tipografia de display, fluida de propósito: existem porque precisam
encolher em 375px. Encaixá-las numa rampa de UI seria inventar um sistema
que não é o delas. **Proponho declará-las como papéis fluidos nomeados no
`DESIGN.md`** — o detector lê `clamp()` em papel declarado e libera as duas
pontas automaticamente (`addClampEndpoints`, linha 390) — e dar token a
cada uma, para que a regra "nenhum tamanho fora do `:root`" continue
literalmente verdadeira.

Anotação, não proposta: `.hero-frase` (26→40) e `.hero-phrase` (24→34) são
duas rampas quase idênticas para o mesmo papel, e `.hero-legenda` (15→19) e
`.hero-sub` (14→16) também. Unificar cada par reduziria cinco fluidos a
três — mas é mudança visível, e não é deste lote.

### 9.2 `code { font-size: 0.92em }` fica como está

É relativo, não é um degrau. Medido: o detector não julga `em` — a regra é
`/^-?[\d.]+(?:px|rem)$/` (linha 23), então `0.92em` retorna `unjudgeable` e
passa. Confirmei rodando: `0.92em` não gerou achado com a rampa de teste
ligada. Não precisa de exceção nem de token.

### 9.3 `lp.css` não está neste lote, mas é afetado

`app/(marketing)/lp.css` tem 51 declarações em 21 valores, incluindo 9.5,
11.5, 12.5, 13.5, 14.5, 16.5, 17.5, 19, 62px e três `clamp()` próprios. Ele
é importado só por `app/(marketing)/page.tsx`.

**O problema:** declarar `typography.scale` no `DESIGN.md` liga a regra para
todo arquivo que o detector varrer. Se a varredura incluir `app/`, a landing
passa a reprovar em massa.

> **DECISÃO (19/08/2026): `lp.css` fica de fora, ignorado via
> `.impeccable/config.json` → `detector.ignoreFiles`.**
>
> A landing é peça de marketing com escala editorial própria — ela tem `62px`
> e três `clamp()` que não existem em lugar nenhum do app, porque a página
> tem um trabalho diferente. Forçá-la na rampa do app não melhoraria nenhuma
> das duas. As alternativas descartadas foram escopar a varredura (frágil:
> depende de quem lembra de passar o caminho certo) e trazer a landing para
> o lote (dobra o trabalho e mexe em página em produção em
> `v2gmidia.com.br`).
>
> O que essa decisão custa: a landing continua com 21 valores distintos e
> **sem ferramenta que a vigie**. Isso é dívida assumida, não resolvida. Se
> um dia ela ganhar escala própria, é `DESIGN.md` próprio, não este.

**Aplicado e testado dos dois lados** (19/08/2026). Com o
`.impeccable/config.json` no lugar, `detect.mjs` na `lp.css` devolve **0
achados**. Com o arquivo de config temporariamente removido, a mesma
varredura devolve **32 achados, todos `design-system-font-size`**.

Os dois lados importam: só o zero não provaria nada — poderia significar que
a regra nunca alcança aquele arquivo, e não que o ignore funciona. E os 32
são o tamanho exato da dívida que a decisão aceita.

### 9.4 CSS morto encontrado no caminho

`.hero-phrase` e `.hero-card` **não têm nenhuma ocorrência** em `app/` ou
`components/` (medido por varredura em `.tsx`). O `clamp(24px, 2.6vw, 34px)`
é, portanto, o único dos 28 valores que hoje não pinta nada. Registro o
achado e **não removo nada**: pela regra do projeto, a pergunta não é quem
chama isto hoje, é o que dependeria disto depois, e essa pergunta não é
deste lote.

---

## 10. Divergência com `padrao-visual.md` §2 — e por que a proposta de lá não serve

Não toquei nesse arquivo. Mas ele registra uma escala de sete degraus,
marcada como *não aplicada*, e este lote precisa engatar nela ou explicar
por que não. É por que não, por dois motivos medidos.

**Divergência de contagem, primeiro.** `padrao-visual.md` §2 registra "136
declarações em 27 valores distintos". Eu meço **162 declarações em 28
valores**. A diferença não é erro de um dos dois: o arquivo cresceu depois
daquela medição — os blocos `.rev-*` (revisão de perfil) e `.id-*` (upload
de identidade) são posteriores, e sozinhos explicam boa parte dos 26
declarações a mais. Registro a medição nova aqui e **não reescrevo a de
lá**, que é o registro de quando foi feita.

**A proposta de sete degraus, segundo.** Ela é:

```
--fs-micro 11 · --fs-sm 12.5 · --fs-body 14 · --fs-lead 16 · --fs-h2 20 · --fs-h1 26 · --fs-hero clamp()
```

Dois problemas, os dois verificáveis:

1. **`--fs-body: 14px` move a âncora.** 13px é o valor mais usado do arquivo
   (32 declarações). A proposta de lá sobe todas para 14 e sobe 13.5 junto —
   42 declarações mudando para acomodar um degrau que a regra do próprio
   lote ("o tamanho usado 40 vezes é âncora") diz para não mexer.
2. **Os degraus de baixo estão a 1,5px um do outro** (11 → 12.5 → 14). Com a
   tolerância de 0,5px medida na §4, `11.5` fica válido por causa do `11`,
   `12` por causa do `12.5`, `13` e `13.5` por causa do `14`. **Aplicada,
   essa rampa não impediria nenhum dos meio-pixels de voltar** — que é a
   razão pela qual o lote existe.

Se a proposta de 6 degraus for aprovada, o §2 do `padrao-visual.md` fica
descrevendo um estado que deixou de valer. Ele é documento que descreve
estado, então envelhece com o estado — mas **eu não mexo nele sem você ver
a mudança antes**, como combinado.

---

## 11. O limite honesto: o que a escala impede e o que não impede

O objetivo declarado do lote é que o detector "passe a reprovar tamanho novo
fora do sistema, que é o que impede o problema de voltar". Medi até onde
isso é verdade, e não é até o fim.

**O que fica impedido** (medido, com rampa `11/13/15`): `9.5px`, `10px`,
`12px`, `14px`, `20px` — reprovados.

**O que continua passando** (medido, mesma rampa): `11.5px`, `12.5px`,
`13.5px`, `14.5px` — todos dentro dos 0,5px de tolerância de um degrau.

Ou seja: **a rampa impede o desvio de 1px ou mais, e não impede o desvio de
meio pixel** — que é exatamente a forma que este problema teve.

O que de fato impede é outra coisa, e é trivial: depois do passo 2, **não
existe mais nenhum literal de `font-size` fora do `:root`**. Qualquer
literal que reapareça é regressão, independentemente do valor, e isso é uma
linha de verificação:

```bash
grep -n "font-size:" app/globals.css | grep -v "var(--fs-" | grep -v "0.92em"
```

Depois do passo 2 essa varredura deve devolver **só as seis linhas de
definição dentro do `:root`**. Proponho que essa seja a guarda registrada no
`DESIGN.md`, ao lado da rampa — porque é ela que pega o meio pixel, não o
detector.

---

## 12-A. O passo 2, aplicado em 19/08/2026

A rampa de seis foi aprovada e está no CSS. O que ficou registrado abaixo é
medição, não plano — não reescrever quando o estado mudar.

### O que entrou

Doze tokens no `:root`: os seis degraus, os cinco fluidos do herói e o
`--fs-code`. **162 declarações** trocadas por `var(--fs-*)`, distribuídas
assim — e a distribuição bate declaração a declaração com o mapeamento da §5:

| Token | Decl. | Absorveu |
|---|---:|---|
| `--fs-legenda` | 40 | 9.5, 10, 10.5, 11, 11.5 e os oito 12px de cor `--ink-mute` |
| `--fs-corpo` | 77 | 12 (os dez restantes), 12.5, 13, 13.5 e os seis 14px de parágrafo |
| `--fs-titulo` | 26 | 14 (os onze de título), 14.5, 15, 15.5, 16 |
| `--fs-bloco` | 5 | 17, 18, 20 |
| `--fs-tela` | 5 | 21, 22, 24 |
| `--fs-destaque` | 3 | 26, 27 |
| `--fs-hero-*` | 5 | os cinco `clamp()`, um token cada |
| `--fs-code` | 1 | o `0.92em` |

Verificado que nenhum token é usado sem estar definido e nenhum é definido
sem ser usado: **12 definidos, 12 usados, zero órfãos dos dois lados.**

### A guarda

```
$ grep -n "font-size:" app/globals.css | grep -v "var(--fs-"
(nada)
```

Zero literais fora do `:root`. É esta linha, não o detector, que pega o meio
pixel de volta.

### O detector, os dois lados

Baseline antes do lote: **5 achados** (3 `side-tab`, 1 `layout-transition`,
1 `codex-grid-background`), nenhum de tipografia — a regra estava desligada,
e confirmei com um `font-size: 37.3px` de teste que passava sem achado.

Depois: **os mesmos 5 achados**. Nenhum novo, e nem os `clamp()` nem os
tokens do `:root` foram sinalizados.

Com a rampa ligada, num arquivo de teste:

| Escrito | Resultado |
|---|---|
| `font-size: 12px` | **reprova** |
| `font-size: 14px` | **reprova** |
| `font-size: 9.5px` | **reprova** |
| `font-size: clamp(56px, 11vw, 104px)` cru | **reprova** (pontas fora da rampa) |
| `font-size: 13px` | passa (é degrau) |
| `font-size: var(--fs-corpo)` | passa |
| `font-size: var(--fs-hero-num)` | passa |
| `font-size: 11.5px` | **passa** — o limite dos 0,5px, como previsto na §11 |
| `color: #ff00aa` | **reprova** |

A última linha é o segundo lado do teste, e ela é o motivo de estar aqui: se
a regeneração do `DESIGN.md` tivesse quebrado o frontmatter, `parseFrontmatter`
devolveria `null` em silêncio e **tudo** passaria — inclusive o `#ff00aa`.
Ele reprovando prova que o arquivo continua legível.

### O erro que o próprio script pegou

A primeira geração do `DESIGN.md` saiu com **cinco** degraus. O
`--fs-legenda` sumiu sem erro nenhum.

Causa: o comentário que documenta a escala dentro do `:root` contém a frase
`--fs-corpo: 13px era o valor mais usado`, e o regex do gerador casou dentro
do comentário — consumindo tudo até o primeiro `;`, que era a declaração
seguinte. Uma linha de prosa engoliu uma declaração real.

Só apareceu porque o gerador passou a **imprimir o que pulou**. Sem essa
linha de log, o `DESIGN.md` teria ficado com cinco degraus e o `11px` — 40
declarações — passaria a reprovar em toda varredura futura.

Corrigido na causa: o gerador agora remove comentários antes de varrer,
substituindo por espaço para os índices continuarem valendo. Vale para as
cores também, que corriam o mesmo risco e ninguém tinha notado.

### Renderização, medida no navegador

Servidor em `localhost:3000`, `/entrar`, recarregada depois da troca.

Tokens resolvem: `--fs-legenda: 11px`, `--fs-corpo: 13px`,
`--fs-titulo: 15px`, `--fs-bloco: 18px`, `--fs-tela: 22px`,
`--fs-destaque: 26px`, `--fs-hero-num: clamp(56px, 11vw, 104px)`,
`--fs-code: .92em`.

Computado, elemento a elemento — todos no degrau esperado:

`.auth-h` 26px · `.auth-sub` 13px · `.field label` 11px · `.field input` 15px
· `.field .note` 11px · `.cta` 15px · `.auth-foot` 13px · `.link-btn` 13px ·
`.wordmark .wm` 18px · `.wordmark .wm small` 11px.

**Em 375px:** `matchMedia('(max-width: 620px)')` ativo, `.auth-h` cai para
22px pelo override, **nenhuma rolagem horizontal** (`scrollWidth` 375 =
viewport) e **nenhum elemento transbordando** a própria caixa numa varredura
de toda a página.

**A trilha do onboarding em 375px**, remontada com marcação e classes reais:
`--fs-legenda` aplicado, células de 109,7px, rótulos 1 e 2 em uma linha,
rótulo 3 em duas — **igual ao que era a 9,5px**. A faixa passa de 20px para
24px de altura. Nenhuma quebra nova, como a §6.1 previu.

**O `.nav-eyebrow` em 800px**, onde `--sidebar-w` vale 76px: caixa de texto
de 20px, texto renderizado em 63,3px na linha mais larga, **transbordando
43,3px**, em duas linhas. Confirmado ao vivo o que a §6.2 mediu — e
confirmado que o transbordo é anterior a este lote, não consequência dele.
Está em tarefa separada.

### As telas logadas, percorridas em 19/08/2026

Feito no Chrome do usuário, com sessão real, em 1536px, tema escuro do
sistema. Sete telas: `/inicio`, `/anuncios`, `/vendas`, `/alertas`, `/conta`,
`/whatsapp-business`, `/aprovar`, `/processando`.

**Método da varredura.** Em cada tela, todo elemento que pinta texto próprio
teve o `font-size` computado comparado com os seis degraus. Não é conferência
de declaração — é do que o navegador desenhou. Foi assim que apareceram as
duas coisas abaixo, que o levantamento por CSS não tinha como pegar.

**O que passou:** em todas as sete telas, o único texto fora dos degraus são
os `clamp()` do herói no seu máximo (40px em 1536px), que é o desenho deles.

**A escala lê bem onde dá para ver.** As duas telas de estado vazio agora
falam no mesmo tamanho: `.empty-head` da `/anuncios` e `.empty-hero h3` da
`/alertas` estão as duas em 22px, contra 22 e 24 antes. A hierarquia de três
níveis do `/alertas` (22 / 13 / 11) se distingue sem esforço.

#### Achado 1 — `.pc-title` renderiza a 16px, e não tem regra nenhuma

A classe é aplicada em três lugares (`alertas/page.tsx:140`,
`conta/page.tsx:270` e `:281`) e **não existe no `globals.css`**. Sem regra, o
`<b>` herda do `body`, que nunca teve `font-size` e portanto vale o padrão do
navegador: **16px**, que não é degrau nenhum.

Meu levantamento não podia achar isso: ele contou declarações, e aqui o
defeito é a ausência de declaração. Só apareceu na varredura do que foi
desenhado.

Não é regressão — sempre foi 16px. Mas contradiz a frase "nenhum tamanho fora
do sistema", então fica registrado. O degrau natural é `--fs-titulo` (15px,
−1px): é título de card acima de um parágrafo, o mesmo papel do
`.section-title h2`.

#### Achado 2 — `.stepper .split-tag` nunca teve efeito

A regra `.stepper .split-tag` declara `--fs-legenda`. O elemento renderiza a
**13px**, não 11px.

Causa: no `processando/page.tsx:146` o `.split-tag` é um `<span>` dentro do
`.s-copy`, e `.stepper .s-copy span` (especificidade 0,3,0) vence
`.stepper .split-tag` (0,2,0).

**Isso é anterior ao lote**: antes o par era `12.5px` contra `10px`, com a
mesma relação de especificidade — a etiqueta nunca renderizou a 10px. A regra
está no arquivo desde sempre e nunca pintou nada. O levantamento a contou
como uma das sete etiquetas de 10px; ela era uma etiqueta de 12,5px
disfarçada.

Consertar é uma linha (`.stepper .s-copy .split-tag`), mas muda a renderização
em −2px, que é mais do que 1px e portanto não entra sem decisão — a mesma
régua da §6.

**Não varri as outras.** Existem 29 regras de `font-size` com descendente por
tag (`.alert-card p`, `.empty-hero p`, `.escolhido > span`, `.passos p`…), e
qualquer classe de especificidade menor dentro desses containers cai no mesmo
buraco. O `.passo-aviso` era outro caso e sobrevive porque tem `!important` —
o que agora se entende: o `!important` estava lá justamente para vencer o
`.passos p`. Descobrir os demais exige a mesma varredura de computado contra
declarado, tela por tela, com dado que as exercite.

#### Achado 3 — a faixa cobalto tem texto quase preto no tema escuro

Fora do escopo e não causado por este lote (que só mexeu em tamanho), mas
medido e grave demais para não registrar.

Na `/whatsapp-business`, com o tema escuro do sistema:

| | Computado |
|---|---|
| Fundo da `.hero-destaque` | `rgb(2, 57, 199)` — o cobalto escuro |
| `.hero-frase` | `rgb(5, 10, 19)` — `--offwhite`, que no escuro é quase preto |
| `.hero-note` e `.eyebrow` | `rgba(12, 21, 35, 0.72)` — `--surface-rgb`, idem |

A faixa usa `--offwhite` e `--surface-rgb` como **tinta** sobre uma superfície
que continua escura nos dois temas. Quando esses tokens viram escuros no modo
escuro, a tinta vira escura junto e some no azul. É o modo de falha que o
próprio comentário do `globals.css` descreve, ao contrário: em vez de pintar
superfície com token de acento, pinta acento com token de superfície.

O `.navy-card` resolve o mesmo problema com `--plate-ink`, que é claro nos
dois temas. Provavelmente é para lá que a faixa deve apontar. **Não mexi** —
é cor, e cor não é deste lote.

#### O que continua sem confirmação visual

`.metric`, `.list-row`, `.peca-*` e `.stepper` **não têm dado nesta conta** —
ela está no dia zero, sem campanha e com a peça ainda sem texto. Renderizei os
quatro num banco de prova, com a marcação e as classes reais na página real,
texto de exemplo declarado como tal:

- **Métricas** — `CONVERSAS` 11 / `37` 22 / `+12 esta semana` 11. O número
  domina, o rótulo e o delta recuam.
- **Cartão de campanha** — título 15, contagem 11, números 15 com rótulo 13,
  frescor 11.
- **`.peca-*`** — 18 / 15 / 13, contra 17 / 16 / 14 antes. É o componente que
  mais muda, e muda para melhor: os intervalos passam de 1px e 2px para 3px e
  2px, e os três níveis finalmente se separam.
- **Stepper** — onde apareceu o achado 2.

Banco de prova não é a tela. O que ele prova é a relação entre os tamanhos;
não prova como fica com dado real, em quantidade real.

### O que não foi verificado, e por quê

**Só o tema escuro foi visto.** As sete telas foram percorridas com o tema
escuro do sistema. O tema claro não foi conferido em tela nenhuma — os
tamanhos são os mesmos, mas contraste e peso óptico não são, e a faixa
cobalto do achado 3 é prova de que os dois temas divergem de formas que só
aparecem olhando.

**Só 1536px.** As sete telas foram vistas em desktop largo. Os 375px foram
confirmados por medida (sem rolagem horizontal, sem transbordo, trilha do
onboarding sem quebra nova), mas não por captura — e a trilha é justamente o
componente com a menor folga do app, 8,1px no primeiro rótulo.

**Quatro componentes sem dado real**, listados acima: `.metric`,
`.list-row`, `.peca-*` e `.stepper`.

**O que não foi tocado**, como combinado: peso (a Archivo continua
400/600/700), cor, espaçamento, raio, layout, copy.

---

## 12-B. Duas coisas que a escala criou, e ficaram em aberto

**`.passo-aviso` e `.passos p` agora têm o mesmo tamanho.** Eram 13 e 14px —
o aviso deliberadamente menor que o parágrafo do passo. Os dois caíram em
`--fs-corpo`, e o `!important` do `.passo-aviso` (o único do arquivo) virou
inerte. A distinção não se perdeu de todo: o aviso continua separado por
`border-left` e por `color: var(--ink-soft)`. Mas se você quiser o aviso
menor de novo, o degrau dele é `--fs-legenda`, e isso é −2px — decisão sua,
e não estava na lista das quatro.

**`.navy-card .nc-head` e `.navy-card p` também empataram**, em 13px, vindos
de 13 e 12,5. Ali a hierarquia sobrevive pelo peso: o `nc-head` é
`font-weight: 700` na `--display`. Anotado por honestidade, não como
problema.

---

## 12-C. O que continua descrevendo estado antigo

`padrao-visual.md` §2 descreve os 23 tamanhos e a rampa de sete degraus como
se fossem o presente. **Nada disso vale mais**, e eu não mexi no arquivo —
está combinado que ele não muda sem você ver antes.

O que eu proporia: trocar o §2 inteiro por um ponteiro para este documento,
e não encostar em mais nada — a tabela do §1 (a faixa cobalto), a escala de
raio do §3, a espessura do §4 e o resto continuam válidos e são medição
daquela data.

---

## 13. Achado fora do escopo, para não se perder

`var(--linha)` é usado **7 vezes** (linhas 1925, 1957, 1964, 1971, 1978,
1985, 2004) e **nunca é definido** — o token existente é `--line`. Custom
property indefinida invalida a declaração no cálculo, então essas sete
bordas caem para `currentColor`: aparecem na cor do texto em vez da linha
fina. Afeta as telas `.rev-*` (revisão de perfil pelo operador) e
`.btn-linha`.

**Desde quando**, medido no histórico:

- As sete entraram **de uma vez**, em `f48ac4d` — *"Tela de revisao da
  proposta e o aplicar em transacao unica"*, **18/08/2026 11:58**.
  `git log -S"--linha"` devolve esse commit e nenhum outro, o que significa
  que o número de ocorrências nunca mudou depois: ninguém acrescentou nem
  removeu.
- `git log -S"--linha:" --all` devolve **vazio**: o token nunca foi definido
  em commit nenhum, em arquivo nenhum. Não é regressão de renomeação — é
  defeito de nascença.
- Três commits tocaram o `globals.css` depois (`37fa40d`, `a107699`,
  `f86cb8d`) e nenhum pegou.

Ou seja: **as bordas das telas de revisão de perfil nunca renderizaram
certo, desde ontem**, que é quando a tela foi escrita. Está em tarefa
separada, rodando em worktree próprio
(`.claude/worktrees/suspicious-liskov-b8045c`) — sem conflito com as edições
deste lote no `globals.css` da árvore principal.
