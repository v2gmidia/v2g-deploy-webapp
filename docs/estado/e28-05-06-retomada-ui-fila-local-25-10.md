# E28-05/06 — Correção da retomada após reload REAL — 25/10/2026

## 0. Dependências e limite

Bloco corretivo local solicitado pelo Central após reproduzir falha de retomada. Encerrado com prova em navegador. Nenhum portão externo foi usado: não houve deploy, migration, chamada paga ou mudança na fila/runtime/backend. QA autenticado, identidade humana e geração paga continuam com as dependências anteriores.

## Defeito e causa

Sequência relatada pelo Central: Limpar ensaio → Preparar → Criar imagem de teste → Na fila / um trabalho / um envio → Preparar novamente → reload real. O Central observou “Nenhum pedido deste negócio no ensaio”, apesar de o trabalho persistir. O aceite visual anterior foi, portanto, registrado cedo demais.

**Causas identificadas no código da bancada:**

- `app/exemplo/_geracao_fila/Previa.tsx` iniciava `evidencia=null` e renderizava a mesma frase de lista vazia enquanto o GET inicial ainda não havia terminado. Uma falha de fetch também deixava esse estado, sem uma condição distinta de falha/retomada. O pedido persistido não era apagado por esse ramo.
- `scripts/servir-fila-geracao-local.mjs`, `/evidencias`, descartava `carregarPedidosDaSessao(...).falhou` e devolvia `pedidos: []` com HTTP 200. Assim uma leitura não confiável podia ser promovida a lista vazia confirmada.
- A bancada montava o acompanhamento com um ID constante em vez de usar o pedido efetivamente recuperado da fonte. Embora a fixture use um único ID estável, o critério de retomada deve se apoiar no retorno persistido.

Não foi identificado defeito de perda de job neste recorte. O teste anterior de recarga via action/consulta não substituía o reload do documento no navegador.

## Correção

1. A bancada agora tem leitura **carregando / pronta / falhou**. Enquanto aguarda, mostra “Recuperando os pedidos deste negócio…”. Falha oferece consulta, sem pedir para preparar outro pedido e sem afirmar ausência.
2. `/evidencias` preserva erro de leitura como HTTP 503, e inclui o negócio correspondente na resposta. A UI confere esse vínculo e descarta respostas antigas após troca/limpeza do negócio.
3. O acompanhamento é montado automaticamente com o ID recuperado em `pedidos`, pela fonte durável do harness. Nenhuma submissão é acionada por reload.
4. “Preparar pedido” fica bloqueado até a leitura inicial terminar. Comandos do ensaio exibem ocupação e o reset somente remonta o acompanhamento depois de confirmar a limpeza e a releitura.
5. Produção, `PedidoDeImagem`, `AndamentoDaImagem`, actions, worker, schema e contratos do backend não foram alterados neste bloco corretivo.

## Teste de regressão com recarga real

**Arquivo:** `scripts/qa/retomada-fila-browser.mjs`. Função `conferirRetomadaNoNavegador(tab)`, executada pelo `cua_repl` com a aba localhost selecionada. Todas as ações/leituras passam pelo browser tool: botões reais, espera de estado visível, `tab.reload()` real e contagens do DOM. Não injeta estado da aplicação, não cria pedido após recarregar e não usa consulta de API por fora para simular reload.

**Resultado: PASSOU**, IAB/Chromium em `http://localhost:3000/exemplo/geracao-fila`, fonte em `127.0.0.1:3106`, factory FastAPI e PGlite/Storage instrumentados já existentes, exclusivamente fictícios.

| Passo real | request_id observado | Trabalhos | Envios | Recibos fictícios | Consultas |
|---|---|---:|---:|---:|---:|
| Submetido após limpar/preparar | `55555555-5555-4555-8555-555555555555` | 1 | 1 | 0 | 2 |
| “Preparar pedido” repetido | mesmo ID | 1 | 1 | 0 | 2 |
| Primeiro `tab.reload()`, sem preparar depois | mesmo ID | 1 | 1 | 0 | 4 |
| Segundo `tab.reload()`, sem preparar depois | mesmo ID | 1 | 1 | 0 | 6 |

Nas duas recargas, o teste também recusou a frase de ausência de pedido durante a leitura inicial e aguardou o estado visível **“Na fila”** antes de conferir contagens. Nenhum worker foi acionado: zero recibos/imagens novas, sem geração paga.

**Provas salvas:**

- `docs/qa/geracao-ui-local-25-10/retomada-duas-recargas.json`: retorno integral do teste do navegador.
- `docs/qa/geracao-ui-local-25-10/retomada-duas-recargas.png`: captura local posterior à segunda recarga.
- `pnpm typecheck`: passou.
- `git diff --check`: sem erro de whitespace.

O primeiro disparo do novo teste parou por uma asserção sobre snapshot AX incremental sem texto repetido; corrigiu-se a própria leitura para snapshot completo. A rodada final acima terminou integralmente. Não se repetiram as 62 verificações do bloco anterior por relógio: o delta afeta a bancada e seu endpoint de leitura, e o teste direcionado atravessa justamente essas fronteiras.

## Reproduzir

Com o dev e o harness local existentes ativos, selecionar a aba `http://localhost:3000/exemplo/geracao-fila` no `cua_repl` e importar `scripts/qa/retomada-fila-browser.mjs` pelo caminho de arquivo. Executar `conferirRetomadaNoNavegador(tab)`. O teste limpa somente o banco descartável do harness, percorre a sequência relatada e deixa o pedido queued após duas recargas. Não executar contra QA/produção.

Se reiniciar o processo do harness, seu banco em memória é descartado de propósito: esse é outro cenário, diferente de recarregar o documento do navegador. O teste de reinício de Python com o mesmo banco existente permanece no bloco anterior; não alegar persistência física do PostgreSQL gerenciado.

**Arquivos deste corretivo:** `app/exemplo/_geracao_fila/Previa.tsx`, `scripts/servir-fila-geracao-local.mjs`, novo `scripts/qa/retomada-fila-browser.mjs`, este checkpoint, provas JSON/PNG e nota de revisão no checkpoint anterior. Demais alterações preservadas. Nenhuma mensagem enviada a outro chat; retorno pelo checkpoint e fechamento desta rodada. **Parar aqui.**
