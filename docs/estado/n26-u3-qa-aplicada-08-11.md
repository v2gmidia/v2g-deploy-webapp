# N26 — U3 aplicada e verificada somente no QA — 08/11/2026

## 0. Resultado e parada

**U3 aplicada e verificada no QA. Parada antes da U4.** Victor autorizou nominalmente capturar o backup privado, aplicar somente a U3, conferir e registrar, sem produção.

- Projeto conectado: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, PostgreSQL 17.11.0.003.
- Uma única chamada `apply_migration`, confirmada com `success=true`, sem retry de DDL.
- Nome: `qa_reconciliacao_u3_perfil_procedencia_20261108`.
- Versão atribuída pelo servidor: **`20261108113154`**, em 08/11/2026 às **08:31:54 -03:00**.
- Conferência encerrada em **08/11/2026 08:33:50 -03:00** / 11:33:50 UTC; registro documental concluído depois.
- SQL aplicado: revisão `u3-ordenacao-acl-08-11/u3-aplicar.sql`, SHA-256 **`aab8fbcd2f8b06226080209918a393755a8794eb79c24d2d6f8e2ea53352a32c`**.

Não houve execução ou preparação da U4, aplicação de outra unidade, retorno, chamada das RPCs de negócio, Meta, configuração, alteração de flags/serviços, commit, push ou deploy por este ato. Nenhuma consulta SQL ou escrita em produção.

U1 e U2 permanecem preservadas. Os 51 arquivos selados de U1/U2/U3 original continuam intactos; a revisão possui mais 22 arquivos selados. Os **73 hashes** foram conferidos antes e depois. A [preparação original](./n26-u3-preparada-qa-08-11.md) e seu pacote não foram reescritos. Victor informou anteriormente que fez o push; este ato não verificou commit/remoto/deploy, e a revisão local e este registro são posteriores àquele aviso.

## 1. Correção da comparação antes de qualquer DDL

A guarda inicial, executada em transação somente leitura, recusou o pacote antes de qualquer tentativa de migration. A comparação mostrou exclusivamente a ordem das entradas de EXECUTE do helper existente `set_atualizado_em`: QA apresentava anon/authenticated/postgres/PUBLIC/service_role; a bancada apresentava PUBLIC/anon/authenticated/postgres/service_role. Corpos, atributos e conjuntos de permissões eram iguais. Os 46 pares version/name também coincidiam integralmente com o PÓS U2 privado aceito.

Foi criada uma [revisão em pasta irmã](../qa/reconciliacao-schema-07-11/u3-ordenacao-acl-08-11/README.md), preservando o pacote original. A mudança impõe ordenação determinística `COLLATE "C"` às listas de metadados e canonicalização equivalente no comparador local. Não remove entradas, campos ou diferenças de privilégios; não altera grants nem o delta de negócio.

O 01/02 montou a revisão e o 07/08 a revisou independentemente em leitura. A Central confirmou que `delta.sql` é idêntico ao original e está integralmente contido no SQL aplicado; os corpos das duas RPCs permanecem iguais. A suíte completa da revisão passou na execução independente da Central: **23 cenários locais**, incluindo aceitação de ACL equivalente em outra ordem e recusa de grant adicional real. Não se alterou o banco para fazer a guarda passar.

A nova guarda somente leitura passou no QA antes da escrita. Um novo PRE com ordenação canônica foi capturado e validado; a captura inicial foi preservada como diagnóstico, sem ser sobrescrita. Essa revisão mecânica manteve a unidade nominal U3 autorizada, sem acrescentar objetos de negócio ou iniciar outra frente.

## 2. Backup privado real

Diretório fora do repositório: `C:\Users\victo\.codex\private-backups\v2g\qa-schema\U3-20261108T112125Z`.

Pasta criada com herança de permissões removida. Acesso concedido somente à conta local de Victor e SYSTEM, conferido pelos SIDs na pasta e em todos os arquivos/subpastas. Não se copiaram .env, chaves, tokens, dados de clientes ou linhas de Auth/Vault.

Arquivos principais:

- `pre.json`: captura inicial anterior à correção da ordenação, SHA-256 `12890bae4c46015026df21e5987a056534733ccbab893900a5e0b3e1355e777f`.
- `initial-order-diagnosis.json`, `initial-pre-guard-query.sql` e `initial-pre-guard-result.json`: evidência da recusa somente leitura, sem DDL.
- `initial-approved-package/`: cópia dos 21 arquivos originais e manifesto, conferida por hash.
- `approval-and-source.json`: autorização exata, alvo, horário e hashes originais.
- `pre-validado.json`: **PRE utilizado no ato**, SHA-256 `f22175a9401ca05044a6ca2156cdb33753014a52f5feaf70aa9c98f552223db9`.
- `pre-guard-validado.sql`, `revision-and-source.json` e `approved-package/`: guarda aprovada, motivo/escopo da revisão e cópia dos 22 arquivos revistos com manifesto, conferidos.
- `backup-hashes-before.json`: integridade registrada antes da aplicação.
- `apply-attempt.json`: registro prévio da única tentativa de DDL.
- `post.json`: recibo posterior, SHA-256 `ef17e97e2f7ec7b6c96b2de78ee47bacb570ee9515648c7c3fef4c8a3be8a574`.
- `comparison.json`: comparação aprovada dos recibos reais.
- `execution-audit.json`: resultados, contagens, limites e hashes; SHA-256 `d3907303018c400714c49aa035dec4d667a4d4622893d0286e12547565f73166`.
- `security-advisors-qa.json` e `final-file-hashes.json`: avisos do QA e inventário final de integridade.

As capturas inicial, PRE validado e PÓS foram relidas e seus hashes comparados aos conteúdos capturados. Autorização/revisão/auditoria foram relidas e comparadas integralmente. Antes e depois da escrita, os arquivos anteriores e as cópias privadas dos pacotes permaneceram iguais. Ao final, todos os 60 arquivos estavam sob a ACL privada esperada.

## 3. Aplicação e aceite real

Aplicado somente o delta U3 aprovado, em um DO pelo canal de migrations, sem BEGIN/COMMIT externos:

- Cinco tabelas: `pessoas_do_negocio`, `entrevistas`, `propostas_de_perfil`, `itens_da_proposta` e `divergencias_de_cadastro`.
- Coluna nullable `creatives.pessoa_id`, com FK composta por negócio e SET NULL apenas nessa coluna; CHECK e índice de suporte.
- Duas RPCs serviço-only: `aplicar_proposta(uuid,text)` e `escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid default null)`.
- RLS, policies por operação, ACL, checks, índices e trigger das novas tabelas conforme o modelo. A transcrição já nasce nullable. Os helpers existentes não foram redefinidos.

`u3-verificar.sql` passou somente em leitura. `u3-pos.sql` retornou uma linha/recibo JSON. O comparador aprovado da revisão, executado localmente com os recibos reais `pre-validado.json` e `post.json`, retornou **`ok=true`, `phase=apply`, `protectedBackend=9`**.

Os **46 pares version/name anteriores foram preservados integralmente**; total posterior **47**, com somente a nova entrada nominal U3. Não se inseriu, apagou ou reparou histórico manualmente. A cobertura do ledger é version/name, não statements.

O delta posterior corresponde exatamente às definições/atributos/ACL esperados. Os metadados das 20 relações anteriores, as funções U1/U2/helpers, defaults e demais campos capturados permaneceram iguais fora das adições enumeradas. As nove tabelas backend conservaram as proteções, incluindo serviço SELECT-only, recusa de MAINTAIN/grant options e ausência de acesso público. Nenhuma linha de aplicação foi consultada ou alterada por comandos de dados deste ato; a validação de CHECK pode ler linhas internamente.

O advisor de segurança foi consultado somente no QA. No escopo novo, o aviso [RLS sem policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), nível INFO, corresponde às tabelas administrativas deliberadamente fechadas ao público. Não se abriram policies para retirar o aviso. Outros achados foram apenas preservados no arquivo privado, sem correções fora desta unidade.

## 4. Limites e parada

O aceite real é de aplicação, metadados, permissões e preservação do contexto capturado. Não foram invocadas `aplicar_proposta` ou `escrever_apenas_se_livre` no QA, nem feita homologação funcional com cliente, Auth/HTTP, n8n, Meta, provedor ou concorrência real. Os 23 cenários da revisão continuam sendo provas locais fictícias.

Os limites funcionais documentados na preparação permanecem: concorrência global com escritores antigos não certificada; helper histórico de procedência preservado; retorno DDL não restaura valores ou procedência eventualmente gravados em tabelas antigas. Ausência de linhas novas não prova ausência de uso das RPCs. Nenhum retorno foi executado; retorno após commit exige autorização nominal própria e avaliação atual.

**Parada antes da U4.** U4–U6 e a conferência integral posterior do conjunto continuam pendentes. Não se executou a suíte global nem se certificou deployment ou ativação por este ato.
