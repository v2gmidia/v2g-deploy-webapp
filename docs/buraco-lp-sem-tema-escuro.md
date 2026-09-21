# A landing page não tem tema escuro que funcione

**Medido em 20/09/2026**, ao conferir uma borda do FAQ. Não fui procurar
isso — apareceu.

## O número

Varri os 59 blocos de texto visíveis de `/` (a rota `app/(marketing)`),
com recarga limpa em cada tema e **compondo as camadas translúcidas**
antes de calcular:

| tema | textos abaixo do piso | pior caso |
|---|---|---|
| claro | **0 de 59** | — |
| escuro | **28 de 59** | **1,16:1** |

O pior caso é texto `#E9EFF8` sobre cartão `#FFFFFF`. O piso é 4,5:1 para
texto corrido.

## Por que acontece

A LP usa os tokens de papel do `globals.css` (`--ink`, `--ink-soft`,
`--navy`, `--offwhite`), e o `globals.css` **é importado pelo layout
raiz**, então o bloco `@media (prefers-color-scheme: dark)` alcança a LP
inteira. A tinta vira clara.

Os CARTÕES da LP, não. `app/(marketing)/lp.css` não tem uma única linha de
`prefers-color-scheme`, e os fundos brancos dela ficam brancos. O
resultado é tinta de tema escuro sobre superfície de tema claro:

```
cor  #E9EFF8   (--texto-forte do tema escuro)
fundo #FFFFFF  (o cartão da LP, que não mudou)
     = 1,16:1
```

Não é uma regra fora do lugar: é a folha inteira que nunca foi calibrada
para o segundo tema, enquanto a folha de que ela depende foi.

## Quem vê isso

Qualquer visitante com o sistema em modo escuro — que é o padrão de boa
parte dos celulares Android e de todo iPhone com o agendamento ligado.
**É a página de vendas.** O texto que explica o produto é o que some.

## Três consertos possíveis, do mais barato ao mais honesto

1. **Fixar a LP no tema claro.** Um `:root` com `color-scheme: light` e
   os tokens de papel travados nos valores claros, só nessa rota. É uma
   linha de decisão e umas poucas de CSS. A LP passa a ignorar o tema do
   sistema — o que é comum em página de vendas, e é o que ela já faz de
   fato na metade que não mudou.
2. **Calibrar a LP para os dois temas.** Dar valores escuros aos fundos
   de cartão de `lp.css`. É o certo, e é uma rodada com medição e captura
   de cada seção nos dois temas.
3. **Parar de importar o `globals.css` na rota da LP.** Ela já tem folha
   própria. Isso a isolaria do tema do app — mas ela usa os tokens de lá,
   então significaria duplicar a paleta, que é o que o `--cobalt-rgb`
   existe para evitar.

**Recomendo a 1** como conserto imediato, e a 2 como rodada própria. A 3
troca um problema por um pior.

## O que eu NÃO fiz

Nada além de medir. A LP está no ar e o conserto muda a cara dela — não é
decisão de sessão, e a única coisa que toquei em `lp.css` nesta rodada
foi uma borda do FAQ (`--cobalt` → `--cobalt-ink`), que no tema claro não
muda nada.

## Como reproduzir

```bash
pnpm dev
```

Abrir `/` com o sistema em modo escuro. Ou, no DevTools, emular
`prefers-color-scheme: dark` **e recarregar** — sem recarregar, as
propriedades personalizadas ficam velhas e a medição mente (foi o que
aconteceu comigo na primeira tentativa: deu um falso positivo de 1,18:1
no botão da barra, que com recarga está correto).
