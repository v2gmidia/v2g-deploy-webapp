# Expectativas comerciais no WebApp — 06/10/2026

## Divergência encontrada

A rota `/expectativas`, acessível pelo início do produto, ainda dizia “sem fidelidade, sem multa”, cancelamento a qualquer momento e limite de R$ 3 mil de verba mensal. O botão final mostrava um selo de acordo sem registrar aceite nem pagamento; o bloco de dúvidas simulava uma resposta em chat inexistente. A `/conta` repetia “sem fidelidade” e prometia cancelamento em dois toques e retenção de dados por 90 dias sem contrato ou função que provasse isso.

Essas afirmações contrariavam as decisões diretas de Victor sobre permanência mínima de seis meses, avaliação do Instagram sem bloqueio, primeira campanha publicada manualmente pelo gestor e acesso ao WebApp depois do pagamento.

## Alteração local

- `/expectativas` agora explica a jornada vigente, condições de entrada e permanência, sem preço inventado, limite de verba não decidido, aceite fictício ou chat simulado. A última ação volta ao início; o contato de dúvidas aponta para o WhatsApp da equipe.
- `/conta` não promete cancelamento dentro do aplicativo ou retenção de 90 dias. Distingue contatos registrados de vendas e informa que o cancelamento pelo app ainda não está disponível.

## Prova e limite

`pnpm typecheck`, `pnpm conferir` e `pnpm build` retornaram código 0. Não havia processo `next dev` ou `next build` concorrente. A interface autenticada não foi exercitada; texto contratual final, pagamento, suporte e agendamento não foram validados em produção. Nenhum aceite, cobrança ou envio de mensagem foi executado.
