# Regras locais de horários — 06/10/2026

`lib/agenda/regras.ts` avalia uma sugestão de horário sem consultar calendário nem criar reserva. A integração seguinte deverá buscar ocupações da agenda autorizada do gestor, escolher o responsável, reservar de modo idempotente e reconciliar o evento antes de mostrar “reunião marcada”. Uma lista vazia de ocupações passada ao avaliador **não prova disponibilidade**.

## Regra implementada

- Fuso `America/Sao_Paulo`; início e fim de segunda a sexta, das 10h às 18h.
- Antecedência mínima de 30 minutos e intervalo de 15 minutos antes/depois de reunião ocupada.
- Prazo interpretado como até o quinto dia útil **depois da data local de hoje**, com possibilidade de escolher hoje se ainda houver horário válido. Assim, uma compra numa sexta permite horários até a sexta seguinte. Esta convenção de contagem precisa ser conferida na interface da agenda antes da integração.
- A duração é recebida como parâmetro: Victor mencionou 20 e 25 minutos; o código não fixa uma delas nem define o limite de cancelamento.

## Prova e pendências

`node --test scripts/conferir-agenda.mjs` passou 4/4 cenários: sexta até a semana seguinte, fim de semana, limites do expediente, 30 minutos, intervalo de 15 minutos nos dois sentidos, duração variável e datas inválidas. `pnpm typecheck`, `pnpm conferir` e `pnpm build` passaram sem servidor dev concorrente.

Não houve teste em interface, consulta a agenda da equipe, reserva, convite, Meet, notificação, cancelamento ou remarcação. Origem das ocupações, credenciais Google, gestor da primeira reunião, duração final e provedor de mensagens continuam pendentes. Nenhum horário deve ser mostrado ao cliente a partir deste módulo isolado.
