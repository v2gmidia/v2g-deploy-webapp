# Reunião de integração do Cauã — roteiro em construção

**Responsáveis:** Victor apresenta; Cauã acompanha e registra dúvidas.  
**Uso deste documento:** fonte para o futuro PDF da reunião.  
**Estado:** blocos 1 a 4 preparados para navegação. O [PDF da reunião de 05/11/2026](../output/pdf/reuniao-caua-05-11-2026.pdf) contém a condução e os cliques; o [PDF de metas do Cauã](../output/pdf/metas-semana-caua-05-11-2026.pdf) contém a rotina e as entregas semanais. As decisões da call serão registradas depois.

## Bloco 1 — Apresentação do aplicativo (15 minutos)

**Objetivo:** Cauã entender a jornada do cliente antes de assumir a rotina da mesa do gestor. Mostrar as telas na ordem abaixo e distinguir o que já funciona do que ainda precisa de prova no ambiente publicado.

| Tempo | Tela | Fala de Victor |
| --- | --- | --- |
| 2 min | Landing page | “Aqui o cliente entende a oferta e inicia a conversa ou a contratação.” |
| 2 min | Primeiro acesso | “Depois da compra confirmada, ele cria a conta e entra no negócio certo.” |
| 3 min | Onboarding | “Aqui reunimos o contexto, as contas e a identidade visual para preparar o trabalho.” |
| 2 min | Início | “O cliente vê onde está na jornada e qual é o próximo passo.” |
| 2 min | Criativos | “Ele envia materiais, guarda as peças e acompanha o que está sendo preparado.” |
| 2 min | Anúncios | “Esta deve ser a visão das campanhas e dos resultados da conta dele. A leitura nova ainda precisa ser validada no QA.” |
| 2 min | Avisos e Conta | “Aqui ficam as atualizações da operação, os dados do negócio e as conexões.” |

**Imagens para o PDF:** uma captura real por tela, com ambiente e data identificados. Números demonstrativos não devem ser apresentados como resultados medidos. A escolha das capturas fica para a montagem do PDF.

**Transição para o próximo bloco:** depois da visão do cliente, abrir a mesa do gestor e mostrar o que Cauã fará no dia a dia.

## Bloco 2 — Mesa do gestor (10 minutos)

**Objetivo:** Cauã localizar a V2G na carteira, reconhecer a próxima ação, abrir o contexto deixado pelo cliente e distinguir o que depende de confirmação externa.

**Para navegar agora:** [mesa real no localhost](http://localhost:3000/supergestor) usa a mesma página do aplicativo e pede login de operador. O conteúdo depende dos dados acessíveis na configuração local. [Prévia demonstrativa](http://localhost:3000/exemplo/mesa-gestor) abre sem login, usa dados fictícios e tem um desenho diferente da carteira atual. Na reunião, apresentar a mesa real com o acesso próprio do Cauã no QA; não compartilhar o login do cliente.

| Tempo | Ação na mesa real | O que Victor explica / Cauã confere |
| --- | --- | --- |
| 1 min | Abrir **Carteira de negócios** e os quatro números do topo | “Esta é sua fila de trabalho. As contagens vêm das fontes disponíveis; aviso de leitura parcial exige conferência na tela específica.” |
| 1 min | Abrir **Minhas próximas ações**, se aparecer | “Aqui ficam peças aguardando decisão e tarefas das contas atribuídas a você. Se estiver vazio, não significa que todos os clientes estejam resolvidos.” |
| 2 min | Buscar **V2G** em **Próxima ação por negócio** e usar **Minhas contas**, se disponível | “Vamos trabalhar um negócio por vez. Veja a ação indicada, o responsável, pendências de cadastro, execuções e a última leitura registrada.” |
| 2 min | Expandir **Preparar conversa com o cliente** e abrir **Abrir ficha** | “Estas são as respostas do onboarding e os pontos para confirmar na reunião. Diferencie o que o cliente declarou do que a equipe já verificou.” |
| 1 min | Abrir **Ver materiais de marca** e **Ver contas de anúncios**, se houver | “Confira logo, materiais e IDs da conta antes de preparar uma peça. Conta listada aqui não prova anúncio ativo nem acesso à Meta.” |
| 2 min | Percorrer **Criativos da conta**, **Tarefas da conta**, **Ver campanha** e **Ver números**, apenas quando os links estiverem disponíveis | “Peça recebida, tarefa, campanha e resultados têm estados separados. Em números, confira fonte e período; não apresente a carteira como métrica ao vivo.” |
| 1 min | Voltar à carteira e registrar a próxima ação da V2G | Cauã diz em voz alta **o que fará**, **qual prova falta** e **quem precisa agir**. Victor confirma o combinado. |

**Aceite desta parte da reunião:** Cauã encontra a V2G com seu próprio acesso de operador, abre a ficha e identifica a próxima ação sem confundir cadastro, reunião, publicação e resultado medido. Se algum link não aparecer, registrar qual e por quê antes de concluir a demonstração.

**Imagens para o PDF:** captura da carteira, da linha da V2G, da ficha e das filas que estiverem disponíveis, com data e ambiente. Ocultar dados de outros clientes no material compartilhável.

## Bloco 3 — Meta e passagem da conta ao gestor (10 minutos)

**Objetivo:** Cauã saber localizar a conta de anúncios da V2G, conferir quais ativos e tarefas recebeu e explicar como repetirá o processo com o primeiro cliente. Nesta parte, apenas navegar e anotar; não alterar permissões nem publicar campanhas durante a apresentação.

| Tempo | Demonstração | O que confirmar com Cauã |
| --- | --- | --- |
| 2 min | Abrir o portfólio empresarial V2G na Meta e localizar a conta de anúncios, Página e Instagram usados no anúncio | Nomes, IDs, proprietários e conta correta. Um perfil pessoal ou a Página isolada não substitui o inventário dos ativos. |
| 2 min | Conferir o acesso de Cauã aos ativos necessários e a tarefa concedida em cada um | Ele deve conseguir operar com a própria identidade. Se faltar um ativo ou tarefa, registrar a pendência e o responsável; não compartilhar senha, código ou token. |
| 2 min | Abrir no WebApp o negócio V2G, sua conta vinculada e a ficha | Conferir se `business_id`, conta de anúncios e responsável correspondem ao inventário da Meta. A atribuição na mesa e a permissão na Meta são conferências diferentes. |
| 2 min | Mostrar a passagem de um cliente novo: cliente adiciona a V2G como parceira e compartilha somente os ativos necessários | Primeiro provar acesso manual; depois, em provas separadas, leitura pela API, publicação autorizada e números no app. Cliente não precisa de papel no Meta for Developers. |
| 2 min | Voltar à carteira e preencher verbalmente a ficha mínima de passagem da V2G ou de um piloto identificado | Cauã informa o que já confirmou, a fonte, o que falta, quem resolve e a próxima ação. Não completar campos por suposição. |

**Aceite desta parte da reunião:** Cauã aponta a conta de anúncios e os ativos corretos da V2G, distingue seu acesso de gestor do vínculo do negócio no WebApp e consegue explicar a sequência de recebimento de um cliente. Qualquer permissão nova será decidida e executada em um bloco próprio.

**Fonte operacional para a demonstração:** [Recebimento de cliente na Meta](recebimento-cliente-meta.md), seção “Roteiro do gestor — um piloto antes dos outros sete”. A ficha ali é um modelo; seus lugares vazios não representam clientes já migrados.

**Imagens para o PDF:** visão dos ativos e permissões na Meta e da conta correspondente no WebApp, com IDs conferidos. Ocultar identificadores de outros clientes e não capturar segredos.

## Bloco 4 — GitHub e teste local na máquina do Cauã (15 minutos)

**Objetivo:** Cauã saber encontrar o código, abrir a mesa localmente e devolver um problema que a equipe consiga reproduzir. GitHub é apoio ao teste; a operação de clientes continua pelo acesso próprio dele no WebApp e na Meta.

| Tempo | Ação guiada | Resultado a conferir |
| --- | --- | --- |
| 3 min | Cauã entra no GitHub com sua conta e confirma acesso ao repositório WebApp concedido para esta função | Ele consegue ler o código e localizar `AGENTS.md`, sem usar a conta de Victor. Acesso de escrita é uma decisão separada. |
| 4 min | Clonar o WebApp e abrir a pasta na máquina dele | A cópia local aparece no editor; Victor aponta `app/(supergestor)`, `app/(protected)/gestor` e `docs/`. Não misturar esta cópia com o app publicado. |
| 5 min | Instalar dependências, preparar configuração local própria e rodar `pnpm dev` | A mesa abre no localhost com login de operador. Credenciais e variáveis privadas são configuradas por canal seguro, com escopo mínimo; não copiar `.env` ou senha de Victor. Se a configuração ainda não existir, marcar o teste como pendente, sem improvisar valores. |
| 3 min | Abrir uma tela, reproduzir um problema e registrar o relato | Cauã informa URL/tela, ambiente, passos, resultado esperado, resultado visto e imagem sem dados sensíveis. Victor confirma quem corrige e como será testado. |

**Aceite desta parte da reunião:** Cauã consegue encontrar o repositório e explicar o caminho para rodar a mesa e relatar um defeito. “Localhost abriu” não comprova que QA ou produção foram atualizados. Se instalação/configuração levar mais tempo, registrar a pendência e concluir o teste em sessão técnica própria.

**Imagens para o PDF:** visão das pastas relevantes, mesa no localhost e exemplo de relato de defeito. Nenhuma imagem deve mostrar senhas, chaves, tokens ou dados de outros clientes.

## Próximos blocos

A definir com Victor nesta conversa, em sequência. Não tratar rascunhos ou ideias como decisões fechadas.
