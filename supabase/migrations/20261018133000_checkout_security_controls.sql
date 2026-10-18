-- Rate limit atomico do checkout. Armazena apenas HMACs irreversiveis de IP
-- e contato; o IP e o e-mail puros nunca entram nesta tabela.

create table public.checkout_security_attempts (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('order', 'payment')),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  contact_hash text not null check (contact_hash ~ '^[0-9a-f]{64}$'),
  outcome text not null check (outcome in ('allowed', 'blocked')),
  created_at timestamptz not null default now()
);

create index checkout_security_attempts_ip_idx
  on public.checkout_security_attempts(scope, ip_hash, created_at desc);
create index checkout_security_attempts_contact_idx
  on public.checkout_security_attempts(scope, contact_hash, created_at desc);

alter table public.checkout_security_attempts enable row level security;
revoke all on table public.checkout_security_attempts from public, anon, authenticated;
grant select, insert, delete on table public.checkout_security_attempts to service_role;

create function public.consumir_limite_checkout(
  p_scope text,
  p_ip_hash text,
  p_contact_hash text
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_ip_count integer;
  v_contact_count integer;
  v_ip_limit integer;
  v_contact_limit integer;
  v_allowed boolean;
begin
  if p_scope not in ('order', 'payment')
      or p_ip_hash !~ '^[0-9a-f]{64}$'
      or p_contact_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'identificadores_de_seguranca_invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'checkout-security:' || p_scope || ':' || p_ip_hash, 0
  ));
  perform pg_advisory_xact_lock(hashtextextended(
    'checkout-security:' || p_scope || ':' || p_contact_hash, 0
  ));

  delete from public.checkout_security_attempts where created_at < now() - interval '7 days';

  select count(*) into v_ip_count from public.checkout_security_attempts
   where scope = p_scope and ip_hash = p_ip_hash and outcome = 'allowed'
     and created_at > now() - interval '1 hour';
  select count(*) into v_contact_count from public.checkout_security_attempts
   where scope = p_scope and contact_hash = p_contact_hash and outcome = 'allowed'
     and created_at > now() - interval '1 hour';

  v_ip_limit := case p_scope when 'order' then 5 else 10 end;
  v_contact_limit := case p_scope when 'order' then 3 else 5 end;
  v_allowed := v_ip_count < v_ip_limit and v_contact_count < v_contact_limit;

  insert into public.checkout_security_attempts(scope, ip_hash, contact_hash, outcome)
  values (p_scope, p_ip_hash, p_contact_hash,
    case when v_allowed then 'allowed' else 'blocked' end);
  return v_allowed;
end;
$$;

revoke execute on function public.consumir_limite_checkout(text,text,text)
  from public, anon, authenticated;
grant execute on function public.consumir_limite_checkout(text,text,text)
  to service_role;

