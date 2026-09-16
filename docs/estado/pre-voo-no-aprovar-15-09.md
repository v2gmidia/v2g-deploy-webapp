# O pré-voo na `/aprovar` — 15/09/2026

O escopo mínimo pedido pelo App Review da Meta, item 2 dos três. **Só
leitura.** Nada foi commitado, publicado ou colocado no ar, nenhuma escrita
saiu para a Meta e nenhuma linha do banco foi alterada.

---

## 0. O que depende de decisão humana

1. **O item 1 está parado com o Victor, por decisão dele.** Ligar o botão
   ao `POST /campanhas` espera a resposta de **por que as execuções nascem
   sem `business_id`** — ele está investigando no backend. Sem esse vínculo
   não há dono para conferir antes de gastar dinheiro de terceiro
   (`backend-integracao.md` §1). Medido aqui: 8 execuções em
   `estrutura_pronta`, **todas** com `business_id` e `cliente_id` nulos.
2. **Esta tela nunca foi vista logada nesta máquina.** Não há sessão aqui e
   eu não crio uma — é a mesma lacuna que o
   [`buraco-aprovar-sem-filtro.md`](../buraco-aprovar-sem-filtro.md) §6 já
   registrava. O que está provado é que a página **compila** (`pnpm build`)
   e que a rota **continua protegida** (307). Quem abrir logado como
   `victorcabralnsilva@gmail.com` vê o bloco pela primeira vez.
3. **O texto dos bloqueios é do backend, com id de conta e inglês dentro.**
   A instrução foi mostrar o bloqueio que a rota devolve, e é isso que a
   tela faz — palavra por palavra. Traduzir para linguagem de cliente é
   decisão de produto, não conserto, e teria que ser feita sem apagar o
   motivo real. Exemplo medido hoje: *"conta act_880918131184584
   inacessivel com este token: (#200) Ad account owner has NOT grant
   ads_management…"*.
4. **Não existe marca de "conta escolhida" no schema.** A regra de exibição
   ficou decidida (§3.2); o que continua aberto é se a escolha deve virar
   coluna própria, gravada quando o cliente escolhe na
   `/conectar/escolher`, em vez de nascer junto da campanha. Registrado em
   `decisoes.md`.

---

## 1. O que a tela passou a dizer

A `/aprovar` ganhou um bloco, "De onde este anúncio sai", com três linhas:
a Página conectada pelo nome, as contas de anúncio ligadas, e os requisitos
de subida vindos de `GET /campanhas/pre-requisitos`.

**Ele aparece nos DOIS estados da tela**, inclusive no "Nada esperando você
agora" — e isso não é capricho. Medido hoje: a única peça de campanha viva
no banco é do negócio **fictício** `a0328fb8`, e sob RLS
(`creatives_select_own`) nenhum login a alcança. Ou seja, todo cliente real
cai no estado vazio; um bloco que só existisse no estado com peça seria um
bloco que ninguém vê.

---

## 2. O que foi medido

### 2.1 O contrato não estava onde o briefing disse

O pedido citava `src/api/rotas.py:2862` e `:2977`. **Esse arquivo não está
nesta máquina** — o único com esse nome é um script de 11 linhas em
`%TEMP%` que importa `src.api.app` para imprimir rotas. Confere com o
`backend-integracao.md` §7: o repositório do backend não abre para cá. A
fonte usada foi o `/openapi.json`, que a §0 daquele documento chama não de
melhor fonte, mas da **única**.

```
GET /openapi.json → 200, 147.383 bytes, 51 paths
```

### 2.2 Os dois bloqueios de 19/08 caíram

A medição do `disparo-pipeline.md` §0.1 tinha `ok: false` com conta sem
forma de pagamento e App em modo Desenvolvimento. Hoje:

```
GET /campanhas/pre-requisitos                     → 200
{"tem_whatsapp":null,"bloqueios":[],"nao_verificados":[],
 "avisos":["nao foi possivel verificar se a Pagina 'V2G' tem WhatsApp
   Business ligado: a Meta nao devolveu o campo…"],"ok":true}

GET …?id_pagina=1280424248478178                  → 200, idêntico
GET …&id_conta_anuncio=act_2818009911919726       → 200, ok: true
GET …&id_conta_anuncio=act_880918131184584        → 200, ok: FALSE
```

**A última linha é a que decidiu um pedaço do desenho** (§3.3): a mesma
Página, a mesma hora, e o veredito muda com a conta que se manda.

### 2.3 `nao_verificados` existe, e ninguém lia

O `Prevoo` tem **duas** listas, e o nosso validador só lia uma. A resposta
com `act_880918131184584` traz bloqueio **e**:

```
"nao_verificados":["nao deu para verificar se o App esta publicado: a sonda
 foi recusada por outro motivo… Enquanto isso nao for resolvido nao da para
 afirmar que a Meta aceita criar anuncio nesta conta"]
```

O `ok` da rota já conta as duas, então quem lê só `bloqueios` pode receber
`ok: false` com a lista vazia e concluir que não há nada errado. O
docstring do backend diz o porquê: *"seguir para a subida sem saber se um
requisito esta cumprido e a mesma aposta que seguir sabendo que nao esta,
com dinheiro de terceiro e conta que pode ser banida"*.

### 2.4 O estado do banco, e por que o item 1 não foi ligado

```
execucoes por status        estrutura_pronta 8  (com business_id: 0, com cliente_id: 0)
                            cadastro_completo 9 (1 e 1)
                            decidindo_canal 6, pipeline_texto_rodando 6,
                            aguardando_fotos 4, gerado 1
execucoes ligadas a negócio 2, as duas do V2G:
   98447192…  aguardando_fotos     aed42ce7…  cadastro_completo
campaigns                   0 linhas
ad_accounts (V2G)           3 ativas: "V2G CONTA", "CA - Piligrin", "CA - Piligrin Build"
meta_connections (V2G)      status connected, meta_page_id 1280424248478178
```

`POST /campanhas` **exige** `estrutura_pronta` ("Exige que a execucao esteja
em `estrutura_pronta`", e ela só declara 200 e 422 — não há 409). Nenhuma
execução nesse estado é de alguém. E `/saude` responde
`mocks: {meta: false}`: a chamada seria escrita real na Meta.

### 2.5 Uma contradição com o repositório, dita antes do código

`o-que-o-webapp-consome.md` §2 põe `/campanhas` entre as 26 rotas "de outro
cliente — n8n e scripts", e `disparo-pipeline.md` §1 diz "Uma rota. Uma."
(`POST /cadastro`), porque "o webapp lê estado, não o empurra". Ligar a
`/aprovar` a essa rota move um consumo do n8n para o webapp — decisão de
produto, não detalhe de fiação. Também vale para o item 1, parado: o
`TIMEOUTS.campanha` é 300.000 ms, e a §4 diz que "nenhum acima de `rapido`
cabe num request de navegador".

---

## 3. Decisões que tomei sozinho, e o porquê

**3.1 O leitor é um módulo, não código na tela.** `lib/campanha/pre-voo.ts`
resolve Página, contas e requisitos; a tela recebe pronto e escreve a
frase. A alternativa — `if` sobre dado de negócio dentro do `page.tsx` — é
a forma de defeito que a `/aprovar` e a cadeia do `/inicio` já produziram
uma vez, discordando na mesma conta no mesmo minuto.

**3.2 Sem marca, a tela mostra a lista.** Decisão do Victor, aplicada: a
única marca é `campaigns.ad_account_id`, e com `campaigns` vazia a resposta
honesta é *"Contas de anúncio ligadas: … A conta é escolhida na criação da
campanha."* Nenhuma regra de "a mais recente" — `updated_at` é ordem de
gravação, não registro de escolha.

**3.3 Sem marca, não mando `id_conta_anuncio`.** Consequência direta da
§2.2: mandar uma conta escolhida por palpite faria o veredito da tela
depender do palpite. Com marca, a conta vai.

**3.4 A tela não mostra id de conta nem de Página.** Número de conta de
anúncio é jargão de gestor de tráfego, e a regra do produto é não ter
jargão na interface. Quando o nome não dá para ler, a tela **diz isso** —
não mostra o id como consolo.

**3.5 `nome: null` é "não deu para ler", não "não tem nome".** Mesma
disciplina do `temWhatsapp`. E falhar ao ler o nome **não** marca a conexão
como ilegível: a gente sabe que existe Página, só não sabe como ela se
chama.

**3.6 O admin entra só para o nome.** As três tabelas lidas
(`meta_connections`, `ad_accounts`, `campaigns`) têm `select` por
`owns_business` para `authenticated` — medido —, então o cliente normal
basta. O `service_role` aparece uma vez, para o `obter_token_meta`, e o
`businessId` que chega nele sai do `select` que já rodou sob RLS. O `try`
cobre a **criação** do cliente admin, não só a chamada à Meta: foi
exatamente isso que virou 500 na `/conta` em 02/09.

---

## 4. Verificação

```
$ pnpm conferir        → EXIT=0, 19 blocos "TUDO CERTO" (typecheck incluso)
$ pnpm build           → EXIT=0, com ƒ /aprovar entre as rotas
$ curl /aprovar        → 307 -> /entrar?next=%2Faprovar   (proteção intacta)
$ curl /entrar         → 200            (controle positivo)
$ pnpm conferir:admin  → EXIT=0
```

O `conferir:admin` agora lista a tela:

```
page  indireto  SEM TRY  app/(fluxo)/aprovar/page.tsx
                   via  lib/campanha/pre-voo.ts
```

**`SEM TRY` aqui não é defeito, e a coluna avisa.** Ela diz se o ARQUIVO
tem `try`, não se a dependência está protegida — o `try` está no
`pre-voo.ts`, cobrindo o `createAdminClient()`. É a mesma forma de 20 dos
28 pontos de entrada, inclusive a `/inicio` (via `execucao-do-cliente`) e a
`app/exemplo/[tela]/page.tsx`.

**O que NÃO está verificado:** o desenho logado (§0.2). E o validador novo
não ganhou trava de suíte: `pre-requisitos.ts` é `server-only`, e os
conferidores não importam módulo `server-only` — é a razão pela qual
`lib/criativos/peca.ts` diz, por escrito, que fica fora do `server-only`.
Para travar `nao_verificados` com fixture seria preciso mover `validar()`
para um módulo puro, o que é refatoração além do escopo mínimo.

---

## 5. O que ficou fora

- **Item 1** — `POST /campanhas`. Parado (§0.1). Não houve `UPDATE` em
  `execucoes` nem chamada à rota.
- **Item 3 — o Bloco E não existe, e não é só a tela que falta.** Nenhuma
  das 51 rotas do backend lista post publicado da Página, e nenhuma das 26
  telas do app faz isso. Os únicos rastros do assunto são o parâmetro
  `usa_publicacao_existente` do pré-voo e o `publicacao_manual_pendente`,
  que é de `ResultadoTagueamento` (Google, outro assunto). Construir
  começa no backend. Confirmado pelo Victor: não construir.
- **A tradução dos bloqueios** (§0.3).
- **`GET /campanhas/{id_execucao}/destino`**, nova desde 09/09: é ela que
  fecha o `tem_whatsapp: null` com um `validate_only` no conjunto. Não tem
  cliente aqui, e a pergunta só existe depois que há execução — ou seja,
  depois do item 1. Anotada no `lib/backend/index.ts`.

---

## 6. Arquivos

| arquivo | o quê |
|---|---|
| `lib/campanha/pre-voo.ts` | novo: o leitor — Página, contas, requisitos. Só leitura |
| `lib/backend/pre-requisitos.ts` | passa a ler `nao_verificados` |
| `lib/backend/index.ts` | o aviso de ler as duas listas, e o ponteiro para `/destino` |
| `app/(fluxo)/aprovar/page.tsx` | o bloco "De onde este anúncio sai", nos dois estados |
| `docs/decisoes.md` | a decisão do Victor de 15/09 e o item aberto da marca de conta |
| `docs/estado/pre-voo-no-aprovar-15-09.md` | este arquivo |
| `docs/estado/indice.md` | a linha deste arquivo |
