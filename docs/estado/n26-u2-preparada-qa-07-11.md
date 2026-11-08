# N26 — U2 preparada para o QA, sem aplicação — 07/11/2026

## 0. Resultado e parada

**Preparação local concluída; U2 não aplicada.** Victor autorizou distribuir a montagem, revisar e testar localmente, sem aplicar nada no banco e sem produção. O 01/02 montou o pacote; o 07/08 revisou as dependências e o SQL; a Central revisou, pediu as correções e executou os testes independentemente.

Alvo proposto: `v2g-webapp-qa`, projeto `zskpijnqgkqwxksqmzmf`. Nenhuma migration U2 foi enviada, nenhuma função de negócio foi chamada remotamente e não houve consulta ou escrita em produção. Houve somente leitura de metadados do QA para preparar a fixture. Não houve commit, push, deploy, configuração, cobrança ou chamada Meta.

O [pacote U2](../qa/reconciliacao-schema-07-11/u2/README.md) fica em subpasta própria. Os 12 arquivos selados da U1 permanecem byte a byte iguais aos hashes aprovados. O registro histórico de aplicação da U1 permanece em [n26-u1-qa-aplicada-07-11.md](./n26-u1-qa-aplicada-07-11.md).

## 1. Delta preparado

- Grupos 2, 6, 8, 9 e 10 da classificação de schema: **17 objetos ausentes** — 13 colunas, uma tabela e três funções. O pacote declara também oito CHECKs e seis índices de suporte; esses não são somados artificialmente às 17 ausências do conferidor.
- Fontes: `0008_publicar_campanha.sql`, `0018_disparo_do_pipeline.sql`, `0021_exclusao_de_dados_da_meta.sql`, `0022_whatsapp_do_anuncio.sql` e `0024_ativacao_de_campanha.sql`.
- Colunas e estados já existentes preservados, sem reexecutar migrations históricas inteiras. Nenhuma dependência direta dos dois corpos administrativos exige antecipar a U3.
- A nova tabela de solicitações de exclusão fica com RLS, sem acesso direto público, SELECT do serviço e INSERT/UPDATE restritos às colunas usadas pelo callback. As duas funções mutadoras permitem execução somente pelo serviço; o status público também permite anon/authenticated.

Há uma correção intencional em relação à fonte histórica: `status_da_exclusao` projeta somente as seis chaves de contagens consumidas pela página, com valores inteiros não negativos válidos. Campos extras, UUIDs, arrays, objetos e erro cru não saem na resposta. O resumo administrativo continua incluindo `negocios`, pois o callback o utiliza internamente. Nenhuma página legal ou callback de runtime foi editado neste bloco. A revisão da fonte histórica não comprova exposição em produção.

## 2. Evidência local executada pela Central

- `node --test docs/qa/reconciliacao-schema-07-11/u2/ensaio-u2.mjs`: **11/11 testes passaram**, zero falhas, 21,1 segundos na execução final.
- Verificações suplementares independentes: seis contagens incluindo zero; ACL de colunas; DELETE de serviço recusado; entradas vazias recusadas pelas duas funções; INSERT público recusado; U1 e ledger preservados — todas passaram.
- `node docs/qa/reconciliacao-schema-07-11/ensaio-u1.mjs`: **15/15 testes passaram**. Os 12 hashes selados foram conferidos separadamente e no harness da U2.
- Encerramento do pacote: **18/18 hashes U2 conferidos pela Central**; os 16 arquivos de SQL/modelo/fixture/harness testados permaneceram idênticos até o fechamento. A correção documental final sobre desautorização foi relida e não alterou SQL ou harness.

Os ensaios aplicam o SQL exato em PostgreSQL local via PGlite e exercitam os loops dos callbacks com conexões fictícias de dois negócios e um terceiro preservado. Cobrem compatibilidade de dados antigos, isolamento, campos próprios preservados, nove tabelas backend, ACL indevida/defaults, metadados divergentes, preservação do histórico e falhas atômicas.

A revisão encontrou a ausência de MAINTAIN na enumeração de privilégios proibidos herdada da guarda U1. A U2 foi corrigida para recusá-lo nos três papéis, além de opções de concessão do serviço. O harness passou nos casos negativos adicionados. A U1 selada não foi modificada.

O teste de conteúdo posterior foi corrigido para preencher uma única campanha, preservando o índice único de `publish_key`; antes, a fixture duplicava a chave e não alcançava a guarda de retorno.

## 3. Ato futuro e limites

O pacote contém PRE/PÓS com um SELECT, uma linha e um recibo JSON, aplicação em um único DO sem BEGIN/COMMIT externos, verificação somente leitura, retorno condicionado, comparador, manifesto e hashes.

SQLs exatos revisados e ensaiados pela Central (SHA-256):

- `u2-aplicar.sql`: `829d1ddd96f9159d70d8f5c8430bf2ce360eedc6aaff4bf180143294605dc7a9`.
- `u2-retornar.sql`: `e7668ec949002582fad3b8dad65cada9df2ad85d2e384c242f3584ff9c8e1320`.

Uma aplicação futura exige autorização nominal, confirmação do alvo conectado, conferência dos hashes e captura privada de metadados antes da escrita. O procedimento usa `apply_migration` uma vez e compara o recibo posterior: os 45 registros anteriores do ledger devem permanecer iguais, com exatamente uma nova entrada nominal. Isso foi ensaiado com histórico fictício; nenhum recibo real U2 foi capturado depois de uma aplicação, pois ela não ocorreu.

O retorno não restaura dados ou segredos apagados por callbacks. Ele deve recusar registros de exclusão, valores nas 13 colunas novas, alterações nas definições e dependências posteriores. Os ensaios incluíram índice e CHECK em coluna ainda nula, view e FK posteriores, sem CASCADE. Um retorno após commit exige autorização própria.

A desautorização isolada não cria registro em `exclusoes_de_dados`; não se pode usar ausência desse registro como prova de que nenhum callback foi executado. O retorno de DDL não recompõe o token apagado nem status revogados. O bloqueio por registro aplica-se à exclusão quando a solicitação foi persistida.

PGlite e dados fictícios não comprovam Vault criptográfico real, concorrência/volume do QA, execução HTTP, assinatura de callback, Meta real ou homologação de ponta a ponta. A função criptográfica do Vault e a identidade da fixture são substitutos locais. Nenhum dado de cliente ou valor de segredo foi lido para esses ensaios.

**Parada neste bloco.** U2 aguarda aplicação autorizada e conferência real no QA. U3–U6 continuam fora deste bloco. A preparação U2 não libera o push nem substitui o aceite integral do schema e da suíte.
