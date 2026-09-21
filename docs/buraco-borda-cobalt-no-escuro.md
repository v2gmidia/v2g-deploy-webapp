# A borda de cobalto que some no tema escuro — FECHADO em 20/09/2026

**Fechado na madrugada de 20/09.** A medição completa e a tabela de antes
e depois estão em `docs/contraste.md` §14. Este arquivo fica como
registro do achado e da correção de duas contas minhas.

## O que era

`docs/contraste.md` §9.1 conta por que `--cobalt-ink` existe: o cobalto
escuro (`#0239C7`) é bom como fundo e péssimo como tinta. A rodada que
criou o token migrou **31 regras de `color:` / `outline:`** — e não
passou por `border-color:`.

## Duas contas minhas que estavam erradas

1. **Eu escrevi 22 regras. São 21** — 20 em `app/globals.css` e 1 em
   `app/(marketing)/lp.css`. Contei 21 no globals por engano.
2. **Eu escrevi que 6 eram `:focus`. São 3** (linhas 602, 1398 e 1804).
   As outras que eu contei como foco são `:hover`.

E uma terceira coisa que só a medição mostrou: **4 das 21 são borda
morta** — o grupo dos cinco papéis de botão põe `border: 0` depois, e a
largura computada é `0px`. Trocar a cor delas não mudaria um pixel.

## O que foi feito

**14 regras trocadas para `--cobalt-ink`.** No tema escuro saíram de
1,87–2,28:1 para 3,30–6,00:1. No tema claro, 21 de 21 casos medidos
antes e depois: **cor e contraste idênticos**.

**6 ficaram, com razão registrada** — 4 bordas mortas e 2 preenchimentos.
A tabela com o porquê de cada uma está na §14.3.

## O que este buraco NÃO fechou

1. **O preenchimento de cobalto no escuro.** `.trilha-item.e-feita
   .trilha-marca` (3493) e `.fase.f-atual .fase-marca` (3741) são pontos
   CHEIOS de `--cobalt`, medindo **2,28:1** contra o fundo da página. O
   conserto não é trocar o token — o `.fase-marca` tem texto branco em
   cima, e branco sobre `--cobalt-ink` cai para 3,30:1. Pede desenho, não
   substituição.
2. **A landing page não tem tema escuro que funcione.** Achado ao medir o
   `.faq`: ver `docs/buraco-lp-sem-tema-escuro.md`.

## Como conferir que continua fechado

```bash
grep -n "border[a-z-]*: *[^;]*var(--cobalt)" app/globals.css
```

Seis linhas, e as seis estão na tabela da §14.3. Linha nova é regressão.
Para olhar: `/exemplo/bordas` na bancada.
