# Webhook de pagamento no QA — 27/10/2026

## Incidente observado

- A cobrança mensal fictícia de R$ 500 do Sandbox foi confirmada pelo Asaas, mas o pedido correspondente permaneceu `awaiting_payment` no Supabase QA. A tela de pagamento mostrava espera.
- O webhook `V2G WebApp QA pagamentos` recebeu HTTP 401 entre 19:06 e 19:16 BRT. O handler responde 401 quando o cabeçalho `asaas-access-token` não confere com `ASAAS_WEBHOOK_TOKEN` ou quando a variável está ausente/curta (`app/api/webhooks/asaas-payment/route.ts`). Os logs não permitem distinguir qual lado estava desatualizado; a causa medida é falha de autenticação entre emissor e receptor.
- O token foi substituído por um novo valor privado na configuração **Sandbox** desse webhook e no projeto **Vercel QA**. O deployment QA `CFGncee6fxZ6Tv2oTu2NPTAEL7Dv`, fonte `15a0e9a`, ficou `Ready` e recebeu o domínio `v2g-webapp-qa.vercel.app`. Nenhum segredo foi registrado neste documento.
- Às 19:26 BRT, o Asaas fez novas entregas automaticamente com HTTP 200, incluindo `PAYMENT_CONFIRMED`. Não houve reenvio manual nem nova cobrança. A configuração ativa passou a zero eventos penalizados. O webhook temporário antigo permanece interrompido e não foi alterado.
- Leitura do Supabase QA: pedido `01da0460-f12a-4c24-b1dc-ab03ed41a68f` em `payment_approved`, com negócio e assinatura vinculados; ledger contém `PAYMENT_CONFIRMED`. A página de pagamento, após recarga, mostrou “Pagamento confirmado pelo Asaas. Você já pode criar seu acesso”. A outbox de e-mail tem um registro `accepted`; aceitação pelo transporte não comprova recebimento na caixa.
- O primeiro acesso para `v2g.midia@gmail.com` ainda exige cadastro pelo titular. A existência do negócio e a tela de pagamento não provam login nem isolamento do negócio em sessão autenticada.

## Portão para usar cobrança real

1. Criar **token exclusivo de produção** no webhook Asaas real e na variável do projeto WebApp de produção. Nunca copiar o token do QA, nem mostrar o valor em log ou chat.
2. Conferir ambiente, projeto, URL HTTPS, eventos de cobrança e versão publicada. Alteração de variável na Vercel só passa a valer após novo deployment. Não habilitar checkout real antes disso.
3. Com uma cobrança de validação real e autorização específica, comprovar no Asaas evento confirmado com HTTP 200, no banco o mesmo pedido/valor/negócio, e na interface o estado aprovado. Conferir repetição idempotente sem segunda aprovação ou assinatura.
4. Monitorar eventos penalizados/fila interrompida e pedidos `awaiting_payment` com cobrança confirmada no Asaas. Alerta e conciliação precisam de responsável e prazo definidos; não orientar nova tentativa de pagamento enquanto houver divergência.
5. Provar primeiro acesso no negócio certo, e-mail efetivamente recebido e recuperação diante de falha de webhook. A prova do Sandbox não autoriza produção automaticamente.

**Estado:** o incidente específico do QA foi recuperado. A prevenção e conciliação automáticas de produção ainda não foram implementadas; produção permanece fora deste ensaio.
