# Etapa 04 — arquivos salvos sem prévia, 14/10/2026

## 0. Aberto

- Conferir no QA publicado os estados em que o arquivo existe, mas o link privado expirou ou não foi gerado. O teste local não reproduziu falha do Storage.

## Ajuste local

- A etapa de marca agora mostra o nome do logo, de cada imagem adicional e do PDF mesmo quando não há link ou prévia disponível. Nesse caso, informa que o arquivo segue registrado e recomenda atualizar antes de substituí-lo.
- Esse estado é diferente de nenhum arquivo enviado e complementa o tratamento da falha de leitura documentado em `onboarding-marca-leitura-incerta-14-10.md`.

## Conferência

- `pnpm typecheck`: passou.
- `git diff --check`: sem erro de whitespace; avisos de final de linha no checkout Windows.

Sem commit, push, deploy, migração, envio de arquivos ou escrita na Meta.
