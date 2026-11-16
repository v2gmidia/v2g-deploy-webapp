# Galeria do cliente e prévia de Anúncios — 16/11/2026

## Entrega local

Versão aprovada da galeria aplicada a `app/(protected)/criativos/TelaDeCriativos.tsx`, `GaleriaCriativos.tsx` e `biblioteca.module.css`. Biblioteca, Em revisão e Arquivados; busca por nome; imagens quadradas; associações consultáveis; detalhes por peça; um botão Subir criativo. Retirados da composição o segundo bloco de envio, armazenamento e ferramentas adicionais de análise/criação. Seus componentes e ações não foram apagados.

O formulário `PedirRevisao.tsx` continua usando `solicitarRevisaoAction`. Objetivo, validade de promoção e confirmação exigidos pelo contrato existente foram preservados. O sucesso confirmado pelo servidor seleciona Em revisão e atualiza a galeria; erro não cria item otimista. A revisão fica em `creative_review_requests`, arquivo privado no bucket `creative-review`, estado `awaiting_review`. A página existente `/gestor/criativos` lê essa fila. Quando habilitada, a tarefa auxiliar usa a sincronização existente. Não houve mudança de schema, configuração, permissão, publicação ou Mesa do Gestor.

O recurso continua respeitando `V2G_CREATIVE_REVIEW_ENABLED`. Não se presumiu nem alterou configuração de produção. A associação mostra o identificador registrado quando o nome do anúncio não existe na leitura atual. Não inventa nome, entrega atual ou métricas por peça. Pausa de anúncio não arquiva a imagem automaticamente; peças explicitamente arquivadas e recusadas seguem o tratamento existente.

## Prévia de Anúncios

`/exemplo/anuncios-clean` é dev-only e carrega `app/exemplo/_anuncios/PreviaClean.tsx` pelo portão de desenvolvimento existente. Lista de anúncios, filtros, busca, intervalo livre e detalhes com criativo associado. Os dois anúncios são exemplos declarados e as métricas permanecem sem valor, não zero. A rota real `/anuncios` não foi redesenhada nesta entrega.

Os SVGs de exemplo em `public/criativos/criativo-{conversas,presenca,proximo}.svg` foram copiados da prévia aprovada em `C:/Users/victo/.codex/visualizations/2026/11/14/v2g-inicio-prototipo/assets/`. O PNG `v2g-clareza-feed-v1.png` já existia no produto. Esses arquivos são usados exclusivamente pelos exemplos desta entrega.

## Evidência e limites

- Compilação de produção passou. O primeiro ensaio encontrou referências antigas a rotas removidas em `.next/dev/types`; o cache de tipos foi preservado em `.next/dev/types-anterior-1611`, e a compilação seguinte passou.
- `pnpm conferir` passou; `pnpm typecheck` passou após adicionar a prévia de Anúncios.
- 58 testes específicos passaram: revisão de criativos (11), intenção/envio e tarefas do gestor (47). Incluem a action real com dependências simuladas, persistência do estado e arquivo, replay, falha parcial, autorização e decisão do gestor.
- Chrome: upload local na bancada até confirmação, revisão, detalhes, busca sem resultados, filtros de Anúncios e intervalo de 01/01 a 31/03. Desktop e 390px conferidos, sem overflow horizontal observado. Console da galeria sem erros/avisos capturados.
- O localhost autenticado pediu login. Victor pediu continuar sem depender dele, com dados de teste. Nenhuma conta foi criada, nenhuma credencial foi inventada e nenhum arquivo foi gravado numa conta real. A integração foi preservada e validada com testes simulados; não se afirma um envio real observado em produção.

Sem commit, push ou deploy. Prévia: `http://localhost:3000/exemplo/criativos` e `http://localhost:3000/exemplo/anuncios-clean`.
