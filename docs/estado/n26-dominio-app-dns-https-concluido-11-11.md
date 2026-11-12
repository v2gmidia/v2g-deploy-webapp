# Domínio app com DNS e HTTPS conferidos — 11/11/2026

## 0. Resultado e próximo passo

**Concluído o bloco autorizado de domínio:** `https://app.v2gmidia.com.br/entrar` abre o WebApp produtivo com HTTPS válido. Contratação e pagamentos permanecem desligados. Este ato não libera vendas.

Próximo bloco comercial: mapear a base e a configuração produtivas necessárias para o percurso compra → pagamento confirmado → acesso, apresentar o pacote e seus limites antes de qualquer ativação financeira ou migração. Responsável: Central preparar; Victor decidir o ato concreto. Não repetir a prova de domínio sem falha nova.

## 1. Registro único e preservação

Após Victor confirmar o login privado no Registro.br, a zona existente foi lida integralmente e copiada para backup privado antes da escrita: **15 registros**. Não havia registro `app`.

Foi adicionado somente:

| Nome | Tipo | Destino |
| --- | --- | --- |
| `app.v2gmidia.com.br` | CNAME | `dd78efba83f6f629.vercel-dns-017.com.` |

A zona foi salva uma vez e reaberta. A releitura mostrou **16 registros**, botão de salvar desabilitado, os **15 registros anteriores idênticos** e apenas o CNAME esperado acrescentado. Os textos Tipo/Nome/Dados presentes na leitura da linha nova são rótulos da tabela; o destino real também foi comprovado pelo DNS autoritativo.

Raiz, www, e-mail, api, n8n, TXT e nameservers preservados. Sem substituição de zona ou uso de Vercel DNS como autoritativo.

## 2. Prova externa e HTTPS

- Consulta CNAME ao servidor autoritativo `b.sec.dns.br`: destino exato esperado, TTL 3600.
- Vercel `get_domain_config`: `configuredBy=CNAME`, CNAME esperado, `misconfigured=false`, sem conflitos. Nameservers externos `b.sec.dns.br` e `c.sec.dns.br` mantidos.
- `get_project_domain`: `verified=true`, projeto `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`, sem redirect, branch preview ou ambiente personalizado.
- O host app resolve para o deployment produtivo existente `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, READY, main `13f8943471b391bd22e9dd8362f5748653ad9c5b`. Nenhum novo deploy foi criado.
- GET HTTPS normal, sem ignorar validação de certificado, em `/entrar`: HTTP 200, título `Entrar — V2G`. A tela de entrada também foi conferida no Chrome pelo novo endereço, sem aviso de certificado e sem preencher credenciais.

Limite: conferência do autoritativo, resolução usada pela Vercel, acesso local HTTP e Chrome. Não é medição de todos os caches DNS do mundo; caches anteriores podem expirar em momentos diferentes. Não foi testado login produtivo ou callback Auth.

## 3. Compras continuam fechadas

GET HTTPS do host app em `/contratar`: HTTP **200 com marcador `NEXT_HTTP_ERROR_FALLBACK;404`**, zero formulários e sem texto de pagamento. No Chrome, a mesma rota exibiu a página **404 — This page could not be found**. O HTTP 200 é o transporte do not-found em streaming, não checkout disponível.

Metadados de variáveis relidos com `decrypt=false`: zero variáveis produtivas ocultas; nomes/tipos/destinos preservados. Nenhum nome Asaas, checkout, processamento financeiro, e-mail de pagamento ou Turnstile introduzido. Valores não foram lidos ou impressos. Nenhum POST financeiro foi realizado.

Sem cobrança, assinatura, migração, acesso ao banco de produção, alteração Auth, LP, páginas legais, Meta, n8n, permissões ou credenciais. Sem commit, push, merge ou publicação de código. As únicas mudanças externas foram a associação previamente autorizada do subdomínio e seu CNAME.

## 4. Evidências e encerramento

Backup privado em `C:/Users/victo/.codex/private-backups/v2g/dominio-app-20261111/`:

- `zona-antes.json`, `zona-depois.json`, `delta-zona.json`: leitura integral e delta de preservação;
- `antes.json`, `vercel-associado.json`, `dns-publico-antes.json`: referência do ato anterior;
- `https-resultados.json`: status e sinais seguros das duas rotas;
- `app-https-entrar.png`: tela real no novo host, sem dados preenchidos.

Alterações locais anteriores de outros blocos preservadas. Bloco encerrado antes da preparação/ativação comercial seguinte.
