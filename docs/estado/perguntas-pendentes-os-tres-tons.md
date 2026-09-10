# Os três tons da pergunta do dia — proposta, aguardando decisão

Escrito em 10/09/2026. **O consumo de `GET /perguntas-pendentes` está
construído; os textos abaixo NÃO estão implementados em tela nenhuma** —
o Victor pediu para ver antes, e o tom do degrau do meio é decisão de
produto, não minha.

---

## 0. A escada, medida

```
0-2 dias   pergunta
≥3 dias    cobranca
≥6 dias    oferta_de_ajuda      ← teto. 6 dias e 90 dias saem IGUAIS
```

O teto é o dado mais importante para escrever os textos: **o terceiro tom
vai ser lido muitas vezes pela mesma pessoa.** Um texto que funcione uma
vez e irrite na quinta é um texto errado para esse degrau.

---

## 1. A objeção antes das frases: `cobranca` é o nome do estado, não o tom

O backend chama o degrau do meio de `cobranca`. **Isso descreve o que o
sistema está fazendo, não o que o dono deve sentir.**

E aqui é onde o produto vira chato — palavra do Victor, e ele está certo.
Três dias sem responder não é dívida. É uma pessoa que estava ocupada
tocando o negócio dela, que é literalmente o que a gente diz que ela
deveria estar fazendo.

**Proposta: o degrau do meio não cobra.** Ele lembra e dá um motivo — e o
motivo é dele, não nosso. A diferença entre "você não respondeu" e "sem
esse número eu não consigo te dizer se valeu a pena" é a diferença entre
cobrar e explicar.

---

## 2. Os três

### `pergunta` — 0 a 2 dias

> **Uma pergunta rápida sobre ontem**
> Quantas dessas conversas viraram venda ontem?

É o que já está no ar, em `PerguntaDoDia`. **Não muda.**

---

### `cobranca` — 3 a 5 dias

> **Faz alguns dias que a gente não se fala**
> Sem saber quantas vendas entraram, eu consigo mostrar quanto você
> investiu — mas não consigo dizer se valeu a pena. São dois toques, e é
> a parte que só você sabe.

O que ela faz, e cada escolha tem motivo:

- **"faz alguns dias"**, e não "faz 4 dias". O número exato soa como
  registro de ponto. Ele também obriga a tela a estar certa sobre a
  contagem, e a contagem é do backend
- **não usa "você não"** em lugar nenhum. Nenhuma frase começa com o que
  ele deixou de fazer
- **dá o motivo dele**, não o nosso. "Preciso do dado" é nosso problema;
  "não consigo te dizer se valeu a pena" é o dele
- **diz o tamanho do esforço** — "dois toques". Quem sumiu por três dias
  imagina que voltar custa caro

---

### `oferta_de_ajuda` — 6 dias ou mais, para sempre

> **Está tudo bem por aí?**
> Faz um tempo que você não aparece, e tudo bem — a campanha segue
> rodando. Se quiser, responda quando puder. E se preferir pausar por
> enquanto, é só falar com a gente que a gente pausa na hora.

O que ela faz:

- **pergunta pela pessoa antes do dado.** É o único degrau que faz isso, e
  é o que justifica o nome do estado
- **tira a urgência de propósito**: "a campanha segue rodando" e "quando
  puder". Nos dois degraus anteriores a resposta era o assunto; aqui o
  assunto é ele
- **abre a porta de saída**, que é regra do `CLAUDE.md` — a porta de saída
  fica visível. Quem sumiu seis dias pode estar querendo sair e não sabe
  como pedir
- **sobrevive à repetição.** Como não cobra e não conta dias, ela pode ser
  lida no dia 6 e no dia 90 sem ficar absurda — que é exatamente o que o
  teto da escada garante que vai acontecer

---

## 3. O que eu decidiria e não decidi

**A oferta de pausa do terceiro tom cria trabalho humano.** "Fale com a
gente que a gente pausa" é uma promessa de atendimento, e hoje quem
atende é uma pessoa no WhatsApp. Se o volume crescer, essa frase é a que
quebra primeiro.

A alternativa seria não oferecer pausa e só perguntar se está tudo bem —
mas aí a porta de saída some justamente de quem mais precisa dela.

**Escolhi manter a oferta.** É a regra do `CLAUDE.md`, e um cliente que
quer sair e não consegue pedir é pior que um WhatsApp a mais.

---

## 4. Duas perguntas que são suas

1. **O degrau do meio pode mesmo não cobrar?** A minha versão troca
   cobrança por explicação. Se o objetivo do backend ao chamar de
   `cobranca` for de fato subir a pressão, a minha versão desobedece —
   e eu prefiro perguntar a assumir.

2. **Onde esses textos aparecem?** Hoje só existe um canal: o card na
   `/inicio`, que a pessoa vê **quando abre o app**. Quem sumiu seis dias
   não está abrindo o app. **Nos três degraus, a mensagem só alcança quem
   já voltou** — o que torna o degrau 3 quase decorativo até existir
   disparo.

Isso não é motivo para não escrever os textos. É motivo para saber que
escrever os textos **não** faz o loop funcionar sozinho: falta o
disparador, e ele continua sendo o que falta desde 01/09.

---

## 5. O que está construído

- `lib/dia-seguinte/pendentes.ts` — tipos, validação de fronteira, e
  `nivelEsperado()` para o conferidor cruzar a escada com o que o backend
  manda. **O nível vem do backend; a função existe para conferir, não
  para calcular.**
- `lib/backend/dia-seguinte.ts` — `perguntasPendentes({ em })`,
  `server-only`, com a mesma degradação das outras.
- **Nenhuma tela chama.** A rota devolve o nome do negócio de todos os
  clientes; servir isso a um cliente logado seria vazamento. Quem vai
  consumir é decisão que depende da §4.
