# Lote — a porta de volta do "não sei"

**Desenho escrito antes do código, em 21/08/2026.** O buraco está medido em
[`buraco-numeros-dificeis.md`](./buraco-numeros-dificeis.md); a forma do
conserto foi proposta lá no §6 e é essa que sigo. Este documento é sobre a
parte que o §6 não resolve: **como reabrir sem apagar a medição.**

---

## 1. O que está sendo consertado, em uma frase

Quem responde "não sei" numa das três contas fica sem porta: a
`/onboarding/contas` fecha a pergunta por desenho, e a `/meu-negocio`
mostra o campo sem `input` por decisão de outro lote. Cada metade está
certa; o par não tem fundo.

O conserto é o do §6: **"Agora eu sei", que o cliente clica.** A diferença
entre isso e reoferecer a pergunta é quem começou — e é a diferença
inteira, porque a razão do lote B era a tela não *cobrar*.

## 2. A parte difícil não é o botão. É não apagar nada.

`lib/cadastro/montar.ts` é explícito sobre o jsonb das contas:

> "Ele NÃO É APAGADO quando a coluna enche. Aquilo registra um fato com
> hora: às 19:56 daquele dia, essa pessoa disse que não sabia. Apagar é
> reescrever medição. Deixar de ler não é apagar."

O caminho óbvio para reabrir — remover a chave `naoSei` do jsonb — é
exatamente o que essa regra proíbe. E não é purismo: o "não sei" com hora é
o que faz o `/inicio` trocar de dono no dia 5 ("Ainda não te ligamos — e
isso é nosso"). Apagá-lo faria a dívida sumir do nosso lado sem ninguém ter
ligado.

**Então reabrir é ACRESCENTAR um fato, não remover um.**

```ts
contas.lucro = {
  ...contas.lucro,          // naoSei: true e o `em` das 19:56 continuam ali
  reabertoEm: "2026-08-21T…" // o segundo fato, com a hora dele
}
```

E `lerConta`, que é a única regra de combinação entre coluna e jsonb do
projeto, ganha o estado que faltava:

| coluna | jsonb | leitura |
|---|---|---|
| tem valor | qualquer coisa | `respondida` |
| vazia | `naoSei`, sem `reabertoEm` | `nao_sei` |
| vazia | `naoSei` **e** `reabertoEm` | **`reaberta`** ← novo |
| vazia | calculado, não confirmado | `calculada` |
| vazia | nada | `nao_perguntado` |

`reaberta` é estado próprio, e não um `nao_perguntado` disfarçado, porque
"ninguém perguntou" seria falso: perguntaram, ele não soube, e depois
voltou. São três fatos e a leitura tem que caber os três.

## 3. O que `reaberta` faz em cada lugar que lê contas

| quem lê | o que muda |
|---|---|
| `Contas.tsx` — `fechada()` | `reaberta` **não** fecha: a conta volta para a fila e a pergunta reaparece |
| `motivoDaConta` | devolve `nao_perguntado` — ver abaixo |
| `resumirPendencias` | como o motivo deixa de ser `nao_sei`, a pendência vira **acionável**: o `/inicio` para de dizer "a gente te liga" e passa a oferecer "terminar meu cadastro" |
| relógio da dívida (`DIAS_ATE_TROCAR_DE_DONO`) | para de correr para essa conta, porque só `nao_sei` entra na conta do prazo |

**O `motivoDaConta` devolver `nao_perguntado` é decisão, e ela é
defensável:** `MotivoPendencia` existe para decidir **o que a tela
oferece** (está escrito no próprio tipo), não para descrever o histórico. O
que a tela oferece a uma conta reaberta é a mesma coisa que oferece a uma
nunca perguntada: a pergunta. O histórico continua inteiro no jsonb e na
`LeituraDaConta` — é lá que ele mora, e é de lá que a `/onboarding/contas`
lê para escrever "você tinha dito que não sabia".

E a consequência de o relógio parar é a certa: enquanto ele estava
"não sei", a dívida era nossa (a gente tinha que ligar). Assim que ele
clica em "agora eu sei", ele assumiu a conta — cobrar de nós um telefonema
que ele dispensou seria a tela mentindo do outro lado.

## 4. Só o "não sei" reabre

O botão aparece **apenas** no estado `nao_sei`. Uma conta `respondida` já
tem caminho — a `/meu-negocio`, que corrige valor com procedência — e pôr
um segundo caminho de reescrita para a mesma coluna é como a `/conta`
perdeu procedência (registrado no lote C).

## 5. A outra metade: a `/meu-negocio` aponta para a conta

O §6 do buraco também pede isto, e é uma linha:

> "o bloco 'O que a gente ainda não sabe' pode continuar sem `input` (a
> decisão do §8.4 está certa) **e** oferecer o link para a conta que ele
> consegue responder."

Os três campos difíceis e onde cada um é respondível:

| campo | onde a pergunta existe |
|---|---|
| `avg_direct_cost` | `/onboarding/contas` (conta 2 de 3) |
| `target_profit_per_customer` | `/onboarding/contas` (conta 3 de 3) |
| `monthly_budget` | `/verba` — tela própria, o contra-exemplo que já funcionava |

O destino entra no **catálogo** (`lib/perfil/catalogo-cliente.ts`), junto
do `dificil: true` que criou o problema, e não no `page.tsx`. Um `if` sobre
nome de campo dentro do componente é como as quatro telas passaram a dizer
quatro coisas diferentes sobre a mesma conta.

E o texto do bloco muda: hoje ele diz *"A gente te chama"*, ponto. Passa a
dizer que dá para responder agora, **sem deixar de dizer que a gente
chama** — as duas coisas são verdade e tirar a segunda transformaria uma
oferta em cobrança.

## 6. Como isto vai ser testado

O alvo existe e é real: o negócio `V2G` (`a85c37a9`) respondeu
`naoSei: true` na conta de lucro em 19/08/2026 19:56, e a coluna
`target_profit_per_customer` está preenchida hoje — então o caso vivo do
banco é o `respondida`, **não** o `nao_sei`. Quer dizer: o alvo do lado que
importa **não existe no banco**, de novo.

Por isso o teste é de fixture, em `pnpm conferir:cadastro` (§4, os motivos)
e num bloco novo para `lerConta`, com os dois lados de cada transição:

- `naoSei` sem `reabertoEm` → `nao_sei` (continua fechada, o botão aparece)
- `naoSei` **com** `reabertoEm` → `reaberta` (volta para a fila)
- `reaberta` + coluna preenchida → `respondida` (a coluna manda, como sempre)
- motivo de `reaberta` → `nao_perguntado`, e a pendência vira acionável
- e o controle do outro lado: uma conta `nao_sei` **não** reaberta continua
  produzindo "a gente te liga", sem ação

**Base explícita:** o bloco novo tem que falhar se `lerConta` ignorar
`reabertoEm`. Rodei com a linha removida antes de dar por fechado.
