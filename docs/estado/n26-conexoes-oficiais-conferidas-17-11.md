# Conexões comerciais oficiais conferidas em 17/11/2026

## 0. Pendências e limite atual

> RESOLVIDO em 17/11/2026: campos privados e retirada de saques concluídos e conferidos. Ver [fechamento deste bloco](./n26-conexoes-oficiais-configuradas-off-17-11.md). As observações abaixo preservam o estado da etapa de conferência.

Cobranças, processamento e envios comerciais permanecem OFF. Nenhuma cobrança, assinatura, mensagem ou acesso novo foi criado neste bloco.

Victor confirmou a cópia privada da chave do banco na LP. A Central releu somente os metadados: SUPABASE_SERVICE_ROLE_KEY presente como Secret/sensitive e somente Production em v2-g-lp. Valor não lido; conteúdo não comparado. Compras da LP continuam OFF.

Falta salvar um segredo novo de assinatura, compartilhado somente entre LP e WebApp oficiais. Os dois campos estão preparados como Secret, somente Production. O valor é gerado por clique humano, não passa pela Central nem pelo chat. O projeto QA não é origem nem destino dessas credenciais.

O Asaas exigiu Token SMS para concluir a retirada da permissão de saques da chave existente. A alteração foi preparada, mas ainda não deve ser declarada salva antes da confirmação humana e da releitura do estado.

Na retomada, Victor pediu para preparar a confirmação novamente. A nova aba do Asaas ainda mostrou a chave habilitada e saques ligados; a Central refez somente o ajuste para saques OFF e abriu novamente o modal de SMS. Não foi gerada outra chave nem alterada a habilitação geral.

Abertura e envio real continuam fora deste bloco. A existência de uma chave cadastrada não comprova handshake ou recebimento em caixa.

## Conferências concluídas

| Frente | Evidência atual | Limite |
|---|---|---|
| Asaas | Sessão legítima da V2G; chave V2G WebApp Produção habilitada, criada em 11/11, sem expiração cadastrada. | Valor da chave não foi lido nem comparado com a Vercel; não houve chamada financeira autenticada. |
| 3DS | Resposta do suporte em 22/10 liberou o fluxo; protocolo 1835325 e subticket 1892329. Contexto do pedido: conta V2G de produção. | Aprovação escrita anterior; nenhum desafio real novo ou consulta de capacidade em tempo de execução neste bloco. |
| Tokenização | Resposta de 23/10 aprovou a funcionalidade, sujeita a monitoramento e possível revisão pelo provedor. | Não fabricar outro pedido de aprovação nem tratar a aprovação como transação realizada. |
| Webhook | Nome V2G WebApp Produção - pagamentos; URL HTTPS oficial exata, 17 eventos esperados; enabled=false e queueActive=false. | Token não lido. Entrega do provedor não foi ativada ou ensaiada. |
| Endpoint produtivo | POST vazio, sem credencial nem evento, respondeu 503/indisponivel, antes de processar pagamento. | Prova de bloqueio e alcance HTTPS; não prova entrega autenticada do Asaas. |
| Turnstile | Widget V2G Checkout Produção, modo Managed, somente app.v2gmidia.com.br e pre-clearance desligado. | Chaves não reveladas; desafio/siteverify reais não executados. |
| Resend | send.v2gmidia.com.br Verified, DKIM/SPF Verified; chave V2G Produção Pagamentos com Sending access e domínio restrito correto. | Zero uso registrado nessa chave; não declarar e-mail de pagamento entregue. |
| Acesso | Site URL oficial e callback /auth/confirmar na allowlist; Email habilitado, Confirm email ligado, anônimo desligado. | Nenhum cadastro ou recuperação disparado. |
| E-mail Auth | SMTP próprio ligado em smtp.resend.com:465, nome V2G, senha armazenada oculta. Template de cadastro usa ConfirmationURL. | SMTP existente preservado. Nenhum envio foi provocado para testar. O assunto permanece em inglês; isso não foi tratado como falha funcional. |
| Callback sem credencial | GET /auth/confirmar sem token retornou 307 para /redefinir?erro=invalido no domínio oficial. | Não verifica um token válido nem cria sessão de comprador. |
| Ponte LP | As duas pontas estão OFF. Faltavam três campos privados: chave do banco na LP e assinatura nas duas pontas. Configuração preparada para entrada humana. | Presença de campo não prova igualdade dos segredos ou funcionamento da ponte. |
| Banco | Readiness=1; pedidos, eventos financeiros, filas comprador/interno, assinaturas nominais e vínculos: zero na leitura deste bloco. | Não inserir fixtures em produção para simular compra ou disparar mensagem. |

## Divergência encontrada e correção preparada

A consulta atual do Asaas mostrou a permissão de saques/transferências ligada na chave, apesar de a criação anterior ter sido preparada com essa opção desmarcada. O estado atual visível prevalece sobre o relatório antigo.

A Central abriu a edição da chave existente e desmarcou somente essa permissão. A chave permaneceu habilitada, nome/expiração preservados. Ao salvar, o Asaas exigiu Token SMS; Victor foi chamado para concluir privadamente. Não houve geração, exposição ou rotação da chave e não houve transferência financeira.

## Aprovações localizadas, sem reenviar solicitações

- [3DS, 22/10/2026](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a16418e150b9a2e), suporte Asaas, ticket 1835325.
- [Tokenização, 23/10/2026](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a168f5bf8f55195), mesmo atendimento.
- [Guia oficial do 3DS](https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds): primeira cobrança por payments, confirmação canônica por webhook e callback HTTPS. A documentação exige habilitação na conta; a aprovação escrita acima resolve a pendência documental, sem comprovar uma operação real.
- [SMTP Resend/Supabase](https://resend.com/docs/send-with-supabase-smtp): host e porta observados correspondem à documentação.

## Preservação

Nenhuma opção de compra, processamento, recorrência, preparação ou envio foi ligada. O webhook e sua fila permaneceram desligados. Não houve migração, commit, push, merge, publicação de código, anúncio ou alteração de verba neste bloco até este checkpoint.

Campos privados preparados: SUPABASE_SERVICE_ROLE_KEY na LP v2-g-lp; V2G_COMMERCIAL_LP_HANDOFF_SECRET em v2-g-lp e v2g-deploy-webapp. O segredo de produção é novo e não reaproveita a QA. O gerador privado roda apenas em 127.0.0.1, gera por clique humano no navegador e não recebe nem mostra o valor.

O e-mail de confirmação de identidade já usa SMTP próprio; ele foi apenas consultado. As guardas de envio comercial continuam OFF. Não desligar o SMTP existente e prejudicar recuperação de contas por confundir os dois percursos.

## Próximo ato

1. Victor conclui as entradas privadas e a confirmação SMS; Central confere somente metadados e estado salvo, sem ler os valores.
2. Conferir a configuração fechada e preservar os bloqueios. Não abrir a compra para testar credencial ou fabricar uma cobrança.
3. Revisar a rotina financeira e o plano de abertura. Comandos de cancelamento/estorno e eventos SUBSCRIPTION_* não estão automatizados no pacote.
4. A primeira contratação válida, quando autorizada, comprovará pagamento, chegada dos dois e-mails e acesso do novo comprador. Essa prova segue pendente; Victor dispensou cobrança artificial.

Evidências privadas sem novas credenciais: C:/Users/victo/.codex/private-backups/v2g/2026-11-17-conexoes-oficiais. A publicação fechada anterior segue documentada em [checkpoint próprio](./n26-comercial-oficial-publicado-fechado-17-11.md).
