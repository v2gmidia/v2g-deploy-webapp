# V4 — frase da LP, design local para revisão

**PNG final:** `v2g-gestao-sem-gestor-v4.png`, **1080 × 1080**, 353.908 bytes, SHA-256 `4e5f7ed447eacb223d0bb64a597281ca0a30e29a4db67665032620fc8aac8507`.

Headline exata: **“Gestão de tráfego sem gestor de tráfego.”** Primeira parte em branco, segunda em azul claro `#B0E9FD`. Apoio explícito: **“Gestão de anúncios com acompanhamento humano.”** Marca própria e CTA “Converse com a V2G” preservados. `copy.txt` traz o texto proposto coerente com a imagem.

## Fonte e prova

- `arte.html`: fonte editável, símbolo vetorial existente e Archivo local. Não usa fotos de terceiros, ativos privados ou downloads novos. Texto conferido em `../lp/index.html:44`. A instrução de hierarquia foi recebida pela Central; o print original não foi aberto neste chat.
- Captura desktop inspecionada: 1080 × 1080; fonte carregada; headline no DOM exata; nenhum texto excede a área útil de 920 px.
- `leitura-mobile-358.png`: os pixels da arte final reduzidos a 358 × 358 para conferir leitura de headline, apoio humano e CTA. Inspecionado visualmente. Não é screenshot móvel.
- DOM da prévia em 390 × 844: imagem carregada 1080 × 1080, exibida em 358 px, sem rolagem horizontal. A captura móvel do navegador divergiu do DOM e **não é usada como evidência visual**; mantida apenas para diagnóstico em `captura-mobile-nao-usada.png`.
- `conferir.py`: formato/dimensões, headline, apoio, CTA, contraste, hashes e PNG V3 intacto. Contrastes contra o fundo: branco **19,07:1**, azul claro **14,45:1**, lima **17,09:1**.
- O navegador forneceu JPEG; o original está preservado. `exportar-png.py` converte para PNG sem alterar dimensões. Isso não recupera detalhes comprimidos do JPEG.

## Estado e limites

**Design local determinístico. Não gerado pelo agente V2G.** Sem chamadas pagas, upload, consulta/escrita QA, Meta, publicação, alteração de produto, commit, push ou deploy. V3 preservada em pasta separada.

A frase não é evidência de automação pronta nem de ausência de pessoas. O apoio humano permanece na imagem e no texto. Não há métricas inventadas ou resultado prometido.

Campanha recebida de Victor: Leads → conversas no WhatsApp da Página V2G, final **2928**, Brasil, **R$ 500 TOTAL** de mídia, publicar junto com Victor. Sem número/URL completos inferidos. Público exato e período continuam para revisão.

**Próximo passo:** Victor revisa este PNG exato e o texto antes de qualquer upload/publicação.

## Prévia

`servir-previa.mjs` serve uma lista restrita de arquivos somente em `127.0.0.1:3190`; `/previa` exibe o PNG final e identifica a origem local. A prévia depende do servidor local ativo.
