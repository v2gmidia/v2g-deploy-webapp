# Multiconta — segunda empresa fictícia no QA, 15/10/2026

## 0. Ainda pendente

- Abrir o WebApp HTTPS com o login QA já confirmado e conferir as duas empresas no menu, a troca em um clique, a retomada após atualização e o isolamento de respostas em duas abas. A leitura do banco e os conferidores locais não substituem esse teste autenticado.
- A migration `20261015011547_proteger_pagina_compartilhada_multiconta.sql` permanece somente preparada. A proteção transacional da Página Meta compartilhada e os ensaios de perda de acesso e de várias contas de anúncios ainda faltam.

## Registro da fixture

Victor autorizou preparar um segundo CNPJ para testar multiconta enquanto revisa o onboarding. A sessão de QA existente já tinha login confirmado e a empresa `v2g teste`; não foi necessário criar ou alterar credenciais.

Somente no Supabase `v2g-webapp-qa` (`zskpijnqgkqwxksqmzmf`), foi criada em uma única instrução atômica uma empresa marcada `dados_ficticios = true`, um pedido de teste e uma unidade comercial:

| registro | identificador |
|---|---|
| empresa `V2G QA Multiconta B — FICTÍCIA` | `0542c574-7c15-41ff-a269-22ce56ca25f2` |
| pedido | `8793b752-adbb-4ef7-a4b8-2a4a219ef19f` |
| unidade | `c89574c7-0007-4936-be9a-d35fca5d443f` |
| referência exclusiva da fixture | `qa-multiconta-victor-1510-b` |
| CNPJ matematicamente válido e sintético | `00000000000604` |

O pedido tem `payment_approved` **simulado para liberar somente o ensaio de acesso**, conforme o precedente das fixtures `qa-auth-victor-0910-1/2`. Não houve cobrança, evento do Asaas, token, assinatura, NFS-e nem confirmação de pagamento real. Os IDs de cobrança e assinatura do provedor estão nulos. O novo onboarding contém apenas a resposta fictícia de nome, diferente das respostas existentes da primeira empresa.

## Verificação

- Releitura no QA confirmou que o mesmo perfil possui agora exatamente duas empresas, das quais apenas a nova está marcada como fictícia.
- A nova empresa está associada ao pedido com o CNPJ indicado, uma unidade e IDs de cobrança/assinatura nulos.
- `pnpm conferir:multiconta`: 28 de 28 testes locais passaram.
- Uma aba separada do navegador interno abriu o site HTTPS, mas não tinha a sessão QA; portanto, nenhuma afirmação de teste visual autenticado é feita.

Não houve commit, push, deploy, migration, alteração em produção ou escrita na Meta. Esta fixture deve ser removida somente com autorização específica, preservando a empresa e o pedido anteriores.
