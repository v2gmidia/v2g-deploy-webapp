# Contraste nos dois temas — medição e desenho

**Lote QA-4. Este documento é o passo 1: medição e proposta. Nada foi
alterado no CSS nem no TSX.**

Medido em 20/08/2026 sobre o `app/globals.css` do commit `6834136`.

---

## 1. Como foi medido, e contra o que

O QA mediu navegando com uma conta. Eu não tenho sessão e não peço senha,
então montei uma bancada: o DOM real de **23 telas**, extraído dos `.tsx`
com o compilador do TypeScript (não `grep`, não regex), servido por HTTP
com o `app/globals.css` real linkado, e cada elemento medido com
`getComputedStyle()` no navegador.

O que a bancada calcula por elemento:

- a **tinta efetiva**, com o alfa da cor e o `opacity` de cada ancestral
  multiplicado ao longo da cadeia;
- o **fundo composto**, empilhando o `background-color` de cada ancestral
  da raiz até o elemento, cada camada com seu próprio alfa;
- a razão de contraste da WCAG 2.1, e o mínimo que se aplica ali — 4,5:1
  para texto normal, 3:1 para texto grande (≥24px, ou ≥18,66px em 700) e
  3:1 para ícone e anel de foco.

Ramo condicional entra pelos **dois lados**: onde a tela escolhe entre
estado cheio e estado vazio, a bancada renderiza os dois. É por isso que
apareceu coisa que o QA não viu — ele mediu o estado em que a conta dele
estava.

### Por que contra o `6834136`, e não contra a árvore de trabalho

Porque o QA mediu **produção**, e produção é o commit. Enquanto eu media,
a sessão do QA-1 já tinha 181 linhas novas no `globals.css` da árvore de
trabalho. Medir ali seria medir o trabalho em curso deles e chamar de
"antes".

A bancada usa um `git archive HEAD` extraído para fora do repositório.
Nada do que o QA-1 está fazendo entra nos números abaixo.

### O que isto NÃO cobre

- **A `(marketing)`**, que tem folha própria (`lp.css`). Fora da medição.
- **Dado real do banco.** Onde o texto vem do banco, a bancada põe um
  texto de amostra. Dado não pinta nada — o que pinta é tag, classe e
  aninhamento, e esses são os reais.
- **Aparelho de verdade.** Tudo foi medido em navegador de desktop.

---

## 2. A bancada foi conferida contra a página real

Um instrumento não medido não é instrumento. A `/entrar` é pública, então
dá para medir dos dois jeitos e comparar.

Catorze elementos, tema escuro, 1280px — bancada contra a página servida
pelo `next dev`:

| elemento | página real | bancada |
|---|---:|---:|
| `span.wm` "V2G" | 17,15 | 17,15 |
| `small` "Tráfego no piloto" | 4,72 | 4,72 |
| `h1.auth-h` | 15,84 | 15,84 |
| `p.auth-sub` | 8,28 | 8,28 |
| `label` (×4) | 15,84 | 15,84 |
| `p.note` | 8,28 | 8,28 |
| `div.auth-foot` | 4,36 | 4,36 |
| `button.link-btn` "Entrar" | **2,10** | **2,10** |
| `b.title` | 14,06 | 14,06 |
| `p` do `.proof-card` | 7,35 | 7,35 |

Catorze de catorze, valor idêntico. É o que autoriza usar a bancada nas
telas que eu não consigo abrir.

### Dois erros do meu próprio instrumento, achados e corrigidos

Registro porque os dois produziam achado falso, e achado falso gasta o seu
tempo:

1. **`.ec-step` tem `animation: ec-in`.** Em iframe que nunca entrou na
   tela a animação não roda, e o `opacity` computado fica no quadro
   inicial: zero. Isso gerava 17 "defeitos" de contraste 1,00 nas telas de
   expectativas e onboarding. Não é defeito do app.
2. **`<Marca>` sem `href` é ramo morto.** A bancada renderiza os dois
   lados do ternário, e o lado `<div>` não existe em lugar nenhum — as
   três chamadas passam `href`. Ele gerava "V2G em navy sobre o cobalto,
   2,28:1" em 9 telas. Também não é defeito do app: no elemento real,
   `.side-brand .wm` vence e a tinta é branca.

Um terceiro erro foi de método, no meio do caminho: para medir `:hover` e
`:focus-visible` eu comecei aplicando as declarações por `style` inline,
o que **atropela a cascata** e me deu anel lima sobre branco em lugares
onde ele não existe. O jeito certo, e o que está nos números da §7, foi
clonar cada regra trocando o pseudo por uma classe — pseudo-classe e
classe têm a mesma especificidade (0,1,0), então a cascata continua
decidindo.

---

## 3. Onde eu bato com o QA, e onde divirjo

### Bate, no valor exato

| caso do QA | QA | meu | confere |
|---|---:|---:|:--:|
| Badge "Nada pendente", escuro | 1,12 | **1,12** | sim |
| Links azuis, escuro | 2,1 | **2,10** | sim |
| "Chamar no WhatsApp →" em card, escuro | 1,87 | **1,87** | sim |
| Cinza de apoio, escuro | 4,36 | **4,36** | sim |

E o diagnóstico dele — *o azul da marca não tem variante para fundo
escuro* — está certo. É a causa isolada de 17 dos 53 grupos de falha do
tema escuro.

### Diverge, e a divergência importa

**"No modo claro o único caso fora do mínimo é o cinza de apoio."** Não é.
No claro há **65 grupos** de falha, e o cinza é só um deles. Os outros
incluem:

| caso | claro | escuro |
|---|---:|---:|
| `.pill.ok` — selo verde | **2,96** | 7,49 |
| `.pill.warn` — selo âmbar | **3,01** | 7,46 |
| `.pill.crit` — selo vermelho | **3,95** | 5,99 |
| `.pill.off` — selo neutro | **3,10** | **3,76** |
| `.pill.info` — selo azul | 6,64 | **1,87** |
| `.form-error` — erro de formulário, 9 telas | **3,95** | 5,99 |
| `.nav-eyebrow` "SEU NEGÓCIO" na sidebar | **2,05** | 7,56 |
| `.rev-de` sobre a faixa cobalto | **2,05** | **2,07** |
| `.cta.ghost` no hover | **1,42** | **1,33** |

Repare no formato disso. Os selos de severidade **falham no claro e passam
no escuro** — menos o `.info`, que faz o contrário. Se o conserto tivesse
sido desenhado só olhando o escuro, quatro dos cinco selos continuariam
quebrados e ninguém teria percebido, porque no escuro eles estão bem.

É exatamente a armadilha que o `globals.css` já registra: **conserto que
arruma um tema e piora o outro só aparece se os dois forem medidos.**

---

## 4. As causas, e não os sintomas

271 elementos falham no escuro e 297 no claro, mas não são 568 problemas.
São **seis**.

### Causa 1 — o cobalto não tem tinta para fundo escuro

`--cobalt` é usado como **tinta** em 26 regras (`color:`) e em mais 5 como
**anel de foco** (`outline:`). No tema escuro `--cobalt` é `#0239C7`, e
sobre as superfícies escuras isso dá de 1,86 a 2,28:1.

(Há outras 11 regras com `--cobalt` em `border-color` e `accent-color`.
Borda não é tinta e tem mínimo de 3:1 — ficam fora desta causa.)

Alcance medido, tema escuro — 17 grupos, incluindo:

| onde | contraste |
|---|---:|
| `a.wa` "Chamar no WhatsApp →" sobre `--warn-soft` | 1,86 |
| `a.wa` sobre `--ice-soft` (12 telas) | 1,87 |
| `.pill.info` | 1,87 |
| ícones `svg` com `currentColor` (14 telas) | 2,10 |
| `a.auth-help` "Falar com uma pessoa" (11 telas) | 2,10 |
| `b` "Ler os combinados", "Conferir seus dados" | 2,10 |
| `button.link-btn` "→ Entrar" | 2,10 |
| `a` "Ver todas →" sobre `--canvas` | 2,28 |

No claro o mesmo token dá 6,05 a 7,38:1. O tema claro não tem esse
problema, e é por isso que ele nunca apareceu.

### Causa 2 — `--navy` faz papel duplo, e um dos dois vira no escuro

`.badge { color: var(--navy); background: var(--lime) }`.

No escuro `--navy` vira `#E9EFF8` — quase branco, porque ali ele é **cor
de texto**. Mas `--lime` continua claro (`#D5EF25`), porque ali ele é
**superfície**. Quase-branco sobre amarelo: **1,12:1**.

O próprio `globals.css` já avisa disso, no comentário do `--plate`:
*"`--navy` faz o papel duplo de tom escuro da marca e cor de texto"*.

E o app já tem a versão certa, três linhas acima: `.chip-lime` usa o mesmo
fundo lima com `color: var(--black)` — e `--black` **não** é redefinido no
escuro, de propósito. `.chip-lime` dá 17,56 no claro e 15,34 no escuro.
Dois componentes quase idênticos; um certo, um errado.

### Causa 3 — tinta de página usada sobre superfície de marca

Dois lugares do app têm fundo que não é a superfície de leitura: a
**sidebar cobalto** e a **faixa cobalto**. Os dois têm convenção própria de
tinta. Dois elementos não seguiram.

**`.nav-eyebrow` — e este é o caso mais feio do lote.** A regra certa
existe, está escrita, e está **inerte**:

```css
/* linha 665 — sob o comentário que diz por que estas regras existem */
.nav-eyebrow { color: rgb(255 255 255 / 0.5); }

/* linha 1445 — mesma especificidade (0,1,0), vem depois, VENCE */
.nav-eyebrow { …  color: var(--ink-mute);  … }
```

Resultado medido: `#78899A` sobre o cobalto, **2,05:1**, em 9 telas.

Duas coisas de uma vez. A primeira é a classe de bug que a
`arquitetura.md` já registra — *token declarado, correto e inerte, porque
a regra que vence na cascata é outra; nem o grep nem o detector percebem*.
A segunda é que **mesmo a regra inerte não passaria**: branco a 50% sobre
o cobalto dá 2,91:1. Arrumar a cascata sem arrumar o valor deixa o defeito
de pé.

O valor que serve já existe: `--sidebar-ink` (branco a 78%) dá **5,06:1**
no claro e 7,56:1 no escuro, e é o que a sidebar usa em todo o resto.

**`.rev-de` sobre a faixa cobalto.** `.rev-de { color: var(--ink-mute) }`,
e ele vive dentro de `.hero-destaque .hero-num`. Dá 2,05 no claro e 2,07
no escuro. A faixa já tem convenção — `.hero-destaque .eyebrow` e
`.hero-note` usam `rgb(var(--white-rgb) / 0.72)`, que mede 4,53 no claro e
5,19 no escuro.

### Causa 4 — `--ink-mute` está abaixo do mínimo nos dois temas

É o caso que o QA achou, e é o de maior alcance: **33 grupos no escuro, 30
no claro.**

| | sobre `--canvas` | sobre `--surface` |
|---|---:|---:|
| claro `#78899A` | **3,30** | **3,56** |
| escuro `#6C7D95` | 4,72 | **4,36** |

Vale para nota de rodapé, legenda, contagem, rótulo de campo, texto de
estado vazio — o texto de apoio do app inteiro, quase todo em 11px, para
um público de 40+ lendo no celular.

### Causa 5 — estados, que o QA não cobriu

Está na §7, com os números.

### Causa 6 — `opacity` decorativa comendo o contraste

`.rev-item.decidido { opacity: 0.72 }` apaga um campo já decidido na
`/revisar-proposta`. O conteúdo continua sendo conteúdo — não é controle
desligado —, e a opacidade derruba oito grupos de 3,56 para **2,32** no
claro e de 4,36 para **2,89** no escuro.

Isto é diferente das outras cinco: não se conserta trocando token, e mexer
em `opacity` fica na fronteira do "só cor". **Não estou propondo mexer nele
neste lote** — está aqui registrado, e você decide.

---

## 5. Tema escuro — os 53 grupos, por causa

Cada linha é um par (tinta, fundo) distinto. `n` é em quantas telas
aparece.

| razão | mín | elemento | tinta | fundo | n | causa |
|---:|---:|---|---|---|---:|:--:|
| 1,12 | 4,5 | `span.badge` "Nada pendente" | `#E9EFF8` | `#D5EF25` | 1 | 2 |
| 1,86 | 4,5 | `a` "Fala com a gente" | `#0239C7` | `#2A1F0A` | 1 | 1 |
| 1,86 | 4,5 | `a.wa` (sobre `--warn-soft`) | `#0239C7` | `#2A1F0A` | 1 | 1 |
| 1,87 | 4,5 | `a.wa` "Chamar no WhatsApp →" | `#0239C7` | `#0E2231` | 12 | 1 |
| 1,87 | 4,5 | `span.ms-tag` "Enquanto isso" | `#0239C7` | `#0E2231` | 1 | 1 |
| 1,87 | 4,5 | `span.pill.info` | `#0239C7` | `#0E2231` | 1 | 1 |
| 1,87 | 4,5 | `b.ec-swap-label` | `#0239C7` | `#0E2231` | 1 | 1 |
| 1,87 | 4,5 | `span.now` (trilho) | `#0239C7` | `#0E2231` | 2 | 1 |
| 1,87 | 3 | `svg` (ícone) | `#0239C7` | `#0E2231` | 2 | 1 |
| 2,07 | 4,5 | `span.rev-de` na faixa cobalto | `#6C7D95` | `#0239C7` | 1 | 3 |
| 2,10 | 4,5 | `b` "Ler os combinados" | `#0239C7` | `#0C1523` | 3 | 1 |
| 2,10 | 3 | `svg` (ícone) | `#0239C7` | `#0C1523` | 14 | 1 |
| 2,10 | 4,5 | `a` "ver tudo que a IA já fez" | `#0239C7` | `#0C1523` | 7 | 1 |
| 2,10 | 4,5 | `a.auth-help` "Falar com uma pessoa" | `#0239C7` | `#0C1523` | 11 | 1 |
| 2,10 | 4,5 | `button.ec-doubt` | `#0239C7` | `#0C1523` | 1 | 1 |
| 2,10 | 4,5 | `p.qcount` | `#0239C7` | `#0C1523` | 1 | 1 |
| 2,10 | 4,5 | `button.link-btn` "→ Entrar" | `#0239C7` | `#0C1523` | 1 | 1 |
| 2,28 | 4,5 | `a` "Ver todas →" | `#0239C7` | `#050A13` | 1 | 1 |
| 3,76 | 4,5 | `span.pill.off` | `#6C7D95` | `#1A2331` | 2 | 4 |
| 3,87 | 4,5 | `span` do trilho | `#6C7D95` | `#0E2231` | 2 | 4 |
| 4,20 | 4,5 | `span.pill.off` | `#6C7D95` | `#131922` | 1 | 4 |
| 4,29 | 4,5 | `code` | `#6C7D95` | `#111720` | 1 | 4 |
| 4,36 | 4,5 | 21 grupos de texto de apoio | `#6C7D95` | `#0C1523` | — | 4 |
| 4,45 | 4,5 | `.rc-ajuda`, `.rc-pend-nota` | `#6C7D95` | `#0D131C` | 1 | 4 |

Os 21 grupos em 4,36 são: `.lr-pecas`, `.eh-note`, `.foot-line`,
`.btn-linha.fraco`, `.id-vazio`, `b` "Pausar os anúncios", `.dc-rotulo`,
`.diag-meta`, `.espera-id`, `.espera-neutro`, `.espera-motivo`,
`.rev-coluna`, `.rev-etiqueta`, `.rev-dica`, `.rev-quem`, `.card-note`,
`.mission-tag`, `.text-fallback`, `.eyebrow`, `.split-tag`, `.st-note`,
`.auth-foot`.

Mais 5 grupos dentro do `.rev-item.decidido` (causa 6), de 2,75 a 2,89.

---

## 6. Tema claro — o que o QA não viu

65 grupos. Os que não são o cinza de apoio:

| razão | elemento | tinta | fundo | n |
|---:|---|---|---|---:|
| 2,05 | `span.nav-eyebrow` "SEU NEGÓCIO" | `#78899A` | `#0743DC` | 9 |
| 2,05 | `span.rev-de` na faixa cobalto | `#78899A` | `#0743DC` | 1 |
| 2,18 | `span.pill.off` (com `opacity`) | `#99A6B3` | `#EFF1F2` | 1 |
| 2,19 | `span.pill.ok` (com `opacity`) | `#62B684` | `#E9F5EE` | 1 |
| 2,73 | `span.pill.crit` (com `opacity`) | `#D27772` | `#F9EBE9` | 1 |
| 2,88 | `span.pill.off` | `#78899A` | `#E1E7E9` | 1 |
| 2,96 | `span.pill.ok` | `#2E9E5B` | `#E2F3E8` | 2 |
| 2,96 | `p.id-recado` | `#2E9E5B` | `#E2F3E8` | 1 |
| 3,01 | `b` "Sobre foto com gente" | `#B97F1D` | `#FAEFD8` | 1 |
| 3,01 | `span.pill.warn` | `#B97F1D` | `#FAEFD8` | 1 |
| 3,10 | `span.pill.off` | `#78899A` | `#EDEEF0` | 2 |
| 3,88 | `span.pill.info` (com `opacity`) | `#4676E5` | `#EAF8FD` | 1 |
| 3,95 | `p.form-error` | `#C24A44` | `#F9E4E2` | **9** |
| 3,95 | `b`, `.lr-erro`, `.id-recado.erro`, `strong`, `.rev-bloqueio`, `.pill.crit`, `.rev-erro` | `#C24A44` | `#F9E4E2` | 5 |
| 4,22 | `b` "O que não fazer agora" | `#C24A44` | `#FAEFD8` | 3 |

O `.form-error` em 9 telas é o que mais me incomoda: é a mensagem que
aparece quando a pessoa **já errou** e está tentando de novo.

Os outros 30 grupos são `--ink-mute` em 3,30 (sobre `--canvas`) e 3,56
(sobre `--surface`) — o caso do QA, confirmado.

---

## 7. Estados: foco, hover, desabilitado

O QA não cobriu nenhum dos três. É onde estão os dois piores números do
lote.

### Anel de foco — o teclado praticamente não existe no escuro

`button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px
solid var(--cobalt) }`. O anel é cobalto, e cobalto no escuro é a causa 1.

Medido, com o anel forçado por classe de mesma especificidade e o fundo
lido **fora** da caixa (porque `outline-offset` é positivo, o anel cai no
fundo do pai, não no do botão):

| tema | anéis medidos | abaixo de 3:1 |
|---|---:|---:|
| claro | 356 | 13 |
| **escuro** | 356 | **237** |

237 de 356. O pior é 1,40:1; o mais comum é 2,10:1, sobre `--surface`. Na
prática, no tema escuro **não dá para ver onde o foco está** — o que
atinge quem navega por teclado e quem usa leitor de tela.

No claro sobram 13, num caso só que vale registrar: `a.cta.ghost` dentro
do `.side-support`. A sidebar manda `outline-color: var(--sidebar-ink-strong)`
(branco), mas o card de suporte tem fundo `--ice-soft`, quase branco.
**1,11:1** — anel branco sobre card branco, em 9 telas.

### Hover — os botões secundários somem quando o dedo passa

```css
.cta:hover  { background: var(--cobalt-dark); }   /* pega TODAS as .cta */
.cta.ghost  { background: transparent; color: var(--cobalt); }
.cta.quiet  { background: transparent; color: var(--ink-soft); }
```

`.ghost` e `.quiet` não têm hover próprio, então herdam o fundo
cobalto-escuro e mantêm a tinta que foi desenhada para fundo transparente:

| | claro | escuro |
|---|---:|---:|
| `.cta.ghost:hover` — "Quero mudar alguma coisa" | **1,42** | **1,33** |
| `.cta.quiet:hover` — "Salvar e continuar depois" | **1,42** | **1,33** |
| `.cta.quiet:hover` — "Voltar", "Falar com uma pessoa" | **1,47** | 2,95 |

Falha nos **dois** temas. 1,33:1 é texto que desaparece.

Total de hover abaixo do mínimo: 34 grupos no claro, 75 no escuro.

### Desabilitado — fora do mínimo, mas isento

A WCAG 1.4.3 isenta componente inativo. Registro para você saber que eu
olhei, e porque "isento" não é "legível":

| | claro | escuro |
|---|---:|---:|
| `.cta:disabled` — "Pode ir ao ar" | 3,59 | 4,20 |
| `.mini-send:disabled` | 3,59 | 4,20 |
| `.chip-opt[disabled]` (`opacity: .4`) | 2,06 | 1,26 |

---

## 8. Duas coisas medidas que NÃO são defeito

**A largura não muda cor nenhuma.** Varri as 17 regras de mídia de largura
do `6834136`: **zero** declaração de cor em todas. Confirmado no navegador
— medindo a 390px, nenhum par (tinta, fundo) novo aparece e nenhum some.
Os 285 elementos contra 297 são só a sidebar sumindo, que é o QA-1.

Isto vale para o `6834136`. O QA-1 **está** adicionando cor dentro de
`@media (max-width: 900px)` — ver §10.

**Os dois blocos do tema escuro estão iguais.** O `:root[data-tema="escuro"]`
repete à mão o `@media (prefers-color-scheme: dark)`. Comparei chave a
chave: 38 e 38, nenhuma sobrando, nenhum valor divergente. Estão certos
hoje. Mas é duplicação manual, e o conserto tem que entrar nos dois.

---

## 9. A proposta

### 9.1 Um token novo, e só um

```
--cobalt-ink   claro: #0743DC (= --cobalt, sem mudança)
               escuro: #5C88FA
```

**Por que nenhum dos existentes serve.** Medido contra as sete superfícies
escuras onde o cobalto é usado como tinta:

| candidato | pior caso | passa em 4,5? |
|---|---:|:--:|
| `--cobalt` escuro `#0239C7` (hoje) | 1,86 | não |
| `--cobalt-dark` escuro `#1B4BE8` | 2,48 | não |
| `--sidebar-active-bg` escuro `#1B44E5` | 2,31 | não |
| `--ice` escuro `#8FD9F5` | 10,33 | passa, mas é outro tom |

Os três azuis da paleta escura ficam entre 2,31 e 2,48 — nenhum chega
perto. O `--ice` passa com folga, mas trocaria o azul da marca por
azul-gelo em todo link do app: resolveria contraste inventando outra
identidade.

**De onde vem `#5C88FA`.** Não é chute nem cor nova: é o próprio
`--cobalt` com **o mesmo matiz (223°) e a mesma saturação (94%)**, só com
a luminosidade subida de 45% para 67% — o mínimo que faz o pior par passar
com margem. É o mesmo procedimento que o cabeçalho do `globals.css`
descreve para `--cobalt-dark`, `--ice-soft` e `--line`: derivado da
identidade, recalculado, com a conta escrita.

Medido:

| sobre | depois |
|---|---:|
| `--canvas` `#050A13` | 6,00 |
| `--surface` `#0C1523` | 5,54 |
| `--surface-2` `#111C2E` | 5,17 |
| `--ice-soft` `#0E2231` | 4,92 |
| `--warn-soft` `#2A1F0A` | 4,89 |
| `--crit-soft` `#2C1210` | 5,29 |
| `--good-soft` `#0E2418` | 4,95 |
| `--sidebar-bg` `#080E1A` | 5,84 |

Sete de sete acima de 4,5, e acima de 3 para ícone e anel. Se você quiser
mais margem, `#6B93FA` (L=70%) leva o pior caso a 5,53 — mais claro, e
mais longe do azul da marca. Eu recomendo `#5C88FA`.

**O claro não muda.** `--cobalt-ink` no claro é literalmente `--cobalt`, e
o tema claro já mede 6,05 a 7,38 nesses pares. É deliberado: o jeito de
não repetir o conserto que arrumou um tema e quebrou o outro é o conserto
não tocar no tema que está certo.

**Onde ele entra — e este é o ponto em que eu quase errei.** A regra
tentadora seria "toda regra com `color: var(--cobalt)` passa a
`--cobalt-ink`". **Isso quebraria o app**, e eu só vi porque fui medir o
contra-exemplo em vez de assumir:

```css
/* O botão padrão é cobalto sobre branco; aqui seria cobalto sobre
   cobalto. Inverte: superfície branca, texto cobalto. */
.hero-destaque .cta { background: var(--white); color: var(--cobalt); }
```

Aqui o cobalto é tinta sobre **branco**, e `--white` é `#FFFFFF` nos dois
temas. Medido:

| `.hero-destaque .cta` | hoje | se trocasse |
|---|---:|---:|
| sobre `--white` (claro) | 7,38 | **3,30** |
| sobre `--white` (escuro) | 8,70 | **3,30** |
| no hover, sobre `--ice` escuro | 5,56 | **2,11** |

Um caso que passa com folga hoje viraria falha nos dois temas. É a mesma
armadilha do precedente da faixa, só que na direção contrária: consertar
por regra geral em vez de por superfície.

**O critério certo não é a propriedade, é o fundo.** Trocam para
`--cobalt-ink` as regras cuja superfície composta é **escura no tema
escuro** — que são exatamente as 17 do §5 mais os anéis de foco do §7.
Ficam em `--cobalt`:

- `.hero-destaque .cta` — tinta sobre branco, nos dois temas;
- as 11 regras de `border-color` / `accent-color`;
- todo uso como `background`.

E é por isso que o passo 3 não pode ser "conferi as que mudei": tem que
ser a varredura inteira das 23 telas de novo, nos dois temas, procurando
**falha nova** e não só falha resolvida.

### 9.2 Correções sem token novo

| # | o quê | como | claro | escuro |
|---|---|---|---:|---:|
| a | `.badge` | `color: var(--black)`, igual ao `.chip-lime` | 14,83 → 17,56 | **1,12 → 15,34** |
| b | `.nav-eyebrow` | tirar `color` da regra da linha 1445, para a da 665 deixar de ser inerte — e trocar o valor dela por `var(--sidebar-ink)` | **2,05 → 5,06** | 7,56 (já passava) |
| c | `.rev-de` na faixa | regra escopada `.hero-destaque .rev-de`, com `rgb(var(--white-rgb) / 0.72)`, que a faixa já usa | **2,05 → 4,53** | **2,07 → 5,19** |
| d | `.cta.ghost:hover` e `.cta.quiet:hover` | manter o fundo transparente no hover, em vez de herdar o de `.cta` | **1,42 → link** | **1,33 → link** |
| e | anel de foco no `.side-support` | o anel branco da sidebar não vale sobre o card `--ice-soft`: usar `--cobalt-ink` ali | **1,11 → 6,64** | já passa |

### 9.3 Dois tokens existentes com valor novo

Não são tokens novos — é recalibrar o valor de quem já existe.

**`--ink-mute`**, causa 4, o de maior alcance:

| | hoje | proposto | sobre `--canvas` | sobre `--surface` |
|---|---|---|---:|---:|
| claro | `#78899A` | `#607080` | 3,30 → **4,67** | 3,56 → **5,05** |
| escuro | `#6C7D95` | `#7D8CA1` | 4,72 → 5,79 | 4,36 → **5,35** |

Mesmo matiz e mesma saturação nos dois; só a luminosidade muda. **Isto é
uma mudança visível**: escurece o texto de apoio do app inteiro no claro e
clareia no escuro. É o preço de 11px legível para quem tem 40+, e é sua
decisão, não minha.

**`--good`, `--warn`, `--crit` no tema CLARO**, causa dos selos:

| token | hoje | sobre o `-soft` | proposto | depois |
|---|---|---:|---|---:|
| `--good` | `#2E9E5B` | 2,96 | `#247C48` | 4,50 |
| `--warn` | `#B97F1D` | 3,01 | `#916417` | 4,56 |
| `--crit` | `#C24A44` | 3,95 | `#9A3732` | 5,81 |

Só no claro — no escuro os três já medem 5,99 a 7,49 e **não devem ser
tocados**. Mesmo matiz e saturação; só escurecem.

### 9.4 O que a proposta deixa em aberto para você

1. **`--cobalt-ink` em `#5C88FA` ou `#6B93FA`?** Recomendo o primeiro.
2. **Mexer no `--ink-mute`?** É a mudança mais visível do lote.
3. **A causa 6 (`opacity: 0.72` do `.rev-item.decidido`)** entra ou fica
   registrada? Eu deixaria fora: não é troca de cor.
4. **`.pill.off` depois do `--ink-mute` novo** dá 4,39 no claro — ainda 0,11
   abaixo. Cabe escurecer um pouco mais o `--ink-mute`, ou dar tinta
   própria ao `.off`. Prefiro medir de novo no passo 3 antes de decidir.

---

## 10. A fronteira com o QA-1

O QA-1 está na mesma árvore, e há três encostões:

1. **O `.topbar-help` que ele está criando usa `color: var(--cobalt)` sobre
   `background: var(--surface)`.** No escuro isso nasce em 2,10:1 — a causa
   1, num elemento que ainda não existe no `6834136`. Se o meu conserto
   entrar antes, a regra dele precisa de `--cobalt-ink`; se entrar depois,
   eu preciso incluir a regra dele. **Não vou tocar no arquivo dele. Me
   diga qual dos dois entra primeiro.**

2. **Ele está adicionando cor dentro de `@media (max-width: 900px)`** —
   `border-top: 1px solid var(--sidebar-line)` e `.nav-item.active
   { background: var(--sidebar-active-bg) }`. Hoje nenhuma regra de largura
   declara cor, e é por isso que eu pude dizer que contraste independe de
   largura. **Depois que a barra inferior entrar, essa afirmação vence** e
   a barra precisa da própria medição.

3. **A `.sessao-quem b { color: var(--navy) }`** que ele está pondo na
   `/conta` fica sobre superfície de leitura, onde `--navy` no escuro é
   claro — esse caso está certo. Só registro que olhei.

### Os arquivos que são meus, no passo 2

| arquivo | o quê |
|---|---|
| `app/globals.css` | os dois blocos de tema escuro, o `:root` claro, e as regras de cor listadas na §9 |
| `DESIGN.md` | regerado por `scripts/gerar-design-md.mjs` — 58 chaves viram 60. **Não editado à mão** |

Nenhum `.tsx`. Nenhuma rota, lógica, consulta, layout ou regra de mídia.
Se aparecer necessidade fora disso, eu paro e aviso.

---

## 11. O que este lote NÃO faz

- Não conserta QA-1, QA-2 nem QA-3.
- Não mexe na `(marketing)` / `lp.css`.
- Não mexe em `opacity` (causa 6) — registrada, não consertada.
- Não inventa paleta: um token novo, derivado do `--cobalt` por
  luminosidade, com a conta na §9.1.
- **Medido e deixado de fora, porque não é cor:** o `.rev-coluna` e o
  `code` do `saude-meta` computam **10,12px** — `--fs-code: 0.92em` dentro
  de um contexto de 11px. Está fora dos seis degraus da escala e o detector
  não pega, porque o valor é relativo. É assunto do QA-2.

---

## 12. Como vai ser verificado

1. A mesma bancada, as mesmas 23 telas, os dois temas, **antes e depois**,
   com a tabela lado a lado. O critério é o mesmo do passo 1.
2. Zero grupo abaixo de 4,5 (texto) e de 3 (ícone e anel) — ou, para cada
   um que sobrar, a linha dizendo por que ficou.
3. **Os dois temas, sempre.** Nenhum número do claro pode cair. Esta é a
   verificação que o `globals.css` já registra como a que faltou da outra
   vez, e é a que eu vou rodar primeiro.
4. Anel de foco: os 356 alvos, nos dois temas, pelo método da classe de
   mesma especificidade — não por `style` inline, que atropela a cascata.
5. Hover: os mesmos grupos da §7.
6. A conferência da bancada contra a `/entrar` real, refeita depois da
   mudança — se a bancada e a página divergirem em qualquer valor, o número
   da bancada não vale.
7. `pnpm conferir` verde e o detector sem achado novo, com o `DESIGN.md`
   regerado pelo script.
