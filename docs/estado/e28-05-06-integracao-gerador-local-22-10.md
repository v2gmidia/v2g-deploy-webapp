# E28-05/06 — integração LOCAL do gerador — 22/10/2026

## §0 — resultado e próximo portão

**FATO:** primeira fronteira executável WebApp → cliente HTTP existente → FastAPI/Python → client de imagem mock existente → bytes duráveis em PostgreSQL → Storage instrumentado → `creatives` existente → consulta da biblioteca. Somente dados fictícios e rede bloqueada. **Não é geração por IA real, tela autenticada, QA ou produção.**

Autorização deste bloco: recorte 05/06 E28-06-B/C em `docs/handoffs/treino-22-10-central.md`, retransmitindo a direção humana de 22/10. Geração voltou a ser prioridade, começando local sem gasto; o antigo “IA somente desenho” não descreve mais esse recorte autorizado. Portões pagos/remotos permanecem separados. Uma única integração, sem emendar aprovação, refações, gestor ou publicação.

**Próximo ato:** Central coordenar um bloco de adapters reais/registro do router com 07/08, ainda sem gasto. O router é proposto e NÃO MONTADO em `src/api/main.py`/`rotas.py`. A cerca GET-only do backend-qa não foi alterada nem deve ser desligada para encaixar o POST. Não depende das nove unidades de métricas. Victor não precisa enviar chave/senha; piloto pago e implantação exigem autorização específica posterior.

## 1. Decisão de arquitetura aplicada localmente

O backend é **único dono durável do job/tentativa/resultado/reserva/custo** nesta fronteira. O WebApp guarda o pedido existente e envia seus IDs sob sessão conferida. Não aceita snapshot, direitos, provedor ou teto do formulário. O backend relê pedido/negócio/dono, confere hash, carrega manifesto aprovado do servidor **para aquele pedido específico**, valida documentos e materiais e disputa o INSERT único antes de gerar.

Fluxo deste recorte:

`pedido existente → sessão WebApp → backend → contexto aprovado congelado → UNIQUE(request_id) → uma tentativa → bytes SQL → Storage → creatives → leitura privada conferida`

O laboratório TS anterior (`repositorio-local.ts`, `servico-local.ts` e `creative_generation_runs`) foi preservado como evidência histórica, sem consumidor no produto. **Não montar esse worker junto com o Python.** A tabela nova proposta `creative_generation_jobs` é a fonte de execução desse caminho; pedido continua em `creative_generation_requests` e acervo em `creatives`. Não criar outro pedido/acervo.

## 2. Arquivos e evidências de código

Raiz backend: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g`.

| Arquivo | Entrega / limite |
| --- | --- |
| WebApp `lib/criativos/geracao/backend-da-sessao.ts:34` | Porta server-only; `getUser`, negócio ativo, IDs validados; reutiliza `lib/backend/cliente.ts` sem retry. Nova flag `V2G_CREATIVE_BACKEND_ENABLED` consultada, desligada por padrão; nenhum valor externo configurado. DTO validado e erro seguro; retorno perdido pede conferência, não afirma que nada aconteceu. Sem botão/action/rota comercial conectados. |
| Backend `src/imagem/geracao_contrato.py:41` | Manifesto confiável do servidor: pedido/negócio/nicho confirmado, MD central/nicho versionados com conteúdo/revisor/data, marca, referência/hash/fonte/data/condição de uso/autorização, destino e reserva Decimal. Documento privado de outro negócio/nicho e material sem permissão recusados. PNG neste recorte, exatamente um logo e uma ou duas referências próprias do negócio; não é catálogo global pronto. Fachada não suportada neste piloto (`usar_fachada:false`). |
| Backend `src/imagem/geracao_jobs.py:32` | SQL parametrizado por porta; snapshot canônico/hash, claim único, staging de bytes anterior ao Storage, retomada sem novo provedor e vínculo atômico na biblioteca existente. Revalida dono/material e arquivo ao consultar; snapshot/documento novo não reescreve o anterior. |
| Backend `src/imagem/geracao_provedor.py:12` | Reutiliza `ClientImagemMock`; PNG magenta válido 1088×1088, `simulated:true`, sem chamada externa. Não é anúncio nem medição de qualidade visual. |
| Backend `src/imagem/geracao_provedor.py:25` | Adapter real preparado e fechado por padrão antes da factory. Exige client/modelo compatíveis; usa operação nova de tentativa única. Não usa o custo estimado legado como cobrança; uso e faturamento podem permanecer NULL. |
| Backend `src/imagem/openai_client.py:254` | `gerar_uma_vez`: um formato explícito e um POST; sem retry em timeout, 429, 5xx ou resposta inválida. Captura request ID/usage quando retornados. Montagem do multipart compartilhada com caminho antigo, cuja política de três tentativas foi preservada. |
| Backend `src/imagem/geracao_router.py:17` | Factory de router FastAPI, NÃO montada. Modelo de entrada recusa campos extras. Erros de domínio/infraestrutura normalizados, sem corpo bruto privado para cliente. Token de máquina obrigatório no app do ensaio; não identifica uma pessoa por si só. |
| WebApp `scripts/sql/proposta-geracao-backend-22-10.sql:4` | Proposta SQL real revisável separada do fake-only anterior; não migration aplicada. UNIQUE de pedido/tentativa, checks de estado/dimensões, snapshot/resultado imutáveis, RLS e REVOKE explícito. Sem acesso Data API anon/authenticated; somente service_role SELECT/INSERT/UPDATE, sem DELETE. API backend entrega DTO seguro. |
| WebApp `scripts/conferir-geracao-backend-local.mjs` + backend `tests/integracao/geracao_local_bridge.py` | Ponte exclusiva de teste: fetch instrumentado → HTTP ASGI real em subprocesso Python → SQL real no PGlite do processo Node. Não é servidor, webhook, adapter Supabase remoto ou endpoint de debug. |
| Backend `tests/unit/test_imagem_tentativa_unica.py` | MockTransport e config fictícia para contrato real, sem chave/configuração da conta nem rede. |

### Execução, custo e retomada

- UNIQUE(request_id) arbitra concorrência; só o INSERT vencedor chama o provedor. Um job/uma tentativa por pedido neste bloco. Refação não foi implementada.
- `running` → `storage_pending` → `artifact_available`. Incerteza de resposta/staging → `reconciliation_required`; lease vencida não autoriza segunda geração. Falhas sem contexto acontecem antes de criar job, não fingem um registro `blocked` que não existe.
- Uma resposta perdida após staging confirmado é recuperada por consulta; ausência de staging comprovado exige reconciliação. Não afirmar que bytes apenas em memória estão salvos.
- Falha de Storage/vínculo retoma bytes/caminho/hash persistidos. Objeto com bytes diferentes, metadados de outra tentativa ou autorização revogada não se tornam biblioteca válida.
- Moeda USD, estimativa/reserva/limite em Decimal; `billed_usd` e `usage_reported` nulos quando desconhecidos. Estimativa legada por tabela não é fatura. Reserva fica presa a pedido/tentativa, **não é carteira global/mensal nem limitador da cobrança do provedor**.
- Contrato não promete idempotência da API de imagens. Não há endpoint automático de reconciliação do fornecedor, aprovação/refação, campanha ou aviso ao cliente neste bloco.

## 3. Testes e limites da prova

### Novos testes dirigidos

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-geracao-backend-local.mjs`: **18 cenários passaram**, sem ignorados. Última rodada antes do fechamento cobre:

1. Action real do pedido → porta WebApp → FastAPI → mock existente → staging → arquivo → `creatives` → nova instância do serviço e biblioteca, mesmo hash/negócio/tentativa; dimensões efetivas 1088×1088 e cobrança NULL.
2. Concorrência/replay: um job, uma chamada ao mock, uma reserva e uma peça.
3. Falha de Storage com bytes preservados e retomada por nova instância.
4. Resposta de Storage perdida: um objeto, sem geração de reposição.
5. Timeout ambíguo: reconciliação, custo desconhecido, sem retry ou erro privado.
6. Sessão/negócio/dono cruzados recusados pelo WebApp e backend antes do provedor.
7. Máquina sem token recusada; campos financeiros/direitos extras não aceitos pelo contrato HTTP.
8. Documento/material cruzado ou sem autorização recusado antes de reserva.
9. Mock negado em negócio não marcado fictício.
10. Revogação durante geração preserva bytes intermediários, impede entrega e biblioteca.
11. SQL bloqueia alteração de snapshot/tentativa/bytes e acesso anon/authenticated, inclusive com defaults hostis.
12. Arquivo adulterado nega biblioteca **e consulta de disponibilidade**, sem gerar novamente.
13. Flag WebApp ausente nega a chamada antes de abrir sessão/HTTP.
14. Staging confirmado com resposta perdida: consulta recupera resultado sem repetir provedor.
15. Staging não confirmado: reconciliação sem geração de reposição.
16. Falha de vínculo: retoma só persistência; documento novo não reescreve snapshot.
17. Reserva insuficiente ou manifesto aprovado para outro pedido: sem job/provedor.
18. Metadado adulterado de biblioteca não produz disponibilidade válida.

Backend `.venv/Scripts/python.exe -m pytest tests/unit/test_imagem_tentativa_unica.py -q`: **11 passaram** na versão final. Um POST/n=1/feed, 429/5xx/timeout/resposta inválida sem retry, formato duplicado negado, adapter fechado antes de factory, usage ausente NULL, detalhe de uso preservado e estimativa jamais convertida em fatura. Todos com MockTransport.

WebApp `pnpm typecheck`: passou. Backend `ruff check src tests` e `mypy src`: passaram (160 arquivos-fonte na checagem de tipos). Regressão unitária ampla executada pelo risco concreto de compartilhar o montador multipart do client legado: **2.825 passaram, 9 ignorados, 8 avisos de depreciação FastAPI/Starlette** em 93,68s. Essa execução coletou dez dos testes novos; o 11º foi acrescentado depois e passou na dirigida final. Não somar as contagens como testes únicos adicionais.

**Substituições explícitas:** Auth/negócio ativo são mocks de sessão, não JWT real; transporte fetch é instrumentado por stdio, não rede HTTP real; FastAPI/client Python são reais com ASGI; PostgreSQL é PGlite descartável, não projeto Supabase remoto; Storage usa tabela exclusiva do ensaio com bytes/hash, não bucket/URL assinada. Nova instância do serviço não é reinício de máquina. Não prova concorrência entre servidores, outbox, worker destacado ou recuperação após desligamento do SO. Os 27 testes do laboratório anterior e 17 provas HTTPS de upload não foram repetidos nem atribuídos a este bloco.

## 4. Contrato mínimo a passar ao dono do runtime — não aplicado

Não editei `src/api/main.py`, `rotas.py`, `config.py`, guarda de schema/QA ou configuração externa. Para uma próxima montagem, o dono deve injetar `SqlGeracao`, `ArquivosGeracao`, `CarregarContexto` e provedor em `GeradorDuravel(..., habilitado=False por padrão)`, e montar `criar_router(gerador)` somente em ambiente de geração especificamente autorizado, com autenticação serviço a serviço configurada e isolamento validado. O processo QA de leitura permanece GET-only.

Rotas propostas (existem **só no app de teste**, não produção):

- `POST /criativos/geracao/{business_id}`: `{request_id, profile_id}`; perfil vem de getUser no servidor WebApp, nunca de campo do navegador. O token de máquina não substitui a consulta de dono/negócio no backend.
- `GET /criativos/geracao/{business_id}/{request_id}?profile_id=...`: andamento sanitizado. Query contém ID de perfil, não token/credencial.
- `GET /criativos/geracao/{business_id}/{request_id}/biblioteca?profile_id=...`: confere vínculo/bytes e devolve metadados; **não fornece download/URL assinada pronta**. Adaptar leitura privada da galeria existente é portão seguinte.

DTO v1: IDs de job/pedido/negócio/tentativa, estado, `simulated`, hashes, moeda e valores monetários separados; sem snapshot completo, caminho privado, bytes, chave ou erro bruto. Uso detalhado/request ID ficam internos. O consumidor é server-only, não exposição automática desses custos ao navegador.

SQL necessário deve virar migration revisada pela trilha correta, não rodar o arquivo da proposta diretamente no remoto. Conferir pré-condições (`creative_generation_requests`, `businesses.dados_ficticios`, `creatives`/usos) e adapters de conexão — a porta usa parâmetros `$1...`, não presume psycopg/PostgREST já ligados. CLI não foi instalado nem timestamp de migration inventado.

O POST atual aguarda o processamento da tentativa no ensaio. **Não é fila/worker durável destacado.** Não conectar esse processamento longo diretamente ao clique do navegador nem aumentar timeout como substituto de entrega durável. Montagem assíncrona/dispatcher e tratamento de cancelamento exigem bloco próprio; timeout ambíguo continua sem retry.

## 5. Como os documentos e n8n entram — desenho atualizado, não ativação

O desenho em `docs/criativos-arquitetura-dados-documentos-n8n.md` continua referência histórica do planejamento. Delta deste bloco: contexto/snapshot/job/fronteira backend já são executáveis **somente no ensaio simulado** descrito aqui.

| Momento | Documento / dado | Responsável |
| --- | --- | --- |
| Curadoria anterior ao pedido | Referências de mercado/Pinterest com origem/data/direito; Jev opcional para classes fechadas, não prova de venda | Time/curador valida; importador futuro mantém catálogo. Não houve varredura ou Jev pago neste bloco. |
| Ao preparar pedido elegível | Regra central + MD do ID de nicho confirmado, marca/material e respostas do cliente | Loader confiável backend; congela conteúdo/revisão/hash junto ao pedido. Não copiar MD completo em nós Set. |
| Disparo/consulta | IDs exatos de pedido/job/correlação e autorização de serviço | n8n como acionador/agenda; backend reivindica e executa. n8n não concede direito, escolhe teto ou vira segundo worker. |
| Depois de resposta incerta | Estado canônico e evidência do provedor | Consultar/reconciliar; erro n8n não autoriza repetir geração. |
| Depois dos bytes | Retomar armazenamento/vínculo do mesmo resultado | Backend; não passar base64, prompt privado, chave ou URL assinada para logs n8n. |

Nenhum workflow remoto foi lido novamente, criado, alterado ou ativado. O piloto de curadoria anteriormente inventariado não foi apresentado como gerador pronto. Coleção, seleção automática de referências, catálogo global, loaders reais de MD/consentimento e n8n autenticado permanecem **faltando**, não entregues por um fake.

## 6. Proposta do primeiro piloto REAL — ainda NÃO autorizado

**Objeto proposto:** uma única edição de imagem de marca fictícia “Barbearia Piloto V2G”, oferta fictícia sem preço/desconto/depoimento, CTA de demonstração, sem campanha. Composição gráfica sem fachada/pessoas reais. Material a preparar/revisar no bloco aprovado: um logo PNG vetorializado próprio e uma referência gráfica própria, ambos 512×512, hashes e condição de uso registrados; não baixar imagem privada/concorrente por dedução.

**Provedor/modelo candidato verificado documentalmente:** OpenAI `gpt-image-2`, endpoint Images Edits, reaproveitando o client existente. Uma saída PNG feed 1088×1088, qualidade `high` explícita porque é a configuração atual do client, `n=1`, exatamente duas entradas, prompt final com limite proposto de 2.000 caracteres; sem stories/refação/fallback de modelo. A documentação admite o modelo/edição e dimensões livres divisíveis por 16; 1088 passa esse critério. Acesso da conta/modelo e limites particulares **não foram confirmados**. Não é escolha de melhor custo-benefício comprovada. [Contrato oficial](https://developers.openai.com/api/reference/python/resources/images/methods/edit), [modelo](https://developers.openai.com/api/docs/models/gpt-image-2).

**Orçamento para revisão:** US$2 para a única tentativa, sem retry. Justificativa de escopo: somente uma imagem/um formato/duas entradas pequenas, não lote nem geração de dez variações. **Esse valor é reserva proposta, não estimativa máxima comprovada ou limite duro do fornecedor.** Falta registrar cotação da calculadora oficial para o prompt/arquivos exatos, tipo de processamento e resolução/qualidade. A documentação de preços aponta cálculo por tokens/calculadora; a estimativa legada US$0,141 não justifica sozinha um teto garantido. Sem essa evidência ou limite operacional aceito pelo Victor, o piloto não deve executar. Não inferir gratuidade ou aprovação pelo saldo Jev. [Precificação e calculadora oficiais](https://developers.openai.com/api/docs/pricing).

**Ambiente proposto:** worker local autorizado contra dados/armazenamento fictícios isolados, NÃO produção nem POST liberado no backend-qa GET-only. Custo real exige chave já existente acessível exclusivamente ao client autorizado, nunca enviada neste chat. Para prova no app com novo login, primeiro precisa de ambiente de geração gravável separado/autorizações, schema/adapters e leitura privada configurados. Não vender o ensaio ASGI como essa homologação.

**Medir:** duração, uma chamada, provider request ID se retornado, dimensões/bytes/SHA-256, texto/logo/fidelidade julgados por humano, tokens retornados ou lacuna, estimativa por tabela datada e cobrança conciliada separada. Comparar outros provedores só depois desse primeiro dado. Não declarar imagem “perfeita” ou vencedora de vendas.

**Limpeza proposta para autorização:** apagar apenas o objeto e registros fictícios identificados desse piloto, após guardar manifesto de hashes/IDs/custo, sem tocar clientes reais. A proposta SQL não dá DELETE ao serviço; usar trilha administrativa específica quando autorizada. Nenhum upload/limpeza externa feito aqui.

## 7. Pendências ordenadas e dono

1. **Runtime/adapters reais sem gasto — Central + 07/08 + 05/06.** Definir ambiente gravável separado do QA GET-only; fontes de contexto/consentimento, SQL e Storage; converter SQL revisado e montar router/dispatcher. Próxima autorização deve nomear esse recorte, sem produção/pagamento por arrasto.
2. **Pedido e materiais fictícios aprovados + cotação do piloto — 05/06 prepara, Victor valida.** Depende de 1 para caminho autenticado; logo/referência podem ser preparados antes sem enviar a provedor. Ação mínima de Victor no portão pago: aprovar material/destino, uma tentativa e teto após receber a cotação explícita.
3. **Primeira imagem real e recuperação no app — 05/06 + 07/08.** Só após 1–2 e permissão de gasto/ambiente; provar login, negócio/versão/hash, custo e limpeza. Interface/upload atuais preservados, criação real ainda não liberada ao cliente.
4. **Acionamento n8n/catálogo/curadoria — 05/06 + responsável de conteúdo.** Outro bloco autorizado; MDs revisados do time, direitos de referência e fontes reais. Não é requisito de ferramenta para simular e não transforma biblioteca pública em histórico de conversões.
5. **Aprovação/refações, gestor, publicação/avisos — blocos posteriores.** Adiados; nenhuma declaração de conclusão das etapas 05/06 como um todo.

## 8. Coordenação e encerramento

Figma e planilha **NÃO RELIDOS neste bloco**; não repetida tentativa na quota Figma. Usados checkpoint anterior e direção humana retransmitida no handoff de 22/10. Central é responsável por atualizar plano/Figma/Sheets/decisões/índice/package.

Outras frentes alteraram financeiro/pedidos/onboarding e documentos QA durante a execução. Preservadas; não pertencem a este bloco. Não editei runtime/guarda QA/schema de 07/08, interface/upload, páginas legais, `.env`, flags/configuração externa, Meta/n8n/serviços, clientes reais ou artefatos da Central. Sem commit/push/merge/deploy/migration remota, chamada paga, material privado, mensagem a outro chat, automação, subagente, build/restart compartilhado.

Skills aplicadas: arquitetura de agentes preservou o client/stack existente, sem framework novo; Supabase/Postgres orientaram RLS/REVOKE e isolamento testado; documentação oficial OpenAI conferiu o contrato de edição, sem usar estimativa como cobrança. Changelog Supabase Markdown recusado pelo leitor, consultado HTML e RLS oficial. Não houve alteração de SDK/infraestrutura.

**Bloco local encerrado para revisão.** Funciona a integração simulada, falta entregar a primeira criação real ao cliente. Nenhuma tarefa seguinte foi iniciada automaticamente.
