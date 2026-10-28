# Conciliação da agenda externa — 27/10/2026

## Fato verificado

Uma leitura autenticada e sem escrita do calendário autorizado encontrou a reserva real criada pelo fluxo público: evento confirmado em 28/10/2026, das 10h às 10h25 em `America/Sao_Paulo`. O evento expõe ID estável, horário, participante e o CNPJ preenchido no formulário. Nenhum evento foi criado, alterado, cancelado ou respondido nesta verificação.

Isso permite conciliar a reserva sem aceitar clique ou declaração do cliente como prova. O vínculo local exige, ao mesmo tempo:

- evento confirmado no calendário configurado;
- título da reunião inicial V2G;
- ID e `etag` do evento;
- e-mail participante igual ao e-mail verificado da compra;
- CPF/CNPJ do formulário igual ao documento do pedido aprovado;
- exatamente um negócio compatível.

Mais de um evento ou mais de um negócio compatível falha fechado para revisão. O evento importado usa a unicidade já existente de negócio, horário e `(calendar_id, google_event_id)`. Remarcação atualiza o horário do mesmo evento; cancelamento confirmado no Google encerra a reserva local. A aplicação não cria outro evento antes de tentar essa conciliação.

## Ativação externa ainda necessária

O código fica desligado por padrão. Para ativar somente leitura/conciliação no QA, uma pessoa autorizada precisa:

1. confirmar que a tabela e os índices de `20261014030000_onboarding_reserva_unica.sql` estão aplicados no projeto correto;
2. autorizar um cliente OAuth do Google Calendar com acesso de leitura aos eventos do calendário de `victor.cabral@v2gmidia.com.br` e gerar o refresh token correspondente;
3. configurar, sem expor valores: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` e `V2G_AGENDA_EXTERNA_READ_ENABLED=true`;
4. publicar no QA e provar com reserva fictícia: confirmação única, recarga, remarcação mantendo o ID, cancelamento, dois eventos concorrentes e dois negócios com mesmo e-mail/documento.

`V2G_AGENDA_PROPRIA_ENABLED` continua separado e desligado. Ligá-lo autoriza o WebApp a criar e apagar eventos, portanto exige outra decisão e teste. A confirmação externa de leitura não depende dessa autorização de escrita.

## Estado seguro enquanto não ativa

`/onboarding/concluido` continua usando a página pública. A tela agora avisa antes do link que quem já recebeu e-mail não deve abrir a agenda novamente. Depois que a agenda é aberta, o navegador passa a mostrar “Aguardando confirmação verificável”, esconde o atalho principal e só oferece nova abertura dentro da opção explícita “Não concluí a reserva ou não recebi o e-mail”. Esse marcador local reduz duplicidade, mas não é confirmação e nunca grava `onboarding_meetings`.
