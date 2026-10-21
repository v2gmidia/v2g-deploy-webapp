# E28 — recebimento Meta e continuidade após 03/04

**Data:** 21/10/2026  
**Estado:** documentação e FigJam implementados; nenhuma alteração operacional externa.

## Decisão

As etapas 03 e 04 continuam concluídas dentro do escopo já validado. O recebimento de clientes na Meta e o App Review formam uma frente nova; não reabrem 03/04.

## Feito neste bloco

- criado `docs/recebimento-cliente-meta.md`;
- separado acesso ao app, parceria empresarial e credencial de API;
- definido playbook operacional de dez etapas;
- criada matriz de acesso mínimo e caminhos de exceção;
- documentado contrato WebApp → backend/n8n com negação por divergência;
- registrado o desalinhamento Graph API `v25.0`/`v23.0`;
- estruturado checklist de dez etapas para o App Review;
- criado cenário fictício e handoff mínimo para preparação de acesso/vídeo.
- criado novo FigJam com o fluxo operacional e o checklist visual das dez etapas do App Review.

## Não feito e não alegado

- nenhum código foi alterado;
- nenhum token ou segredo foi lido ou modificado;
- nenhum workflow n8n foi alterado;
- nenhum acesso, ativo ou configuração da Meta foi modificado;
- nenhuma submissão foi reenviada;
- o conteúdo do workflow n8n ao vivo não foi certificado;
- nenhuma publicação real foi executada.

## Bloqueios reais

1. decidir e implementar uma única arquitetura de credencial por operação;
2. eliminar IDs livres entre WebApp, n8n e backend;
3. alinhar a versão da Graph API;
4. montar um ambiente de teste reprodutível para o revisor;
5. cumprir o requisito de uso legítimo do Marketing API Access Tier;
6. refazer evidências e vídeos ponta a ponta.

## Próximo checkpoint

Pilotar o playbook com ativos de teste e registrar, etapa por etapa, evidência, tempo gasto, exceção e responsável. Mudanças de código, n8n, Meta ou submissão exigem nova autorização explícita.

## Artefatos

- `docs/recebimento-cliente-meta.md`
- FigJam `V2G | Recebimento de cliente | Meta`: https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW
