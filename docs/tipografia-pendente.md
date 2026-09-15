# Tipografia — o que está medido e ainda não foi usado

Entrada do lote de tipografia. **Só medida, sem proposta.** Levantado no
lote 2a, 14/09/2026, no servidor local (`pnpm dev`), em 375×812, tema claro.

## 1. A família `--body` hoje

```
$ grep -nE "^\s*--body:" app/globals.css
--body: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
```
É uma pilha de fonte de sistema. Nenhum arquivo de fonte é baixado para ela.
A única fonte baixada é o Archivo, que entra pelo `--display` (ver
`app/layout.tsx`).

```
$ grep -n "var(--body)" app/globals.css "app/(marketing)/lp.css"
app/globals.css:467 · 527 · 553 · 1390 · 1420 · 1799
app/(marketing)/lp.css:43 · 79
```
Em `app/globals.css:467`, a regra é `body { font-family: var(--body) }`.
Todo elemento que não declara outra família herda `--body` a partir dela.

## 2. A rota `/` lê `--body` diretamente

```
$ sed -n 43p "app/(marketing)/lp.css"
  font-family: var(--body);      (dentro de .lp { … })
```
Trocar o valor de `--body` muda o texto da landing.

## 3. Elementos com texto que leem `--body`, por rota pública

```
javascript_tool → por rota: elementos com nó de texto próprio cuja fontFamily computada é igual à do <body>, fora de button/input/select/textarea, agrupados por tag
```

| Rota | Elementos com texto | Leem `--body` | dos quais `<script>` | Leem `--body` sem `<script>` | Em Archivo |
|---|---:|---:|---:|---:|---:|
| `/` | 148 | 75 | 21 | 54 | 73 |
| `/entrar` | 21 | 12 | 7 | 5 | 9 |
| `/recuperar` | 16 | 11 | 7 | 4 | 5 |
| `/redefinir` | 14 | 11 | 7 | 4 | 3 |
| `/exclusao-de-dados/x` | 12 | 11 | 8 | 3 | 1 |

Por tag, sem `<script>`:

| Rota | Tags |
|---|---|
| `/` | `p` 21 · `span` 9 · `div` 8 · `a` 5 · `b` 4 · `li` 4 · `mark` 2 · `small` 1 |
| `/entrar` | `p` 3 · `div` 1 · `small` 1 |
| `/recuperar` | `p` 2 · `a` 1 · `small` 1 |
| `/redefinir` | `p` 2 · `a` 1 · `small` 1 |
| `/exclusao-de-dados/x` | `h1` 1 · `p` 1 · `small` 1 |

Os `<script>` foram contados porque o critério era "tem texto próprio". O
conteúdo deles não é desenhado na tela.

## 4. O que não foi medido

- **As 21 rotas com sessão** (as de `(protected)` e `(fluxo)`) **não foram
  medidas**. As duas camadas de proteção (`proxy.ts` e o `layout.tsx` de cada
  grupo) redirecionam para `/entrar` sem login, e esta sessão não faz login.
- **Pelo CSS**, o que vale lá é o mesmo mecanismo do §1: tudo que não declara
  `var(--display)` herda `--body`. Isso é leitura da regra, não contagem de
  elementos.

## 5. Tamanho da fonte dentro dos campos

```
javascript_tool → fontSize computado dos 35 campos visíveis, montados na cadeia de ancestrais real (docs/botoes.md §0)
35 campos · valores distintos: 13px, 13.3333px, 15px · abaixo de 16px: 35
```
Os 35 campos visíveis estão abaixo de 16px. Abaixo de 16px, o Safari do
iPhone aplica zoom ao focar o campo. A lista, campo a campo, está em
`docs/botoes.md` §5.

## 6. Lote 2b, 15/09/2026: `--body` começa por Archivo — APLICADO

```
$ grep -nE "^\s*--body:" app/globals.css
--body: var(--font-archivo), "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
```
A pilha de sistema continua atrás, como reserva. A mudança alcança a rota
`/` (§2), com autorização do Victor. O repositório `../lp` não foi tocado.

`DESIGN.md` foi regerado. As famílias não são lidas do CSS pelo script: estão
escritas nele (`scripts/gerar-design-md.mjs`), e a linha do `body` foi
trocada lá antes de regerar.

### 6.1 Antes e depois, rotas públicas, 375px

Primeiro por simulação (a regra injetada numa cópia da página dentro de um
`iframe` de 375px), depois pela página real com o CSS do disco, fazendo a
conta ao contrário: injetando o valor velho e comparando elemento a elemento
pelo índice.
```
javascript_tool → por rota, iframe 375×812: elementos com nó de texto próprio e visíveis; fontFamily computada, número de linhas (tops distintos dos getClientRects do texto), scrollWidth > clientWidth; com e sem a regra
```

| Rota | Elementos com texto visíveis | Liam `--body` antes | Mudaram de família | Mudaram de número de linhas | Passaram a transbordar | Página vaza na horizontal |
|---|---:|---:|---:|---:|---:|---|
| `/` | 124 | 54 | 54 | 0 | 0 | não → não |
| `/entrar` | 14 | 5 | 5 | 0 | 0 | não → não |
| `/recuperar` | 9 | 4 | 4 | 0 | 0 | não → não |
| `/redefinir` | 7 | 4 | 4 | 0 | 0 | não → não |
| `/exclusao-de-dados/x` | 4 | 3 | 3 | 0 | 0 | não → não |

Os números da página real batem com os da simulação nas cinco rotas.

Os "elementos com texto" daqui (124 na `/`) são menos que os da §3 (148),
porque agora só entram os visíveis e o `<script>` fica de fora.

Por tag, na `/`: `p` 21 · `span` 9 · `div` 8 · `a` 5 · `b` 4 · `li` 4 ·
`mark` 2 · `small` 1.

**O peso não é problema.** O `app/layout.tsx` pede Archivo em 500 e 700, e o
texto corrido é 400. Medido: a fonte que chega é variável e cobre o eixo
inteiro.
```
javascript_tool → [...document.fonts].filter(f => /archivo/i.test(f.family)).map(f => f.weight + " " + f.status)
"100 900 normal loaded"
```

### 6.2 O que não foi medido

- **As 21 rotas com sessão**, pelo motivo da §4. Pelo CSS, tudo o que herda
  `--body` lá passa a Archivo pelo mesmo mecanismo.
- **Aparelho real.** Navegador de desktop com a tela emulada em 375px.
- **Quebra de linha com o texto real do banco.** As rotas públicas não têm
  dado dinâmico. Nas com sessão, o texto da montagem não é o do cliente.
