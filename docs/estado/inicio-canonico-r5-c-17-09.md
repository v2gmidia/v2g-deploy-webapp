# Início canônico, rodada 5-c — 17/09/2026, noite

Sessão DESENHISTA, branch `design-r5`, resposta à reconferência
(`docs/v2g-wireframes/AUDITORIA-R5-B.md`). Só bancada e documentos.
**Detalhe achado por achado em
[`../v2g-wireframes/ENTREGA-R5-C.md`](../v2g-wireframes/ENTREGA-R5-C.md).**

## 0. O que depende de decisão humana

1. **B2 (DUVIDA-15)** — a reconferência aceitou a discordância e passou ao
   Victor: a principal desabilitada pode ter o mesmo peso da única saída que
   funciona? O estado pausado segue reprovado até isso ser decidido.
2. **N5 (DUVIDA-16, nova)** — o concluiu sem a pergunta do dia.
3. Abertos de antes: DUVIDA-14, I4, DUVIDA-12.

## 1. O que foi feito

N1, N2, N3 e N4 consertados; N5 mantido com motivo. 24 capturas em
`docs/v2g-wireframes/capturas/r5-c/`, abertas uma a uma.

## 2. Verificações

`pnpm typecheck` EXIT=0 · `pnpm build` EXIT=0 · `pnpm conferir` EXIT=1 pelo
`conferir:nichos` (67/79, rede); os doze seguintes, um a um, EXIT=0.
Sentinelas 0 no `.next`; 404 nas cinco rotas `/exemplo/*`; `/entrar` 200.

## 3. `git status` e commits

A tela e as capturas entraram em `796acee`, que não é desta sessão. O
`b245173`, anterior, levou o `TelaCanonica.tsx` num estado intermediário
desta rodada; o `796acee` é o que foi medido e verificado. Ao fechar, sem
commit:

```
 M docs/v2g-wireframes/DUVIDAS.md                 DUVIDA-16
 M docs/estado/indice.md                          a linha deste registro
?? docs/v2g-wireframes/ENTREGA-R5-C.md            a resposta à reconferência
?? docs/estado/inicio-canonico-r5-c-17-09.md      este registro
```

## 4. Nota de processo

Um comando desta rodada usou pipe (`pnpm conferir | tail`), contra a regra
de um comando simples por chamada. O resultado não mudou; o comando é que
não devia ter sido escrito assim.
