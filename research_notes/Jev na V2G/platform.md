# Plataforma Jev / TypeSafe: identidade, contrato e segurança para V2G

## Produto oficial, API e contrato de saída

### Takeaway
O produto oficial é Jev, modelo System One da TypeSafe AI, em early access desde 15/09/2026. Para V2G serve para classificação, priorização e roteamento estruturados; não é modelo de geração, calculadora ou substituto de revisão humana.

### Cited Findings
- A TypeSafe lançou Jev em early access como seu primeiro modelo público System One em 15/09/2026. [Lançamento oficial](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- A API oficial é POST https://api.typesafe.ai/v1/systemone, autenticada por Bearer API key; recebe state, model e mapa de questions. State aceita texto, objeto JSON ou array. [API oficial](https://docs.typesafe.ai/api)
- Choice retorna opção fechada, probabilidades e confidence; Score retorna rubrica ordenada, probabilidades, score e confidence; Noul retorna probabilidade sim entre 0 e 1. [Primitivas](https://docs.typesafe.ai/introduction)
- A API só aceita texto: string, JSON ou arrays de valores textuais. Imagem, áudio e vídeo não são entradas diretas. [Modelos e limites](https://docs.typesafe.ai/models)
- Os termos dizem que a saída pode ser imprecisa ou errônea e cabe ao cliente avaliá-la independentemente. [Contrato](https://typesafe.ai/legal/mca)
- O repositório ligado ao domínio jev-ai/thejevai declara que é um app independente e não o site oficial do modelo. Usar typesafe.ai, docs.typesafe.ai e api.typesafe.ai na integração. [Declaração](https://github.com/jev-ai/jev-api)

### Inferences
- Para analisar criativos, outro serviço deve transformar a mídia em texto/atributos. Jev pode então classificar oferta, ângulo, CTA, nicho ou necessidade de revisão; não consegue ver a mídia sozinho.
- Criar adaptador interno com perguntas versionadas e estado mínimo. Frontend, Meta e Asaas não chamam Jev diretamente.
- Incluir sempre a opção revisar/desconhecido quando aplicável. Choice serve para fila/etapa; Score, prioridade; Noul, filtros estreitos.

### Gaps
- Não há prova oficial encontrada de qualidade para português brasileiro, transcrição de áudio, criativos ou nichos V2G. A documentação identifica inglês como língua de melhor precisão e pede validação em outros idiomas. [Idiomas](https://docs.typesafe.ai/models)
- Não há benchmark independente da V2G. Validar com exemplos reais rotulados por gestor antes de automatizar.

## Latência, consistência, custo, limites e confiabilidade

### Takeaway
Preço e velocidade publicados são interessantes para decisões em volume, mas o produto é novo, limites podem mudar e consistência não significa determinismo ou acerto suficiente para uma ação sem política própria.

### Cited Findings
- Jev 1.13.0 custa US$ 0,042 por milhão de tokens de entrada; output não é cobrado. [Preço](https://docs.typesafe.ai/models)
- A TypeSafe afirma latência ponta a ponta de 70–500 ms e observa que seus testes foram feitos do oeste dos EUA; isso não mede Brasil nem carga V2G. [Ressalvas oficiais](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- Limites publicados: 100 mil tokens/s, 80 req/s, contexto de 64 mil tokens por requisição e máximo de 32 mil para state mais a pergunta mais longa. A própria TypeSafe informa que pode ajustar limites sem aviso. [Limites](https://docs.typesafe.ai/models)
- O alias jev-latest pode mudar de versão e, portanto, de respostas; a TypeSafe recomenda fixar versão ao calibrar limiares. [Aliases](https://docs.typesafe.ai/models)
- A API usa 429 para rate limit e 529 para sobrecarga; orienta retry com backoff exponencial. [Erros](https://docs.typesafe.ai/api)
- Confidence é calculada da distribuição de probabilidades de Choice/Score; Noul não tem confidence separada e 0,5 indica incerteza. [Confidence](https://docs.typesafe.ai/confidence)
- Limitações assumidas: leitura literal, números/contagem, datas, contexto irrelevante, conteúdo adversarial, ordem de opções e geração. [Limitações Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

### Inferences
- Em produção inicial, fixar jev-1.13.0 e registrar versão, pergunta, resposta, limiar, ação e resultado humano. Não usar jev-latest sem revalidação.
- Fallback para timeout, 429, 529, indisponibilidade ou baixa confiança: criar pendência para gestor. Nunca bloquear pagamento, onboarding ou atendimento.
- Limiar varia por risco: sugestão de tema tolera mais incerteza; encerrar lead, cobrar, liberar acesso, mudar verba ou publicar campanha requer regra determinística e humano.
- Números, datas, CAC, faturamento, vencimento, orçamento e atribuição ficam em código/banco; Jev só interpreta a parte semântica.
- Medir no sandbox: p50/p95 Brasil, custo por decisão, 429/529 e concordância com gestor.

### Gaps
- Não foi encontrado SLA público, status page, RPO/RTO ou p95 no Brasil.
- Não foi localizada tabela pública contratual além de US$ 0,042/MTok nem confirmação de impostos brasileiros ou teto de gasto.
- Alegações de rapidez, calibração, zero hallucinations e sustentabilidade do preço são da própria TypeSafe; ela reconhece que a sustentabilidade será comprovada no tempo. [Nuances](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

## Dados, LGPD e salvaguardas de integração na V2G

### Takeaway
É possível usar Jev como operador para uma decisão limitada, com minimização e documentação de transferência internacional. Não enviar conversas integrais, credenciais, dados financeiros ou mídia que não seja necessária.

### Cited Findings
- A TypeSafe informa coletar inputs dos serviços, mas declara não treinar ou fazer fine tuning de modelos nesses inputs. [Privacidade](https://typesafe.ai/legal/privacy-policy)
- Os serviços são hospedados nos Estados Unidos; os dados podem ser transferidos para processamento e armazenamento nos EUA. [Privacidade](https://typesafe.ai/legal/privacy-policy)
- A política prevê retenção pelo tempo razoavelmente necessário para prestar o serviço ou finalidades comerciais, sem prazo público fixo. [Retenção](https://typesafe.ai/legal/privacy-policy)
- O DPA trata cliente como controlador e TypeSafe como operadora, prevê subprocessadores, assistência a direitos do titular e aviso de incidente em até 72h após ciência. [DPA](https://typesafe.ai/legal/data-processing)
- O contrato permite telemetria de logs, hashes, estatísticas, classificações, métricas e learnings de uso sem restrição; também permite atualização que gere incompatibilidade, com esforço razoável de aviso. [Contrato](https://typesafe.ai/legal/mca)
- A documentação diz que não treina em requests/responses e cita zero data retention apenas para clientes enterprise; detalhes operacionais de ZDR não foram confirmados. [Dados](https://docs.typesafe.ai/models)

### Inferences
- Antes de produção, aceitar/assinar DPA aplicável e registrar TypeSafe como operadora, finalidade, base legal, categorias de dados, transferência internacional e subprocessadores; validar com jurídico.
- Enviar apenas IDs internos, evento/etapa, resumo mínimo e texto relevante. Remover telefone, e-mail, CPF/CNPJ, endereço, tokens Meta, dados de pagamento, anexos, mídia e credenciais.
- Criar decision-service no backend com segredo apenas de servidor, timeout, limites por cliente, fila, logs redigidos e auditoria. Frontend recebe só a decisão necessária.
- Jev sugere fila/prioridade, mas não publica/pausa campanha, altera verba, aprova reembolso/cobrança, libera acesso, encerra lead, envia WhatsApp ou aciona Meta/Asaas sem regra determinística e responsável.
- Para biblioteca de anúncios, revisar separadamente termos/permissões Meta e usar processamento multimodal aprovado antes de enviar atributos textuais ao Jev.

### Gaps
- Não foi verificado o conteúdo da página ZDR, medidas técnicas do Trust Center, subprocessadores atuais ou residência de dados fora dos EUA.
- Não foi verificada compatibilidade dos dados da Biblioteca de Anúncios Meta com envio a terceiro.
- A V2G ainda não tem política aprovada para retenção de conversas, consentimento de análise por IA, direitos de exclusão, rubricas ou limiares.
