# Etapa 04 — reserva recusada explicitamente pelo Google

## 0. Aberto

- A agenda própria continua desativada. Ainda falta configurá-la e ensaiar no QA com cliente autenticado, duas empresas, confirmação, recusa e cancelamento. O link público antigo continua sujeito a reservas múltiplas.

## Achado

Quando o Google rejeitava explicitamente a criação do evento, a linha `pending` local continuava bloqueando o CNPJ e o horário. A interface pedia atualização, mas não havia transição automática que liberasse essa tentativa recusada.

## Ajuste local

- Respostas HTTP 400, 401, 403, 404 e 422 do POST são tratadas como recusas explícitas. Antes de marcar a reserva como `failed`, o servidor consulta o ID do evento e exige ausência confirmada.
- Falhas de rede, 408, 409, 429, 5xx, resposta inválida e leitura inconclusiva continuam pendentes para conciliação, evitando uma segunda reserva enquanto a primeira puder existir.
- A transição para `failed` só ocorre se a linha ainda estiver `pending` e pertencer ao mesmo negócio. A tela então pede para atualizar os horários.

## Conferência

- 13 testes locais de classificação e conciliação passaram.
- `pnpm typecheck` passou; `git diff --check` não apontou erro de whitespace, apenas avisos de fim de linha do Windows.

Nenhum evento foi criado, nenhum convite foi enviado, nenhum banco foi alterado, e não houve commit, push ou deploy.
