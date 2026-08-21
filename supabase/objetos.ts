/**
 * O que cada migration CRIA — o manifesto que o conferidor pergunta ao banco.
 *
 * Desenho em `docs/conferidor-de-migrations.md`. A medição que fez isto
 * existir está em `docs/migration-no-repo-nao-e-migration-aplicada.md`.
 *
 * ============================================================
 * POR QUE POR OBJETO, E NÃO POR NOME
 *
 * Arquivo commitado e cadeia aplicada são dois estados independentes. Nada
 * no repositório sabe qual migration rodou; nada no banco sabe qual arquivo
 * existe. Foi assim que uma migration do backend ficou 13 dias sem rodar,
 * com o modelo já declarando as colunas dela — e ninguém suspeitou, porque
 * o arquivo estava lá, versionado e revisado.
 *
 * E comparar por NOME não resolve: das 22 linhas do ledger, 19 entraram sem
 * o prefixo numérico e pelo menos 2 com o nome trocado. Um conferidor por
 * nome dá alarme falso, e alarme falso repetido é como se aprende a ignorar
 * o conferidor.
 *
 * `esvaziar_campos_do_cliente` existir prova a 0017 aplicada melhor que
 * qualquer linha de ledger.
 * ============================================================
 *
 * POR QUE O MANIFESTO NÃO MORA DENTRO DO `.sql`
 *
 * Migration aplicada é registro histórico — a 0009 existe só "para o
 * histórico bater com o banco". Editar 20 arquivos já aplicados para
 * acrescentar metadado transforma histórico em arquivo vivo, e a próxima
 * pessoa não sabe mais o que era original.
 *
 * O preço é este arquivo poder envelhecer. O conferidor cobra isso:
 * arquivo sem entrada aqui, ou entrada sem arquivo, derruba o
 * `pnpm conferir`.
 * ============================================================
 */

export type Objeto =
  /** tabela no schema `public`, como o PostgREST a expõe */
  | { tipo: "tabela"; nome: string }
  | { tipo: "coluna"; tabela: string; nome: string }
  /** função exposta em `/rest/v1/rpc/<nome>` */
  | { tipo: "rpc"; nome: string }
  /**
   * Função que TEM QUE NÃO ESTAR exposta.
   *
   * Objeto ausente é prova tão boa quanto presente, e para a 0002 é a única
   * disponível: ela move `owns_business` e `handle_new_user` para o schema
   * `private` justamente para elas sumirem do PostgREST. Se aparecerem na
   * lista de RPC, a migration não está aplicada.
   */
  | { tipo: "rpc_ausente"; nome: string };

export interface MigrationDeclarada {
  arquivo: string;
  /** O que este arquivo cria e este instrumento consegue ver. */
  cria: Objeto[];
  /**
   * Objetos que existem no banco mas que este arquivo NÃO cria.
   *
   * Só a 0009 usa. Ver o comentário lá — é um achado, não um detalhe.
   */
  documenta?: Objeto[];
  /**
   * O que este arquivo faz e este instrumento NÃO alcança, em texto.
   *
   * ============================================================
   * ESTE CAMPO É O QUE FAZ O CONFERIDOR VALER.
   *
   * A especificação do PostgREST mostra tabela, coluna e RPC. Ela não
   * mostra índice, constraint, trigger, policy de RLS, grant, corpo de
   * função, nem nada fora do schema `public`.
   *
   * Um conferidor que confere 60% e imprime "TUDO CERTO" é pior que
   * nenhum: produz confiança que não corresponde a nada. Por isso cada
   * migration diz o que fica de fora, e o conferidor imprime a contagem
   * disso JUNTO do verde.
   *
   * Lista vazia aqui é afirmação — significa "esta migration não faz mais
   * nada além do que está em `cria`". Não use como default.
   * ============================================================
   */
  foraDoAlcance: string[];
}

export const MIGRATIONS: MigrationDeclarada[] = [
  {
    arquivo: "0001_init.sql",
    cria: [
      { tipo: "tabela", nome: "profiles" },
      { tipo: "tabela", nome: "businesses" },
      { tipo: "tabela", nome: "meta_connections" },
      { tipo: "tabela", nome: "ad_accounts" },
      { tipo: "tabela", nome: "analysis_runs" },
      { tipo: "tabela", nome: "offers" },
      { tipo: "tabela", nome: "campaigns" },
      { tipo: "tabela", nome: "creatives" },
      { tipo: "tabela", nome: "metrics_daily" },
      { tipo: "tabela", nome: "decisions" },
      { tipo: "rpc", nome: "list_orphan_businesses" },
      { tipo: "rpc", nome: "claim_businesses" },
    ],
    foraDoAlcance: [
      "as policies de RLS das 10 tabelas (RLS ligado desde a primeira linha)",
      "os índices e as foreign keys",
      "os triggers `set_updated_at` e `on_auth_user_created`",
      "`set_updated_at`, `owns_business` e `handle_new_user` — a 0002 as tirou do `public`",
    ],
  },
  {
    arquivo: "0002_harden_security_definer_functions.sql",
    cria: [
      // A conferência PELA AUSÊNCIA. Ver o tipo `rpc_ausente`.
      { tipo: "rpc_ausente", nome: "owns_business" },
      { tipo: "rpc_ausente", nome: "handle_new_user" },
    ],
    foraDoAlcance: [
      "o schema `private` em si, e os `revoke` de execute sobre ele",
      "`claim_businesses` continua em `public` de propósito — está conferida na 0001",
    ],
  },
  {
    arquivo: "0003_restrict_meta_connections_token_column.sql",
    cria: [],
    foraDoAlcance: [
      "TUDO: a migration é só `revoke`/`grant` de coluna em `meta_connections`",
      "o efeito (`select=*` devolver 403 para authenticated) só se mede com uma sessão de cliente, e não há sessão nesta máquina",
    ],
  },
  {
    arquivo: "0004_avg_ticket_como_faixa.sql",
    cria: [
      { tipo: "coluna", tabela: "businesses", nome: "avg_ticket_min" },
      { tipo: "coluna", tabela: "businesses", nome: "avg_ticket_max" },
    ],
    foraDoAlcance: ["a remoção da coluna `avg_ticket` antiga (ausência de coluna não é conferida)"],
  },
  {
    arquivo: "0005_oauth_meta_conexao.sql",
    cria: [
      { tipo: "coluna", tabela: "ad_accounts", nome: "ownership" },
      { tipo: "coluna", tabela: "ad_accounts", nome: "status" },
      { tipo: "coluna", tabela: "meta_connections", nome: "meta_user_id" },
      { tipo: "coluna", tabela: "meta_connections", nome: "scopes" },
      { tipo: "coluna", tabela: "meta_connections", nome: "last_error" },
      { tipo: "coluna", tabela: "meta_connections", nome: "instagram_account_id" },
    ],
    foraDoAlcance: ["os checks de domínio das colunas novas"],
  },
  {
    arquivo: "0006_conectar_meta.sql",
    cria: [
      { tipo: "rpc", nome: "conectar_meta" },
      { tipo: "rpc", nome: "marcar_conexao_meta_quebrada" },
    ],
    foraDoAlcance: [
      "o corpo das duas funções e o `grant execute` a `service_role`",
      "É esta que entrou no ledger como `conectar_meta_chamavel_por_service_role` — o nome trocado que motivou conferir por objeto",
    ],
  },
  {
    arquivo: "0007_obter_token_meta.sql",
    cria: [{ tipo: "rpc", nome: "obter_token_meta" }],
    foraDoAlcance: ["o Vault e o segredo guardado nele — fora do schema `public`"],
  },
  {
    arquivo: "0008_publicar_campanha.sql",
    cria: [
      { tipo: "coluna", tabela: "campaigns", nome: "publish_key" },
      { tipo: "coluna", tabela: "campaigns", nome: "publish_state" },
      { tipo: "coluna", tabela: "campaigns", nome: "publish_error" },
      { tipo: "coluna", tabela: "campaigns", nome: "publish_started_at" },
      { tipo: "coluna", tabela: "campaigns", nome: "external_adset_id" },
      { tipo: "coluna", tabela: "campaigns", nome: "daily_budget_cents" },
      { tipo: "coluna", tabela: "creatives", nome: "external_image_hash" },
      { tipo: "coluna", tabela: "creatives", nome: "status" },
      { tipo: "coluna", tabela: "ad_accounts", nome: "min_daily_budget_cents" },
      { tipo: "coluna", tabela: "ad_accounts", nome: "min_budget_checked_at" },
      { tipo: "coluna", tabela: "businesses", nome: "geo_lat" },
      { tipo: "coluna", tabela: "businesses", nome: "geo_lng" },
      { tipo: "coluna", tabela: "businesses", nome: "geo_key" },
      { tipo: "coluna", tabela: "businesses", nome: "geo_label" },
      { tipo: "coluna", tabela: "businesses", nome: "geo_resolved_at" },
    ],
    foraDoAlcance: ["o índice único de `publish_key` e os defaults"],
  },
  {
    arquivo: "0009_backend_execucoes_criativos.sql",
    cria: [],
    // ============================================================
    // ESTE ARQUIVO NÃO CRIA NADA. 13 linhas, zero DDL.
    //
    // Ele existe "para o histórico bater com o banco" (palavras do próprio
    // cabeçalho): as três tabelas vieram do projeto do Oregon na unificação
    // de 17/08, aplicadas fora desta cadeia.
    //
    // A consequência não estava escrita em lugar nenhum, e é séria:
    // **a cadeia de migrations deste repositório não reconstrói o banco.**
    // `supabase db push` contra um projeto vazio produz um schema sem
    // `execucoes`, `criativos` e `campanhas_meta` — e sem erro, porque não
    // há DDL para falhar.
    //
    // As três entram como `documenta`: o conferidor confere que existem (e
    // existem) e imprime que NÃO vieram deste arquivo. Escrever o DDL delas
    // a partir do schema vivo é lote próprio.
    // ============================================================
    documenta: [
      { tipo: "tabela", nome: "execucoes" },
      { tipo: "tabela", nome: "criativos" },
      { tipo: "tabela", nome: "campanhas_meta" },
    ],
    foraDoAlcance: [
      "o arquivo não tem DDL: nada nele pode ser conferido, porque nada nele cria",
      "a cadeia não é reprodutível do zero por causa dele — registrado, não resolvido",
    ],
  },
  {
    arquivo: "0010_perfil_empresa.sql",
    cria: [
      { tipo: "tabela", nome: "pessoas_do_negocio" },
      { tipo: "tabela", nome: "identidade_visual" },
      { tipo: "tabela", nome: "narrativa_negocio" },
      { tipo: "tabela", nome: "entrevistas" },
      { tipo: "rpc", nome: "registrar_procedencia" },
      { tipo: "rpc", nome: "procedencia_do_campo" },
      { tipo: "coluna", tabela: "businesses", nome: "cep" },
      { tipo: "coluna", tabela: "businesses", nome: "atende_somente_no_local" },
      { tipo: "coluna", tabela: "businesses", nome: "site_url" },
      { tipo: "coluna", tabela: "businesses", nome: "instagram_handle" },
      { tipo: "coluna", tabela: "businesses", nome: "procedencia" },
      { tipo: "coluna", tabela: "creatives", nome: "pessoa_id" },
      { tipo: "coluna", tabela: "creatives", nome: "uso" },
      { tipo: "coluna", tabela: "execucoes", nome: "business_id" },
    ],
    foraDoAlcance: [
      "`set_atualizado_em` — função de trigger, não exposta como RPC",
      "o check que fecha o domínio de `creatives.uso` (logo|identidade|campanha|referencia)",
      "os índices parciais e as policies das quatro tabelas novas",
    ],
  },
  {
    arquivo: "0011_procedencia_generalizada.sql",
    cria: [
      { tipo: "rpc", nome: "registrar_procedencia" },
      { tipo: "rpc", nome: "procedencia_do_campo" },
    ],
    foraDoAlcance: [
      "esta migration TROCA O CORPO de duas funções que a 0010 já tinha criado — a existência delas não distingue as duas versões",
    ],
  },
  {
    arquivo: "0012_propostas_de_perfil.sql",
    cria: [
      { tipo: "tabela", nome: "propostas_de_perfil" },
      { tipo: "tabela", nome: "itens_da_proposta" },
      { tipo: "coluna", tabela: "businesses", nome: "dados_ficticios" },
    ],
    foraDoAlcance: ["as policies das duas tabelas novas"],
  },
  {
    arquivo: "0013_aplicar_proposta.sql",
    cria: [{ tipo: "rpc", nome: "aplicar_proposta" }],
    foraDoAlcance: ["o corpo da função"],
  },
  {
    arquivo: "0014_identidade_do_negocio.sql",
    cria: [{ tipo: "coluna", tabela: "creatives", nome: "arquivado_em" }],
    foraDoAlcance: [
      "o índice único `creatives_um_logo_por_negocio` — é ele que garante um logo vigente por negócio, e é a parte que mais importa desta migration",
      "o índice parcial de identidade",
    ],
  },
  {
    arquivo: "0015_confirmacao_do_cliente.sql",
    cria: [{ tipo: "rpc", nome: "confirmar_campo_do_cliente" }],
    foraDoAlcance: ["a lista branca de colunas, que vive no corpo da função"],
  },
  {
    arquivo: "0016_lucro_desejado_na_lista_branca.sql",
    cria: [{ tipo: "rpc", nome: "confirmar_campo_do_cliente" }],
    foraDoAlcance: [
      "ESTA MIGRATION SÓ MUDA O CORPO: acrescenta `target_profit_per_customer` à lista branca, e corpo de função não é visível daqui",
      "a prova que existe é por evidência: o campo tem `procedencia = confirmado` gravada em 19/08 23:31:50, impossível fora da lista branca (docs/migration-no-repo-nao-e-migration-aplicada.md)",
    ],
  },
  {
    arquivo: "0017_esvaziar_campo_do_cliente.sql",
    cria: [{ tipo: "rpc", nome: "esvaziar_campos_do_cliente" }],
    foraDoAlcance: ["a lista de campos esvaziáveis, no corpo da função"],
  },
  {
    arquivo: "0018_disparo_do_pipeline.sql",
    cria: [
      { tipo: "coluna", tabela: "businesses", nome: "cadastro_estado" },
      { tipo: "coluna", tabela: "businesses", nome: "cadastro_iniciado_em" },
      { tipo: "coluna", tabela: "businesses", nome: "cadastro_erro" },
    ],
    foraDoAlcance: ["o check do domínio de `cadastro_estado`"],
  },
  {
    arquivo: "0019_escrever_apenas_se_livre.sql",
    cria: [
      { tipo: "tabela", nome: "divergencias_de_cadastro" },
      { tipo: "rpc", nome: "escrever_apenas_se_livre" },
    ],
    foraDoAlcance: ["o corpo da função e as policies da tabela nova"],
  },
  {
    arquivo: "0020_execucoes_colunas_do_onboarding_por_call.sql",
    cria: [
      { tipo: "coluna", tabela: "execucoes", nome: "tem_site" },
      { tipo: "coluna", tabela: "execucoes", nome: "site_url" },
      { tipo: "coluna", tabela: "execucoes", nome: "tem_instagram" },
      { tipo: "coluna", tabela: "execucoes", nome: "instagram_handle" },
      { tipo: "coluna", tabela: "execucoes", nome: "resultado_campanhas_anteriores" },
    ],
    foraDoAlcance: [
      "esta é a irmã da migration do backend que ficou 13 dias sem rodar — o caso que gerou o conferidor",
    ],
  },
];
