-- RevOps V0: espinha comercial anterior a compra.
--
-- Esta migration e aditiva. Ela NAO recria leads_lp, commercial_orders,
-- commercial_events, businesses ou entrevistas. Tambem nao tenta conciliar
-- pessoas por nome, telefone ou e-mail. Todo vinculo com registros existentes
-- e explicito, opcional e preserva quem o registrou.

create table public.revops_people (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 160),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.revops_prospect_organizations (
  id uuid primary key default gen_random_uuid(),
  declared_name text not null check (char_length(btrim(declared_name)) between 2 and 200),
  document_number text check (document_number is null or char_length(document_number) <= 40),
  instagram_diagnostic text not null default 'not_assessed' check (
    instagram_diagnostic in ('not_assessed', 'guidance_needed', 'adequate')
  ),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.revops_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.revops_prospect_organizations(id) on delete restrict,
  population text not null default 'v2g_commercial' check (population = 'v2g_commercial'),
  stage text not null default 'interested' check (stage in (
    'interested', 'qualification', 'meeting', 'proposal', 'decision',
    'purchase_reported', 'won_verified', 'lost', 'postponed'
  )),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  next_step text check (next_step is null or char_length(next_step) <= 500),
  next_step_due_at timestamptz,
  unknown_state text check (unknown_state is null or char_length(unknown_state) <= 500),
  lead_lp_id bigint references public.leads_lp(id) on delete set null,
  commercial_order_id uuid references public.commercial_orders(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  linked_at timestamptz,
  linked_by uuid references public.profiles(id) on delete set null,
  link_evidence text check (link_evidence is null or char_length(link_evidence) <= 1000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint revops_links_have_proof check (
    (lead_lp_id is null and commercial_order_id is null and business_id is null)
    or (linked_at is not null and linked_by is not null and link_evidence is not null)
  )
);

create table public.revops_opportunity_people (
  opportunity_id uuid not null references public.revops_opportunities(id) on delete cascade,
  person_id uuid not null references public.revops_people(id) on delete restrict,
  relationship text not null default 'contact' check (
    relationship in ('contact', 'decision_maker', 'partner', 'participant', 'other')
  ),
  created_at timestamptz not null default now(),
  primary key (opportunity_id, person_id)
);

create table public.revops_source_references (
  id uuid primary key default gen_random_uuid(),
  source_system text not null check (source_system in (
    'manual', 'lp', 'instagram', 'whatsapp', 'meet', 'referral',
    'commercial_order', 'webapp', 'other'
  )),
  source_external_id text not null check (char_length(btrim(source_external_id)) between 1 and 300),
  channel text not null check (channel in (
    'lp', 'instagram', 'whatsapp', 'referral', 'meet', 'phone', 'email', 'webapp', 'other'
  )),
  source_author text check (source_author is null or char_length(source_author) <= 200),
  source_uri text check (source_uri is null or char_length(source_uri) <= 1000),
  content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  captured_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  unique (source_system, source_external_id)
);

create table public.revops_interactions (
  id uuid primary key default gen_random_uuid(),
  source_reference_id uuid not null unique references public.revops_source_references(id) on delete restrict,
  interaction_type text not null check (interaction_type in (
    'interest_registered', 'message', 'meeting_scheduled', 'meeting_held',
    'proposal_sent', 'proposal_liked', 'purchase_reported',
    'payment_approved', 'campaign_live', 'diagnosis', 'guidance', 'other'
  )),
  evidence_kind text not null check (evidence_kind in ('source_fact', 'human_report', 'inference')),
  summary text not null check (char_length(btrim(summary)) between 2 and 2000),
  transcript_status text not null default 'not_applicable' check (
    transcript_status in ('not_applicable', 'pending', 'available', 'unavailable')
  ),
  human_review_status text not null default 'not_applicable' check (
    human_review_status in ('not_applicable', 'pending', 'confirmed', 'rejected')
  ),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint revops_meeting_transcript_state check (
    interaction_type <> 'meeting_held' or transcript_status <> 'not_applicable'
  ),
  constraint revops_inference_requires_review check (
    (evidence_kind = 'inference' and human_review_status <> 'not_applicable')
    or (evidence_kind <> 'inference' and human_review_status = 'not_applicable')
  )
);

create table public.revops_interaction_opportunities (
  interaction_id uuid not null references public.revops_interactions(id) on delete cascade,
  opportunity_id uuid not null references public.revops_opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (interaction_id, opportunity_id)
);

create index revops_opportunities_stage_idx
  on public.revops_opportunities(stage, created_at desc);
create index revops_opportunities_owner_idx
  on public.revops_opportunities(owner_profile_id, created_at desc);
create index revops_interactions_occurred_idx
  on public.revops_interactions(occurred_at desc);
create index revops_interaction_opportunities_opportunity_idx
  on public.revops_interaction_opportunities(opportunity_id, interaction_id);

alter table public.revops_people enable row level security;
alter table public.revops_prospect_organizations enable row level security;
alter table public.revops_opportunities enable row level security;
alter table public.revops_opportunity_people enable row level security;
alter table public.revops_source_references enable row level security;
alter table public.revops_interactions enable row level security;
alter table public.revops_interaction_opportunities enable row level security;

-- Fechado por padrao. A aplicacao usa service_role somente depois de validar
-- a autorizacao assinada `app_metadata.autorizacoes` contendo `revops`.
revoke all on table public.revops_people from public, anon, authenticated;
revoke all on table public.revops_prospect_organizations from public, anon, authenticated;
revoke all on table public.revops_opportunities from public, anon, authenticated;
revoke all on table public.revops_opportunity_people from public, anon, authenticated;
revoke all on table public.revops_source_references from public, anon, authenticated;
revoke all on table public.revops_interactions from public, anon, authenticated;
revoke all on table public.revops_interaction_opportunities from public, anon, authenticated;

grant select, insert, update, delete on table public.revops_people to service_role;
grant select, insert, update, delete on table public.revops_prospect_organizations to service_role;
grant select, insert, update, delete on table public.revops_opportunities to service_role;
grant select, insert, update, delete on table public.revops_opportunity_people to service_role;
grant select, insert, update, delete on table public.revops_source_references to service_role;
grant select, insert, update, delete on table public.revops_interactions to service_role;
grant select, insert, update, delete on table public.revops_interaction_opportunities to service_role;

create or replace function public.revops_register_interest(
  p_source_external_id text,
  p_person_name text,
  p_person_email text,
  p_person_phone text,
  p_organization_name text,
  p_channel text,
  p_evidence_kind text,
  p_summary text,
  p_occurred_at timestamptz,
  p_next_step text,
  p_instagram_diagnostic text,
  p_actor_profile_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source_id uuid;
  v_existing_opportunity_id uuid;
  v_person_id uuid;
  v_organization_id uuid;
  v_opportunity_id uuid;
  v_interaction_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('revops:manual:' || p_source_external_id, 0));

  select s.id into v_source_id
    from public.revops_source_references s
   where s.source_system = 'manual' and s.source_external_id = p_source_external_id;

  if v_source_id is not null then
    select io.opportunity_id into v_existing_opportunity_id
      from public.revops_interactions i
      join public.revops_interaction_opportunities io on io.interaction_id = i.id
     where i.source_reference_id = v_source_id
     limit 1;
    if v_existing_opportunity_id is not null then
      return v_existing_opportunity_id;
    end if;
  end if;

  insert into public.revops_people(display_name, email, phone, created_by)
  values (btrim(p_person_name), nullif(lower(btrim(p_person_email)), ''),
    nullif(btrim(p_person_phone), ''), p_actor_profile_id)
  returning id into v_person_id;

  insert into public.revops_prospect_organizations(
    declared_name, instagram_diagnostic, created_by
  ) values (btrim(p_organization_name), p_instagram_diagnostic, p_actor_profile_id)
  returning id into v_organization_id;

  insert into public.revops_opportunities(
    organization_id, next_step, unknown_state, created_by
  ) values (
    v_organization_id, nullif(btrim(p_next_step), ''),
    case when nullif(btrim(p_next_step), '') is null then 'proximo_passo_nao_informado' else null end,
    p_actor_profile_id
  ) returning id into v_opportunity_id;

  insert into public.revops_opportunity_people(opportunity_id, person_id, relationship)
  values (v_opportunity_id, v_person_id, 'contact');

  if v_source_id is null then
    insert into public.revops_source_references(
      source_system, source_external_id, channel, source_author,
      occurred_at, created_by
    ) values (
      'manual', p_source_external_id, p_channel, 'registro interno',
      p_occurred_at, p_actor_profile_id
    ) returning id into v_source_id;
  end if;

  insert into public.revops_interactions(
    source_reference_id, interaction_type, evidence_kind, summary,
    human_review_status, recorded_by, occurred_at
  ) values (
    v_source_id, 'interest_registered', p_evidence_kind, btrim(p_summary),
    case when p_evidence_kind = 'inference' then 'pending' else 'not_applicable' end,
    p_actor_profile_id, p_occurred_at
  ) returning id into v_interaction_id;

  insert into public.revops_interaction_opportunities(interaction_id, opportunity_id)
  values (v_interaction_id, v_opportunity_id);

  return v_opportunity_id;
end;
$$;

create or replace function public.revops_register_interaction(
  p_opportunity_id uuid,
  p_source_system text,
  p_source_external_id text,
  p_channel text,
  p_source_author text,
  p_interaction_type text,
  p_evidence_kind text,
  p_summary text,
  p_occurred_at timestamptz,
  p_transcript_status text,
  p_actor_profile_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source_id uuid;
  v_interaction_id uuid;
begin
  if p_interaction_type in ('payment_approved', 'campaign_live') then
    raise exception 'confirmacao_exige_fonte_verificavel';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'revops:' || p_source_system || ':' || p_source_external_id, 0
  ));

  if not exists (select 1 from public.revops_opportunities o where o.id = p_opportunity_id) then
    raise exception 'oportunidade_nao_encontrada';
  end if;

  select s.id into v_source_id
    from public.revops_source_references s
   where s.source_system = p_source_system
     and s.source_external_id = p_source_external_id;

  if v_source_id is not null then
    select i.id into v_interaction_id
      from public.revops_interactions i
     where i.source_reference_id = v_source_id;
    if v_interaction_id is not null then
      insert into public.revops_interaction_opportunities(interaction_id, opportunity_id)
      values (v_interaction_id, p_opportunity_id)
      on conflict do nothing;
      return v_interaction_id;
    end if;
  else
    insert into public.revops_source_references(
      source_system, source_external_id, channel, source_author,
      occurred_at, created_by
    ) values (
      p_source_system, p_source_external_id, p_channel,
      nullif(btrim(p_source_author), ''), p_occurred_at, p_actor_profile_id
    ) returning id into v_source_id;
  end if;

  insert into public.revops_interactions(
    source_reference_id, interaction_type, evidence_kind, summary,
    transcript_status, human_review_status, recorded_by, occurred_at
  ) values (
    v_source_id, p_interaction_type, p_evidence_kind, btrim(p_summary),
    p_transcript_status,
    case when p_evidence_kind = 'inference' then 'pending' else 'not_applicable' end,
    p_actor_profile_id, p_occurred_at
  ) returning id into v_interaction_id;

  insert into public.revops_interaction_opportunities(interaction_id, opportunity_id)
  values (v_interaction_id, p_opportunity_id);

  return v_interaction_id;
end;
$$;

revoke all on function public.revops_register_interest(
  text, text, text, text, text, text, text, text, timestamptz, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.revops_register_interest(
  text, text, text, text, text, text, text, text, timestamptz, text, text, uuid
) to service_role;

revoke all on function public.revops_register_interaction(
  uuid, text, text, text, text, text, text, text, timestamptz, text, uuid
) from public, anon, authenticated;
grant execute on function public.revops_register_interaction(
  uuid, text, text, text, text, text, text, text, timestamptz, text, uuid
) to service_role;

comment on table public.revops_opportunities is
  'Funil comercial da propria V2G. Nao contem contatos gerados pelos anuncios dos clientes.';
comment on column public.revops_prospect_organizations.instagram_diagnostic is
  'Diagnostico orientativo. guidance_needed nao veta compra.';
comment on column public.revops_interactions.evidence_kind is
  'Distingue fato preservado da fonte, relato humano e inferencia revisavel.';
