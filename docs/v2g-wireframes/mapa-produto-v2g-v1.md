# Mapa de produto V2G — versão 2

> **Este documento descreve o destino do produto, não o backlog de desenvolvimento.** O corte executável atual é o v0 da seção 8. O restante só entra em priorização depois que esse teste for concluído e o cliente apontar o próximo problema. O design do app permanece congelado até a decisão explícita sobre modo design.

## 1. Estrutura principal

### Início

É a visão executiva do negócio. Reúne resultados, decisão mais importante, andamento das campanhas, criativo em destaque e atividade recente.

Não substitui as áreas detalhadas. Cada bloco leva diretamente ao recorte correspondente.

### Resultados

Mostra o que foi investido, o que retornou, oportunidades geradas e vendas informadas pelo cliente. Permite mudar período e abrir o detalhe por campanha.

O período escolhido pelo usuário altera os números exibidos. A leitura qualitativa da campanha, porém, sempre usa a janela canônica de 30 dias e não muda junto com o filtro.

### Campanhas

Reúne campanhas e criativos, mas preserva duas visões internas:

- Campanhas: status, canal, objetivo, orçamento, resultados, pausa e histórico.
- Criativos: biblioteca, upload, geração, análise, variações, aprovação e desempenho.

### Decisões

É a caixa de entrada acionável da operação. No destino, reúne aprovações, pedidos de material, recomendações, problemas de pagamento e mudanças sugeridas. Cada item tem uma ação principal clara. Problemas de pagamento ainda não podem alimentar essa área porque o pagamento atual é mock.

### Negócio

Guarda a memória operacional usada pela IA: empresa, oferta, público, regiões, diferenciais, ticket médio, margem ou capacidade, metas, canais, identidade visual e materiais.

### Conta

Guarda acesso e administração: perfil pessoal, usuários, segurança, assinatura V2G, recibos, preferências, notificações, tema, privacidade, suporte e cancelamento.

`Negócio` e `Conta` não devem ser a mesma página. Os dados podem estar na mesma base, mas representam trabalhos diferentes para o cliente.

## 2. Navegação

### Desktop

Barra lateral fixa:

1. Início
2. Resultados
3. Campanhas
4. Decisões
5. Negócio
6. Conta

O assistente fica acessível no canto inferior da área de trabalho. Pendências aparecem também como contador em Decisões.

### Mobile

Barra inferior com quatro destinos de uso frequente:

1. Início
2. Resultados
3. Campanhas
4. Decisões

Negócio, Conta, suporte e preferências ficam no menu do perfil. O assistente permanece acessível sem cobrir a navegação.

## 3. Mapa completo de telas

### Entrada e acesso

- Landing page
- Criar conta
- Confirmar e-mail por código
- Entrar
- Esqueci minha senha
- Inserir código de recuperação
- Definir nova senha
- Confirmação de acesso recuperado

### Preparação

- Boas-vindas e explicação do processo
- Dados pessoais e da empresa
- Diagnóstico do negócio
- Oferta e ticket médio
- Público e região
- Meta e objetivo da campanha
- Escolha dos canais
- Conexão Meta
- Conexão Google
- Verificação do WhatsApp Business
- Verificação do Instagram profissional
- Definição da verba
- Cartão da Meta
- Cobrança do Google Ads
- Assinatura V2G
- Upload de logo e fotos
- Pedido orientado das fotos que faltam — **destino; `fotos_pedidas[]` não existe hoje**
- Revisão do que a V2G entendeu
- Resumo final da preparação

### Operação

- Início antes da primeira campanha
- Início com campanha em aprendizado
- Início com campanha ativa
- Início com atenção necessária
- Resultados gerais
- Detalhe de resultado por campanha
- Registro diário de vendas
- Lista de campanhas
- Criar campanha
- Detalhe da campanha
- Biblioteca de criativos
- Upload de imagens
- Gerar criativo por IA — **fora do corte até a decisão sobre modo design**
- Analisar criativo existente — **cliente de integração pronto; sem tela e sem análise hoje**
- Comparar variações
- Revisar e aprovar criativo
- Solicitar alteração
- Configurar publicação
- Revisar campanha antes de publicar
- Confirmação de publicação
- Pausar ou retomar campanha — **destino; não existe rota hoje**
- Decisões pendentes
- Histórico de decisões
- Detalhe de uma decisão
- Histórico do que a IA executou — **destino; não existe registro que alimente a tela hoje**

### Negócio e administração

- Visão geral do negócio
- Empresa e contatos
- Oferta, preço e ticket médio
- Público, região e posicionamento
- Metas, capacidade e limites
- Canais conectados
- Identidade e biblioteca de materiais
- Perfil pessoal
- Usuários e acessos
- Assinatura e recibos
- Verba de mídia e formas de pagamento
- Preferências de avisos
- Aparência
- Segurança e senha
- Privacidade e exclusão de dados
- Pausar operação
- Cancelar assinatura
- Suporte

## 4. Estados obrigatórios

Todas as telas que dependem de dados devem prever:

- Primeira vez: explica o valor e oferece a primeira ação.
- Vazio legítimo: não há conteúdo porque nada ocorreu ainda.
- Carregando: informa o que está sendo buscado sem alterar a estrutura da página.
- Falha recuperável: preserva o que já foi carregado e permite tentar novamente.
- Falha que exige ação: explica quem resolve e oferece um único caminho principal.
- Sucesso: confirma a ação e mostra o próximo passo.
- Processando: geração, análise, conexão ou publicação em andamento.
- Atenção: há prazo ou impacto, mas a operação continua.
- Bloqueado: a próxima etapa depende de dado, pagamento, permissão ou aprovação.
- Concluído: registra o que foi feito, por quem e quando.
- Não medido: o resultado pode ter acontecido, mas a medição está ausente ou ainda não foi verificada. Nunca pode ser desenhado ou escrito como zero. Deve preservar a diferença entre `sem_medicao` e `medicao_nao_verificada`.

## 5. Estados principais do Início

Os nomes abaixo são estados de apresentação. Eles só podem ser ativados quando houver sinal real do backend. A correspondência inicial é:

| Estado da tela | Fonte necessária | Situação atual |
|---|---|---|
| Preparando | Estados de execução como `aguardando_fotos`, `decidindo_canal`, `estrutura_pronta` e equivalentes | Real, conforme o estado devolvido pela execução |
| Pronto para aprovar | Execução ou criativo em revisão, com ação de aprovação disponível | Parcial; a aprovação permanece com a operação na v1 |
| Publicando | Ciclo de publicação mais `status_na_plataforma` | **Não comprovado; ciclo deployado e nunca executado** |
| Em aprendizado | Campanha publicada, status da plataforma e janela inicial de dados | **Não comprovado enquanto a publicação não rodar** |
| Ativo | `status_na_plataforma` ativo e dados de campanha | **Não comprovado; hoje o sistema não sabe com segurança se está no ar** |
| Atenção necessária | Nível acionável da escada de 14 níveis ou bloqueio real da execução | Real somente para sinais já devolvidos pelo backend |
| Pausado ou encerrado | `status_na_plataforma` correspondente | **Não comprovado e sem rota de pausa/retomada** |

Até o ciclo de publicação rodar de ponta a ponta, “Publicando”, “Em aprendizado”, “Ativo” e “Pausado ou encerrado” são destino de produto, não estados disponíveis para o front assumir.

### Preparando

Foco no próximo passo, progresso das quatro etapas e pendências. Resultados aparecem como indisponíveis, com motivo claro.

### Pronto para aprovar

Foco no criativo e na campanha que aguardam revisão. O painel oferece aprovar ou solicitar alteração.

### Publicando

Foco no andamento técnico, previsão realista e itens que já foram concluídos.

### Em aprendizado

Mostra os primeiros dados com contexto e evita conclusões prematuras.

### Ativo

Foco em investimento, retorno, oportunidades, vendas, evolução, principal decisão e atividade recente.

### Atenção necessária

A decisão pendente ocupa o primeiro bloco: pagamento, ausência de material, aprovação, queda relevante ou limite de verba.

### Pausado ou encerrado

Explica o estado, preserva histórico e apresenta retomada quando disponível.

## 6. Assistente de IA

O assistente deve conhecer o contexto da tela e do negócio. Ele pode explicar métricas, responder dúvidas, localizar funções e preparar ações.

Ações com efeito financeiro ou operacional — publicar, pausar, alterar verba, aprovar uma peça ou mudar cobrança — sempre passam por uma confirmação explícita na interface principal. A conversa pode preparar a ação, mas não deve esconder sua consequência.

## 7. Separação entre interface e funcionalidade

| Item | Interface necessária | Funcionalidade necessária |
|---|---|---|
| Dashboard | Hierarquia, gráficos, filtros e resumos | Consolidar dados reais por período e campanha |
| Decisões | Caixa de entrada, detalhe e confirmação | Ler pendências, executar ação e registrar histórico |
| Upload | Área de envio, progresso e orientação | Validar, armazenar e associar arquivos à execução |
| Gerar criativo | Briefing, seleção e comparação | Geração, persistência e versionamento das imagens |
| Analisar criativo | Resultado visual e recomendações | Auditoria da peça e retorno estruturado |
| Aprovação | Comparação, comentário e confirmação | Aprovar, devolver para revisão e atualizar pipeline |
| Campanha | Lista, detalhe, status e controles | Criar, publicar, pausar, retomar e sincronizar canais |
| Resultados | Indicadores e explicações | Coletar, normalizar e consolidar Meta, Google e vendas |
| Pagamentos | Formulários, estados e recibos | Assinatura V2G, cartão Meta e cobrança Google separados |
| Assistente | Botão persistente e painel contextual | Contexto, respostas, permissões e execução confirmada |

## 8. Corte v0 — único escopo liberado para teste

O mapa completo permanece como norte. O teste atual usa somente estas sete passagens:

| Passo | Tela do mapa | Estado atual |
|---|---|---|
| 1. Entrar | Entrar | Existe em `/entrar` |
| 2. Onboarding | Preparação pelo fluxo atual | Existe em `/onboarding` e mais nove telas |
| 3–4. Subir e ir ao ar | Início em “Preparando” e “Publicando” | Parcial em `/inicio`; aprovações ficam com a operação na v1 |
| 5. Ver o dado | Resultados e detalhe por campanha | Em construção agora dentro de `/anuncios`; não interromper nem renomear durante o trabalho |
| 6. Criativo pronto presta? | Analisar criativo existente | Cliente de integração pronto; sem tela e sem análise |
| 7. Criativo novo | Gerar criativo por IA | Depende da decisão sobre modo design |

Três das sete passagens já existem. Todo o restante espera o cliente concluir o teste e apontar o próximo problema. Nenhum wireframe está liberado por este documento.

## 9. Tese de uso e gamificação

O usuário principal não é gestor de tráfego e pode ter pouca familiaridade digital. A experiência deve se comportar como uma sequência guiada de objetivos concretos, evitando exigir que ele aprenda a arquitetura interna da mídia paga.

A gamificação entra como orientação e sensação de progresso, não como pontos decorativos. Cada momento deve deixar evidente:

- onde o cliente está nas quatro etapas;
- qual é a única ação que move o trabalho agora;
- o que foi concluído e por quem;
- o que será desbloqueado em seguida;
- quando não há ação necessária.

No corte v0, isso pode existir apenas como progresso do onboarding e próximo passo no Início. Níveis, recompensas, sequências ou outras mecânicas permanecem fora do backlog até serem testados com clientes.

## 10. Contratos já decididos

### Meta e Google

Nunca somar moedas diferentes. Exibir um bloco independente por moeda. Métricas e cobranças que não forem equivalentes permanecem identificadas por plataforma.

### Estrutura de campanha

O backend trabalha com campanha mãe e duplicação de conjunto de anúncios. A interface inicial abstrai essa estrutura para o cliente e apresenta a campanha como unidade principal.

### Filtro de período e nível

O período escolhido altera os números do recorte. O nível qualitativo sempre vem dos 30 dias canônicos e não acompanha o filtro.

### Funcionalidades de destino ainda inexistentes

- Pausar ou retomar campanha: sem rota.
- Problemas de pagamento em Decisões: pagamento atual é mock.
- Pedido orientado de fotos: `fotos_pedidas[]` não existe.
- Histórico do que a IA executou: não há registro de origem.

Essas funções permanecem no mapa completo apenas como destino e não entram no corte v0.

## 11. Decisões realmente abertas

- Se `Negócio` aparece como item fixo da navegação ou dentro de Conta no desktop.
- Quais ações o assistente poderá efetivamente executar na primeira versão.
- Quais campos financeiros além de ticket médio serão obrigatórios para calcular retorno e orientar decisões.
- Modo design: sim ou não. Essa decisão bloqueia os passos 6 e 7 do corte v0.
