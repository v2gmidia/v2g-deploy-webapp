# N26 — U1 aplicada e verificada somente no QA — 07/11/2026

## 0. Resultado e parada

**U1 aplicada e verificada. Parada antes da U2.** Victor autorizou nominalmente o backup privado de metadados, aplicação somente da U1 no QA, conferência e registro, sem produção. Não houve autorização nem execução de outra unidade, retorno, configuração, cobrança, chamada Meta, commit, push ou deploy.

- Projeto confirmado pelo inventário conectado: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, PostgreSQL 17.11.
- Ferramenta DDL: `apply_migration`, uma única tentativa confirmada com `success=true`.
- Nome: `qa_reconciliacao_u1_meta_reconexao_20261107`.
- Versão atribuída pelo servidor: **`20261108001903`** (UTC de 08/11; data local da aplicação ainda é 07/11).
- Conferência encerrada em **2026-11-07 21:19:53 -03:00**; UTC: 2026-11-08 00:19:53 UTC.
- SQL aprovado: `u1-aplicar.sql`, SHA-256 **`69f0a910463d79f3c8d5a84e56e89c4a813fc1c0f68fec1990fa3e62e64ef25f`**.

Os 12 arquivos do [pacote revisado](../qa/reconciliacao-schema-07-11/README.md) foram comparados ao manifesto e aos hashes aprovados antes do ato. O pacote preparado permanece intacto como fonte histórica; o status realizado está neste checkpoint e nos recibos privados.

## 1. Backup real, privado e conferido antes da escrita

Diretório fora do repositório: `C:\Users\victo\.codex\private-backups\v2g\qa-schema\U1-20261108T001530Z`.

A pasta teve herança de permissões removida; acesso concedido somente à conta local de Victor e SYSTEM. Os arquivos herdaram essas duas permissões, conferidas pelos SIDs. Não se copiaram .env, chaves, tokens, Auth, Vault nem registros de clientes.

- `pre.json`: recibo único de metadados; SHA-256 `38c480fb494529b44651607058649e25a078c5d00ff7e24451096aa45d61a2f2`.
- `approval-and-source.json`: autorização, projeto, horário e hashes aprovados.
- `queries-approved.json`: conteúdo exato e hashes dos SQLs aprovados/comparador.
- `backup-hashes-before.json`: confirmação do backup antes da aplicação.
- `post.json`: recibo posterior; SHA-256 `c6e80cbb93a6fbc92369acc7639d367efee39db4dd47bd67de67c349a0128b86`.
- `execution-audit.json`: resultado da ferramenta, verificação SQL, comparação e hashes. SHA-256 `8f3ad5b6ba1576bdeb96bd785451d1e506fe86c3d601ec7137713fcf3d3b5d80`.

Os três arquivos iniciais foram lidos de volta e comparados integralmente ao conteúdo capturado antes da aplicação. Os hashes do backup anterior permaneceram iguais após o ato. O PRE provou alvo ausente, zero overloads em public/private, 11 relações protegidas e 44 entradas anteriores no histórico. Nenhum dump de linhas de aplicação era necessário ao delta DDL desta U1.

## 2. Aplicação e aceite medidos

Criada somente `public.marcar_conexao_meta_quebrada(uuid,text,text)`, com a definição do pacote; a função de negócio **não foi chamada**.

Após a resposta confirmada, `u1-verificar.sql` executou em leitura apenas e não acusou exceção. `u1-pos.sql` retornou um único recibo JSON. O comparador aprovado `conferirRecibos(pre,post,'apply')` foi executado localmente e retornou `ok=true`.

- Uma única função-alvo pública, retorno void, owner postgres, SECURITY DEFINER e search_path vazio; assinatura/corpo/atributos exatos conferidos.
- ACL direta: proprietário e service_role; PUBLIC, anon e authenticated sem EXECUTE; serviço sem grant option indevida.
- Metadados das 11 relações protegidas, RLS/policies, permissões, defaults globais e demais campos do snapshot **iguais** ao PRE.
- As **44 entradas anteriores** de migration foram preservadas; total posterior **45**, com exatamente uma nova entrada nominal U1.
- Dados de aplicação não foram consultados nem alterados por este ato; não houve chamada à nova função, API Meta, provedor ou job.
- Nenhuma consulta SQL ou escrita em produção.

## 3. Limites e próximo estado

A verificação foi de metadados e do delta U1; não é homologação funcional de reconexão. Não houve nova contagem das demais ausências, execução da suíte integral ou liberação para push. As outras unidades U2–U6 permanecem não executadas e exigem seus pacotes/autorizações próprios.

Retorno pós-commit não foi executado e continua sujeito a autorização nominal separada. Não há retry, reparo de ledger ou restauração global automática. A Central parou neste ponto, conforme pedido de Victor.

