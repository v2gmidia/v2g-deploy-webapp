# Etapa 01 — QA publicado e preparo integrado de 3DS

Data de referencia: 19/10/2026, America/Sao_Paulo. Execucao atravessou 20/10 UTC.

## 0. O que depende do Victor

1. Commit e push das novas alteracoes locais pelo GitHub Desktop. O push anterior, `4cb5c955`, ja foi usado na atualizacao autorizada do QA; ele NAO inclui este novo fluxo integrado.
2. Acompanhar no protocolo Asaas 1835325 a habilitacao de tokenizacao E 3DS em producao e enviar eventual documentacao pelo canal seguro do provedor. Nao confundir funcionamento no Sandbox com habilitacao da conta real.
3. Participar pessoalmente quando houver 2FA ou desafio do banco; nao enviar senha/codigo no chat.
4. Nova autorizacao especifica antes de ativar/testar este fluxo com novas cobrancas, mesmo ficticias, e outra antes de qualquer liberacao em producao. Nenhuma cobranca nova foi criada neste bloco.

## 1. Publicado e verificado no QA

- Autorizacao: atualizar somente `v2g-webapp-qa` com o commit `4cb5c9557a8efa012349fc29730f827d507c4c68`.
- Deployment READY: `dpl_BPr2XruXumQsrPVzvKoQSVxfciva`; alias fixo `https://v2g-webapp-qa.vercel.app`.
- O ambiente estavel desse projeto se chama `production` na Vercel, mas o projeto atualizado foi exclusivamente QA, nao o produto de producao.
- Consulta HTTP real do pagamento antigo devolveu `refunded`; pagina publica exibiu estorno integral sem liberar criacao de acesso.

## 2. Implementacao local, ainda nao publicada

- Mensal com 3DS: cobranca avulsa inicial -> webhook confirmado e conferencia canonica de cliente/valor/data/origem -> reserva atomica -> assinatura com token e primeiro vencimento no mes seguinte.
- Callback do navegador nunca comprova pagamento. Timeout de criacao nao libera nova tentativa de POST; a conciliacao procura assinatura existente e exige correspondencia exata.
- IP original do pagador fica em contexto privado separado por ate 24h de validade logica. Exclusao apos vinculo da assinatura e limpeza oportunista de expirados ao iniciar novo fluxo; nao ha cron de exclusao com horario garantido.
- Nao armazena token do cartao, numero completo nem CVV. Leitura do pagamento antigo estornado no Sandbox confirmou que o campo de token e consultavel, sem imprimir seu valor; isso nao comprova ainda o novo percurso avulso integrado.
- Corrigida a fronteira da action publica: o navegador nao pode fornecer o booleano interno que dispensa verificacao de seguranca. A implementacao foi movida para modulo `server-only`; o wrapper publico sempre exige verificacao.
- Gestor sinaliza primeiro pagamento aprovado com recorrencia ainda pendente; nao presume que pagamento inicial equivale a assinatura criada.
- Flags novas `V2G_CHECKOUT_3DS_SCHEMA_ENABLED` e `V2G_CHECKOUT_3DS_ENABLED` documentadas como false. Nenhuma configuracao remota foi ativada.
- A skill Impeccable orientou reforco dos estados e mensagens no formulario existente, preservando identidade/CSS; React best practices revisadas.

## 3. Migration aplicada exclusivamente no Supabase QA

- Projeto conferido: `zskpijnqgkqwxksqmzmf`.
- Backup de escopo comercial, fora do repositorio: `C:/Users/victo/v2g-backups/qa-3ds-before-20261019.json`. Nao e dump integral do banco. Contem 20 pedidos, 11 eventos de pagamento, 9 eventos comerciais e ledger de 29 migrations antes da alteracao.
- JSON relido e SHA256 verificado: `F8A380394541B68B1F26127250D0AB5BD87C97F1A9679EEF04430B2DC46B0A94`.
- Arquivo local `supabase/migrations/20261020021942_qa_cartao_mensal_3ds.sql`, gerado com CLI oficial. Nome remoto `qa_cartao_mensal_3ds`, versao do ledger `20261020023349` atribuida pelo conector; diferenca de timestamp registrada, nao ocultada.
- Adiciona tres colunas, constraints, contexto privado com RLS e duas RPCs restritas a service_role. Preserva RPCs legadas. Nenhuma chamada Asaas ocorre na migration.
- Verificacao real: anon/authenticated sem leitura do contexto e sem EXECUTE da reserva; service_role autorizado; contexto vazio; pedidos e eventos inalterados.
- Ensaio transacional no proprio QA passou para identidade, evento criado sem aprovacao, confirmacao, replay, vencimento seguinte, reserva unica e bloqueio apos estorno. ROLLBACK ao final; contagens finais 20/11/9 e zero contextos. Sem chamadas ao provedor.

## 4. Testes e limites

- `pnpm build`: PASS, compilacao/TypeScript e 43 paginas.
- `pnpm conferir:3ds`: 13 testes PASS.
- PostgreSQL isolado (PGlite): 15 verificacoes PASS, incluindo RLS/grants, reserva e estorno.
- Neste bloco tambem passaram seguranca checkout (5), estado publico (9), checkout API (7) e contratacao (4).
- Manifesto reparado: todos os 49 arquivos presentes e nenhuma entrada orfa.
- `pnpm conferir:migrations`: ainda FALHA em 17 migrations de outras areas (Meta/backend, RevOps e fiscal); a nova migration 3DS passou. Nao aplicar esse conjunto em massa para obter verde.
- Advisor: contexto sem policies e intencionalmente fechado aos usuarios. Permanecem alertas sobre RPCs publicas legadas e protecao de senhas vazadas desativada; nao houve alteracao de Auth fora da autorizacao. Referencias: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Nao declarar seguranca integral concluida.
- Sandbox nao reproduz desafio bancario real; renovacao anterior foi antecipada via token, nao calendario natural. Novo percurso 3DS ainda exige publicacao, ativacao controlada e ensaio proprio autorizado.

## 5. Sequencia tecnica restante

Depois do novo push: conferir commit, publicar somente QA com autorizacao, ativar flags somente apos schema conferido, ensaiar primeiro pagamento/recorrencia/timeout/limpeza com autorizacao financeira especifica. Habilitacao Asaas, desafio real, renovacao natural e liberacao de producao continuam portas separadas. Etapa 02 permanece adiada.
