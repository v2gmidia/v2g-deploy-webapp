# Primeiro deployment HTTPS do WebApp QA — 09/10/2026

## Resultado

- O projeto Vercel isolado `v2g-webapp-qa` (`prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`) recebeu seu primeiro deployment **Production dentro do projeto de QA**: `dpl_4TK95pcHGpbXch3jjGpRGrAYBiUy`.
- Fonte exata: commit remoto `d892e115518802c2cc9e490e9a42087935a8e16c` de `v2gmidia/v2g-deploy-webapp`. A publicação foi criada pela API da Vercel a partir desse commit; a pasta local, seus arquivos `.env*` e as mudanças que estavam sem commit no início do bloco não foram enviados.
- A compilação da Vercel terminou em **READY** e o domínio `https://v2g-webapp-qa.vercel.app` foi atribuído. O navegador abriu `/entrar` e mostrou o formulário V2G.
- `/contratar` respondeu 404. Isso corresponde ao guard de `app/contratar/page.tsx` com `V2G_CHECKOUT_QA_DEPLOY_ENABLED` ainda desligada; **checkout e webhook não foram ensaiados nesta publicação**.
- Após a visita à tela de entrada, a consulta de logs de runtime com níveis `error` e `fatal` nos dez minutos anteriores não retornou registros. Isso não prova ausência de erros em outros fluxos.
- O painel ainda oferece **Connect Git**. Este deployment pontual não configurou publicação automática em futuros commits.

## Atualização para o commit seguinte

Durante a primeira compilação, `main` avançou para `88ae8678a235a40ee6b413e27e6fe7fa5ee8e668` com correções do retorno de autenticação e retomada da marca. O mesmo projeto QA recebeu um segundo deployment pontual, `dpl_AnH8ExsHwPyMspbHRTBYJ7rxV16p`, também **READY**. Este é o deployment atualmente associado a `https://v2g-webapp-qa.vercel.app`; a tela `/entrar` continuou visível após atualizar o navegador.

No deployment final, `/contratar` continuou retornando 404, conforme esperado enquanto a trava específica do checkout permanece fechada.

Antes dessa atualização, `corepack pnpm typecheck`, `conferir:acesso` (5 testes) e `conferir:onboarding-preservacao` (33 testes) passaram no conteúdo que depois entrou no commit. A compilação da Vercel passou para o SHA exato. A consulta de logs `error` e `fatal` deste segundo deployment após abrir a tela de entrada não retornou registros. Nenhuma dessas verificações percorreu envio real de e-mail ou login autenticado.

## Limites e próxima etapa

Os nomes das variáveis de Supabase QA e Asaas Sandbox foram conferidos no projeto Vercel, sem acessar valores. Um build pronto e a tela de entrada visível não comprovam login, entrega de e-mail, compra, webhook, assinatura nem NFS-e. A próxima etapa é testar confirmação e recuperação de senha em caixa autorizada e preparar o webhook de Sandbox para percorrer o checkout em HTTPS. A liberação do checkout requer verificar novamente as variáveis de QA e ativar sua trava específica.

Nenhuma migration, cobrança, commit ou push foi executado neste bloco.
