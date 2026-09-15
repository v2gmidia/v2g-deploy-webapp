# Lote 2b — o sistema visual dos controles — 15/09/2026

Sessão sem login, no servidor local (`pnpm dev`). Nenhum `.tsx` foi editado.
Nada foi commitado. Base: `main` em `8cc2b6d`, com a árvore limpa no início.

**Precedência conferida:** `docs/decisoes.md` foi lido antes de começar, e
nenhuma decisão registrada contradiz o prompt.

---

## 0. O que depende de decisão humana

Nada abaixo foi resolvido sozinho.

1. **A escala de texto trava os itens 1 e 2.** 14px e 16px estão fora da
   rampa do `DESIGN.md` (11/13/15/18/22/26), e o detector reprova os dois:
   ```
   $ node .claude/skills/impeccable/scripts/detect.mjs --json app/__sim2b/t.css   (cópia da simulação, apagada em seguida)
   design-system-font-size ×4: "16px is off the DESIGN.md type ramp" ×2 · "14px …" ×2
   ```
   A regra do lote proíbe abrir exceção. O caminho limpo é aprovar a escala
   do item 6 (`docs/tokens.md`, "PROPOSTA — escala de texto"), que tem 14 e
   16. Os dois itens passam a ler token dela.
2. **B6 `btn-linha forte` como secundária apaga um estado.** Em
   `Campo.tsx:232` ele marca a opção que está valendo. Nas outras linhas, é a
   ação mais forte. O B6 é principal? O `:232` é escolha?
   (`docs/botoes.md` §10.1, nota 3)
3. **O mini-send em 54 estica 7 campos de 48 para 54.** Fica em 48, ou o
   campo acompanha? (nota 1)
4. **Três links viram cinza como discreta:** "deixe em branco", "Ficou
   alguma dúvida?" e o "Entrar" / "Criar conta" do rodapé do `/entrar`.
   (nota 5)
5. **O `ec-back` de 44×44 visível empurra o topo de 49 para 63px** (medido no
   lote 2a). Aceita, ou volta o círculo de 30px com área invisível de 44?
   (nota 7)
6. **A escolha não tem cor, peso nem tamanho de texto no desenho.** Usei
   `--texto-forte`, 600 e 14px como palpite. (nota 6)
7. **Os quatro de fora:** B9, B10, B16 e B17. O que cada um é está em
   `docs/botoes.md` §10.2. O B9 pede decisão casada com a principal: se a
   regra da principal excluir `:disabled`, um botão que desabilita enquanto
   envia encolhe no clique. Se não excluir, o B9 ganha 54px e 16px.
8. **Cartão sem borda: 16 usos são branco sobre branco** (§3). E o `.card`,
   o seletor mais usado, está nos dois lados. As saídas estão no §3.3.

Mais três, menores:

- **As escalas de texto e de espaço** estão só propostas
  (`docs/tokens.md`). A de espaço mexe em 340 de 469 comprimentos.
- **Os três tokens de papel** (`--fundo-controle`, `--texto-discreto`,
  `--texto-discreto-sobre-placa`) estão propostos com as razões de contraste,
  em `docs/tokens.md`.
- **O detector tem 7 achados anteriores a este lote.** São os mesmos 7 do
  HEAD, com a linha deslocada: `side-tab` ×4, `layout-transition`,
  `codex-grid-background` e `design-system-color` para `rgb(0 0 0 / 0.9)`.
  Não consertei, porque é redesenho fora do escopo, e não abri exceção.
  ```
  $ node .claude/skills/impeccable/scripts/detect.mjs --json app/globals.css   → 7
  $ (o mesmo sobre git show HEAD:app/globals.css numa cópia temporária)       → 7, as mesmas regras
  ```

---

## 1. O que foi feito

| Item | Estado | Onde está a medição |
|---|---|---|
| 1. Cinco papéis | **proposta**, simulada nos dois temas | `docs/botoes.md` §10 |
| 2. Campo em 16px | **proposta**, simulada | `docs/botoes.md` §11 |
| 3. Raio 12/16 | **aplicado**, medido antes e depois | `docs/tokens.md`, "Raio: lote 2b" |
| 4. Cartão sem borda | **medido e simulado, não aplicado** | §3 deste arquivo |
| 5. `--body` com Archivo | **aplicado**, medido antes e depois | `docs/tipografia-pendente.md` §6 |
| 6. Escalas de texto e espaço | **proposta** | `docs/tokens.md` |
| 7. Folha de amostras | **feita** | `docs/amostras.html` |

**Verificação:**

- `pnpm conferir`: `exit=0`. É uma cadeia de `&&` que começa por `pnpm
  typecheck`, então todas as etapas passaram.
- `pnpm conferir:cascata`: "TUDO CERTO — 0 inerte(s) na folha".
- `docs/amostras.html` aberta no navegador pelo servidor local: renderiza os
  dois quadros, claro e escuro, com o `globals.css` real e a Archivo.

---

## 2. Decisões tomadas sozinho, e por quê

- **Não apliquei o item 4 nem na parte que parecia segura.** Os 13 seletores
  que só aparecem sobre `--canvas` passariam sem problema. Mas o `.card`,
  com 28 usos, tem dois deles dentro de `.auth-card`. Aplicar a metade
  deixaria cartões com borda e sem borda lado a lado na mesma tela. O prompt
  diz "PARE" para branco sobre branco, e esse caso misto é dúvida.
- **O `DESIGN.md` foi regerado, e o diff trouxe mais que o `body`.** Vieram
  junto 8 chaves `-escuro` da camada de papéis e o `sidebar-ink` com
  `var()`. O `DESIGN.md` estava desatualizado desde o commit `90e8ee9`
  (PAPÉIS), que não rodou o script. É a saída correta do script sobre o CSS
  de hoje, e o número de achados do detector não mudou.
- **O `scripts/gerar-design-md.mjs` foi editado numa linha.** As famílias
  estão escritas nele, não lidas do CSS. Sem a troca, o `DESIGN.md`
  continuaria dizendo Segoe UI no corpo.
- **Duas cores do item 1 vieram de token existente, e não de hex novo.** A
  discreta sobre fundo claro é `--ink-mute`; sobre a placa é `--sidebar-ink`.
  Nenhum tom passa de 4,5:1 nos dois grupos de fundo. A tabela está em
  `docs/tokens.md`.
- **O "cinza claro" do desenho virou `rgb(var(--navy-rgb) / 0.06)`.** É o
  tingimento que o `.ec-back` já usa. O `#EDF2F5` do desenho não existe na
  paleta.
- **A folha de amostras abre a si mesma em dois `iframe`, `#claro` e
  `#escuro`.** Os tokens de tema moram em `:root[data-tema]`, e um pedaço da
  página não tem tema próprio. A página tem duas exceções declaradas no topo:
  `--font-archivo`, que o prompt autorizou, e `border-color: transparent` no
  "depois" do cartão, que é palavra-chave e não valor copiado.

## 3. Item 4 — cartão sem borda: a medição

### 3.1 Todo seletor que desenha cartão e tem borda

```
$ node cartoes-css.cjs   (parser de regras do globals.css de agora; comentário vira espaço)
regras folha: 805 · com borda em --line: 72 · quatro lados: 49 · só um lado: 23
```
Das 49 com borda nos quatro lados, estas desenham cartão:

| Linha | Seletor | Fundo | Nota |
|---:|---|---|---|
| 789 | `.auth-card` | `--surface` | |
| 928 | `.side-account` | — | sobre a placa escura |
| 1152 | `.bubble.ai` | `--surface` | balão de chat |
| 1365 | `.espera-row` | `--surface` | |
| 1788 | `.card` | `--surface` | |
| 1821 | `.alert-card` | `--surface` | + `border-left: 4px` cobalto |
| 1870 | `.empty-hero` | `--surface` | |
| 1940 | `.tips-card` | `--surface` | |
| 2168 | `.hero-card` | `--surface` | |
| 2224 | `.list-row` | `--surface` | |
| 2283 | `.card.noturno` | `--surface` | |
| 2307 | `.command-card` | `--surface` | |
| 2359 | `.escolha-item` | `--surface` | opção clicável |
| 2377 | `.escolhido` | `--surface` | |
| 2443 | `.cobranca` | `--surface` | |
| 2455 | `.tema-opcao` | `--surface` | é o B16/B17 |
| 2658 | `.diag-lista li` | `--surface` | + `border-left-width: 3px` |
| 2743 | `.rev-item` | `--surface` | |
| 2783 | `.rev-opcao` | — | sem fundo |
| 2824 | `.rev-plinha` | — | sem fundo |
| 3157 | `.res-ficha` | `--surface` | |
| 3242 | `.res-num` | navy 3% | |
| 3320 | `.res-nivel` | `--ice-soft` | |
| 3349 | `.res-falha` | `--surface` | |
| 3794 | `.proximo` | `--surface` | |
| 3877 | `.sinal` | `--surface` | |
| 4126 | `.analise-envio` | `--surface` | |
| 4135 | `.analise-alvo` | `--ice-soft` | tracejada, é a zona de soltar arquivo |
| 4283 | `.analise-cartao` | `--surface` | |
| 4508 | `.casa-desenho` | `--surface` | tracejada; o comentário diz que é de propósito, para não ler como clicável |

As outras 19 não são cartão:

- campos: `.field input`, `.field select`, `.fallback-field input`,
  `.rev-corrigir`, `.rc-editor`, `.campo-moeda`;
- botões e pílulas: `.botao-leve`, `.pd-convite .botao-leve`, `.btn-linha`,
  `.btn-sm`, `.auth-help`, `.casa-indice a`, `.card.noturno .chip-lime`,
  `.trilha-marca`;
- imagens: `.id-logo img`, `.id-galeria img`, `.analise-previa`,
  `.tema-amostra`;
- o botão do input de arquivo: `.id-arquivo::file-selector-button`.

As 23 de um lado só são divisórias.

### 3.2 Onde cada cartão mora, e o que tem atrás

Cada uso no JSX foi montado na sua cadeia de ancestrais, e o fundo composto
do cartão foi comparado com o fundo composto atrás dele.
```
node extrair-classes.cjs   (o extrator do docs/botoes.md §3, casando por classe) → 94 elementos JSX, 103 linhas de variante
javascript_tool → para cada uso: fundo próprio composto × fundo atrás composto, razão WCAG, tema claro e escuro
```

**Sobre `--canvas`, sempre.** 13 seletores, 44 usos. Cartão `#FEFEFE` sobre
`#F1F6F7` dá **1,08:1** no claro, e `#0C1523` sobre `#050A13` dá **1,08:1**
no escuro:

- `.auth-card` ×21 · `.analise-cartao` ×4 · `.sinal` ×5 · `.proximo` ×3
- `.empty-hero` ×2 · `.list-row` ×2 · `.res-ficha` ×2 · `.rev-item` ×2
- `.analise-envio`, `.command-card`, `.espera-row`, `.res-falha`,
  `.tips-card`, ×1 cada

**Branco sobre branco: 16 usos.** Razão 1,00 nos dois temas. Aqui a borda é
a única coisa que separa o cartão:

| Uso | Onde |
|---|---|
| `.escolhido` | `conectar/escolher/Formulario.tsx:62`, `:105` (dentro do `.auth-card`) · `conta/TrocarPagina.tsx:34` (dentro de `.card`) |
| `.escolha-item` | `conectar/escolher/Formulario.tsx:76`, `:123` (dentro do `.auth-card`) |
| `.hero-card` | `onboarding/contas/Contas.tsx:176` (dentro do `.auth-card`) |
| `.card` | `reprovado/page.tsx:133` · `verba/FormVerba.tsx:22` (dentro do `.auth-card`) |
| `.cobranca` | `verba/page.tsx:88`, `:98` (dentro do `.auth-card`) |
| `.side-account` | `(protected)/layout.tsx:181`, sem fundo, sobre a placa |
| `.rev-opcao` | `revisar-perfil/[proposta]/page.tsx:243`, `:258`, sem fundo, sobre a página |
| `.rev-plinha` | `revisar-perfil/[proposta]/page.tsx:446` ×2, sem fundo, sobre a página |
| `.bubble` | `components/ui/Bubble.tsx:16` (já sem borda nesse ramo) |

**Mistos e com borda que significa alguma coisa:**

- `.card`: 28 usos, 2 deles branco sobre branco;
- `.escolha-item`: 8 usos, com fundo variando por estado;
- `.res-num` (1,06) e `.res-nivel` (1,10): tingidos;
- `.alert-card` e `.diag-lista li`: a borda esquerda é severidade;
- `.casa-desenho` e `.analise-alvo`: o tracejado é o significado.

### 3.3 A simulação, nos 13 seguros

```
javascript_tool → injetar(".auth-card, .analise-cartao, … .tips-card { border-color: transparent }"); medir borda, razões e caixa, claro e escuro
```
Nos 13, a borda sai (`#D9E3E6` a 1,29:1 contra o cartão no claro; `#1C2840`
a 1,24:1 no escuro). O cartão fica a 1,08:1 do fundo nos dois temas. **A
caixa não muda de tamanho**, porque é `border-color: transparent` e não
`border: 0`. O desenho aprovado (`#FFF` sobre `#F1F6F7`) dá 1,09:1, o mesmo
grau.

**As saídas para os 16, para escolher:**

- (a) o cartão de dentro troca a borda por `--fundo-controle`;
- (b) o cartão de dentro fica com a borda;
- (c) no `(fluxo)`, o `.auth-card` deixa de ser cartão e vira a página.

Para o `.card`, que mistura: a regra por contexto,
`.auth-card .card { border-color: var(--line) }`, é CSS e não precisa de
`.tsx`.

---

## 4. O que não deu certo, ou saiu diferente

- **Na simulação, o B9 (`.cta:disabled`) virou cobalto.** A minha regra
  `.cta:not(.ghost):not(.quiet)` era mais específica que o `:disabled`. É
  defeito da simulação, não do desenho, e virou regra para a versão final
  (`docs/botoes.md` §10.1, nota 8).
- **O B19 não foi alcançado pela simulação:** o `.fallback-field.pd-guardar
  .mini-send` vence. A leitura "antes" dele deu 48 por um irmão que a
  montagem inventou; o valor real, do lote 2a, é 44.
- **A borda mede 0,8px** em todas as leituras, pelo arredondamento da tela
  emulada. As tabelas usam o valor declarado.
- **B10 `acct-row`:** a cadeia do extrator não traz o `.acct-list`, então a
  aparência real dela não foi medida.

## 5. O que ficou pela metade

- Os itens 1 e 2, esperando a §0.1 a §0.7.
- O item 4, esperando a §0.8.
- As rotas com sessão (21): nada foi aberto. Tudo que é delas veio de
  montagem a partir do JSX.

## 6. Arquivos

| Arquivo | O quê |
|---|---|
| `app/globals.css` | `--raio-controle` 8 → 12, `--raio-cartao` 12 → 16, `--body` começando por Archivo, e dois comentários atualizados |
| `scripts/gerar-design-md.mjs` | a família do `body`, uma linha |
| `DESIGN.md` | regerado pelo script |
| `docs/amostras.html` | novo: a folha de amostras |
| `docs/botoes.md` | §10 e §11: o item 1 e o item 2 |
| `docs/tokens.md` | `--body` na tabela, a seção do raio, as duas escalas propostas e os três tokens propostos |
| `docs/tipografia-pendente.md` | §6: o item 5 |
| `docs/estado/visual-controles-15-09.md` | este arquivo |
| `docs/estado/indice.md` | a linha deste arquivo |

Os scripts da bancada ficaram na pasta temporária da sessão, fora do
repositório: `medir.js`, `servidor.cjs`, `cartoes-css.cjs`,
`extrair-classes.cjs` e `proposta-papeis.css`. O extrator de controles está
reproduzido em `docs/botoes.md` §3. A regra simulada está no §10.4.
