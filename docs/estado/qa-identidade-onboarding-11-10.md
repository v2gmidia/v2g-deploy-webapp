# Identidade e primeiro passo do onboarding — 11/10/2026

## Implementado localmente

- Primeiro acesso e redefinição mostram os cinco critérios de senha: 15 caracteres, maiúscula, minúscula, número e caractere especial. A mesma regra é conferida no servidor para senhas novas; login de contas já criadas não foi alterado.
- O seletor de negócios usa a identidade editorial clara, a marca V2G mídia e uma ação secundária discreta para adicionar outro negócio. O seletor continua vinculado às contas liberadas da sessão.
- O HTML versionado do e-mail está em `supabase/templates/confirmation.html`. Preserva o link por `RedirectTo`/`TokenHash` que a rota `/auth/confirmar` aceita; a imagem PNG da marca é servida pela LP pública.

## Verificado

- `conferir:senha`: 5/5; `pnpm typecheck`: passou; `pnpm build` com o servidor de desenvolvimento parado: passou.
- No navegador local, a tela de cadastro mostra os cinco critérios; o seletor autenticado mostrou os dois negócios fictícios com a nova identidade. A seleção do primeiro levou ao `/inicio` correspondente.
- O modelo “Confirm sign up” foi atualizado **somente** no projeto Supabase de QA `zskpijnqgkqwxksqmzmf`. O painel mostrou a prévia com apenas o novo conteúdo, o link com variáveis preservadas e a edição persistida após recarga. A imagem externa não carregou dentro da prévia isolada do painel; o PNG público respondeu 200 e abriu no navegador. Ainda falta observar uma mensagem recém-enviada no Gmail antes de afirmar renderização final.

## Falha encontrada no ensaio de isolamento

Ao clicar “Bora começar” para a empresa fictícia 1 no `localhost:3000` conectado ao QA, a interface exibiu falha de gravação e orientou recarregar. O log do servidor indicou que a função `public.mesclar_blocos_onboarding(p_business_id, p_patch)` não existe no schema cache. Consulta somente leitura ao catálogo de funções do projeto QA confirmou ausência de `mesclar_blocos_onboarding` **e** `confirmar_campo_do_cliente`. O ledger de QA contém `qa_0001`–`qa_0003` e migrations comerciais seletivas, mas não as migrations do onboarding (`0015`–`0032`). Também não existem `identidade_visual`, `narrativa_negocio`, `procedencia_do_campo` e `registrar_procedencia`, dependências da função de confirmação de campos. Logo, aplicar apenas `0031`/`0032` não fecharia o percurso. Leitura das duas fixtures mostrou `onboarding.respostas.inicio = null` em ambas após a falha. Não houve segunda tentativa pelo formulário. Antes de qualquer aplicação, é preciso reconciliar dependências e o ledger do QA; não usar `pnpm db:migrate` às cegas nem alterar produção.

Para testar o **lado da leitura** sem fingir que a gravação do WebApp funciona, apenas as duas linhas `dados_ficticios = true` vinculadas aos pedidos `qa-auth-victor-0910-1` e `-2`, que estavam com `onboarding = {}`, receberam diretamente no QA as respostas sintéticas `inicio` e `nome`. A alteração foi condicionada a esses IDs e ao JSON vazio; retornou exatamente duas linhas. Na interface local autenticada, a primeira empresa mostrou seu próprio nome como resposta, a segunda mostrou outro nome, e a recarga preservou o nome da segunda. Isso prova seleção e leitura isolada dessas duas respostas de fixture. **Não prova gravação pelo formulário, edição, concorrência nem continuação do onboarding.**

## HTTPS de QA

`https://v2g-webapp-qa.vercel.app/entrar?modo=cadastro` ainda mostrou o formulário antigo de senha única e mínimo de seis caracteres em 11/10. O projeto Vercel `v2g-webapp-qa` apontava para o último deployment `88ae8678` de 09/10 às 20:36 UTC, anterior ao `HEAD` local `29df25b` de 11/10. O push recente não atualizou esse projeto de QA. Nenhum deploy foi feito nesta rodada.

Os dois pedidos `payment_approved` ligados às empresas `QA Auth Victor Empresa 1/2 — FICTÍCIA` continuam sendo fixtures de acesso, não pagamentos do Asaas. Nada foi cobrado, assinado, emitido ou publicado neste ensaio.
