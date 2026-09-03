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

## 2. Escala tipográfica — **resolvida, em `docs/escala-tipografica.md`**

Esta seção descrevia os 23 tamanhos soltos e propunha uma rampa de sete
degraus que nunca foi aplicada. **Os dois deixaram de valer em 19/08/2026**,
quando a escala foi medida, decidida e aplicada. Manter aqui o inventário
antigo seria manter um documento que descreve um estado que não existe.

O que vale agora, em uma linha: **seis degraus** — 11 · 13 · 15 · 18 · 22 ·
26px — mais a faixa fluida do herói, todos com token no `:root` e nenhum
literal de `font-size` fora dele. O `DESIGN.md` declara a rampa, e o
detector reprova tamanho fora dela.

Tudo o mais está em **[`escala-tipografica.md`](escala-tipografica.md)**: o
levantamento das 162 declarações, o mapeamento valor a valor, as quatro
mudanças que passaram de 1px e foram medidas no navegador antes de entrar, e
— o que mais importa para quem for mexer nisso — o limite medido da
fiscalização, que aceita meio pixel de desvio e por isso não é a guarda
principal.

Duas correções ao que estava escrito aqui, para quem comparar com o
histórico: a contagem era de **136 declarações em 27 valores** e a medição
de agosto achou **162 em 28** — o arquivo cresceu, não houve erro. E a rampa
de sete degraus não teria funcionado: `--fs-body: 14px` movia a âncora (13px
era o valor mais usado, em 32 declarações), e os degraus de baixo ficavam a
1,5px um do outro, dentro da tolerância do detector — aplicada, ela deixaria
`11.5`, `12`, `13` e `13.5` todos válidos.

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
| `/alertas` (menu: Avisos) | **nada. Sem faixa** — esta previsão estava errada, ver abaixo. | A contagem vive no título da seção. |
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

### A `/alertas` também não ganha faixa — e esta previsão estava ERRADA

A primeira versão deste documento previa faixa condicional aqui: "o aviso
mais recente que pede ação". A faixa foi construída, revisada na tela e
**removida**. O registro fica porque previsão errada apagada vira previsão
que alguém reimplementa daqui a três meses lendo a versão antiga.

**O que a construção mostrou.** Faixa compra atenção antes da rolagem. Na
`/vendas` isso vale: o número é o assunto da tela. Na `/anuncios` vale por
outro motivo — a faixa fala de pendência que vive em **outra rota**, e a
lista abaixo é assunto diferente; a faixa leva para fora. Na `/alertas` não
havia nem um nem outro: o título da seção já está acima da dobra, três
centímetros abaixo, e a faixa repetia com letra maior.

### Três defeitos apontando para o mesmo elemento significam que o defeito é o elemento

Vale além desta tela, e é por isso que está escrito aqui e não num commit.

A revisão da faixa da `/alertas` levantou três problemas que pareciam
independentes:

1. o rótulo "Precisa de você" aparecia duas vezes, na faixa e no título da
   seção logo abaixo;
2. o CTA saltava para um card que já estava visível;
3. o número no tamanho herói parecia grande demais.

A saída fácil era corrigir os três: renomear um dos rótulos, esconder o CTA
abaixo de um mínimo de itens, reduzir a fonte. Três remendos, e a faixa
continuaria de pé.

Mas os três tinham **a mesma causa**: a faixa e a seção tinham o mesmo
assunto. O rótulo duplicava porque o assunto era o mesmo; o CTA não saía do
lugar porque o destino já estava na tela; o número parecia grande porque
`clamp(56px, 11vw, 104px)` foi calibrado para um número que **é** o assunto,
não para contar itens de uma lista logo abaixo.

**Quando vários defeitos independentes apontam para o mesmo elemento, o
defeito costuma ser o elemento — não os detalhes dele.** Corrigir um por um
funciona, deixa a tela passável, e mantém no lugar a coisa que não devia
estar lá. Antes de remendar o terceiro, vale perguntar se os três não são o
mesmo.

### Quando a `/alertas` reabre a discussão

Ela ganha faixa quando existir pendência **categoricamente diferente** das
outras — não "mais uma", outra classe. O candidato óbvio é **campanha parada
por falta de pagamento**: a própria tela já diz, na barra lateral, que é o
único aviso que não dá para desligar, porque é dinheiro parado.

Aí a faixa antecipa algo que a lista não distingue, que é exatamente o
serviço que ela presta. Hoje `decisions` não separa esse caso, então o
critério fica escrito esperando o dado existir.

### A faixa condicional, implementada em uma tela só

| Tela | Quando aparece | O que mostra | Quando não aparece |
|---|---|---|---|
| `/anuncios` | há pendência | a pendência, em cascata de gravidade: publicação falhada → criativo reprovado → peça esperando | some inteira; fica o `.page-head` e a lista |

Uma tela só do grupo app tem faixa, e é uma exceção com motivo: ela aponta
para **fora** da tela. Exceção com motivo é melhor que regra cumprida por
simetria.

**A contagem, onde ela ficou.** Na `/alertas` a contagem vive no título da
seção, via `.grp-count` — o mesmo padrão que a `/anuncios` já usava nos
cabeçalhos de grupo. Dá a mesma informação, no lugar onde a pessoa já vai
olhar, sem gastar o elemento mais caro da tela.

**Concordância tratada:** *"1 coisa"* e *"3 coisas"*. Sobreviveu à remoção
da faixa porque o problema é o mesmo: errar concordância faz a tela parecer
não revisada, e num contador isso aparece no primeiro uso real.

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


---

## 8. Data que o dono lê leva o dia da semana

`diaPorExtenso()` em `lib/formato.ts`. `2026-08-31` vira **`sábado, 31/08`**.

O dono lembra por dia da semana — *"quantas vendas na quinta"* —, não por
número do mês. Data crua sozinha obriga ele a traduzir de cabeça antes de
conseguir responder, e essa tradução aparece exatamente onde a gente menos
pode pagar por ela: na hora de pedir um número.

Nasceu no card da pergunta diária (`PerguntaDoDia`, 03/09/2026) e virou
padrão no mesmo dia, por decisão do Victor.

**Onde vale e onde não vale.** Vale para toda data que o dono *lê* —
convite, pergunta, resumo. **Não vale para carimbo de auditoria:** "você
conferiu isso em 12/08" é registro, não convite, e ali o dia da semana só
faz ruído.

**A função mora em `lib/formato.ts`, não na tela.** Regra de formatação que
mora no componente vira regra de um componente só: a próxima tela reescreve
à mão, com outra decisão, e o padrão deixa de existir sem ninguém notar.

**O que ainda não migrou**, e por quê: `/alertas`, `/meu-negocio`,
`Saudacao` e `revisar-perfil` usam `toLocaleDateString` direto. São
anteriores à regra, e cada uma precisa de uma decisão caso a caso — aquela
data é para ler ou para conferir? Não é troca em massa.
