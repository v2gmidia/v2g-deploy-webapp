# N26 — U5 aplicada e verificada somente no QA — 08/11/2026

## 0. Resultado e parada

**U5 aplicada e verificada somente no QA. Parada antes da U6.** Victor autorizou nominalmente capturar o backup privado, aplicar somente a U5, conferir e registrar, sem produção.

- Alvo conectado confirmado: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, PostgreSQL 17.11.0.003.
- Uma única chamada `apply_migration`, resposta `success=true`; nenhuma repetição de DDL.
- Nome: `qa_reconciliacao_u5_documentos_acesso_historico_20261108`.
- Versão atribuída pelo servidor: **`20261109012806`**, em **08/11/2026 22:28:06 -03:00** / 09/11/2026 01:28:06 UTC.
- Conferência encerrada em **08/11/2026 22:28:22 -03:00** / 09/11/2026 01:28:22 UTC; auditoria e documentação fechadas depois.
- SQL aplicado: pacote U5 selado, SHA-256 **`9871d53564356e1f3a0613e1f204ae0539a439810af69fc00ebc91352ca0ac83`**.

Os **48 pares version/name anteriores foram preservados integralmente**, com somente uma nova entrada nominal U5: **49 no total**. O comparador aprovado confirmou o delta exato e os metadados capturados fora dele iguais. U1–U4 permaneceram preservadas. Os **127 hashes** dos arquivos selados U1–U5 foram conferidos antes e depois, sem alterações. A [preparação U5](./n26-u5-preparada-qa-08-11.md) e os pacotes/checkpoints históricos não foram reescritos.

Nenhuma consulta SQL ou escrita em produção. Não houve preparação/execução da U6, retorno, chamada remota de função de negócio, emissão/aceite/revogação de concessão, emissão fiscal, cobrança, Meta, alteração de runtime/flags/configuração/serviços, commit, push ou deploy neste ato. Os pushes anteriores informados por Victor permanecem relatos; este bloco não verificou commit/remoto/deploy.

## 1. Guarda anterior e fontes exatas

O inventário confirmou o alvo QA distinto dos demais projetos. `u5-conferir-pre.sql` passou em transação somente leitura antes de qualquer escrita. O PRE real confirmou a base de 48 pares aprovada no PÓS privado U4 e o estado anterior completo esperado para a U5, incluindo corpos/atributos/ACL, defaults de argumentos, índices, colunas geradas, comentários e vínculo/hash do handler Auth.

Não se regenerou o pacote, afrouxou a guarda ou alterou o banco para conseguir verde. A aplicação usou o arquivo integral aceito na [preparação](../qa/reconciliacao-schema-07-11/u5/README.md), cujo hash foi conferido também no texto efetivamente enviado ao canal. O SHA-256 do manifesto de 30 arquivos U5 é `0a6ec90565b695c1e9cf9b080da23ff5950f898939111244138db291e940267b`.

Foi feita ainda uma captura somente de catálogo das **cinco definições completas atuais** que seriam alteradas: quatro funções comerciais de registro e `private.handle_new_user()`. Corpo, owner, identidade e ACL foram relidos e comparados integralmente às definições medidas aceitas. Isso complementa os hashes de corpos do recibo e fornece fonte atual de restauração de DDL, sem copiar linhas de Auth ou de aplicação.

## 2. Backup privado real

Diretório fora do repositório: `C:\Users\victo\.codex\private-backups\v2g\qa-schema\U5-20261109T012526Z`.

A pasta foi criada com herança removida e acesso concedido somente ao usuário local de Victor e SYSTEM. A conferência final abrangeu pasta, subpastas e os **43 arquivos**. Não se copiaram .env, chave, token, senha, dado de cliente ou linha de Auth/Vault. É backup de metadados e fontes aprovadas, não backup integral de dados.

Arquivos principais:

- `pre.json`: recibo anterior real; SHA-256 `247648adc02ea5a1e0fcf92ef4eb64ea6bc9c87b94b197c3e14cdc27b7481668`.
- `pre-function-definitions.json`: cinco definições antigas atuais completas; SHA-256 `57955f76133fb8f546dc4617d2ebda314f4088f3feb0f55a04a8ba6006244139`.
- `pre-function-definitions-query.sql` e `pre-guard-result.json`: query de catálogo e resultado da guarda anterior.
- `approval-and-source.json`: autorização exata, alvo, horário, escopo e 127 hashes de origem.
- `approved-package/`: 30 arquivos U5 selados e `SHA256SUMS.txt`, copiados e conferidos por hash.
- `backup-hashes-before.json`: 36 arquivos privados anteriores à escrita, relidos e preservados integralmente depois.
- `apply-attempt.json`: registro prévio da única tentativa, com alvo, nome e hash do SQL.
- `post.json`: recibo posterior real; SHA-256 `bb77c660bdb8ede4ae13852a2d50a00be0939247412376597818aa3e26196a6e`.
- `comparison.json`: aceite do comparador com PRE/PÓS reais.
- `execution-audit.json`: resultado, versão, contagens, fontes, limites e hashes; SHA-256 `fdbc0d41ba86bf1469ba49ee7f8af6fe15214d65d53d5aa8b3b57a905fb408a2`.
- `security-advisors-qa.json`: relatório de segurança do QA preservado integralmente.
- `final-file-hashes.json`: 42 arquivos conferidos, excluindo o próprio manifesto; SHA-256 do manifesto `023a6d303b83b0d24ca101514a4ac28bcdcfc7fd759674234fc657c1295cd460`.

Todos os arquivos iniciais foram relidos e seus hashes conferidos antes da aplicação. O PRE foi comparado ao modelo anterior e ao histórico privado U4; funções/detalhes e pais protegidos coincidiam. Os cinco corpos atuais coincidiam com a origem aceita. Ao final, PRE e arquivos anteriores, cópias privadas do pacote e fontes seladas permaneceram iguais; PÓS, comparação, auditoria e relatório de segurança foram relidos e validados.

## 3. Delta aplicado e aceite real

Aplicado somente o delta U5 aprovado, em um único DO pelo canal de migrations, sem BEGIN/COMMIT externos e sem chamar funções de negócio:

- Quatro tabelas: `fiscal_obligations`, `commercial_manual_evidence`, `historical_contract_access` e `historical_contract_access_events`.
- Sete funções novas: `documento_contratante_valido`, `conferir_documento_contratante_gravado`, `registrar_evidencia_manual`, `revisar_evidencia_manual`, `emitir_acesso_contratado`, `aceitar_acesso_contratado` e `revogar_acesso_contratado`.
- Cinco funções existentes com corpo alterado conforme o patch restrito: `private.handle_new_user` e as quatro variantes de registro comercial enumeradas no manifesto.
- Três colunas em tabelas existentes: `fiscal_documents.obligation_id`, `commercial_orders.contractor_document_type` e `onboarding_meetings.contractor_document_type`; a coluna gerada da evidência nasce na tabela nova. Constraints, FKs, índices, triggers, comentários, RLS, policies e grants seguem o modelo aprovado.

`u5-verificar.sql` passou somente em leitura. `u5-pos.sql` retornou um recibo JSON, relido pelo hash acima. O comparador selado `conferirRecibos(pre,pos,'apply')`, executado localmente com os recibos reais, retornou **`ok=true`, `phase=apply`, `protectedBackend=9`**, com apenas a entrada U5 `20261109012806`.

O PÓS corresponde exatamente ao delta esperado e preserva todo o contexto capturado fora dele: pais/helpers, funções e detalhes protegidos U1–U4, defaults e demais atributos enumerados. As nove tabelas backend mantêm as proteções, incluindo serviço SELECT-only e ausência de privilégios públicos/MAINTAIN/grant options indevidos. O máximo da sequência de auditoria permaneceu texto exato `9223372036854775807`, sem arredondamento.

O ledger foi comparado pelos pares version/name, não pelos statements. Nenhuma entrada anterior foi removida/renomeada ou reparada manualmente. Não se usou replay de migrations históricas, db push ou DML para satisfazer a guarda.

Nenhum comando SELECT/INSERT/UPDATE/DELETE de linhas de aplicação foi emitido por este ato. A validação de CHECKs/índices e o cálculo de colunas STORED podem ler e derivar valores das linhas existentes internamente durante o DDL; isso não é apresentado como ausência de qualquer leitura interna do PostgreSQL ou como backup desses dados.

## 4. Advisor de segurança e limites preservados

O advisor foi consultado somente no QA. No escopo novo:

- Dois INFO de [RLS habilitada sem policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): `commercial_manual_evidence` e `historical_contract_access_events`. O fechamento a clientes/anon é deliberado no contrato; não se abriram policies para remover o aviso.
- Um WARN de [função SECURITY DEFINER executável por authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable): `aceitar_acesso_contratado(uuid)`. A concessão a authenticated é explícita no pacote revisado e exige ID de concessão, usuário/e-mail confirmados, destinatário, evidência e negócio compatíveis. Não foi invocada no QA por este ato.

O relatório completo registra 32 ocorrências do INFO, três avisos de definer anon, três de definer authenticated e um de proteção de senhas Auth. Os demais achados foram preservados sem correção fora da U5. Não se declara segurança global aprovada nem ausência de alertas.

O aceite real é de aplicação, metadados, permissões e preservação do contexto. Os 30 grupos da preparação continuam provas locais fictícias; não equivalem a JWT/HTTP/Auth real, cadastro, convite, concessão/aceite/revogação remotos, concorrência multissessão, emissão fiscal ou operação produtiva. Instalar a estrutura não comprova pagamento ou identidade: checksum é validação do número, competência não emite nota, evidência manual não concede acesso automaticamente.

A flag histórica controla o caminho da aplicação e **não revoga EXECUTE da RPC SQL autenticada**. Seu valor remoto não foi medido ou alterado. A nova função está instalada com o grant aprovado; não se afirma OFF universal do banco. Nenhuma concessão foi criada, aceita ou revogada por este ato.

Permanece a ressalva P2 pré-existente da página histórica que ignora erro de sessão, documentada na [revisão de consumidores](./n26-u5-consumidores-05-06-08-11.md). A action de aceite confere erro; a prova sintética anterior não demonstrou concessão. Correção e homologação desse percurso permanecem um bloco separado, sem alterar runtime para conseguir aceite do DDL.

O backup não restaura dados ou efeitos externos. Nenhum retorno foi executado. Retorno exige autorização própria, novo backup/avaliação atual e as condições do ATO, incluindo ausência de uso/CPF/duplicatas/dependências incompatíveis; não se apagam dados ou dependentes para forçá-lo.

## 5. Registro operacional e parada

A planilha mantém Visão geral para resultado/bloqueio/dono/próxima prova e Novembro — execução para evidência técnica. O fechamento registra U1–U5 aplicadas apenas no QA, com 49 entradas; U6 e aceite global permanecem pendentes. O piloto Dúú/Piligrin já vinculado continua acompanhado pelos seus próprios marcos, sem reexigir compra ou usar U6 como bloqueio universal.

O controle existente atualizou somente `Visão geral!A23` e `Novembro — execução!H2:L2`; reportou releitura dos seis textos, notas/formato preservados e 36 células vizinhas intactas. Os marcos do piloto foram preservados.

**Parada antes da U6.** Não houve sua preparação ou execução, suíte global, publicação ou homologação funcional nesta rodada. A aplicação U5 não certifica o percurso completo do cliente nem libera produção.
