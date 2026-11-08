# Reconciliação QA — pacote final para revisão — 07/11/2026

**Preparado, não aplicado. Backup real NÃO realizado.** Nenhuma ferramenta DDL
foi chamada. Só U1 tem SQL completo. O impedimento de suíte limpa da
[matriz](../../estado/n26-divergencias-schema-pre-push-07-11.md) permanece.

## Sequência de seis unidades

Os IDs remetem às linhas numeradas da matriz; `unidades.json` mapeia todos.
Não são 53 aprovações nem autorização para aplicar uma pasta.

| Unidade | Grupos / ausências | Dependências |
|---|---|---|
| U1 — reconexão Meta | #1 / 1 | Função isolada, sem mudar tabela/dados/Vault. Primeiro procedimento completo, retorno simples e utilidade no ramo de conexão inválida. |
| U2 — compatibilidade operacional/Meta | #2, #6, #8, #9, #10 / 17 | Depois U1. Só colunas/callbacks ausentes, preservando o que já existe; não reexecutar 0008/0024 inteiras nem reativar campaigns. Preparar locks/backup por delta. |
| U3 — perfil/propostas/procedência | #3, #4, #5, #7, #11 / 9 | Depois U2. Pessoas/entrevistas/pessoa_id → transcrição; propostas/itens → aplicação; divergências → escrita condicionada. |
| U4 — módulos opcionais | #12, #14 / 10 | Depois base U3. RevOps e pedidos criativos independentes; manter autorizações/flags. Revisar FKs e constraints de referência pública. Não autoriza gerar/gastar. |
| U5 — cadeia documental | #13, #16, #17, #18 / 14 | Depois U3. Fiscal/evidência → CPF/CNPJ → acesso histórico; este depende também do trigger Auth existente. Não copiar Auth/dados de clientes. |
| U6 — conciliação/readiness | #15, #19 / 2 | Depois U2/U5 e cadeia real de checkout. Comparar corpos financeiros/ACL/índices antes de preparar delta, readiness por último; provedores/flags fora da unidade. |

Cobertura: **19 grupos/53 ausências**, sem sobreposição. U2–U6 são plano, não SQL
pronto nem promessa de cinco transações indivisíveis. Pré-requisitos fora das 53
ausências podem exigir revisão adicional antes de construir essas unidades.
Somente U1 está pronta para revisão independente e autorização nominal futura.

## Canal final: apply_migration, com nova entrada explícita no ledger

O canal DDL escolhido é **mcp__codex_apps__supabase_apply_migration**.
execute_sql fica reservado às leituras. Não há alternativa de DDL sem ledger
presumida neste pacote.

Metadados da ferramenta recebidos nesta revisão exigem apply_migration para DDL
e aceitam apenas project_id, name e query. O código público do
[adaptador oficial](https://github.com/supabase/mcp/blob/main/packages/mcp-server-supabase/src/platform/api-platform.ts#L244)
encaminha name/query ao endpoint de migrations. A
[documentação do endpoint](https://supabase.com/docs/guides/integrations/supabase-for-platforms#make-database-changes)
declara registro em supabase_migrations e rollback das mudanças em falha.
A [referência da API](https://supabase.com/docs/reference/api/v1-apply-a-migration)
confirma os parâmetros. Consultados em 07/11/2026; não é teste da implantação
remota do conector, nem inspeção do servidor fechado da plataforma.

O payload final contém **um único DO**, sem BEGIN/COMMIT externos e sem controle
de transação dentro do bloco. Portanto não encerra prematuramente a transação
gerida pelo endpoint. O bloco PostgreSQL reúne o delta e suas verificações; uma
exceção desfaz suas alterações. A documentação sustenta o rollback do endpoint,
mas o ensaio local é um modelo desse contrato, **não prova remota de acoplamento
entre DDL e ledger**. Resultado incerto é resolvido por recibo, nunca por retry.

A futura chamada única de aplicação, **somente após autorização**, deve ser:

- ferramenta: `mcp__codex_apps__supabase_apply_migration`;
- project_id: `zskpijnqgkqwxksqmzmf`;
- name: `qa_reconciliacao_u1_meta_reconexao_20261107`;
- query: conteúdo integral de `u1-aplicar.sql`, conferido pelo SHA256SUMS.

Não interpolar segredos, trocar nome nem gerar ID de ledger no cliente. O
conector atribui a versão; o recibo aceita exatamente **uma** nova entrada com
esse nome e preserva todas as versões/nomes anteriores. A ferramenta não expõe
Idempotency-Key neste contrato; não se presume idempotência automática.

Retorno pós-commit, se autorizado separadamente, usa a **mesma ferramenta e QA**,
name `qa_reconciliacao_u1_meta_reconexao_retorno_20261107`, query integral de
`u1-retornar.sql`. Adiciona uma entrada nova de retorno; não apaga/repara
entradas anteriores, incluindo a aplicação U1. Não há escrita manual no ledger.

## U1: objeto, guards e arquivos

Alvo: public.marcar_conexao_meta_quebrada(uuid,text,text), ausente no QA.
Fonte lógica: supabase/migrations/0006_conectar_meta.sql:109–137. Preserva
parâmetros, corpo lógico, void, owner postgres, SECURITY DEFINER e search_path
vazio. Não altera conectar_meta nem chama a função criada. UPDATE só ocorreria
numa chamada futura, fora deste ato.

- `u1-aplicar.sql`: criação simples e transacional no DO, sem IF NOT EXISTS/
  CREATE OR REPLACE; ACL mínima, marca de procedência e guards.
- `u1-retornar.sql`: só DROP da função idêntica criada; sem CASCADE e sem
  restaurar linhas. Recusa adulteração/dependentes.
- `u1-preflight.sql` / `u1-pos.sql`: cada arquivo é **um SELECT, uma linha,
  uma coluna receipt JSON**. Mesmo formato, não três result sets.
- `u1-verificar.sql`: assertions somente leitura dos pais, backend e função.
- `snapshot-protegido.sql`: consulta comum de metadados, embutida nos demais.
- `comparar-recibos.mjs`: comparação local, sem rede, preservando ledger prévio
  e aceitando somente a nova entrada nominal da fase.
- `fixture-metadados-pais.json` / `ensaio-u1.mjs`: ensaio descartável; fixture
  nunca deve ser executada remotamente.
- `ato-u1.json`: especificação do futuro ato; não dispara ferramentas.

receipt contém protected_snapshot (incluindo ledger_metadata version/name),
target_function da assinatura exata, target_overload_count e target_overloads
de **todos** os homônimos em public/private. PRE exige zero/lista vazia/alvo null.
PÓS exige um alvo exato público; executar u1-verificar.sql e comparar recibos.
O resultado de apply_migration não é usado como recibo SQL.

### Identidade e preservação

O SQL não prova project_id: current_database=postgres, cluster_name=main e
project_ref_setting=NULL foram medidos e não usados como identidade. O destino
é vinculado pelo argumento explícito do conector, confirmado no inventário
conectado. Estrutura parecida em outro banco não basta. Sem confirmação do
canal/projeto, não executar. Produção conhecida possui a função e seria recusada,
mas esse guard não é um identificador universal de projeto.

Guards exigem executor postgres, nenhum overload homônimo, tipos/nullabilidade
das sete colunas usadas, owner/RLS dos pais e fingerprints de constraints,
triggers/policies medidos no QA. Drift aborta; não atualizar hashes para passar.
ACL da função recusa qualquer grantee direto além de postgres/serviço e grant
option indevida ao serviço, inclusive por default ACL. Não muda defaults globais.

Atributos conferidos: parâmetros sem defaults/variadic, retorno, linguagem,
owner/corpo, SECURITY DEFINER, volatilidade, search_path, STRICT=false,
parallel=unsafe, leakproof=false e returns-set=false. Não se afirma equivalência
de todo campo interno de pg_proc. O recibo inclui o hash do corpo; a verificação
SQL é obrigatória e confere o corpo exato.

Há advisory lock de coordenação e ACCESS SHARE nos dois pais, com lock_timeout
local de 3 s. Não se promete mais statement_timeout de 20 s: a gestão externa do
endpoint não foi medida. Advisory não bloqueia DDL de agentes que o ignorem;
coordenar janela sem DDL concorrente. O lock não congela escrita de clientes.

Pré/pós dentro do DO preservam estes nove objetos backend: clientes, execucoes,
criativos, campanhas_meta, metricas_diarias, respostas_do_dono,
execucoes_de_rotina, perguntas_apresentadas e campanhas_criacao, mais
meta_connections/ad_accounts. Comparam estrutura/owner/ACL de tabela/coluna,
defaults, constraints/índices, triggers e hash de handlers, RLS/policies,
permissões efetivas dos três papéis; default ACL global e ledger version/name.
Mudança no catálogo protegido fora da função aborta o DO. Não é auditoria de todo
catálogo nem do campo statements do ledger.

Metadados QA de 07/11 reconfirmaram nos nove objetos owner postgres, RLS ativa,
zero policies, serviço SELECT-only, sem permissões anon/auth/PUBLIC; guards
também verificam ACL de coluna. Isso não torna a credencial globalmente read-only.
As entradas novas do endpoint surgem **fora do delta SQL do DO**: snapshots
internos não escrevem/normalizam ledger; comparação externa PRE/PÓS permite
somente a adição nominal aprovada, seja ela registrada antes ou depois do DO
pelo endpoint. Nenhuma entrada anterior pode mudar.

Sem leitura de linhas backend/Auth/Vault, tokens ou .env. Serviço/Meta QA
37f082b62c06 é contexto do 07/08, não alvo de mudança. Nenhum POST Meta/provedor,
job, flag ou serviço foi tocado.

## Backup privado e ato futuro — ainda pendentes

**Backup real não capturado. Aplicação não autorizada.**

1. Após revisão, Victor autoriza nominalmente backup privado + U1 no QA pelo
   hash final e aceita a **nova entrada nominal de migration**. Coordenar janela
   sem DDL e sem chamar a nova função até concluir verificações.
2. Executar u1-preflight.sql somente por execute_sql com project_id QA. Guardar
   receipt integral em destino privado fora do repo, acesso restrito a Victor,
   junto de data BRT/UTC, project_id, hashes e definições/ACL dos pais. Confirmar
   target_overloads vazio e ausência do nome U1 no ledger. Guardar SHA-256 e
   ler de volta. O pacote de metadados atual **não é backup do instante futuro**.
3. Backup do alvo é prova de ausência (não existe definição antiga). U1 não
   altera dados: nenhuma linha de aplicação é afetada pela aplicação DDL e
   nenhum dump de clientes é necessário. Não copiar Vault/Auth/chaves ou dump
   global. Se o delta exigir DML, parar e preparar outro backup autorizado.
4. Executar uma única apply_migration com os quatro campos especificados acima.
   Não concatenar outros SQL, controlar transação externamente ou inserir ledger
   à mão. Se PRE divergir, não executar/ajustar silenciosamente.
5. Executar u1-verificar.sql e o único SELECT de u1-pos.sql por execute_sql QA;
   guardar receipt PÓS e hashes privadamente. Comparar catálogo protegido
   desconsiderando apenas ledger_metadata para a igualdade estrutural; nele,
   exigir preservação exata dos pares version/name e exatamente uma nova
   entrada U1. Usar conferirRecibos(pre,pos,'apply') do comparador local.
   A assinatura/corpo/ACL deve passar também pela verificação SQL.
6. Somente a Central conclui o aceite. U1 não torna pnpm conferir inteiro verde;
   nenhuma reconexão funcional ou outra unidade está autorizada por este ato.

### Falha, commit incerto e retorno

- Erro do endpoint: contrato oficial prevê rollback; confirmar por captura QA.
  Não mandar COMMIT/ROLLBACK por outra chamada presumindo a mesma sessão.
- Erro de rede/resultado incerto: capturar catálogo/ledger antes de qualquer
  retry. Ausência do alvo + ledger intacto = não aplicado; alvo exato + uma
  nova entrada nominal + catálogo intacto = aplicado. Verificação SQL obrigatória.
  Função sem registro, registro sem função, nome duplicado ou qualquer drift
  são estados **inconclusivos/anômalos**: parar, sem retry/repair automático.
- Retorno autorizado: capturar estado atual; chamar apply_migration com o nome
  de retorno e u1-retornar.sql. Exige função idêntica e nenhum dependente;
  DROP RESTRICT recusa dependências. Depois capturar receipt e comparar
  conferirRecibos(preRetorno,posRetorno,'return'): alvo ausente, histórico U1
  preservado e exatamente uma nova entrada de retorno.
- Retorno preserva dados posteriores e não desfaz eventual uso da função depois
  da aplicação. Não regravar snapshot antigo por cima de linhas atuais. Corpo
  alterado/dependente novo exige outra revisão. Não apagar ledger de aplicação.
- Nenhuma restauração global automática. [Backup de banco](https://supabase.com/docs/guides/platform/backups)
  não cobre objetos Storage e restaurar estado antigo pode perder mudanças novas.
  Storage não é tocado por esta unidade.

## Ensaio final executado e limites

Comando: node --test docs/qa/reconciliacao-schema-07-11/ensaio-u1.mjs.
**15/15 PASS**, zero falhas; **13.698,5721 ms** na rodada final. PostgreSQL
18.3/PGlite 0.5.8 instalado, distinto do QA 17.11; zero instalação/rede/credenciais.
SQL final de aplicação/retorno/verificação executado sem remoção de guards.

Cobriu os controles anteriores: sucesso/retorno, pais divergentes, overloads
public/private, objeto prévio/retry, ACL backend indevida, alteração fora do
delta com rollback, owner/default grants/grant option/STRICT adulterados,
dependente posterior e executor incorreto. PRE/PÓS completos deram **um único
recibo JSON**. Modelo local de transação gerida ensaiou ledger antes e depois
do DO, aplicação+retorno com registros novos e histórico preservado; falha
rollbackou também registro antecipado na fixture. Comparador recusou histórico
alterado, entrada extra, função/ledger desencontrados.

O modelo não substitui prova da implementação remota do endpoint. Policies e
handlers auxiliares são stubs de catálogo, sem homologação funcional. Nenhuma
RPC de negócio foi chamada (view de dependência criada e nunca consultada).
Os dados fictícios dos pais/backend permaneceram intactos. Em rodadas iniciais
foram corrigidas ambiguidade SQL e diferença NOT NULL do PG18: contype=n sai do
hash de constraints, com nullabilidade conferida à parte e preservada no snapshot.

Resultados anteriores 10/10 independentes e 2/2 dirigidos pertencem a versões
anteriores do pacote. Não os apresentar como aceite independente dos novos
payloads/canal. Hashes finais em SHA256SUMS.txt. Runtime, manifesto, package,
migrations oficiais, flags e configurações não alterados. Aguardando somente
revisão independente e eventual autorização nominal futura. Encerrado.

