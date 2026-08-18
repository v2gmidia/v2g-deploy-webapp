---
# GERADO por scripts/gerar-design-md.mjs a partir de app/globals.css.
# Não edite este bloco à mão — a prosa abaixo dos --- é que é escrita por gente.
colors:
  black: "#000C08"
  card-cobalt-ink: "#FFFFFF"
  card-ice-bg: "#DCEEFB"
  cobalt: "#0743DC"
  cobalt-dark: "#0532A5"
  crit: "#C24A44"
  crit-soft: "#F9E4E2"
  good: "#2E9E5B"
  good-soft: "#E2F3E8"
  ice: "#B0E9FD"
  ice-soft: "#E3F6FE"
  ink: "#111E2F"
  ink-mute: "#78899A"
  ink-soft: "#485A6B"
  lime: "#E8FC65"
  line: "#D9E3E6"
  navy: "#111E2F"
  offwhite: "#F1F6F7"
  plate: "#111E2F"
  plate-ink: "#F1F6F7"
  sidebar-active-bg: "rgb(255 255 255 / 0.15)"
  sidebar-ink: "rgb(255 255 255 / 0.78)"
  sidebar-ink-strong: "#FFFFFF"
  sidebar-line: "rgb(255 255 255 / 0.16)"
  surface: "#FEFEFE"
  surface-2: "#FFFFFF"
  warn: "#B97F1D"
  warn-soft: "#FAEFD8"
  white: "#FFFFFF"
  canvas-escuro: "#050A13"
  card-cobalt-bg-escuro: "#0B1A38"
  card-cobalt-ink-escuro: "#E9EFF8"
  card-ice-bg-escuro: "#0B1E2C"
  card-ice-ink-escuro: "#E9EFF8"
  card-lime-bg-escuro: "#1B2110"
  cobalt-escuro: "#0239C7"
  cobalt-dark-escuro: "#1B4BE8"
  crit-escuro: "#E8756D"
  crit-soft-escuro: "#2C1210"
  good-escuro: "#4FC57E"
  good-soft-escuro: "#0E2418"
  ice-escuro: "#8FD9F5"
  ice-soft-escuro: "#0E2231"
  ink-escuro: "#E9EFF8"
  ink-mute-escuro: "#6C7D95"
  ink-soft-escuro: "#9FB0C6"
  lime-escuro: "#D5EF25"
  line-escuro: "#1C2840"
  navy-escuro: "#E9EFF8"
  offwhite-escuro: "#050A13"
  sidebar-active-bg-escuro: "#1B44E5"
  sidebar-bg-escuro: "#080E1A"
  sidebar-ink-escuro: "rgb(233 239 248 / 0.66)"
  sidebar-line-escuro: "rgb(233 239 248 / 0.10)"
  surface-escuro: "#0C1523"
  surface-2-escuro: "#111C2E"
  warn-escuro: "#E0A63C"
  warn-soft-escuro: "#2A1F0A"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
  body:
    fontFamily: "Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"
  monoLegado:
    fontFamily: "Consolas, SFMono-Regular, Courier New, monospace"
---
# Sistema visual da V2G

**Este arquivo REGISTRA o que já existe em `app/globals.css`. Ele não propõe
nada.** Foi escrito à mão a partir do CSS, não gerado pela skill Impeccable —
a decisão foi registrar o incumbente em vez de deixar uma ferramenta propor
um sistema por cima dele.

O frontmatter acima é o que o detector lê (`design-system.mjs` →
`parseFrontmatter` → `normalizeDesignSystem`). A prosa abaixo é para gente.

---

## Por que ele existe

Sem `DESIGN.md`, a regra de cor do detector fica **desligada**:
`isAllowedColorRaw` começa com `if (!designSystem?.hasColors) return true`.
Medido antes deste arquivo — `#ff00aa`, `rgb(12, 200, 90)` e `#123456` num
arquivo de teste em `app/` passaram sem um único achado.

"Zero valor de cor fora do `:root`" era regra que nenhuma ferramenta
verificava. Este arquivo é o que liga a verificação.

## Cores — 58 chaves, 29 tokens

Os 29 tokens de cor do `:root`, com o valor do tema claro. Os que mudam no
tema escuro entram uma segunda vez com o sufixo `-escuro`, porque o
frontmatter é um mapa e cada chave só carrega um valor — sem isso, toda cor
exclusiva do modo escuro seria reprovada.

Não estão aqui, porque não são cor: os pares `--*-rgb` (triplas para
`rgb(var(--x-rgb) / alfa)`), as medidas (`--shell-max`, `--sidebar-w`,
`--auth-card`, `--auth-max`) e os aliases que apontam para outro token
(`--canvas: var(--offwhite)`).

## Tipografia — três famílias, e a terceira só apareceu no teste

`Archivo` no display e `Segoe UI` no corpo, os dois com token no `:root`. No
CSS o display é `var(--font-archivo)`, a variável que o `next/font/google`
gera em `app/layout.tsx`; aqui o nome real da família é declarado, porque é
ele que o detector compara.

**A monoespaçada não tem token e por isso passou despercebida.** Declarei só
display e corpo na primeira versão deste arquivo, e a varredura reprovou na
hora três usos legítimos: `Consolas` na linha 721 e `Cascadia Mono` nas 1828
e 1854 — os blocos de código das telas de operador. Não era falso positivo:
era este arquivo declarando um sistema menor que o real.

Duas pilhas monoespaçadas diferentes convivem no CSS, e as duas estão
registradas como estão (`mono` e `monoLegado`). Unificá-las seria mudança de
design, não registro — e este arquivo não propõe nada. Fica anotado como
inconsistência conhecida: uma delas provavelmente devia sumir.

## O que este arquivo NÃO declara, de propósito

**Não há escala tipográfica.** O `globals.css` usa 23 tamanhos distintos, em
incrementos de meio pixel (9.5px, 10px, 10.5px, 11px, 11.5px…). Isso é uso
ad hoc, não escala. Declarar os 23 como se fossem uma rampa tornaria a regra
inútil; declarar sete inventaria um sistema que ninguém adotou — e a escala
de sete passos está registrada como *não aplicada*. O detector abstém-se
quando `typography.scale` está ausente, que é o comportamento correto aqui.

**Não há escala de raio.** Não existe token `--radius*` no `:root`; os 8
valores de `border-radius` (3, 4, 6, 8, 10, 12, 14, 999px) estão soltos nas
regras. Mesmo raciocínio: registrar o que não é sistema fingiria uma decisão
que não foi tomada.

As duas ausências são **honestas, não incompletude**. Se um dia a escala for
adotada de verdade, ela entra aqui — e aí a regra correspondente liga
sozinha.

## Como regenerar

O frontmatter sai do `globals.css` por script, não à mão: 58 chaves copiadas
a dedo erram em silêncio, e um valor errado aqui reprova cor legítima ou
aprova cor que não existe. O script está em `scripts/gerar-design-md.mjs`.

```bash
node scripts/gerar-design-md.mjs
```

Rode depois de mexer nos tokens, e confira o efeito com o teste abaixo.

## O teste que prova que está funcionando

```bash
cat > app/__t.css <<'CSS'
.mau { color: #ff00aa; }
.bom { color: #0239C7; font-family: ui-monospace, "Cascadia Mono", monospace; }
CSS
node .claude/skills/impeccable/scripts/detect.mjs --json app/__t.css
rm app/__t.css
```

Tem que dar **1 achado**: só o `#ff00aa`. O `.bom` usa cor e fonte que estão
declaradas e não pode ser reprovado.

**NÃO use `--no-config` neste teste.** Essa flag desliga o `DESIGN.md` junto
com o resto — está no `--help` ("Do not apply project config, detector
ignores, inline ignore comments, or DESIGN.md"). Rodei a primeira vez com
ela e vi 0 achados dos dois lados, o que parecia formato quebrado e era
teste quebrado. Para desligar só o design system existe `--no-design-system`.

Os dois lados importam. Só a reprovação do `#ff00aa` não prova nada — um
frontmatter ilegível reprovaria cor legítima do mesmo jeito, porque
`parseFrontmatter` devolve `null` em silêncio e o detector abstém-se sem
erro nenhum.
