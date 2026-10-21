-- SOMENTE LEITURA. Executar apenas em janela autorizada e apos confirmar schema.
-- Nao retorna payload, destinatario, texto, IP ou segredo.
begin read only;
select status, count(*) as quantidade, min(created_at) as mais_antigo
from public.commercial_payment_email_outbox group by status order by status;
select q.id, q.order_id, q.provider_charge_id, q.status, q.provider_message_id,
  q.created_at, q.updated_at, now() - q.updated_at as sem_atualizacao,
  o.status as estado_pedido,
  exists(select 1 from public.commercial_payment_events e
    where e.order_id=q.order_id and e.provider_charge_id=q.provider_charge_id
      and e.event_type in ('PAYMENT_REFUND_IN_PROGRESS','PAYMENT_PARTIALLY_REFUNDED',
      'PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL')) as ocorrencia_adversa
from public.commercial_payment_email_outbox q
join public.commercial_orders o on o.id=q.order_id
where q.status in ('queued','sending','review') order by q.created_at, q.id limit 100;
rollback;
