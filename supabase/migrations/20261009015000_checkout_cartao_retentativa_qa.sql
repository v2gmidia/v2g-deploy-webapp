-- Limita as tentativas de cartao no checkout por API. Aplicar apenas ao QA
-- nesta etapa; a rota de compra continua desabilitada em producao.
alter table public.commercial_orders
  add column payment_attempt_count integer not null default 0
    check (payment_attempt_count between 0 and 3);
