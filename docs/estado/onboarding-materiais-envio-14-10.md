# Etapa 04 — envio de materiais da marca, 14/10/2026

## 0. Aberto

- Ainda faltam aceitação e tratamento seguros de outros formatos de imagem. O envio mantém PNG para logo principal e PNG/JPG para imagens adicionais; a interface agora explica isso diretamente. Não afirmar que aceita qualquer imagem.
- A largura real do fluxo, a cor sugerida por várias imagens, a troca e a remoção de uma imagem precisam de ensaio autenticado no QA após publicação manual pelo Victor.
- Um PDF de 9 MB cabe no teto configurado de 10 MB para Server Actions, com 1 MB de folga, e no bucket de 10 MB do QA. Ainda é preciso comprovar o upload real e a leitura de suas primeiras páginas no navegador.

## Trabalho local

- A abertura da marca agora pede os materiais disponíveis sem sugerir que o cliente precise descrever códigos de cor. Os formulários distinguem logo principal, várias imagens adicionais e manual PDF.
- O limite do manual passou de 4 MB para o teto de 9 MB já derivado da configuração existente de Server Actions, de forma consistente no navegador, na ação e na leitura local de cores.
- A galeria mostra quantas vagas restam das seis imagens adicionais. O cliente pode arquivar uma imagem enviada para abrir vaga; a ação restringe ID, negócio da sessão, uso e tipo, e não apaga o objeto privado.
- O limite por imagem adicional permanece 4 MB e o lote total permanece 9 MB; nenhum limite do servidor, do bucket ou do logo principal foi alterado.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm build`: passou após a alteração da ação de remoção.
- `git diff --check`: passou, com avisos de finais de linha.

Não houve upload real, commit, push, deploy, migração, cobrança ou escrita na Meta.
