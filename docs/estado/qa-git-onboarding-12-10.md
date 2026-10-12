# QA Git e onboarding HTTPS — 12/10/2026

## Publicação observada

- Projeto isolado `v2g-webapp-qa` (`prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`) conectado no painel da Vercel a `v2gmidia/v2g-deploy-webapp`.
- Branch Tracking do ambiente **Production desse projeto QA** alterado de `main` para `QA`. A branch remota `origin/QA` apontava para `70a24a8577a80e07889eb813c0cd39de8961468f`, igual à `main` local nesta verificação. Nenhuma configuração do projeto WebApp principal foi alterada.
- O primeiro deployment Git da branch `QA`, `dpl_8UVNpXLqXrBz6dwrjab2iDTpD5p9`, ficou `READY` com esse commit. O destino é o domínio estável `https://v2g-webapp-qa.vercel.app` e utiliza o ambiente de produção **do projeto QA**.

## Percurso HTTPS com sessão existente

1. `/onboarding` exibiu a interface nova de seis perguntas do negócio, com retomada na pergunta 2. A sessão estava na Empresa 2 fictícia.
2. `/contratar` abriu no domínio estável e mostrou a oferta mensal de R$ 500, sem confirmar pedido, cobrança nem webhook.
3. Na Empresa 2 fictícia, `/onboarding/contas` aceitou o ticket `Não sei` após a segunda confirmação; passou para a conta seguinte sem criar média numérica. O recarregamento conservou “Você não soube”. Isso verifica no HTTPS a correção que havia falhado no deployment anterior.
4. O mesmo login alternou para a Empresa 1 fictícia. `/onboarding/concluido` permaneceu concluído, e `/meu-negocio` conservou o ticket R$ 100, custo R$ 50 e lucro desejado R$ 25 desse negócio, sem receber o `Não sei` da Empresa 2.

## Limites

- A resposta por voz foi relatada como funcional por Victor; este percurso não testou microfone, permissão nem transcrição.
- Não foi criada compra nova, cobrança, assinatura, reserva, nota fiscal ou campanha. A abertura de `/contratar` não prova webhook nem acesso liberado após um pagamento novo.
- O e-mail, link, login e seleção de dois CNPJs já tinham prova anterior com pedidos de acesso fictícios; não foram repetidos aqui. O vínculo de **uma nova cobrança Sandbox aprovada com seu acesso correspondente** continua sem prova na URL estável.
- O projeto QA agora acompanha pushes futuros da branch `QA`. A atualização de `main` por si só não atualiza o domínio estável de QA.
