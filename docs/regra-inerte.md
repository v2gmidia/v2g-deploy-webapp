# A regra inerte — quatro casos, e por que isso pede um conferidor

**Escrito em 20/08/2026**, ao fechar o lote QA-1. Não é desenho de
funcionalidade: é o registro de um **padrão de defeito** que já apareceu
quatro vezes neste projeto, e da verificação que ele está pedindo.

Quatro não é acaso. É sintoma.

---

## 1. O padrão, em uma frase

**Uma declaração de CSS sintaticamente correta, que o `grep` encontra, que
um humano lê como "é isto que acontece" — e que nunca pinta nada, porque
quem vence a cascata é outra.**

O que torna esta família cara é o que ela *não* faz: não quebra o build,
não derruba teste, não aparece no console, não muda o `pnpm conferir` de
cor. Ela some em silêncio. E some **para o lado errado**: quem lê o
arquivo acha que a regra está lá, e portanto não procura o problema onde
ele está.

## 2. Os quatro casos

| # | Onde | O que estava escrito | O que vencia | Mecanismo |
|---|---|---|---|---|
| 1 | `--sidebar-w: 76px` na regra de 900px | a sidebar tem 76px abaixo de 900px | `grid-template-columns: 1fr` da regra de 620px, que substituiu o **consumidor** do token | consumidor substituído mais adiante |
| 2 | `.nav-eyebrow { color: rgb(255 255 255 / 0.5) }` (linha 679) | o rótulo "SEU NEGÓCIO" é branco sobre o cobalto | `.nav-eyebrow { … color: var(--ink-mute) }` (linha 1566) | **mesma especificidade, ordem decide** |
| 3 | `.split-tag` no stepper | a etiqueta tem tamanho e cor próprios | `.stepper .s-copy span` (0,2,1) sobre `.split-tag` (0,1,0), no mesmo elemento | **especificidade menor** |
| 4 | `.topbar-help { display: inline-flex }` dentro da regra de 900px | o link de ajuda aparece no celular | `.topbar-help { display: none }` ~800 linhas depois | **mesma especificidade, ordem decide** — media query não soma especificidade |

Três mecanismos, um sintoma só. O caso 3 já vem com o diagnóstico escrito
no próprio CSS, acima da regra; o 1 e o 4 estão medidos em
[`navegacao-mobile.md`](./navegacao-mobile.md) §2 e §15.

Os números de linha são do commit `d14bdee` e **vão envelhecer** — o
`globals.css` muda a cada lote. O que não envelhece é o par
(seletor, propriedade); é por ele que se procura.

### O caso 2 tem consequência viva, e não é deste lote

O rótulo `.nav-eyebrow` — o "SEU NEGÓCIO" acima do menu, visível acima de
900px — é desenhado em `--ink-mute` sobre `--sidebar-bg` (`--cobalt`,
`#0743DC`), e **não** no branco a 50% que a regra da linha 679 pede.

Contraste calculado a partir dos tokens:

| `--ink-mute` | sobre `--cobalt` |
|---|---|
| `#78899A` (valor de 20/08/2026, commit `d14bdee`) | **2,05:1** |
| `#607080` (valor na árvore de trabalho do lote QA-4) | **1,45:1** |

**E aqui está a armadilha, que é do tipo que este projeto já pagou duas
vezes:** o QA-4 escureceu o `--ink-mute` para ganhar contraste sobre fundo
claro — e ganhou, é a decisão certa para o que ele mede. Só que **este**
rótulo não está sobre fundo claro: está sobre o cobalto. Escurecer a tinta
piora aqui, de 2,05 para 1,45. Nenhum dos dois lotes está errado sozinho.
O caso simplesmente não tem dono, porque a regra que daria conta dele —
o branco a 50% da linha 679 — existe, está correta, e está **inerte**.

Consequência prática para quem for fechar o QA-4: mudar o valor da linha
679 não muda nada na tela. O conserto é fazer aquela regra vencer, e só
depois discutir o tom.

Cálculo, não medição de tela — e é achado de contraste, ou seja,
território do QA-4, não deste lote.

## 3. Por que o `globals.css` produz isto

2.400+ linhas numa folha só, por decisão declarada
([`arquitetura.md`](./arquitetura.md), Decisão 7 — sem CSS-in-JS, sem
Tailwind, um `globals.css` só). A decisão continua certa pelos motivos
dela. Mas ela tem um preço, e o preço é este: **num arquivo desse
tamanho, a distância entre duas regras do mesmo seletor é maior que a
memória de quem escreve.** Os casos 2 e 4 têm 887 e ~800 linhas entre a
regra e sua concorrente. Ninguém lê 800 linhas para escrever uma cor.

O `DESIGN.md` já verifica duas coisas na folha — que nenhuma cor vive fora
do `:root` e que nenhum tamanho de fonte sai dos seis degraus. As duas
perguntam **"este valor é permitido?"**. Nenhuma pergunta **"este valor
chega a acontecer?"**.

## 4. A verificação que falta

**Não construída. Anotada aqui junto dos outros três conferidores**
(`pnpm typecheck`, `pnpm conferir:lista-branca`, `pnpm conferir:cadastro`),
como quarto candidato: `pnpm conferir:cascata`.

O que ela precisaria fazer, no mínimo:

1. Varrer `app/globals.css` com parser de blocos — o mesmo que a medição
   da escala tipográfica usou, que rastreia `{`/`}` e associa cada
   declaração ao seletor do bloco. Contar declarações, não ocorrências de
   texto.
2. Agrupar por **(seletor normalizado, propriedade)**.
3. Acusar quando o mesmo par aparece duas ou mais vezes e a primeira não
   está dentro de contexto que a proteja (`@media` mais restritiva *que
   venha depois*, `:hover`, `[data-tema]`). Ou seja: acusar o caso 2 e o
   caso 4.
4. Para o caso 3, comparar especificidade entre seletores que possam casar
   o mesmo elemento — mais difícil, e provavelmente uma segunda etapa.
5. O caso 1 (consumidor substituído) é o mais difícil dos quatro e talvez
   não caiba num conferidor estático. Fica registrado como limite
   conhecido, não como promessa.

**A armadilha a evitar ao escrever essa verificação está registrada no
próprio projeto:** teste que passa porque o alvo não produzia achado
nenhum não prova nada — já aconteceu cinco vezes aqui, a última sendo o
caso 4, que passou pelo `pnpm conferir` verde com o link invisível na
tela. Quando alguém construir o `conferir:cascata`, a linha de base é
esta: **ele tem que acusar os casos 2 e 4 deste documento antes de
qualquer conserto**. Se rodar limpo num arquivo que contém os dois, ele
está medindo outra coisa.

## 5. O que este documento não é

Não é proposta de trocar a Decisão 7. Um `globals.css` só continua sendo
a escolha certa aqui; o que falta não é arquitetura, é uma trava — do
mesmo tipo das outras três, que também nasceram cada uma de um bug real.
