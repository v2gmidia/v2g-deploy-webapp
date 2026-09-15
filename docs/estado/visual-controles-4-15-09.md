# Lote 2b — o item "Falar com uma pessoa" na barra e os placeholders finais — 15/09/2026

Continuação de `visual-controles-3-15-09.md`, que já tinha sido commitado
(`07285b9`). As decisões estão em `docs/decisoes.md`, 15/09, "'Falar com uma
pessoa' vira item da barra".

Nada foi commitado.

---

## 0. O que depende de decisão humana

1. **"Falar com uma pessoa" não cabe numa linha no formato dos itens de
   navegação.** O rótulo mede 170,1px e o item tem 164px para o texto, então
   passa 6,1px e quebra em duas linhas (§1). A regra de tamanho é a mesma
   para os seis itens; consertar só em CSS tiraria o item do formato
   aprovado. **O rótulo não foi mexido:** o texto é seu.
2. **O placeholder `perguntas.ts:144`, "Onde estão seus clientes?", passa
   5,3px** (§2).

---

## 1. "Falar com uma pessoa" saiu do cartão — APLICADO

Diff aprovado, aplicado como estava proposto:
- **`layout.tsx`:** o `IcoConversa` novo e o `<a className="nav-item
  side-falar">` no lugar do `<div className="side-support">`.
- **`globals.css`:** saem as regras do cartão, do botão lima e do anel de
  foco próprio; o `.side-falar` entra na lista do que some abaixo de 900px.

```
$ node patch-lima.cjs
app/(protected)/layout.tsx: ok (CRLF)
app/globals.css: ok (CRLF)
$ grep -nE "side-support|side-falar" app/globals.css "app/(protected)/layout.tsx"
```
O que sobrou com `.side-support` é só comentário de histórico. Nenhuma regra.

### Antes e depois

Sem login, o casco foi montado dentro da `/entrar` com o markup do JSX real
(`layout.tsx`, `Marca.tsx`, `NavItem.tsx`). Só o nome do negócio e a data são
amostra.
```
javascript_tool → __casco.montar("cartao") com o CSS de antes / __casco.montar("linha") com o CSS de depois; __casco.medir(): caixas, linhas do rótulo, fonte e cor
```

**1280px:**

| | Antes | Depois |
|---|---|---|
| O que é | cartão `.side-support` 220×145 (y 646), com botão lima `cta ghost` dentro | item `nav-item side-falar` 220×56 (y 747), sem fundo |
| O controle | 192×54, lima, texto `--black`, 16px/700 | 220×56, texto `rgba(241,246,247,.78)`, o mesmo tom dos outros itens, 16px/700, ícone 20×20 |
| Rótulo | **2 linhas** | **2 linhas** (§0.1) |
| Bloco da conta | y 803 | y 803, sem mudança |
| Itens de navegação | 5 × 220×42, de y 108 a 288 | iguais |
| A barra transborda | não | não |

O rótulo, medido contra o espaço do item:
```
javascript_tool → para cada .nav-item: clientWidth − padding − ícone − gap, contra canvas.measureText do rótulo com a fonte computada
```

| Item | Rótulo | Espaço | Sobra |
|---|---:|---:|---:|
| Início | 42,0 | 164 | 122,0 |
| Criativos | 68,6 | 164 | 95,4 |
| Anúncios | 72,6 | 164 | 91,4 |
| Avisos | 51,9 | 164 | 112,1 |
| Conta | 45,9 | 164 | 118,1 |
| **Falar com uma pessoa** | **170,1** | 164 | **−6,1** |

Todos no mesmo formato: `.nav-item`, 16px/700, padding 11px 12px, gap 12px,
ícone de 20px. Para referência de corte: "Falar com uma" mede 111,0.

**375px — não muda nada:**

| | Antes | Depois |
|---|---|---|
| Barra | inferior, 375×56 (y 756), 5 itens × 75×55 | igual |
| Cartão / item novo | `display: none` | `display: none` |
| Bloco da conta | `display: none` | `display: none` |
| "Falar com uma pessoa" no topo (`.topbar-help`) | 135,4×54 (y 18) | igual |

---

## 2. Placeholders, com o texto do Victor

```
$ git diff -U0 "app/(fluxo)/onboarding/perguntas.ts" components/ui/SeletorDeNicho.tsx | grep "^[-+] "
-    fallbackPlaceholder: "O que seu negócio vende?",       +    fallbackPlaceholder: "O que você vende?",
-    fallbackPlaceholder: "Ex: bolo e salgado feitos no dia", +    fallbackPlaceholder: "Ex: bolo e salgado do dia",
-    fallbackPlaceholder: "Onde seus clientes estão?",       +    fallbackPlaceholder: "Onde estão seus clientes?",
-  placeholderLivre = "O que seu negócio vende?",           +  placeholderLivre = "O que você vende?",
javascript_tool → campo montado na cadeia real, 375px, 16px, com o botão "Enviar" ao lado (o rótulo real); canvas.measureText contra clientWidth − padding
```

| Texto | Onde | Largura / espaço | Resultado |
|---|---|---|---|
| "O que você vende?" | `perguntas.ts:112` | 136,5 / 182 | **cabe**, sobram 45,5 |
| "Ex: bolo e salgado do dia" | `perguntas.ts:122` | 176,0 / 182 | **cabe**, sobram 6,0 |
| "Onde estão seus clientes?" | `perguntas.ts:144` | 187,3 / 182 | **passa 5,3** |
| "O que você vende?" | `SeletorDeNicho.tsx:66` | 136,5 / 182 | **cabe**, sobram 45,5 |

Os outros dois continuam como estavam e cabem: "O nome do seu negócio",
167,6 em 182, e "Busque ou escreva", 135,7 em 183.

---

## 3. Os campos das perguntas 2 a 4 podem ser `textarea`? — só resposta, nada aplicado

**Dá, mas não é só trocar a tag.** Onde cada pergunta escreve hoje:

| Pergunta | Campo |
|---|---|
| 2, ramo | `SeletorDeNicho.tsx:130` (o "Outro") e `:220` (a busca). `Chat.tsx:240` só quando o catálogo está fora |
| 3, descrição | `Chat.tsx:240` |
| 4, praça | `Chat.tsx:240`, e a cidade em outro campo (`Chat.tsx:159`) |

O que a troca exigiria:

1. **`Chat.tsx:240` é um campo só para as perguntas 1, 3 e 4.** Virar
   `textarea` leva o "nome do negócio" junto, a não ser que a tag dependa da
   pergunta. Isso seria uma marca nova em `perguntas.ts`.
2. **O tipo do `ref`** muda (`useRef<HTMLInputElement>`, `Chat.tsx:37`).
3. **O Enter já envia e não quebra linha** (`Chat.tsx:247`,
   `SeletorDeNicho.tsx:139`), então o comportamento de envio fica igual.
   Mas o teclado do celular passaria a mostrar "quebra de linha" no lugar de
   "ir". Faltaria `enterKeyHint="send"`.
4. **Placeholder em duas linhas pede duas linhas de altura** (`rows={2}`).
   O campo fica mais alto mesmo vazio, e o "Enviar" ao lado cresce junto:
   pela regra, o botão colado acompanha o campo. Não medido.
5. **O CSS do `.fallback-field` só alcança `input`:** `.fallback-field
   input`, `:focus` e `.shake` (`globals.css:1425`, `1437`, `1467`). Precisa
   incluir `textarea`. O 16px, a Archivo e o piso de 48px já alcançam
   `textarea`.
6. **A busca (`SeletorDeNicho.tsx:220`) deve continuar `input`:** ela usa
   `inputMode="search"`. Só o "Outro" (`:130`) seria candidato.
7. **Servidor e suíte não mudam.** O valor chega como a mesma string, e
   nenhum script da suíte olha esses campos:
   ```
   $ grep -rnE "campo-texto|fallback-field (input|textarea)|HTMLInputElement" scripts app components --include=*.ts --include=*.tsx
   (só o próprio Chat.tsx e o Analisar.tsx, que é outro campo)
   ```

---

## 4. Verificação

```
$ pnpm conferir > conferir.log 2>&1; echo "exit=$?"
exit=0
(19 blocos "TUDO CERTO", entre eles "0 inerte(s) na folha" do cascata e "9/9" da trava do Campo.tsx:232)
```

## 5. Arquivos

| Arquivo | O quê |
|---|---|
| `app/(protected)/layout.tsx` | `IcoConversa`; o cartão `.side-support` virou `<a className="nav-item side-falar">`, com o comentário do porquê |
| `app/globals.css` | saem o cartão, o botão lima e o anel de foco próprio; `.side-falar` na lista do que some abaixo de 900px |
| `app/(fluxo)/onboarding/perguntas.ts` | três strings de placeholder |
| `components/ui/SeletorDeNicho.tsx` | uma string de placeholder |
| `docs/decisoes.md` | a decisão da barra (desfaz o item 2 de 11/09), e o item em aberto dela removido |
| `docs/estado/visual-controles-4-15-09.md` | este arquivo |
| `docs/estado/indice.md` | a linha deste arquivo |
