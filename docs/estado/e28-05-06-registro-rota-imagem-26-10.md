# 05/06 — Registro de segurança da rota de imagem gerada (26/10/2026)

## §0. Resultado e limite

Achado reportado pelo 03/04 resolvido localmente: a rota existia e tinha proteção por posse, mas faltava sua declaração na lista de segurança. `conferir:identidade` passou **6/6** após registrar a justificativa real. O conferidor não foi alterado.

Geração v2 continua bloqueada. Upload/proveniência de marca não equivalem a autorização persistida para IA; nenhuma chamada paga, QA, migration ou publicação foi iniciada. As pendências de integração permanecem em [contexto v2](./e28-05-06-contexto-referencia-v2-local-26-10.md).

## Guarda revisada

- `app/(protected)/criativos/imagem-gerada/[requestId]/route.ts:6` entrega os parâmetros a `lerImagemGerada`; a URL não concede acesso por si.
- `lib/criativos/geracao/imagem-privada.ts:29` valida flags e UUIDs; autentica com `getUser`, reconfere negócio ativo e relê o pedido sob sessão/RLS, por ID e negócio, exigindo autoria do usuário. Pedido v2 não abre arquivo legado.
- Antes de baixar com admin, confere resultado pelo backend autenticado, registro de `creatives` do mesmo negócio, caminho canônico, tentativa, hashes e simulação. Bucket deve ser privado; os bytes precisam coincidir com hash/PNG/dimensões.
- A rota responde 404 sem bytes em falhas e envia cache privado sem armazenamento, `Vary: Cookie` e `nosniff`.

## Alteração

Somente `lib/seguranca/excecoes.ts`: adicionada a rota à taxonomia existente **posse**, com parâmetros externos e justificativa que aponta para as verificações reais. Não se acrescentou autorização por papel, categoria nova ou bypass. Handler e helper permaneceram intactos neste complemento.

## Verificação dirigida

- `pnpm conferir:identidade`: **6/6**, 186 arquivos analisados, 18 declarações, nenhuma ausente/órfã. Controles negativos do próprio conferidor continuam ativos.
- `node --test --test-name-pattern="action ->|troca de negócio|bucket público" scripts/conferir-ui-fila-geracao-local.mjs`: **4/4**. Rota real no laboratório local: imagem autorizada retorna PNG privado; outro negócio/ator recebe 404; biblioteca persistida sobrevive à geração OFF; bucket público, falha de download e bytes adulterados não abrem imagem.
- `pnpm typecheck`: passou.

Os testes usam banco efêmero e provedor fictício, sem dados de cliente ou geração paga. Não demonstram QA autenticado nem produção. As mudanças de outros chats no checkout foram preservadas. Índice compartilhado fica para integração pelo Central.
