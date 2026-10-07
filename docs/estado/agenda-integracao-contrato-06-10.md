# Contrato para conciliar a reunião inicial

O cliente abre a página Google ao concluir o onboarding. O clique não muda o estado no WebApp. O Google envia o convite se a reserva for concluída; o produto só poderá mostrar “reunião marcada” depois de receber e validar o evento.

## Dados e transições

- Chave interna: `business_id` e `order_id`, ligados ao usuário que comprou. Não usar somente CNPJ ou e-mail como chave porque ambos podem aparecer em mais de uma compra.
- Chave externa: ID do evento e calendário de origem do Google, com versão/`etag`. Persistir início e fim com fuso `America/Sao_Paulo`, e-mail do participante, CNPJ declarado, gestor designado, link do Meet e origem da confirmação. Não guardar token OAuth no navegador.
- Estados: `agendamento_pendente` → `reservado` somente após leitura autenticada do evento e conferência de identidade/negócio; `reservado` → `remarcado`, `cancelado` ou `realizado` segundo evento e ação efetiva. Evento desconhecido ou conflito vai para revisão, sem simular reserva.
- Idempotência: unicidade por `(calendar_id, event_id)` e processamento da versão mais nova. Reenvio de notificação do Google não cria segunda reunião. Remarcação atualiza a mesma reserva com histórico; cancelamento não apaga a trilha.
- O cliente pode remarcar até 25 minutos antes; pode avisar ausência a qualquer momento. O gestor deve ver cancelamentos e faltas. Quando não houver vaga nos cinco dias úteis, manter a pendência e encaminhar à operação; não inventar horário.
- Um dia, duas horas, 30 minutos e cinco minutos antes são os avisos planejados. O Google já cobre e-mail na página piloto; WhatsApp e aviso próprio do WebApp precisam de provedor, opt-in, fila e chave de idempotência `(reserva, versão, canal, instante)`.

## Para ligar a integração

Obter acesso OAuth de leitura/escrita somente aos calendários autorizados por Victor, identificar o calendário real da página de reservas e confirmar que a API expõe as reservas com os campos personalizados usados para CNPJ. Testar evento criado, remarcado e cancelado com dados fictícios. Bloquear feriados, resolver a divergência entre antecedência desejada de 30 minutos e mínimo de uma hora aceito pelo editor, e testar a janela real de cinco dias úteis. Antes do rodízio, definir disponibilidade de cada gestor e reserva atômica para evitar duas pessoas no mesmo horário. Nenhum desses testes foi executado nesta etapa.
