---
name: "V2G — agência e cliente em QA"
description: "Suplemento local das quatro telas implementadas, herdando o Casco editorial."
colors:
  cobalt: "#0B40DA"
  cobalt-dark: "#092EAA"
  cobalt-ink-dark: "#9FBFFF"
  canvas: "#F8FBFA"
  canvas-dark: "#0D1929"
  surface: "#ECF5F2"
  surface-dark: "#142337"
  ink: "#102A35"
  ink-dark: "#ECF5F2"
  task-surface: "#E2EEE9"
  task-surface-dark: "#182D42"
  warn: "#805916"
  warn-soft: "#F5EBD7"
  plate: "#051225"
typography:
  heading:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "4px"
---
# Design: agência e cliente em QA

## Overview

Registro de 09/11/2026, em modo **Operate**, das quatro telas implementadas após a prévia aprovada. Herda a identidade editorial V2G: Archivo, cobalto, tinta navy, linhas e superfícies semânticas. É suplemento local; não redefine `PRODUCT.md`, `DESIGN.md` ou o catálogo global.

Agência organiza busca, carteira e fila; cliente concentra resultados e acompanhamento da peça. O contexto operacional deste bloco é Piligrin → Dúú. A implementação reaproveita sessão e negócio ativo comprovados, sem criar tenant, login ou hierarquia de agência.

**Key Characteristics:**

- Hierarquia por texto, espaço e separadores.
- Agência e cliente com composições distintas.
- Identidade e autorização por IDs explícitos.
- Aprovação, publicação e medição como estados separados.

## Colors

O frontmatter recorta valores observados de `app/produto-editorial.css:6`. `--cobalt` é fundo de ação; `--cobalt-ink` é tinta de links/foco, clareando no escuro. Superfície, tarefa, divisória e campos usam os tokens semânticos existentes. Estados combinam texto e cor. Claro, Escuro e Do aparelho continuam herdados; o sidecar referencia variáveis CSS, sem inventar rampas ou paleta.

## Typography

Archivo permanece em `--display` e `--body` (`app/globals.css:122`). A escala herdada é 12, 14, 16, 20, 24 e 30px (`app/globals.css:319`). O cabeçalho local usa 30px/1.2, peso 400 e tracking −0.04em; até 640px passa a 28px. Seções usam 20px, peso 450. Métricas e contagens usam algarismos tabulares.

## Layout

| Superfície | Rota e composição implementada |
| --- | --- |
| Agência · Início | `/inicio`: contexto, contagens, próxima tarefa, busca, pendências e carteira em linhas; paginação de dez quando houver volume. |
| Agência · Criativos | `/criativos`: busca por cliente/peça, filtros por cliente e etapa, fila com miniatura, responsável e situação. |
| Cliente · Início | `/inicio?cliente=<businessId ativo exato>`: localização, período, consulta, quatro métricas, gráfico, tarefa, teto e cadastro. |
| Cliente · Criativos | `/criativos?cliente=<businessId ativo exato>&peca=<id exato do item>`: abas, peça, ficha, trilha e envio quando habilitado. `peca` é opcional. |

Fontes: `app/(protected)/inicio/page.tsx:78`, `app/(protected)/criativos/page.tsx:94` e `components/agencia/{CarteiraAgencia,CriativosAgencia,InicioDoCliente,CriativosDoCliente}.tsx`.

Desktop usa carteira/tarefa e gráfico/tarefa em duas colunas; fila tem miniatura, identificação e situação. Até 900px a situação passa sob a identificação; até 640px as colunas se empilham, a carteira vira linhas compactas e métricas ficam em duas colunas. Busca móvel tem atalho que move foco ao campo. Breakpoints locais: 1150, 900 e 640px.

O CTA do cabeçalho tem `width:auto;flex:none` no desktop e `width:100%` até 640px (`components/agencia/agencia.module.css:3`, `:116`). Os 148px observados na recaptura desktop são medida daquele conteúdo/viewport, não token fixo.

## Elevation & Depth

Novas superfícies usam linhas de 1px, espaço e fundos tonais, sem sombra própria. Tarefa e publicação têm contenção funcional. Navegação móvel conserva o Casco; ampliação de imagem usa diálogo com backdrop escuro.

## Shapes

Campos, botões secundários, selos e cartões locais usam 4px. Seções e divisórias permanecem retas. Quadrado do título: 6px. Marcadores da trilha: 7px e raio de 1px. São elementos observados, sem nova escala global.

## Components

- **Contexto e acesso:** flag `V2G_QA_PILOT_ACCESS_ENABLED` + hostname HTTPS exato codificado em `lib/piloto-qa/acesso.ts:15`. Usuário, titular e negócio ativo são comprovados antes do cadastro (`lib/agencia/da-sessao.ts:14`). Papel exige JSON explícito “Uma agência ou gestor opera para o anunciante” e campos válidos (`lib/agencia/contexto.ts:17`). URL escolhe apresentação, não permissão; erro fecha o acesso ao detalhe.
- **Carteira real:** as páginas passam um único contexto autorizado (`app/(protected)/inicio/page.tsx:90`, `app/(protected)/criativos/page.tsx:224`). Cinquenta clientes são somente fixture de avaliação; não comprovam carteira multicliente conectada.
- **Navegação e retorno:** Início/Criativos mantêm o cliente pelo ID exato; localização e volta são explícitas (`components/agencia/ContextoNoCasco.tsx:7`). Helpers preservam busca, pendências, página, etapa e filtro de cliente via parâmetros `*_carteira`, sem persistência nova (`lib/agencia/contexto.ts:44`).
- **Resultados:** ausência é “Não medido”; zero medido é zero. Conversas permanecem não medidas. Origem, data, conta, período e parcialidade acompanham a leitura. Lacunas interrompem a linha; tabela diária mostra valores e ausências (`components/agencia/GraficoInvestimento.tsx:6`). Entrega histórica não confirma veiculação atual.
- **Peça:** aprovação para publicação manual e confirmação de publicação são separadas. ID de peça ausente não abre substituta silenciosamente; há aviso e recuperação explícita (`components/agencia/CriativosDoCliente.tsx:15`). Falha ou truncamento de leitura fica visível.
- **Interação:** controles secundários/campos têm mínimo de 44px; ações principais herdam 48px. Foco: contorno 2px, afastamento 4px. Abas usam botões com `aria-pressed`; ampliação usa diálogo. Tema e movimento reduzido continuam herdados.

**Validação e limites:** o relatório do bloco registra suíte completa aprovada, 22 novos testes, build final aprovado, bancadas dev-only respondendo 404 no build e revisão independente **SHIP** após corrigir o CTA. Ver `docs/estado/n26-agencia-quatro-telas-qa-09-11.md`. Este passe documental conferiu fontes; não executou browser, detector, build ou testes.

As capturas `*desktop.jpg` e `*mobile.jpg` em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/agencia-implementacao-qa-09-11/` usam fixtures e dados fictícios declarados. Não comprovam QA publicada, sessão real ou integração externa. `previa-agencia-duu/DESIGN.md` é referência da prévia; seus comportamentos demonstrativos não definem o produto. Sem migration, deploy ou escrita externa neste passe.

## Do's and Don'ts

- Preservar tokens semânticos, Archivo, temas e estrutura do Casco.
- Distinguir carteira da agência e detalhe do cliente, preservando filtros na volta.
- Manter origem, parcialidade, zero e ausência visíveis.
- Não transformar aprovação em publicação, vínculo em entrega ou fixture em dado real.
- Não promover este suplemento a redesign global ou modelo multicliente entregue.
