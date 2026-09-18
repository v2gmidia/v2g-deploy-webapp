# Auditoria visual da rodada 5 do Início — 17 a 18/09/2026

Sessão **AUDITOR**, branch `design-r5`. Não escreveu código de tela.
Auditou três entregas da sessão DESENHISTA (FAZEDOR APP VICTOR) e gravou,
fora das auditorias, os arquivos que o Victor pediu.

As auditorias, por ordem:
[`AUDITORIA-R5.md`](../v2g-wireframes/AUDITORIA-R5.md) →
[`AUDITORIA-R5-B.md`](../v2g-wireframes/AUDITORIA-R5-B.md) →
[`AUDITORIA-R5-C.md`](../v2g-wireframes/AUDITORIA-R5-C.md).
**Comece pela última.** Ela tem os vereditos que valem hoje e a tabela do que
continua aberto.

---

## 0. O que depende de decisão humana

1. **B2 — os botões do pausado: MANTIDOS como estão.** A instrução chegou
   nesta sessão, em 18/09, pelo Codex, que o Victor autorizou a acompanhar
   a noite. A mesma mensagem foi mandada à FAZEDOR. O que ela significa:
   - "Voltar a anunciar" continua como principal desabilitada, com o motivo
     escrito embaixo;
   - "Falar com alguém" continua como secundária;
   - as duas caixas continuam com o mesmo tamanho (311–733 × 54 a 1280).

   **Já registrado pela FAZEDOR, e sem commit ainda:**
   - a entrada `2026-09-18 — Os botões do pausado ficam como estão`, no topo
     de "Decididas" em `docs/decisoes.md`;
   - a DUVIDA-15 marcada como resolvida em `DUVIDAS.md`.

   Esta sessão não escreveu em nenhum dos dois, que ficaram com a FAZEDOR
   (§4). A entrada cita 430 × 54, que é a medida da R5-b. Na R5-c, a mesma
   caixa mede 422 × 54 (311–733). A diferença não muda a decisão.

2. **Textos da bancada esperando o Gabriel (DUVIDA-12). NÃO aprovados.** Hoje
   estão na tela assim:

   | onde | texto atual | arquivo:linha |
   |---|---|---|
   | concluiu, rótulo | "A preparação terminou" | `app/exemplo/_canonico/TelaCanonica.tsx:232` |
   | concluiu, título | "A otimização começa agora." | `TelaCanonica.tsx:248` |
   | concluiu, corpo | "Ela acontece enquanto o anúncio roda. Daqui em diante, o Início mostra o que ele está fazendo: quanto foi investido e quanto voltou para você. Esta é a última vez que a preparação aparece aqui." | `TelaCanonica.tsx:250-251` |
   | pausado, motivo do botão | "Este botão ainda não funciona por aqui. Até funcionar, o pedido continua sendo seu: quem coloca o anúncio para rodar de novo é o seu gestor, a V2G. É só chamar." | `TelaCanonica.tsx:340-341` |
   | pausado, rótulo dos números | "O que ele fez enquanto rodou" | `TelaCanonica.tsx:363` |
   | pausado, ação secundária | "Falar com alguém" | `TelaCanonica.tsx:349` |

   **E um texto de produção (I4):** "Quantas dessas conversas viraram venda
   ontem?", em `lib/dia-seguinte/pergunta.ts:28`. Aparece na mesma tela em
   que Conversas é "—", não medido. A copy é do Gabriel. O arquivo é de
   produção e esta sessão não mexeu nele.

3. **Continuam com o Victor, sem mudança nesta sessão:**
   - DUVIDA-14: "Otimizar" ligado à etapa `numeros` na partição de produção.
     A `/inicio` real ainda pode mostrar "Otimizar ✓".
   - DUVIDA-16: o concluiu sem a pergunta do dia.
   - DUVIDA-11: "uma vez" sem fonte em produção. Depende do backend.

---

## 1. O que foi feito

- **Três auditorias da R5**, cada uma com as 24 capturas abertas uma a uma
  e medição no DOM da bancada, em `<iframe>` de 1280, 900 e 375.
- **Vereditos finais (R5-c):**
  - preparando: aprovado;
  - concluiu: aprovado;
  - no ar: aprovado com ressalva (I4, produção);
  - pausado: aprovado com ressalva. A ressalva é o B2, agora decidido como
    "manter".
- **Achados retirados depois de discordância escrita da desenhista:**
  - D4, colunas do concluiu (R5-b);
  - D8, alinhamento do "Guardar" (R5-c).
- **Achados que a medição derrubou antes de entrar:**
  - "com gasto medido" passando da margem (R5);
  - 56/77px no no ar (R5-b), que era erro do script de medição.
- **Arquivos gravados a pedido do Victor em 17/09:**
  - `AGENTES.md`, na raiz, com o texto das regras que vieram no prompt.
    O "arquivo de ontem" não foi achado no disco.
  - O bloco "três decisões de 16/09" em `docs/decisoes.md`.
  - O PRD da R4, na pasta do Codex, renomeado para `PRD-R4-SUPERADO.md`,
    com uma linha no topo.

## 2. Decisões tomadas sozinho, e por quê

- **O bloco de 16/09 em `decisoes.md` entrou no topo de "Decididas", com
  `###`, e não no fim, com `##`, como o pedido dizia.** O arquivo é ordenado
  com a mais nova em cima, e colado no fim ficaria abaixo de 22/08. O texto
  é o do Victor, sem mudança.
  **Efeito:** a sessão A já tinha registrado as três decisões com texto
  próprio, então elas aparecem duas vezes. Deixei assim. Juntar é decisão do
  Victor.
- **O pausado passou de "reprovado" a "aprovado com ressalva" na R5-c.** O
  defeito que restava deixou de ser de desenho e passou a ser de decisão. A
  ressalva foi mantida por extenso.
- **Não reauditei depois da R5-c**, porque nada mudou em `app/` nem em
  `lib/` desde o `796acee`. A instrução de 18/09 manda não repetir auditoria
  aprovada sem mudança relevante.

## 3. Verificações, rodadas nesta sessão em 18/09 sobre o `d4ebe12`

```
pnpm typecheck      EXIT=0
pnpm build          EXIT=0   (28 páginas; /exemplo/[tela] compilada como rota dinâmica)
pnpm conferir       EXIT=1   só pelo conferir:nichos — lista viva com 8 nichos (piso 10),
                             113 termos (piso 183). É o vermelho conhecido, de rede, sem
                             relação com a tela.
```

Os oito antes do `nichos` passaram dentro da suíte. Os doze que o `&&`
pula, um comando cada:

```
dia-seguinte 157/157 · apresentada 27/27 · signed-request 20/20 · identidade 6/6 ·
veiculacao 117 · resultado 86/86 · campanha-da-sessao 17/17 · envio 48/48 ·
inicio 39/39 · analise 30/30 · portao 8/8 · escolha-de-campo 9/9      todos EXIT=0
```

**Bancada fora do pacote de produção.** Varredura em Python no `.next`,
depois do build, sem `cache` e `dev`:

```
0  EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G
0  Este botão ainda não funciona por aqui
0  A otimização começa agora
0  O que ele fez enquanto rodou
0  consolidadoDeTresMeses
2  Os primeiros sinais          (controle positivo: a /inicio real)
```

**NÃO MEDIDO nesta sessão: o `next start` com 404 nas rotas `/exemplo/*`.**
Motivo: subir servidor de produção pelo terminal contraria a regra de usar o
preview, e o `.claude/launch.json` só tem o `pnpm dev`. A FAZEDOR mediu isso
no `796acee` (`ENTREGA-R5-C.md` §3: 404 nas cinco rotas, `/entrar` 200). Nada
em `app/` mudou desde então (`git diff 796acee d4ebe12 -- app lib` vazio).

## 4. Coordenação com a FAZEDOR APP VICTOR

Mandei a ela, em 18/09:
- que o B2 fica como está;
- que a pasta está parada no `d4ebe12`;
- três perguntas: se ela fecha a DUVIDA-15; se há mudança de tela em
  andamento; se ela vai mexer no `docs/estado/indice.md`, para não escrevermos
  ao mesmo tempo.

**Resposta dela, no mesmo dia:**
- recebeu do Victor a mesma instrução sobre o B2;
- grava a decisão em `decisoes.md` e fecha a DUVIDA-15, e os dois arquivos
  ficam com ela;
- não há mudança de tela em andamento nem planejada, nada em `app/` nem em
  `lib/`;
- não escreve em `docs/estado/` nem no `indice.md` nesta rodada, que ficam
  com esta sessão.

**O escopo existente da R5 está concluído dos dois lados.** O que sobra
depende do Gabriel (§0.2) ou do Victor (§0.3).

## 5. O que não deu certo

- **17/09, 21:09.** A primeira auditoria foi pedida antes de a entrega
  existir. A branch `design-r5` tinha acabado de ser criada, sem commit, e a
  outra sessão trocou a branch da pasta durante esta sessão. Parei e relatei.
  A entrega entrou às 21:30.
- **O `git commit` desta sessão foi negado pelas permissões**, que é o
  esperado. O Victor commitou pelo Desktop.
- **Dois comandos desta sessão, em 17/09, encadearam `cd &&` e pipe**, antes
  da regra de um comando por vez. Depois dela, não houve mais.
- **Um script meu, em 18/09, chamou `pnpm` por dentro do Python com
  `shell=True` e deu EXIT=1 nos 12 conferidores.** Era o `cmd.exe` não achando
  o `pnpm`, não os conferidores. Rodei cada um direto, e passaram. O número
  falso não entrou em lugar nenhum.

## 6. `git status` ao gravar este registro

```
 M docs/decisoes.md                      a decisão do B2 — gravada pela FAZEDOR
 M docs/v2g-wireframes/DUVIDAS.md        DUVIDA-15 resolvida — gravada pela FAZEDOR
?? docs/estado/auditoria-r5-18-09.md     este registro
 M docs/estado/indice.md                 a linha deste registro
```

**Pronto para commit:** os quatro arquivos acima. Todos são documentos, e
nenhum toca em `app/` nem em `lib/`. O commit e o push são do
Codex, pelo GitHub Desktop. Esta sessão não commita.
