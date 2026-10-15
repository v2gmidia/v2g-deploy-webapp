# Etapa 04 — imagens convertidas no navegador, 14/10/2026

## 0. Aberto

- Provar em navegador autenticado no QA, após publicação manual, pelo menos PNG, JPG, WebP e AVIF no logo e nas imagens adicionais; conferir arquivo salvo, cores sugeridas e retorno de erro. O build não executa `createImageBitmap` nem o canvas.
- HEIC/HEIF só funciona se o navegador conseguir decodificar; quando não conseguir, a interface pede exportação em PNG/JPG. SVG e outros formatos não foram habilitados. A etapa não aceita literalmente todo tipo de imagem.
- O arquivo final continua sujeito a 4 MB, dimensões mínimas e verificação real de bytes no servidor. Imagens muito grandes devem ser exportadas em tamanho menor; a conversão local não reduz resolução silenciosamente.

## Trabalho local

- Adicionado preparo local antes da Server Action: PNG segue como está; JPG já aceito nas imagens adicionais segue como está; JPG de logo e WebP/AVIF/HEIC/HEIF decodificáveis viram PNG no navegador.
- A conversão não envia o original nem muda as regras do bucket. O servidor continua conferindo PNG/JPEG pelos bytes e dimensões, e toda imagem fica isolada pelo negócio da sessão.
- O preparo limita o original a 15 MB e a 24 milhões de pixels para evitar uma conversão excessiva no dispositivo. Se a conversão não couber nos 4 MB finais, a pessoa recebe uma saída explícita.
- O envio de várias imagens prepara cada uma antes de qualquer gravação; depois aplica o teto de 9 MB ao lote já convertido. As cores são analisadas a partir dos arquivos que de fato foram enviados.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm build`: passou com o módulo de conversão no bundle do cliente.
- `git diff --check`: passou, com avisos de finais de linha.

Nenhum upload real, commit, push, deploy, migração ou escrita na Meta ocorreu neste bloco.
