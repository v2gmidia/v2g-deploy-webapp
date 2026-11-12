# Comercial: endereços aplicados e provedores conferidos — 11/11/2026

## 0. Resultado e próximo ato

> AVANÇO em 11/11/2026 após autorização das conexões: 17 configurações não secretas salvas/relidas somente Production, incluindo 13 controles OFF. Formulários privados preparados; primeira transferência de credencial aguardando Victor. [Estado atual do handoff](./n26-comercial-conexoes-off-configuradas-handoff-11-11.md). Não solicitar novamente autorização deste mesmo pacote nem alterar o manifesto histórico por consequência.

**Banco mínimo já concluído. Endereços públicos autorizados agora salvos e conferidos. Vendas e pagamentos continuam desligados.** Os logins pendentes do bloco anterior foram concluídos por Victor; não pedir novamente aprovação de 3DS/tokenização ou aplicação do banco.

Ainda falta configurar as conexões privadas de produção e seu webhook/proteção, publicar uma versão fechada especificamente autorizada e realizar a prova nominal pagamento → e-mail recebido → acesso ao negócio correto. A compra real e a abertura de vendas não estão concluídas nem autorizadas por este ato.

Próximo responsável: Central/Victor, no bloco de configuração privada com destinos e escopos abaixo. Não receber segredo no chat. Mudanças de credenciais exigem entrada e conclusão privadas por Victor; nenhum valor foi preparado neste registro.

## 1. Delta aplicado uma vez

Autorização específica de Victor: “Autorizo esse ajuste de endereços”, em resposta à proposta de Site URL/callback Supabase e variável pública Production. Preservados os demais itens.

| Alvo | Resultado conferido |
| --- | --- |
| Supabase `V2G-SITE`, `ushccxpoxjikzqnwhgfd`, main/Production | Site URL = `https://app.v2gmidia.com.br`. Save changes executado uma vez. Valor persistiu após recarga. |
| Redirect URLs | Adicionado somente `https://app.v2gmidia.com.br/auth/confirmar`. Os dois retornos anteriores foram preservados: alias Vercel `/**` e `http://localhost:3000/**`. Três URLs após recarga. |
| Vercel `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl` | Variável existente `NEXT_PUBLIC_SITE_URL`, ID `n46cppKOEKCnUfCR`, alterada somente em Production. Valor público exato conferido por leitura individual; nenhum outro valor de variável foi consultado. |
| Preservação Vercel | Doze metadados de variáveis antes/depois idênticos (nome, ID, tipo, target, branch e ambiente customizado). Não criada variável extra nem alterados Preview/Development. |

O retorno da gravação Vercel contém valor cifrado: a comparação inicial com o endereço público não era prova de falha. Não foi repetida a escrita; leitura individual posterior confirmou o valor aprovado. Nenhum valor cifrado foi exposto no registro.

**Configuração salva não significa deployment atualizado.** O domínio continua no deployment `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, READY/production, commit `13f8943471b391bd22e9dd8362f5748653ad9c5b`. Nenhuma nova publicação foi feita. O próximo release autorizado precisa incorporar e testar a origem pública no cadastro/recuperação e demais consumidores existentes, sem executar exclusão nem alterar legais.

## 2. Painéis legitimamente autenticados

| Conexão | Fato atual | O que isso não comprova |
| --- | --- | --- |
| Asaas de produção, V2g Agencias De Publicidade Ltda | Página Todas exibe o estado de primeira cobrança, sem cobrança listada. Webhooks mostra “Nenhum Webhook encontrado”. Logs de Webhooks sem resultados nos filtros correntes; retenção informada de 14 dias. | Não existe webhook produtivo cadastrado. Não houve cobrança para provar a habilitação atual de 3DS/tokenização; as aprovações históricas seguem documentadas no bloco anterior. Lista vazia não dispensa tratamento de eventos externos/futuros. |
| Resend | Único domínio listado: `send.v2gmidia.com.br`, status **verified**. | Não certifica chave financeira instalada na Vercel nem entrega produtiva. O FROM concreto anterior é `V2G <pagamentos@send.v2gmidia.com.br>`, comprovado por e-mail QA recebido, não por novo envio. |
| Cloudflare Turnstile | Um widget, **V2G Checkout QA**, modo Managed. Host permitido: somente `v2g-webapp-qa.vercel.app`. Edit aberto apenas para ler hostname; cancelado sem alteração. | `app.v2gmidia.com.br` não está coberto. Não existe proteção produtiva configurada pelos nomes exigidos na Vercel. Não copiar segredo de QA nem alterar o widget existente por consequência. |

O pedido de SMS deste turno foi um diagnóstico incorreto: componente oculto foi confundido com solicitação ativa. A sessão já estava autenticada, confirmada pelo painel. Nenhum código foi solicitado novamente, lido ou enviado.

## 3. Pacote restante concreto — preparado, não executado

O manifesto existente `docs/comercial/preparo-producao-11-11/configuracao-preparada.json` continua sendo proposta OFF, sem valores privados. Não substituir o pacote selado do banco nem reexecutar suas provas concluídas.

| Item | Destino / limite da próxima configuração | Responsável e prova |
| --- | --- | --- |
| Proteção produtiva | Widget separado, nome proposto **V2G Checkout Produção**, modo Managed, host exato `app.v2gmidia.com.br`, sem alterar QA. Destinos na Vercel Production: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `V2G_TURNSTILE_ALLOWED_HOSTNAMES=app.v2gmidia.com.br` e `V2G_CHECKOUT_SECURITY_HASH_SECRET`. | Central prepara; Victor conclui entradas privadas. Conferir host/action `checkout` e recusa de hostname errado no release fechado, sem resolver desafio humano automaticamente. |
| Asaas | Credencial exclusiva no destino `ASAAS_PRODUCTION_API_KEY`; `ASAAS_ENVIRONMENT=production`. Webhook proposto `https://app.v2gmidia.com.br/api/webhooks/asaas-production-payment`, token exclusivo no destino `ASAAS_PRODUCTION_WEBHOOK_TOKEN`, eventos financeiros definidos pelo código. | Victor conclui credencial privadamente. Central confere escopo/URL/entrega antes de qualquer ativação. Não criar cobrança nem assinatura. |
| E-mail financeiro | Chave de envio limitada ao domínio verificado; destino `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY` e FROM `V2G <pagamentos@send.v2gmidia.com.br>` em `V2G_PRODUCTION_PAYMENT_EMAIL_FROM`. | Victor conclui entrada privada; Central confere metadados e destino. Entrega real ainda exige ensaio nominal, sem duplicar e-mails QA. |
| Versão fechada | Incorporar somente a configuração revisada, todos os controles comerciais OFF; conferir callbacks e identificação exata de versão/ambiente. | Publicação específica ainda não autorizada neste bloco. Não presumir que o deployment atual recebeu a variável recém-salva. |

Antes de ativar o webhook, resolver seu escopo e comportamento para cobrança sem vínculo. O handler atual retorna 503 em `lib/contratacao/webhook-pagamento.ts:61`: uma fila sequencial pode parar; responder 200 indiscriminadamente também pode perder evento legítimo que antecede o vínculo. Lista atual vazia não elimina essa condição. Nenhuma correção especulativa foi implementada nem fila ativada para forçar prova.

## 4. Verificação e preservação

Após as alterações autorizadas, GET público somente leitura: `/entrar` HTTP 200, um formulário; `/contratar` HTTP 200 com not-found transmitido (`NEXT_HTTP_ERROR_FALLBACK;404`), zero formulários. Isso comprova contratação pública fechada neste deployment; não é HTTP 404 literal nem prova financeira.

Leitura dos metadados Vercel: somente `NEXT_PUBLIC_SITE_URL` presente entre os nomes comerciais exigidos; configurações financeiras/proteção/e-mail previstas ainda ausentes, zero variáveis produtivas ocultas no inventário. Nenhuma flag financeira alterada. Sem POST financeiro, e-mail, assinatura, migração, banco, DNS, permissão, Meta, n8n, LP, legais, commit, push ou deploy neste bloco.

Não foram reexecutados testes de código/banco concluídos: o produto não foi editado. Verificações adequadas foram persistência após recarga, leitura individual da URL pública, comparação de metadados, identidade do deployment e GETs públicos sem efeitos financeiros.

Evidência segura compartilhável: `docs/comercial/conexoes-producao-11-11/depois-enderecos-paineis.json`. Evidência privada e capturas: `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/`, incluindo `auth-urls-depois.png`, `conferencia-paineis-depois.json`, `resend-dominio-verificado.png` e `asaas-cobrancas-vazio.png`. Captura Auth mostra Site URL; a lista completa de três callbacks foi conferida por snapshot após recarga e está no JSON. Evidências anteriores preservadas, sem sobrescrever o backup selado do banco.

Próxima prova final permanece: comprador/método/valor/recorrência explicitados → Victor executa pagamento → conciliação canônica → evento → e-mail recebido → sessão legítima → negócio correto. Somente após aceite, liberar contratação e encaminhamento da LP em ato separado.
