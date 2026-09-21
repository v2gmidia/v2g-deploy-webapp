# A borda de cobalto que some no tema escuro

**Medido em 20/09/2026**, enquanto eu desenhava o microfone convidativo do
onboarding novo. Não é defeito daquela tela — é o resto de uma varredura
que parou cedo.

## O que é

`docs/contraste.md` §9.1 conta por que `--cobalt-ink` existe: o cobalto
escuro (`#0239C7`) é bom como fundo e **péssimo como tinta**, medindo de
1,86 a 2,28:1 sobre as superfícies escuras. A rodada que criou o token
migrou, nas palavras do próprio documento, **"31 regras de `color:` /
`outline:`"**.

`border-color:` não estava na varredura. **Sobraram 21 regras em
`app/globals.css` e 1 em `app/(marketing)/lp.css`** que pintam borda com
`var(--cobalt)`.

No tema escuro, essa borda mede **2,28:1 contra `--fundo-pagina`** — o
mesmo número que o documento cita como o motivo de o token existir. O
piso para objeto gráfico é 3:1.

## Por que importa mais do que parece

A borda não é decoração nessas regras. Ela é o **estado**:

| regra | o que a borda significa |
|---|---|
| `.field input:focus` (602) | onde o cursor está |
| `.city-row input:focus` (1398) | idem |
| `.field select:focus` (1804) | idem |
| `.escolha-item.picked` (2345) | qual opção o cliente escolheu |
| `.tema-opcao.picked` (2443) | qual tema está ligado |
| `.btn-sm.primary` (2304) | qual botão é o principal daquela linha |

Foco de teclado a 2,28:1 é o caso mais sério: quem navega sem mouse perde
o rastro de onde está, e é exatamente o público que mais depende dele.

## O conserto

Trocar `var(--cobalt)` por `var(--cobalt-ink)` nas 22 regras de borda.
**O tema claro não muda**: lá `--cobalt-ink` é literalmente `var(--cobalt)`
(`app/globals.css:100`). No escuro, a borda sai de 2,28:1 para ~6:1.

A exceção é a mesma da §9.1: borda de cobalto sobre fundo **claro dentro
do tema escuro** — se existir alguma — continua com `--cobalt`. O critério
é o FUNDO, não a propriedade.

## O que já foi feito, e o que não

**Feito**, porque estava no alcance da rodada do onboarding: as 6 regras
de `app/exemplo/_onboarding/Onboarding.module.css`. Medido antes e depois,
no tema escuro:

| regra | antes | depois |
|---|---|---|
| `.microConvite` (borda do microfone convidativo) | 2,28:1 | 6,00:1 |
| `.microAtivo` (o "estou ouvindo") | 2,28:1 | 6,00:1 |
| `.escolhida` (a opção escolhida) | 2,28:1 | 6,00:1 |
| `.recado` (a marca da recusa) | 2,28:1 | 6,00:1 |
| `.barraCheia` (o progresso), contra o trilho COMPOSTO | 2,05:1 | 5,45:1 |
| `.slider` (`accent-color`) | 2,28:1 | 6,00:1 |

**Não feito**: as 22 de produção. Elas moram em `globals.css`, que é folha
compartilhada por todas as telas do app — a troca é de uma linha cada, mas
a PROVA é recapturar as telas que usam cada regra, nos dois temas. Isso é
uma rodada própria, e não a do onboarding.

## Como conferir que ainda está aberto

```bash
grep -n "border[^:;{}]*var(--cobalt)" app/globals.css app/\(marketing\)/lp.css
```

Enquanto essa busca devolver linha, o buraco está aberto.
