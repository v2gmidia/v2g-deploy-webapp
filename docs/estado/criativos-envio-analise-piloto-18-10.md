# Criativos — envio seguido de análise opcional (18/10/2026)

## §0. Depende de Victor

- Definir nicho e negócio piloto, autorização para usar seus materiais no ensaio e teto de custo antes de habilitar `V2G_CREATIVE_AUTO_ANALYSIS_ENABLED` em qualquer ambiente.
- Aprovar separadamente mudanças de banco, publicação ou configuração externa. Este lote não aplicou migration, não chamou a Meta e não fez deploy.
- Reconciliar a decisão mais recente de aprovação principal no aplicativo com o texto antigo de `docs/decisoes.md` que ainda exige e-mail. Este lote não mudou a alçada de aprovação.

## Escopo aprovado e implementado localmente

O primeiro recorte é uma imagem pronta enviada pelo cliente. O arquivo entra na fila privada de revisão já existente. Se o piloto de análise automática estiver habilitado **e** houver execução do negócio ativo, a mesma imagem é enviada à rota de análise do backend após a confirmação do upload. O resultado aparece na tela como análise, sem virar aprovação do gestor ou prova de anúncio no ar.

- `PedirRevisao.tsx` distingue envio, análise em andamento, conclusão e falha parcial. Se o upload foi confirmado e a análise falhou, a mensagem preserva o fato de que a peça está na fila. Não mostra porcentagem inventada.
- `revisao-actions.ts` só autoriza uma chamada automática em uma solicitação nova. Repetir o mesmo UUID não repete a análise. A verificação de execução é feita depois de persistir a peça; falha nessa verificação não desfaz o upload.
- `lib/criativos/espera.ts` centraliza o limite de espera usado pela análise isolada e pela análise após envio. Encerrar a espera no navegador **não cancela** a Server Action no servidor.
- `V2G_CREATIVE_AUTO_ANALYSIS_ENABLED` é uma nova flag, desligada por padrão. Nenhuma configuração foi alterada neste lote. Com ela desligada, o envio e a revisão humana continuam funcionando como antes.

## Evidência e limites

- O OpenAPI do backend configurado foi lido sem POST e declara `POST /execucoes/{id_execucao}/criativo-pronto` e `POST /execucoes/{id_execucao}/criativos-enviados`. Declaração de rota não é prova de análise autenticada, resultado correto ou publicação.
- `pnpm conferir:revisao-criativos`: 8/8 testes passaram, incluindo piloto desligado, ausência de execução e envio repetido.
- `pnpm conferir:criativos`: 30 conferências passaram. `pnpm conferir:envio`: 48/48 passaram. `pnpm typecheck`: passou.
- Não houve chamada paga de análise, teste com cliente autenticado, alteração de banco, publicação na Meta ou medição de custo neste lote. O resultado da análise após envio é transitório na tela; a fila persistente ainda registra apenas a revisão humana.
- O dev já ocupava a porta 3000. `pnpm build` não foi executado para evitar conflito com a pasta `.next` compartilhada.

## Próximo bloco proposto, não executado

Escolher o piloto e seu teto de custo; medir um caso de análise com material autorizado, inclusive retorno e custo. Em seguida, desenhar persistência de resultado e vínculo com o pedido de revisão, com migração e QA autenticado aprovados separadamente. Documento central, documento do primeiro nicho, referência externa e geração de imagem continuam fora deste recorte.
