# Jev na V2G — RevOps ponta a ponta

## O que o Jev resolve e o que continua fora dele

### Takeaway
Jev cabe na V2G como camada rápida de decisão estruturada: recebe estado textual ou JSON e devolve escolha, pontuação ou probabilidade para o sistema rotear uma tarefa. Ele não deve criar a campanha, enviar cobrança, liberar acesso, publicar na Meta ou decidir sozinho uma ação financeira, comercial ou de conta.

### Cited Findings
- A API é apresentada como uma camada de decisão que retorna escolhas, scores e probabilidades para classificação, roteamento, guardrails e revisão; a ação final continua pertencendo ao código da aplicação. — [Jev API](https://thejevai.com/jev-api)
- As perguntas disponíveis são `Choice`, `Score` e `Noul`, e várias perguntas podem usar o mesmo estado numa chamada. — [Jev API](https://thejevai.com/jev-api)
- A própria documentação recomenda começar com uma decisão real de baixo risco, manter revisão humana para casos incertos ou de alto impacto, registrar versão/perguntas/probabilidades/ação e calibrar limiares contra resultados reais. — [Jev API no GitHub](https://github.com/jev-ai/jev-api)
- Jev aceita texto, objetos JSON e listas de texto; a documentação avisa que não aceita imagem, áudio ou vídeo como estado e recomenda validar separadamente entradas fora do inglês antes de depender de decisões importantes. — [Jev API no GitHub](https://github.com/jev-ai/jev-api)
- A V2G decidiu que a primeira campanha continua manual pelo gestor; criativos posteriores passam por alerta, análise, publicação e só então estado “no ar” e aviso ao cliente. Compra self-service e assinatura ainda não estão implementadas no WebApp. — [Handoff V2G de 05/10](file:///C:/Users/victo/v2g-deploy/webapp/docs/estado/handoff-outubro-05-10.md)
- O fornecedor anuncia planos pré-pagos sem renovação automática, mas preço, limites e disponibilidade são informação variável e precisam ser reconferidos antes de compra. — [Preços Jev](https://thejevai.com/pricing)

### Inferences
- Áudio do onboarding deve passar antes por transcrição. Para análise de biblioteca de anúncios, enviar metadados e OCR/transcrição do criativo; não assumir que o modelo entende a imagem/vídeo bruto.
- Nenhuma decisão de pagamento, acesso, publicação de campanha, pausa, reembolso, mudança de dados ou mensagem externa deve ser executada diretamente pela resposta do Jev. O sistema aplica regra determinística e, quando cabível, põe a tarefa na fila de uma pessoa.
- Guardar somente o mínimo de dados necessários para cada decisão. Para conversas, preferir uma janela curta, resumo e eventos estruturados em vez de despejar histórico completo com dados pessoais.

### Gaps
- Não há medição da qualidade do Jev em português brasileiro, nos nichos da V2G, nem com conversas reais de WhatsApp. A alegação da transcrição de rapidez/custo não basta para aprovar produção.
- Ainda faltam política de privacidade, base legal, retenção, acesso e fornecedor autorizado para conteúdo de cliente, conversas e materiais criativos.

## Mapa priorizado de usos em RevOps

### Takeaway
O melhor primeiro uso é reduzir leitura e triagem repetitiva do gestor, sem trocar a decisão humana. A sequência é: classificação de lead e pendência, fila operacional do gestor, suporte, depois retenção/cobrança. Criativo e desempenho entram como recomendação explicável, sem publicar nem declarar vencedor automaticamente.

### Cited Findings
- O uso documentado para Jev inclui triagem de tarefas, roteamento de suporte, score de urgência, priorização de fila e guardrail antes de ações sensíveis. — [Jev API no GitHub](https://github.com/jev-ai/jev-api)
- A V2G atende vendas por conversa; o fluxo definido exige CNPJ, venda por mensagem e qualificação do lead, com contato em menos de 30 minutos e possibilidade de compra direta ou fechamento assistido. — [Decisões de fluxo da V2G](file:///C:/Users/victo/v2g-deploy/webapp/docs/estado/handoff-outubro-05-10.md)
- A capacidade-alvo de outubro é um gestor atender até 50 contas, enquanto publicação, criativo e pós-veiculação ainda mantêm participação manual. — [Decisões de outubro da V2G](file:///C:/Users/victo/v2g-deploy/webapp/docs/estado/handoff-outubro-05-10.md)

### Inferences

| Prioridade | Job-to-be-done e gatilho | Entrada mínima → saída estruturada | Ação e papel humano | Métrica / principal risco |
|---|---|---|---|---|
| P0 — piloto | **Triar formulário da LP e conversa inicial.** Gatilho: lead criado ou nova mensagem. | Campos do formulário, CNPJ informado, vende por WhatsApp, já anuncia, nicho, resumo/transcrição de conversa → `fit: apto/acompanhar/recusar`, `motivo`, `urgência`, `revisar`. | CRM cria fila; comercial confere todo `recusar` e todo resultado incerto; resposta é redigida por pessoa ou modelo generativo separado. | Tempo até primeiro contato; concordância com revisão humana; risco de excluir cliente válido ou discriminar nicho. |
| P0 — piloto | **Classificar pendência do onboarding.** Gatilho: etapa incompleta, novo áudio transcrito ou resposta do cliente. | Etapa atual, campos faltantes, texto/transcrição, tentativas e prazo → `pendência`, `responsável: cliente/gestor`, `prioridade`, `próxima ação`, `revisar`. | App/email/WhatsApp só enviam lembrete por cadência aprovada; gestor recebe fila priorizada. | Taxa e tempo de conclusão; taxa de lembretes ignorados; risco de cobrança excessiva ou classificação errada. |
| P0 — piloto | **Ordenar a fila do gestor para 50 contas.** Gatilho: entrada/atualização de lead, onboarding, criativo, suporte ou campanha. | Tipo de tarefa, SLA, idade, bloqueio, status da conta, resumo da última interação → `fila`, `prioridade`, `dono`, `revisar`. | Gestor aceita/reordena a fila; sistema nunca publica nem altera campanha com base nesse resultado. | SLA cumprido; tarefas vencidas; reversões manuais; risco de esconder urgência real. |
| P1 | **Triage de suporte e relação com cliente.** Gatilho: mensagem/ticket novo ou fim de conversa. | Texto ou transcrição, produto/etapa, histórico curto, status de pagamento → `tema`, `urgência`, `sentimento`, `risco_churn`, `equipe`, `revisar`. | Encaminhar à caixa correta; humano responde; regras fixas tratam incidente, acesso e financeiro. | Tempo de primeira resposta; reabertura; precisão por tema; risco de inferir satisfação errada. |
| P1 | **Analisar envio de criativo.** Gatilho: cliente envia descrição, link, legenda, briefing ou mídia já transcrita/OCR. | Briefing aprovado, texto, destino WhatsApp, regras de nicho, metadados, OCR/transcrição → `completo/incompleto`, `riscos_de_politica`, `perguntas_ao_cliente`, `revisar`. | Gestor revisa, pede ajuste e publica manualmente. Não usar a saída para aprovação automática de Meta ou para marcar “no ar”. | Tempo entre envio e revisão; retrabalho; falso negativo de política. |
| P1 | **Biblioteca de anúncios e aprendizado de criativo.** Gatilho: lote periódico de anúncios públicos ou dados internos autorizados. | Metadados, OCR/transcrição, formato, ângulo, oferta, CTA, métricas internas quando existirem → `tags`, `hipótese`, `comparável/não comparável`, `confiança`. | Analista valida tags e usa como hipótese para briefing. | Concordância com analista; utilidade no briefing; risco de confundir presença de anúncio com desempenho e violar termos/fonte de dados. |
| P1 | **Qualificar follow-up comercial.** Gatilho: lead sem resposta, resposta nova ou horário de contato. | Estágio CRM, últimas interações, origem, objeção e preferência de horário observada → `temperatura`, `melhor_próxima_ação`, `janela`, `revisar`. | Comercial escolhe se envia e aprova a mensagem; não usar para disparo automático antes de consentimento/cadência. | Conversão por etapa; descadastros/bloqueios; risco de spam ou atribuir intenção inexistente. |
| P2 | **Cobrança, inadimplência e retenção.** Gatilho: webhook confirmado do Asaas, fatura vencendo/vencida, pedido de cancelamento ou queda de uso. | Estado de cobrança vindo do Asaas, plano, eventos de produto, tickets e registro de cancelamento → `risco`, `motivo provável`, `rota: financeiro/sucesso/comercial`, `revisar`. | Asaas e regras determinísticas continuam fonte de verdade de pagamento; humano aprova renegociação, cancelamento, desconto e qualquer comunicação sensível. | Recuperação; churn; precisão de risco; risco financeiro, jurídico e de tratamento inadequado. |
| P2 | **Higiene e previsão de pipeline.** Gatilho: lote diário/semanal. | Estágios, datas, motivos de perda, pendências, pagamentos confirmados e ações humanas → `registro_incompleto`, `estágio_suspeito`, `previsão_com_confiança`, `revisar`. | RevOps corrige dados e compara previsão com realizado; não automatizar preço ou aprovação comercial. | Campos completos; erro de previsão; risco de dados ruins gerarem confiança falsa. |

### Gaps
- Não há CRM, integração de WhatsApp, transcrição, checkout, assinatura ou webhook Asaas em produção confirmados. Cada caso depende de um dono do dado, contrato de evento e teste isolado antes de integração.
- “Criativos que funcionam” exige definição de métrica, janela, público, verba e atribuição. Sem isso, o Jev pode apenas organizar padrões e hipóteses, não afirmar eficácia.

## Piloto, contrato de decisão e governança

### Takeaway
O piloto deve ser uma única decisão de baixo risco com amostra rotulada por humano: classificar `pendência de onboarding` e ordenar uma fila de gestor. Só depois de medir concordância, taxa de revisão e impacto de SLA faz sentido ampliar para comercial, criativos ou financeiro.

### Cited Findings
- Jev recomenda perguntas pequenas, espaço de resposta explícito, opção `unknown`/revisão, limiares definidos pelo custo de falso positivo/falso negativo e reavaliação quando políticas ou comportamento mudarem. — [Jev API no GitHub](https://github.com/jev-ai/jev-api)
- A documentação afirma que probabilidade e confiança são sinais, não garantia de acerto, especialmente para pagamentos, mudanças de conta e outras ações de alto impacto. — [Jev API no GitHub](https://github.com/jev-ai/jev-api)
- A V2G ainda tem como próxima entrega validar campos e fluxo de onboarding antes de implementar a automação do onboarding e o agendamento. — [Handoff V2G de 05/10](file:///C:/Users/victo/v2g-deploy/webapp/docs/estado/handoff-outubro-05-10.md)

### Inferences
- **Contrato mínimo por chamada:** `decision_id`, `entity_id`, `trigger`, `state_version`, `question_version`, `allowed_options`, `selected_option`, `probabilities`, `confidence`, `needs_human`, `threshold_used`, `action_proposed`, `human_final_action`, `model/version`, `latency`, `cost`, `created_at`.
- **Piloto sugerido:** alimentar 50–100 pendências reais ou desidentificadas, previamente classificadas por gestor; comparar a saída com o rótulo humano e publicar no máximo uma fila interna de recomendação. Não enviar mensagens automaticamente no piloto.
- **Portão para ampliar:** definir uma meta de concordância e uma taxa máxima de erro que o gestor aceite antes do teste; usar uma faixa de incerteza que sempre vá para revisão. Esses valores ainda precisam ser definidos pela V2G com exemplos reais.
- **Arquitetura de responsabilidade:** WebApp/CRM registra eventos; backend cria a chamada server-side; Jev devolve sinal; uma camada de regras aplica permissões/SLA; gestor ou comercial confirma ação externa; auditoria registra decisão e resultado. A chave não vai ao navegador, código-fonte ou logs.
- **Financeiro:** o Asaas permanece autoritativo para status de cobrança via webhook. Jev pode apenas recomendar prioridade/rota de atendimento. Uma resposta do Jev nunca libera onboarding, aprova reembolso ou declara pagamento confirmado.

### Gaps
- Precisam ser escolhidos: fonte de verdade de CRM, ferramenta de WhatsApp, ferramenta de transcrição, taxonomia de motivos/estágios e retenção de dados. Sem isso, não há payload confiável.
- É preciso revisar contratos, LGPD, DPA/privacidade do fornecedor e local de processamento antes de enviar conversas, áudios transcritos, CNPJ ou dados financeiros.
- Não há benchmark próprio de custo por decisão, latência, disponibilidade, limites, qualidade e fallback. Validar no playground e num ambiente de teste, sem chaves no front-end e sem ações reais.
