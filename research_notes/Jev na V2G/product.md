# Jev na V2G — produto e operação

## Onde Jev cabe no produto de outubro e no RevOps

### Takeaway
Jev é adequado como uma camada de decisão rápida e tipada para classificar, priorizar e encaminhar trabalho; ele não deve gerar peças, publicar anúncios, mudar orçamento, cobrar clientes ou substituir o gestor. O melhor piloto é a triagem de itens que já exigem atenção humana: criativo enviado pelo cliente, pendência de onboarding e alerta operacional.

### Cited Findings
- A API recebe um estado textual ou JSON e devolve escolhas, escores ou probabilidades; uma requisição comporta até 20 perguntas. [Documentação Jev](https://jev-ai.org/docs/)
- A documentação informa latência típica de aproximadamente 0,2 s, cobrança por tokens de entrada e saídas sem cobrança; são alegações do fornecedor, sem benchmark independente localizado nesta pesquisa. [Documentação Jev](https://jev-ai.org/docs/)
- Um `choice` deve ter opções e critérios fechados; um `score` é decimal e não inteiro; uma divisão de probabilidades próxima, como 0,52/0,48, deve escalar para humano, não decidir uma rota automaticamente. [Guia técnico Jev](https://jev-ai.org/jev-api/)
- O segredo de API deve ficar no servidor e em chaves separadas por ambiente; o próprio fornecedor orienta não o enviar ao browser, logs ou repositório. [Autenticação Jev](https://jev-ai.org/docs/authentication/)
- O WebApp já envia criativo pronto do cliente para o backend e traduz a resposta técnica para a interface; a rota documentada é `criativos-enviados`. [Contrato atual](C:/Users/victo/v2g-deploy/webapp/lib/backend/criativos-do-cliente.ts)
- A transcrição de áudio existe somente na bancada de onboarding no estado observado no repositório, portanto uma decisão baseada em áudio precisa receber a transcrição já validada, nunca o arquivo de áudio. [Rota de bancada](C:/Users/victo/v2g-deploy/webapp/app/exemplo/api-transcrever/route.ts)

### Inferences
- **Comercial e LP:** após consentimento e com dados mínimos, classificar intenção (`comprar_agora`, `falar_especialista`, `duvida`, `fora_escopo`), adequação (`vende_por_mensagem`, `tem_cnpj`, `investe_em_anuncios`, `evidencia_insuficiente`) e prioridade de retorno. Jev só cria/atualiza uma fila; o vendedor decide descarte, nutrição e contato.
- **Onboarding:** extrair da transcrição as lacunas e rótulos normalizados: nicho, cidade/região, oferta, público, destino de mensagens, se já anuncia, conta Meta/Instagram mencionada e pendência provável. Mostrar ao cliente o que foi entendido e pedir confirmação. Campos como CNPJ, e-mail, telefone e orçamento permanecem validações determinísticas.
- **Criativo enviado:** avaliar completude do pacote, tipo de arquivo, legibilidade alegada pelo brief, coerência entre oferta/CTA/destino e necessidade de revisão humana. A saída deve ser `pronto_para_fila`, `faltam_dados`, `risco_de_politica`, `urgente`, com confiança e evidências de campos, para ordenar a fila do gestor.
- **Gestor:** combinar regras determinísticas (data de envio, SLA, campanha pausada, erro Meta, orçamento) com decisão Jev para formar uma fila explicável. Em baixa confiança, enviar para `revisao_manual`, sem inferir aprovação.
- **Pós veiculação:** classificar alertas já medidos pelo backend em `informar_cliente`, `gestor_analisa`, `monitorar` ou `dados_insuficientes`. A notificação ao cliente usa fatos: métrica, janela, limiar e próximo responsável. Jev pode priorizar a leitura; não declara causa, resultado comercial ou ação de mídia.
- **Atendimento:** com a conversa já autorizada e minimizada, classificar assunto, urgência, sentimento e se precisa de pessoa. Nunca enviar uma resposta comercial ou financeira só pela classificação.
- Um contrato comum por decisão reduz ambiguidade: `decision_pack_version`, `entity_type`, `entity_id`, dados mínimos, pergunta/critério versionado, resposta completa, limiar aplicado, rota resultante, `requires_human`, operador que concluiu e resultado real posterior.

### Gaps
- Não foi localizado benchmark independente que confirme custo, latência, calibração ou qualidade em português brasileiro; o vídeo é relato de experiência e não deve virar premissa financeira.
- Não foi confirmado contrato de tratamento, retenção, localização, DPA/LGPD, limite efetivo de dados ou SLA do fornecedor; não enviar áudio, WhatsApp, dados de pagamento, documento ou segredo antes dessa diligência.
- A API aceita texto/JSON; não há evidência nas fontes consultadas de suporte direto a imagem, áudio ou vídeo. Para análise visual, será necessário extrator multimodal separado e Jev apenas decide sobre atributos já extraídos.

## Biblioteca de Anúncios, criativos e a diferença entre padrão e desempenho

### Takeaway
Jev pode acelerar a catalogação de anúncios públicos e sugerir hipóteses de padrão criativo. Ele não consegue determinar quais criativos “estão funcionando” a partir da Biblioteca de Anúncios: para anúncios comerciais ativos, a fonte pública não entrega custo por resultado, conversões, receita nem atribuição; dados reais devem vir da conta autorizada do cliente e da definição de sucesso da V2G.

### Cited Findings
- A Meta diz que a Biblioteca de Anúncios permite pesquisar anúncios ativos e que a API é para anúncios políticos/de temas sociais e anúncios veiculados na UE; para pesquisar todos os anúncios ativos, a orientação é usar a interface da Biblioteca. [Meta Ad Library API](https://www.facebook.com/ads/library/api/)
- Para todos os anúncios elegíveis na API, a Meta lista ID da biblioteca, conteúdo criativo, página, datas de veiculação e plataformas. Gasto, impressões e dados demográficos adicionais têm escopo restrito a anúncios políticos/temas sociais ou UE. [Meta Ad Library API](https://www.facebook.com/ads/library/api/)
- A coleção oficial do Marketing API mostra que métricas por anúncio na conta autorizada incluem `clicks`, `impressions`, `spend`, `outbound_clicks`, `actions`, `action_values`, `cost_per_unique_action_type` e `reach`. [Meta Marketing API no Postman](https://www.postman.com/meta/facebook-marketing-api/request/u07tack/get-ad-insights-l1)
- A Biblioteca informa atividade pública, não a causalidade de uma venda. A própria Meta separa a Biblioteca para pesquisa pública da API de Insights usada na conta de anúncios autorizada. [Meta Ad Library API](https://www.facebook.com/ads/library/api/); [Meta Marketing API no Postman](https://www.postman.com/meta/facebook-marketing-api/request/u07tack/get-ad-insights-l1)

### Inferences
- **Produto viável para Biblioteca:** o gestor fornece links, IDs ou capturas obtidos manualmente e legalmente; um extrator multimodal transcreve texto/elementos visuais; Jev classifica formato, gancho, oferta, CTA, tema, público presumido, destino aparente e similaridade com o briefing do cliente. O resultado é um *swipe file* pesquisável e uma lista de hipóteses, com URL, data de coleta e evidência por item.
- **Rótulo obrigatório:** usar “anúncio ativo observado em [data]” e “padrão recorrente na amostra”, nunca “vencedor”, “funciona” ou “escalável” sem dados próprios. Tempo ativo também não prova performance: uma peça pode estar ativa com orçamento pequeno, em teste ou por erro operacional.
- **Produto que mede desempenho:** para criativos da V2G, juntar ID de anúncio, versão do criativo, objetivo, orçamento, período, público/posicionamentos, gasto, impressões, resultados e custo por resultado da conta do cliente. Só depois de uma janela mínima definida por Gabriel e de dados suficientes, Jev pode classificar `sem_dados`, `acompanhar`, `possivel_alerta` ou `priorizar_revisao`; ele não pausa, duplica, publica ou eleva verba.
- Para estabelecer aprendizado proprietário, registrar também a definição de resultado do cliente. Em negócios de venda por WhatsApp, conversa, lead qualificado, venda e receita são eventos distintos; não chamar custo por conversa de custo por venda.

### Gaps
- A forma permitida e estável de coletar anúncios comerciais em escala para a V2G não foi confirmada. A API pública não é a base para esse caso; automação de interface, scraping e armazenamento de cópias exigem revisão de termos da Meta e jurídica antes de qualquer implementação.
- Não há métrica de sucesso, janela mínima, modelo de atribuição ou tabela de conversões aprovada para clientes V2G. Sem isso, não existe base para “criativo funcionando”.
- Ainda não há evidência de que o Jev avalie imagens. A análise de criativo precisa de componente visual separado e de teste por nicho.

## Limites humanos, dados, qualidade e plano de avaliação

### Takeaway
O caminho seguro é usar Jev como recomendador de fila, com decisões rastreáveis e reversíveis, e só ampliar automação após comparar decisões contra rótulos humanos e resultados observados. Outubro deve produzir instrumentação e um piloto interno; publicação e pós veiculação continuam manuais conforme a decisão da V2G.

### Cited Findings
- A documentação recomenda tratar a distribuição, não só a escolha vencedora, e escalar casos ambíguos; também recomenda chave de idempotência, backoff para falhas transitórias e não repetir erros de requisição. [Guia técnico Jev](https://jev-ai.org/jev-api/)
- O fornecedor diz que uma chamada aceita até 20 perguntas, tem contexto máximo de 32.000 tokens e limites padrão de 10.000 decisões/dia e 60 requisições/minuto por chave. [Guia técnico Jev](https://jev-ai.org/jev-api/)
- O WebApp registra que respostas cruas de backend não devem ir à tela de cliente e que a ativação de campanha é uma operação de gestor pelo backend. [Regras locais](C:/Users/victo/v2g-deploy/webapp/AGENTS.md)

### Inferences
- **Nunca automatizar com Jev:** criar/ativar/pausar campanha ou anúncio; alterar orçamento, segmentação ou cobrança; aprovar peça; afirmar conformidade com Meta; marcar “no ar”; liberar acesso após pagamento; decidir inadimplência/cancelamento/reembolso; descartar definitivamente lead; gerar comunicação com alegação de performance. Todos requerem regra determinística e/ou gestor responsável.
- **Limiares iniciais:** se faltam dados, há conflito entre campos, risco de política, decisão financeira ou confiança abaixo de limiar calibrado, `requires_human=true`. Mesmo confiança alta só pode automatizar rotas reversíveis: etiqueta, fila, lembrete, rascunho e pedido de informação.
- **Piloto de 2 semanas, sem ação externa:** escolher três Decision Packs versionados: `triagem_criativo`, `pendencia_onboarding`, `triagem_alerta`. Rodar em paralelo com a decisão humana; não esconder o resultado humano do avaliador. Medir cobertura, taxa de abstenção, concordância por classe, falsos encaminhamentos, tempo até triagem, custo por item e incidentes. Não medir “acurácia” sem conjunto rotulado.
- **Gate de promoção:** somente uma classe de baixo risco pode passar a encaminhamento automático após amostra estratificada por nicho/canal, auditoria de erros e meta aprovada de precisão/recall. Reavaliar após alteração de versão do modelo, critérios ou produto.
- **Dados mínimos:** substituir telefone, e-mail e ID por IDs internos quando não necessários; enviar somente trecho e campos necessários; negar anexos e PII por padrão até LGPD/DPA; registrar hash ou referência do input, não a conversa integral, quando for suficiente para auditoria.
- **Arquitetura:** WebApp chama apenas o backend V2G. O backend cria uma fila/evento, monta estado minimizado, chama Jev com chave no servidor, valida schema e limiar, persiste a decisão e entrega ao gestor/notificação. Se Jev falhar ou atingir limite, o fluxo volta à fila manual, sem bloquear cliente e sem repetir ação.

### Gaps
- Precisamos definir dono de cada fila, SLAs, taxonomia inicial e critérios por nicho antes de escrever prompts/perguntas.
- Precisamos de dados históricos rotulados por gestores para calibrar limiares; os relatos de 50 contas são meta operacional, não um dataset de validação.
- É necessária diligência de privacidade, termos e segurança do Jev antes de qualquer dado de cliente ir ao fornecedor.
