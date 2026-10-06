# Planejamento dos avisos da reunião — 06/10/2026

`lib/agenda/lembretes.ts` calcula os quatro marcos definidos por Victor: 24 horas, 2 horas, 30 minutos e 5 minutos antes da reunião. Um marco anterior ou igual à confirmação da reserva sai do plano; o convite imediato é uma ação distinta. O módulo recebe instantes absolutos, não depende do horário do servidor e não envia mensagens.

`node --test scripts/conferir-lembretes.mjs`: 3/3 testes passaram, incluindo reserva próxima e datas inválidas. `pnpm typecheck`, `pnpm conferir` e `pnpm build` passaram, sem servidor dev concorrente. Nenhuma interface foi exercitada nesta passagem.

## Contrato ainda necessário

- Só criar o plano depois de confirmação persistente da reserva e do evento externo. `planejado` não é `enviado` nem `entregue`.
- Persistir cada tentativa por `reuniao_id`, versão da reserva, canal (`email` ou `whatsapp`) e marco. A combinação precisa ser única para impedir disparos duplicados por repetição do job.
- Remarcação cancela as tentativas ainda pendentes da versão antiga e cria as da nova. Cancelamento impede as tentativas futuras. Registrar resposta do provedor e falhas para nova tentativa segura.
- Convite de calendário e link da reunião dependem do provedor escolhido. Não há serviço de envio contratado para e-mail ou WhatsApp, nem credenciais/agenda confirmadas para reserva. O WebApp não mostra aviso como enviado por causa deste cálculo.
