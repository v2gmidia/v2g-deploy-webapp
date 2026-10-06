# Jev prioriza trabalho, não substitui gestores

**A V2G deve adotar Jev como uma camada de decisão estruturada para classificar, priorizar e encaminhar trabalho, começando por pendências de onboarding e fila do gestor.** O produto faz sentido para uma operação que quer um gestor atendendo até 50 contas porque reduz a leitura repetitiva sem transferir decisões irreversíveis para um modelo novo. A implementação não deve partir do vídeo nem de promessas de custo: a fonte oficial descreve Jev como um modelo System One em early access, cuja API recebe texto ou JSON e devolve escolhas, escores ou probabilidades. A primeira campanha continua publicada manualmente pelo gestor, pagamentos continuam dependentes do Asaas e suas confirmações por webhook, e Meta só pode receber ações pelo backend com aprovação humana. A consequência prática é simples: Jev decide a **fila e a próxima revisão**, enquanto código determinístico e pessoas continuam decidindo cobrança, acesso, publicação, verba e comunicação externa.

## Fatos verificados delimitam o papel do Jev

### Fatos

**Jev é o modelo System One da TypeSafe, lançado em early access em 15 de setembro de 2026.** A API oficial recebe um `state` textual, objeto JSON ou lista textual e um mapa de perguntas; suas primitivas são `Choice`, para opções fechadas, `Score`, para rubricas, e `Noul`, para probabilidade binária. A documentação também afirma que a API **não aceita imagem, áudio ou vídeo como entrada direta**. Para a V2G, isso impede tratá-lo como analisador visual de criativos ou transcritor de áudio; ele só entra depois de OCR, transcrição ou extração multimodal aprovada. ([Lançamento TypeSafe](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [API oficial](https://docs.typesafe.ai/api), [modelos e limites](https://docs.typesafe.ai/models))

**A resposta do modelo não é uma autorização para agir.** Os termos da TypeSafe dizem que a saída pode estar errada e que o cliente deve avaliá-la independentemente. A documentação recomenda tratar a distribuição de probabilidades e escalar casos ambíguos; `Noul` não traz uma confiança separada e valor próximo de 0,5 representa incerteza. A própria documentação identifica inglês como língua de melhor precisão, sem benchmark apresentado para português brasileiro ou para os nichos da V2G. ([Contrato TypeSafe](https://typesafe.ai/legal/mca), [confidence](https://docs.typesafe.ai/confidence), [idiomas e limites](https://docs.typesafe.ai/models))

**O preço e a latência divulgados são insumos de teste, não base de orçamento.** A documentação atual lista US$ 0,042 por milhão de tokens de entrada para Jev 1.13.0 e sem cobrança de saída; a TypeSafe divulga 70–500 ms em testes feitos no oeste dos Estados Unidos. Não há medição equivalente no Brasil, SLA público localizado, nem benchmark V2G. O alias `jev-latest` pode mudar de versão e de resposta, portanto qualquer teste precisa fixar uma versão concreta. ([preço, limites e aliases](https://docs.typesafe.ai/models), [ressalvas de latência](https://typesafe.ai/blog/introducing-system-one-models-and-jev))

**A transferência de dados requer diligência antes do uso com clientes.** A política informa hospedagem e processamento nos Estados Unidos; a TypeSafe declara que não treina nem faz fine tuning em inputs, mas a retenção é descrita sem prazo público fixo. O DPA apresentado trata o cliente como controlador e a TypeSafe como operadora. Isso não resolve por si só a LGPD da V2G, o consentimento, a base legal ou o prazo de retenção. ([política de privacidade](https://typesafe.ai/legal/privacy-policy), [DPA](https://typesafe.ai/legal/data-processing))

**A Biblioteca de Anúncios não prova que um criativo performa.** A Meta informa que sua Biblioteca permite pesquisar anúncios ativos; métricas de gasto, impressões e demografia têm escopo específico, enquanto métricas operacionais por anúncio pertencem à conta autorizada via Marketing API Insights. Assim, um anúncio público ativo permite observar formato, oferta, CTA e recorrência na amostra, mas não permite concluir que converte, vende ou deve ser replicado. ([Meta Ad Library API](https://www.facebook.com/ads/library/api/), [Meta Marketing API Insights](https://www.postman.com/meta/facebook-marketing-api/request/u07tack/get-ad-insights-l1))

### Recomendação

Fixar `jev-1.13.0` durante a calibração, chamar a API apenas a partir do backend e tratar seu resultado como uma sugestão tipada. O frontend recebe a explicação apropriada à etapa, jamais a resposta bruta ou a chave da API. Em timeout, 429, 529, schema inválido ou baixa confiança, a resposta padrão é criar uma pendência manual; o cliente não deve ficar bloqueado e nenhuma chamada deve ser repetida sem idempotência e backoff. A V2G deve assinar ou validar o DPA aplicável, registrar a finalidade e a transferência internacional, e só então enviar dados de cliente.

## A fila operacional entrega valor antes do marketing automatizado

### Fatos

O fluxo acordado da V2G já concentra trabalho humano onde o Jev pode economizar tempo: o cliente conclui onboarding, agenda reunião, o gestor obtém acessos e escolhe o primeiro criativo, publica a primeira campanha manualmente e, nos criativos posteriores, recebe alerta, analisa, publica e só então marca “no ar”. A capacidade alvo de outubro é até 50 contas por gestor; publicação, criativos e pós-veiculação seguem com participação manual. ([handoff de outubro](../docs/estado/handoff-outubro-05-10.md))

### Recomendação

O primeiro uso deve ser **classificar pendências de onboarding e ordenar a fila do gestor**, não triagem de vendas nem análise de performance. É uma decisão reversível, tem resultado humano observável e está diretamente ligada ao gargalo de outubro. Para cada evento — etapa incompleta, áudio já transcrito, criativo enviado, alerta operacional — o backend monta um resumo mínimo e pede quatro saídas fechadas: `tipo_de_trabalho`, `responsável`, `prioridade` e `revisao_manual`. A fila mostra também a razão concreta: SLA vencendo, acesso Meta pendente, criativo sem CTA, dado conflitante ou informação insuficiente. O gestor pode aceitar, reordenar ou corrigir; essa correção cria o conjunto rotulado que falta hoje.

| Prioridade | Caso de uso | Entrada mínima | Saída Jev permitida | Ação humana e medida |
|---|---|---|---|---|
| P0 | Pendência de onboarding | etapa, campos faltantes, transcrição resumida, tentativas e prazo | pendência, responsável, prioridade, revisar | gestor valida; medir tempo até conclusão e concordância |
| P0 | Fila unificada do gestor | tipo, idade, SLA, bloqueio, status da conta e resumo mínimo | fila, prioridade, dono, revisar | gestor aceita ou move; medir tarefas vencidas e reversões |
| P1 | Criativo enviado pelo cliente | briefing aprovado, legenda, CTA, destino, metadados e OCR/transcrição | completo/incompleto, perguntas, risco de política, revisar | gestor pede ajuste ou publica manualmente; medir retrabalho |
| P1 | Lead e comercial | formulário, venda por mensagem, CNPJ informado, já anuncia, nicho e resumo consentido | apto/acompanhar/revisar, motivo, urgência | comercial decide contato, descarte ou nutrição; medir primeiro contato e falsos descartes |
| P1 | Suporte e relacionamento | trecho mínimo autorizado, etapa e histórico curto | tema, urgência, equipe, revisar | pessoa responde; medir tempo de resposta e reabertura |
| P2 | Biblioteca e aprendizado criativo | link/captura obtidos de modo permitido, data, OCR e atributos visuais | tags, ângulo, oferta, CTA, hipótese, confiança | analista valida; medir utilidade, nunca “vencedor” |
| P2 | Financeiro e retenção | eventos confirmados do Asaas, plano, uso e ticket resumido | rota financeira/sucesso, prioridade, revisar | humano decide contato; medir recuperação e erros de rota |

O uso comercial deve começar depois de a fila interna funcionar. Jev pode indicar que um formulário parece fora do escopo, que falta evidência ou que um lead merece retorno rápido; não decide rejeição definitiva, não escreve nem envia WhatsApp, e não substitui a regra de que o lead precisa ter CNPJ e vender por mensagem. Para cobrança e retenção, o Asaas continua a fonte de verdade: webhook confirmado define pagamento, e uma classificação Jev nunca libera onboarding, aprova desconto, reembolso, cancelamento ou inadimplência.

## Criativos exigem dois produtos de dados distintos

### Fatos

O repositório atual já documenta que criativos do cliente são enviados ao backend e que o backend traduz respostas técnicas para a tela; a transcrição de áudio observada está em uma bancada, não como uma entrada multimodal do Jev. ([contrato de criativos](../lib/backend/criativos-do-cliente.ts), [rota de transcrição de bancada](../app/exemplo/api-transcrever/route.ts))

### Recomendação

Construir duas linhas separadas. A primeira é um **swipe file de referência**, no qual gestor fornece links, IDs ou capturas coletadas dentro das permissões aplicáveis; OCR ou componente visual extrai atributos e Jev os organiza por formato, gancho, oferta, CTA, tema e similaridade com o briefing. Cada resultado deve carregar URL/origem, data de coleta e rótulo “anúncio ativo observado” ou “padrão da amostra”. Não usar “funciona”, “vencedor” ou “escalável”. Antes de qualquer coleta automática, revisar termos da Meta, permissões e retenção de cópias.

A segunda linha é **aprendizado com dados próprios autorizados**. Para comparar criativos da V2G, registrar ID de anúncio, versão do criativo, objetivo, orçamento, período, público/posicionamentos, gasto, impressões, resultado definido e custo por resultado. Em negócios por WhatsApp, conversa, lead qualificado, venda e receita são eventos distintos; custo por conversa não pode virar custo por venda. Só depois de uma janela mínima e de uma métrica definida pelo gestor de mídia, Jev pode rotular `sem_dados`, `acompanhar`, `possivel_alerta` ou `priorizar_revisao`. Ele não cria, pausa, duplica, aumenta verba ou publica campanha.

## Um contrato de decisão permite auditar cada uso

### Recomendação

Todo uso deve persistir um pacote de decisão versionado, independente da tela que o disparou. O contrato abaixo evita prompts soltos, permite comparar Jev e gestor e preserva a causalidade entre recomendação e resultado.

| Campo | Regra |
|---|---|
| `decision_id`, `entity_type`, `entity_id`, `trigger` | identificam o evento interno sem expor dados pessoais desnecessários |
| `state_version`, `question_version`, `model_version` | tornam a decisão reproduzível; fixar o modelo durante o piloto |
| `input_reference` e `input_hash` | guardam referência e integridade; não guardar conversa integral quando um resumo basta |
| `allowed_options`, `selected_option`, `probabilities`, `confidence` | tornam a classificação verificável e deixam explícita a incerteza |
| `threshold_used`, `requires_human`, `action_proposed` | separam sinal do modelo da regra de negócio |
| `human_final_action`, `reviewer_id`, `outcome` | registram o que a pessoa fez e o resultado posterior |
| `latency_ms`, `cost_estimate`, `error_code`, `created_at` | permitem medir custo, disponibilidade e fallback |

O estado enviado deve ter somente dados necessários para a pergunta: IDs internos, etapa, campos estruturados, resumo curto ou trecho pertinente. Remover telefone, e-mail, CPF/CNPJ, endereço, token Meta, credencial, dados de cartão, PIX, documento, mídia bruta e conversa inteira por padrão. Números, datas, orçamento, vencimento, CAC, faturamento e estado de pagamento pertencem a código e banco; Jev interpreta somente texto e contexto semântico. A camada de regras valida schema, limiar e permissão; o backend chama Jev; WebApp, Meta e Asaas não o chamam diretamente.

## Limites humanos preservam operação e confiança

### Recomendação

Nenhuma resposta Jev pode criar, ativar, pausar ou marcar campanha como no ar; aprovar criativo; mudar orçamento, público ou segmentação; afirmar conformidade com Meta; liberar acesso; confirmar pagamento; enviar cobrança; decidir reembolso, cancelamento ou inadimplência; encerrar definitivamente um lead; ou disparar mensagem externa. Essas ações pedem fonte de verdade determinística e um responsável. Mesmo confiança alta só pode automatizar etiqueta, criação de tarefa, ordenação de fila, rascunho interno e pedido de informação dentro de uma cadência previamente aprovada.

O piloto recomendado dura **duas semanas, sem ação externa**, com uma amostra de 50 a 100 pendências reais desidentificadas e previamente rotuladas pelo gestor. Rodar `triagem_pendencia_onboarding` e `priorizacao_fila_gestor` em paralelo à decisão humana. Medir cobertura, abstenção, concordância por classe, falsos encaminhamentos, tempo até triagem, tarefas vencidas, custo por item, p50/p95 no Brasil, 429/529 e incidentes. Não chamar isso de acurácia sem conjunto rotulado. Antes de ampliar, a V2G deve aprovar a concordância mínima, o erro máximo tolerado e a faixa de incerteza que exige revisão; recalibrar quando mudar modelo, perguntas, nicho ou política.

## Conclusão

O valor inicial do Jev para a V2G não está em “fazer o gestor desaparecer”. Está em transformar eventos dispersos em uma fila clara, auditável e mais rápida, para que o gestor concentre atenção nas exceções que realmente precisam de julgamento. Isso ajuda o objetivo de 50 contas sem antecipar automações que hoje seriam perigosas ou impossíveis de validar.

O primeiro piloto entrega também a infraestrutura que os próximos usos exigem: taxonomia, eventos, decisões versionadas, revisão humana e resultado observado. Depois dele, comercial, suporte, criativos e retenção passam a ser extensões do mesmo contrato. A análise de Biblioteca de Anúncios deve ficar deliberadamente no campo de pesquisa e hipótese até a V2G possuir dados próprios autorizados, métricas e atribuição suficientes para falar de desempenho.
