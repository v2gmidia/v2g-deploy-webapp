# Assigned Topic

Como a Tintim liga anúncios a conversas e vendas no WhatsApp, e o que é reutilizável para uma decisão da V2G. Pesquisa em fontes primárias da Tintim, consultadas em 12/11/2026. Descrições de capacidade abaixo são declarações do fornecedor; não houve teste em conta Tintim nem validação independente dos resultados de campanhas.

## 1. Como um clique vira uma conversa atribuída?

### Takeaway

Há dois caminhos. No anúncio Meta que abre WhatsApp diretamente, a Tintim cruza metadados da Meta/WhatsApp, inclusive `ctwa_clid` quando disponível. No caminho anúncio → site → WhatsApp, instala-se o pixel Tintim no site e usa-se um link rastreável no botão para transportar o identificador do clique e UTMs; o redirecionamento termina no URL oficial do WhatsApp.

### Cited Findings

- A documentação distingue Meta Click to WhatsApp de site → WhatsApp; cita `fbclid`, `ctwa_clid` e UTMs, e recomenda `tintim_fbid={{ad.id}}_{{site_source_name}}_{{placement}}` nos parâmetros de URL para identificar o anúncio no trajeto pelo site. [FAQ Meta](https://tintim.app/faq/meta-ads/), [parâmetros Meta](https://tintim.app/base-de-conhecimento/recomendacoes-de-parametros-do-meta-ads/).
- O fornecedor descreve o pixel no site e botão com link rastreável como as duas partes necessárias para ligar clique Google à primeira mensagem WhatsApp; o identificador viaja por código na mensagem pré-preenchida. Se a pessoa apaga a mensagem, perde-se esse elo. [Conversões Google](https://tintim.app/base-de-conhecimento/como-o-disparo-automatico-de-eventos-para-o-google-ads-funciona/).
- O link rastreável redireciona para endereço oficial do WhatsApp. A Tintim distingue conversa que começou de clique que só abriu o WhatsApp. [FAQ WhatsApp](https://tintim.app/faq/whatsapp/), [FAQ Meta](https://tintim.app/faq/meta-ads/).
- As origens no sistema são Meta Ads, Google Ads, Outras origens e Sem rastreio. A origem Meta é inferida de `fbclid`/`ctwa_clid`; a Google, de GCLID. [Origens](https://tintim.app/base-de-conhecimento/quais-sao-as-origens-possiveis-dentro-do-tintim/).
- Para Click to WhatsApp, mudanças de dados disponibilizados pela Meta podem permitir identificar a origem Meta sem revelar o ID exato do anúncio. [Limitação CTWA](https://tintim.app/base-de-conhecimento/rastreamento-de-conversas-de-anuncios-click-to-whatsapp-aprimorado/), [Inspetor](https://tintim.app/base-de-conhecimento/saiba-como-o-inspetor-de-campanhas-funciona-powered-by-lupa-ia/).

### Inferences

- O método depende de instrumentação da landing e da primeira mensagem. Não é uma identidade universal que acompanha o usuário por todo o navegador e checkout sem configuração.
- Quando a V2G mandar direto do anúncio para WhatsApp, o pixel da LP não participa; a qualidade da atribuição depende de dados da Meta/WhatsApp e do tipo de conexão.

### Gaps

- Não verificamos taxa real de atribuição nem precisão por tipo de anúncio, navegador, consentimento ou aparelho.

## 2. Como a Tintim observa a conversa e registra a venda?

### Takeaway

Ela precisa conectar o número de WhatsApp. Há conexão Lite por QR code usando Waha, uma API não oficial, e integração por webhook com provedores da API oficial. A venda é registrada quando um atendente move a conversa para a etapa de venda, manualmente ou por termo-gatilho em mensagem. Não é prova de pagamento por si só.

### Cited Findings

- A FAQ declara que o modo QR usa Waha (API WhatsApp não oficial) para observar conversas; a integração com número em API oficial depende de provedor/webhook. O processamento descrito é de texto, não de áudio/imagem. [FAQ WhatsApp](https://tintim.app/faq/whatsapp/), [tipos de conexão](https://tintim.app/base-de-conhecimento/guia-tipos-de-conexoes-whatsapp-disponiveis-no-tintim/).
- As etapas da Jornada de Compra são configuradas pelo cliente e podem estar vinculadas a eventos Meta e Google. A própria Tintim afirma que não é um CRM. [Jornada](https://tintim.app/base-de-conhecimento/como-configurar-sua-jornada-de-compra-e-eventos-de-conversao-no-tintim/).
- O atendente pode classificar manualmente a etapa e valor/data, ou enviar uma frase-gatilho; o lead não altera a etapa via frase. Para valor automático, o valor deve estar na mesma mensagem e o valor padrão vazio; valor manual sobrepõe. [Classificação](https://tintim.app/base-de-conhecimento/como-e-porque-fazer-a-alteracao-da-etapa-da-jornada-classificacao-de-conversas/), [valor da venda](https://tintim.app/base-de-conhecimento/como-classificar-uma-conversa-em-venda-e-pegar-automaticamente-o-valor/).
- O Dashboard mostra conversas, origens, avanço no funil, vendas e comparação de períodos; o Inspetor põe campanha, conjunto e anúncio ao lado de leads, vendas e receita. [Dashboard](https://tintim.app/base-de-conhecimento/como-analisar-o-dashboard-do-tintim/), [Inspetor](https://tintim.app/base-de-conhecimento/saiba-como-o-inspetor-de-campanhas-funciona-powered-by-lupa-ia/).

### Inferences

- Uma etapa marcada como “venda” por mensagem ou atendente ainda exige reconciliação com pedido/recebimento/estorno para ser uma venda financeira comprovada. Esse ponto é especialmente relevante à V2G, que já tem sua própria jornada Asaas.

### Gaps

- Não foi localizada prova de que a Tintim reconcilie automaticamente um pagamento Asaas com o status da conversa; integração via webhook é possível, mas requer projeto e validação próprios.

## 3. O que volta para Meta e Google Ads?

### Takeaway

Eventos da etapa da jornada podem ser enviados à Meta via Conversions API e ao Google Ads como conversões offline, desde que o clique e as ações de conversão estejam identificados. “Enviado com sucesso” não significa que a plataforma atribuiu uma venda, nem garante melhora da campanha.

### Cited Findings

- A Tintim descreve envio CAPI ao pixel/dataset Meta do cliente: nome do evento, momento, fonte chat, valor/currency quando houver e identificadores de correspondência disponíveis, incluindo `fbclid`/`ctwa_clid`. [FAQ Meta](https://tintim.app/faq/meta-ads/), [disparos Meta](https://tintim.app/base-de-conhecimento/quando-ocorrem-e-porque-configurar-os-disparos-de-eventos-de-conversao-para-o-meta-ads/).
- Para Google, conecta-se uma conta autorizada, escolhe-se uma ação de conversão de importação de cliques e associa-se o evento a uma etapa. O payload descrito inclui GCLID ou WBRAID/GBRAID, data, BRL e código único de transação. [Disparos Google](https://tintim.app/base-de-conhecimento/como-o-disparo-automatico-de-eventos-para-o-google-ads-funciona/).
- Limites Google documentados: mensagens direto para WhatsApp sem clique rastreável não enviam conversão; formulário, mensagem pré-preenchida apagada, clique fora da janela (até 90 dias ou menor), etapa sem evento e conexão vencida também não. A plataforma espera pelo menos seis horas do clique; um envio aceito pode demorar até 48 horas para aparecer no Google. Correção posterior da venda não é reenviada; uma conversão por lead por ação. [Disparos Google](https://tintim.app/base-de-conhecimento/como-o-disparo-automatico-de-eventos-para-o-google-ads-funciona/).
- O Google pode ser alimentado automaticamente ou via relatório de cinco colunas para importação manual (GCLID, ação, data, valor, moeda). [Relatório offline](https://tintim.app/base-de-conhecimento/como-otimizar-suas-campanhas-de-google-ads-com-o-relatorio-de-conversao-offline-do-google-ads/).

### Inferences

- O retorno de evento fornece sinal de otimização potencial, não comprova causalidade ou lucratividade. Comparar custo, venda realmente recebida e eventual estorno é um passo separado.

### Gaps

- Não verificamos em Ads Manager ou Google Ads uma entrega efetiva de evento, qualidade de correspondência, deduplicação cruzada entre Pixel/CAPI ou lift de performance.

## 4. Integração com sistemas e preços

### Takeaway

Há exportação e webhooks; a documentação aponta para uma API, mas esta pesquisa não certificou endpoints nem limites. Preço público é por número WhatsApp, com recursos de envio Meta/Google no plano superior; contratos de agência têm negociação.

### Cited Findings

- Webhooks documentados: `lead_create`, `lead_update`, `message_create` e `lead_source_update`, com até três destinos por evento. Payloads podem conter origem, identificadores da campanha/anúncio, parâmetros do link, etapa, telefone e valor de venda. O destino é fornecido pela ferramenta receptora, como n8n. [Webhooks](https://tintim.app/base-de-conhecimento/como-funcionam-os-webhooks-do-tintim/).
- O site público lista exportação de dados e dashboard no Inicial, e webhook + envio de dados à Meta/Google no Escala. Na consulta, Inicial aparecia a R$ 197/mês por um WhatsApp; Escala a R$ 297/mês por um WhatsApp; agência “consulte as condições”. Preços promocionais e condições podem mudar. [Planos](https://tintim.app/rastrear-whatsapp/), [oferta pública](https://subscribe.tintim.app/).
- Existe uma página de documentação de API, mas esta pesquisa não abriu contrato de endpoints, autenticação, paginação ou SLA. [Índice da API](https://tintim.app/doc/documentacao/).

### Inferences

- Para V2G, o menor piloto comercial plausível é um cliente com um número, uma LP ou anúncio Meta direct-to-WhatsApp, etapas de jornada e webhook para conciliar com o pedido pago. A compra de Tintim deve ser tratada como custo por cliente/número, não como implementação única que automaticamente cobre toda a carteira.

### Gaps

- Não validamos preço final, franquias, termos contratuais, LGPD, disponibilidade da API no plano, retenção, limites de volume, ou custos adicionais para integração com provedor oficial WhatsApp. Solicitar documentação/contrato antes de decidir compra em escala.
