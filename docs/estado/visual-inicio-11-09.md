# O visual do Início — 11/09/2026

Etapa 3 ("Início") do `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md`. Escopo
combinado: **dois estados apenas** — "preparando" e "com dados". Nenhuma linha
de `lib/resultado`, `lib/backend` ou `lib/dia-seguinte` foi tocada; `frases.ts`
também não.

---

## §0 — O que depende de decisão humana

**1. A regra do ramo mudou, e a decisão foi tomada no meio da sessão.** O
`proximo ||` saiu de `if (proximo || !temNumero)`. Foi decidido pelo Victor em
11/09 **depois** da medição abaixo, e está registrado no bloco de comentário
sobre a condição, em `app/(protected)/inicio/page.tsx`. Como é mudança de regra
estrutural e não de aparência, **provavelmente merece entrada própria em
`docs/decisoes.md`** — não a escrevi porque aquele arquivo é o canal do que se
decide *fora* do Claude Code.

**2. O §5 do plano está desatualizado sobre a V2G, e isso derruba um item do
aceite dele.** O plano afirma que a conta está em `aguardando_fotos` desde 25/08
("17 dias parada… é ele que precisa estar bom"). Medido em 11/09:

```bash
curl -H "X-V2G-Token: $V2G_BACKEND_TOKEN" \
  "$V2G_BACKEND_URL/negocios/a85c37a9-df57-4829-985b-41bc306f8537/execucao?profile_id=f5188fd0-b274-46e8-81ff-e8e275450b74"
# status: cadastro_completo · pede_acao: false · atualizado_em: 2026-09-09T02:35:50Z
```

`aguardando_fotos` saiu. O aceite da Etapa 3 pede que *"`aguardando_fotos`
mostre o próximo passo como ação do cliente"*, e **nenhuma conta real está nesse
estado hoje** — exercitei por fixture, com autorização do Victor. Decidir: o
plano é corrigido, ou o item do aceite passa a ser explicitamente "por fixture"?

**3. O defeito de família continua aberto — eu tratei só o sintoma.** `proximo`
sai de `montarEtapas()`, que decide duas das seis etapas lendo tabelas **locais**
do Supabase, enquanto o pipeline que faz o trabalho é o **backend**, que nunca
escreve nelas:

| etapa | predicado | tabela | medido em 11/09 |
|---|---|---|---|
| `peca` | `pecasProntas > 0` | `creatives` | V2G: 1 peça ativa, e é um **logo** (`uso='campanha'` = 0) |
| `no_ar` | `publicadaEm !== null` | `campaigns` | **0 linhas na tabela inteira** |

Tirar o `proximo` da condição impede que isso esconda o número. **Não conserta a
cadeia:** as duas etapas seguem sem fonte capaz de fechá-las, e portanto nenhuma
conta vai marcá-las como feitas por caminho normal. Quem decide se elas passam a
ler o backend — e qual campo — não é esta sessão.

**4. O backend se contradiz sobre a própria execução, e agora isso aparece na
tela.** A `aed42ce7` devolve `status: cadastro_completo` e
`andamento: "Tudo anotado. Começando a montar seu anúncio"` **e**, na mesma
resposta de consolidado, `investiu_centavos: 1025`, `impressoes: 1657`,
`tem_dado_da_plataforma: true`. Ou seja: o backend diz que está começando a
montar um anúncio que já rodou e gastou. Como a frase da tela agora vem de
`andamento` — e vem de lá por decisão de contrato, não por escolha minha —
**a contradição do backend passou a ser texto que o dono lê**. É pedido ao
backend, não conserto de front: traduzir aqui é o defeito que
`lib/resultado/nivel.ts` acabou de pagar.

**5. Sobrou uma promessa de prazo em `frases.ts`, e eu não mexi.**
`lib/estado/frases.ts:614` diz *"Costuma levar poucos minutos."* sobre a
publicação. O §4 conflito 18 do plano manda omitir promessa de prazo sem lastro,
e essa não tem. **Não alterei** por dois motivos: a etapa não é alcançada por
nenhuma conta hoje (`no_ar` nunca fecha, ver item 3), e mudar a voz da cadeia é
decisão de produto. Fica apontada.

**6. A Etapa 1 (Fundação) chegou NO MEIO deste lote — duas sessões no mesmo
working tree.** Quando comecei, os seis `--raio-*` não existiam e `--sidebar-bg`
ainda era `var(--cobalt)`; a trilha nasceu, por isso, sem token novo. A sessão V2
aplicou a fundação enquanto eu media, e eu **reapontei** os dois raios da trilha
para `var(--raio-pilula)` depois de ver os tokens no arquivo.

**O que precisa de atenção não é o CSS, é o arranjo:** duas sessões editaram
`app/globals.css` em paralelo, sem branch separando uma da outra (ver item 7).
Deu certo porque os blocos não se tocaram — a fundação mexe no `:root`, a trilha
acrescenta no fim do arquivo. Foi sorte de escopo, não garantia.

**7. A branch `visual-v0` não existe.** Nem local nem no `origin`
(`git branch -a`). Todo o trabalho das três etapas está **não commitado sobre a
`main`** — o meu, o da Etapa 1 e o da Etapa 2. O documento da sessão V2 também
se declara em `visual-v0`, então as duas sessões receberam a mesma premissa. Não
commitei nem criei branch: git é do Victor (Regra 1 do §7 do plano). Mas convém
saber que hoje não há nada separando este lote da `main`.

---

## §1 — A medição, que veio antes do código

Pedido: *"em qual ramo a conta da V2G cai hoje, e por quê"*.

**Resposta: caía em "preparando", tendo número.** Rodei as funções puras do repo
(`montarCadastro`, `montarEtapas`) sobre a linha real do banco mais os valores
medidos em produção:

```
backend  aed42ce7 · cadastro_completo · tem_dado_da_plataforma=true
         R$ 10,25 investidos · 64 cliques · 1.657 impressões
         voltou R$ 1.200,00 · 22 vendas · retorno_por_real "117.07"
local    creatives ativos = 1 (logo) · campaigns = 0 linhas

cadeia   [x] cadastro  [x] conexao  [ ] peca
         [x] aprovacao [ ] no_ar    [x] numeros

         proximo = 'peca'   temNumero = true
         ('peca') || (!true) === true   →   PREPARANDO
```

A suspeita do briefing estava certa no efeito e diferente na causa: o `proximo`
**não** vem do status da execução do backend. Vem das duas tabelas locais do
item 3 do §0.

**O alcance é maior que a conta da V2G.** Como `campaigns` tem zero linha no
total, `publicadaEm` é `null` para toda conta — com o `proximo ||` no lugar, o
ramo "com dados" era **inalcançável para todo mundo**. Código morto em produção,
não um caso isolado.

Comandos: `pnpm diagnostico:card` (com `V2G_BUSINESS_DE_TESTE` e
`V2G_PROFILE_DE_TESTE`), os dois `curl` do §0, e `select count(*) from campaigns`.

---

## §2 — O que mudou, arquivo por arquivo

### `app/(protected)/inicio/page.tsx`

1. **A condição do ramo** virou `if (!temNumero)`. O bloco de comentário em cima
   dela carrega a medição inteira, para ninguém precisar refazê-la.
2. **`RestoDoCaminho` virou `TrilhaDaExecucao`.** A lista antiga escondia a etapa
   atual (`filter(p => p.posicao !== "atual")`) porque o herói já a mostrava.
   Agora mostra **as seis** — §4 conflito 17, que reprova o "2 de 4" do
   wireframe por o código ter seis etapas.
3. **A frase do `andamento` encabeça a trilha.** `estado.diaSeguinte.execucao
   ?.andamento`, sem tradução local — o contrato em `lib/dia-seguinte/tipos.ts`
   proíbe montar texto de tela a partir de `status`.
4. **A trilha aparece nos DOIS ramos.** Com o `proximo ||` fora, uma conta com
   número e etapa aberta cai em "com dados"; se a cadeia só existisse no outro
   ramo, ela desapareceria justamente para quem ainda tem etapa pendente.
5. **O selo de "no ar" saiu** — era `{c.metaStatus ?? "No ar"}`, um padrão de
   texto afirmando que a campanha está no ar. §4 conflito 1. Omitido, não
   desabilitado.

### `app/globals.css`

Bloco `.trilha-*` novo, ao fim do arquivo, **sem token novo**. Mobile primeiro
(390px); o único ganho no desktop é respiro entre linhas.

Três ausências deliberadas, cada uma registrada em comentário: **sem barra de
porcentagem** (a cadeia é ordinal — desenhar 50% afirma precisão que ela não
tem, e é o "progresso inventado" que reprova o lote), **sem cor de julgamento**
(§4 conflito 4) e **sem prazo** (§4 conflito 18).

O estado do marcador vem de `posicoesDaCadeia()`, nunca de `etapa.concluida`:
duas das seis etapas da V2G são `concluida: true` **depois** da atual, e o
predicado delas é verdade vazia.

### O que NÃO mudou

`PerguntaDoDia.tsx` **não foi aberto** — congelado por pedido, comportamento e
estilo. `lib/estado/frases.ts` não foi tocado: não faltou frase. Nenhum arquivo
de `lib/`.

---

## §3 — Um defeito achado pela própria captura

A marca de conferido das etapas feitas **sumia no tema claro**. Eu havia escrito
`border: solid var(--cobalt-ink)` sobre um marcador com fundo `var(--cobalt)`.

No tema claro, `--cobalt-ink: var(--cobalt)` (`globals.css:100`): o token quer
dizer *"tinta cor de cobalto"*, não *"tinta que vai sobre cobalto"*. Cobalto
sobre cobalto. No escuro aparecia, porque lá ele vale `#5C88FA` — que é
exatamente o tipo de bug que só um dos dois temas mostra.

Quem diz a segunda coisa é **`--card-cobalt-ink`** (`#FFFFFF` claro, `#E9EFF8`
escuro), o par de `--card-cobalt-bg`. Corrigido, com o porquê no CSS.

**É o defeito do `--navy` do `CLAUDE.md` reaparecendo com outro nome** — token
batizado pela cor servindo de dois papéis. Só apareceu porque a captura foi
feita nos dois temas; `pnpm conferir` passou limpo com o bug no lugar.

---

## §4 — Os quatro estados que NÃO foram implementados

Por escopo combinado, listados e não construídos. Todos dependem de
`status_na_plataforma`, que **não é exposto por rota nenhuma** (zero ocorrências
no `openapi.json` de produção; o coletor lê e descarta):

| estado | o que precisaria | por que não dá hoje |
|---|---|---|
| **publicando** | saber que a peça subiu e está em análise | o ciclo de publicação foi deployado e nunca executou |
| **ativo** | `status_na_plataforma = ACTIVE` | campo não exposto |
| **pausado** | o mesmo campo, mais rota de pausar/retomar | nenhuma das duas existe |
| **atenção** | distinguir "pausada, por isso não gastou" de "no ar e não entregou" | `sem_gasto` tem as duas causas e nada as separa (`lib/resultado/do-negocio.ts:80`) |

---

## §5 — Aceite: o que passou, e o que não medi

**Passou**

- `pnpm conferir` → **exit 0**, suíte inteira.
- `pnpm build` → **exit 0**, 30 rotas.
- Os números do ramo "com dados" saem do **mesmo** `GET /negocios/{id}/consolidado`
  que a `/anuncios` consome via `resultadoDoNegocio()`: R$ 10,25 · 64 cliques ·
  1.657 impressões. Batem por construção, não por coincidência.
- Trilha conferida a **390px** e **1280px**, nos dois temas.

**O que não medi, e é para constar**

1. **Não vi a `/inicio` renderizada de verdade.** Ela é protegida, e criar sessão
   de cliente exigiria senha — que eu não digito. As capturas saíram de uma rota
   temporária (`/captura-fixture`, **já apagada**) que renderiza a trilha com a
   saída real de `montarEtapas()` sobre as medidas do §1. **Portanto: os dois
   ramos completos da `/inicio` não foram vistos em tela** — só o bloco novo.
   O que garante o resto é `pnpm build` e o typecheck.
2. **As capturas não viraram arquivo.** Ficaram na sessão; não há PNG no disco.
3. **`aguardando_fotos` é fixture**, não conta real (§0, item 2).
4. **Alvo de toque e contraste da trilha não foram medidos** com régua — o bloco
   é texto e marcador de 18px, sem controle clicável, então não há alvo de toque
   novo. Contraste dos tons `e-ainda_nao` (`--ink-mute`) não passou pelo
   `docs/contraste.md`.
