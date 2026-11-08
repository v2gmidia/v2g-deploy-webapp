# N26 — 19 divergências de schema antes do push — 07/11/2026

## Veredito

**A classificação está concluída; o impedimento de `pnpm conferir` continua. Não há aceite para push neste parecer.** `CLAUDE.md:153` exige a suíte limpa antes de commitar. Histórico, flags OFF e sucesso de build não tornam a suíte verde. O conferidor de migrations não foi afrouxado ou alterado.

O alvo original foi **QA `zskpijnqgkqwxksqmzmf`**. A saída original imprime `banco: zskpijnqgkqwxksqmzmf.supabase.co`, 38 tabelas/29 funções, 19 falhas/186 objetos/143 itens fora do alcance. As falhas são **19 grupos de migration**, contendo **53 objetos ausentes**, não 19 objetos individuais. A comparação de catálogo confirmou essas 53 ausências em QA. Dos mesmos 53, **27 estão presentes em produção e 26 ausentes**, estes últimos distribuídos em 8 grupos. Trocar para produção não resolveria a regra atual.

Somente foi criado este documento. Sem alterações em SQL, runtime, testes, manifesto, package, flags ou configuração; sem leitura de valores de .env/chaves/tokens, sem dados de clientes, backup, aplicação, escrita de banco, commit, push ou deploy. Não se repetiram suítes. As correções dos testes são do 03/04/05/06 e não fazem parte deste parecer.

## Fontes e alcance

- **S0 — saída original:** chat Central `01a1b160-1ffe-7760-89c9-a03b8fec171c`, turno `01a1b849-7971-72d2-bde0-94e9576c1285`, execução `exec-9618c672-ba2a-4dfb-88f3-4727a6e14798` (`pnpm conferir`, exit 1). Extraída da saída completa registrada, sem executar novamente nem abrir .env. Ledger CLI estava DESLIGADO por falta de link; isso não é evidência de ledger vazio.
- **S1 — instrumento:** `scripts/conferir-migrations.ts:94` combina .env.local com process.env (este vence); `:115` faz GET `/rest/v1/` com credencial de serviço; `:129`/`:133` extraem definições e RPCs; `:208`/`:221` agrupam falha por migration. `:230` enumera os limites. Não confundir ambiente do processo local com banco local.
- **Q1/Q2 — medição atual:** Supabase conectado, `list_projects` confirmou QA e **V2G-SITE `ushccxpoxjikzqnwhgfd`** distintos; duas consultas `execute_sql` somente leitura, em **07/11/2026, aproximadamente 20:20–20:24 BRT**, sobre `pg_class`, `pg_attribute`, `pg_namespace`, `pg_proc` e `has_*_privilege`. Nenhuma tabela de aplicação foi consultada. Foram comparados os **77 objetos declarados nos 19 grupos**, incluindo 24 já presentes no QA, para evitar tratar migration inteira como ausente. Não se executaram RPCs.
- **H — origem Git:** HEAD `cb87775b29d2b8710586a83ca3144ff6a7777815`. `git show HEAD:supabase/objetos.ts` e diff local confirmam os grupos 1–18 já declarados em HEAD; o grupo 19 é adição local atual. A nova migration de piloto também é local, mas não está entre as 19 falhas (seus dois objetos apareceram em S0). A entrada de referência pública criativa só adiciona limites fora do alcance, sem objeto conferível.
- **Documentação oficial:** [OpenAPI e privilégios do chamador](https://supabase.com/docs/reference/javascript/getopenapispec), consultada pelo conector em 07/11: o documento da API é filtrado pelos privilégios do papel. [Schemas expostos](https://supabase.com/docs/guides/api/using-custom-schemas). O changelog markdown não pôde ser lido pela ferramenta web (tipo de conteúdo); não houve implementação de funcionalidade Supabase neste bloco.

**Legenda da tabela:** A = AUSENTE fisicamente no schema esperado `public`, confirmado em Q1/Q2; P = PRESENTE no catálogo. Foram procurados homônimos também em `private`, sem correspondência para os objetos deste recorte. P não certifica corpo/versão da função, índices, constraints, policies ou comportamento. Exposição PostgREST atual da produção = **NÃO MEDIDA**; não foi buscada chave para medi-la. Nas ausências QA de S0, o catálogo confirma ausência física, portanto nenhuma das 19 pode ser reclassificada como mero objeto oculto por ACL. Flags/configurações remotas atuais = **NÃO MEDIDAS**, apenas os guards no código foram inspecionados.

## Tabela dos 19 grupos

Em cada linha, a coluna Objetos lista **somente os ausentes em S0**. A coluna QA/prod vale para cada objeto listado, exceto ressalva explícita. `M:n` é a linha de `supabase/objetos.ts` que inicia a declaração; a própria migration é a fonte do ACL pretendido. Todas as linhas têm medição Q1/Q2 na data acima.

| # / grupo / origem | Objetos de S0 | QA / produção | Instrumentação e ACL | Dependência e efeito no lote publicado OFF |
|---|---|---|---|---|
| 1. `0006_conectar_meta.sql` — H; M:151 | RPC `marcar_conexao_meta_quebrada` | A / P | Em produção EXECUTE serviço sim, anon/auth não; assinatura `(uuid,text,text)`. Em QA não existe; não é ocultação. `conectar_meta` está presente nos dois. | Caminho já existente em `app/(fluxo)/conectar/escolher/page.tsx:70`, ao tratar conexão inválida. QA não homologa esse ramo. Nenhuma dependência nova de loading; produção contém o objeto. |
| 2. `0008_publicar_campanha.sql` — H; M:167 | `campaigns.{publish_key,publish_error,publish_started_at,external_adset_id,daily_budget_cents}`; `creatives.external_image_hash`; `ad_accounts.{min_daily_budget_cents,min_budget_checked_at}`; `businesses.{geo_lat,geo_lng}` | A / P (10/10) | Relações-pai existem e serviço tem SELECT nos dois; colunas faltam no QA. Presença de tabela/colunas não mede triggers/limites. | Nem tudo é código morto: `app/(fluxo)/verba/page.tsx:34` lê geo_lat e `verba/actions.ts:40` lê piso Meta. Parte campaigns pertence ao caminho antigo. Não reaplicar arquivo inteiro; QA tem lacuna real de verba/geografia, anterior ao lote. |
| 3. `0010_perfil_empresa.sql` — H; M:218 | `pessoas_do_negocio`, `entrevistas`, `creatives.pessoa_id` | A / P (3/3) | Produção com RLS nas relações; serviço SELECT sim. Outras 11 declarações do grupo já existem em QA: grupo parcialmente aplicado/compatível, não inteiramente ausente. | `lib/perfil/revisao-cliente.ts:162` e `lib/agentes/proposta.ts:62` usam entrevistas. QA não prova essa leitura; produção possui esses objetos. Não é dependência nova de loading. |
| 4. `0012_propostas_de_perfil.sql` — H; M:252 | `propostas_de_perfil`, `itens_da_proposta` | A / P (2/2) | Em produção RLS sim, SELECT serviço sim, anon/auth não. Não abrir ACL do cliente para satisfazer OpenAPI. `businesses.dados_ficticios` já existe em QA. | `lib/agentes/proposta.ts:75`/`:83`, revisão `:67`/`:89`: proposta/revisão já existentes. QA desse módulo indisponível; sem nova exigência do loading. |
| 5. `0013_aplicar_proposta.sql` — H; M:261 | RPC `aplicar_proposta` | A / P | Produção EXECUTE serviço sim, anon/auth não; `(uuid,text)`. Falta física QA. | `lib/agentes/revisao.ts:318`: aplicação de proposta não pode ser homologada no QA atual. Nenhuma nova chamada no lote OFF. |
| 6. `0018_disparo_do_pipeline.sql` — H; M:292 | `businesses.cadastro_erro` | A / P | Pai existe/RLS ativo/SELECT serviço sim; coluna QA ausente. `cadastro_estado` e `cadastro_iniciado_em` presentes nos dois. | `lib/pipeline/disparar.ts:178` e `:518` gravam a coluna; ramo de disparo/retorno de erro QA não está conciliado. Não disparado nem testado por este parecer. Produção possui coluna. |
| 7. `0019_escrever_apenas_se_livre.sql` — H; M:301 | `divergencias_de_cadastro`, RPC `escrever_apenas_se_livre` | A / P (2/2) | Produção RLS/SELECT serviço; RPC EXECUTE serviço sim, anon/auth não. | `lib/cadastro/montar.ts:479` registra inexistência de chamador TypeScript da RPC; busca no runtime só encontrou esse comentário. Não é requisito novo de loading; corpo/uso externo não auditados. |
| 8. `0021_exclusao_de_dados_da_meta.sql` — H; M:322 | `exclusoes_de_dados`; RPCs `desautorizar_meta`, `apagar_dados_da_meta`, `status_da_exclusao` | A / P (4/4) | Produção: tabela RLS/SELECT só serviço entre os papéis medidos; duas mutações EXECUTE só serviço; status EXECUTE anon/auth/serviço. ACL de status é intencional, não abrir mutações. | Rotas reais `app/auth/meta/desautorizar/route.ts:46`, `exclusao-de-dados/route.ts:82` e status público `app/(public)/exclusao-de-dados/[codigo]/page.tsx:58`. Bloqueia homologar esses callbacks no QA; produção contém objetos. Não é modificação deste lote. |
| 9. `0022_whatsapp_do_anuncio.sql` — H; M:339 | `businesses.whatsapp_do_anuncio` | A / P | Pai existe/RLS/SELECT serviço; ausência de coluna QA confirmada. | Busca app/lib encontrou referência apenas em bancada dev `app/exemplo/_onboarding/destino.ts:128`. Sem nova dependência de runtime publicada identificada; não comprova uso externo. |
| 10. `0024_ativacao_de_campanha.sql` — H; M:358 | `campaigns.ativando_em` | A / P | Quatro outras colunas do grupo estão presentes no QA. A API não mede índice parcial/corpo. | Manifesto comenta caminho antigo sobre campaigns sem escritor de ativação (`supabase/objetos.ts:358`, comentário no mesmo grupo). Não é a prova de Meta QA do backend; sem requisito novo do loading. |
| 11. `0025_entrevista_sem_transcricao.sql` — H; M:390 | `entrevistas.transcricao` | A / P | Em QA falta a relação inteira (linha 3); não é falha independente de permissão da coluna. | `lib/agentes/proposta.ts:63` lê transcrição; indisponibilidade QA acompanha linha 3. Produção possui campo. |
| 12. `20261007160925_revops_v0.sql` — H; M:504 | Tabelas `revops_people`, `revops_prospect_organizations`, `revops_opportunities`, `revops_opportunity_people`, `revops_source_references`, `revops_interactions`, `revops_interaction_opportunities`; RPCs `revops_register_interest`, `revops_register_interaction` | A / A (9/9) | ACL pretendido: default deny/servidor; objetos ausentes não têm ACL para corrigir. Não dar grant em substituição à criação revisada. | `/revops` exige autorização própria (`lib/revops/autorizacao.ts:13`), não apenas operador. Página captura falha (`app/(internal)/revops/page.tsx:18`). Não é flag OFF; concessões reais não medidas. Bloqueia usar/homologar RevOps, não constitui dependência nova do loading. |
| 13. `20261013060000_competencia_documento_fiscal.sql` — H; M:564 | `fiscal_obligations`, `fiscal_documents.obligation_id` | A / A (2/2) | `fiscal_documents` existe nos dois, RLS e SELECT serviço; coluna/relação nova não. Índice/FK composta não vistos pela API. | Nenhum acesso literal a fiscal_obligations/obligation_id encontrado em app/lib TS/TSX. `lib/contratacao/competencias-fiscais.ts:35` prepara distribuição; não prova escrituração remota. Não necessário ao comprovante/espera; bloqueia certificar processo fiscal automático futuro. |
| 14. `20261021001651_creative_generation_requests.sql` — H; M:657 | `creative_generation_requests` | A / A | SQL `:38` revoga; `:39` SELECT authenticated e `:41` INSERT em colunas, com RLS por dono. Ausência não deve ser corrigida abrindo API. | Flag `V2G_CREATIVE_REQUESTS_ENABLED` controla leitura da página (`app/(protected)/criativos/page.tsx:93`) e action (`geracao-actions.ts:27`/`:49`). OFF no código dispensa consulta; valor remoto não medido. Loading atual não requer ativação, mas pedidos reais dependem desta tabela. |
| 15. `20261022152629_asaas_estados_processamento.sql` — H; M:692 | RPC `evento_asaas_impede_confirmacao` | A / A | SQL `:12`–`:13`: EXECUTE serviço, não anon/auth; usada por corpo SQL de conciliação `:77`. Presença dos RPCs antigos não prova versão atual do corpo. | Não é nova chamada TypeScript pelo nome. Bloqueia certificar tratamento completo de ocorrências financeiras/3DS; novas compras/processamento produtivos ficam atrás de flags e readiness. Publicação OFF não executa esse fluxo; não afirmar que o Sandbox já recebeu essa proteção SQL. |
| 16. `20261022200400_manual_contract_evidence.sql` — H; M:697 | `commercial_manual_evidence`; RPCs `registrar_evidencia_manual`, `revisar_evidencia_manual` | A / A (3/3) | SQL `:29`–`:33` grants restritos de servidor; `:114`–`:117` EXECUTE só serviço. Nenhum objeto físico presente para simples GRANT. | Sem flag global: operador que escolhe negócio chega à consulta `app/(protected)/pedidos/ConferenciasManuais.tsx:19`; catch `:47` informa indisponibilidade e não altera acesso. Bloqueia funcionalidade documental, embora não seja chamada nova do loading. Não rotular esse módulo como ativo/funcional OFF. |
| 17. `20261025215302_cpf_cnpj_contratante_v0.sql` — H; M:706 | `commercial_orders.contractor_document_type`, `onboarding_meetings.contractor_document_type`, `commercial_manual_evidence.contractor_document_type`; RPC `documento_contratante_valido` | A / A (4/4) | Pais commercial_orders presentes nos dois; onboarding_meetings presente QA/ausente produção; evidence ausente nos dois. SQL `:35`–`:36` EXECUTE serviço; colunas geradas/triggers/checksum não se certificam por API. | Validação de CPF no código não comprova aceitação pelo banco. Bloqueia homologação CPF/agenda/evidência e cadeia de readiness produtivo. OFF evita compra nova; dependências compartilhadas exigem revisão individual, nunca aplicação da pasta inteira. |
| 18. `20261104040711_historical_contract_access.sql` — H; M:721 | `historical_contract_access`, `historical_contract_access_events`; RPCs `emitir_acesso_contratado`, `aceitar_acesso_contratado`, `revogar_acesso_contratado` | A / A (5/5) | SQL `:46`–`:51`: tabela de grants SELECT do próprio usuário e de serviço; eventos só serviço; concessão/revogação pelas funções. Não confundir titularidade/cookie com permissão. | Guard `V2G_HISTORICAL_ACCESS_ENABLED` e retorno antes da consulta (`lib/contratacao/acesso-contratado.ts:6`, `:18`). Código OFF retorna lista vazia. Bloqueia ativar acesso histórico; não deve ser ligado para publicar loading. |
| 19. `20261105194728_public_checkout_production_readiness.sql` — **atual local**, M:740 | RPC `checkout_producao_schema_v1` | A / A | Nova verificação SQL e grants de cadeia; `supabase/migrations/20261105194728_public_checkout_production_readiness.sql:19`. Não chamar/escrever neste bloco. | `lib/contratacao/provedor-compra.ts:26` só chama após habilitar processamento produtivo; ausência/falha nega. `app/contratar/page.tsx:16`–`:18` fecha antes da página; flags `ambiente-producao.ts:12`/`:34`. Não impede carregar código OFF por si, mas **adiciona uma falha à conferência obrigatória** e bloqueia abrir checkout produtivo. |

## Interpretação para publicação e ativação

**Runtime:** os grupos 1–11 são lacunas do QA frente à produção, todos anteriores a este lote. Alguns atingem caminhos reais (conexão inválida, verba/geografia, disparo, propostas e callbacks Meta); não podem ser descartados em homologação QA como meros nomes históricos. Os grupos 12–18 também já estavam em HEAD, com objetos realmente ausentes nos dois ambientes. Só os grupos 14/18 e o fluxo produtivo da linha 19 têm os guards OFF citados; RevOps é autorização nominal e evidência manual é degradação explícita, não flags OFF.

**Regra do repositório:** as **19** linhas bloqueiam a conferência QA atual, independentemente da classificação funcional. Não há alvo alternativo comprovado que deixe o manifesto atual inteiramente verde; produção também tem pelo menos os 8 grupos 12–19 ausentes, sem contar outros grupos não auditados neste recorte. Os 18 grupos anteriores continuariam divergindo mesmo se a nova readiness não entrasse. Não se executou `pnpm conferir` contra produção nem se modificou o alvo.

**Ativação:** faltas financeiras/documentais/fiscais não autorizam ativar compra, CPF, conciliação nova, contratação histórica, emissão fiscal ou pedidos criativos. Este parecer não certifica controles por corpo SQL, acesso com sessão real ou flags remotas. As 143 condições fora do alcance continuam fora do alcance do verificador original; não são 143 falhas adicionais nem 143 condições aprovadas por estas duas consultas.

**Menor ato humano seguinte:** a Central apresenta esta matriz e mantém o push geral bloqueado pela regra vigente. Victor decide entre (a) autorizar, em bloco separado, reconciliação por objeto/unidade no QA com plano de backup, compatibilidade/ACL e rollback, seguida da conferência obrigatória; ou (b) instruir explicitamente uma exceção delimitada à exigência de suíte limpa/escopo de publicação, reconhecendo a saída vermelha — isso não torna o teste verde nem autoriza ativação. Nenhuma dessas decisões é inferida deste trabalho. Metadados estão disponíveis: o impedimento principal é estado real do schema, não falta de acesso para investigar.

## Evidência reproduzível e apoio backend

### Preparação seguinte recebida pela Central

O [pacote de reconciliação](../qa/reconciliacao-schema-07-11/README.md) organiza
os 19 grupos/53 ausências em seis unidades sem sobreposição. Apenas U1 tem SQL
exato preparado: cria a função `marcar_conexao_meta_quebrada` ausente no QA.
Aplicação futura definida por `apply_migration`, com uma nova entrada nominal
e preservação do histórico anterior; capturas PRE/PÓS devolvem recibo JSON único.
A Central revisou o pacote final e repetiu o ensaio descartável: **15/15 PASS**;
os **12 hashes** do manifesto conferiram. Nenhum runtime, banco ou configuração
foi alterado nessa preparação. Backup real e aplicação U1 permanecem pendentes
de autorização específica. Isso não remove as divergências nem libera o push.

### Conferência agregada dos testes pela Central

No mesmo bloco, 03/04 corrigiu as seis falhas somente em testes e no helper
isolado: interface 7/7 e recepção 14/14. A verificação agregada da Central
após as correções passou **71/71**, incluindo interface, recepção, recuperação,
retorno do login Meta e checkout produtivo fictício. O 05/06 corrigiu a
verificação antiga do timeout e a fixture de CSS do retorno do login, sem
alterar o aplicativo: `pnpm conferir:analise` passou **46/46**, com controles
negativos e estouro do helper real. `pnpm typecheck` e `git diff --check`
passaram. A Central também executou separadamente as 31 etapas posteriores
ao conferidor de migrations: 30 passaram na primeira execução e a análise
passou após a correção descrita. O build já havia passado e nenhum runtime
foi modificado neste bloco. Isto fecha os testes locais diagnosticados;
**não torna `pnpm conferir` verde**, pois a divergência física do schema
documentada acima permanece. Nenhuma alteração de banco foi realizada.

As duas consultas usaram uma CTE `expected(migration,kind,table_name,name)` com as 77 declarações dos 19 grupos do manifesto. Para relações, procuraram `pg_class JOIN pg_namespace`, schema public/private e relkind r/p/v/m/f; para colunas, `pg_attribute` com `attnum>0 AND NOT attisdropped`; para funções, `pg_proc JOIN pg_namespace` por nome e assinatura `oid::regprocedure`. Retornaram RLS e privilégios SELECT/EXECUTE de anon/authenticated/service_role. Nada chamou funções de negócio. A contagem consolidada: QA 24 presentes/53 ausentes; produção 51 presentes/26 ausentes. Não é inventário completo dos 186 objetos ou comparação de todos os corpos.

Para repetir somente a parte física de um item, sem dados de aplicação:

```sql
-- Relação (substituir nomes pelo item da tabela):
select n.nspname, c.relname, c.relrowsecurity,
       has_table_privilege('service_role', c.oid, 'SELECT') as service_select
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private') and c.relname='commercial_manual_evidence'
  and c.relkind in ('r','p','v','m','f');
-- Coluna: mesma relação e pg_attribute.attrelid=c.oid,
-- attname exato, attnum>0, not attisdropped.
-- RPC: pg_proc.proname exato, namespace e oid::regprocedure;
-- has_function_privilege(role, oid, 'EXECUTE') para os três papéis.
```

O apoio 07/08 recebido via Central em 07/11 distingue a reconciliação das nove unidades backend QA (baseline `20261022200154` e complementos `20261026151322`, `20261026151822`, `20261026153101`, `20261026153128`, `20261026154234`, `20261026154345`, `20261026154408`, `20261026154442`) do schema WebApp. Essa aplicação e a prova Meta backend `37f082b62c06` não certificam estes 19 grupos, não abrem compra e não autorizam reaplicação pelo hash de arquivos. Nenhuma nova consulta Meta foi feita. Bloco encerrado com esta matriz; decisão do conjunto e conferência final pertencem à Central.
