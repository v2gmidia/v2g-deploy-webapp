# Estado do cliente — a fonte única do "o que falta"

Lote QA-2. Desenho escrito em 20/08/2026, **antes de qualquer código**.

Este documento cobre os dois defeitos do QA:

- **D3** — quatro telas dando quatro respostas para "o que falta pra sair
  anúncio?", na mesma conta, no mesmo minuto.
- **D4** — duas telas dando dois valores para `target_profit_per_customer`.

---

## 0. O QUE FOI MEDIDO — 20/08/2026

Esta seção registra medição. **Não reescreva quando o código mudar** — o
valor dela é ser a fotografia de antes. O que envelhece é o §2 em diante.

Conta medida: `businesses.a85c37a9-df57-4829-985b-41bc306f8537` ("V2G"),
`dados_ficticios = false`, lida direto no Supabase `V2G-SITE`.

### 0.1 O estado real dessa conta, campo a campo

| fato | valor medido |
|---|---|
| os 6 obrigatórios do `POST /cadastro` | **todos preenchidos** (ticket 800, custo 400, lucro 200, verba 2000, nome "V2G", descrição de 94 caracteres) |
| `montarCadastro()` sobre essa linha | `completo: true` — zero pendências |
| `meta_connections` | 1 linha, `status = 'connected'`, página `847147288492237` |
| `execucoes` desse negócio | 1 linha, `status = 'cadastro_completo'`, criada em 19/08 23:31 UTC |
| `campaigns` | **0 linhas na tabela inteira** |
| `creatives` desse negócio | 2 linhas, **ambas `uso = 'logo'`**, uma delas com `arquivado_em` preenchido |
| `metrics_daily` | 0 linhas na tabela inteira |

**Traduzindo: esse cliente não tem nada a fazer.** Ele terminou o cadastro,
conectou a conta e a execução foi criada. O que falta é o n8n reagir — que é
o item já registrado como bloqueado no Gabriel. A bola não é dele.

### 0.2 As quatro frases, e de onde cada uma sai

| tela | o que ela diz | de onde a frase sai | o que ela consulta |
|---|---|---|---|
| `/inicio` | "Falta separar suas fotos. A IA já sabe o essencial." | `inicio/page.tsx:148-168` | `Object.keys(onboarding.respostas).length >= 5` (linha 124) |
| `/anuncios` | "Você já tem 2 fotos guardadas. Falta a IA conhecer o negócio." | `anuncios/page.tsx:361` | `creatives` sem filtro nenhum (linha 36) — e **nada** sobre o cadastro |
| `/conta` | "Fachada e ambiente · 0 de 10 · Nenhuma foto ainda." | `conta/Identidade.tsx:126,150` | `listarIdentidade()` → `creatives` com `uso in (logo,identidade)` e `arquivado_em is null` |
| `/onboarding` | "Passo 1 de 3 · faltam ~7 min" | `Trilha.tsx:86-87` | `MIN_RESTANTES[última pergunta do bloco 1]` — uma tabela fixa em `perguntas.ts` |

Nenhuma das quatro lê `pendenciasDoCliente()`. O `/inicio` **importa** a
função (linha 5) e a usa no `<BlocoPendencias>` — que nessa conta renderiza
`null`, porque não há pendência. A frase que contradiz as outras três é
outra, calculada 30 linhas abaixo, no mesmo arquivo.

### 0.3 Por que cada uma erra — e são erros de espécies diferentes

Isto importa para o desenho: não são quatro contas divergentes. São três
doenças.

**`/anuncios` não calcula: ele afirma.** A frase "Falta a IA conhecer o
negócio" está escrita dentro do ramo "não existe campanha". Ela não consulta
o cadastro em lugar nenhum. Numa conta com cadastro completo e execução
criada, ela é simplesmente falsa — e continuaria falsa mesmo se a fonte única
existisse, porque não há leitura para trocar. O mesmo vale para o ramo vazio
da `/conta` (`page.tsx:155`), que decide "você ainda não contou sobre o seu
negócio" só por não achar linha em `businesses`.

**`/inicio` e `/conta` contam a mesma palavra de dois jeitos.** "Foto":

- `/anuncios` conta **toda linha de `creatives`** — inclusive `uso = 'logo'`
  e inclusive linha arquivada. Deu **2**.
- `/conta` conta só `uso = 'identidade'`, não arquivada, e separa o logo em
  outro bloco. Deu **0**.

As duas leem a mesma tabela. A resposta honesta é **zero fotos e um logo**:
`/anuncios` está chamando de foto um logo e um arquivo que o cliente já
removeu.

**`/onboarding` lê uma fonte que parou de ser a verdade.** `MIN_RESTANTES` e
`BLOCOS_ACESOS` são tabelas indexadas pela última pergunta respondida **do
bloco 1**. Elas não enxergam o bloco 2, não enxergam a `/verba`, e não
enxergam o cadastro fechar. Com `praca` respondida, o valor é 7 — e continua
7 para sempre, inclusive depois de a execução ser criada. Os blocos param em
4 de 6 e a logomark fica em "Peça 1 de 3 em construção", também para sempre.

### 0.4 Um quarto defeito, que o QA não viu e é da mesma família

`/inicio:124` conta as chaves de `onboarding.respostas` **cru**, sem passar
por `migrarChaves()`. Medido em `businesses.0de3321a-...`: 5 chaves, todas do
formato antigo (`"0"`..`"4"`), `name = 'Meu negócio'` (o provisório) e
`description = null`.

Ou seja: essa conta lê **"A IA já sabe o essencial. Falta separar suas
fotos"** enquanto a IA não sabe nem o nome do negócio nem o que ele vende.
O contador de chaves aceita como resposta duas perguntas que este projeto já
aposentou (`"2"` = ticket, `"4"` = objetivo — `perguntas.ts`, `CHAVE_ANTIGA`).

### 0.5 D4, medido na linha

Os dois lados, com hora:

```
onboarding->'contas'->'lucro'
  { "em": "2026-08-19T19:56:19.729Z", "echo": "Não sei",
    "naoSei": true, "calculado": null, "confirmado": false }

target_profit_per_customer = 200
procedencia->'target_profit_per_customer'
  { "em": "2026-08-19T23:31:50.901Z", "ato": "confirmou",
    "origem": "confirmado", "por": "cliente:f5188fd0-...",
    "valor_anterior": 200, "procedencia_anterior": "manual" }
```

**Três horas e trinta e cinco minutos separam os dois.** Às 19:56 ele disse
que não sabia. Às 23:31 ele viu 200 na `/meu-negocio` e confirmou. O jsonb
nunca soube disso — nada no código escreve nele fora da `/onboarding/contas`,
e a `/onboarding/contas` não é o caminho que a `/meu-negocio` usa.

E há um segundo sentido do mesmo buraco, que o QA não relatou porque a conta
não caiu nele: `Contas.tsx:29` decide se a conta está fechada **só pelo
jsonb** (`confirmado || naoSei`). Um valor que chegou pela extração e foi
confirmado na `/meu-negocio` deixa o jsonb vazio — e a `/onboarding/contas`
**volta a perguntar** um número que o cliente já conferiu. Se ele responder,
a coluna é reescrita por cima de um `confirmado`.

### 0.6 Achado fora do lote — registrado, não consertado

`meta_connections.status` está `'connected'` no banco. `/conectar` compara
com `"connected"` (`conectar/page.tsx:31`); `/conta` compara com `"active"`
(`conta/page.tsx:81`). **A `/conta` nunca lista as páginas do Facebook** —
a seção "De qual página seus anúncios saem" não existe na tela, e o cliente
que quiser trocar de página só tem o caminho de refazer o OAuth, que é
exatamente o que aquele bloco foi feito para evitar.

Não é D3 nem D4, e **não entra neste lote**. Registrado com a medição inteira
em [`buraco-status-conexao.md`](./buraco-status-conexao.md) — inclusive o que
não foi verificado, que é o que quem consertar vai precisar primeiro.

---

## 1. O DIAGNÓSTICO — onde ele se sustenta, e onde não

O enunciado propõe: cada tela calcula sozinha; a solução é a do lote B,
`pendenciasDoCliente()` + `resumirPendencias()`, lidos por todas as
superfícies.

**Sustenta-se na forma. Não se sustenta como "é só chamar a função que já
existe", e a diferença muda o tamanho do lote.**

Duas razões, as duas medidas:

**1. A função já existe e o `/inicio` já a chama — e o `/inicio` é uma das
quatro telas que discordam.** A fonte única do lote B funcionou para o que
ela cobre; o problema é que ao lado dela, no mesmo arquivo, alguém escreveu
uma segunda resposta para a mesma pergunta. Fonte única sem a regra "nenhuma
tela escreve a própria frase" não impede a terceira frase de nascer.

**2. `resumirPendencias` responde uma pergunta menor que a pergunta.** Ela
cobre os seis campos obrigatórios do `/cadastro`. Não tem nada a dizer sobre
foto, sobre conexão com o Meta, sobre a peça que ainda não foi gerada, nem
sobre o dia em que a bola não é do cliente. As quatro telas divergem
justamente sobre coisas que estão fora do alcance dela.

Então o diagnóstico correto é mais duro: **partes certas isoladas, e a
pergunta inteira sem dono.** A pergunta inteira é "o que falta pra sair
anúncio?", e a resposta dela não é uma lista de campos — é uma posição numa
cadeia.

---

## 2. A FONTE ÚNICA — `estadoDoCliente()`

Uma função de servidor, `lib/estado/cliente.ts`, que responde a pergunta
inteira uma vez por requisição, lendo tudo o que precisa de uma vez.

### 2.1 A cadeia — a ordem é o conteúdo

"O que falta" não é lista, é sequência. Sem cadastro não adianta ter foto;
sem conexão não adianta ter peça. A cadeia, com o que mede cada elo e **de
quem é a bola**:

| # | etapa | concluída quando | mede lendo | bola |
|---|---|---|---|---|
| 1 | **cadastro** | `montarCadastro().completo` | `businesses` (as colunas de `COLUNAS_DO_CADASTRO`) | cliente — ou **nós**, quando é `nao_sei` |
| 2 | **conexão** | `meta_connections` conectada | `meta_connections` | cliente |
| 3 | **a peça** | existe `creatives` com `copy` gerada | `creatives` | **nós** (n8n) |
| 4 | **sua aprovação** | nenhuma peça em `status = 'draft'` | `creatives` | cliente |
| 5 | **no ar** | existe `campaigns.published_at` | `campaigns` | **nós** |
| 6 | **os números** | existe linha em `metrics_daily` | `metrics_daily` | **o Facebook** |

`proximo` é a **primeira etapa não concluída**. É essa, e só essa, que
qualquer tela tem direito de chamar de "o que falta".

Na conta medida no §0, `proximo` = **3, a peça**, e a bola é nossa. As quatro
telas de hoje mandam esse cliente fazer quatro coisas; a resposta certa é
"nada — a gente está montando".

### 2.2 O que NÃO é etapa: foto

Foto não bloqueia. O `origem_criativo` do payload é fixo em `"gerar"`
(`montar.ts`), a IA monta a peça sem foto do cliente, e a publicação exige um
`creatives` com `external_image_hash` — que vem da geração, não do upload.

Então foto entra no estado como **melhora**, nunca como falta:

```ts
melhoras: { fotos: { tem: number; teto: 10 } }
```

Chamar foto de "o que falta" — como o `/inicio` faz hoje, em destaque, com
CTA — é prometer que o anúncio depende dela. Não depende. É o tipo de
promessa que o cliente cumpre e não vê resultado nenhum.

### 2.3 O tipo

```ts
export type QuemTemABola = "cliente" | "nos" | "facebook";

export interface Etapa {
  id: "cadastro" | "conexao" | "peca" | "aprovacao" | "no_ar" | "numeros";
  concluida: boolean;
  bola: QuemTemABola;
  /** o que o cliente lê. Nunca nome de coluna. */
  titulo: string;
  corpo: string;
  /** null quando a bola não é dele — a regra do §5.1 do onboarding-expandido */
  acao: { rotulo: string; href: string } | null;
  /** desde quando esta etapa está parada, quando dá para saber */
  desde?: string;
}

export interface EstadoDoCliente {
  temNegocio: boolean;
  etapas: Etapa[];
  /** a primeira não concluída. `null` = tudo em ordem */
  proximo: Etapa | null;
  melhoras: { fotos: { tem: number; teto: number } };
}
```

`agora: Date` entra como **parâmetro**, pelo mesmo motivo do
`resumirPendencias`: é o que torna o corte do dia 5 testável sem esperar
cinco dias.

### 2.4 A bola tem NOME — "não é sua vez" não é resposta

Saber que a bola não é do cliente não basta. **"Estamos montando sua
campanha" e "esperando o Facebook aprovar" são coisas diferentes**, e a
diferença muda o que ele faz com a informação: uma ele cobra da gente, a
outra ele não cobra de ninguém.

Por isso `bola` tem três valores e não dois, e cada um tem frase própria:

| bola | como a tela fala | o que o cliente faz com isso |
|---|---|---|
| `cliente` | "Falta você …", com ação | resolve |
| `nos` | "**A gente** está montando sua campanha", com a data em que começamos | sabe de quem cobrar |
| `facebook` | "**O Facebook** está aprendendo quem é seu cliente" | espera sem se assustar |

A conta medida no §0 está parada há um dia na etapa 3 e **nenhuma das quatro
telas diz isso**. Duas mandam ele trabalhar, uma conta foto errado, e a
quarta promete 7 minutos. A informação que ele precisa — "é com a gente, e
começou ontem às 23:31" — não existe em tela nenhuma hoje.

O `relogios.ts` já escreveu essa disciplina para o lado do operador, e a
frase de lá vale palavra por palavra aqui: *"nunca esconder de quem é a
vez"*.

### 2.5 Quando a bola é NOSSA e está parada — a tela admite

Mesma regra do `onboarding-expandido.md §5.1`, aplicada à cadeia inteira:
passado um prazo, o bloco **para de explicar e admite**. Não é o mesmo texto
repetido; é um texto que muda porque a situação mudou.

| etapa | bola | de onde sai o "desde" | prazo até admitir |
|---|---|---|---|
| 1 cadastro | nós, quando é `nao_sei` | `pendencias.desde` (o `em` do jsonb) | **5 dias** — já existe, `DIAS_ATE_TROCAR_DE_DONO` |
| 3 a peça | nós | `businesses.cadastro_iniciado_em` | **2 dias** |
| 5 no ar | nós | `campaigns.created_at` | **2 dias** |
| 6 os números | Facebook | `campaigns.published_at` | **4 dias** |

> **A FONTE DO "DESDE" DA ETAPA 3 MUDOU EM 20/08/2026, no lote F.** O
> parágrafo abaixo continua aqui porque o argumento dele estava certo e
> ainda governa o resto; o que mudou foi um fato que ele não tinha.
>
> O relógio da etapa 3 passou a contar de `execucoes.atualizado_em`, com
> `businesses.cadastro_iniciado_em` de reserva. Motivo:
> `cadastro_iniciado_em` **nunca anda** — marca o instante do disparo e
> morre ali. Enquanto o pipeline não andava os dois eram iguais (na conta
> medida aqui eles diferem por 1,7 segundo), e por isso o defeito estava
> invisível. No dia em que o n8n reagir eles divergem, e a versão antiga
> acusaria de dívida um pipeline que está trabalhando.
>
> **O que NÃO mudou é o que este parágrafo defende:** a leitura continua
> sem tocar em coluna de agente. São `status` e `atualizado_em`, por uma
> função de servidor que recebe o `business_id` já vindo de um `select`
> sob RLS (`lib/pipeline/execucao-do-cliente.ts`). A porta que a auditoria
> fechou continua fechada — o que se abriu foi uma fresta de duas colunas,
> nomeadas à mão. Ver `tela-processando.md` §3.2 e §4.

**De onde vem o "desde" da etapa 3, e por que não é de `execucoes`.**
`cadastro_iniciado_em` e `cadastro_estado` são colunas da própria linha de
`businesses`, sob RLS, com `SELECT` para `authenticated` — conferido no
banco em 20/08. É exatamente o instante em que a gente pegou a bola
(`disparar.ts:163`). Ler `execucoes` para isso seria abrir a tabela que o
`auditoria-resultados.md` fechou: ela mistura texto de cliente com
raciocínio de agente na mesma coluna, sem marca que separe, e o filtro
teria que ser feito campo a campo por quem escrevesse a tela. Não há
motivo para chegar perto dela.

**Por que 2 dias e não os 90 minutos do `relogios.ts`.** Aqueles 90 são a
régua do **operador**, e ele pode agir sobre a suspeita — abrir a execução,
ver onde parou. O cliente não pode fazer nada com ela a não ser desconfiar.
Admitir cedo demais ensina a desconfiar de um sistema que estava bem, e
esse aprendizado não se desfaz. Dois dias é depois de qualquer pipeline
plausível (a própria régua interna trata 90 minutos como parada) e ainda
dentro do prazo em que a informação serve para alguma coisa.

**Os quatro prazos são escolha, não medição** — mesma honestidade do aviso
que abre o `relogios.ts`. Ninguém mediu a duração real de um pipeline. Os 5
dias da etapa 1 são a única exceção: aqueles vêm da janela de arrependimento
de 7 dias do CDC, e o motivo está escrito no `pendencias.ts`.

### 2.6 A etapa 1 delega — e é o que impede o buraco dos dois documentos

O `onboarding-expandido.md §5.1` já é dono da copy da pendência de cadastro,
incluindo duas regras que custaram caro: o prazo de 5 dias em que o bloco
troca de dono, e a proibição de dar botão a quem respondeu "não sei".

**Este documento não reescreve nada disso.** A etapa `cadastro` chama
`resumirPendencias()` e usa `titulo`, `corpo` e `acao` de lá, tal e qual. A
`bola` da etapa 1 sai do mesmo lugar: `nossaDivida === true` ou
`acao === null` significa bola nossa.

A divisão, escrita para ninguém ter que adivinhar depois:

| quem | é dono de |
|---|---|
| `lib/cadastro/pendencias.ts` (§5.1 do onboarding-expandido) | a copy da etapa 1, e só dela |
| `lib/estado/frases.ts` (este documento) | a copy das etapas 2 a 6 |
| `lib/estado/cliente.ts` (este documento) | a cadeia, a ordem, e qual é a próxima |

Nenhum dos dois delega ao outro um caso que o outro não cobre. As etapas 2 a
6 não existem no §5.1; a etapa 1 não é redescrita aqui.

---

## 3. QUEM CONSOME — a mesma fonte, formas diferentes

A advertência do enunciado é justa: uma fonte única que responde a mesma
coisa em toda tela seria consistente e inútil. **O fato é o mesmo; o recorte
não.**

| tela | o que ela mostra do estado | por quê |
|---|---|---|
| `/inicio` | `proximo` inteiro, em destaque, com a ação — e o resto da cadeia como lista secundária, sem peso | É a tela onde a pessoa pergunta "e agora?". É a única que mostra a cadeia. |
| `/anuncios` (vazio) | `proximo`, dito na forma "por que seu anúncio ainda não existe" | O assunto da tela é o anúncio. A frase muda de enquadramento, não de fato. |
| `/onboarding` (trilha) | só a posição na cadeia: qual etapa, e se ela fechou | Trilha é progresso, não cobrança. Sem minutos inventados — ver §5. |
| `/conta` | **nada sobre o que falta** | É a tela de ajustes. O contador de fotos continua, mas como contagem, não como pendência. |

O `/conta` não ganhar frase é decisão, não esquecimento: quatro telas dizendo
a mesma coisa é o outro jeito de errar. Ela já aponta para `/meu-negocio` e
para `/verba`, que é o papel dela.

E a regra que faz isso durar, que é o que faltou no lote B:

> **Nenhuma tela escreve a própria frase sobre o que falta.** Se a frase que
> a tela precisa não existe em `estadoDoCliente()`, o lugar de acrescentá-la
> é lá — não no `page.tsx`. Um `if` sobre dado de negócio dentro de um
> componente de tela é o defeito, mesmo quando a frase está certa.

---

## 4. D4 — QUAL GANHA, E O QUE FAZER COM O OUTRO

### 4.1 A coluna ganha. O jsonb deixa de ser lido como valor.

Três razões, em ordem de peso:

1. **A coluna é o que já governa dinheiro.** É ela que `montarCadastro()` lê,
   é ela que fecha o cadastro, é ela que foi para o `POST /cadastro` na
   execução das 23:31. Deixar o jsonb ganhar seria a tela dizer "você não
   soube" sobre um número que já está definindo quanto a IA pode gastar para
   trazer um cliente.
2. **Só a coluna tem procedência.** `origem`, `ato`, `em`, `por`,
   `valor_anterior`. O jsonb tem `em` e mais nada — ele não sabe quem
   escreveu nem se foi confirmado depois.
3. **A coluna tem caminho de escrita auditado** (`confirmar_campo_do_cliente`,
   0015/0016, lista branca conferida por `pnpm conferir:lista-branca`). O
   jsonb é escrito por uma tela só.

### 4.2 Mas o jsonb não é lixo — ele é o motivo, não o valor

A regra, numa frase:

> **A coluna é o valor. O jsonb é o porquê de a coluna estar vazia — e só
> vale enquanto ela estiver vazia.**

O `naoSei` continua sendo o que distingue "ele viu a pergunta e não soube" de
"ninguém perguntou", que é a distinção que manda a conversa para a entrevista
e que o operador precisa ver antes de ligar. Essa distinção só importa
quando não há valor. Com valor na coluna, ela não tem mais o que decidir.

### 4.3 NÃO apagar o jsonb quando a coluna é preenchida

A tentação óbvia é limpar `contas.lucro.naoSei` quando a coluna recebe valor.
**Não.** Aquilo registra um fato: às 19:56 de 19/08 esse cliente disse que não
sabia. Apagar é reescrever medição — a mesma regra que este projeto já
aplica a documento, e pelo mesmo motivo: quem ler a entrevista depois precisa
saber que a pergunta foi feita e não teve resposta.

Deixar de ler não é apagar. O jsonb continua inteiro, e continua sendo o que
a tela do operador consulta.

### 4.4 O resolvedor — um lugar só, os dois sentidos

Uma função pura em `lib/cadastro/montar.ts`, ao lado de `motivoDaConta()`,
que já é a única que sabe combinar coluna e jsonb:

```ts
export type LeituraDaConta =
  | { estado: "respondida"; valor: number }      // coluna tem valor — ela manda
  | { estado: "nao_sei"; em: string }            // coluna vazia + jsonb naoSei
  | { estado: "nao_perguntado" };                // coluna vazia + jsonb sem chave

export function lerConta(
  coluna: number | null,
  conta: RespostaDeConta | undefined,
): LeituraDaConta;
```

A ordem de teste é a regra do §4.1: **coluna primeiro, sempre.**

Isso conserta os dois sentidos do defeito com o mesmo código:

- `/onboarding/contas` mostra "R$ 200,00" (e a marca de que ele já conferiu)
  no lugar de "Você não soube" — porque a coluna tem valor.
- `Contas.tsx:29` passa a considerar fechada a conta cujo **valor existe**,
  não a conta cuja marca existe no jsonb — então a pergunta que já foi
  respondida por outro caminho não é feita de novo.

E `motivoDaConta()` passa a ser escrita em cima de `lerConta()`, para não
haver duas regras de combinação.

---

## 5. O QUE MUDA, ARQUIVO POR ARQUIVO

**Novos**

- `lib/estado/cliente.ts` — `server-only`. Lê `businesses`, `meta_connections`,
  `creatives`, `campaigns`, `metrics_daily` numa passada e monta a cadeia.
- `lib/estado/frases.ts` — **sem** `server-only`, pelo mesmo motivo de
  `pendencias.ts`: a trilha do onboarding é componente de cliente.

**Mudados**

| arquivo | o que sai | o que entra |
|---|---|---|
| `inicio/page.tsx` | `onboardingCompleto` (:124) e todo o herói condicional (:148-196) | `proximo` do estado; a cadeia como lista secundária |
| `anuncios/page.tsx` | a frase afirmada em `:361`; `quantasFotos` contando `creatives` cru (:36,39) | `proximo` no recorte de anúncio; contagem de foto vinda do estado |
| `conta/Identidade.tsx` | **nada** | ver §5.1: ela já contava certo, quem contava errado era a `/anuncios` |
| `onboarding/page.tsx` + `Trilha.tsx` | `minutosRestantes()` e `blocosDoPasso1()` como fonte de progresso | posição na cadeia; **os minutos somem** — ver abaixo |
| `onboarding/contas/Contas.tsx` | `fechada()` lendo só o jsonb (:29); "Você não soube" incondicional (:92) | `lerConta()` |
| `lib/cadastro/montar.ts` | — | `lerConta()`, e `motivoDaConta()` reescrito em cima dela |

**Os minutos somem, e é decisão.** "faltam ~7 min" é um número que ninguém
mede: é uma tabela fixa por pergunta respondida. Ele estava errado na conta
medida e vai estar errado em qualquer conta que use o bloco 2. Substituir por
um minuto calculado seria inventar precisão; o certo é a trilha dizer onde a
pessoa está, que é o que ela sabe.

### 5.1 A `/conta` não muda — e isso foi conferido, não suposto

O desenho previa mudar o contador dela. Ao implementar, medi:
`listarIdentidade()` já filtra `uso = 'identidade'` e `arquivado_em is null`,
que é exatamente a regra do `estadoDoCliente`. As duas passam a concordar por
construção, sem a `/conta` ler o estado — e fazer o contador dela dar uma
volta pelo módulo novo seria uma consulta a mais para o mesmo número.

Quem contava errado era só a `/anuncios`, com `creatives` sem filtro nenhum.

**Rota nova: nenhuma.** Nada a acrescentar em `PROTECTED_PREFIXES`.

**CSS: nenhuma regra nova prevista.** As formas já existem —
`.hero-destaque`, `.pendencia-bloco`, `.acct-list`, `.empty-card`. Se
aparecer necessidade de regra nova, ela entra pelas mesmas travas: cor só de
`:root`, tamanho só dos seis degraus, `DESIGN.md` regerado.

---

## 6. O QUE NÃO PODE ACONTECER

1. **Não inventar estado.** Zero foto é zero foto, e a tela diz isso. O
   defeito nunca foi o conteúdo, foi a divergência.
2. **Não transformar melhora em falta.** Foto não bloqueia anúncio.
3. **Não cobrar do cliente o que depende de nós.** Etapa com
   `bola !== "cliente"` não ganha CTA de "resolver". É a mesma regra do "não
   sei" do §5.1, aplicada à cadeia inteira.
4. **Não repetir a mesma frase em quatro telas.** Fonte igual, recorte
   diferente (§3).
5. **Não apagar o `naoSei` do jsonb** (§4.3).
6. **Nenhuma tela escreve a própria frase** (§3).

---

## 7. COMO ISTO SERÁ VERIFICADO

Com dado real, na sessão do Victor, nos três estados — e os três precisam ser
vistos, porque um teste que passa num alvo sem achado não prova nada. Já
aconteceu quatro vezes neste projeto.

| estado | conta | o que as quatro telas têm que dizer |
|---|---|---|
| **conta nova** | `f0f0ca84-...` (só `inicio` respondido, tudo nulo) | as quatro apontam para o cadastro — e nenhuma diz "a IA já sabe o essencial" |
| **cadastro completo, bola nossa** | `a85c37a9-...` (a conta do §0) | as quatro dizem que a peça está sendo montada. Nenhuma manda ele fazer nada. Nenhuma diz que ele tem 2 fotos. |
| **legado, chave antiga** | `0de3321a-...` (5 chaves antigas, sem nome nem descrição) | as quatro apontam para o cadastro. O caso do §0.4 tem que sumir. |

Para o D4 especificamente, na conta `a85c37a9-...`: `/onboarding/contas` e
`/meu-negocio` mostrando **R$ 200,00** — a mesma marca de conferido, a mesma
data — e a linha "Você não soube" tendo desaparecido de tela, **com o jsonb
intacto no banco** (conferido por `select` depois, não por expectativa).

E `pnpm conferir` verde: `typecheck`, `conferir:lista-branca`,
`conferir:cadastro`.

---

## 8. O QUE FICA DE FORA — dito na cara

- **O defeito `connected` vs `active` da `/conta`** (§0.6). É real, tem
  consequência de tela, e não é D3 nem D4.
- **Os outros lotes de QA.** Nada de verba sem piso, `/verba` pedindo
  endereço, contraste, navegação.
- **A `/processando` lendo `analysis_runs`** — 0 linhas, medido de novo hoje.
  Já registrado em `disparo-pipeline.md §3`. *(Resolvido no dia seguinte,
  no lote F: a tela foi apagada e o assunto virou a etapa 3 desta cadeia.
  Ver `tela-processando.md`.)*
- **O acionamento do n8n.** É a razão de a conta medida estar parada na etapa
  3, e não muda com este lote. O que muda é a tela **dizer isso** em vez de
  culpar o cliente.

---

## 9. AS DECISÕES — fechadas em 20/08/2026

1. **A cadeia tem seis elos.** A etapa 6 reusa o texto do "dia zero" que já
   está no `/inicio`, em vez de escrever um segundo. Dois donos da mesma tela
   é o defeito que este lote conserta — criar mais um seria estranho.
2. **Os minutos do onboarding somem.** Número inventado numa tela que promete
   honestidade é o pior tipo de copy, e "~7 min" fixo para sempre é pior
   ainda. A trilha passa a dizer onde a pessoa está, que é o que ela sabe.
3. **Foto é melhora, não etapa.** Ela não bloqueia nada, e o herói do
   `/inicio` passa a mostrar o que realmente trava.
4. **A bola tem nome, e a tela admite quando ela é nossa e está parada.**
   §2.4 e §2.5. Quatro prazos, três deles escolhidos e ditos como escolha.

---

## 10. O QUE FOI VERIFICADO — 20/08/2026

Medição, não expectativa. Registra o que rodou e o que não rodou.

### 10.1 O que rodou

**`pnpm conferir` verde**, agora com quatro etapas: `typecheck`,
`conferir:lista-branca` (EM DIA), `conferir:estado` (36 conferências) e
`conferir:cadastro` (TUDO CERTO). O `pnpm build` também fecha limpo, com as
30 rotas compilando.

**`scripts/conferir-estado.ts` — o conferidor novo, e por que ele existe.**
Os cortes de 2 e 4 dias só apareceriam em tela depois de 2 e 4 dias. Como
`montarEtapas` recebe `agora` por parâmetro, o script exercita **os dois
lados de cada corte**: antes do prazo a tela explica, depois ela admite. O
§0 dele é controle negativo — se `ok(false, …)` não contasse como falha,
todo o verde abaixo seria verde sem valor.

Ele já pagou por si: a primeira execução acusou uma asserção minha errada
(eu procurava "aprendendo" no corpo da etapa 6; está no título).

**As três contas reais, pela cadeia.** Rodei `montarCadastro` +
`resumirPendencias` + `montarEtapas` sobre as linhas de verdade do
`V2G-SITE`, com as mesmas leituras que o `estadoDoCliente` faz:

| conta | as quatro telas dizem |
|---|---|
| `f0f0ca84` (nova) | as quatro apontam para o cadastro · trilha 0 de 6 · nenhuma diz "a IA já sabe o essencial" |
| `a85c37a9` (a do §0) | as quatro dizem **"A gente está montando o seu primeiro anúncio"**, tarja "Com a gente agora", **sem botão** · trilha 6 de 6 · fotos: 0 |
| `0de3321a` (legado) | as quatro apontam para o cadastro · trilha 1 de 6 · o falso positivo do §0.4 sumiu |

E o D4, na conta do §0: `lerConta(200, {naoSei:true})` devolve
`{estado:"respondida", valor:200}` — a `/onboarding/contas` mostra
**R$ 200,00** com a marca de conferido, no lugar de "Você não soube". **O
jsonb continua intacto no banco** (conferido por `select` depois, não
presumido).

**A contagem de foto, na linha real.** `creatives` daquele negócio tem 2
linhas; com o filtro novo (`uso = 'identidade'`, não arquivada) dá **0**, que
é o mesmo número que a `/conta` sempre mostrou. A `/anuncios` parou de
chamar de foto um logo e um arquivo removido.

**O CSS novo, medido a 375px** numa bancada estática com o `globals.css` de
verdade: `.conta-origem` cai em linha própria (topo 170 contra 158 do valor),
ocupa a largura do card, sem overflow horizontal. Fonte 11px = `--fs-legenda`
(um dos seis degraus). Cor `#237644` no claro e `#4FC57E` no escuro — o
`--good`, o mesmo token que a `/meu-negocio` já usa para a mesma afirmação.
`DESIGN.md` regerado sem diff: nenhuma cor nova, nenhum tamanho novo.

### 10.2 O que NÃO rodou

**Nenhuma das quatro telas foi aberta logada.** Havia um `next dev` de outra
sessão ocupando a porta, e não há sessão autenticada nesta máquina para mim
— e pedir senha está fora de questão. O que foi verificado foi a **cadeia
sobre os dados reais** e o **build**, não o pixel da tela renderizada.

O que falta é seu, e é rápido: abrir `/inicio`, `/anuncios`, `/conta` e
`/onboarding` logado na conta `a85c37a9` e conferir que as quatro dizem a
mesma coisa — e que a `/onboarding/contas` mostra R$ 200,00.

**Os prazos de 2 e 4 dias nunca foram vistos em produção**, só no conferidor.
Eles são escolha, não medição (§2.5), e o primeiro cliente que cruzar o corte
é quem vai dizer se o número está certo.

---

## 11. A LISTA DO "RESTO DO CAMINHO" — defeito e conserto, 20/08/2026

Achado na revisão do lote, na tela, na conta `a85c37a9`. A lista mostrava:

```
(sem título)                            Já está feito.
Falta conectar sua conta                Já está feito.
Tem peça esperando você                 Já está feito.
```

**Não era deslocamento entre título e estado.** Rodei o componente linha a
linha: cada `<b>` estava pareado com o próprio `<span>`, na mesma iteração.
Eram três defeitos independentes que se pareciam com um.

### 11.1 O título vazio

A etapa 1 delega a copy ao `resumirPendencias` (§2.6), e aquele módulo
devolve `titulo: ""` quando não há pendência — ele nunca precisou de frase
para "não falta nada", porque nunca renderizou esse caso. A delegação estava
certa; o buraco é que ela só cobria o estado pendente, e a lista mostra o
estado resolvido.

### 11.2 Nome não é chamado de ação

`titulo` é escrito para o herói, onde a etapa está pendente: *"Falta
conectar sua conta"* é a frase certa lá. Numa lista, onde a mesma etapa
aparece resolvida, ela vira contradição — e mistura duas vozes na mesma
linha: chamado de ação de um lado, estado do outro.

Cada etapa ganhou **`nome`**, substantivo, que funciona nos três estados:
*Seu cadastro · A conexão da sua conta · A peça do seu anúncio · A sua
aprovação · O anúncio no ar · Os primeiros números*. `titulo` continua sendo
a frase do herói, e está documentado no tipo que ele **só tem sentido
enquanto `concluida` é falso**.

### 11.3 O terceiro, que é o grave: dois estados onde havia três

*"Tem peça esperando você · Já está feito"* para um cliente que nunca
aprovou nada. A lista perguntava `etapa.concluida`, e o predicado da
aprovação é `pecasParaAprovar === 0` — **verdade vazia** quando não existe
peça nenhuma.

Numa cadeia, "não está pendente" tem dois significados incompatíveis:
aconteceu, e ainda não chegou a vez. Quem sabe a diferença não é a etapa
sozinha: é a **posição dela em relação à atual**. Não dá para ter aprovado
uma peça que ainda não existe.

É a mesma classe de defeito que este projeto já registrou — `true`, `false`
e `null` para "não sei"; o `false` que era "não consegui verificar" acusou
todo cliente de não ter WhatsApp. Aqui o "não está pendente" que era "ainda
não chegou" afirmava serviço prestado.

`posicoesDaCadeia()` devolve `feita | atual | ainda_nao`, e o futuro diz de
quem VAI ser a vez — a mesma informação que o herói dá sobre o presente:

```
Seu cadastro              Já está feito.
A conexão da sua conta    Já está feito.
A sua aprovação           Ainda não chegou — vai depender de você.
O anúncio no ar           Ainda não chegou — vai ser com a gente.
Os primeiros números      Ainda não chegou — vai depender do Facebook.
```

O §9 de `conferir-estado.ts` cobre os três — inclusive a asserção de que a
aprovação tem `concluida === true` E posição `ainda_nao`, que é o par exato
que produzia a mentira. 48 conferências, verde.
