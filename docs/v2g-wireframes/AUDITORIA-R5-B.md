# Auditoria visual — Início canônico, rodada 5-b (reconferência)

17/09/2026. Sessão AUDITOR, sem escrever código. Confere a
[`ENTREGA-R5-B.md`](./ENTREGA-R5-B.md) contra a
[`AUDITORIA-R5.md`](./AUDITORIA-R5.md).

**Commit auditado:** `17da160a9932b130135845048deca7e5c41204ca`, branch
`design-r5`.

**Pasta:** no começo, o `git status` mostrava dois arquivos sem commit,
`docs/estado/indice.md` (modificado) e
`docs/estado/inicio-canonico-r5-b-17-09.md` (novo). São o registro de
sessão da desenhista e não tocam em nenhum arquivo que a tela lê. Nada em
`app/` nem em `lib/` estava modificado. Rodei o mesmo `git status` **antes e
depois** da medição no DOM, e ele deu idêntico. A medição vale para o
`17da160`.

**Método:** o mesmo da R5.
- **Imagem.** As 24 capturas de `capturas/r5-b/`, abertas uma a uma.
- **DOM.** A bancada rodou em `pnpm dev`. Cada rota foi carregada em
  `<iframe>` de 1280, 900 e 375, e as medidas saíram de
  `getBoundingClientRect`.
- **Código.** Leitura das fontes.

Uma medição minha **caiu na conferência**: um script acusou 56px (1280/900)
e 77px (375) entre "O que a plataforma contou" e "Enquanto isso", no no-ar. O
script tomou o `<strong>` "Conversas:" como o fim da faixa, mas o parágrafo
vai até o fim dela. O espaço real é 32px. O achado não entra.

---

## 1. Conferência das 24 capturas

Largura pela imagem, com DPR 2: 2560 = 1280, 1800 = 900, 750 = 375. Nenhuma é
tela de login ou de erro. As 12 duplas claro/escuro têm a mesma anatomia,
conferida bloco a bloco.

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5b-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | 1 de 4, Criar em andamento, sem a tarja repetida, "Falar com a gente" | claro | 2560 px → 1280, lateral | ok |
| `r5b-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-preparando-claro-900` | idem | idem | claro | 1800 px → 900, barra inferior | ok |
| `r5b-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | barras, a 2ª pela metade, "Agora: Criar · em andamento" | claro | 750 px → 375, barra inferior | ok |
| `r5b-preparando-escuro-375` | idem | idem; **a meia barra é visível no escuro** | escuro | 375, barra inferior | ok |
| `r5b-concluiu-claro-1280` | "Seu anúncio está no ar." | selo lima, "A PREPARAÇÃO TERMINOU", ✓ Preparar/Criar/Publicar, "A otimização começa agora, e não termina." | claro | 1280, lateral | ok |
| `r5b-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-concluiu-claro-375` | idem | as três fases com nome, uma por linha | claro | 375, barra inferior | ok |
| `r5b-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5b-no-ar-claro-1280` | "Seu anúncio está no ar." | investido × voltou; pergunta com campos à direita; título de 20px | claro | 1280, lateral | ok |
| `r5b-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-no-ar-claro-375` | idem | tudo empilhado | claro | 375, barra inferior | ok |
| `r5b-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5b-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | caixa só da ação (480px); "O que ele fez enquanto rodou" com R$ 10,25 na grade | claro | 1280, lateral | ok |
| `r5b-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-pausado-claro-375` | idem | ação na largura toda, números em lista | claro | 375, barra inferior | ok |
| `r5b-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

**As capturas são o que a ENTREGA-R5-B diz que são.**

---

## 2. Vereditos

| estado | R5 | R5-b | o que decide |
|---|---|---|---|
| **preparando** | aprovado com ressalva | **aprovado** | O rótulo repetido saiu (D1). A meia barra resolve o escuro a 375 (I7). O que sobra é de produção ou detalhe (N3). |
| **concluiu** | reprovado | **aprovado com ressalva** | **B1 consertado:** sem "Otimizar ✓" e sem "4 de 4". Ficam três fases com nome nas três larguras (I6 consertado). A âncora agora manda sozinha, porque a pergunta saiu desta tela. Ressalva: a frase "e não termina" (N4). |
| **no ar** | aprovado com ressalva | **aprovado com ressalva** | I2 e I3 consertados, medidos. Ressalva: o I4 continua ("dessas conversas" com conversas não medidas), e é texto de produção. |
| **pausado** | reprovado | **reprovado — depende de decisão do Victor** | Melhorou: o R$ 10,25 não domina mais (24px, contra 30 da manchete) e a caixa da ação não sobra por dentro. Mas **continua sem ação óbvia** (B2), e o conserto que falta esbarra na decisão de 16/09 (DUVIDA-15, §3 abaixo). Achado novo: 462px vazios à direita da âncora a 1280 (N1). |

---

## 3. Achado por achado da R5

| # | R5 | resposta da desenhista | conferido aqui | situação |
|---|---|---|---|---|
| **B1** | "Otimizar ✓", "4 de 4" | três fases, sem contador, "A otimização começa agora" | 6 capturas: só Preparar, Criar e Publicar com ✓, e nenhum "4 de 4". DOM: os mesmos três nomes a 1280, 900 e 375 | **consertado** |
| **B2** | pausado sem ação óbvia | em parte (DUVIDA-15) | ver abaixo | **persiste — decisão do Victor** |
| **I1** | quatro nomes para quem ajuda | o motivo diz "o seu gestor, a V2G" | na bancada, o motivo e o apoio agora chamam a mesma pessoa pelo mesmo nome. Continuam, de produção: "Falar com uma pessoa" (topo do `Casco`, 900/375), "Falar com alguém" (lateral e botão) e "Falar com a gente" (`frases.ts`, preparando) | **consertado na bancada; família aberta em produção** |
| **I2** | 60px abaixo da pergunta | margem zerada por fora | DOM: a caixa da pergunta (`card`) termina junto com a faixa (876 = 876 a 1280; 1209 = 1209 a 375), e o espaço até a próxima faixa é **32px** | **consertado** |
| **I3** | vazio à direita da pergunta; título de 16px | pergunta à esquerda, campos à direita; título de 20px | DOM a 1280: campos em 711–1155 e 760–1155, título 20px. As capturas não mostram mais o vazio | **consertado** |
| **I4** | "dessas conversas" | não mexeu, é produção | continua nas 6 capturas do no-ar | **aberto — Gabriel/produção** |
| **I5** | metade da ação sobrava 79/69px | âncora de uma coluna | DOM: sobra de 1px (a borda) nas três larguras | **consertado** |
| **I6** | a 375 a conclusão sem nomes | três fases com nome | `r5b-concluiu-*-375`: Preparar, Criar, Publicar, uma por linha | **consertado** |
| **I7** | barra atual no escuro | meia barra em `--cobalt-ink` | `r5b-preparando-escuro-375`: a segunda barra aparece pela metade, e a forma se lê sem a cor. Os contrastes que a entrega informa (4,46 e 5,54) **não medidos** por mim | **consertado (na imagem)** |
| **D1** | rótulo repete título/botão | rótulo sai | preparando: a metade da direita começa direto no título. Pausado: não há mais "VOLTAR A ANUNCIAR" sobre o botão | **consertado** |
| **D2** | "Início" sem item ativo | produção | continua em todas as capturas (artefato da rota `/exemplo/`) | **aberto — produção, sem efeito em produção** |
| **D3** | barra inferior a 900 | produção | continua | **aberto — produção** |
| **D4** | 4 colunas × 3 no concluiu | **discordou** | O argumento se sustenta: quatro números são quatro células, e as bordas externas das faixas batem (DOM: todas começam em 286, 22 e 18). **Aceito a discordância.** O achado sai | **retirado** |
| **D5** | gasto de 10 dias atrás com "no ar agora" | datas da fixture trazidas para 14–16/09 | as capturas mostram "de 14/09 a 16/09". Registro: agora são **números reais com datas de fixture**. Serve à bancada, e está declarado na entrega | **consertado (fixture)** |
| **D6** | investido × voltou lado a lado | mantido como pista | segue como pista, não como defeito | **pista** |
| **D7** | "quinta-feira" hifenizado | produção | continua | **aberto — produção** |

### B2, com a discordância da desenhista

**O que melhorou, medido no DOM:**
- A maior fonte da tela agora é a manchete (30px). O R$ 10,25 caiu para 24px
  (20px a 375), dentro da grade de números. O dinheiro não domina mais.
- A caixa da ação não sobra por dentro: 1px, que é a borda.
- O motivo termina em "É só chamar.", logo acima do botão que funciona.

**O que não mudou, medido no DOM:**
- "Voltar a anunciar" e "Falar com alguém" têm **a mesma caixa**: 430 × 54 a
  1280 e 900, 287 × 54 a 375.
- Os dois têm o mesmo peso de fonte (700).
- Os dois têm fundo preenchido: o desabilitado em gelo/azul escuro, o ativo
  em cinza translúcido.
- Na captura clara, o desabilitado (fundo gelo) pesa **mais** que o ativo
  (fundo cinza).
- Não há principal habilitada na tela.

**A discordância é legítima.** A decisão de 16/09, §2, diz que "Voltar a
anunciar" é a principal e que a saída humana cai para secundária. Inverter
as classes desfaz isso, e não cabe à desenhista nem a mim.

**O que fica para o Victor decidir, olhando `r5b-pausado-*`:** a régua diz
que duas ações com o mesmo peso visual é defeito. A decisão diz qual é a
principal, mas não diz se uma principal **desabilitada** pode pesar mais que
a única saída que funciona. Enquanto isso não for decidido, o estado da
única conta real continua sem uma ação óbvia.

---

## 4. Achados novos da R5-b, por gravidade

### Incomoda

**N1 — No pausado, 462px vazios à direita da âncora.**
- **Onde:** `r5b-pausado-*-1280` e `*-900`, à direita da caixa da ação.
- **O que está errado:** medido no DOM, a âncora ocupa 286–766 a 1280 e
  22–502 a 900. A coluna de conteúdo vai até 1228 e 860. Sobram **462px**
  (1280) e **358px** (900) de faixa vazia ao lado da âncora, na primeira
  dobra, logo abaixo da manchete.
- **Por que incomoda:** é da mesma família do "vazio à direita no no-ar a
  1280", o primeiro defeito que a R5 disse ter consertado da R4. Se é
  intencional (uma âncora estreita de propósito), a tela não mostra a
  intenção.
- **Letra:** G.

### Detalhe

**N2 — No no-ar, "Guardar" fica numa coluna e os campos em outra.**
- **Onde:** `r5b-no-ar-*-1280` e `*-900`, dentro da caixa da pergunta.
- **O que está errado:** medido no DOM a 1280, os campos ficam em 711–1155
  e o botão em 305–404, debaixo das perguntas e não dos campos. O olho vai
  da pergunta (esquerda) ao campo (direita) e volta para a esquerda para
  guardar.
- **Registro:** é pista de percurso, não quebra de regra.
- **Letra:** E.

**N3 — No preparando largo, os títulos das duas metades não ficam na mesma
altura.**
- **Onde:** `r5b-preparando-*-1280` e `*-900`.
- **O que está errado:** com a tarja removida da metade direita (D1), "A gente
  está devendo o seu primeiro anúncio" sobe para a altura do rótulo "A
  PREPARAÇÃO" da esquerda. Não fica na altura de "1 de 4 etapas
  concluídas". Lido na imagem, **não medido no DOM**.
- **Letra:** E.

**N4 — "A otimização começa agora, e não termina."**
- **Onde:** `r5b-concluiu-*`, no título da segunda parte da âncora.
- **O que está errado:** a frase seguinte diz "Ela acontece enquanto o
  anúncio roda". Se o anúncio para (o estado pausado), a otimização para
  também. O "não termina" afirma mais do que a frase de baixo sustenta.
- **Dono do texto:** é texto da bancada, na fila do Gabriel (DUVIDA-12).
- **Letra:** J.

**N5 — O concluiu não tem ação principal.**
- **Onde:** `r5b-concluiu-*`.
- **O que está errado:** o DOM não acha nenhum botão na tela. A pergunta do
  dia saiu deste momento (DUVIDA-13, atualizada), e o único "para onde sigo"
  é o link "Ver meus anúncios".
- **Leitura:** não é defeito. O contrato manda o botão existir só quando a
  bola é do dono, e aqui não é. Registro porque é consequência direta da
  mudança: no dia da conclusão, o dono não tem onde contar uma venda.
- **Letras:** C e J.

---

## 5. A régua, por estado (R5-b)

**Ritmo (D), no DOM:** 32px entre todas as faixas vizinhas, nos 12 casos,
contando a caixa da pergunta. **Borda esquerda (E):** todas as faixas em
286, 22 e 18. **Vazamento horizontal:** nenhum nos 12 casos.

| estado | A — onde / o quê / para onde | B — âncora | C — ação | G — vazio | I — regras | J — verdade |
|---|---|---|---|---|---|---|
| preparando | as três respondem | a caixa trilha + etapa | uma: "Falar com a gente" | nenhum relevante | sem violação | o contador é verdadeiro (1 de 4) |
| concluiu | onde e o quê sim; o "para onde" é um link | a caixa da conclusão, sozinha | nenhuma (N5) | nenhum | lima só no selo "No ar"; ✓ em cobalto | sem "Otimizar ✓"; resta "e não termina" (N4) |
| no ar | as três respondem | investido × voltou | uma: "Guardar" | nenhum | sem violação | "dessas conversas" (I4, produção) |
| pausado | onde sim; o quê é fraco | a caixa da ação (a manchete continua sendo o maior texto) | **nenhuma óbvia** (B2) | **462 / 358px** à direita da âncora (N1) | desabilitado com motivo e exceção registrada | o apoio e o motivo agora concordam ("seu gestor", "a V2G") |

**F (destaque na dobra), pista:** continuam três títulos de link em cobalto
em "se você quiser", em todos os estados. Não disputam com a âncora em
nenhum.

---

## 6. De onde vem cada frase de estado (o que mudou desde a R5)

A tabela completa está na `AUDITORIA-R5.md` §6. Mudanças:

| frase | quem escreve | fonte do dado |
|---|---|---|
| "A PREPARAÇÃO TERMINOU", as três fases | `fasesDaCadeia()` (produção), **filtrada na bancada** por `FASE_CONTINUA = "otimizar"` em `TelaCanonica.tsx` (DUVIDA-14) | **FIXTURE** (etapas) |
| "A otimização começa agora, e não termina." e o corpo | **texto da bancada**, sem fonte de produto (DUVIDA-12) | `mostrarConclusao`, que **só a bancada liga** (DUVIDA-11) |
| motivo do botão desabilitado ("…é o seu gestor, a V2G. É só chamar.") | **texto da bancada** (DUVIDA-12) | — |
| "O que ele fez enquanto rodou" | **texto da bancada** | — |
| "com gasto medido de 14/09 a 16/09" (concluiu) | a tela, a partir das datas do consolidado | **FIXTURE**: números reais da conta V2G (05–07/09) **com datas trocadas** para os três dias antes de hoje |
| selo, manchete e apoio | `fraseDeVeiculacao()` — fonte única, produção | **FIXTURE** (`veiculacao`) |

**O "conserto da família" do B1 não foi feito, e está certo não ter sido.**
Em produção, `lib/estado/frases.ts:987` continua ligando "Otimizar" à etapa
`numeros`, e a `/inicio` real continua podendo mostrar "Otimizar ✓". O filtro
vive só na bancada. A decisão está na DUVIDA-14 e é do Victor: renomear a
fase ou tirá-la da trilha.

---

## 7. O que está BOM e não pode se perder

Tudo o que a `AUDITORIA-R5.md` §7 lista continua valendo: o ritmo de 32px, a
borda esquerda única, as alturas iguais na linha, nenhum vazamento, o
pausado sem "Concluído", a fonte única, a lima só em "No ar", o travessão
com a linha explicando, e a mesma coluna de quatro faixas. Somam-se:

- **A conclusão diz a verdade sobre o que acabou.** Três fases, sem contador,
  e a otimização tratada como começo.
- **O concluiu tem uma âncora só.** Tirar a pergunta acabou com a disputa.
- **A meia barra.** A fase atual se lê pela forma, e não só pela cor. Isso vale
  para o escuro e para quem não distingue a cor.
- **O dinheiro do pausado no lugar certo:** do tamanho dos outros números,
  sem competir com a manchete.
- **Apoio e motivo concordando** sobre quem retoma, com o mesmo nome.
- **As discordâncias da desenhista vieram por escrito, com o motivo e com a
  mudança exata** que o Victor faria se decidir o contrário (DUVIDA-14 e 15).
  É assim que a discordância deve chegar.

---

*A auditoria não propõe implementação. O "como" é da desenhista; o que
depende de decisão está em DUVIDA-14 e DUVIDA-15.*
