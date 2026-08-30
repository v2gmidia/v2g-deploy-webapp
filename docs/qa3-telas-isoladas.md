# QA-3 — cinco defeitos de tela isolada

**Lote QA-3.** §0 a §9 são o passo 1 — a medição e o desenho, escritos
antes de qualquer alteração e aprovados em 20/08/2026. §10 e §11 são o
passo 2: o que mudou, e o que a medição de depois mostrou.

**§3.1 tem um erro do passo 1, corrigido no §10.1 sem apagar o original.**
A bancada usava espaço comum onde o app usa espaço não separável, e isso
inverteu o diagnóstico do D7. O relato do QA estava certo e o meu não.

Medido em 20/08/2026 sobre o commit `3f650e3` (a árvore ficou limpa quando
o lote QA-2 fechou, no meio desta medição — as duas primeiras leituras de
`git status` deste dia ainda mostram o QA-2 por commitar).

Fronteira deste lote: **`/verba` e `/conectar`**. O que precisa de arquivo
fora dela está marcado como tal e **não foi feito** — está listado no §7.

---

## 0. Como foi medido, e o que isto não cobre

**O banco**, lido direto no Supabase `V2G-SITE`: as 4 linhas de
`businesses`, a única linha de `meta_connections`, as 3 de `ad_accounts`, e
as políticas de RLS das três tabelas.

**A geometria**, numa bancada: o `next dev` que já estava rodando na porta
3000 sobre esta árvore serviu o `app/globals.css` real e a fonte Archivo
real (`document.fonts.load('700 104px Archivo')` antes de medir — sem isso
a medida sai com a métrica da *fallback*, que é 2% mais estreita). Dentro
dela, o DOM de `/verba` reproduzido **literalmente** — mesmas classes,
mesma ordem, mesmos elementos — e cada caixa lida com `getClientRects()` e
`getComputedStyle()`. Não é olho, e não é `grep`.

**O que isto NÃO cobre, e precisa de você:**

- **Nenhuma das duas telas foi aberta logada.** `/verba` e `/conectar`
  vivem em `(fluxo)`, que exige sessão; não há sessão nesta máquina para
  mim e pedir senha está fora de questão. A caixa amarela do D5, em
  particular, **nunca foi vista renderizada** — foi reconstruída a partir
  do `.tsx` e do CSS que a pintam.
- **Nada foi perguntado à Graph API.** Não li o token do Vault. Toda
  afirmação sobre o que o Meta responde está marcada como não medida.
- **Não há captura de tela.** O painel do navegador não estava compondo
  quadros nesta sessão; a evidência abaixo é geometria, não imagem.

---

## 1. D5 — a `/verba` pede um endereço que a gente já tem

### 1.1 O que foi medido

**A cascata de geo nunca rodou para ninguém.** As quatro linhas de
`businesses`, sem exceção:

| negócio | `city` | `cep` | `geo_lat` | `geo_key` | `geo_resolved_at` |
|---|---|---|---|---|---|
| `a85c37a9` "V2G" | Rio de janeiro | **22290130** | null | null | **null** |
| `0de3321a` "Meu negócio" | Copacabana | null | null | null | null |
| `a0328fb8` (fictício) | Sorocaba | null | null | null | null |
| `f0f0ca84` "Meu negócio" | null | null | null | null | null |

`geo_resolved_at` nulo nas quatro é a medida que importa: **ninguém nunca
perguntou nada a ninguém.** `garantirGeo()` só é chamada de dentro de
`publicarCampanha()` (`lib/meta/publicar.ts:390` em diante), e nenhuma
campanha foi publicada.

**A conta do QA tem página conectada.** `meta_connections` tem uma linha,
`status = 'connected'`, `meta_page_id = '847147288492237'`, e
`pages_read_engagement` entre os escopos concedidos — que é exatamente a
permissão que `coordenadaDaPagina()` usa. O endereço dessa página **pode
estar lá**. Ninguém sabe, porque ninguém perguntou.

**A tela afirma uma causa que ela não mediu.** `app/(fluxo)/verba/page.tsx`
tem dois estados onde existem três:

```
const temCoordenada = negocio.geo_lat !== null && negocio.geo_lat !== undefined;
if (temCoordenada) { …raio de X km… }
return ( …"sua página do Facebook está sem endereço cadastrado"… );
```

`geo_lat` nulo é **"não sei"**, e a tela lê como **"a página dele está sem
endereço"**. É a regra dos três estados do contexto — o `false` que era
"não consegui verificar" — na sua forma mais cara: aqui ele não só erra,
ele **acusa o cliente e manda ele trabalhar**.

**A tela nem lê `geo_key`.** O `select` da linha 28 pede `name, city,
radius_km, monthly_budget, geo_lat, geo_label` — sem `geo_key`. Ou seja:
mesmo depois de a cascata resolver a cidade com sucesso, a tela continua
mostrando a caixa amarela dizendo que não sabe onde o negócio fica.

**O CEP existe, é coletado, é confirmado pelo cliente e é enviado ao
backend — e a nossa própria cascata o ignora.** Ele está no catálogo do
cliente (`lib/perfil/catalogo-cliente.ts`, rótulo "Seu CEP"), é extraído da
entrevista (`lib/agentes/campos.ts`) e vai no corpo do `POST /cadastro`
(`lib/cadastro/montar.ts:400`). A cascata de `garantirGeo()` é: banco →
endereço da Página → cidade. **O CEP não aparece em nenhum dos três
degraus.**

**E a promessa da caixa amarela é falsa num dos ramos.** A frase é "Na
próxima publicação a gente já usa". Mas `garantirGeo()` devolve `geo_key`
no degrau 2, **antes** de tentar a Página de novo, e `geo_key` só é limpo
quando a *cidade* muda (migration `0015`/`0016`, §7 das duas). Então: uma
vez que a publicação caiu para a cidade inteira, o cliente pode preencher o
endereço no Facebook — e nada muda, para sempre. Hoje isso não morde
ninguém, porque `geo_key` está nulo nas quatro linhas; é estrutural, não
ativo.

### 1.2 O que proponho — e por que são duas camadas

**Camada A — dentro da minha fronteira, `/verba`. Parar de afirmar o que
não foi medido.** Três estados, não dois, lendo `geo_lat`, `geo_key`,
`geo_resolved_at` e o `meta_page_id` da conexão:

| estado | como se reconhece | o que a tela diz |
|---|---|---|
| **ponto** | `geo_lat` não nulo | o que ela já diz hoje: raio de X km em volta de `geo_label` |
| **cidade inteira** | `geo_key` não nulo, sem ponto | "Seu anúncio está sendo entregue em `<label>` inteira" — afirmação do que **está acontecendo**, com a consequência de verba dita em voz alta, e a saída sendo **nossa** (a gente aperta a mira com o seu CEP / fala com a gente), não uma tarefa no Facebook |
| **ainda não sabemos** | nada resolvido — hoje, todo mundo | "A gente define a região quando montar o seu primeiro anúncio." Nenhuma acusação, nenhuma tarefa. Se há CEP, a tela diz que já tem o CEP e a cidade |

A frase "sua página do Facebook está sem endereço cadastrado" **sai**. Ela
só poderia ser dita num caso que o schema até sabe expressar —
`geo_resolved_at` preenchido **e** `geo_key` preenchido **e** havia
`meta_page_id` na hora — e mesmo aí ela é uma dedução, não uma leitura. Se
você quiser essa quarta caixa, ela é barata; eu não a incluí porque hoje
ela nunca renderizaria e eu estaria escrevendo texto que ninguém leu.

**Camada B — FORA da minha fronteira. O CEP entrar na cascata.** É o que o
QA está realmente pedindo, e é `lib/meta/geo.ts` + `lib/meta/publicar.ts`.
**Não fiz, e recomendo lote próprio**, por três razões:

1. **Eu não sei o que o CEP compra.** Há dois caminhos e não medi nenhum,
   porque medir exige token: (a) `/search?type=adgeolocation` com
   `location_types: ["zip"]`, que daria uma chave de CEP para
   `geo_locations.zips` — mais fina que a cidade, mas **sem raio**, do
   mesmo jeito que `cities`; (b) um serviço de CEP→coordenada fora do
   Meta, que daria `lat/lng` e portanto **o raio de 5 km que a interface
   promete** — ao custo de uma dependência externa nova. A escolha entre
   os dois é a decisão do lote, e ela precisa da medição primeiro. O
   arquivo `geo.ts` é explícito sobre isso: os limites de raio que estão
   lá foram medidos com `validate_only` contra a conta real, um a um. O
   degrau novo merece o mesmo tratamento.
2. **A ordem da cascata é uma decisão de produto.** O endereço da Página é
   melhor que o CEP (é onde o negócio está, não onde a rua começa), e o
   CEP é melhor que a cidade. Então o degrau novo entra **entre** os dois
   — mas isso muda o que acontece com quem já publicou.
3. **Consertar o CEP sem consertar a invalidação seria consertar pela
   metade.** Enquanto `geo_key` sobreviver a tudo que não seja troca de
   cidade, o cliente que já caiu para a cidade inteira nunca sobe para o
   CEP. Os dois andam juntos ou nenhum anda.

**Sim, o D5 é maior do que parece** — e a parte que cabe nesta fronteira é
justamente a que o QA descreveu: parar de mandar o cliente fazer o trabalho
que ele contratou a V2G para não fazer.

---

## 2. D6 — a verba aceita valor impossível e responde "Pronto"

### 2.1 O que foi medido

`definirVerbaAction` (`app/(fluxo)/verba/actions.ts`) recusa exatamente
duas coisas: texto que não vira número, e `valor <= 0`. Qualquer outra
coisa é gravada e respondida com *"Pronto. É esse o seu teto do mês."*

- **R$ 5,00** → `monthly_budget = 5`. O app divide por 30 em quatro
  lugares; dá **R$ 0,17 por dia**.
- **R$ 999.999.999,00** → gravado. A coluna é `numeric` **sem precisão
  declarada** (`0001_init.sql:103`), então não há teto no banco. O diário
  correspondente é R$ 33.333.333,30.
- O backend também não segura: `orcamento_mensal_disponivel` é
  `exclusiveMinimum: 0` (`docs/onboarding-expandido.md:35`), a mesma regra
  que a tela já aplica.

**A validação dura existe e está certa — só que ela mora depois.**
`validarOrcamento()` (`lib/meta/orcamento.ts`) compara com o piso
consultado e com `TETO_DIARIO_ABSOLUTO_CENTAVOS` (R$ 1.000,00/dia). Ela só
roda dentro de `publicarCampanha()`.

**E o piso real é desconhecido para todo mundo, hoje.**
`ad_accounts.min_daily_budget_cents` está **nulo nas três contas** do
negócio `a85c37a9` — a coluna só é escrita por `publicar.ts:392`, que
nunca rodou.

**O custo de aceitar não é só a tela.** `definirVerbaAction` termina
chamando `dispararSeCompleto()`. Um teto impossível não fica parado: ele
completa o cadastro, cria a execução e desce o pipeline inteiro.

### 2.2 O que proponho

**Não inventar o piso do Meta continua valendo.** O que muda é parar de
usar "não sei o piso" como licença para aceitar qualquer coisa. Três
estados de novo:

**(a) Piso conhecido — quando `min_daily_budget_cents` existir.** A tela lê
`ad_accounts` do próprio negócio (a RLS já permite: `ad_accounts_select_own`
por `private.owns_business`), e recusa abaixo dele **com o número real**,
dizendo de onde ele veio e quando foi conferido. Zero chamada nova ao Meta,
zero token no fluxo — só o valor que `publicar.ts` já grava. Hoje este ramo
nunca dispara; ele passa a existir sozinho no dia da primeira publicação.

> **⚠ SUPERADO EM 25/08/2026 — o piso é R$ 750,00/mês (R$ 25,00/dia).**
>
> A tabela abaixo continua correta como registro do que foi decidido em
> 20/08, e o que ela argumenta continua válido **para a pergunta que ela
> respondia**: quem a gente consegue atender. Em 25/08 a pergunta virou
> outra — quem consegue **ter resultado** — e a resposta mudou junto.
>
> Repare que R$ 300 foi descartado aqui por "começa a recusar cliente
> pequeno legítimo", e o piso novo é 2,5× isso. Não é contradição: é a
> constatação de que o cliente pequeno com R$ 150 de verba paga R$ 490 de
> assinatura, veicula R$ 300 em dois meses, não vê resultado e cancela — a
> ferramenta vira 76% do gasto dele.
>
> O raciocínio inteiro está em `docs/decisoes.md`, 2026-08-25. **Não use a
> tabela abaixo para justificar um piso**; use-a para entender por que o
> piso já foi outro.

**(b) Piso desconhecido — hoje, sempre.** Recusar só o que é impossível
pela **nossa** aritmética, com o número **declarado como nosso**. Minha
proposta: **R$ 150,00/mês (R$ 5,00/dia)**, com a mensagem dizendo, sem
rodeio, que este é um piso da V2G para pegar erro de digitação, que o
mínimo do Facebook é outro, muda de conta para conta, e é conferido na
publicação. As alternativas, para você escolher:

| piso | diário | argumento | contra |
|---|---|---|---|
| R$ 30/mês | R$ 1,00 | puramente aritmético: abaixo disso não existe anúncio em moeda nenhuma | deixa passar R$ 100/mês, que também é impossível |
| **R$ 150/mês** | **R$ 5,00** | pega erro de digitação de verdade, e ainda fica abaixo do que o QA diz ser o piso do Meta | é escolha, não medição — precisa ser dito como escolha |
| R$ 300/mês | R$ 10,00 | margem confortável acima de qualquer piso plausível | começa a recusar cliente pequeno legítimo, que é o nosso cliente |

**(c) Teto: R$ 30.000,00/mês.** Não é número novo — é
`TETO_DIARIO_ABSOLUTO_CENTAVOS` (R$ 1.000,00/dia) × 30, o teto que a
publicação **já** aplica. A tela passar a usar o mesmo número é o oposto do
defeito que o QA-2 acabou de consertar: uma fonte, não duas.

**Como, sem tocar em arquivo fora da fronteira:** `validarOrcamento()` já é
exportada e é **pura** (não precisa de token). A ação chama ela com o piso
conhecido — ou `null` — e traduz a falha para a linguagem de quem está
parado nesta tela (as mensagens de lá apontam para "Conta → Limite", que é
o lugar errado para quem está digitando aqui). O piso de sanidade do item
(b) é a única regra nova, e ela nasce em `app/(fluxo)/verba/actions.ts`.

**E o "Pronto" muda mesmo quando o valor é aceito.** Hoje a frase afirma
que está tudo certo. Ela passa a dizer o que foi guardado, quanto dá por
dia, e que o mínimo do Facebook é conferido na publicação — que é
exatamente o que o rodapé do formulário já promete e a resposta desmentia.

**Fica um buraco declarado:** entre o piso de sanidade e o piso real do
Meta, a tela continua aceitando valor que não vai publicar. Não dá para
fechar sem consultar, e consultar antes da primeira publicação esbarra em
outra coisa medida: **o negócio tem três contas de anúncio ativas**
(`V2G CONTA`, `CA - Piligrin`, `CA - Piligrin Build`) e nada diz qual será
usada — quem escolhe é `campaigns.ad_account_id`, que só existe quando a
campanha existe. Consultar "o piso" agora significaria escolher uma conta
por conta própria.

---

## 3. D7 — o valor vaza para fora do card

### 3.1 O que foi medido

O mecanismo: `--fs-hero-num: clamp(56px, 11vw, 104px)` cresce com a
**janela**, e a caixa que segura o número é fixa em **580px**
(`.auth-grid.solo`). Os dois não se falam. Quanto mais larga a tela, maior
o número dentro de um card que não muda de tamanho.

Largura disponível para o número (conteúdo da faixa, dentro do card): 518px
em desktop, 312px em 415px de janela.

| janela | fonte | R$ 600,00 | R$ 2.000,00 | R$ 150.000,00 | R$ 1.000.000,00 | R$ 999.999.999,00 |
|---|---|---|---|---|---|---|
| 1440px | 104px | 456 (1 linha) | **2 linhas** | 504 (folga 14) | **estoura 68** | **estoura 181** |
| 900px | 99px | 434 | **512 em 518 — folga de 6px** | — | — | estoura 147 |
| 415px | 56px | 245 | 289 (folga 23) | 271 | **estoura 3** | estoura 64, e **25px de rolagem horizontal na página** |

Três achados, e nenhum deles é o que o relato do QA descreve literalmente:

1. **"R$ 2.000,00" não estoura em largura nenhuma — ele quebra em duas
   linhas.** A partir de ~911px de janela (derivado da medida de 900px: a
   linha ocupa 512 de 518, e a fonte cresce 0,11px por px de janela), o
   texto não cabe numa linha e quebra no espaço, deixando **"R$" sozinho na
   primeira linha** e "2.000,00" na segunda. Entre ~880 e ~910px ele fica a
   menos de 6px da borda — encostado nela. **Não consegui reproduzir o
   último zero cortado**; o que consigo reproduzir é o número encostando na
   borda e, logo adiante, partindo-se do próprio cifrão. Se você tiver a
   largura da janela em que o QA viu o corte, eu fecho isso com medida em
   vez de dedução.
2. **O estouro de verdade começa em R$ 1.000.000,00** — e existe **porque o
   D6 aceita esse valor**. Aí o grupo de dígitos vira um bloco indivisível
   mais largo que a caixa e sai da faixa cobalto.
3. **Fora da faixa, o número fica invisível no tema claro.** `.hero-num` é
   `--white` (`#FFF`) e o fundo da página é `--canvas` (`#F1F6F7`):
   **1,1:1**. É literalmente branco no branco, como o QA descreveu. No tema
   escuro ele aparece — mas aparece **fora do bloco**, que é errado do
   mesmo jeito.
4. **No celular ele arrasta a página inteira**: 25px de rolagem horizontal
   com o valor de nove dígitos.

**De quebra, medi a sangria conhecida** (o defeito registrado em
`padrao-visual.md §6`). Ela não é só de 4px, e não é sempre para fora: a
faixa é **6px mais larga** que o card em 1440px, **18px mais estreita** em
900px, e 6px mais estreita em 415px. As três larguras discordam porque o
`margin` negativo da faixa muda por *media query* e o padding do
`.auth-card` muda por outra.

### 3.2 O que proponho

A meta: **o número nunca sai da faixa cobalto, em nenhum valor, em nenhuma
largura** — e não se parte do cifrão.

1. **O teto do D6 resolve a maior parte** e é o conserto mais honesto: com
   R$ 30.000,00 como máximo, o texto mais largo possível é "R$ 30.000,00",
   medido em 447px numa caixa de 518. O estouro invisível só existe porque
   o campo aceita o que o produto não aceita.
2. **Colar o "R$" no número** (espaço não separável), para ele nunca ficar
   sozinho numa linha. Isso é `page.tsx`, dentro da fronteira.
3. **Fazer o tamanho responder à caixa, não à janela** — a escolha que
   quero que você faça:
   - **(A, recomendada)** `container-type: inline-size` na `.hero-destaque`
     e um token novo em `:root` com `cqi` no lugar de `vw`. É CSS puro, e
     acerta a causa: o número passa a saber a largura da caixa em que ele
     está.
   - **(B)** manter `vw` e baixar o teto do `clamp` num token novo aplicado
     só no contexto `.auth-card`. Menos maquinário, mas continua sendo a
     janela decidindo o tamanho — só que errando menos.
   Nos dois casos o token novo entra no `:root` (não um `clamp` literal
   solto numa regra), e o `gerar-design-md.mjs` continua ignorando
   `--fs-hero-*` por ser `clamp` — conferido no script, linhas 66-80.
4. **Uma rede de segurança** para o valor legado que já esteja no banco
   acima do teto: `overflow-wrap: anywhere` no `.hero-num`, que só age
   quando o bloco realmente não cabe. Feio, e visível — que é melhor que
   bonito e invisível.

**Isto toca `app/globals.css`, que é fora da fronteira** (§7). A regra nova
fica escopada em `.auth-card .hero-destaque`, para **não** mexer no herói
de `/inicio`, `/anuncios` e `/alertas`, que são as telas do QA-2.

---

## 4. D8 — a `/conectar` promete um botão que não existe

### 4.1 O que foi medido

A frase está em `app/(fluxo)/conectar/page.tsx:143`, no card "Você continua
dono de tudo": *"dá para desconectar quando quiser, direto por aqui"*.

`grep` por `desconect|revogar|revoke|deauth|permissions` em `app` e `lib`
devolve **essa linha e mais nada** que seja ação. Não existe controle, não
existe Server Action, não existe rota. A `/conta` gerencia a conexão (troca
de página, em `app/(protected)/conta/actions.ts`) e também não tem
desconectar.

### 4.2 O que proponho: **corrigir a frase**, não construir o botão

Três razões, na ordem em que pesam:

1. **A `/conectar` é a tela do consentimento, e não é onde se desfaz
   nada.** Ela existe para preparar o cliente para o popup do Facebook — o
   comentário do topo do arquivo diz isso. Pôr uma ação destrutiva no
   aside de uma tela de "vamos começar" é convidar o clique errado no
   momento errado. Se o desconectar for construído, ele mora onde a
   conexão é gerenciada, que é a `/conta`.
2. **Desconectar tem consequência real e ela não é só nossa.** Campanha
   publicada para de ser gerenciada, o token sai do Vault, e a coordenada
   guardada (`geo_lat`, do endereço da Página) fica órfã — o mesmo cuidado
   que `trocarPaginaAction` já tem de ter. Isso é um desenho com
   confirmação, estado intermediário e texto que diz o que para de
   acontecer; não é um botão.
3. **Revogar de verdade no Meta tem armadilha conhecida neste projeto:**
   `_method=DELETE` na Graph API responde sucesso sem apagar nada. Um
   desconectar que responde "pronto" e não revoga é pior que não ter
   desconectar — é a mesma família de mentira do D8, só que com mais
   código.

**E a frase corrigida pode ser mais verdadeira que a atual, não menos.** O
que a gente pode prometer hoje sem construir nada: a conta de anúncio e o
Instagram são dele; ele pode tirar o nosso acesso quando quiser; e **a
gente faz isso por ele** — a tela já tem o caminho do WhatsApp em dois
lugares, e há uma pessoa do outro lado. Isso é uma promessa que a gente
cumpre hoje, e não manda o cliente para dentro das configurações do
Facebook (que é justamente o pecado do D5).

Se você preferir a outra saída — construir o desconectar — ele é um lote
próprio, na `/conta`, e eu escrevo o desenho antes.

---

## 5. D11 — texto quebrado na caixa amarela

### 5.1 O que foi medido

A causa é uma linha:

```
.fail-block b { display: block; font-family: var(--display); font-size: var(--fs-titulo); color: var(--crit); margin-bottom: 5px; }
```

Ela foi escrita para o **título** do bloco. Como é descendente por tag, ela
pega **todo** `<b>` lá dentro — inclusive os que estão dentro dos
parágrafos, marcando ênfase inline. Cada um deles vira bloco: linha própria
antes, linha própria depois, 15px em vez de 13px, vermelho `--crit` dentro
de uma caixa **amarela**, e 5px de margem.

O `innerText` medido do primeiro parágrafo, com o DOM real:

```
Você escolheu
5 km
em volta do seu negócio, mas a gente não conseguiu descobrir onde ele fica — …exibido para
Rio de janeiro inteira
.
```

O ponto final sozinho na última linha, exatamente como o QA relatou. Em
390px, esse parágrafo ocupa **11 linhas**.

**E não é só a caixa amarela.** A mesma família de regra existe em
`.trust b` e `.cobranca b`, e a `/verba` usa as duas:

| onde | o `<b>` inline | como renderiza (medido) |
|---|---|---|
| caixa amarela, ramo "sem coordenada" | `5 km`, `Rio de janeiro inteira`, `Editar informações → Endereço` | bloco, 15px, `--crit` |
| `.trust`, ramo "com coordenada" | `5 km` | bloco, 13px |
| `.cobranca`, card "São duas cobranças" | `inteiro` | bloco, 15px |

Ou seja: **os dois ramos do D5 quebram, e o card das duas cobranças
também.** O QA viu um; são três na mesma tela.

**"Rio de janeiro inteira":** a tela imprime `businesses.city` cru. O
cliente digitou "Rio de janeiro" e é isso que aparece, no meio de uma frase
e com o "j" minúsculo.

### 5.2 O que proponho

**Dentro da fronteira, agora:** parar de usar `<b>` para ênfase inline em
`/verba` e `/conectar`. `<strong>` é o elemento certo para isso e não é
alcançado por nenhuma das três regras; o negrito vem do próprio navegador.
Custo: zero CSS, zero risco para as outras telas.

**Para a cidade:** capitalizar para exibição — e só para exibição, sem
tocar no valor gravado (o valor é do cliente e tem procedência; reescrever
no banco seria corrigir o que ele disse). E, quando a cidade estiver
nula, a frase não pode virar "a cidade inteira inteira" — o ramo já trata
isso hoje e vai continuar tratando.

**Fora da fronteira, e é o conserto de verdade:** `.fail-block b`,
`.trust b` e `.cobranca b` são três regras da mesma família — descendente
por tag que pinta mais do que devia. É prima da família registrada em
`regra-inerte.md`: lá a regra correta não pinta nada; aqui a regra pinta
onde não devia. Nos dois casos o `grep` acha a declaração e ninguém vê o
efeito. O conserto estrutural é dar **classe ao título** e escopar as três
regras a ela — o que toca todas as telas que usam `.fail-block`
(`/conectar`, `/processando`, `/verba`, `/inicio`, `/saude-meta`), duas
delas do QA-2. **Não fiz.** Proponho como item do §7, e proponho registrar
o padrão junto do `regra-inerte.md`, porque quatro casos viraram sete.

---

## 6. O que muda, arquivo por arquivo

**Meus, dentro da fronteira:**

| arquivo | o quê |
|---|---|
| `app/(fluxo)/verba/page.tsx` | D5 camada A (três estados, ler `geo_key`/`geo_resolved_at`/`meta_page_id`), D7 itens 2 e 4, D11 `<strong>` + cidade capitalizada |
| `app/(fluxo)/verba/actions.ts` | D6 inteiro: piso conhecido, piso de sanidade, teto, e a resposta que não mente |
| `app/(fluxo)/verba/FormVerba.tsx` | D6: o rodapé do formulário passa a dizer o piso e o teto que a gente aplica, separado do que o Facebook aplica |
| `app/(fluxo)/conectar/page.tsx` | D8: a frase |
| `docs/qa3-telas-isoladas.md` | este documento |

**Fora da fronteira — não toquei, e preciso da sua palavra (§7).**

---

## 7. O que precisa da sua autorização, ou de outro lote

1. **`app/globals.css`** — o D7 item 3 (token novo + regra escopada em
   `.auth-card .hero-destaque`). É arquivo compartilhado com o QA-2; a
   árvore está limpa agora, então o momento é bom, mas a decisão é sua.
2. **A sangria da faixa dentro do `.auth-card`** (`padrao-visual.md §6`).
   Está medida no §3.1 e vive no mesmo bloco de CSS que o D7 vai tocar.
   Consertar junto custa pouco; consertar depois significa mexer duas vezes
   no mesmo lugar. **Não é um dos cinco defeitos deste lote** — por isso
   pergunto em vez de fazer.
3. **`lib/meta/geo.ts` + `lib/meta/publicar.ts`** — o CEP na cascata e a
   invalidação do `geo_key` (D5 camada B). Recomendo lote próprio, com
   medição contra a conta real antes de escolher o caminho.
4. **As três regras `b` descendente por tag** (D11 estrutural). Toca telas
   do QA-2.
5. **`app/(protected)/conta/actions.ts`** — a `/conta` também grava
   `monthly_budget`, e sem piso nenhum. Se o D6 entrar só na `/verba`, as
   duas telas passam a discordar sobre o mesmo campo, que é exatamente a
   família de defeito que o QA-2 acabou de fechar. Arquivo do QA-2.

---

## 8. O que fica de fora, dito na cara

- **O defeito `connected` vs `active` da `/conta`** — já registrado em
  `buraco-status-conexao.md`, e não é meu.
- **Os defeitos do QA-2**, navegação (QA-1) e contraste (QA-4).
- **A `/processando` lendo `analysis_runs`.**
- **O App Review do Meta** e o acionamento do n8n.
- **O piso real do Meta**, que continua desconhecido até a primeira
  publicação — e que este lote não tenta adivinhar.

---

## 9. Como isto será verificado

Com dado real, na sua sessão, e **nos dois lados de cada regra** — teste em
alvo que não produz achado não prova nada, e já escondeu defeito quatro
vezes neste projeto.

**D5**, na conta `a85c37a9` (CEP 22290130, cidade "Rio de janeiro", tudo de
geo nulo): a `/verba` **não** pode dizer que a página está sem endereço, e
**não** pode mandar ninguém ao Facebook. Os outros dois estados eu exercito
com valores de geo forjados numa cópia local da linha — nunca escrevendo no
banco de produção.

**D6**, os cinco casos: R$ 5,00 recusado; R$ 30,00 recusado ou aceito
conforme o piso que você escolher no §2.2; R$ 2.000,00 aceito e a resposta
sem "Pronto" seco; R$ 30.000,00 aceito; R$ 30.000,01 e R$ 999.999.999,00
recusados. E o valor no banco **conferido por `select` depois**, não
presumido.

**D7**, na bancada, com a mesma régua desta medição: para cada largura de
375 a 1920, e para cada valor do §3.1, `estouro ≤ 0` e rolagem horizontal
igual a zero. Mais o caso legado: um valor acima do teto **não** pode ficar
invisível.

**D8**, leitura: a frase nova não promete nenhum controle que não exista na
tela.

**D11**, no DOM: `getComputedStyle` de cada ênfase inline devolvendo
`display: inline`, e o `innerText` do parágrafo **sem quebra de linha** —
inclusive no ponto final. Nos três lugares, não só na caixa amarela.

E `pnpm conferir` verde nas quatro etapas, mais `DESIGN.md` regerado sem
diff se o CSS for tocado.

---

## 10. O QUE FOI MEDIDO DEPOIS — 20/08/2026

Medição, não expectativa. Registra o que rodou, o que mudou de conclusão e
o que não rodou.

### 10.1 A CORREÇÃO DO §3.1 — o QA estava certo e eu estava errado

**`dinheiro()` produz espaço NÃO SEPARÁVEL** (U+00A0) entre o `R$` e os
dígitos — é o que o `Intl` de pt-BR faz, conferido no node:

```
"R$ 2.000,00" → 52 24 a0 32 2e 30 30 30 2c 30 30
                      ^^ o espaço é a0, não 20
```

A bancada do passo 1 montava a string à mão, com espaço comum. Espaço
comum permite quebra de linha; o não separável **não permite**. Por isso a
minha medição mostrou o número *quebrando em duas linhas* onde o app real
o mostra *estourando a caixa*. Refeito com a string verdadeira, sobre o
commit `3f650e3`, em 1440px:

| valor | largura do texto | caixa | estouro | além da borda do card |
|---|---|---|---|---|
| R$ 600,00 | 469 | 518 | cabe | — |
| **R$ 2.000,00** | **557** | 518 | **estoura 39px** | **8px** |
| R$ 30.000,00 | 616 | 518 | estoura 98px | 67px |
| R$ 999.999.999,00 | 881 | 518 | estoura 363px | 332px |

**8px além da borda do card, numa linha só, sem poder quebrar: é o último
zero cortado que o QA relatou.** Em 390px o mesmo valor cabia por 12px — o
defeito era de tela larga, e é por isso que ele não aparecia no celular.

A frase do §3.1 — *"não consegui reproduzir o último zero cortado"* — fica
onde está, errada, porque documento de medição não se reescreve. O que ela
registra de útil é o modo de falha: **bancada que não reproduz o dado real
dá um verde que não vale nada** — e desta vez deu um vermelho que não
valia nada, que é o mesmo defeito virado do avesso.

Isso mudou o desenho também: colar o `R$` no número (item 2 do §3.2) não
era conserto — **já estava colado, e era a causa**. O conserto é o número
caber.

### 10.2 O que rodou

**`pnpm conferir` verde**, agora com cinco etapas: `typecheck`,
`conferir:lista-branca` (EM DIA), `conferir:estado` (48 conferências),
**`conferir:verba` (40 conferências, novo)** e `conferir:cadastro` (TUDO
CERTO). O `pnpm build` compila limpo, 27 páginas.

**`scripts/conferir-verba.ts` — o conferidor novo, e por que ele existe.**
Piso e teto só apareceriam com alguém digitando numa sessão real, em duas
telas diferentes; o estado do alcance dependia de um `if/else` que o
typecheck aprova de olhos fechados. Ele testa **os dois lados de cada
corte** — R$ 149,99 recusado e R$ 150,00 aceito, R$ 30.000,00 aceito e
R$ 30.000,01 recusado — e tem controle negativo no §0.

Ele já pagou por si duas vezes:

- acusou uma asserção minha errada: eu procurava `"R$ 150,00"` com espaço
  comum na mensagem de recusa. O mesmo erro do §10.1, agora dentro do
  teste. A asserção virou duas, e uma delas guarda o espaço não separável.
- o §2.3 é controle: confere que o piso da verba **não** vazou para os
  outros campos de dinheiro. Ticket de R$ 50,00 continua aceito — se a
  regra tivesse sido escrita contra `dinheiro` ou contra `dificil` em vez
  da chave, o cliente de padaria perderia o ticket dele. É o erro que já
  aconteceu neste mesmo arquivo antes, com `dificil`.

**D7, medido dos dois lados, com a string real.** Depois do conserto, em
1440px, 900px e 390px, para R$ 600 / R$ 2.000 / R$ 30.000 /
R$ 999.999.999: **estouro ≤ 0 em todos, rolagem horizontal 0 em todos**. O
valor de nove dígitos quebra em duas ou três linhas *dentro* da faixa, em
vez de virar branco sobre branco. A fonte dentro do card passou de 104px
para 85,5px em 1440 e de 56px para 52px em 390 — o número encolheu para
caber, que é a escolha (A) do §3.2.

**A sangria, medida nas três larguras.** Antes: faixa 6px mais larga que o
card em 1440, 18px mais estreita em 900, 6px mais estreita em 390.
Depois: **−2px nas três** — os dois `1.5px` da borda do card, que a faixa
agora respeita em vez de cobrir. Consistente, e alinhada com a área de
conteúdo.

**As telas do QA-2 não se mexeram**, conferido no contexto `.canvas` em
1440 e 390: `margin -34px/-18px`, `padding 34px/18px`, faixa exatamente da
largura do canvas, `container-type: normal`, fonte 104px/56px vinda do
`--fs-hero-num` de sempre. O `--fs-hero-num-card` e o `cqi` só existem
dentro de `.auth-card`.

**D11, medido no DOM com o CSS novo.** As quatro ênfases inline (`5 km`,
`Rio de Janeiro inteira`, `inteiro`, e o `5 km` do `.trust`) agora dão
`display: inline`, 13px, herdando a cor do parágrafo. O `innerText` do
parágrafo da caixa amarela vem **numa linha só**, sem o ponto final órfão.
Os títulos continuam `display: block`, 15px, `--crit`. **34 títulos**
ganharam `className="title"` em 16 arquivos, marcados por script e
conferidos um a um antes de gravar.

**O estado 3 do D5, nas quatro combinações** (com página; com cidade e
CEP; com cidade sem CEP; sem nada): nenhuma produz espaço antes do ponto,
ponto duplo ou travessão órfão. O espaço mora dentro do ternário
justamente por isso — com ele do lado de fora, o ramo vazio escreveria
"primeiro anúncio . Você", que é o D11 de novo, por outro caminho.

**`DESIGN.md` regerado sem diff.** 29 cores claras + 30 escuras, 6
degraus. O `--fs-hero-num-card` entra na lista de "fora da escala, de
propósito", junto dos outros `clamp` — nenhuma cor nova, nenhum degrau
novo.

**As rotas respondem.** `/verba`, `/conectar`, `/meu-negocio` e `/inicio`
devolvem 307 para `/entrar` sem sessão (o `(fluxo)` e o `(protected)`
barrando, como devem); `/entrar` devolve 200. Nenhum 500.

### 10.3 O que NÃO rodou

**Nenhuma das telas foi aberta logada.** Não há sessão nesta máquina para
mim. Tudo acima é o DOM real com o CSS real numa bancada, mais as funções
puras exercitadas com as linhas reais do banco — não é o pixel da tela
autenticada.

**Os ramos "ponto" e "cidade" do D5 nunca renderizaram com dado de
verdade**, porque nenhuma conta tem `geo_lat` ou `geo_key` (§1.1). A
decisão dos três estados está conferida em `conferir-verba.ts §3`; o texto
deles, não.

**O piso real do Meta continua desconhecido**, e o ramo que lê
`ad_accounts.min_daily_budget_cents` nunca disparou — a coluna está nula
nas três contas. Ele passa a existir sozinho no dia da primeira
publicação. **É o ramo mais frágil deste lote**: é código que nunca rodou.

**Nada foi perguntado à Graph API**, e o token não foi lido.

---

## 11. O QUE MUDOU, ARQUIVO POR ARQUIVO

**Dentro da fronteira:**

| arquivo | o quê |
|---|---|
| `app/(fluxo)/verba/page.tsx` | D5 três estados (lê `geo_key`, `geo_resolved_at` e o `meta_page_id` da conexão), cidade capitalizada para exibição |
| `app/(fluxo)/verba/actions.ts` | D6: piso conhecido, piso da casa, teto por `validarOrcamento`, e a resposta sem "Pronto" seco |
| `app/(fluxo)/verba/FormVerba.tsx` | D6: o rodapé separa o nosso mínimo do mínimo do Facebook |
| `app/(fluxo)/conectar/page.tsx` | D8: a frase |

**Fora da fronteira, autorizado item a item:**

| arquivo | o quê | autorização |
|---|---|---|
| `app/globals.css` | D7 (`--fs-hero-num-card` com `cqi`, escopado em `.auth-card`), a sangria por `--sangria`, e as três regras `b` → `b.title` | itens 1, 2 e 3 |
| 16 `.tsx` com `.trust`/`.fail-block`/`.cobranca` | 34 títulos ganharam `className="title"` | item 3 |
| `lib/perfil/valores.ts` | o piso e o teto da verba também na `/meu-negocio` | item 4 |
| `lib/meta/orcamento.ts` | o teto diário passou a vir de `lib/verba/limites.ts` em vez de ter cópia própria | ver abaixo |
| `lib/verba/limites.ts`, `lib/verba/alcance.ts`, `scripts/conferir-verba.ts` | arquivos novos | ver abaixo |
| `package.json` | `conferir:verba` entra no `pnpm conferir` | ver abaixo |

**Três coisas que eu decidi, e que não estavam no que você autorizou
palavra por palavra:**

1. **O segundo gravador da verba não é a `/conta`, é a `/meu-negocio`.**
   Você autorizou "a `/conta` com piso"; a escrita de `monthly_budget`
   saiu da `/conta` num lote anterior e hoje mora no catálogo do cliente.
   Fiz onde o defeito está, com a mesma intenção.
2. **O teto mudou de casa.** Era `const` privada em
   `lib/meta/orcamento.ts`; agora mora em `lib/verba/limites.ts`, e os
   três lugares leem de lá. Copiar o número para as telas teria recriado —
   no mesmo lote — o defeito que o lote combate. O módulo novo não importa
   nada de servidor de propósito: o rodapé da `/verba` é componente de
   cliente.
3. **Criei um conferidor e liguei ele no `pnpm conferir`.** Sem isso,
   piso, teto e os três estados seriam regras que só uma sessão logada
   exercita — e este lote inteiro nasceu de regras assim.

**Um achado novo, registrado e NÃO consertado:** a regra do D7 foi
escopada em `.auth-card`, e por isso o herói do `.canvas` — `/inicio`,
`/vendas`, `/saude-meta`, `/revisar-perfil` — **continua sem a rede contra
estouro**. Hoje não morde ninguém (aquelas faixas mostram contagem, e uma
contagem precisaria de 8 dígitos para estourar em 320px), mas o mecanismo
está inteiro lá. Medição, exposição e conserto proposto em
`docs/buraco-heroi-canvas.md`. São telas do QA-2.

**O que continua fora e não foi tocado:** o CEP na cascata de
`lib/meta/geo.ts` (§1.2, camada B — lote próprio, com a escolha entre
chave de CEP sem raio e coordenada com raio de 5 km **ainda em aberto**,
registrada no §1.2 para quem for fazer), o desconectar de verdade (§4), e
tudo o que está no §8.
