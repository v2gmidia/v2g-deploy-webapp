-- PENDENTE, NÃO EXECUTADO. Requer backup privado e aprovação específica da QA.
-- A futura sessão de implantação deve definir v2g.qa_project para o projeto QA
-- depois de verificar o destino. Sem essa confirmação explícita, este pacote para.
begin;
do $$
declare
  pai constant uuid := '9cb85308-02cc-4ce7-bacf-15be77f9ba5e';
  titular constant uuid := '09e25ab4-b55b-48d1-bfde-181e41192bb6';
  filho uuid;
  linha public.agency_advertisers%rowtype;
  em text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  if current_setting('v2g.qa_project', true) is distinct from 'zskpijnqgkqwxksqmzmf' then
    raise exception 'destino QA nao confirmado';
  end if;
  perform 1 from public.businesses where id = pai and profile_id = titular and name = 'Piligrin' for update;
  if not found then raise exception 'Piligrin ou titular divergem do pacote aprovado'; end if;

  -- Dúú conserva exatamente seu business_id histórico, arquivos, números e revisão.
  insert into public.agency_advertisers(agency_business_id, advertiser_business_id, owner_profile_id,
    advertiser_name, reference_key, legacy_shared_business, source)
  values(pai, pai, titular, 'Dúú Gomes', 'piligrin-duu', true,
    'Victor 10/11/2026: Piligrin contratante, Dúú anunciante; ponte de preservação do business histórico')
  on conflict (advertiser_business_id) do nothing;
  select * into strict linha from public.agency_advertisers where advertiser_business_id = pai;
  if linha.agency_business_id <> pai or linha.owner_profile_id <> titular or linha.reference_key <> 'piligrin-duu'
    or not linha.legacy_shared_business or linha.advertiser_name <> 'Dúú Gomes' or linha.revoked_at is not null then
    raise exception 'vinculo Duu existente diverge; nenhum dado sera sobrescrito';
  end if;

  select * into linha from public.agency_advertisers where agency_business_id = pai and reference_key = 'piligrin-famfire';
  if found then
    if linha.owner_profile_id <> titular or linha.advertiser_name <> 'FamFire'
      or linha.advertiser_business_id = pai or linha.revoked_at is not null then
      raise exception 'vinculo FamFire existente diverge; nenhum dado sera sobrescrito';
    end if;
  else
    -- Apenas identidade confirmada por Victor. Não copia nem inventa verba, geografia,
    -- logo, ramo, conta Meta, Página, gestor, peça, assinatura ou concessão de acesso.
    insert into public.businesses(profile_id, name, onboarding)
    values(titular, 'FamFire', jsonb_build_object('versao', 2, 'respostas', jsonb_build_object(
      '_contrato_operacional', 'cadastro_operacional.v2',
      'operador', jsonb_build_object('texto', 'Uma agência ou gestor opera para o anunciante', 'echo', 'Uma agência ou gestor opera para o anunciante', 'origem', 'texto', 'em', em),
      'contratante', jsonb_build_object('texto', 'Piligrin', 'echo', 'Piligrin', 'origem', 'texto', 'em', em),
      'nome', jsonb_build_object('texto', 'FamFire', 'echo', 'FamFire', 'origem', 'texto', 'em', em)
    ))) returning id into filho;
    insert into public.agency_advertisers(agency_business_id, advertiser_business_id, owner_profile_id,
      advertiser_name, reference_key, legacy_shared_business, source)
    values(pai, filho, titular, 'FamFire', 'piligrin-famfire', false,
      'Victor 10/11/2026: FamFire é anunciante da Piligrin; cadastro separado sem herança de dados do Dúú');
  end if;
end;
$$;
select agency_business_id, advertiser_business_id, advertiser_name, reference_key, legacy_shared_business
from public.agency_advertisers where agency_business_id = '9cb85308-02cc-4ce7-bacf-15be77f9ba5e' order by reference_key;
commit;
