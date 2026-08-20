# Buraco — o herói do `.canvas` continua sem rede contra estouro

**Medição de 20/08/2026.** Documento de medição: não se atualiza. Se o
defeito for consertado, o conserto é registrado abaixo da linha, sem
apagar o que está aqui.

Encontrado ao fechar o lote QA-3, respondendo à pergunta certa: *"a regra
escopada em `.auth-card` não deixou o herói das telas do QA-2 sem a
correção de estouro?"* **Deixou.** Não é D7 — o D7 era dentro do card, e
está consertado. Este é o mesmo mecanismo no outro contexto.

**Não foi consertado**, e de propósito: as telas afetadas são do lote
QA-2, e o QA-3 não conserta defeito de outro lote.

---

## 1. O que foi medido

Bancada: o `app/globals.css` real servido pelo `next dev`, com a Archivo
700 carregada antes de medir, o DOM `.shell > .canvas > .hero-destaque >
.hero-num` reproduzido literalmente, e cada caixa lida com
`getClientRects()`.

O que o conserto do QA-3 deu à `/verba`, e que o `.canvas` **não** tem:

| | `.auth-card` (consertado) | `.canvas` (como está) |
|---|---|---|
| tamanho do número | `--fs-hero-num-card`, em `cqi` — mede a caixa | `--fs-hero-num`, em `vw` — mede a janela |
| rede de segurança | `overflow-wrap: anywhere` | `normal` — não quebra nunca |

Em **320px de largura** (o `clamp` já está no piso de 56px, e a largura
disponível é 284px):

| conteúdo | largura do texto | estouro | rolagem horizontal |
|---|---|---|---|
| `1.234.567` (7 dígitos) | 254 | cabe | 0 |
| `12.345.678` (8 dígitos) | 286 | **2px** | 0 |
| `999.999.999` (9 dígitos) | 317 | **33px** | **15px** |
| `R$ 2.000,00` | 300 | **16px** | 0 |
| `R$ 30.000,00` | 332 | **48px** | **30px** |
| `R$ 999.999.999,00` | 474 | **190px** | **172px** |

Em **390px** (disponível 354) só os valores grandes estouram:
`R$ 999.999.999,00` passa 120px. Em 1440px nada estoura — a janela cresce
mais rápido que a fonte, que trava em 104px.

**Todas as linhas de dinheiro acima renderizam em UMA linha mesmo
estourando.** É a confirmação do mecanismo do D7: o `Intl` de pt-BR separa
o `R$` dos dígitos com espaço **não separável**, então o valor é um bloco
indivisível — ele não quebra, ele sai. E o que sai da faixa é `--white`
sobre `--canvas`: **1,1:1** no tema claro, invisível.

## 2. Por que ele não está mordendo ninguém hoje

As quatro telas que usam `.hero-num` fora do `.auth-card` mostram
**contagem**, não dinheiro:

| tela | o que está na faixa |
|---|---|
| `/inicio` | `<NumeroQueConta valor={conversas} casas={0}>` — pessoas que abriram conversa |
| `/vendas` | a mesma contagem |
| `/saude-meta` | `{quantas}`, contagem de conexões |
| `/revisar-perfil/[proposta]` | `{decididos} de {N}` — tem espaços comuns, então quebra em vez de estourar |

Para estourar em 320px, uma contagem precisa de **8 dígitos**: dez milhões
de conversas no WhatsApp de uma padaria. Não vai acontecer.

**O que torna isto um buraco e não uma curiosidade:** `NumeroQueConta`
aceita `prefixo` — e o exemplo escrito no próprio JSDoc do componente é
`"R$ "`. No dia em que alguém puser dinheiro nessa faixa — "quanto você
faturou", que é uma tela plausível deste produto — o estouro aparece em
320px com **R$ 1.000,00** e em 390px com valores de sete dígitos. E vai
aparecer como o QA achou: número cortado, metade branca sobre branco.

## 3. O que o conserto seria

O mesmo do D7, sem o `cqi`: o `.canvas` não tem largura fixa, então a
conta `vw` até funciona para a maioria dos casos. O que falta é a **rede**:

- `overflow-wrap: anywhere` no `.hero-num` do contexto `.canvas` — só age
  quando não cabe mesmo, e troca "sai da faixa e some" por "quebra feio e
  continua visível";
- e, se a faixa passar a mostrar dinheiro, o mesmo tratamento de caixa que
  a `/verba` recebeu.

Uma linha de CSS. **Não foi feita** porque toca `/inicio`, `/vendas`,
`/saude-meta` e `/revisar-perfil`, que são telas do lote QA-2 — e porque
regra de CSS que muda o herói de quatro telas merece a medição do dono
delas, não a minha de passagem.

## 4. A regra que este caso confirma

Escopar um conserto por contexto (`.auth-card`) resolve onde foi medido e
**deixa o gêmeo intacto em silêncio**. Não é erro do escopo — era a
fronteira combinada. É erro de achar que o defeito acabou porque a tela
que o mostrou parou de mostrar.

Vale para o próximo: quando um conserto de CSS for escopado, a pergunta
seguinte é sempre *"quem mais tem essa regra, e ficou de fora?"* — e a
resposta vai num documento, não na cabeça de ninguém.
