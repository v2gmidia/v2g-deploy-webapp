# Início canônico, rodada 5 — 17/09/2026

Sessão DESENHISTA, branch `design-r5`, só na bancada `/exemplo/`. Sem
commit, sem publicação, sem arquivo de produção. **A entrega completa está
em [`../v2g-wireframes/ENTREGA-R5.md`](../v2g-wireframes/ENTREGA-R5.md)**;
este registro é o resumo para o índice.

## 0. O que depende de decisão humana

1. **O momento "acabou de concluir" não tem fonte.** Nenhum dado diz se o
   dono já viu a conclusão. Sem ele, a produção nunca mostraria a
   conclusão. Pedido ao backend em `DUVIDAS.md`, DUVIDA-11.
2. **Textos desta rodada esperando o Gabriel** — DUVIDA-12.
3. **A pergunta do dia saiu do estado parado** — DUVIDA-13.
4. **Três nomes para "falar com gente" no celular**, dois deles de
   produção — DUVIDA-9.

## 1. O que foi feito

- Três decisões registradas em `docs/decisoes.md`: "gestor" é a V2G
  (16/09), "Voltar a anunciar" desabilitado como exceção datada (16/09), e
  a trilha que aparece uma vez (17/09). DUVIDA-1, 6 e 8 marcadas como
  resolvidas, sem apagar o raciocínio da época.
- A tela canônica refeita do zero: uma coluna em quatro faixas, divisão
  por `@container`. Quatro momentos: preparando, concluiu, no ar (o
  cliente de três meses) e parado.
- Os três defeitos da R4 consertados, e um quarto achado no rascunho.
- 24 capturas em `docs/v2g-wireframes/capturas/r5/`, abertas uma a uma.

## 2. Decisões tomadas sozinho, e por quê

- **Mostrar o apoio do parado inteiro** (DUVIDA-10): a fonte única manda,
  e o motivo da R4 para esconder caiu com a decisão de 16/09.
- **`mostrarConclusao` com padrão `false`** (DUVIDA-11): a conclusão que
  nunca aparece é omissão; a que aparece sempre é o defeito de volta.
- **Pergunta do dia só com o anúncio no ar agora** (DUVIDA-13): uma
  principal por tela.
- **Dados do cliente de três meses inventados por inteiro**, e marcados
  assim em `lib/exemplo.ts`: sem eles não dá para desenhar a tela de quem
  paga todo mês, e nenhuma conta real tem esse histórico.

## 3. Verificações

`pnpm typecheck` EXIT=0 · `pnpm build` EXIT=0 · `pnpm conferir` EXIT=1
pelo `conferir:nichos` (67/79, rede, conhecido); os doze seguintes, um a
um, EXIT=0. Bancada: 0 ocorrências das sentinelas no `.next`, 404 nas cinco
rotas com `next start`, `/entrar` 200.

## 4. O que não deu certo, ou ficou pela metade

Em `ENTREGA-R5.md` §8. O principal: no parado nenhuma ação domina, porque
a principal está desabilitada por decisão.

## 5. Fora do escopo

`AGENTES.md` não existe no disco. O índice não tinha as rodadas R1 a R4 de
16/09; elas estão em `docs/v2g-wireframes/ENTREGA-INICIO.md` e
`ENTREGA-INICIO-R4.md`.
