# Troca de logo: falha no envio

## 0. Dependência humana

Depois da publicação pelo Victor, conferir no QA com sessão autenticada que um envio de logo com falha mantém o logo anterior visível. Uma falha no registro depois do armazenamento ainda depende de restauro compensatório entre operações separadas; isso não é garantia transacional.

## Problema encontrado

`guardarImagem` arquivava o logo ativo antes de tentar enviar o arquivo novo. Se o Storage recusasse o arquivo, o logo antigo já deixava de aparecer na listagem ativa. O erro de atualização do registro antigo também não era conferido.

## Alteração local

- O arquivo novo é enviado antes de arquivar o logo ativo.
- A leitura e a atualização do logo anterior são conferidas; falha interrompe a troca e tenta remover o novo objeto.
- Se o novo registro falhar depois do arquivamento, o código tenta restaurar o logo anterior e informa quando não consegue confirmar o restauro.
- O objeto do logo anterior permanece guardado para rastrear peças que o utilizaram.

## Verificação

`pnpm typecheck` passou em 14/10/2026. A ordem das operações e os caminhos de erro foram inspecionados no código. Não houve upload real, escrita no banco, deploy ou teste autenticado no QA neste bloco.

## Limite

Storage e banco continuam sendo serviços separados. O restauro após falha de registro é compensatório; concorrência entre dois envios ou indisponibilidade do banco pode exigir revisão manual. Não chamar a troca de logo de transacional nem considerar o onboarding concluído por este ajuste isolado.
