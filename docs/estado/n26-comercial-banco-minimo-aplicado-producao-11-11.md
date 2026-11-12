# Comercial: pacote mínimo aplicado e conferido em produção — 11/11/2026

## 0. Resultado e próximo passo

**Aplicado somente o pacote mínimo comercial em produção, com backup privado anterior e conferência concluída. Vendas e processamento de pagamentos continuam desligados.**

Projeto nominal: `ushccxpoxjikzqnwhgfd`, `V2G-SITE`, PostgreSQL `17.6.1.155`, ACTIVE_HEALTHY na conferência anterior. Migration única `commercial_minimum_production_20261111`, versão **`20261111150656`**, registrada às **12h06min56s de Brasília** em 11/11/2026. Histórico **42 → 43**, todas as 42 entradas anteriores preservadas.

Próxima frente comercial: conferir conta Asaas/3DS e recorrência, escopo do webhook, remetente de e-mail, Turnstile e retorno Auth; preparar/configurar somente com autorização própria e vendas/processamento ainda OFF. O ensaio financeiro nominal e a abertura pública continuam posteriores. Não repetir a aplicação deste pacote nem a compra Sandbox encerrada.

Resumo seguro, sem dados de clientes: [resultado da execução](../comercial/aplicacao-producao-11-11/resultado.json). O pacote original permanece selado em `docs/comercial/banco-minimo-local-11-11/`; seus arquivos históricos não foram reescritos para declarar a aplicação.

## 1. Autorização, revisão e pré-condições

Victor autorizou expressamente revisar, capturar backup privado e aplicar somente o pacote mínimo do banco comercial em produção, conferir dados e isolamento, mantendo vendas/pagamentos desligados. A autorização anterior de montagem local não foi usada como autorização de aplicação; este ato se apoia na mensagem nova.

- Integridade de **15 arquivos do pacote e 18 fontes** conferida antes do ato e novamente ao encerrar; sem divergência.
- Revisão do gerador, escopo de objetos, transação, pré/pós-condições, acesso restrito e retorno conservador. Não houve mudança do pacote aprovado ou inclusão de outra migration.
- **22/22 grupos locais** repetidos em PostgreSQL 17.5 embarcado, exit 0, para a revisão solicitada. Nenhum teste local foi apresentado como pagamento ou sessão produtiva.
- Pré-checagem produtiva somente leitura: `base_corresponde=true`, `pacote_ja_presente=false`. Projeto e ledger nominal conferidos. O projeto QA não recebeu chamadas de aplicação.
- Metadados Vercel relidos sem decriptar: zero variáveis produtivas ocultas; nomes comerciais Asaas/checkout/processamento/e-mail continuam ausentes. Nenhum valor de chave, token, senha ou `.env` foi lido ou impresso.

## 2. Backup privado anterior

Diretório fora do repositório:

`C:/Users/victo/.codex/private-backups/v2g/comercial-producao/20261111T150243Z`

Herança de permissões removida; acesso limitado ao usuário Victor e SYSTEM. ACL dos arquivos conferida. A cópia foi validada por releitura e SHA-256 antes da aplicação, inclusive a cópia privada integral do pacote selado.

Captura anterior às **12h04min21s BRT**, em transação repeatable read/read only, timezone UTC:

- Linhas completas do escopo afetado: **6 businesses, 0 commercial_orders, 0 commercial_order_units, 0 commercial_events**. Dados pessoais permaneceram apenas no backup privado; não foram exibidos nem gravados nos documentos do repositório.
- Definições/constraints/índices/policies/triggers/ACL do recorte comercial e fingerprints dos demais objetos públicos.
- Contagens e hashes de dados das 40 tabelas públicas anteriores. Colunas identificadas como token, senha, segredo ou credencial foram excluídas antes de calcular esses hashes; valores não foram retornados nem copiados.
- Ledger anterior, autorização/alvo, metadados seguros de configuração, avisos de segurança e SQL de captura.

`antes-dados-metadados.json`: **95.011 bytes**, SHA-256 `faa770bffb21a66be9780956aa32b6774be7539ebcf7ff3ed42561ebb9f5bbe5`.

É backup lógico do escopo afetado, não cópia integral do cluster, Auth, Vault ou credenciais. A primeira tentativa de gravar todo o conteúdo em uma única chamada excedeu o limite de tamanho da ferramenta; a gravação foi concluída em blocos, com comparação integral por hash. Nenhuma escrita no banco ocorreu antes de o backup estar salvo, íntegro e privado.

## 3. Aplicação única

Canal `apply_migration`, alvo produtivo explícito, nome nominal acima. SQL lido da cópia privada do arquivo `aplicar-local-revisavel.sql`; somente espaços externos removidos ao enviar. **Uma tentativa, retorno `success=true`**. Não foi utilizado `db push` ou executada a pasta de migrations.

Instalado o delta revisado: quatro tabelas de apoio, 13 colunas em `commercial_orders`, constraints de documento/período/total e checagens/unicidades, dez funções incluindo helper documental e um trigger. Sem DML de migração em negócios/pedidos. Funções financeiras foram instaladas, não chamadas para gerar ou aprovar operação.

Retorno conservador não executado. Não houve motivo para reverter: estado e dados conferiram. O arquivo de retorno continua recusando uso dos novos campos/tabelas e não desfaz efeitos financeiros externos.

## 4. Conferência real após aplicação

`verificar-pos.sql`, somente leitura, retornou todos verdadeiros:

- estado final corresponde integralmente ao esperado;
- demais objetos públicos preservados;
- todas as funções públicas anteriores preservadas;
- privilégios padrão preservados.

Captura posterior às **12h07min38s BRT** e comparação com a anterior:

| Escopo | Antes → depois | Resultado |
| --- | --- | --- |
| Negócios | 6 → 6 | Todos os campos/IDs/vínculos anteriores idênticos. |
| Pedidos, unidades e eventos comerciais anteriores | 0 → 0 | Nenhuma criação ou alteração de registro. |
| Dados comparados nas tabelas públicas anteriores | 40 tabelas | Contagens e hashes sem divergência; segredo/credencial excluídos da leitura. |
| Quatro tabelas novas | Ausentes → vazias | Zero cobrança, evento financeiro, contexto de cartão, tentativa ou e-mail criado. |
| Histórico | 42 → 43 | Exatamente a migration nominal nova; nenhuma entrada anterior perdida/alterada. |

Backup posterior e auditoria foram salvos privadamente e verificados por hash. SQL, recibo da aplicação, configuração/deployment e conferência de isolamento também registrados.

## 5. Isolamento: prova e limite

Em transação **READ ONLY**, sob o papel técnico `service_role`, o gate estrutural real retornou **1**. Foram chamadas somente as verificações estruturais/imutáveis previstas pelo gate; nenhuma RPC de pedido, confirmação, assinatura, rate limit ou e-mail.

- Quatro tabelas novas com RLS ativa, nenhuma permissão efetiva de SELECT/INSERT/UPDATE/DELETE para anon/authenticated e nenhuma permissão efetiva por coluna para esses papéis, inclusive a herança de PUBLIC.
- Dez funções novas SECURITY INVOKER, executáveis pelo papel técnico e bloqueadas para anon/authenticated.
- Políticas anteriores de negócios, pedidos e unidades e todas as funções anteriores correspondem ao estado preservado. Separação entre compradores A/B foi exercitada no clone local com essas definições.

**Não havia pedidos comerciais reais em produção.** Portanto este bloco não comprova um percurso autenticado entre dois compradores reais, nem PostgREST/JWT/Storage ou compra produtiva ponta a ponta. Não foram fabricados usuários, papéis de cliente, tokens, sessões, compras, pagamentos ou confirmações para produzir essa prova. A verificação real aqui é de schema, políticas/permissões efetivas e preservação; a prova entre compradores ficará para o ensaio autorizado.

## 6. Vendas e pagamentos continuam OFF

- Nomes/tipos/destinos de variáveis Vercel antes/depois idênticos, zero variáveis produtivas ocultas, nenhuma configuração financeira acrescentada ou alterada.
- GET HTTPS em `https://app.v2gmidia.com.br/contratar`: HTTP **200 com marcador `NEXT_HTTP_ERROR_FALLBACK;404`**, zero formulários. Not-found transmitido, não checkout liberado nem HTTP 404 literal.
- GET HTTPS `/entrar`: HTTP 200 com formulário de acesso. Sem login/cadastro, formulário de pagamento ou POST de provedor.
- Deployment produtivo permanece `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, main `13f8943471b391bd22e9dd8362f5748653ad9c5b`, READY. Nenhum novo deploy, commit, push ou merge.

Nada foi configurado no Asaas, Resend, Turnstile, Auth, webhook ou LP. Nenhuma cobrança, assinatura externa, captura, estorno, e-mail, nota ou anúncio foi criado.

## 7. Avisos existentes e encerramento

Advisors antes/depois: avisos WARN de [função SECURITY DEFINER anônima](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) **3 → 3**, [autenticada](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) **2 → 2**, [proteção de senha vazada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) **1 → 1**; identidades anteriores preservadas, nenhum novo WARN.

INFO de [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) **20 → 24**, exclusivamente as quatro tabelas novas privadas. Esse estado é intencional para acesso apenas técnico, e as permissões efetivas foram conferidas; não foram criadas policies públicas para retirar o INFO.

Bloco encerrado depois de revisão, backup privado, aplicação nominal e conferências. Alterações de outros chats preservadas. Sem aplicação QA, mudança de permissões/credenciais fora do delta aprovado, configuração de pagamentos, Meta, n8n, legais, DNS ou publicação de código. Próximo bloco de provedores/configuração e ensaio permanece separado.
