# Handoff V2G para Claude Code

Este material orienta a implementação dos wireframes da V2G no repositório real do WebApp. O mapa completo descreve um destino de produto, não uma lista de tarefas a implementar de uma vez.

## Qual Claude usar

Use **Claude Code** dentro do repositório, com o **Claude Opus mais recente disponível**. Em setembro de 2026, a documentação da Anthropic lista o **Claude Opus 5** como ativo. No terminal, o alias `opus` escolhe o Opus atual disponível para a conta.

O plano Claude Max é a assinatura e não significa, por si só, “raciocínio máximo”. O Claude Code oferece uma configuração separada de esforço. Use **máximo** para a auditoria inicial, decisões de arquitetura e revisão final. Nas etapas repetitivas, esforço alto costuma ser suficiente.

Configuração recomendada:

- auditoria e plano: Opus 5, esforço máximo, modo de planejamento;
- fundação visual e primeira tela completa: Opus 5, esforço máximo;
- implantação das demais fatias: Opus 5, esforço alto; Sonnet 5 é aceitável apenas se houver necessidade de economizar limite;
- revisão final: Opus 5, esforço máximo.

## Como colocar o material no repositório

1. Descompacte `V2G-HANDOFF-CORE.zip`.
2. Copie a pasta `docs/v2g-wireframes` para a raiz do repositório do WebApp.
3. Não substitua arquivos existentes do produto. Esse diretório é somente uma referência de implementação.
4. Abra o Claude Code na raiz do repositório.
5. Se estiver no terminal, execute:

   ```text
   claude --model opus --effort max --permission-mode plan
   ```

6. Dentro do Claude Code, use `/model` para confirmar que está no Opus mais recente e `/status` para confirmar a conta e o modelo.
7. Envie o Prompt 1 de `PROMPTS-CLAUDE.md`. Ele pede somente auditoria e planejamento.
8. Leia o plano criado pelo Claude antes de autorizar mudanças no código.

Se você usa o Claude Code na nuvem, anexe o ZIP ao projeto ou copie `docs/v2g-wireframes` para o repositório conectado. Se a interface permitir escolher modelo e esforço, selecione Opus 5 e esforço máximo na primeira etapa.

## Ordem de execução

### Etapa 1 — auditoria, sem alterar código

O Claude deve entender:

- framework, rotas, componentes e temas existentes;
- integrações e contratos reais do backend;
- quais telas atuais serão preservadas, adaptadas ou substituídas;
- quais funções dos wireframes ainda não existem no backend;
- quais componentes visuais podem ser compartilhados;
- como dividir a implementação em mudanças pequenas e verificáveis.

Saída esperada: `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md`.

### Etapa 2 — fundação visual e navegação

Implemente primeiro os tokens de cor, tipografia, espaçamento e estados, além da estrutura de navegação responsiva. Preserve rotas e integrações já existentes. Evite refatorações gerais sem relação com as telas.

Saída esperada:

- tema claro fiel aos wireframes;
- base compatível com tema escuro futuro;
- navegação lateral no desktop e navegação adequada no mobile;
- componentes comuns para métricas, estados, decisões e ações;
- validação de lint, tipos e build.

### Etapa 3 — resultados

Implemente como uma única fatia funcional:

- dashboard com dados suficientes;
- detalhe por campanha;
- primeiros dados;
- estado “resultado ainda não medido”;
- carregamento;
- falha de atualização.

Regras obrigatórias:

- “não medido” nunca pode aparecer como zero;
- moedas de Meta e Google nunca são somadas;
- o filtro de período muda os números exibidos, mas o nível qualitativo continua vindo dos 30 dias canônicos;
- o front não inventa valores quando o backend não fornece dados;
- a campanha mãe abstrai a duplicação técnica dos conjuntos de anúncio.

### Etapa 4 — criativos

Implemente:

- análise de criativo existente;
- configuração de um novo criativo;
- geração em andamento e falha;
- escolha de variação;
- revisão e aprovação.

Nesta versão, criativos são imagens. Não invente geração de vídeo nem endpoints que não existam.

### Etapa 5 — publicação e decisões

Implemente:

- publicação em análise;
- reprovação pela Meta;
- falha técnica de publicação;
- decisão sobre fadiga do criativo;
- nenhuma decisão pendente.

O produto deve diferenciar uma reprovação da plataforma de uma falha técnica da V2G.

### Etapa 6 — vendas

Implemente o registro diário e o estado de resposta guardada. Conversas medidas pela plataforma e vendas confirmadas pelo cliente são informações distintas.

### Etapa 7 — pausa, somente quando houver suporte real

Os wireframes incluem confirmação e campanha pausada, mas a rota de pausar/retomar não existia no diagnóstico original. O Claude deve confirmar o backend atual antes de habilitar qualquer mutação. Enquanto não houver contrato real, a interface deve permanecer desabilitada ou protegida por uma condição explícita, sem simular sucesso.

## Como usar os dois pacotes

### `V2G-HANDOFF-CORE.zip`

Use desde o início. Contém os documentos e os 12 pares desktop/mobile do fluxo essencial.

### `V2G-HANDOFF-ESTADOS.zip`

Adicione depois de a fundação e a primeira fatia estarem aprovadas. Contém estados complementares de carregamento, falha, pausa, rejeição, ausência de decisões e confirmação de vendas.

## Ritmo recomendado

Não peça “faça tudo” em um único prompt. Execute uma etapa por vez. Para cada etapa:

1. informe os arquivos de imagem relevantes;
2. peça ao Claude para localizar o código real antes de editar;
3. peça a implementação da fatia completa, incluindo desktop e mobile;
4. exija lint, checagem de tipos e build;
5. peça capturas nas larguras 390 px e 1440 px;
6. compare visualmente com os wireframes;
7. corrija a fatia antes de seguir;
8. salve a mudança em um commit separado, se o fluxo do repositório usar commits.

## Limites de implementação

Os seguintes itens estavam ausentes ou incompletos no diagnóstico original e precisam ser confirmados no código atual:

- rota real de pausar e retomar campanha;
- pagamento real;
- campo `fotos_pedidas[]` para pedido orientado de materiais;
- histórico persistido do que a IA executou;
- ciclo real que popula `status_na_plataforma`.

O Claude pode preparar componentes, estados visuais e pontos de integração, mas não deve fabricar endpoints, respostas de sucesso ou dados de produção.

## Critérios de conclusão de cada fatia

- desktop e mobile mantêm a mesma prioridade de informação;
- navegação por teclado e foco visível funcionam;
- alvos de toque são adequados;
- carregamento, vazio, não medido, falha e sucesso são distintos;
- linguagem permanece simples para o dono do negócio;
- uma única ação domina quando há uma decisão necessária;
- verde-limão sinaliza ação, progresso ou mudança e não vira decoração;
- nenhum dado financeiro combina moedas diferentes;
- nenhuma mutação importante aparenta sucesso sem confirmação do backend;
- lint, tipos e build passam.

## O que não enviar ao mesmo tempo

Não envie as 46 imagens e uma ordem genérica para implementar o app inteiro. Não misture tema claro, tema escuro, landing page, autenticação e todas as telas internas na mesma tarefa. Não peça ao Claude para redesenhar o backend durante a implementação visual.
