# Navegação no celular — medição e desenho

**Lote QA-1. Este documento é o passo 1: medição e proposta. Nada foi
alterado no CSS nem no TSX.**

Medido em 20/08/2026 sobre `app/globals.css` e `app/(protected)/layout.tsx`.

---

## 1. Como foi medido, e o que isso não cobre

As rotas de `(protected)` exigem sessão. Não peço senha, então não medi o
app autenticado rodando — medi o **shell**, que é onde o defeito mora.

Método: uma página de teste que reproduz **literalmente** o DOM de
`app/(protected)/layout.tsx` (mesmas classes, mesma ordem, mesmos
elementos), servida por HTTP com o `app/globals.css` real linkado, e a
geometria lida com `getBoundingClientRect()` e `getComputedStyle()` em
cada largura. Não é olho, não é `grep`: é a caixa que o navegador
calculou.

O que isso **não** cobre, e vai precisar de sessão para fechar:

- a contagem de clicáveis das cinco telas com conteúdo real (§10);
- o comportamento do teclado virtual em aparelho de verdade (§8).

Os números por tela na tabela do relatório do QA são **do QA**, não meus.
Estão marcados como tal.

---

## 2. O que foi medido no shell

`.sidebar`, por largura de viewport:

| Largura | `.sidebar` | `grid-template-columns` | `--sidebar-w` | clicáveis do shell |
|---|---|---|---|---:|
| 1280px | 252 × 844, visível | `252px 1028px` | `252px` | 8 |
| 899px | 76 × 844, visível | `76px 823px` | `76px` | 6 |
| 621px | 76 × 844, visível | `76px 545px` | `76px` | 6 |
| **390px** | **0 × 0, `display: none`** | `390px` | `76px` (inerte) | **0** |
| **375px** | **0 × 0, `display: none`** | `375px` | `76px` (inerte) | **0** |

Em 390px e em 375px o shell não oferece **nenhum** elemento clicável. O
que sobra na tela é a `.topbar` (81px de altura), que só tem texto:
saudação, nome do negócio e data. O que o QA mediu em produção e o que eu
medi aqui batem.

### Por que ela colapsa

Duas regras, ambas em `app/globals.css`:

```css
@media (max-width: 900px) {           /* linha 704 */
  :root { --sidebar-w: 76px; }
  .side-brand .wm, .nav-item span, .side-account .who, .nav-eyebrow { display: none; }
  …
}
@media (max-width: 620px) {           /* linha 717 */
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }         /* ← o defeito */
  .canvas { padding: 20px 18px 40px; }
}
```

É a hipótese do relatório, confirmada: **regra de mídia que esconde sem
repor.** Não há hambúrguer desligado, não há barra inferior comentada, não
há componente órfão. A barra inferior foi prevista na decisão dos cinco
itens (o comentário está em `app/(protected)/layout.tsx`, no `.side-nav`)
e nunca chegou a existir.

Detalhe que confirma o diagnóstico: em 390px o token `--sidebar-w`
continua resolvendo para `76px` — declarado, correto e **inerte**, porque
quem vence a cascata é o `grid-template-columns: 1fr` da regra de 620px.
É exatamente a classe de bug já registrada em `arquitetura.md`.

---

## 3. Um segundo achado, no mesmo elemento

O trilho de 76px (entre 621px e 900px) **também está quebrado** — e isso
muda o conserto, então entra aqui.

A regra de 900px esconde quatro coisas quando só cabe ícone
(`.side-brand .wm`, `.nav-item span`, `.side-account .who`,
`.nav-eyebrow`). Ela **não** esconde o `.side-support`. Medido em 899px:

| Elemento | Caixa medida | O que é |
|---|---|---|
| `.side-support` | 44 × 378 | o card "Fala com gente de verdade" |
| `.side-support b` | 16 × 85 | o título, uma letra por linha |
| `.side-support p` | 16 × 165 | o parágrafo, idem |
| `.side-support .cta` | 26 × 88 | o botão "Falar com uma pessoa" |
| `.link-btn` ("Sair") | **0 × 0** | escondido junto com `.side-account .who` |

Duas consequências:

1. Entre 621px e 900px o card de suporte é uma coluna de letras de 16px de
   largura e 378px de altura. Não é um card apertado — é ilegível.
2. Entre 621px e 900px **não existe como sair da conta**. `Sair` só existe
   dentro de `.side-account .who`, e `.who` está em `display: none`. Medido:
   0 × 0. Fora da sidebar, `signOutAction` não é chamado de lugar nenhum —
   confere: `grep -rn "signOutAction" app components` dá dois resultados, a
   própria action e o layout.

Três defeitos independentes apontando para o mesmo elemento: o trilho de
ícones de 76px. Pela regra do projeto, **o defeito é o elemento**. Isso
decide a largura de corte, em §5.

---

## 4. A forma: barra inferior fixa

**Proposta: barra inferior fixa, com os cinco itens, ícone e rótulo.** Não
hambúrguer.

Contra o público:

- Quem usa aprendeu celular no WhatsApp e no Instagram. Os dois têm barra
  inferior com rótulo. Nenhum dos dois esconde a navegação principal atrás
  de três risquinhos. O gesto que essa pessoa já tem no dedo é "olho para
  baixo, vejo cinco coisas, toco numa".
- Hambúrguer troca um problema por outro: hoje a saída não existe; com
  hambúrguer ela existe mas precisa ser **descoberta**. Para quem não tem
  facilidade digital, uma saída que precisa ser descoberta é uma saída que
  metade não acha. O QA desistiu porque não viu saída — um ícone abstrato
  no canto não resolve "não vi".
- A barra inferior é a única forma que mostra, o tempo todo e sem toque
  nenhum, **onde o cliente está** e **quais são os outros lugares**. As
  duas perguntas do QA travado em Anúncios.
- O menu já tem cinco itens porque cinco é o que cabe numa barra inferior.
  A decisão está escrita no `.side-nav`. Este lote não escolhe a forma —
  ele constrói a forma que já tinha sido escolhida.

**Ícone sozinho está fora.** O trilho de 76px de hoje é ícone sem rótulo, e
para este público cinco pictogramas mudos são cinco adivinhações. Na barra,
todo item tem rótulo — o mesmo texto do menu: Início, Vendas, Anúncios,
Avisos, Conta.

---

## 5. Em que largura a sidebar dá lugar à barra

**Corte em 900px.** Acima de 900px, sidebar de 252px com rótulos, como
hoje. Em 900px e abaixo, barra inferior. O trilho de ícones de 76px deixa
de existir.

Por quê 900 e não 620:

- O trilho de 76px está quebrado em três frentes medidas (§3). Consertá-lo
  seria trabalho para manter uma faixa de larguras que ninguém desenhou —
  ele nasceu de "a sidebar não cabe, então encolhe", não de uma decisão.
- Ele é ícone sem rótulo, que é justamente o que §4 recusa.
- Corte único: uma regra de mídia decide a navegação inteira. Duas regras
  (620 e 900) mexendo no mesmo elemento foi o que produziu o defeito.
- 900px pega tablet em pé (iPad é 820px). Barra inferior num tablet em pé é
  normal e é o que o Instagram faz; trilho de cinco ícones mudos, não.

Se você preferir mexer só no celular e deixar o trilho para outro lote, o
corte vira 620px e o resto deste desenho continua igual — muda um número.
Eu recomendo 900: com 620, o "Sair" continua inalcançável entre 621 e
900px, e isso é conta em aberto.

---

## 6. Como se constrói: não é um componente novo

A barra **é a `.sidebar` de hoje**, com outro layout abaixo de 900px.
Mesmo DOM, mesmo componente `NavItem`, mesmo `usePathname` decidindo o
ativo, mesmos ícones. Só CSS.

Abaixo de 900px:

| Elemento | O que acontece |
|---|---|
| `.sidebar` | `position: fixed; bottom: 0; left: 0; right: 0`, altura `var(--barra-h)`, `flex-direction: row` |
| `.side-nav` | `flex-direction: row`, cinco colunas iguais (`flex: 1`) |
| `.nav-item` | coluna: ícone em cima, rótulo embaixo; `.nav-item span` volta a aparecer |
| `.nav-eyebrow` | `display: none` (é rótulo de seção; não há seção numa barra) |
| `.side-brand` | `display: none` — §7 |
| `.side-spacer` | `display: none` |
| `.side-support` | `display: none` — §7 |
| `.side-account` | `display: none` — §7 |
| `.app-shell` | `grid-template-columns: 1fr` (como já é abaixo de 620) |
| `.canvas` | ganha `padding-bottom` de `var(--barra-h)` + folga |

Isso zera três riscos de uma vez: nenhuma rota muda, nenhuma lógica muda,
e o item ativo não precisa ser recalculado — `NavItem` já resolve.

Cor: a barra usa `--sidebar-bg`, `--sidebar-ink`, `--sidebar-ink-strong` e
`--sidebar-active-bg`, os mesmos tokens da sidebar. **Zero cor nova**, e o
tema escuro já vem junto (`--sidebar-bg` vira `#080E1A` lá). Tamanho de
fonte do rótulo: `--fs-legenda` (11px), degrau que já existe na escala.

Contraste do rótulo inativo, **calculado** a partir dos tokens (branco a
78% sobre `--cobalt` = `#C8D5F7` sobre `#0743DC`): **5,0:1**. Passa em
texto pequeno. O ativo é branco puro: 7,4:1. Conta feita no papel, não
medida na tela — entra na verificação do passo 3.

Uma medida nova, e é comprimento, não cor nem fonte: `--barra-h: 56px` no
`:root`. Ela precisa existir como token porque três lugares dependem dela
(a barra, o `padding-bottom` do `.canvas` e o `.toast` do §9); número
solto nos três é o jeito de um deles ficar para trás na próxima mudança.

---

## 7. O card de suporte e o bloco de conta

Os dois moram na sidebar e **não cabem** na barra: seriam o sexto e o
sétimo item, e cinco é teto. Precisam de casa, porque hoje eles somem sem
substituto — que é o defeito deste lote, e repeti-lo em escala menor
continua sendo o defeito.

### "Falar com uma pessoa" → vai para a `.topbar`

A saída óbvia seria "o corpo das telas já tem o bloco de suporte". **Medi,
e é falso.** Cada tela do menu tem um `.support-block` com "Chamar no
WhatsApp", mas ele não está em todos os **estados**:

| Tela | Estado | Suporte no corpo? |
|---|---|---|
| `/inicio` | — | sim |
| `/vendas` | ambos | sim (no `.dash-aside` do caminho principal) |
| `/anuncios` | com anúncio | sim |
| `/anuncios` | **vazio** (`SemAnuncioNenhum`) | **não** — a função devolve o próprio layout, sem `.dash-aside` |
| `/alertas` | — | sim |
| `/conta` | — | sim |
| `/meu-negocio` | com perfil | sim |
| `/meu-negocio` | **vazio** (`if (!perfil)`) | **não** — só o botão "Começar agora" |

Ou seja: cliente novo, que é quem mais precisa de ajuda, entra em Anúncios
ou em Meu negócio e não tem WhatsApp na tela. Se a barra escondesse o card
da sidebar sem repor, esse cliente ficaria sem canal de ajuda em duas telas
— e nenhum documento estaria errado sozinho, porque cada um delegaria ao
outro. É a armadilha registrada em `arquitetura.md`, e é por isso que a
tabela acima foi medida arquivo por arquivo em vez de assumida.

**Decisão:** abaixo de 900px, a `.topbar` ganha um link "Falar com uma
pessoa" à direita, dentro de `.topbar-actions` — classe que **já existe**
em `globals.css` (linha 1468) e hoje não é usada por ninguém. Acima de
900px o link fica oculto e o card `.side-support` da sidebar continua como
está.

Isso não inventa padrão: é literalmente o que o layout de `(fluxo)` já faz
— marca à esquerda, "Falar com uma pessoa" à direita, no topo. As telas de
app passam a ter a mesma promessa no mesmo lugar.

Custo: uma adição de marcação em `app/(protected)/layout.tsx`. Sem lógica,
sem rota, sem estado.

### O bloco de conta e o "Sair" → vão para `/conta`

`Conta` já é item do menu, e a `/conta` é a tela do assunto. O bloco da
sidebar é conveniência de desktop, não a única casa — exceto que hoje **é**
a única casa do "Sair" (§3), inclusive já hoje entre 621 e 900px.

**Decisão:** a `/conta` ganha, em todas as larguras, um bloco no fim com o
nome do negócio e o botão de sair — o mesmo `signOutAction`, movido de
lugar, não reescrito. Abaixo de 900px, `.side-account` fica oculto.

Custo: uma adição de marcação em `app/(protected)/conta/page.tsx` e um
`import` da action que já existe. Sem lógica nova.

### A marca

Some das telas de app abaixo de 900px, e isso é decisão, não perda: a marca
servia como "voltar para o início", e Início virou o primeiro item da
barra, com rótulo. O cliente não precisa que a tela lembre que ele está na
V2G — precisa saber onde tocar. A `.topbar` continua dizendo o nome do
**negócio dele**, que é a informação que importa ali.

---

## 8. Área de toque

Alvos medidos hoje, no trilho de 76px (a única navegação que existe abaixo
de 900px, e que some abaixo de 620px):

| Alvo | Caixa medida |
|---|---|
| `.nav-item` no trilho | 44 × 42 |
| `.side-support .cta` no trilho | 26 × 88 |
| `.link-btn` ("Sair") no trilho | 0 × 0 |

42px de altura fica abaixo dos 44px do iOS e dos 48dp do Android. 26px de
largura no botão de ajuda é alvo que erra.

**Alvo proposto na barra:** cada item ocupa a célula inteira — largura da
tela ÷ 5, altura `--barra-h` (56px). Isso dá:

| Largura da tela | Alvo por item |
|---|---|
| 390px (iPhone 14/15) | 78 × 56 |
| 375px (iPhone SE) | 75 × 56 |
| 320px (piso realista) | 64 × 56 |

Passa em iOS (44), em Android (48) e no critério AAA da WCAG 2.5.5. A área
clicável é o `<a>` inteiro, não o ícone — o dedo que erra o ícone por 10px
ainda acerta o item. Sem `gap` entre células: espaço morto entre dois
alvos, num alvo de 64px, é área de erro sem ganho.

O rótulo mais longo é "Anúncios", em `--fs-legenda` (11px) com a Archivo
700. Cabe em 64px com folga na conta; **vai ser medido** no passo 3, em
320px, e se não couber a saída é reduzir o `letter-spacing` do rótulo, não
cortar a palavra e não sair da escala.

---

## 9. O que fica visível quando o teclado abre

Elemento fixo no rodapé + teclado virtual é onde esse tipo de barra
costuma dar errado, e os dois sistemas erram diferente:

- **Android (Chrome)** encolhe a viewport quando o teclado sobe. A barra
  fixa reencosta logo acima do teclado, come 56px do que sobrou e pode
  cobrir justamente o campo que está sendo digitado.
- **iOS (Safari)** não encolhe a viewport de layout. A barra tende a ficar
  atrás do teclado ou a flutuar fora de lugar durante a rolagem.

**Decisão: com um campo de texto em foco, a barra some.** Regra de CSS
pura, sem JavaScript e sem estado:

```css
@media (max-width: 900px) {
  body:has(input:focus, textarea:focus, select:focus, [contenteditable]:focus) .sidebar {
    display: none;
  }
}
```

Escopo estreito de propósito: só campo de digitação. Foco em link ou em
botão — navegação por teclado, leitor de tela — **não** esconde a barra.

Justificativa: quem está digitando está numa tarefa, e a tela inteira deve
ser da tarefa; é o que o WhatsApp faz quando você escreve. Ao fechar o
teclado a barra volta sozinha, sem toque nenhum. E some antes de cobrir
qualquer coisa, o que é melhor que sobreviver mal nos dois sistemas.

Onde isso vale, hoje: `/meu-negocio` (os campos que abrem no "mudar") e
`/conta` (formulários). As outras três telas do menu não têm campo de
texto.

**Isto é raciocínio, não medição.** `:has()` e o comportamento das duas
viewports não foram testados em aparelho real aqui — nem dá, deste lado.
Entra na lista de verificação do passo 3, e se em aparelho real a barra
sumir quando não devia (ou não sumir quando devia), a regra muda antes de
o lote fechar.

### Barra do sistema / home indicator

Não há `viewport-fit=cover` no projeto — `app/layout.tsx` não exporta
`viewport`, e o padrão do Next é `width=device-width, initial-scale=1`.
Sem `cover`, o iOS já dispõe o conteúdo **dentro** da área segura, e
`env(safe-area-inset-bottom)` resolveria para `0px` de qualquer jeito.
Conferido: `env(` não aparece nenhuma vez no `globals.css`.

Conclusão: **a barra encosta no fim da área segura sem precisar de
`env()`**, e este lote não mexe no viewport. Se algum dia o projeto adotar
`viewport-fit=cover`, aí sim a barra precisa de `padding-bottom:
env(safe-area-inset-bottom)` — anotado aqui para não virar surpresa.

### O `.toast`

`.toast` é `position: fixed; bottom: 24px`, e abaixo de 620px vira
`left: 18px; right: 18px`. Com a barra no rodapé, ele aparece por baixo
dela. Abaixo de 900px o `bottom` passa a `calc(var(--barra-h) + 16px)`.

---

## 10. As telas de fluxo

**Não ganham barra, e isso não muda.** `(fluxo)` existe para tarefa sem
fuga; a razão está escrita no `app/(fluxo)/layout.tsx`.

O que muda é o **estado** da saída delas: hoje ela é acidental. Medido em
375px, no `.auth-top`:

| Alvo | Caixa medida |
|---|---|
| marca V2G (`<a href="/inicio">`) | 156 × 43 |
| "Falar com uma pessoa" | 183 × 55 |

Em 320px: 128 × 43 e 156 × 55, sem rolagem horizontal
(`scrollWidth` = 320).

Os alvos servem. Duas observações:

1. A marca tem 43px de altura — 1px abaixo dos 44 do iOS. Vale igualar ao
   alvo do link ao lado.
2. Os dois alvos se encostam (a marca termina em 146px, o link começa em
   146px). Dois alvos colados num header de celular é toque errado
   esperando acontecer. Um respiro entre eles resolve.

**Decisão:** as telas de fluxo continuam sem barra; a saída pela marca
passa a ser **desenho declarado** — está escrito aqui, e o comentário do
`(fluxo)/layout.tsx` passa a citar este documento. Os dois ajustes de alvo
acima entram neste lote porque são a mesma pergunta ("dá para sair daqui
no celular?") e são duas linhas de CSS.

---

## 11. O que este lote NÃO faz

- Não conserta os outros defeitos do QA (QA-2, QA-3, QA-4).
- Não mexe em rota, em `PROTECTED_PREFIXES`, em Server Action nem em
  consulta ao banco.
- **Medido e deixado de fora:** abaixo de 620px o `.canvas` usa
  `padding-left/right: 18px` e a `.topbar` continua em `22px` — a regra de
  620 mexe no `.canvas` e esquece a `.topbar`. São 4px de desalinho entre a
  saudação e o conteúdo, em toda tela de app no celular. É uma linha de
  CSS, mas não é navegação; fica registrado aqui e conserta-se quando você
  mandar.
- Não muda o menu: cinco itens, os mesmos cinco, nos mesmos lugares.

## 12. Arquivos que o passo 2 encosta

| Arquivo | O quê |
|---|---|
| `app/globals.css` | token `--barra-h`; regra de 900px reescrita; regra de 620px enxugada; `:has()` do teclado; `.toast` |
| `app/(protected)/layout.tsx` | link de ajuda na `.topbar` (marcação) |
| `app/(protected)/conta/page.tsx` | bloco de conta + "Sair" (marcação + `import` da action existente) |
| `app/(fluxo)/layout.tsx` | só o comentário, citando este documento |

Três arquivos com código, nenhum com lógica nova.

## 13. Como vai ser verificado

1. As cinco telas do menu em **390px** e em **375px**, contando clicáveis
   com o mesmo critério do QA (`getBoundingClientRect()` não-zero). Alvo:
   **os 5 itens da barra + o link de ajuda da topbar em toda tela, em todo
   estado** — inclusive nos dois estados vazios da tabela do §7, que hoje
   são os piores.
2. Caixa medida de cada item da barra em 390, 375 e 320px, contra a tabela
   do §8.
3. `.sidebar` em 901px: 252px, com rótulos, intacta.
4. Sair alcançável em 390px, 700px e 1280px — as três faixas.
5. Teclado: campo em foco na `/meu-negocio` e na `/conta`, nos dois
   sistemas, se houver aparelho à mão; se não houver, digo que não rodou.
6. `pnpm conferir` verde.

Para 1 e 4 eu preciso de uma sessão no app. Sem senha eu meço o shell, não
as telas com dado real — se você tiver um jeito de me deixar logado que não
passe por me contar credencial, resolve; se não, eu meço o que dá e digo,
item por item, o que ficou sem medir.

---

# Verificação — 20/08/2026, com sessão real

Implementado e medido no mesmo dia. **Esta parte é registro de medição: os
números abaixo não se reescrevem.** O que estava previsto acima e o que a
medição devolveu estão lado a lado de propósito.

## 14. Como foi medido, desta vez

Servidor de desenvolvimento local, no Chrome do dono do projeto, com a
sessão dele — as telas abaixo são as dele, com dado real, não estado
vazio de mentira.

Duas coisas atrapalhavam medir largura de celular numa janela de desktop:
o Chrome não reduz a janela abaixo de ~500px, e o aparelho está em
`devicePixelRatio` 1,25, o que sujaria qualquer conta feita em pixel de
janela. A saída foi medir dentro de um `iframe` de mesma origem com
largura exata — **media query avalia contra o viewport do iframe**, então
390px ali é 390px de verdade. A largura foi compensada pela barra de
rolagem do iframe até `clientWidth` bater exatamente no alvo (celular usa
barra sobreposta, sem largura); todas as linhas abaixo trazem o viewport
conferido.

## 15. Um defeito meu, achado pela medição

A primeira medida em 390px devolveu o link de ajuda da topbar em
`display: none` — invisível justamente onde ele é a única ajuda.

Causa: eu tinha escrito o `display: inline-flex` dentro do bloco de 900px,
lá na regra do shell, e o `display: none` de base do `.topbar-help` vem
**800 linhas depois** no arquivo. Media query não soma especificidade;
com a mesma especificidade, quem vence é a ordem. A regra estava
declarada, correta e **inerte** — a mesma classe de bug que o
`--sidebar-w: 76px` de §2, agora escrita por mim.

Conserto: a regra que mostra passou a morar logo depois da que esconde, e
o bloco de 900px tem um comentário apontando para lá, para ninguém
"arrumar" trazendo ela de volta.

Registrado porque é a evidência de que a medição valeu: `pnpm conferir`
estava verde com o link invisível. Teste que passa sem exercitar o alvo
não prova nada — e este era o quinto caso do projeto.

## 16. As cinco telas do menu, com dado real

Contagem pelo mesmo critério do QA: elemento com caixa não-zero
(`a[href]`, `button`, `input`, `select`, `textarea`).

**Em 390px** (viewport conferido = 390 nas cinco):

| tela | clicáveis (antes → depois) | item ativo | alvo do item | ajuda na topbar | rolagem horizontal |
|---|---|---|---|---|---|
| `/inicio` | — → **11** | Início | 77,9 × 55,2 | 176,4 × 50,8 | não (`scrollWidth` 390) |
| `/vendas` | 2 → **8** | Vendas | 77,9 × 55,2 | 176,4 × 50,8 | não |
| `/anuncios` | **1 → 7** | Anúncios | 77,9 × 55,2 | 176,4 × 50,8 | não |
| `/alertas` | **1 → 7** | Avisos | 77,9 × 55,2 | 176,4 × 50,8 | não |
| `/conta` | — → **29** | Conta | 77,9 × 55,2 | 176,4 × 50,8 | não |

As cinco trazem os cinco itens, com os cinco rótulos
(`Início|Vendas|Anúncios|Avisos|Conta`), e o item ativo é o da tela em
todas. O `/anuncios` que o QA abandonou — um clicável, nenhuma saída —
tem sete, cinco dos quais levam para outro lugar do app.

**Em 375px** (iPhone SE): barra `375,2 × 56`, alvo `75 × 55,2`, ajuda
`169 × 50,8`, `scrollWidth` 375 nas cinco telas. Mesmos cinco rótulos,
mesmo item ativo.

**Em 320px** (piso): barra `320 × 56`, alvo `64 × 55,2`, ajuda
`140,8 × 50,8`, `scrollWidth` 320. Nenhum rótulo cortado — medido com
`scrollWidth > clientWidth` em cada um:

| rótulo | largura em 320px | cabe em 64px |
|---|---|---|
| Início | 28,9 | sim |
| Vendas | 39,3 | sim |
| Anúncios | 49,9 | sim |
| Avisos | 35,7 | sim |
| Conta | 31,6 | sim |

A previsão de §8 era 78 × 56, 75 × 56 e 64 × 56. Bateu — os 55,2 de
altura são os 56 menos a linha de 1px do topo da barra. Acima dos 44 do
iOS e dos 48 do Android nas três larguras.

## 17. As três faixas de largura

Medido na `/conta`, que é onde o "Sair" mora:

| | 700px | 901px | 1280px |
|---|---|---|---|
| `.sidebar` | `700 × 56` **fixed** | `252 × 900` sticky | `252 × 900` sticky |
| rótulo do item | visível | visível | visível |
| alvo do item | 140 × 55,2 | 220 × 42 | 220 × 42 |
| `.nav-eyebrow` | oculto | visível | visível |
| `.side-support` | oculto | **220 × 119,4** | **220 × 119,4** |
| ajuda na topbar | visível | oculta | oculta |
| "Sair" na sidebar | 0 × 0 | 21 × 12 | 21 × 12 |
| **"Sair" na `/conta`** | **153,3 × 45,6** | **153,3 × 45,6** | **153,3 × 45,6** |

Três coisas fechadas aqui:

1. O trilho de 76px não existe mais em largura nenhuma.
2. O card de suporte, que media 44 × 378 em 899px, agora mede
   220 × 119,4 — porque acima de 900px ele tem os 252px inteiros da
   sidebar, e abaixo ele deu lugar ao link da topbar.
3. **A conta tem saída em todas as três faixas.** Em 700px, onde antes o
   botão media 0 × 0, ele mede 153,3 × 45,6 na `/conta`.

O botão não foi clicado em nenhuma medição — a sessão do dono ficou de pé.

## 18. O teclado, com foco de verdade

Primeira tentativa não valeu: dentro do `iframe`, `campo.focus()` punha o
`activeElement` certo mas `campo.matches(':focus')` dava `false` — sem
foco real do documento, `:focus` não casa, e a regra parecia morta. Um
teste que dava "não funciona" pelo motivo errado.

Refeito com clique de verdade do mouse, na `/conta` em 390px:

| momento | `.sidebar` |
|---|---|
| sem foco em campo | `flex`, 389,6 × 56 |
| campo de texto focado (clique real) | **`none`, 0 × 0** |
| depois do `blur` | `flex`, 389,6 × 56 |
| **link de navegação focado** | **`flex`, 389,6 × 56** |

A regra faz o que foi desenhada para fazer, e o escopo estreito segura: o
foco num link da própria barra **não** esconde a barra, então quem navega
por teclado não perde o chão. `CSS.supports('selector(:has(input:focus))')`
devolveu `true` no Chrome desta máquina.

**O que continua sem medição:** aparelho real. O comportamento das duas
viewports (Android encolhe, iOS não) e a área segura do iPhone não foram
testados em telefone nenhum — não dá deste lado. O que está provado é que
a barra some e volta com o foco; o que não está é como o teclado de cada
sistema se comporta em volta dela.

## 19. Quatro observações que a medição trouxe, e não foram consertadas

1. **A pílula de ajuda quebra em duas linhas em 390px.** "Falar com uma /
   pessoa", dentro de 176,4 × 50,8. Legível, e o alvo passa; feio. Forçar
   uma linha só espremeria a saudação ao lado — é troca de um embrulho por
   outro, e preferi não escolher sozinho.
2. **O "Sair" da sidebar mede 21 × 12 no desktop.** É o `.link-btn`
   antigo, que sempre foi assim. Alvo de mouse, e por isso não travava
   nada — mas 21 × 12 não passa nem no critério mais frouxo da WCAG. Não
   mexi: o lote é navegação de celular, e no celular ele não aparece mais.
3. **Na `/meu-negocio` a barra aparece sem item ativo.** Correto: essa
   rota não é um dos cinco lugares, chega-se a ela pelo Início ou pela
   Conta. Nenhum item aceso é mais honesto que acender o errado.
4. **O indicador do Next em desenvolvimento fica por cima do "Conta".** É
   o botão flutuante do dev server, canto inferior direito. Só existe em
   desenvolvimento; em produção não há nada ali.
