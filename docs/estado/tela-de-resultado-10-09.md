# A tela de resultado — 10/09/2026

O passo 5 do teste de produto: "no dia seguinte abro o app e vejo o dado da
minha campanha". Cliente de teste: a própria V2G.

Todo número aqui tem comando ao lado. **Nada foi commitado nem deployado.**

```bash
pnpm conferir   # exit 0 — 16 conferidores
pnpm build      # exit 0
```

---

## 0. O que depende de decisão humana

### 0.1 O vínculo foi feito à mão e não tem quem o refaça

O Victor rodou, no banco do backend:

```sql
update execucoes set business_id = 'a85c37a9-df57-4829-985b-41bc306f8537'
where id = 'aed42ce7-b1cd-49f8-9509-eb772aacb31a';
```

Sem isso a tela não tem dado nenhum. **E as outras duas campanhas com
dinheiro real continuam órfãs:**

| execução | negócio | `business_id` | dinheiro |
|---|---|---|---|
| `aed42ce7` | TESTE-DADOS-REAIS (V2G) | **ligado em 10/09** | R$ 10,25 |
| `7fcfc505` | FLEETLINK | `null` | R$ 93,20 |
| `3de135e4` | Byond Colour | `null` | A$ 113,45 |

Nenhuma rota da API escreve `business_id` numa execução existente — varri
as 50 do `openapi.json`. Só `POST /cadastro` aceita o campo, e ele **cria**
execução nova, que nasceria sem métrica.

**Pergunta aberta: por que as execuções nascem sem `business_id`?** Se o
caminho normal de cadastro o preenchesse, nada disso seria preciso. As três
entraram por script (`backfill_google.py` e equivalente), que não faz o
vínculo. Enquanto for assim, **todo cliente novo que entrar por script vai
precisar de um UPDATE à mão.**

### 0.2 `cliente_id` não é ponte para nada, e eu disse que era

No relatório da manhã indiquei `cliente_id` como a coluna do vínculo. Estava
errado: ela é legada, sem FK, e o próprio backend documenta
(`src/api/modelos.py:123-137`) que *"quem liga a execução ao negócio é
`business_id`"*. Quem consome é `repositorio.py:341-349`,
`.eq("business_id", …)`.

**A regra que saiu disso, e que vale para o repositório inteiro: antes de
recomendar escrita em banco, leia a query que CONSOME aquela coluna e cite a
linha.** Correlação não é leitura.

### 0.3 O coletor parou em 07/09

```bash
GET /execucoes/aed42ce7-…/consolidado?desde=2026-09-05&ate=2026-09-10
→ último dia com dado: 2026-09-07
```

Três dias sem métrica nova. É do lado do backend e ficou fora deste lote.

### 0.4 `V2G_OREGON_URL` está morto no `.env.local`

`cvwxfalweuplrlchzzeo.supabase.co` **não resolve em DNS** (`curl` erro 6).
Só anotado, não mexido.

---

## 1. O que mudou

### A fonte

`metrics_daily` saiu das três telas. **Zero leituras** em `app/` e `lib/`:

```bash
grep -rn "metrics_daily" app/ lib/     # 11 ocorrências, todas comentário
```

O conferidor trava isso lendo a fonte sem comentário
(`conferir:resultado` §10).

A fonte agora é a API, composta assim:

```
GET /negocios/{id}/consolidado?profile_id=…   ← confere o dono
   └─ por_execucao[] = a LISTA AUTORIZADA de ids
        └─ para cada id:
             GET /execucoes/{id}              nome, canal, status
             GET /execucoes/{id}/consolidado   dinheiro, cliques, nível
```

### O validador parou de descartar

`lib/dia-seguinte/validar.ts` era lista branca fechada. Oito campos chegavam
da API e morriam nele **sem log**: campo desconhecido não reprova, e
`resposta_ilegivel` só dispara quando o validador devolve `null`.

Agora atravessam: `moeda`, `nivel`, `nivel_frase`, `cliques`, `impressoes`,
`pessoas_que_chegaram_medido`, `moedas[]`, `por_execucao[]`.

### O nível vem do backend

`lib/resultado/nivel.ts` tinha **sete** níveis e **frases próprias**. O
contrato declara **catorze** e proíbe a tradução local. Os sete que faltavam
não eram "sem frase": eram `FRASES[nivel]` devolvendo `undefined` e
`frase.titulo` derrubando a página.

E as frases locais já divergiam — a nossa de `sem_alvo` dizia "Sua campanha
está no ar", afirmação que ninguém mediu.

Agora: `NIVEIS` tem os catorze como **vocabulário**, não como porteira;
`nivelFrase` vai para a tela como veio; nível desconhecido mostra a frase do
mesmo jeito; sem frase, a tela não escreve nada de nível.

### A moeda

`dinheiro()` tinha `currency: "BRL"` cravado e era a única função de dinheiro
que as telas vivas usavam. Virou `dinheiro(valor, moeda)`, **obrigatório** —
31 chamadas passaram a declarar de que moeda falam. `null` sai sem símbolo.

`lib/resultado/ler.ts` agrupava por `dia.moeda`, um campo que a API **nunca**
preencheu: tudo caía num grupo `null`, somado e sem símbolo, e
`moedasMisturadas` ficava `false` para sempre. A moeda vem do TOPO, e um
consolidado = uma execução = uma moeda = um card.

---

## 2. As decisões que tomei sozinho

**Os totais são os do topo, não a soma dos dias.** O backend já soma, e o
critério de aceite é bater com o `curl`. Ressomar criaria uma segunda
definição de "quanto investiu", e a divergência só apareceria quando alguém
comparasse a tela com o log.

**`pessoas` só aparece com `medido === true`, não `!== false`.** Enquanto não
houver prova de que a conta conta contato, o zero é escondido. Consequência
hoje: a `/vendas` e a `/inicio` **deixaram de afirmar "ninguém chegou"**.
Elas dizem que a contagem não está de pé. É mais honesto e é pior de ler —
e foi escolha minha.

**`98447192` sai como `sem-campanha`, não como `sem-dado`.** O aceite pedia
"campanha sem dado". O status dela é `aguardando_fotos`: a rodada nunca
montou campanha. Dos quatro estados do briefing, `sem-campanha` é o
verdadeiro. Os números dela saem ausentes, nunca zero — que era o ponto.

**A foto saiu de dentro do card do anúncio.** `creatives.campaign_id` aponta
para `campaigns.id`, do banco do webapp; a campanha da tela agora é a
execução do backend, de outro espaço de id. Não há chave que ligue as duas.
As peças ficaram numa seção própria, sem afirmar vínculo.

**A pílula é cinza para todos os estados.** Sem CPL-alvo, cor é opinião
fingindo ser medida.

---

## 3. A regra de segurança, e por que ela é desenho e não checagem

`GET /execucoes/{id}` e `/consolidado` **não aceitam `profile_id`**. Quem tem
o `X-V2G-Token` lê a execução de qualquer cliente, e o servidor do Next tem o
token. As rotas de negócio conferem — medido:

```bash
GET /negocios/a85c37a9-…/consolidado?profile_id=<de outro usuário>
→ 404 {"detail":"negocio a85c37a9-… nao encontrado."}
```

Então a lista é a autorização. `lib/resultado/do-negocio.ts` é o único
chamador das duas rotas sem dono, e **não existe função que aceite id de
execução**. O id malicioso não é recusado — ele não tem por onde entrar.

`pnpm conferir:campanha-da-sessao` — 17/17 — trava quatro coisas: só o
porteiro chama, o porteiro não aceita id de fora, os ids saem de
`porExecucao`, e nenhuma tela que o chama lê `searchParams` ou `params`.

**O que ele NÃO pega:** um id que passe por três variáveis e uma função.
É trava estrutural, não análise de fluxo.

---

## 4. O que ficou pela metade

- **A tela nunca foi vista logada.** Eu não tenho como logar. O caminho de
  dados foi provado contra produção, campo a campo; o render do componente é
  verificação do Victor.
- **`canal` não aparece**, porque `canal_confirmado` é `null` nas duas
  execuções da V2G. Não virou "Facebook" por palpite.
- **51 dos 54 achados da auditoria ficaram sem conserto**, por decisão do
  Victor. Entraram só os três que mentem dinheiro na tela.
- **`conferir:resultado` §10 tem uma asserção fraca** herdada: "nada divide
  investimento por cliques" é uma negação que passa vazia. Está na lista dos
  51.
