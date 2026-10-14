-- O bucket historico v2g-midia existe no projeto original, mas nao no QA.
-- Criacao idempotente; nao altera um bucket existente nem abre acesso publico.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'v2g-midia', 'v2g-midia', false, 10485760,
  array['image/png', 'image/jpeg', 'application/pdf']
)
on conflict (id) do nothing;

-- Sem policy em storage.objects: leitura e escrita passam pelo servidor,
-- apos conferir sessao e negocio ativo. Nao aplicar em outro projeto sem
-- inspecionar a configuracao do bucket de destino.
