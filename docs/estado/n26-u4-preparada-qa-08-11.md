# N26 — U4 preparada para o QA, sem aplicação — 08/11/2026

## 0. Resultado e parada

**Preparação local concluída; U4 não aplicada.** Victor autorizou distribuir a montagem, revisar e testar localmente, sem aplicar nada no banco e sem produção. O 01/02 montou o pacote, 07/08 revisou SQL e guardas, 05/06 revisou consumidores e autorizações. A Central revisou, pediu correções e executou a suíte final e verificações independentes.

Alvo proposto: `v2g-webapp-qa`, projeto `zskpijnqgkqwxksqmzmf`. U1/U2/U3 continuam no estado registrado em [U3 aplicada e verificada](./n26-u3-qa-aplicada-08-11.md), com 47 entradas de migration. Nenhuma DDL U4 foi enviada, nenhuma RPC de negócio foi chamada remotamente e nenhum backup real U4 foi capturado. Houve somente uma consulta indispensável de catálogo QA pelo montador para os pais adicionais; nenhuma linha real de cliente/Auth/Vault ou consulta SQL em produção.

O [pacote U4](../qa/reconciliacao-schema-07-11/u4/README.md) fica em subpasta própria. Contém **24 arquivos selados**, além do próprio SHA256SUMS. Os 73 arquivos selados das bases U1/U2/U3 original/revisão continuam intactos. Não houve alteração de runtime, .env, flags, serviços, conferidores, manifesto principal, páginas legais, configuração, commit, push ou deploy por esta preparação. Não se abriu U5/U6.

## 1. Escopo e contratos preservados

Grupos 12 e 14 da classificação original, dez ausências:

- Sete tabelas RevOps: `revops_people`, `revops_prospect_organizations`, `revops_opportunities`, `revops_opportunity_people`, `revops_source_references`, `revops_interactions` e `revops_interaction_opportunities`.
- Duas RPCs: `revops_register_interest` e `revops_register_interaction`, SECURITY INVOKER, search_path vazio e EXECUTE somente para owner/serviço.
- Tabela `creative_generation_requests`, com seus índices, checks, FKs, RLS e permissões por coluna.

Fontes: `20261007160925_revops_v0.sql`, `20261021001651_creative_generation_requests.sql` e somente o CHECK final da tabela nova em `20261026193000_referencia_publica_pedido_criativo.sql`. A definição final aceita V1 e V2 com referência pública numérica. Não se reaplica a migration inteira nem se altera `creative_review_requests/upload_intent`, que está fora da U4.

Os módulos são independentes. RevOps é o funil comercial global da V2G, com serviço CRUD e sem acesso direto de clientes/anon. A autorização nominal assinada `app_metadata.autorizacoes` contendo `revops` continua sendo conferida pela aplicação antes do cliente administrativo. O papel genérico de operador e `user_metadata` não bastam. As RPCs confiam no serviço e recebem o ator como FK de profile; não se afirma que validam JWT nominal dentro do SQL.

Pedido criativo permanece uma intenção imutável em `awaiting_configuration`, sem autorizar gasto, geração ou publicação. O cliente autenticado tem SELECT e INSERT apenas nas cinco colunas previstas, sob RLS do próprio negócio e autoria; estado/data são defaults, sem UPDATE/DELETE. O serviço tem **somente SELECT** para inspeção/OpenAPI/leitura, sem INSERT/UPDATE/DELETE/TRUNCATE/MAINTAIN ou grant option. PUBLIC/anon não têm acesso. Nenhum worker, provedor ou fila foi habilitado.

## 2. Correções necessárias na preparação

A revisão inicial identificou uma extração LF/CRLF que retirava o CHECK do payload sem repor o substituto. O preparador agora normaliza as quebras de linha e exige extração válida. A prova não fica limitada a um modelo produzido pelo mesmo gerador: os ensaios consultam a constraint e executam INSERTs inválidos que precisam falhar, incluindo objeto vazio, versão inválida e referência URL/tipo incorreto.

A guarda foi fortalecida para comparar todos os **47 pares version/name** do PÓS U3 aprovado, em vez de apenas contagem e presença da versão U3. Troca de nome ou versão antiga preservando a contagem é recusada antes do DDL.

A revisão final encontrou ainda uma expressão de ordenação corrompida pelo canonicalizador quando recebia um alias não reconhecido. A correção ficou restrita ao gerador U4, usando alias suportado e uma asserção contra chaves JSON corrompidas; o canonicalizador U3 selado não foi editado. A expressão SQL efetivamente gerada foi executada com os 47 pares invertidos e com conteúdo alterado: ordena o primeiro caso e distingue a adulteração. A Central repetiu essa prova em script independente.

Essas correções não foram aplicadas a nenhum banco remoto. O pacote final foi relido e ensaiado depois delas; a revisão SQL independente encerrou sem outro impeditivo no recorte examinado.

## 3. Evidência local da Central

Comando final: `node docs/qa/reconciliacao-schema-07-11/u4/executar-local.mjs`. Resultado: **`ok=true`, 38 cenários aprovados, `remoteDDL=false`**. Os 25 arquivos finais do diretório, incluindo o manifesto de hashes, permaneceram byte a byte iguais durante essa execução. Os 24 selos da unidade foram conferidos.

Cobertura: guardas e recibos SQL/JS; aplicação/retorno em transação local; histórico 47 → 48 → 49; canal registrando sua entrada antes ou depois do corpo; autorização nominal RevOps; idempotência e preservação da fonte inicial; ausência de fusão por nome/e-mail/telefone; mesma interação ligada explicitamente a duas oportunidades; recusa de pagamento/campanha manuais pelas RPCs; atomicidade diante de falha tardia; transcrição e revisão de inferência; RLS e grants por papel/coluna; estado/data imutáveis; payload V1/V2; request key e replay alterado/cross-business; flags no contrato real; drift de pais/helpers/defaults/ACL/histórico; retorno com dados ou dependências posteriores; preservação das bases e dos consumidores.

A Central também executou um ensaio próprio no SQL final: autorização nominal com a função pura real; colunas extras legítimas em backend/commercial_order_units e dado preservado; comparador e histórico; pessoas distintas apesar do mesmo contato; N:N sem duplicar evento; primeira fonte intacta; fatos financeiros recusados pelas RPCs; CHECK e RLS de pedidos; serviço SELECT-only positivo e DML negado; retorno recusado com dados, sem mudar metadados. **Passou.** Um segundo controle independente executou a expressão real de ordenação com histórico invertido. O primeiro recorte desse script precisava de ajuste textual, feito antes da execução SQL; não foi contado como prova aprovada.

O 05/06 reportou 37 testes locais de consumidores e cinco cenários negativos da página/actions RevOps sem abrir cliente administrativo. Isso é evidência complementar, não soma aos 38 cenários finais do pacote. A Central verificou novamente a base U3: **23 cenários locais aprovados** e 73 hashes anteriores íntegros. Os hashes dos consumidores/runtime são registrados antes/depois pelo ensaio U4. O aviso do Node sobre importação TypeScript não motivou alteração de package.json.

Os testes usam PGlite/PostgreSQL embarcado e dados fictícios. Auth usa UID simulado e funções puras; a fixture de auth.users contém somente UUIDs fictícios. O histórico local usa pares de metadados aprovados, sem tocar no ledger remoto. Não foi instalado serviço/dependência, feito build/.next ou repetida a suíte global.

## 4. Aplicação futura e retorno

O baseline é o PÓS privado real U3, versão `20261108113154`, SHA-256 de origem `ef17e97e2f7ec7b6c96b2de78ee47bacb570ee9515648c7c3fef4c8a3be8a574`. Ele fornece metadados, não substitui a captura privada do instante de uma aplicação futura. Pais medidos/reconstruídos e funções antigas são comparados explicitamente; tabelas backend/commercial_order_units mínimas da fixture não são congeladas como se fossem todo o schema QA. Todos os metadados capturados fora do delta continuam comparados PRE/PÓS, inclusive esses objetos.

O pacote contém guarda anterior em transação somente leitura (`u4-conferir-pre.sql`), PRE/PÓS com um SELECT/uma linha/recibo JSON, aplicação em um único DO sem BEGIN/COMMIT externos, verificação somente leitura, comparador, retorno condicionado e procedimento de backup privado. Canal futuro: `apply_migration`, nome `qa_reconciliacao_u4_revops_pedido_criativo_20261108`.

SQLs finais revisados e ensaiados (SHA-256):

- `u4-aplicar.sql`: `cde70199474f592b5be186f0894d71d2875bf8e6d0da0436f2bf0f0721e8b57b`.
- `u4-retornar.sql`: `0fe4992fe422b407b7de734ce334f641a4fae924833ba080c8a4b75e58abc742`.

Uma aplicação futura exige autorização nominal, conferência do alvo/hashes e backup privado atual antes da escrita. Deve preservar os 47 pares anteriores e acrescentar somente uma entrada U4 (48). Retorno após commit exige autorização própria, novo backup, oito tabelas novas vazias e delta exato; registro, índice, CHECK, view ou FK posterior impede a remoção. Não se apagam dados ou dependências para forçar a guarda, não se usa CASCADE e não se repara histórico. Retorno aceito acrescentaria só sua entrada nominal (49), sem restaurar dados ou desfazer efeitos externos.

## 5. Limites e parada

Idempotência RevOps segue a fonte original: primeira referência vence; replay divergente devolve IDs existentes e ignora os novos dados sem sobrescrever. Não há detecção/resolução automática de conflito. N:N entre oportunidades é explícita e intencional. Prova de vínculo não nula ainda aceita texto vazio; FKs asseguram existência, não coerência entre pedido, negócio e lead. Esses limites foram medidos e não são apresentados como venda, identidade ou autorização financeira verificadas. Serviço CRUD privilegiado não é uma trilha de auditoria imutável; a recusa de pagamento/campanha vale para as RPCs manuais, não para toda escrita administrativa possível.

O CHECK criativo valida formato, tipos, versão, referência numérica e tamanho; não recalcula SHA nem valida calendário/prazo ou catálogo externo. O contrato TypeScript real faz validações adicionais, mas um cliente SQL direto pode fornecer data impossível ou hash divergente com formato válido. Isso foi demonstrado. Um ID público não autoriza copiar imagem nem acionar geração.

Flags/autorização remotas não foram lidas ou alteradas. Os testes com flag OFF não comprovam o valor de configuração de um deployment. Não houve homologação HTTP/JWT real, agência, concorrência multissessão, importação de conversas, Storage, geração, cobrança ou Meta. Preparar a estrutura não ativa esses fluxos.

**Parada nesta preparação.** U4 continua não aplicada. Backup e aplicação QA exigem outro bloco autorizado; U5/U6 ficam fora deste trabalho. O push informado por Victor anteriormente permanece apenas como relato; esta preparação não verificou commit/remoto/deploy nem executou novo push.
