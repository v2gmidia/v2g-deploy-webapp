# A regra global que ganha de qualquer CSS Module

Achado em 21/09/2026, desenhando o campo de verba do onboarding v3. A
regra estava escrita, o navegador a listava, e o computado saía errado.

---

## 1. O sintoma

```css
/* Onboarding.module.css */
.campoValor {
  font-size: var(--fs-hero-frase);   /* clamp(26px, 3.4vw, 40px) */
}
```

Medido no navegador, a 1280px:

```
declarado no CSSOM : var(--fs-hero-frase)
token no elemento  : clamp(26px, 3.4vw, 40px)
font-size computado: 16px          ← nem 26, nem 40
```

E o teste que separa as hipóteses: aplicando **o mesmo valor** por
`style` inline, o computado vira 40px. Ou seja, o valor é válido, o token
resolve, e mesmo assim a regra perde.

---

## 2. A causa

`app/globals.css`, lote 2a de 14/09:

```css
:is(input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="password"],
    input[type="number"],
    input[type="search"],
    input[type="url"],
    input:not([type]),
    select,
    textarea, button) {
  font-family: var(--display);
  font-size: var(--fs-titulo);   /* 16px */
}
```

**O `:is()` tem a especificidade do seu argumento mais forte.** Aqui,
`input[type="text"]` — elemento + atributo = **(0,1,1)**.

Uma classe de CSS Module é **(0,1,0)**. Perde.

E o comentário da própria regra diz que isso é de propósito:

> POR QUE `:is()`. O `:is()` tem a especificidade do seu argumento mais
> forte — aqui (0,1,1), do `input[type=…]`. É o que faz a regra valer por
> cima de `.btn-linha { font: inherit }` e `.field input { font-family:
> var(--body) }` sem apagar aquelas declarações.

**A regra não está errada.** Ela foi calibrada para ganhar de duas outras
regras específicas, e ganha — de todas as classes, de quebra.

---

## 3. Por que é uma armadilha, e não um detalhe

Três coisas se juntam:

1. **O CSS Module dá falsa segurança.** O nome da classe é único, então
   parece que ninguém pode competir. Especificidade não é sobre nome.
2. **O sintoma é silencioso.** Não há aviso, não há erro, e o DevTools
   mostra a regra **presente** — a declaração perdedora aparece riscada,
   e só quem procura a nota.
3. **O valor que sobra parece plausível.** 16px é o padrão do navegador e
   também o `--fs-titulo`. Um campo em 16px não parece quebrado; parece
   um campo. Foi preciso comparar com a captura para notar que o "R$"
   (24px) estava **maior que o número**.

O caminho até a causa levou quatro medições, e três delas descartaram
hipóteses erradas — inclusive uma varredura de CSSOM que **não achou a
regra** porque eu testava só o primeiro seletor de cada lista separada por
vírgula.

---

## 4. Quem mais pode cair nela

```bash
grep -rn "className={css\." app --include=*.tsx | grep -i "input\|textarea\|select"
```

Todo `input`, `select`, `textarea` ou `button` estilizado por CSS Module
com **uma classe só** herda o `font-family` e o `font-size` do lote 2a, e
não o que a folha do módulo declara.

Hoje isso alcança: os campos do onboarding v3, os do `_canonico`, e
qualquer módulo novo.

**Só `font-family` e `font-size` estão na regra global** — as outras
propriedades (cor, borda, padding) passam normalmente. É por isso que o
defeito parece aleatório: metade do estilo aplica.

---

## 5. O jeito certo, em ordem de preferência

### 5.1 Dois seletores — o que eu usei

```css
.campoDinheiro .campoValor {   /* (0,2,0) — ganha de (0,1,1) */
  font-size: var(--fs-hero-frase);
}
```

```tsx
<div className={css.campoDinheiro}>
  <input className={css.campoValor} />
</div>
```

**Por que este.** Não usa `!important`, não toca em produção, e o
recipiente quase sempre já existe — campo de formulário costuma ter um
invólucro. O custo é uma linha de JSX quando não existe.

### 5.2 Classe + elemento

```css
input.campoValor {   /* (0,1,1) — empata, e vence por vir depois */
}
```

**Funciona, e é frágil.** Empate se resolve por ORDEM, e a ordem entre a
folha global e a do módulo não é garantida pelo bundler. Funciona hoje;
pode parar de funcionar num build que mude a ordem de injeção.

### 5.3 O que NÃO fazer

```css
.campoValor { font-size: 40px !important; }
```

`!important` ganha de tudo, inclusive da próxima pessoa que tentar
entender por que o campo não obedece. E apaga a intenção do lote 2a, que
é legítima: os controles deste produto usam a mesma fonte.

```css
/* e também não: mexer no globals.css para "abrir espaço" */
```

A regra global existe para uma razão medida e escrita. Enfraquecê-la para
caber um campo novo troca um problema visível por um invisível — a
`.field input` e a `.btn-linha` voltariam a ganhar dela.

---

## 6. Como perceber cedo

Depois de estilizar um campo por CSS Module, uma leitura:

```js
const el = document.querySelector('input.SEU_CAMPO');
({ declarado: /* a regra */, computado: getComputedStyle(el).fontSize });
```

Se o computado for **16px** e você declarou outra coisa, é esta
armadilha.

E ao varrer o CSSOM para achar quem ganha, **teste todos os seletores da
lista**:

```js
const casa = r.selectorText.split(',').some((sel) => el.matches(sel.trim()));
```

Testar só `split(',')[0]` esconde exatamente as regras agrupadas — que
são as que costumam ganhar.

---

## 7. Onde isso está escrito no código

- a regra: `app/globals.css`, bloco "FAMÍLIA DOS CONTROLES — lote 2a";
- o contorno e o porquê:
  `app/exemplo/_onboarding/Onboarding.module.css`, no bloco de
  `.campoDinheiro .campoValor`.
