# Criativo recebido na fila do gestor — 10/10/2026

## 0. Provas pendentes

- Percorrer, com cliente e operador autenticados, envio da peça, tarefa aberta, decisão e tarefa encerrada. O Supabase QA usado para o checkout ainda não tem todos os campos que `/criativos` lê; este lote não afirma prova de interface ou integração completa.
- Conferir as Server Actions com duas solicitações simultâneas e falha de gravação da tarefa; o ensaio direto no banco QA não executa cookies, autenticação ou as telas. Não há garantia de envio de e-mail ou WhatsApp.
- Conferir na interface autenticada a atribuição posterior: assumir conta, absorver tarefas abertas sem responsável e recuperar manualmente uma tarefa se a atualização em lote falhar.
- Conferir na interface autenticada com dois operadores que um não cria nem prepara tarefas em uma conta atribuída ao outro. A trava foi adicionada no servidor e os formulários foram restringidos, mas este caminho ainda não foi percorrido em QA.
- Conferir na interface autenticada com dois operadores que a fila de peças exibe apenas contas atribuídas ao operador e que um envio direto à action não permite decidir peça de outra conta. A verificação no servidor foi adicionada, mas ainda não foi percorrida em QA com duas sessões.
- Código local: não publicado em QA ou produção. O conector Figma retornou limite de chamadas do plano Starter; o quadro não foi atualizado neste lote.

## O que foi implementado

- Quando `V2G_CREATIVE_REVIEW_ENABLED` e `V2G_MANAGER_WORK_ENABLED` estão ativos, uma peça que chega a `awaiting_review` tenta criar uma tarefa interna de revisão. O ID é derivado da solicitação, então o mesmo envio não cria segunda tarefa. Havendo gestor atribuído, a tarefa vai para ele; sem atribuição, fica visível como sem responsável.
- A repetição idêntica do envio tenta recuperar uma tarefa que não tenha sido criada após falha parcial. A peça permanece na fila própria mesmo se a tarefa auxiliar falhar.
- A decisão do operador encerra a tarefa interna quando ela existe. Uma verificação após a criação também resolve a corrida em que a decisão chegou antes da tarefa. Aprovação da peça continua significando apenas aptidão para publicação manual.
- Ao assumir uma conta, o gestor recebe as tarefas abertas ainda sem responsável. Se a atribuição das tarefas falhar depois de a conta ter sido assumida, a action informa o resultado parcial; o gestor dono da conta pode assumir cada tarefa remanescente na fila. Tarefas já atribuídas a outra pessoa não são transferidas automaticamente.
- A criação manual e a preparação das pendências agora exigem que o operador autenticado seja o responsável registrado pela conta. A lista de criação só oferece suas contas; a action repete a conferência no servidor para impedir envio forjado para conta de outro gestor.
- Com `V2G_MANAGER_WORK_ENABLED=true`, a fila de criativos consulta somente os negócios atribuídos ao gestor autenticado; o filtro por ID também exige essa atribuição. A action de decisão confere novamente a responsabilidade, pois uma requisição pode contornar a tela ou chegar após a troca de gestor. Contas ainda sem responsável devem ser assumidas na fila interna antes da revisão. Com a flag da mesa desligada, a revisão humana mantém o modelo anterior de operador da equipe para não tornar a fila inacessível durante a ativação gradual.
- A tarefa gerada por envio de criativo não pode mais ser concluída pelo formulário genérico de tarefas: a fila oferece um link direto para a peça, e a action bloqueia o fechamento manual mesmo se chamada diretamente. Somente uma decisão registrada na revisão encerra essa pendência. Outras tarefas continuam com conclusão manual e nota obrigatória.
- Nenhuma escrita na Meta, envio de aviso externo, reserva ou mudança de estado financeiro foi feita.

## Verificação local

- `pnpm conferir:revisao-criativos`: 5/5, incluindo ID estável e distinto por solicitação.
- `pnpm conferir:tarefas-gestor`: 4/4.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --env-file-if-exists=.env.local scripts/qa-tarefas-gestor.mjs`: passou no projeto QA nomeado. Com dados sintéticos, confirmou ID duplicado bloqueado, tarefa de revisão sem responsável atribuída depois ao gestor e encerramento após decisão. O script removeu as fixtures; isso verifica o contrato do banco, não o clique do cliente ou operador.
- `pnpm typecheck` e `pnpm build`: passaram sem servidor dev concorrente nas portas 3000/3001.
- Após restringir criação/preparação ao responsável, `pnpm conferir:tarefas-gestor` (4/4), `pnpm typecheck` e `pnpm build` passaram novamente sem dev concorrente. A prova de banco acima é anterior a esta restrição de interface/action.
- Após restringir a fila e a decisão de criativos ao gestor responsável, `pnpm conferir:revisao-criativos` (5/5), `pnpm typecheck` e `pnpm build` passaram novamente. A suíte de regras não executa autenticação nem a action; o ensaio com dois operadores permanece pendente.
- Após proteger o fechamento da tarefa de criativo, os conferidores de criativos (5/5) e tarefas (4/4), `pnpm typecheck` e `pnpm build` passaram novamente. O conferidor cobre a identidade da tarefa e rejeita identidade divergente; a action e a navegação autenticadas ainda precisam de prova em QA.
- Revisei as duas flags separadas e corrigi a compatibilidade: se apenas `V2G_CREATIVE_REVIEW_ENABLED` estiver ativa, a fila de revisão continua operável pela equipe; o isolamento por gestor passa a valer junto com `V2G_MANAGER_WORK_ENABLED`. `pnpm conferir:revisao-criativos` (5/5), `pnpm typecheck` e `pnpm build` passaram após o ajuste; o percurso autenticado com cada combinação de flags continua pendente.
- A suíte completa `pnpm conferir` foi executada em 10/10 e parou em `conferir:migrations`: 27 objetos antigos/pendentes aparecem ausentes no schema consultado, incluindo RPCs das migrations 0030–0033 e o módulo RevOps. O projeto não está linkado para reconciliar o ledger. Isso não é falha atribuída às mudanças de criativos, e as etapas posteriores da suíte não rodaram nesta tentativa. Não foi aplicada migration.
- `git diff --check`: passou; apenas avisos LF/CRLF do checkout Windows. O build e os testes puros não provam execução autenticada das Server Actions.
