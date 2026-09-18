# Entrega — Início canônico, rodada 5-b (resposta à auditoria)

17/09/2026, branch `design-r5`, sobre o commit `72e474a`. Responde a
[`AUDITORIA-R5.md`](./AUDITORIA-R5.md) achado por achado. Só a bancada
`/exemplo/` e documentos mudaram; nenhum arquivo de produção, nenhum commit.
Capturas novas em [`capturas/r5-b/`](./capturas/r5-b/).

---

## 0. O que depende de decisão humana

1. **B2 — discordância registrada (DUVIDA-15).** Consertei o peso do
   dinheiro e a sobra da caixa, mas não visto "Falar com alguém" de
   principal: isso inverte a decisão de 16/09. Se o Victor preferir, são
   duas classes.
2. **DUVIDA-14.** O conserto do B1 está na bancada; o conserto da família
   é renomear ou separar "Otimizar" em `lib/estado/frases.ts` (produção).
3. **I1, I4, D2, D3, D7 são de produção** (`Casco`, `NavItem`,
   `lib/dia-seguinte/pergunta.ts`). Escrevi a mudança; não apliquei.
4. **Textos da bancada esperando o Gabriel** (DUVIDA-12): a conclusão
   reescrita e o motivo do botão desabilitado.

---

## 1. Achado por achado

| # | Achado | O que fiz | Medição depois |
|---|---|---|---|
| **B1** | "Otimizar ✓" e "4 de 4" na conclusão | **Consertado.** A conclusão mostra as três fases que terminam (Preparar, Criar, Publicar) e diz "A otimização começa agora, e não termina." Sem contador. | nomes visíveis na conclusão, no DOM: `[Preparar, Criar, Publicar]` nas 3 larguras |
| **B2** | pausado sem ação óbvia | **Consertado em parte, discordado em parte** (DUVIDA-15). R$ 10,25 saiu da âncora para a grade; a âncora é só a ação, 480px; os dois botões com a mesma largura; o motivo aponta para o de baixo. Não troquei os papéis dos botões. | sobra na caixa da ação: **0px** nas 3 larguras (era 79/69). Maiores textos: manchete 30px; números 24px |
| **I1** | quatro nomes para quem ajuda | **Consertado na bancada:** o motivo diz "o seu gestor, a V2G", o mesmo nome do apoio. **Fica de produção:** "Falar com uma pessoa" no topo do `Casco` (`components/ui/Casco.tsx:212`) contra "Falar com alguém" na lateral (`:159`). A mudança exata: o texto de `:212` para "Falar com alguém". | — |
| **I2** | 60px abaixo da pergunta | **Consertado.** O `margin-bottom: 28px` do `.rc-bloco` é zerado por fora, no invólucro da bancada. | ritmo entre faixas: **32px em todos os 12 casos**, pergunta inclusa |
| **I3** | vazio à direita da pergunta; título de 16px | **Consertado.** No largo, pergunta à esquerda e campo à direita (simulado com `<style>` antes de editar); título da faixa em 20px, como os outros. | campos terminam em x=1212, borda interna da caixa em 1213 (antes: 866 × 1228) |
| **I4** | "dessas conversas" com conversas não medidas | **Não mexi — texto de produção** (`lib/dia-seguinte/pergunta.ts:28`), e copy é do Gabriel. Proposta: "Quantas vendas vieram do anúncio ontem?" | — |
| **I5** | metade da ação sobrava 79/69px | **Consertado** junto com o B2: a âncora do parado é uma coluna só. | **0px** |
| **I6** | a 375, a conclusão não dizia o que acabou | **Consertado.** As três fases aparecem com nome em todas as larguras. | ver B1 |
| **I7** | barra atual quase igual às travadas no escuro | **Consertado.** Barras em `--cobalt-ink`; a atual é **meia barra**, forma além de cor. | contraste não-textual, escuro: barra × travada **4,46:1**, barra × superfície **5,54:1** (antes, `--cobalt`: 1,69 e 2,10). Claro: 5,65 e 7,32 |
| **D1** | rótulo repete o título ou o botão | **Consertado.** A tarja sai quando o título já começa com ela; o eyebrow "VOLTAR A ANUNCIAR" saiu. | — |
| **D2** | "Início" não aparece ativo | **Não mexi — produção** (`components/ui/NavItem.tsx:24` compara com `/inicio`). É efeito da rota da bancada; em produção o item acende. | — |
| **D3** | barra inferior a 900 | **Não mexi — produção**, comportamento do `Casco`, igual na R4. | — |
| **D4** | colunas desalinhadas no concluiu | **Discordo.** Os números têm quatro células porque são quatro números; forçar três esconderia o investido, e forçar quatro no "se você quiser" cria uma célula vazia. A borda esquerda e a direita batem (medido: faixas em 286 e até 1946 a 1280). | — |
| **D5** | "no ar agora" com gasto de 10 dias atrás | **Consertado na fixture.** No concluiu, os três dias reais foram trazidos para os três dias antes de hoje, no fuso de São Paulo. Os valores continuam os da conta real. | "com gasto medido de 14/09 a 16/09" nas capturas de 17/09 |
| **D6** | investido e voltou lado a lado, períodos diferentes | **Mantido, registrado como pista.** As legendas dizem o período de cada lado ("de 18/08 a 16/09" × "em 18 de 30 dias"), a tela não divide um pelo outro e a frase de nível do backend é a única que julga. Mudar a composição é decisão de desenho que prefiro que o Victor tome olhando. | — |
| **D7** | "quinta-feira" hifeniza a 375 | **Não mexi — produção** (`Casco`). | — |

Três defeitos meus apareceram olhando as capturas da R5-b e foram
consertados antes da captura final:
- as três fases da conclusão ficavam juntas à esquerda (`max-content`); agora
  ocupam a faixa em três colunas iguais;
- a caixa da ação tinha 40px de respiro em cima e 24 embaixo (margem do
  primeiro botão somando com o padding); agora 24 e 24;
- no mesmo passo, a fixture do concluiu terminava "hoje" em UTC às 21h de São
  Paulo; o último dia agora é ontem, no fuso de São Paulo.

## 2. As 24 capturas de `capturas/r5-b/`, abertas uma a uma

Relatório do driver nas 24: `vazaNaHorizontal: false`, `pareceLogin: false`,
nenhum de `R$ 0,00`, `0 conversas`, `erro`, `Nada está esperando`, `em breve`,
estrela. Principal habilitada: `Falar com a gente` (preparando), `Guardar`
(no ar), **nenhuma** (concluiu e pausado; no pausado a única desabilitada é
`Voltar a anunciar`).

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5b-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | lista 1 de 4, sem tarja repetida, "Falar com a gente" | claro | 1280, lateral | ok |
| `r5b-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-preparando-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | barras, a 2ª pela metade, "Agora: Criar" | claro | 375, barra inferior | ok |
| `r5b-preparando-escuro-375` | idem | idem, meia barra visível no escuro | escuro | 375, barra inferior | ok |
| `r5b-concluiu-claro-1280` | "Seu anúncio está no ar." | 3 fases em colunas, "A otimização começa agora", sem pergunta | claro | 1280, lateral | ok |
| `r5b-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-concluiu-claro-375` | idem | 3 fases com nome, uma por linha | claro | 375, barra inferior | ok |
| `r5b-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5b-no-ar-claro-1280` | "Seu anúncio está no ar." | investido × voltou; pergunta com campo à direita; 3 números | claro | 1280, lateral | ok |
| `r5b-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-no-ar-claro-375` | idem | tudo empilhado, números em lista | claro | 375, barra inferior | ok |
| `r5b-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5b-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | caixa só da ação, 480px; R$ 10,25 na grade | claro | 1280, lateral | ok |
| `r5b-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5b-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5b-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5b-pausado-claro-375` | idem | ação de largura total, números em lista | claro | 375, barra inferior | ok |
| `r5b-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

## 3. Medições no DOM, com a bancada em `pnpm dev`

Rotas carregadas em `<iframe>` de 1280, 900 e 375 (o `innerWidth` medido deu
exatamente essas larguras), `getBoundingClientRect` lido lá dentro:

```
estado@largura   espaço entre faixas   sobra na ação   vazamento
preparando@1280  32·32·32              —               não
concluiu@1280    32·32·32·32           —               não
no-ar@1280       32·32·32·32·32        —               não
pausado@1280     32·32·32·32           0               não
(idem a 900 e a 375, os mesmos números nos 12 casos)
```

## 4. Verificações

```
pnpm typecheck                        EXIT=0
pnpm build                            EXIT=0
pnpm conferir                         EXIT=1   ← conferir:nichos, rede, conhecido
```

Os seis antes do `conferir:nichos` passaram. Os doze que o `&&` pula, um a
um, todos EXIT=0: dia-seguinte 157/157 · apresentada 27/27 ·
signed-request 20/20 · identidade 6/6 · veiculacao 117 · resultado 86/86 ·
campanha-da-sessao 17/17 · envio 48/48 · inicio 39/39 · analise 30/30 ·
portao 8/8 · escolha-de-campo 9/9.

**A bancada continua fora de produção**, depois do `pnpm build` (varredura em
Python no `.next`, sem `cache` e `dev`):

```
0  EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G
0  Este botão ainda não funciona por aqui
0  A otimização começa agora
0  FASE_CONTINUA
0  ancoraAcao
0  consolidadoDeTresMeses
2  Os primeiros sinais    (controle positivo: a /inicio real)

next start -p 3114:
  404 /exemplo/inicio-preparando · 404 /exemplo/inicio-concluiu
  404 /exemplo/inicio-no-ar      · 404 /exemplo/inicio-pausado
  404 /exemplo/inicio            · 200 /entrar
```

## 5. `git status`

Ver o registro em `docs/estado/inicio-canonico-r5-b-17-09.md`, que cola o
`git status` final e explica cada linha.
