-- Fila de revisao humana. Arquivos ficam em bucket privado e nunca sao
-- publicados por este fluxo. A aplicacao grava por service_role apos conferir
-- a sessao e o negocio; usuarios autenticados apenas leem seus registros.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creative-review', 'creative-review', false, 9437184, array['image/jpeg', 'image/png']);

create table public.creative_review_requests (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  file_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 9437184),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'uploading' check
    (status in ('uploading', 'upload_failed', 'awaiting_review', 'approved_for_manual_publish', 'changes_requested', 'rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creative_review_path_matches check
    (file_path = business_id::text || '/' || id::text),
  constraint creative_review_decision_matches check (
    (status in ('approved_for_manual_publish', 'changes_requested', 'rejected')
      and reviewed_by is not null and reviewed_at is not null)
    or
    (status in ('uploading', 'upload_failed', 'awaiting_review')
      and reviewed_by is null and reviewed_at is null)
  )
);
create index creative_review_business_created_idx
  on public.creative_review_requests (business_id, created_at desc);
create index creative_review_pending_idx
  on public.creative_review_requests (created_at)
  where status = 'awaiting_review';

alter table public.creative_review_requests enable row level security;
revoke all on public.creative_review_requests from anon, authenticated;
grant select on public.creative_review_requests to authenticated;
create policy creative_review_read_own on public.creative_review_requests
  for select to authenticated using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.profile_id = (select auth.uid())
    )
  );

-- Sem policy em storage.objects: o bucket privado so e manipulado pelo
-- servidor apos conferir identidade. URLs assinadas sao curtas e emitidas
-- apenas para operador autenticado.
