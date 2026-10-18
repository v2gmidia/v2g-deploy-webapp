# V2G — metas de produto e evolução operacional

Registrado em 18/10/2026 a pedido de Victor. Este documento transforma ideias
de produto em um mapa de evolução. **Não é aprovação para implementar, publicar,
aplicar migration, configurar serviço, escrever na Meta ou prometer uma função ao
cliente.** Cada frente só avança depois que seu portão de entrada estiver provado.

As etapas vigentes continuam sendo:

1. entrada, compra e acesso;
2. contrato e NFS-e;
3. multiconta;
4. onboarding;
5. Mesa do gestor;
6. Criativos e campanha.

As metas abaixo atravessam essas etapas. Elas não criam uma etapa 07 automática.

## 1. Resultado de longo prazo

A V2G deve sair de uma operação assistida por pessoas para uma operação cada vez
mais apoiada por software e IA, sem perder três garantias:

- cada dado importante tem origem, período, identidade e estado de qualidade;
- cada decisão relevante deixa motivo, responsável, evidência e resultado;
- cada ação externa tem limite, aprovação quando necessária e caminho de volta.

O objetivo não é retirar o gestor antes da hora. É fazer o gestor gastar menos
tempo procurando informação e executando tarefas repetitivas, enquanto mantém a
responsabilidade pelas exceções, aprovações e decisões ainda não comprovadas.

## 2. Ordem de construção

| fase | objetivo | entregas principais | portão para avançar |
|---|---|---|---|
| **A · Verdade operacional** | Padronizar como a V2G trabalha e registra evidência. | Documento central de operação; modelo dos documentos de nicho; vocabulário comum; dono, exceção e encerramento de cada processo. | Casos reais suficientes para separar regra recorrente de exceção, sem contradição relevante entre procedimento e execução. |
| **B · Identidade e dados confiáveis** | Ligar negócio, conta de anúncio, campanha, criativo, conversa, pessoa e resultado sem correspondência presumida. | IDs canônicos; procedência; eventos; qualidade; períodos; falhas explícitas; correção humana preservada. | Uma jornada de teste pode ser reconstruída ponta a ponta pelos IDs e fontes, inclusive quando uma fonte falha. |
| **C · Mesa operacional completa** | Permitir que o gestor trabalhe pela V2G na rotina normal. | Carteira atual; tarefas; acessos; campanhas; criativos; alertas; suporte; falhas de fonte; links de exceção para a plataforma. | Um gestor conclui uma rotina representativa sem procurar dados em planilhas ou abrir a conta de anúncios, salvo exceção sinalizada. |
| **D · Ciclo comercial e WhatsApp** | Saber o que aconteceu depois do clique. | Conversas ligadas à origem; CRM simples; etapas comerciais; registro de venda e receita; consentimento e retenção. | Amostra acompanhada com anúncio, conversa e desfecho ligados, além de taxa conhecida de dados ausentes ou divergentes. |
| **E · Inteligência assistida** | Recomendar ações e produzir ativos com revisão humana. | CPL por coorte; volume provável com intervalo; recomendações; geração e troca de criativos em modo de teste; avaliação do acerto. | Recomendações comparadas com decisões humanas e resultados posteriores, com critérios de erro e escalonamento definidos. |
| **F · Automação limitada e medida** | Executar apenas decisões já delimitadas e reversíveis. | Ações por política; aprovações no app; rollback; trilha de auditoria; chamada ao gestor nas exceções. | Qualidade, tempo e falhas medidos nos marcos de 50 e 100 clientes sem perda dos controles anteriores. |

## 3. Mapa das ideias

| ideia | ligação com o produto atual | primeira entrega útil | prova exigida antes de ampliar | fase |
|---|---|---|---|---|
| **Documento central de operação + documentos de nicho** | Sustenta a Mesa do gestor, Criativos e campanha, treinamento e avaliação de IA. | Template versionado com objetivo, gatilho, entradas, passos, responsável, evidência, exceções, comunicação e critério de encerramento. Aplicar primeiro a um processo comum e a um nicho escolhido. | Casos reais mostram o que é regra comum e o que varia por nicho ou subnicho; correções humanas viram revisão identificável. | A |
| **Campanha criada pelo app** | Evolução da etapa 06; toda escrita na Meta continua passando pelo `backend_v2g`. | Modo de preparação: selecionar negócio e conta contratada, montar rascunho pausado, executar pré-voo e pedir aprovação formal. | Permissões reais, conta correta, assinatura e pagamento comprovados, idempotência, campanha pausada identificável e publicação manual conferida na Meta. | B–C |
| **Mesa que dispense abrir a conta de anúncios na rotina** | Expande a etapa 05. Não significa esconder falha ou remover o acesso de exceção. | Uma visão por conta com estado, gasto, entrega, criativos, tarefas, coleta e última atualização de cada fonte. | Comparação por amostra com a plataforma; falha, atraso ou dado parcial aparecem explicitamente; gestor consegue chegar à conta externa quando necessário. | B–C |
| **CPL e volume provável de leads por nicho** | Usa dados por campanha, conta, período, oferta, praça e definição uniforme de lead. | Relatório descritivo por coorte, começando por histórico observado, cobertura e dispersão; sem previsão para o cliente. | Volume comparável suficiente definido depois de medir a variação; custo, período, origem, qualidade e intervalo de incerteza presentes. Média nunca vira promessa. | D–E |
| **Rastrear conversas do anúncio até vendas no WhatsApp** | Fecha o ciclo anúncio → conversa → pessoa → desfecho. O WhatsApp do anúncio é diferente do contato pessoal do usuário. | Contrato de IDs e eventos: anúncio/campanha, conversa, contato, oportunidade, venda relatada e venda verificada. | Integração autorizada, consentimento, deduplicação, retenção e amostra na qual o vínculo possa ser auditado sem cruzar pessoas apenas por nome ou telefone. | B–D |
| **CRM simples dentro da V2G** | É o registro operacional das vendas do cliente, não o RevOps comercial da própria V2G. | Pipeline mínimo configurável: novo contato, em atendimento, qualificado, proposta, ganho, perdido e motivo; histórico de mudanças e responsável. | Cliente ou equipe consegue manter os estados com esforço medido; venda relatada permanece separada de receita confirmada. | D |
| **IA para receber, qualificar ou vender** | Depende do CRM e do histórico de conversas; não começa enviando mensagens autonomamente. | Modo assistente: resumir, classificar com incerteza, sugerir resposta e pedir confirmação humana. | Política de temas proibidos, identidade, horário, transferência humana, amostra revisada, qualidade medida e registro da resposta realmente enviada. | E–F |
| **Cliente enviar e, futuramente, publicar criativos com autonomia** | Evolução direta da etapa 06. Envio, aprovação e publicação são eventos distintos. | Histórico de versões, revisão no app, aprovação formal e fila de publicação manual com negócio e conta exatos. | Sessões reais de cliente e gestor, arquivo recuperável, permissão da Meta, retorno verdadeiro da publicação e estado `no ar` vindo de fonte confiável. | C–F |
| **Gerar e trocar criativos de imagem automaticamente** | Depende de histórico por peça e capacidade de atribuir desempenho sem confundir campanha, conjunto e anúncio. | Gerar alternativas como experimento identificado, submetê-las à revisão e guardar hipótese, versão e peça anterior. | Desempenho por peça com período e contexto; regra de teste; aprovação; limite de frequência; rollback; resultado do criativo novo medido em vez de presumido. | E–F |
| **Agente que acompanha e otimiza continuamente** | Usa a Mesa, decisões registradas, métricas e documentos operacionais. | Modo sombra: observa, explica o sinal, propõe uma ação e registra quando chamaria Cauã, sem executar. | Comparação entre proposta, decisão humana e resultado; limites por tipo de ação; dados atrasados detectados; taxa de acerto e custo de erro definidos. | E–F |
| **Operação cada vez menos dependente do gestor humano** | É resultado das frentes anteriores, não uma função isolada. | Medir tempo por conta, tarefas repetidas, exceções, retrabalho e decisões que exigem julgamento. | Marcos de 50 e 100 clientes medidos com qualidade, SLA, falhas, custo e capacidade; cada exceção e aprovação continua com dono definido. | A–F |

## 4. Dois documentos, não dezenas, para começar

### 4.1 Documento central de operação

Começa com regras que valem para qualquer conta:

- identidade de negócio, conta de anúncio e responsável;
- estados de pagamento, contrato, acesso, onboarding, criativo e campanha;
- aprovações necessárias e canais válidos;
- leitura de métricas, atraso e falha de fonte;
- rotina diária e semanal do gestor;
- registro de decisão, resultado, exceção e correção;
- quando agir, quando aguardar e quando escalar para Victor ou Cauã.

### 4.2 Documento piloto de nicho

Escolher um nicho com casos reais suficientes para preencher, sem inventar:

- oferta e unidade de análise;
- termos e restrições próprias;
- perguntas adicionais realmente necessárias;
- exemplos de criativos aprovados e reprovados;
- sinais observados de intenção e qualidade do lead;
- histórico de CPL com definição, período e contexto;
- exceções que alteram a operação comum.

Só depois do piloto decidir se a estrutura será por nicho, subnicho ou os dois.

## 5. Contrato mínimo de dados

Antes de CRM, previsão ou automação, cada registro relevante precisa responder:

1. **quem/qual:** pessoa, negócio, conta, campanha, anúncio, criativo ou conversa;
2. **origem:** sistema e identificador externo;
3. **quando:** ocorrência, coleta e período representado;
4. **natureza:** medido, declarado, inferido ou proposto;
5. **qualidade:** completo, parcial, atrasado, divergente ou indisponível;
6. **responsável:** quem criou, confirmou, corrigiu ou aprovou;
7. **resultado:** o que aconteceu depois da decisão;
8. **reversão:** como desfazer ou corrigir sem apagar o histórico.

Não unir entidades automaticamente por nome, e-mail, telefone, CNPJ ou texto
parecido quando não existir vínculo explícito e auditável.

## 6. Escada de autonomia

Toda capacidade nova percorre a mesma escada:

1. **registrar:** o sistema captura a evidência sem decidir;
2. **explicar:** organiza e mostra o que sabe e o que não sabe;
3. **recomendar:** propõe ação com motivo, confiança e alternativa;
4. **preparar:** monta rascunho reversível, sem efeito externo;
5. **executar com aprovação:** uma pessoa confirma a ação exata;
6. **executar por política:** somente ação delimitada, reversível e já medida;
7. **escalar:** dúvida, falha de fonte, impacto alto ou caso novo volta ao dono humano.

Pular degraus exige uma decisão nova de Victor e prova equivalente ao risco.

## 7. Métricas de evolução

Não usar apenas quantidade de funções ou clientes. Medir por período:

- cobertura e atraso dos dados por fonte;
- percentual de entidades ligadas por ID verificável;
- tempo do gestor por conta e por tipo de tarefa;
- tarefas, exceções e retrabalho por conta;
- recomendações aceitas, rejeitadas e corrigidas;
- decisões com resultado posterior disponível;
- publicações, falhas, duplicidades e reversões;
- conversas sem desfecho e vendas apenas relatadas;
- qualidade e custo operacional nos marcos de 50 e 100 clientes.

O denominador e os casos ausentes acompanham cada taxa. Sem cobertura conhecida,
mostrar contagens e lacunas em vez de uma porcentagem que pareça precisa.

## 8. Próximos blocos propostos

Estes blocos são independentes e precisam de aprovação um a um:

1. **Template operacional V0:** criar o template do documento central e preencher
   o fluxo `criativo recebido → revisão → publicação manual → prova de no ar`.
2. **Mapa de identidade V1:** reconciliar os IDs já existentes e acrescentar os
   que faltam para conta de anúncio, campanha, anúncio, criativo, conversa e venda.
3. **Medição da Mesa:** observar uma rotina real do gestor e medir tempo, fontes,
   cliques fora do WebApp, falhas e exceções antes de redesenhar a tela.
4. **Escolha do nicho piloto:** Victor e Cauã escolhem um nicho com casos reais;
   preencher o primeiro documento sem estimar CPL ou comportamento inexistente.
5. **Contrato do CRM do cliente:** definir etapas, quem atualiza, esforço aceitável,
   venda relatada versus verificada, consentimento e retenção antes de construir tela.

## 9. Limites atuais preservados

- Toda escrita na Meta passa pelo `backend_v2g`.
- Campanha inicial e publicação de criativo continuam humanas nesta fase.
- Aprovação de criativo não prova publicação; publicação não prova entrega atual.
- CPL histórico não é previsão; previsão não é promessa.
- IA não transcreve, prova identidade, confirma pagamento ou substitui fonte.
- A Mesa pode reduzir a abertura rotineira da plataforma, mas nunca esconder dado
  atrasado, parcial ou indisponível.
- Nenhuma meta deste documento autoriza migration, deploy, configuração externa,
  mensagem, cobrança ou escrita na Meta.
