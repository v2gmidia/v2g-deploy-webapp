# Publicação HTTPS do QA — 11/10/2026

## 0. Pendente

- Percorrer `e-mail → login → escolher negócio → onboarding` no endereço HTTPS com a sessão de Victor. A rota protegida redirecionou para `/entrar?next=%2Fescolher-negocio` sem sessão; nenhuma senha foi usada pelo agente. Depois do login, verificar as duas respostas fictícias já salvas, gravação, recarregamento e isolamento.
- Não concluir o onboarding inteiro sem uma prova segura do efeito final, pois o app pode disparar `POST /cadastro`/n8n. Não houve esse envio nesta sessão.
- Eventos de pagamento posteriores, estorno, 3DS de produção, assinatura e NFS-e continuam com provas próprias. Abrir o formulário de QA não valida essas integrações.

## Publicação

O diretório estava limpo, e `main`/`origin/main` apontavam para `0124c80c52d6a070c9090b02128ddfcbb889a886`. A mesma SHA foi conferida em `git ls-remote origin refs/heads/main`. O projeto Vercel de destino foi identificado pelo ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, nome `v2g-webapp-qa`; o projeto WebApp principal é outro.

Foi criado um deployment desse commit **somente no projeto QA**. A primeira compilação ficou `READY`, mas `/contratar` devolveu 404. A comparação restrita das flags não secretas mostrou que `V2G_CHECKOUT_QA_DEPLOY_ENABLED` era a única trava de ambiente divergente; `V2G_CHECKOUT_ENABLED`, `V2G_CHECKOUT_API_ENABLED`, `ASAAS_ENVIRONMENT`, URL/ref do Supabase QA e URL do site conferiam com o guard em `lib/contratacao/ambiente-checkout.ts`. A flag foi alterada para `true` apenas no projeto QA e somente no target `production` **desse projeto**, para servir seu domínio estável. O deployment anterior não recebeu a nova configuração; por isso houve uma segunda compilação da mesma SHA.

Deployment final: `dpl_EkqAA3weFGXMZBDHvReVWHREpmb9`, estado `READY`, sem erro de alias, servindo `https://v2g-webapp-qa.vercel.app`. Aqui, `production` é o target do projeto isolado de QA, não a publicação do WebApp principal nem `v2gmidia.com.br`.

## Interface verificada

- `https://v2g-webapp-qa.vercel.app/entrar` abriu a tela de login.
- `/entrar?modo=cadastro` mostrou CNPJ, senha repetida, opções de visualização e critérios explícitos de força. Não foi criada conta nova.
- `/contratar` abriu depois da segunda compilação. A opção mensal mostrou R$ 500 por conta, mínimo de seis meses e cartão; ao selecionar o anual, mostrou R$ 5.280 à vista, 12% de desconto e opção Pix. Nenhum pedido/cobrança foi iniciado.
- Sem sessão no domínio QA, `/escolher-negocio` redirecionou para login com `next` preservado. A sessão local em `localhost` não comprova sessão HTTPS.

O esquema de onboarding no Supabase QA e a prova local de isolamento dos dois negócios estão documentados em [`qa-posicionamento-onboarding-11-10.md`](./qa-posicionamento-onboarding-11-10.md). Não houve commit, push, pagamento, assinatura, nota, reserva ou escrita na Meta por este agente.
