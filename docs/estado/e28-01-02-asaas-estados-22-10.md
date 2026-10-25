# E28 01 e 02 Estados de pagamento Asaas

Checkpoint de 22/10/2026, 12h39 de Brasília. Responsável: frente 01/02.
Bloco LOCAL concluído, sem publicação, aplicação de migration, envio de e-mail,
nova cobrança, estorno ou configuração externa. Etapa 01 ainda aberta; etapa 02
continua com execução contratual e fiscal pendente. Não substitui o quadro do Central.

## Respostas da Alice em 22 de outubro

- Às 09h37, Alice esclareceu que o token é devolvido após transação aprovada,
  que a assinatura pode usar esse token com primeiro vencimento no mês seguinte
  e indicou os eventos de risco, autorização e captura a conciliar. Pediu dados
  do negócio, justificativa de tokenização, contrato, emissão fiscal e reajuste.
  Prazo informado: até quatro dias úteis APÓS receber todas as informações.
- Às 11h51, confirmou liberação para prosseguir com 3DS, atualizando a espera do
  chamado 1892329. Isso não equivale à aprovação da solicitação de tokenização
  nem elimina contestações comerciais.

Fontes privadas: [resposta técnica de Alice](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a1639de491c066a)
e [liberação de 3DS](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a16418e150b9a2e).
Conteúdo lido nesta continuidade; nenhum envio/draft externo criado.

Referência pública: [eventos de cobrança](https://docs.asaas.com/docs/webhook-para-cobrancas),
[cobrança com 3DS](https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds)
e [assinatura com cartão](https://docs.asaas.com/docs/criando-assinatura-com-cartao-de-credito).

## Implementação local

| Evento | Tratamento | Liberação nova ou recorrência |
|---|---|---|
| PAYMENT_AWAITING_RISK_ANALYSIS | Registra análise pendente | Não |
| PAYMENT_APPROVED_BY_RISK_ANALYSIS | Registra análise aprovada, não pagamento | Não |
| PAYMENT_AUTHORIZED | Registra autorização, não captura | Não |
| PAYMENT_REPROVED_BY_RISK_ANALYSIS | Registra negativa e exige revisão | Não |
| PAYMENT_CREDIT_CARD_CAPTURE_REFUSED | Mantém negativa de captura | Não |
| PAYMENT_CONFIRMED | Confere pagamento e identidade | Somente após validações |
| PAYMENT_RECEIVED | Também admite primeiro evento já recebido | Mesmas validações, sem cobrar primeiro mês outra vez |

FATO: os quatro novos eventos passam pelo parser, em vez de serem ignorados
(`lib/contratacao/evento-financeiro.ts:1`). Eventos intermediários não entram
no ramo de aprovação (`app/api/webhooks/asaas-payment/route.ts:36`). Negativa de
risco integra a lista adversa usada pela projeção pública, e-mail e recorrência
(`lib/contratacao/estado-pagamento-publico.ts:10`).

FATO: RECEIVED agora também reconcilia a assinatura posterior
(`app/api/webhooks/asaas-payment/route.ts:96`,
`lib/contratacao/assinatura-apos-3ds.ts:38`). A compra inicial continua avulsa;
assinatura inicia no mês seguinte. Token ausente não reserva/cria assinatura.
Reserva já iniciada consulta a assinatura existente, sem repetir POST após
timeout (`lib/contratacao/assinatura-apos-3ds.ts:60`). Renovação entra no ledger
financeiro, sem voltar ao criador da assinatura inicial.

## Migration preparada e não aplicada

Arquivo: `supabase/migrations/20261022152629_asaas_estados_processamento.sql`.
SHA256: `F2E6A009626F68CAE310546B4510EC789C30FFEC8F1B5C527A3BD5AFCF6B7F15`.
Manifesto: `supabase/objetos.ts`.

Amplia a constraint do ledger e whitelist das quatro RPCs registradoras; adiciona
classificador privado de ocorrência adversa, ajusta as duas RPCs iniciais e a
reserva para CONFIRMED/RECEIVED, e protege a aprovação self-service direta contra
evento adverso anterior da MESMA cobrança. Preserva origem, locks, IDs e ACL.

Os ajustes usam `pg_get_functiondef` com assinaturas fixas e precondições
explícitas. Se a definição instalada divergir nos trechos esperados, a transação
inteira aborta. Não ignorar erro, editar ledger ou marcar versão como aplicada
para contornar: comparar definição real com dependências primeiro. Não há remoção
de tabela/dados, nova flag ativa, permissão para navegador ou mutação de acesso.

## Testes executados sem rede

- `pnpm typecheck`: PASS.
- `node scripts/conferir-cartao-3ds-integrado.mjs`: 16/16.
- `node scripts/conferir-webhook-estorno-handler.mjs`: 10/10, handler real com
  portas isoladas; inclui risco, autorização, recusa, replay, divergência canônica,
  RECEIVED inicial e renovação sem recriar assinatura.
- `node scripts/conferir-estado-pagamento-publico.mjs`: 10/10.
- `node scripts/conferir-email-pagamento.mjs`: 8/8; usa lista adversa real.
- `node scripts/conferir-senha.mjs`: 5/5.
- `node scripts/conferir-redefinicao-turnstile.mjs`: 3/3. Os dois olhinhos e a
  rota pública `/redefinir/concluido` já existiam no HEAD; não foram refeitos.
- `scripts/conferir-asaas-processamento-sql.mjs`: 25 cenários PASS no PGlite com
  cadeia real de migrations; self-service/comercial, avulsa/3DS, ordens diferentes,
  replay e colisão de ID, RECEIVED antes de CONFIRMED, negativa antes de confirmação,
  intermediário tardio, reserva única, renovação e ACL das oito funções.
  Também provoca divergência de uma RPC e comprova rollback da migration.
- `scripts/conferir-assistido-asaas-sql.mjs`: regressão do fluxo anterior PASS.
- `git diff --check`: PASS; avisos de conversão LF/CRLF, sem erro de whitespace.

PGlite utilizado da instalação existente em `C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js`,
informado por `V2G_PGLITE_MODULE` apenas no processo do teste. Não instalou pacote,
não leu `.env` e não acessou Supabase/Asaas. Build não executado porque compartilha
`.next` com o dev. Suíte global não executada. Testes locais não certificam QA.

## Pacote e sequência para publicar no QA

1. Victor/Central revisa os arquivos deste bloco e registra o commit exato pelo
   fluxo humano. Excluir do pacote mudanças concorrentes de geração/onboarding
   que não pertençam a 01/02; não descartar esses arquivos.
2. Conferir ledger, backup e definições atuais apenas do QA `zskpijnqgkqwxksqmzmf`.
   Dependências incluem eventos financeiros, 3DS e pedidos comerciais assistidos.
   O teste local aplica a cadeia relevante de dez migrations anteriores.
3. Com autorização específica, aplicar SOMENTE a migration deste checkpoint,
   em transação, individualmente. Não executar push geral de migrations: existem
   trabalhos de outras frentes na árvore compartilhada.
4. Conferir constraint, assinaturas, security invoker/search_path e grants sem
   permissões anon/authenticated. Confirmar registro da versão no ledger.
5. Publicar somente projeto QA `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, alias
   `https://v2g-webapp-qa.vercel.app`, verificando o commit publicado. Não publicar
   produção e não ativar tokenização por inferência da liberação de 3DS.
6. Conferir inscrição do webhook nos novos eventos, ambiente e autenticação.
   Alteração de inscrição/configuração requer seu próprio portão. Runtime sem
   migration não aceita silenciosamente evento novo: falha e exige conciliação.
7. Conferir no QA os dois controles de senha, conclusão e login identificado.
   Para provar acesso ativo, não usar compra integralmente estornada como
   evidência de uma compra vigente.
8. Com autorização do ensaio e plano de limpeza, percorrer pagamento inicial,
   estados intermediários disponíveis, confirmação, e-mail, negócio correto,
   recorrência no mês seguinte e reenvio sem duplicação. Não forjar eventos em
   QA para dizer que o provedor os produziu; distinguir simulação de entrega real.
9. Reconciliar estorno anterior com Logs de Webhooks, ID, horário, HTTP e ledger.
   Não reenviar, estornar ou criar outra cobrança neste bloco.

Pacote runtime: parser financeiro, lista adversa, assinatura após 3DS e handler;
pacote banco: migration e manifesto; pacote prova: quatro suites alteradas e
nova suite SQL. Checkpoint acompanha ambos. Nada commitado/publicado por esta frente.

Última leitura externa de publicação foi às 11h08–11h11 de 22/10, não refeita neste
bloco: QA tinha commit `fbf00ee3af7fb3cc8c06931138011a49bcd85236`; produção WebApp
tinha `7374227997848a5e2b8b99b5ada4e67c36eabfc0`. A diferença não comprova aplicação
SQL. A LP já estava publicada com `3849dd68107ee6c27d7d8db4ee6dea5de0ff0655`;
fica pendente a prova de formulário → alerta no e-mail → contato WhatsApp. Não
republicar a LP nem reconstruir o processo comercial por esta lacuna de prova.

## Acesso após estorno ainda exige decisão humana

FATO: vínculo e elegibilidade usam aprovação histórica e titularidade
(`lib/contratacao/vincular-core.ts:27`, `lib/contratacao/acesso.ts:21`,
`lib/multiconta/elegibilidade.ts:41`); não implementam uma política operacional de
revogação por estorno. A projeção pública não é autorização de acesso.

PROPOSTA não ativada: impedir NOVA liberação sustentada exclusivamente em compra
integralmente estornada, mantendo Auth e outros negócios/direitos. Direitos já
vinculados, estorno parcial e contestação precisam de decisão por contrato e
negócio, nunca suspensão global do perfil. Risco reprovado bloqueia uma nova
confirmação da mesma cobrança; não apaga pagamento histórico nem revoga acesso.

## Ponte mínima para dez clientes atuais sem cobrar novamente

Os dez clientes são informação de Victor, não pagamentos, identidades ou direitos
auditados. Nenhuma conta, convite, concessão ou cobrança criada neste bloco.

Proposta para 03/04: pré-conferência por contrato e negócio com CNPJ exato,
responsável e e-mail verificado, negócio existente ou novo, vigência e fonte do
direito (contrato/pagamento anterior/autorização expressa). Registrar operador,
motivo e evidência do ato. Separar situação financeira de autorização de uso.

Preferir um direito auditável POR NEGÓCIO, com origem histórica, a simular
`PAYMENT_CONFIRMED`, usar IDs Asaas inventados ou liberar perfil inteiro via
`webapp_legacy_access`. Preservar um e-mail com múltiplos CNPJs. Não casar pessoas
por semelhança de e-mail/telefone. A entrada entregue a 03/04 deve ser user_id
verificado + business_id + origem/vigência do direito, não dados de cartão.

Próximo bloco: dry-run da lista e conflitos, aprovação humana e só então desenho
final/implementação da ponte. Não é pré-requisito para fechar a compra nova.

## Rascunho para revisão de Victor e não enviado

Destinatário: suporteintegracoes.zendesk@asaas.com.br.
Responder na conversa existente. Antes de enviar, Victor precisa preencher os
campos entre colchetes e escolher um contrato que possa ser compartilhado. Não
há anexo neste rascunho nem aprovação de tokenização presumida.

Assunto: Re: V2G | confirmação de tokenização, assinatura com 3DS e estornos Sandbox

Olá, Alice. Tudo bem?

Obrigado pelo retorno e pela liberação para prosseguirmos com o 3DS.

A V2G presta gestão digital de anúncios para pequenas e médias empresas, com
apoio de IA e acompanhamento humano. O atendimento pode começar no WhatsApp,
mas queremos concentrar a contratação no mesmo fluxo de compra. A entrega é
digital, com acesso à plataforma e acompanhamento do serviço. A verba de mídia
é separada da contratação da V2G.

A oferta mensal é de R$ 500 por conta de anúncios. Também temos pagamento
semestral ou anual à vista com desconto. A tokenização é importante para a
recorrência mensal, evitando pedir os dados do cartão novamente. O fluxo que
estamos preparando é uma cobrança inicial avulsa com 3DS e, somente após a
confirmação do pagamento, uma assinatura com o token retornado e primeiro
vencimento no mês seguinte. Os testes feitos até aqui são no Sandbox.

Sobre os documentos:

- Contrato: [Victor confirmar o modelo utilizado e selecionar versão que pode ser enviada].
- Alteração de valor: [Victor confirmar a cláusula existente; não presumir reajuste autorizado].
- Nota fiscal: a preparação com a contabilidade ainda está em andamento. [Victor confirmar a situação atual de emissão antes do envio].

Site: https://www.v2gmidia.com.br.

Uma dúvida para não confundirmos as liberações: a análise de tokenização que
você mencionou é necessária também para reutilizar, em `POST /v3/subscriptions`,
o token devolvido automaticamente após a primeira cobrança aprovada com 3DS?
Ou essa análise se aplica ao uso do endpoint específico de tokenização? A
liberação de 3DS já comunicada cobre qual desses caminhos?

Não anexei contrato nesta mensagem; envio a versão confirmada na sequência.

Obrigado,
Victor Cabral
V2G Mídia

## O que falta para concluir

- 01: revisão/publicação do pacote QA, migration individual após backup e portão,
  prova de login/negócio na versão correta, alerta/WhatsApp da LP, conciliação do
  estorno real e decisão de acesso. Provas históricas de cobrança/renovação não
  foram apagadas nem repetidas por falta de publicação deste pacote.
- Asaas: revisar/enviar rascunho com respostas contratuais e fiscais verdadeiras;
  obter resposta sobre o alcance da aprovação da tokenização.
- 02: concluir contrato/assinatura e parâmetros/emissão fiscal com responsáveis.
  Não afirmar NF automática ativa. Comprovante de pagamento não substitui NF.
  A etapa continua adiada conforme decisão anterior; não bloqueia todo uso
  interno da V1 por inferência.

Árvore compartilhada: mudanças concorrentes em `docs/recebimento-cliente-meta.md`,
`docs/estado/e28-passagem-primeiros-10-clientes-22-10.md`, `lib/criativos/geracao/`
e `scripts/sql/proposta-geracao-local-22-10.sql` foram preservadas, não são entregas
desta frente. Figma/Sheets não alterados. Bloco encerrado para leitura do Central.
