# E28-06 — contexto do onboarding no preparo de criativos — 27/10/2026

## §0. Resultado e portões

**Bloco LOCAL implementado e validado com dados fictícios.** `/criativos` passa a carregar uma projeção mínima do cadastro do negócio ativo para preencher nome/cores na orientação externa e oferta/objetivo explícitos no preparo de imagem. Cada campo preserva origem, data quando existente e distinção entre declaração e confirmação. O cliente revisa e pode corrigir antes de copiar/usar.

**Falta publicar sob autorização e comprovar no QA autenticado**, com novo login, dois negócios e respostas reais permitidas. Este bloco não leu as respostas reais de Victor, não fez escrita remota, não acionou n8n/Jev/Meta/gerador, não alterou flag, não migrou, não publicou nem fez commit/push. Não demonstra imagem criada por IA. O contrato de autorização persistida do backend continua obrigatório para geração interna.

Correções na orientação são temporárias; a recarga recupera o cadastro original. Na criação interna, a oferta/objetivo corrigidos continuam seguindo o contrato existente do pedido confirmado; não há novo schema para marca/contexto ou gravação de autorização. Não foi ampliado o contexto enviado ao gerador interno.

## Mapa das fontes e interpretação

| Dado | Fonte persistida | Tratamento neste bloco |
|---|---|---|
| Nome | `businesses.name`; data da resposta `onboarding.respostas.nome.em`, quando disponível | Declaração do cliente. Nome provisório não preenche. |
| Oferta | `businesses.onboarding.respostas.oferta` | Declaração, mesmo se vier um campo livre `confirmado=true`. Usa apenas resposta explícita existente; `não sei` permanece faltante. |
| Objetivo | Resposta explícita legada `onboarding.respostas.objetivo` | Declaração para edição no pedido de criação. Resultado após compra não vira objetivo de campanha. No upload, permanecem as duas escolhas atuais WhatsApp/Instagram. |
| Descrição, público, motivo, entrega e diferencial | Chaves correspondentes em `onboarding.respostas`, com `texto/origem/em` | Contexto de apoio declarado, revisável/editável na orientação; não vira prova de resultado. Descrição não substitui oferta ausente. |
| Cores | `onboarding.marca.coresConfirmadas` pelo carregador existente `carregarMarcaDaSessao` | Apenas paleta íntegra com data e confirmação da etapa da marca; nunca extraída por inferência do logo neste bloco. |
| Logo e imagens de marca | Metadados de `creatives`, negócio ativo, usos `logo/identidade`, não arquivados, caminho vinculado ao negócio | Só contagens de logos, fotos com tipo declarado e imagens sem tipo. Sem URL, bytes, IDs de arquivos ou caminho privado no contexto do cliente/prompt. Upload não é autorização de IA. |

**Confronto com o onboarding atual:** `app/(fluxo)/onboarding/perguntas.ts` removeu a pergunta de oferta inicial da ordem atual e informa que o foco será escolhido com o gestor. Portanto, não se inventou um primeiro produto a partir da descrição. A resposta antiga de oferta é reaproveitada quando existe; onde falta, o campo continua para definição. Nenhum arquivo de onboarding/Inicio foi editado neste bloco.

Valores livres acima do limite do preparo não são cortados silenciosamente: não preenchem aquele campo. O cliente pode informar uma versão adequada. Respostas ausentes/`não sei` não ganham conteúdo inferido.

## Arquivos e comportamento

- `lib/criativos/contexto-do-negocio-da-sessao.ts`: carregador server-only SELECT sob sessão e RLS, com negócio ativo esperado, sessão verificada, filtro de dono/negócio, conferência do retorno e reuso do carregador de marca. Ausência de acesso falha fechada. Sem service role/cache global. Falha dos materiais não inventa paleta nem apaga nome/oferta; perda de autorização nega tudo.
- `lib/criativos/contexto-do-negocio.ts`: projeção pequena tipada, com valor/origem/data/estado. `contextoDesteNegocio` rejeita prop de outro negócio antes de preencher o formulário.
- `app/(protected)/criativos/page.tsx`: lê contexto e pedidos em paralelo; entrega a projeção aos componentes já vinculados por `key` ao negócio. Exibe aviso quando a leitura do cadastro falha, distinguindo falha de dados apagados.
- `ContextoDoNegocio.tsx`: mostra procedência e contexto em expansão opcional; diferencia dado declarado, cor confirmada e correção local. Permite rever os materiais na Conta.
- `OrientacaoExterna.tsx`: campos de nome, cores e oferta pré-preenchidos, sem nova pergunta sobre informação disponível; contexto de apoio editável/apagável. Conferência explícita do texto é necessária antes da cópia e deixa de valer quando o texto muda. Sem `name`, submit adicional ou autorização de IA.
- `ReferenciasDoNicho.tsx`: repassa o contexto; muda a chave por negócio/referência. Continua somente com links públicos/direção abstrata de barbearia.
- `PedirRevisao.tsx`: confere o negócio da prop e repassa contexto só para a orientação opcional; sem pergunta extra obrigatória ao upload.
- `PedidoDeImagem.tsx`: preenche oferta/objetivo existentes para edição; mantém confirmação e action/payload existentes. A fonte continua declarada mesmo depois de preencher a tela.
- `lib/criativos/orientacao-externa.ts`: inclui apoio revisado como dados delimitados, com limite e instrução para não transformar declarações em garantias, depoimentos ou promessa de venda. Nenhum arquivo é enviado automaticamente.
- `referencias-do-nicho.module.css`: checkbox local legível e com foco; estilo da tela preservado.
- `app/exemplo/contexto-criativo/page.tsx` e `_contexto-criativo/Previa.tsx`: bancada dev-only própria com negócios fictícios A/B/sem dados, usando componentes reais. Não consulta cadastros e não compartilha o arquivo de bancada geral com outras frentes.

## Prova local

**18 testes dirigidos passaram:** seis novos de contexto, seis de orientação externa e seis do carregador real de marca. O cenário de contexto foi executado novamente após incluir negação explícita quando a marca informa perda de autorização; não somar essa repetição como teste novo.

```text
node --test scripts/conferir-contexto-criativo.mjs scripts/conferir-orientacao-externa.mjs scripts/conferir-carregar-marca-da-sessao.mjs
pnpm typecheck
git diff --check
```

Cobertura: filtro ativo/dono e colunas explícitas; negativa para outro negócio/dono/marca/sessão/perda de autorização; fonte ausente/não sei; paleta íntegra confirmada e cores incompletas; oferta livre nunca confirmada por campo forjado; ausência de inferência oferta/objetivo; releitura e troca de negócio sem cache; HTML com preenchimento/procedência e cópia desabilitada antes da conferência. Rede real é vedada no harness. Testes reais anteriores de RLS/QA não são substituídos por estes mocks.

**Navegador, dados fictícios:** `http://127.0.0.1:3000/exemplo/contexto-criativo` no servidor já aberto, sem reiniciá-lo. A porta própria 3107 estava fechada; não se abriu outro dev concorrente.

1. A abriu com nome, paleta confirmada, oferta declarada e público preenchidos; só composição faltava. Nenhum arquivo foi anexado.
2. Após composição e conferência, copiar exibiu sucesso. Leitura da área de transferência imediatamente após nossa cópia confirmou nome/oferta/público de A no texto.
3. Corrigir a oferta desmarcou a conferência efetiva e bloqueou nova cópia; a fonte exibiu edição para o preparo.
4. Trocar para B trouxe nome/cores/oferta/público de B e campo de composição vazio, sem a correção de A. Selecionar `Sem dados` deixou os campos vazios e a cópia bloqueada.
5. Editar A e recarregar restaurou a oferta fictícia original e conferência desmarcada, coerente com o limite de não alterar cadastro.
6. Pedido de criação abriu com oferta preenchida e objetivo/ação vazios, sem inferir o objetivo a partir da entrega ou do nicho.
7. Inspeção em desktop e 390 px; documento móvel 375 px e campos entre x=20 e x=355, sem corte horizontal. Override removido. [Desktop](../qa/contexto-criativo-local-27-10/desktop.png) e [celular](../qa/contexto-criativo-local-27-10/mobile.png).

Tipos passaram. Diff sem erro de whitespace, apenas avisos LF/CRLF. Não houve build com dev ativo nem repetição da suíte verde de geração sem mudança em fila/worker. Revisão React preservou estado derivado, handlers para interação, labels associados e leitura independente em paralelo.

## Próxima prova após publicação autorizada

1. Novo login no QA; abrir `/criativos` de dois negócios permitidos e conferir os campos contra o onboarding/marca de cada um, incluindo versão sem oferta inicial.
2. Conferir falha de leitura, material sem tipo, paleta não confirmada e dado ausente sem transformar lacuna em dado confirmado.
3. Editar oferta/contexto e confirmar que só o pedido atual usa a correção; recarregar e conferir o cadastro original. Em pedido salvo autorizado, comprovar os valores corrigidos no mesmo pedido e após nova sessão.
4. Manter revisão/autorização por pedido e materiais antes de qualquer geração interna. Integração persistida do apoio e snapshots da identidade corrigida exigem contrato próprio; este bloco não os coloca na fila nem altera schema.

Sem ação necessária de Victor para os testes locais deste bloco. Publicação, prova autenticada e eventual gravação/consentimento adicional continuam sendo próximos portões. Alterações concorrentes de onboarding, início, agenda e demais frentes preservadas; índice compartilhado deixado para integração coordenada.
