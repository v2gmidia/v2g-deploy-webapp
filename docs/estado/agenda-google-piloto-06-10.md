# Piloto da agenda Google — 06/10/2026

## O que foi criado

Victor autorizou usar `victor.cabral@v2gmidia.com.br`. A página [Reunião inicial V2G](https://calendar.google.com/calendar/appointments/schedules/AcZssZ0b5yJebHCZ15kBn6J7Q_uoGrxKKKEKvHri0CAAkKeCjNBRJ_KzIIJQwlYOifAH0auJD5u13G0r) foi salva no Google Calendar dessa conta. A visualização de visitante mostrou horários livres, mas nenhuma reserva foi feita.

- Segunda a sexta, 10h–18h, horário de São Paulo; duração de 25 minutos; intervalo de 15 minutos.
- Até 7 dias corridos adiante, como aproximação de cinco dias úteis. A página não impõe uma janela calculada por dias úteis. Na visualização, ofereceu **12/10/2026**; feriados ainda precisam ser bloqueados explicitamente se a operação não atender neles.
- Antecedência mínima **de 1 hora**. O editor não aceitou 0,5 hora para os 30 minutos decididos por Victor. Portanto, essa regra do piloto diverge do contrato de produto em `lib/agenda/regras.ts`.
- Google Meet gerado após reserva; nome, sobrenome, e-mail e CNPJ do negócio atendido obrigatórios, com verificação de e-mail.
- Convite e lembretes por e-mail em um dia, duas horas, 30 minutos e cinco minutos antes. WhatsApp não está automatizado.
- A descrição explica acessos, primeiro criativo, contrato pendente e publicação manual da primeira campanha. Não cobra a reunião.

Na interface, abrir um horário mostrou o formulário com CNPJ obrigatório e botão de reserva. O teste foi cancelado antes de enviar: nenhum evento, convite ou mensagem ao cliente foi criado para esse teste.

## O que ainda impede conectar ao WebApp

O link acima é uma página Google utilizável, mas **não foi inserido na jornada do cliente**. O WebApp não sabe qual negócio da sessão reservou, qual é o ID do evento, se houve remarcação ou cancelamento, nem se o horário foi realmente reservado. Exigir CNPJ no formulário ajuda a conciliar, mas não prova sozinho que o agendamento pertence ao usuário autenticado. Não mudar `agendamento_pendente` para `marcada` a partir de clique ou declaração do cliente.

Antes de exibir o link para clientes, conciliar evento por ID, e-mail e CNPJ contra a conta autenticada, guardar estado e versão da reserva e mostrar o gestor real. A política de remarcação até 25 minutos antes e aviso de ausência a qualquer momento também exigem um fluxo controlado pelo produto; o Google não foi configurado para impor esses limites. Testar disponibilidade, feriados, conflito simultâneo e cancelamento com dados fictícios antes da liberação.

O piloto usa um gestor. Para rodízio futuro, consultar agendas autorizadas da equipe e reservar o gestor disponível de forma atômica. Isso ainda não existe.
