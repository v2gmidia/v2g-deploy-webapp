# Uma fonte só para "no ar" — 11/09/2026

Lote da sessão `webapp-8f`, branch `visual-v0`. Itens B2, B3, B4, C5 e C6.

**O documento que o briefing mandou ler não existe.**
`docs/v2g-wireframes/qa-v2g-visual-v0-rodada2.md` não está no disco — nem
rastreado, nem solto, nem em `v2g_saas/`. Procurei o repositório inteiro e as
quatro pastas da org. O lote foi feito a partir da descrição dos itens no
próprio prompt, que era autossuficiente; **se o documento tinha detalhe além
disso, ele não entrou.**

---

## §0 — O que depende de decisão humana

### 1. O PEDIDO AO BACKEND: veiculação por campanha não existe

Parei aqui em vez de recriar a regra, como o briefing mandou. Medido contra
o `openapi.json` de produção em 11/09:

| rota | expõe `veiculacao`? |
|---|---|
| `GET /negocios/{business_id}/execucao` | **sim** — único schema em 48 paths |
| `GET /execucoes/{id}/consolidado` (`RespostaConsolidado`) | não |
| `GET /negocios/{id}/consolidado` (`RespostaConsolidadoDoNegocio`) | não |
| `por_execucao[]` (`LinhaDoNegocioPorExecucao`) | não |

A `/anuncios` desenha **um card por execução**, e a única rota que responde
devolve **uma execução só**. Então o selo por campanha não foi construído.

**Para destravar, o mais barato primeiro:**

- [ ] `veiculacao` em `LinhaDoNegocioPorExecucao` — a tela já lê essa lista
      inteira; nenhuma chamada nova
- [ ] ou `veiculacao` em `RespostaConsolidado`, que a tela também já chama
      uma vez por campanha

### 2. `veiculacao` não tem vocabulário declarado, e não tem frase

O schema diz `type: string`, default `sem_evidencia`, **sem enum**. Observei
`ja_foi_ao_ar` ao vivo. `no_ar` eu **supus** — é o complemento óbvio do par,
e está no vocabulário conhecido do módulo, mas **nunca foi visto**.

- [ ] **O enum de `veiculacao`.** Sem ele, o webapp adivinha quais valores
      existem. Hoje ele erra para o lado seguro (valor desconhecido vira
      "não sabemos", nunca "no ar"), mas isso quer dizer que um valor novo
      **emudece a tela** em vez de quebrá-la, que é mais difícil de notar.
- [ ] **`veiculacao_frase`, ao lado de `veiculacao`** — o mesmo par de
      `nivel`/`nivel_frase`. Hoje `veiculacao` é a única chave do contrato
      que chega **sem frase**, e por isso as quatro frases deste lote foram
      escritas no webapp. É a tradução local que o resto do produto
      combinou de não ter.

      *Por que não usei o `andamento`, e a V1 e a V3 sugeriram:* ele é a
      frase do **pipeline** ("de quem é a bola, e o que está acontecendo"),
      amarrada ao `status`, e já tem consumidor — a trilha da `/inicio`.
      Hoje ele por acaso fala de veiculação ("já rodou e está pausado");
      amanhã um estado novo de pipeline muda essa frase sem que a
      veiculação mude. Pendurar o B3 nele é acoplar dois campos cujos
      significados podem divergir sem aviso.

### 3. A resposta do dono não tem moeda

`voltou_centavos` não carrega moeda: nem no formulário, nem no
`POST /execucoes/{id}/resposta-do-dono`, nem no consolidado. O webapp assume
real, e a suposição agora está declarada num lugar só
(`MOEDA_DA_RESPOSTA`, em `lib/dia-seguinte/pergunta.ts`) em vez de espalhada
como `"BRL"` literal.

- [ ] **A Byond Colour já cobra em AUD no mesmo banco.** No dia em que ela
      responder a pergunta diária, é este símbolo que aparece errado no
      campo — e o campo é onde o dono DIGITA o número.

### 4. Quatro sessões escreveram na mesma árvore, sem commit

Enquanto eu trabalhava, quatro outras sessões escreviam nos mesmos arquivos.
Duas coisas ficam registradas:

- **`pnpm conferir` falha de mentira nessas condições.** Uma rodada minha
  acusou 3 regras inertes no `globals.css` que não eram minhas — eram de um
  bloco de 447 linhas não commitado de outra sessão, que sumiu sozinho na
  rodada seguinte.
- **Eu rodei `git stash` + `git stash pop` às 17:00** para medir um baseline
  de typecheck. Isso tirou e recolocou **todo** o trabalho não commitado da
  árvore, de todas as sessões, por ~2 minutos. O pop voltou limpo e
  `git stash list` está vazio; as quatro sessões confirmaram por conta
  própria que nada se perdeu. **Não se faz `git stash` numa árvore
  compartilhada** — o baseline se mede num worktree separado.

---

## §1 — A medição que motivou o lote

**Seis lugares afirmavam veiculação, cada um de uma fonte diferente:**

| onde | lia |
|---|---|
| `/vendas`, 4 frases | `estado !== "sem-campanha"` — inferência do `status` |
| `/alertas`, 3 frases | `count(campaigns.published_at not null)` |
| `/inicio`, manchete | `proximo?.id === "numeros"` — a posição da cadeia |
| `lib/estado/frases.ts` | `campaigns.published_at`, **mais** regra própria de gasto |
| `/reprovado` | `campaigns.published_at` |
| `/anuncios`, rótulo | `STATUS_COM_CAMPANHA` |

Duas dessas fontes eram **tabelas vazias**: `campaigns` tem **zero linhas na
tabela inteira**, não só na conta da V2G.

**A contradição estava em produção.** Conta da V2G (`a85c37a9`), ao vivo:

```
GET /negocios/a85c37a9-df57-4829-985b-41bc306f8537/execucao
→ veiculacao           "ja_foi_ao_ar"
  status_na_plataforma "PAUSED"
  publicada_em         null
  andamento  "Seu anúncio já rodou e está pausado no momento.
              Seu gestor pode retomar quando fizer sentido."
```

O anúncio **rodou e está parado**. E o app dizia, na mesma conta, no mesmo
minuto: `/vendas` — *"Seu anúncio está no ar"* (duas vezes); `/alertas` —
*"Seus anúncios ainda não estão no ar"*. As duas falsas, e contraditórias
entre si. Nenhuma revisão de tela pega isso, porque a contradição não está
em nenhuma das duas telas: está **entre** elas.

**Um caso pior, porque é silencioso:** a `/reprovado` tem um bloco cuja razão
de existir, escrita no topo do arquivo, é dar a notícia boa de que os outros
anúncios continuam. Ele dependia de `campaigns.published_at`, então
`noAr.length` era `0` para todo cliente, sempre. **Essa notícia boa nunca
apareceu para ninguém.** Não era frase errada — era frase morta, e o `else`
também é verdadeiro, então nada denunciava.

---

## §2 — O que foi feito

| arquivo | o quê |
|---|---|
| `lib/veiculacao/estado.ts` | **novo** — a fonte única: 4 estados, a precedência, e o banco de frases |
| `lib/dia-seguinte/tipos.ts` | `veiculacao` em `ExecucaoDoNegocio` |
| `lib/dia-seguinte/validar.ts` | lê o campo; ausência **não** reprova o corpo |
| `lib/estado/frases.ts` | `concluidasPeloGasto` → `concluidasPelaVeiculacao`; a evidência passa a ser aplicada dentro de `montarEtapas` |
| `lib/estado/cliente.ts` | `EstadoDoCliente.veiculacao` — resolvido uma vez, para todas as telas |
| `lib/resultado/{tipos,ler,do-negocio}.ts` | `vendas`/`voltou` saem de `BlocoDeMoeda`; nasce `RespostaDoDono` |
| `app/(protected)/anuncios/page.tsx` | B2 e C6 |
| `app/(protected)/vendas/page.tsx` | as 4 frases |
| `app/(protected)/alertas/page.tsx` | as 3 frases |
| `app/(fluxo)/reprovado/page.tsx` | a frase morta |
| `app/(protected)/inicio/page.tsx` | a manchete (cirúrgico — outra sessão estava no arquivo) |
| `app/(protected)/conta/TrocarPagina.tsx` | reescrita da condicional |
| `components/ui/Pill.tsx`, `app/globals.css` | C5 — o eixo da forma |
| `app/(protected)/inicio/PerguntaDoDia.tsx`, `lib/formato.ts`, `lib/dia-seguinte/pergunta.ts` | B4 |
| `scripts/conferir-veiculacao.ts` | **novo** — a trava |

### A regra local de evidência deixou de ter regra própria (B3)

`concluidasPeloGasto` decidia sozinha: `tem_dado_da_plataforma &&
investiu_centavos > 0` fecha `peca` e `no_ar`. Estava **certa sobre o passado
e errada sobre o presente** — fechava uma etapa chamada "O anúncio no ar"
para um anúncio em `PAUSED`.

O gasto não sumiu: virou o **degrau 2** da precedência do módulo, onde só
pode concluir `ja_foi_ao_ar`, nunca `no_ar`. Dinheiro gasto é passado; ele
prova que rodou, jamais que está rodando. A precedência inteira:

1. `veiculacao` do backend, quando reconhecida
2. o gasto medido, como reserva, e **só para o passado**
3. `nao_sabemos`

**Duas mudanças que não estavam pedidas e eu fiz assim mesmo, com o motivo:**

- **A evidência foi para dentro de `montarEtapas`.** Antes, quem chamava era
  a `/inicio`, então a regra valia numa tela só — a `/anuncios` lia
  `estado.proximo` da mesma função e recebia a cadeia com `no_ar` aberta. A
  sessão V5, dona da regra original, confirmou que aplicar só na `/inicio`
  foi escopo do pedido dela, e concordou com a generalização.
- **`nao_sabemos` é um quarto estado, e não um sinônimo de "não foi ao ar".**
  Sem ele, uma leitura que falha faria a tela acusar o cliente de não ter
  anúncio. É o mesmo princípio de `null` não ser zero.

### A resposta do dono saiu dos cards (B2)

Medido, e é mais forte que "a resposta do dono é do negócio":

```
execução 98447192  nunca foi ao ar · vendas 22 · voltou_centavos 120000
execução aed42ce7  a ÚNICA com dado de plataforma (R$ 10,25)
                   vendas null · voltou null
```

O lado do dono veio **inteiro** pendurado na rodada que nunca rodou. Não é
atribuição por campanha: é artefato de a qual execução a pergunta do dia
estava amarrada. Na tela, o mesmo card dizia *"Ainda não foi ao ar"* logo
acima de *"Voltou em vendas — 1.200,00"*.

`BlocoDeMoeda` perdeu os dois campos — **trava de tipo, não convenção** — e
nasceu `RespostaDoDono`, do acumulado do negócio.

### C5 — forma, não cor

Os três selos da `/anuncios` já eram cinza; faltava o segundo eixo.
`Pill` ganhou `forma: "preenchido" | "contorno"`, independente do `tone`.
Preenchido = tem número; contorno = ainda não. **A forma carrega presença de
dado, que é fato — não qualidade do resultado, que seria julgamento.**

O CSS foi escrito **colado ao bloco base**, a pedido da sessão V2: o defeito
que ela passou o lote consertando foi um `.side-support` declarado duas vezes
com a mesma especificidade, a ~950 linhas de distância, com a segunda
vencendo calada havia meses.

### B4 — o campo que perguntava "quanto?" sem dizer em quê

O campo de receita da pergunta diária era a única superfície de dinheiro do
produto sem função de formato: `placeholder="Ex: 1.600,00"` escrito à mão e
o valor saindo seco. Num **campo** a omissão pesa mais que numa leitura — o
dono digita o número que vira `voltou_centavos` no banco.

`simboloDaMoeda()` sai do `Intl`, não de uma tabela `{ BRL: "R$" }`: tabela à
mão é a lista paralela de sempre.

---

## §3 — O aceite, item por item

**Nenhuma tela contradiz outra.** As frases finais, todas de
`fraseDeVeiculacao()`, na conta da V2G (`ja_foi_ao_ar`):

| tela | o que diz hoje |
|---|---|
| `/inicio` | "Seu anúncio já rodou e não está no ar agora." |
| `/anuncios` | idem + "Ele saiu do ar e nenhuma verba está sendo gasta agora. Seu gestor pode retomar quando fizer sentido." |
| `/vendas` | idem + "A gente ainda não consegue contar quem chegou por ele." |
| `/alertas` | idem + "Enquanto ele estiver parado não há o que avisar." |
| `/reprovado` | idem (o ramo "outros no ar" agora só abre com `no_ar`) |
| trilha da cadeia | "Já está feito — o Facebook confirmou." |

As quatro manchetes, por estado: `no_ar` "Seu anúncio está no ar." ·
`ja_foi_ao_ar` "Seu anúncio já rodou e não está no ar agora." ·
`nunca_foi_ao_ar` "Seu anúncio ainda não foi ao ar." · `nao_sabemos` "A gente
não conseguiu conferir se seu anúncio está no ar."

- ✅ **O card da campanha que nunca rodou não mostra venda** —
  `conferir:veiculacao` §4 lê `lib/resultado/tipos.ts` e reprova se `vendas`
  ou `voltou` voltarem a `BlocoDeMoeda`
- ✅ **Conferidor que trava "uma fonte só"** — `pnpm conferir:veiculacao`,
  114 conferências, na suíte. A §2 é a que importa: lê o código de `app/` e
  `components/` e reprova quem escrever a própria frase, ou quem voltar a ler
  `published_at`. Comentário é isento de propósito — um conferidor que proíbe
  explicar a si mesmo ensina a não comentar
- ✅ **`pnpm conferir` exit 0**
- ✅ **`pnpm build` exit 0**

**O que o conferidor NÃO pega:** frase de veiculação escrita com palavras que
os cinco padrões da §2 não preveem ("seu anúncio segue ativo", "a campanha
continua"). É trava de regressão sobre as formas que existiam, não análise
semântica.
