# Fila interna do gestor — QA de 09/10/2026

## O que entrou no código local

- `/gestor/tarefas` é uma tela interna, protegida por `app_metadata.papel=operador` e pela flag `V2G_MANAGER_WORK_ENABLED`. Ela mostra tarefas abertas, minhas tarefas, sem responsável e concluídas; permite procurar por negócio ou título, assumir a responsabilidade por uma conta, criar tarefa com prazo e concluir com registro obrigatório do que foi feito.
- `/gestor` mostra o responsável registrado e a quantidade de tarefas abertas de cada negócio quando a fila está ativa. Os dados vêm de `manager_accounts` e `manager_tasks`, sem inferir reunião marcada, pagamento, contrato ou anúncio veiculado. Falha de consulta produz aviso, não zero como fato.
- As actions checam novamente a identidade de operador no servidor. Criação usa UUID para repetir o mesmo pedido sem duplicar; a repetição só é aceita se tipo, título, descrição, prazo, negócio e criador coincidirem. Conclusão exige tarefa aberta atribuída ao operador e uma nota de pelo menos cinco caracteres. Atribuição de conta não substitui um responsável existente de forma silenciosa.
- Migration local: `supabase/migrations/20261009042000_gestor_responsaveis_tarefas.sql`. Ambas as tabelas têm RLS ativo e nenhum acesso direto de `anon` ou `authenticated`; o servidor usa `service_role` após conferir o papel assinado. A flag está apenas no `.env.local` apontado ao QA, fora do Git.

## Evidência de QA

- O ledger do projeto `v2g-webapp-qa` (`zskpijnqgkqwxksqmzmf`) foi conferido antes de aplicar **somente** essa migration pelo conector, registrada como `qa_gestor_responsaveis_tarefas`. O banco real não foi alterado. O QA de checkout tem schema mínimo de `businesses`; foi adicionado `dados_ficticios` **apenas nesse QA** como `qa_businesses_dados_ficticios_for_manager_ui`, pois a coluna já existe no schema real. Não rodar `db:migrate` cegamente para reproduzir.
- `scripts/qa-tarefas-gestor.mjs` criou dois usuários sintéticos e um negócio fictício no QA. Confirmou que uma conta não recebe duas atribuições, o ID de tarefa duplicado é recusado, anônimo e cliente não leem nem escrevem nas tabelas, conclusão sem nota falha, conclusão válida funciona e repetição não afeta tarefa concluída. O script removeu as fixtures; consulta posterior retornou zero negócio, tarefa e atribuição de QA.
- `conferir:tarefas-gestor` passou 2/2; o conferidor anterior da carteira passou 15/15 com o resolvedor de imports do repositório. `pnpm typecheck` e `pnpm build` passaram com servidor dev parado. Depois do build, o dev voltou a responder. A rota `/gestor/tarefas` sem sessão redirecionou para `/entrar?next=%2Fgestor%2Ftarefas`.
- No navegador local, um operador sintético do QA entrou pela tela `/entrar` e abriu `/gestor/tarefas`. A criação de tarefa mostrou 1 aberta e o título correto; assumir a conta mudou a contagem de responsáveis de 0 para 1; concluir com nota mudou abertas de 1 para 0; o filtro “Concluídas” mostrou a nota gravada. O logout voltou a `/entrar`. `scripts/qa-gestor-ui-fixture.mjs` e `scripts/qa-gestor-ui-cleanup.mjs` criaram/removeram somente esta fixture sintética. `/gestor` completo mostrou “Carteira indisponível” nesse QA mínimo, sem converter erro em zero.

## Limites

- A interface de `/gestor/tarefas` e suas três actions foram exercitadas com operador sintético, mas falta uma sessão de operador real e a carteira `/gestor` completa. O QA mínimo não tem todas as colunas e tabelas necessárias à carteira. Os testes não provam campanha na Meta ou desempenho.
- A fila é manual: não cria tarefas automaticamente ao pagar, concluir onboarding, reservar reunião ou enviar criativo. Não envia notificações. Transferência de carteira entre gestores e escala além de 1.000 registros precisam de desenho e testes próprios.

## Continuação local: filtro da carteira

- `/gestor` oferece “Minhas contas” quando a fila interna está ativa. O filtro usa apenas as atribuições registradas para o operador autenticado. Se a consulta de responsáveis falhar ou chegar ao limite de 1.000 linhas, a tela não mostra uma lista incompleta como se fosse toda a carteira do operador.
- O teste da regra de filtro passou com duas contas e atribuição de apenas uma. `pnpm typecheck` e `pnpm build` passaram, sem servidor dev na porta 3000. O conferidor da carteira passou 15/15 ao usar o resolvedor de imports do repositório.
- Este filtro ainda não foi percorrido na interface autenticada da carteira: o QA mínimo continua sem o schema completo exigido por `/gestor`. Não extrapolar a verificação da tela de tarefas para esta tela.

## Continuação local: tarefas da conta selecionada

- O link “Tarefas da conta” da carteira abria `/gestor/tarefas?negocio=<id>`, mas o parâmetro só preenchia o formulário de criação: a fila ainda misturava tarefas de todos os negócios. A tela agora valida a conta solicitada, consulta tarefas e atribuição dessa conta no banco, mantém o filtro ao buscar e oferece retorno para a fila inteira. Um ID ausente da consulta não abre uma lista global silenciosamente.
- O ensaio no Supabase QA criou duas contas e tarefas distintas, confirmou que a consulta da primeira não trouxe a tarefa nem a atribuição da segunda, e verificou a limpeza das fixtures. `pnpm typecheck`, `pnpm conferir:tarefas-gestor` (3/3) e `pnpm build` passaram com o servidor dev parado.
- A rota filtrada ainda não foi percorrida em navegador autenticado nesta continuação. O QA de banco e o build não provam a apresentação da interface.

## Continuação local: prioridade antes do limite

- A fila aplicava `limit(1000)` aos registros mais recentes e só depois filtrava abertas, minhas, sem responsável ou concluídas. Uma tarefa aberta antiga podia desaparecer atrás de tarefas concluídas mais novas. A consulta agora aplica o estado e a atribuição no banco antes do limite; pendências são lidas das mais antigas e o histórico das conclusões mais recentes. O total exato sinaliza recorte parcial, e o total de abertas é consultado separadamente para não virar zero ao olhar concluídas.
- No Supabase QA, o ensaio criou uma tarefa aberta antiga e 101 concluídas posteriores. Com limite de 100, a consulta anterior não trouxe a aberta; a nova trouxe. Os filtros “minhas”, “sem responsável” e “concluídas” retornaram contagens coerentes, inclusive o aviso de recorte de 100 entre 101 concluídas. A limpeza das fixtures foi conferida pelo script.
- `pnpm typecheck`, `pnpm conferir:tarefas-gestor` (4/4), `pnpm build` sem servidor dev na porta 3000 e `git diff --check` passaram. Ainda falta validar esta apresentação no navegador com sessão autenticada e volume representativo; a consulta parcial é avisada, não paginada.
