-- ============================================================
-- V2G — `avg_ticket` vira faixa: `avg_ticket_min` + `avg_ticket_max`
--
-- O problema: o onboarding pergunta o ticket médio por FAIXA
-- ("R$ 100 a R$ 300"), mas a coluna era um número só. Estávamos
-- gravando o ponto médio (200). Quem lesse `avg_ticket = 200` depois
-- não teria como saber que aquilo era o meio de uma faixa, e não um
-- valor que o cliente informou — e o motor de regras vai calcular
-- orçamento e público em cima disso.
--
-- Por que faixa e não só renomear para `avg_ticket_estimado`:
-- renomear resolve a ambiguidade do nome, mas não devolve a informação
-- perdida. Guardar os limites é LOSSLESS — de [100, 300] dá para
-- derivar o ponto médio a qualquer momento; de 200 não dá para
-- recuperar a faixa. E a largura da faixa é sinal útil por si só: um
-- negócio que respondeu "R$ 300 a R$ 800" tem incerteza muito maior
-- que um que digitou "450", e o motor de regras pode querer ser mais
-- conservador no primeiro caso. Um número só apaga essa diferença.
--
-- Convenções:
--   * faixa fechada  → min e max preenchidos ("R$ 100 a R$ 300" → 100, 300)
--   * valor exato    → min = max (o cliente digitou "450" → 450, 450)
--   * faixa aberta   → só min ("Acima de R$ 800" → 800, null)
--   * texto sem número → ambos nulos, resposta crua fica no jsonb
--
-- `drop column` sem preservar dado é seguro aqui: a tabela está vazia
-- (o schema foi aplicado nesta semana e só teve linhas de teste, já
-- removidas). Em base com dado, isto seria um backfill, não um drop.
-- ============================================================

alter table public.businesses drop column avg_ticket;

alter table public.businesses
  add column avg_ticket_min numeric,
  add column avg_ticket_max numeric;

comment on column public.businesses.avg_ticket_min is
  'Piso da faixa de ticket médio informada no onboarding. Resposta por faixa ("R$ 100 a R$ 300") grava 100; resposta com número exato grava o mesmo valor em min e max. Nulo quando a resposta foi texto livre sem número.';

comment on column public.businesses.avg_ticket_max is
  'Teto da faixa de ticket médio. Nulo quando a faixa é aberta para cima ("Acima de R$ 800"), caso em que só avg_ticket_min tem valor.';
