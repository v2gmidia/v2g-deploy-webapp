# Onboarding expandido — desenho

As seis decisões da §10 foram fechadas em 19/08/2026. **Passos 1 a 5 da §11
implementados**; faltam o 6 (verba em `/verba`), o 7 (as três superfícies de
pendência) e o 8 (o texto do D5 em `arquitetura.md`).

O `POST /cadastro` do backend exige seis campos. O nosso onboarding coleta
quatro coisas, e nenhuma delas é três dos seis. Este documento é sobre como
fechar essa distância sem pedir ao dono da padaria um número que ele não tem.

Complementa `perfil-empresa.md` (o que o perfil guarda), `extracao-perfil.md`
(como a entrevista preenche) e `backend-integracao.md` (como se fala com a
FastAPI).

---

## 0. O que foi medido, e quando

Tudo abaixo é medição de **19/08/2026**, não leitura de handoff. A §0 do
`backend-integracao.md` manda conferir o `/openapi.json` antes de escrever
cliente para qualquer rota; foi o que fiz.

### 0.1 O contrato real do `POST /cadastro`

`curl https://api.v2gmidia.com.br/openapi.json` → 200, 46.198 bytes.
Schema `CadastroCompleto`, 21 propriedades, **6 obrigatórias**:

| campo | restrição no schema |
|---|---|
| `nome_negocio` | `string`, `minLength: 1` |
| `descricao_livre` | `string`, **`minLength: 10`** |
| `ticket_medio` | `number`, `exclusiveMinimum: 0` — ou string numérica |
| `custo_direto_medio` | `number`, `minimum: 0` |
| `lucro_desejado_por_cliente` | `number`, `minimum: 0` |
| `orcamento_mensal_disponivel` | `number`, `exclusiveMinimum: 0` |

Bate com o que o contexto do projeto diz. As outras 15 são opcionais
(`cep`, `site_url`, `instagram_handle`, `diferenciais_selecionados`,
`garantia_oferecida`, `atende_somente_no_local`, …) e já têm coluna em
`businesses`.

Duas observações que mudam o desenho:

**`descricao_livre` tem piso de 10 caracteres.** O chip `"Loja física"` tem
11. Passaria na validação do backend e não descreveria nada. O piso do
schema não é o piso útil.

**`ticket_medio` é escalar.** A nossa coluna é faixa (`avg_ticket_min` /
`avg_ticket_max`) desde a migration 0004, que rejeitou guardar o ponto médio
justamente porque a largura da faixa é sinal de incerteza. Alguém tem que
converter, e a conversão descarta a largura. Ver §4.3.

### 0.2 O que o banco tem hoje

```sql
select count(*) ... from public.businesses;
```

| | linhas |
|---|---|
| total | 3 (1 fictícia) |
| com `avg_ticket_min` | 3 |
| com `monthly_budget` | 2 |
| com `description` | 1 |
| com `avg_direct_cost` | **0** |
| com `target_profit_per_customer` | **0** |
| com `procedencia <> '{}'` | 1 |

Dois dos seis campos obrigatórios nunca foram preenchidos por nada, em
nenhuma linha.

### 0.3 `target_profit_per_customer` é órfã no repositório inteiro

```
grep -rn "target_profit" --include=*.ts --include=*.tsx --include=*.sql .
→ supabase/migrations/0001_init.sql:102
```

**Uma ocorrência: o `create table`.** Nada escreve, nada lê, e ela **não
está no catálogo de `lib/agentes/campos.ts`** (24 campos — a contagem de 25
que estava aqui vinha de um `grep -c "campo:"` que pegou também a declaração
do tipo). Consequência
direta: a entrevista — que é hoje o caminho oficial para os números — não
consegue nem *propor* esse campo. `name` também está fora do catálogo.

Ou seja: dos seis obrigatórios, **dois não têm caminho nenhum de
preenchimento hoje**, nem pelo app nem pela entrevista.

### 0.4 A pergunta 4 não vai a lugar nenhum

```
grep -rn "respostas\[" app lib
→ só os 4 arquivos do próprio onboarding
```

O objetivo (`"Vender mais"` / `"Gerar contatos"` / `"Marcar visitas"`) é
gravado no jsonb e **nenhum código fora do onboarding lê**. Não tem coluna,
não tem consumidor, não entra no `/cadastro`. Ver §6.

### 0.5 `authenticated` tem UPDATE de tabela em `businesses`

```
information_schema.role_table_grants → authenticated: UPDATE (nível tabela)
```

A `registrar_procedencia()` é `security definer` e só `service_role` executa
— mas isso **não** torna a função o único caminho de escrita. Com UPDATE no
nível da tabela, o usuário logado grava direto na coluna `procedencia` da
própria linha, com qualquer conteúdo.

E vale lembrar a regra que já custou caro aqui: **`revoke update (coluna)` é
no-op enquanto existe grant no nível da tabela.** Consertar isso exige mexer
no grant da tabela, não na coluna. Ver D5 — e vale dizer que o impacto real é
baixo, porque a RLS limita à própria linha e o usuário poderia declarar o
mesmo valor pela interface.

---

## 1. O buraco, campo a campo

| `/cadastro` exige | coluna | o onboarding coleta hoje |
|---|---|---|
| `nome_negocio` | `businesses.name` | **não** — grava `"Meu negócio"` fixo |
| `descricao_livre` | `businesses.description` | **não** — só se clicar "Outro" na P1 |
| `ticket_medio` | `avg_ticket_min/max` | faixa, não escalar |
| `custo_direto_medio` | `avg_direct_cost` | **não** |
| `lucro_desejado_por_cliente` | `target_profit_per_customer` | **não** — campo órfão |
| `orcamento_mensal_disponivel` | `monthly_budget` | **não** — só em `/conta` |

E o que o onboarding coleta e o `/cadastro` **não** pede: cidade, raio,
objetivo. Cidade e raio são nossos, e servem à segmentação geográfica do Meta
(`lib/meta/geo.ts`) — ficam. O objetivo é o caso da §0.4.

---

## 2. Onde eu discordo do enunciado

O enunciado do lote diz: "o `/cadastro` exige seis campos, e três dos seis
são números que o cliente não sabe de cabeça". Está certo no diagnóstico e o
desenho óbvio a partir dele — acrescentar três campos numéricos ao chat —
é o desenho errado.

**Um número que ele não sabe, ele digita mesmo assim.** Um campo obrigatório
com "Custo direto médio (R$)" não devolve vazio: devolve um número plausível
que ele inventou em três segundos, ou o faturamento, ou o aluguel. E aí o
`diagnosticar-orcamento` roda com um custo errado e não erra — ele produz
uma campanha coerente sobre uma economia que não existe. É o mesmo erro que o
`extracao-perfil.md` descreve na abertura: "um perfil errado não falha".

**Pior: com este desenho o número entra como `confirmado`.** Se o cliente
digitou, a procedência mais alta se aplica, e o `diagnosticar-orcamento`
para de rebaixar exatamente o campo mais frágil da cadeia. A gente
construiria o mecanismo de procedência e o alimentaria com o pior dado.

O caminho é outro, e é uma regra só:

> **Nunca peça o número. Peça a coisa que ele sabe, calcule o número, mostre
> em reais, e deixe ele confirmar ou corrigir.**

A confirmação é o que torna o valor `confirmado` — literalmente a definição
da tabela do `perfil-empresa.md` §2: *"o cliente viu e disse que está
certo"*. E é o que evita ter que inventar uma quarta origem `derivado`: um
valor derivado que o cliente **não** confirmou não vira campo, vira pendência.

Dono de padaria não sabe o custo direto de um bolo. Ele sabe que de cada
R$ 100 sobram uns R$ 60.

---

## 3. A forma: dois blocos, não uma lista de nove

Hoje são 5 perguntas num chat. Fechar os seis campos exige nove. Nove balões
seguidos quebram a promessa da própria copy ("só algumas perguntas rápidas")
e transformam a última em formulário disfarçado.

**Bloco 1 — Sobre o seu negócio.** O chat de hoje, com duas perguntas novas.
Preferência e identidade: não tem resposta errada, e o ritmo de chip é o
certo.

**Bloco 2 — Suas contas.** Superfície diferente: uma conta por vez, com o
resultado em reais na tela e um botão de confirmar. Não é chat, porque não é
conversa — é a pessoa olhando um número sobre o próprio negócio e dizendo se
bate. Chat com confirmação de valor calculado fica ruim: o balão do usuário
vira "É isso", que não registra nada.

A separação também dá o lugar honesto para o "não sei" (§5), que no bloco 1
não existiria.

### 3.1 Bloco 1 — as perguntas

| # | pergunta | grava |
|---|---|---|
| P1 | **Como se chama o seu negócio?** Só texto, sem chip. Hint: *"é o nome que vai aparecer no anúncio"* | `name` |
| P2 | Qual desses é o seu negócio? *(a P1 de hoje, sem mudança)* | `niche` |
| P3 | **Me conta com suas palavras o que você vende ou faz.** Texto livre | `description` |
| P4 | De onde vêm seus clientes? *(a P3 de hoje)* | `city`, `radius_km` |
| P5 | O que você mais quer agora? *(a P4 de hoje)* | ver §6 |

A P2 de hoje (ticket em faixas) **sai do bloco 1** e vira a primeira conta do
bloco 2. Perguntar a faixa aqui e o valor exato lá é perguntar duas vezes a
mesma coisa.

**A validação da P3 não menciona 10 caracteres.** O piso do schema existe,
mas a mensagem é *"Conta um pouco mais — uma frase inteira ajuda a IA a
entender o que você vende."* Contar caractere na tela é linguagem de
formulário, e o piso útil é maior que o piso do schema de qualquer jeito.

### 3.2 Bloco 2 — as contas

**C1 · Quanto sai uma venda.**
*"Na média, quanto sai uma venda sua?"* — campo de número, primeiro.
Abaixo, as quatro faixas de hoje como saída: *"prefiro escolher uma faixa"*.
→ `avg_ticket_min` = `avg_ticket_max` = valor exato, ou min/max da faixa.

**C2 · Quanto sobra.**
*"De cada R$ 100 que entra numa venda, quanto sobra depois de pagar o que
você gastou pra entregar?"*
Hint, e ela não é opcional: *"conte material, produto, comissão. Não conte
aluguel nem salário fixo."* Confundir custo direto com despesa fixa é o erro
número um, e ele não se corrige depois porque o número parece razoável.

Chips: `Sobra quase tudo` · `Sobra mais ou menos a metade` · `Sobra pouco` ·
`Não sei` — cada um mostrando o valor em reais já calculado sobre o ticket
da C1.

Depois do clique, o resultado na tela:

> Então cada venda de R$ 150 te custa uns R$ 60 pra entregar, e sobram R$ 90.
> **[É mais ou menos isso]** **[Não, deixa eu ajustar]**

→ `avg_direct_cost`, só depois do "é isso" ou do valor corrigido à mão.

**C3 · Quanto você quer que sobre pra você.**
Só aparece se a C2 fechou — sem margem não há o que repartir.
*"Dessa sobra de R$ 90, quanto você quer que fique no seu bolso? O resto é o
que a IA pode gastar pra trazer esse cliente."*

Chips como postura, **com o valor em reais dentro do próprio chip**:
`Quero crescer rápido (fica R$ 20)` · `Meio a meio (R$ 45)` ·
`Quero lucro agora (R$ 70)` · `Não sei`.

O valor no chip é o que torna a escolha visível: quanto mais fica no bolso,
menos a IA pode gastar, menos cliente entra. Escrever isso em jargão de CPA
seria falha. Mostrar os dois números lado a lado é a mesma informação sem
nenhuma palavra técnica.

→ `target_profit_per_customer`, com a mesma confirmação.

**C4 · Verba mensal.** Ver D2 — proponho que ela **não** more aqui.

### 3.3 O que o bloco 2 não faz

**Não valida contra o piso do Meta.** O piso é por conta, moeda e objetivo, e
só é consultável com token (`lib/meta/orcamento.ts`, `consultarPisoDiario`) —
que no onboarding ainda não existe. Inventar um piso fixo aqui seria recusar
um valor válido ou aceitar um inválido, e nos dois casos com aparência de
certeza. A validação dura continua na publicação, onde ela já está e já
funciona.

**Não recusa número esquisito.** Um ticket de R$ 3 num salão pode ser erro de
digitação e pode ser uma sobrancelha. Um aviso ("tem certeza? isso é bem
baixo pro seu ramo") é útil; um bloqueio, não.

---

## 4. O que é gravado, e com que procedência

### 4.1 A regra

| situação | origem |
|---|---|
| o cliente digitou o número | `confirmado` |
| a gente calculou e ele clicou "é isso" | `confirmado` |
| a gente calculou e ele corrigiu | `confirmado`, com o valor corrigido |
| a gente calculou e ele não confirmou | **não grava** — vira pendência |
| ele respondeu "não sei" | **não grava** — vira pendência |

Nunca `manual` (é V2G anotando) nem `extraido` (é agente lendo transcrição).
O `por` é `"cliente"`.

### 4.2 Como a escrita acontece

A `registrar_procedencia()` é `service_role`. A Server Action do onboarding
usa o cliente normal, sujeito à RLS. Então:

1. lê o `businesses` com o cliente **normal** — é esta leitura que prova o
   dono, e é ela que a §1 do `backend-integracao.md` chama de passo 2;
2. grava o valor com o cliente normal;
3. chama a RPC com o cliente **admin**, já sabendo o `business_id` conferido.

Mesmo padrão do `trocarPaginaAction` em `app/(protected)/conta/actions.ts`.
Escrever o jsonb direto seria mais curto e passaria por cima da lista branca
de origem e da checagem de campo existente — que são a única validação que o
`jsonb` tem.

**Ordem importa:** valor primeiro, procedência depois. A própria função
recusa registrar procedência de linha inexistente, com essa mensagem.

### 4.3 A faixa e o escalar

O `/cadastro` quer um `ticket_medio`. A gente guarda min/max.

- valor exato → `min = max = valor`, e `ticket_medio = valor`
- faixa escolhida → min/max da faixa, e `ticket_medio = (min + max) / 2`
- faixa aberta (`"Acima de R$ 800"`, max nulo) → `ticket_medio = min`

**A conversão descarta a largura, e isso é perda real.** O backend recebe
1.100 sem saber se veio de "1.100 exatos" ou de "entre 800 e 1.400". A
largura continua nas colunas e no jsonb do nosso lado — quem enxerga é o
`diagnosticar-orcamento`, e só depois da Fase 2 do `perfil-empresa.md` §4,
quando o backend passar a ler o perfil em vez de exigir do formulário. Até
lá, a perda fica, documentada aqui, e a procedência é o que compensa:
faixa escolhida é `confirmado` do mesmo jeito, mas o `min <> max` no banco
diz que foi faixa.

---

## 5. "Não sei" é resposta, e são três estados

O `perfil-empresa.md` e o `backend-integracao.md` já pagaram por isso: um
`false` que na verdade era "não consegui verificar" acusou todo cliente de
não ter WhatsApp.

Aqui os três estados são:

| estado | no banco | no jsonb | significa |
|---|---|---|---|
| respondido | coluna preenchida + procedência | a resposta | sei e é isso |
| **não sei** | coluna **nula** | `{ naoSei: true, em }` | ele viu a pergunta e não soube |
| não chegou | coluna nula | chave ausente | ainda não perguntamos |

Os dois últimos são diferentes e a diferença é operacional: "não sei" é o que
manda a conversa para a entrevista, e é o que o operador precisa ver antes de
ligar. Uma coluna nula sozinha não distingue os dois.

**O onboarding termina honesto.** Se sobrou pendência, a última tela não diz
"tudo pronto". Diz o que falta e o que vai acontecer:

> Faltam duas contas que a gente prefere fazer junto com você — leva uns 10
> minutos por telefone. Enquanto isso, o resto já está guardado.

Nada de barra de progresso em 100% com dois campos vazios atrás.

### 5.1 Onde a pendência aparece — três superfícies, duas audiências

Encerrar o bloco 2 dizendo "faltam duas contas" é necessário e **não é
suficiente**: é uma tela que passa uma vez. Um campo que só foi lembrado ali
é um campo vazio que ninguém lembra — que é exatamente o destino de
`avg_direct_cost` e `target_profit_per_customer` hoje, com zero linhas
preenchidas e nenhuma tela reclamando disso.

São duas audiências, e esquecer a segunda é o que quebra o desenho: o cliente
não resolve "não sei" sozinho — quem resolve é a entrevista, e a entrevista é
disparada por uma pessoa da V2G que precisa **ver** que ela é necessária.

**As três superfícies, todas lendo o mesmo `montarCadastro()`:**

| onde | audiência | o quê |
|---|---|---|
| fim do bloco 2 | cliente | o encerramento honesto do §5, uma vez |
| `/inicio` | cliente | bloco persistente, enquanto houver pendência |
| `/revisar-perfil` (índice novo) | operador | quem tem pendência, e qual |

**Por que `/inicio` e não `/alertas`.** Já existe precedente exato na tela:
`inicio/page.tsx` mostra hoje *"definir agora"* quando `monthly_budget` é
nulo. A pendência de cadastro é a mesma espécie de coisa, e ampliar aquele
bloco é mais barato e mais coerente que inventar um segundo lugar. `/alertas`
é sobre o que **aconteceu** na campanha; uma pendência não acontece, ela
persiste — e quem tem pendência normalmente ainda não tem campanha, então o
aviso apareceria numa tela vazia de todo o resto.

**Sem faixa cobalto.** A regra do `padrao-visual.md`: a faixa existe quando o
número é o assunto da tela. Pendência não é o assunto do `/inicio`, e o
commit `30acbe9` já removeu a faixa da `/alertas` por duplicar o que estava
logo abaixo. Bloco, não faixa.

**O `motivo` da `Pendencia` muda o que a tela oferece**, e é para isso que ele
existe no tipo (§7):

| `motivo` | o cliente vê |
|---|---|
| `nao_perguntado` | *"Terminar meu cadastro"* → leva à pergunta |
| `nao_confirmado` | *"Confirmar um valor"* → leva à conta parada |
| `nao_sei` | *"A gente te liga pra fechar isso"* — **sem botão de tentar de novo** |

O último é o que importa: reoferecer a mesma pergunta a quem já disse que não
sabe é transformar o "não sei" em obstáculo, e a pessoa vai chutar um número
na segunda vez só para a tela parar de pedir. Se o desenho inteiro existe para
não receber número chutado, a tela de pendência não pode ser o lugar que o
provoca.

#### A condição de saída do bloco do `/inicio`

O risco é justo: um bloco que fica meses vira moldura, e a faixa da
`/alertas` já morreu disso. Mas a saída não pode ser "dispensar", e vale
dizer por quê: **esta pendência não é enfeite, ela trava o produto.** Sem os
seis campos não existe cadastro, sem cadastro não existe campanha, e o
cliente está pagando R$ 490 por mês. Um botão de "não mostrar mais" faria a
tela esconder que o serviço não começou.

São três saídas reais, e a terceira é a que responde ao seu ponto:

1. **Ele responde** — pelo `/onboarding/contas` ou pelo `/conta`, que
   escreve nas mesmas colunas. Automático: `montarCadastro` é a fonte única,
   então o bloco some sem ninguém ter que lembrar de apagá-lo.
2. **A entrevista acontece** e a proposta é aplicada. Mesma automação.
3. **O bloco troca de dono depois de um prazo.** Enquanto é recente, ele
   fala com o cliente: *"a gente te liga pra fechar isso"*. Passado o prazo
   sem entrevista, ele para de pedir e passa a admitir: *"ainda não te
   ligamos — isso é nosso, e é o que está segurando sua campanha"*, com o
   canal de contato. **Não é o mesmo bloco repetido; é um bloco que muda de
   texto porque a situação mudou.** Moldura é o que se repete idêntico;
   isto envelhece à vista.

**E a escalada real não é na tela do cliente.** Se a pendência é velha e
ninguém ligou, o defeito é operacional, e cobrar do cliente uma coisa que
depende de nós é a versão educada de culpá-lo. Por isso o índice de
`/revisar-perfil` **ordena por idade da pendência, mais velha primeiro** — e
isto é possível aqui justamente porque temos `updated_at` e o `em` do jsonb,
que é o que falta do outro lado (`backend-integracao.md` §6.5 mediu que a
fila do backend não traz campo de tempo nenhum e por isso não dá para ordenar
por espera).

O prazo em si é número a definir, não a medir — proponho **7 dias**, que é o
mesmo horizonte da garantia da LP. Se em 7 dias ninguém ligou, o cliente
merece ler isso escrito.

**O índice de `/revisar-perfil` é a única tela nova fora do onboarding neste
lote.** Hoje a rota só tem `[proposta]` — dá para revisar uma proposta se você
souber o UUID, e não existe lugar que liste. Sem o índice, o caminho
"não sei → entrevista" não tem gatilho: o cliente marca a pendência e ela
espera alguém adivinhar que ela existe. Ela já está em `PROTECTED_PREFIXES` e
em `OPERADOR_PREFIXES` no `proxy.ts`, então não há mudança de rota a fazer.

---

## 6. A pergunta 5 (objetivo): decidir ou tirar

Medido na §0.4: ninguém lê. O `/cadastro` não tem campo para ela. As opções
honestas são duas, e a terceira — deixar como está — é a que eu não faria,
porque uma pergunta cuja resposta ninguém lê ensina o cliente que responder
não muda nada.

**(a) Mapear para o objetivo da campanha.** `"Vender mais"` → conversão,
`"Gerar contatos"` → leads, `"Marcar visitas"` → agendamento. É o que ela
naturalmente significa, e o `lib/meta/publicar.ts` tem um objetivo hoje
fixo. Custo: mexer na cadeia de publicação, que é lote D.

**(b) Tirar do onboarding.** Uma pergunta a menos, e o bloco 2 já acrescenta
três.

**Decidido: (b) agora, (a) no lote D.** A resposta já coletada nas 2 linhas
reais não é apagada — ela fica no jsonb, que é append por natureza. Tirar a
pergunta não apaga o que ela já respondeu; só para de pedir trabalho ao
cliente sem retorno.

---

## 7. A costura: `montarCadastro()`

O lote B **não chama o backend**. Isso é o lote E. Mas B precisa definir uma
coisa, e ela é o produto mais durável deste lote:

```ts
// lib/cadastro/montar.ts — sem "server-only": não tem segredo, e a tela
// de pendências precisa do tipo.

export type CampoObrigatorio =
  | "nome_negocio" | "descricao_livre" | "ticket_medio"
  | "custo_direto_medio" | "lucro_desejado_por_cliente"
  | "orcamento_mensal_disponivel";

export type Pendencia = {
  campo: CampoObrigatorio;
  /** o que o cliente vê, sem nome de coluna */
  rotulo: string;
  /** por que está faltando — muda o que a tela oferece */
  motivo: "nao_perguntado" | "nao_sei" | "nao_confirmado";
  /** onde se resolve */
  onde: "/onboarding" | "/verba" | "entrevista";
};

export type Cadastro =
  | { completo: true;  payload: CadastroCompleto }
  | { completo: false; pendencias: Pendencia[] };

export function montarCadastro(negocio: LinhaBusiness): Cadastro;
```

**Uma função, dois consumidores, e é por isso que ela existe agora.** A tela
mostra as pendências a partir dela; o lote E manda o payload a partir dela.
Se fossem duas funções, a tela diria "está completo" numa regra e o envio
falharia com 422 noutra — e o 422 do FastAPI chega em inglês, com detalhe
de Pydantic dentro, no meio de um fluxo que o cliente não controla.

`montarCadastro` valida contra as restrições **medidas** na §0.1, não contra
as que a gente acha razoáveis: `descricao_livre` ≥ 10, `ticket_medio` > 0,
`orcamento_mensal_disponivel` > 0, os outros dois ≥ 0.

Ela é **pura**: recebe a linha, devolve o veredito. Sem `fetch`, sem
Supabase. É o que a torna testável sem tocar em nada — ver §9.

---

## 8. O que muda no banco

**Nenhuma coluna nova, nenhuma tabela nova.** Todos os seis campos já têm
coluna em `businesses`. É a primeira vez em vários lotes que isso acontece, e
vale dizer em voz alta porque o desenho do `perfil-empresa.md` foi feito
exatamente para isso.

**Duas funções, porém, mudaram — e as duas apareceram só na implementação:**

| migration | o quê | por que não estava previsto |
|---|---|---|
| **0016** | `target_profit_per_customer` entra na lista branca da `confirmar_campo_do_cliente` | a lista da 0015 foi escrita contra o catálogo de `campos.ts` como ele era; o passo 2 acrescentou o campo. A própria 0015 manda: *"Campo novo no catálogo entra aqui também, e por migration."* |
| **0017** | `esvaziar_campos_do_cliente`, nova | a 0015 recusa esvaziar de propósito (*"Vazio se preenche, nao se confirma"*), e ela está certa. Mas o formulário da `/conta` tem campos opcionais: apagar um com `update` solto deixaria a coluna nula com a procedência ainda afirmando origem sobre ela — e aí a trava da 0013 recusaria uma proposta futura para proteger um valor que não existe mais |

A 0017 é a **única das quatro funções de procedência que é `security
invoker`**, e a única que `authenticated` executa. Apagar o próprio campo é
escrita que a RLS já autoriza; com `definer` seria preciso reescrever a
checagem de dono dentro da função, que é o `if` que se esquece. Menos poder
quando o poder não é necessário.

O que muda:

| o quê | por quê |
|---|---|
| `lib/agentes/campos.ts` ganha `target_profit_per_customer` e `name` | sem isso a entrevista — o caminho oficial do "não sei" — não consegue propor dois dos seis (§0.3) |
| `salvarNegocioAction` (`/conta`) passa a registrar procedência | hoje a tela de correção grava valor sem origem, e a origem some. Se o onboarding grava `confirmado` e a correção não grava nada, corrigir um campo o **rebaixa** para `desconhecida` |

O segundo item não é escopo original do lote e é pequeno. Mas ignorá-lo faz o
mecanismo de procedência mentir na primeira correção que alguém fizer, e
`/conta` é a tela feita para corrigir o que o chat respondeu. **Os dois
entram** (D6).

E o que **não** muda, apesar de ter aparecido na medição: o `UPDATE` de
tabela em `businesses` para `authenticated` (§0.5) fica como está, registrado
em `arquitetura.md` (D5). O texto a registrar está na §10.

---

## 9. Como isto será verificado

Não por expectativa. Três verificações, e as três produzem resultado.

**1. O payload contra o schema real.** `montarCadastro` é pura, e o
`CadastroCompleto` do `/openapi.json` é um JSON Schema. Um teste valida o
payload montado contra o schema baixado — não contra uma cópia à mão dele,
que é como o schema envelhece sem ninguém ver. **Os dois lados:** um caso
completo que valida, e um caso com cada campo faltando que é recusado *aqui*,
antes de virar 422 lá.

**2. `POST /cadastro` NÃO será chamado neste lote.** Ele abre execução de
verdade (`"Primeiro toque do cliente. Abre a execucao."`). Um teste de ida e
volta contra ele suja a fila de 29 execuções que o `/saude-meta` lê. Fica
para o lote E, onde a escrita é o assunto.

**3. A procedência, ida e volta.** Responder no onboarding e depois ler
`procedencia_do_campo('businesses', id, 'avg_direct_cost')` esperando
`confirmado`. E o outro lado, que é o que prova o desenho: responder "não
sei" e ler a mesma função esperando `desconhecida`, com a coluna nula e o
`naoSei` no jsonb. Confirmar que algo foi ignorado exige ver a ida e a volta.

---

## 10. As decisões, fechadas em 19/08/2026

**D1 — a abordagem da §2 fecha.** Perguntar o que ele sabe, calcular, mostrar
em reais, confirmar. Custa mais tela e mais lógica que três campos numéricos,
e é o que impede um número chutado de entrar com a procedência mais alta.

**D2 — a verba mensal fica em `/verba`.** A tela já explica as duas
cobranças, e é a explicação que torna o número compreensível. Hoje ela
*mostra* `monthly_budget` sem oferecer onde defini-lo — o único lugar que
define é `/conta`, que é área logada. `montarCadastro` lê da coluna, sem se
importar com qual tela escreveu.

**D3 — a pergunta 5 sai agora**, e o mapeamento para objetivo de campanha
fica para o lote D. Ver §6.

**D4 — o bloco 2 é rota própria** (`/onboarding/contas`). O "não sei" se
resolve noutro dia, por telefone, e o retorno precisa de URL. Entra em
`PROTECTED_PREFIXES` no `proxy.ts` — o prefixo `/onboarding` já cobre.

**D5 — o `UPDATE` de tabela fica fora deste lote**, registrado em
`arquitetura.md`. O texto, para ser levado inteiro:

> **A escrita de `procedencia` é garantida por convenção, não pelo banco.**
> `registrar_procedencia()` é `security definer` e só `service_role` executa
> — mas `authenticated` tem `UPDATE` **no nível da tabela** em `businesses`
> (medido em `information_schema.role_table_grants`, 19/08/2026). Com isso, o
> usuário logado escreve direto na coluna `procedencia` da própria linha, com
> qualquer conteúdo, sem passar pela lista branca de origem nem pela checagem
> de campo existente que a função faz.
>
> **A armadilha ao consertar é a mesma do token do Meta:** um
> `revoke update (procedencia) on businesses from authenticated` é **no-op**
> enquanto existir o grant de `UPDATE` no nível da tabela. Foi assim que a
> coluna de token de `meta_connections` ficou legível por qualquer usuário
> autenticado até a migration 0003 — revogar na coluna não desfaz o que foi
> concedido na tabela. O conserto real é trocar o grant de tabela por grants
> de coluna explícitos, o que alcança **toda** escrita em `businesses`, e por
> isso é passo próprio.
>
> E revogar tem que cobrir `public`, `anon` **e** `authenticated`. O Supabase
> concede a dois papéis por padrão; conferir um e concluir sobre os dois já
> abriu escrita em perfil alheio aqui (migration 0011).
>
> **Impacto hoje é baixo, e vale dizer para não inflar o risco:** a RLS
> confina a escrita à linha do próprio dono, e ele poderia declarar o mesmo
> valor pela interface, legitimamente. O que se perde é a garantia de que
> toda entrada de `procedencia` passou pela validação da função — o que
> importa no dia em que a origem `confirmado` decidir orçamento sozinha.

**D6 — as duas correções da §8 entram.** O catálogo de `lib/agentes/campos.ts`
ganha `target_profit_per_customer` e `name`; `salvarNegocioAction` passa a
registrar procedência.

---

## 11. Ordem de implementação

Na ordem em que cada passo pode ser verificado sozinho:

1. ✔ `lib/cadastro/montar.ts` — `montarCadastro()` e os tipos. Puro, testável
   contra o `/openapi.json` sem tocar em tela nem em banco (§9.1).
2. ✔ `lib/agentes/campos.ts` — os dois campos que faltam (D6). Sem isso o
   caminho do "não sei" não tem saída.
3. ✔ Bloco 1 — P1 (nome) e P3 (descrição) entram; a P5 sai; a pergunta de
   ticket sai daqui.
4. ✔ `/onboarding/contas` — C1, C2, C3, com a confirmação e o "não sei".
5. ~~Procedência: a escrita via RPC no onboarding, e a mesma em
   `salvarNegocioAction` (D6).~~ **Feito.** Toda coluna de perfil passa por
   `lib/cadastro/procedencia.ts` → `confirmar_campo_do_cliente`. Nenhum
   `update` direto sobrou nos três lugares. Migrations 0016 e 0017 (§8).
6. `/verba` ganha o campo de verba (D2).
7. As três superfícies de pendência (§5.1): fim do bloco 2, `/inicio`,
   índice de `/revisar-perfil`.
8. `arquitetura.md` recebe o texto do D5.

O passo 7 depende do 1 e é o que fecha o desenho: sem ele, o "não sei" é um
campo nulo que ninguém lembra.
