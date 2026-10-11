# Retomada do primeiro passo do onboarding — 11/10/2026

## 0. Pendência

Conferir no navegador com sessão autenticada e persistência real quando o QA voltar. A prova desta sessão é local, com banco simulado; não valida RLS, rede ou experiência após recarga.

## Falha e correção

O primeiro passo grava campos do negócio e a resposta do questionário em chamadas separadas. Uma falha na segunda chamada pode deixar o campo salvo sem fechar a pergunta. A tela antes apresentava erro simples e oferecia novo envio imediato, sem reler o que já tinha sido gravado.

A ação agora sinaliza falha de gravação parcial ou incerta. A tela informa a incerteza, oferece **Recarregar** e bloqueia segundo envio até reler o estado. Erros de validação anteriores à gravação continuam corrigíveis no mesmo formulário. Também trata falha de comunicação da ação como resultado incerto, sem afirmar que nada foi salvo.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 49/49. O cenário de falha na mescla confirma campo salvo sem resposta fechada; a releitura e repetição fecham a resposta. Falha na limpeza da praça também exige recarga.
- `pnpm typecheck`: passou.
- `pnpm build`, com servidor de desenvolvimento parado: passou.
- Interface autenticada e banco QA: não verificados; QA pausado.

Sem disparo real de cadastro, deploy ou migration.
