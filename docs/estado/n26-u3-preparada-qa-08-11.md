# N26 — U3 preparada para o QA, sem aplicação — 08/11/2026

## 0. Resultado e parada

**Preparação local concluída; U3 não aplicada.** Victor autorizou distribuir a montagem, revisar e testar localmente, sem aplicar nada no banco e sem produção. O 01/02 montou o pacote; 03/04 revisou consumidores e contratos de perfil; 07/08 revisou dependências e efeitos no backend. A Central revisou o SQL, pediu correções, executou o ensaio completo e acrescentou uma verificação independente.

Alvo proposto: `v2g-webapp-qa`, projeto `zskpijnqgkqwxksqmzmf`. O estado anterior continua sendo [U1 aplicada](./n26-u1-qa-aplicada-07-11.md) e [U2 aplicada](./n26-u2-qa-aplicada-07-11.md), com 46 entradas de migration. Nenhuma DDL U3 foi enviada, nenhum corpo de negócio foi chamado remotamente e nenhum backup real U3 foi capturado. Houve somente leituras indispensáveis de metadados do QA; nenhuma consulta SQL ou escrita em produção.

O [pacote U3](../qa/reconciliacao-schema-07-11/u3/README.md) fica em subpasta própria. Os 30 arquivos selados da U1/U2 foram conferidos e continuam iguais. Não houve alteração de runtime, .env, flags, jobs, serviços, páginas legais, manifesto principal, conferidores, configuração, commit, push ou deploy. Não se abriu U4–U6.

## 1. Delta e decisões locais

Grupos 3, 4, 5, 7 e 11 da classificação original: nove ausências instrumentadas. O delta cria cinco tabelas (`pessoas_do_negocio`, `entrevistas`, `propostas_de_perfil`, `itens_da_proposta`, `divergencias_de_cadastro`), a coluna `creatives.pessoa_id` e duas RPCs (`aplicar_proposta` e `escrever_apenas_se_livre`). `entrevistas.transcricao`, contada separadamente no grupo 11, já nasce nullable dentro da tabela nova; não é uma segunda adição da mesma coluna.

Fontes: 0010, 0012, 0013, 0019 e 0025. Os helpers generalizados da 0011 são dependências já existentes, com assinatura, corpo, owner e ACL conferidos; não se recriam os overloads antigos da 0010 nem se reaplicam arquivos históricos inteiros. A 0010 também altera `execucoes`, tabela backend que permanece fora do delta.

Mudanças deliberadas em relação às fontes históricas, restritas à U3:

- FKs compostas conferem pessoa/negócio no criativo e entrevista/negócio na proposta. Exclusão da pessoa limpa somente `pessoa_id`, preservando `business_id` do criativo.
- Um item aceito não pode trocar silenciosamente o valor proposto por outro `valor_final`. O valor aplicado como extraído continua sendo o proposto; correção explícita segue como manual.
- As duas novas RPCs possuem listas explícitas de campos permitidos: 26 pares tabela/campo do catálogo de extração e 19 campos de negócio para escrita automática. Os 15 destinos usados pelo MAPA do backend estão contidos nessa lista.
- Origem nula ou inválida é recusada pela nova porta de escrita automática. Zero, false e listas são valores, não ausência; null não apaga um campo por essa porta.
- As novas funções bloqueiam as linhas pertinentes antes de ler a procedência. Isso não certifica concorrência global com escritores antigos.
- Pessoas têm policies explícitas por operação e acesso autenticado apenas ao próprio negócio. Entrevistas permitem ao cliente somente a leitura própria; serviço tem SELECT/INSERT, sem UPDATE/DELETE. Propostas e itens ficam administrativos; divergências recebem SELECT/INSERT do serviço. As duas RPCs são executáveis somente pelo owner/serviço.

A cópia local inicial do atributo de `procedencia_do_campo` foi corrigida. A Central fez uma consulta somente de catálogo no QA e comparou integralmente a definição corrigida: SECURITY DEFINER, owner postgres, search_path public, ACL owner/serviço, corpo MD5 `7a7eacfac538a4f5a6a2869e816bf291`. A função instalada não foi alterada.

## 2. Evidência executada pela Central

`node docs/qa/reconciliacao-schema-07-11/u3/executar-local.mjs` terminou com **`ok=true`, 21 cenários aprovados, `remote=false`** na execução final da Central. A execução completa foi independente da execução do montador. A versão final foi relida e ensaiada depois da inclusão dos casos de uso legado inválido e do limite de extras do helper. Os SQLs de aplicação/retorno mantiveram os hashes já revisados.

Os cenários cobrem aplicação/retorno em transação local; recibos SQL equivalentes à normalização JS; ledger fictício 46 → 47 → 48; entrada nominal do canal antes ou depois do corpo; escrita dos 15 destinos backend; valores zero/false/lista; recusa de origem/campo/tipo inválidos; três tabelas de perfil com rastreio de proposta/item/entrevista; recusa de pendentes e reaplicação; falha posterior com reversão integral; confirmado aceito versus correção manual; vínculos cruzados; RLS positivo e negativo; ACL de serviço e público; drift de pais/helpers/ACL/defaults; retorno com dados, índices, CHECKs e view posteriores.

O pacote final contém **21 arquivos selados** (fora o próprio SHA256SUMS). A Central conferiu todos eles, além dos 30 arquivos U1/U2, e verificou a estabilidade dos arquivos durante o ensaio final.

A Central também executou um ensaio suplementar próprio, sem alterar o pacote: conferiu o catálogo e o MAPA pelas fontes; acrescentou colunas legítimas fictícias em `execucoes` e `commercial_order_units` antes da aplicação; verificou preservação de contexto e dados, helpers/U1/U2, vínculos cruzados e SET NULL, entrevista nullable, item aceito 10/proposto versus 20/final, zero, origem nula, campo operacional proibido, RLS com acesso próprio permitido e negócio alheio negado, e retorno recusado sem alteração do catálogo. **Passou.**

Esse caso adicional corrige uma guarda inicialmente inadequada: o SQL não pode exigir que o schema completo do QA imite as nove tabelas backend mínimas da fixture. O pacote passou a comparar previamente só dependências medidas/reconstruídas fielmente e as proteções semânticas do backend, mantendo a comparação integral PRE/PÓS dos metadados capturados fora do delta. Tabelas backend não foram retiradas dessa comparação.

Regressões locais das bases: **U1 15/15** e **U2 11/11** passaram; os 30 hashes aprovados foram conferidos separadamente e pelo ensaio U3. Não foi necessário build/.next, instalação de serviço ou alteração de dependências. O aviso do Node sobre importação do catálogo TypeScript não foi tratado alterando package.json.

## 3. Aplicação futura, backup e retorno

O pacote inclui PRE/PÓS com um SELECT, uma linha e um recibo JSON; aplicação futura em um único DO, sem BEGIN/COMMIT externos; verificação somente leitura; comparador; retorno condicionado; plano de backup privado; manifesto e hashes. Canal DDL futuro: `apply_migration`, somente QA, nome `qa_reconciliacao_u3_perfil_procedencia_20261108`.

SQLs exatos revisados e ensaiados pela Central (SHA-256):

- `u3-aplicar.sql`: `94b9c630ecc757ce458cc76a5adc48dbc3297538730d286ff80bceab747a75a7`.
- `u3-retornar.sql`: `b9c217fd8973ed30c426e1d46c69c24054a2fa3723ccff324e5181a69f709e98`.

Uma aplicação futura exige autorização nominal, confirmação do alvo, conferência do pacote e captura privada atual antes da escrita. Os 46 pares version/name anteriores devem permanecer iguais, com uma única entrada nova U3 (47 no total). Um retorno autorizado acrescentaria somente sua entrada própria (48); não há repair/replay de histórico ou retry cego.

Retorno após commit exige autorização separada e comparação com o PÓS aceito. O SQL recusa tabelas novas com registros, vínculo de pessoa preenchido, definições divergentes e dependências posteriores, sem CASCADE. Linha nova somente com colunas antigas permanece.

**Retorno DDL não desfaz valores nem procedência gravados em tabelas antigas.** O ensaio demonstrou que `escrever_apenas_se_livre` pode retornar `gravado` sem criar divergência; a ausência de registros nas tabelas novas não prova que a função não foi usada. Não se simula restauração de dados ou status para facilitar o retorno.

## 4. Limites e próximo estado

Os efeitos SQL foram ensaiados com dados fictícios em PGlite/PostgreSQL 18.3; o QA utiliza PostgreSQL 17.11. A função de propriedade é a medida no QA, mas a identidade Auth é simulada na fixture. Vault/ledger e tabelas backend da bancada têm limitações declaradas; não são reprodução integral do ambiente. Os recibos reais de U1/U2 usados como fonte de metadados não são backup U3 do instante futuro.

Não houve prova de duas sessões independentes, concorrência real, Auth/HTTP, extração por provedor, n8n, Meta ou callbacks reais. Os locks novos não corrigem todos os escritores existentes. O helper antigo `registrar_procedencia` também permite extras com chaves reservadas na fonte medida; ele não é reescrito neste bloco. As novas RPCs constroem somente os extras controlados previstos, sem repassar um objeto arbitrário do chamador.

**Parada nesta preparação.** U3 continua não aplicada; backup e aplicação QA dependem de novo bloco autorizado. U4–U6 e aceite integral do schema/suíte permanecem pendentes. Esta entrega não libera push nem ativa um fluxo de cliente.
