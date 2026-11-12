# Próximo ato revisável: domínio do aplicativo, sem ativar pagamentos

> CONCLUÍDO em 11/11/2026: associação, CNAME exclusivo do app, preservação dos 15 registros anteriores, DNS e HTTPS conferidos. `/entrar` abre no host app; `/contratar` continua indisponível. Ver `docs/estado/n26-dominio-app-dns-https-concluido-11-11.md`. Não repetir o ato com base no preparo histórico abaixo.

Preparado em 10/11/2026 após a prova autenticada do comprador QA. **Não executado.**

> ATUALIZAÇÃO em 11/11/2026: Victor autorizou o ato. Associação do subdomínio na Vercel executada e relida; DNS ainda aguarda login privado no Registro.br. Ver `docs/estado/n26-dominio-app-associado-dns-pendente-11-11.md`. O preparo original abaixo é histórico e não deve provocar nova associação duplicada.

## Escopo para autorização de Victor

Vincular `app.v2gmidia.com.br` exclusivamente ao projeto produtivo `v2g-deploy-webapp`, ID `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`. Configurar somente o registro necessário do subdomínio `app` no DNS autoritativo externo. Conferir associação, propagação e HTTPS. Parar antes de configuração financeira, migração ou checkout público.

## Leituras atuais

- Deployment produtivo `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, main `13f8943471b391bd22e9dd8362f5748653ad9c5b`, READY. Conferido pela API Vercel, sem mudança de alias ou deployment.
- A consulta do domínio no projeto retornou 404 no bloco anterior. A inspeção atual de DNS retornou `DNS_ERROR_RCODE_NAME_ERROR` para o subdomínio.
- NS da zona: `b.sec.dns.br`, `c.sec.dns.br`. A Vercel confirmou `serviceType: external`, sem CNAME/A observados para o app e sem conflitos retornados.
- `get_domain_config`, com projeto/equipe exatos, retornou `misconfigured: true` e o destino CNAME preferido abaixo. Esses dados são recomendações observadas, não um registro já aplicado.

| Campo | Proposta observada |
| --- | --- |
| Nome | `app` |
| Tipo | `CNAME` |
| Destino Vercel rank 1 | `dd78efba83f6f629.vercel-dns-017.com.` |
| Projeto | `v2g-deploy-webapp` |
| Domínio completo | `app.v2gmidia.com.br` |

Revalidar a recomendação e a ausência de registro concorrente imediatamente antes de escrever. Não substituir a zona inteira, trocar nameservers, alterar raiz/www/LP, MX, TXT de e-mail ou outros registros. Vercel DNS não é autoritativo dessa zona: não criar o CNAME lá esperando efeito. Se surgir conflito ou verificação de propriedade adicional fora do subdomínio aprovado, apresentar o registro exato antes de ampliar o ato.

## Estado financeiro protegido

A inspeção anterior de nomes de variáveis produtivas (zero nomes produtivos ocultos) não encontrou as configurações comerciais exigidas pelo código. Não houve leitura dos valores. O guard exige projeto/banco/host/ambiente e configuração explícitos. Nenhuma variável comercial deve ser ligada por este ato.

Manter sem ativação:

- `V2G_PRODUCTION_CHECKOUT_ENABLED`;
- `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED`;
- `V2G_PRODUCTION_URL_CONFIRMED`;
- configuração de Asaas/webhook/e-mail/3DS e encaminhamento da LP.

Não criar/rotacionar segredo, configurar Auth, aplicar SQL, publicar código, fazer merge/commit/push, criar cobrança ou assinatura, enviar e-mail/contrato, emitir nota ou publicar anúncio. Associar o domínio não conclui o comercial.

## Prova para encerrar o ato

1. Projeto/domínio exatos e ownership/validação conferidos.
2. Somente o registro autorizado do app alterado; preservar export/backup privado do estado anterior e referência do registro criado.
3. DNS propagado e certificado HTTPS válido. Registrar erro/pendência se ainda não convergirem; não repetir gravação para forçar propagação.
4. Checkout produtivo continua indisponível sem configuração financeira explícita. Não iniciar formulário de pagamento nem realizar POST para demonstrar isso.
5. Registrar resultado e parar. Próximo bloco posterior: preparar esquema/configuração comercial e o ensaio real nominal, cada um com seu portão. Não supor prontidão do banco de produção pelo QA.

Se a inserção ou associação falhar/ficar ambígua, consultar o estado exato antes de repetir. Retorno limitado ao registro/subdomínio e associação criados por este ato, preservando o restante; não desfazer efeitos anteriores de outras frentes.

## Código já existente e limites de release

A comparação main → QA do recorte comercial mostrou o núcleo `lib/contratacao`, `/contratar`, entrada e webhooks sem diferenças nesses caminhos. Há diferenças na página de acesso histórico, no resolvedor de negócio e na readiness SQL, além da migração de publicação de criativo. Isso não autoriza transportar toda a QA para produção ou aplicar migrations indiscriminadamente. A readiness QA foi reforçada e precisa compor a revisão do pacote de banco futuro. Nenhuma seleção de release foi aplicada.
