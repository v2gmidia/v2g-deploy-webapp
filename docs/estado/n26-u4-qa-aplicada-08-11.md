# N26 — U4 aplicada e verificada somente no QA — 08/11/2026

## 0. Resultado e parada

**U4 aplicada e verificada no QA. Parada antes da U5.** Victor autorizou nominalmente capturar o backup privado, aplicar somente a U4, conferir e registrar, sem produção.

- Alvo confirmado: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, PostgreSQL 17.11.0.003.
- Uma única chamada `apply_migration`, resposta `success=true`, sem repetição de DDL.
- Nome: `qa_reconciliacao_u4_revops_pedido_criativo_20261108`.
- Versão do servidor: **`20261109000622`**, em **08/11/2026 21:06:22 -03:00** / 09/11/2026 00:06:22 UTC.
- Conferência encerrada em **08/11/2026 21:07:13 -03:00** / 09/11/2026 00:07:13 UTC; documentação concluída depois.
- SQL aprovado: `docs/qa/reconciliacao-schema-07-11/u4/u4-aplicar.sql`, SHA-256 **`cde70199474f592b5be186f0894d71d2875bf8e6d0da0436f2bf0f0721e8b57b`**.

Os **47 pares version/name anteriores foram preservados integralmente**, com uma única entrada nova U4: **48 no total**. U1–U3 e os metadados protegidos capturados permaneceram iguais fora do delta aprovado. Os **97 hashes selados** de U1/U2/U3 original/U3 revisão/U4 foram conferidos antes e depois, sem alteração. A [preparação U4](./n26-u4-preparada-qa-08-11.md), os documentos históricos e os pacotes selados não foram reescritos.

Nenhuma consulta SQL ou escrita em produção. Não houve preparação/execução da U5/U6, retorno, chamada das RPCs de negócio, dados de cliente, configuração de serviços/flags, ativação de módulos, geração, cobrança, Meta, commit, push ou deploy por este ato. Os pushes informados anteriormente por Victor permanecem como relatos; commit/remoto/deploy não foram verificados neste bloco.

## 1. Guarda e backup privado anterior à escrita

O inventário confirmou o projeto QA. `u4-conferir-pre.sql`, em transação somente leitura, passou antes de qualquer DDL. O recibo PRE confirmou a ausência do delta U4, o contexto medido esperado e os mesmos 47 pares version/name do PÓS privado U3 aceito. Não se alterou o banco para fazer a guarda passar.

Backup fora do repositório: `C:\Users\victo\.codex\private-backups\v2g\qa-schema\U4-20261109T000232Z`.

A pasta foi criada com herança removida e acesso somente ao usuário local de Victor e SYSTEM. A conferência final abrangeu a pasta, subpastas e os **34 arquivos**. O conteúdo é de metadados de catálogo e evidência do ato; não inclui .env, segredo, token ou linhas de clientes/Auth/Vault. Não é um backup integral dos dados.

Arquivos principais:

- `pre.json`: captura anterior real; SHA-256 `f8c2a7a2b9c5edb5c1636900d278f3e686754f4203c031fca47e0d1e5865f187`.
- `approval-and-source.json`: autorização exata, alvo, escopo e os 97 hashes de origem.
- `approved-package/`: cópia dos 24 arquivos U4 selados e `SHA256SUMS.txt`, relidos e conferidos contra a origem.
- `backup-hashes-before.json`: hashes dos arquivos privados anteriores à escrita; permaneceram iguais após ela.
- `apply-attempt.json`: registro prévio da tentativa única, alvo, nome e hash do SQL.
- `post.json`: recibo posterior real; SHA-256 `4e4f3cdf596b417ea637a85478a91f30922009d06b5ddfd294411e77bfd03dab`.
- `comparison.json`: aceite do comparador aprovado com os recibos reais.
- `execution-audit.json`: resultado, versão, contagens, hashes e limites; SHA-256 `2645a621d3d5ea6041bdfb9e20f106f3467797a7e333e6f49bd0257a488801ff`.
- `security-advisors-qa.json`: avisos de segurança consultados somente no QA.
- `final-file-hashes.json`: 33 arquivos conferidos por hash, excluindo o próprio manifesto; SHA-256 do manifesto `994b0a8143df74f789c0884bbc37ac6044464d69c52555edd3f42434a1cf3611`.

PRE e PÓS foram relidos e seus hashes comparados com os conteúdos capturados. Autorização, comparação, auditoria e avisos foram relidos e comparados integralmente. Nenhum arquivo privado anterior foi sobrescrito.

## 2. Delta aplicado e aceite real

Aplicado o SQL selado em um único DO, pelo canal de migrations, sem BEGIN/COMMIT externos:

- Sete tabelas RevOps: `revops_people`, `revops_prospect_organizations`, `revops_opportunities`, `revops_opportunity_people`, `revops_source_references`, `revops_interactions` e `revops_interaction_opportunities`.
- Duas RPCs: `revops_register_interest` e `revops_register_interaction`, SECURITY INVOKER, search_path vazio e EXECUTE somente para owner/serviço.
- Tabela `creative_generation_requests`, com o CHECK final V1/V2, referências públicas numéricas, constraints, índices, RLS e grants mínimos aprovados.

São **oito tabelas e duas RPCs**. As sete tabelas RevOps permanecem fechadas a clientes/anon, com serviço CRUD. A autorização nominal assinada `app_metadata.autorizacoes` contendo `revops`, conferida pela aplicação, foi preservada; não foi substituída pelo papel genérico de operador. Pedido criativo mantém SELECT e INSERT autenticados apenas nas cinco colunas previstas e sob RLS de negócio/autoria; serviço somente SELECT, sem DML, MAINTAIN ou grant option. Estado/data permanecem defaults imutáveis. Não se alteraram `creative_review_requests/upload_intent`.

`u4-verificar.sql` passou somente em leitura. `u4-pos.sql` retornou um recibo JSON. O comparador aprovado `comparar-recibos.mjs`, executado localmente com PRE/PÓS reais, retornou **`ok=true`, `phase=apply`, `protectedBackend=9`** e a única entrada nominal U4 com a versão acima.

O delta posterior coincide com o modelo aprovado. A comparação preserva todo o contexto capturado fora dele, incluindo pais adicionais, helpers, funções U1–U3 e defaults/ACL anteriores. As nove tabelas backend mantêm RLS, ausência de acesso público, serviço SELECT-only e recusa de MAINTAIN/grant options. Não se reparou ou manipulou histórico; a prova do ledger cobre version/name, não statements.

O advisor de segurança foi consultado no QA. No escopo novo, sete avisos INFO de [RLS sem policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) correspondem às tabelas RevOps deliberadamente fechadas por padrão. Não se criaram policies para retirar o aviso. O relatório completo registra 30 ocorrências desse INFO e avisos de funções/serviço Auth fora da U4, com seus links de remediação; não houve correção fora da unidade nem declaração de segurança global aprovada. As duas novas RPCs não são SECURITY DEFINER públicas.

## 3. Limites e parada

O aceite real é de aplicação, metadados, permissões e preservação do contexto capturado. As RPCs de negócio não foram chamadas remotamente. Não houve homologação funcional HTTP/JWT, concorrência multissessão, ingestão de conversas, Storage, geração, provedor, cobrança ou Meta. Os **38 cenários da preparação continuam sendo provas locais fictícias**, documentadas na preparação; não foram apresentados como execução funcional real no QA.

Permanecem os limites medidos: replay RevOps divergente preserva a primeira fonte e devolve IDs anteriores sem resolver conflito; vínculo N:N explícito; FKs provam existência, não coerência financeira/comercial; prova textual aceita vazio. O CHECK criativo valida formato/tipos, não recalcula hash nem verifica calendário ou prazo real. Nenhum módulo, flag, worker ou provedor foi ativado, e os valores remotos das flags não foram certificados.

O backup é de metadados; retorno DDL não restaura dados nem efeitos externos. Nenhum retorno foi executado. Qualquer retorno exige autorização nominal própria e avaliação atual, conforme o pacote selado.

O controle existente atualizou somente `Novembro — execução!H2:L2`, linha N26-01, na [planilha central](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit). Reportou releitura dos cinco textos e formatos preservados: U1–U4 aplicadas somente no QA, limite de metadados separado da homologação funcional e relatos anteriores de push preservados.

**Parada antes da U5.** U5/U6 e a conferência integral posterior do conjunto permanecem pendentes. Não se iniciou sua preparação, não se executou suíte global e não se certificou deployment/produção neste ato.
