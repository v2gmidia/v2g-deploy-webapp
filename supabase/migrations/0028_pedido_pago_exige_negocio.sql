-- Pedido aprovado precisa apontar para o negócio que será liberado.
alter table public.commercial_orders
  add constraint commercial_orders_paid_business_check
  check (status <> 'payment_approved' or business_id is not null);
