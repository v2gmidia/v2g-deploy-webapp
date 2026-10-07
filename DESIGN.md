---
# Catálogo conjunto: base global legada + identidade editorial de 06/10/2026.
# Chaves sem prefixo editorial preservam o registro anterior de app/globals.css.
# editorial-* vem de app/produto-editorial.css; não é uma substituição de :root.
# O gerador antigo lê só globals.css: não o execute sobre este arquivo sem
# preservar este suplemento e revisar o escopo descrito em Overview.
name: V2G — produto editorial
description: Identidade da LP aplicada ao Casco do produto, com temas preservados.
colors:
  black: "#000C08"
  card-cobalt-ink: "#FFFFFF"
  card-ice-bg: "#DCEEFB"
  cobalt: "#0743DC"
  cobalt-dark: "#0532A5"
  crit: "#AD3E38"
  crit-soft: "#F9E4E2"
  fundo-controle: "rgb(var(--navy-rgb) / 0.06)"
  good: "#237644"
  good-soft: "#E2F3E8"
  ice: "#B0E9FD"
  ice-soft: "#E3F6FE"
  ink: "#111E2F"
  ink-mute: "#5A6977"
  ink-soft: "#485A6B"
  lime: "#E8FC65"
  line: "#D9E3E6"
  navy: "#111E2F"
  offwhite: "#F1F6F7"
  plate: "#111E2F"
  plate-ink: "#F1F6F7"
  sidebar-active-bg: "rgb(255 255 255 / 0.15)"
  sidebar-ink: "rgb(var(--plate-ink-rgb) / 0.78)"
  sidebar-ink-strong: "#FFFFFF"
  sidebar-line: "rgb(255 255 255 / 0.16)"
  surface: "#FEFEFE"
  surface-2: "#FFFFFF"
  warn: "#8D6116"
  warn-soft: "#FAEFD8"
  white: "#FFFFFF"
  canvas-escuro: "#050A13"
  card-cobalt-bg-escuro: "#0B1A38"
  card-cobalt-ink-escuro: "#E9EFF8"
  card-ice-bg-escuro: "#0B1E2C"
  card-ice-ink-escuro: "#E9EFF8"
  card-lime-bg-escuro: "#1B2110"
  cobalt-escuro: "#0239C7"
  cobalt-dark-escuro: "#1B4BE8"
  cobalt-ink-escuro: "#5C88FA"
  crit-escuro: "#E8756D"
  crit-soft-escuro: "#2C1210"
  fundo-barra-escuro: "#080E1A"
  fundo-controle-escuro: "rgb(210 224 240 / 0.06)"
  fundo-pagina-escuro: "#050A13"
  fundo-superficie-escuro: "#0C1523"
  fundo-topo-escuro: "#050A13"
  good-escuro: "#4FC57E"
  good-soft-escuro: "#0E2418"
  ice-escuro: "#8FD9F5"
  ice-soft-escuro: "#0E2231"
  ink-escuro: "#E9EFF8"
  ink-mute-escuro: "#7D8CA1"
  ink-soft-escuro: "#9FB0C6"
  lime-escuro: "#D5EF25"
  line-escuro: "#1C2840"
  linha-divisoria-escuro: "#1C2840"
  navy-escuro: "#E9EFF8"
  offwhite-escuro: "#050A13"
  sidebar-active-bg-escuro: "#1B44E5"
  sidebar-bg-escuro: "#080E1A"
  sidebar-ink-escuro: "rgb(233 239 248 / 0.66)"
  sidebar-line-escuro: "rgb(233 239 248 / 0.10)"
  surface-escuro: "#0C1523"
  surface-2-escuro: "#111C2E"
  texto-discreto-escuro: "#7D8CA1"
  texto-discreto-sobre-placa-escuro: "rgb(233 239 248 / 0.66)"
  texto-forte-escuro: "#E9EFF8"
  texto-fraco-escuro: "#9FB0C6"
  texto-sobre-escuro-escuro: "#FFFFFF"
  warn-escuro: "#E0A63C"
  warn-soft-escuro: "#2A1F0A"
  # Valores efetivos dentro de .app-shell.v2g-editorial, tema claro.
  editorial-offwhite: "#ECF5F2"
  editorial-canvas: "#F8FBFA"
  editorial-surface: "#ECF5F2"
  editorial-surface-2: "#FFFFFF"
  editorial-ink: "#102A35"
  editorial-ink-soft: "#49606A"
  editorial-ink-mute: "#526A73"
  editorial-cobalt: "#0B40DA"
  editorial-cobalt-dark: "#092EAA"
  editorial-cobalt-ink: "#0B40DA"
  editorial-ice: "#B0E9FD"
  editorial-ice-soft: "#E4F4F9"
  editorial-lime: "#EAFF64"
  editorial-line: "#CCD9D6"
  editorial-control-line: "#70877E"
  editorial-task-surface: "#E2EEE9"
  editorial-good: "#24683F"
  editorial-good-soft: "#E1EFE5"
  editorial-warn: "#805916"
  editorial-warn-soft: "#F5EBD7"
  editorial-crit: "#A43530"
  editorial-crit-soft: "#F8E7E5"
  editorial-plate: "#051225"
  editorial-plate-ink: "#ECF5F2"
  editorial-sidebar-ink: "#BED0DB"
  editorial-sidebar-line: "#314052"
  # Variações do mesmo escopo: Escuro e Do aparelho quando o aparelho é escuro.
  editorial-offwhite-escuro: "#142337"
  editorial-canvas-escuro: "#0D1929"
  editorial-surface-escuro: "#142337"
  editorial-surface-2-escuro: "#1B2C40"
  editorial-ink-escuro: "#ECF5F2"
  editorial-ink-soft-escuro: "#BACAD6"
  editorial-ink-mute-escuro: "#A7BBCB"
  editorial-cobalt-ink-escuro: "#9FBFFF"
  editorial-ice-soft-escuro: "#1A3046"
  editorial-line-escuro: "#354A60"
  editorial-control-line-escuro: "#6D859A"
  editorial-task-surface-escuro: "#182D42"
  editorial-good-escuro: "#A6D8B5"
  editorial-good-soft-escuro: "#18392D"
  editorial-warn-escuro: "#EBC885"
  editorial-warn-soft-escuro: "#3B301B"
  editorial-crit-escuro: "#FFB3AC"
  editorial-crit-soft-escuro: "#422B2F"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"
  monoLegado:
    fontFamily: "Consolas, SFMono-Regular, Courier New, monospace"
  # Papéis locais observados; não são novos degraus de texto corrido.
  editorial-marca:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 680
    lineHeight: 1
    letterSpacing: "-0.04em"
  editorial-marca-assinatura:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.13em"
  editorial-titulo-mobile:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  editorial-inicio-estado:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.1vw, 40px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.04em"
  scale:
    legenda: "12px"
    corpo: "14px"
    titulo: "16px"
    bloco: "20px"
    tela: "24px"
    destaque: "30px"
---
# Sistema visual da V2G

## Overview

**Identidade vigente no Casco: linguagem editorial da LP, aprovada em
06/10/2026 e adaptada à operação.** A referência clara combina papel
esverdeado, tinta escura, ações em cobalto e pequenos sinais em lima. A
hierarquia vem da tipografia, do espaço e das linhas divisórias; tarefas e
estados reais determinam onde há uma superfície de destaque.

A fonte visual é a LP `https://www.v2gmidia.com.br/`; a referência local
fica em `../lp/index.html` e `../lp/assets/lp.v5.css`.

O sistema implementado está em `app/produto-editorial.css`, aplicado por
`components/ui/Casco.tsx` com `.app-shell.v2g-editorial`. As composições de
Início, Criativos, Anúncios, Avisos (`/alertas`) e Conta usam, respectivamente,
`app/inicio-editorial.css`, `app/criativos-editorial.css`,
`app/anuncios-editorial.css` e `app/editorial-conta-avisos.css`. As folhas são
importadas depois de `app/globals.css` em `app/layout.tsx`.

**Escopo importa:** tokens e controles compartilhados alcançam todo conteúdo
renderizado dentro do Casco; as composições das cinco telas dependem também
de suas classes locais. Isso não equivale a redesenhar todas as rotas
protegidas. LP, páginas legais e onboarding fora do Casco mantêm suas regras;
a extensão explícita da entrada pública está documentada em Components.
A marca editorial usa o vetor da LP em
`public/marca-editorial.svg`, selecionado por `<Marca editorial />`; a
variante raster das demais superfícies permanece em `public/marca.png`.

O frontmatter reúne a base global anterior e o suplemento `editorial-*`.
Esses prefixos identificam a origem no catálogo, **não novos nomes de
variáveis CSS**: no Casco o código continua usando `--ink`, `--cobalt` etc.,
com os valores locais. O detector lê esse mapa sem representar a cascata
completa; aceitar uma cor ou tamanho no catálogo não autoriza seu uso em
qualquer papel. Em conflito, esta seção atual e o CSS escopado prevalecem
para o Casco. O registro histórico ao final explica a ferramenta e a base
antiga, sem revogar a identidade de 06/10.

O registro da entrega e de sua validação fica em
`docs/estado/identidade-editorial-06-10.md`. Este arquivo descreve o código;
não comprova publicação em produção.

## Colors

Cobalto é ação, tinta azul é interação em texto, e cores de estado mantêm
papéis próprios. Os valores abaixo são os efetivos no escopo editorial.

| Papel / variável CSS | Claro | Escuro |
|---|---|---|
| Página `--canvas` | `#F8FBFA` | `#0D1929` |
| Papel `--surface` e `--offwhite` | `#ECF5F2` | `#142337` |
| Superfície secundária `--surface-2` | `#FFFFFF` | `#1B2C40` |
| Próxima tarefa `--task-surface` | `#E2EEE9` | `#182D42` |
| Texto `--ink` | `#102A35` | `#ECF5F2` |
| Apoio `--ink-soft` / discreto `--ink-mute` | `#49606A` / `#526A73` | `#BACAD6` / `#A7BBCB` |
| Ação `--cobalt` / hover `--cobalt-dark` | `#0B40DA` / `#092EAA` | mesmos valores |
| Link e foco `--cobalt-ink` | `#0B40DA` | `#9FBFFF` |
| Separação `--line` / limite de campo `--control-line` | `#CCD9D6` / `#70877E` | `#354A60` / `#6D859A` |
| Positivo `--good` / fundo `--good-soft` | `#24683F` / `#E1EFE5` | `#A6D8B5` / `#18392D` |
| Atenção `--warn` / fundo `--warn-soft` | `#805916` / `#F5EBD7` | `#EBC885` / `#3B301B` |
| Falha `--crit` / fundo `--crit-soft` | `#A43530` / `#F8E7E5` | `#FFB3AC` / `#422B2F` |
| Gelo `--ice` / fundo `--ice-soft` | `#B0E9FD` / `#E4F4F9` | `#B0E9FD` / `#1A3046` |
| Acento `--lime` | `#EAFF64` | mesmo valor |

A sidebar permanece em `--plate: #051225` nos dois temas, com texto
`--sidebar-ink: #BED0DB`, texto forte branco, divisória `#314052` e item ativo
cobalto. `--plate-ink` é `#ECF5F2`. A separação entre fundo e tinta é
intencional: `--cobalt` conserva a identidade dos botões no escuro;
`--cobalt-ink: #9FBFFF` permite reconhecer links e foco nesse fundo. Não
substituir um pelo outro.

Lima aparece em pequenos marcadores acompanhados de texto, como etapa
concluída e ausência de pendências. **Lima sozinha não declara sucesso,
resultado ou desempenho.** Os estados usam os pares `good`, `warn` e `crit`;
`--card-lime-bg` e `--card-lime-ink` apontam para `good-soft` e `good`, sem
transformar cartões operacionais em grandes placas lima. O acento não é cor
do ato de pagar.

Os aliases de papel (`--fundo-pagina`, `--texto-forte`,
`--linha-divisoria` etc.) continuam apontando para os tokens semânticos
acima. Triplas `--*-rgb` são valores auxiliares de composição, não cores
independentes do catálogo.

## Typography

Archivo variável, carregada por `next/font/google` em `app/layout.tsx`, é a
primeira família tanto de `--display` quanto de `--body`. O corpo conserva
Segoe UI, system-ui, -apple-system e Roboto como alternativas. Monoespaçadas
continuam restritas aos usos técnicos existentes; não definem a identidade
editorial.

A escala compartilhada permanece em 12, 14, 16, 20, 24 e 30px
(`--fs-legenda`, `--fs-corpo`, `--fs-titulo`, `--fs-bloco`, `--fs-tela`,
`--fs-destaque`). Títulos editoriais usam em geral peso 400, subtítulos
400–500, controles 500 e texto corrido 400. Texto de apoio trabalha com
entrelinha 1.6–1.7; títulos, com 1.13–1.4 e espaçamento de letras negativo.
Métricas e datas usam algarismos tabulares onde declarado no CSS.

Papéis locais incluídos no catálogo, sem ampliar a escala de texto corrido:

- **Marca:** `V2G` em 32px, peso 680, e assinatura `mídia` em 10px, peso
  400. São proporções do conjunto da marca ao lado do símbolo de 40px;
  10px não é tamanho permitido para instruções, notas ou rótulos de campo.
- **Título mobile:** `.page-head h1` passa de 30px para 28px até 620px.
  Esse ajuste é do cabeçalho compartilhado; o título próprio de Início
  mantém sua regra de 30px.
- **Estado principal de Início:** `clamp(30px, 3.1vw, 40px)`, peso 400,
  entrelinha 1.13 e largura de até 20ch. É a frase principal sobre o estado
  real, não uma escala para cartões ou números secundários; até 620px fica
  em 30px.

`--fs-editorial: clamp(28px, 2.6vw, 36px)` está declarado no Casco, mas não
tem consumidor nas folhas inspecionadas. Não o confundir com o tamanho
efetivamente usado pelos títulos. Os literais locais acima e a tinta azul
do escuro explicam os avisos do catálogo anterior; a inclusão documenta
papéis existentes, sem afirmar nova execução do detector.

## Layout

O Casco usa sidebar de 240px, reduzida para 210px até 1150px, e conteúdo
com `--shell-max: 1440px`. A área de trabalho tem 44px de margem interna
lateral, 36px no topo e 56px na base; a lateral cai para 28px, 24px e 20px
nos intervalos de 1150px, 900px e 620px. O topo tem altura mínima de 88px.
Seções trabalham principalmente com intervalos de 24, 28, 32 e 36px;
colunas amplas chegam a 40, 44 ou 48px conforme a composição. São medidas
observadas nas folhas locais, não uma nova escala global de espaçamento.

Até 900px a mesma navegação vira barra inferior de cinco itens. O conteúdo
reserva espaço para `--barra-h: 70px` e a área segura do aparelho. Ações
principais têm altura mínima de 48px; navegação, ajuda e seletor de tema
preservam áreas de interação de pelo menos 44px nos tratamentos locais.

Início usa estado e próxima tarefa, seguido de métricas e linhas de
acompanhamento. Criativos organiza seleção, análise e contexto de uso.
Anúncios apresenta cada campanha em linhas com suas métricas e origem.
Avisos separa pendências e registros. Conta é uma ficha contínua com coluna
de títulos e coluna de edição, empilhadas até 760px. Não copiar a
composição inteira de uma dessas telas como modelo obrigatório das outras.

## Elevation & Depth

Cartões e controles do Casco ficam sem sombra projetada. A separação visual
vem de espaço, linhas de 1px e diferenças de superfície; listas, métricas e
fichas frequentemente usam fundo transparente. Próxima tarefa, estados de
atenção e resultado da análise conservam contenção quando há um motivo
operacional. O contorno interno de 1px no envio desabilitado de Criativos
delimita o controle; não representa elevação.

## Shapes

Os seis tokens locais de raio (`--raio-controle`, `--raio-cartao`,
`--raio-card`, `--raio-item`, `--raio-interno`, `--raio-selo`) valem **4px**.
Linhas editoriais e seções abertas usam raio zero. Pequenos marcadores de
etapa e amostras de tema usam 1px; selos e números da análise usam 2px onde
explicitamente declarado. Não transformar o raio 4px em regra de todos os
elementos de todas as rotas.

O quadrado pequeno junto ao título e os marcadores de etapa retomam a
geometria da identidade. O símbolo editorial é o SVG da marca, não um ícone
genérico. A forma informa orientação e estado junto com o texto.

## Components

**Navegação e marca.** `Casco` mantém cinco destinos, item ativo em cobalto,
conta e saída na sidebar. O topo mantém saudação, preferência visual e
ajuda. O texto da ajuda recolhe no celular, conservando o nome acessível.
O link “Pular para o conteúdo” aparece ao receber foco e aponta para o
`main` com `tabIndex={-1}`. A marca é renderizada por `Marca`, com variante
editorial explícita; isso não troca a marca global das páginas públicas.

**Botões e campos.** Ações usam cobalto e texto branco; hover usa
`--cobalt-dark`. Links e foco usam `--cobalt-ink`, com contorno de foco de
2px e afastamento de 4px; na sidebar o foco usa gelo. Campos usam
`--control-line`. Disabled, carregamento, erro e êxito continuam pertencendo
aos componentes e formulários reais. O padrão de feedback segue
`.form-notice`, `.form-error` e `.form-warning`.

**Preferência de tema.** Claro é a referência visual, não uma preferência
forçada. `PreferenciaDeTema` lê `v2g_tema`; `CampoDeTema` oferece Claro,
Escuro e Do aparelho e submete a mesma `definirTemaAction` da Conta. Claro
e Escuro persistem em cookie por um ano. Do aparelho remove a escolha e
deixa o CSS acompanhar `prefers-color-scheme`; `app/layout.tsx` omite
`data-tema` nesse caso. A escolha explícita Claro impede a media query
escura de sobrescrevê-la. O controle desabilita durante o envio, e tem
botão de aplicação sem JavaScript.

**Estados e rótulos.** Ícones grandes sem função foram retirados de alguns
vazios e métricas. O rótulo existente “Precisa de você” em Anúncios
rejeitados permanece como estado operacional que explica a tarefa; não é
um kicker decorativo nem autorização para acrescentar um a cada seção.
Ausência de número, falha de consulta e resultado medido continuam sendo
estados distintos.

**Ícones e movimento.** Navegação usa SVGs de traço em `currentColor`, com
viewBox de 20px e espessura 1.7, acompanhados de texto; imagens ilustrativas
de Criativos têm tratamento próprio. Ícones decorativos ficam fora da
leitura assistiva. O movimento acompanha interação ou processamento, como
o hover de fundo de 150ms da ação herdada e o progresso da análise.
`prefers-reduced-motion: reduce` desliga animações, transições e rolagem
animada no escopo editorial; o texto continua explicando o estado.

### Suplemento de 07/10/2026 — entrada pública

`components/ui/EntradaEditorial.tsx` e `app/entrada-editorial.css` estendem
a identidade a `/entrar` (login e primeiro acesso), `/recuperar`,
`/redefinir` e `/acesso-pendente`. O escopo é `.entrada-editorial`; o ajuste
do invólucro usa `.auth-shell:has(.entrada-editorial)`. O sistema protegido
acima continua sendo sua própria fonte visual.

A entrada reutiliza a paleta editorial clara/escura, o vetor da marca,
cobalto para ação e gelo no manifesto. Herda Claro, Escuro e Do aparelho
sem alterar a preferência salva. A composição tem painel de marca escuro
e formulário aberto, sem sombra, limitado a 440px. Até 760px, a marca vira
cabeçalho e o manifesto sai da composição. Campos e ação principal têm
52px mínimos e raio de 4px; links de navegação, 44px mínimos. Foco visível,
atalho para o formulário e movimento reduzido permanecem explícitos.

**Tipografia própria da entrada:** o manifesto usa
`clamp(36px, 3.65vw, 54px)`, peso 400 e entrelinha 1.12; até 1000px usa
36px. O título do formulário usa `clamp(30px, 2.5vw, 36px)`, peso 400 e
entrelinha 1.2; até 760px usa 30px. Esses papéis expressivos da entrada
pública justificam os três avisos de 36/54px na execução do detector deste
bloco. Não ampliam a escala operacional de 12/14/16/20/24/30px nem autorizam
esses tamanhos em outros componentes. O catálogo global e o sidecar não
foram regenerados neste suplemento.

`EntradaEditorial` fornece marca, retorno à LP, links de plano/contato e
links legais; as ações, os campos e os estados continuam nas rotas reais.
O registro da jornada e dos limites da validação local está em
`docs/estado/entrada-lp-07-10.md`.

## Do's and Don'ts

- **Do:** usar os tokens de papel do Casco e conferir o tema efetivo; manter
  cobalto de fundo separado de tinta azul, principalmente no escuro.
- **Do:** organizar a leitura com tipografia, espaço e separadores; reservar
  superfícies para tarefa, formulário, resultado ou estado que precise de
  agrupamento.
- **Do:** preservar texto, foco, área de interação e informação operacional
  nas variantes mobile e de movimento reduzido.
- **Don't:** usar lima, ausência de avisos ou presença de campanha como
  prova de desempenho; estado precisa de significado e texto próprios.
- **Don't:** aplicar paleta, marca ou composição editorial fora do Casco
  por consequência de uma mudança nessas cinco telas.
- **Don't:** usar 10px da assinatura da marca em conteúdo funcional, ou
  40px do estado principal em qualquer título só porque o detector aceita.
- **Don't:** regenerar este arquivo exclusivamente de `globals.css`. O
  gerador antigo não conhece os overrides editoriais e apagaria o
  suplemento. Sua adaptação e o sidecar `.impeccable/design.json` ficam
  fora desta atualização documental.

---

## Registro legado — base global e histórico do detector

**O conteúdo a seguir foi preservado como histórico.** Ele registra a
adoção inicial de `DESIGN.md` sobre `app/globals.css`, com contagens,
linhas e medições da época. Não é medição atual de todo o produto e não
define os valores do Casco editorial. Em particular, as afirmações antigas
sobre família do corpo, ausência de raios, zero literais e regeneração
automática não substituem as seções atuais acima.

O frontmatter continua sendo lido por `design-system.mjs` →
`parseFrontmatter` → `normalizeDesignSystem`. A base anterior foi mantida
para as superfícies que ainda a utilizam; sua presença não torna cada
valor uma opção de estilo para as cinco telas editoriais.

---

### Por que ele existe

Sem `DESIGN.md`, a regra de cor do detector fica **desligada**:
`isAllowedColorRaw` começa com `if (!designSystem?.hasColors) return true`.
Medido antes deste arquivo — `#ff00aa`, `rgb(12, 200, 90)` e `#123456` num
arquivo de teste em `app/` passaram sem um único achado.

"Zero valor de cor fora do `:root`" era regra que nenhuma ferramenta
verificava. Este arquivo é o que liga a verificação.

### Cores — 58 chaves, 29 tokens

Os 29 tokens de cor do `:root`, com o valor do tema claro. Os que mudam no
tema escuro entram uma segunda vez com o sufixo `-escuro`, porque o
frontmatter é um mapa e cada chave só carrega um valor — sem isso, toda cor
exclusiva do modo escuro seria reprovada.

Não estão aqui, porque não são cor: os pares `--*-rgb` (triplas para
`rgb(var(--x-rgb) / alfa)`), as medidas (`--shell-max`, `--sidebar-w`,
`--auth-card`, `--auth-max`) e os aliases que apontam para outro token
(`--canvas: var(--offwhite)`).

### Tipografia — três famílias, e a terceira só apareceu no teste

`Archivo` no display e `Segoe UI` no corpo, os dois com token no `:root`. No
CSS o display é `var(--font-archivo)`, a variável que o `next/font/google`
gera em `app/layout.tsx`; aqui o nome real da família é declarado, porque é
ele que o detector compara.

**A monoespaçada não tem token e por isso passou despercebida.** Declarei só
display e corpo na primeira versão deste arquivo, e a varredura reprovou na
hora três usos legítimos: `Consolas` na linha 721 e `Cascadia Mono` nas 1828
e 1854 — os blocos de código das telas de operador. Não era falso positivo:
era este arquivo declarando um sistema menor que o real.

Duas pilhas monoespaçadas diferentes convivem no CSS, e as duas estão
registradas como estão (`mono` e `monoLegado`). Unificá-las seria mudança de
design, não registro — e este arquivo não propõe nada. Fica anotado como
inconsistência conhecida: uma delas provavelmente devia sumir.

### Escala tipográfica — seis degraus, aplicada em 19/08/2026

Este arquivo passou a declarar `typography.scale`, e com isso a regra de
tamanho de fonte ligou. Antes eram 23 tamanhos distintos em incrementos de
meio pixel; o levantamento completo, o mapeamento de cada valor antigo e as
medições que decidiram os casos duvidosos estão em
`docs/escala-tipografica.md`.

Os seis degraus saem do `:root` por script, como as cores — não estão
escritos à mão aqui. Os `--fs-hero-*` (`clamp()`) e o `--fs-code` (`em`)
ficam **fora** da escala de propósito: nenhum dos dois é um degrau, e
declarar um `clamp()` como papel faria o detector aceitar as duas pontas dele
como tamanhos válidos em qualquer lugar — o que devolveria `14px` e `16px` à
rampa, justo os valores que o lote tirou de circulação.

**O limite desta regra, medido.** Com a rampa ligada, o detector reprova
`9.5px`, `12px`, `14px` e um `clamp()` cru cujas pontas estejam fora — e
**aprova `11.5px`**, porque ele aceita qualquer valor a até 0,5px de um
degrau (`FONT_SIZE_TOLERANCE_PX`, em `detector/design-system.mjs:22`). Ou
seja: a rampa pega o desvio de 1px e não pega o de meio pixel, que foi
exatamente a forma que este problema teve.

O que pega o meio pixel é a ausência de literal. Depois deste lote, nenhum
tamanho de fonte vive fora do `:root`, e qualquer um que reapareça é
regressão independente do valor:

```bash
grep -n "font-size:" app/globals.css | grep -v "var(--fs-"
```

Tem que devolver **nada**. Essa é a guarda que a ferramenta não dá.

### O que este arquivo ainda NÃO declara, de propósito

**Não há escala de raio.** Não existe token `--radius*` no `:root`; os 8
valores de `border-radius` (3, 4, 6, 8, 10, 12, 14, 999px) estão soltos nas
regras. Registrar o que não é sistema fingiria uma decisão que não foi
tomada — foi o mesmo raciocínio que segurou a escala tipográfica até ela ser
decidida de verdade.

A ausência é **honesta, não incompletude**. Se um dia o raio virar sistema,
ele entra aqui — e aí a regra correspondente liga sozinha, como a de tamanho
ligou.

### Como regenerar — procedimento legado, limitado a globals.css

O frontmatter sai do `globals.css` por script, não à mão: 58 chaves copiadas
a dedo erram em silêncio, e um valor errado aqui reprova cor legítima ou
aprova cor que não existe. O script está em `scripts/gerar-design-md.mjs`.

```bash
node scripts/gerar-design-md.mjs
```

Rode depois de mexer nos tokens, e confira o efeito com o teste abaixo.

### O teste que prova que está funcionando — registro histórico

```bash
cat > app/__t.css <<'CSS'
.mau { color: #ff00aa; }
.bom { color: #0239C7; font-family: ui-monospace, "Cascadia Mono", monospace; }
CSS
node .claude/skills/impeccable/scripts/detect.mjs --json app/__t.css
rm app/__t.css
```

Tem que dar **1 achado**: só o `#ff00aa`. O `.bom` usa cor e fonte que estão
declaradas e não pode ser reprovado.

**NÃO use `--no-config` neste teste.** Essa flag desliga o `DESIGN.md` junto
com o resto — está no `--help` ("Do not apply project config, detector
ignores, inline ignore comments, or DESIGN.md"). Rodei a primeira vez com
ela e vi 0 achados dos dois lados, o que parecia formato quebrado e era
teste quebrado. Para desligar só o design system existe `--no-design-system`.

Os dois lados importam. Só a reprovação do `#ff00aa` não prova nada — um
frontmatter ilegível reprovaria cor legítima do mesmo jeito, porque
`parseFrontmatter` devolve `null` em silêncio e o detector abstém-se sem
erro nenhum.
