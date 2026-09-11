# Os quatro pilares, medidos — 10/09/2026

O lote de cinco itens, e o estado do produto por trás dele.

Todo número aqui tem comando ao lado. **Nada foi commitado nem
deployado** — a working tree tem 5 arquivos modificados e 9 novos.

```bash
pnpm conferir   # exit 0 — 12 conferidores
pnpm build      # exit 0
```

---

## 0. O que depende de decisão humana

Seis, e as três primeiras travam trabalho que já está pronto para
começar.

### 0.1 ~~O contrato do dashboard e o da pergunta do dia não estão neste repositório~~

> **RESOLVIDO no mesmo dia, mais tarde — ver `docs/estado/tela-de-resultado-10-09.md`.**
>
> `docs/contrato-do-dashboard.md` foi copiado para este repositório, e a
> medição abaixo **venceu**: os campos chegaram. Contra produção
> (`versao 89971779574a`), a rota da execução devolve `moeda: "BRL"`,
> `nivel: "sem_alvo"`, `nivel_frase`, `cliques: 64`, `impressoes: 1657` e
> `pessoas_que_chegaram_medido: null`; a do negócio devolve os mesmos,
> mais `moedas[]` e `por_execucao[]`.
>
> O que estava certo aqui e continua: **a camada de leitura degradava e a
> tela não existia.** Agora as duas leem os campos de verdade.

O briefing manda lê-los primeiro. `docs/contrato-do-dashboard.md` e
`docs/contrato-da-pergunta-do-dia.md` **não existem aqui** — os contratos
anteriores do backend viviam num worktree separado.

E não é só o arquivo: **os campos que o briefing descreve não estão na API
publicada.** Medido em 10/09, **de manhã**:

```
GET /negocios/{id}/consolidado   → sem moeda, sem nivel, sem cliques
GET /execucoes/{id}/consolidado  → sem moeda, sem nivel, sem cliques
```

O briefing diz que a rota do negócio não tem esses campos, implicando que
a da execução tem. **Ela também não tem.**

A camada de leitura foi construída assumindo que eles chegam e degradando
enquanto não chegam. **A tela não foi**, e não deve ser até o contrato
existir de verdade.

### 0.2 O tom do degrau do meio da pergunta do dia

`docs/estado/perguntas-pendentes-os-tres-tons.md`, §4. O backend chama o
degrau de `cobranca`; eu escrevi um texto que **não cobra** — dá o motivo
do dono e o tamanho do esforço. Se a intenção era subir a pressão, minha
versão desobedece.

E a segunda: **nos três degraus a mensagem só alcança quem já voltou.**
Quem sumiu seis dias não abre o app. Falta o disparador, e ele continua
sendo o que falta desde 01/09.

### 0.3 Nenhuma rota diz QUAIS fotos pedir

`docs/estado/fotos-a-tela-nao-sabe-o-que-pedir.md`. O achado do item 5, e
ele bloqueia o pilar 3 inteiro. O pedido ao backend está na §2 de lá:
`GET /execucoes/{id}` incluir `fotos_pedidas[]` com `angulo`, `rotulo` e
`recebida`.

### 0.4 `POST /execucoes/{id}/criativo-pronto` não está publicada

O briefing descreve a rota com `motivo` e `achados_tecnicos`. O
`openapi.json` não a tem. O que existe é `criativos-enviados`, com
`recebidos`, `recusados[]` e `videos`. O cliente aponta para a que existe.

### 0.5 As três inertes do `.side-support` estão há 20 dias em "pendente"

Declaradas em `f392ce3`, 21/08. São a **mesma** decisão contada três
vezes: o card lateral é de vidro sobre o cobalto, como o CSS pede, ou
claro, como a tela mostra? Consequência visual em 9 telas.

O `conferir:cascata` passa verde por declaração. **Nenhum conferidor cobra
prazo** — proposta registrada: a declaração ganhar data e o conferidor
avisar passados N dias.

### 0.6 27 commits + este lote, sem push

Push é pelo GitHub Desktop, por você. O terminal aqui autentica como
`piligrin00`, que não tem escrita.

---

## 1. Onde os quatro pilares estão

| pilar | estado | o que falta |
|---|---|---|
| **1 — subir campanha** | pipeline roda ponta a ponta desde 25/08 | as fotos do cliente (pilar 3) |
| **2 — extrair dados** | backend coleta; **nenhuma tela mostra** | camada pronta, tela bloqueada em 0.1 |
| **3 — criar criativo** | gerador existe | **travado**: sem foto do cliente, não roda — 0.3 |
| **4 — analisar criativo pronto** | rota audita | cliente pronto, tela bloqueada em 0.4 |
| **loop diário** | card no ar, resposta grava | **mudo**: falta disparador — 0.2 |

**A `/inicio` do negócio da V2G está em `aguardando_fotos` desde 25/08.**
São 16 dias parado no mesmo lugar, e o que desbloqueia é o item 0.3.

---

## 2. O mapa: o que o webapp consome

`docs/o-que-o-webapp-consome.md`, escrito neste lote.

```bash
GET /openapi.json → 49 operações em 48 paths
```

**Consome 6.** Escritas e sem consumidor: **4** — `consolidadoDaExecucao`,
`execucoesEmRevisao`, `preRequisitos`, `saude`. Ignoradas: **39**, das
quais 26 são do n8n e **13 deveriam ser nossas**.

**Todas as chamadas saem do servidor do Next.** Nenhuma do browser.

### A pergunta que decidiu o resto

**Não existe nenhuma tela que mostre resultado de campanha.** Não é
"existe e está incompleta". As três que tentam leem `metrics_daily`, do
Supabase, que tem zero linhas e que **ninguém escreve**.

---

## 3. O que foi construído

### `lib/resultado/` — a camada de leitura do dashboard

`pnpm conferir:resultado` → **70/70**.

- **as sete frases** da escada, cada uma para o dono do negócio. Os seis
  primeiros níveis são formas diferentes de "ainda não dá para afirmar" —
  nenhum é avaliação da campanha
- **um bloco por moeda, nunca soma.** `73,25 + 113,45 = 186,70` é
  asserção negativa
- **`null` não é zero**, do lado da leitura como já era do lado da
  resposta. A soma preserva ausência: se todos os dias são `null`, o total
  é `null`, não `0`
- **o nível vem da janela canônica**, e a assinatura recebe recorte e
  canônico separados — quem quiser o nível do recorte passa duas vezes, de
  propósito
- **três recusas lidas do código**, não da intenção: sem custo por clique,
  sem nota nem semáforo, sem `?? 0`

### `lib/dia-seguinte/pendentes.ts` — o consumo de `/perguntas-pendentes`

`conferir:dia-seguinte` foi de 138 para **154**. A escada conferida
incluindo o teto: **dia 6 e dia 90 saem iguais**.

O nível **vem do backend**; `nivelEsperado()` existe só para o conferidor
cruzar. Nenhuma tela chama — a rota devolve o nome do negócio de todos os
clientes, e servir isso a um cliente logado seria vazamento.

### `lib/criativos/envio.ts` + `lib/backend/criativos-do-cliente.ts`

`pnpm conferir:envio` → **43/43**.

Recusa no navegador antes do upload: vídeo, formato, extensão que não bate
com o conteúdo, lado menor abaixo de 1024, arquivo vazio. **Nenhum texto
usa a palavra "erro"** — a pessoa mandou a foto do próprio negócio e não
errou nada.

`lib/backend/cliente.ts` ganhou `enviarArquivos()`: `multipart/form-data`
com o `Content-Type` deixado para o `fetch`, porque o `boundary` só ele
sabe.

---

## 4. As decisões que tomei sozinho

**`AU$`, e não `A$`.** O briefing escreve "A$ 113,45", que é como um
australiano lê. O `pt-BR` do próprio ICU escreve `AU$ 113,45` — medido. E
não usei `currencyDisplay: "narrowSymbol"`, que daria só `$`,
indistinguível de dólar americano. Num campo que fala do dinheiro do
cliente, símbolo ambíguo é pior que símbolo comprido.

**Sem moeda, nenhum símbolo.** Enquanto o backend não manda `moeda`, o
valor sai sem cifrão. Chutar `R$` seria escrever número errado com
aparência de certo.

**O degrau do meio não cobra.** Ver 0.2 — é a decisão que mais quero que
você derrube se discordar.

**Não construí duas telas.** A do dashboard e a de fotos. Nos dois casos o
que eu escreveria seria contra campos imaginados ou seria o "mande umas
fotos" que o lote recusou.

---

## 5. O que não deu certo

**A frase de degradação era idêntica à do `sem_alvo`.** Palavra por
palavra. Com títulos iguais, "o backend não mandou o nível" e "o nível é
sem_alvo" viravam a mesma tela — a família de defeito que este repositório
já pagou duas vezes (o card que sumia sem rastro, a `/inicio` degradando
calada). **O conferidor pegou.**

**O conferidor acusava a própria copy.** A asserção "não existe nota nem
semáforo" lia as strings junto com o código, e a frase legítima "não dá
para dizer se o preço está bom" batia. Agora o §8 tira comentário **e**
texto de tela antes de procurar.

**`\b` dentro de template literal é backspace**, não fronteira de palavra
— defeito herdado do lote anterior, corrigido lá, e vale repetir aqui
porque é armadilha silenciosa: a regex passa e não casa nada.

---

## 6. Dois achados que ninguém pediu

**`/anuncios:252` mostra custo por conversa.** `investido / conversas`,
renderizado como "R$ X por conversa". É custo por clique com outro nome —
exatamente o que o contrato do dashboard proíbe, já em produção. Só não
morde porque a fonte está vazia. **No dia em que `metrics_daily` receber
linha, a tela passa a mostrar um número que a regra nova proíbe.**

**`/anuncios` promete 48 horas.** "No ar há pouco tempo — os primeiros
números aparecem em até 48 horas". Para uma campanha de 13 dias é
literalmente falso, e é do tipo que faz o cliente ligar no dia 3.

Nenhum dos dois consertado: a tela inteira vai ser revista com o
dashboard, e consertar agora seria mexer em código que vai sair.

---

## 7. O que este lote NÃO mediu

- **Não exercitei nenhuma escrita contra produção.** Nem `POST /fotos`,
  nem `criativos-enviados`, nem `resposta-do-dono`. Escrita em produção
  não acontece sem OK.
- **Não sei se o backend recusa foto por qualidade hoje.** O lote diz que
  sim (1024px, formato, contraste); o `openapi.json` só descreve o
  `recusados[]` da resposta. Minha validação usa os números do lote — se
  o backend usar outros, quem está errado é o meu arquivo.
- **Não olhei o que o n8n consome.** As 26 rotas classificadas como "de
  outro cliente" foram lidas pelo nome e pelo lugar no pipeline, não
  medidas contra os fluxos de lá.
- **`campaigns` também tem zero linhas** e é lida pelas mesmas telas que
  a `metrics_daily`. Pode ter a mesma história, e não investiguei.
