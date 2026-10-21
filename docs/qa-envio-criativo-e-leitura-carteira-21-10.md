# E28-05-A/B e recorte de E28-06-C — pacote individual de homologação

Preparado em 21/10/2026. **Não executado contra QA/Supabase/Storage reais.** Este roteiro não concede autorização externa. Aprovação específica do projeto, arquivo, janela, fixtures e limpeza pertence a Victor. Central coordena a execução; 05/06 prepara os artefatos; 07/08 responde pelo contrato backend.

## 1. Escopo exato

- Envio de imagem pronta, intenção confirmada no aplicativo e revisão humana. A versão é identificada por request UUID + negócio + SHA-256 dos bytes; o pedido não permite substituir conteúdo/intenção num replay.
- Conferir dados/enviar **não equivale à aprovação formal de primeira publicação**, nem ao anúncio “no ar”. A confirmação atual registra imagem/objetivo/validade; o procedimento de publicação precisa de sua aprovação específica e de evidência da plataforma.
- O recorte não fecha E28-06-C completo: aprovação de imagem gerada, até três refações e integração do gerador permanecem fora deste bloco, conforme instrução direta de Victor.
- O adaptador E28-05-B está preparado sem consumidor de tela. Não é uma mesa autenticada integrada nem um endpoint novo de publicação.

## 2. Pré-checagem e portão de aplicação

1. Confirmar independentemente a conexão/projeto **QA `zskpijnqgkqwxksqmzmf`**. Produção `ushccxpoxjikzqnwhgfd` está fora do pacote. Esses IDs são identificação do plano, não prova de conexão atual. `current_database()` sozinho não distingue projetos Supabase. Não abrir/copiar valores de chaves.
2. Em janela autorizada, executar apenas a leitura de `scripts/sql/prechecar-qa-envio-criativo.sql`. Salvar definição do schema, constraints, RLS, policies, ACL, bucket e contagem da fila num registro privado. O ensaio local validou a sintaxe com ledger/schema fictícios, não a existência desses objetos no QA atual.
3. Base necessária: `public.profiles`, `businesses(id,profile_id,dados_ficticios)`, fila de `20261009034500_fila_revisao_criativos.sql`, bucket privado `creative-review`; para carteira/tarefas, schema de `20261009042000_gestor_responsaveis_tarefas.sql`, inclusive `manager_accounts` e tarefas. Conferir objetos efetivos e ledger; não reaplicar dependências automaticamente.
4. **Única migration candidata:** `20261021032617_creative_review_upload_intent.sql`. Registrar SHA-256 atual do arquivo aprovado; o arquivo foi corrigido localmente após o ensaio detectar confirmação com data impossível e dependência de DateStyle. Não usar um hash de versão anterior do documento.
5. Matriz obrigatória:

   | Ledger / coluna | Ação |
   | --- | --- |
   | Ambos ausentes, dependências corretas | Candidata à aplicação individual autorizada |
   | Ambos presentes | Comparar SQL/constraint atual; não reaplicar |
   | Só um presente ou SQL divergente | Parar e reconciliar; não “consertar” ledger por conveniência |
   | Dependência ausente/divergente | Abrir escopo separado; não acrescentar ao lote |

6. A conferência anterior reportou 20 grupos de objetos ausentes, não um pedido de aplicar 20 migrations. **Não executar `db push`, `db:migrate`, `--include-all` ou aplicação em lote.** Não relançar o conferidor global para tentar forçar verde.
7. Antes de DDL: obter snapshot consistente privado de fila, definições/ACL/policies e referências necessárias, inventário dos objetos do bucket e ledger; provar que o snapshot pode ser lido/restaurado em base descartável. Guardar hash e escopo. Cópia da tabela não é backup completo de Auth/Storage. Se não for possível provar recuperação, parar.
8. Aplicação futura: enviar apenas o SQL integral desta migration, em uma operação individual/transacional no projeto QA confirmado, por ferramenta/conexão autorizada. Registrar versão remota efetiva, nome, hash e resultado. Isso **não está autorizado nem foi executado por este roteiro**.
9. Pós-aplicação: nova coluna JSONB nullable; legado SQL NULL; CHECK com quatro chaves/version 1/dois objetivos/data real/UTC canônico; grants e policies iguais ao snapshot; bucket ainda privado/9 MB/JPG-PNG; contagem e estados de pedidos anteriores preservados. Não habilitar flags/configurações de análise paga por consequência da DDL.

## 3. Ensaio autenticado futuro — sem publicação nem análise paga

Preparar dois negócios fictícios distintos, seus donos e dois gestores QA com atribuições distintas. Não promover agência/cliente para `operador` como atalho. Criação/concessão real de acesso precisa de autorização própria. Marcar negócios como fictícios pela operação aprovada. Cada rodada recebe novos UUIDs; não reutilizar IDs dos testes unitários.

Manifesto privado mínimo: rodada, ambiente, usuário autenticado, negócio, gestor atribuído, request UUID, nome `E28-QA-<rodada>.png`, SHA-256 dos bytes locais, tamanho/MIME, objetivo, validade, status e caminho exato `business_id/request_id`. Não guardar senha, token, URL assinada ou material de cliente no repo.

1. Dono do negócio A entra no app e seleciona A. Escolhe PNG sintético permitido, define objetivo e, se aplicável, validade. Confere prévia e confirma. A bancada `/exemplo` não serve para esta prova: ela interrompe antes da action.
2. Comparar request ID, ator, negócio, hash dos bytes, caminho privado e `upload_intent` persistidos. Horário de confirmação vem do servidor. Nenhum `published_at`, `external_ad_id` ou estado Meta é criado por este fluxo.
3. Repetir exatamente o mesmo request/file/intenção: uma linha, mesmo caminho e confirmação original, sem segundo custo/arquivo/tarefa lógica. Não interpretar sincronização idempotente de tarefa como novo pedido.
4. Tentar alterar bytes, autor, negócio, objetivo ou prazo mantendo request ID: negar e preservar o primeiro registro. Criativo realmente novo requer novo request; alterações não substituem a versão anterior.
5. Recarregar/logout/login: no negócio A, galeria mostra arquivo/objetivo/prazo e estado corretos. Recuperar arquivo por URL assinada curta gerada pelo servidor; comparar o hash dos bytes recuperados ao manifesto. Expiração de URL não apaga arquivo/pedido. Não colar a URL assinada no relatório público.
6. Gestor responsável por A: encontra o pedido exato na fila e abre a mesma imagem. Dono B e gestor de B, inclusive manipulando parâmetro/request ID, não conseguem ler, obter URL ou decidir A. Um usuário de agência sem contrato de autorização implementado fica negado.
7. Decisão de A usa ator/nota/status/horário e compare-and-set de pendência. Outro gestor negado; segunda decisão não sobrescreve a primeira. Solicitar ajustes preserva o histórico. Promoção vencida não recebe aprovação interna; pode receber pedido de ajuste/recusa.
8. Simular falha parcial permitida no QA: `upload_failed` retoma mesmo ID/hash; erro após recebimento não declara publicação. Se houver resposta de rede ambígua, consultar o registro antes de repetir ou iniciar outro pedido. Não habilitar gerador/autoanálise real para testar falha.
9. Registrar evidência separada de renderização autenticada, action/API, linha, Storage e fila. Revisão registrada não prova aviso recebido, primeira publicação aprovada ou veiculação.

## 4. Adaptador de leitura — contrato e limites

Entrada servidor: `lerMetricasDaCarteira({businessId,desde,ate})`, exportada por `lib/backend/index.ts`. Ainda sem rota/tela consumidora. Usa `auth.getUser()` e `app_metadata.papel === operador`, exige `manager_accounts` com par negócio/operador e lê o dono de `businesses.profile_id`. IDs/profile provenientes de navegador não concedem acesso. Agências não recebem delegação nova neste recorte.

Somente depois das verificações: GET `/negocios/{business_id}/consolidado` por `lib/backend/cliente.ts`, com dono obtido no banco. A resposta precisa ecoar negócio/período e fornecer `por_execucao`; não usar endpoint interno direto ou fallback para ativos V2G.

- `contrato_de_leitura` governa os números. Totais do topo e `nivel`/`nivel_frase` não alimentam semáforos neste adaptador: o nível antigo usa outra janela canônica no backend.
- `sem_dados` fica sem números; zero real mantém zero e dias observados. `desconhecida` não vira completa/verde. Campos ausentes inválidos tornam a resposta ilegível; null tem motivo preservado.
- Múltiplas origens, conflito de identidade, moeda/total irmão divergente ou dados contraditórios tornam todos os números nulos com aviso. Nem o custo irmão é usado nesse caso.
- Custo só vem da linha da própria execução, quando consistente; não inventar valor da fixture, orçamento, receita ou moeda. Decimais de resultado permanecem strings, sem perda de precisão.
- Cliques totais não viram cliques no link. Resultado atribuído/pessoas que chegaram não vira conversa, lead qualificado ou venda.
- Carimbo anterior ao fim do período pode gerar alerta, não diagnóstico de causa. Sem fuso, só afirmar comparação inequívoca nos extremos UTC±14; intervalo ambíguo permanece null. Isso não é prova de atualização em tempo real ou de completude.
- Fixture canônica: `backend_v2g/tests/fixtures/e28_07_contrato_handoff.json`, versão `e28-07-v1`, lida diretamente pelo teste. Os nove cenários foram cobertos; a fixture `vinculo_manual` é escrita e não pode acionar POST ou ser aceita como leitura.

Para QA HTTPS futuro: publicar/configurar somente com autorização própria, comparar negócio/owner/período/conta/campanha com a fonte autorizada, provar 401/404/409 sem corpo cru e verificar outra carteira negada antes da chamada. Nenhuma conta externa foi autorizada por este bloco.

## 5. Falha, rollback e limpeza

- DDL falhou: rollback da operação individual; verificar schema/ledger antes de repetir. Resposta ambígua não é autorização para reaplicar.
- Rollback operacional preferido: interromper o ensaio e preservar a coluna/arquivo/histórico; código anterior pode ignorar a coluna aditiva. Desabilitar envio/reverter publicação de código/configuração requer janela/autorização próprias. Não fazer DROP de coluna, tabela ou bucket com pedidos reais.
- Limpeza não é automática. Depois de autorizado, comparar manifesto com um único request, negócio fictício, ator, caminho e hash. Excluir apenas o objeto de Storage listado pela API autorizada, preservando evidência necessária; não usar glob/prefixo de negócio inteiro. Resolver apenas a tarefa QA desse request, se houver, pela operação aprovada — não apagar carteira/tarefas alheias.
- `scripts/sql/limpeza-qa-envio-criativo-modelo.sql` é modelo por request, exige os IDs/hash/nome `E28-QA-%` e negócio `dados_ficticios=true`, e termina em **ROLLBACK**. Preparar/revisar não executa limpeza. Foi ensaiado somente na base local, inclusive negação de hash errado e preservação de outro pedido. Trocar rollback por commit em QA é novo ato autorizado.
- Não remover dono/gestor/negócio/ledger, não apagar arquivo de cliente e não aplicar limpeza global. Guardar evidência privada da remoção e possibilidade de recuperar via snapshot aprovado.

## 6. Comandos de repetição local e prova disponível

```text
node --test scripts/conferir-intencao-envio-sql.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-intencao-envio.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-revisao-criativos.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-metricas-carteira.mjs
pnpm exec tsc --project scripts/qa/tsconfig.metricas-carteira.json --pretty false
```

PGlite usa a dependência já disponível em `C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js`; outro ambiente pode indicar somente o caminho via `V2G_PGLITE_MODULE`. Nenhuma dependência foi instalada. O teste do contrato aceita `V2G_FIXTURE_CONTRATO_LOCAL` como caminho da fixture canônica; não é flag de produto nem cópia de dados reais.

PostgreSQL temporário verifica CHECK, RLS/ACL com identidade SQL simulada e scripts, **não** assinatura/expiração de JWT, Supabase Auth/PostgREST, URLs assinadas, Storage remoto, concorrência entre processos ou HTTPS de ponta a ponta. As actions têm portas em memória; não chamar isso de prova autenticada real.

Referências consultadas: [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [PGlite API](https://pglite.dev/docs/api), [changelog Supabase](https://supabase.com/changelog). O índice `.md` retornou content-type não suportado; foi usado o changelog HTML. As mudanças de .NET/TLS listadas não alteram este ensaio local.
