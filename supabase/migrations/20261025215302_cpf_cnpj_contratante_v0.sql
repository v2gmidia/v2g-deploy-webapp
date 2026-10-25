-- LOCAL / NAO APLICADA. Decisao humana 25/10/2026: CPF OU CNPJ do contratante.
-- Dependencias: cadeia comercial ate assisted_asaas_orders, onboarding_reserva_unica
-- e manual_contract_evidence. Nenhuma alteracao em leads_lp, Auth, acesso ou titular do cartao.
-- O nome legado cnpj/claimed_cnpj/p_cnpj passa a transportar o documento do contratante.
-- Mantem numeros e IDs existentes. Tipo gerado STORED evita divergencia de tipo/numero.
-- Rollback: ROLLBACK da transacao em falha. Apos aceite de CPF, NAO restaurar codigo
-- CNPJ-only nem recriar indices antigos: preservar dados e fazer correcao aditiva.
-- Exige backup de funcoes/constraints/indices/ACL e conferencia individual antes de aplicar.
begin;

create or replace function public.documento_contratante_valido(p_documento text)
returns boolean language plpgsql immutable security invoker set search_path='' as $validador$
declare n integer; tamanho integer; pos integer; soma integer; peso integer; digito integer;
begin
  if p_documento is null or p_documento !~ '^([0-9]{11}|[0-9]{14})$'
    or p_documento ~ '^([0-9])\1+$' then return false; end if;
  n:=length(p_documento);
  for tamanho in (n-2)..(n-1) loop
    soma:=0;
    for pos in 1..tamanho loop
      peso:=case when n=11 then tamanho+2-pos else ((tamanho-pos)%8)+2 end;
      soma:=soma+substr(p_documento,pos,1)::integer*peso;
    end loop;
    if n=11 then
      digito:=(soma*10)%11;
      if digito=10 then digito:=0; end if;
    else
      digito:=case when soma%11<2 then 0 else 11-soma%11 end;
    end if;
    if substr(p_documento,tamanho+1,1)::integer<>digito then return false; end if;
  end loop;
  return true;
end;
$validador$;
revoke all on function public.documento_contratante_valido(text) from public,anon,authenticated;
grant execute on function public.documento_contratante_valido(text) to service_role;

-- Validar novos documentos, sem invalidar atualizacao nao documental de CNPJ legado.
create or replace function public.conferir_documento_contratante_gravado()
returns trigger language plpgsql security invoker set search_path='' as $trigger$
declare novo text; anterior text;
begin
  novo:=to_jsonb(new)->>TG_ARGV[0];
  if TG_OP='UPDATE' then
    anterior:=to_jsonb(old)->>TG_ARGV[0];
    if novo is not distinct from anterior then return new; end if;
  end if;
  if not public.documento_contratante_valido(novo) then raise exception 'documento_contratante_invalido'; end if;
  return new;
end;
$trigger$;
revoke all on function public.conferir_documento_contratante_gravado() from public,anon,authenticated;
grant execute on function public.conferir_documento_contratante_gravado() to service_role;

do $tabelas$
declare t text; coluna text; nome_check text; def text;
begin
  foreach t in array array['commercial_orders','onboarding_meetings','commercial_manual_evidence'] loop
    if to_regclass('public.'||t) is null then raise exception 'prerequisito_ausente: %',t; end if;
    coluna:=case when t='commercial_manual_evidence' then 'claimed_cnpj' else 'cnpj' end;
    nome_check:=t||'_'||coluna||'_check';
    select pg_get_constraintdef(oid) into def from pg_constraint
      where conrelid=to_regclass('public.'||t) and conname=nome_check;
    if def is null or def not in (
      format('CHECK ((%I ~ %L::text))',coluna,'^[0-9]{14}$'),
      format('CHECK ((%I ~ %L::text))',coluna,'^([0-9]{11}|[0-9]{14})$')
    ) then
      raise exception 'constraint_documental_divergente: %',t;
    end if;
    -- Substitui apenas a restricao de formato; nao remove tabela, coluna ou dado.
    execute format('alter table public.%I drop constraint %I',t,nome_check);
    execute format('alter table public.%I add constraint %I check (%I ~ %L)',t,nome_check,coluna,'^([0-9]{11}|[0-9]{14})$');
    execute format('alter table public.%I add column if not exists contractor_document_type text generated always as (case length(%I) when 11 then ''cpf'' when 14 then ''cnpj'' end) stored',t,coluna);
    execute format('comment on column public.%I.%I is %L',t,coluna,'CPF ou CNPJ do contratante, somente digitos; nome legado preservado. Tipo em contractor_document_type. Nao identifica o titular do cartao.');
    execute format('drop trigger if exists conferir_documento_contratante on public.%I',t);
    execute format('create trigger conferir_documento_contratante before insert or update of %I on public.%I for each row execute function public.conferir_documento_contratante_gravado(%L)',coluna,t,coluna);
  end loop;
end;
$tabelas$;

comment on column public.commercial_orders.declares_cnpj is
  'Confirmacao do documento informado pelo contratante (CPF ou CNPJ). Nome legado preservado; nao consulta cadastro.';

-- Documento nao e identidade de negocio. Referencia do pedido e source_lead_id
-- mantem suas unicidades; novas referencias criam negocios distintos.
drop index if exists public.commercial_orders_one_open_direct_pix;
drop index if exists public.commercial_orders_one_open_self_service;
drop index if exists public.commercial_orders_one_open_assisted_asaas;
create index if not exists commercial_orders_contratante_lookup
  on public.commercial_orders(lower(buyer_email),cnpj);
-- Mesmo CPF pode contratar para mais de um negocio; as travas por business_id,
-- calendario/horario e evento Google permanecem existentes.
drop index if exists public.onboarding_meetings_uma_ativa_por_cnpj;

-- Ajustes estreitos nas definicoes reais preservam variantes/ACL do ambiente.
-- Qualquer precondicao divergente aborta o lote; nao substitui RPC desconhecida.
do $rpcs$
declare assinatura text; fn regprocedure; def text; anterior text; merge_antes text;
begin
  foreach assinatura in array array[
    'public.registrar_pedido_pix_assistido(text,text,text,text,integer,text)',
    'public.registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)',
    'public.registrar_pedido_pix_assistido_com_lead(text,bigint,text,text,text,text,integer,text,uuid)',
    'public.registrar_pedido_asaas_assistido(text,bigint,text,text,text,text,text,integer,text,text,uuid)',
    'public.registrar_evidencia_manual(uuid,uuid,uuid,uuid,text,text,text,text,date,uuid)'
  ] loop
    fn:=to_regprocedure(assinatura);
    if fn is null then raise exception 'rpc_prerequisito_ausente: %',assinatura; end if;
    def:=pg_get_functiondef(fn);
    if position('cpf_cnpj_v0' in def)>0 then continue; end if;
    anterior:=def;
    def:=replace(def,$padrao$p_cnpj !~ '^[0-9]{14}$'$padrao$,'not public.documento_contratante_valido(p_cnpj)');
    if def=anterior then raise exception 'validacao_rpc_divergente: %',assinatura; end if;
    if assinatura like '%registrar_pedido_pix_assistido(%'
       or assinatura like '%registrar_pedido_self_service(%'
       or assinatura like '%registrar_pedido_pix_assistido_com_lead(%' then
      merge_antes:=def;
      def:=regexp_replace(def,
        $merge$select business_id into v_business_id from public\.commercial_orders[[:space:]]+where buyer_email = v_email and cnpj = p_cnpj and business_id is not null[[:space:]]+and status = 'payment_approved'[[:space:]]+order by created_at desc limit 1;[[:space:]]+if v_business_id is null then[[:space:]]+(insert into public\.businesses\(name, claim_email\)[[:space:]]+values \((v_name|v_legal_name), v_email\) returning id into v_business_id;)[[:space:]]+end if;$merge$,
        E'\\1');
      if def=merge_antes then raise exception 'fusao_legada_divergente: %',assinatura; end if;
      def:=replace(def,'-- Uma compra adicional do mesmo comprador/CNPJ usa o negócio existente.',
        '-- Nova referencia cria negocio distinto; documento nao funde negocios.');
    end if;
    -- Serialize retries da mesma referencia antes de procurar o pedido existente.
    def:=replace(def,'select * into v_existing from public.commercial_orders where external_ref = p_ref;',
      E'perform pg_advisory_xact_lock(hashtextextended(''commercial-order-ref:''||p_ref,0));\n  select * into v_existing from public.commercial_orders where external_ref = p_ref;');
    def:=regexp_replace(def,E'(\\mBEGIN\\M|\\mbegin\\M)',E'\\1\n  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.');
    execute def;
  end loop;
end;
$rpcs$;

-- ACL das RPCs e RLS das tabelas existentes nao sao ampliadas.
commit;
