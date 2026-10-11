# Gravação incerta nas contas do onboarding — 11/10/2026

> RESOLVIDO localmente em `ticket-parcial-onboarding-11-10.md`: a leitura agora ignora o par de colunas enquanto a atualização do ticket está pendente. Falta prova no QA.

## 0. Pendências

- A leitura do valor de venda usa `avg_ticket_min` e `avg_ticket_max`. Como são transações separadas, uma falha após a primeira coluna pode deixar um par misto com o valor antigo. A regra atual de leitura prioriza colunas e pode interpretar esse par como resposta completa. **Isso ainda requer correção própria antes de afirmar que a retomada das contas está segura.** Não houve migração nem prova com banco real nesta sessão.
- Conferir a tela autenticada e RLS quando o QA voltar. O projeto está pausado.

## Correção desta sessão

A ação de contas agora diferencia erro anterior à gravação de resultado incerto durante gravação, reabertura ou mescla da resposta. A tela mostra o aviso de incerteza, oferece **Recarregar** e bloqueia novo envio até reler os dados. Também trata falha de comunicação da ação como incerta, para não incentivar uma repetição cega.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 51/51. Cobriu coluna gravada com falha posterior do JSON e reabertura cuja confirmação falhou.
- `pnpm typecheck`: passou.
- `pnpm build` com servidor de desenvolvimento parado: passou.
- Interface autenticada, banco QA e o caso de par de ticket parcialmente gravado: **não verificados**.

Sem deploy, migration ou escrita externa.
