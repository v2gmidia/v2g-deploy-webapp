# Conversas e cobertura — candidata de produção pronta para revisão

14/11/2026. Bloco autorizado: preparar, preservar os dados e apresentar antes de aplicar.
**Nenhum commit, push, merge, deploy, mudança de ambiente, migração, anúncio ou verba neste bloco.**

## Resultado

Pacote seletivo montado sobre as mains produtivas verificadas. O WebApp QA e o backend QA
foram usados como fonte da correção, sem trazer outras diferenças das branches QA.

- WebApp: `C:/Users/victo/v2g-deploy/webapp-conversas-producao`, base
  `d09287c8aa943d4d61fbcd9d03ebbc584aea6806`, branch local `codex/conversas-producao`.
- Backend: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-conversas-producao`, base
  `540e135487237e07aedb13e04daba5bc28280a25`, branch local `codex/conversas-producao`.
- Produção WebApp confirmada no deploy `dpl_4iMkzxy1jadcMwXQaDCJEetZ9i7Q`, READY.
- Backend produtivo saudável, runtime `5729135ceac1`, igual ao código-base local.
  Runtime esperado desta candidata: `088a9da1e501`.
- Alteração de produto: sete arquivos WebApp, idênticos aos validados na QA, e um arquivo
  Python backend. Dados, onboarding, histórico, autenticação, permissões, flags e n8n preservados.
- Não foi consultada credencial nem copiada configuração da QA para produção.

## Provas

Backend: **3.170 testes aprovados, 9 pulados**, ruff e mypy limpos (183 fontes).
WebApp: tipos e build aprovados; testes de conversas, Início, Anúncios e agência conferidos.
O conferidor de Anúncios precisou de portas de teste para as dependências históricas/de agência
da main produtiva; depois, seus 62 casos passaram. Não houve mudança de produto para esse ajuste.
As 57 rotas OpenAPI e demais schemas são iguais à base; somente dois campos opcionais novos.
Patches conferidos sem aplicar. TAR candidato e retorno de fonte relidos membro a membro.

A prova real na QA foi feita pela Piligrin, Dúú, 01–07/11: 105 conversas, R$ 281,80,
466 cliques, 26.129 impressões, sete dias e volta à carteira. Não é prova de publicação produtiva.

## Entrega e próximo gate

Guia, comparação, patches e manifesto ficam no WebApp em
`docs/releases/conversas-producao-2026-11-14/README.md`.
O manifesto também está preservado privadamente em
`C:/Users/victo/.codex/private-backups/v2g/releases/conversas-producao-20261114/`.

Victor revisa o pacote e decide a aplicação. Depois da autorização, registrar a imagem atual
para retorno, conferir as bases novamente, publicar backend antes do WebApp e fazer a prova
autenticada produtiva. O TAR de retorno é código-fonte, não backup da imagem/dependências.
Nenhuma operação do próximo bloco foi antecipada.
