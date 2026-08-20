# O desalinho de 4px entre a `.topbar` e o `.canvas` no celular

**Medido em 20/08/2026**, durante o lote QA-1
([`navegacao-mobile.md`](./navegacao-mobile.md)). Não é desenho: é
registro de um achado que **não** foi consertado, porque não é navegação.

---

## 1. O buraco, em uma frase

**Abaixo de 620px, o conteúdo das telas de app começa 18px da borda e a
saudação acima dele começa 22px** — os dois blocos que o cliente lê um
embaixo do outro não compartilham a mesma margem esquerda.

## 2. Onde nasce

Duas regras de mídia em `app/globals.css`. A de 900px acerta os dois
juntos:

```css
@media (max-width: 900px) {
  …
  .canvas, .topbar { padding-left: 22px; padding-right: 22px; }
}
```

A de 620px reescreve **só o `.canvas`**, com `padding` no atalho:

```css
@media (max-width: 620px) {
  .canvas { padding: 20px 18px calc(var(--barra-h) + 24px); }
}
```

A `.topbar` não é citada, então ela fica nos 22px herdados da regra
anterior. Não é um valor errado escrito de propósito: é um elemento que
saiu da lista quando a segunda regra foi escrita — a mesma forma do
defeito do `.side-support`, que ficou de fora da lista de escondidos da
regra de 900px e virou uma coluna de letras (§3 do desenho do QA-1).

## 3. O que foi medido

Em 390px e em 375px, com o DOM do `app/(protected)/layout.tsx`
reproduzido e o `globals.css` real:

| Elemento | `padding-left` / `padding-right` |
|---|---|
| `.topbar` | `22px` |
| `.canvas` | `18px` |

Diferença: **4px**, em toda tela de app, no celular. Entre a saudação
("Boa tarde" + nome do negócio + data) e o começo do conteúdo logo abaixo.

## 4. Por que não foi consertado no QA-1

Porque não é navegação, e lote é lote. O QA-1 mexeu no shell inteiro e
seria fácil levar isto junto — e é justamente por isso que fica escrito:
achado que some quando ninguém escreve não vira conserto, vira lenda.

## 5. O conserto, quando alguém mandar

Uma linha. Somar a `.topbar` à regra de 620px, do mesmo jeito que ela já
aparece na de 900px:

```css
@media (max-width: 620px) {
  .canvas { padding: 20px 18px calc(var(--barra-h) + 24px); }
  .topbar { padding-left: 18px; padding-right: 18px; }
}
```

Cuidado que o conserto tem: o `.hero-destaque` sangra para fora do
`.canvas` com margem negativa **casada com o padding dele** (`-18px`
abaixo de 620px). Essa conta é do `.canvas` e não muda aqui — mas quem
mexer nos paddings do shell precisa conferir as duas, senão sobra faixa
clara de um lado ou aparece rolagem horizontal. O comentário disso já
está no CSS, acima da regra de sangramento.

## 6. O que este buraco NÃO é

Não é o defeito da sangria da faixa cobalto dentro do `.auth-card` (aquele
é `-34px` contra `30px`, no grupo de fluxo, e já está registrado em
[`padrao-visual.md`](./padrao-visual.md) §6). São dois desalinhos de
padding com a mesma causa de fundo — margem negativa e padding que
precisam andar juntos — e nenhum é o outro.
