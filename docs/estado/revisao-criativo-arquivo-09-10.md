# Revisão de criativo: arquivo obrigatório — 09/10/2026

## Mudança local

- A action de decisão do gestor agora consulta a solicitação ainda pendente e baixa o arquivo privado antes de registrar aprovação, pedido de ajustes ou recusa. Se o arquivo não estiver disponível, a decisão é recusada com aviso. A atualização continua condicionada a `awaiting_review`, evitando duas decisões para a mesma peça.
- A tela já ocultava o botão quando não obtinha link temporário, mas uma chamada direta da action não passava por essa proteção. A checagem passou a existir no servidor.

## Verificação

- `pnpm typecheck` e `pnpm build` passaram, com a porta 3000 sem servidor dev no momento do build.
- O ensaio `scripts/qa-revisao-criativos.mjs` no projeto QA confirmou download do arquivo existente pelo papel de serviço e falha após a remoção; também passou isolamento entre dois negócios, bloqueio de escrita do cliente, Storage privado e ID duplicado. As fixtures sintéticas foram removidas pelo ensaio.
- `pnpm conferir:criativos` exibiu 30 verificações corretas, mas o processo Node no Windows encerrou com erro nativo após a mensagem final. Não conto o comando como aprovado.
- A action autenticada e a interface do operador ainda não foram percorridas nesta rodada. O ensaio de Storage não prova que a decisão foi feita no navegador. Não houve publicação de campanha.
