# Etapa 04 — materiais da marca com leitura incerta, 14/10/2026

## 0. Aberto

- Validar no QA publicado com uma conta autenticada, logo, imagens adicionais e manual em PDF. Não foi simulado erro real de leitura do banco no navegador.
- A agenda própria ainda está desativada e o envio de materiais no QA continua sem prova ponta a ponta.

## Ajuste local

- A tela tratava falha na consulta dos arquivos como se o cliente não tivesse enviado logo, imagens ou PDF. Isso podia levá-lo a reenviar arquivos já guardados.
- As leituras agora distinguem ausência real de falha de consulta ou troca de negócio durante a leitura. Nesses casos, a etapa mostra uma mensagem para atualizar antes de novo envio, sem exibir resposta crua do banco.
- Links privados que não forem gerados continuam indicados como indisponíveis para arquivos registrados; a ausência do link não apaga o registro do arquivo.

## Conferência

- `pnpm typecheck`: passou.
- `pnpm conferir:onboarding-preservacao`: 69/69 passaram; esses casos não simulam a consulta de arquivos no QA.
- `pnpm conferir:identidade`: 6/6, com 17 exceções declaradas; é inventário de justificativas, não prova de autorização em sessão real.
- `git diff --check`: sem erro de whitespace; avisos de final de linha no checkout Windows.

Sem commit, push, deploy, migração, envio de arquivos ou escrita na Meta.
