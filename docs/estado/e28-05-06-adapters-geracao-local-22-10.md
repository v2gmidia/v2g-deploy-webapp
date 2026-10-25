# E28-05/06 — adapters de geração, código real / ensaio LOCAL — 22/10/2026

## §0 — resultado e próximo portão

**Entregue neste bloco:** adapters de SQL psycopg e Supabase Storage com dependências injetadas; construção sem conexão/configuração; consultas de fontes existentes de marca; contrato server-only de leitura privada; testes locais de transação, codecs, duplicidade, falha e recuperação. **18 cenários integrados novos e 17 testes unitários novos passaram.** Ruff e tipos backend limpos.

**Não entregue:** conexão com projeto/bucket reais, migração, router montado, dispatcher destacado, n8n ativo, documento de nicho aprovado, autorização persistente de uso de material por IA ou primeira imagem real. Código de adapter real sob transporte substituído não é homologação remota.

Autorização: novo recorte 05/06 E28-06-B/C retransmitido pela Central após ler `e28-05-06-integracao-gerador-local-22-10.md`; adapters locais, sem gasto/escrita externa e sem alterar runtime/QA. O backend continua único dono do job. A aplicação da unidade 1 de métricas em QA, relatada pela Central, não foi reutilizada como autorização de geração.

**Próximo ato único:** Central passar o contrato de assembly da §5 ao 07/08, para mapear ambiente gravável isolado e dependências antes de nova implementação/publicação. Não montar este POST no backend-qa GET-only. As fontes atuais ainda não permitem contexto aprovado: o loader entrega pendências verdadeiras e retorna indisponível. Victor não precisa fornecer senhas/chaves neste momento.

## 1. Arquivos e comportamento implementado

Raiz backend: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g`.

| Arquivo / linha | Evidência local |
| --- | --- |
| `src/imagem/geracao_sql.py:30` | Conversão lexical de `$n` para binding nomeado psycopg, nunca interpolação de valores. Repetição/ordem de parâmetro preservadas; strings, comentários aninhados/dollar quotes e `%` não se tornam parâmetros. Dialeto limitado recusa escapes com contrabarra, statement múltiplo, marcador fora de faixa ou lista divergente. |
| `src/imagem/geracao_sql.py:105` | `PsycopgSqlGeracao(conectar)`: factory injetada só chamada em query. Exige conexão nova, exclusiva, não autocommit e IDLE. Uma transação por statement; usa `transaction()`, cursor `dict_row`, binding e tipos do driver. Commit antes de retornar, rollback em erro de corpo, fechamento também em cancelamento. Sem retry de query/commit. |
| `src/imagem/geracao_storage.py:42` | `SupabaseArquivosGeracao(storage,bucket,sql,business_id,profile_id,materiais)`: usa SDK async já instalado via Supabase; não cria client/bucket/config. Confere bucket privado por metadado antes de ler/gravar; não transforma público em privado. |
| `src/imagem/geracao_storage.py:75` | Autorização SQL do caminho, dono/negócio/job/tentativa/status/hash antes do SDK. Caminho canônico `geracao/{business}/{job}/{attempt}.png`, UUIDs exatos; material só por manifesto explícito e linha própria de `creatives`. URL, traversal, encoding, outro negócio/tentativa recusados. |
| `src/imagem/geracao_storage.py:122` | Preserva bytes/hash; objeto igual já existente não abre novo upload. `upsert:false`; objeto diferente jamais sobrescrito. Timeout/duplicidade/resposta perdida abre consulta do mesmo caminho, não segundo POST automático. Leitura inconclusiva não é arquivo ausente que autorize escrever. |
| `src/imagem/geracao_storage.py:148` | `preparar_leitura_privada(request_id,job_id)`: confere acesso, vínculo `creatives`, versão/pedido/tentativa/snapshot/hash e `simulated`, relê arquivo e entrega alvo interno imutável. Não gera URL nem abre download ao navegador. |
| `src/imagem/geracao_contexto_existente.py:26` | `ContextoDasFontesExistentes(sql,profile_id)`: lê `businesses.onboarding.marca` e inventário próprio em `creatives`, com seleção de colunas explícita. Confere cores hex/data com fuso/“não sei”. Não conclui consentimento, nicho, referência ou orçamento a partir do upload. |
| `src/imagem/geracao_jobs.py:196` | Delta indispensável encontrado no roundtrip psycopg: dinheiro em Decimal agora sai no DTO com `format(...,'f')`, sem arredondar. `1E-18` passava pelo driver, mas o consumidor WebApp exige decimal sem expoente. Corrigido e testado sem mudar interface/contrato financeiro. |
| `tests/unit/test_geracao_sql_adapter.py` | Ciclo de conexão, rollback/commit/close/cancelamento, dialeto e valores sem interpolação/float. |
| `tests/integracao/geracao_adapters_bridge.py` | Harness exclusivo de teste: adapters de produção + codec psycopg/SDK Storage reais, com conexão/transação e HTTP substituídos. Não importar no runtime. |
| WebApp `scripts/conferir-adapters-geracao-local.mjs` | PostgreSQL descartável e simulação de commit perdido; executa SQL parametrizado e callbacks de transação reais no PGlite. Sem mudar package ou instalar dependências. |

`geracao_jobs` mantém claim/staging/vínculo como statements atômicos separados. **Não** manter transação/conexão aberta enquanto aguarda o gerador ou Storage. Factory de conexão deste adapter transfere posse ao adapter, que fecha a conexão; não injetar conexão global compartilhada nem conexão de pool cujo `close()` signifique devolução ambígua sem contrato próprio.

### Falhas transacionais

`FalhaSqlGeracao` tem mensagem segura e campos internos:

- Falha de conexão/corpo: `commit_confirmado:false`; contexto transacional tenta rollback e fecha. Nenhum retry automático.
- Falha na saída de `transaction()` depois do corpo: `commit_confirmado:null`; resultado pode ter sido confirmado. Consultar por pedido/tentativa; nunca repetir cobrança com base na exceção.
- Fechamento falhou após commit confirmado: `commit_confirmado:true`; escrita aconteceu, mas o chamador recebeu falha. Recuperar por leitura; não reenviar statement por reflexo.
- Cancelamento propaga `CancelledError`, mas sai da transação e fecha. Não é evidência de “provedor não recebeu”.

Os statements seguem com parâmetros fora do SQL. JSON dict/list usa `Jsonb`, Decimal permanece Decimal, bytearray/memoryview vira bytes sem perder conteúdo. O driver faz adaptação/retorno: não converter tudo a float/string em camada genérica. JSON contendo Decimal preserva sua representação textual, não float binário. O DTO monetário usa formato decimal fixo apenas na fronteira de resposta.

## 2. Fonte existente de contexto — mapeamento sem inventar aprovação

| Fonte conferida em código | O que prova | O que NÃO prova |
| --- | --- | --- |
| WebApp `lib/onboarding/marca.ts`, `lib/criativos/carregar-marca-da-sessao.ts` | Cores declaradas/confirmadas em `businesses.onboarding.marca`, data e inventário `creatives` logo/identidade sob dono/negócio | Destino/finalidade do processamento por IA, referência licenciada, autorização de imagem ou MD de geração aprovado |
| WebApp `lib/identidade/armazenar.ts:30` | Bucket usado é `v2g-midia`; prefixo atual `identidade/{business_id}/`; servidor valida/escreve arquivos | Novo catálogo global, uso automático de material privado ou direito de enviar foto a terceiro |
| WebApp `lib/criativos/selecionar-marca.ts:20` | Contrato puro `AutorizacaoDeGeracao` exige imagem/negócio/finalidade/autor/data/revogação | Não encontrei fonte persistente ligada a esse contrato nos loaders/migrations consultados; o array de fixture não é consentimento real |
| WebApp migration `0010_perfil_empresa.sql:35–60` | Campos de consentimento de pessoa fotografada existem para um caso restrito, descrito no próprio schema como sem uso atual | Não são autorização genérica por imagem/provedor/finalidade. Não reutilizados por suposição |
| Backend `src/knowledge/loader.py` e diretório `knowledge/` | Loader/catálogo dinâmico existente de documentos de campanha por slug/canal | Conteúdo de geração revisado com manifestos/hash/autorização do piloto. Não há `barbearia.md` nesse inventário local; não usar `generico.md`, salão ou outro nicho por aproximação |
| WebApp `docs/criativos-base-central.md`, `criativos-modelo-nicho.md` | Direção/template de trabalho e limites | Prompt ou documento específico de mercado já aprovado/implantado |
| `creative_generation_requests` | Pedido imutável e intenção do cliente | Consentimento para IA, orçamento liberado, referência selecionada ou comprovação de publicação |

`ContextoDasFontesExistentes.diagnosticar()` devolve marca/inventário e códigos de pendência. Sem fonte aprovada, seu `__call__` retorna **None** mesmo quando há logo/cores válidos. Pendências atuais explícitas: `documentos_geracao_sem_manifesto_aprovado`, `autorizacao_ia_sem_fonte_persistente`, `referencias_sem_catalogo_autorizado`, `orcamento_piloto_nao_aprovado`; também marca inválida/acesso negado quando aplicável. Inventário limitado sinaliza necessidade de paginação.

Este é um loader parcial e seguro, **não o loader completo pronto para liberar geração**. Não gravei consentimento, não promovi Markdown de teste a aprovado e não criei schema/catálogo. O prefixo `referencias/{business}/...png` no adapter é contrato restrito para material explicitamente autorizado no futuro, não uma fonte já povoada. Não aceita automaticamente uma referência pública/Pinterest de qualquer URL.

## 3. Testes executados neste bloco

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-adapters-geracao-local.mjs`: **18 passaram, 0 falhas/ignorados**, execução final de 3,83s no processo de testes, não latência de produto.

1. Adapters SQL/Storage + gerador/mock existentes → bytes persistidos → biblioteca → alvo de leitura privada, mesmo hash, `simulated:true` e conexões fechadas.
2. Codec instalado do psycopg: parâmetros fora de ordem/repetidos, numeric com precisão de 18 casas, JSON Unicode, bytea e valor com texto hostil sem interpolação.
3. Aspas/comentários aninhados/dollar quotes/% preservados; múltiplos statements e marcador inválido recusados.
4. Falha antes do commit de claim: rollback, sem job e próxima conexão limpa.
5. Claim commitado no banco com resposta perdida: job running preservado, **zero chamadas ao provedor**, sem tentar gerar novamente por um claim de resultado incerto.
6. Staging commitado com resposta perdida: recupera bytes/Storage sem segunda geração.
7. Conexões/execuções concorrentes disputam UNIQUE no banco; uma geração/job.
8. Upload guardou e resposta se perdeu: consulta confirma mesmo objeto, um POST de upload.
9. Timeout antes de guardar: estado storage_pending, nova ação retoma só armazenamento com mesmo hash; uma geração.
10. Objeto diferente apareceu na disputa: não sobrescreve nem vincula como disponível.
11. Bucket público/consulta inconclusiva impedem leitura/upload, sem presumir “não existe”.
12. Outro negócio/tentativa, URL, traversal e encoding recusados antes de chegar ao SDK.
13. Objeto existente igual evita upload; dono divergente e bytes adulterados negam leitura.
14. Marca/inventário válidos não concedem consentimento/documentos/orçamento; outro dono não obtém inventário.
15. Marca parcialmente inválida não se torna marca confirmada.
16. Constraint SQL falha no INSERT de múltiplas linhas; PostgreSQL não deixa metade gravada, rollback ocorre e conexão seguinte aceita escrita válida.
17. Decimal pequeno do driver preserva valor e sai em formato fixo compatível com consumidor, sem arredondamento.
18. Metadado adulterado que transforma simulated true em false não ganha alvo de leitura privada.

Backend `.venv/Scripts/python.exe -m pytest tests/unit/test_geracao_sql_adapter.py -q`: **17 passaram**. Oito recusas de dialeto/lista de parâmetros, tipos sem float/interpolação, construção sem factory, ordem begin/execute/commit/close, falha antes/depois do commit, cancelamento e conexão não exclusiva/ociosa/fechada.

Backend `.venv/Scripts/python.exe -m ruff check src tests`: passou. `.venv/Scripts/python.exe -m mypy src`: passou, **163 arquivos-fonte**. Sem repetição da suíte unitária ampla: dependências/arquivos globais de runtime não foram alterados e a Central pediu evitar repetição sem risco novo. A prova ampla anterior **2.825/9 ignorados** e os **18 cenários/11 testes** do bloco anterior permanecem identificados no checkpoint anterior, não são resultados reexecutados ou contagens novas daqui. Só o delta de formatação do DTO existente foi reexercitado na integração dos adapters.

### O que é real / o que foi substituído

- **Código dos adapters de produção real**, sem factory de configuração/segredo; drivers já instalados: psycopg **3.3.4**, supabase **2.31.0**, storage3 **2.31.0**, httpx **0.28.1**. Nenhuma dependência instalada/atualizada.
- **Codec/parse/adaptação psycopg reais**: placeholders gerados e tipos carregados pelo driver instalado. APIs privadas do codec só no harness, nunca no adapter de produção.
- **SQL PostgreSQL/BEGIN/COMMIT/ROLLBACK/constraint/UNIQUE executados no PGlite descartável** do processo Node. Dependências mínimas do schema são stubs e DDL `creatives`/pedidos/proposta vem dos arquivos existentes. Não aplica migration externa.
- **Conexão/cursor/contexto transacional psycopg substituídos** por harness que encaminha para o PGlite. Nenhum postgres/pg_ctl/psql disponível foi encontrado no PATH; não instalei servidor/container. **Não comprova handshake libpq, conexão AsyncConnection verdadeira, pooler/TLS, isolamento entre processos remotos ou comportamento de produção na perda de socket.** A falha de commit é injetada depois de COMMIT real no banco descartável, não queda de rede real.
- **SDK async Storage real** com `httpx.MockTransport`, metadados privados e endpoints/multipart reais; HTTP sem socket. Objetos ficam em tabela exclusiva de teste com bytes/hash. Não é Supabase Storage real, quota/RLS/Auth do serviço, URL assinada ou política de bucket comprovada.
- Provedor continua `ClientImagemMock`, sem IA real. Manifesto/consentimento/documentos **fictícios explicitamente injetados só no harness**. O loader das fontes reais não os conhece e permanece bloqueado.
- Não houve navegação/login/upload de cliente nem conferência UI. WebApp alterado apenas em teste `.mjs` e neste checkpoint; não repetir typecheck/UI sem alteração TS/interface neste bloco.

## 4. Limites de Storage e leitura privada

- `SupabaseArquivosGeracao` não possui método de criar bucket, torná-lo público, remover arquivo, upsert, fallback de caminho ou gerar nova imagem.
- Bucket é injetado pelo assembly a partir de configuração aprovada existente; adapter verifica `public:false` em metadado a cada operação. Não habilita bucket por conta própria nem presume que uma string “privado” seja prova.
- Escrita exige job atual no negócio/dono, tentativa exata, status storage_pending, caminho/hash fixados. Chamadas de retomada usam os mesmos bytes duráveis. Storage não é o dono do estado de geração.
- `preparar_leitura_privada` retorna `{business_id,request_id,creative_id,attempt_id,caminho,sha256,simulated,tipo_midia,validade_maxima_proposta_s:90}` **somente internamente**. O prazo é proposta de contrato, não URL já emitida nem regra implantada.
- Futuro chamador da galeria deve derivar perfil/sessão e negócio no servidor, conferir o alvo naquele instante e só então gerar URL curta privada ou servir bytes por rota autenticada. Não receber caminho bruto do navegador, não expor service_role e não aceitar alvo expirado como aprovação. Nenhuma URL real foi criada neste bloco.
- Privacidade/consentimento podem ser revogados: a montagem futura precisa consultar fonte persistente atual. Snapshot preserva o que foi usado; não revoga a obrigação de conferir permissão atual antes de entrega.

## 5. Assembly concreto para Central → 07/08 — proposta não montada

Imports e constructors já existentes em código:

```python
from src.imagem.geracao_sql import PsycopgSqlGeracao
from src.imagem.geracao_storage import SupabaseArquivosGeracao
from src.imagem.geracao_contexto_existente import ContextoDasFontesExistentes
from src.imagem.geracao_jobs import GeradorDuravel
from src.imagem.geracao_provedor import ProvedorMockJob, ProvedorOpenAIJob
from src.imagem.geracao_router import criar_router

sql = PsycopgSqlGeracao(conectar_exclusiva_aprovada)
# conectar_exclusiva_aprovada: async factory -> AsyncConnection[dict[str, Any]],
# exclusiva, IDLE, autocommit=False; nenhuma conexao aberta no import/constructor.

contexto = ContextoDasFontesExistentes(sql, profile_id)
# Hoje devolve None: ainda faltam as fontes de direitos/documentos/orcamento.
# Nao substituir por fixture ou texto generico para "passar".

arquivos = SupabaseArquivosGeracao(
    storage_async_injetado, bucket_privado_aprovado, sql,
    business_id, profile_id, materiais_aprovados_do_servidor,
)
gerador = GeradorDuravel(sql, arquivos, contexto, ProvedorMockJob(), habilitado=False)
# criar_router(gerador) e factory, NAO chamada include_router no runtime atual.
# ProvedorOpenAIJob() permanece autorizado=False por padrao.
```

Nomes `conectar_exclusiva_aprovada`, `storage_async_injetado`, `bucket_privado_aprovado`, `profile_id`, `business_id` e `materiais_aprovados_do_servidor` são **dependências a prover**, não funções/globais/configuração já implementadas. A construção é vinculada a dono/negócio: não reutilizar um adapter scoped em requisição de outro perfil; não fazer um router global preso ao primeiro cliente. O router de teste anterior precisa de dependency factory/request context na montagem multiusuário, fora deste bloco.

Responsabilidades da montagem futura:

1. **Ambiente:** serviço gravável isolado de geração, não o backend-qa GET-only e não produção. Identificador/projeto/bucket/conta e permissões devem ser aprovados. Nada configurado neste bloco.
2. **Schema:** revisar e autorizar individualmente a proposta `scripts/sql/proposta-geracao-backend-22-10.sql` e pré-condições de pedidos/negócios/creatives. Não aplicar unidades de métricas por arrasto. Não alterei qualquer schema neste bloco, nem a proposta anterior.
3. **SQL:** factory exclusiva do lifespan/dono 07/08; role de privilégios mínimos já revisada. Credencial só do ambiente servidor, nunca corpo/query/path ou leitura pelo agente. Adapter fecha conexão por query; para pool, criar contrato de checkout/devolução explicitamente antes de adaptar.
4. **Storage:** injetar client async já autenticado e bucket privado aprovado; timeout/redirect/retry do transporte explícitos, preferindo não seguir redirect para transportar credencial. Lifespan fecha client; adapter não o destrói por arquivo. Nenhum client/config global novo criado por nós.
5. **Contexto:** completar fonte persistente/verificável de revisão MD, consentimento por material/finalidade/provedor, referência e aprovação do orçamento/pedido. O atual diagnóstico não libera esse portão.
6. **Auth:** manter token serviço a serviço e autorização do pedido/dono no backend, perfil derivado de getUser no servidor WebApp. Token de máquina não é sessão humana; não aceitar perfil do formulário nem grants amplos para agências.
7. **Default OFF:** `GeradorDuravel(..., habilitado=False)`, WebApp `V2G_CREATIVE_BACKEND_ENABLED` não ativada e `ProvedorOpenAIJob(autorizado=False)`. Não inferir flag ou gasto por causa de schema pronto ou token existente. Cadastro fictício para mock é obrigatório, sem reclassificar negócio real.

### Enqueue, execução e consulta são diferentes

- **Pedido/enqueue:** `guardarPedidoAction` existente registra intenção. Ainda não há outbox/dispatcher/claim em fila ligado ao app; intenção guardada não significa worker iniciado.
- **Execução:** `GeradorDuravel.executar` aguarda a tentativa no ensaio; backend é único dono de claim/custo/resultado. Futuro worker/dispatcher destacado deve invocá-lo fora do clique e resolver cancelamento/reconciliação. Não criar segundo worker no WebApp/n8n nem aumentar timeout do navegador como solução de durabilidade.
- **Consulta/galeria:** `consultar`/`biblioteca` e o novo alvo privado verificam o mesmo job; não disparam geração. App não transforma incerteza em “não aconteceu”.
- **n8n:** futuro acionador/agenda que transporta IDs autorizados e consulta estado; não remonta MD, concede consentimento/teto ou repete chamada paga em erro. Nenhum workflow lido, alterado ou ativado neste bloco.

Os paths HTTP propostos no checkpoint anterior continuam **não montados**; `src/api/main.py`, `rotas.py`, `config.py` e cerca de QA não foram alterados. O código deste bloco não deve ser apresentado como “basta ligar a flag”: faltam as dependências/dispatcher/portões acima.

## 6. Primeiro piloto real e custo — sem nova autorização

Mantida a proposta anterior: uma imagem fictícia, OpenAI `gpt-image-2` por Images Edits, n=1, PNG feed 1088×1088, high explícito do client, duas entradas gráficas próprias pequenas, sem fachada/pessoas reais, promoção real ou campanha. É candidato por reaproveitamento, não vencedor de custo-benefício.

**US$2 permanece reserva proposta, não limite máximo comprovado/aceito nem autorização.** Não obtive cotação exata nova neste bloco e não usei a tabela estimativa legada como fatura. Antes de chamada: materiais/prompt exatos, revisão de direitos/destino, cotação registrada para qualidade/resolução/entradas/saída e limite operacional explicitamente aceito por Victor. Se faltar isso, continua proibida a chamada paga. Uma reserva SQL não limita o faturamento da OpenAI por si só.

Não gerei logo/referência por modelo, não enviei imagem/texto privado nem testei acesso da conta/modelo. `usage_reported`/`billed_usd` ausentes continuam NULL. Não houve pagamento, geração paga, upload/limpeza real ou escrita Meta. A autorização de ensaio futuro deve nomear ambiente, quantidade, teto, materiais, prova de recuperação no app e limpeza restrita por IDs.

Documentação técnica pública consultada, sem conexão a projeto/conta: [binding psycopg](https://www.psycopg.org/psycopg3/docs/basic/params.html), [transações](https://www.psycopg.org/psycopg3/docs/basic/transactions.html), [upload Supabase](https://supabase.com/docs/reference/python/storage-from-upload), [bucket privado](https://supabase.com/docs/guides/storage/buckets/fundamentals). A API instalada foi lida localmente para confirmar os métodos async/contrato de erro; nenhuma dependência alterada. Consulta de documentação pública não é ensaio remoto do produto. Preços/piloto continuam nas fontes e lacunas nomeadas no checkpoint anterior.

## 7. Faltas ordenadas, responsável e ação mínima

1. **Ambiente/assembly/runtime/schema — Central + 07/08.** Próximo ato: mapear serviço gravável isolado, factory/role/conexão e Storage privado, e revisar proposta SQL sem desligar GET-only. Depende de autorização específica para implantação/schema/configuração; não há ação de Victor de passar senha.
2. **Fonte de documentos/referências/consentimento — 05/06 + Victor/time de conteúdo.** Próximo ato: fechar registro/versionamento do MD e evidência de uso por material/destino; só depois completar o loader. Ação humana mínima: validar o conteúdo e direitos do primeiro conjunto fictício, sem dados de cliente por dedução.
3. **Dispatcher e galeria privada autenticada — 05/06 + 07/08.** Depende de 1–2; implementar dependency scope por dono/negócio e execução fora do clique, leitura privada com sessão/versão/hash. Ainda não há download/URL pronta no app.
4. **Piloto pago e custo medido — 05/06 + Victor.** Depende de 1–3 e cotação/limite operacional. Ação mínima futura: aprovar um pedido/material/provedor/teto/ambiente identificados, depois da proposta completa; US$2 anterior não é essa aprovação.
5. **Aprovação/refação, mesa, publicação/avisos — adiado.** Nenhuma implementação por arrasto. Curadoria n8n/Jev em lote não foi usada como prova de imagem real ou vendas.

## 8. Encerramento e ownership

Estado inicial/diffs de ambos os repositórios conferidos, alterações financeiras/pedidos/onboarding e docs QA alheios preservados. Só área backend `src/imagem`, testes próprios, teste `.mjs` WebApp e este checkpoint foram editados neste bloco. O client de imagem pago não foi alterado novamente. Não editei runtime, QA, schema/migrations, package, decisões/índices/plano/Figma/Sheets, upload/galeria ou configuração externa.

Sem commit/push/deploy, aplicação SQL remota, leitura/impressão de `.env`/segredos, acesso a projeto/bucket/conta reais, conexão externa nos testes, mensagem a pessoas/outros chats, n8n/Meta, chamada paga, subagente, automação ou build/restart compartilhado. Somente leitura de documentação pública fora dos ensaios. Skill Supabase/Postgres orientou isolamento, verificação de bucket privado, binding e transação explícita; não criou plataforma/dependência nova.

**Bloco encerrado.** Prontos localmente os adapters e contrato de montagem; geração real/autenticada do cliente continua pendente dos portões acima. Central pode repassar a §5 ao 07/08; não iniciei o bloco seguinte.
