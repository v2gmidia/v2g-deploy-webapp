# Criativos — conteúdo dos documentos no pré-voo (20/10/2026)

## §0. Depende de Victor e da integração

- O documento central e o documento de nicho preenchido precisam de revisão e fonte confiável antes de uso real. Victor não delegou à IA a redação final desses conteúdos. A futura rota deve carregar versões aprovadas da fonte, não aceitar metadados enviados pelo navegador como prova de revisão.
- Ainda faltam negócio/material piloto autorizados, consentimento persistido, provedor, teto e reserva transacional, QA autenticado e geração medida. Nada nesta rodada autoriza chamada paga ou envio de conteúdo privado.

## Fato observado

- O pré-voo conjunto exigia somente identificadores de versão no briefing. Sem conferir o conteúdo correspondente, uma integração futura poderia avançar com versão declarada, mas documento ausente, vazio, de outro nicho ou sem revisão registrada.

## Feito neste bloco

- `lib/criativos/documentos-geracao.ts` confere conteúdo não vazio, tipo, versão, ID do nicho quando aplicável, revisor e data válida. Falhas são explícitas para central e nicho.
- `lib/criativos/prevoo-geracao.ts` aplica esta quarta porta depois do briefing e antes do custo; no sucesso, devolve os dois documentos conferidos para a futura montagem do pedido ao gerador. Nenhum prompt de nicho foi escrito ou presumido.
- Os testes sintéticos cobrem versão divergente, conteúdo vazio, nicho divergente e ausência de revisão, além das portas anteriores.

## Testes e limites

- `node --test scripts/conferir-prevoo-geracao.mjs`: 8/8 passaram; `pnpm typecheck`: passou.
- Conferência de campos no código não prova que o revisor aprovou o texto, que o arquivo veio de uma fonte confiável ou que a versão não mudou após a leitura. Não houve consulta de banco, n8n, arquivo privado, chamada paga, migração, Meta ou deploy.
