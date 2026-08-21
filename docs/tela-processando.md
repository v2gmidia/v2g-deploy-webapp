# A tela `/processando` — desenho do lote F

**Desenho escrito em 20/08/2026 antes de qualquer código. Implementado e
verificado em 21/08/2026 — o que rodou e o que não rodou está no §10.**

**As seis decisões do §8 foram fechadas.** A tela foi apagada; o assunto
dela é a etapa 3 da cadeia do `estadoDoCliente()`.

Responde às quatro perguntas do enunciado, **fora da ordem em que elas
foram feitas** — porque a terceira ("a tela continua existindo?") muda o
que as outras três significam, e mapear os seis estados para uma tela que
vai morrer seria trabalho jogado fora.

A ordem daqui: §1 decide se a tela vive. §2 mapeia os seis estados. §3
resolve a ausência de estado de falha. §4 diz de onde vem o dado.

Complementa [`disparo-pipeline.md`](./disparo-pipeline.md) §3 (o
levantamento do defeito), [`auditoria-resultados.md`](./auditoria-resultados.md)
(o que não pode ser exposto) e [`estado-do-cliente.md`](./estado-do-cliente.md)
(a cadeia do QA-2, que é a peça central deste lote).

---

## 0. O QUE FOI MEDIDO HOJE — 20/08/2026

Esta seção registra medição. **Não reescreva quando o código mudar.** O
que envelhece é o §1 em diante.

### 0.1 A TELA NUNCA FOI ALCANÇÁVEL — e isso não estava registrado

O enunciado diz que a contradição é "visível", e que vai aparecer no
primeiro uso real. **Medi, e não vai.** Nenhum caminho do produto leva à
`/processando`.

```
grep -rn "/processando" app components lib proxy.ts
  proxy.ts:45                    "/processando",     ← só a lista de prefixos
  lib/pipeline/relogios.ts:59    comentário
```

Zero `href`, zero `redirect`, zero `router.push`. E não é regressão — o
histórico nunca teve um:

```
git log -S'href="/processando"'                     →  nenhum commit
git log -S'"/processando"' -- app components lib    →  nenhum commit
```

O protótipo tinha o link. `design/tela-03-onboarding-desktop.html:358`
fecha o onboarding com **"Acompanhar minha campanha" → tela 4**. No
produto, os dois fins de onboarding vão para outro lugar:

```
app/(fluxo)/onboarding/page.tsx:34     href="/inicio"
app/(fluxo)/onboarding/Trilha.tsx:172  href="/inicio"
```

**O produto já trocou a decisão de fluxo do protótipo, em silêncio, e
ninguém escreveu isso em lugar nenhum.** A `/processando` foi portada da
tela 4 e nunca foi ligada ao fim de onboarding que ela existia para
receber. Só chega lá quem digitar a URL.

Isso não diminui o defeito — uma tela que mente é uma tela que mente. Mas
muda o diagnóstico: **não é uma tela quebrada, é uma tela órfã**, e as
duas coisas não se consertam do mesmo jeito.

### 0.2 A execução viva, agora

```sql
select id, status, atualizado_em, now() - atualizado_em from execucoes;
```

| campo | valor |
|---|---|
| `id` | `98447192-3968-4fb1-8062-b14d6a8751ae` |
| `business_id` / `cliente_id` | `a85c37a9-…` (os dois, negócio "V2G") |
| `status` | `cadastro_completo` |
| `criado_em` | 2026-08-19 23:31:51.303021 UTC |
| `atualizado_em` | 2026-08-19 23:31:51.303**028** UTC |
| silêncio na hora da leitura | **22 h 50 min** (1.370 minutos) |

Os 7 microssegundos entre `criado_em` e `atualizado_em` são os dois
`now()` do próprio `insert`. **Nada tocou a linha em 22 horas e 50
minutos.** A medição de 8,7 minutos da `disparo-pipeline.md` §13.5 agora
tem 158 vezes o tamanho e diz a mesma coisa.

As outras quatro execuções são de 05/08 e 27/07, `business_id` nulo,
todas terminais (`estrutura_pronta` ×3, `gerado` ×1). São as legadas do
`migracao-execucoes.md`, e **nenhuma pertence a um cliente que possa
abrir uma tela.**

### 0.3 Os dois relógios estão em desacordo AGORA, e os dois estão certos

| régua | onde mora | corte | veredito hoje sobre a `a85c37a9` |
|---|---|---|---|
| operador | `lib/pipeline/relogios.ts` | 90 min desde `atualizado_em` | **`parada`** — 1.370 min, 15× o corte |
| cliente | `lib/estado/frases.ts` | 2 dias desde `cadastro_iniciado_em` | **ainda explicando** — 0,95 dia |

A `/saude-meta` mostra essa execução na lista de paradas neste minuto. O
`/inicio` do mesmo cliente diz *"A gente está montando o seu primeiro
anúncio"*.

**Isso é desenho, não bug.** O `estado-do-cliente.md` §2.5 escreveu o
motivo: o operador pode agir sobre a suspeita, o cliente só pode
desconfiar. A tela do cliente vira "a gente está devendo" sozinha em
**2026-08-21 23:31:49 UTC**, daqui a cerca de 25 horas.

Registro isto porque é a resposta medida à segunda proibição do enunciado
("não pode dizer que está tudo bem quando a execução está parada há dois
dias"): **a cadeia do QA-2 já cobre esse caso, na régua certa, e o cliente
desta conta ainda não chegou nos dois dias.**

### 0.4 `execucoes` continua fechada; as vizinhas, não

```
execucoes      rls = true   políticas = 0     ← default deny
analysis_runs  rls = true   políticas = 4
businesses     rls = true   políticas = 4
creatives      rls = true   políticas = 4
campaigns      rls = true   políticas = 4
metrics_daily  rls = true   políticas = 4
offers         rls = true   políticas = 4
decisions      rls = true   políticas = 4
```

Inalterado desde a 0018. E `analysis_runs` — a tabela que a tela lê — tem
política de RLS, tem `SELECT` para o dono, e **zero linhas**. É o pior
formato possível de defeito: a consulta funciona, a permissão está certa,
o resultado é honestamente vazio, e a conclusão é falsa.

### 0.5 O caminho de foto do webapp não passa pelo backend

`lib/identidade/armazenar.ts` grava em `storage` + `creatives`, com
`createAdminClient`. **Não existe chamada a `POST /execucoes/{id}/fotos`
em lugar nenhum do webapp** (`grep` em `lib` e `app`: zero). Isso importa
para o §2.3.

### 0.6 O que a tela usa de CSS, e quem mais usa

| classe | outros consumidores |
|---|---|
| `.stepper` (+ `.node`, `.s-copy`, `.elapsed`) | **nenhum** |
| `.split-tag` | **nenhum** |
| `.fail-block` | `/conectar`, `/verba`, `/inicio`, `/saude-meta` |
| `.proof-card`, `.proof-list` | `/conectar`, `Trilha.tsx`, `components/ui/ProofCard.tsx` |
| `.trust`, `.auth-grid`, `.auth-aside`, `.card-note` | de 5 a 17 telas cada |

São ~45 linhas em `globals.css` (2212–2255) que ficam sem dono se a tela
sair. Ver D6.

---

## 1. A TELA MORRE. O `/inicio` JÁ É A TELA DISSO.

**Recomendação: apagar `app/(fluxo)/processando/`.**

Não por ser difícil de consertar. Por ser a **segunda resposta** para uma
pergunta que ganhou dono ontem.

### 1.1 O argumento, em quatro fatos medidos

**1. Ela é órfã, e sempre foi** (§0.1). Consertar uma tela que ninguém
alcança exige, antes, decidir de onde ela é alcançada — e essa decisão já
foi tomada ao contrário: o fim do onboarding vai para `/inicio`, nas duas
superfícies. Repontar a `/processando` obrigaria a desfazer isso.

**2. O assunto dela é literalmente a etapa 3 da cadeia.** O
`estado-do-cliente.md` §2.1 tem seis elos; o terceiro é *"a peça"*, bola
`nos`, com `desde`, com o texto *"A gente está montando o seu primeiro
anúncio"*, e com a variante que admite depois de 2 dias. É a
`/processando` inteira, já escrita, já conferida por
`scripts/conferir-estado.ts`, já em produção — e **na tela para onde o
onboarding manda o cliente**.

**3. A escada dela contradiz a cadeia.** A `/processando` tem quatro
passos (`Lendo seu negócio · Montando estrutura · Criando anúncios ·
Colocando no ar`); a cadeia tem seis elos com outros nomes e outros
cortes. São **duas escadas para a mesma jornada**, e mantê-las é
reintroduzir na forma o defeito que o QA-2 acabou de tirar do conteúdo.

**4. Ela promete o que ninguém cumpre.** Três lugares da tela dizem que a
gente avisa no WhatsApp — *"o aviso chega no WhatsApp"*, *"a gente
continua e te avisa"*, *"se algo travar, a gente te procura"*. Não há
disparo de WhatsApp em nenhum lote fechado. A própria
`disparo-pipeline.md` §5.4 registrou: *"A `/processando` promete WhatsApp
e ninguém cumpre a promessa hoje; não vou aumentá-la."* **Apagar a tela
apaga três promessas não cumpridas** — é ganho, não perda.

### 1.2 A regra do projeto que decide isto

> *"Quando vários defeitos independentes apontam para o mesmo elemento, o
> defeito costuma ser o elemento."*

Apontam para a `/processando`: a fonte errada (`analysis_runs`), o relógio
errado (30 min desde `created_at`), a escada divergente, a promessa não
cumprida, a orfandade, e os quatro estados contra seis. Seis defeitos
independentes, um elemento.

E a regra do `estado-do-cliente.md` §3, escrita ontem:

> **Nenhuma tela escreve a própria frase sobre o que falta.**

Uma `/processando` repontada leria `execucoes.status` e escreveria a
própria frase sobre em que pé está o anúncio. Seria **a quinta tela
divergente**, nascida no dia seguinte à unificação das quatro.

### 1.3 O que se perde, item por item — e para onde vai

| o que a tela tem | destino |
|---|---|
| estado vazio "Não há nada sendo montado" + CTA `/onboarding` | etapa 1 da cadeia, no `/inicio`. Já existe e já está certa. |
| `EmAndamento` — "Estamos montando sua campanha" | etapa 3, `titulo`/`corpo` de `etapaPeca`. Já existe. |
| `EsperaLonga` — 30 min desde `created_at` | substituída pelo relógio de 2 dias do §3, sobre fonte melhor. |
| `Concluido` — "Prontinho" + CTA `/anuncios` | etapa 4 (`aprovacao`), CTA `/aprovar`. Já existe. |
| `Falha` — "A montagem parou no meio" | vira a variante `admitindo` da etapa 3 — **mas levando uma frase junto.** |
| "Sobre o seu dinheiro" — o primeiro real só depois da aprovação | já está no `/inicio` e na `/verba`. Conferir antes de apagar. |
| as três promessas de WhatsApp | **morrem, e é bom que morram** (§1.1, ponto 4). |
| a escada de 4 passos | morre. A escada que sobra é o `RestoDoCaminho` do `/inicio`. |

**A única copy que vale mudar de casa** é a do bloco de falha:

> *"Nada foi cobrado e nenhum anúncio foi ao ar. A montagem parou antes de
> qualquer anúncio existir, então não houve gasto nenhum."*

A `etapaPeca` na variante `admitindo` diz de quem é a culpa e **não diz
que não custou nada**. Para um cliente de R$490/mês que ficou dois dias
sem anúncio, "não te cobramos por isso" é a primeira pergunta, não a
segunda. Ela entra em `lib/estado/frases.ts`, no `corpo` da variante que
admite — que é o lugar onde, pela regra do §3 do QA-2, ela tem que estar.

### 1.4 O que NÃO é motivo para matar a tela

Para a decisão não ficar apoiada no que ela não sustenta:

- **Não é porque `analysis_runs` está vazia.** Trocar o `.from()` era
  possível; foi considerado e recusado por outro motivo (§3 da
  `disparo-pipeline.md`).
- **Não é porque a tela é feia ou mal escrita.** A copy dela é boa — é a
  melhor copy de espera do projeto, e é por isso que o §1.3 vai buscar uma
  frase lá.
- **Não é economia de código.** São ~380 linhas de TSX e ~45 de CSS. O
  custo de mantê-las não é o argumento; o custo de ter **dois donos do
  mesmo assunto** é.

---

## 2. O MAPEAMENTO DOS SEIS ESTADOS

A tela morre, mas **o assunto não morre** — e é aqui que este lote pode
cair no defeito que o contexto do projeto marca como já tendo acontecido
duas vezes: *"dois documentos podem apontar um para o outro e deixar um
caso sem dono."* Matar a `/processando` dizendo "a cadeia cobre" e deixar
a cadeia sem ler `execucoes` é exatamente isso.

Então: os seis estados são mapeados, e o destino deles é
`lib/estado/frases.ts`, dentro da etapa 3.

### 2.1 A regra que organiza o mapa

> **O status de `execucoes` NUNCA decide `concluida`. Ele diz de quem é a
> bola e se a coisa está andando.**

Quem decide que a etapa 3 fechou continua sendo o artefato: existe
`creatives` com `uso = 'campanha'` e `copy` escrita. É o que o cliente
pode ver e aprovar. O status da execução é **o que se passa por dentro da
etapa 3 enquanto ela está aberta** — nunca uma segunda opinião sobre se
ela fechou.

Isso é o que impede a quinta voz divergente: a execução não responde "o
que falta", ela detalha a resposta que a cadeia já deu.

### 2.2 O mapa

`Andamento` é o tipo que já existe em `relogios.ts`. A coluna nova é
**quem tem a bola**, no vocabulário do `QuemTemABola` do QA-2.

| `EstadoExecucao` | o que é | bola | o que a etapa 3 diz | fecha a etapa? |
|---|---|---|---|---|
| `cadastro_completo` | nasceu, **ninguém pegou** | `nos` | "seu cadastro chegou até a gente" — e passado o corte, admite (§3) | não |
| `pipeline_texto_rodando` | rodando | `nos` | "a gente está montando" — o texto de hoje, e é verdade | não |
| `aguardando_fotos` | parou esperando **foto dele** | **`cliente`** | "está esperando uma foto sua" — §2.3, é o caso perigoso | não |
| `gerando_criativo` | rodando | `nos` | "a gente está montando" | não |
| `estrutura_pronta` | terminou, esperando revisão | `nos` | "terminamos, estamos conferindo antes de te mandar" | **não** — §2.4 |
| `gerado` | terminal legado | `nos` | idem `estrutura_pronta` | **não** — §2.4 |
| *(fora dos seis)* | status desconhecido | `nos` | cai no texto de "a gente está montando" | não |
| *(sem execução)* | não disparou / nunca nasceu | — | a cadeia responde pela etapa 1, como hoje | — |

**`cadastro_completo` não é "estamos montando".** É a distinção que a
`disparo-pipeline.md` §3.4 já tinha levantado, e é o estado real da única
execução de cliente que existe hoje, há 22 h 50 min (§0.2). A diferença
entre *"a IA está escrevendo o texto do seu anúncio"* e *"seu cadastro
chegou até a gente"* é a diferença entre descrever trabalho que não está
acontecendo e descrever uma fila. A segunda é verdade; a primeira é a
mentira que o enunciado proíbe.

**O status desconhecido cai no padrão seguro, e o padrão seguro aqui é
`nos`.** Mesmo argumento do `lib/backend/cadastro.ts`: um estado novo do
backend não pode quebrar a tela. Mas ele **nunca** pode cair em "esperando
o cliente" — errar para "a bola é nossa" inventa trabalho para nós; errar
para o outro lado inventa trabalho para ele. Só um dos dois erros culpa
quem não tem culpa.

### 2.3 `aguardando_fotos` — o caso que quebra a primeira proibição, e que hoje não tem saída

O enunciado proíbe: *"A tela não pode dizer que estamos trabalhando quando
a espera é do cliente."* Este é o único estado dos seis em que isso pode
acontecer, e **matar a tela não conserta — só muda de lugar**:

Hoje, uma execução em `aguardando_fotos` produz, no `/inicio`,
`pecasProntas === 0` → etapa 3 → *"A gente está montando o seu primeiro
anúncio"*. A frase proibida, na tela para onde o onboarding manda.

Duas coisas que **não** estão medidas e que preciso dizer como não
medidas:

1. **Não sei se o n8n leva nossas execuções para lá.** `origem_criativo` é
   fixo em `"gerar"` (`lib/cadastro/montar.ts:394`), e o QA-2 concluiu daí
   que a IA monta a peça sem foto do cliente. Se isso governa a rota do
   n8n, `aguardando_fotos` nunca acontece com cliente nosso. **É
   inferência sobre um fluxo que não está nesta máquina.**
2. **Se acontecer, o cliente não tem saída pelo webapp.** O upload de
   identidade grava em `storage` + `creatives` (§0.5); ninguém chama
   `POST /execucoes/{id}/fotos`. A execução ficaria esperando uma foto que
   o produto não sabe entregar — e uma tela dizendo "falta você mandar
   foto" com um botão que não resolve é pior que o silêncio.

**Proposta:** bola `cliente`, texto que diz a verdade (*"o pipeline está
esperando uma foto sua"*), e **ação de falar com a gente, não de subir
foto** — porque subir foto pela `/conta` não destrava a execução. É a
mesma disciplina do `nao_sei` do `pendencias.ts`: nunca esconder de quem é
a vez, e nunca dar botão que não resolve.

E registrar o buraco: **`aguardando_fotos` é um beco sem saída do produto
hoje.** Fechá-lo exige chamar o backend, que este lote não faz.

### 2.4 `estrutura_pronta` e `gerado` NÃO fecham a etapa 3

A tentação é óbvia: o backend disse que terminou, então terminou. **Não.**

`GET /execucoes-em-revisao` devolve as execuções em `estrutura_pronta` — é
a **fila de revisão do gestor**, e `/aprovar` é o gate dele
(`disparo-pipeline.md` §1). Entre "o backend terminou de gerar" e "o
cliente tem uma peça para aprovar" existe um humano nosso.

Se `estrutura_pronta` fechasse a etapa 3, a cadeia avançaria para a etapa
4 e o `/inicio` diria *"Tem peça esperando você"* com o `/aprovar` vazio.
É exatamente o defeito da §11.3 do `estado-do-cliente.md` — a **verdade
vazia** que afirmava serviço prestado — reintroduzido pela porta dos
fundos.

Então: `concluida` da etapa 3 continua sendo `pecasProntas > 0`, medido em
`creatives`. `estrutura_pronta` muda a **frase**, não o **estado**.

### 2.5 O que fica de fora do mapa, de propósito

As sete colunas jsonb. Nenhuma entra. A `auditoria-resultados.md` §4 mediu
o que tem lá: a IA dizendo que a descrição dele é "curta e vaga", a brecha
do nicho dele, a IA em primeira pessoa sobre o que descartou, parecer de
compliance com gravidade `bloqueante`, e saída de mock distinguível só por
um prefixo `[mock]` dentro do texto. **Duas colunas: `status` e
`atualizado_em`. Nada mais.** Ver §4.

---

## 3. A AUSÊNCIA DE ESTADO DE FALHA

`EstadoExecucao` tem seis valores e nenhum é `falhou`. Uma execução que
quebra fica parada no último status, indistinguível de uma que está
andando. Não mexo no backend, então a única evidência é o silêncio.

### 3.1 Os relógios do lote E servem — a máquina, não os números

`lib/pipeline/relogios.ts` já tem `andamentoDaExecucao(status,
atualizado_em, agora)`, que devolve `andando | demorando | parada |
esperando_cliente`, já trata `aguardando_fotos` fora dos cortes e já trata
os terminais fora dos cortes. **A função serve inteira e é reaproveitada
como está.**

**Os números dela não servem para o cliente.** 20 e 90 minutos são a régua
do operador, e o `estado-do-cliente.md` §2.5 já escreveu o porquê, palavra
por palavra: *"Admitir cedo demais ensina a desconfiar de um sistema que
estava bem, e esse aprendizado não se desfaz."*

Hoje isso não é teoria: aquela execução está `parada` para o operador e
"sendo montada" para o cliente, ao mesmo tempo (§0.3). É o desenho
funcionando, não uma discordância.

### 3.2 O que muda: a ENTRADA do relógio do cliente, não o corte

O corte continua em `DIAS_ATE_ADMITIR_PECA = 2`. O que muda é de onde ele
conta.

| | hoje | proposta |
|---|---|---|
| fonte | `businesses.cadastro_iniciado_em` | `execucoes.atualizado_em`, caindo em `cadastro_iniciado_em` quando não há execução ou não há data |
| significado | "faz 2 dias que a gente pegou" | "faz 2 dias que **nada se mexeu**" |

`cadastro_iniciado_em` **nunca anda**. Ele marca o instante do disparo e
morre ali. Enquanto o pipeline não anda, os dois são iguais — e é por isso
que o defeito está invisível hoje. No dia em que o n8n reagir, eles
divergem, e a versão de hoje passa a acusar de dívida um pipeline que está
trabalhando normalmente.

`atualizado_em` é a única coluna que responde "quando foi a última vez que
alguma coisa aconteceu". A `disparo-pipeline.md` §0.6 já tinha registrado
que ela existe na tabela e não na API, e que **é isso que torna possível
detectar execução parada**.

### 3.3 O buraco que a proposta abre, dito antes de alguém achar

**Um relógio que se reinicia nunca dispara.** Um pipeline que se mexe a
cada 47 horas mantém o cliente esperando para sempre, sem nunca admitir. É
o defeito do progresso que anda um pixel por dia.

Não proponho um segundo corte agora. Motivos:

- seria o terceiro número inventado do projeto, e os dois primeiros já vêm
  com aviso de que são chute;
- o cenário exige um pipeline que se mexe periodicamente por dias, e o que
  existe medido é um pipeline que **nunca** se mexeu;
- o operador vê o caso pela `/saude-meta` na régua de 90 minutos, que não
  se reinicia por etapa longa nenhuma que este projeto tenha visto.

Fica **registrado como buraco conhecido**, com o conserto já escrito para
o dia em que aparecer: admitir quando `silêncio ≥ 2 dias` **ou** quando o
total desde `cadastro_iniciado_em` passar de um teto absoluto. Ver D4.

### 3.4 Onde a falha aparece para o cliente

Em lugar nenhum novo. **É a variante `admitindo` da etapa 3**, que já
existe, já está conferida, e cujo texto é:

> *"A gente está devendo o seu primeiro anúncio. Seu cadastro chegou aqui
> em 19 de agosto e a gente ainda não te mandou nenhuma peça para aprovar.
> Já passou do tempo, e isso é nosso — não é nada que você deixou de
> fazer."* + ação **Falar com a gente**.

Mais a frase que vem da `/processando` (§1.3): **nada foi cobrado, nenhum
anúncio foi ao ar.**

Não há tela de falha. Não há estado novo. O que a `/processando` chamava
de `Falha` é o que a cadeia chama de `admitindo` — e a cadeia já sabe
fazer isso em quatro etapas diferentes.

---

## 4. DE ONDE VEM O DADO

`execucoes` está em `default deny` (§0.4). A pergunta do enunciado — "diga
como a tela lê sem abrir o que não deve" — tem resposta já escrita em dois
lugares, e ela é a mesma nos dois.

### 4.1 A RLS continua fechada. Ponto.

`auditoria-resultados.md` §4, em negrito no original: **"Nenhuma política
de RLS resolve este problema. Nenhuma."** RLS decide **linha**; o
vazamento aqui é de **coluna**. `using (private.owns_business(business_id))`
responderia "esta execução é dele?" corretamente, e entregaria as sete
colunas jsonb junto.

A 0018 não criou política. **Este lote também não cria. Nenhuma
migration.**

### 4.2 A função que a `vigilancia.ts` já previu

O cabeçalho de `lib/pipeline/vigilancia.ts` escreveu, em 19/08, a função
que este lote precisa:

> *"Se um dia uma [tela de cliente] precisar, o que ela pede é outra
> função, que receba o `business_id` **já vindo de um select sob RLS** — e
> que devolva só `status` e `atualizado_em`, nunca as colunas de agente."*

É essa. Não é adaptação do desenho: é o desenho, escrito antes, esperando
o consumidor.

```ts
// lib/pipeline/execucao-do-cliente.ts        import "server-only";

export interface ExecucaoDoCliente {
  status: string;
  atualizadoEm: string | null;
  andamento: Andamento;      // de relogios.ts, sem alteração
}

/**
 * `businessId` NÃO vem de formulário, de URL nem de parâmetro de rota.
 * Vem do `select` que o `estadoDoCliente()` já faz sob RLS, com
 * `.eq("profile_id", user.id)`. É a mesma disciplina do §6.1 do
 * disparo-pipeline: o passo "confere o dono" não é um `if` que alguém
 * pode esquecer, é a ausência de um caminho para o id alheio.
 */
export async function execucaoDoCliente(
  businessId: string,
  agora: Date,
): Promise<ExecucaoDoCliente | null>;
```

O `select`, literal e curto — **duas colunas, escritas à mão**:

```ts
admin.from("execucoes")
  .select("status, atualizado_em")        // NUNCA "*"
  .or(`business_id.eq.${businessId},cliente_id.eq.${businessId}`)
  .order("criado_em", { ascending: false })
  .limit(1)
  .maybeSingle();
```

Quatro observações, cada uma com motivo:

- **`service_role`, não RLS.** É o único jeito de alcançar uma tabela em
  `default deny`, e é o preço de manter a decisão D2 do lote E. O que
  substitui a rede da RLS é o §6.1: não existe parâmetro por onde passar id
  alheio, porque o `businessId` já veio de uma leitura sob RLS na mesma
  função.
- **Duas colunas nomeadas.** A `auditoria-resultados.md` §5 antecipou a
  armadilha exata: *"A tentação é pedir `select *` porque é uma linha só —
  e é exatamente aí que o pacote inteiro atravessa."*
- **`business_id` OU `cliente_id`**, as duas marcas, pelo mesmo motivo da
  camada 2 do lote E: uma execução cuja resposta se perdeu tem só o eco.
- **A mais nova, não "a" execução.** Um negócio pode ter mais de uma linha
  ao longo do tempo. `order + limit 1` decide sem depender de a tabela ter
  só uma.

### 4.3 Quem chama, e quem NÃO chama

```
estadoDoCliente()            ← já lê businesses sob RLS, já tem o id
   └── execucaoDoCliente(linha.id, agora)     ← a chamada nova, uma
          └── montarEtapas(medida + execucao, agora)
                 └── etapaPeca()   ← a única que usa
```

**Nenhum `page.tsx` importa `execucao-do-cliente.ts`.** A regra do §3 do
QA-2 vale inteira: a tela não lê `execucoes`, a tela lê `proximo`. Se
amanhã alguém precisar do status numa tela, o lugar de acrescentar é
`frases.ts`.

A `MedidaDoCliente` ganha um campo, e ele é opcional — **sem execução, a
cadeia se comporta exatamente como hoje**, o que faz desta mudança uma
adição e não uma substituição:

```ts
execucao: ExecucaoDoCliente | null;
```

### 4.4 A pergunta que fica: uma consulta a mais por página

`estadoDoCliente()` já faz 5 leituras (1 sequencial + 4 em `Promise.all`).
Esta é a sexta, e é sequencial — depende do `businesses.id`. Custo: uma
ida ao Postgres com `limit 1` por índice (`execucoes.business_id` tem
índice desde a 0010).

Não vejo como evitar sem passar o id por parâmetro vindo de fora, que é
justamente o que o §6.1 proíbe. Fica dito para não parecer que passou
despercebido.

---

## 5. O QUE MUDA, ARQUIVO POR ARQUIVO

**Novo**

```
lib/pipeline/execucao-do-cliente.ts    a função do §4.2, server-only
docs/buraco-fotos-execucao.md          o beco do §2.3, registrado como
                                       buraco de integração próprio
```

**Alterado**

| arquivo | o que entra |
|---|---|
| `lib/estado/frases.ts` | `MedidaDoCliente.execucao`; `etapaPeca()` passa a variar por status (§2.2) e a admitir por silêncio (§3.2); a frase "nada foi cobrado" (§1.3) |
| `lib/estado/cliente.ts` | a chamada a `execucaoDoCliente()` e o campo novo na medida |
| `scripts/conferir-estado.ts` | os seis estados × os dois lados de cada corte (§9) |
| `docs/disparo-pipeline.md` | nota de que o §3 foi resolvido — **sem reescrever o §3**, que é medição |
| `docs/estado-do-cliente.md` | nota no §2.5 de que o "desde" da etapa 3 mudou de fonte, com o motivo |
| `docs/arquitetura.md` | **Decisão 13**, na forma geral: nenhum estado de pipeline decide se uma etapa do cliente está concluída — quem decide é o artefato. Vale para qualquer leitor de estado daqui para frente, não só para a etapa 3 (§2.1) |

**Apagado**

```
app/(fluxo)/processando/page.tsx       a tela inteira
proxy.ts                               "/processando" sai de PROTECTED_PREFIXES
```

**FICA, mesmo sem consumidor** — `.stepper` e `.split-tag` no
`globals.css`, por D6. São o único componente de progresso do projeto, e o
`RestoDoCaminho` do `/inicio` é hoje uma lista que a escada serviria
melhor. Apagar para reescrever depois é trabalho duplo. Elas ficam órfãs
até esse lote existir, e o comentário de especificidade da linha 2243, que
aponta para `processando/page.tsx`, passa a apontar para o nada —
**corrigir esse comentário é parte deste lote**, senão vira a regra inerte
de sempre.

**Não muda**

`lib/pipeline/relogios.ts` — a função serve inteira, e os números dela são
do operador. `lib/pipeline/vigilancia.ts` e a `/saude-meta` — o operador
continua com a régua de 90 minutos. `lib/backend/*` — nenhuma chamada
nova. Migration — **nenhuma**. `analysis_runs`, `offers` e `decisions` —
continuam vazias e agora sem nenhum leitor no webapp; ver §7.

---

## 6. AS DUAS PROIBIÇÕES, CONFERIDAS

**"Não pode dizer que estamos trabalhando quando a espera é do cliente."**

Um estado dos seis é espera dele: `aguardando_fotos`. O §2.3 dá bola
`cliente` a ele. **Hoje o `/inicio` erra nesse caso** — diz "a gente está
montando" — e o erro sobrevive à morte da tela se este lote não fizer o
§2.3. Ele é o item que não pode cair do escopo.

O estado desconhecido cai em `nos`, nunca em `cliente` (§2.2), pelo mesmo
motivo: errar para "a bola é nossa" inventa trabalho para nós; errar para
o outro lado culpa quem não tem culpa.

**"Não pode dizer que está tudo bem quando a execução está parada há dois
dias."**

O corte de 2 dias já existe e já foi conferido. O que este lote muda é a
entrada dele: de "faz 2 dias que a gente pegou" para "faz 2 dias que nada
se mexeu" (§3.2), que é a pergunta certa. E o buraco do relógio que se
reinicia está dito no §3.3 em vez de descoberto depois.

**A terceira, que o enunciado não pediu e o projeto exige:** nenhuma
coluna de agente atravessa. Duas colunas nomeadas, `select` sem `*`, RLS
inalterada (§4.1, §4.2).

---

## 7. O QUE FICA DE FORA — dito na cara

- **O buraco dos números difíceis.** Fora por instrução.
- **O backend.** Nenhuma chamada nova, nenhum estado novo no enum. A
  ausência de `falhou` continua sendo do Gabriel; o §3 contorna, não
  conserta.
- **O acionamento do n8n.** Continua bloqueado (§12 da
  `disparo-pipeline.md`). **Este lote faz a tela dizer a verdade sobre um
  pipeline que não anda** — não faz ele andar. Depois deste lote, o cliente
  da conta `a85c37a9` vai ler que o cadastro chegou até nós e está na fila,
  e daqui a 25 horas vai ler que a gente está devendo. As duas coisas são
  verdade. Nenhuma delas é um anúncio.
- **`analysis_runs`, `offers`, `decisions`.** Apagada a tela, **o webapp
  inteiro deixa de ler as três** (a `/processando` era a única leitora de
  `analysis_runs`; o `grep` devolvia duas linhas, as duas no arquivo dela).
  As tabelas ficam, com RLS e política, sem leitor. O `n8n-repontamento.md`
  §7 continua com sete itens em aberto. **Isso precisa entrar na próxima
  conversa com o Gabriel**: se o repontamento acontecer, ninguém do nosso
  lado está olhando o que ele escreve.
- **O beco de `aguardando_fotos`** (§2.3): o produto não tem como mandar
  foto para a execução. Registrado, não consertado.
- **A promessa de WhatsApp.** Apagada com a tela, não cumprida. Notificar o
  cliente por evento real continua sem lote.

---

## 8. AS DECISÕES — fechadas em 20/08/2026

| | decisão | como ficou |
|---|---|---|
| **D1** | A `/processando` morre e o `/inicio` absorve? | **Sim.** §1: seis defeitos apontando para o mesmo elemento, e o assunto já tinha dono. |
| **D2** | O status de `execucoes` pode fechar uma etapa? | **Não.** §2.1 e §2.4. Virou a **Decisão 13** da `arquitetura.md`, na forma geral: quem decide etapa concluída é o artefato, não o estado do pipeline. Vale para qualquer leitor de estado daqui para frente. |
| **D3** | Como a tela lê `execucoes`? | Função `service_role` de duas colunas, `businessId` vindo do `select` sob RLS. §4.2. RLS continua fechada, **sem migration**. |
| **D4** | O relógio do cliente conta de onde? | De `atualizado_em`, com fallback em `cadastro_iniciado_em`. §3.2. **Sem** teto absoluto — o buraco do relógio que se reinicia fica escrito no §3.3 em vez de tapado com um terceiro número inventado. |
| **D5** | `aguardando_fotos` — o que a tela oferece? | Bola `cliente`, texto que diz a verdade, e **ação de falar com a gente, não de subir foto**. Registrado como buraco de integração próprio em [`buraco-fotos-execucao.md`](./buraco-fotos-execucao.md). |
| **D6** | `.stepper` e `.split-tag` (~45 linhas, sem outro consumidor) | **Ficam.** São o único componente de progresso do projeto e o `RestoDoCaminho` tem hoje o mesmo problema. Apagar para reescrever depois é trabalho duplo. Adotá-las no `/inicio` vira lote próprio. |

**O que a D1 arrasta junto, e não é opcional:** o `aguardando_fotos` do
§2.3. Hoje o `/inicio` diz "a gente está montando" nesse estado — a frase
que o enunciado proíbe — e o erro **sobrevive à morte da tela**. Se a D5
não for feita, este lote troca uma tela que mente por uma cadeia que mente
no mesmo caso.

---

## 9. COMO ISTO SERÁ VERIFICADO

Com dado real, e **dizendo antes o que o dado real não consegue provar.**

### 9.1 O que a conta `a85c37a9` prova

Ela está em `cadastro_completo` há 22 h 50 min (§0.2), e é o caso vivo de
"parada". Depois de implementar, com `estadoDoCliente(new Date())` sobre a
linha de verdade:

| o que conferir | esperado |
|---|---|
| `execucaoDoCliente()` devolve | `status: "cadastro_completo"`, `atualizadoEm` de 19/08 23:31, `andamento: "parada"` |
| o objeto devolvido | **três campos, só** — nenhuma coluna jsonb, conferido no objeto e não na intenção |
| `proximo` do `/inicio` | etapa 3, bola `nos`, **sem botão** |
| a frase | "chegou até a gente", **não** "a IA está escrevendo" |
| `/saude-meta` | continua listando a mesma execução como parada, inalterada |

### 9.2 O que ela NÃO prova, e é o mais importante

**Os dois relógios são o mesmo instante nessa conta.** `criado_em` e
`atualizado_em` diferem por 7 microssegundos, e `cadastro_iniciado_em` por
1,7 segundo. **A troca de fonte do §3.2 é invisível nela** — o número dá
igual pelos dois caminhos.

Um teste nessa conta passaria com a mudança e passaria sem ela. É
exatamente o "teste verde escondendo defeito" que já aconteceu quatro
vezes aqui.

Então a troca de fonte se verifica **onde ela é visível**, em
`scripts/conferir-estado.ts`, com `agora` injetado e medida montada à mão:

- `cadastro_iniciado_em` de 5 dias atrás + `atualizado_em` de 1 hora atrás
  → **não admite**. É a asserção que falha hoje e passa depois; sem ela o
  lote não prova nada.
- `cadastro_iniciado_em` de 3 dias + `atualizado_em` de 3 dias →
  **admite**.

### 9.3 Os seis estados, os dois lados de cada um

`conferir-estado.ts` ganha uma bateria: cada um dos seis, mais o
desconhecido, mais `execucao: null`, contra a bola esperada e contra a
frase. Com **controle negativo declarado** — uma asserção que tem que
falhar se a bateria não estiver medindo nada, como o §0 do script já faz.

A asserção que mais importa, porque é a proibição do enunciado:

```
aguardando_fotos  →  bola === "cliente"   E   corpo NÃO contém "a gente está montando"
```

### 9.4 As três contas do QA-2, de novo

`f0f0ca84` (nova), `a85c37a9` (a do §0) e `0de3321a` (legado) pela cadeia
inteira, para conferir que **nada regrediu** — as duas primeiras não têm
execução ligada, e a cadeia tem que se comportar como hoje nelas.

### 9.5 E o resto

`pnpm conferir` verde nas quatro etapas. `pnpm build` com as rotas
compilando — **uma a menos**, e conferir que a que sumiu é a
`/processando`. `DESIGN.md` regerado: se D6 for (a), o diff é a remoção;
se for (b), não há cor nem tamanho novo.

**O que eu não vou conseguir verificar:** nenhuma tela aberta logada. Não
há sessão autenticada nesta máquina para mim e pedir senha está fora de
questão — mesma limitação do §10.2 do `estado-do-cliente.md`. O que sobra
para você é abrir o `/inicio` logado na `a85c37a9` e ler a frase.

---

## 10. O QUE FOI VERIFICADO — 21/08/2026

Medição, não expectativa. Registra o que rodou e o que não rodou.

### 10.1 O controle negativo, primeiro

Sem isto, todo o verde abaixo é verde sem valor. A troca de fonte do
relógio (§3.2) foi **revertida sozinha**, uma linha, com a bateria nova já
no lugar:

```
const desdeORelogio = m.cadastroEnviadoEm;      ← a fonte ANTIGA

12. O RELÓGIO CONTA DO ÚLTIMO MOVIMENTO — os dois lados
  FALHA disparo há 5 dias + movimento há 1 hora → NÃO admite
  FALHA   e a frase é a de trabalho acontecendo
2 FALHA(S) — 83 conferências
```

**Duas falhas, e exatamente as duas certas.** As outras 81 continuaram
verdes — a bateria não está acoplada por acidente, e essas duas asserções
medem a mudança e nada mais. Restaurada a linha, 83/83.

### 10.2 Os quatro conferidores

`pnpm conferir` verde, saída 0: `typecheck`, `conferir:lista-branca` (19
campos, EM DIA), `conferir:estado` (**83 conferências**, eram 48) e
`conferir:cadastro` (TUDO CERTO, com o controle negativo dele acusando).

As 35 conferências novas são as seções 10 a 13 do `conferir-estado.ts`: os
seis estados um a um com a bola de cada, o desconhecido caindo em `nos` e
nunca em `cliente`, a Decisão 13 nos dois sentidos, o `aguardando_fotos`
com a asserção da proibição, os dois lados do relógio, e a frase do
dinheiro.

**A asserção que mais importa, verde:**

```
`aguardando_fotos` → a bola é DO CLIENTE
  e a tela NÃO diz que a gente está montando — a espera é dele
  e o canal é falar com a gente, NÃO 'subir foto'
  o rótulo não promete mandar foto
30 dias em `aguardando_fotos` e a gente NÃO admite dívida
```

### 10.3 O build — uma rota a menos, e é a certa

`pnpm build` limpo (`.next` apagado antes, senão o `validator.ts` gerado
guarda a rota morta e o `typecheck` acusa). **29 rotas, eram 30.** A que
sumiu da listagem é a `/processando`, e nenhuma outra.

### 10.4 A LEITURA DE VERDADE, contra o `V2G-SITE`

Não uma reimplementação do `select`: o `execucaoDoCliente()` importado e
chamado, com a chave real, na linha real.

```
1. execucaoDoCliente("a85c37a9-…"):
   { "status": "cadastro_completo",
     "atualizadoEm": "2026-08-19T23:31:51.303028+00:00",
     "andamento": "parada" }
   CAMPOS DEVOLVIDOS: status, atualizadoEm, andamento
   colunas de agente no objeto: NENHUMA
```

Conferido contra a lista das oito proibidas (`classificacao`,
`diagnostico`, `oferta`, `estrutura_campanha`, `copy`, `varredura_site`,
`compliance_visual`, `resultados`): **nenhuma aparece no JSON devolvido.**
Medido no objeto, não na intenção.

**Os dois controles**, para o resultado acima significar alguma coisa:

| controle | resultado |
|---|---|
| conta `f0f0ca84`, que nunca disparou | `null` — não inventa execução |
| id que não é uuid | `null`, com `[execucao] businessId não é uuid; leitura recusada` |

E, antes de a chave carregar, a degradação apareceu sozinha: o
`createAdminClient()` lançou por env ausente, a função devolveu `null`
logando, e a cadeia disse o que dizia antes do lote — que é exatamente o
desenho do §4.3. Não foi teste planejado; foi acidente que provou o ramo.

### 10.5 A frase que a conta real lê AGORA

```
4. a etapa 3 que o /inicio renderiza HOJE:
   titulo:    Seu cadastro chegou até a gente
   corpo:     Seu cadastro está completo desde 19 de agosto e já está
              aqui, na fila. Quando a vez dele chegar, a IA escreve o
              texto e escolhe a arte do seu primeiro anúncio…
   bola:      nos
   acao:      null
   admitindo: false
   desde:     2026-08-19T23:31:51.303028+00:00
```

**É a mudança inteira numa linha:** antes deste lote a mesma conta lia *"A
gente está montando o seu primeiro anúncio"* — trabalho acontecendo —
enquanto a execução estava parada em `cadastro_completo` havia 25 horas.
Agora lê que chegou e está na fila, que é o que é verdade.

E o outro lado do corte, na mesma linha real:

```
5. a mesma etapa em 2026-08-21T23:31:52Z (o corte de 2 dias):
   titulo:    A gente está devendo o seu primeiro anúncio
   admitindo: true
   acao:      Falar com a gente → wa.me/…
   diz "Nada foi cobrado": true
```

### 10.6 O que NÃO rodou

- **Nenhuma tela aberta logada.** Não há sessão autenticada nesta máquina
  para mim. O que foi verificado é a cadeia sobre o dado real e o build,
  não o pixel renderizado. Falta você abrir o `/inicio` na `a85c37a9`.
- ~~**`aguardando_fotos` nunca aconteceu de verdade.**~~ **ERRADO — medido
  de novo em 21/08.** Eu contei os status das 5 linhas do `V2G-SITE`, que
  são uma amostra curada. No Oregon, que tem as 49 do histórico real, o
  estado aparece **7 vezes (14%)**. O caso não é teórico e a inferência do
  `origem_criativo` está refutada. Correção inteira em
  `buraco-fotos-execucao.md` §4; a lição virou seção própria na
  `arquitetura.md`, ao lado da Decisão 13. *(O estado continua exercitado
  só no conferidor — isso não mudou. O que mudou é que agora se sabe que
  ele acontece.)*
- **`estrutura_pronta` e `gerado` no caminho real.** As três execuções
  legadas têm esses status, mas `business_id` nulo — não pertencem a
  cliente nenhum, então a leitura nova não as alcança. Verificados só no
  conferidor.
- **O relógio que se reinicia** (§3.3). Buraco conhecido, sem conserto e
  sem teste: exige um pipeline que se mexe periodicamente por dias, e o
  que existe medido é um que nunca se mexeu.

### 10.7 Achado fora do escopo, não consertado

O cabeçalho do `globals.css` (linhas 7–10) ainda diz que o arquivo é *"uma
versão ENXUTA: só os componentes usados pelas rotas deste PR (/entrar e
/inicio)"* e lista o `stepper` entre os que *"serão portados quando essas
telas forem construídas"*. Está errado desde muito antes deste lote, e
agora está errado duas vezes. Não toquei: é dívida de outro lote.
