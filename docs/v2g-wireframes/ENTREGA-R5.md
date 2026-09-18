# Entrega — Início canônico, rodada 5

17/09/2026, branch `design-r5`. Escopo: **só** a bancada
`/exemplo/inicio-{preparando,concluiu,no-ar,pausado}`. Nenhum arquivo de
produção editado, nenhum commit, nenhum deploy. Esperando a auditoria.

---

## 0. O que depende de decisão humana

1. **O momento "acabou de concluir" não tem fonte** (DUVIDA-11). A bancada
   desenha; a produção, sem o dado, cairia direto no momento de depois. O
   pedido ao backend está escrito lá, com o motivo de a gravação **não**
   poder acontecer no carregamento da página.
2. **Textos desta rodada esperando o Gabriel** (DUVIDA-12): a mensagem da
   conclusão, o motivo do botão desabilitado e o rótulo "Enquanto rodou".
3. **A pergunta do dia sumiu do estado parado** (DUVIDA-13), para não
   haver duas principais. Venda que chega depois da pausa fica sem lugar
   no Início.
4. **Três nomes para falar com gente numa tela de celular** (DUVIDA-9,
   agravada): "Falar com uma pessoa" (topo do `Casco`, produção), "Falar
   com alguém" (bancada e lateral) e "Falar com a gente" (botão da etapa,
   que vem de `lib/estado/frases.ts`, produção). Nenhum dos dois de
   produção foi tocado.

---

## 1. As três decisões, aplicadas

| Decisão | O que a tela faz | Registro |
|---|---|---|
| "Gestor" é a V2G (Victor, 16/09) | a frase de apoio do parado aparece **inteira**, da fonte única, na faixa do topo | `decisoes.md`; DUVIDA-1 resolvida; DUVIDA-10 |
| "Voltar a anunciar" existe e é do dono (Victor, 16/09) | principal do parado, **desabilitada**, com o motivo embaixo ligado por `aria-describedby`; "Falar com alguém" em secundária | `decisoes.md`, como exceção datada à regra de omitir; DUVIDA-6 resolvida |
| A trilha aparece uma vez e some (briefing de 17/09) | quatro momentos, decididos por `esteveNoAr()` + cadeia fechada; nenhum campo novo, nada no navegador | `decisoes.md`; DUVIDA-8 resolvida; DUVIDA-11 |

## 2. A composição nova

A arrumação da rodada 4 foi jogada fora: o herói cobalto em caixa, a
coluna da direita e o cartão do comando ao lado da lista. A página agora é
**uma coluna em quatro faixas**, na mesma ordem nos quatro momentos:

1. **Onde estou** — selo, manchete (`h1`) e apoio, sem caixa. Os três vêm
   de `fraseDeVeiculacao()`; a tela não escreve frase de estado.
2. **A âncora** — um bloco, o único que muda de forma entre os momentos.
3. **Os números** — quando existem.
4. **O resto** — "se você quiser" e a faixa do comando.

A divisão interna de cada faixa é decidida por `@container` na largura do
conteúdo, e não por `@media` na janela. Foi a janela dizendo "largo"
enquanto o conteúdo era estreito que fez "Em andamento" quebrar.

### A âncora de cada momento

| Momento | Condição | A âncora | A ação |
|---|---|---|---|
| **a) preparando** | `!esteveNoAr` | trilha com contador verdadeiro ("1 de 4 etapas concluídas") + a etapa aberta, lado a lado (2:3) no largo | a da etapa aberta (`proximo.acao`) |
| **b) concluiu** | esteve no ar + cadeia fechada + `mostrarConclusao` | "A preparação terminou", 4 de 4, as quatro fases numa faixa, e o aviso de que é a última vez | a pergunta do dia |
| **c) no ar — o cliente de três meses** | esteve e está no ar | **Investido** (plataforma, com o período) **×** **Voltou** (o que o dono contou, "em 18 de 30 dias"), e a frase de nível do backend | a pergunta do dia |
| **parado** | esteve e não está | "Voltar a anunciar" desabilitado + motivo + "Falar com alguém" / o que rodou: investido e os números da plataforma | nenhuma habilitada principal; a secundária funciona |

**Sobre o (c).** É a tela de quem paga todo mês. Ela responde "isso está me
dando dinheiro?" com os dois números que o produto promete — quanto
investi, quanto voltou —, cada um dizendo quem o escreveu. Não divide um
pelo outro: os dois lados cobrem dias diferentes (18 dos 30 têm resposta
do dono), e a razão seria uma mentira exata. Quem diz se está bom ou ruim é
só a frase de nível, como veio. Os dados do (c) são **inventados por
inteiro** e marcados assim em `lib/exemplo.ts`; a frase de nível é a única
já observada em produção.

## 3. Os quatro consertos da rodada 4

| Defeito da R4 | O que foi feito | Onde ver |
|---|---|---|
| vazio à direita no "no ar" em 1280 | a âncora do (c) tem duas metades com conteúdo real: investido e voltou | `r5-no-ar-*-1280` |
| sobra abaixo do comando no preparando | o comando virou **faixa de uma linha** no fim, sem cartão ao lado da lista; a âncora do preparando ficou 2:3 | `r5-preparando-*-1280` |
| "Em andamento" em duas linhas a 375 | no estreito a trilha são quatro barras e **uma** linha "Agora: Criar · em andamento"; no largo, uma fase por linha com o rótulo sem quebrar | `r5-preparando-*-375`, `*-900` |
| (achado nesta rodada) R$ 10,25 seguido de vazio na metade direita do parado | os números da plataforma entraram nessa metade; a seção separada deixou de existir no parado | `r5-pausado-*-1280` |

**Dois defeitos meus, achados olhando o rascunho e consertados antes da
captura final:** os campos da pergunta do dia esticavam até ~1.200px
(limitados a 560px por fora, sem tocar no componente), e a frase de nível
encostava na borda de baixo da âncora do parado quando não havia link
depois dela.

## 4. As 24 capturas, abertas uma a uma

`capturas/r5/`, 4 momentos × 2 temas × 3 larguras. Driver CDP próprio, sem
dependência, no scratchpad da sessão. O indicador de desenvolvimento do
Next ("N") é removido antes de fotografar — é da ferramenta, não da tela.

Relatório do driver, nas 24: `vazaNaHorizontal: false`, `pareceLogin:
false`, e nenhum de `R$ 0,00`, `0 conversas`, `erro`, `Nada está
esperando`, `em breve`, estrela. Principal habilitada: `Falar com a gente`
(preparando), `Guardar` (concluiu e no ar), nenhuma (parado, onde a única
desabilitada é `Voltar a anunciar`).

| arquivo | manchete visível | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r5-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | lista 1 de 4, Criar em andamento, "Falar com a gente" | claro | 1280, lateral | ok |
| `r5-preparando-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-preparando-claro-900` | idem | idem, rótulo em uma linha | claro | 900, barra inferior | ok |
| `r5-preparando-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-preparando-claro-375` | "Seu anúncio ainda / não foi ao ar." | 4 barras + "Agora: Criar · em andamento" | claro | 375, barra inferior | ok |
| `r5-preparando-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-concluiu-claro-1280` | "Seu anúncio está no ar." | selo lima, 4 de 4 em faixa, aviso de última vez, pergunta, 4 números | claro | 1280, lateral | ok |
| `r5-concluiu-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-concluiu-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-concluiu-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-concluiu-claro-375` | idem | 4 barras cheias, números em lista | claro | 375, barra inferior | ok |
| `r5-concluiu-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-no-ar-claro-1280` | "Seu anúncio está no ar." | R$ 857,55 × R$ 2.403,00, pergunta, 3 números | claro | 1280, lateral | ok |
| `r5-no-ar-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-no-ar-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-no-ar-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-no-ar-claro-375` | idem | as duas metades empilhadas, números em lista | claro | 375, barra inferior | ok |
| `r5-no-ar-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |
| `r5-pausado-claro-1280` | "Seu anúncio já rodou / e não está no ar agora." | selo neutro, botão desabilitado + motivo, R$ 10,25 + lista | claro | 1280, lateral | ok |
| `r5-pausado-escuro-1280` | idem | idem | escuro | 1280, lateral | ok |
| `r5-pausado-claro-900` | idem | idem | claro | 900, barra inferior | ok |
| `r5-pausado-escuro-900` | idem | idem | escuro | 900, barra inferior | ok |
| `r5-pausado-claro-375` | idem | ação empilhada sobre os números | claro | 375, barra inferior | ok |
| `r5-pausado-escuro-375` | idem | idem | escuro | 375, barra inferior | ok |

## 5. Contraste das peças novas

Calculado com a fórmula WCAG sobre os valores dos tokens em `globals.css`
(script `node -e` na sessão; composição de alfa feita à mão sobre o fundo):

| peça | claro | escuro |
|---|---|---|
| botão desabilitado (`--ink-mute` / `--ice-soft`) | 5,07 | 4,75 |
| selo neutro (`--texto-fraco` / 6% navy sobre página) | 5,81 | 8,14 |
| selo lima (`--black` / `--lime`) | 17,56 | 15,34 |
| motivo (`--texto-fraco` / `--surface`) | 7,06 | 8,28 |
| eyebrow (`--texto-discreto` / `--surface`) | 5,59 | 5,35 |

**Não medido:** o contraste não-textual das barras da trilha a 375px.

## 6. Verificações — resultados reais

```
pnpm typecheck                        EXIT=0
pnpm build                            EXIT=0
pnpm conferir                         EXIT=1   ← conferir:nichos, 67/79
```

**O vermelho é o conhecido.** Quem falha é `conferir:nichos` ("pizzaria
sobra um -> Enter escolhe restaurante (deu livre)"), que bate no backend
ao vivo, cuja lista encolheu de 10 para 8. `grep -cE
"exemplo|canonico|TelaCanonica" scripts/conferir-nichos.ts` → **0**. Os
seis antes dele deram TUDO CERTO. Os doze que o `&&` pulou, um a um:

```
dia-seguinte 157/157 · apresentada 27/27 · signed-request 20/20 ·
identidade 6/6 · veiculacao 117 · resultado 86/86 ·
campanha-da-sessao 17/17 · envio 48/48 · inicio 39/39 · analise 30/30 ·
portao 8/8 · escolha-de-campo 9/9                      — todos EXIT=0
```

`conferir:veiculacao` passar prova que a cópia nova não escreve frase de
veiculação fora da fonte única.

**A bancada continua fora de produção**, depois do `pnpm build`:

```
grep -rl <texto> .next --exclude-dir=cache --exclude-dir=dev | wc -l
  0  EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G
  0  Este botão ainda não funciona por aqui
  0  Esta é a última vez que a preparação
  0  consolidadoDeTresMeses
  0  ancoraPreparando                     (nem no source map, diferente da R4)
  2  Os primeiros sinais                  (controle positivo: a tela real)

next start -p 3113:
  404 /exemplo/inicio-preparando · 404 /exemplo/inicio-concluiu
  404 /exemplo/inicio-no-ar      · 404 /exemplo/inicio-pausado
  404 /exemplo/inicio            · 200 /entrar
```

## 7. `git status`, arquivo por arquivo

```
 M app/exemplo/[tela]/page.tsx                   a rota inicio-concluiu e as duas props novas
 M app/exemplo/_canonico/TelaCanonica.tsx         a tela refeita
 M app/exemplo/_canonico/TelaCanonica.module.css  idem; CRLF preservado
 M docs/decisoes.md                               as três decisões; CRLF preservado
 M docs/v2g-wireframes/DUVIDAS.md                 1, 6 e 8 resolvidas; 10 a 13 novas
 M lib/exemplo.ts                                 quatro estados; o cliente de três meses
?? docs/v2g-wireframes/capturas/r5/               as 24 capturas
?? docs/v2g-wireframes/ENTREGA-R5.md              este arquivo
?? docs/estado/inicio-canonico-r5-17-09.md        o registro da sessão
 M docs/estado/indice.md                          a linha do registro
```

Os avisos de `LF will be replaced by CRLF` em `page.tsx`, `lib/exemplo.ts`
e `DUVIDAS.md` são do `autocrlf` da máquina: os três já eram LF antes desta
rodada, e o final de linha deles não mudou.

Intactos: `app/(protected)/`, `app/(fluxo)/`, `app/(public)/`,
`components/`, `lib/veiculacao/`, `lib/estado/`, `app/globals.css`,
`proxy.ts`, `docs/desenho/`.

## 8. O que ainda não ficou bom

1. **No parado a 1280 e 900, a metade da ação termina antes da metade dos
   números.** Lido na captura; a diferença não foi medida no DOM.
2. **No parado, nenhuma ação domina.** O botão desabilitado perde o
   cobalto e fica em gelo; a secundária é cinza. Os dois têm peso
   parecido, e o que domina a âncora é o R$ 10,25. É efeito direto da
   decisão de 16/09 (principal desabilitada), e o auditor deve olhar.
3. **O cartão da pergunta do dia tem vazio à direita no largo**, porque os
   campos foram limitados a 560px e o cartão é de produção. O título dele
   ("Uma pergunta rápida sobre ontem") é 16px, contra 20px dos outros
   títulos de faixa — também de produção, não tocado.
4. **No escuro a 375px, a barra da fase atual se distingue pouco das
   travadas.** A linha "Agora: Criar · em andamento" carrega a informação;
   a barra é redundante.
5. **A 900px o `Casco` mostra a barra inferior, não a lateral.** O contrato
   diz lateral a partir de 900. É comportamento do `Casco`, igual na R4.
6. **Sem estado de carregamento** e **sem teste automatizado** da tela —
   ela vive fora da suíte por ser bancada.

## 9. Fora do escopo, registrado

- **`AGENTES.md` não existe no disco** (`find . -name AGENTES.md` → 0). As
  regras seguidas são as que vieram no prompt da sessão.
- **O índice de estado não tinha as rodadas de 16/09** (R1 a R4). A linha
  desta rodada no índice aponta para as entregas anteriores; os documentos
  delas não foram tocados.
