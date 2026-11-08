# N26 — U2 aplicada e verificada somente no QA — 07/11/2026

## 0. Resultado e parada

**U2 aplicada e verificada no QA. Parada antes da U3.** Victor autorizou nominalmente capturar o backup privado, aplicar somente a U2, conferir e registrar, sem produção.

- Projeto conectado: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, PostgreSQL 17.11.0.003.
- Uma chamada `apply_migration`, resultado confirmado `success=true`, sem retry.
- Nome: `qa_reconciliacao_u2_operacional_meta_20261107`.
- Versão atribuída pelo servidor: **`20261108005549`** (2026-11-07 21:55:49 -03:00).
- Conferência encerrada em **2026-11-07 21:57:35 -03:00** / 2026-11-08 00:57:35 UTC; registro documental concluído depois.
- SQL aplicado: `u2-aplicar.sql`, SHA-256 **`829d1ddd96f9159d70d8f5c8430bf2ce360eedc6aaff4bf180143294605dc7a9`**.

Não houve aplicação de U3–U6, retorno, callback de negócio, Meta, cobrança, alteração de serviços/flags, commit, push ou deploy. Nenhuma consulta SQL ou escrita em produção.

Os 18 arquivos selados da U2 e os 12 da U1 foram conferidos antes e depois: todos iguais aos hashes aprovados. O [pacote U2](../qa/reconciliacao-schema-07-11/u2/README.md) permanece como fonte histórica preparada; o estado realizado é este checkpoint. A [preparação e os testes locais](./n26-u2-preparada-qa-07-11.md) não foram reescritos.

## 1. Backup privado anterior à escrita

Diretório fora do repositório: `C:\Users\victo\.codex\private-backups\v2g\qa-schema\U2-20261108T005443Z`.

A pasta foi criada com herança de permissões removida e acesso exclusivo à conta local de Victor e SYSTEM. ACL da pasta e de todos os arquivos conferida pelos SIDs. Não foram copiados .env, chaves, tokens, linhas de Vault/Auth ou dados de clientes.

- `pre.json`: recibo único anterior de metadados, SHA-256 `749136b90d50787396bf291bb50413536e312dddae92ecd5bd58028d2fb9830d`.
- `approval-and-source.json`: autorização exata, projeto, data e hashes; SHA-256 `9f3f15d4cbf39e53858b12fba065ba6ac695c5dc046841b0e902548863a8b38e`.
- `queries-approved.json`: conteúdo exato dos SQLs/manifestos aceitos; SHA-256 `454aad0b16a247e3bc14971963cfca5d5a9463c59ee4ba8308563105382b2bf0`.
- `backup-hashes-before.json`: hashes e permissões conferidos antes da aplicação.
- `pre-guard-query.sql`: guardas derivadas do SQL aprovado, executadas em transação somente leitura, sem locks/advisory/DDL; passaram antes do ato.
- `apply-attempt.json`: registro prévio da única tentativa.
- `post.json`: recibo posterior, SHA-256 `1015348fa9b053457375ab22e623205417b4f620ba30dafc55e81f3b347766a1`.
- `execution-audit.json`: tentativa, resultados das ferramentas, comparação, contagens, limites e hashes; SHA-256 `064108e7193e4ac5a63218eb3fa1b01095a71ab2478912a8cd62a35c58191d44`.
- `security-advisors-qa.json`: avisos de segurança somente do QA, SHA-256 `43c51bf5b08f17b9d267eff4e77d645a20c43c9d444ad17d916cce6b0b845b1f`.

Os três arquivos iniciais foram relidos e comparados integralmente ao conteúdo capturado antes da escrita. Seus hashes permaneceram iguais depois. O PÓS foi lido pelo comparador aprovado; o arquivo de auditoria também foi relido e comparado. ACL privada confirmada ao final.

O PRE comprovou 45 pares version/name no histórico, U1 exata, 17 relações existentes protegidas e delta U2 ausente. As guardas prévias confirmaram definições, ACL/RLS, grafo de FKs, U1 e acesso do owner ao Vault. Não se usou o backup da preparação como se fosse captura atual.

## 2. Delta aplicado e aceite real

Aplicado o SQL integral aprovado em um único DO, pelo canal de migrations, sem BEGIN/COMMIT externos e sem executar corpos de negócio:

- **13 colunas**, uma tabela `public.exclusoes_de_dados` e três funções: `desautorizar_meta(text)`, `apagar_dados_da_meta(text)` e `status_da_exclusao(text)`.
- **8 CHECKs e 6 índices** de suporte, explicitamente enumerados no pacote.
- Nova tabela com RLS, sem acesso direto de PUBLIC/anon/authenticated; serviço com SELECT e INSERT/UPDATE limitados às colunas previstas, sem DELETE.
- Mutações com EXECUTE restrito ao owner/serviço; status público com a projeção tipada aprovada das seis chaves de contagens, sem JSON administrativo bruto ou identificadores.

`u2-verificar.sql` passou em somente leitura. `u2-pos.sql` devolveu uma linha/recibo JSON. O comparador local aprovado `conferirRecibos(pre,post,'apply')`, usando esses recibos reais, retornou **`ok=true`**.

As 45 entradas anteriores do histórico foram preservadas integralmente nos campos capturados; total posterior **46**, com exatamente a nova entrada nominal U2. Não houve reparo ou inserção manual no ledger. A cobertura do histórico é version/name, não o campo statements.

Definições/atributos/ACL do delta correspondem ao modelo aprovado. Metadados das 17 relações anteriores, U1, defaults e demais campos capturados permaneceram iguais fora das adições enumeradas. As nove tabelas portuguesas do backend mantiveram suas proteções, inclusive SELECT-only do serviço e recusa de MAINTAIN/grant options. Não foram feitas consultas a linhas de aplicação nem alterações de dados; a validação dos CHECKs pode ler linhas internamente.

## 3. Avisos de segurança conferidos

O advisor do QA foi consultado após a aplicação. No escopo novo, os avisos correspondem às escolhas explícitas do pacote:

- [RLS sem policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): tabela nova destinada ao serviço; público sem acesso direto. Não se criaram policies públicas para remover o aviso.
- [SECURITY DEFINER executável por anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) e [authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable): referem-se ao status consultável por código, com saída restrita, conforme ACL aprovada. As funções mutadoras não ganharam esses grants.

Os demais avisos foram preservados no recibo privado, fora desta unidade; não houve mudança de Auth, schema adicional ou ampliação da auditoria para corrigi-los. Isso não certifica segurança global do projeto.

## 4. Limites e próximo estado

Esta conferência real é de aplicação e metadados. Não invocou as funções mutadoras nem simulou solicitação real de exclusão/desautorização; não certifica rota HTTP, assinatura Meta, dados reais, Vault criptográfico ou homologação de ponta a ponta. A execução local da preparação continua identificada como fictícia.

Retorno após commit exige autorização nominal separada. O retorno de DDL não restaura tokens, status ou dados eventualmente alterados por callbacks; desautorização isolada não cria o marcador de solicitação de exclusão. Nenhum retorno foi feito.

**Parada antes da U3.** U3–U6 continuam pendentes. Não houve nova execução da suíte global nem liberação do push. O próximo bloco exige proposta e autorização próprias.
