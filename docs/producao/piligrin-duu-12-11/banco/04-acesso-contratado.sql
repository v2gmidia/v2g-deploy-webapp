-- LOCAL N26-05. Prerequisites: manual_contract_evidence + cpf_cnpj_contratante_v0.
-- No Auth users, commercial orders, payments or legacy exceptions are created.
begin;
-- Keep the existing profile trigger, but suppress its email-based business claim
-- for this signup flow. User-editable marker can only DENY automatic claims.
-- Guard the exact installed definition; unknown versions abort instead of replacing blindly.
do $guard$
declare f regprocedure:=to_regprocedure('private.handle_new_user()'); d text;
begin
 if f is null then raise exception 'prerequisito_handle_new_user_ausente'; end if;
 d:=pg_get_functiondef(f);
 if position('if new.email is not null then' in d)=0 then raise exception 'trigger_identidade_divergente'; end if;
 d:=replace(d,'if new.email is not null then',
   'if new.email is not null and (new.raw_user_meta_data ->> ''access_flow'') is distinct from ''historical_contract'' then');
 execute d;
end $guard$;
create table public.historical_contract_access (
 id uuid primary key,
 evidence_id uuid not null unique references public.commercial_manual_evidence(id) on delete restrict,
 business_id uuid not null references public.businesses(id) on delete restrict,
 previous_profile_id uuid references public.profiles(id),
 recipient_email text not null check(recipient_email=lower(btrim(recipient_email))),
 contractor_document text not null check(public.documento_contratante_valido(contractor_document)),
 contractor_document_type text generated always as
   (case length(contractor_document) when 11 then 'cpf' else 'cnpj' end) stored,
 issued_by uuid not null references public.profiles(id),
 issued_at timestamptz not null default now(),
 issue_note text not null check(length(btrim(issue_note)) between 5 and 1000),
 accept_before timestamptz not null default(now()+interval '7 days'),
 accepted_by uuid references public.profiles(id), accepted_at timestamptz,
 revoked_by uuid references public.profiles(id), revoked_at timestamptz, revoke_note text,
 check((accepted_by is null)=(accepted_at is null)),
 check((revoked_by is null and revoked_at is null and revoke_note is null)
   or (revoked_by is not null and revoked_at is not null and length(btrim(revoke_note)) between 5 and 1000))
);
create table public.historical_contract_access_events (
 id bigint generated always as identity primary key,
 access_id uuid not null references public.historical_contract_access(id),
 kind text not null check(kind in ('issued','accepted','revoked')),
 actor_id uuid not null references public.profiles(id),
 occurred_at timestamptz not null default now(),
 unique(access_id,kind)
);
alter table public.historical_contract_access enable row level security;
alter table public.historical_contract_access_events enable row level security;
revoke all on public.historical_contract_access,public.historical_contract_access_events from public,anon,authenticated,service_role;
grant select on public.historical_contract_access,public.historical_contract_access_events to service_role;
grant select on public.historical_contract_access to authenticated;
-- Only accepted grants of the authenticated owner are readable. No invitation enumeration.
create policy historical_access_owner_read on public.historical_contract_access for select to authenticated
 using(accepted_by=(select auth.uid()) and revoked_at is null
   and exists(select 1 from public.businesses b where b.id=business_id and b.profile_id=(select auth.uid())));

-- Service-only: web action independently authenticates operator. Database repeats role + wallet checks.
create function public.emitir_acesso_contratado(p_id uuid,p_evidence_id uuid,p_operator_id uuid,p_note text)
 returns uuid language plpgsql security definer set search_path='' as $$
declare e public.commercial_manual_evidence%rowtype; b public.businesses%rowtype;
 old public.historical_contract_access%rowtype;
begin
 if p_id is null or p_note is null or length(btrim(p_note)) not between 5 and 1000
   or not exists(select 1 from auth.users where id=p_operator_id and raw_app_meta_data->>'papel'='operador')
 then raise exception 'concessao_nao_autorizada'; end if;
 select * into e from public.commercial_manual_evidence where id=p_evidence_id for share;
 if not found or e.status<>'checked' or e.source_system<>'historical_contract' or e.order_id is not null
   or e.reviewed_by is null or not public.documento_contratante_valido(e.claimed_cnpj)
 then raise exception 'contratacao_nao_conferida'; end if;
 perform 1 from public.manager_accounts where business_id=e.business_id and operator_profile_id=p_operator_id for share;
 if not found then raise exception 'carteira_nao_autorizada'; end if;
 select * into b from public.businesses where id=e.business_id for update;
 if not found then raise exception 'negocio_indisponivel'; end if;
 select * into old from public.historical_contract_access where evidence_id=e.id;
 if found then
   if old.issue_note<>btrim(p_note) or old.issued_by<>p_operator_id or old.revoked_at is not null
   then raise exception 'reenvio_divergente'; end if;
   return old.id;
 end if;
 -- No claim_email: the existing signup trigger must not claim this business by email.
 if b.claim_email is not null or b.profile_id is distinct from e.proposed_profile_id
   or exists(select 1 from public.commercial_orders where business_id=b.id)
   or exists(select 1 from public.historical_contract_access where business_id=b.id and revoked_at is null)
 then raise exception 'vinculo_requer_conferencia'; end if;
 if e.proposed_profile_id is not null and not exists(select 1 from auth.users where id=e.proposed_profile_id
   and email_confirmed_at is not null and lower(btrim(email))=e.claimed_email)
 then raise exception 'perfil_divergente'; end if;
 insert into public.historical_contract_access(id,evidence_id,business_id,previous_profile_id,recipient_email,contractor_document,issued_by,issue_note)
 values(p_id,e.id,b.id,b.profile_id,e.claimed_email,e.claimed_cnpj,p_operator_id,btrim(p_note));
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(p_id,'issued',p_operator_id);
 return p_id;
end $$;

-- Authenticated acceptance of an EXPLICIT grant ID; never scans email/document for businesses.
create function public.aceitar_acesso_contratado(p_id uuid) returns boolean
 language plpgsql security definer set search_path='' as $$
declare g public.historical_contract_access%rowtype; b public.businesses%rowtype;
 e public.commercial_manual_evidence%rowtype; u uuid:=auth.uid(); mail text;
begin
 select lower(btrim(email)) into mail from auth.users where id=u and email_confirmed_at is not null;
 if u is null or mail is null then return false; end if;
 select * into g from public.historical_contract_access where id=p_id for update;
 if not found or g.revoked_at is not null or g.recipient_email<>mail
   or (g.accepted_by is null and g.accept_before<=now())
   or (g.accepted_by is not null and g.accepted_by<>u) then return false; end if;
 select * into e from public.commercial_manual_evidence where id=g.evidence_id for share;
 if not found or e.status<>'checked' or e.source_system<>'historical_contract' or e.order_id is not null
   or e.business_id<>g.business_id or e.claimed_email<>mail or e.claimed_cnpj<>g.contractor_document
   or (e.proposed_profile_id is not null and e.proposed_profile_id<>u) then return false; end if;
 select * into b from public.businesses where id=g.business_id for update;
 if not found or b.claim_email is not null or (b.profile_id is not null and b.profile_id<>u)
   or exists(select 1 from public.commercial_orders where business_id=b.id) then return false; end if;
 if g.accepted_by=u then return b.profile_id=u; end if;
 update public.businesses set profile_id=u where id=g.business_id and (profile_id is null or profile_id=u);
 update public.historical_contract_access set accepted_by=u,accepted_at=now() where id=g.id;
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(g.id,'accepted',u);
 return true;
end $$;

create function public.revogar_acesso_contratado(p_id uuid,p_operator_id uuid,p_note text) returns boolean
 language plpgsql security definer set search_path='' as $$
declare g public.historical_contract_access%rowtype;
begin
 if p_note is null or length(btrim(p_note)) not between 5 and 1000
   or not exists(select 1 from auth.users where id=p_operator_id and raw_app_meta_data->>'papel'='operador') then return false; end if;
 select * into g from public.historical_contract_access where id=p_id for update;
 if not found or not exists(select 1 from public.manager_accounts where business_id=g.business_id and operator_profile_id=p_operator_id)
 then return false; end if;
 if g.revoked_at is not null then return g.revoked_by=p_operator_id and g.revoke_note=btrim(p_note); end if;
 -- Undo ONLY ownership introduced by this grant, never a pre-existing owner,
 -- another business or ownership supporting an independent commercial order.
 perform 1 from public.businesses where id=g.business_id for update;
 if g.previous_profile_id is null and g.accepted_by is not null
   and not exists(select 1 from public.commercial_orders where business_id=g.business_id)
   and not exists(select 1 from public.historical_contract_access where business_id=g.business_id and id<>g.id and revoked_at is null)
 then update public.businesses set profile_id=null where id=g.business_id and profile_id=g.accepted_by; end if;
 update public.historical_contract_access set revoked_by=p_operator_id,revoked_at=now(),revoke_note=btrim(p_note) where id=p_id;
 insert into public.historical_contract_access_events(access_id,kind,actor_id) values(p_id,'revoked',p_operator_id);
 return true;
end $$;
revoke all on function public.emitir_acesso_contratado(uuid,uuid,uuid,text),public.revogar_acesso_contratado(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.aceitar_acesso_contratado(uuid) from public,anon,service_role;
grant execute on function public.emitir_acesso_contratado(uuid,uuid,uuid,text),public.revogar_acesso_contratado(uuid,uuid,text) to service_role;
grant execute on function public.aceitar_acesso_contratado(uuid) to authenticated;
commit;
