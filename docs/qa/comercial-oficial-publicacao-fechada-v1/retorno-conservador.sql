-- Candidato LOCAL: invalida prontidão, preservando todo dado e a proteção do cadastro.
-- Fechar novas compras/envios nos controles é ato externo separado.
begin;
drop function if exists public.comercial_oficial_schema_v1();
commit;
