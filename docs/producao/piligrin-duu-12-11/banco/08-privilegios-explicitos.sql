-- Proposta complementar: não depender de default privileges da plataforma.
begin;
revoke all on public.manager_accounts, public.manager_tasks from public, anon, authenticated;
grant select, insert, update, delete on public.manager_accounts, public.manager_tasks to service_role;
revoke all on public.creative_review_requests from public, anon, authenticated;
grant select on public.creative_review_requests to authenticated;
grant select, insert, update, delete on public.creative_review_requests to service_role;
commit;
