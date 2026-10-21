# Etapas 03/04 — continuidade da agenda e regressão final

## 0. Decisão humana necessária

Nenhuma para manter o recorte 03/04 concluído. A única ação externa que ainda pode ampliar a prova é um ensaio autorizado com reserva real no Google, seguido de remarcação/cancelamento pelo e-mail de confirmação. Esse ensaio não foi feito neste bloco para não criar compromisso real.

## Escopo E28

- **E28-04-B — conferido localmente e por leitura da agenda pública.** Concluir o onboarding continua levando à agenda externa sem bloquear o acesso ao Início. Sem confirmação verificável, o Início mantém a reunião pendente por negócio. A carteira interna mantém o negócio pesquisável e orienta o responsável a confirmar a reunião no Google antes de preparar a campanha.
- **E28-03-B — regressão local aprovada.** Isolamento entre negócios, sessão/cookie inválido, compra pendente, e-mail divergente, retomada, recarga lógica, respostas, contas, marca e saída para o Início foram exercitados pelos conferidores existentes.
- **E28-04-C — permanece P1.** A página pública não fornece ao WebApp um vínculo verificável por `business_id`/CNPJ. Portanto ela não prova uma única reserva ativa por negócio, nem permite ao app reconciliar remarcação/cancelamento. A proteção existente em `onboarding_meetings` só vale quando a agenda própria está configurada e conciliada.

## Evidência funcional

Leitura em 20/10/2026, sem reservar:

- página pública `Reunião inicial V2G` disponível;
- duração exibida de 25 minutos, fuso `GMT-03:00 — São Paulo`;
- horários visíveis em 21, 22, 23, 26 e 27/10;
- prévia de 21/10 às 10h mostrou término às 10h25 e formulário com nome, sobrenome, e-mail e CNPJ obrigatório;
- a prévia foi fechada em `Cancelar`; nenhuma reserva foi enviada.

O Google documenta confirmação/cancelamento por e-mail e oferece, na configuração da agenda, janela de agendamento, antecedência mínima, intervalo, máximo diário e verificação de e-mail. A leitura pública não expõe quais desses controles opcionais estão ligados na agenda V2G; não foi inferido que verificação de e-mail evita reserva duplicada por CNPJ.

No produto:

- `app/(fluxo)/onboarding/concluido/Conclusao.tsx` informa que o Google enviará data, link e opções de remarcar/cancelar; voltar ao Início não confirma reserva;
- `lib/onboarding/conclusao.ts` mantém `agendamento_pendente` até confirmação verificável;
- `lib/onboarding/pendencia-do-negocio.ts` lê a pendência pelo `business_id` ativo e só remove a pendência quando existe reserva confirmada na integração própria;
- `lib/gestor/portfolio.ts` preserva a ação operacional `Reunião: confirmar no Google antes de preparar campanha`, sem afirmar reunião marcada;
- `app/(fluxo)/onboarding/concluido/agenda-actions.ts` já contém duração de 25 minutos, uma reserva ativa por negócio, reconciliação, cancelamento e limite de remarcação para a agenda própria. Isso não certifica a página externa nem configuração em QA/produção.

## Ajuste local

O produto não precisava de alteração para E28-04-B. A regressão encontrou apenas um conferidor desatualizado: `scripts/conferir-pendencia-onboarding.mjs` ainda procurava `if (proximo)`, enquanto a tela passou corretamente a exigir `proximo?.acao`. O teste foi alinhado ao contrato atual e continua verificando que a pendência do onboarding vence a próxima ação de campanha.

## Testes executados

Ambiente: checkout local compartilhado; sem banco real, sem chamada de escrita ao Google, sem QA/produção, sem build e sem reiniciar o servidor de outro chat.

- `conferir-multiconta`: 21/21;
- `conferir-multiconta-sessao`: 7/7;
- `conferir-onboarding-preservacao`: 72/72;
- `conferir-pendencia-onboarding`: falhou 1 teste por asserção antiga; após o ajuste, 5/5;
- `conferir-agenda`: 5/5;
- `conferir-horarios-agenda`: 2/2;
- `conferir-conciliacao-agenda`: 14/14;
- `conferir-gestor`: 26/26;
- total final das suítes direcionadas: **152/152**;
- `pnpm typecheck`: passou;
- `git diff --check -- scripts/conferir-pendencia-onboarding.mjs`: passou.

## Alternativa operacional honesta

1. O cliente conclui o onboarding e abre a agenda pública.
2. Ao voltar ao Início, a reunião continua pendente; o clique não vira confirmação.
3. O cliente consulta, remarca ou cancela pelo e-mail do Google.
4. O responsável localiza o negócio na carteira, confere a reserva no Google e, se não houver confirmação, entra em contato para marcar.
5. Pedido de agendamento, reserva confirmada e onboarding concluído permanecem estados distintos.

## Próximo passo

No ensaio de 26/10, repetir com duas sessões/negócios no ambiente publicado. Para fechar E28-04-C depois do evento, decidir entre ativar a agenda própria já preparada ou criar conciliação idempotente da agenda externa; em ambos os casos, provar uma reserva ativa por negócio, remarcação e cancelamento antes de retirar a pendência do Início.
