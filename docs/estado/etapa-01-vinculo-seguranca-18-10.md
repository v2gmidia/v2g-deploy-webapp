# Etapa 01 — vínculo LP → pedido e controles de segurança — 18/10/2026

## Estado confirmado

- Implementação somente local. Nenhuma migration foi aplicada, nenhuma flag foi ligada e nenhum deploy foi feito.
- A LP e o WebApp de produção compartilham o mesmo schema `public`; por isso o vínculo não precisa transportar dados pessoais por URL nem criar uma API intermediária.
- A cobrança de retorno do Asaas ficou agendada para segunda-feira, 19/10/2026, às 10h (Brasília). Ela só envia nova mensagem se não houver resposta substantiva no mesmo fio.

## Vínculo determinístico preparado

A migration `20261018130000_ligar_lead_lp_pedido.sql` acrescenta ao pedido:

- `source_system = v2g_site`;
- `source_lead_id`;
- snapshot de página de origem, UTMs e consentimento;
- índice único por `source_system + source_lead_id`;
- RPC transacional `registrar_pedido_pix_assistido_com_lead`.

A RPC recebe o ID do lead e confere no servidor:

1. existência da linha em `leads_lp`;
2. igualdade exata de CNPJ;
3. igualdade exata de e-mail normalizado;
4. igualdade exata de WhatsApp normalizado;
5. declaração de venda por WhatsApp;
6. ausência de outro pedido para o mesmo lead.

Reenvio com os mesmos dados devolve o pedido existente. Reenvio divergente falha. Na primeira conversão, a mesma transação cria as unidades e o evento `lead_convertido_em_pedido`. As telas `/pedidos` e `/gestor/compras` passam a mostrar ID do lead, origem, UTMs e data do consentimento quando a flag estiver ligada.

## Segurança preparada

A migration `20261018133000_checkout_security_controls.sql` cria rate limit atômico por uma hora para criação de pedido e tentativa de pagamento. A tabela persiste somente HMACs de IP e contato, nunca IP ou e-mail puros, fica sob RLS e sem grants para `anon`/`authenticated`.

O código acrescenta, atrás de `V2G_CHECKOUT_SECURITY_ENABLED`:

- Turnstile no formulário e validação obrigatória no servidor;
- conferência de `action=checkout` e allowlist de hostname;
- token de uso único validado pelo Siteverify;
- IP aceito somente quando a requisição traz as marcas do proxy da Vercel;
- segredo HMAC próprio, sem reutilizar chave do Supabase, Asaas ou Turnstile;
- limite agregado entre pedidos, além das três tentativas de cartão que já existiam por pedido.

## Ordem segura para ativar — depende de autorização de Victor

1. Escolher primeiro o Supabase QA e confirmar que ele contém `leads_lp` com CNPJ e as migrations anteriores de checkout.
2. Fazer backup e comparar o ledger do QA com os arquivos locais.
3. Aplicar no QA as duas migrations desta entrega.
4. Rodar teste SQL com rollback para unicidade, divergência de contato, idempotência, evento e grants.
5. Criar widget Turnstile exclusivo para QA, restrito ao hostname de QA.
6. Criar um segredo HMAC aleatório exclusivo e configurar os nomes de variáveis documentados em `.env.example`.
7. Ligar primeiro `V2G_LEAD_ORDER_LINK_ENABLED`, depois `V2G_CHECKOUT_SECURITY_ENABLED`, somente no QA.
8. Publicar o QA apenas com autorização separada.
9. Criar novo lead fictício pela LP/fixture controlada, convertê-lo em `/pedidos` e verificar o mesmo `source_lead_id` no pedido e no evento.
10. Reenviar exatamente os mesmos dados e provar que o ID do pedido não muda; alterar CNPJ ou contato e provar que falha.
11. Conferir `/gestor/compras`, UTMs, consentimento, rate limit e token Turnstile expirado/reutilizado.
12. Só depois desenhar uma ativação de produção separada; não copiar chaves de QA.

## Ciclo financeiro — o que precisa de Victor

Para fechar as provas ainda abertas sem dinheiro real:

1. estar junto numa janela no Asaas Sandbox para as ações críticas e eventual 2FA;
2. confirmar autorização específica para criar uma nova cobrança fictícia e executar um estorno no Sandbox;
3. disponibilizar ou criar uma segunda conta Sandbox com saldo fictício para pagar Pix, se o cenário exigir pagador separado;
4. decidir se a renovação precisa ser observada naturalmente na data ou se a simulação oficial basta como prova complementar;
5. autorizar abertura de chamado de chargeback no Sandbox se o painel não oferecer simulação direta.

Não usar cartão real, conta real, CNPJ real de terceiro ou dinheiro de produção. Criação de cobrança, estorno e contestação serão confirmados no momento antes da ação externa.

## Verificações locais deste lote

- `pnpm typecheck`: passou.
- `pnpm conferir:vinculo-lead-pedido`: 4/4.
- `pnpm conferir:seguranca-checkout`: 4/4.
- `pnpm conferir:contratacao`: 4/4.
- `pnpm conferir:checkout-api`: 7/7.

Esses verdes provam contrato local e ausência de erro de tipos. Não provam migrations aplicadas, RLS/grants reais, Turnstile configurado, criação de lead, pedido no banco, pagamento, estorno, renovação, chargeback ou produção.

