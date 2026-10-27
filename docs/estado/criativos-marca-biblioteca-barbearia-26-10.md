# Criativos — marca + Biblioteca, recorte barbearia (26/10/2026)

## Decisão humana desta conversa

Victor priorizou duas fontes para a primeira geração: (1) logo e imagens próprias que mostrem a identidade visual, confirmadas no onboarding, e (2) referências de anúncios de imagem da Biblioteca de Anúncios para o nicho de barbearia. Pinterest fica fora deste recorte. Victor pediu Jev para analisar as referências e quer acompanhar a etapa de geração.

## Fato verificado antes da edição

- O onboarding já recebia logo e variações e sugeria cores por pixels; o cliente podia corrigir a paleta. Essa leitura não descobre automaticamente uma tipografia exata nem comprova qualidade de uma peça.
- `lib/criativos/geracao/triangulo-contexto.ts` exigia exatamente identidade, Pinterest e anúncio do nicho, mas `src/imagem/geracao_contrato.py` no backend aceita dois ou três materiais, desde que haja logo e referência.
- `src/imagem/geracao_contexto_existente.py` ainda retorna `None` como contexto aprovado: não existe fonte persistente confiável para revisão, condição de uso e autorização dos materiais. Portanto o dispatcher real não pode gerar a partir do onboarding sozinho.
- `docs/estado/criativos-barbearia-triagem-n8n-19-10.md` registra 10 IDs observados manualmente na Biblioteca, seis candidatos e quatro fora do escopo; só uma imagem foi conferida. O workflow n8n está inativo e para antes do Jev. Não existe prova de varredura completa ou de resultado comercial desses anúncios.
- O catálogo `knowledge/` atual do `backend_v2g` não contém `barbearia.md`. `servico_barbearia` na Data Table é uma etiqueta de pesquisa; não pode ser promovida ao ID técnico do nicho para gerar imagem. É preciso definir e validar o nicho no backend ou usar um nicho já aprovado quando houver correspondência real.
- A API oficial da Biblioteca não oferece busca geral de anúncios comerciais brasileiros: <https://www.facebook.com/ads/library/api/>. Anúncio ativo por muito tempo é sinal de continuidade, não evidência de venda ou lucro.
- Em 26/10, a interface da Biblioteca foi relida para o ID `700155112131034`: mostrou `Ativo`, Barbearia Slim, veiculação iniciada em **06/08/2025** e uma peça visual com foto de corte de cabelo. Isso confirma a disponibilidade dessa referência na consulta de hoje; não revela custo, conversão, lucro nem condição de reutilização da imagem. URL: <https://www.facebook.com/ads/library/?id=700155112131034>.
- A documentação atual da TypeSafe permite perguntas de classificação sobre imagem, mas a classifica como experimental e exige `TypeSafe-Danger-Zone-Images: true`: <https://docs.typesafe.ai/images>. Jev recebe uma imagem fornecida; não consulta a Biblioteca sozinho. O caso debatido no Reddit também não mostrou um coletor verificável: <https://www.reddit.com/r/SaaS/comments/1wok0cg/jev_broke_down_724_live_ads_from_37_brands_in_40/>.

## Entrega local deste bloco

- Texto do onboarding explica a importância do logo principal e de imagens próprias com cores da marca, sem afirmar que toda a identidade visual foi extraída automaticamente.
- O montador de contexto exige exatamente uma identidade do cliente e uma referência da Biblioteca do nicho. Pinterest foi removido como requisito e é rejeitado como substituto do anúncio. Origem, revisão, hash, negócio, nicho, autorização por material/pedido e orçamento continuam obrigatórios.
- O backend Pydantic existente aceitou o manifesto de duas fontes no teste offline.
- `scripts/conferir-triangulo-contexto-real.mjs`: 7 testes passaram. `pnpm typecheck`: passou.

## Ensaio Jev no Playground (26/10/2026)

- Victor entrou na conta TypeSafe. No Playground, fiz **uma** chamada `jev-preview` com descrição resumida e pública do anúncio da Barbearia Slim, ID `700155112131034`. Não enviei imagem, arquivo de cliente ou material privado.
- Perguntas: tipo de negócio, existência de prova direta de venda/retorno e existência de preço numérico. Resposta exibida: `servico_barbearia` 100% de confiança na Choice; prova de resultado 4% true; preço numérico 12% true. A revisão humana da mesma descrição concorda com as três classificações. Esses percentuais são saídas do modelo para este texto, não acurácia medida nem desempenho do anúncio.
- Tempo exibido pelo Playground: 109 ms + 363 ms. A tela Usage, no período de 30 dias, mostrou 12 requisições, 8.109 tokens e custo estimado agregado de US$ 0,0003, com aviso de possível atraso; **não isola o custo desta chamada**. Saldo exibido: US$ 4,99.
- Este ensaio prova apenas que o Jev classifica uma descrição fornecida. **Não** prova leitura da imagem, coleta automática na Biblioteca, direito de reutilizar a peça, conversão, geração pelo agente, nem integração do aplicativo. O workflow n8n permanece inativo.
- Não criei API key ou credencial e não ativei nada em QA/produção.

## Ensaio visual autorizado (26/10/2026)

- Victor autorizou especificamente enviar à TypeSafe a foto pública com rosto exibida no anúncio Meta ID `700155112131034`, apenas para análise. O arquivo temporário veio do recurso de imagem já renderizado na página da Biblioteca; não foi copiado para este repositório nem aprovado para reutilização em criativos.
- A primeira tentativa no Playground tinha o arquivo na bandeja de assets, **mas não o referenciava no state**. Deu `foto_servico` 53%, texto sobreposto 39% true e logo 43% true. A documentação da TypeSafe exige referência textual do asset no `state`, `instructions` ou `criteria`; portanto essa tentativa **não prova leitura visual**. Fonte: <https://docs.typesafe.ai/images>.
- Corrigi o state com a referência inserida pelo seletor de assets e executei uma nova chamada única. `jev-preview` respondeu `foto_servico` 100%; texto de oferta/preço sobreposto 2% true; logo visível 4% true. Tempo exibido: 123 ms + 254 ms. Minha leitura direta da foto concorda: retrato de cliente com corte de cabelo, sem texto nem logotipo na própria arte.
- A tela Usage mudou de 12 para 13 requisições e de 8.109 para 8.723 tokens, mas mantém aviso de atraso; gasto estimado agregado continuou US$ 0,0003. Como houve duas chamadas nesta rodada e a contabilização estava incompleta, **custo individual da chamada visual não verificado**.
- A inferência técnica é que este exemplo pode inspirar estilo fotográfico. Ele não fornece prova de conversão, ROI ou qualidade da campanha e não traz composição de oferta na imagem. O Jev não coletou anúncios da Biblioteca sozinho. A referência continua com revisão humana; nenhum job de geração foi disparado.

## Próximo recorte para trabalho acompanhado

1. Obter, por canal autorizado, uma única imagem admissível de anúncio de barbearia e sua condição de uso; registrar o ID da Biblioteca, URL, anunciante, início exibido, consulta e revisão humana. O catálogo do n8n contém metadados candidatos, não bytes autorizados.
2. Uma imagem pública foi analisada visualmente com autorização específica, conforme acima. Antes de transformá-la em insumo do gerador, selecionar referências com estrutura de oferta e condição de uso revisada, criar critérios de qualidade por nicho e separar fatos observados de hipótese comercial. A chamada visual não implica permissão para reprodução da foto.
3. Desenhar e revisar persistência por nicho/negócio e autorização por pedido/material/hash para o loader real. Nenhuma migration remota foi aplicada. Supabase CLI não está instalado neste repo, portanto nenhum arquivo de migration foi improvisado nesta rodada.
4. Antes da geração real, conectar loader persistente, identidade verificável WebApp/backend e ambiente gravável isolado. Victor quer acompanhar a geração; não ativar flags nem chamar provedor de imagem enquanto essas dependências estiverem abertas.

Sem commit, push, deploy, alteração de QA/produção, provedor de imagem, coleta automatizada ou dados reais copiados para o repositório. Houve as chamadas de Jev documentadas acima dentro do saldo existente, com custo individual não discriminado na tela.

## Correção de rumo solicitada por Victor — lote de anúncios, não foto isolada

Victor esclareceu que o objetivo é **varrer vários anúncios da Biblioteca, filtrar os que pertencem a barbearias que prestam o serviço e examinar sinais observáveis de continuidade**. A classificação visual de uma foto isolada acima não atende a esse objetivo. A orientação anterior de não automatizar a coleta da interface, registrada em 19/10, foi superada neste ponto pelo pedido direto de 26/10; permanece a obrigação de verificar o meio técnico e não inventar acesso à API.

Em consulta à interface pública da Biblioteca de Anúncios em 26/10/2026, busca `barbearia`, país BR, anúncios ativos e filtro de imagem, a página exibiu cerca de 550 resultados. Li **somente os primeiros 16 cartões carregados**, sem paginação ou varredura integral. Dois deles continham vídeo apesar do filtro e foram excluídos. Registrei ID, anunciante, data inicial exibida, estado e resumo público dos 14 restantes. Consulta: <https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=barbearia&search_type=keyword_unordered&media_type=image>.

Uma única chamada em lote `jev-preview` recebeu esses 14 conjuntos de metadados públicos e perguntas fechadas sobre pertinência ao serviço de barbearia. **O Jev classificou dados que eu forneci; ele não navegou nem coletou anúncios.** Resultado mostrado no Playground:

| Classe | IDs da Biblioteca | Leitura |
|---|---|---|
| Serviço, alta confiança | `700155112131034`, `28357550183861540`, `1015537804365684`, `1960166948294064`, `1862469011406661`, `1649312520268945` | 6 candidatos para revisão, não vencedores |
| Serviço, confiança abaixo do corte local | `1498887818709128`, `1969857910344661` | 2 dependem de conferência humana da pertinência |
| Fornecedor para barbeiros | `3135233816682337`, `1414968787112601`, `4145383279099728` | 3 fora do nicho de prestação do serviço |
| Outro | `1495722175574141`, `898017766716181`, `1043235461871885` | 3 fora do recorte |

Os IDs `784530044518741` e `2525165054353468` tinham vídeo visível e não foram enviados no lote de 14. Os percentuais do Jev são confiança da classificação do texto fornecido, não probabilidade de o anúncio vender. A resposta em lote mostrou tempos de 48 ms + 307 ms no Playground; custo isolado e capacidade de varrer centenas não foram medidos.

Criei `lib/jev/triagem-referencias.ts` para juntar ID, URL, data exibida, mídia, estado observado e classe do Jev, rejeitando ID duplicado/divergente. A faixa 30/90 dias é **apenas régua local de prioridade para olhar depois**; não comprova veiculação ininterrupta. O módulo marca sempre desempenho e credibilidade como não verificados e exige revisão humana. `scripts/conferir-triagem-referencias.ts` usa exclusivamente dados fictícios. Não há conexão deste módulo com o app, n8n ou um coletor autônomo.

### O que falta para o fluxo pretendido

1. Um **coletor regular e repetível** para anúncios comerciais brasileiros com paginação, limite, registros da consulta e tratamento de falhas. A API pública da Meta não oferece busca geral desse conjunto no Brasil; Jev também não fornece navegador da Biblioteca. A leitura de 16 cartões desta rodada foi interativa e parcial.
2. Conferir se a página anunciante é de uma barbearia confiável por evidências independentes; nome e anúncio ativo não bastam. Sem dados de conversão/receita ou experimento próprio, chamar o criativo de “funciona” seria inferência não validada.
3. Revisar direitos de uso da referência e montar o contexto aprovado do gerador. Nenhuma imagem de concorrente foi autorizada para reprodução nem armazenada neste repo.
4. Medir custo e qualidade do processo completo — coleta, Jev em lote e revisão humana — antes de colocá-lo em produção. O workflow n8n permanece inativo e não tem credencial Jev configurada.

## Bloco seguinte — processamento repetível, ainda sem coletor autônomo

Em 26/10, reconferi as fontes oficiais. A [API da Biblioteca](https://pt-br.facebook.com/ads/library/api) cobre anúncios políticos/temas sociais globalmente e anúncios de qualquer tipo no Reino Unido/UE; não cobre a busca geral dos comerciais brasileiros. A [ajuda da Meta sobre scraping](https://www.facebook.com/help/463983701520800) distingue coleta autorizada de coleta automática sem autorização e informa que a plataforma combate a última. Portanto não implementei paginação automatizada da interface, chamada a endpoints internos ou contorno de limites. Não identifiquei nesta rodada um fornecedor com autorização comprovada para entregar esse conjunto específico.

Implementei em `lib/jev/lote-referencias.ts` a etapa **posterior à obtenção admissível dos metadados**:

- no máximo 20 observações públicas de imagem ativa por chamada, com ID e URL coerentes, resumo curto e sem repetição;
- uma pergunta fechada de pertinência por anúncio, com as quatro classes do piloto;
- chamada ao [endpoint oficial Jev](https://docs.typesafe.ai/introduction/quickstart) por função de servidor que recebe a chave privadamente, sem incluí-la em log ou resposta;
- rejeição de resposta incompleta ou rótulo fora da taxonomia;
- retorno das contagens de tokens se a API as informar, sem converter tokens em custo inventado.

`scripts/conferir-lote-jev-referencias.ts` prova o trajeto com dois anúncios fictícios e resposta HTTP simulada, sem gasto: serviço de barbearia continua candidato a **revisão**, fornecedor é descartado, e mídia de vídeo/duplicidade/resposta incompleta são recusadas. A triagem existente continua marcando desempenho e credibilidade como não verificados. O código **não está ligado ao WebApp, ao n8n ou a um agendamento**; nenhuma chave foi criada ou usada e não houve chamada real ao endpoint neste bloco.

**Próximo portão real:** definir uma fonte autorizada e repetível para comerciais brasileiros ou manter seleção humana documentada por enquanto. Em ambos os casos, medir a cadeia completa antes de dizer que Jev é mais barato: tempo/custo da obtenção, tokens por lote, erro de classificação e revisão humana. A foto de terceiro do ensaio anterior segue sem direito confirmado de reprodução ou uso no gerador.

## Novo recorte solicitado — navegador coletor (26/10)

Victor pediu explicitamente um script/agente que percorra a Biblioteca. A afirmação acima descreve o bloco anterior e foi superada por esta implementação local: `backend_v2g/scripts/meta_ad_library/collect.mjs` usa Chrome visível com Playwright, lê cartões públicos de uma busca por nicho, tem limites de 50 anúncios/8 rolagens e grava arquivo local ignorado pelo Git. No primeiro ensaio de barbearia, capturou 26 IDs únicos (23 imagens observadas e 3 vídeos), amostra parcial. O relatório de execução e limites está em `backend_v2g/docs/estado/biblioteca-meta-coletor-piloto-26-10.md`.

Neste repositório, `scripts/classificar-biblioteca-jev.mjs` recebe o arquivo, prepara no máximo dois lotes de 20 imagens para a API Jev e mostra prévia sem gasto. A prévia passou com as 23 imagens observadas; naquele momento a chamada real ainda não havia sido feita. `lib/jev/lote-referencias.ts` classifica apenas o texto fornecido, e `lib/jev/triagem-referencias.ts` mantém desempenho e credibilidade como não verificados. Este recorte ainda não integra o aplicativo, n8n ou a geração de imagens.

### Execução autorizada dos dois lotes

Victor autorizou criar uma chave exclusiva para este piloto e usar o saldo existente em até dois lotes. Criei a chave no painel TypeSafe e a guardei em `scripts/.env.local`, ignorado pelo Git, sem mostrar seu valor. A API respondeu aos dois lotes (20 + 3), totalizando 23/23 classificações, 7.484 tokens de entrada e 1.537 de saída informados. O resultado está somente no arquivo local ignorado `backend_v2g/scripts/meta_ad_library/.temp/meta-barbearia-1793061405761.jev.json`. Houve 9 candidatos para revisão, 6 classificações pendentes de revisão e 8 referências fora do recorte; isso não mede vendas nem reputação. O custo monetário individual das duas chamadas não foi confirmado no painel. Chave ativa apenas na TypeSafe, sem instalação no WebApp publicado, backend QA, n8n ou produção.

`scripts/relatorio-biblioteca-jev.mjs` transformou o resultado em `backend_v2g/scripts/meta_ad_library/.temp/meta-barbearia-1793061405761.revisao.md`, com links para abrir cada anúncio e ressalvas explícitas. O relatório também é local e ignorado pelo Git; a lista é pauta de revisão, não aprovação de referência para geração.

### Revisão da regra de pertinência (26/10)

A revisão direta do anúncio `1312716090394266` mostrou uma oferta de corte/agendamento, embora o Jev o tenha classificado como `outro` com confiança 0,41. A regra anterior descartava qualquer `outro`. Corrigi a triagem local para mandar classes negativas de baixa confiança à conferência; classes negativas de alta confiança continuam fora do recorte. Não chamei o Jev novamente.

O relatório foi regenerado a partir do arquivo já classificado: **9 candidatos, 7 para conferir e 7 fora**. Para a pergunta estrita “o texto parece oferecer serviço de barbearia?”, o corte de **80% seleciona 10** e o de **85% seleciona 9** dos 23 anúncios de imagem. O anúncio acima segue fora de ambos os cortes; a conferência humana é necessária para medir falsos negativos. O rótulo `indeterminado` com confiança de 80% não vira `servico_barbearia`, por isso a diferença entre os cortes é só um anúncio, não dois.

`lib/jev/avaliar-cortes.ts` aceita revisões binárias por ID, conta erros conhecidos e só publica precisão/cobertura quando **todos os anúncios da amostra** receberam revisão. `scripts/relatorio-biblioteca-jev.mjs` aceita `--revisoes` com uma lista JSON de `{ "id": "...", "pertenceAoNicho": true/false }`; sem esse arquivo, as métricas ficam `não medida`. Os testes de triagem (12 verificações), de cortes (9 verificações com anúncios fictícios) e `pnpm typecheck` passaram. O relatório está na pasta local ignorada `.temp`, não na base do produto.

**Próximo bloco separado:** concluir a revisão dos 23 links, escolher o corte segundo erros observados, e criar o registro persistente de referência aprovada com fonte, data, anunciante, nicho, decisão/revisor e condição de uso. A data inicial exibida é sinal de investigação, não prova de veiculação contínua ou venda. A geração só poderá consumir um registro assim junto da identidade confirmada e das autorizações já exigidas por `lib/criativos/geracao/triangulo-contexto.ts`; imagem de terceiro não ganha direito de reprodução por estar na Biblioteca.

## Decisão posterior de Victor e entrega local: escolha de referência no criativo

Victor escolheu **80%** como corte inicial de pertinência para o piloto de barbearia e autorizou apresentar links diretos da Biblioteca ao cliente nos dois caminhos: pedir imagem e enviar imagem pronta. O corte gera 10 referências textuais na amostra de 23 anúncios de imagem. Isso mede somente a classificação `servico_barbearia` pelo Jev sobre metadados fornecidos; não mede chance de venda, resultado comercial, qualidade da peça, duração contínua ou direito de copiar. O anúncio de 67% permanece candidato para revisão manual, sem inclusão automática. Nenhuma tela separada de busca por nicho foi criada.

Implementação local deste bloco:

- `lib/jev/catalogo-barbearia.ts` guarda apenas IDs públicos e datas observadas do recorte, sem imagem/texto de terceiros. A interface apresenta link para o anúncio original, a ressalva de desempenho não verificado e escolha opcional da referência. Catálogo visível só quando `V2G_CREATIVE_REFERENCE_PILOT_ENABLED=true`, o negócio ativo está selecionado e `businesses.niche` contém `barbearia`. A action confere novamente o negócio e o ID permitido; o formulário não concede acesso.
- O pedido de criação e o envio de imagem pronta preservam os formatos legados v1. Quando há escolha, gravam v2 com o ID da referência; mudança de referência no mesmo ID de pedido/envio é recusada. Históricos continuam legíveis por formato de ID mesmo que o catálogo futuro mude. O pedido v2 **não é submetido ao gerador** enquanto o backend não souber usar a referência de fato; essa recusa explícita evita simular geração orientada por ela.
- `supabase/migrations/20261026193000_referencia_publica_pedido_criativo.sql` é aditiva e **não aplicada**. Testes locais com PostgreSQL efêmero verificaram v1/v2, rejeição de referência malformada e preservação de ACL/RLS; testes de action verificaram vínculo, replay e catálogo fechado. Nenhuma flag foi ativada, nenhum deploy feito e nenhuma referência foi copiada para o gerador.

Para usar de verdade: revisar os 10 links e a disponibilidade atual; revisar termos/uso jurídico antes de exibição comercial; aplicar a migration somente após autorização específica e backup; validar UI e dados no QA; conectar ID de referência, identidade autorizada do cliente e contexto persistido ao backend; testar geração real com custo aprovado e imagem recuperável. Link público não é licença para reproduzir imagem, marca ou texto de concorrente. Não chamar essas referências de "criativos que funcionam" sem métricas de resultado.
