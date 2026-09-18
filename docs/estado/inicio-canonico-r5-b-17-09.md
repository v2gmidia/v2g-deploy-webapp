# Início canônico, rodada 5-b — 17/09/2026, noite

Sessão DESENHISTA, branch `design-r5`, resposta à auditoria visual da R5
(`docs/v2g-wireframes/AUDITORIA-R5.md`, commit `9271240`). Só bancada e
documentos. **A resposta completa, achado por achado, está em
[`../v2g-wireframes/ENTREGA-R5-B.md`](../v2g-wireframes/ENTREGA-R5-B.md).**

## 0. O que depende de decisão humana

1. **B2, discordância (DUVIDA-15).** A saída que funciona continua
   secundária, porque a decisão de 16/09 manda assim. Trocar são duas classes.
2. **"Otimizar" na partição de produção (DUVIDA-14).** Conserto da família em
   `lib/estado/frases.ts`, não aplicado.
3. **Produção não tocada:** `Casco.tsx:212` ("Falar com uma pessoa"),
   `NavItem.tsx:24` (item ativo), `lib/dia-seguinte/pergunta.ts:28`
   ("dessas conversas").
4. **Textos da bancada para o Gabriel** (DUVIDA-12).

## 1. O que foi feito

- B1, I2, I3, I5, I6, I7, D1 e D5 consertados; B2 consertado em parte; I1
  consertado na bancada; D4 e D6 discordados por escrito; I4, D2, D3 e D7
  são de produção e ficaram com a mudança escrita.
- 24 capturas novas em `docs/v2g-wireframes/capturas/r5-b/`, abertas uma a
  uma. Três defeitos meus achados nelas e consertados antes da final.

## 2. Verificações

`pnpm typecheck` EXIT=0 · `pnpm build` EXIT=0 · `pnpm conferir` EXIT=1 pelo
`conferir:nichos` (rede, conhecido); os doze seguintes, um a um, EXIT=0.
Bancada: sentinelas 0 no `.next`; 404 nas cinco rotas `/exemplo/*` com
`next start`; `/entrar` 200.

## 3. `git status` ao fechar

```
 M docs/estado/indice.md                        a linha deste registro
?? docs/estado/inicio-canonico-r5-b-17-09.md    este registro
```

O resto do trabalho da R5-b (a tela, a fixture, `DUVIDAS.md`,
`ENTREGA-R5-B.md` e as 24 capturas) já entrou no commit `17da160`, que
não é desta sessão. Antes dele, a nota de autoria em `docs/decisoes.md`
entrou em `bbac270` e o `AUDITORIA-R5.md` em `9271240`.

## 4. Nota de ambiente

Um script Python que chamava `pnpm` por `subprocess` devolveu EXIT=1 para os
doze conferidores sem rodar nenhum: o `cmd` do Python não tem o `pnpm` no
PATH. O resultado foi descartado e os doze foram rodados direto no shell.
