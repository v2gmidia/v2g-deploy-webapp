# Criativos — contrato local do piloto visual Jev (18/10/2026)

## §0. Depende de Victor

- Escolher nicho/negócio, material autorizado e teto total de custo antes de qualquer chamada paga. Nenhuma imagem de cliente ou de terceiro foi enviada ao Jev.
- Aprovar separadamente integração com dados reais, persistência/migration, configuração externa, publicação e qualquer escrita na Meta. Este bloco não implementa esses passos.

## Implementado neste bloco

- `lib/jev/criativos-piloto.ts` prepara um único pedido multipart com imagem e quatro perguntas fechadas: formato, gancho, sinal de prova **aparente** e oferta explícita. O texto do anúncio é dado, não instrução livre. O módulo declara o cabeçalho experimental exigido pela TypeSafe e usa o modelo já presente no repositório.
- A imagem é conferida pelos bytes e pelas dimensões de cabeçalho existentes no projeto, com recusa local de formato, tamanho e resolução fora do piloto. Isso **não** decodifica a imagem inteira nem atesta que o arquivo completo é íntegro.
- `lerRespostaVisual` só aceita rótulos e probabilidades no contrato; toda classificação continua exigindo revisão humana e não comprova desempenho, veracidade de alegação, aprovação ou publicação.
- Um conferidor novo usa apenas cabeçalhos e respostas sintéticos. Não há função de rede, consumo pela tela, flag ativada ou segredo lido neste módulo.

## Verificação e limite da prova

- `pnpm conferir:jev-criativos`: 21/21 verificações locais.
- `pnpm conferir:jev`: 5/5; `pnpm conferir:criativos`: 30/30; `pnpm typecheck`: sem erro.
- Não medimos acurácia, custo, latência, direitos de uso, coleta na Biblioteca de Anúncios/Pinterest, resultados de campanha nem QA autenticado. Atividade de anúncio público não é prova de venda.
- Nenhum banco, ambiente, serviço externo, API da Meta, deploy ou commit foi alterado.

## Próximo bloco proposto, não executado

Com piloto e teto escolhidos, montar uma amostra pequena de peças com origem e autorização registradas, rotular manualmente, executar chamadas controladas ao Jev e medir concordância/custo. Em paralelo, decidir a persistência do resultado da análise de peça pronta. A coleta em massa e a geração de imagens só entram depois dessa medição.
