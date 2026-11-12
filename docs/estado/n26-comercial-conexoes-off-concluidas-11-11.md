# Comercial: conexões configuradas e conferidas com tudo OFF — 11/11/2026

## 0. Resultado e próximo bloco

**Encerrado o bloco autorizado de configuração das conexões produtivas, com vendas, processamento e e-mail financeiro desligados.** Todas as entradas privadas foram concluídas por Victor. Não pedir novamente geração/cópia das credenciais deste bloco sem nova falha ou mudança comprovada.

Conferência final: **35 variáveis**, 17 configurações públicas não secretas exatas e seis campos de credenciais como **Secret, somente Production**. Metadados das 12 variáveis anteriores preservados, zero nomes extras e zero variáveis produtivas ocultas. Site key é identificador público do protocolo Turnstile; foi guardado como Secret por conveniência da transferência conjunta, sem torná-lo secreto para o navegador quando o fluxo for habilitado.

Webhook real do Asaas agora cadastrado e conferido: **Desativado**, fila desligada, URL exata e os 17 eventos persistidos. Gerador local encerrado, aba fechada e nenhuma porta dele em escuta. Nenhum valor de chave/token/segredo foi lido ou gravado em arquivo pelo agente.

**Próxima frente concreta antes da ativação:** revisar e testar localmente o tratamento dos eventos sem pedido vinculado. O código local revisado ainda retorna 503 em `lib/contratacao/webhook-pagamento.ts:61`. Separar chegada legítima antes do vínculo de pagamento alheio ao checkout; preservar retentativa legítima e evitar bloqueio indevido da fila. Produção não foi exercitada para provar esse ramo. Não ignorar todos os órfãos nem criar evento/pedido fictício em produção para forçar sucesso.

Prova de encerramento dessa próxima frente: teste do evento legítimo antecipado que depois encontra o vínculo, evento alheio que não interrompe a fila, replay sem efeito duplicado e isolamento entre compradores. Preparar pacote local revisável, sem ampliar esquema ou ativar nada por consequência. Implementação/ativação são próximo bloco, não continuação implícita desta configuração.

Depois, autorizar separadamente o processamento/ensaio nominal: comprador, método, valor, recorrência e tratamento posterior definidos; Victor realiza a ação financeira. Aceite exige pagamento canônico confirmado → e-mail recebido → sessão legítima → negócio correto. Só após essa prova, decidir abertura de contratação/LP. **Este resultado não significa vendas liberadas.**

## 1. Matriz aplicada e preservação

Projeto `v2g-deploy-webapp`, `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`. Credenciais e configurações novas limitadas a Production; Preview/Development e metadados antigos preservados.

| Grupo | Resultado |
| --- | --- |
| 13 controles comerciais | Todos relidos `false`, incluindo compra, processamento, e-mail, confirmação de URL/3DS e portas legadas/QA. |
| Quatro configurações não secretas | `ASAAS_ENVIRONMENT=production`; compra `https://app.v2gmidia.com.br/contratar`; hostname permitido `app.v2gmidia.com.br`; FROM `pagamentos@send.v2gmidia.com.br`. Valores públicos conferidos exatos. |
| Asaas | `ASAAS_PRODUCTION_API_KEY` e `ASAAS_PRODUCTION_WEBHOOK_TOKEN`: Secret/Production. Chave com nome **V2G WebApp Produção** listada após recarga; permissão de saques estava desmarcada no formulário revisado antes da criação por Victor. Não foi feito teste financeiro nem consulta usando o valor privado. |
| E-mail | `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY`: Secret/Production. Domínio Resend Verified já conferido; criação foi preparada com Sending access e domínio send.v2gmidia.com.br. Não foi enviado e-mail novo. |
| Turnstile | `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`: Secret/Production. Widget **V2G Checkout Produção**, modo Managed/sem pre-clearance, hostname exato relido; widget QA preservado. Victor substituiu a Secret key após dúvida de cópia; gravação conferida por metadados, sem comparar valores ou fazer desafio real. |
| Hash independente | `V2G_CHECKOUT_SECURITY_HASH_SECRET`: Secret/Production. Victor acionou gerador local e confirmou colagem/salvamento. Interface reportou Copiado; agente não leu clipboard ou valor da variável. |

Os seis campos estão presentes nos destinos esperados, sem decriptação/leitura dos valores privados. Preservação dos 12 itens antigos significa IDs, nomes, tipos, targets, branch e ambiente customizado; não é comparação dos valores das credenciais antigas, que não foram lidos.

Endereços de autenticação foram resolvidos no bloco anterior: origem canônica e callback exato salvos, dois redirects antigos preservados. Não foram alterados novamente nesta conferência. Variáveis Supabase/Meta/backend/n8n anteriores não foram decriptadas ou sobrescritas para tentar produzir uma prova de compra.

## 2. Webhook efetivamente salvo

A primeira confirmação genérica deixou token na Vercel, mas a lista Asaas estava vazia. Isso foi registrado e não tratado como concluído. O formulário foi restaurado, Victor confirmou que mantinha o token original no clipboard e o colou privadamente no Asaas; a correspondência do par foi informada por ele, sem leitura dos valores pelo agente.

Após o nome aparecer em Meus Webhooks, conferência própria de lista e editor somente leitura:

- nome **V2G WebApp Produção - pagamentos**;
- badge **Desativado**, `enabled=false`;
- fila `poolActive=false`;
- URL igual a `https://app.v2gmidia.com.br/api/webhooks/asaas-production-payment`;
- exatamente os 17 eventos de `lib/contratacao/evento-financeiro.ts:1` persistidos, sem eventos extras;
- token não consultado; saída do editor sem Salvar/alterar. API v3/entrega Sequencial foram informadas na preparação; este registro não amplia as leituras específicas feitas depois do salvamento.

Webhook desativado e fila desligada permanecerão assim. Nenhum POST financeiro foi disparado para testar autenticação ou conectividade. Nenhuma retentativa, fila antiga ou obrigação anterior foi reativada.

## 3. Publicação observada e porta pública

Durante o salvamento final surgiu novo deployment no fluxo da Vercel (a interface mostrou Deployment created). Não atribuir o acionamento a um comando do agente nem inferir uma nova alteração de código. Nenhum comando/ferramenta de deploy foi chamado pelo agente.

Foi acompanhado até READY e confirmado por consulta ao domínio oficial:

- deployment ativo **dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW**;
- target **production**, branch **main**;
- commit **13f8943471b391bd22e9dd8362f5748653ad9c5b**, mesma revisão dos redeploys anteriores;
- GET `/entrar`: HTTP 200 e um formulário;
- GET `/contratar`: HTTP 200 com not-found transmitido (`NEXT_HTTP_ERROR_FALLBACK;404`) e zero formulários.

Essas verificações encerram publicação/fechamento desta configuração; não provam 3DS, autenticação do webhook, envio de e-mail financeiro ou acesso de comprador em produção. Não afirmar HTTP 404 literal nem compra aberta.

## 4. Gerador privado e encerramento

Utilitário auxiliar fora do produto: `C:/Users/victo/.codex/private-backups/v2g/hash-local-ui-20261111/`. HTML/JS/CSS públicos sem credenciais; Python apenas serviu os três arquivos em loopback. O segredo foi criado exclusivamente no clique de Victor por Web Crypto (32 bytes, 64 hex), copiado via Clipboard API e nunca colocado no DOM, log ou requisição. O agente não acionou Gerar e copiar.

Conferências do utilitário: análise sintática do JS, GET da página/script 200, CSP bloqueando conexões de rede e ausência de chamadas de envio no cliente. Cópia funcional confirmada pela interface após clique de Victor. Nenhum teste gerou credencial pelo agente.

Depois do salvamento, aba do utilitário fechada. Processo 17208 reconhecido pelo caminho exato do script antes de encerrar; confirmado processo terminado e zero portas 64602/loopback em Listen. Sessão de execução encerrada. Nenhum segredo foi salvo para recuperação posterior pelo agente.

## 5. Evidência e limites

Matriz final e provas seguras: `docs/comercial/conexoes-producao-11-11/resultado-final-off.json`. Capturas/metadados privados na pasta já restrita `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/`, incluindo `hash-secret-salvo-production-metadados.png`, `webhook-salvo-desativado-lista.png` e `webhook-salvo-off-conferido.json`. Backup selado do banco não foi modificado.

Sem edição do código do produto, migração adicional, leitura de `.env`, valores privados, banco, cobrança, assinatura, e-mail, anúncio, Meta, n8n, DNS, LP, legais, permissões, commit, push ou deploy iniciado pelo agente. Documentos locais são registros, não publicação do produto. Não foram repetidos build/suíte/banco concluídos: a validação apropriada foi matriz de configuração, metadados, persistência do webhook, estados OFF e porta pública na nova versão.

As aprovações históricas Asaas 3DS/tokenização e a prova QA de compra/acesso permanecem nas fontes anteriores; não são uma compra produtiva nova. Credenciais configuradas/metadados corretos não certificam os valores privados, variáveis automáticas no runtime ou o percurso financeiro inteiro. A próxima prova depende do bloco delimitado na §0, sem reabrir a configuração já encerrada.
