-- Pedido imutavel da primeira fatia de criacao. NAO e job de geracao:
-- nenhuma linha desta tabela autoriza despesa, IA externa ou publicacao.
-- Proposta local; aplicar somente em ambiente explicitamente autorizado.
create table public.creative_generation_requests (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ?& array['versao', 'objetivo', 'oferta', 'acao', 'promocao', 'validade']
    and payload @> '{"versao":1}'::jsonb
    and jsonb_typeof(payload->'objetivo') = 'string'
    and jsonb_typeof(payload->'oferta') = 'string'
    and jsonb_typeof(payload->'acao') = 'string'
    and jsonb_typeof(payload->'promocao') = 'boolean'
    and (
      (payload->'promocao' = 'false'::jsonb and payload->'validade' = 'null'::jsonb)
      or (payload->'promocao' = 'true'::jsonb
        and jsonb_typeof(payload->'validade') = 'string'
        and payload->>'validade' ~ '^\d{4}-\d{2}-\d{2}$')
    )
    and char_length(payload->>'objetivo') between 2 and 500
    and char_length(payload->>'oferta') between 2 and 500
    and char_length(payload->>'acao') between 2 and 200
    and octet_length(payload::text) <= 8192
  ),
  status text not null default 'awaiting_configuration'
    check (status = 'awaiting_configuration'),
  created_at timestamptz not null default now()
);
create index creative_generation_business_created_idx
  on public.creative_generation_requests(business_id, created_at desc);
create index creative_generation_requested_by_idx
  on public.creative_generation_requests(requested_by);

alter table public.creative_generation_requests enable row level security;
revoke all on public.creative_generation_requests from anon, authenticated;
grant select on public.creative_generation_requests to authenticated;
-- Horario e estado sao defaults do banco; o cliente nao os fornece.
grant insert (id, business_id, requested_by, content_hash, payload)
  on public.creative_generation_requests to authenticated;
create policy creative_generation_read_own on public.creative_generation_requests
  for select to authenticated using (
    exists (select 1 from public.businesses b
      where b.id = business_id and b.profile_id = (select auth.uid()))
  );
create policy creative_generation_insert_own on public.creative_generation_requests
  for insert to authenticated with check (
    requested_by = (select auth.uid()) and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.profile_id = (select auth.uid())
    )
  );
-- Sem UPDATE/DELETE, acesso de agencia ou operador global. O worker futuro
-- precisa de contrato e autorizacao proprios, sem usar payload como permissao.
