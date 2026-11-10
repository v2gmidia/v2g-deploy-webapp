# Agência → anunciantes — pacote pendente para QA

**Preparado e ensaiado localmente em 10/11/2026. Não aplicado.**

Este diretório está fora de `supabase/migrations` principal para que commit/push do WebApp não aplique o pacote por consequência. A migration foi criada pelo CLI local (`supabase migration new` com `--workdir` deste diretório); nenhum comando de aplicação, link ou deploy foi executado.

## O que o pacote faz quando houver autorização de aplicação

1. Acrescenta `agency_advertisers`, com titular comum obrigatório por duas FKs compostas, relação explícita e referência estável por anunciante. Não move dados existentes.
2. Registra Piligrin → Dúú com o **business_id histórico preservado**. A auto-referência é uma ponte legada explícita, não uma cópia ou fusão de dados.
3. Cria uma linha de negócio própria da FamFire, com ID gerado pelo banco, e vincula à Piligrin. Guarda apenas as três informações declaradas por Victor: nome, contratante e operação via agência.
4. Não copia conta Meta, Página, orçamento, localização, marca, peça, revisão, gestor ou campos financeiros do Dúú. Não cria usuário para os anunciantes.

A Piligrin continua contratante. A ponte mantém o registro histórico que já contém dados do Dúú; este bloco não promete uma separação física completa desse legado nem migração dos outros oito anunciantes.

## Autorização e isolamento

- WebApp: a estrutura opera somente sob o controle já existente de flag + projeto Supabase QA exato (`pilotoQaHabilitado`). URL e nomes não concedem acesso.
- `agency_advertisers`: RLS e SELECT apenas do titular; escrita indisponível a `anon`/`authenticated`. Sem RPC pública de cadastro.
- FKs exigem o mesmo titular da agência e do anunciante. Impedem transferir silenciosamente um negócio vinculado a outro titular ou apagar o pai com relações existentes. Não há herança transitiva entre agências.
- O trabalho interno do filho na QA exige que o pai continue liberado, com concessão de piloto válida. Pedido comercial próprio do filho não é contornado por essa herança.
- Esse acesso de preparação não é licença financeira, concessão Meta ou autorização de ativar. A FamFire não ganha acesso à conta do Dúú.
- Abrir um anunciante diferente usa POST validado antes de trocar o cookie existente de preferência. O GET do detalhe recusa outro anunciante; formulários antigos continuam conferindo o business_id esperado.
- Bibliotecas e assinaturas são consultadas por negócio e titular. A carteira pode agrupar peças, mantendo o vínculo de cada uma; nenhum resumo soma contas dos dois anunciantes.

## Enquanto o banco ainda não tiver o pacote

A ausência da tabela (`PGRST205`/`42P01`) conserva o percurso legado do Dúú. Erro de permissão, resposta inválida ou falha de consulta não é tratado como instalação ausente. **Publicar apenas o código não cria a FamFire nem passa a mostrar dois cadastros na QA.**

## Futura aplicação: outro bloco, com aprovação nominal

1. Verificar o projeto **QA zskpijnqgkqwxksqmzmf** independentemente do SQL, e capturar backup privado de metadados e registros relevantes. Conferir titular e estado atual da Piligrin; preservar trabalho de outros chats.
2. Revisar/aplicar somente o schema pendente deste diretório. Conferir ACL/RLS, índice e constraints antes de preparar dados.
3. Na sessão de implantação já verificada, definir a marca `v2g.qa_project` exigida por `preparar-piligrin.sql`, e executar o pacote de dados revisado. Essa marca é uma declaração do implantador: **não descobre nem comprova o projeto por conta própria**.
4. Registrar os IDs devolvidos, hashes/contagens anteriores e posteriores, e comprovar que o Dúú não foi alterado. A repetição não pode duplicar a FamFire nem sobrescrever dados posteriores.
5. Validar com a sessão Piligrin: carteira com dois clientes; abrir Dúú e FamFire; números, período, conta, biblioteca, upload e retorno. Testar sessão de outro titular, revogação e aba antiga.
6. Completar os dados próprios da FamFire. Conta Meta, Página e atribuição de gestor precisam de conferência/ato próprios; não estão incluídos no preparo automático.

Não aplicar em produção. Não usar `pnpm db:migrate` para este pacote nem incorporá-lo à pasta principal como etapa implícita do push.

## Retorno seguro

Antes de qualquer aplicação, basta manter o pacote pendente. Depois de aplicado, uma reversão do código deve preservar tabela e registros. Para retirar apenas a preparação de um filho, revisar a revogação do vínculo correspondente; não apagar o negócio, peças ou arquivos, nem revogar a ponte Dúú por consequência. A volta da preferência revogada deve exigir escolha, sem selecionar outro anunciante silenciosamente. Qualquer retorno com dados reais é outro ato autorizado.

## Verificação local

- `pnpm conferir:agencia`: 43 testes, incluindo o resolvedor real, carteiras/bibliotecas e POST de abertura.
- `pnpm conferir:agencia-sql`: Postgres WASM descartável, 34 verificações de preservação, repetição, RLS/ACL, titular comum, isolamento e revogação. Não conecta à QA.
- O módulo PGlite usa a instalação de ferramentas já disponível na máquina; em outra máquina, indicar o módulo existente por `V2G_PGLITE_MODULE`. Nenhuma dependência de produção foi acrescentada.
- Onboarding, seleção de negócio, histórico, leitura Meta, revisão/publicação, tipos e build foram conferidos; detalhes e limites no checkpoint abaixo.

SHA256 (bytes do pacote local):

| Arquivo | SHA256 |
|---|---|
| `supabase/migrations/20261110193942_agency_advertisers_qa.sql` | `FBF1FE200B6ACDF2AD8640A5A466FB37649BF99381EA5E9CDD1619EF8B426E7F` |
| `preparar-piligrin.sql` | `AA3FDC5551E955F10D129FAA781ADF7A2D16C2CC610CFC0FDB37875969287BAA` |

Referência técnica consultada: [Supabase — RLS e grants](https://supabase.com/docs/guides/database/postgres/row-level-security). A prova deste pacote vem dos testes locais, não da documentação.

Checkpoint: `docs/estado/n26-agencia-anunciante-piligrin-local-qa-10-11.md`.
