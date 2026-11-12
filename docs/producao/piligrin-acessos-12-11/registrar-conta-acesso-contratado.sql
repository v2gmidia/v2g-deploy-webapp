-- PROPOSTA LOCAL. Não aplicada. Complemento separado do pacote já aplicado.
-- Uma contratação histórica conferida e aceita habilita uma conta por anunciante.
-- Não cria pedido, pagamento, concessão, sessão, atribuição ou token Meta.
begin;
create function public.registrar_conta_acesso_contratado(
 p_access_id uuid,p_profile_id uuid,p_email text,p_business_id uuid,p_connection_id uuid,
 p_external_id text,p_name text,p_currency text,p_page_id text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare
 g public.historical_contract_access%rowtype;
 e public.commercial_manual_evidence%rowtype;
 b public.businesses%rowtype;
 c public.meta_connections%rowtype;
 account_id uuid;
begin
 if p_access_id is null or p_profile_id is null or p_business_id is null or p_connection_id is null
  or p_email is null or p_email<>lower(btrim(p_email)) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  or p_external_id is null or p_external_id !~ '^act_[0-9]{1,40}$'
  or p_page_id is null or p_page_id !~ '^[0-9]{1,40}$'
  or (p_currency is not null and p_currency !~ '^[A-Z]{3}$')
  or (p_name is not null and length(p_name)>200) then raise exception 'conta_historica_dados_invalidos'; end if;

 -- Evidence before business matches native review; business lock serializes
 -- registration with native acceptance/revocation, which also locks business.
 -- Re-read the grant AFTER taking that lock, without adding UPDATE privileges.
 select * into g from public.historical_contract_access where id=p_access_id;
 if not found then raise exception 'acesso_contratado_nao_autorizado'; end if;
 select * into e from public.commercial_manual_evidence where id=g.evidence_id for share;
 if not found then raise exception 'evidencia_contratacao_ausente'; end if;
 select * into b from public.businesses where id=p_business_id for update;
 if not found or b.profile_id is distinct from p_profile_id or b.claim_email is not null
 then raise exception 'negocio_contratado_divergente'; end if;
 select * into g from public.historical_contract_access where id=p_access_id;
 if not found or g.business_id is distinct from p_business_id or g.accepted_by is distinct from p_profile_id
   or g.accepted_at is null or g.accepted_at>now() or g.revoked_at is not null
   or g.recipient_email is distinct from p_email
   or e.business_id is distinct from p_business_id or e.status<>'checked'
   or e.source_system<>'historical_contract' or e.order_id is not null
   or e.reviewed_by is null or e.reviewed_at is null
   or e.claimed_email is distinct from p_email or e.claimed_cnpj is distinct from g.contractor_document
   or (e.proposed_profile_id is not null and e.proposed_profile_id<>p_profile_id)
 then raise exception 'acesso_contratado_nao_autorizado'; end if;

 -- Never bypass a real commercial order, including a cancelled/refunded history.
 if exists(select 1 from public.commercial_orders where business_id=p_business_id)
 then raise exception 'negocio_com_pedido_usar_fluxo_financeiro'; end if;
 select * into c from public.meta_connections where id=p_connection_id and business_id=p_business_id for update;
 if not found then raise exception 'conexao_nao_pertence_ao_negocio'; end if;
 if c.expires_at is not null and c.expires_at<=now() then raise exception 'conexao_expirada'; end if;
 if c.meta_page_id is not null and c.meta_page_id<>p_page_id then raise exception 'pagina_contratada_divergente'; end if;
 if exists(select 1 from public.ad_accounts where business_id=p_business_id and external_id<>p_external_id)
 then raise exception 'conta_historica_ja_definida'; end if;

 insert into public.ad_accounts(business_id,meta_connection_id,external_id,name,currency,ownership,status,is_active)
 values(p_business_id,p_connection_id,p_external_id,coalesce(nullif(btrim(p_name),''),p_external_id),p_currency,'cliente','ok',true)
 on conflict(business_id,external_id) do update set meta_connection_id=excluded.meta_connection_id,
  name=excluded.name,currency=excluded.currency,ownership='cliente',status='ok',is_active=true
 returning id into account_id;
 update public.meta_connections set meta_page_id=p_page_id where id=p_connection_id and business_id=p_business_id;
 return account_id;
end $$;
revoke all on function public.registrar_conta_acesso_contratado(uuid,uuid,text,uuid,uuid,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.registrar_conta_acesso_contratado(uuid,uuid,text,uuid,uuid,text,text,text,text) to service_role;
comment on function public.registrar_conta_acesso_contratado(uuid,uuid,text,uuid,uuid,text,text,text,text) is
 'Servidor autentica titular e valida ativos na Meta antes da chamada. Um anunciante histórico aceito, uma conta; não autoriza cobrança ou publicação.';
commit;
