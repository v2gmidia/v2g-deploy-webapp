# Criativos — mapa seguro do piloto no n8n (19/10/2026)

## §0. Depende de Victor

- Escolher **um** negócio piloto e uma amostra pequena de imagens/referências que possamos enviar à TypeSafe, com origem e direito de uso/envio registrados. Victor informou que Fleetlink trabalha com rastreamento de veículos e frotas e Karine com arquitetura; isso é classificação declarada por ele, não confirmação de ID no catálogo técnico.
- Definir teto **por ensaio** e teto total. Victor informou ter depositado US$ 5 no Jev; saldo, preço por imagem e custo final não foram conferidos. O fluxo deixa o teto em **US$ 0** por padrão.
- Confirmar credencial TypeSafe própria e caminho autorizado de acesso às imagens. A credencial genérica visível no n8n não comprova ser do Jev. Nenhum segredo foi lido.
- Aprovar separadamente qualquer chamada paga, armazenamento com dados reais, configuração externa, publicação, migration ou escrita na Meta. O fluxo aqui não executa essas operações.

## Feito neste bloco

- Criado no n8n o fluxo novo e isolado [V2G | 06 | Jev e contexto - piloto seguro](https://ia-n8n.5hue9s.easypanel.host/workflow/3kfUlXxPnKRDMB60), ID `3kfUlXxPnKRDMB60`. Ele está **inativo**, sem webhook, agendamento, credencial, HTTP, coleta da Biblioteca/Pinterest ou chamada paga.
- A entrada manual contém nicho proposto, confirmação do ID técnico, origem/URL da referência, disponibilidade da imagem, autorização de envio e teto por ensaio. A porta impede avanço quando faltam esses campos. A saída positiva ainda é só um marcador de futura integração; não chama o Jev.
- Notas no canvas separam: (1) coleta e direitos; (2) classificação fechada pelo Jev; (3) leitura do documento central e da versão aprovada do nicho **após** a seleção das referências, ao montar o briefing de geração; (4) aprovação no app, publicação pelo `backend_v2g` e prova de veiculação. Os caminhos locais dos documentos são **ponteiros para o desenho**, não arquivos que o n8n remoto já consiga ler.
- O FigJam [Caminho vivo](https://www.figma.com/board/ef7mmLv8bzYxrDhZCXgMgL/V2G-%7C-Criativos-e-campanha-%7C-Caminho-vivo?node-id=1-2) foi atualizado para distinguir fluxo n8n feito de coleta e piloto ainda pendentes.

## Teste e limite da prova

- Validação do desenho do workflow: válido, 9 nós. Teste manual simulado do próprio n8n: execução `12` com status `success`; a porta encaminhou os dados vazios para `04B | Aguardar amostra e direitos`, sem executar o ramo positivo. Busca posterior confirmou `active=false`.
- O teste **não** mede acesso à Biblioteca de Anúncios, capacidade visual do Jev, acurácia, latência, custo ou geração de imagem. Nenhuma imagem foi enviada nem houve gasto de token neste bloco.
- Fluxos antigos da V2G foram localizados, mas esta conexão não tem leitura MCP habilitada neles. Nenhum fluxo ativo foi alterado.

## Próximo bloco proposto, não executado

1. Obter amostra pequena com procedência e direito de envio e confirmar o nicho no catálogo vivo.
2. Colocar os documentos versionados em fonte acessível e autorizada ao n8n, apenas quando forem consumidos no briefing; não transformá-los em prompt do Jev nem presumir que o template de nicho seja um documento validado.
3. Com teto autorizado, conectar uma única chamada visual real ao Jev, rotular as mesmas imagens por humano e medir custo, tempo, concordância e falhas. Só então discutir coleta em lote e geração.
