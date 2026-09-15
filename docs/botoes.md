# Inventário de botões e campos — 14/09/2026

**Só relatório.** Nenhum código mudou por causa deste arquivo.

## 0. Como foi medido

### 0.1 A contagem

A varredura (`docs/varredura-visual.md` §3.2) contou `<button>` e campos com
`grep`, e `grep` conta texto, inclusive comentário. Aqui a contagem é do JSX
real, feita com o parser do TypeScript do próprio projeto. O script está no
§3 deste arquivo.

```
$ grep -rhoE "<button\b" app --include=*.tsx | wc -l
59
$ grep -rhoE "<(input|textarea|select)\b" app components --include=*.tsx | wc -l
72
$ grep -nE "<button\b|<(input|textarea|select)\b" "app/(protected)/criativos/CriarPeca.tsx"
13: * `<button>`, nenhum `<label for>`, nenhum alvo clicável. Três proibições
```
A linha 13 é comentário. Ela conta um `<button>` e um `<input>` a mais nas
duas contagens do `grep`.

```
$ node extrair-controles.cjs botoes > botoes.json   (e: campos > campos.json)
$ node -e '...totais...'
botoes JSX: 64 | em app/: 58 | components/ui/Button.tsx: 1 | components/ui/SeletorDeNicho.tsx: 5 | linhas de variante (fora Button.tsx): 66
campos JSX: 71 | type=hidden: 36 | visiveis: 35 | input: 68 | textarea: 3 | select: 0
```

- **Botões:** o inventário cobre os **58 de `app/`** (os "59" da varredura
  menos o comentário) e **mais 5 escritos à mão em
  `components/ui/SeletorDeNicho.tsx`**. A varredura só olhou `app/`, por isso
  eles não entraram lá. O `<button>` de `components/ui/Button.tsx` é o próprio
  componente e fica de fora.
- **Variantes de classe:** três botões trocam de classe por estado
  (`SeletorDeTema.tsx:34`, `Campo.tsx:232` e `SeletorDeNicho.tsx:172`). Cada
  estado foi medido como uma linha, e por isso são 63 botões em 66 linhas.
- **Campos:** são 71 reais, e 36 deles são `type="hidden"`, sem aparência.
  Os 35 visíveis foram medidos.

### 0.2 As propriedades

Medidas com `getComputedStyle` e `getBoundingClientRect` no painel de
navegador:

- **Página:** `http://localhost:3000/entrar`, que carrega o `globals.css` e o
  Archivo reais.
- **Tela e tema:** 375×812, tema claro.
- **Quando:** antes de qualquer mudança de CSS deste lote.
- **Como cada controle foi montado:** dentro da cadeia de ancestrais que o
  extrator achou. Ela sobe pelo JSX do próprio arquivo, pelo lugar onde o
  componente é usado, até a página, e acrescenta a casca do grupo:
  `div.app-shell > div.main > div.canvas` em `(protected)`, e
  `div.auth-shell > main.auth-wrap` em `(fluxo)` e `(public)`.

```
javascript_tool → medir(lista): para cada item, monta os ancestrais, insere o HTML do controle,
lê backgroundColor, color, borderTop*, borderTopLeftRadius, padding*, fontWeight, fontSize,
fontFamily, altura e largura do retângulo; agrupa por [fundo, cor, borda, raio, padding, peso, tamanho, família].
```

**Limites da medição**, que valem para toda linha abaixo:

- **Irmãos não entram na montagem.** Isso só faz diferença no `.mini-send`
  dentro de `.fallback-field`, uma linha flex que estica o botão até a altura
  do campo ao lado. Sozinho ele mediu 14px. Medido de novo com o `<input>`
  irmão:
  ```
  javascript_tool → .fallback-field com <input> + <button class="mini-send">, 375px
  miniSend: 44,7 × 41   input: 244,3 × 41
  ```
  A tabela usa 41.
- **`disabled` só entra quando o atributo é fixo no código.** Quando depende
  de estado (`disabled={enviando}`), mediu-se o botão habilitado.
- **Hover, foco e tema escuro:** não medidos.
- **Texto dinâmico** virou "Texto". A largura depende disso; a altura só muda
  se o texto quebrar linha.
- **Ancestrais que moram em variável** (`const bloco = <div>…</div>` usado
  como `{bloco}`) não aparecem na cadeia. O caso visível é
  `PerguntaDoDia.tsx:305`, montado direto sob `.canvas`.
- **`Chat.tsx:159` e `:240`** ganham a classe `shake` num estado de erro, e
  essa variante não foi medida.
- **`app/(protected)/layout.tsx:186` ("Sair")** tem `display: none` em 375px.
  Foi medido em 1280×800.

As cores estão em hex quando opacas; o valor medido veio em `rgb()` e a
conversão é exata. Onde o valor bate com um token, o nome aparece entre
parênteses. Isso é comparação de valor; a regra CSS de onde a cor veio não
foi lida.

---

## 1. Botões

### 1.1 Um por um

| # | Arquivo:linha | Classe | Fundo | Cor | Borda | Raio | Padding | Peso | Tamanho | Altura | Aparência |
|---:|---|---|---|---|---|---|---|---:|---|---:|---|
| 1 | `app/(fluxo)/aprovar/page.tsx:145` | `cta` (disabled) | #E3F6FE | #5A6977 | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B9 |
| 2 | `app/(fluxo)/aprovar/page.tsx:148` | `cta ghost` (disabled) | transparente | #0743DC | 1px solid #0743DC | 4px | 14px 16px | 700 | 15px Archivo | 46 | B8 |
| 3 | `app/(fluxo)/expectativas/Combinados.tsx:47` | `ec-back` | rgba(17,30,47,.06) | #111E2F | 0 | 50% | 1px 6px | 400 | 13,33px Segoe UI | 30 (×30) | B13 |
| 4 | `app/(fluxo)/expectativas/Combinados.tsx:102` | `ec-doubt` | transparente | #0743DC | 0 | 0 | 0 | 600 | 13px Segoe UI | 34 | B14 |
| 5 | `app/(fluxo)/expectativas/Combinados.tsx:123` | `cta quiet ec-prev` | transparente | #485A6B | 0 | 4px | 8px 0 | 600 | 15px Archivo | 32 | B15 |
| 6 | `app/(fluxo)/expectativas/Combinados.tsx:128` | `cta ec-next` | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B5 |
| 7 | `app/(fluxo)/expectativas/Combinados.tsx:133` | `cta ec-final` | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B5 |
| 8 | `app/(fluxo)/onboarding/Chat.tsx:201` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 9 | `app/(fluxo)/onboarding/Chat.tsx:212` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 10 | `app/(fluxo)/onboarding/Chat.tsx:227` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 11 | `app/(fluxo)/onboarding/Chat.tsx:255` | `mini-send` | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo | 41 | B7 |
| 12 | `app/(fluxo)/onboarding/contas/Contas.tsx:162` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 13 | `app/(fluxo)/onboarding/contas/Contas.tsx:207` | `mini-send` | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo | 41 | B7 |
| 14 | `app/(fluxo)/onboarding/contas/Contas.tsx:218` | `cta` | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B5 |
| 15 | `app/(fluxo)/onboarding/contas/Contas.tsx:232` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 16 | `app/(fluxo)/onboarding/contas/Contas.tsx:285` | `mini-send` | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo | 41 | B7 |
| 17 | `app/(fluxo)/onboarding/contas/Contas.tsx:297` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 18 | `app/(fluxo)/onboarding/contas/Contas.tsx:314` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 19 | `app/(fluxo)/onboarding/contas/Contas.tsx:330` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 20 | `app/(fluxo)/onboarding/contas/Contas.tsx:344` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 21 | `app/(fluxo)/onboarding/contas/Contas.tsx:360` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 22 | `app/(fluxo)/onboarding/contas/Contas.tsx:401` | `cta` (disabled) | #E3F6FE | #5A6977 | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B9 |
| 23 | `app/(fluxo)/verba/FormVerba.tsx:57` | `cta` | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B5 |
| 24 | `app/(fluxo)/verba/page.tsx:123` | `cta` (disabled) | #E3F6FE | #5A6977 | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B9 |
| 25 | `app/(protected)/conta/Identidade.tsx:78` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 26 | `app/(protected)/conta/Identidade.tsx:139` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 27 | `app/(protected)/conta/page.tsx:369` | `acct-row` (disabled) | transparente | rgba(16,16,16,.3) | 0 | 0 | 15px 0 | 400 | 13,33px Segoe UI | 67,8 | B10 |
| 28 | `app/(protected)/conta/page.tsx:376` | `acct-row` (disabled) | transparente | rgba(16,16,16,.3) | 0 | 0 | 15px 0 | 400 | 13,33px Segoe UI | 86,7 | B10 |
| 29 | `app/(protected)/conta/page.tsx:412` | `cta ghost` | transparente | #0743DC | 1px solid #0743DC | 4px | 14px 16px | 700 | 15px Archivo | 46 | B8 |
| 30 | `app/(protected)/conta/SeletorDeTema.tsx:34` | `tema-opcao picked` | #FEFEFE | #000000 | 1px solid #0743DC | 12px | 14px | 400 | 13,33px Segoe UI | 122,8 | B16 |
| 31 | `app/(protected)/conta/SeletorDeTema.tsx:34` | `tema-opcao` | #FEFEFE | #000000 | 1px solid #D9E3E6 | 12px | 14px | 400 | 13,33px Segoe UI | 122,8 | B17 |
| 32 | `app/(protected)/criativos/Analisar.tsx:283` | `cta ghost` | transparente | #0743DC | 1px solid #0743DC | 4px | 14px 16px | 700 | 15px Archivo | 46 | B8 |
| 33 | `app/(protected)/criativos/Analisar.tsx:318` | `cta` | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo | 44 | B5 |
| 34 | `app/(protected)/criativos/Analisar.tsx:346` | `cta ghost` | transparente | #0743DC | 1px solid #0743DC | 4px | 14px 16px | 700 | 15px Archivo | 46 | B8 |
| 35 | `app/(protected)/inicio/PerguntaDoDia.tsx:305` | `botao-leve` (em `.pd-convite`) | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 6px | 0 14px | 400 | 11px Archivo | 44 | B18 |
| 36 | `app/(protected)/inicio/PerguntaDoDia.tsx:361` | `botao-leve` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 999px | 5px 10px | 400 | 11px Archivo | 23 | B11 |
| 37 | `app/(protected)/inicio/PerguntaDoDia.tsx:399` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 38 | `app/(protected)/inicio/PerguntaDoDia.tsx:461` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 39 | `app/(protected)/inicio/PerguntaDoDia.tsx:483` | `mini-send` (em `.pd-guardar`) | #0743DC | #FFFFFF | 0 | 4px | 0 18px | 700 | 13px Archivo | 44 | B19 |
| 40 | `app/(protected)/inicio/PerguntaDoDia.tsx:503` | `botao-leve` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 999px | 5px 10px | 400 | 11px Archivo | 23 | B11 |
| 41 | `app/(protected)/layout.tsx:186` | `link-btn` (na sidebar) | transparente | rgba(241,246,247,.78) | 0 | 0 | 0 | 700 | 11px Archivo | 44 em 1280px; oculto em 375px | B20 |
| 42 | `app/(protected)/meu-negocio/Campo.tsx:80` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 43 | `app/(protected)/meu-negocio/Campo.tsx:89` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 44 | `app/(protected)/meu-negocio/Campo.tsx:100` | `btn-linha forte` | #111E2F | #F1F6F7 | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B6 |
| 45 | `app/(protected)/meu-negocio/Campo.tsx:104` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 46 | `app/(protected)/meu-negocio/Campo.tsx:232` | `btn-linha forte` (opção atual) | #111E2F | #F1F6F7 | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B6 |
| 47 | `app/(protected)/meu-negocio/Campo.tsx:232` | `btn-linha` (outra opção) | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 48 | `app/(protected)/meu-negocio/Campo.tsx:241` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 49 | `app/(protected)/meu-negocio/Campo.tsx:316` | `btn-linha forte` | #111E2F | #F1F6F7 | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B6 |
| 50 | `app/(protected)/meu-negocio/Campo.tsx:319` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 51 | `app/(protected)/meu-negocio/Campo.tsx:333` | `btn-texto` | transparente | #0743DC | 0 | 0 | 0 | 400 | 11px Segoe UI | 15,9 | B21 |
| 52 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:209` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 53 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:250` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 54 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:267` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 55 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:292` | `btn-linha forte` | #111E2F | #F1F6F7 | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B6 |
| 56 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:318` | `btn-linha` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B2 |
| 57 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:327` | `btn-linha fraco` | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B3 |
| 58 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:430` | `btn-linha forte` | #111E2F | #F1F6F7 | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI | 31 | B6 |
| 59 | `app/(public)/entrar/page.tsx:103` | `link-btn` (em `.auth-foot`) | transparente | #0743DC | 0 | 0 | 0 | 700 | 13px Archivo | 44 | B12 |
| 60 | `app/(public)/entrar/page.tsx:150` | `link-btn` (em `.auth-foot`) | transparente | #0743DC | 0 | 0 | 0 | 700 | 13px Archivo | 44 | B12 |
| 61 | `components/ui/SeletorDeNicho.tsx:146` | `mini-send` | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo | 41 | B7 |
| 62 | `components/ui/SeletorDeNicho.tsx:153` | `text-fallback` | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI | 44 | B4 |
| 63 | `components/ui/SeletorDeNicho.tsx:172` | `chip-opt picked` | #0743DC | #FFFFFF | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B22 |
| 64 | `components/ui/SeletorDeNicho.tsx:172` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 65 | `components/ui/SeletorDeNicho.tsx:205` | `chip-opt` | #FEFEFE | #0743DC | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo | 34 | B1 |
| 66 | `components/ui/SeletorDeNicho.tsx:238` | `mini-send` | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo | 41 | B7 |

"0" na coluna Borda é `0px none`. Linhas 11, 13, 16, 61 e 66: a altura 41 é a
da medição com o `<input>` irmão (§0.2).

### 1.2 Quantas aparências existem

**Agrupando por aparência idêntica** (as oito propriedades iguais: fundo,
cor, borda, raio, padding, peso, tamanho e família), **as 66 linhas são 22
aparências.** O agrupamento saiu da mesma chamada que mediu as linhas
(`agrupar(rb)`, §0.2).

| Aparência | Linhas | Fundo | Cor | Borda | Raio | Padding | Peso | Tamanho |
|---|---:|---|---|---|---|---|---:|---|
| **B1** `chip-opt` | 9 | #FEFEFE (`--surface`) | #0743DC (`--cobalt`) | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo |
| **B2** `btn-linha` | 7 | #FEFEFE | #111E2F (`--navy`) | 1px solid #D9E3E6 (`--line`) | 8px | 6px 12px | 500 | 13px Segoe UI |
| **B3** `btn-linha fraco` | 6 | #FEFEFE | #5A6977 (`--ink-mute`) | 1px solid #D9E3E6 | 8px | 6px 12px | 500 | 13px Segoe UI |
| **B4** `text-fallback` | 6 | transparente | #5A6977 | 0 | 0 | 0 | 400 | 11px Segoe UI |
| **B5** `cta` | 5 | #0743DC | #FFFFFF | 0 | 4px | 14px 16px | 700 | 15px Archivo |
| **B6** `btn-linha forte` | 5 | #111E2F | #F1F6F7 (`--offwhite`) | 1px solid transparente | 8px | 6px 12px | 500 | 13px Segoe UI |
| **B7** `mini-send` em `.fallback-field` | 5 | #0743DC | #FFFFFF | 0 | 4px | 0 16px | 700 | 13px Archivo |
| **B8** `cta ghost` | 4 | transparente | #0743DC | 1px solid #0743DC | 4px | 14px 16px | 700 | 15px Archivo |
| **B9** `cta` disabled | 3 | #E3F6FE (`--ice-soft`) | #5A6977 | 0 | 4px | 14px 16px | 700 | 15px Archivo |
| **B10** `acct-row` disabled | 2 | transparente | rgba(16,16,16,.3) | 0 | 0 | 15px 0 | 400 | 13,33px Segoe UI |
| **B11** `botao-leve` pílula | 2 | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 999px | 5px 10px | 400 | 11px Archivo |
| **B12** `link-btn` em `.auth-foot` | 2 | transparente | #0743DC | 0 | 0 | 0 | 700 | 13px Archivo |
| **B13** `ec-back` | 1 | rgba(17,30,47,.06) | #111E2F | 0 | 50% | 1px 6px | 400 | 13,33px Segoe UI |
| **B14** `ec-doubt` | 1 | transparente | #0743DC | 0 | 0 | 0 | 600 | 13px Segoe UI |
| **B15** `cta quiet ec-prev` | 1 | transparente | #485A6B (`--ink-soft`) | 0 | 4px | 8px 0 | 600 | 15px Archivo |
| **B16** `tema-opcao picked` | 1 | #FEFEFE | #000000 | 1px solid #0743DC | 12px | 14px | 400 | 13,33px Segoe UI |
| **B17** `tema-opcao` | 1 | #FEFEFE | #000000 | 1px solid #D9E3E6 | 12px | 14px | 400 | 13,33px Segoe UI |
| **B18** `botao-leve` em `.pd-convite` | 1 | #FEFEFE | #5A6977 | 1px solid #D9E3E6 | 6px | 0 14px | 400 | 11px Archivo |
| **B19** `mini-send` em `.pd-guardar` | 1 | #0743DC | #FFFFFF | 0 | 4px | 0 18px | 700 | 13px Archivo |
| **B20** `link-btn` na sidebar | 1 | transparente | rgba(241,246,247,.78) | 0 | 0 | 0 | 700 | 11px Archivo |
| **B21** `btn-texto` | 1 | transparente | #0743DC | 0 | 0 | 0 | 400 | 11px Segoe UI |
| **B22** `chip-opt picked` | 1 | #0743DC | #FFFFFF | 1px solid #0743DC | 999px | 9px 15px | 400 | 13px Archivo |

**Por família de classe, as 22 aparências vêm de 12 classes-base:**

| Classe-base | Aparências | O que separa uma da outra |
|---|---|---|
| `cta` | B5, B8, B9, B15 | modificador (`ghost`, `quiet`) e estado `disabled` |
| `btn-linha` | B2, B3, B6 | modificador (`fraco`, `forte`) |
| `chip-opt` | B1, B22 | estado `picked` |
| `tema-opcao` | B16, B17 | estado `picked` |
| `mini-send` | B7, B19 | contexto: `.pd-guardar` troca o padding e dá `min-height: 44px` |
| `botao-leve` | B11, B18 | contexto: dentro de `.pd-convite` o raio e o padding mudam |
| `link-btn` | B12, B20 | contexto: na sidebar a cor e o tamanho mudam |
| `text-fallback` | B4 | — |
| `acct-row` | B10 | — |
| `ec-back` | B13 | — |
| `ec-doubt` | B14 | — |
| `btn-texto` | B21 | — |

Duas observações que saem da tabela, sem juízo sobre elas:

- **Família da fonte:** `btn-linha`, `text-fallback`, `ec-doubt`,
  `btn-texto`, `tema-opcao`, `acct-row` e `ec-back` saem em Segoe UI (a
  família `--body`, do sistema). `cta`, `chip-opt`, `mini-send`,
  `botao-leve` e `link-btn` saem em Archivo.
- **Estilo nativo:** B10, B13, B16 e B17 medem `13,33px`, e os dois
  `tema-opcao` saem com cor `#000000`. Os dois valores são os padrões do
  Chromium para `<button>`. As regras CSS dessas classes não foram lidas
  para confirmar de onde vêm.

---

## 2. Campos de formulário

### 2.1 Os 36 sem aparência (`type="hidden"`)

```
$ node -e '...campos.json filter type==="hidden"...'
36
```

| Arquivo | Linhas |
|---|---|
| `app/(fluxo)/conectar/escolher/Formulario.tsx` | 56, 57, 58, 59 |
| `app/(protected)/conta/Identidade.tsx` | 77, 92, 138, 158 |
| `app/(protected)/conta/TrocarPagina.tsx` | 50 |
| `app/(protected)/meu-negocio/Campo.tsx` | 99, 230, 231, 270 |
| `app/(protected)/revisar-perfil/[proposta]/page.tsx` | 204, 205, 247, 248, 249, 262, 263, 264, 265, 266, 289, 290, 291, 299, 300, 301, 302, 324, 325, 326, 429 |
| `app/(public)/entrar/page.tsx` | 45, 116 |

### 2.2 Os 35 visíveis, um por um

| # | Arquivo:linha | Elemento | Fundo | Cor | Borda | Raio | Padding | Peso | Tamanho | Altura | Aparência |
|---:|---|---|---|---|---|---|---|---:|---|---:|---|
| 1 | `app/(fluxo)/conectar/escolher/Formulario.tsx:82` | `input[type=radio]` | transparente | #000000 | 0 | 0 | 0 | 400 | 13,33px Arial | 13 (×13) | C4 |
| 2 | `app/(fluxo)/conectar/escolher/Formulario.tsx:127` | `input[type=radio]` | transparente | #000000 | 0 | 0 | 0 | 400 | 13,33px Arial | 13 (×13) | C4 |
| 3 | `app/(fluxo)/onboarding/Chat.tsx:159` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 4 | `app/(fluxo)/onboarding/Chat.tsx:240` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 5 | `app/(fluxo)/onboarding/contas/Contas.tsx:193` | `input` (sem `type`) | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 6 | `app/(fluxo)/onboarding/contas/Contas.tsx:271` | `input` (sem `type`) | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 7 | `app/(fluxo)/verba/FormVerba.tsx:30` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 8 | `app/(protected)/conta/Formularios.tsx:26` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 9 | `app/(protected)/conta/Formularios.tsx:36` | `input[type=tel]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 10 | `app/(protected)/conta/Formularios.tsx:54` | `input[type=email]` (disabled) | rgba(17,30,47,.04) | #5A6977 | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C5 |
| 11 | `app/(protected)/conta/Formularios.tsx:62` | `input[type=password]` (disabled) | rgba(17,30,47,.04) | #5A6977 | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C5 |
| 12 | `app/(protected)/conta/Identidade.tsx:93` | `input[type=file].id-arquivo` | transparente | #485A6B | 0 | 0 | 0 | 400 | 13px Segoe UI | 220 (×301) | C6 |
| 13 | `app/(protected)/conta/Identidade.tsx:159` | `input[type=file].id-arquivo` | transparente | #485A6B | 0 | 0 | 0 | 400 | 13px Segoe UI | 220 (×301) | C6 |
| 14 | `app/(protected)/conta/TrocarPagina.tsx:55` | `input[type=radio]` | transparente | #000000 | 0 | 0 | 0 | 400 | 13,33px Arial | 13 (×13) | C4 |
| 15 | `app/(protected)/criativos/Analisar.tsx:200` | `input[type=file].sr-only` | transparente | #111E2F | 0 | 0 | 0 | 400 | 13,33px Arial | 1 (×1) | C8 |
| 16 | `app/(protected)/inicio/PerguntaDoDia.tsx:389` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 17 | `app/(protected)/inicio/PerguntaDoDia.tsx:436` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 18 | `app/(protected)/meu-negocio/Campo.tsx:276` | `input[type=text]` | #FFFFFF | #111E2F | 1px solid #D9E3E6 | 8px | 8px 10px | 400 | 13px Segoe UI | 35 | C3 |
| 19 | `app/(protected)/meu-negocio/Campo.tsx:286` | `input[type=text]` | #FFFFFF | #111E2F | 1px solid #D9E3E6 | 8px | 8px 10px | 400 | 13px Segoe UI | 35 | C3 |
| 20 | `app/(protected)/meu-negocio/Campo.tsx:296` | `textarea` | #FFFFFF | #111E2F | 1px solid #D9E3E6 | 8px | 8px 10px | 400 | 13px Segoe UI | 57 | C3 |
| 21 | `app/(protected)/meu-negocio/Campo.tsx:304` | `textarea` | #FFFFFF | #111E2F | 1px solid #D9E3E6 | 8px | 8px 10px | 400 | 13px Segoe UI | 57 | C3 |
| 22 | `app/(protected)/meu-negocio/Campo.tsx:306` | `input[type=text]` | #FFFFFF | #111E2F | 1px solid #D9E3E6 | 8px | 8px 10px | 400 | 13px Segoe UI | 35 | C3 |
| 23 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:304` | `textarea` | #F1F6F7 | #111E2F | 1px solid #D9E3E6 | 8px | 6px 9px | 400 | 13px Segoe UI | 48 | C7 |
| 24 | `app/(protected)/revisar-perfil/[proposta]/page.tsx:311` | `input[type=text]` | #F1F6F7 | #111E2F | 1px solid #D9E3E6 | 8px | 6px 9px | 400 | 13px Segoe UI | 31 | C7 |
| 25 | `app/(public)/entrar/page.tsx:48` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 26 | `app/(public)/entrar/page.tsx:59` | `input[type=tel]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 27 | `app/(public)/entrar/page.tsx:75` | `input[type=email]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 28 | `app/(public)/entrar/page.tsx:86` | `input[type=password]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 29 | `app/(public)/entrar/page.tsx:119` | `input[type=email]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 30 | `app/(public)/entrar/page.tsx:130` | `input[type=password]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 31 | `app/(public)/recuperar/page.tsx:30` | `input[type=email]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 32 | `app/(public)/redefinir/Form.tsx:17` | `input[type=password]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 33 | `app/(public)/redefinir/Form.tsx:29` | `input[type=password]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 12px 13px | 400 | 15px Segoe UI | 46 | C1 |
| 34 | `components/ui/SeletorDeNicho.tsx:130` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |
| 35 | `components/ui/SeletorDeNicho.tsx:220` | `input[type=text]` | #FEFEFE | #111E2F | 1px solid #D9E3E6 | 4px | 11px 12px | 400 | 13px Segoe UI | 41 | C2 |

### 2.3 Quantas aparências existem

**Os 35 campos visíveis são 8 aparências**, tiradas do mesmo agrupamento
(`agrupar(rc)`, §0.2):

| Aparência | Campos | Contexto | Fundo | Borda | Raio | Padding | Tamanho | Altura |
|---|---:|---|---|---|---|---|---|---|
| **C1** | 12 | `input` dentro de `.field` | #FEFEFE | 1px solid #D9E3E6 | 4px | 12px 13px | 15px Segoe UI | 46 |
| **C2** | 8 | `input` dentro de `.fallback-field` | #FEFEFE | 1px solid #D9E3E6 | 4px | 11px 12px | 13px Segoe UI | 41 |
| **C3** | 5 | `input` e `textarea` do editor de `/meu-negocio` | #FFFFFF | 1px solid #D9E3E6 | 8px | 8px 10px | 13px Segoe UI | 35 / 57 |
| **C4** | 3 | `radio` nativo, sem regra própria | transparente | 0 | 0 | 0 | 13,33px Arial | 13 |
| **C5** | 2 | C1 com `disabled` | rgba(17,30,47,.04) | 1px solid #D9E3E6 | 4px | 12px 13px | 15px Segoe UI | 46 |
| **C6** | 2 | `input[type=file].id-arquivo` | transparente | 0 | 0 | 0 | 13px Segoe UI | 220 |
| **C7** | 2 | `textarea` e `input` de `.rev-corrigir` | #F1F6F7 | 1px solid #D9E3E6 | 8px | 6px 9px | 13px Segoe UI | 48 / 31 |
| **C8** | 1 | `input[type=file].sr-only` (visualmente escondido) | transparente | 0 | 0 | 0 | 13,33px Arial | 1 |

Os campos de texto visíveis (C1, C2, C3, C5 e C7) usam dois raios (4px e
8px) e quatro paddings (12px 13px, 11px 12px, 8px 10px e 6px 9px). O C1 tem
tamanho de texto 15px; os outros, 13px.

---

## 3. O extrator

Copiado aqui porque o original vive numa pasta temporária da sessão. Roda com
`node extrair-controles.cjs botoes|campos` e lê o `typescript` de
`node_modules`.

<details>
<summary><code>extrair-controles.cjs</code> — o script inteiro</summary>

```js
// Uso: node extrair-controles.cjs botoes|campos > saida.json
// Lista os <button> (ou <input>/<textarea>/<select>) REAIS do JSX — comentário
// não conta —, com classes possíveis, ancestrais até o layout do grupo, e um
// HTML renderizável do elemento para medir estilo computado no navegador.
const path = require("path");
const fs = require("fs");
const ROOT = "C:/Users/victo/v2g-deploy/webapp";
const ts = require(path.join(ROOT, "node_modules/typescript"));

const modo = process.argv[2];
const TAGS = new Set(modo === "campos" ? ["input", "textarea", "select"] : ["button"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}
const arquivos = [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components"))].map((p) =>
  p.replace(/\\/g, "/"),
);
const fontes = new Map(
  arquivos.map((f) => [f, ts.createSourceFile(f, fs.readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)]),
);
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");

const ehElemento = (n) => ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n);
const abertura = (n) => (ts.isJsxElement(n) ? n.openingElement : n);
const nomeTag = (n) => abertura(n).tagName.getText();

function literais(e) {
  if (!e) return [null];
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [e.text];
  if (ts.isParenthesizedExpression(e)) return literais(e.expression);
  if (ts.isConditionalExpression(e)) return [...literais(e.whenTrue), ...literais(e.whenFalse)];
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
    return [...literais(e.right), ""];
  if (ts.isTemplateExpression(e)) {
    let combos = [e.head.text];
    for (const s of e.templateSpans) {
      const vals = literais(s.expression);
      combos = combos.flatMap((c) => vals.map((v) => c + (v === null ? "?" : v) + s.literal.text));
    }
    return combos;
  }
  return [null];
}
const norm = (s) => (s === null ? null : s.replace(/\s+/g, " ").trim());

function attrs(n) {
  const out = {};
  for (const p of abertura(n).attributes.properties) {
    if (!ts.isJsxAttribute(p)) { out["{...spread}"] = { tipo: "spread" }; continue; }
    const nome = p.name.getText();
    const ini = p.initializer;
    if (!ini) out[nome] = { tipo: "nu" };
    else if (ts.isStringLiteral(ini)) out[nome] = { tipo: "str", valor: ini.text };
    else if (ts.isJsxExpression(ini)) out[nome] = { tipo: "expr", texto: ini.expression ? ini.expression.getText() : "", valores: [...new Set(literais(ini.expression).map(norm))] };
  }
  return out;
}
function classes(n) {
  const a = attrs(n).className;
  if (!a) return [""];
  if (a.tipo === "str") return [norm(a.valor)];
  return a.valores ?? [null];
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const VOID = new Set(["input", "img", "br", "hr", "meta", "link"]);
const ATTRS_UTEIS = ["type", "placeholder", "rows", "viewBox", "width", "height", "value", "accept", "multiple", "min", "max", "step"];

function html(n, classeDaRaiz) {
  if (ts.isJsxText(n)) { const t = n.getText().replace(/\s+/g, " ").trim(); return t ? esc(t) : ""; }
  if (ts.isJsxExpression(n)) {
    if (!n.expression) return "";
    let jsx = null;
    const achar = (x) => { if (jsx) return; if (ehElemento(x) || ts.isJsxFragment(x)) { jsx = x; return; } ts.forEachChild(x, achar); };
    achar(n.expression);
    if (jsx) return html(jsx);
    const lit = literais(n.expression).find((v) => v);
    return lit ? esc(lit) : "Texto";
  }
  if (ts.isJsxFragment(n)) return n.children.map((c) => html(c)).join("");
  if (!ehElemento(n)) return "";
  const nome = nomeTag(n);
  const intrinseco = /^[a-z]/.test(nome);
  const tag = intrinseco ? nome : "span";
  const a = attrs(n);
  let s = `<${tag}`;
  const cls = classeDaRaiz !== undefined ? classeDaRaiz : classes(n)[0];
  if (cls) s += ` class="${esc(cls)}"`;
  if (!intrinseco) s += ` data-componente="${esc(nome)}"`;
  for (const k of ATTRS_UTEIS) {
    const v = a[k];
    if (v?.tipo === "str") s += ` ${k}="${esc(v.valor)}"`;
    else if (v?.tipo === "expr" && v.valores[0]) s += ` ${k}="${esc(v.valores[0])}"`;
  }
  for (const k of ["disabled", "checked", "readOnly", "required"]) if (a[k]?.tipo === "nu") s += ` ${k.toLowerCase()}`;
  if (VOID.has(tag)) return s + ">";
  s += ">";
  if (ts.isJsxElement(n)) s += n.children.map((c) => html(c)).join("");
  return s + `</${tag}>`;
}

// ancestrais JSX dentro do mesmo componente (atravessa .map e &&)
function ancestraisLocais(n) {
  const out = [];
  let p = n.parent;
  while (p && !ts.isSourceFile(p)) {
    if (ts.isJsxElement(p) && p !== n) out.unshift({ tag: nomeTag(p), classe: classes(p)[0] });
    p = p.parent;
  }
  return out;
}
function componenteDe(n) {
  let p = n;
  while (p.parent && !ts.isSourceFile(p.parent)) p = p.parent;
  if (ts.isFunctionDeclaration(p)) return p.name?.text ?? "default";
  if (ts.isVariableStatement(p)) return p.declarationList.declarations[0].name.getText();
  if (ts.isExportAssignment(p)) return "default";
  return null;
}
function usosJsx(sf, nome) {
  const out = [];
  const v = (x) => { if (ehElemento(x) && nomeTag(x) === nome) out.push(x); ts.forEachChild(x, v); };
  v(sf);
  return out;
}
function resolverImport(de, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.join(path.dirname(de), spec);
  else return null;
  return (base + ".tsx").replace(/\\/g, "/");
}
function ondeEUsado(arquivo, nome) {
  const sf = fontes.get(arquivo);
  const locais = usosJsx(sf, nome).filter((u) => componenteDe(u) !== nome);
  if (locais.length) return { arquivo, no: locais[0], total: locais.length };
  for (const [f, s] of fontes) {
    for (const st of s.statements) {
      if (!ts.isImportDeclaration(st) || resolverImport(f, st.moduleSpecifier.text) !== arquivo) continue;
      const cl = st.importClause;
      const nomesLocais = [];
      if (cl?.name && nome === "default") nomesLocais.push(cl.name.text);
      if (cl?.namedBindings && ts.isNamedImports(cl.namedBindings))
        for (const el of cl.namedBindings.elements) if ((el.propertyName ?? el.name).text === nome) nomesLocais.push(el.name.text);
      for (const nl of nomesLocais) { const us = usosJsx(s, nl); if (us.length) return { arquivo: f, no: us[0], total: us.length }; }
    }
  }
  return null;
}
function cadeia(arquivo, n, trilha, prof = 0) {
  const locais = ancestraisLocais(n);
  const comp = componenteDe(n);
  const nomeArq = path.basename(arquivo);
  if (nomeArq === "page.tsx" || nomeArq === "layout.tsx" || prof > 6 || !comp) return { ancestrais: locais, raiz: arquivo };
  const uso = ondeEUsado(arquivo, comp);
  if (!uso) { trilha.push(`${comp}: uso não encontrado`); return { ancestrais: locais, raiz: arquivo }; }
  trilha.push(`${comp} ← ${rel(uso.arquivo)}:${fontes.get(uso.arquivo).getLineAndCharacterOfPosition(abertura(uso.no).getStart()).line + 1}${uso.total > 1 ? ` (${uso.total} usos, 1º)` : ""}`);
  const acima = cadeia(uso.arquivo, uso.no, trilha, prof + 1);
  const envolve = ts.isJsxElement(uso.no) ? [] : [];
  return { ancestrais: [...acima.ancestrais, ...envolve, ...locais], raiz: acima.raiz };
}
function casca(raiz) {
  const r = rel(raiz);
  if (r === "app/(protected)/layout.tsx") return [];
  if (r.startsWith("app/(protected)/")) return [{ tag: "div", classe: "app-shell" }, { tag: "div", classe: "main" }, { tag: "div", classe: "canvas" }];
  if (r.startsWith("app/(fluxo)/") || r.startsWith("app/(public)/")) return [{ tag: "div", classe: "auth-shell" }, { tag: "main", classe: "auth-wrap" }];
  return [];
}

const itens = [];
for (const [f, sf] of fontes) {
  const v = (x) => {
    if (ehElemento(x) && TAGS.has(nomeTag(x))) {
      const trilha = [];
      const { ancestrais, raiz } = cadeia(f, x, trilha);
      const a = attrs(x);
      const variantes = classes(x);
      itens.push({
        arquivo: rel(f),
        linha: sf.getLineAndCharacterOfPosition(abertura(x).getStart()).line + 1,
        tag: nomeTag(x),
        type: a.type ? (a.type.tipo === "str" ? a.type.valor : `{${a.type.texto}}`) : null,
        disabled: a.disabled ? (a.disabled.tipo === "nu" ? "sempre" : `{${a.disabled.texto}}`) : null,
        classeFonte: a.className ? (a.className.tipo === "str" ? a.className.valor : `{${a.className.texto}}`) : null,
        variantes,
        raiz: rel(raiz),
        trilha,
        ancestrais: [...casca(raiz), ...ancestrais].map((z) => ({ tag: /^[a-z]/.test(z.tag) ? z.tag : "div", classe: z.classe ?? "" })),
        html: variantes.map((c) => html(x, c)),
      });
    }
    ts.forEachChild(x, v);
  };
  v(sf);
}
itens.sort((a, b) => (a.arquivo + String(a.linha).padStart(5, "0")).localeCompare(b.arquivo + String(b.linha).padStart(5, "0")));
process.stdout.write(JSON.stringify(itens, null, 1));
```

</details>

---

# Lote 2a — 14/09/2026: o que mudou nos controles

As medidas abaixo seguem o método do §0: montagem na cadeia de ancestrais,
com os irmãos da linha, em `http://localhost:3000/entrar`, 375×812, tema
claro.

- **Antes:** `window.__A`, medido antes de qualquer edição do lote.
- **Depois:** medido com o CSS novo carregado; cada script confere que as
  regras novas estão nas folhas antes de medir.
- **Área de toque, primeira passada:** varrida com `document.elementFromPoint`
  a partir do centro, em passos de 0,5px. Os valores vêm com +0,5.
- **Área de toque, provas dos grupos B e C:** calculada pelo `top`, `bottom` e
  `width` computados do `::after`, descontando a borda do botão. Testada com
  `elementFromPoint` nas bordas esquerda, centro e direita da área.
- **Área de toque antes do lote:** era a caixa visível. As classes
  `.alvo-em-texto` e `.alvo-redondo` foram criadas neste lote.

## 4. As 22 aparências: grupo, altura visível e área de toque

```
javascript_tool → para cada uma das 66 linhas: getBoundingClientRect (antes: window.__A; depois: CSS novo) + área de toque; agrupado por aparência
```

| Aparência | Classe | Linhas | Grupo | Altura visível antes → depois | Área de toque antes → depois (L × A) |
|---|---|---:|---|---|---|
| B1 | `chip-opt` | 9 | A | 34 → 44 | caixa (34) → 64,5–129 × 44,5 |
| B2 | `btn-linha` | 7 | A | 31 → 44 (48 → 48 em `revisar-perfil/[proposta]:319`, ao lado de textarea) | caixa (31) → 59,5–100,5 × 44,5 (e 68,5 × 48,5) |
| B3 | `btn-linha fraco` | 6 | A | 31 → 44 | caixa (31) → 64,5–136 × 44,5 |
| B4 | `text-fallback` | 6 | A | 44 → 44 | caixa (44) → 42,5–127 × 44,5 |
| B5 | `cta` | 5 | A | 44 → 44 | caixa (44) → 243,5–339,5 × 44–44,5 |
| B6 | `btn-linha forte` | 5 | A | 31 → 44 | caixa (31) → 59,5–115 × 44,5 |
| B7 | `mini-send` em `.fallback-field` | 5 | A | 41 → 48 (o campo ao lado foi a 48 e o botão acompanha) | caixa (41) → 45,5 × 48,5 |
| B8 | `cta ghost` | 4 | A | 46 → 46 | caixa (46) → 154,5–339,5 × 46,5 |
| B9 | `cta` disabled | 3 | A | 44 → 44 | caixa (44) → 297,5 × 44,5 |
| B10 | `acct-row` | 2 | nenhum (já passa de 44) | 68,8 / 86,7 → iguais | caixa → 305,5 × 68,5 / 305,5 × 87,5 |
| B11 | `botao-leve` | 2 | **B** em `PerguntaDoDia.tsx:361` ("Corrigir", dentro da frase) · **A** em `:503` ("Voltar para ontem", sozinho no parágrafo) | 23 → 25 (B) · 23 → 44 (A) | caixa (23) → **62,9 × 44** (B: 15px acima, 4px abaixo) · 124 × 44,5 (A) |
| B12 | `link-btn` em `.auth-foot` | 2 | A | 44 → 44 | caixa (44) → 55–84,5 × 44,5 |
| B13 | `ec-back` | 1 | **C** | 30 → 30 (círculo, `border-radius: 50%`) | caixa (30 × 30) → **44 × 44** (7px de cada lado) |
| B14 | `ec-doubt` | 1 | A | 34 → 44 | caixa (34) → 297,5 × 44,5 |
| B15 | `cta quiet` | 1 | A | 32 → 44 | caixa (32) → 297,5 × 44,5 |
| B16 | `tema-opcao picked` | 1 | nenhum (já passa de 44) | 122,8 → 122,8 | caixa → 339,5 × 119,5 |
| B17 | `tema-opcao` | 1 | nenhum (já passa de 44) | 122,8 → 122,8 | caixa → 339,5 × 119,5 |
| B18 | `botao-leve` em `.pd-convite` | 1 | A | 44 → 44 | caixa (44) → 122 × 44,5 |
| B19 | `mini-send` em `.pd-guardar` | 1 | A | 44 → 44 | caixa (44) → 87,5 × 44,5 |
| B20 | `link-btn` na sidebar | 1 | A | escondido em 375px · em 1280px: 44 → 44 | em 1280px: 44 × 44 → 44 × 44 |
| B21 | `btn-texto` | 1 | **B** | 15,9 → 18,8 (texto 11 → 13px) | caixa (15,9) → **94,8 × 44** (5px acima, 20,2px abaixo) |
| B22 | `chip-opt picked` | 1 | A | 34 → 44 | caixa (34) → 64,5 × 44,5 |

As regras estão no fim de `app/globals.css`, na seção "ALVO DE TOQUE".

- **A:** `min-height: 44px` pela classe (`.cta`, `.chip-opt`, `.btn-linha`,
  `.mini-send`, `.botao-leve`, `.link-btn`, `.text-fallback`, `.ec-doubt`).
- **B:** `.alvo-em-texto`, uma área invisível no `::after`, limitada ao vão
  livre.
- **C:** `.alvo-redondo`, a mesma área invisível, com 44 × 44.

### 4.1 Grupo C, `ec-back`: por que não cresceu de verdade

```
javascript_tool → .ec-back com width/height 44px simulado, dentro do .ec-top real, 375px
linha .ec-top: 49 → 63 · rótulo .ec-label: x 81 → 95 · .ec-progress: y 49 → 56
```
O botão de 44×44 empurrava a linha. Por isso ficou o círculo de 30px com a
área invisível de 44×44. Prova final no §4.3.

### 4.2 Grupo B: a primeira versão falhou, e como ficou

**Primeira versão: área centrada de 44px.** O "deixe em branco" roubava
toque dos botões de cima:
```
javascript_tool → faixa da área invisível contra as caixas de .rc-acoes; elementFromPoint a cada 0,5px, 375px
sobreposição: 2,6px × 43,8px ("salvar") e 43px ("deixa como estava") · de y 162,0 a 165,0, quem recebe o toque: btn-texto
```

**Decisão do Victor:** a área não pode passar do vão livre, com 4px de folga
dos vizinhos clicáveis para cima e para baixo. Se a área ficar abaixo de
30px, o assunto vai para o lote 2b.

**O vão medido, com a vizinhança real remontada:**

- B21: o `form.rc-editor` inteiro e o `.rc-campo` seguinte da lista.
- B11: o `.inicio-topo` com o `.cta` do `.proximo` acima, e o `Convite`.
- C: o `.ec-top` e o `.ec-steps` com o `.ec-nav` abaixo.

```
javascript_tool → clicável mais perto acima e abaixo (sobreposição horizontal com a caixa), vão até ele, área possível com 4px de folga e teto de 44px
```

| Controle | Largura | Clicável acima (vão) | Clicável abaixo (vão) | Área possível |
|---|---|---|---|---|
| B21 | 320 · 375 · 1280 | "salvar" / "deixa como estava" (10px) | "contar agora" (102,5 · 102,5 · 140,9px) | 44 |
| B11 com Convite | 375 | nenhum dentro do parágrafo | "Preencher …" (10px) | 44 |
| B11 com Convite | 320 · 1280 | nenhum dentro do parágrafo | "Preencher …" (38,2px) | 44 |
| B11 sem Convite | 320 · 375 · 1280 | nenhum | nenhum | 44 |
| C `ec-back` | 375 | nenhum | "Próximo" (157,7px) | 44 |

O B21 alcança 44px. Não chegou perto dos 30px.

**Como ficou no CSS:**

- Sem vizinho perto, a área é centrada.
- Com vizinho perto, o controle declara `--alvo-topo` e `--alvo-base`, o `top`
  e o `bottom` do `::after`:
  ```css
  .btn-texto.alvo-em-texto  { --alvo-topo: -5px; --alvo-base: calc(100% - 39px); }
  .botao-leve.alvo-em-texto { --alvo-topo: calc(100% - 39px); --alvo-base: -5px; }
  ```
  `calc(100% - 39px)` dá uma extensão de 39 menos a altura do botão. Somada aos
  5px do outro lado, a área dá 44px com qualquer altura de botão.
- **A folga ficou em 5px, e não em 4.** Com a área a 4,0px do vizinho, o ponto
  4px acima dela caiu na última linha de pixel do "deixa como estava", e o
  navegador contou esse ponto como dentro do vizinho (1280px, B21). Com 5px, o
  ponto a 4px fica fora.
- **O B11 tem borda de 1px**, e os valores contam da borda interna. Medida na
  caixa com borda, a área do "Corrigir" sobe 15px e desce 4px, a 6px do
  "Preencher" em 375px.

### 4.3 Prova final dos três

```
javascript_tool → __prova3: área = caixa ± borda ± top/bottom computados do ::after; elementFromPoint no topo (+0,5), meio, base (−0,5), 4px acima e 4px abaixo da área, cada um na borda esquerda (+1), centro e borda direita (−1). Esperado: o próprio dentro; não clicável fora
```

| Caso | Largura | Caixa | Área (acima / abaixo da caixa) | Vão até clicável acima / abaixo da área | Pontos com falha |
|---|---|---|---|---|---:|
| B21 "deixe em branco" | 375 | 94,8 × 18,8 | 94,8 × 44 (5 / 20,2) | "salvar" 5 / "contar agora" 82,3 | 0 de 15 |
| B21 | 320 | 94,8 × 18,8 | 94,8 × 44 (5 / 20,2) | "salvar" 5 / "contar agora" 82,3 | 0 de 15 |
| B21 | 1280 | 94,8 × 18,8 | 94,8 × 44 (5 / 20,2) | "deixa como estava" 5 / "contar agora" 120,7 | 0 de 15 |
| B11 "Corrigir", com Convite | 375 | 64,9 × 25 (borda 1px) | 62,9 × 44 (15 / 4) | "Ver a peça" 30 / "Preencher …" 6 | 0 de 15 |
| B11, com Convite | 320 | 64,9 × 25 | 62,9 × 44 (15 / 4) | "Ver a peça" 50,1 / "Preencher …" 34,1 | 0 de 15 |
| B11, com Convite | 1280 | 64,9 × 25 | 62,9 × 44 (15 / 4) | nenhum / "Preencher …" 34,1 | 0 de 15 |
| B11, sem Convite | 375 | 64,9 × 25 | 62,9 × 44 (15 / 4) | "Ver a peça" 30 / nenhum | 0 de 15 |
| B11, sem Convite | 320 | 64,9 × 25 | 62,9 × 44 (15 / 4) | "Ver a peça" 50,1 / nenhum | 0 de 15 |
| B11, sem Convite | 1280 | 64,9 × 25 | 62,9 × 44 (15 / 4) | nenhum / nenhum | 0 de 15 |
| C `ec-back` | 375 | 30 × 30 | 44 × 44 (7 / 7) | nenhum / "Próximo" 150,7 | 0 de 15 |
| C `ec-back` | 320 | 30 × 30 | 44 × 44 (7 / 7) | nenhum / "Próximo" 150,7 | 0 de 15 |
| C `ec-back` | 1280 | 30 × 30 | 44 × 44 (7 / 7) | nenhum / "Próximo" 415 | 0 de 15 |

A saída completa em 375px, ponto a ponto:

**B21:**
```
topo      227   → o próprio · o próprio · o próprio
meio      248,5 → o próprio · o próprio · o próprio
base      270   → o próprio · o próprio · o próprio
4px acima 222,5 → não clicável (form.rc-editor) nas três
4px abaixo 274,5 → não clicável (div.rc-campo) nas três
```
**B11, com Convite:**
```
topo      218,3 → o próprio · o próprio · o próprio
meio      239,8 → o próprio · o próprio · o próprio
base      261,3 → o próprio · o próprio · o próprio
4px acima 213,8 → não clicável (div.canvas) nas três
4px abaixo 265,8 → não clicável (p.rc-tranquilo) nas três
```
**C, `ec-back`:**
```
topo      34,5 → o próprio · o próprio · o próprio
meio      56   → o próprio · o próprio · o próprio
base      77,5 → o próprio · o próprio · o próprio
4px acima 30   → não clicável (section.auth-card) nas três
4px abaixo 82  → não clicável (div.ec-top no centro e à direita; section.auth-card à esquerda)
```

A altura do parágrafo não muda com a área:
```
javascript_tool → altura do parágrafo com a área e com ::after { display: none }
"Corrigir":        antes do lote (11px) 23 · agora com a área 25 · sem a área 25
"deixe em branco": antes do lote (11px) 15,9 · agora com a área 34,8 · sem a área 34,8 (a frase quebrou em 2 linhas com 13px, o que é aceito)
```

**O que esta prova não cobre:**

- **É montagem.** O que fica fora do componente, na página real com sessão,
  foi remontado a partir do JSX lido: o `.inicio-topo` na `/inicio` e o
  `.rc-campo` seguinte na `/meu-negocio`.
- **Os valores do "Corrigir" dependem de onde o texto quebra.** A quebra
  muda com os valores respondidos. Foram medidos os textos da montagem, em
  três larguras.

## 5. Campos

### 5.1 Altura: 48px para campo de texto

```
javascript_tool → os 35 campos visíveis, antes (CSS do lote 1) e com a regra de 48px: altura do campo, da linha e dos botões vizinhos
```

| Campo | Antes | Depois | Linha onde vive | Botão vizinho |
|---|---|---|---|---|
| C2, `.fallback-field` / `.city-row` (`Chat.tsx:159`, `:240` · `Contas.tsx:193`, `:271` · `SeletorDeNicho.tsx:130`, `:220`) | 41 | 48 | 41 → 48 | `mini-send` 41 → 48, crescem juntos |
| C2, `PerguntaDoDia.tsx:389` e `:436` | 54 | 54 | 54 | `text-fallback` 44 |
| C3, `rc-faixa` (`Campo.tsx:276`, `:286`) | 35 | 48 | 53 → 66 | — |
| C3, input do editor (`Campo.tsx:306`) | 35 | 48 | 84 → 110 (inclui o `.rc-acoes` a 44) | o `.rc-acoes` fica em outra linha |
| C3, textarea (`Campo.tsx:296`, `:304`) | 57 | 57 | — | — |
| C7, input do `rev-corrigir` (`revisar-perfil/[proposta]:312`) | 31 | 48 | 31 → 48 | `btn-linha` 31 → 48, crescem juntos |
| C7, textarea do `rev-corrigir` (`:305`) | 48 | 48 | 48 | `btn-linha` 48 |
| C1 e C5, `.field input` (12 + 2 campos) | 46 | 48 | +2px | — |

Nenhuma linha quebrou.

### 5.2 Rádios: o alvo é o rótulo

```
node → campos-v2.json: type radio|checkbox, e se o contexto do input começa por <label>
radio/checkbox: 3 · checkbox: 0 · envolvidos por <label>: 3
javascript_tool → getBoundingClientRect do <label> e elementFromPoint no topo e na base, 375px
```

| Rádio | Associação | Caixinha | Rótulo (área clicável) | Clique no topo / na base do rótulo |
|---|---|---|---|---|
| `conectar/escolher/Formulario.tsx:82` | envolvimento (`<label class="escolha-item">` em volta) | 13 × 13 | 297 × 64,8 | rótulo / rótulo |
| `conectar/escolher/Formulario.tsx:127` | envolvimento | 13 × 13 | 297 × 64,8 | rótulo / rótulo |
| `conta/TrocarPagina.tsx:55` | envolvimento | 13 × 13 | 339 × 64,8 | não varrido |

Os três rótulos já passam de 44px, então **nenhuma regra foi aplicada**. Não
há rádio sem rótulo associado.

### 5.3 Input de arquivo: fora deste lote

Ficam como estão, como item do lote 2b:

- `conta/Identidade.tsx:93` (`.id-arquivo`);
- `conta/Identidade.tsx:159` (`.id-arquivo`);
- `criativos/Analisar.tsx:200` (`.sr-only`, com o `<label class="analise-alvo">`
  como alvo visível).

O pedido citava "n3 e n4" do `docs/varredura-visual.md`, e a varredura não
tem esses nomes:
```
$ grep -nE "\bn[34]\b" docs/varredura-visual.md
(vazio)
```

### 5.4 Tamanho da fonte dentro dos campos (só medida)

```
javascript_tool → fontSize computado dos 35 campos visíveis, 375px
valores: 13px, 13.3333px, 15px · abaixo de 16px: 35 de 35
```

| Tamanho | Campos |
|---|---|
| 15px | `verba/FormVerba.tsx:30` · `conta/Formularios.tsx:26`, `:36`, `:54`, `:62` · `entrar/page.tsx:48`, `:59`, `:75`, `:86`, `:119`, `:130` · `recuperar/page.tsx:30` · `redefinir/Form.tsx:17`, `:29` |
| 13px | `onboarding/Chat.tsx:159`, `:240` · `onboarding/contas/Contas.tsx:193`, `:271` · `conta/Identidade.tsx:93`, `:159` · `inicio/PerguntaDoDia.tsx:389`, `:436` · `meu-negocio/Campo.tsx:276`, `:286`, `:296`, `:304`, `:306` · `revisar-perfil/[proposta]/page.tsx:305`, `:312` · `SeletorDeNicho.tsx:130`, `:220` |
| 13,33px | `conectar/escolher/Formulario.tsx:82`, `:127` · `conta/TrocarPagina.tsx:55` · `criativos/Analisar.tsx:200` |

Não consertado.

## 6. Piso de 13px no texto dos controles

A mudança foi por classe:

- `.text-fallback`, `.botao-leve` e `.btn-texto` trocaram `var(--fs-legenda)`
  por `var(--fs-corpo)`;
- o `.link-btn` saiu do seletor de contexto `.side-account .who …`, que o
  prendia em 11px.

```
javascript_tool → fontSize das 66 linhas antes (window.__A) e depois
B4 11 → 13 · B11 11 → 13 · B18 11 → 13 · B20 11 → 13 · B21 11 → 13
escala de tamanho que sobrou nos botões: 15px, 13.3333px, 13px
```
O `13.3333px` é o tamanho padrão do Chromium para `<button>`. Aparece em
B10, B13, B16 e B17, que não declaram `font-size`. **Item do lote 2b.**

O B20, na barra lateral, medido no lugar certo:
```
javascript_tool → .side-account montada em 1280×800, antes e depois
fonte 11 → 13px · botão 44×44 → 44×44 · bloco .who 58 → 58 · .side-account 78 → 78
```
A barra inferior de cinco itens não é afetada: a regra do rótulo dela
(`.nav-item`) não foi tocada.
```
javascript_tool → .nav-item span, 375px: fontSize e scrollWidth > clientWidth
Início, Criativos, Anúncios, Avisos, Conta: 11px, nenhum cortado
```

### 6.1 Contraste dos cinco que subiram (só medida)

```
javascript_tool → razão WCAG da cor do texto contra a composição dos background-color dos ancestrais da montagem, data-tema claro e escuro
```

| Aparência | Claro | Escuro |
|---|---|---|
| B4 `text-fallback` | 5,59:1 (#5A6977 sobre #FEFEFE) | 5,35:1 (#7D8CA1 sobre #0C1523) |
| B11 `botao-leve` | 5,59:1 | 5,35:1 |
| B18 `botao-leve` em `.pd-convite` | 5,59:1 | 5,35:1 |
| B20 `link-btn` na sidebar | 9,77:1 (rgba(241,246,247,.78) sobre #111E2F) | 7,56:1 (rgba(233,239,248,.66) sobre #080E1A) |
| B21 `btn-texto` | 7,32:1 (#0743DC sobre #FEFEFE) | 5,54:1 (#5C88FA sobre #0C1523) |

Nenhum abaixo de 4,5:1. Um fundo de imagem na página real **não foi
medido**.

## 7. Família: Archivo nos controles

```
javascript_tool → fontFamily das 66 linhas de botão e dos 35 campos, CSS novo, 375px
101 medidos · Archivo: 95 · fora: 6
```
Os 6 fora estão excluídos por decisão, porque não têm texto próprio:

- **Rádios, em Arial:** `conectar/escolher/Formulario.tsx:82` e `:127`,
  `conta/TrocarPagina.tsx:55`.
- **Arquivo, em Segoe UI:** `conta/Identidade.tsx:93` e `:159`.
- **Arquivo, em Arial:** `criativos/Analisar.tsx:200` (`.sr-only`,
  invisível).

Largura das 10 aparências que trocaram de família:
```
javascript_tool → scrollWidth/clientWidth, largura do texto (Range), altura do controle e da linha; antes e com a regra de família simulada, 375px
transborda depois: nenhuma · linha que quebrou: nenhuma · peso, tamanho e line-height: iguais nas 10
```
Com o Archivo, o `btn-linha` e o `ec-doubt` ficaram mais baixos, porque a
métrica de linha dele é outra. O grupo A levou os dois de volta a 44:
```
btn-linha 31 → 28 (só família) · ec-doubt 34 → 28 (só família)
```

## 8. Links com classe do grupo A

A regra lê a classe, então também atinge os `<a class="cta">`:
```
node extrair-controles-v3.cjs links → 81 <a> no JSX · 26 com classe do grupo A (todos .cta)
javascript_tool → os 26 montados, com e sem min-height:44px, 375px
```
Mudaram 3, sem quebrar a linha:

- `onboarding/Trilha.tsx:172` e `:175` (`cta quiet`): 36 → 44, bloco
  80 → 96;
- `components/ui/FaixaReconectar.tsx:62`: 36 → 44, faixa 71,5 → 78, texto
  vizinho recentralizado.

O `layout.tsx:176` (`cta ghost`, no cartão de suporte da barra lateral) fica
escondido em 375px. Medido em 1280×800:
```
javascript_tool → .side-support montado, com e sem o grupo A
link 34 → 44 · cartão .side-support 121 → 131
```

## 9. A rota `/`

```
javascript_tool → http://localhost:3000/, CSS novo
controles nativos: 0 · elementos que casam com a regra de família ou de campo: 0 · com classe dos grupos A/B/C: 0
```
Nenhuma regra deste lote casa com elemento da `/`.

---

# Lote 2b — 15/09/2026: os cinco papéis e o campo em 16px

**Proposta e medição. Nada deste bloco foi aplicado ao `globals.css`.**

Método do §0, com dois acréscimos:

- **Simulação:** a regra proposta foi injetada num `<style>` no fim do
  `<head>` da `/entrar` e retirada depois de medir. O arquivo simulado
  ficou fora do repositório. As regras estão reproduzidas no §10.4.
- **Contraste:** a tinta foi comparada com o fundo composto: o fundo do
  próprio controle sobre o de todos os ancestrais. O `opacity` de ancestral
  não entra.

```
node extrair-controles.cjs botoes|campos   (o script do §3, recriado a partir deste arquivo)
javascript_tool → __bancada.rodar({tema}) antes; injetar(proposta); rodar claro e escuro; remover; agrupar por aparência
botoes JSX: 64 | sem Button.tsx: 63 | linhas de variante: 66 · campos JSX: 71 | hidden: 36 | visiveis: 35
linhas cuja classe não confere com a aparência do §1.1: 0
```

**Um artefato da medição, dito para não parecer mudança.** A borda sai
`0.8px` em todas as leituras. O CSS declara `1.5px` e `1px`; na tela emulada
o navegador arredonda a borda para pixel de tela. As tabelas abaixo usam o
valor declarado.

## 10. Item 1 — o mapeamento, antes de aplicar

### 10.1 O que muda em cada uma das 22

Antes = CSS de agora, já com o raio do item 3. Depois = com o mapeamento
simulado. Célula vazia = não muda.

| Ap. | Classe | Linhas | Papel | Altura | Fundo | Cor | Borda | Raio | Peso | Tamanho | Contraste claro | Contraste escuro |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| B5 | `cta` | 5 | principal | 44 → **54** | | | | | | 15 → **16** | 7,38 | 8,70 |
| B7 | `mini-send` ao lado de campo | 5 | principal | 48 → **54** ¹ | | | | | | 13 → **16** | 7,38 | 8,70 |
| B19 | `mini-send` em `.pd-guardar` | 1 | principal | 44 → 44 ² | | | | | | 13 → **16** | 7,38 | 8,70 |
| B8 | `cta ghost` | 4 | secundária | 46 → **54** | transparente → `--fundo-controle` | | 1.5px cobalto → 0 | | | 15 → **16** | 7,32 / 6,77 → 6,50 / 6,03 | 5,54 / 6,00 → 4,89 / 5,45 |
| B2 | `btn-linha` | 7 | secundária | 44 → **54** | #FEFEFE → `--fundo-controle` | #111E2F → **cobalto** | 1px `--line` → 0 | | 500 → **700** | 13 → **16** | 16,65 → 6,50 / 6,03 | 15,84 → 4,89 / 5,45 |
| B6 | `btn-linha forte` | 5 | secundária ³ | 44 → **54** | **#111E2F → `--fundo-controle`** | #F1F6F7 → cobalto | | | 500 → **700** | 13 → **16** | 15,41 → 6,50 / 6,03 | 15,41 → 4,89 / 5,45 |
| B4 | `text-fallback` | 6 | discreta | | | | | | 400 → **600** | 13 → **14** | 5,59 | 5,35 |
| B21 | `btn-texto` | 1 | discreta | 18,9 → 20,3 ⁴ | | **cobalto → #5A6977** ⁵ | | | 400 → **600** | 13 → **14** | 7,32 → 5,59 | 5,54 → 5,35 |
| B14 | `ec-doubt` | 1 | discreta | | | **cobalto → #5A6977** ⁵ | | | | 13 → **14** | 7,32 → 5,59 | 5,54 → 5,35 |
| B15 | `cta quiet` | 1 | discreta | | | #485A6B → #5A6977 | | | | 15 → **14** | 7,06 → 5,59 | 8,28 → 5,35 |
| B3 | `btn-linha fraco` | 6 | discreta | | #FEFEFE → transparente | | 1px `--line` → 0 | | 500 → **600** | 13 → **14** | 5,59 → 5,59 / 5,18 | 5,35 → 5,35 / 5,79 |
| B12 | `link-btn` em `.auth-foot` | 2 | discreta | | | **cobalto → #5A6977** ⁵ | | | 700 → 600 | 13 → **14** | 7,32 → 5,59 | 5,54 → 5,35 |
| B20 | `link-btn` na barra lateral | 1 | discreta, sobre placa | oculto em 375px | | | | | 700 → 600 | 13 → **14** | 9,77 | 7,56 |
| B1 | `chip-opt` | 9 | escolha | | #FEFEFE → `--fundo-controle` | cobalto → #111E2F ⁶ | 1.5px cobalto → 0 | | 400 → **600** ⁶ | 13 → **14** ⁶ | 7,32 → 14,80 | 5,54 → 13,98 |
| B22 | `chip-opt picked` | 1 | escolha, marcada | | | | 1.5px cobalto → 0 | | 400 → **600** | 13 → **14** | 7,38 | 8,70 |
| B11 | `botao-leve` | 2 | escolha | 25 → 24 no "Corrigir" ⁴ · 44 no outro | #FEFEFE → `--fundo-controle` | #5A6977 → #111E2F | 1px `--line` → 0 | | 400 → **600** | 13 → **14** | 5,59 → 13,71 / 14,80 | 5,35 → 15,57 / 13,98 |
| B18 | `botao-leve` em `.pd-convite` | 1 | escolha | | #FEFEFE → `--fundo-controle` | #5A6977 → #111E2F | 1.5px `--line` → 0 | **12px → 999px** | 400 → **600** | 13 → **14** | 5,59 → 13,71 | 5,35 → 15,57 |
| B13 | `ec-back` | 1 | ícone | **30×30 → 44×44** ⁷ | navy 6% → `--fundo-controle` (mesmo tom) | | | | | | 14,80 | 13,98 |
| B9 | `cta` desabilitado | 3 | **fora** ⁸ | | | | | | | | 5,07 | 4,75 |
| B10 | `acct-row` desabilitada | 2 | **fora** | | | | | | | | | |
| B16 | `tema-opcao picked` | 1 | **fora** | | | | | | | | | |
| B17 | `tema-opcao` | 1 | **fora** | | | | | | | | | |

Onde há dois valores separados por `/`, a aparência vive em dois fundos: o
primeiro é o cartão, o segundo é a página.

**As notas são os casos para decidir.** Nenhum foi resolvido sozinho:

1. **B7: o campo ao lado cresce junto.** Com o botão em 54, a linha
   `.fallback-field` estica o `<input>` de 48 para 54 em 7 campos:
   `Chat.tsx:240` · `Contas.tsx:193`, `:271` · `PerguntaDoDia.tsx:389`,
   `:436` · `SeletorDeNicho.tsx:130`, `:220`. As saídas: o mini-send fica em
   48, a altura do campo, e deixa de ser uma principal "cheia"; ou o campo
   vai a 54.
2. **B19: a regra de contexto vence.** O `.fallback-field.pd-guardar
   .mini-send` declara `min-height: 44px` com especificidade maior, e a
   simulação não chegou nele. Se o B19 é principal, essa regra precisa entrar
   no mapeamento. A leitura "antes" deu 48 porque a montagem pôs um `<input>`
   irmão que o "Guardar" não tem. O lote 2a mediu 44 (§4).
3. **B6: `forte` hoje é a ação mais forte da linha, e marca a opção atual.**
   Em `Campo.tsx:232` o `forte` diz qual das opções está valendo e o
   `btn-linha` comum é a outra. Como secundária, as duas ficam iguais e a
   tela perde o estado. Nas outras quatro linhas (`Campo.tsx:100`, `:316` ·
   `revisar-perfil/[proposta]:292`, `:430`), a ação escura vira cinza-claro,
   com o mesmo peso da vizinha. Pergunta: o B6 é principal? E o
   `Campo.tsx:232` é escolha?
4. **B21 e o "Corrigir" do B11 moram dentro de uma frase.** Ficam fora do
   `min-height` e mantêm a área de toque invisível do lote 2a (grupo B). A
   pílula de 44px não aparece neles.
5. **Três links viram cinza.** "deixe em branco" (B21), "Ficou alguma
   dúvida?" (B14) e "Entrar" / "Criar conta" no rodapé do `/entrar` (B12)
   eram cobalto. Como discreta, perdem a cara de link. É o que o papel diz,
   mas o B12 é o caminho de quem já tem conta.
6. **A escolha não tem cor, peso nem tamanho de texto no desenho.** Nenhum
   dos dois HTML de `docs/desenho/` tem chip. Usei `--texto-forte`, 600 e
   14px, e isso é palpite meu: confirme ou troque.
7. **B13: 44×44 visível empurra o topo.** O lote 2a mediu: a linha `.ec-top`
   vai de 49 para 63 e o rótulo desloca 14px (§4.1). Por isso lá ficou o
   círculo de 30px com área invisível de 44. Não foi remedido aqui.
8. **B9: um defeito da minha simulação, e ele ensina uma coisa.** Com a
   regra `.cta:not(.ghost):not(.quiet)` (especificidade 0,3,0), o botão
   desabilitado herdou o cobalto e passou a parecer habilitado (5,07 → 7,38).
   O `.cta:disabled` (0,2,0) perdeu. **A regra de verdade precisa deixar o
   desabilitado vencer.** E, mesmo fora do mapeamento, o B9 é um `.cta`: a
   altura de 54 e o 16px vão chegar nele, a não ser que a regra exclua
   `:disabled`. Só que um botão que desabilita enquanto envia
   (`disabled={enviando}`) encolheria no clique.

### 10.2 Os quatro que ficaram de fora

| Ap. | Onde | O que é |
|---|---|---|
| **B9** `cta` desabilitado | `aprovar/page.tsx:145` · `onboarding/contas/Contas.tsx:401` · `verba/page.tsx:123` | O botão principal com `disabled` fixo no código: a ação existe mas ainda não pode ser feita. Fundo `--ice-soft`, texto `--ink-mute`, 5,07:1 no claro e 4,75:1 no escuro (isento pela WCAG 1.4.3, mas legível). É o estado desabilitado da principal, e é o candidato natural a virar esse estado dela. |
| **B10** `acct-row` desabilitada | `conta/page.tsx:369` e `:376` | Linha de lista da `/conta` para ação ainda sem endpoint, com `aria-disabled` e `opacity: 0.72`. Não é botão de ação: é item de lista. Na montagem saiu com a cor e o 13,33px do navegador, porque a regra `.acct-list .acct-row` precisa do `.acct-list` em volta e a cadeia do extrator não o tem. **A aparência real dela não foi medida.** |
| **B16** `tema-opcao picked` e **B17** `tema-opcao` | `conta/SeletorDeTema.tsx:34` | Os três cartões do seletor de tema (claro, escuro, sistema), com a miniatura do tema, o nome e uma frase. O marcado tem borda cobalto e anel. É uma escolha, mas com forma de cartão (79px de altura em 375px) e não de pílula. Raio `--raio-cartao`. O próprio `<button>` sai com 13,33px e `#000000` do navegador, e os filhos `b` e `span` declaram tamanho e cor. |

### 10.3 Contraste da discreta

Está em `docs/tokens.md`, "PROPOSTA — três tokens de papel para os
controles": a tabela dos candidatos contra os dez fundos, e por que são dois
tokens.

### 10.4 A regra simulada

Os tamanhos são literais **só na simulação**: no `globals.css` eles
dependem da escala do item 6 (o detector reprova 14px e 16px hoje).

```css
:root { --fundo-controle: rgb(var(--navy-rgb) / 0.06); --texto-discreto: var(--ink-mute); --texto-discreto-sobre-placa: var(--sidebar-ink); }
.cta:not(.ghost):not(.quiet), .mini-send { min-height: 54px; background: var(--cobalt); color: var(--white); border: 0; border-radius: var(--raio-controle); font-family: var(--display); font-weight: 700; font-size: 16px; }
.cta.ghost, .btn-linha:not(.fraco) { min-height: 54px; background: var(--fundo-controle); color: var(--cobalt-ink); border: 0; border-radius: var(--raio-controle); font-family: var(--display); font-weight: 700; font-size: 16px; }
.text-fallback, .btn-texto, .ec-doubt, .cta.quiet, .btn-linha.fraco, .link-btn { min-height: 44px; background: none; border: 0; color: var(--texto-discreto); font-family: var(--display); font-weight: 600; font-size: 14px; }
.sidebar .link-btn { color: var(--texto-discreto-sobre-placa); }
.btn-texto.alvo-em-texto { min-height: 0; }
.chip-opt, .botao-leve, .pd-convite .botao-leve { min-height: 44px; background: var(--fundo-controle); color: var(--texto-forte); border: 0; border-radius: var(--raio-pilula); font-family: var(--display); font-weight: 600; font-size: 14px; }
.chip-opt.picked { background: var(--cobalt); color: var(--white); }
.botao-leve.alvo-em-texto { min-height: 0; }
.ec-back { width: 44px; height: 44px; border-radius: 50%; background: var(--fundo-controle); border: 0; }
```

## 11. Item 2 — campo em 16px, antes de aplicar

**Não aplicado.** 16px está fora da escala, e o detector reprova. Depende do
item 6.

Simulado com a regra injetada:
```
javascript_tool → injetar(':is(input[type=text|email|tel|password|number|search|url], input:not([type]), select, textarea){font-size:16px !important}'); medir os 35 campos; placeholder: largura do texto por canvas.measureText com a fonte computada, contra clientWidth − padding
```

| # | Campo | Ap. | Tamanho | Altura | Placeholder | Texto (px) | Espaço livre (px) | Cabe antes → depois |
|---:|---|---|---|---|---|---|---:|---|
| 1 | `conectar/escolher/Formulario.tsx:82` | C4 radio | 13,33 → 13,33 | 13 | — | — | — | — |
| 2 | `conectar/escolher/Formulario.tsx:127` | C4 radio | 13,33 → 13,33 | 13 | — | — | — | — |
| 3 | `onboarding/Chat.tsx:159` | C2 | 13 → 16 | 48 | Sua cidade | 64,5 → 79,4 | 272 | sim → sim |
| 4 | `onboarding/Chat.tsx:240` | C2 | 13 → 16 | 48 | não literal | — | — | não medido |
| 5 | `onboarding/contas/Contas.tsx:193` | C2 | 13 → 16 | 48 | O valor certo, em reais | 128,6 → **158,3** | 139 | sim → **NÃO** |
| 6 | `onboarding/contas/Contas.tsx:271` | C2 | 13 → 16 | 48 | Ex: 80 | 36,9 → 45,5 | 139 | sim → sim |
| 7 | `verba/FormVerba.tsx:30` | C1 | 15 → 16 | 48 | Ex: 600 | 51,2 → 54,6 | 228 | sim → sim |
| 8 | `conta/Formularios.tsx:26` | C1 | 15 → 16 | 48 | não literal | — | — | não medido |
| 9 | `conta/Formularios.tsx:36` | C1 | 15 → 16 | 48 | (11) 91234-5678 | 111,5 → 118,9 | 270 | sim → sim |
| 10 | `conta/Formularios.tsx:54` | C5 | 15 → 16 | 48 | não literal | — | — | não medido |
| 11 | `conta/Formularios.tsx:62` | C5 | 15 → 16 | 48 | não literal | — | — | não medido |
| 12 | `conta/Identidade.tsx:93` | C6 file | 13 → 13 | 220 | — | — | — | — |
| 13 | `conta/Identidade.tsx:159` | C6 file | 13 → 13 | 220 | — | — | — | — |
| 14 | `conta/TrocarPagina.tsx:55` | C4 radio | 13,33 → 13,33 | 13 | — | — | — | — |
| 15 | `criativos/Analisar.tsx:200` | C8 file | 13,33 → 13,33 | 1 | — | — | — | — |
| 16 | `inicio/PerguntaDoDia.tsx:389` | C2 | 13 → 16 | 48 | Ex: 3 | 29,5 → 36,3 | 196 | sim → sim |
| 17 | `inicio/PerguntaDoDia.tsx:436` | C2 | 13 → 16 | 48 | Ex: ? | 29,5 → 36,4 | 196 | sim → sim |
| 18 | `meu-negocio/Campo.tsx:276` | C3 | 13 → 16 | 48 | não literal | — | — | não medido |
| 19 | `meu-negocio/Campo.tsx:286` | C3 | 13 → 16 | 48 | não literal | — | — | não medido |
| 20 | `meu-negocio/Campo.tsx:296` | C3 textarea | 13 → 16 | **56,6 → 65,6** | uma coisa por linha | 111,2 → 136,8 | 280 | sim → sim |
| 21 | `meu-negocio/Campo.tsx:304` | C3 textarea | 13 → 16 | **56,6 → 65,6** | não literal | — | — | não medido |
| 22 | `meu-negocio/Campo.tsx:306` | C3 | 13 → 16 | 48 | não literal | — | — | não medido |
| 23 | `revisar-perfil/[proposta]/page.tsx:305` | C7 textarea | 13 → 16 | 48 → 48,8 | um por linha | 70,6 → 86,9 | 320 | sim → sim |
| 24 | `revisar-perfil/[proposta]/page.tsx:312` | C7 | 13 → 16 | 48 | sim ou não | 62,7 → 77,2 | 320 | sim → sim |
| 25 | `entrar/page.tsx:48` | C1 | 15 → 16 | 48 | Como você gosta de ser chamado? | 234,6 → 250,2 | 270 | sim → sim |
| 26 | `entrar/page.tsx:59` | C1 | 15 → 16 | 48 | (11) 91234-5678 | 111,5 → 118,9 | 270 | sim → sim |
| 27 | `entrar/page.tsx:75` | C1 | 15 → 16 | 48 | voce@seunegocio.com.br | 175,7 → 187,4 | 270 | sim → sim |
| 28 | `entrar/page.tsx:86` | C1 | 15 → 16 | 48 | Pelo menos 6 caracteres | 163,9 → 174,8 | 270 | sim → sim |
| 29 | `entrar/page.tsx:119` | C1 | 15 → 16 | 48 | voce@seunegocio.com.br | 175,7 → 187,4 | 270 | sim → sim |
| 30 | `entrar/page.tsx:130` | C1 | 15 → 16 | 48 | Sua senha | 70,8 → 75,5 | 270 | sim → sim |
| 31 | `recuperar/page.tsx:30` | C1 | 15 → 16 | 48 | voce@seunegocio.com.br | 175,7 → 187,4 | 270 | sim → sim |
| 32 | `redefinir/Form.tsx:17` | C1 | 15 → 16 | 48 | Pelo menos 8 caracteres, com letras e números | 313,8 → **334,7** | 270 | **NÃO → NÃO** |
| 33 | `redefinir/Form.tsx:29` | C1 | 15 → 16 | 48 | Repita a senha | 98,9 → 105,5 | 270 | sim → sim |
| 34 | `SeletorDeNicho.tsx:130` | C2 | 13 → 16 | 48 | não literal | — | — | não medido |
| 35 | `SeletorDeNicho.tsx:220` | C2 | 13 → 16 | 48 | não literal | — | — | não medido |

**O resultado, em três linhas:**

- **Passa a transbordar: um.** `Contas.tsx:193`, "O valor certo, em
  reais", 158,3px num espaço de 139. A medida é com o `mini-send` ao lado,
  que é onde o campo vive.
- **Já transbordava e continua: um.** `redefinir/Form.tsx:17`, "Pelo menos 8
  caracteres, com letras e números", 313,8px em 270 hoje, a 15px. Não é
  deste lote, mas estava escondido.
- **Dez campos têm placeholder que não é texto fixo no código**, e o
  transbordamento deles fica **não medido**. O extrator só lê o literal.

Os 7 campos que não são de texto (radio e file) ficam fora da regra de
propósito, como no lote 2a. As duas `textarea` da `/meu-negocio` crescem 9px
porque a altura delas é em linhas.
