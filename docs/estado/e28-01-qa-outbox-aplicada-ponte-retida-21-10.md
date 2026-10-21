# E28-01 — aplicacao QA parcial, ponte assistida retida

Data: 21/10/2026, America/Sao_Paulo. Victor autorizou aplicar novas migrations desta frente individualmente no QA apos backup e pediu aviso antes da segunda etapa (commit/push/publicacao/configuracao). **Uma aplicada; ponte assistida nao aplicada. Nao sinalizar liberacao integral para o proximo passo.**

## Identidade, backup e limites

- Projeto confirmado pelo conector: `v2g-webapp-qa`, ID `zskpijnqgkqwxksqmzmf`, ACTIVE_HEALTHY, Postgres 17.11. Nao acessado projeto de producao.
- Snapshot comercial consistente obtido em uma unica consulta SELECT e salvo fora do repositorio em `C:/Users/victo/v2g-backups/qa-commercial-before-email-20261021.json`. JSON relido, identidade/contagens verificadas e SHA-256 **5B54B4257C0CCED4B2202916FEB7C2AA4244FF21A54CC6262452149D77B7E7C3**.
- Escopo: oito tabelas comerciais, suas colunas/defaults/constraints/RLS/ACL, indices/policies/grants, cinco definicoes de RPCs existentes e ledger anterior (31 entradas). Dados: 20 pedidos, 18 unidades, 9 eventos comerciais, 11 eventos financeiros; leads, contratos, documentos fiscais e contexto 3DS vazios. Nao e backup integral de Auth/Storage/projeto e nao foi realizado restore global; nenhuma senha/chave/tabela auth.users foi exportada.
- 3DS existente conferido, inclusive versao remota `20261020023349`. Nao reaplicado. Migration de criativos ja constava do ledger por acao de outra frente; nao foi alterada neste bloco. Nao foi utilizado db push/lote.

## Aplicado e verificado

- Arquivo integral `supabase/migrations/20261021033313_commercial_payment_email_outbox.sql`; SHA-256 **D2D202C725A72F900E53FADF3F8F75C010AEB32C3CF148745C45C9FFD0B810D5**.
- Operacao individual `qa_commercial_payment_email_outbox`: success true. Ledger remoto: **20261021134245**. Diferenca de timestamp para o arquivo local e atribuicao do conector, nao indicio para reaplicar.
- Verificacao real: tabela com RLS; anon/authenticated sem SELECT/INSERT/UPDATE/DELETE/TRUNCATE; service_role somente SELECT/INSERT/UPDATE, sem DELETE/TRUNCATE.
- Ensaio transacional no QA: unicidade pedido/cobranca, accepted sem ID recusado, JSON array recusado, primeira reserva obtida e segunda negada, aceite com ID de fixture. **ROLLBACK ao final**; tabela vazia, sem email, webhook ou chamada Asaas.
- Digests MD5 dos dados ordenados de pedidos, eventos e eventos financeiros permaneceram identicos antes/depois: `508f02fc29d9edd04d0dbc010ee87e3b`, `d50a53d5fe76a98675a40bdcb670a7c4`, `5244f677b623c55d66aa6fba99e38cd0`.
- Evidencia compacta privada: `C:/Users/victo/v2g-backups/qa-commercial-after-email-20261021-verification.json`.

## Impedimento comprovado — ponte assistida

- `20261021042254_assisted_asaas_orders.sql` **NAO aplicada**. Nenhuma coluna assisted_operator_id, indice ou RPC comercial nova foi instalada por este bloco.
- A RPC proposta usa SECURITY INVOKER e consulta `auth.users.id/raw_app_meta_data` para conferir papel atual. No QA, `has_schema_privilege(service_role,auth,USAGE)=true`, mas `has_column_privilege(...,id,SELECT)=false` e `(...,raw_app_meta_data,SELECT)=false`. Portanto, essa checagem falharia com o papel de execucao real do aplicativo.
- E uma dependencia de permissao nao comprovada no ensaio PGlite anterior, que executava como proprietario local. Registro explicito para nao confundir teste local com prontidao do role remoto.
- Nao ampliei grants de Auth, nao troquei para SECURITY DEFINER, nao removi a checagem de papel silenciosamente e nao apliquei uma funcao sabidamente sem permissao.
- Proximo recorte proposto depende de concordancia do Victor: ajustar a verificacao para a autenticacao de operador ja existente no servidor (`getUser` + app_metadata), mantendo RPC privada/service_role e escopo do ator/pedido, sem abrir leitura de Auth. Revisar a garantia de autorizacao e testar com role sem acesso a Auth antes de reapresentar/aplicar o arquivo ainda nao aplicado. Alternativa de novos grants no Auth exige decisao/revisao especifica; nao esta incluida automaticamente na autorizacao de migration.

## Advisors e proximo passo

Advisors antes/depois: mesmos avisos legados (duas funcoes inserir_lead_lp SECURITY DEFINER anonimas, claim_businesses autenticada e protecao de senhas vazadas desativada). INFO RLS-sem-policy passou de 8 para 9 pela outbox deliberadamente server-only, com grants de cliente revogados; nao abrir policy para eliminar aviso. Referencias oficiais: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funcoes publicas privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [senhas comprometidas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Nao e certificacao global de seguranca.

Nao publicado codigo, nao alteradas configuracoes/flags externas, nao enviado email/WhatsApp, nao criada cobranca, assinatura ou estorno; sem commit/push. Unica alteracao remota permanente: outbox e respectivo ledger, no QA. A segunda etapa deve aguardar resolucao/revisao da ponte e autorizacao correspondente; nao declarar todas as migrations concluidas.
