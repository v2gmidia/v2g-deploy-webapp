# Auditoria visual — Início canônico, rodada 5

17/09/2026. Sessão AUDITOR, sem escrever código. Este é o único arquivo que
ela grava.

**Commit auditado:** `72e474a2be30ab7f92f412615bbebf2eae3cc5fa`, branch
`design-r5`. A entrega da desenhista está no commit anterior, `77d4bb6`;
o `72e474a` só acrescenta `AGENTES.md` e as decisões de 16/09 em
`docs/decisoes.md`.
**Pasta parada:** `git status --short` voltou vazio antes de começar.

**Documentos lidos:** `ENTREGA-R5.md`, `SCREEN-CONTRACT-INICIO.md`,
`DUVIDAS.md` (1 a 13) e `docs/decisoes.md`. As três decisões de 16/09 valem.
O PRD da R4 foi marcado como superado.

**Como foi medido:**
- **Imagem.** Abri as 24 capturas uma a uma.
- **DOM.** A bancada rodou em `pnpm dev`, pelo preview. Cada rota foi
  carregada num `<iframe>` com a largura da captura, e os `getBoundingClientRect`
  foram lidos lá dentro. O `innerWidth` medido deu 1277/897/372, e não
  1280/900/375, por causa dos 3px da barra de rolagem do iframe. Nenhum número
  de espaço abaixo depende disso.
- **Código.** Leitura para achar a fonte de cada frase.

Uma leitura a olho foi **derrubada pela medição**: o "com gasto medido de…" do
concluiu a 900 parecia passar da margem. Medido em pixel, ele termina em
x=877 CSS nas duas capturas de 900, alinhado com o resto. O achado não entra.

Espaçamento e número de títulos em destaque são **pistas, não reprovação**,
como combinado.

---

## 1. Conferência das capturas — as 24, abertas

A largura sai da imagem: todas têm DPR 2, então 2560px = 1280, 1800px = 900 e
750px = 375. Nenhuma é tela de login e nenhuma mostra erro. As 12 duplas
claro/escuro têm a mesma anatomia: comparei bloco a bloco, e nenhum some nem
muda de lugar entre os temas.

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | selo cinza, 1 de 4, Criar em andamento, "Falar com a gente" | claro | 2560 px → 1280, lateral | ok |
| `r5-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-preparando-claro-900` | idem | idem, trilha em lista | claro | 1800 px → 900, barra inferior | ok |
| `r5-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | 4 barras + "Agora: Criar · em andamento" | claro | 750 px → 375, barra inferior | ok |
| `r5-preparando-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-concluiu-claro-1280` | "Seu anúncio está no ar." | selo lima, "A preparação terminou", 4 de 4, pergunta, 4 números | claro | 1280, lateral | ok |
| `r5-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-concluiu-claro-375` | idem | 4 barras cheias **sem nome de fase**, números em lista | claro | 375, barra inferior | ok |
| `r5-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-no-ar-claro-1280` | "Seu anúncio está no ar." | R$ 857,55 × R$ 2.403,00, pergunta, 3 números | claro | 1280, lateral | ok |
| `r5-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-no-ar-claro-375` | idem | as duas metades empilhadas | claro | 375, barra inferior | ok |
| `r5-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | selo "Já rodou" neutro, botão desabilitado + motivo, R$ 10,25 | claro | 1280, lateral | ok |
| `r5-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-pausado-claro-375` | idem | ação empilhada sobre os números | claro | 375, barra inferior | ok |
| `r5-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

**As capturas são o que a ENTREGA-R5 diz que são.** Encontrei uma diferença
só: no `concluiu-*-375`, a ENTREGA fala em "4 barras cheias", mas não diz que
os nomes das fases somem nessa largura (achado I6).

---

## 2. Vereditos

| estado | veredito | o que decide |
|---|---|---|
| **preparando** | **aprovado com ressalva** | Três segundos bastam: onde, o quê e para onde. Uma ação só, dominante. As ressalvas são de detalhe: vazio de 44px na metade da trilha, e o rótulo que repete o título. |
| **concluiu** | **reprovado** | Marca **"Otimizar ✓"** e **"4 de 4 etapas concluídas"** no minuto em que o anúncio acabou de ir ao ar (B1). É a família do "concluído" que a obra inteira quer matar. A âncora (a conclusão) ainda disputa peso com a caixa da pergunta, que é maior e tem o único botão. |
| **no ar** | **aprovado com ressalva** | Âncora clara (investido × voltou), uma ação só. As ressalvas: a pergunta fala "dessas conversas" com as conversas não medidas (I4); o espaço de 60px abaixo da pergunta, contra 32px no resto (I2); e o vazio de 343px à direita da pergunta (I3). |
| **pausado** | **reprovado** | O estado da única conta real **não tem ação óbvia** (B2). O desabilitado está permitido, porque tem motivo e exceção registrada. O defeito é outro: a única saída que funciona tem o mesmo tamanho e peso de um botão secundário, e o elemento mais forte da tela é o R$ 10,25. E a mesma tela dá quatro nomes para quem ajuda, e três mensagens sobre quem decide voltar (I1). |

---

## 3. A régua, por estado e largura

Claro e escuro deram o mesmo resultado em todas as linhas, e por isso aparecem
juntos.

**D (ritmo)** foi medido no DOM, entre as faixas do conteúdo. O resultado é
**32 px em todos os 12 casos**, entre todas as faixas vizinhas. A exceção é a
faixa da pergunta, onde o espaço visível é 60 px (achado I2). Dentro da faixa
"onde estou", os espaços são 12 (selo→manchete) e 8 (manchete→apoio).

**E (alinhamento)** também foi medido no DOM. A borda esquerda de todas as
faixas bate: 286 a 1280, 22 a 900 e 18 a 375. A âncora fica a 287, 1px
dentro, por causa da borda.

| estado @ largura | A — onde / o quê / para onde | B — âncora | C — ação | D — ritmo (px) | E — alinhamento | F — destaque na dobra (pista) | G — vazio | H — consistência |
|---|---|---|---|---|---|---|---|---|
| preparando @1280 | as três respondem; o menu não marca "Início" (D2) | a caixa trilha+etapa | uma: "Falar com a gente" | 32·32·32 | faixas 286; metades 292/292; cartões 123/123/123 | 3 títulos de link em cobalto + "Em andamento" | metade da trilha sobra 44 | rótulo = título (D1); "Falar com a gente" + "Falar com alguém" na lateral |
| preparando @900 | idem | idem | idem | 32·32·32 | faixas 22; 292/292; 123/123/123 | idem | sobra 44 | "Falar com uma pessoa" (topo) + "Falar com a gente" |
| preparando @375 | as três respondem | idem, empilhada | idem | 32·32·32 | faixas 18 | 3 títulos de link | nenhum sem intenção | barra atual quase igual às travadas no escuro (I7) |
| concluiu @1280 | onde e o quê sim; "para onde" dividido entre "Ver meus anúncios" e "Guardar" | **disputa:** caixa da conclusão × caixa da pergunta, que é maior e tem o único botão | uma: "Guardar" | 32·32·**60**·32·32 | faixas 286; números em 4 colunas (286/524/763/1001) sob "quiser" em 3 (286/604/922) | 3 títulos de link + "Ver meus anúncios" | 343 à direita dos campos da pergunta (medido no no-ar, mesma caixa) | título da pergunta 16px fora da caixa; as outras faixas usam rótulo dentro |
| concluiu @900 | idem | idem | idem | 32·32·**60**·32·32 | faixas 22; números 22/234/447/659 × quiser 22/305/588 | idem | vazio à direita da pergunta | idem |
| concluiu @375 | idem | idem | idem | 32·32·**60**·32·32 | faixas 18 | 3 títulos de link | nenhum | **as fases perdem o nome** (I6) |
| no-ar @1280 | as três respondem | investido × voltou | uma: "Guardar" | 32·32·**60**·32·32 | faixas 286; números 3 colunas 286/604/922 = "quiser" 286/604/922 (bate) | 3 títulos de link + "Ver meus anúncios" | **343** à direita dos campos (caixa até 1228, conteúdo até 866) | título da pergunta 16px fora da caixa |
| no-ar @900 | idem | idem | idem | 32·32·**60**·32·32 | faixas 22; números e quiser em 22/305/588 (bate) | idem | vazio à direita da pergunta, não medido em px nesta largura | idem |
| no-ar @375 | idem | idem, empilhada | idem | 32·32·**60**·32·32 | faixas 18 | 3 títulos de link | nenhum | ok |
| pausado @1280 | onde sim; **o quê falha**: nada diz qual é o próximo passo que funciona | R$ 10,25 domina; a ação fica abaixo dele | **nenhuma óbvia** (B2) | 32·32·32 | faixas 286; metades 351/351 | "Falar com alguém" + 3 títulos de link | metade da ação sobra **79** | "gestor", "equipe da V2G", "Falar com alguém" ×2 (I1); rótulo = botão (D1) |
| pausado @900 | idem | idem | idem | 32·32·32 | faixas 22; metades 341/341 | idem | sobra **69** | "Falar com uma pessoa" + "Falar com alguém" + "equipe da V2G" + "gestor" |
| pausado @375 | idem | ação vem primeiro no fluxo, mas o R$ 10,25 pesa mais | idem | 32·32·32 | faixas 18 | idem | nenhum | idem |

**I — regras do produto, nas 24 capturas.** Nada de nota, estrela, semáforo,
custo por clique ou por conversa em número, promessa de prazo, "erro", soma de
moedas ou zero no lugar de não medido. Conversas aparece como "—" com a linha
explicando. A lima só aparece no selo "No ar". O ✓ da conclusão é cobalto. O
único botão sem capacidade, "Voltar a anunciar", tem o motivo escrito e a
exceção registrada em 16/09. **Nenhuma violação.**

**J — verdade.** Ver os achados B1, I1 e I4, e a tabela de fontes na §6.

---

## 4. Achados, por gravidade

### Bloqueia

**B1 — O concluiu diz que "Otimizar" terminou.**
- **Onde:** as 6 capturas `r5-concluiu-*`, na caixa da âncora.
- **O que está errado:** "4 de 4 etapas concluídas", com ✓ em Preparar,
  Criar, Publicar **e Otimizar**, na tela em que o anúncio acabou de ir ao ar.
  A fonte é `fasesDaCadeia()`, e `lib/estado/frases.ts:987` liga "Otimizar" à
  etapa `numeros`. O ✓ quer dizer "a etapa de números fechou", mas a palavra
  na tela diz que a otimização acabou, no momento em que ela começa.
- **Por que bloqueia:** é a mesma família do "concluído com a campanha
  parada", agora com a campanha no ar. A DUVIDA-8 da própria obra registra
  que "Otimizar" é trabalho contínuo, e não missão encerrada.
- **Letras:** J e H.

**B2 — O pausado não tem ação óbvia.**
- **Onde:** as 6 capturas `r5-pausado-*`, na metade "Voltar a anunciar" da
  âncora.
- **O que está errado:**
  - O botão desabilitado (fundo gelo, texto cinza) e "Falar com alguém"
    (fundo cinza, texto cobalto) têm a mesma largura e o mesmo peso.
  - Nenhum dos dois é a aparência de principal.
  - A única saída que funciona está vestida de secundária.
  - O elemento mais forte da tela é o R$ 10,25.
- **Na régua:** o desabilitado com motivo está permitido. O que a régua e o
  contrato §11.6 não permitem é faltar **uma** ação óbvia: "a ação primária
  é única e visualmente dominante".
- **Por que bloqueia:** é o estado da única conta real (contrato §5), e o
  dono abre a tela para responder "por que parou?". A própria entrega aponta
  isso (§8.2).
- **O que a decisão diz e não diz:** a decisão de 16/09 manda a principal
  aparecer desabilitada. Ela não diz que a tela pode ficar sem caminho
  evidente.
- **Letras:** C e B.

### Incomoda

**I1 — O pausado dá quatro nomes para quem ajuda e três respostas para quem
decide voltar.**
- **Onde:** `r5-pausado-*`, no apoio do topo e na metade da ação. A 900 e 375
  entra também o topo do `Casco`.
- **O que está errado:** na mesma dobra aparecem estes nomes:
  - "Seu gestor pode retomar quando fizer sentido." — o apoio, que vem da
    fonte única (`lib/veiculacao/estado.ts:298`);
  - "quem coloca seu anúncio de volta para rodar é a equipe da V2G — é só
    chamar" — o motivo, texto da bancada, que espera o Gabriel (DUVIDA-12);
  - "Falar com alguém" — o botão, e a lateral a 1280;
  - "Falar com uma pessoa" — o topo do `Casco`, a 900 e 375.
- **Três respostas para quem decide voltar:**
  - o gestor, "quando fizer sentido";
  - o dono, ao chamar;
  - o dono, pelo botão que é "dele" (decisão 16/09 §2).
- **Leitura:** cada frase se defende sozinha, e a decisão de 16/09 mantém a
  primeira. Juntas, na mesma tela, elas não dizem de quem é a vez.
- **Letras:** H e J.

**I2 — Abaixo da pergunta do dia o espaço vale o dobro.**
- **Onde:** `r5-concluiu-*` e `r5-no-ar-*`, entre a caixa da pergunta e "Os
  primeiros sinais" / "O que a plataforma contou".
- **O que está errado:** o DOM mede 32px entre todas as faixas. A faixa da
  pergunta, porém, termina 28px abaixo da própria caixa: a caixa vai até 952
  e a faixa até 980, no concluiu a 1280. O espaço visível fica em **60px**, e
  em todos os outros pares é **32px**. É o mesmo número nas 3 larguras e nos
  2 estados.
- **Letras:** D e G.

**I3 — A caixa da pergunta tem vazio à direita, e a anatomia dela é outra.**
- **Onde:** `r5-no-ar-*` e `r5-concluiu-*` a 1280 e 900.
- **O que está errado:**
  - Medido no no-ar a 1280: a caixa vai até x=1228, o último conteúdo
    ("não sei") termina em x=866, e sobram **343px** já descontado o padding.
    Os campos medem 506 e 457.
  - O título "Uma pergunta rápida sobre ontem" tem 16px e fica fora da caixa.
    As outras faixas usam rótulo em caixa alta dentro do cartão, ou título de
    faixa de 20px.
  - A entrega registra isso (§8.3) e o atribui ao componente de produção.
- **Letras:** G e H.

**I4 — A pergunta fala de conversas que a tela diz não ter medido.**
- **Onde:** `r5-concluiu-*` e `r5-no-ar-*`.
- **O que está errado:** "Quantas **dessas** conversas viraram venda ontem?"
  (`lib/dia-seguinte/pergunta.ts:28`, produção). Na mesma tela, Conversas é
  "—", com "a contagem de quem chega pelo anúncio ainda não está de pé". O
  "dessas" aponta para um número que a tela acabou de dizer que não existe.
- **Dono do texto:** é texto de produto, não da desenhista.
- **Letra:** J.

**I5 — No pausado, a metade da ação termina antes da metade dos números.**
- **Onde:** `r5-pausado-*-1280` e `*-900`.
- **O que está errado:** as metades têm a mesma altura (351/351 a 1280 e
  341/341 a 900). Na metade da ação, o conteúdo acaba **79px** (1280) e
  **69px** (900) antes do fim; na metade dos números, acaba em 0.
- **Contexto:** a entrega registra isso sem medida (§8.1). Aqui está a
  medida.
- **Letras:** G e E.

**I6 — A 375, a conclusão não diz o que foi concluído.**
- **Onde:** `r5-concluiu-*-375`.
- **O que está errado:** a 1280 e a 900, as quatro fases aparecem com nome.
  A 375, que é a largura de projeto (contrato §7), aparecem só quatro barras
  cheias debaixo de "4 de 4 etapas concluídas". O momento que acontece uma
  vez só perde, no celular, a informação do que acabou.
- **Letra:** H (a anatomia muda entre larguras).

**I7 — No escuro a 375, a barra da fase atual quase não se distingue das
travadas.**
- **Onde:** `r5-preparando-escuro-375`, na trilha.
- **O que está errado:** a segunda barra (atual) e a terceira e quarta
  (travadas) ficam muito próximas no escuro. Contraste não-textual **não
  medido**, nem aqui nem na entrega (§5). A linha "Agora: Criar · em
  andamento" carrega a informação.
- **Letra:** H (claro ≠ escuro na leitura, com a mesma anatomia).

### Detalhe

**D1 — O rótulo repete o título ou o botão.**
- "A GENTE ESTÁ DEVENDO" sobre "A gente está devendo o seu primeiro anúncio"
  (preparando).
- "VOLTAR A ANUNCIAR" sobre o botão "Voltar a anunciar" (pausado).
- A mesma coisa aparece duas vezes, uma em cima da outra. **Letra:** H.

**D2 — Nenhuma captura mostra "Início" como item ativo.**
- A causa é a bancada: `components/ui/NavItem.tsx:24` compara o `pathname`
  com `/inicio`, e a rota é `/exemplo/inicio-*`.
- Na produção o item marcaria. Mas **as capturas não provam** o "onde estou"
  pela navegação.
- **Letra:** A.

**D3 — A 900px aparece barra inferior, não a lateral.**
- O contrato (§7 e §11.7) pede lateral a partir de 900.
- O comportamento é do `Casco`, igual à R4, e a entrega registra (§8.5).
- **Letra:** H.

**D4 — No concluiu, as colunas das faixas vizinhas não se alinham.**
- Os números têm 4 colunas (286/524/763/1001 a 1280); o "se você quiser",
  logo abaixo, tem 3 (286/604/922).
- No no-ar as duas faixas têm 3 colunas e as bordas batem.
- **Letra:** E.

**D5 — A fixture do concluiu junta "está no ar agora" com gasto de 10 dias
atrás.**
- A tela diz "Ele está sendo exibido agora" e "com gasto medido de 05/09 a
  07/09", numa captura datada de 17/09.
- A combinação é da fixture: `lib/exemplo.ts:105` põe `no_ar`, e
  `consolidadoReal()` traz os três dias reais da conta pausada.
- Não é defeito da tela. É uma captura que pode enganar quem aprova olhando só
  a imagem.
- **Letra:** J (fonte).

**D6 — Investido e Voltou aparecem lado a lado, com o mesmo peso e períodos
diferentes.**
- Onde: `r5-no-ar-*`. Os 30 dias do investido ficam ao lado dos 18 de 30 do
  voltou.
- As legendas dizem o período, e a tela não divide um pelo outro.
- Registro como **pista**: a composição convida a divisão que a entrega diz
  evitar.
- **Letra:** J.

**D7 — "quinta-feira" quebra com hífen no cabeçalho a 375.**
- Vem do `Casco`, que é de produção. **Letra:** H.

---

## 5. Se só desse para fazer três

1. **No pausado, a saída que funciona precisa ser a coisa óbvia da tela
   (B2).** É o estado da única conta real e a pergunta "por que parou?". Hoje
   ela não tem resposta de ação.
2. **A conclusão não pode afirmar que "Otimizar" terminou (B1).** Ou a
   palavra, ou o ✓, ou o 4 de 4 estão mentindo sobre o presente.
3. **Um nome só para quem ajuda e para quem decide (I1).** Somando as quatro
   telas: "gestor", "equipe da V2G", "a gente", "alguém", "uma pessoa". Parte
   é de produção (`Casco`, `frases.ts`, `estado.ts`) e parte é da bancada. O
   conserto é da família, não da tela, e a copy é do Gabriel.

---

## 6. De onde vem cada frase de estado

Para cada frase, qual código a produz e qual dado a alimenta. **Fixture** quer
dizer `lib/exemplo.ts`, que é dado da bancada. A captura prova o desenho, não
que o backend mande isso.

| frase na captura | quem escreve | o dado que decide | fonte do dado |
|---|---|---|---|
| selo, manchete e apoio ("Ainda não foi ao ar", "Seu anúncio está no ar.", "Ele saiu do ar e nenhuma verba…") | `fraseDeVeiculacao()`, `lib/veiculacao/estado.ts:294-299` — **fonte única, produção** | `veiculacao` | **FIXTURE**, `lib/exemplo.ts:103-108` (`sem_evidencia`, `no_ar`, `no_ar`, `ja_foi_ao_ar`) |
| "1 de 4 / 4 de 4 etapas concluídas", fases, "Em andamento" | `fasesDaCadeia()` e `montarEtapas()`, `lib/estado/frases.ts` — **produção** | etapas | **FIXTURE**, estado montado em `lib/exemplo.ts` |
| "A gente está devendo o seu primeiro anúncio" e o corpo | `lib/estado/frases.ts:602-607` — **produção** | data do cadastro ("19 de agosto") | **FIXTURE** |
| "Falar com a gente" | `lib/estado/frases.ts:608` — **produção** | — | — |
| "A preparação terminou", "Esta é a última vez que a preparação aparece aqui." | `TelaCanonica.tsx:147` e `:205` — **texto da bancada, sem fonte de produto** (DUVIDA-12) | `mostrarConclusao` | **só a bancada liga** (`TelaCanonica.tsx:69`, `:90`). Em produção não há fonte (DUVIDA-11) |
| "Voltar a anunciar", o motivo, "Enquanto rodou", "Falar com alguém" | `TelaCanonica.tsx:272-314` — **texto da bancada** (DUVIDA-12) | — | — |
| R$ 10,25 · 64 · 1.657 (concluiu e pausado) | componente de números da bancada | consolidado | **FIXTURE**, `consolidadoReal()` (`lib/exemplo.ts:128-169`), cópia dos números reais da conta V2G de 05–07/09 |
| R$ 857,55 · R$ 2.403,00 · 27 vendas · 2.184 · 61.403 (no ar) | idem | consolidado | **FIXTURE INVENTADA POR INTEIRO**, `consolidadoDeTresMeses()` (`lib/exemplo.ts:188`) |
| "Ainda não definimos juntos quanto vale a pena pagar…" | a tela repete `nivelFrase` | `nivel` | **FIXTURE**, `NIVEL_SEM_ALVO` (`lib/exemplo.ts:93`), cópia da frase do backend vista em produção em 11/09 |
| "Quantas dessas conversas viraram venda ontem?" | `lib/dia-seguinte/pergunta.ts:28` — **produção** | — | — |
| "Conversas: a contagem de quem chega…" | **não localizado nesta auditoria** | `pessoasQueChegaram` | **FIXTURE** (`"0.0"` ou `null`) |

**O que a fonte sustenta e o que não sustenta:**
- "Nenhuma verba está sendo gasta agora" (pausado) é sustentada pelo
  `ja_foi_ao_ar`, que o backend deriva do `PAUSED` da Meta (DUVIDA-10). Na
  bancada, esse valor é fixture.
- "Esta é a última vez…" **não tem fonte em produção**. Ela só é verdade se o
  pedido da DUVIDA-11 for atendido.
- O ✓ de "Otimizar" tem fonte (`numeros` fechada), mas **a palavra afirma mais
  do que a fonte diz** (B1).

---

## 7. O que está BOM e não pode se perder na R6

- **Ritmo entre faixas: 32px exatos** em todos os 12 casos (4 estados × 3
  larguras). A única exceção é a cauda da pergunta (I2). É a primeira rodada
  com ritmo regular medido.
- **A borda esquerda de todas as faixas bate** nas três larguras (286 / 22 /
  18).
- **Os cartões da mesma linha têm a mesma altura** em todo lugar medido:
  "se você quiser" 123/123/123, números 82/82/82(/82), metades da âncora do
  preparando 292/292 e do pausado 351/351.
- **Nenhum vazamento horizontal**: `scrollWidth ≤ innerWidth` nos 12 casos.
- **O pausado já não mente:** nada de "Concluído", nada de 4/4, nenhum ✓.
  O selo é neutro, "Já rodou". O contrato §11.2 está cumprido, e era o
  defeito central da R3 e da R4.
- **As frases de estado saem da fonte única.** Selo, manchete e apoio vêm
  todos de `fraseDeVeiculacao()`; a tela não escreve frase de estado.
- **A lima só em "No ar".** A conclusão usa cobalto. Não há lima em
  botão.
- **"—" com a linha explicando** para Conversas, em todas as capturas. Não
  aparece zero em lugar nenhum.
- **O preparando a 375:** "Agora: Criar · em andamento" numa linha acabou com a
  quebra de "Em andamento" da R4. O contador é verdadeiro ("1 de 4").
- **A âncora do no ar:** investido × voltou, cada número dizendo quem o
  escreveu ("medido pela plataforma", "pelo que você contou em 18 de 30
  dias"), sem razão calculada. Responde "isso está me dando dinheiro?" sem
  inventar.
- **O motivo do botão desabilitado** não promete prazo: não há "em breve".
- **A mesma coluna de quatro faixas, na mesma ordem, nos quatro momentos.**
  Só a âncora muda de forma. Isso deixa a tela previsível de um estado para o
  outro.
- **Claro e escuro com a mesma anatomia** nas 12 duplas.

---

*A auditoria não propõe implementação. O "como" é da desenhista.*
