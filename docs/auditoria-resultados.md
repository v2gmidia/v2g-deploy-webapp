# O que tem dentro de `execucoes.resultados`

**Medição de 19/08/2026.** Este documento registra o que foi visto; não se
atualiza. Se o conteúdo mudar, a medição nova é outro documento.

Feita para responder ao D2 do [`disparo-pipeline.md`](./disparo-pipeline.md):
*dá para abrir `SELECT` de `execucoes` para o cliente dono?* A resposta é
**não**, e abaixo está o motivo com o texto na mão.

---

## 0. `resultados` não é coluna

Primeira coisa a saber, porque ela muda onde se olha: **não existe
`execucoes.resultados`.** O campo aparece no schema `RespostaExecucao` da
API, mas o backend o monta a partir de sete colunas jsonb da tabela:

```
classificacao   diagnostico   oferta   estrutura_campanha
copy            varredura_site         compliance_visual
```

Quem for auditar de novo tem que olhar as sete, não procurar uma.

Preenchimento nas 4 linhas de hoje:

| coluna | linhas com valor |
|---|---|
| `classificacao` | 4 |
| `diagnostico` | 4 |
| `oferta` | 4 |
| `estrutura_campanha` | 4 |
| `copy` | 4 |
| `compliance_visual` | 2 |
| `varredura_site` | **0** |

---

## 1. Não há prompt, chave nem custo

O que se procurava primeiro, e não está lá: nenhuma chave de API, nenhum
prompt de sistema, nenhuma contagem de token, nenhum valor em dólar,
nenhum nome de modelo. Isso é bom e vale dizer, porque é o vazamento mais
caro e ele não aconteceu.

**O problema é outro, e é de audiência.**

## 2. O que está lá e não é para o cliente ler

### 2.1 Raciocínio da IA julgando o negócio dele

`classificacao.justificativa`:

> "Negócio vende bebida (suco) para consumo imediato, o que caracteriza um
> tipo de bar/lanchonete. **Descrição é curta e vaga**, sem detalhar se há
> comida ou apenas bebidas."

O cliente escreveu a descrição. Ler que ela é "curta e vaga" numa tela do
produto que ele paga é uma nota sobre ele, não sobre o negócio.

### 2.2 Estratégia dita em linguagem de dentro

`oferta.brecha_explorada`:

> "Ataca a objeção nº1 documentada no nicho — cobrança fora do combinado e
> 'preço puxadinho' em tratamento longo — somada ao medo de venda
> desnecessária…"

> "A pesquisa aponta que o mercado satura 'tecnologia de ponta' sem dizer
> para que serve…"

O nome do campo já entrega: **brecha explorada**. É como a gente descreve
o mercado dele entre nós. Um dentista lendo que a V2G "ataca a objeção de
cobrança fora do combinado" do próprio nicho lê uma coisa que é verdade e
que ninguém escreveu para ele ver.

### 2.3 A IA falando na primeira pessoa sobre o que descartou

`copy.observacoes`:

> "**Escolhi** 5 dos 7 ângulos do banco priorizando diversidade de
> gatilho: cobrança fora do combinado, venda desnecessária…"

> "Dois ângulos do banco foram deixados de fora por não terem base na
> oferta declarada: 'Urgência de dor' (a clínica posiciona projeção
> estética planejada, não pronto-atendimento)…"

É registro de decisão de agente. Útil para o operador, e para o cliente é
a cozinha aberta no meio do salão.

### 2.4 Auditoria de compliance com gravidade

`compliance_visual.achados`:

> `{"regra": "6 - Texto ilegível ou com erro de ortografia em português",
> "gravidade": "bloqueante", "o_que_foi_visto": "Folha segu…"}`

Regra numerada, veredito, gravidade. É o parecer interno que decide se a
peça passa — e mostrar "bloqueante" ao cliente antes de alguém tratar é
alarme sem dono.

### 2.5 E, no meio de tudo, texto que É para ele

`diagnostico.explicacao`:

> "O orçamento de R$ 399,90/mês é justo para atingir o CAC-alvo de R$ 5,
> mas deixa pouca margem de segurança. Se a conversão cair abaixo de 20%
> ou os custos subirem um pouco, **você** fica…"

Segunda pessoa, linguagem de cliente, conteúdo útil. **Está na mesma
coluna, no mesmo jsonb, sem nenhuma marca que o separe do resto.**

É isto que fecha o D2: não é que `resultados` seja interno. É que ele é
**os dois misturados**, e não existe campo, prefixo ou convenção que diga
qual é qual. Um `SELECT` aberto entrega o pacote inteiro, e a separação
teria que ser feita campo a campo, à mão, por quem escrever a tela — que
é exatamente o tipo de filtro que se esquece.

---

## 3. Duas coisas achadas de brinde

### 3.1 Saída de mock convive com saída real, sem separação de tabela

Uma das 4 execuções tem, nas mesmas colunas:

```
classificacao.justificativa  "[mock] termo do nicho encontrado na
                              descricao: clinica-odontologica"
oferta.brecha_explorada      "[mock] derivado do diferencial
                              confirmado: x"
```

O prefixo `[mock]` é a única diferença. Não há coluna de origem, não há
flag, não há tabela separada — **só uma convenção de texto dentro do
valor.** Uma tela que renderizasse isso mostraria `[mock] derivado do
diferencial confirmado: x` como se fosse análise do negócio do cliente.

Nada a fazer aqui neste lote; fica registrado porque é a segunda razão
para o `SELECT` continuar fechado, e porque quem for construir a tela do
cliente precisa saber que **a saída de teste não é distinguível por
schema.**

### 3.2 As duas escalas de confiança, confirmadas na fonte

`classificacao.confianca` nas 4 linhas: `0.93`, `0.97`, `0.98` e **`75`**.

É exatamente o que o cabeçalho de `lib/backend/execucoes.ts` já
descrevia a partir da API, agora visto na coluna: três em 0–1 e a legada
em 0–100. O `formatarConfianca` continua necessário, e continua certo.

---

## 4. A conclusão, e ela é sobre COLUNA, não sobre LINHA

**Nenhuma política de RLS resolve este problema. Nenhuma.**

Vale isolar isto do resto do documento, porque é a parte que se perde
quando alguém volta aqui com pressa procurando "posso abrir?".

RLS decide **quais linhas** um papel enxerga. `using
(private.owns_business(business_id))` responde "esta execução é dele?" —
e a resposta seria sim, corretamente. A linha É dele. O que está errado
não é a linha chegar até ele; é **o que vem dentro dela**.

O vazamento aqui é de coluna:

| coluna | audiência real |
|---|---|
| `diagnostico.explicacao` | **o cliente** — segunda pessoa, texto escrito para ele |
| `classificacao.justificativa` | interna — a IA julgando a descrição dele |
| `oferta.brecha_explorada` | interna — estratégia sobre o nicho dele |
| `copy.observacoes` | interna — a IA em 1ª pessoa sobre o que descartou |
| `compliance_visual.achados` | interna — parecer com gravidade `bloqueante` |
| `estrutura_campanha.*` | interna — parâmetros de campanha |

Não há prefixo, flag, nem convenção que separe as duas audiências. Uma
política de RLS entregaria as seis de uma vez, com a consciência limpa de
ter conferido o dono.

**Consequência prática, para quem for repontar a `/processando`
(`disparo-pipeline.md` §3):**

> Expor `resultados` ao cliente exige **filtrar campo a campo**, com
> alguém tendo lido o texto de cada um. Não existe atalho por RLS, por
> `select` da tabela inteira, nem por "mostra só se `requer_revisao` for
> falso".

Para a `/processando` especificamente isso é fácil, porque ela precisa de
**dois campos e nenhuma coluna de agente**: `status` e `atualizado_em`. A
tentação é pedir `select *` porque é uma linha só — e é exatamente aí que
o pacote inteiro atravessa.

## 5. O que isto decide

**D2 fica como está: `execucoes` continua `default deny`, só
`service_role`.** A migration 0018 não cria política nenhuma.

**Quando a `/processando` for repontada** (o lote seguinte, ver
`disparo-pipeline.md` §3), a leitura do cliente **não** pode ser um
`select *`. As duas saídas possíveis, nesta ordem de preferência:

1. **Uma função de servidor que devolve só o que a tela precisa.** Para a
   `/processando`, o que ela precisa é `status` e `atualizado_em`. Nada
   mais. Nenhuma das sete colunas jsonb entra.
2. Se um dia uma tela precisar de conteúdo de agente, o campo entra
   **um a um, nomeado**, com alguém tendo lido o texto — não por
   `resultados` inteiro com um filtro por cima.

Uma política de RLS de `SELECT` na tabela não resolveria isso: ela
libera a **linha**, e o problema é a **coluna**. Foi por isso que a
proposta original da §6.2 estava errada, e é por isso que o D2 pediu a
auditoria antes.
