# Entrega — Início canônico, rodada 5-c (resposta à reconferência)

17/09/2026, noite, branch `design-r5`, sobre o commit `17da160`. Responde
à [`AUDITORIA-R5-B.md`](./AUDITORIA-R5-B.md). Só a bancada `/exemplo/` e
documentos mudaram. Capturas em [`capturas/r5-c/`](./capturas/r5-c/); as
de `r5-b/` ficaram como estavam, porque são o que a auditoria conferiu.

---

## 0. O que depende de decisão humana

1. **B2 continua com o Victor (DUVIDA-15).** A reconferência aceitou a
   discordância e passou a decisão para ele. Nada muda nesta rodada: os dois
   botões seguem com a mesma caixa, porque inverter os papéis desfaz a
   decisão de 16/09.
2. **N5 — o concluiu sem a pergunta do dia** (DUVIDA-16, nova). Mantido,
   com o motivo escrito.
3. **Do que já estava aberto:** DUVIDA-14 ("Otimizar" na partição de
   produção), I4 ("dessas conversas", de produção) e os textos para o
   Gabriel (DUVIDA-12).

## 1. Achado por achado da reconferência

| # | Achado | O que fiz | Medição depois (DOM, iframe de 1280/900/375) |
|---|---|---|---|
| **N1** | 462/358px vazios ao lado da âncora do parado | **Consertado.** A âncora do parado voltou a ter duas metades: a ação à esquerda, "O que ele fez enquanto rodou" à direita, em lista de 20px (a manchete continua sendo o maior texto, 30px). As duas notas descem para o rodapé da âncora, embaixo das duas metades. | âncora 286–1231 a 1280 e 22–863 a 900, igual à coluna do conteúdo. Sobra dentro da metade da ação: **8px** (1280/900) e 0 (375, empilhada). Maiores textos: 30 (manchete) e 20 |
| **N2** | "Guardar" em outra coluna que os campos | **Consertado.** No largo o botão fica na coluna dos campos. | borda esquerda de "Guardar" = borda esquerda do campo: 713 = 713 (1280), 404 = 404 (900), 37 = 37 (375) |
| **N3** | títulos das duas metades em alturas diferentes no preparando | **Consertado.** O rótulo "A preparação" ficou só para leitor de tela; o contador é a primeira linha visível. | topo do contador = topo do título: 271 = 271 (1280 e 900). A 375 as metades empilham |
| **N4** | "e não termina" afirma mais do que a frase de baixo sustenta | **Consertado:** "A otimização começa agora." A frase de baixo continua dizendo que ela acontece enquanto o anúncio roda. | — |
| **N5** | concluiu sem ação principal | **Mantido**, registrado na DUVIDA-16. | — |

Duas medições minhas no caminho, antes da captura final:
- com as notas dentro da metade dos números, a metade da ação sobrava
  **102px**. As notas desceram para o rodapé e a sobra caiu para 48;
- com a lista a 12px por linha, ainda eram 48. A 8px por linha, **8px**.

**Ritmo:** 32px entre todas as faixas vizinhas nos 12 casos. **Vazamento
horizontal:** nenhum.

## 2. As 24 capturas de `capturas/r5-c/`, abertas uma a uma

Relatório do driver nas 24: `vazaNaHorizontal: false`, `pareceLogin: false`,
nenhum de `R$ 0,00`, `0 conversas`, `erro`, `Nada está esperando`, `em breve`,
estrela. Principal habilitada: `Falar com a gente` (preparando), `Guardar`
(no ar), nenhuma (concluiu e pausado; no pausado a única desabilitada é
`Voltar a anunciar`).

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5c-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | contador na altura do título ao lado | claro | 1280, lateral | ok |
| `r5c-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-preparando-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | barras, meia barra, "Agora: Criar" | claro | 375, barra inferior | ok |
| `r5c-preparando-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-concluiu-claro-1280` | "Seu anúncio está no ar." | 3 fases, "A otimização começa agora." | claro | 1280, lateral | ok |
| `r5c-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-concluiu-claro-375` | idem | 3 fases com nome, uma por linha | claro | 375, barra inferior | ok |
| `r5c-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-no-ar-claro-1280` | "Seu anúncio está no ar." | "Guardar" na coluna dos campos | claro | 1280, lateral | ok |
| `r5c-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-no-ar-claro-375` | idem | tudo empilhado | claro | 375, barra inferior | ok |
| `r5c-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5c-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | âncora de parede a parede: ação / números em lista; notas no rodapé | claro | 1280, lateral | ok |
| `r5c-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5c-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5c-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5c-pausado-claro-375` | idem | ação, números e notas empilhados na mesma caixa | claro | 375, barra inferior | ok |
| `r5c-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

## 3. Verificações

```
pnpm typecheck                        EXIT=0
pnpm build                            EXIT=0
pnpm conferir                         EXIT=1   ← conferir:nichos 67/79, rede, conhecido
```

Os doze que o `&&` pula, um a um, todos EXIT=0: dia-seguinte 157/157 ·
apresentada 27/27 · signed-request 20/20 · identidade 6/6 · veiculacao 117 ·
resultado 86/86 · campanha-da-sessao 17/17 · envio 48/48 · inicio 39/39 ·
analise 30/30 · portao 8/8 · escolha-de-campo 9/9.

**Bancada fora de produção**, depois do build (varredura em Python no
`.next`, sem `cache` e `dev`):

```
0  EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G
0  Este botão ainda não funciona por aqui
0  A otimização começa agora
0  FASE_CONTINUA · 0 ancoraParado · 0 numerosLista · 0 consolidadoDeTresMeses
2  Os primeiros sinais    (controle positivo: a /inicio real)

next start -p 3115:
  404 nas cinco rotas /exemplo/* · 200 /entrar
```
