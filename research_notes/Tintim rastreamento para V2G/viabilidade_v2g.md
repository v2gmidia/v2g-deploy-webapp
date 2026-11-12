# Viabilidade de rastreamento por cliente na V2G (12/11/2026)

## 1. O que um piloto pode comprovar

### Takeaway
É viável ligar visita, lead, conversa registrada e venda verificada **para um cliente específico**, desde que haja um identificador e uma fonte verificável em cada transição. Isso não significa identificar todas as pessoas que viram anúncios nem atribuir com certeza toda venda à plataforma.

### Cited Findings
- O Google documenta importação de vendas offline após clique em anúncio, com identificadores de clique ou dados fornecidos pelo usuário, horário, ação e valor; o relatório de diagnóstico precisa ser conferido. [Google, offline conversions](https://developers.google.com/google-ads/api/docs/conversions/upload-offline).
- Desde 15/06/2026, novos adotantes de importação offline pela Google Ads API devem usar a Data Manager API; presumir que a rota antiga está disponível seria erro. [Google Developers, mudança de 2026](https://developers.google.com/ads/blog/posts/2026/05/changes-to-offline-click-conversion).
- A documentação oficial da Meta para desduplicação entre Pixel e CAPI existe em [Meta, deduplicate Pixel and server events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events), mas o acesso de pesquisa retornou 429; o requisito exato deve ser reconfirmado antes da implementação. Um [playbook de integração da Meta](https://storage.googleapis.com/lr-tech-docs-resources/PDFs/Conversions-API-Direct-Integration-Playbook_English.pdf) indica `event_id` e `event_name` como campos de desduplicação. É um material mais antigo, portanto não basta sozinho como homologação atual.
- O modo de consentimento do Google exige obter a escolha, comunicá-la e fazer as tags respeitá-la; `ad_user_data` e `ad_personalization` são escolhas distintas. O modo avançado pode transmitir sinais mesmo quando certas permissões são negadas, exigindo decisão consciente de privacidade. [Google, Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).

### Inferences
- Começar com um único funil e uma única conta de anúncios: clique com parâmetros → formulário/WhatsApp → lead no CRM → venda confirmada no sistema de origem → reconciliação no painel. Cada etapa terá `business_id`, ID do evento na fonte, horário, campanha, status de consentimento, status de medição e evidência. Contar “clique no WhatsApp” como conversa ou venda inflaria o resultado.
- Só enviar conversão à plataforma depois de comparação do evento de navegador e servidor, consentimento e idempotência. Usar um identificador interno persistente e aleatório por jornada, separado de CPF, telefone e documento, é desenho prudente; não é promessa de identificação universal.

### Gaps
- Faltam permissão, propriedade do domínio/checkout/CRM e escolha de um piloto; não foi feita inspeção de tráfego real, tag, Pixel, CAPI, consentimento ou WhatsApp dos clientes.

## 2. Dados de um cliente podem beneficiar outro?

### Takeaway
Usar **insights agregados e sem identificação** entre nichos pode ser objetivo futuro. Misturar histórico individual de clientes diferentes, alimentar listas de público de um com dados do outro ou criar perfil compartilhado não deve entrar no piloto.

### Cited Findings
- A ANPD considera perfil comportamental de pessoa natural identificável dado pessoal, e a LGPD exige observar finalidades, direitos e papéis de controlador/operador. [ANPD, perguntas frequentes](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes); [ANPD, guia de agentes de tratamento](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado).
- A ANPD lista direito de acesso/correção e revisão de certas decisões automatizadas relacionadas a perfil pessoal, profissional, de consumo ou crédito. [ANPD, direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares).
- Para Customer Match, o Google diz que só pode ser carregado dado próprio (first-party), não listas compradas; a elegibilidade da conta é condicionada a histórico de conformidade e pagamento. Novos projetos sem histórico para a API antiga devem usar Data Manager. [Google Ads, Customer Match](https://developers.google.com/google-ads/api/docs/remarketing/audience-segments/customer-match/get-started).

### Inferences
- Contrato com o cliente deve explicitar quem decide finalidade, o papel da V2G, origem do dado, retenção, base legal/consentimento aplicável, exclusão e proibição de uso cruzado de pessoa identificável. Parecer jurídico antes de qualquer audiência compartilhada ou modelagem de perfis demográficos.
- Idade, bairro e gênero **não** podem ser inferidos de um punhado de conversas e transferidos como regra de segmentação dos demais clientes. Em amostra pequena, erro e reidentificação são prováveis; usar apenas estatística agregada com cobertura e tamanho mínimo definidos.

### Gaps
- Não foi verificada política de privacidade, consentimento real, contrato de tratamento, acesso dos clientes aos dados nem elegibilidade das contas de anúncio. A orientação aqui é desenho e risco, não parecer jurídico.

## 3. O que a V2G já possui e o que falta

### Takeaway
Há peças de **proveniência comercial da própria V2G**, mas a inspeção seletiva não mostrou uma jornada completa para vendas dos clientes da V2G.

### Cited Findings
- A migration de pedidos V2G liga lead da LP ao pedido e preserva UTM e consentimento (`source_lead_utm_*`, `source_lead_consent_at`, `source_lead_consent_text`), com vínculo explícito em vez de nome parecido. [Migration local](C:/Users/victo/v2g-deploy/webapp/supabase/migrations/20261018130000_ligar_lead_lp_pedido.sql:9).
- O RevOps V0 prevê fonte idempotente, oportunidade, interação e vínculos opcionais a lead, pedido e negócio; o próprio checkpoint informa que importação de LP/WhatsApp e continuidade com pagamento/campanha são futuras. [Checkpoint local](C:/Users/victo/v2g-deploy/webapp/docs/estado/revops-v0-local-07-10.md:14); [limite](C:/Users/victo/v2g-deploy/webapp/docs/estado/revops-v0-local-07-10.md:33).
- A tela de RevOps evita taxa de conversão sem elegibilidade, janela e cobertura definidos e separa conversas de anúncios dos clientes. [Tela local](C:/Users/victo/v2g-deploy/webapp/app/(internal)/revops/TelaRevOps.tsx:50).
- A orientação de QA já distingue cliques de conversas, leads qualificados e vendas. [Documento local](C:/Users/victo/v2g-deploy/webapp/docs/qa-envio-criativo-e-leitura-carteira-21-10.md:58).
- Busca seletiva em `app`, `lib` e `backend_v2g/src` não localizou uso explícito de `gclid`, `gbraid`, `wbraid`, `fbclid`, `fbc` ou `fbp`; isso **não prova ausência no produto inteiro**, apenas que esses caminhos não exibem a captura. A busca achou `event_id` financeiro/agenda, que não é deduplicação de conversão de anúncios.

### Inferences
- Reutilizar o princípio de proveniência, idempotência e evidência do RevOps, mas criar domínio separado por anunciante. Evitar transformar a V2G em dona universal de leads dos clientes. Primeiro provar o evento de venda na fonte original e só depois conectar plataformas.
- O piloto mínimo pode ser: um cliente com site/LP e fonte de venda acessível; uma campanha Meta; um único evento `lead` e um `sale_verified`; comparação manual de 5–10 jornadas fictícias/consentidas, inclusive perda de parâmetros, duplicidade, cancelamento e venda sem anúncio. A quantidade é uma proposta de ensaio, não métrica de desempenho.

### Gaps
- Não há confirmação de quais clientes usam site próprio, checkout, CRM ou só WhatsApp. Sem essa escolha, custo e complexidade variam muito. Uma venda concluída em chat sem registro estruturado não vira atribuição comprovável automaticamente.

## 4. Comprar serviço pronto ou construir?

### Takeaway
Comparar um piloto de fornecedor com um piloto interno **na mesma jornada** antes de decidir. O ganho real é o conjunto de vendas verificadas com origem rastreável e consentimento, não um painel mais bonito.

### Cited Findings
- O Google requer dados first-party para Customer Match, conta elegível e consentimento respeitado; portanto nenhum fornecedor elimina essas tarefas do cliente e da V2G. [Google Ads, Customer Match](https://developers.google.com/google-ads/api/docs/remarketing/audience-segments/customer-match/get-started); [Google, Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).
- A rota atual para novos projetos de conversão offline Google é Data Manager API, o que aumenta o custo de manutenção de solução própria multicliente. [Google Developers](https://developers.google.com/ads/blog/posts/2026/05/changes-to-offline-click-conversion).

### Inferences
- Avaliar o fornecedor por demonstração auditável: captura de parâmetros, preservação na passagem para WhatsApp, identificação de conversa **real**, confirmação de venda na fonte, deduplicação, exportação por cliente, segregação, exclusão, política de consentimento, integração Meta/Google e custo por conta. Pedir evidência no painel da plataforma e comparar com o livro de vendas do piloto.
- **Comprar** se esses pontos funcionarem com pouco trabalho por cliente e dados exportáveis. **Construir** só se a V2G precisar de um fluxo distintivo que o fornecedor não entregue ou se o custo recorrente justifique equipe para manter APIs, privacidade e suporte. Modelo híbrido é plausível: fornecedor coleta; V2G mantém vínculo auditável entre campanha, lead, venda e negócio, sem copiar dados desnecessários.

### Gaps
- Preço, contrato, arquitetura e resultados reais da Tintim ainda dependem da investigação específica do fornecedor e de um piloto demonstrado; esta nota não atesta capacidade nem vantagem financeira dele.
