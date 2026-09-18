# Auditoria visual — Início canônico, rodada 5-c (reconferência)

18/09/2026, madrugada. Sessão AUDITOR, sem escrever código. Confere a
[`ENTREGA-R5-C.md`](./ENTREGA-R5-C.md) contra a
[`AUDITORIA-R5-B.md`](./AUDITORIA-R5-B.md).

**Commit auditado:**
- A tela e as capturas estão no `796acee08d24d2c11b5c6f6b841e68ca5c9a9383`.
- Durante a medição entrou o `1f482f4`, às 00:10:32. Ele só traz documentos:
  `ENTREGA-R5-C.md`, `DUVIDAS.md` e os dois arquivos de estado.
- `git diff --stat 796acee 1f482f4 -- app lib components proxy.ts` volta
  **vazio**, então o código medido é o mesmo nos dois commits.
- Ao fim da medição, `git status` também voltou vazio.

**Método:** o mesmo das duas rodadas anteriores.
- **Imagem.** As 24 capturas de `capturas/r5-c/`, abertas uma a uma.
- **DOM.** A bancada rodou em `pnpm dev`, cada rota em `<iframe>` de 1280,
  900 e 375, com as medidas de `getBoundingClientRect`.
- **Largura.** O `innerWidth` dá 3px a menos quando a página rola, por causa
  da barra de rolagem do iframe. Por isso a borda direita do preparando, que
  não rola, dá 1243 e não 1228. Não é desalinhamento.

---

## 1. Conferência das 24 capturas

Largura pela imagem, com DPR 2. Nenhuma é tela de login ou de erro. As 12
duplas claro/escuro têm a mesma anatomia.

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5c-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | "1 de 4 etapas concluídas" como primeira linha, na altura do título ao lado | claro | 2560 px → 1280, lateral | ok |
| `r5c-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-preparando-claro-900` | idem | idem | claro | 1800 px → 900, barra inferior | ok |
| `r5c-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | contador, barras com a meia barra, "Agora: Criar" | claro | 750 px → 375, barra inferior | ok |
| `r5c-preparando-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-concluiu-claro-1280` | "Seu anúncio está no ar." | três fases; "A otimização começa agora." | claro | 1280, lateral | ok |
| `r5c-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-concluiu-claro-375` | idem | três fases com nome, uma por linha | claro | 375, barra inferior | ok |
| `r5c-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-no-ar-claro-1280` | "Seu anúncio está no ar." | "Guardar" debaixo dos campos | claro | 1280, lateral | ok |
| `r5c-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-no-ar-claro-375` | idem | tudo empilhado | claro | 375, barra inferior | ok |
| `r5c-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | âncora na largura toda: ação à esquerda, "O QUE ELE FEZ ENQUANTO RODOU" em lista à direita, notas no rodapé | claro | 1280, lateral | ok |
| `r5c-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-pausado-claro-375` | idem | ação, números e notas empilhados numa caixa só | claro | 375, barra inferior | ok |
| `r5c-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

**As capturas são o que a ENTREGA-R5-C diz que são.**

---

## 2. Vereditos

| estado | R5-b | R5-c | o que decide |
|---|---|---|---|
| **preparando** | aprovado | **aprovado** | N3 consertado e medido. |
| **concluiu** | aprovado com ressalva | **aprovado** | N4 consertado. A ausência de ação (N5) está registrada como escolha na DUVIDA-16, com motivo, e não é defeito pela régua. |
| **no ar** | aprovado com ressalva | **aprovado com ressalva** | N2 consertado. A ressalva que sobra é só o I4 ("dessas conversas"), que é texto de produção. |
| **pausado** | reprovado — depende do Victor | **aprovado com ressalva — a ressalva é do Victor** | O N1 foi consertado sem abrir defeito novo, e a tela está composta. A única coisa que impedia aprovar é o B2, e o B2 não se conserta sem mudar a decisão de 16/09 (DUVIDA-15). Como a auditoria aceitou a discordância na R5-b, o que falta **não é trabalho da desenhista**. |

**Nota sobre o pausado.** Troquei "reprovado" por "aprovado com ressalva"
porque o defeito que restava deixou de ser de desenho e passou a ser de
decisão. **A ressalva não enfraqueceu.** Pela régua, esta tela continua sem
uma ação óbvia: os dois botões medem 422 × 54 a 1280 e 370 × 54 a 900, e
nenhuma ação habilitada aparece como principal. Se o Victor mantiver a
decisão como está, o estado da única conta real vai para produção assim.

---

## 3. Achado por achado da R5-b

| # | achado | resposta | conferido aqui, DOM | situação |
|---|---|---|---|---|
| **N1** | 462/358px vazios ao lado da âncora do parado | duas metades: ação e "O que ele fez enquanto rodou"; notas no rodapé | âncora 286–1228 (1280) e 22–860 (900), igual às outras faixas. Metades 287–757 / 757–1227 com a mesma altura (251 / 251). Sobra na metade da ação: **8px** a 1280 e 900, 0 a 375. Maior texto: manchete 30px; os números caíram para 20px | **consertado** |
| **N2** | "Guardar" fora da coluna dos campos | botão na coluna dos campos | borda esquerda do "Guardar" = borda esquerda do primeiro campo: **711 = 711** (1280), **402 = 402** (900), **37 = 37** (375) | **consertado** |
| **N3** | títulos das metades em alturas diferentes | "A preparação" só para leitor de tela | topo do contador = topo do título: **271 = 271** a 1280 e 900. O rótulo existe no DOM e tem área de 0, como esperado | **consertado** |
| **N4** | "e não termina" | "A otimização começa agora." | é o único texto com "otimização" no concluiu, nas 3 larguras | **consertado** |
| **N5** | concluiu sem ação principal | mantido (DUVIDA-16) | nenhum botão na tela, nas 3 larguras. O motivo está escrito: a primeira pergunta seria sobre o dia da publicação | **escolha registrada** |
| **B2** | pausado sem ação óbvia | sem mudança (DUVIDA-15) | "Voltar a anunciar" e "Falar com alguém" com **a mesma caixa**: 311–733 × 54 a 1280, 47–417 × 54 a 900 e 35–322 × 54 a 375 | **com o Victor** |

**Ritmo:** 32px entre todas as faixas vizinhas, nos 12 casos.
**Borda esquerda:** única em cada largura (286, 22, 18).
**Vazamento horizontal:** nenhum.

---

## 4. Achados novos

**Nenhum.**

~~**D8 — o "Guardar" alinha com o prefixo "R$", e não com o campo de
valor.**~~ **Retirado em 18/09.** A desenhista discordou por escrito
(`ENTREGA-R5-C.md` §2a), e o argumento se sustenta com a minha própria
medida:
- 711 é a borda esquerda da coluna dos campos, e as duas linhas começam ali
  (a de vendas e a de valor);
- o prefixo "R$" faz parte do campo de valor;
- alinhar o botão em 760 daria à coluna duas bordas esquerdas.

---

## 5. O que está BOM e não pode se perder

Tudo o que as duas auditorias anteriores listaram continua valendo. Somam-se:

- **O pausado composto:** a ação e o que rodou lado a lado, com a mesma altura,
  e as notas embaixo de tudo. Nenhum vazio, e o dinheiro menor que a
  manchete.
- **A pergunta do dia com percurso reto:** pergunta à esquerda, campo e botão
  numa coluna só à direita.
- **O preparando com as duas metades começando na mesma linha.**
- **A conclusão sem afirmar nada que o dado não sustente.**
- **As rodadas R5-b e R5-c responderam achado por achado, com número**, e o
  que ficou de fora veio com motivo escrito e com a mudança exata que o
  Victor faria.

---

## 6. O que continua aberto, e de quem é

| item | de quem | onde |
|---|---|---|
| B2: a principal desabilitada pode pesar mais que a única saída que funciona? | **Victor** | DUVIDA-15 |
| "Otimizar" ligado à etapa `numeros` na partição de produção | **Victor** | DUVIDA-14 |
| "dessas conversas" com conversas não medidas (I4) | **Gabriel** / produção | `lib/dia-seguinte/pergunta.ts:28` |
| os textos da bancada (conclusão, motivo, "O que ele fez enquanto rodou") | **Gabriel** | DUVIDA-12 |
| "uma vez" sem fonte em produção | backend | DUVIDA-11 |
| o concluiu sem a pergunta do dia | **Victor** | DUVIDA-16 |
| três nomes para "falar com gente", "Início" sem item ativo na bancada, barra inferior a 900, "quinta-feira" hifenizado | produção (`Casco`, `NavItem`, `frases.ts`) | AUDITORIA-R5 I1, D2, D3, D7 |

*A auditoria não propõe implementação.*
