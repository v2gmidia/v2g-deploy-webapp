# Troca do manual de marca no onboarding — 15/10/2026

## 0. Dependência humana

Depois da publicação pelo Victor, conferir no QA a troca do manual em PDF com sessão autenticada. O código local não comprova que o bucket, a função e o limite de envio do ambiente hospedado aceitam o arquivo de ponta a ponta.

## Problema encontrado

`enviarGuiaVisualAction` gravava o PDF novo e tentava arquivar as versões anteriores, mas ignorava o resultado do arquivamento. Assim poderia responder “guia salvo” mesmo com duas versões ativas. A leitura mostra só o primeiro registro, o que esconderia a duplicidade.

## Alteração local

O arquivamento dos guias anteriores agora tem resultado conferido. Se falhar, a ação tenta arquivar o registro recém-criado. Ela só remove o novo objeto do Storage quando confirma que o registro novo deixou de estar ativo, para não produzir um registro ativo com arquivo ausente. Se não consegue confirmar o desfazer, pede ao cliente que atualize e confira a situação antes de tentar novamente.

## Verificação e limite

`pnpm typecheck` passou em 15/10/2026. Não houve envio real, escrita no banco, deploy nem teste de falha do serviço. Storage e banco não formam uma transação única; uma resposta perdida ou falha durante o desfazer ainda pode exigir revisão manual. Este ajuste não conclui a etapa 04.
