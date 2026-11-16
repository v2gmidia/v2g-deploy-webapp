# Correções do QA publicado — prévia local, 16/11/2026

Escopo autorizado: os quatro achados de `qa-publicado-16-11.md`. Sem commit, push ou publicação.

## Implementação

1. Anúncios não usa mais a rodada histórica para afirmar ausência de gasto atual antes da consulta da conta.
2. Início do cliente direto consulta o mesmo inventário autorizado de Anúncios. Conta e datas seguem no link entre as páginas. Pendência de cadastro permanece secundária; ela não substitui métricas por uma mensagem de preparação. Negócio inicial sem conta e sem histórico mantém a recepção. A apresentação da agência e a mesa do gestor não foram redesenhadas.
3. Calendário aceita intervalos históricos maiores que 31 dias. O transporte continua usando o contrato de até 31 dias por requisição, com janelas consecutivas e validação individual. Só exibe a composição após todos os lotes passarem. Escopo, moeda, fuso, datas e identidades divergentes recusam a composição. Ausências não viram zero; precisão decimal e campos desconhecidos são preservados. Há interrupção da sequência por demora para limitar consumo da fonte, com erro em vez de resultado truncado.
4. Bloco de limite mensal usa dimensões flexíveis. A barra mantém 8px de altura mesmo quando o bloco fica vertical. O valor mensal não acompanha o trimestre selecionado; só há saldo calculado com medição mensal completa e uma única conta vinculada ao negócio.

Na prévia, o formulário de vendas não registra apresentação nem envia respostas ao servidor. Ao tentar guardar, informa que nada foi enviado.

## Validação

- `pnpm conferir`: concluído com código 0.
- 159 testes dirigidos: 159 passaram, incluindo consultas em lotes, falha no segundo lote, isolamento de conta/negócio, somas, lacunas, série de 90 dias, preservação da agência e carregamento.
- `pnpm typecheck`: passou.
- `pnpm build`: passou na versão final. Dev parado durante o build e reaberto depois.
- Chrome: seleção de 01/01–31/03 atualizou URL e valores ilustrativos. Teto mensal permaneceu em novembro.
- Largura intermediária: viewport medido de 1080px, documento 1060px, sem transbordamento; estado sem investimento conferido especificamente.
- Celular emulado: viewport medido de 391px, documento 371px, sem transbordamento da página. Gráfico tem rolagem interna própria.
- Desktop: viewport medido de 1440px, documento 1419px, sem transbordamento.
- Console sem erros no fluxo local observado.

## Revisão do Victor

- Prévia: http://localhost:3000/exemplo/inicio?desde=2026-01-01&ate=2026-03-31
- Dados são ilustrativos. Nenhuma consulta autenticada real de trimestre foi feita nesta etapa; integração do transporte foi validada com fronteiras simuladas.
- Servidor em 127.0.0.1:3000, deixado em execução.
- Evidência final: `.impeccable/review/qa-corrigido-final-desktop.jpg`.
- Logs: `.impeccable/review/qa-correcoes-suite.log`, `qa-correcoes-testes.log` e `qa-correcoes-build.log`.

## Aprovação final e preparação da publicação

Victor aprovou a versão final e autorizou commit, push e conferência do deploy em 16/11/2026.

- Resumo do cliente com investimento, impressões e conversas por mensagem.
- Gráfico em linha com data e investimento diário no mouse, clique, toque e teclado.
- Receita informada e cliques removidos deste resumo e do detalhe interativo; não há nova consulta de receita.
- Detalhe abaixo do gráfico no celular; valores desconhecidos não viram zero.
- Validação final antes do envio: `pnpm build`, `pnpm conferir` e 160 testes dirigidos passaram.
- Conferência visual local realizada; publicação e QA autenticado são uma etapa posterior a este registro.
