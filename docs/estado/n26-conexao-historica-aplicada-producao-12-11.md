# Complemento de conexão histórica aplicado em produção

## 0. Resultado e limite

12/11/2026, conferido às **19:33:20 UTC / 16:33:20 de Brasília**. Victor autorizou explicitamente a aplicação do complemento apresentado no turno anterior, sem cobrança, anúncios ou publicação de código. **Função instalada e conferida no projeto produtivo `ushccxpoxjikzqnwhgfd`.** Não foram repetidas as oito unidades de estrutura/cadastro já encerradas.

Este bloco conclui o complemento do banco. Ainda não conclui acesso produtivo ponta a ponta: o código preparado precisa ser publicado controladamente; depois são necessários evidência real da contratação, atribuição/sessão legítima do operador, concessão/aceite da Piligrin e conexão Meta do Dúú. Não existe concessão ou conexão nova criada por esta instalação. Próxima ação: Central preparar/conferir o pacote combinado de código; Victor conduz o Git conforme a regra do projeto. Aceite e campos privados permanecem nas próprias telas, sem senha/documento no chat.

## 1. Cópia privada e conferência

Pasta privada fora do Git: `C:/Users/victo/.codex/private-backups/v2g/piligrin-complemento-conexao-producao-20261112192940/`.

Captura consistente às 19:29:40 UTC, antes da migração:

- Ausência da função alvo e de todas as suas sobrecargas.
- Definição, proprietário e ACL da função financeira original `registrar_conta_contratada`.
- Oito linhas reais de `businesses`, preservadas como texto JSON e fingerprints PostgreSQL, sem conversão numérica intermediária.
- Metadados/ACL/RLS/colunas das seis tabelas de dependência, privilégios individuais do serviço e trilhas de evidência/concessão/eventos, atualmente vazias.
- Contagens/fingerprints de perfis, contas, conexões Meta, pedidos, revisões, publicações e relações de agência. Não foram exportados tokens, senhas ou chaves.
- Histórico de migrações e avaliação de segurança anteriores.

`backup.json` SHA-256: `4b60bcddbe5cdf799011efad096f6b987c23d24790e966f07c621221431a5139`.

`conferir-copia.mjs` / `copia-conferida.json`: **12 verificações passaram**. Recuperadas localmente as oito linhas reais, com fingerprints iguais, e a definição anterior da função financeira. A função proposta foi instalada no banco descartável e sua remoção local devolveu o alvo à ausência original, sem modificar os cadastros ou a função anterior. A criação das estruturas locais de apoio foi ajustada para não tratar coluna gerada do financeiro como DEFAULT comum; o banco produtivo e o pacote aprovado não foram alterados por esse ajuste do instrumento.

Limite: restauração focada no escopo desta adição, com dependências externas locais de apoio. Não é recuperação integral de Auth, Meta, Storage ou de todo o projeto. Não foi executado retorno destrutivo em produção.

## 2. Migração efetivamente aplicada

Fonte aprovada: `docs/producao/piligrin-acessos-12-11/registrar-conta-acesso-contratado.sql`, SHA-256 **`d821436c3759aea58cac27c2f0cbd83b1db0136d499ac507956d55345d7a6e3c`**, igual ao manifesto apresentado. As três alterações da candidata WebApp também conferiram com seus hashes anteriores; nenhuma deriva foi aceita silenciosamente.

| Item | Valor |
|---|---|
| Nome aplicado | `piligrin_duu_prod_conexao_acesso_contratado` |
| Versão registrada | `20261112193237` |
| Função adicionada | `public.registrar_conta_acesso_contratado(uuid,uuid,text,uuid,uuid,text,text,text,text)` |
| Resultado da ferramenta de migração | `success: true` |
| Definição instalada, MD5 PostgreSQL | `1b810733943e74417c05ef934cd4e4cc` |
| SQL enviado, SHA-256 | `5e3c9f7aa820e02e97df1ce59fff0c849a8647995614b78cc3a6284dcdd21291` |

Execução em uma transação, com limite de espera/execução e guardas de ausência da função, definição financeira/identidade e cadastros iguais ao backup. O corpo da função foi preservado; foram acrescentadas somente guardas e uma transação externa substituindo a transação interna da fonte. Não houve execução da cadeia geral de migrações.

Artefatos privados: `aplicacao-input.json` preserva o texto exato enviado, `aplicacao-com-guardas.sql`, `migration-receipt.json`, `hashes.json` e `migrations-after.json`. A proposta/manifesto anteriores ficam como snapshot de revisão, com este checkpoint registrando a aplicação posterior autorizada.

## 3. Validação em produção

O corpo e a definição completa instalados conferiram com o PostgreSQL local. SECURITY INVOKER, `search_path` vazio, proprietário `postgres`. ACL efetiva somente `postgres` e `service_role`; `anon` e `authenticated` não executam a função. Nenhum privilégio adicional de UPDATE foi concedido na tabela de acessos. Os privilégios das dependências permaneceram exatamente iguais.

Uma chamada negativa com entradas nulas, em transação somente leitura e sem identidade/JWT forjados, foi recusada por `conta_historica_dados_invalidos`. Nenhuma concessão, conta ou pedido fictício foi criado para testar o caminho válido em produção. As provas positivas/negativas locais anteriores permanecem válidas para o mesmo hash de fonte: 57 verificações de banco/seletor, seis testes da ação real, 33 regressões e typecheck.

Comparação antes/depois: **oito cadastros, relações de agência, perfis, contas, conexões, pedidos, revisões/publicações, evidências, concessões e eventos preservados**. Definição/ACL da função financeira original e fingerprint da função de identidade iguais. RLS das dependências permaneceu ativo. A nova função apenas instala o mecanismo; não foi usada para registrar uma conta real neste bloco.

Evidências privadas: `verification.json`, `preservation.json`, `state-after.json` e `aplicacao-resumo.json`.

## 4. Segurança e próximo bloco

Avaliação antes/depois sem novos avisos: 28 INFO de RLS sem política, três WARN de funções anônimas SECURITY DEFINER, três WARN de funções autenticadas SECURITY DEFINER e um WARN de proteção de senhas, todos anteriores. A função nova é SECURITY INVOKER e não ampliou essa lista. Relatórios completos preservados na pasta privada.

Referências das verificações existentes: [RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funções anônimas SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [funções autenticadas SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Não corrigir avisos antigos alterando permissões ou autenticação por consequência deste bloco.

Próximo: combinar o pacote-base Piligrin/Dúú com o complemento de código já selado, revisar/publicar os destinos e só então concluir os acessos pelo fluxo legítimo. Conta e Página do Dúú já compartilhadas na BM V2G foram conferidas no bloco anterior; não reenviar solicitação de compartilhamento nem copiar credenciais QA. O CNPJ/documento necessário é o do contratante Piligrin, preenchido privadamente quando o formulário estiver disponível.

Sem commit, push, merge, deploy, alteração de controles financeiros, cobrança, anúncio, permissões Meta, DNS, páginas legais ou n8n. Encerrada a aplicação nominal autorizada; publicação e ativação não estão autorizadas por consequência desta migração.
