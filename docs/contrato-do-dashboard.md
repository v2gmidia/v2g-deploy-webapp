# Contrato do dashboard

> 10/09/2026. O que o webapp recebe para mostrar **"esta campanha está indo bem
> ou não"**, campo a campo, com exemplo real das três campanhas que têm dado.
>
> Escrito para ser lido sem abrir código. O backend é este repositório; a tela
> é o repositório do Victor.

---

## O endpoint

```
GET /execucoes/{id_execucao}/consolidado
      ?desde=YYYY-MM-DD        opcional, padrão: ate - 29 dias
      &ate=YYYY-MM-DD          opcional, padrão: hoje
      &dia_da_pergunta=YYYY-MM-DD   opcional
```

Há um irmão para o negócio inteiro (todas as execuções dele somadas):
`GET /negocios/{business_id}/consolidado`.

Ele tem os mesmos campos, **mais quatro**, e uma regra própria que a tela
precisa conhecer: `moeda`, `moedas`, `por_execucao` e `nivel` do PIOR caso.

> **MOEDAS DIFERENTES NÃO SOMAM** — decisão do Gabriel, 10/09/2026.
>
> ```
> {BRL}            soma, com símbolo
> {} (tudo nulo)   soma SEM símbolo (linhas anteriores à 0025)
> {BRL, None}      NÃO soma — não dá para afirmar que é uma só
> {BRL, AUD}       NÃO soma — é a decisão
> ```
>
> Quando não soma: `investiu_centavos: null`, `retorno_por_real: null`,
> `moeda: null`, e **`moedas` diz quais são**. A quebra vem em `por_execucao`,
> uma ficha por campanha com a própria moeda e o próprio nível. **A tela vira
> duas fichas.**
>
> Somar exigiria taxa de câmbio, e taxa de câmbio no backend é inventar dado de
> mercado (§15).
>
> `cliques` e `impressoes` somam sempre: clique é clique em qualquer moeda.
>
> `nivel` do negócio é o **pior** entre as execuções, nunca a média — um
> negócio com uma campanha pausada e outra saudável não está "mais ou menos".
> Sem execução com métrica, `nivel: null` e não `ok`: nenhum dado não é um
> negócio saudável.

---

## O payload, campo a campo

### Identificação da janela

| campo | tipo | o que é |
|---|---|---|
| `id_execucao` | uuid | a campanha |
| `desde` / `ate` | date | o período que estes números cobrem, **sempre ecoado** — a tela não deve assumir que recebeu o que pediu |

### Os números

Todo valor em dinheiro é **inteiro em centavos**, nunca decimal. Ver §12 do
CLAUDE.md: float em dinheiro é defeito.

| campo | tipo | `null` significa |
|---|---|---|
| `investiu_centavos` | `int \| null` | nenhum dia tem gasto conhecido |
| `voltou_centavos` | `int \| null` | o dono não informou receita |
| `pessoas_que_chegaram` | `decimal \| null` (vem como string) | não há contato medido |
| `vendas` | `int \| null` | o dono não informou vendas |
| `retorno_por_real` | `decimal \| null` (string) | falta um dos dois lados, ou o investimento é zero |
| `dias_com_os_dois_lados` | `int` | quantos dias servem para medir lead→venda |
| `dias[]` | lista | um item por dia, mesmos campos, mais `viraram_venda` |

**`pessoas_que_chegaram` chega como string** (`"0.0"`) porque é `Decimal` — a
Meta atribui conversão fracionária por modelo de atribuição, e arredondar
inventaria contato que não houve. A tela deve tratar como decimal, não como
inteiro.

### A leitura — o que a tela precisa para dizer "bem ou não"

| campo | tipo | o que é |
|---|---|---|
| `moeda` | `str \| null` | ISO 4217 da conta de anúncio |
| `nivel` | `str \| null` | o degrau da escada — **sempre sobre os 30 dias canônicos** |
| `nivel_frase` | `str \| null` | o `nivel` escrito para o dono |
| `pessoas_que_chegaram_medido` | `bool \| null` | a plataforma conta os contatos? |
| `tem_dado_da_plataforma` | `bool` | houve alguma métrica no período |
| `respondeu_hoje` | `bool \| null` | o dono já respondeu por hoje |
| `respondeu_no_dia` | `bool \| null` | idem, pelo `dia_da_pergunta` |
| `dia_da_pergunta` | `date \| null` | eco do que foi pedido |

---

## As três regras que a tela erra se ninguém disser

### 1. A MOEDA — nunca assuma real

`moeda` é a moeda de **todos** os valores em centavos do payload.

```
Byond Colour     "moeda": "AUD"    investiu_centavos: 11345   ->  A$ 113,45
FLEETLINK        "moeda": "BRL"    investiu_centavos:  7325   ->  R$  73,25
```

Os dois números renderizados como `R$` seriam o mesmo pixel, e um deles estaria
errado por um fator de câmbio. Caso 14 da §11.1.

**`moeda: null` não autoriza assumir BRL.** Significa que a janela não tem uma
moeda só — zero linhas, moedas misturadas, ou alguma linha sem moeda gravada. A
tela mostra o número sem símbolo, ou não mostra. Nesse caso o `nivel` vem
`sem_comparacao`, e a frase explica ao dono.

### 2. `null` NÃO É ZERO — e a diferença muda o que a tela desenha

| valor | leitura | o que a tela faz |
|---|---|---|
| `0` | medimos, e deu zero | mostra `0`, é um resultado |
| `null` | não sabemos | mostra `—`, nunca `0` |

Isto vale para **todo** campo anulável, e é o motivo de eles serem anuláveis.
`voltou_centavos: null` desenhado como "R$ 0,00" diz ao dono que a campanha não
trouxe nada, quando a verdade é que ninguém perguntou a ele.

**O caso difícil é `pessoas_que_chegaram: 0`**, porque o zero ali responde a
duas perguntas opostas:

```
"medimos, e ninguem chegou"        -> 0, e e um resultado RUIM
"nao ha o que conte contato aqui"  -> 0, e nao e resultado nenhum
```

Quem separa é `pessoas_que_chegaram_medido`, com **três** estados:

| valor | significa | de onde vem |
|---|---|---|
| `true` | a medição funciona | houve contato registrado |
| `null` | **não dá para afirmar** | é o caso do zero |
| `false` | a conta não tem ação de conversão que conte | só o coletor sabe |

**Esta rota nunca devolve `false`, e isso é deliberado.** Afirmar "não é
medido" exige perguntar à plataforma, e uma tela não pode depender da API do
Google estar de pé. Devolver `false` daqui esconderia como "não medimos" uma
campanha que mede e não converteu — que é o resultado ruim que o dono mais
precisa ver.

Enquanto `null`, a tela mostra o `nivel_frase` em vez do número.

### 3. O NÍVEL, com a frase — e ela vem pronta

**A tela não traduz o nível.** O slug (`sem_alvo`) é chave de máquina; quem
escreve para o dono é o backend, em `metricas/andamento.py::FRASE_PARA_O_DONO`.

O motivo é mecânico: se a tradução morasse no webapp, um nível novo nasceria
sem frase e apareceria cru para o cliente. Aqui um teste reprova nível sem
frase (`tests/unit/test_andamento.py::TestTodoNivelTemFrase`).

**São catorze níveis, não seis.** Os seis do pedido são as ausências; a tela pode
receber qualquer um dos treze, e todos têm frase.

#### Os que julgam

| `nivel` | frase que a tela recebe |
|---|---|
| `ok` | Está indo bem. O que você paga por cada pessoa que chega está dentro do combinado. |
| `alerta_inicial` | Cada pessoa que chega está custando mais do que o combinado. Seu gestor já viu e vai ajustar a campanha. |
| `alerta_urgente` | O custo por pessoa que chega subiu bastante acima do combinado. Seu gestor vai mexer na campanha nos próximos dias. |
| `pausa_automatica` | Pausamos a campanha para ela parar de gastar sem trazer resultado. Seu gestor vai revisar antes de ligar de novo. |
| `em_avaliacao` | A campanha já mostrou o anúncio para bastante gente e ainda não trouxe contato. Seu gestor está acompanhando de perto. |
| `gargalo` | Muita gente clicou e ninguém entrou em contato. Isso costuma ser alguma coisa depois do anúncio — o site, a oferta ou o WhatsApp. Seu gestor vai investigar. |

#### Os que dizem "ainda não dá para afirmar"

**Nenhum destes é erro**, e nenhuma frase soa como erro — há teste para isso.

| `nivel` | frase que a tela recebe |
|---|---|
| `em_aprendizado` | A campanha ainda está aprendendo com quem clica. Nos primeiros dias os números variam muito, e por isso ainda não valem como resultado. |
| `sem_base` | A campanha ainda investiu pouco para dizermos se está boa ou ruim. Falta ela rodar mais alguns dias. |
| `sem_dado` | Ainda não recebemos os números desses dias. Assim que a plataforma enviar, eles aparecem aqui. |
| `sem_gasto` | Nesse período a campanha não investiu nada, então ainda não há resultado para mostrar. |
| `sem_alvo` | Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim. |
| `sem_medicao` | A campanha está rodando, mas os contatos que ela traz ainda não estão sendo contados. Estamos terminando de configurar essa medição. |
| `medicao_nao_verificada` | A campanha está rodando e ainda não registramos nenhum contato vindo dela. Antes de dizer que o resultado está ruim, precisamos confirmar que esses contatos estão sendo contados — seu gestor está verificando. |
| `sem_comparacao` | Esta conta cobra em outra moeda, então os valores abaixo não estão em reais e não dá para comparar com a meta combinada. |

**Sugestão de cor, e é sugestão:** vermelho só em `pausa_automatica` e
`alerta_urgente`; amarelo em `alerta_inicial`, `em_avaliacao` e `gargalo`; verde
em `ok`; **cinza neutro em todos os sete restantes** — eles não são estado ruim,
são estado indeterminado, e pintá-los de amarelo faria o dono ligar para o
gestor sem motivo.

---

## Exemplo real — Byond Colour, 03 a 05/09/2026

Cliente no ar, conta australiana. Payload literal:

```json
{
  "id_execucao": "3de135e4-0da0-4adc-818e-3b0de71492a6",
  "desde": "2026-09-03",
  "ate": "2026-09-05",
  "dias": [
    { "dia": "2026-09-03", "investiu_centavos": 0,    "pessoas_que_chegaram": "0.0", "viraram_venda": null, "voltou_centavos": null },
    { "dia": "2026-09-04", "investiu_centavos": 2299, "pessoas_que_chegaram": "0.0", "viraram_venda": null, "voltou_centavos": null },
    { "dia": "2026-09-05", "investiu_centavos": 3544, "pessoas_que_chegaram": "0.0", "viraram_venda": null, "voltou_centavos": null }
  ],
  "investiu_centavos": 5843,
  "voltou_centavos": null,
  "pessoas_que_chegaram": "0.0",
  "vendas": null,
  "retorno_por_real": null,
  "dias_com_os_dois_lados": 0,
  "respondeu_hoje": null,
  "dia_da_pergunta": null,
  "respondeu_no_dia": null,
  "tem_dado_da_plataforma": true,
  "moeda": "AUD",
  "nivel": "sem_alvo",
  "nivel_frase": "Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim.",
  "pessoas_que_chegaram_medido": null
}
```

A tela desenha: **A$ 58,43 investidos** em 3 dias, retorno `—` (não `R$ 0,00`),
contatos `—` (não `0`), e o card de estado em cinza com a frase de `sem_alvo`.

## As outras duas, resumidas

| | FLEETLINK | TESTE-DADOS-REAIS (Meta) |
|---|---|---|
| `id_execucao` | `7fcfc505-…` | `aed42ce7-…` |
| janela medida | 07–09/09, 3 dias | 05–07/09, 3 dias |
| `moeda` | `BRL` | `BRL` |
| `investiu_centavos` | `7325` | `1025` |
| `pessoas_que_chegaram` | `"0.0"` | `"0.0"` |
| `voltou_centavos` / `vendas` | `null` / `null` | `null` / `null` |
| `nivel` | `sem_alvo` | `sem_alvo` |
| `pessoas_que_chegaram_medido` | `null` | `null` |

---

## O que FALTA para a tela dizer "bem ou não" — medido, não suposto

As três campanhas com dado real saem hoje em `sem_alvo`. **Não é defeito da
tela nem do payload: é o estado verdadeiro do sistema**, e a lista abaixo é o
que precisa acontecer para elas saírem disso.

### 1. `cpl_alvo`, e é o bloqueador de verdade

```
FLEETLINK      diagnostico.cpl_alvo = None
Byond Colour   diagnostico.cpl_alvo = None
TESTE-DADOS    diagnostico.cpl_alvo = None
```

Sem quanto vale um contato para aquele negócio, **nenhum número diz se está bom
ou ruim** — R$ 73,25 é barato para implante e caro para pizza. As duas campanhas
de cliente entraram por `scripts/backfill_google.py`, que registra a campanha e
não faz a reunião de onboarding; o CPL-alvo sai de `diagnosticar-orcamento`,
que não rodou nelas.

**Não há como o backend inventar isso**, e é a única coisa da lista que depende
de conversa com o cliente, não de código.

### 2. Nenhum lado do dono, em nenhuma das três

`voltou_centavos`, `vendas` e `viraram_venda` são `null` em 13 dias de 13. O
loop de pergunta diária existe (`respostas_do_dono`) e ninguém respondeu ainda.

Sem esse lado, `retorno_por_real` é `null` e a tela não tem "investiu X, voltou
Y" — só "investiu X". A metade que falta é a que o dono considera resultado.

### 3. `pessoas_que_chegaram_medido` nunca vira `true` ou `false`

Fica `null` nas três, e vai continuar: o campo que responde de verdade é
`ColetaDeCampanha.conversao_contavel`, e **`ColetaDeCampanha` não é persistida
por ninguém** — ela existe durante a rodada do coletor e é descartada.

Enquanto isso, a tela não consegue distinguir "ninguém chegou" de "nada conta
contato aqui". O conserto é gravar o resultado da rodada por campanha; é
mudança de banco e não foi feita.

### 4. Se a campanha está NO AR, ninguém sabe

`estrutura_pronta` é terminal e quem despausa é o gestor no Ads Manager, fora do
sistema. O coletor lê `status_na_plataforma` e **descarta junto com o resto**.

Para a tela isso importa porque `sem_gasto` tem duas causas com desenhos
opostos: "está pausada, por isso não gastou" e "está no ar e não entregou". A
primeira é normal e a segunda é problema.

> Tratado no item 2 deste mesmo lote — `status_na_plataforma` passa a ser
> gravado, e a tela ganha de onde ler.

### 5. O que eu NÃO acrescentei, e por quê

- **`cpl_atual` / "quanto você está pagando por contato"** — seria
  `investiu / pessoas_que_chegaram`, e com `pessoas_que_chegaram = 0` nas três
  daria divisão por zero ou `null` em 100% dos casos de hoje. Entra quando
  houver conversão medida.
- **Série histórica de nível** ("estava ok, virou alerta") — exige persistir o
  nível por dia, que é a mesma mudança de banco do item 3 acima.
- **Comparação com o mês anterior** — 13 dias de dado no total; não há mês
  anterior.

Nenhum dos três foi inventado como campo vazio: campo que existe e vem sempre
`null` ensina a tela a ignorá-lo, e no dia em que tiver valor ninguém desenha.

---

## Onde isto mora no código

| o quê | onde |
|---|---|
| forma do payload | `src/api/modelos.py::RespostaConsolidado` |
| a rota | `src/api/rotas.py::ler_consolidado` |
| nível e moeda | `src/metricas/andamento.py` |
| as frases | `src/metricas/andamento.py::FRASE_PARA_O_DONO` |
| a escada | `src/dominio/otimizacao.py::avaliar_nivel_alerta` |
| travas | `tests/unit/test_andamento.py` |

O coletor e esta rota chamam **as mesmas** funções de nível e moeda. Duas
implementações da mesma pergunta divergiriam, e a divergência só apareceria
quando alguém comparasse a tela com o log — caso 11 da §11.1.

---

# A TELA DE HOJE: `sem_alvo` é o caminho principal

> 10/09/2026. **As três campanhas com dado real saem `sem_alvo`, e vão continuar
> saindo até a reunião de onboarding acontecer.** Isto não é degradação nem
> estado de erro — é a primeira tela que vai ao ar, e ela precisa ser boa.

## O que a tela mostra, e por quê

`cpl_alvo` é a única coisa da lista de pendências que não depende de código:
ela sai de `diagnosticar-orcamento`, que roda na reunião. Sem ela, **nenhum
número diz se está bom** — R$ 73,25 por contato é barato para implante e caro
para pizza.

O que continua verdadeiro sem alvo nenhum é **fato**, e é isso que se mostra:

| mostra | por quê |
|---|---|
| `investiu_centavos` **com `moeda`** | quanto saiu da conta dele. Não depende de meta |
| `cliques` | quantas pessoas clicaram. Fato, e o dono entende |
| `impressoes` | quantas vezes o anúncio apareceu |
| `dias` com gasto | há quanto tempo está rodando |
| `nivel_frase` | por que ainda não há veredito |

**Não mostra** — e a ausência é a parte importante:

- **nada que se pareça com nota, sinal ou semáforo.** Verde/amarelo/vermelho
  sem alvo é opinião fingindo ser medida.
- **custo por clique.** É derivável (`investiu / cliques`) e é a porta de
  entrada para o dono comparar com um número que ele ouviu de alguém. O produto
  compara com o CPL-alvo dele, e ele ainda não existe.
- **`pessoas_que_chegaram: 0`** enquanto `pessoas_que_chegaram_medido` for
  `null`. Zero contato sem saber se a conta conta contato é o zero que mente.
- **`retorno_por_real`**, que é `null` nas três: sem o lado do dono não há
  retorno para calcular.

## Os números reais de hoje

```
FLEETLINK       moeda=BRL  investiu=  7325  cliques=32  impressoes= 317  nivel=sem_alvo
Byond Colour    moeda=AUD  investiu= 11345  cliques=22  impressoes= 315  nivel=sem_alvo
TESTE-DADOS     moeda=BRL  investiu=  1025  cliques=64  impressoes=1657  nivel=sem_alvo
```

Traduzido para a tela do dono da FleetLink:

> **R$ 73,25 investidos** em 3 dias
> **32 pessoas clicaram** no seu anúncio — o anúncio apareceu 317 vezes
>
> *Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que
> chega. Sem esse número não dá para dizer se está bom ou ruim.*
>
> Contatos: —   Retorno: —

## A frase, e por que ela não é um pedido de desculpas

`nivel_frase` do `sem_alvo` já vem pronta e foi escrita para este caso:

> *"Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que
> chega. Sem esse número não dá para dizer se está bom ou ruim."*

Três decisões dentro dela:

1. **"definimos juntos"** — o número sai de uma conversa sobre o negócio dele,
   não de um campo que alguém esqueceu de preencher. É verdade e não soa como
   pendência nossa.
2. **"não dá para dizer"**, não "não sabemos". A primeira é sobre a natureza da
   pergunta; a segunda soa como falha de sistema.
3. **Nenhuma palavra de erro**, e há teste para isso
   (`test_andamento.py::test_nenhuma_frase_soa_como_erro`).

O que a tela **não** deve acrescentar: prazo ("em breve"), desculpa ("desculpe
a limitação") ou call-to-action que o dono não pode executar sozinho. Marcar a
reunião é o gestor quem faz.

## Quando o alvo chegar

Nada na tela muda de lugar: `nivel` deixa de ser `sem_alvo` e vira `ok`,
`sem_base`, `em_aprendizado` ou um dos alertas, `nivel_frase` acompanha, e o
bloco de contatos e retorno preenche quando o dono começar a responder.

É por isso que `nivel` e `nivel_frase` são campos e não estados de tela: a
mesma tela serve os treze níveis, e nenhum deles é um layout diferente.

---

# O NÍVEL É SEMPRE SOBRE 30 DIAS CANÔNICOS

> Decisão do Gabriel, 10/09/2026.

O recorte que a tela pede (`desde`/`ate`) muda **os números** — `investiu`,
`cliques`, `impressoes`, `dias[]`. **Não muda o `nivel` nem a `nivel_frase`**,
que respondem sempre sobre os últimos 30 dias, a mesma janela do coletor.

O motivo, medido:

```
90 dias de dado, recorte de 06 a 10  ->  pausa_automatica
90 dias de dado, recorte padrão      ->  sem_base
```

E a frase de `pausa_automatica` afirma *"Pausamos a campanha"*. Com um seletor
de período, o dono conseguiria fazer o painel afirmar que pausamos a campanha
dele — mudando um filtro. **Nível é diagnóstico do sistema, não função do
filtro da tela.**

Consequência para o webapp: um recorte sem dado nenhum devolve
`investiu_centavos: null` e **um `nivel` que continua descrevendo a campanha**.
Isso é intencional — pedir uma semana de férias não pode fazer o painel dizer
`sem_dado` sobre uma campanha que está rodando.

---

# `ok` — o que a tela mostra no dia em que a primeira chegar

> Item 6. É o estado que o cliente pagante vai ver na maior parte do tempo, e
> nenhuma campanha nossa chegou nele. O payload abaixo é construído.

## O payload

```json
{
  "moeda": "BRL",
  "nivel": "ok",
  "nivel_frase": "Está indo bem. O que você paga por cada pessoa que chega está dentro do combinado.",
  "pessoas_que_chegaram_medido": true,
  "investiu_centavos": 100000,
  "cliques": 160,
  "impressoes": 1920,
  "pessoas_que_chegaram": "20",
  "voltou_centavos": null,
  "vendas": null,
  "retorno_por_real": null,
  "dias_com_os_dois_lados": 0,
  "tem_dado_da_plataforma": true
}
```

## O que MUDA em relação a `sem_alvo`

| | `sem_alvo` | `ok` |
|---|---|---|
| `pessoas_que_chegaram` | `"0"`, e a tela mostra `—` | `"20"`, e a tela **mostra o número** |
| `pessoas_que_chegaram_medido` | `null` | **`true`** |
| custo por contato | proibido exibir | **é o número principal** |
| estado visual | cinza neutro | verde |

**A virada é `pessoas_que_chegaram_medido: true`.** Ele só fica verdadeiro
quando houve conversão registrada — e conversão registrada **prova** que a
medição funciona. É o único estado em que a tela pode exibir contatos como
resultado sem risco de estar mostrando um zero que mente.

E é aí que o custo por contato passa a ser exibível: `investiu / contatos` =
R$ 50,00, e existe um combinado para comparar. Em `sem_alvo` esse mesmo número
seria uma opinião — nada dizia se R$ 50 é bom para aquele negócio.

## O que `ok` continua NÃO podendo mostrar

- **`retorno_por_real`**, se o dono não respondeu. `ok` é sobre o custo por
  contato; retorno é o outro lado da conta, e ele vem da pergunta do dia. Uma
  tela `ok` com "Retorno: —" é o estado normal enquanto o loop não fecha.
- **"sua campanha está dando lucro"**. Não é o que `ok` afirma. Ele afirma que
  o custo por contato está dentro do combinado — e o combinado foi calculado
  a partir do ticket, não medido contra vendas reais.
- **Comparação com o mês anterior.** Não há mês anterior.

## O que falta para a primeira chegar lá

Carência: **14 dias com registro E 100 cliques**. Depois dela, `ok` exige custo
por resultado abaixo de 2× o CPL-alvo — e custo por resultado **só existe com
pelo menos uma conversão**.

Medido em produção, 10/09/2026:

| | dias | cliques | conversões | falta |
|---|---|---|---|---|
| FLEETLINK | 3 | 32 | **0** | 11 dias, 68 cliques, ≥1 conversão |
| Byond | 7 | 22 | **0** | 7 dias, 78 cliques, ≥1 conversão **e uma decisão sobre moeda** |
| TESTE-DADOS | 3 | 64 | **0** | 11 dias, 36 cliques, ≥1 conversão |

**O caminho para `ok` passa por converter, não por esperar.** Com zero
conversão a escada corre por dias sem conversão, e desde 10/09/2026 ela para em
`medicao_nao_verificada` em vez de alertar — porque sem saber se a conta conta
contato, zero contato não é fato sobre o desempenho.

A Byond tem um bloqueio a mais e permanente: conta em AUD contra CPL-alvo em
BRL sai `sem_comparacao` por mais dados que acumule.
