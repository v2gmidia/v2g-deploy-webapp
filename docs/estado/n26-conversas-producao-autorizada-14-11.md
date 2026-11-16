# Aplicação autorizada — conversas e cobertura

14/11/2026. Victor autorizou neste chat o commit/push, a publicação do backend e WebApp
em produção e a prova pela Piligrin/Dúú, preservando dados e sem alterar anúncios/verba.

Pré-voo: os 18 arquivos de código/contrato/verificação, dois patches e dois TARs conferiram
com o manifesto preparado. Bases remotas continuam WebApp `d09287c` e backend `540e135`.
Nenhuma repetição de testes foi necessária: os arquivos executáveis são os mesmos que
passaram no bloco anterior (3.170 testes backend, ruff/mypy, tipos/build WebApp e testes focados).

- WebApp atual: deploy READY `dpl_4iMkzxy1jadcMwXQaDCJEetZ9i7Q`, domínio `app.v2gmidia.com.br`.
- Backend atual: `/saude` saudável, `5729135ceac1`, esquema conferido, sem migração pendente,
  leitura Meta ligada. Integrações reais e observador ativo serão preservados, sem disparo manual de rotina.
- Easypanel: `ia/backend`, fonte GitHub `v2gmidia/backend_v2g`, branch `main`, caminho `/`,
  builder Dockerfile `infra/Dockerfile`. Auto Deploy aparece desabilitado; não será alterado.
- Referência do último build completo da base atual:
  `docker.io/easypanel/ia/backend:latest`, manifest list
  `sha256:cb3b019f3d393dc86ca264fa47c97b8986f2aff068592ff1d781cca9c528994e`,
  build Success em 13/11/2026 17:33:35 UTC. Os dois deploys posteriores do mesmo commit
  concluíram em 1–2 segundos e não contêm outro build de imagem.
- Logs de referência preservados em
  `C:/Users/victo/.codex/private-backups/v2g/releases/conversas-producao-20261114/`.
  O TAR de retorno é cópia do código-fonte, não uma exportação binária da imagem ou credenciais.

Ordem: commit/push backend main → Deploy exclusivamente `ia/backend` → conferir runtime
esperado `088a9da1e501` e saúde → commit/push WebApp main → conferir Vercel/domínio →
sessão legítima Piligrin/Dúú, 01–07/11, Início/Anúncios/gráfico/cobertura/volta à carteira.
O resultado efetivo será registrado após concluir; este documento não antecipa sucesso.

Sem SQL, alteração de dados, permissões, credenciais, orçamento ou escrita na Meta.
