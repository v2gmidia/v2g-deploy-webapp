# Lote 2b, segunda parte — escala, papéis e campo aplicados — 15/09/2026

Continuação de `visual-controles-15-09.md`, que já tinha sido commitado e,
por isso, não foi reescrito. A sessão partiu das respostas do Victor às
perguntas da §0 de lá, registradas em `docs/decisoes.md` (15/09).

Nenhum `.tsx` foi editado e nada foi commitado. No meio da sessão, o
`globals.css` apareceu em CRLF depois do commit `e2f596c`. O script que
aplica os papéis lê em LF e grava de volta no formato em que o arquivo
estava:
```
node -e '…(t.match(/\r/g)||[]).length…'   CR: 4876 · LF: 4876
```

---

## 0. O que depende de decisão humana

1. **Cartão sem borda: NÃO aplicado.** O Victor pediu a lista antes, e
   **12 das 25 telas com cartão ficariam com cartão com borda e sem borda
   juntos**:
   ```
   node → cartoes.json (o extrator do botoes.md §3, casando por classe): por page/layout, os usos dos 13 seletores sem borda × os usos de cartão que ficam com borda
   raízes com cartão: 25 · com os dois tipos: 12
   ```

   | Tela | Sem borda | Com borda |
   |---|---|---|
   | `/conectar/escolher` | `.auth-card` ×3 | `.escolhido` ×2, `.escolha-item` ×2 (dentro dele) |
   | `/expectativas` | `.auth-card` | `.bubble` (`Bubble.tsx:16`) |
   | `/onboarding/contas` | `.auth-card` ×2 | `.hero-card` (`Contas.tsx:176`) |
   | `/reprovado` | `.auth-card` ×2 | `.card` (`page.tsx:133`) |
   | `/verba` | `.auth-card` | `.card` (`FormVerba.tsx:22`), `.cobranca` ×2 |
   | `/alertas` | `.empty-hero` | `.alert-card`, `.card` ×3 |
   | `/anuncios` (e o `loading.tsx`) | `.res-falha`, `.res-ficha`, `.tips-card` | `.res-num`, `.res-nivel`, `.card` ×2 |
   | `/criativos` | `.analise-cartao` ×4, `.analise-envio` | `.casa-desenho` (tracejado) |
   | `/inicio` | `.proximo` ×3, `.sinal` ×4, `.list-row`, `.command-card` | `.card` ×5, um deles o da `PerguntaDoDia.tsx:381` |
   | `/revisar-perfil/[proposta]` | `.rev-item` | `.rev-opcao` ×2, `.diag-lista`, `.rev-plinha` |
   | `/saude-meta` | `.list-row` | `.card` ×2, `.diag-lista` ×2 |

   Nas cinco do `(fluxo)`, o cartão com borda está **dentro** do `.auth-card`:
   é o caso branco sobre branco que o Victor tirou do lote. Nas outras sete,
   o `.card` com borda fica **ao lado** de cartões sem borda, na mesma tela.

   **Limite:** um componente usado em mais de uma tela foi seguido só até o
   primeiro uso (`ondeEUsado` do extrator). O `.bubble`, por exemplo, também
   vive na `/onboarding`.
2. **Seis regras de contexto deixam a principal menor que o papel**
   (`docs/botoes.md` §12.2): `.analise-saida .cta` e `.command-card .cta`
   (44px), `.proximo .cta` (48px), `.proof-actions .cta`,
   `.side-support .cta` e `.faixa-reconectar .cta` (`--fs-corpo`). Uma delas
   foi medida: `Analisar.tsx:318` sai com 45,6px. Alinhar ao papel, ou são
   variações compactas?
3. **`Contas.tsx:193` → "Valor em reais".** Cabe (100px em 129), mas é
   editar `.tsx`, e a regra do lote proíbe. **Não editei.** Autoriza?
4. **O placeholder do `redefinir/Form.tsx:17`**, para ele encurtar: "Pelo
   menos 8 caracteres, com letras e números". São 334,7px num espaço de 270,
   e já não cabia antes.
5. **Cinco placeholders dinâmicos não cabem em 16px:** três de
   `onboarding/perguntas.ts` (`:112`, `:122`, `:144`) e os dois padrões do
   `SeletorDeNicho.tsx` (`:63`, `:66`). A tabela está em `docs/botoes.md`
   §12.3. São texto de produto e não foram tocados.
6. **Duas linhas passaram a quebrar com a escala nova:** o parágrafo da
   `/recuperar` (3 → 4 linhas) e o título da `/redefinir` (1 → 2). Nada
   transbordou. Só registro.

## 1. O que foi feito

| O quê | Estado | Medição |
|---|---|---|
| Escala de texto de seis degraus | aplicada, com `DESIGN.md` regerado e detector passando | `docs/tokens.md`, "Escala de texto: lote 2b" |
| Os cinco papéis (e a principal em 48) | aplicados | `docs/botoes.md` §12.1–12.2 |
| Campo em 16px | aplicado | `docs/botoes.md` §12.3 |
| Cartão sem borda | **não aplicado** (§0.1) | lista acima |
| Escala de espaço | não aplicada, vira lote próprio | — |
| `docs/amostras.html` | reescrita com os papéis aplicados e as classes `.papel-*` | aberta no navegador |

**Verificação:**

- `pnpm conferir`: exit 0, **na segunda rodada**. A primeira falhou (§3).
  ```
  $ pnpm conferir > conferir.log 2>&1; echo exit=$?
  exit=0
  $ pnpm conferir:cascata | tail -1
  TUDO CERTO — 0 inerte(s) na folha, 0 já conhecida(s) e pendente(s) de decisão
  ```
- Detector: os mesmos 7 achados de antes do lote, e nenhum de tamanho ou de
  cor nova.
- Conferência linha a linha dos 66 botões, no claro e no escuro: 64 batem
  com o papel. As 2 que não batem estão explicadas em `botoes.md` §12.2.

## 2. Decisões tomadas sozinho, e por quê

- **Em que a escolha não marcada é "tom do corpo, não navy": virou
  `--texto-fraco`.** O `body` usa `--ink`, que tem o valor do navy. O único
  tom de corpo que não é navy é o dos parágrafos de apoio. Mede 6,27:1 no
  claro e 7,31:1 no escuro, sobre cartão.
- **O "Guardar" foi para a principal em 48, e não para a de 54.** Ele não
  fica colado em campo, mas o comentário do Victor de 01/09 no próprio
  JSX pede "respiro, e não um botão maior".
- **O "Criar conta" foi para a secundária junto com o "Entrar".** Os dois
  têm a mesma classe e o mesmo papel: cada um é a única saída do seu modo da
  tela.
- **Botão colado em campo acompanha o campo também na secundária:** o
  "corrigir" do `.rev-corrigir` ficou em 48. É a mesma regra que o Victor deu
  para o mini-send.
- **O `.mini-send:disabled` trocou o fundo `--ink-mute`** (tinta servindo de
  superfície, o erro do N5) pelo par do desabilitado da principal.
- **Não mexi nas seis regras de contexto do `.cta`** (§0.2).

## 3. O que não deu certo

- **A primeira tentativa de aplicar os papéis falhou duas vezes, sem gravar
  nada.** Na primeira, um heredoc quebrado no shell. Na segunda, as âncoras
  do script estavam em LF e o arquivo em CRLF. O script lança erro antes de
  gravar, e o `globals.css` não chegou a ficar pela metade.
- **A primeira rodada do `pnpm conferir` falhou, e eu li errado.** O aviso
  de fim de tarefa dizia exit 0, mas esse era o código do `echo` no fim do
  comando; a suíte tinha saído com `exit=1`. Cheguei a escrever "exit 0"
  neste arquivo antes de ler a saída. Quem falhou foi o `conferir:cascata`:
  ```
  FALHA .sidebar .link-btn { color } linha 984 perde para a linha 4820 — mesmo seletor, mesmo contexto: a de baixo vence em toda parte
  ```
  O bloco de papéis repetia o seletor da barra lateral, e a regra antiga
  virou inerte. **O conserto:** a linha 984 passou a ler
  `--texto-discreto-sobre-placa`, e a repetição saiu do bloco. O valor
  pintado é o mesmo, porque o token aponta para `--sidebar-ink`. A segunda
  rodada está na §1.

## 4. Pendências de produto registradas (decisões do Victor)

- **B10 `acct-row`:** é função sem fonte de dado aparecendo desabilitada. Isso
  contraria a regra de omitir em vez de desabilitar. Vai para
  `decisoes.md`, em aberto.
- **O `.auth-card` com cartão branco dentro** é decisão de layout, não de
  borda. Vira item próprio.
- **`tema-opcao`:** vira a variação "escolha-cartão" depois.
- **Escala de espaço:** vira lote próprio.

## 5. Arquivos

| Arquivo | O quê |
|---|---|
| `app/globals.css` | escala de seis degraus; tokens `--alt-*`, `--fundo-controle`, `--texto-discreto`, `--texto-discreto-sobre-placa` (no `:root` e nos dois blocos escuros); o "Guardar" em `--alt-campo`; o bloco "PAPÉIS DOS CONTROLES" e o campo em 16px, no fim |
| `DESIGN.md` | regerado: a escala nova e os tokens de cor novos |
| `docs/tokens.md` | a seção "Escala de texto: lote 2b — APLICADA", e a proposta de cinco marcada como substituída |
| `docs/botoes.md` | §12 |
| `docs/amostras.html` | reescrita |
| `docs/decisoes.md` | as decisões de 15/09 e os itens em aberto |
| `docs/estado/visual-controles-2-15-09.md` | este arquivo |
| `docs/estado/indice.md` | a linha deste arquivo |

---

## 6. Terceira rodada, no mesmo dia

Com as respostas do Victor às §0.1–0.5 acima, registradas em
`docs/decisoes.md` (15/09, "terceira rodada"). Medição completa em
`docs/botoes.md` §13.

### 6.1 O que foi feito

| Pedido | Resultado |
|---|---|
| "Guardar" em 54 | 54px. Em 54 ficaram 13 botões da família principal; em 48, os 5 colados em campo |
| Regras de contexto alinhadas ao papel | 5 alinhadas: 3 à principal (`.analise-saida`, `.proximo`, `.faixa-reconectar`) e 2 à discreta (`.command-card`, `.proof-actions`). **A `.side-support` parou**: o rótulo já quebra em duas linhas |
| Cartão sem borda fora do cadastro | aplicado com escopo `.canvas`: 11 telas do casco, e não só as 7. Quatro das 7 ainda misturam, todas com borda que carrega significado |
| Placeholders (exceção de `.tsx` só para texto) | "Valor em reais" cabe (29px de folga); "8 caracteres, com letra e número" cabe (39,1px de folga). Os seis dinâmicos estão listados com largura |
| Trava do `Campo.tsx:232` | `pnpm conferir:escolha-de-campo`, na cadeia do `pnpm conferir`. Passa 9/9 e falha 8/9, com saída 1, numa cópia sem o `<form>` |

**Verificação:**
```
$ pnpm conferir > conferir.log 2>&1; echo exit=$?
exit=0   (19 blocos "TUDO CERTO", incluindo o "9/9" da trava nova)
$ node .claude/skills/impeccable/scripts/detect.mjs --json app/globals.css
7 achados: os mesmos de antes do lote
javascript_tool → docs/amostras.html servida localmente: borda do .tips-card fora e dentro do .canvas; altura do "Guardar"
claro: rgb(217,227,230) fora · transparente dentro · Guardar 54 — escuro: rgb(28,40,64) fora · transparente dentro · Guardar 54
```

### 6.2 Contradições ditas antes de mexer

- **Das "seis regras que reduzem a principal", só três estavam em
  principal.** As outras eram `cta quiet` (discreta) e `cta ghost`
  (secundária, a lima). Cada uma foi alinhada ao próprio papel.
- **A `/expectativas` não é de fora do cadastro.** Ela entrou na lista das 7
  por erro meu no relatório anterior. Ficou de fora; a sétima tela é o
  esqueleto de carregamento da `/anuncios`.
- **O CSS não separa tela por tela.** O cartão sem borda vale para as 11
  telas do `.canvas`; as três a mais são `/conta`, `/meu-negocio` e
  `/revisar-perfil`. Na `/conta`, o `.escolhido` e o `.escolha-item` ficam com
  borda, dentro de um `.card` que perdeu a dele.

### 6.3 O que não deu certo

- **O `pnpm conferir` falhou uma vez nesta rodada:** `error TS2722` no script
  novo, por `passos[i]` possivelmente indefinido. Corrigido, e a rodada
  seguinte deu exit 0.
- **Uma medição saiu errada e foi refeita.** Com o painel do navegador no
  tamanho responsivo, que estava oculto, os campos mediram 0px de largura e
  os botões ficaram altos demais. Refeita em 375px. Os números acima são os
  da segunda medição.

### 6.4 O que depende de decisão humana, agora

1. **O botão lima do cartão de suporte** (`botoes.md` §13.2): rótulo mais
   curto, uma secundária compacta na barra, ou o botão sai do cartão.
2. **Os seis placeholders dinâmicos** (`botoes.md` §13.4): textos para o
   Victor encurtar.
3. **As bordas que ficaram por significado** em `/alertas`, `/criativos`,
   `/revisar-perfil/[proposta]` e `/saude-meta` (`botoes.md` §13.3).
4. **O cartão sobre fundo branco no cadastro**, que é layout. Em aberto em
   `decisoes.md`.

### 6.5 Arquivos desta rodada

| Arquivo | O quê |
|---|---|
| `app/globals.css` | o "Guardar" em `--alt-principal`; `.analise-saida .cta` e `.proof-actions .cta` removidas; `.proximo .cta` sem o 48; `.faixa-reconectar .cta` sem padding e tamanho menores; `.command-card .cta` só com a largura; o bloco "CARTÃO SEM BORDA" no fim |
| `app/(fluxo)/onboarding/contas/Contas.tsx` | só a string do placeholder |
| `app/(public)/redefinir/Form.tsx` | só a string do placeholder |
| `scripts/conferir-escolha-de-campo.ts` | novo: a trava |
| `package.json` | `conferir:escolha-de-campo` e a entrada na cadeia do `conferir` |
| `docs/botoes.md` | §13 |
| `docs/decisoes.md` | a entrada da terceira rodada e os itens em aberto |
| `docs/amostras.html` | "Guardar" na principal; o cartão no casco lendo o `.canvas` de verdade, sem a exceção |
