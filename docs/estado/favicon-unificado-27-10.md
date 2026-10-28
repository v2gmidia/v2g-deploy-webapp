# Favicon compartilhado — 27/10/2026

## 0. Próximo passo humano

Publicar a alteração da LP pelo fluxo habitual. Sem commit, push ou deploy neste bloco.

## Pedido e execução

Victor pediu o mesmo ícone nas abas da LP e do WebApp. A referência adotada foi a arte branca do WebApp em `app/icon.png`, preservada integralmente (símbolo claro sobre placa marinho, cantos transparentes).

Na LP, `scripts/sincronizar-favicon.mjs` usa essa imagem como origem única e gera `favicon.svg` (PNG original embutido), `favicon.ico` (16/32/48), `favicon-32.png` e `apple-touch-icon.png` (180). O `index.html` aponta aos arquivos com versão de cache nova. Nenhuma página legal foi editada. Nenhum tema de página foi alterado.

## Evidência local

O script passou: igualdade binária entre a origem e a imagem embutida no SVG; dimensões dos PNGs verificadas. Arte de origem e PNG da LP inspecionados visualmente. Validação adicional dos frames ICO: dimensões e conteúdo equivalentes à redução da mesma origem.

Produção e cache do Chrome após publicação não foram verificados. Não se executou build ou suíte de aplicação: alteração restrita aos assets da LP, às referências e ao gerador local.
