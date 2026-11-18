# QA das outras contas — 16/11/2026

Consulta autenticada no site publicado, Chrome, sessão de Victor. Somente leitura.

## Resultado observado

- Conta V2G terminada em 1706: Início mostra falha de acesso de leitura à Meta nos períodos 1–16/11 e 1–15/11. Sem números ou gráfico, e sem zeros artificiais.
- Conta V2G terminada em 4584: mesma falha em ambos os períodos. Na página Anúncios, com 1–15/11, a falha também aparece: não está restrita ao componente do gráfico.
- Seletor de negócios do cliente: somente V2G disponível.
- Carteira do gestor: oito negócios retornados. Dúú Gomes tem uma conta (final 8157), atribuída a outro operador; Teste 20-09B tem uma conta (final 4906), sem gestor atribuído. A carteira não apresenta acesso a métricas dessas contas nesta sessão. Os outros cinco negócios não têm contas retornadas. Não foram alteradas atribuições nem contornadas restrições.

## Diagnóstico e limites

A mensagem exibida corresponde ao HTTP 424 no cliente (`lib/backend/anuncios-do-negocio.ts:103`). O backend mapeia os códigos Meta 10, 190, 200 e 294 para esse estado (`src/meta/leitura_anuncios.py:178`). Isso aponta para acesso/credencial/permissão da fonte, não ausência confirmada de veiculação. O código exato retornado pela Meta em cada conta não foi exposto pela tela e não foi medido neste QA.

Próximo passo: conferir a autorização de leitura da integração nas contas finais 1706 e 4584; depois repetir a comparação diária. A sessão de operador atribuído será necessária para validar os resultados de Dúú Gomes pelas telas existentes. Não declarar os gráficos dessas contas aprovados enquanto os dados estiverem indisponíveis.

Evidências: `qa-outra-conta-1706.png` e `qa-outra-conta-4584.png`.

Nenhuma alteração de código, implantação, vínculo, credencial ou campanha realizada.
