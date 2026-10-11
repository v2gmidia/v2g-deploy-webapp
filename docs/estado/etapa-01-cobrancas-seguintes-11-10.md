# Etapa 01 — WebApp, LP e eventos financeiros — 11/10/2026

## 0. O que ainda impede fechar a etapa

- O Supabase de QA foi reativado com autorização de Victor. Para respeitar o limite de dois projetos gratuitos, `v2g-finance` foi pausado; `V2G-SITE` permaneceu ativo e intocado. O checkout por API só aceita Asaas Sandbox com banco isolado (`lib/contratacao/ambiente-checkout.ts`); não foi apontado ao banco real nem liberado publicamente. A página local `/contratar` abriu, mas nenhum pedido foi criado nesta rodada.
- O e-mail de confirmação, clique, login, vínculo do pedido aprovado e troca entre dois CNPJs ainda precisam de uma sessão e de persistência verificáveis. A caixa autorizada por Victor é `victor.cabral@v2gmidia.com.br`, mas não foi disparado novo cadastro no banco real.
- A migration `20261011140000_eventos_financeiros_sandbox.sql` foi aplicada **somente ao QA**, depois da reconciliação do ledger, sob a entrada `20261011141908_qa_eventos_financeiros_sandbox`. A gravação foi testada em transação revertida; a tela de operador e o webhook ainda não foram verificados com sessão autenticada ou evento real.
- 3DS é a autenticação adicional do cartão pelo banco emissor. O guia atual do Asaas lista 3DS para cobranças avulsas e parcelamentos, mediante habilitação na conta de produção; não comprova suporte no endpoint de criação da assinatura mensal usado pela V2G. A mensagem geral de aprovação da conta não substitui essa confirmação.

## Evidência observada

- A LP pública `https://www.v2gmidia.com.br/` abriu no navegador. O formulário é **pré-cadastro**: nome, WhatsApp, e-mail, negócio, ramo, Instagram, respostas comerciais e consentimento. Não pede CNPJ e não direciona a `/contratar`. Portanto, a LP publicada registra interesse, mas a passagem lead → pedido → compra ainda não foi comprovada.
- O WebApp local abriu `/entrar?modo=cadastro` com nome, WhatsApp, e-mail, CNPJ, senha forte e repetição. `/contratar` também renderizou formulário e preços no servidor local. Renderizar a página não prova gravação, e-mail ou cobrança.
- Ensaios anteriores já provaram no Asaas Sandbox Pix, cartão anual e primeira mensalidade por webhook; ver `auditoria-sem-repeticao-09-10.md`. Não foram repetidos.

## Código local desta rodada

- `lib/contratacao/evento-financeiro.ts` normaliza eventos de novas cobranças, atrasos, recusas, estornos e chargebacks, sem convertê-los em pagamento aprovado.
- `app/api/webhooks/asaas-payment/route.ts` continua aprovando somente a primeira compra validada. Os demais eventos passam a exigir gravação idempotente própria; uma cobrança seguinte não aprova outra compra e estorno não apaga automaticamente o acesso.
- A nova migration cria um registro por evento do Asaas, compara pedido, pagador, valor, assinatura, cobrança e vencimento, e rejeita repetição com conteúdo divergente.
- A fila interna `/gestor/compras` mostra ocorrência financeira registrada e aviso se sua consulta falhar ou vier parcial. O gestor deve conferir no Asaas antes de decidir; não há pausa de campanha nem emissão de nota.

## Verificação e limite

- `pnpm conferir:checkout-api`: 6/6, incluindo normalização de mensalidade seguinte, estorno e chargeback.
- `pnpm typecheck` e `pnpm build` passaram, com desenvolvimento parado durante o build. `git diff --check` não apontou erro de espaço.
- No QA, a RPC aceitou uma mensalidade seguinte sintética, repetição idêntica, rejeitou o mesmo ID com tipo alterado e rejeitou valor divergente. O teste foi revertido; a tabela permaneceu com zero eventos. `anon` e `authenticated` não podem ler a tabela nem chamar a RPC; `service_role` pode chamá-la.
- Não houve webhook real, segunda cobrança real, estorno real ou desafio 3DS. Código e banco QA estão preparados, não integração concluída.
- Nenhum commit, push, deploy, cobrança real ou migration no banco de produção foi feito.

## Fontes atuais

- Asaas: `https://docs.asaas.com/docs/assinaturas` e `https://docs.asaas.com/docs/webhook-para-cobrancas` (cobrança e evento próprios por ciclo; estorno e chargeback).
- Asaas: `https://docs.asaas.com/docs/criar-cobran%C3%A7a-com-3ds` (fluxo 3DS, rotas listadas e habilitação em produção).
