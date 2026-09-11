# Plano de implementação — wireframes V2G, corte v0

> 11/09/2026. Escrito contra o repositório real, o `openapi.json` de produção e
> o `docs/contrato-do-dashboard.md`. **Todo número aqui tem o comando ao lado.**
>
> Os 44 PNGs deste diretório são **direção visual, não especificação**. Texto,
> número e medida dentro de imagem gerada por IA não valem como contrato.

## A hierarquia, quando houver conflito

1. `docs/contrato-do-dashboard.md`
2. o que a API de produção devolve (`GET https://api.v2gmidia.com.br/openapi.json`)
3. os wireframes

E mais uma, do `CLAUDE.md`: **se um briefing colado contradiz este repositório,
o repositório vence.** O `PROMPTS-CLAUDE.md` deste mesmo pacote descreve um
plano de sete etapas que inclui publicação, pausa e geração de criativo. Este
documento corta em v0 e diz, item a item, por quê.

---

## §1 Inventário — cada wireframe vira tela do v0 ou vai para "Depois"

44 PNGs = 22 pares desktop/mobile. **7 pares entram no v0. 15 vão para Depois.**

### Entram no v0

| # | par de arquivos | vira | onde |
|---:|---|---|---|
| 1 | `v2g-inicio-preparando-{desktop,mobile}-v1.png` | Início, ramo "ainda falta" | `/inicio` |
| 2 | `v2g-campanha-no-ar-primeiros-dados-{desktop,mobile}-v1.png` | Início, ramo "com dados" | `/inicio` |
| 3 | `v2g-dashboard-resultados-{desktop,mobile}-v1.png` | Resultados | `/anuncios` |
| 4 | `v2g-resultados-nao-medidos-{desktop,mobile}-v1.png` | **estado** de Resultados | `/anuncios` |
| 5 | `v2g-dashboard-carregando-{desktop,mobile}-v1.png` | **estado** de Resultados | `/anuncios` |
| 6 | `v2g-dashboard-falha-{desktop,mobile}-v1.png` | **estado** de Resultados | `/anuncios` |
| 7 | `v2g-analisar-criativo-{desktop,mobile}-v1.png` | Analisar criativo pronto | `/criativos` |

Quatro dos sete são **estados da mesma tela**, não telas. O `INDICE-WIREFRAMES`
já os classifica assim, e é a classificação certa: carregando, não medido e
falha não mudam o layout de Resultados — mudam o que ele afirma.

### Vão para "Depois" — 15 pares, com o motivo de cada um

| par | por que fica fora |
|---|---|
| `v2g-detalhe-campanha-*` | **decisão do Victor, 11/09/2026.** A ficha por campanha dentro da `/anuncios` basta para o teste; a rota própria custaria mexer na trava de segurança. Ver §3.2 |
| `v2g-gerar-criativo-*` | depende da decisão **"modo design: sim ou não"**, em aberto (`mapa-produto-v2g-v1.md` §11) |
| `v2g-escolher-criativo-*` | idem — sem geração não há variação para escolher |
| `v2g-geracao-criativo-andamento-*` | idem |
| `v2g-geracao-criativo-falha-*` | idem |
| `v2g-revisar-publicar-*` | a aprovação fica com a operação na v1 (`mapa-produto` §8) |
| `v2g-publicacao-em-analise-*` | o ciclo de publicação foi deployado e **nunca executou** |
| `v2g-meta-reprovou-*` | idem — e não há campo que distinga reprovação da Meta de falha nossa |
| `v2g-falha-publicacao-*` | idem |
| `v2g-decisao-criativo-*` | não existe detecção de fadiga nem rota de decisão |
| `v2g-decisoes-vazio-*` | o vazio de uma área que ainda não existe |
| `v2g-confirmar-pausa-*` | **não existe rota de pausar** (§4, conflito 2) |
| `v2g-campanha-pausada-*` | idem, e nem estado que descreva "pausada" |
| `v2g-registro-vendas-*` | **já existe e funciona**: `PerguntaDoDia`, no `/inicio` |
| `v2g-registro-vendas-sucesso-*` | idem |

Os dois últimos merecem ênfase: **não estão fora por falta de backend, estão
fora por já estarem no ar.** Redesenhar o card da pergunta diária antes de o
disparador existir (`docs/decisoes.md`, 01/09) é mexer na parte que funciona de
um loop que está mudo.

---

## §2 Tokens

Três colunas e uma procedência. **Uma única linha desta seção foi informada por
imagem, e vai marcada.**

### Por que quase nada sai do PNG

Amostrei pixels do `v2g-dashboard-resultados-desktop-v1.png`:

| ponto | amostrado | token do repo |
|---|---|---|
| fundo da barra lateral | `#001624` | `--sidebar-bg: var(--cobalt)` = `#0743DC` |
| fundo da página | `#FDFDFD` | `--offwhite: #F1F6F7` |
| faixa azul do herói | `#0058FD` | `--cobalt: #0743DC` |
| pílula lima | `#EFFAD9` | `--lime: #E8FC65` |

As duas últimas pegaram borda e antisserrilhado — a pílula amostrada nem é lima.
**Pixel de imagem gerada por IA não é fonte de cor.** As cores saem do
`DESIGN.md` deste pacote (que declara os hexes) confrontado com
`app/globals.css` (que tem os tokens em uso, calibrados em `docs/contraste.md`).

O que a imagem prova, e é o único uso legítimo dela: **a barra lateral do
wireframe é escura, não cobalto.**

### Cores

| papel | `DESIGN.md` | `globals.css` hoje | v0 usa | procedência |
|---|---|---|---|---|
| azul de ação, seleção, progresso | `#0B41D9` | `--cobalt: #0743DC` | **`--cobalt`** | repo — calibrado |
| azul-marinho estrutural | `#051225` | `--navy: #111E2F` | **`--navy`** | repo |
| placa escura (fundo + tinta) | — | `--plate: #111E2F` / `--plate-ink: #F1F6F7` | **`--plate`** | repo |
| off-white, fundo do tema claro | `#ECF5F2` | `--offwhite: #F1F6F7` | **`--offwhite`** | repo |
| lima de sinal | `#EAFF64` | `--lime: #E8FC65` | **`--lime`** | repo |
| azul-céu informativo | `#B0E9FD` | `--ice: #B0E9FD` | **`--ice`** | **idênticos** |
| preto-verde, contraste máximo | `#010C08` | `--black: #000C08` | **`--black`** | repo |
| verde-petróleo profundo | `#07232F` | *não existe* | **não entra** | — |
| **fundo da barra lateral** | — | `var(--cobalt)` | **`var(--plate)`** | **estimado a partir de imagem** |

Duas decisões dentro da tabela:

**O verde-petróleo não entra.** O `DESIGN.md` o descreve como "camada
intermediária entre o azul-marinho e cartões informativos" — papel que nenhuma
tela do v0 pede. Token novo sem papel definido vira decoração, e decoração é o
começo do caminho em que `--navy` servia de fundo *e* de texto.

**A barra lateral usa `--plate`, não o hex amostrado.** `--plate` já existe, já é
escuro nos dois temas, e já tem par de tinta. Inventar `#001624` criaria uma
nona cor escura para um trabalho que quatro já fazem.

Cartões de métrica (pares fundo/tinta, já existem): `--card-ice-bg` `#DCEEFB` /
`--card-ice-ink`; `--card-cobalt-bg` / `--card-cobalt-ink` `#FFFFFF`;
`--card-lime-bg` / `--card-lime-ink`.

Estado: `--good` `#237644` · `--warn` `#8D6116` · `--crit` `#AD3E38`, cada um com
`-soft`. **Nenhum dos três entra em Resultados** — ver §4, conflito 4.

### Tipografia

O `DESIGN.md` pede **Helvetica Now Display**, **Helvetica Neue Condensed** e
**Pixel Lag**. O repo usa **Archivo** (`next/font/google`, auto-hospedada, sem
rede em runtime) para display, e stack de sistema (`"Segoe UI", system-ui,
-apple-system, Roboto`) para corpo.

**O repo vence, e não é preguiça.** As três do pacote são licenciadas; trocar a
família mexe nas 162 declarações medidas em `docs/escala-tipografica.md`; e a
Archivo substituiu a Bahnschrift do protótipo por decisão registrada. **O v0 não
troca fonte.**

Rampa de **seis degraus**, todos com token, nenhum literal de `font-size` fora
do `:root`:

| token | valor | papel |
|---|---|---|
| `--fs-legenda` | `11px` | etiqueta caixa alta, nota, data |
| `--fs-corpo` | `13px` | texto corrido — **a âncora** |
| `--fs-titulo` | `15px` | título de item, campo |
| `--fs-bloco` | `18px` | título de bloco, saudação |
| `--fs-tela` | `22px` | título de tela, número de métrica |
| `--fs-destaque` | `26px` | `.page-head h1` |

Mais a faixa fluida do herói, fora da rampa de propósito:
`--fs-hero-num: clamp(56px, 11vw, 104px)` · `--fs-hero-frase: clamp(26px, 3.4vw, 40px)` ·
`--fs-hero-legenda: clamp(15px, 1.8vw, 19px)` · `--fs-hero-sub: clamp(14px, 1.5vw, 16px)`.

Sete degraus foram testados e reprovados: `--fs-body: 14px` movia a âncora, e os
degraus de baixo ficavam a 1,5px um do outro — dentro da tolerância de meio pixel
do detector, que aceitaria `11.5`, `12`, `13` e `13.5` como válidos.

### Raio

Não há token de raio hoje. Os literais convergiram sozinhos, e o v0 **dá nome ao
que já existe** — é renomear, não redesenhar:

| token novo | valor | uso | ocorrências hoje |
|---|---|---|---|
| `--raio-card` | `12px` | card padrão | 16 |
| `--raio-item` | `10px` | item de lista, bloco de nav | 19 |
| `--raio-interno` | `8px` | elemento dentro de card | 12 |
| `--raio-selo` | `6px` | selo, aviso | 6 |
| `--raio-micro` | `4px` | campo, marcador | 8 |
| `--raio-pilula` | `999px` | pílula | 6 |

O `14px` do `.auth-card` e o `3px` avulso são exceções pontuais, não degraus, e
continuam literais.

### Espaçamento e medida

| token | valor | nota |
|---|---|---|
| `--sangria` | `34px` | `22px` ≤900px · `18px` ≤620px · `30px` dentro do `.auth-card` |
| `--sidebar-w` | `252px` | vira barra inferior abaixo de 900px |
| `--barra-h` | `56px` | altura da barra inferior |
| `--shell-max` | `1240px` | largura do canvas |
| `--auth-card` | `480px` | `580px` em `.auth-grid.solo` |

**22px é a distância entre blocos de uma tela** (`docs/padrao-visual.md` §3) — o
`.page-head` fecha com 22px, a faixa também, e o `.dash-grid` usa `gap: 22px`.
Entre blocos maiores o espaçamento é **margem**, não gap.

Borda: **1,5px é a espessura do sistema** (32 de 51 declarações); `1px` só em
divisória interna. Sempre `--line`, nunca uma cor direta.

---

## §3 As telas do v0 — rota, componente, dado, fonte

### 3.1 Resultados — `/anuncios`

**Rota atual:** `app/(protected)/anuncios/page.tsx`. Não renomeia.

**Componentes reaproveitáveis:**

| componente | caminho | observação |
|---|---|---|
| `Pill` | `components/ui/Pill.tsx` | **existe e nunca foi usada em tela nenhuma.** Tons `ok/warn/crit/info/off` |
| `HeroDaEtapa` | `components/ui/HeroDaEtapa.tsx` | faixa cobalto condicional — só aparece com pendência |
| `NumeroQueConta` | `components/ui/NumeroQueConta.tsx` | respeita `prefers-reduced-motion` |
| `FaixaReconectar` | `components/ui/FaixaReconectar.tsx` | Server Component; lê `meta_connections.status` |
| `.metrics` / `.metric` | `app/globals.css:1954` | grid de 3 colunas → 1 em ≤700px. Sem borda e sem fundo, de propósito |
| `.card` | `app/globals.css:1558` | `--surface`, borda 1,5px `--line`, raio 10px |
| `.empty-card`, `.empty-hero` | `app/globals.css:1640` | estado vazio |

**Não existe** modal, dialog, sheet, drawer nem skeleton em lugar nenhum do
projeto, e **não existe nenhum `loading.tsx` ou `error.tsx` em todo o `app/`**.
O estado "carregando" do wireframe precisa nascer.

**Cada dado e sua fonte.** Tudo vem de uma chamada só —
`resultadoDoNegocio({ businessId, profileId })`, em `lib/resultado/do-negocio.ts`:

```
GET /negocios/{business_id}/consolidado?profile_id=…   ← confere o dono
   └─ por_execucao[] = a LISTA AUTORIZADA de ids
        └─ para cada id:  GET /execucoes/{id}             nome, canal, status
                          GET /execucoes/{id}/consolidado  dinheiro, cliques, nível
```

| o que a tela mostra | campo | regra que não se quebra |
|---|---|---|
| quanto investiu | `investiu_centavos` + `moeda` | `dinheiro(valor, moeda)` — moeda **obrigatória**; `null` sai sem símbolo, nunca como `R$` |
| quantas pessoas clicaram | `cliques` | soma entre moedas — clique é clique em qualquer moeda |
| quantas vezes apareceu | `impressoes` | idem |
| quanto voltou | `voltou_centavos` | só do lado do dono, e **só na rota da execução**: a ficha de `por_execucao` não tem esse campo |
| quantas vendas | `vendas` | idem |
| retorno por real | `retorno_por_real` | **existe na API e a camada de leitura NÃO expõe** — ver o aviso abaixo |
| contatos | `pessoas_que_chegaram` | **só com `pessoas_que_chegaram_medido === true`**. `!== false` não serve: `false` nunca vem desta rota |
| por que ainda não há veredito | `nivel_frase` | **como veio.** Sem tradução local |
| há quanto tempo roda | `dias[]` com gasto | `periodoComDado`, não o recorte pedido |

> **Correção de 11/09, medida.** A primeira versão desta tabela dizia que a tela
> mostra `retorno_por_real`. **A camada de leitura não expõe esse campo** —
> `grep -rn "retorno" lib/resultado/` devolve zero ocorrências, e nem
> `ResultadoParaTela` nem `BlocoDeMoeda` o carregam. Expor exige mexer em
> `lib/resultado/tipos.ts` e `ler.ts`, que é camada de dados, não tela.
>
> E há um argumento para **não** expor ainda: em produção ele vale `"117.07"` —
> R$ 1.200,00 de retorno sobre R$ 10,25 investidos. O número está certo e é
> absurdo, porque os dois lados nunca coincidiram no mesmo dia
> (`dias_com_os_dois_lados: 0`). Mostrar 117× de retorno ao dono é pior do que
> não mostrar retorno nenhum.
>
> A renderização, quando entrar, já existe: `frasePorRealInvestido()` em
> `lib/dia-seguinte/exibir.ts`, hoje usada só pelo `/inicio` — *"Pra cada R$ 1,00
> que você colocou, voltaram R$ 2,40"*. É decisão do Victor, e é lote próprio.

**Os cinco desenhos, e o que separa cada um:**

| estado | condição | o que a tela diz |
|---|---|---|
| carregando | Suspense / `loading.tsx` | o que está sendo buscado, sem mudar a estrutura da página |
| falha ao atualizar | `Resultado.ok === false` | preserva o que já carregou e oferece tentar de novo. `MENSAGEM_GENERICA_BACKEND`, nunca a categoria crua |
| não medido | `tem_dado_da_plataforma: true` e `pessoas_que_chegaram_medido !== true` | mostra investimento e cliques, esconde contatos, exibe `nivel_frase` |
| vazio legítimo | `estado: "sem-execucao"` | não há campanha ainda |
| com dado | `tem_dado_da_plataforma: true` e `medido === true` | o número aparece — inclusive o zero |

**"Não medido" e "vazio legítimo" não compartilham componente.** São afirmações
opostas: uma diz que pode ter acontecido e não sabemos; a outra diz que não
aconteceu.

**Aceite, contra a fixture de produção**
(`scripts/fixtures/consolidado-negocio-producao.json`):

- moeda `BRL`, `R$ 10,25` investidos, `64` cliques, `1.657` impressões;
- a `nivel_frase` de `sem_alvo`, caractere a caractere como o backend mandou;
- a execução `98447192` sai com o **lado da plataforma** ausente — `investido`,
  `cliques`, `impressoes` como `—`, **nunca `0`** — e `nivel: "sem_dado"`;
- nenhuma soma de `BRL` com `AUD`;
- `pnpm conferir:resultado` e `pnpm conferir:campanha-da-sessao` limpos.

> **Correção de 11/09, medida contra produção.** A primeira versão deste aceite
> dizia que a `98447192` sai `—` em **todo** campo. É falso, e um conferidor
> escrito em cima disso reprovaria a tela por mostrar dado verdadeiro:
> `GET /execucoes/98447192-…/consolidado` devolve **`vendas: 22` e
> `voltou_centavos: 120000`**.
>
> A origem do engano é a fixture. `scripts/fixtures/consolidado-negocio-producao.json`
> é a rota do **negócio**, e as linhas de `por_execucao` são fichas magras de
> propósito: `LinhaDoNegocioPorExecucao` tem `moeda`, `investiu_centavos`,
> `cliques`, `impressoes`, `pessoas_que_chegaram`, `nivel` e `nivel_frase` — e
> **não tem `vendas` nem `voltou_centavos`**. Quem tem os dois é a rota da
> execução, que é de onde a tela lê.
>
> É por isso que o negócio fecha com `vendas: 22` e `voltou: R$ 1.200,00`
> enquanto a `aed42ce7` — a única com dado de plataforma — tem os dois `null`:
> o lado do dono veio todo da `98447192`. **Lado da plataforma e lado do dono
> são ausentes por motivos diferentes, e podem estar em campanhas diferentes.**

### 3.2 Detalhe por campanha — FORA DO v0

> **Decisão do Victor, 11/09/2026.** A rota `/anuncios/[idExecucao]` não entra, e
> **`pnpm conferir:campanha-da-sessao` §3 fica como está**. A ficha por campanha
> dentro da `/anuncios` basta para o teste de produto.

O registro fica aqui porque a proposta era boa e vai voltar quando houver mais de
uma campanha por cliente — e porque quem reabrir isso precisa saber o que o
detalhe custa.

O desenho de segurança de 10/09: `GET /execucoes/{id}` e `/consolidado` **não
aceitam `profile_id`**, e quem tem o `X-V2G-Token` lê a execução de qualquer
cliente. A lista de `por_execucao` é a autorização — um id que não está nela não
é recusado, ele **não tem por onde entrar**. Hoje o §3 do conferidor garante isso
proibindo `params` e `searchParams` em qualquer arquivo que chame
`resultadoDoNegocio()`.

Uma rota de detalhe precisa de um id na URL, e portanto precisaria trocar essa
proibição por uma regra mais estreita: *o id pode existir, desde que só filtre a
lista devolvida pelo porteiro e nunca seja passado a função de `lib/backend`*. O
comentário da trava já previa o pedido — *"Precisar de filtro é motivo para
revisitar esta regra conscientemente, que é exatamente o que se quer."*

**A decisão foi não revisitar agora.** Trocar uma proibição estrutural por uma
regra condicional é barato de escrever e caro de manter; e com uma campanha por
cliente, o detalhe não resolve problema nenhum que a ficha já não resolva.

### 3.3 Início — `/inicio`, os dois ramos

**Rota atual:** `app/(protected)/inicio/page.tsx`. A bifurcação já existe, na
linha 194: `if (proximo || !temNumero)`.

Fonte única: `estadoDoCliente(agora)`, em `lib/estado/cliente.ts`. O cabeçalho do
`page.tsx` é explícito — *"esta tela não decide mais o que falta. Ela mostra."*
Se falta frase, o lugar é `lib/estado/frases.ts`.

| o que a tela mostra | campo | fonte |
|---|---|---|
| a frase do andamento | `andamento` | `GET /negocios/{id}/execucao` — **traduzida no backend** |
| se o próximo passo é dele | `pede_acao` | idem. Hoje só `aguardando_fotos` devolve `true` |
| a cadeia de etapas | `etapas[]`, `proximo` | `montarEtapas()` — seis etapas fixas |
| fotos e logo que faltam | `melhoras` | `creatives` sob RLS |
| o card da pergunta do dia | `PerguntaDoDia` | `diaDeOntemEmSaoPaulo` + `diasAtrasados()` |
| o acumulado | `ResultadoDaSemana` | `GET /negocios/{id}/consolidado` |

O bloco de dias em aberto que o wireframe desenha como chips (`24 abr`,
`25 abr`…) **já tem função pronta**: `diasAtrasados()`, em
`lib/dia-seguinte/dias-em-aberto.ts`, com `DIAS_DE_MEMORIA = 7`.

### 3.4 Analisar criativo pronto — `/criativos`

**Rota atual:** `app/(protected)/criativos/page.tsx` é um
`permanentRedirect("/anuncios")`. Vira tela de verdade. Já está em
`PROTECTED_PREFIXES` do `proxy.ts` — não precisa mexer lá.

**Fonte, medida em 11/09/2026 contra produção:**

```
POST /execucoes/{id_execucao}/criativo-pronto    multipart, campo `arquivos`
```

| campo da resposta | tipo | o que a tela faz |
|---|---|---|
| `recebidos[]` | `{tipo, storage_path, tamanho_bytes, url_assinada}` | mostra a peça |
| `recusados[]` | `string` | nomes que não entraram, com o texto de `lib/criativos/envio.ts` |
| `aprovado` | `bool \| null` | o veredito |
| `motivo` | `str \| null` | **é o que o dono lê** |
| `achados_tecnicos[]` | `string` | **nunca chega à tela** |

**Componentes e regras que já existem:**

- `lib/criativos/envio.ts` — validação no navegador antes do upload:
  `ACEITOS_NO_INPUT = "image/jpeg,image/png,image/webp"`, `LADO_MINIMO_PX = 1024`
  (lado menor, inclusivo), recusa por `video`, `formato`, `extensao_nao_bate`,
  `pequena_demais`, `vazio`. Dimensões via `createImageBitmap` — é daí que sai o
  `1080 × 1080` do wireframe, sem pedir nada ao backend.
- `textoDaRecusaDoBackend(motivo)` — **recebe um argumento só**, e
  `scripts/conferir-envio.ts:163` trava a aridade. É a trava estrutural que
  impede `achados_tecnicos` de vazar para o dono.
- `.id-arquivo` (input file com `::file-selector-button`) e `.empty-card` no CSS.
- `pnpm conferir:envio` — 43 conferências sobre o texto das recusas: nenhuma
  pode conter `erro|inválid|falhou|incorret`, nenhuma começa por "você não…",
  todas passam de 30 caracteres.

**O `idExecucao` sai de `estadoDoCliente().diaSeguinte.execucao`, nunca do
formulário** — mesma regra do detalhe por campanha, e pelo mesmo motivo: a rota
não aceita `profile_id`.

---

## §4 Conflitos — o que o wireframe mostra e o backend não tem

Um por linha. Esta é a seção operante: quem implementar consulta esta tabela
antes de desenhar qualquer bloco.

| # | o wireframe mostra | o que existe | v0 |
|---:|---|---|---|
| 1 | selo "CAMPANHA NO AR" / "No ar" / "ANÚNCIO NO AR" — em **9 das 12 telas** | `status_na_plataforma` **não é exposto por rota nenhuma** (0 ocorrências no `openapi.json`); o coletor lê e descarta | **omitir** |
| 2 | botão "Pausar campanha" | nenhuma rota de pausar nem de retomar | **omitir** — nem desabilitado |
| 3 | "Custo por conversa R$ 14,42" — em 3 telas, uma delas como **número herói** | derivável (`investiu / contatos`), e **proibido**: sem CPL-alvo é opinião fingindo ser medida | **omitir** |
| 4 | semáforo, cor de julgamento no estado | 8 dos 14 níveis são indeterminados, e as três campanhas reais saem `sem_alvo` | **pílula cinza para todos** |
| 5 | nota, estrela, score | não existe, e `conferir:resultado` §10 reprova se aparecer | **omitir** |
| 6 | "↑ +34% vs. 30 dias anteriores" — 4 cartões | 13 dias de dado no total. **Não há mês anterior** | **omitir** |
| 7 | "Pessoas alcançadas 12,4 mil" | existe `impressoes`, que é quantas vezes apareceu — **não** quantas pessoas | **renomear**: "o anúncio apareceu N vezes" |
| 8 | gráfico "Como o resultado evoluiu" (conversas por dia) | `dias[].pessoas_que_chegaram` fica escondido enquanto `medido !== true` | **trocar o eixo**: investimento por dia, que é fato |
| 9 | "Histórico da campanha" — linha do tempo com 3 marcos | não há registro persistido do que a IA executou | **omitir** |
| 10 | "Criativo em circulação", com miniatura ligada à campanha | `creatives.campaign_id` aponta para `campaigns.id`, do banco do webapp; a campanha da tela é a execução do backend, **outro espaço de id** | **omitir o vínculo**; peças em seção própria, sem afirmar relação |
| 11 | "1 DECISÃO PARA VOCÊ" / fadiga do criativo | não há detecção de fadiga nem rota de decisão | **omitir** |
| 12 | sino de notificação com ponto vermelho | não existe notificação; nem o disparador do loop diário existe | **omitir** |
| 13 | "Pergunte à V2G" / "Falar com a IA da V2G", flutuante em toda tela | assistente não existe | **omitir** — o `.side-support` (WhatsApp humano) já ocupa esse canto |
| 14 | "Análise concluída" + "O que está funcionando" + "O que pode melhorar", com explicação por item | **só o gate de compliance.** A própria rota diz: *"a análise depende do banco de referências, que ainda não existe"* | **veredito do gate**, nomeado como checagem de política da Meta. Os dois blocos de lista **não entram** |
| 15 | "Criar uma versão melhorada" | geração bloqueada pela decisão "modo design" | **omitir** |
| 16 | "Guardar análise" | nada persiste análise | **omitir** |
| 17 | "Você já concluiu 2 de 4 etapas" | o código tem **6** etapas (`cadastro`, `conexao`, `peca`, `aprovacao`, `no_ar`, `numeros`) | **mostrar as 6**, ou agrupar em 4 fases sem perder nenhuma |
| 18 | "Leva cerca de 3 minutos" · "Próxima leitura: amanhã" · "Ativa desde hoje, 09:42" | promessa de prazo sem lastro. É o mesmo defeito do "48 horas" que **já está em produção** na `/anuncios` | **omitir** |
| 19 | um total somando as campanhas | com `moedas.length > 1` o topo vem `null` e a quebra vem em `por_execucao` | **duas fichas**, uma por moeda, cada uma com o próprio nível |
| 20 | `0` onde não há medição | `null` é primeira classe no contrato inteiro | **`—` mais uma linha explicando**, sempre |

### A regra que fecha a seção

**Quando o wireframe mostra algo sem fonte, a v0 omite.** Não desabilita, não
mostra vazio, não escreve "em breve".

Um controle desabilitado ensina que a função existe e está a um clique. Quando
ela chegar de verdade, vai chegar diferente do que o botão morto prometeu — e aí
o cliente já terá formado a expectativa errada. É o mesmo raciocínio do
`docs/estado/perguntas-pendentes-os-tres-tons.md`: uma muleta que não se declara
vira o desenho por omissão.

### O conflito 14 com detalhe, porque é o mais fácil de errar

A tela de analisar criativo é a que mais promete. O wireframe mostra seis
achados qualitativos com explicação em português. O que a rota devolve é
`aprovado`, um `motivo` e uma lista técnica que não é para o dono.

A saída **não** é escrever texto genérico ("sua imagem está boa!") nem repetir o
`motivo` em seis caixas. É a tela dizer o que ela é: *a V2G conferiu se a peça
passa nas regras da Meta antes de subir*. Isso é verdade, é útil, e é o único
veredito que existe hoje. O bloco de análise qualitativa entra quando o banco de
referências existir.

---

## §5 Estado da execução no backend → estado visual do Início

`EstadoExecucao` tem **nove** valores no `openapi.json` de produção. Nenhum deles
é "no ar", "publicando" ou "pausado".

| `status` do backend | fase em `frases.ts` | tela do Início | pede ação? |
|---|---|---|---|
| `onboarding_em_andamento` | — | Preparando | não |
| `cadastro_completo` | `na_fila` | Preparando — "na fila" | não |
| `pipeline_texto_rodando` | `rodando` | Preparando | não |
| `decidindo_canal` | `rodando` | Preparando | não |
| `aguardando_fotos` | `esperando_foto` | Preparando — **o próximo passo é dele** | **sim** |
| `aguardando_tagueamento` | `rodando` | Preparando | não |
| `gerando_criativo` | `rodando` | Preparando | não |
| `estrutura_pronta` | `conferindo` | Preparando | não |
| `gerado` | `conferindo` | Preparando | não |
| *qualquer um acima* + `tem_dado_da_plataforma: true` | — | **Com dados** | — |

Quatro coisas que essa tabela diz e o wireframe não sabe:

1. **A chave não é o `status`, é o `andamento`.** O backend manda a frase pronta,
   exatamente como faz com `nivel_frase`. `status` serve para ramificar; quem
   escreve para o dono é o backend. Tradução local do `status` recria o defeito
   que `lib/resultado/nivel.ts` acabou de corrigir — sete frases próprias contra
   catorze níveis, e as que faltavam derrubavam a página.

2. **"Publicando", "Em aprendizado", "Ativo" e "Pausado" não são estados
   disponíveis.** O `mapa-produto-v2g-v1.md` §5 marca os quatro como "não
   comprovado", e a medição confirma: sem `status_na_plataforma`, o sistema não
   sabe se a campanha está no ar.

3. **O único interruptor honesto entre os dois ramos é `tem_dado_da_plataforma`**
   — mais o `temNumero` de `estadoDoCliente()`, que também aceita o lado do dono.

4. **`sem_gasto` tem duas causas com desenhos opostos** — "está pausada, por isso
   não gastou" e "está no ar e não entregou". A primeira é normal, a segunda é
   problema, e hoje a tela não consegue distinguir.
   `lib/resultado/do-negocio.ts:80` já registra isso como inferência declarada
   (`STATUS_COM_CAMPANHA`).

**A linha que vai aparecer no dia do teste:** a própria V2G está em
`aguardando_fotos` desde 25/08 — 17 dias parada. É o estado "Preparando" com
`pede_acao: true`, e é ele que precisa estar bom.

---

## §6 Etapas, na ordem

### Etapa 1 — Fundação

**Arquivos:** `app/globals.css`. Só ele.

Quatro itens, todos decididos pelo Victor em 11/09/2026:

1. **Tokens de raio** (`--raio-card`, `--raio-item`, `--raio-interno`,
   `--raio-selo`, `--raio-micro`, `--raio-pilula`), com os valores que já estão
   em uso. É dar nome ao que existe.
2. **`--sidebar-bg` de `var(--cobalt)` para `var(--plate)`**, com `--sidebar-ink`
   reancorado em `--plate-ink`.
3. **`.side-support` vira card claro.** Fecha a pendência aberta em 21/08 ("card
   de vidro sobre cobalto ou card claro?"), e o motivo é que o contraste desse
   ramo **já foi custeado**: `docs/contraste.md` §9.2 item *e* mediu o anel de
   foco do `.side-support` sobre `--ice-soft` e resolveu com `--cobalt-ink`
   (1,11 → 6,64). Escolher o outro ramo jogaria fora uma medição feita.
4. **`/criativos` em `PROTECTED_PREFIXES`** — **já está lá**, medido em
   `proxy.ts`. Nada a fazer; fica registrado para ninguém "consertar" de novo.

### A navegação NÃO muda, e isso é decisão, não omissão

Os rótulos do wireframe (Resultados · Campanhas · Decisões · Negócio) **não
entram**. Vale a decisão do lote QA-1, escrita no comentário de
`app/(protected)/layout.tsx:70-108`, e ficam os cinco itens atuais: **Início ·
Vendas · Anúncios · Avisos · Conta**.

Três razões que já estão naquele comentário e que o wireframe não conhece:

- **cinco é teto, não meta** — são cinco células de 64px na menor tela atendida
  (320px). Um sexto item quebra a conta, e o wireframe desenha seis mais um botão
  central;
- **"Campanhas" e "Criativos" viraram "Anúncios" de propósito.** O cliente não
  separa a campanha do criativo: para ele, "meu anúncio" é a foto e o dinheiro
  por trás dela, junto. Dois itens para isso era raciocínio de gestor de tráfego
  vazando na interface — e o wireframe traz os dois de volta;
- **"Negócio" como item fixo é decisão em aberto** no próprio
  `mapa-produto-v2g-v1.md` §11. Não se resolve por wireframe.

A barra inferior e a lateral **são o mesmo elemento**, reconfigurado por CSS em
`@media (max-width: 900px)`. Não há componente novo de navegação a escrever.

*Aceite:* `pnpm conferir` limpo · **`pnpm conferir:cascata` rodado a cada bloco,
não só no fim** — ele pega regra de `@media` escrita ANTES da regra-base como
inerte, que é exatamente o defeito que mexer em raio e em cor de sidebar produz
· tema escuro sem regressão (os dois blocos duplicados de propósito continuam em
sincronia) · alvo de toque ≥44px em 390, 375 e 320px · nenhum `font-size`
literal novo · nenhuma cor fora do `:root`.

### Etapa 2 — Resultados

**Arquivos:** `app/(protected)/anuncios/page.tsx`,
`app/(protected)/anuncios/loading.tsx` (novo).

**Nenhum conferidor muda.** A mudança de trava que esta etapa exigia saiu junto
com o detalhe por campanha (§3.2): `pnpm conferir:campanha-da-sessao` fica como
está, e a `/anuncios` continua sem ler `params` nem `searchParams`.

A ficha por campanha vive dentro da própria `/anuncios`, alimentada por
`campanhas[]` do porteiro. Uma campanha por cliente hoje; duas na fixture.

*Aceite:* os cinco pontos do §3.1 · carregando, falha, não medido, vazio legítimo
e com dado são cinco desenhos distintos · `pnpm conferir` limpo.

### Etapa 3 — Início

**Arquivos:** `app/(protected)/inicio/page.tsx`; `lib/estado/frases.ts` se faltar
frase.

Nenhuma fonte de dado nova. É a tradução visual do que `estadoDoCliente()` já
devolve, com o mapa do §5 como tabela de verdade.

*Aceite:* `aguardando_fotos` mostra o próximo passo como ação do cliente · a
frase vem de `andamento` · nenhum selo de "no ar" · nenhuma promessa de prazo ·
o card da pergunta do dia continua funcionando, inclusive com dias atrasados.

### Etapa 4 — Analisar criativo pronto

**Arquivos:** `app/(protected)/criativos/page.tsx` (hoje um redirect),
`app/(protected)/criativos/actions.ts` (novo),
`lib/backend/criativos-do-cliente.ts` (função nova ao lado das duas existentes).

A função nova aponta para `/criativo-pronto` e lê `aprovado`, `motivo`,
`recebidos`, `recusados`. **`achados_tecnicos` não é exposto** — o validador não
o carrega para fora.

### O que a tela pode afirmar, e o que ela nunca afirma

**Decisão do Victor, 11/09/2026.** A tela nomeia o veredito pelo que ele é: **uma
checagem das regras de anúncio**. Ela **nunca diz que a peça "presta"** com base
só no gate.

O motivo é mecânico, e é o tipo de coisa que só aparece no primeiro uso real:
**uma imagem chapada passa no gate.** O gate responde "isto viola política da
Meta?", não "isto vende?". Um fundo cinza sem texto, sem produto e sem chamada
passa com louvor — e um cliente que subisse essa peça e lesse "aprovado" teria
recebido do produto exatamente a informação errada.

O "presta" virá do avaliador do backend, quando ele existir — depende do banco de
referências. Até lá, aprovado quer dizer *pode subir*, não *está bom*. A distância
entre as duas frases é o produto inteiro.

O bloco de comentário de `lib/backend/criativos-do-cliente.ts:21-33` afirma que a
rota não existe, medido em 10/09. **Ela subiu desde então**; o comentário é
corrigido com a medição de 11/09 no mesmo commit.

*Aceite:* `pnpm conferir:envio` continua 43/43 · vídeo recusado no navegador
antes de subir · uma foto recusada não apaga as aceitas · a palavra "erro" não
aparece para o dono · o `idExecucao` sai da sessão, nunca do formulário.

### Por que esta ordem

Fundação primeiro porque toda tela depende dela, e mudar token depois é refazer
tela pronta. Resultados em segundo porque é o passo 5 do teste de produto e a
camada de dados **já está pronta e conferida** — é a tela com menos risco e mais
valor. Início em terceiro porque ele só melhora depois que os tokens mudaram.
Analisar criativo por último porque é a única que precisa de uma função de
backend nova, e portanto a única que pode falhar por motivo fora do webapp.

---

## §7 Regras

- Não commitar, não deployar. Git é do Victor.
- Mobile primeiro (390px), desktop derivado.
- A tela consome `lib/resultado` e `lib/backend`; não reescreve camada de dados.
- Proibido: nota, estrelas, semáforo, custo por clique ou por conversa, `?? 0`,
  soma de moedas diferentes, a palavra "erro" dirigida ao dono.
- `null` aparece como "—" com uma linha explicando, nunca como 0.
- "Não medido" é um estado diferente de "vazio legítimo".
- A frase do nível vem de `nivel_frase` do backend, sem tradução local.
- Toda afirmação de estado tem o comando ao lado.

---

## §8 As seis decisões do Victor — 11/09/2026

Esta seção era uma lista de perguntas. **As seis foram respondidas no mesmo dia**,
e o registro canônico está em `docs/decisoes.md`. Ficam aqui porque o plano é
lido sozinho.

| # | pergunta | decisão |
|---:|---|---|
| 1 | os 61 MB de PNG ficam no git? | **não.** `docs/v2g-wireframes/*.png` entra no `.gitignore`; os arquivos continuam no disco, só os `.md` são versionados |
| 2 | a barra lateral vira escura? | **sim**, `--plate`. E o `.side-support` vira **card claro** — fecha a pendência de 21/08 |
| 3 | os rótulos do wireframe entram? | **não.** Vale a decisão do QA-1: ficam os cinco itens atuais, sem "Campanhas", sem "Resultados" como item, sem "Negócio" |
| 4 | o detalhe por campanha tem rota própria? | **não.** Vai para Depois; `conferir:campanha-da-sessao` fica como está |
| 5 | as duas campanhas órfãs | **ficam como estão.** A regra das duas moedas é provada por fixture, não por dado vivo |
| 6 | o veredito do criativo | a tela nomeia o que ele é — checagem das regras de anúncio. **Nunca diz "presta"** com base só no gate |

### O que continua aberto, e não é decisão deste plano

- **`retorno_por_real` entra na tela?** A API devolve, a camada de leitura não
  expõe, e o número de hoje é `117.07`. Ver o aviso no §3.1.
- **As órfãs, quando alguém quiser resolvê-las.** `7fcfc505` (FLEETLINK,
  R$ 93,20) e `3de135e4` (Byond Colour, A$ 113,45) têm `business_id: null`, e
  **nenhuma rota da API escreve esse campo numa execução existente**. A decisão 5
  é sobre não gastar o v0 nisso — não sobre o problema ter sumido. Enquanto durar,
  todo cliente que entrar por script vai precisar de um `UPDATE` à mão
  (`docs/estado/tela-de-resultado-10-09.md` §0.1).
