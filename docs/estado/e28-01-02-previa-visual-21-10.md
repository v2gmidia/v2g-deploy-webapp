# Guia visual da venda assistida — 21/10/2026

Victor pediu para visualizar as alterações em localhost. Criados `docs/previas/venda-assistida.html` e `scripts/previa-venda-assistida.mjs`.

Servidor isolado em `http://127.0.0.1:4312`, iniciado com `node scripts/previa-venda-assistida.mjs`. Não usa Next/.next, não reinicia dev compartilhado, não lê .env, não importa clientes de banco/Auth/provedor. Serve somente quatro URLs permitidas e aceita apenas GET; CSP bloqueia conexões de API e envio de formulários. Código TypeScript puro de validação do produto é compilado em memória para uso no navegador.

Guia didático, não reprodução integral/autenticada da tela: origem direta ou LP, CNPJ, pedido pendente, comprovante, declaração humana de crédito e passagem de acesso. Persistência, correspondência do lead fictício #42, banco, Auth e vínculo são explicitamente simulados. Nada é gravado e recarregar reinicia.

Verificado em Chrome: CNPJ inválido recusado; atendimento direto avança sem lead; comprovante mantém acesso fechado; aprovação sem conferência recusada; pagamento simulado seguido de e-mail/vínculo simulados libera só o acesso demonstrativo; contrato, nota e publicação continuam pendentes. ID LP divergente recusado e ID 42 correto aceito na amostra. Nova simulação limpa estados posteriores. Não é nova prova de integração QA/produção, nem inspeção móvel.

Identidade/estados orientados pela Impeccable, sem alterar telas reais, CSS global, package.json, planos ou índice central. Aba deixada aberta como entrega. Screenshot no diretório de visualizações do chat: `venda-assistida-local.png`.

Nenhuma cobrança, emissão, assinatura, mensagem externa, migration, commit, push ou deploy. E28-01-A/B e E28-02-A ganham explicação visual, não novo estado de conclusão no produto.
