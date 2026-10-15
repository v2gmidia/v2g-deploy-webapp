# Falha em lote de imagens da marca — 15/10/2026

## 0. Dependência humana

Depois da publicação pelo Victor, testar o envio de várias imagens no QA autenticado. O teste local não força falhas reais do Storage ou do banco; não há prova de recuperação completa entre serviços.

## Problema encontrado

Quando um arquivo de um lote falhava, a ação tentava arquivar as linhas já criadas e depois apagava todos os objetos do lote, sem conferir se o arquivamento funcionou. Se uma linha continuasse ativa, apontaria para um arquivo apagado e a imagem apareceria quebrada.

## Alteração local

Cada linha já salva agora é arquivada com confirmação. Só os objetos cujas linhas foram confirmadamente arquivadas são removidos do Storage. Se o desfazer fica incerto, a resposta não declara o lote revertido; pede atualização da página antes de outra tentativa. Os arquivos de linhas possivelmente ativas permanecem disponíveis.

## Verificação e limite

`pnpm typecheck` e `git diff --check` passaram em 15/10/2026. Não houve upload, escrita no banco, migration nem deploy. A operação continua compensatória, sem transação única entre Storage e banco. Pode restar objeto órfão se a remoção do Storage falhar após o arquivamento; a ação registra esse erro no servidor.
