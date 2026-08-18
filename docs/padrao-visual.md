# Padrão visual

Medidas extraídas do `/inicio`, que é a tela onde o padrão foi acertado.
Tudo aqui é o que **já está no código e funciona** — não é proposta de
design novo. As outras telas se alinham a estes números.

Fonte: `app/globals.css` e `app/(protected)/inicio/page.tsx`.

---

## 1. A faixa de destaque (`.hero-destaque`)

A única superfície que grita na tela. **Uma por tela, no máximo.**

| Propriedade | Valor | Por quê |
|---|---|---|
| `background` | `var(--cobalt)` | superfície de acento, não card |
| `color` | `var(--white)` | branco literal, não `--surface` |
| `margin` | `0 -34px 22px` | sangra até as bordas do canvas |
| `padding` | `40px 34px 36px` | o `34px` devolve o sangramento |
| altura | **não fixada** | cresce com o conteúdo |

**O sangramento é o que faz ela ser faixa e não card.** A margem negativa
lateral é exatamente o padding lateral do `.canvas` (`34px`), devolvida
como padding interno. Sem isso, o bloco para na coluna de conteúdo e lê
como "card grande" — que é outra coisa, e não grita.

> Consequência para quem for reusar: em `(fluxo)`, dentro de
> `.auth-card` (padding `30px`), o `-34px` **estoura o card**. Ver §6.

### Os quatro papéis dentro da faixa

| Elemento | `font-size` | Cor | Margem |
|---|---|---|---|
| `.eyebrow` | `11px`, `0.14em`, caixa alta | herdada | `0 0 10px` |
| `.hero-num` | `clamp(56px, 11vw, 104px)` | `--white` | `0` |
| `.hero-legenda` | `clamp(15px, 1.8vw, 19px)` | `--lime` | `12px 0 0` |
| `.hero-sub` | `clamp(14px, 1.5vw, 16px)` | branco 85% | `4px 0 0` |
| `.hero-frase` | `clamp(26px, 3.4vw, 40px)` | `--offwhite` | `0` |
| `.hero-note` | `13px` | branco 72% | `16px 0 0` |

Outros valores que sustentam o número: `line-height: 0.92`,
`letter-spacing: -0.03em`, `font-variant-numeric: tabular-nums`.

**`--lime` aparece uma vez por tela, e é dentro da faixa** — no rótulo,
para marcar *o que o número significa*. Lima em dois lugares na mesma tela
já não marca nada.

`.hero-num` e `.hero-frase` são **alternativas, não companheiros**: número
quando há dado, frase quando não há. As larguras máximas (`26ch` na
legenda, `20ch` na frase) existem para forçar quebra antes da linha ficar
longa demais para o corpo do texto.

---

## 2. Escala tipográfica — **23 tamanhos hoje**

Você previu certo: é sintoma. São **136 declarações de `font-size` em 27
valores distintos**, muitos separados por 0,5px — diferença que ninguém
percebe lado a lado, mas que impede qualquer ajuste global.

Inventário completo, por frequência:

```
22× 13px      6× 13.5px     2× 26px      1× 20px
18× 12.5px    6× 11px       2× 18px      1× 17px
16× 12px      6× 10px       2× 9.5px     1× 16px
14× 14px      6× 10.5px     1× 27px      1× 15.5px
12× 15px      3× 22px       1× 24px      1× 21px
 8× 11.5px                  1× 13px !important

fluidos: clamp(56,11vw,104) · clamp(26,3.4vw,40) · clamp(24,2.6vw,34)
         clamp(15,1.8vw,19) · clamp(14,1.5vw,16)
```

Onze desses valores aparecem **uma vez só**. Não são decisões — são
sobras de portes de tela feitos em momentos diferentes.

### A escala mínima proposta: 7 degraus

Cinco não dá, e vale dizer por quê: são necessários seis níveis de
**texto** (sobrescrito, apoio, corpo, leitura, título de seção, título de
tela) e o número-herói, que não é texto — é peça gráfica. Forçar cinco
faria o título de seção colidir com o da tela.

| Token | Valor | Papel | Absorve hoje |
|---|---|---|---|
| `--fs-micro` | `11px` | eyebrow, pílula, delta, rótulo de eixo | 9.5, 10, 10.5, 11, 11.5 |
| `--fs-sm` | `12.5px` | metadado, nota de rodapé, hint | 12, 12.5 |
| `--fs-body` | `14px` | corpo de texto padrão | 13, 13.5, 14 |
| `--fs-lead` | `16px` | subtítulo, primeira linha de bloco | 15, 15.5, 16, 17 |
| `--fs-h2` | `20px` | título de seção | 18, 20, 21, 22 |
| `--fs-h1` | `26px` | título da tela (`.page-head h1`) | 24, 26, 27 |
| `--fs-hero` | `clamp(56px, 11vw, 104px)` | o número que domina | — |

Os fluidos intermediários (`.hero-legenda`, `.hero-sub`, `.hero-frase`)
continuam fluidos: eles existem porque precisam encolher em 375px, e
travá-los quebraria justamente o caso que motivou o `clamp`.

**Isto ainda não foi aplicado.** Trocar 136 declarações é mudança de
risco próprio e merece passo separado — mexe em toda tela ao mesmo tempo,
inclusive nas que não estão neste lote. Proponho fazer depois que as telas
estiverem alinhadas, para a comparação antes/depois ser confiável.

---

## 3. Espaçamento, raio e borda

### Raio

| Valor | Uso | Ocorrências |
|---|---|---|
| `12px` | card padrão (`.hero-card`, `.cobranca`, `.tema-opcao`) | 12 |
| `10px` | item de lista, bloco de navegação | 12 |
| `8px` | elemento pequeno dentro de card | 7 |
| `6px` | selo, aviso, `.trust` | 4 |
| `4px` | micro (ponto, marcador) | 7 |
| `14px` | `.auth-card` — o card do fluxo é o maior | 2 |
| `999px` / `50%` | pílula e círculo | 8 |

Convergiu sozinho: **12px é card, 10px é item, 8px e 6px são internos.**
Os `3px` e `14px` avulsos são exceções pontuais, não degraus.

### Borda

**`1.5px` é a espessura do sistema** — 32 das 51 declarações. `1px` (16×)
aparece em divisórias internas, onde a borda separa mas não delimita.
`--line` sempre; nunca uma cor direta.

### Gaps mais usados

`12px` (11×) · `10px` (8×) · `14px` (5×) · `9px` (5×) · `8px` (4×)

Entre blocos maiores o espaçamento é **margem**, não gap: `.page-head`
fecha com `22px`, a faixa também (`margin-bottom: 22px`), e o
`.dash-grid` usa `gap: 22px`. **22px é a distância entre blocos de uma
tela.**

---

## 4. Layout

| Token / regra | Valor |
|---|---|
| `.canvas` padding | `30px 34px 56px` |
| `--shell-max` | `1240px` |
| `--sidebar-w` | `252px` (→ `76px` abaixo de 900px) |
| `.dash-grid` | `minmax(0, 1fr) 340px`, gap `22px` |
| `.page-head` | margem inferior `22px`; `h1` 26px; `p` 13.5px / `70ch` |
| `.auth-grid.solo` | coluna única de `580px`, centralizada |
| `.auth-card` | `--surface`, borda `1.5px`, raio `14px`, padding `30px` |

---

## 5. Grupo app — o que grita em cada tela

A regra: **uma coisa por tela, e só se merecer.** Tela sem nada que
mereça não ganha faixa.

| Tela | O que grita | Por quê |
|---|---|---|
| `/vendas` | quantas pessoas começaram conversa — ou, hoje, que ninguém começou e o motivo | É a razão de a tela existir. Sem esse número, ela não tem assunto. |
| `/anuncios` | **condicional**: o que espera você agora (peça para aprovar, publicação que falhou). Sem pendência, **sem faixa**. | O conteúdo normal é uma lista, e lista não grita. Faixa permanente aqui viraria moldura decorativa. |
| `/alertas` (menu: Avisos) | **condicional**: o aviso mais recente que pede ação. Sem aviso, **sem faixa**. | Mesma lógica. "Nenhum aviso" é boa notícia e não merece o maior elemento da tela. |
| `/conta` | **nada. Sem faixa — decisão deliberada, ver abaixo.** | É tela de ajuste: o cliente chega sabendo o que veio fazer. Destacar uma seção seria escolher por ele, e a escolha mudaria a cada visita. |

Duas das quatro só ganham faixa quando há o que dizer, e uma nunca ganha.
Isso é de propósito: se toda tela tiver faixa, faixa deixa de significar
"olhe aqui".

### A `/conta` não ganha faixa. Isso está pronto, não pela metade.

Escrito aqui porque a ausência parece esquecimento, e alguém vai querer
"completar" a propagação visual acrescentando uma faixa a ela. **Não
acrescente.**

Uma faixa precisa de um assunto fixo. Na `/conta` esse assunto mudaria a
cada visita — hoje o cartão recusado, amanhã o tema, depois o plano — e
faixa que muda de assunto não é destaque, é moldura. Moldura ensina o olho
a pular, e o custo não cai só na `/conta`: cai na `/vendas`, que precisa que
a faixa cobalto ainda signifique alguma coisa quando aparecer.

Se um dia a `/conta` tiver **um** estado que valha a dobra — cobrança
recusada com a campanha parada é o único candidato plausível — ele entra
como faixa **condicional**, no mesmo desenho da `/anuncios` e da
`/alertas`: aparece porque há motivo, some quando não há. Nunca permanente.

### A faixa condicional, implementada nas duas

| Tela | Quando aparece | O que mostra | Quando não aparece |
|---|---|---|---|
| `/anuncios` | há pendência | a pendência, em cascata de gravidade: publicação falhada → criativo reprovado → peça esperando | some inteira; fica o `.page-head` e a lista |
| `/alertas` | `needs_review = true` em `decisions` | **a contagem**, não a descrição | some inteira; responde o `.empty-hero` |

**Por que a `/alertas` conta em vez de descrever.** Os cards das pendências
estão logo abaixo da faixa, na mesma tela. Descrever a mais urgente na
faixa a repetiria como card três centímetros depois. Contar não repete — e
a contagem é a informação que não existia: com sete pendências ninguém
sabia que eram sete sem rolar.

A alternativa considerada era a faixa mostrar a primeira e a lista mostrar
só o resto. Foi recusada porque quebra no caso de uma pendência só: a seção
"Precisa de você" ficaria vazia **enquanto existe uma pendência** — mentira
por omissão, que é o que este projeto vem tirando das telas.

**A `/alertas` não tem cascata de gravidade, e isso é deliberado.** A
`/anuncios` ordena por gravidade porque aqueles três estados existem e têm
gravidade conhecida. Em `decisions` os `kind` são `classification` e
`diagnosis`, e nenhum é mais urgente que o outro. Ordenar por gravidade
inventada fingiria um julgamento que ninguém fez; a ordem é a que a
consulta já usava — mais recente primeiro. O CTA leva à primeira dessa
ordem, por âncora, porque não existe rota por decisão.

**Concordância tratada:** *"1 coisa precisa de você"* e *"3 coisas precisam
de você"*. Errar concordância num elemento que ocupa a dobra é o tipo de
detalhe que faz a tela inteira parecer não revisada.

---

## 6. Grupo fluxo — o mesmo esqueleto

Todas usam:

```
<div className="auth-grid solo">      largura 580px, centralizada
  <main className="auth-card">        surface, borda 1.5px, raio 14px, padding 30px
    <div className="page-head">       h1 + parágrafo
    …conteúdo…
    …ação que avança, por último…
```

**O destaque aqui não é número, é a ação.** O botão que avança fecha a
tela, e é o único `.cta` cheio — os outros são `.ghost` ou link.

**A faixa cobalto precisa de ajuste para viver dentro do card.** O
`margin: 0 -34px` foi calculado contra o padding do `.canvas` (34px), não
contra o do `.auth-card` (30px). Hoje `/verba`, `/sem-instagram` e
`/whatsapp-business` usam `.hero-destaque` dentro de `.auth-card` e
sangram 4px a mais de cada lado. É pequeno e é real — corrigir com uma
variável de sangramento (`--sangria`) redefinida no contexto do card, em
vez de duplicar a regra.

---

## 7. Cor: uma exceção, declarada

Nenhum valor de cor vive fora do `:root` na folha de estilo. Existe **uma
exceção deliberada**: as oito cores literais em
`app/(protected)/conta/SeletorDeTema.tsx`, nas miniaturas de tema.

Elas precisam mostrar o tema que **não** está ativo. Se usassem os
tokens, as três amostras ficariam idênticas — pintadas pelo tema atual — e
a escolha viraria adivinhação. É o único lugar onde um literal é a
resposta certa, e por isso está escrito lá e aqui.
