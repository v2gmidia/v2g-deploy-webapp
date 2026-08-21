-- Espelha a migration 0007_onboarding_por_call.sql do backend_v2g, que nunca
-- rodou neste banco. O modelo `Execucao` declara os cinco campos desde 19/08 e
-- o `_para_linha` os despeja no upsert; sem coluna, o PostgREST recusa e o
-- `POST /cadastro` devolve 500. E a segunda causa do erro ID#172764 do n8n.
--
-- Aplicada em 21/08/2026 no V2G-SITE. Este arquivo existe para a cadeia do
-- repositorio bater com o que esta no banco.

alter table public.execucoes add column if not exists tem_site         boolean;
alter table public.execucoes add column if not exists site_url         text;
alter table public.execucoes add column if not exists tem_instagram    boolean;
alter table public.execucoes add column if not exists instagram_handle text;
alter table public.execucoes add column if not exists resultado_campanhas_anteriores text;

comment on column public.execucoes.site_url is
  'O que foi dito NESTA call/cadastro. Nao e duplicata de businesses.site_url: '
  'aquele guarda a propriedade atual do negocio, este guarda o que valia no '
  'momento do run — mesma relacao de analysis_runs.input_snapshot com '
  'businesses. Lido por /onboarding/call para montar `deve_varrer_site`.';

comment on column public.execucoes.tem_site is
  'Junto com site_url decide o `deve_varrer_site` da resposta (rotas.py:200), '
  'que e o campo que o caminho (a) do webhook manda para o n8n.';

comment on column public.execucoes.instagram_handle is
  'Referencia para o upload manual. Nunca scraping.';

comment on column public.execucoes.resultado_campanhas_anteriores is
  'Consumido por diagnosticar-orcamento, direto no prompt. Persistido desde '
  '21/08/2026: antes o handler recebia e nao copiava, e o dado so chegava ao '
  'agente quando o n8n o repassava do corpo do webhook — o que so acontece no '
  'caminho do formulario, nunca no caminho do app.';
