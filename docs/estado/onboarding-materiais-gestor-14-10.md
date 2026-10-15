# Etapa 04 — materiais de marca disponíveis para o gestor, 14/10/2026

## 0. Aberto

- Publicar pelo fluxo manual do Victor e verificar no QA com operador autenticado: logo, várias imagens e manual PDF enviados pelo cliente devem abrir somente no negócio correto. Repetir sem papel de operador para confirmar bloqueio.
- O envio continua restrito aos formatos e tamanhos atuais. O WebApp não aceita todos os formatos de imagem; ampliar formatos e tamanho sem mudar a validação e o transporte seria uma promessa falsa.
- O uso das referências na proposta e a agenda própria ainda exigem prova separada. Esta tela é consulta para a pessoa que prepara a reunião.

## Trabalho local

- A carteira do gestor agora liga cada negócio a uma consulta de seus materiais de marca.
- A nova página confere o papel de operador antes de criar o cliente administrativo. Consulta o negócio pelo ID, busca logo vigente, imagens adicionais e o PDF vigente, todos limitados ao mesmo `business_id` e a arquivos não arquivados.
- Os arquivos privados recebem links de duração curta. Quando a assinatura dos links falha, a página mostra que o arquivo está registrado e que o link está indisponível, sem afirmar ausência de material.
- Cores confirmadas e observação do cliente são exibidas separadas das sugestões extraídas dos arquivos. O manual completo continua exigindo leitura humana.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm build`: passou, com `/gestor/negocio/[id]/marca` no mapa de rotas.
- `git diff --check`: passou, com avisos de finais de linha.

Não houve acesso a arquivo real, commit, push, deploy, migração ou escrita na Meta neste bloco.
