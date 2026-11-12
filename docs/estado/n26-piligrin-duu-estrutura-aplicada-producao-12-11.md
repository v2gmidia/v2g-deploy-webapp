# Piligrin → Dúú — estrutura e cadastro aplicados em produção

## 0. Resultado e próximo limite

12/11/2026, conferência final às 18:55:52 UTC (15:55:52 de Brasília). **Banco e cadastro deste bloco concluídos** no projeto produtivo `ushccxpoxjikzqnwhgfd`, após autorização explícita de Victor para backup privado, restauração, estrutura e cadastro. Sete negócios anteriores viraram oito: a raiz vazia foi renomeada para Piligrin e Dúú Gomes foi criado como anunciante distinto, com um vínculo explícito entre ambos.

A próxima etapa é preparar/conferir os acessos, a conexão Meta e os materiais legítimos e a publicação controlada do código, conforme o plano das quatro etapas. Não é prova da experiência produtiva completa: o código candidato, a conexão do novo anunciante e o percurso autenticado ainda precisam de seus próprios blocos. Nenhuma cobrança, anúncio, concessão/aceite, atribuição de gestor, upload de material ou publicação de código ocorreu nesta aplicação.

Responsável técnico: Central. Victor participa dos pontos privados/aceites e do Git conforme as regras do projeto. Não pedir de novo a data/conteúdo da arte já respondidos; preservar e conferir autoria e origem no bloco apropriado.

## 1. Backup real e restauração antes da aplicação

Pasta privada, fora do Git: `C:/Users/victo/.codex/private-backups/v2g/piligrin-estrutura-producao-aplicacao-20261112/`.

- `backup.json`: captura consistente, somente leitura, às 18:48:09 UTC. Contém as sete linhas reais de `businesses`, texto JSON original para preservar números/datas, metadados de colunas, constraints, índices, gatilho, políticas/privilégios, definição original de `private.handle_new_user()` e dependências selecionadas. SHA-256 `0c52e4864ec393d17bf6466d3c7a135653e94898956dd30331edaed112c8b994`.
- `backup-extra.json`: estado de RLS/proprietários, buckets existentes e contagens/fingerprints dos registros que não poderiam mudar. SHA-256 `bff7ac188c6b6535fb922b01f7780887575b750cbeeaebd2d53cfafc0929426e`.
- `migrations-before.json` e `advisors-before.json`: histórico e avaliação de segurança anteriores.
- `restaurar-e-ensaiar.mjs` e `restauracao-resultado.json`: restauração real do escopo mutável em PostgreSQL local descartável, seguida de aplicação das oito unidades e do cadastro. **117 verificações passaram**, incluindo sete fingerprints originais idênticos, definição original da função de identidade restaurada, segunda restauração independente, idempotência e negativas de isolamento/privilégios.

Limite da restauração: recupera dados e definição do escopo efetivamente alterado; dependências externas de Auth/perfis, financeiro, Meta e Storage são estruturas locais de apoio. Não é um backup integral do projeto Supabase, das senhas, dos tokens ou dos arquivos do Storage. Nenhuma credencial foi exportada. O bucket alvo não existia; sua ausência foi registrada antes da criação. Nenhuma restauração destrutiva foi executada em produção.

Dois ajustes do instrumento local foram necessários antes da aprovação do ensaio: não pressupor coluna `id` em eventos financeiros e usar UTC para comparar os fingerprints de datas com a captura. Não alteraram o pacote ou a produção. A prova adicional de negação do aceite foi executada após o novo aviso do analisador de segurança.

## 2. Unidades efetivamente aplicadas

Pacote preservado: `docs/producao/piligrin-duu-12-11/manifesto.json`, revisão 2, unidade de banco `piligrin-duu-12-11-revisao-1`. Os hashes das oito unidades, cadastro e dados foram conferidos contra o manifesto antes da aplicação. As propostas seladas mantêm sua descrição histórica; este checkpoint registra a execução posterior autorizada.

Cada DDL foi executado pela ferramenta de migração, em transação, com limite de espera e tempo de execução, guardas de deriva e conferência de RLS. As transações internas das fontes foram substituídas por uma única transação externa; o corpo semântico foi preservado. Não foi executada a cadeia geral de migrações.

| Unidade do pacote | Nome aplicado | Versão registrada |
|---|---|---|
| `banco/01-agencia.sql` | `piligrin_duu_prod_01_agencia` | `20261112185216` |
| `banco/02-mesa-responsaveis.sql` | `piligrin_duu_prod_02_mesa_responsaveis` | `20261112185240` |
| `banco/03-evidencia-contratual.sql` | `piligrin_duu_prod_03_evidencia_contratual` | `20261112185243` |
| `banco/04-acesso-contratado.sql` | `piligrin_duu_prod_04_acesso_contratado` | `20261112185245` |
| `banco/05-revisao-criativos.sql` | `piligrin_duu_prod_05_revisao_criativos` | `20261112185306` |
| `banco/06-intencao-envio.sql` | `piligrin_duu_prod_06_intencao_envio` | `20261112185308` |
| `banco/07-publicacao-confirmada.sql` | `piligrin_duu_prod_07_publicacao_confirmada` | `20261112185310` |
| `banco/08-privilegios-explicitos.sql` | `piligrin_duu_prod_08_privilegios_explicitos` | `20261112185313` |

Evidência: `aplicada-01.sql` a `aplicada-08.sql`, respectivos recibos, `migrations-after.json` e `jornal-hashes.json`, na pasta privada. O jornal relaciona cada fonte canônica, hash original, versão realmente registrada e hash do SQL com as guardas. As datas históricas das fontes não foram fingidas como versões aplicadas. Antes de eventual execução geral de `db:migrate`, reconciliar essa correspondência; não reaplicar os arquivos canônicos sobre estas tabelas nem editar o histórico indiscriminadamente.

## 3. Cadastro e preservação

O cadastro foi executado separadamente por SQL transacional, usando `20-cadastro-proposto.sql` e o JSON aprovado. Os parâmetros de projeto, unidade e dados foram definidos apenas dentro da transação. A guarda confirmou novamente os sete fingerprints do backup, titular existente/confirmado e vínculo ainda ausente.

- Agência: `54df1a9b-f1ca-444a-8282-67cf7301a257`. Somente `name` passou de Meu negócio para Piligrin, com atualização normal de `updated_at`. Demais campos conferiram iguais; onboarding continua `{}` e verba continua nula. Não recebeu a marca nem as respostas do anunciante.
- Anunciante: `8b916e82-11dc-47ce-a5ac-988b44d83344`, Dúú Gomes. Mesmo titular existente, cadastro separado, teto de mídia R$ 3.000, atendimento em todo o estado do Rio de Janeiro, sem site, Instagram e respostas/marca confirmadas preservadas com origem e datas. Cores `#2B1B3F`, `#E9B7F9`, `#BACC9E`. Preço de referência do fardo não foi transformado em ticket médio, custo ou margem.
- Um vínculo `piligrin-duu-producao`, ativo, `legacy_shared_business=false`. FamFire ficou fora deste lote.
- Os outros seis negócios permaneceram integralmente iguais. A conferência final considera também a ausência de uma linha como falha de preservação.

Fingerprints antes/depois iguais: dez perfis, quatro contas de anúncios, duas conexões Meta e onze criativos existentes. As dez identidades de Auth preservaram id/e-mail/confirmacão/papel verificados. Pedidos comerciais permaneceram em zero. O procedimento não leu nem alterou senha ou token.

Os sete novos cadastros operacionais auxiliares permaneceram vazios: nenhuma evidência manual, concessão, evento de acesso, atribuição/tarefa de gestor, revisão ou confirmação de publicação foi criada. O bucket `creative-review` está privado, com limite e MIME revisados, e zero objetos. Os demais buckets conferiram iguais.

Evidências: `cadastro-aplicado.sql`, `cadastro-receipt.json`, `verificacao-final-consolidada.json` e `footprints-after.json`, na pasta privada. Hash do cadastro fonte: `6ea5f51585ed6b892272ac2d017259672f1078f395ff7667c9b98ecaf0bc5155`; SQL executado com parâmetros/guardas: `deb75c0d87ee02e80b0584255809790f38395da3a233e0952c5bb597f9c7203c`.

## 4. Isolamento e avaliação de segurança

Produção: oito tabelas novas com RLS habilitada, todas as constraints validadas, nenhuma permissão de INSERT/UPDATE/DELETE/TRUNCATE para `anon` ou `authenticated`. Conferidos individualmente privilégios de tabelas, colunas da evidência e funções. Relação usa chaves compostas de negócio e titular nos dois lados. A função original de identidade recebeu somente a proteção revisada contra reivindicação automática por e-mail nesse fluxo; proprietário e ACL ficaram iguais.

Ensaio local sobre o cadastro restaurado: outro titular não leu agência/Dúú ou relação; vínculo entre titulares distintos foi rejeitado pela FK; relação revogada ficou invisível; titular sem concessão explícita não conseguiu aceitar acesso e não criou eventos. As provas de sessão/papel foram exclusivamente locais, sem impersonação ou configuração de JWT em produção.

O analisador manteve os avisos anteriores de funções anônimas e proteção de senha. Novos resultados: quatro INFO de RLS sem política nas tabelas que intencionalmente negam acesso direto ao cliente e um WARN da função autenticada `aceitar_acesso_contratado`, que é SECURITY DEFINER por desenho. Ela exige sessão confirmada, concessão explícita, e-mail, evidência conferida e negócio compatíveis; não há concessão neste bloco. `anon` e `service_role` não têm EXECUTE nessa função. Não mudar para SECURITY INVOKER só para apagar o aviso, pois isso quebra o modelo revisado.

Referências do analisador: [RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy); [execução autenticada de SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable); [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Relatórios completos anteriores/posteriores e `function-checks.json` preservados privadamente.

Limite da prova: isolamento de banco e negativas locais comprovados. Não equivale à validação autenticada das quatro telas em produção, nem comprova números da Meta, criativos publicados ou aceite visual do titular. Esses percursos dependem das próximas etapas de acesso/conexão/material/código, sem importar permissões ou tokens da QA.

## 5. Fechamento do bloco

Nenhum commit, push, merge, deploy, mudança de configuração financeira, cobrança, anúncio, DNS, página legal ou workflow n8n. Nenhum dado de outro chat sobrescrito. Bloco encerrado após a aplicação, as verificações e o registro; não emendar a etapa de acessos/publicação sem o próximo bloco.
