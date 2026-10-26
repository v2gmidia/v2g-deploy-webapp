# E28-05/06 — Interface conectada à fila fake LOCAL — 25/10/2026

> REVISÃO EM 25/10: o Central reprovou a retomada visual após este fechamento. A bancada confundia leitura inicial/falha com ausência de pedido. O aceite anterior do critério 4 não basta. Correção e nova prova com duas recargas reais em `e28-05-06-retomada-ui-fila-local-25-10.md`; preservar o restante como registro histórico.

> CORREÇÃO POSTERIOR EM 25/10: o Central identificou biblioteca 1→0 ao desligar a geração na bancada. O acoplamento à última resposta foi removido; a biblioteca agora consulta registros persistidos. Também se corrigiu o falso estado vazio por falha de fonte na tela real. Provas em `e28-05-06-biblioteca-independente-geracao-25-10.md`.

**Resultado:** implementação local da ligação pedido → fila assíncrona do 07/08 → consulta → imagem privada → biblioteca existente. O navegador percorreu esse caminho com dados fictícios e a factory FastAPI local, PostgreSQL descartável e Storage instrumentado. **Não é uma imagem criada por IA, sessão humana real, QA autenticado ou produção.**

## 0. Depende de decisão/autorização humana ou de outra frente

1. **Central/07/08:** montagem com identidade humana confiável, execução durável em infraestrutura e alvo gravável isolado, sob as autorizações específicas. O transporte de sessão fictícia existe somente no harness e não foi acrescentado ao cliente de produto.
2. **Victor/time + 05/06:** documentos central/nicho aprovados, materiais/referências admissíveis, consentimento específico e orçamento. O loader real continua sem aprovações persistentes; fixture não as substitui.
3. **Victor + Central:** piloto nominal de geração paga, com material/provedor/teto e reconciliação autorizados. Este contrato é estritamente `simulated=true`, provider `fake-png-v1`. Não basta trocar o nome do provider para liberar geração paga.
4. **Publicação coordenada/QA:** nenhuma configuração, variável, migration ou deploy foi realizada. A factory do backend continua local opt-in, fora do app global. O bucket do backend deverá corresponder à biblioteca existente `v2g-midia`, privado; diferença falha fechada, sem copiar arquivo entre buckets.
5. **Central:** incorporar este checkpoint aos instrumentos compartilhados. Índice, decisões, pacote, Google Doc, Figma e n8n não foram editados neste bloco.

## Fonte, escopo e precedência

- Instrução atual transmitida pelo Central: integração LOCAL da UI com o contrato durável fake entregue pelo 07/08 em 25/10, oito critérios de aceite, preservando upload pronto. A orientação histórica de somente desenho/n8n foi explicitamente superada; nenhum desenho/workflow adicional foi criado.
- Lidos AGENTS.md, CLAUDE.md, decisões, índice, contexto visual/Impeccable e o checkpoint backend `docs/estado/e28-06-fila-duravel-fake-local-25-10.md`; conferidos `src/api/geracao_app.py`, `src/imagem/geracao_fila.py`, jobs e Storage reais.
- Repositório WebApp estava limpo na leitura inicial. Nenhum arquivo do backend foi alterado. Não se modificaram runtime, worker, SQL, cliente pago ou configuração externos.

## Implementação e provas no código

| Fonte | Mudança |
|---|---|
| `lib/criativos/geracao/contrato-fila.ts:21` | Parser estrito de `creative-generation-queue-v1`, IDs, estados, chave idempotente, intervalos, decimais exatos, resultado/hash e custo simulado. DTO legado não é consumido pela UI de fila. |
| `lib/criativos/geracao/backend-da-sessao.ts:36`, `:69` | Reutiliza cliente HTTP existente (que aceita 202), sessão/negócio e normalização. Acrescenta submeter/cancelar; 404/409/503 recebem motivos seguros. Não há header fictício, worker ou retry automático neste código. Compatibilidade do laboratório legado preservada. |
| `app/(protected)/criativos/geracao-actions.ts:37` | Action de submissão/consulta/cancelamento, derivando perfil no servidor pela porta existente. Projeção para UI contém somente IDs, estado, marca de simulação, intervalo e caminho da leitura autenticada; hashes, fatura e detalhes técnicos permanecem internos. |
| `app/(protected)/criativos/AndamentoDaImagem.tsx:13` | Montagem/recarga faz GET; pendências consultam de 2 em 2 segundos após a resposta, sem chamadas sobrepostas. Terminal interrompe o timer. Clique repetido usa trava imediata. Cleanup/ciclo descartam respostas antigas. Cancelar exibe estado observado, sem presumir que venceu o claim. |
| `app/(protected)/criativos/PedidoDeImagem.tsx` | Pedido novo continua usando a persistência imutável existente; criação só depois de guardar. Histórico recupera os mesmos IDs. Primeiro acompanhamento é montado automaticamente, demais sob abertura. Chave por negócio/pedido evita reaproveitar estado entre negócios. |
| `lib/criativos/geracao/imagem-privada.ts:29` | Revalida usuário/negócio, `/biblioteca`, autoria, registro `creatives` pela sessão, caminho canônico e metadados. Confere bucket privado e bytes/hash/PNG 1088×1088. Sem upload, URL pública, assinatura reutilizável ou outro acervo. |
| `app/(protected)/criativos/imagem-gerada/[requestId]/route.ts:3` | Leitura autenticada dos bytes, `private, no-store`, `Vary: Cookie`, `nosniff`; indisponível/negado responde 404 sem corpo técnico. Layout protegido não é usado como única defesa desta rota. |
| `app/(protected)/criativos/page.tsx:91`, `:123` | Mesmas flags default OFF. Arquivo gerado sai do assinador genérico e usa leitura autenticada; aparece na biblioteca existente, marcado como imagem fictícia, sem associação/publicação presumida. Acrescentadas ao select as colunas lidas `business_id` e `copy`. |
| `app/(protected)/criativos/GaleriaCriativos.tsx` | Falha da imagem troca para a prévia indisponível já existente. Fluxo de revisão/upload não foi redesenhado. |

As ações de geração não iniciam worker e não chamam Jev/Meta/n8n. `awaiting_configuration` continua sendo estado do pedido original; os estados de execução vêm da fila backend, sem outra tabela/queue ou estado local usado como autoridade.

## Oito critérios — resultado e limite

| Critério | Prova local | Limite |
|---|---|---|
| 1. Solicitar imagem fictícia | Action real guarda pedido; POST 202 real da factory cria queued. Navegador mostrou “Na fila”. | Sessão e contexto injetados explicitamente somente no harness. |
| 2. Conservar request_id | `55555555-5555-4555-8555-555555555555` usado no percurso fictício, replay e recarga; job preservado. | Não são IDs de cliente/QA. |
| 3. Fila/processamento/concluído/falhou/cancelado | Parser cobre queued/running/storage_pending/reconciliation_required/available/failed/cancelled. UI percorreu queued, available, failed e cancelled; consulta segue intervalo 2000 e para nos terminais. | Running e storage_pending não foram fotografados/medidos separadamente na UI: execução fake curta. Não inventar esse aceite visual. |
| 4. Recarregar e retomar | Navegador recuperou pedido queued e depois arquivo disponível. Teste reiniciou Python, releu pedidos e manteve job. | Não é reinício físico de máquina nem nova autenticação humana. |
| 5. Replay/concorrência | Teste duas submissões concorrentes + resposta perdida + reenvio: um job/dispatch/recibo/arquivo. Duplo clique no navegador mostrou 1 envio, 1 trabalho, 0 recibos antes do worker. | Custo/recibo fictício, não exatamente-uma-cobrança de provedor pago. PGlite serializa transações. |
| 6. Arquivo privado na biblioteca correta | Action → worker fake → bytes reais PNG → handler HTTP privado 200 e hash medido. Navegador mostrou arquivo e biblioteca 1, “Sem anúncio”. | Storage HTTP e sessão são instrumentados; `/criativos` autenticado com Supabase remoto não ensaiado. Bancada usa componente real de acompanhamento/galeria e o transporte local, não a página autenticada completa. |
| 7. Erros e retomada segura | Falha terminal aparece “Não foi possível concluir”, sem botão de nova criação. POST perdido pede consulta ao mesmo pedido. Cancelamento não reenfileira. Sem detalhes privados. | Refação, nova tentativa paga, aprovação e publicação fora do bloco. |
| 8. Backend/dispatcher OFF | Teste flag OFF sem HTTP/arquivo; pedido preservado. Navegador mostrou “A criação de imagens está indisponível agora. Seu pedido continua guardado.” | Não se habilitou flag/configuração real para testar. |

### Observado no navegador

- URL: `http://localhost:3000/exemplo/geracao-fila`, IAB, viewport lógico **1265 px**; scrollWidth **1265 px**, sem overflow horizontal medido. Captura do painel pode apresentar área visível menor que esse viewport lógico.
- Pedido novo → duplo clique → queued: contagens **1 trabalho, 0 recibos fictícios, 1 envio, 5 consultas**. Reload: mesmo ID/job, **1 envio**, sem execução automática.
- Tick explícito do harness: **1 recibo**, imagem disponível e biblioteca **1**; reload recuperou o arquivo.
- Troca para negócio B: nenhum pedido e biblioteca **0**, sem mostrar imagem do A.
- Cancelamento queued: “Pedido cancelado”, zero recibos; `2 envios` corresponde a submissão + cancelamento, não duas gerações.
- OFF: mensagem de indisponibilidade mantendo pedido.
- Falha controlada: três claims fake com erro antes do recibo; UI “Não foi possível concluir”. Contagens **1 trabalho, 0 recibos, 1 envio, 4 consultas**; conferência posterior manteve 4, sem polling terminal automático.
- Prova visual local: `docs/qa/geracao-ui-local-25-10/falha-terminal.png`. Não é captura do QA.
- **Não medidos nesta rodada:** celular, teclado completo, contraste em todos os temas, tela autenticada remota, conta/agência real, nova sessão humana ou cancelamento simultâneo a claim real.

## Testes executados

| Comando | Resultado |
|---|---|
| `node --test scripts/conferir-ui-fila-geracao-local.mjs` | **9 passaram**: integração real de action/HTTP/ASGI/SQL/worker fake/arquivo; replay/reinício/resposta perdida/isolation/cancelamento/falha/OFF/recusas de arquivo. |
| `node --test scripts/conferir-contrato-fila-geracao.mjs` | **4 passaram**: estados/intervalos/terminais/precisão e rejeição de contrato, IDs ou provas inválidos. |
| `node --test scripts/conferir-geracao-backend-local.mjs` | **18 passaram**: compatibilidade com laboratório anterior, nenhuma mudança no provedor. |
| `node --test scripts/conferir-revisao-criativos.mjs scripts/conferir-intencao-envio.mjs` | **31 passaram**: regressão de upload/revisão/objetivo/promoção/isolamento. |
| `pnpm typecheck` | **Passou**, incluindo tipos gerados pelo Next dev. |
| `git diff --check` | Sem erro de whitespace; avisos de conversão LF/CRLF apenas. |

**62 testes em quatro comandos**, mais checagem de tipos. Não foi executada a suíte ampla, nem build enquanto o dev estava aberto. Não somar estes testes com as suítes anteriores do 07/08 como nova prova independente.

Nos primeiros ensaios, o adapter Supabase fictício retornava `Date` em vez da string ISO real da API; corrigido no harness e a rodada final passou. Um reset do harness durante uma consulta travou o próprio ensaio; servidor loopback passou a serializar seus comandos e encerrar apenas o processo filho criado pelo teste. Não se alterou runtime do produto para resolver a simulação.

## Como reproduzir no navegador, sem configuração externa

1. Na raiz WebApp, iniciar `node scripts/servir-fila-geracao-local.mjs`. Usa somente loopback **127.0.0.1:3106**, fixtures e PGlite descartável; sem `.env`, conexão real ou endpoint público.
2. Usar o `pnpm dev` existente; se não houver dev, iniciá-lo. Não executar build junto dele.
3. Abrir `http://localhost:3000/exemplo/geracao-fila`.
4. “Preparar pedido fictício” → “Criar imagem de teste”. Conferir Na fila e abrir “Controles do ensaio” → “Conferir contagens”.
5. Recarregar. O mesmo pedido permanece, sem POST novo. Só o botão **“Processar fila fictícia”** aciona o tick do harness. A UI deve atualizar para disponível em consulta, mostrar imagem e biblioteca 1.
6. “Trocar negócio fictício”: negócio B não vê pedido/imagem do A. Voltar ao A recupera o pedido.
7. “Limpar ensaio” apaga somente o banco descartável do harness. Aguardar terminar, preparar/submeter novamente e testar “Cancelar pedido na fila”; nunca publicar.
8. Para falha terminal, novo ensaio queued → “Esgotar tentativas fictícias”; para OFF, “Desligar backend do ensaio” → “Consultar andamento”. “Perder próxima resposta” antes de submeter exercita retorno incerto; consultar conserva IDs.
9. Encerrar o processo do harness ao terminar para descartar o banco em memória. A bancada tem import condicional `NODE_ENV !== production` e `notFound`; a guarda foi inspecionada, **não houve novo build para comprová-la**.

### Arquivos do bloco

Alterados: `GaleriaCriativos.tsx`, `PedidoDeImagem.tsx`, `geracao-actions.ts`, `page.tsx`, `pedido-de-imagem.module.css` em `app/(protected)/criativos/`; `lib/criativos/geracao/backend-da-sessao.ts`.

Novos: `app/(protected)/criativos/AndamentoDaImagem.tsx`; `app/(protected)/criativos/imagem-gerada/[requestId]/route.ts`; `lib/criativos/geracao/{contrato-fila,imagem-privada}.ts`; `app/exemplo/geracao-fila/page.tsx`; `app/exemplo/_geracao_fila/{Previa.tsx,Previa.module.css}`; `scripts/test-utils/fila-geracao-local.mjs`; `scripts/{conferir-ui-fila-geracao-local,conferir-contrato-fila-geracao,servir-fila-geracao-local}.mjs`; captura e este checkpoint.

Referência de API conferida: [getBucket](https://supabase.com/docs/reference/javascript/storage-getbucket), [createSignedUrl](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl). Para este fluxo optou-se por bytes autenticados/no-store em vez de assinatura entregue ao navegador. Consulta ao índice changelog Markdown pelo leitor web falhou por tipo de conteúdo; não se presume atualização de SDK, schema ou ambiente a partir disso.

**Bloco encerrado.** Sem commit, push, merge, deploy, migration, configuração externa, dado privado de cliente, chamada paga, Meta, n8n ou publicação. Nenhuma mensagem enviada a outro chat/pessoa. Não iniciar novo bloco por este checkpoint.
