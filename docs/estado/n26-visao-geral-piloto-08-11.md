# N26 — visão geral da jornada até o piloto — 08/11/2026

## 0. Resultado

Victor autorizou reorganizar a planilha para mostrar o que já funciona, o bloqueio, o responsável e o próximo passo até o cliente piloto, mantendo detalhes técnicos separados. **Reorganização concluída na mesma planilha**, sem criar outro arquivo ou alterar compartilhamento.

[Planilha central](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit), nova primeira aba **Visão geral**, gid `2026110801`, área `A1:G33`.

- `A5:G13`: oito etapas — contratar, acesso, onboarding/marca, conexão Meta, criativo, operação do Cauã, resultados e aceite do piloto.
- Colunas: etapa, resultado esperado, comprovado/ambiente, bloqueio atual, responsável, próximo passo e prova para concluir.
- `A17:G23`: quatro marcos — dados na tela, peça/decisão, rodada assistida e aceite. M1/M2 podem avançar em paralelo.
- `A25:G31`: seis links para execução técnica, carteira/rotina, decisões/riscos, referência anterior e mapas existentes.

Os números de migrations e hashes permanecem na execução técnica; não se apresentam como percentual de prontidão do produto. U5 fica separada como preparação local, sem aplicação; U6 e aceite global continuam pendentes. A rotina assistida do piloto já vinculado não ganha uma exigência artificial de nova compra ou de todos os módulos opcionais.

## 1. Correção do estado operacional

O overview anterior da Central usou o estado antigo da planilha e disse que faltava escolher o piloto. O registro operacional mais recente, [piloto-piligrin-caua-05-11.md](./piloto-piligrin-caua-05-11.md:9), já confirma **Dúú Gomes/Piligrin como primeiro piloto**, FamFire posteriormente. As atualizações de 06/11, especialmente linhas 115–132, registram acesso nominal QA, carteira de Cauã e vínculo da CA/Página do Dúú, mantendo a leitura de números no aplicativo indisponível naquele ensaio.

A correção foi comunicada a Victor e incorporada à visão principal e às células operacionais desatualizadas. Não se pediu nova escolha do piloto, nova cobrança ou novos prints recorrentes como condição para avançar. A prova de API da conta V2G em 07/11 permanece separada da prova dos números Dúú no WebApp/mesa, ainda pendente. Acesso humano à Meta, vínculo persistido, leitura pela API e publicação são aceites distintos.

O marco do piloto é uma rodada assistida rastreável do Dúú: números na tela com fonte/período, peça/revisão do mesmo negócio e limites do Cauã combinados. Publicar ou gastar ainda exige ato nominal próprio; a reorganização não executa esses atos.

## 2. Preservação e verificação

O controle existente executou a edição por conector e reportou releitura de **103 textos, oito notas de fonte e seis hyperlinks**. Foram preservadas as cinco abas anteriores; a antiga Comece aqui passou a **Referência anterior**, com o mesmo gid `2026110401`.

Faixas antigas atualizadas:

- Novembro — execução: `H2`, `J2`, `L2`, `H5:L9` e `E6`.
- Cauã — operação: `D2`, `G2`, `I2:J2` e a ficha do piloto na linha 3.
- Decisões e riscos: `B2:B4` e `E2:E4`.

As **48 células atualizadas** guardam integralmente o texto anterior em notas, preservando o formato; **443 células originais não alteradas** foram conferidas iguais. Não foram apagadas semanas, evidências ou fórmulas para simplificar a apresentação. A primeira tentativa de lote foi recusada integralmente por mesclar título sobre coluna congelada; retirado apenas o congelamento de coluna da nova aba, o lote foi aplicado e relido. O cabeçalho fica congelado até a linha 5; não houve escrita parcial daquela tentativa.

A Central confirmou metadados e releu os marcos por API. Conferiu também a renderização nativa no Chrome autenticado, **100% / 1536 px**, nas etapas e nos marcos M1–M4: sete colunas visíveis, textos com quebra e sem corte interno ou sobreposição observados. A nova aba foi deixada aberta na visão inicial. Não se exportou ou recriou a planilha para inspecioná-la.

## 3. Como manter o acompanhamento

Atualizar primeiro o resultado observável, o bloqueio com dono e a menor próxima prova. Identificar sempre se a evidência é local, QA ou produção. Detalhes extensos de ambiente, SQL, hashes e testes ficam na execução técnica e nos checkpoints vinculados; a visão geral recebe apenas sua consequência para a jornada.

Este bloco reorganiza acompanhamento. Não certifica funcionamento completo do piloto, autorização de produção, Meta, cobrança ou deployment. A preparação U5 autorizada na mesma mensagem tem registro próprio; nenhum ato de aplicação está incluído neste documento.
