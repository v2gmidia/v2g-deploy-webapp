# Subdomínio associado à produção; DNS aguarda sessão — 11/11/2026

> RESOLVIDO em 11/11/2026: login informado por Victor; CNAME app salvo, demais 15 registros preservados, DNS/HTTPS e contratação fechada conferidos. Ver [conclusão do domínio](./n26-dominio-app-dns-https-concluido-11-11.md). O relato abaixo preserva o estado anterior.

## 0. Resultado e próximo ato

Victor autorizou ligar **somente `app.v2gmidia.com.br`** ao WebApp produtivo, ajustar o DNS desse subdomínio e conferir HTTPS. Compras, processamento de pagamentos, migrations e cobranças permanecem fora deste ato.

**Associação Vercel executada e relida com sucesso. DNS ainda não alterado. HTTPS do app ainda não pode ser certificado.** O Registro.br abriu em `/login/`, sem sessão autenticada. Aba preservada para Victor entrar privadamente; solicitação enviada pelo canal de entrada de texto, sem pedir senha/código no chat. Não foi solicitado reset, criado usuário ou lida/preenchida senha.

Próximo ato: após Victor informar o login, abrir a zona correta, capturar backup privado dos registros, adicionar apenas o CNAME `app` recomendado para o projeto e salvar. Conferir propagação, HTTPS e permanência do checkout fechado. Não repetir a associação já feita na Vercel.

## 1. Ato externo autorizado concluído

- Projeto: `v2g-deploy-webapp`, ID `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, equipe `team_sEnWVgpk9PlXLZwMQmd4sv3O`.
- Antes: três aliases Vercel, sem o subdomínio. Configuração DNS relida: externo, CNAME/A do app ausentes, sem conflitos retornados, `misconfigured=true`.
- Chamada única `add_project_domain` para `app.v2gmidia.com.br`, sem branch de preview, redirect ou ambiente personalizado.
- Resposta e releitura `get_project_domain`: nome/projeto exatos, `verified=true`. Criação registrada em `1794403187696` ms UTC (11/11/2026).
- Esse `verified=true` confirma a associação/posse no contexto da Vercel; não prova DNS propagado nem certificado HTTPS do app.
- Deployment produtivo conferido após o ato: `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, main `13f8943471b391bd22e9dd8362f5748653ad9c5b`, READY. Nenhum novo deploy, push ou merge foi feito.

## 2. DNS pendente, escopo exato

Zona autoritativa externa: NS `b.sec.dns.br`, `c.sec.dns.br`. Registro proposto, relido imediatamente antes da associação:

| Campo | Valor |
| --- | --- |
| Nome | `app` |
| Tipo | `CNAME` |
| Destino preferido retornado pela Vercel | `dd78efba83f6f629.vercel-dns-017.com.` |

O app ainda retornou `DNS_ERROR_RCODE_NAME_ERROR` antes da escrita DNS. A raiz, MX, NS e www foram capturados em backup privado como referência. Não foi alterado registro algum do DNS, nem raiz/LP/www/MX/TXT/nameservers. Revalidar o destino e possíveis conflitos no painel autenticado antes de criar o registro; não substituir a zona inteira ou usar Vercel DNS como se fosse autoritativo.

## 3. Pagamentos preservados desligados

- Nomes/tipos/destinos de variáveis do projeto produtivo relidos com `decrypt=false`; metadados idênticos antes/depois, zero variáveis produtivas ocultas.
- Nenhum nome Asaas, checkout, e-mail de pagamento, Turnstile ou flags de ativação financeira apareceu. Não foram lidos valores de variável, segredo, senha ou chave. Nenhuma configuração foi criada/editada.
- GET público do alias produtivo `/contratar`: HTTP **200 com marcador Next `NEXT_HTTP_ERROR_FALLBACK;404`**, sem formulário/texto de checkout. É resposta de not-found transmitida em streaming; não foi classificada como checkout liberado nem como HTTP 404 literal. Nenhum POST de pagamento foi feito.
- A conferência do mesmo caminho no host app depende da conclusão do DNS/HTTPS. Não declarar o subdomínio funcionando antecipadamente.

## 4. Evidência, preservação e limite

Backup privado: `C:/Users/victo/.codex/private-backups/v2g/dominio-app-20261111/`:

- `antes.json`: associação/domínios, configuração DNS recomendada e somente nomes/tipos/destinos de variáveis;
- `vercel-associado.json`: resultado da associação única;
- `dns-publico-antes.json`: referência pública da raiz, MX, NS, www e ausência do app.

Alterações locais de outros blocos preservadas. Sem migração, leitura/escrita do banco produtivo, modificação de pagamentos, chamadas Asaas, cobrança, configuração Auth, contrato, nota, Meta, LP, n8n, commit, push ou deploy. A única mudança produtiva deste bloco foi a associação do subdomínio na Vercel, expressamente autorizada. Pendência humana única atual: autenticação no Registro.br.
