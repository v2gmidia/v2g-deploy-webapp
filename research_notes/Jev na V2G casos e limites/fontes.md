# Jev: fontes oficiais, exemplos e limites

## Identidade do produto e capacidade real

### Takeaway
Jev é o modelo System One da TypeSafe AI. Ele avalia texto ou JSON e devolve julgamentos tipados; o site jevai.dev é uma coleção comunitária independente, não a documentação do fornecedor.

### Cited Findings
- A TypeSafe chama Jev de seu primeiro modelo System One e descreve uma entrada `state` com perguntas fechadas, sem geração de resposta aberta. — [System One](https://docs.typesafe.ai/concepts/system-one); [Como construir](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- A API usa `POST https://api.typesafe.ai/v1/systemone`, Bearer token, `state`, `model` e mapa `questions`. — [Referência de API](https://docs.typesafe.ai/api)
- `Choice` escolhe uma opção e devolve distribuição e confiança; `Score` atribui posição numa escala ordenada e devolve distribuição e confiança; `Noul` devolve somente a probabilidade de “sim”, sem campo de confiança separado. — [Primitivas](https://docs.typesafe.ai/primitives); [Confiança](https://docs.typesafe.ai/confidence)
- A confiança de Choice e Score resume a concentração das probabilidades; não significa acerto garantido em um item. Limiar deve ser ajustado com casos do próprio domínio e risco da ação. — [Confiança](https://docs.typesafe.ai/confidence); [System One](https://docs.typesafe.ai/concepts/system-one)
- Jev aceita texto/JSON, mas não imagem, áudio ou vídeo bruto; esses meios precisam virar texto ou campos estruturados antes. Inglês é a língua de melhor desempenho declarada; cargas em português devem ser testadas. — [State](https://docs.typesafe.ai/concepts/state); [Models](https://docs.typesafe.ai/models)
- A página de casos de jevai.dev identifica a si mesma como guia/comunidade independente e esclarece que seus rótulos Choice, Score e Noul são interpretação editorial, não reconstrução exata de cada chamada de API dos criadores. — [Jev AI Dev](https://jevai.dev/pt/user-cases/)
- A Eunerd se declara sem afiliação com a TypeSafe e rotula casos como teste relatado, demo, uso documentado ou ideia; seu guia diz que um formato válido não assegura escolha correta. — [Eunerd](https://encontreumnerd.com.br/jev)

### Inferences
- O terceiro nível do slide do usuário (aplicações) consiste em código que chama Jev para uma decisão delimitada e executa ações segundo permissões próprias. O Jev sozinho não conversa, não transcreve, não vê criativo e não clica na interface.
- A resposta anterior ao usuário que generalizou “toda resposta tem confiança” precisa de precisão: `Noul` não tem esse campo; seu valor é probabilidade de sim.

### Gaps
- Não há benchmark oficial de acurácia em português brasileiro para qualificação de leads da V2G, triagem de criativos ou suporte.

## Volume, latência, preço e comparativos

### Takeaway
Há potencial claro para decisões semânticas repetitivas em grande volume, mas os números virais vêm de tarefas e infraestrutura específicas. A comparação certa para a V2G é com sua regra atual, revisão humana e modelos alternativos no mesmo conjunto de casos.

### Cited Findings
- A TypeSafe anuncia `jev-1.13.0` a US$ 0,042 por milhão de tokens de entrada, saída gratuita; limites atuais declarados de 100 mil tokens/s e 80 requisições/s, sujeitos a mudanças. Seu `jev-latest` pode mudar de versão; fixar versão evita mudança silenciosa de limiar. — [Models](https://docs.typesafe.ai/models)
- Perguntas independentes sobre **um mesmo estado** são avaliadas em paralelo em **uma requisição**. A página de documentação compara 13 perguntas em uma chamada com 13 chamadas sequenciais e relata 12,2 vezes menos custo e 10 vezes menos tempo para aquele artigo. Isso não é uma API genérica de lote de milhares de registros. — [Primitivas](https://docs.typesafe.ai/primitives); [Perguntas paralelas](https://docs.typesafe.ai/cookbooks/parallel_questions)
- O `prompt_jev()` da MotherDuck classificou, em benchmark publicado pela própria MotherDuck, 100 mil notícias da amostra AG News em 40 segundos, US$ 0,50 e 89% de acerto. O comparador mais caro divulgado, GPT-5.6 Terra, ficou em 31m59s, US$ 37,58 e 88%; modelos menores na própria tabela custaram US$ 1,58 a US$ 3,53. — [MotherDuck, benchmark e código](https://motherduck.com/blog/motherduck-supports-jev/)
- A MotherDuck publica o SQL da amostra e diz que o `prompt_jev()` está em seus planos pagos. Seus números pertencem à integração SQL, ao conjunto AG News e ao método de execução mostrado; não estimam automaticamente custo total ou tempo da V2G. — [MotherDuck](https://motherduck.com/blog/motherduck-supports-jev/)
- No SQL publicado pela MotherDuck, escolhas nulas são contadas à parte e não como erros no cálculo de acurácia; o texto não apresenta a contagem resultante dessas escolhas. Assim, os 89% devem ser lidos com essa ressalva. — [MotherDuck, consulta de avaliação](https://motherduck.com/blog/motherduck-supports-jev/)
- A coleção jevai.dev registra a demonstração de 500 e-mails em segundos por cerca de US$ 0,035 como **relato do autor**, e alerta que produção requer rótulos definidos, interpretação da confiança e revisão humana. — [Jev AI Dev, caso Riley Brown](https://jevai.dev/pt/user-cases/)
- O marketing da TypeSafe divulga razões de até 193,6 vezes mais velocidade e 444,6 vezes menos custo em workloads próprios; a empresa qualifica a comparação como tarefas System One. — [TypeSafe, página inicial](https://typesafe.ai/)

### Inferences
- A figura “100 mil linhas / 40 s / US$ 0,50” indica uma oportunidade de etiquetar dados históricos e alimentar painéis, desde que exista infraestrutura de processamento e conjunto de validação. Não demonstra capacidade preditiva de desempenho de campanha.
- Na tabela MotherDuck, US$ 37,58 / US$ 0,50 ≈ 75 vezes menor custo para o comparador Terra; “1% do custo” é arredondamento de marketing e não se aplica aos comparadores menores.

### Gaps
- Nenhum dos exemplos citados mede a latência ponta a ponta, o preço total, a acurácia e a taxa de revisão para o fluxo V2G em português e com seus critérios.
- Não há prova pública de que “zero alucinações” signifique zero erros semânticos; a garantia apresentada é saída dentro de um esquema, e o próprio fornecedor lista erros conhecidos.

## Casos que o usuário destacou e como funcionam tecnicamente

### Takeaway
A ideia da “planilha preditiva” tem dois usos distintos: colunas semânticas rápidas sobre cada linha e previsão estatística real. O primeiro pode usar Jev diretamente; o segundo exige histórico rotulado, alvo definido e validação temporal.

### Cited Findings
- A demonstração de Nader Dabit usa um cabeçalho como “Urgência” para pedir ao Jev uma avaliação semântica de cada linha; jevai.dev a classifica como protótipo, cuja qualidade operacional ainda precisa ser testada. — [Jev AI Dev, planilha](https://jevai.dev/pt/user-cases/)
- Um cookbook oficial mostra Jev convertendo descrições de vinho em 67 características numéricas para um modelo CatBoost treinado em 2 mil resenhas com pontuações de críticos. Naquele conjunto, o erro RMSE no teste caiu de 2,47 com contagem de palavras para 1,77 com perguntas escolhidas em cinco rodadas. A documentação alerta que se trata de um conjunto e uma execução e recomenda divisão cronológica quando o objetivo é prever o futuro. — [TypeSafe, descoberta de atributos](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery)
- A coleção jevai.dev apresenta classificação de biblioteca pública de anúncios por etapa da jornada e estilo como demonstração de etiquetagem; ela não atribui ao Jev medição do retorno financeiro real de cada anúncio. — [Jev AI Dev, biblioteca de anúncios](https://jevai.dev/pt/user-cases/)
- A mesma coleção separa captura de fala, estado do navegador, checagens e clique real do estágio Jev no exemplo de navegador por voz. — [Jev AI Dev, navegador por voz](https://jevai.dev/pt/user-cases/)
- A TypeSafe recomenda manter fluxo, regras determinísticas e efeitos externos no código; seu modelo deve receber julgamentos estreitos, como encaminhamento de ticket e sinais de urgência. — [Como construir](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)

### Inferences
- Para V2G, “planilha preditiva” pode começar como colunas de aderência de lead, objeção dominante, etapa do funil, tipo de peça e urgência de ticket. Prever conversão, custo por conversa ou eficácia criativa requer resultado real associado à linha, tamanho de amostra suficiente e teste fora do período usado para escolher atributos.
- A análise de criativos a partir de imagem/vídeo precisa de um estágio anterior de extração de texto, OCR, transcrição ou descrição visual. Jev pode classificar os atributos produzidos; não consegue inspecionar diretamente o pixel.

### Gaps
- Os links não oferecem uma implementação validada da “planilha preditiva” em leads, campanhas e resultados da V2G.
- O usuário menciona estatísticas como 2,1 vezes mais rapidez e 22 vezes menos custo em vídeos de terceiros; sem tarefa, baseline e código reproduzível específicos, não são métricas para projeção V2G.

## Falhas conhecidas e desenho de validação

### Takeaway
O melhor uso inicial é uma decisão semântica de opções claras, em que o humano pode revisar uma classificação e o código pode preservar regras obrigatórias. A calibração depende dos exemplos reais do processo.

### Cited Findings
- A TypeSafe lista falhas conhecidas da versão 1.13: literalidade, matemática e contagem, comparação de datas, múltiplos saltos de raciocínio, contexto irrelevante longo, conteúdo adversarial, conflito entre instruções e critérios, e viés pela ordem de opções Choice. — [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- O fornecedor orienta calcular números e datas em código, enviar só o trecho relevante, escrever critérios de opção explícitos e testar alterações de ordem em Choice. — [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- Para Choice e Score, `confidence` mede quão concentrada está a distribuição; para Noul, um valor perto de 0,5 é incerto e não existe confiança separada. O fornecedor orienta faixas de ação proporcionais ao risco e calibração com dados próprios. — [Confiança](https://docs.typesafe.ai/confidence)
- Saída tipada elimina resposta fora das opções dadas, mas o próprio System One explica que calibração em grupos não garante correção de uma decisão individual. — [System One](https://docs.typesafe.ai/concepts/system-one)
- A Eunerd diferencia testes relatados, demos, documentação e ideias e recomenda modo sombra com baseline e limiar humano. — [Eunerd](https://encontreumnerd.com.br/jev)

### Inferences
- A primeira experiência V2G deveria formular perguntas atômicas sobre uma mensagem ou registro, separar critérios de elegibilidade objetiva em código, registrar distribuição/confiança e comparar com classificação humana em casos positivos, negativos e limítrofes. “Ele escolheu uma categoria válida” não é um critério de sucesso.
- Os 9 casos fictícios e 2 concordâncias já medidos no projeto apontam que a pergunta genérica de prioridade não é uma validação do potencial do Jev para todas as tarefas; apontam falha da formulação ou do encaixe daquela tarefa específica.

### Gaps
- Ainda faltam rótulos humanos V2G, matriz de confusão por categoria, taxa de abstinência, calibração confiança/acerto e comparação de custo/latência para priorizar qual aplicação gera economia líquida de tempo.
