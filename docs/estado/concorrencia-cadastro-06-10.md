# Cadastro: conferência offline da duplicação — 06/10/2026

## O que foi conferido

`scripts/conferir-disparo-offline.mjs` executa `dispararSeCompleto()` real com sessão, Supabase e backend simulados. A rede é bloqueada no teste; não houve POST real, migration ou alteração de produção.

- Com respostas do onboarding atual, duas chamadas simultâneas retornaram `reuniao_pendente` e fizeram **zero** chamadas ao cadastro.
- No fluxo legado, duas chamadas simultâneas que leram o estado inicial chegaram à trava compare-and-set. Só uma obteve a trava e fez o POST simulado. A resposta foi simulada como perdida; uma terceira chamada procurou execução anterior e **não** enviou de novo dentro da janela de reconciliação.
- Comando: `node --test scripts/conferir-disparo-offline.mjs` — **2/2 testes passaram**.
- As ações das contas agora recusam um identificador desconhecido antes de consultar ou gravar. Antes, uma chamada forjada sem conta válida podia retornar sucesso e alcançar `dispararSeCompleto()` sem ter alterado resposta. `node --test scripts/conferir-onboarding-preservacao.mjs` — **24/24 testes passaram**, incluindo essa recusa, retomada, preservação, falhas de gravação e repetição da conclusão.

`pnpm conferir` e `pnpm build` passaram após a mudança nas ações. Não havia `next dev` ou outro build concorrente. A interface autenticada não foi exercitada nesta passagem.

## Limite da prova

O teste simula a atomicidade do `UPDATE ... WHERE cadastro_estado IS NULL OR cadastro_estado = 'falhou'`; não mede a política RLS nem a concorrência no Supabase real. A prova histórica do banco e de uma execução única está em `docs/disparo-pipeline.md` §13.3–13.4. A jornada nova continua retida até existir evidência da reunião e decisão de liberação; não foi testado envio real.
