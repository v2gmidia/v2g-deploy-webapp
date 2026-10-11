# Documentos em consulta parcial de contratações — 11/10/2026

## 0. Pendência de prova

- Conferir a tela autenticada com operador e mais de 1.000 documentos de contrato ou NFS-e. O banco de QA está pausado; não houve consulta real nesta sessão.

## Correção local

A lista de contratações avisava quando contratos ou documentos fiscais atingiam o limite de 1.000 registros, mas ainda dizia “nenhum documento registrado” ou “sem emissão registrada” para pedidos cujos documentos podiam ter ficado fora do recorte. Agora, na ausência de registro retornado, cada estado é apresentado como **não confirmado** quando a respectiva consulta está parcial. Um estado efetivamente retornado continua visível; indisponibilidade da consulta continua ocultando os dois estados.

Esta correção não afirma que houve assinatura ou emissão, nem pagina os documentos. A confirmação real depende do provedor e da revisão jurídica/fiscal correspondente.

## Verificação

- `node --test scripts/conferir-gestor.mjs`: 24/24, incluindo documento ausente em consulta completa e parcial e estado presente.
- `pnpm typecheck` e `pnpm build`, com dev parado: passaram.
- Sem interface autenticada e sem banco QA; o teste é local.
