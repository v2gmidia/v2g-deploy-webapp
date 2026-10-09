# QA da jornada, avisos e e-mails — 09/10/2026

## §0. O que ainda depende de humano ou de outro bloco

- Uma URL HTTPS estável de QA, cadastrada no **Auth > URL Configuration** do projeto QA e usada em `NEXT_PUBLIC_SITE_URL`. O túnel temporário não serve de endereço definitivo para e-mails.
- Instalar e ensaiar em QA os dois templates de `docs/auth-email/`. Eles foram preparados localmente, mas **não foram publicados no Supabase**; o e-mail atual pode continuar genérico e apontar para localhost. O conector disponível não expõe configuração de Auth/SMTP. O domínio e o remetente precisam ser conferidos antes de envio real a clientes.
- Ensaio visual no navegador de upload pela Server Action, decisão pelo operador e retorno ao cliente. O teste desta sessão usou HTTP autenticado para as páginas e verificou Storage/RLS separadamente; não afirmou que um clique completo pela interface foi validado.
- A estrutura de QA ainda não tem `public.execucoes`; a leitura dessa tabela falha de modo degradado e os dados do backend para negócios fictícios retornam 404. Isso não prova o onboarding ou campanhas ponta a ponta.
- Alertas deste lote são **dentro do app quando a página é aberta**. Não há push, e-mail ou WhatsApp de revisão. Não há evento de publicação da campanha neste fluxo. A resposta da Letícia e da contabilidade continua necessária para pagamento/NFS-e.

## O que foi feito

- Só no projeto `v2g-webapp-qa` (`zskpijnqgkqwxksqmzmf`), foi aplicada a migration `qa_compat_telas_criativos`, registrada em `scripts/qa-compat-telas-criativos.sql`. Ela acrescenta colunas já existentes em produção que `/criativos` e `/alertas` consultam. Não reproduz todas as migrations históricas e não deve ser aplicada em produção.
- `/alertas` agora consulta `creative_review_requests` do negócio selecionado sob RLS. Ajustes pedidos pelo gestor aparecem como pendência, e os demais estados aparecem em “Retorno dos criativos”. Uma aprovação interna diz explicitamente que a publicação manual ainda precisa ser confirmada. A fila interna `/gestor/criativos` e o contador do gestor já existiam; não foram recriados.
- O cadastro e a recuperação passaram a fornecer a `/auth/confirmar` como destino explícito. O callback envia a recuperação para `/redefinir` e o cadastro para `/inicio`, exceto quando recebe um destino interno válido. Dois templates HTML locais usam `TokenHash` e `RedirectTo`, com as cores do WebApp. A instalação desses templates em QA permanece pendente.
- `docs/smtp.md` descreve uma situação histórica de DNS/caixa postal; não foi usado como comprovação atual. A caixa `@v2gmidia.com.br` recebeu mensagem no ensaio anterior, mas isso não comprova SMTP customizado nem entrega a clientes externos.

## Verificações

- `scripts/qa-jornada-autenticada.mjs` criou três usuários fictícios, três negócios e três pedidos no QA. Uma conta com **dois pedidos marcados `payment_approved` como fixture, sem transação** abriu `/criativos` em ambos, mantendo peças e avisos separados; sem escolha de negócio foi para `/escolher-negocio`. Um pedido pendente foi para `/acesso-pendente`. Cliente e anônimo não abriram a fila do gestor; operador autorizado abriu. A aprovação de uma peça não virou anúncio publicado.
- `scripts/qa-revisao-criativos.mjs` confirmou leitura do dono, isolamento entre usuários, bloqueio de escrita direta/anonimato, Storage privado, URL temporária e idempotência do ID.
- Após os ensaios, consulta no QA encontrou **zero** usuários, negócios, pedidos e revisões das fixtures `qa-jornada-*`/`qa-peca-*`. O ensaio de Storage também removeu seus registros e arquivo.
- `scripts/conferir-auth-email.mjs`, `pnpm typecheck` e `pnpm build` passaram. O servidor dev foi parado para o build e restaurado em `localhost:3000`.
- Nada foi feito em produção, Meta, Asaas, LP ou backend. Sem commit, push ou deploy.

## Fontes do contrato de e-mail

- [Templates de e-mail do Supabase](https://supabase.com/docs/guides/auth/auth-email-templates): `TokenHash`, `RedirectTo` e endpoint no servidor.
- [Exemplo oficial de confirmação em Next.js](https://supabase.com/nextjs): `verifyOtp` com `type=email`.
- [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls): Site URL e lista de destinos autorizados.
