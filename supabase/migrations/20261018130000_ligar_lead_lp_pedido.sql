-- Liga de forma deterministica o pre-cadastro da LP ao pedido assistido.
--
-- A LP e o WebApp compartilham o mesmo schema public em producao. O operador
-- informa o ID opaco do lead; a funcao confere CNPJ, e-mail e WhatsApp contra
-- a linha original antes de criar qualquer pedido. Nenhum vinculo e inferido
-- por semelhanca de contato.

alter table public.commercial_orders
  add column source_system text,
  add column source_lead_id bigint,
  add column source_lead_origin text,
  add column source_lead_utm_source text,
  add column source_lead_utm_medium text,
  add column source_lead_utm_campaign text,
  add column source_lead_utm_content text,
  add column source_lead_consent_at timestamptz,
  add column source_lead_consent_text text,
  add column source_lead_linked_at timestamptz;

alter table public.commercial_orders
  add constraint commercial_orders_source_pair_check check (
    (source_system is null and source_lead_id is null)
    or (source_system = 'v2g_site' and source_lead_id is not null and source_lead_id > 0)
  ),
  add constraint commercial_orders_source_snapshot_check check (
    source_lead_id is null or (
      source_lead_consent_at is not null
      and source_lead_consent_text is not null
      and length(btrim(source_lead_consent_text)) >= 10
      and source_lead_linked_at is not null
    )
  );

create unique index commercial_orders_one_order_per_source_lead
  on public.commercial_orders(source_system, source_lead_id)
  where source_system is not null and source_lead_id is not null;

create function public.registrar_pedido_pix_assistido_com_lead(
  p_ref text,
  p_source_lead_id bigint,
  p_email text,
  p_whatsapp text,
  p_legal_name text,
  p_cnpj text,
  p_unit_count integer,
  p_billing_period text,
  p_operator_id uuid
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_email text := lower(btrim(p_email));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_legal_name text := btrim(p_legal_name);
  v_lead public.leads_lp%rowtype;
  v_existing public.commercial_orders%rowtype;
  v_business_id uuid;
  v_order_id uuid;
  v_total integer;
begin
  if p_ref is null or p_ref !~ '^[0-9a-f-]{36}$' or p_operator_id is null then
    raise exception 'referencia_e_operador_obrigatorios';
  end if;
  if p_source_lead_id is null or p_source_lead_id <= 0 then
    raise exception 'lead_obrigatorio';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or length(v_email) > 254 or v_whatsapp !~ '^[1-9][0-9]{9,10}$' then
    raise exception 'contato_invalido';
  end if;
  if v_legal_name is null or length(v_legal_name) < 2 or length(v_legal_name) > 200
      or p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
      or p_unit_count is null or p_unit_count not between 1 and 100
      or p_billing_period not in ('monthly', 'annual_upfront') then
    raise exception 'dados_do_pedido_invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'commercial_order:v2g_site:' || p_source_lead_id::text, 0
  ));

  select * into v_lead from public.leads_lp where id = p_source_lead_id;
  if not found then raise exception 'lead_nao_encontrado'; end if;
  if v_lead.cnpj is null or v_lead.cnpj <> p_cnpj
      or lower(btrim(v_lead.email)) <> v_email
      or regexp_replace(v_lead.whatsapp, '[^0-9]', '', 'g') <> v_whatsapp then
    raise exception 'lead_e_pedido_divergem';
  end if;
  if not v_lead.vende_whatsapp then
    raise exception 'lead_fora_da_qualificacao_vende_whatsapp';
  end if;

  select * into v_existing from public.commercial_orders
   where source_system = 'v2g_site' and source_lead_id = p_source_lead_id;
  if found then
    if v_existing.buyer_email = v_email and v_existing.cnpj = p_cnpj
        and regexp_replace(coalesce(v_existing.buyer_whatsapp, ''), '[^0-9]', '', 'g') = v_whatsapp
        and v_existing.unit_count = p_unit_count
        and v_existing.billing_period = p_billing_period
        and v_existing.payment_method = 'direct_pix' then
      return v_existing.id;
    end if;
    raise exception 'lead_ja_convertido_com_dados_divergentes';
  end if;

  select business_id into v_business_id from public.commercial_orders
    where buyer_email = v_email and cnpj = p_cnpj and business_id is not null
      and status = 'payment_approved'
    order by created_at desc limit 1;
  if v_business_id is null then
    insert into public.businesses(name, claim_email)
      values (v_legal_name, v_email) returning id into v_business_id;
  end if;

  v_total := p_unit_count * case p_billing_period
    when 'monthly' then 50000 else 528000 end;
  insert into public.commercial_orders(
    external_ref, buyer_email, buyer_whatsapp, business_id, legal_name, cnpj,
    declares_cnpj, sells_by_whatsapp, origin, payment_method,
    billing_period, unit_price_cents, discount_percent, unit_count,
    total_cents, status, source_system, source_lead_id, source_lead_origin,
    source_lead_utm_source, source_lead_utm_medium, source_lead_utm_campaign,
    source_lead_utm_content, source_lead_consent_at, source_lead_consent_text,
    source_lead_linked_at
  ) values (
    p_ref, v_email, v_whatsapp, v_business_id, v_legal_name, p_cnpj,
    true, v_lead.vende_whatsapp, 'assisted', 'direct_pix', p_billing_period,
    50000, case p_billing_period when 'monthly' then 0 else 12 end,
    p_unit_count, v_total, 'awaiting_payment', 'v2g_site', v_lead.id,
    v_lead.pagina_origem, v_lead.utm_source, v_lead.utm_medium,
    v_lead.utm_campaign, v_lead.utm_content, v_lead.consentimento_em,
    v_lead.consentimento_texto, now()
  ) returning id into v_order_id;

  insert into public.commercial_order_units(order_id, ordinal)
    select v_order_id, generate_series(1, p_unit_count);

  insert into public.commercial_events(
    order_id, source, external_event_id, event_type, actor_profile_id
  ) values (
    v_order_id, 'operator',
    'lead-converted:v2g_site:' || v_lead.id::text,
    'lead_convertido_em_pedido', p_operator_id
  );

  return v_order_id;
end;
$$;

revoke execute on function public.registrar_pedido_pix_assistido_com_lead(
  text,bigint,text,text,text,text,integer,text,uuid
) from public, anon, authenticated;
grant execute on function public.registrar_pedido_pix_assistido_com_lead(
  text,bigint,text,text,text,text,integer,text,uuid
) to service_role;

