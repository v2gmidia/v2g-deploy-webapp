# Etapa 04 — redução local de imagens grandes, 14/10/2026

## 0. Aberto

- Testar num navegador real com sessão QA: PNG, JPG, WebP e AVIF, arquivo entre 4 e 15 MB, transparência, dimensões finais, cores sugeridas e gravação. Build e TypeScript não executam o canvas.
- O servidor continua exigindo PNG/JPEG válido, no mínimo 512 pixels de cada lado; o arquivo final deve caber em 4 MB, e o lote em 9 MB. Imagens acima de 15 MB ou 24 milhões de pixels ainda exigem exportação menor. HEIC depende do decodificador do navegador; SVG não foi habilitado.

## Trabalho local

- O preparo no navegador agora reduz gradualmente imagens entre 4 e 15 MB até caber no limite final, sem descer de 512 pixels por lado. A tela avisa que pode ocorrer redução.
- Para variação que **já era JPEG**, o navegador pode usar JPEG comprimido. PNG, WebP e AVIF continuam em PNG para preservar possível transparência. O logo principal continua em PNG.
- A análise de cores usa a imagem efetivamente enviada; nenhuma regra do bucket ou autorização do negócio mudou.

## Conferências

- `pnpm typecheck`, `pnpm build` e `git diff --check` passaram.
- 69/69 casos offline de preservação do onboarding passaram; não provam decodificação no navegador nem upload ao QA.

Sem upload real, commit, push, deploy, migração ou escrita na Meta.
