# Etapa 04 — horário real da reunião no Google

## 0. Aberto

- A agenda própria continua desativada. Falta configurar e ensaiar no QA com uma reserva, uma alteração de horário no Google, cancelamento e dois CNPJs autenticados. O fluxo público antigo do Google ainda não impede reservas múltiplas por CNPJ.

## Achado

Ao reler um evento confirmado, a aplicação atualizava apenas a versão e o link do Google. Se o evento tivesse sido movido no calendário, a confirmação no WebApp continuaria exibindo o horário antigo, e a ocupação local manteria a vaga antiga.

## Ajuste local

- A leitura do evento inclui início e fim. A conciliação compara os instantes reais e atualiza a reserva local quando o horário mudou, inclusive se a versão enviada pelo Google for a mesma.
- Se o evento não trouxer horário válido, não pertencer ao negócio ou tiver status desconhecido, a tela deixa de afirmar que a reunião está confirmada e exige revisão.
- Uma nova tentativa de reserva e o cancelamento também conciliam o evento existente antes de mostrar um horário ou apagar o evento.
- Se uma reserva concorrente já existir, ela também é conciliada antes de exibir o estado.

## Conferências

- 17 testes locais de agenda, horários e conciliação passaram.
- `pnpm typecheck` passou.
- `git diff --check` passou com avisos de finais de linha.

Não houve evento criado ou cancelado, mudança no banco, commit, push ou deploy neste bloco.
