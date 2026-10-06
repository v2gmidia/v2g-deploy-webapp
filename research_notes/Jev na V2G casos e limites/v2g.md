# Jev na V2G: encaixe no produto e na operação

## O que está implementado hoje e onde a V2G ainda tem lacunas?

### Takeaway
No código local, Jev só sugere prioridade e motivo para pendências do cadastro na tela do operador, com fallback para uma regra simples. A jornada comercial, a fila durável de criativos, a agenda e a cobrança não estão integradas ponta a ponta; os usos novos abaixo são propostas, não funcionalidades existentes.

### Cited Findings
- A decisão de outubro fixa dois caminhos de venda, qualificação declarada por CNPJ e venda via WhatsApp antes de comprar, acesso após pagamento, reunião e primeira campanha operada pelo gestor. Instagram fraco não barra a compra. — [decisões de produto](../../docs/decisoes.md#L74-L99)
- `avaliarQualificacao` implementa as duas travas como regra determinística local, enquanto `/entrar` ainda permite `auth.signUp` sem compra associada. Esse código não cria um funil comercial completo. — [regra comercial](../../lib/comercial/oferta.ts#L9-L25); [cadastro público](../../app/(public)/entrar/actions.ts#L41-L97); [estado de outubro](../../docs/estado/oferta-integracoes-outubro-06-10.md#L5)
- A página `/revisar-perfil` consulta negócios incompletos, ordena por espera e acrescenta `triarPendenciasDoGestor`; a ordem permanece por idade mesmo quando Jev retorna. É código local, sem verificação da tela autenticada ou da produção nesta pesquisa. — [página do operador](../../app/(protected)/revisar-perfil/page.tsx#L59-L128)
- O adaptador Jev usa `jev-1.13.0`, `JEV_PILOTO_ATIVO`, timeout de 1,5 s e exige confiança >=0,75 nas duas respostas; em falha retorna `null` e a regra assume. No estado enviado há apenas campo, motivo, caminho e dias de espera. — [adaptador](../../lib/jev/typesafe.ts#L5-L100); [estado mínimo](../../lib/jev/triagem.ts#L9-L65)
- A análise atual de imagem na aba de criativos devolve veredito, mas não cria submissão persistente, tarefa do gestor ou aviso. O documento propõe um contrato futuro de `submissao_id` e estado `aguardando_gestor`. — [contrato da fila de criativos](../../docs/estado/criativos-fila-06-10.md#L3-L20)
- O próprio WebApp afirma que não há integração de pagamento na página de conta; a jornada de outubro registra checkout, agenda, contrato, NFS-e e mensageria como não comprovados. — [página de conta](../../app/(protected)/conta/page.tsx#L29-L34); [estado da jornada](../../docs/estado/jornada-outubro-06-10.md#L16-L19)
- A pasta de landing `app/(marketing)` descrita no AGENTS não existe no checkout atual; existe `app/page.tsx`, e o índice registra que a vitrine saiu do app. O repositório da LP e o Finance são superfícies separadas, não inspeccionadas nesta pesquisa. — [índice do estado](../../docs/estado/indice.md#L65); [jornada](../../docs/estado/jornada-outubro-06-10.md#L3)

### Inferences
- O primeiro ganho operacional tende a vir de classificar texto variado já recebido, enquanto regras exatas continuam decidindo CNPJ, status de pagamento, prazo e anúncio no ar.
- Há um risco de volume no desenho atual: cada renderização da fila dispara uma chamada por negócio incompleto quando a flag estiver ligada, sem cache ou registro durável de decisão. Em 50 negócios incompletos, uma abertura poderia fazer até 50 requisições paralelas e cobrar novamente ao recarregar. Essa contagem é inferência do `Promise.all`, não medição.

### Gaps
- Não há medição local de quantos leads, mensagens, tickets, criativos ou pendências a V2G recebe por dia; por isso nenhum caso pode ser chamado de economia real em escala.
- O estado de produção, da LP, do Finance, da TypeSafe e da base real de clientes não foi consultado nesta pesquisa.

## Onde o Jev pode reduzir tempo e custo de decisão ao longo da V2G?

### Takeaway
O melhor papel é uma etapa pequena que recebe contexto suficiente, devolve resposta tipada e envia a exceção à pessoa certa. A utilidade é maior em alto volume de texto ambíguo; tarefas puramente numéricas ou com uma regra explícita continuam mais baratas e verificáveis em código.

### Cited Findings
- O relatório existente identifica `Choice`, `Score` e `Noul` como saídas tipadas e registra que a API recebe texto/JSON, não imagem, áudio ou vídeo diretamente. Esse limite importa para onboarding por áudio, anúncios visuais e ligações. — [relatório Jev](../../reports/Jev%20na%20V2G.md#L5-L13)
- Para leads, a regra aprovada é CNPJ e venda por WhatsApp declarados; Instagram fraco e comercial ainda fraco não são veto automático. — [decisões de entrada](../../docs/decisoes.md#L83-L93)
- O relatório já separa rotulagem de criativos públicos da alegação de performance: Biblioteca de Anúncios mostra atributos observáveis, enquanto resultado depende de dados autorizados da conta e métrica definida. — [relatório Jev](../../reports/Jev%20na%20V2G.md#L17-L17); [dados criativos](../../reports/Jev%20na%20V2G.md#L45-L55)
- A tela de resultados usa dados do backend, e o índice registra lacunas de vínculo e coleta; por isso uma planilha preditiva ainda precisa de dados confiáveis e resultados observados. — [índice do estado](../../docs/estado/indice.md#L45-L50); [tela de anúncios](../../app/(protected)/anuncios/page.tsx#L29-L31)

### Inferences
- **Marketing e LP:** classificar motivo de contato, intenção de compra e pergunta principal após captura do lead; encaminhar ao comercial em até 30 min. Não existe caminho Jev na LP inspecionada aqui. Testar também agrupamento de objeções, usando texto redigido e sem PII.
- **Comercial:** aplicar primeiro as travas de CNPJ e venda por WhatsApp em código; Jev classifica `pronto_para_comprar`, `precisa_esclarecimento`, `parceria`, `fora_do_escopo_declarado` e tema da objeção. Não rejeitar automaticamente um lead com base em score. Sem CRM e registro do desfecho, a palavra “quente” seria opinião sem validação.
- **Onboarding e reunião:** classificar respostas livres ou transcrição de áudio em `acesso`, `oferta`, `criativo`, `verba`, `dúvida`, `outro`, e sinalizar contradição ou pergunta a fazer. Exige transcrição por outro serviço; a classificação pode preparar a pauta de 25 min e pendências do gestor.
- **Criativos:** após OCR ou extração visual aprovada, Jev pode etiquetar ângulo, gancho, oferta, CTA e promessas a revisar; gestor avalia peça. Para criativos internos com gasto e resultados próprios, classificar `dados_insuficientes`, `revisar`, `acompanhar` a partir de métricas computadas. Não inferir vencedor pela permanência na Biblioteca de Anúncios.
- **Operação e suporte:** triagem de mensagens/tickets por assunto, responsável, urgência e repetição; agrupamento de reclamações pode revelar falha sistêmica. O valor depende de fila e histórico de atendimento que ainda não foram comprovados.
- **Financeiro:** categorizar descrição de lançamento e conciliação suspeita para revisão. Reconhecimento de pagamento, contrato, NFS-e, liberação de acesso e inadimplência devem usar eventos e fontes de verdade, não probabilidade Jev.
- **Agentes e roteamento:** escolher entre regra, modelo leve, modelo avançado e pessoa com categorias fixas. Roteamento tem custo e latência próprios; comparar com regra simples e incluir o custo do modelo seguinte antes de afirmar economia.
- **Planilha “preditiva”:** primeiro calcular indicadores por cliente/coorte (gasto, conversas, conversas qualificadas, retenção, tempo de resposta, peças, dias no ar) e rotular eventos reais. Jev pode classificar risco ou anomalia com esses atributos; previsão de vendas, churn ou desempenho precisa de histórico, alvo, janela e backtest temporal. O modelo não fabrica a base nem substitui um forecast validado.
- **Guardrail:** checar textos contra uma política versionada pode reduzir carga de QA, mas confidence alta não prova conformidade; casos que possam gerar alegação pública, gasto ou bloqueio devem ir à pessoa responsável.

### Gaps
- Não foi verificado consentimento/base para enviar conversas, áudio transcrito, reclamações ou dados financeiros a TypeSafe. O piloto atual só envia estado sem identificação; cada ampliação exige minimizar dados e aprovar o contrato de tratamento.
- Não há dados medidos de custo total da cadeia OCR/transcrição + Jev + revisão humana nem de precisão por categoria/idioma; alegações de vídeos e prints não transferem esses números à V2G.

## Quais são os primeiros pilotos e como provar que funcionam?

### Takeaway
Trocar a pergunta atual de “prioridade” por uma classificação semântica que a regra de dias não responde: qual trabalho chegou e para quem vai. Medir contra decisões humanas e contra o processo atual, incluindo custo, tempo e erros; começar com revisão e sem ação externa.

### Cited Findings
- O script de nove casos usa estados sintéticos de um único campo e define `esperado` pela regra determinística. `acordo-regra=2/9` mede concordância com esse baseline, não acurácia independente nem capacidade geral do Jev. — [script de medição](../../scripts/medir-jev.ts#L42-L55); [comparação](../../scripts/medir-jev.ts#L156-L170)
- A regra determinística já resolve por dias >=5 e `nao_sei`; Jev recebe pouca semântica adicional nesse piloto. — [triagem](../../lib/jev/triagem.ts#L37-L65)
- O relatório anterior propõe rotular de 50 a 100 casos reais desidentificados e medir cobertura, abstenção, concordância por classe, falsos encaminhamentos, tempo, custo, p50/p95 e falhas. — [plano de avaliação](../../reports/Jev%20na%20V2G.md#L75-L82)
- A fila de criativos ainda precisa ser criada e a LP não está neste repo; começar pelo único ponto de entrada Jev já codificado encurta o tempo de implementação, mas só se a tarefa usar texto informativo permitido. — [fila atual do gestor](../../app/(protected)/revisar-perfil/page.tsx#L104-L128); [fila de criativos](../../docs/estado/criativos-fila-06-10.md#L3-L20)

### Inferences
- **Piloto 1 — roteamento de pendências do onboarding:** amostra de 50–100 casos já revisados pelo gestor, desidentificados; tipos `acesso`, `agenda`, `oferta`, `dados_do_negocio`, `criativo`, `outro`, mais `responsavel=cliente|gestor|suporte`. Enviar descrição mínima ou resumo sem PII; comparar com dois revisores, reconciliar discordâncias. Usar resultado como etiqueta e filtro interno. A prioridade por prazo continua regra.
- **Piloto 2 — triagem de lead capturado:** quando o funil/CRM realmente persistir leads, classificar intenção e próxima conversa com categorias fechadas. Aplicar CNPJ e WhatsApp em código antes, conferir falso descarte, tempo para primeiro contato (<30 min como meta de processo) e taxa de correção pelo vendedor. Evitar score “probabilidade de fechar” até haver desfechos registrados.
- **Piloto 3 — taxonomia de criativos:** depois da submissão durável e da extração visual, classificar texto e atributos extraídos em gancho, formato, oferta e CTA; conferir com mídia/gestor. Esse piloto pode produzir dados próprios reutilizáveis, mas é dependente das duas etapas prévias e não prevê performance.
- Critérios a definir com Victor/Gabriel antes de liberar qualquer classificação que mude uma fila real: rótulos, responsável por revisar, cobertura mínima, taxa tolerável de roteamento errado, especialmente falsos descartes, e janela de monitoramento. Não escolher limiar `0,75` ou `0,50` com base nos nove sintéticos. Comparar p50/p95 no Brasil e custo real por item incluindo revisão e etapa anterior.
- Persistir decisão versionada, estado minimizado, confidence, fallback, ação humana e resultado. Deduplicar por evento e versão de perguntas; executar quando o evento surge, não a cada render da página. Usar fallback para erro, timeout, baixa confiança e categorias inválidas.

### Gaps
- Ainda faltam contagens de volume por etapa, rótulos humanos, tempos atuais de triagem, taxas de revisão e dados de conversão; sem esses números não se quantifica velocidade, qualidade ou redução de custo para a V2G.
- A amostra de nove casos não valida confiança como probabilidade calibrada; thresholds precisam de conjunto rotulado independente.
