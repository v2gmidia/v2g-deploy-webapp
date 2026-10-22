# E28-01 — ponte corrigida/aplicada e QA publicado

## Sessao autenticada — verificacao posterior

### Operador temporario autorizado — progresso seguinte

**Atualização após mudança de rota comercial:** encerrado o ensaio de operador. A retirada autorizada restaurou a ausência original da chave `papel`, sem sobrescrever outros metadados. Update exato em QA retornou `papeis_temporarios_retirados=1`; leitura posterior confirmou uma conta QA04 e zero com chave `papel`. Navegação autenticada no Início perdeu a opção de gestor e `/contratar` abriu normalmente. Nenhuma compra nova foi criada. O parágrafo abaixo preserva o estado histórico anterior, não indica papel ainda ativo. Próximo trabalho agora é o checkout self-service, não habilitar a ponte assistida.

Victor autorizou explicitamente papel temporario para `victor.cabral+v2gqa04@v2gmidia.com.br`, somente QA, com retirada ao encerrar o ensaio. Metadados originais/ID/email preservados privadamente em `C:/Users/victo/v2g-backups/qa-operator-temporary-20261021.json`. Update exato retornou accounts_updated=1, preservando demais app_metadata. Navegacao na mesma sessao confirmou /pedidos com titulo "Pedidos assistidos", acesso concedido e lista sem pedidos assistidos. **Papel temporario ainda ativo durante o ensaio interrompido; retirar ao encerrar, preservando metadados preexistentes.**

A tela publicada ainda exibe "Qualificacao declarada e Pix direto" e "Registrar venda assistida por Pix", sem campos de comprador/metodo Asaas. A opcao nova nao esta ativa sob os guards atuais. Nao preenchido/criado pedido legado como substituto. Proximo passo requer habilitacao especificamente autorizada de `V2G_ASSISTED_ASAAS_ENABLED` somente no projeto QA, mantendo demais guards Sandbox, e publicacao dessa configuracao para o mesmo commit. Nenhuma configuracao externa foi alterada neste progresso. Nenhum pedido, cobranca, pagamento, email ou WhatsApp real foi criado/enviado.

Victor abriu o QA. Pela aba Chrome explicitamente indicada, /inicio confirmou sessao no negocio ficticio Multiconta B; /pedidos redirecionou para /inicio. A tela Conta identifica `victor.cabral+v2gqa04@v2gmidia.com.br`. Consulta agregada somente leitura confirmou **zero contas com app_metadata.papel=operador no QA**, com dois perfis existentes. Nao lidos tokens, cookies, senhas ou codigos; nao feito logout nem modificado o negocio selecionado. Nenhum papel foi concedido: elevacao temporaria de operador requer autorizacao especifica, com retirada ao encerrar, e separacao dos testes de comprador. A conta QA04 nao deve ser usada para certificar isolamento de comprador enquanto tiver papel global de operador. Esta e a barreira atual da venda assistida autenticada, nao falha financeira nem necessidade de refazer migration.

Data: 21/10/2026, America/Sao_Paulo. Autorizacao direta de Victor: corrigir checagem sem ampliar acesso ao Auth, aplicar migration corrigida no QA apos novo backup e atualizar somente QA para fbf00ee. Nao autoriza cobranca, email/WhatsApp real, alteracao de producao ou sobrescrever trabalho da LP.

## Correcao e limite de confianca

- Migration local ainda nao aplicada foi corrigida antes da primeira aplicacao: RPC nao consulta auth.users; exige ator nao nulo com perfil existente. Autorizacao do papel de operador permanece na action por getUser()+app_metadata antes de criar admin. RPC continua exclusiva service_role; nao ha caminho anon/authenticated. O servidor privilegiado e a fronteira de confianca; o banco nao confirma novamente o papel em auth.users. Esta mudanca foi explicitamente aprovada, nao ocultada como simples grant.
- Arquivo: `supabase/migrations/20261021042254_assisted_asaas_orders.sql`. SHA-256 corrigido **5AE36D75C4A4FD33F282C413B57FFA0A3848D8511AE27D650031F72DF1182EC7**. Nenhum SECURITY DEFINER, novo grant no Auth ou edicao de migration remota historica.
- `scripts/conferir-assistido-asaas-sql.mjs` agora testa tambem a chamada como service_role sem SELECT de raw_app_meta_data, com apenas os grants public necessarios. Validacao de nao operador permanece testada na action real. Ensaio local passou. Typecheck passou.

## Backup e aplicacao QA

- QA confirmado `zskpijnqgkqwxksqmzmf`; coluna/RPC assistida ausentes antes, zero pedidos assisted com metodo Asaas. Public profiles SELECT, businesses/orders INSERT e leads SELECT presentes no servidor; Auth continua sem SELECT.
- Novo snapshot comercial consistente de uma consulta, fora do repositorio: `C:/Users/victo/v2g-backups/qa-commercial-before-assisted-20261021-authorized.json`; JSON relido e SHA-256 **667D66F8293CE9700B42E389FB49F6F06DB8CFBFC79856235A2F962631A1D70B**. Nove tabelas comerciais, ledger, schema/defaults/constraints/ACL/indices/policies e RPCs anteriores. Nao e backup integral/restore testado de Auth ou Storage; nenhum segredo exportado.
- Aplicacao individual via conector: `qa_assisted_asaas_orders_server_authorization`, success true, versao remota **20261021203643**. Nao utilizado db push, nao reaplicado 3DS/outbox e nao alteradas migrations de criativos.
- Ensaio real QA com SET LOCAL ROLE service_role: criar pedido ficticio sem lead, replay com mesmo ID, origem/ator preservados, valor divergente negado, confirmacao correta e replay sem duplicar evento. **ROLLBACK**: sem fixture residual, pedido/cobranca/email/usuario real criado. Nenhuma chamada Asaas/SMTP/HTTP feita por esse ensaio SQL.
- Contagens preservadas: 20 pedidos, 9 eventos comerciais, 11 financeiros. Digests iguais ao backup, descontando somente a nova coluna assisted_operator_id nula no historico. Auth SELECT continua false. Cinco funcoes novas SECURITY INVOKER, anon/authenticated sem EXECUTE e service_role com EXECUTE.
- Evidencia compacta: `C:/Users/victo/v2g-backups/qa-commercial-after-assisted-20261021-verification.json`.
- Advisors mantem nove INFO de tabelas server-only sem policy e avisos legados; nao houve novo grant publico. Seguranca global nao certificada. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .

## Publicacao autorizada somente QA

- Projeto Vercel **v2g-webapp-qa**, `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, team `team_sEnWVgpk9PlXLZwMQmd4sv3O`.
- Repo GitHub identificado pelo conector, ID 1317382059; deploy do commit exato **fbf00ee3af7fb3cc8c06931138011a49bcd85236**, sem withLatestCommit.
- Deployment **dpl_5fhdiTVStUg2RLSp3F2iuSsjPvnp**, READY; alias fixo **https://v2g-webapp-qa.vercel.app** confirmado. O target se chama production dentro do projeto QA; nao e o projeto de producao do produto.
- GET publicado: /contratar 200 com texto real de identificacao do pedido e formas de pagamento; /entrar 200; /pedidos 307 para autenticacao; status com referencia ficticia inexistente 404. Sem submissao de formulario, convite/email ou cobranca.
- Nenhuma variavel/flag externa alterada; nomes de commit nao comprovam remetente configurado ou envio ativo. Nao foram lidos valores de .env, chaves ou senhas.
- O codigo runtime fbf00ee permanece compativel com a interface da RPC corrigida. A correcao do arquivo SQL e teste esta LOCAL para proximo commit/push de Victor; nao foi incluido novo commit pelo agente nem escondida diferenca entre arquivo do Git e SQL aplicado.

## Regressao LP encontrada: percurso completo ainda NAO passou

- Regressao dirigida atual: **61 de 62 testes passaram**. Falha em `scripts/conferir-jornada-comercial-portas.mjs:90`: contador de alerta esperado 1, observado 0 no handler LP atual. Nao enfraquecida assertion para ficar verde.
- Arquivos atuais em `../lp`: `api/pre-cadastro.js` nao importa/chama alertarNovoLead; CONTATO_URL aponta **5521999689689**, nao o pessoal aprovado **5521980351531**. `index.html` carrega lp.v6.js. Prova local, nao certificacao de qual versao esta publicada na LP. Nenhum arquivo LP foi sobrescrito: nao sei autoria/decisao da reversao e nao vou apagar trabalho alheio para restaurar a sessao antiga.
- Assim, nao declarar LP→email/WhatsApp→pedido→pagamento→acesso concluido. Mesmo com banco e deploy prontos, falta reconciliar/restaurar recorte LP com consentimento de Victor e homologar configuracao/envio.

## Handoff

Solicitado a Victor entrar no QA com conta de operador em /pedidos e avisar, sem compartilhar senha/2FA. Depois, testar autenticado ate a fronteira financeira; nova cobranca ficticia e envio real exigem autorizacao especifica. Precisamos ainda da decisao sobre restaurar o alerta/WhatsApp pessoal na LP atual. Nao abrir fluxo real por outra rota para contornar esta falha.

Arquivos locais alterados: migration corrigida e teste SQL; este checkpoint. Sem commit/push, sem alteracao da LP ou documentos centrais. Nenhum pagamento real/ficticio no provedor ou mensagem real ocorreu. Producao permanece fora do bloco.
