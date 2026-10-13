# Etapa 04 — conciliação de agenda, 13/10/2026

## Estado

O questionário e o link Google estão em QA, mas o WebApp mantém `agendamento_pendente`. **Nenhuma reserva foi criada ou confirmada nesta passagem.** A leitura da agenda `victor.cabral@v2gmidia.com.br` pelo conector Google Calendar encontrou eventos pessoais/profissionais no intervalo 12–19/10, mas nenhum evento identificado como V2G. Isso não prova que não há reservas em qualquer outro período ou calendário.

Em teste posterior com a Empresa 4 fictícia no QA HTTPS, o bloco de negócio foi salvo, mas o bloco de contas revelou uma falha de perda entre respostas. A causa SQL e a correção ainda não aplicada estão em [`etapa-04-mescla-contas-qa-13-10.md`](./etapa-04-mescla-contas-qa-13-10.md). A agenda não deve ser testada como fim de jornada antes de corrigir esse bloqueio.

Em 13/10, a página pública da agenda piloto foi aberta somente até o formulário de um horário futuro. Ela mostrou reunião de 25 minutos, nome, sobrenome, e-mail e a pergunta **"CNPJ do negócio atendido"**. O formulário foi fechado por "Cancelar" sem preencher nem reservar. Isso comprova que o cliente vê o campo de CNPJ, mas **não** comprova que a resposta personalizada aparece no recurso de evento da API Google. A identidade completa e a reserva seguem sem prova de integração.

A tela de conclusão ganhou, **somente no código local**, um caminho explícito para quem não encontra horário: contato pelo WhatsApp sem dizer que a conversa criou reserva. A bancada local `/exemplo/onboarding-concluido` mostrou o link e o aviso de que o agendamento permanece pendente. A bancada não reproduz o contêiner de tema da rota autenticada; não é prova visual do QA publicado. `pnpm typecheck` e `pnpm build` passaram com o dev parado e reiniciado após o build. Nenhuma mensagem foi enviada.

## Estrutura local

`conciliarReserva` recebe um evento normalizado **lido da agenda**, o calendário autorizado e todos os vínculos candidatos. Para uma confirmação, só retorna `reservado` quando há ID e versão de evento, horário válido com fuso explícito, e **um único** pedido/negócio que combina e-mail verificado e CNPJ informado. O CNPJ pode chegar com a máscara usual, mas valores com letras ou comprimento diferente não são aceitos. Se o Google não expuser o CNPJ do formulário, se houver duas compras com a mesma identidade ou se a versão faltar, vai para revisão. O clique no link nunca entra nessa função. Ainda não existe adaptador Google, armazenamento de reservas, autenticação OAuth do WebApp ou webhook/polling; portanto a função não muda estado em QA ou produção.

Correção local posterior: a confirmação continua exigindo todos esses campos; o **cancelamento** aceita o tombstone mínimo do Google (`calendarId`, `eventId`, `status=cancelled`), mas só se existir uma reserva anterior persistida como `reservado` para exatamente o mesmo calendário e evento. Sem vínculo anterior, vai para revisão e não cancela outro negócio. O Google [documenta que eventos excluídos podem vir apenas com `id`](https://developers.google.com/workspace/calendar/api/v3/reference/events#resource); por isso e-mail, CNPJ, horário e `etag` não são exigidos do tombstone. Essa regra ainda é apenas local, pois não há armazenamento nem sincronização de eventos.

## Verificação e próximos portões

O conciliador local agora exige também `paymentStatus = payment_approved` no vínculo candidato. Um pedido pendente, com comprovante ou cancelado não transforma evento do calendário em reserva reconhecida para o WebApp. Isso é defesa local; ainda não há adaptador que leia o pedido no QA.

`node --test scripts/conferir-conciliacao-agenda.mjs`: 9/9, incluindo CNPJ mascarado, pedido sem pagamento aprovado, horário sem fuso e cancelamento mínimo com vínculo anterior obrigatório. `pnpm typecheck` e `pnpm build` passaram, com o dev parado durante a compilação e reiniciado depois. Falta provar se as respostas personalizadas da página Google aparecem na API do evento; identificar o calendário da página e o evento de teste, implementar leitura autorizada e histórico idempotente por `(calendar_id, event_id, etag)`, testar reserva, remarcação e cancelamento. O piloto do Google ainda usa antecedência mínima de 1 hora e janela de 7 dias corridos, diferentes dos 30 minutos e cinco dias úteis desejados.
