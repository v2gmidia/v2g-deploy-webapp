-- MODELO psql. Nao executado. Nao envia email. Sempre termina em ROLLBACK.
-- Requer autorizacao individual, evidencia privada de aceite no provedor e
-- parametros: email_id, order_id, charge_id, expected_updated_at, provider_id,
-- actor_id (perfil operador validado), audit_ref (UUID da evidencia privada).
-- Evidencia deve confirmar chave payment-confirmation/<email_id>, destinatario
-- e payload originais. Nao usar ausencia em busca como prova de nao envio.
begin;
create temporary table conciliacao_email_alvo on commit drop as
select id, order_id from public.commercial_payment_email_outbox
where id=:'email_id'::uuid and order_id=:'order_id'::uuid
  and provider_charge_id=:'charge_id' and status in ('sending','review')
  and updated_at=:'expected_updated_at'::timestamptz
  and length(btrim(:'provider_id'))>0
  and exists(select 1 from public.profiles where id=:'actor_id'::uuid);
do $$ begin
  if (select count(*) from conciliacao_email_alvo) <> 1 then
    raise exception 'alvo_divergente_ou_ja_conciliado';
  end if;
end $$;
-- CAS novamente: uma corrida entre leitura e escrita aborta a transacao.
create temporary table conciliacao_email_alterado on commit drop as
with alterado as (
  update public.commercial_payment_email_outbox q
  set status='accepted', provider_message_id=:'provider_id', updated_at=now()
  from conciliacao_email_alvo a where q.id=a.id and q.status in ('sending','review')
    and q.updated_at=:'expected_updated_at'::timestamptz
  returning q.id, q.order_id
)
select * from alterado;
do $$ begin
  if (select count(*) from conciliacao_email_alterado) <> 1 then
    raise exception 'reserva_alterada_durante_conciliacao';
  end if;
end $$;
insert into public.commercial_events(order_id,source,external_event_id,event_type,actor_profile_id)
select order_id,'operator','email-reconciled:' || :'audit_ref',
  'email_payment_acceptance_reconciled',:'actor_id'::uuid from conciliacao_email_alterado;
-- Conferir exatamente uma linha alterada e evento antes de aprovar COMMIT
-- numa copia revisada. Este modelo nao e um comando de ativacao.
select q.id,q.status,q.provider_message_id from public.commercial_payment_email_outbox q
join conciliacao_email_alvo a on a.id=q.id;
rollback;
