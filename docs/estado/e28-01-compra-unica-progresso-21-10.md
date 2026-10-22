# Compra única com contato da LP corrigido

Data: 21/10/2026. Victor autorizou atacar contato/alerta da LP, checkout QA, confirmação por e-mail e preparação da abertura real. A alteração implementada neste bloco é local; compra fictícia e envio real aguardam a autorização específica apresentada no chat.

**Atualização posterior:** Victor confirmou a existência de desconto semestral e anual à vista e autorizou o ensaio financeiro específico. Uma cobrança fictícia de R$ 500 foi aprovada, a assinatura foi cancelada e o estorno terminou como DONE no Asaas e chegou ao QA. O envio por e-mail não está configurado no projeto QA. Ver `e28-01-compra-unica-ensaio-sandbox-21-10.md`; os limites e pendências abaixo descrevem o bloco anterior.

## 0. O que depende de Victor

- Autorizar o novo ensaio Sandbox de uma primeira cobrança mensal fictícia de R$ 500, cancelamento e solicitação de estorno ao final, com confirmação de teste exclusivamente para seu e-mail empresarial. Não confundir a aprovação do plano com autorização financeira de valor não especificado.
- Fazer push das mudanças locais quando o pacote estiver revisado. Publicação, configuração externa e produção exigem aprovação separada; nada disso ocorreu neste bloco.
- A liberação de clientes atuais fica adiada por decisão explícita posterior de Victor. Não criar usuários, convites, pedidos nem pagamentos artificiais para resolver essa questão agora.

## 1. Formulário e WhatsApp

O handler `../lp/api/pre-cadastro.js` passou a usar o WhatsApp pessoal aprovado e chamar `alertarNovoLead` somente depois de persistência bem-sucedida, fora da simulação. Honeypot, dados inválidos e gravação recusada não enviam alerta. Exceção ou pendência do e-mail preserva o sucesso do formulário e o botão de contato; nenhum dado do interessado ou estado interno de transporte é devolvido na resposta pública.

O módulo novo `../lp/api/_alerta-lead.js` usa destinatário fixo `victor.cabral@v2gmidia.com.br`, envio em texto e configuração por `LEADS_ALERT_EMAIL_ENABLED`, `LEADS_ALERT_FROM`, `LEADS_ALERT_RESEND_API_KEY` e `IP_HASH_SALT`. Por padrão está desativado. O envio é limitado a uma tentativa com timeout de cinco segundos. A referência HMAC não expõe contato na chave de idempotência ou no log de reconciliação.

O alerta não é fila durável. Aceite da API não comprova entrega, e falhas exigem reconciliar os leads persistidos. Repetição do mesmo payload usa a mesma chave; o prazo de deduplicação do provedor é limitado, não uma garantia permanente. Referência oficial: https://resend.com/blog/engineering-idempotency-keys . Nenhum segredo foi lido ou gravado; nenhuma mensagem real foi enviada.

O script carregado da LP, `assets/lp.v6.js`, agora aceita o mesmo destino pessoal retornado pelo servidor. `index.html` referencia o asset com revisão de contato na URL para evitar o conteúdo anterior sob cache imutável. Não houve reformulação visual, mudança de página legal ou novo botão público de pagamento Sandbox.

## 2. Checkout QA e limpeza do papel temporário

Projeto confirmado pelo conector: `v2g-webapp-qa`, ref `zskpijnqgkqwxksqmzmf`. Nenhuma operação em produção.

O papel temporário de operador da conta QA04 foi retirado sob autorização anterior de retirada ao encerrar o ensaio. O backup original permanece privado em `C:/Users/victo/v2g-backups/qa-operator-temporary-20261021.json`. Conferido que o backup não possuía a chave `papel`; update restrito ao ID/e-mail originais e ao papel atual `operador`, removendo só essa chave. Resultado: uma retirada; leitura posterior: uma conta QA04, zero com `papel`. Os demais metadados foram preservados.

Pela aba Chrome antes indicada por Victor, o Início abriu sem opção de gestor e `https://v2g-webapp-qa.vercel.app/contratar` mostrou o formulário de compra com e-mail da sessão, mensal de R$ 500 e seleção de cartão. Não houve preenchimento ou submissão de pedido neste bloco. Contagem QA: 20 pedidos; outbox: zero mensagens, zero aceitas e zero pendentes.

Isso verifica a entrada autenticada no checkout, não confirmação financeira, recebimento de e-mail ou isolamento pós-compra. O próximo passo do ensaio exige autorização financeira própria e pode depender de CAPTCHA/autenticação a cargo de Victor. Não resolver CAPTCHA automaticamente.

## 3. Divergências para resolver antes da abertura real

- A divergência histórica sobre existência do desconto semestral foi resolvida pela confirmação posterior de Victor: há desconto semestral e anual à vista. Código permanece com 5% e 12%, respectivamente; não houve alteração de preço ou SQL.
- Pix aparece apenas para planos à vista. Mensal é cartão; não afirmar que já existe Pix mensal recorrente automático.
- A página e os adaptadores atuais são exclusivos QA/Sandbox. Preparar produção exige separar configuração/provedor reais e revisar guards, sem simplesmente desativar o bloqueio existente.

## 4. Preparação da abertura real

Ordem proposta para um bloco futuro de implementação e publicação especificamente autorizado:

1. Conciliar os planos ofertados, validação de servidor e preços do banco com a decisão comercial; conferir ledger antes de propor qualquer migration.
2. Validar o percurso QA pago com replay sem duplicação, liberação só após confirmação canônica, comprador sem papel interno e seleção do negócio correto. Tratar cancelamento, estorno e recorrência separadamente.
3. Comprovar recebimento das mensagens de teste, não apenas aceite da API. Não expor destino fixo QA como envio para cliente real.
4. Preparar configuração real do Asaas e webhooks, verificação de segurança, remetente/destinatário, política de conciliação e desligamento seguro. Não copiar segredos nem configuração QA para produção.
5. Só após essa revisão, adicionar à LP entradas distintas de comprar e conversar. O link enviado após atendimento aponta para a mesma página de contratação; formulário não vira compra nem acesso por si só.
6. Manter contrato, assinatura e emissão fiscal com suas aprovações próprias. Confirmação de pagamento não substitui NFS-e; campanha continua dependendo dos preparativos e controles existentes.

## Testes deste bloco

Sem rede e sem leitura de `.env`: 50 testes em contato/alerta da LP, jornada comercial, e-mail, acesso, multiconta e assistido Asaas; mais 42 em checkout, segurança, estado público e cartão 3DS. Total: **92 passaram, zero falhas**. `pnpm typecheck` passou. O aviso Node sobre tipo de módulo não foi tratado com alteração global de package.json.

Novo teste `scripts/conferir-lp-alerta-contato.mjs`: flag desligada/simulação sem rede; destino fixo; chave estável; configuração inválida; timeout; sucesso do formulário com alerta pendente ou exceção; ausência de alerta para bot/erro; alinhamento do destino aceito pelo navegador com o servidor.

O cenário antes vermelho em `conferir-jornada-comercial-portas.mjs:90` passou com a correção do handler, sem mudar sua asserção. Testes locais não foram apresentados como ensaio HTTPS completo. Não executado build porque não era necessário ao recorte e existe ambiente local compartilhado.

## Arquivos e limites

Alterados na LP: `api/pre-cadastro.js`, `assets/lp.v6.js`, `index.html`; criado `api/_alerta-lead.js`. No WebApp: novo conferidor e registros de estado. Não alterados o checkout runtime, SQL, páginas legais, flags externas ou configuração de publicação. Sem commit, push, deploy, cobrança, envio real ou criação de acesso de cliente.
