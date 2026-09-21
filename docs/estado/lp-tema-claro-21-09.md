# A LP travada no tema claro — 21/09/2026

Branch `lp-tema-claro`, a partir da `main`. **Sem commit, sem push, sem
deploy.**

## 0. O que depende de decisão humana

1. **Isto é remédio, não cura.** A LP continua sem tema escuro; ela agora
   se recusa a entrar nele. A cura é calibrar o `lp.css` para os dois
   temas, e continua por fazer — `docs/buraco-lp-sem-tema-escuro.md`,
   opção 2.
2. **Esta branch saiu da `main`**, então ela **não** tem o conserto das 14
   bordas de cobalto que está na `onboarding-v2`. As duas mexem em
   `app/globals.css` e em `app/(marketing)/lp.css`, e eu conferi que não
   se cruzam: aqui as mudanças são nas linhas 499–588 do `globals.css` e
   na 45 do `lp.css`; lá são da 602 para baixo e na 471. **Git junta as
   duas sem conflito.**

## 1. O que foi medido antes

Os 59 blocos de texto visíveis de `/`, com **recarga limpa em cada tema**
e compondo as camadas translúcidas antes de calcular:

| tema | abaixo do piso | pior |
|---|---|---|
| claro | 0 de 59 | 5,18:1 |
| escuro | **28 de 59** | **1,16:1** |

O pior caso é tinta `#E9EFF8` sobre cartão `#FFFFFF` — os três títulos da
seção "Anunciar hoje é caro", que somem por completo.

## 2. O que foi feito

### 2.1 O travamento

Um bloco novo em `app/globals.css`, `[data-tema="claro"]`, **sem o
`:root`**. É o que faz a diferença: assim ele vale num `<div>` no meio da
árvore, e tudo dentro dele volta ao tema claro independentemente do que o
`<html>` diz.

A `.lp` de `app/(marketing)/page.tsx` carrega `data-tema="claro"`.
Propriedade personalizada **herda**, então declarar os 50 tokens na `.lp`
basta: tudo abaixo lê os valores claros, e nada acima é tocado.

**Os 50 valores não foram digitados.** São exatamente os tokens que o
bloco `:root[data-tema="escuro"]` troca, com o valor que cada um tem no
`:root` do mesmo arquivo, copiados por script. Nenhuma cor nova entrou no
repositório.

Mais uma linha no `lp.css`: `min-height: 100dvh` na `.lp`. O `<body>` é
compartilhado com o app e fica escuro; sem isso, a faixa abaixo do último
bloco mostraria esse fundo — a página clara terminaria num rodapé preto.

### 2.2 O `color-scheme` que faltava

```css
:root { color-scheme: light dark; }
```

As duas regras que já existiam dependiam do atributo `data-tema`, que só
aparece **depois** de a pessoa escolher um tema. Quem confia no modo
escuro do sistema e nunca clicou ficava fora das duas: tokens escuros,
controles nativos claros — `select` branco, tocador de áudio branco, barra
de rolagem clara. As duas regras de `data-tema` continuam por cima, para a
escolha explícita vencer.

## 3. O que foi medido depois

| tema do sistema | abaixo do piso | pior | `--offwhite` no `:root` | na `.lp` |
|---|---|---|---|---|
| claro, 1280 | **0 de 59** | 5,18:1 | `#f1f6f7` | `#f1f6f7` |
| claro, 375 | **0 de 58** | 5,18:1 | `#f1f6f7` | `#f1f6f7` |
| **escuro**, 1280 | **0 de 59** | 5,18:1 | `#050a13` | **`#f1f6f7`** |
| **escuro**, 375 | **0 de 58** | 5,18:1 | `#050a13` | **`#f1f6f7`** |

O pior contraste é **idêntico nos dois temas**: a LP renderiza igual,
independentemente do sistema. E a coluna do `:root` é a prova de que o
travamento é local — o documento continua escuro, só a `.lp` não.

### 3.1 O botão de tema também não desfaz

| caso | `:root --offwhite` | `.lp --offwhite` | `color-scheme` do `:root` |
|---|---|---|---|
| sistema escuro, sem escolha | `#050a13` | `#f1f6f7` | `light dark` ← a linha nova |
| botão em **escuro** | `#050a13` | `#f1f6f7` | `dark` |
| botão em **claro** | `#f1f6f7` | `#f1f6f7` | `light` |

Em todos os três, a `.lp` fica em `rgb(241, 246, 247)` com tinta
`rgb(17, 30, 47)`, e o `color-scheme` dela é `light`.

### 3.2 O app NÃO ficou claro junto

Com o sistema em escuro, quatro rotas:

```
/entrar                     --offwhite=#050a13  body=rgb(5, 10, 19)   ESCURO
/recuperar                  --offwhite=#050a13  body=rgb(5, 10, 19)   ESCURO
/exclusao-de-dados/abc123   --offwhite=#050a13  body=rgb(5, 10, 19)   ESCURO
/                           --offwhite=#050a13  body=rgb(5, 10, 19)   ESCURO
```

E `[data-tema="claro"]` existe em **zero** elementos nas três primeiras, e
em **um** na `/`. O travamento não vaza.

## 4. As capturas

`docs/v2g-wireframes/capturas/lp-tema-claro/`, todas com o sistema em
**escuro**:

- `lp-sistema-escuro-1280.png` e `-375.png` — a página inteira;
- `lp-sistema-claro-*.png` — o controle, para comparar;
- quatro faixas em tamanho de tela, e as mesmas quatro com sufixo
  `-antes`.

**O "antes" saiu da MESMA árvore.** Em vez de desfazer a edição, o driver
tira o atributo em tempo de execução antes de capturar — é o mesmo código,
com o travamento desligado. Nas de `-antes`, os três títulos dos cartões
("R$ 1.500 a R$ 3.000 por mês", "Relatório que ninguém entende", "E quando
você pergunta, ninguém responde") estão quase invisíveis sobre branco.
Abri as quatro.

## 5. Decisões que tomei sozinho

1. **`[data-tema="claro"]` sem o `:root`.** O atributo já existia para a
   escolha do usuário; o que fiz foi deixar de amarrá-lo ao `<html>`.
   Reusar o nome evita um segundo mecanismo de tema no mesmo arquivo.
2. **Os valores por script, não à mão.** 50 tokens copiados do `:root`.
   Digitar era convite a divergir em um deles e ninguém notar.
3. **`min-height: 100dvh` em vez de `body:has(.lp)`.** O `:has()`
   funcionaria e mexeria numa regra compartilhada com o app — a altura
   mínima resolve dentro da própria LP.
4. **`:root { color-scheme: light dark }`** em vez de acrescentar
   `color-scheme: dark` ao bloco escuro. Foi a recomendação que eu já
   tinha escrito no `buraco-color-scheme.md`: ela não depende de alguém
   lembrar de repetir a declaração se um terceiro bloco de tema aparecer.
5. **Não toquei no conteúdo da LP.** Nenhum texto, nenhum cartão, nenhuma
   cor nova. A página é a mesma; ela só deixou de ser repintada.

## 6. EXITs

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← conferir:nichos, rede, o vermelho conhecido
```

Os doze que o `&&` pula, um a um, **todos EXIT=0**: dia-seguinte,
apresentada, signed-request, identidade, veiculacao, resultado,
campanha-da-sessao, envio, inicio, analise, portao, escolha-de-campo.

O `conferir:migrations` está **verde** aqui (81 objetos) — a 0022 é da
outra branch.

## 7. `git status` ao fechar

```
 M app/(marketing)/lp.css      +6    a altura mínima
 M app/(marketing)/page.tsx    +21   o atributo e o porquê
 M app/globals.css             +89   o bloco claro e o color-scheme
?? docs/v2g-wireframes/capturas/lp-tema-claro/   14 PNG
```

Intactos: `app/(fluxo)/`, `app/(protected)/`, `app/exemplo/`, `lib/`,
`components/`, `proxy.ts`, `supabase/`.

**Nenhum commit, nenhum push, nenhum deploy.**
