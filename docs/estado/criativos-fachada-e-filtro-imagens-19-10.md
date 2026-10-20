# Criativos — fachada declarada e filtro de imagens (19/10/2026)

## Direção recebida

Victor confirmou que o recorte de referências é a Biblioteca de Anúncios da Meta, Brasil, anúncios de barbearia, com atenção apenas a imagens. A frente do negócio do cliente não pode ser inventada: a fachada deve vir de foto enviada por ele. O piloto continua sem painel.

## Feito neste bloco

- Conferida a busca pública `barbearia`, Brasil, anúncios ativos, filtro `Imagens`. A interface mostrou aproximadamente 530 resultados. Pelo menos um cartão ainda continha reprodutor de vídeo, então `media_type=image` **não é prova suficiente** de que cada resultado sirva ao lote; a peça deve ser conferida individualmente.
- Confirmado que `/conta` já tinha upload privado de até 10 fotos do negócio. O novo campo obrigatório pergunta se cada foto enviada mostra `fachada`, `ambiente` ou `produto`, validado no servidor e guardado em `creatives.copy.identidade.tipoFoto`, sem migration nem bucket novo. A lista lê `copy` explicitamente e exibe o tipo. Fotos anteriores continuam com tipo desconhecido; nenhuma vira fachada por inferência.
- A autorização do negócio continua vindo da sessão, não do campo novo. A foto permanece no bucket privado e não é enviada ao Jev neste bloco.

## Verificação

- `pnpm typecheck`: passou.
- `pnpm conferir:foto-fachada`: 2/2 testes de tipo e compatibilidade com fotos antigas.
- `pnpm conferir:identidade`: 6/6 conferências de superfície de identidade.
- Não houve teste autenticado de upload, escrita em banco real, chamada paga, publicação, commit, push, deploy ou migration.

## Falta

- Ligar a foto tipificada de fachada ao futuro gerador, com aprovação/condições de uso para esse processamento. O upload sozinho ainda não monta criativo.
- Definir uma fonte de coleta em lote cuja licença e operação permitam guardar/analisar as imagens de anúncios comerciais brasileiros. A [API oficial da Biblioteca](https://pt-br.facebook.com/ads/library/api) declara cobertura de todos os tipos para UK/UE e global para anúncios políticos, não uma API geral de comerciais brasileiros. A Meta também distingue [raspagem autorizada e não autorizada](https://www.facebook.com/help/463983701520800). Não implementar captura automatizada da interface sem essa condição resolvida.
- Antes de qualquer lote Jev: conferir formato real, pertinência ao serviço de barbearia, duplicatas, permissão de uso, teto de custo e registrar saída com ID e data. Anúncio ativo não demonstra venda.

## Depende de Victor

- Para uma peça real do próprio cliente, a foto da fachada precisa ser enviada pelo cliente e o uso com o provedor de IA precisa estar coberto por autorização adequada. Victor não precisa escolher a taxonomia técnica da foto: este bloco a definiu.
