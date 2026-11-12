# Comercial retomado como prioridade absoluta — 10/11/2026

## 0. Resultado e próximo ato

> RESOLVIDO em bloco posterior de 10/11: Victor concluiu o login; a Central comprovou identidade, negócio exato e abertura pela compra QA. Ver `n26-comercial-acesso-comprovado-10-11.md`. O handoff abaixo fica como histórico, não deve ser solicitado novamente.

**A integração Asaas não está sendo recomeçada.** Na conferência atual, a compra Sandbox de 27/10 continua CONFIRMED, há webhook persistido, e-mail recebido e comprador confirmado/vinculado ao negócio. A abertura pública de produção não está concluída. O resumo anterior da Central usou um checkpoint inicial incompleto e não reconciliou as provas posteriores antes de falar das lacunas; isso foi corrigido neste bloco.

**Próximo ato único da QA:** Victor entra privadamente como `v2g.midia@gmail.com` na aba de entrada preparada pela Central; concluir navegação do comprador no negócio correto e negativas relevantes na versão atual, usando o pagamento existente, sem nova cobrança. A sessão observada antes do handoff era de outra identidade, portanto não foi usada para dar aceite à compra de 27/10. A senha ficou vazia e Entrar não foi acionado pelo agente. Não foi criado usuário, papel, confirmação de e-mail ou troca de proprietário.

O pedido de login foi apresentado a Victor pelo canal de entrada de texto. A aba foi marcada para handoff; a prova autenticada continua pendente até observar o resultado. Nenhum pagamento ou e-mail precisa ser repetido para encerrar o que já tem prova.

## 1. Por que o comercial continuava aberto

O ensaio inicial de 21/10 comprovou cobrança e limpeza, mas deixou e-mail/acesso sem prova naquela sessão. O ensaio posterior do mesmo dia já comprovou recebimento do e-mail. Em 27/10 houve outra compra Sandbox, recuperação de autenticação do webhook e confirmação visual/ledger, novamente com e-mail recebido. O estado atual também mostra vínculo e e-mail confirmado do comprador.

P1/P1b e U1–U6 corrigiram/prepararam acesso, comportamento após estorno e estrutura; o modo de produção e o domínio foram implementados/revisados localmente. Esses marcos não eram, por si, a prova final de navegação nem abertura real da venda. A frente de piloto operacional ganhou prioridade sem encerrar esse acompanhamento comercial. A prioridade 1 da compra já existia em `n26-p1-compra-acesso-04-11.md:20`; o desvio foi de coordenação, não uma nova dependência do Asaas em Cauã.

Direção atual de Victor registrada em `docs/decisoes.md`: comercial primeiro; depois clientes já atendidos e App Review em paralelo; depois criativos com rotina/experiência. Piloto operacional aguarda Cauã e FamFire fica fora desta rodada.

## 2. Provas atuais, separadas por origem

| Etapa | Prova e limite |
| --- | --- |
| Cobrança Sandbox | GET atual de `pay_zbwd79h7kzuspbrc`: CONFIRMED, R$ 500 fictícios, não excluída, sem estornos. Referência e cliente conferem com o pedido `01da0460-f12a-4c24-b1dc-ab03ed41a68f`. |
| Assinatura Sandbox | GET atual de `sub_ld9rnuzpdp85m1f7`: ACTIVE, não excluída, valor/método/referência/ciclo conferidos. Próximo vencimento informado: 27/12/2026. Isso não prova captura automática de ciclo futuro ou desafio 3DS bancário real. Não houve cancelamento ou alteração. |
| Pedido e webhook | QA: `payment_approved`, `initial_3ds`, R$ 500; ledger contém PAYMENT_CONFIRMED/PAYMENT_CREATED. Incidente 401 de 27/10 foi recuperado, segundo checkpoint próprio; não foi reaberto ou reenviado neste bloco. |
| E-mail recebido | Gmail INBOX, mensagem `1a17f793457bd085`, 27/10 às 22:26:50Z, assunto `[TESTE QA] V2G | Pagamento confirmado`; corpo confere pedido/cobrança/valor e link QA de entrada. A prova vai além de outbox accepted. Mensagem `1a160b157afbfab1` também comprova o recebimento do ensaio anterior de 21/10. |
| Identidade e vínculo | Comprador `ca842864-295c-48c5-bf5c-6ac744de81c0`, negócio `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`; profile do negócio confere com comprador. Auth tem e-mail confirmado e coincide com o e-mail da compra. Não se substitui login de UI por essa consulta. |
| QA atual | Checkout/pagamento/accesso publicados sob QA `2cdeb5c`, conforme publicação conferida no bloco anterior. Falta navegar como o comprador dessa compra nessa versão; não foi executada nova submissão financeira. |

Consultas somente leitura no projeto QA `zskpijnqgkqwxksqmzmf`. Sem leitura de linhas financeiras de produção. O pedido de 27/10 tem `dados_ficticios=false` no negócio QA; essa flag não define a origem do pagamento. A prova financeira vem do host Sandbox fixo, referência, valor e IDs conciliados. Não mudar a flag ou os dados por dedução neste bloco.

Foram encontrados quatro e-mails accepted na outbox, inclusive dois em 09/11. Isso não foi usado como prova de quatro pagamentos externos: a prova deste bloco é a compra exata de 27/10 conciliada diretamente com o provedor e com a mensagem correspondente.

## 3. Configuração e produção

Inspeção Vercel somente de nomes/tipos/destinos de variáveis, `decrypt=false`, sem imprimir ou ler valores:

- QA já tem nomes de configuração de e-mail e 3DS. A ausência registrada no primeiro ensaio de 21/10 é histórica, não um bloqueio atual comprovado. Presença de nome não certifica seu valor, ativação ou validade da credencial.
- Projeto de produção `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, nome `v2g-deploy-webapp`, confirmado. Domínios retornados são os três aliases Vercel; `app.v2gmidia.com.br` não consta, e a consulta específica do domínio nesse projeto retornou 404. Não é prova de inexistência global no DNS.
- Metadados de produção retornaram zero variáveis produtivas ocultas e nenhum nome Asaas/checkout/e-mail de pagamento/Turnstile. O código produtivo exige configuração explícita e fecha sem ela. Nenhuma variável, domínio, flag ou deployment foi alterado.

O código do modo produtivo já foi preparado/revisado em 05–06/11, mas faltam os atos externos e a prova de lançamento. Não chamar esse trabalho de integrar Asaas do zero.

### Pacote de abertura a preparar depois do aceite QA

1. Destino já decidido: LP em `v2gmidia.com.br`, aplicativo/compra em `app.v2gmidia.com.br`, compra em `/contratar`. Preparar configuração de domínio, HTTPS e callbacks sem mudar o destino por suposição.
2. Conferir metadados e diferenças do banco de produção e apresentar somente as unidades necessárias, com backup e retorno. Não reaplicar a cadeia inteira de migrations QA nem supor que a readiness QA certifica produção.
3. Preparar configuração própria de Asaas produção, webhook/token exclusivo, remetente/e-mail, proteção e requisitos 3DS. Manter criação de novas compras e processamento como controles separados.
4. Apresentar previamente o ensaio financeiro real concreto (conta, método, valor, recorrência, destinatário e limpeza), para autorização específica antes de qualquer cobrança. Não transportar autorização antiga de Sandbox.
5. Comprovar pedido → confirmação canônica/webhook → e-mail recebido → login/negócio correto e recuperação/replay. Só então expor o encaminhamento de contratação na LP, com desligamento conferido.

Assinatura do contrato e processo fiscal permanecem com suas decisões/evidências próprias; pagamento não é assinatura nem NFS-e. Não enviar minuta de teste, aceitar contrato ou emitir nota por esta retomada.

## 4. Coordenação e plano

Convocado o chat existente **01 e 02**, por autorização persistente de Victor para distribuir trabalho. Escopo: reconciliar provas posteriores e o pacote mínimo comercial, sem cobrança, configuração, migração, segredo ou alteração de produto. O retorno confirmou: recebimento do e-mail encerrado; usar pedido existente para conferir estado financeiro/recorrência, login/negócio e negativas; produção e etapa 02 separadas. A conferência financeira de leitura foi concluída pela Central neste bloco.

Planilha original atualizada em 16 células: Visão geral `A3`, `C6:D6`, `F6`; Novembro — execução `I2:L2`, `J10:J14`, `J17`, `L10`, `L13`. Notas antigas, formatos, validações e estados nativos preservados; nenhuma etapa foi promovida a concluída indevidamente. A linha 2 de Novembro teve somente a altura ampliada para 180 pixels para ler os textos sem corte, sem redimensionar colunas/planilha. Releitura confirmou as 14 células iniciais e os dois complementos. Inspeção visual nas duas abas.

Arquivo: https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit

## 5. Evidências, código e parada

- Script novo estritamente GET: `docs/qa/comercial-retomada-10-11/ler-compra-sandbox.mjs`. Guarda projeto QA e Asaas Sandbox, fixa os IDs e exige identidade/valor/método/ciclo. O runtime carregou sua configuração normalmente, sem imprimir ou inspecionar segredos. Execução concluída com código 0 e estados conciliados. Não possui POST/PUT/PATCH/DELETE ou limpeza.
- Pasta privada: `C:/Users/victo/.codex/private-backups/v2g/comercial-retomada-20261110/`, com backup das células anteriores e capturas da prioridade/atos comerciais. Sem payload de cartão, credencial, token, senha ou URL autenticada nos registros.
- Código do produto não alterado; nenhuma suíte antiga foi repetida para gerar um novo placar. Alterações documentais anteriores preservadas. Sem compra nova, e-mail enviado, mudança Auth, permissões, migration, n8n, produção, commit, push ou deploy.

**Handoff aberto:** login legítimo do comprador QA. A Central não declara acesso autenticado aprovado nem comercial produtivo concluído sem as respectivas provas. Este bloqueio não será transformado em nova rodada de pagamento.
