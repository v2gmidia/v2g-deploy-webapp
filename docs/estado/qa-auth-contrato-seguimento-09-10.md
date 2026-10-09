# QA de Auth e contrato: seguimento — 09/10/2026

## Estado conferido nesta sessão

- No Supabase **de QA** `zskpijnqgkqwxksqmzmf`, o SMTP customizado aparece ativado, com `smtp.resend.com`, porta 465 e remetente V2G. A senha está oculta no painel e não foi lida. Isto confirma configuração salva, **não entrega de e-mail**.
- Os modelos **Confirm sign up** e **Reset password** foram instalados no Auth do Supabase QA a partir de `docs/auth-email/confirmar.html` e `docs/auth-email/recuperar.html`. Os assuntos e o conteúdo V2G persistiram após recarregar o painel. Não foi enviado e-mail real de teste.
- No projeto Vercel isolado `v2g-webapp-qa`, o painel/API mostram `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ANON_KEY` cadastradas, sem leitura dos valores. `NEXT_PUBLIC_SUPABASE_ANON_KEY` **não aparece**; é o nome consumido por `lib/supabase/client.ts`, `lib/supabase/server.ts` e `proxy.ts`. A chave anon/publishable precisa entrar nesse nome como configuração pública do projeto QA. A service role continua exclusivamente no servidor.
- A lista do projeto Vercel QA retornou **zero deployments**. Por isso o aviso “No production deployments found; create one to apply these changes” refere-se à ausência do primeiro deployment; alterar variável não publica uma versão. Nenhum deployment foi criado nesta sessão.
- O DOCX recebido em `Downloads` tem o mesmo hash do DOCX em `docs/`. O verificador local `scripts/validar-contrato-docx.py` passou: arquivo ZIP/XML íntegro e 15 marcadores de decisão pendente. Isto **não** verifica aprovação jurídica nem quebras de página.

## Contradição contratual que impede assinatura

Victor havia informado aprovação do advogado, mas o pacote recebido identifica a versão `minuta-interna-2026-10-09-v1` como **minuta interna para revisão jurídica** e `docs/estado/minuta-contrato-09-10.md` diz expressamente que ela **não foi aprovada por advogado**. Até identificar um arquivo e uma versão expressamente aprovados, não enviar este DOCX para assinatura nem usar seu texto para contrato automático.

## Próximo passo verificável

1. Cadastrar no projeto Vercel **de QA**, target Production, `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a chave anon/publicável do **Supabase QA**. `SUPABASE_ANON_KEY` pode permanecer temporariamente, mas o código atual não a consome para o navegador.
2. Revisar o diff misto antes de qualquer primeiro deployment. O repositório não foi commitado, empurrado nem publicado nesta sessão.
3. Depois de existir deployment HTTPS estável de QA, testar confirmação de cadastro e recuperação com uma caixa autorizada. A tela do Supabase e os templates salvos, por si, não provam entrega.
4. Identificar o contrato juridicamente aprovado ou obter revisão expressa desta minuta; decidir as 15 pendências antes de integrar assinatura.
