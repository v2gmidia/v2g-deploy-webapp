# U2 — compatibilidade operacional e callbacks Meta — 07/11/2026

**Pacote LOCAL pronto para revisão; NÃO aplicado. Backup real NÃO realizado.**
Nenhuma consulta/escrita em produção, nenhuma chamada remota de negócio/Meta,
nenhum commit/push/deploy. Não autoriza U3 nem altera flags/jobs/serviços.

A U1 já aplicada é a de [20261108001903](../../../estado/n26-u1-qa-aplicada-07-11.md),
não uma nova execução do pacote antigo. Seus **12 arquivos selados permaneceram
idênticos**, verificados pelo harness. Tudo desta preparação está nesta subpasta.

## Delta e fontes

Escopo: grupos **2, 6, 8, 9 e 10** da [matriz](../../../estado/n26-divergencias-schema-pre-push-07-11.md),
**17 ausências**: 13 colunas nullable sem backfill; uma tabela de registro;
três funções novas. Complementos necessários que o OpenAPI não mede: **8 CHECKs
e 6 índices**, discriminados em manifesto.json. Não reexecuta migrations inteiras.

Fontes locais: 0008_publicar_campanha.sql; 0018_disparo_do_pipeline.sql;
0021_exclusao_de_dados_da_meta.sql; 0022_whatsapp_do_anuncio.sql;
0024_ativacao_de_campanha.sql. Há **CREATE simples**, sem substituir função,
constraint, índice ou coluna já existente. Qualquer objeto correspondente já
presente, overload ou drift exige revisão; não usa IF NOT EXISTS para equivalência.

Metadados QA de preparação estão em metadados-pais-qa.json e
metadados-handlers-qa.json. Foram lidos somente catálogos, tipos/defaults,
constraints/índices, RLS/policies, ACL e definições de handlers relevantes.
Vault foi inspecionado **apenas em metadados**, nunca em linhas/segredos.
Privilégios postgres USAGE/SELECT/DELETE sobre Vault foram confirmados.
Depois do encerramento das consultas indispensáveis, nenhuma nova consulta remota
foi feita para testar ou ajustar o pacote. Não houve inventário geral repetido.

### Divergências deliberadas da fonte histórica

1. **Status público seguro:** 0021 devolvia o JSON administrativo inteiro,
   inclusive resumo.negocios. A nova status_da_exclusao mantém assinatura e quatro
   campos: solicitado_em, concluido_em, o_que_foi_apagado, teve_erro. Projeta somente
   **conexoes, segredos, contas, metricas, campanhas, criativos**, cada valor inteiro
   não negativo até 2.147.483.647. Strings/objetos/arrays/decimais/negativos,
   números fora do limite e chaves extras são omitidos. Não percorre/retorna JSON
   aninhado. Erro vira apenas booleano, nunca mensagem. Preserva zero numérico.
2. **Administração preservada:** apagar_dados_da_meta continua retornando negocios,
   necessário ao callback para preencher business_ids; não se edita o callback
   nem se regrava registro histórico. desautorizar_meta e apagar_dados_da_meta
   preservam os corpos lógicos da 0021. A mudança pública é intencional, não uma
   cópia cega da migration.
3. **Colunas já existentes preservadas:** publish_state e creatives.status no QA
   são nullable e sem default. Não aplica NOT NULL/default draft nem backfill
   da fonte antiga sobre dados existentes. Os novos CHECKs aceitam NULL.
   Qualquer valor não nulo incompatível faz o ato falhar e reverter, sem
   converter/apagar o valor. Os demais campos já existentes não são reconfigurados.
4. **Grants explícitos mínimos da tabela nova:** serviço tem SELECT, INSERT só
   em codigo/meta_user_id e UPDATE só em concluido_em/o_que_foi_apagado/
   business_ids/erro. Sem DELETE; sem acesso direto anon/auth/PUBLIC.
   Mutações RPC: apenas owner postgres e serviço; status: owner/anon/auth/serviço,
   sem grant options. Defaults globais inesperados para terceiros fazem o delta
   divergir e abortar; não são corrigidos silenciosamente.

O consumidor existente, app/(public)/exclusao-de-dados/[codigo]/page.tsx:72–92,
usa exatamente essas seis contagens numéricas; campos omitidos já são tratados
como zero. Rota administrativa app/auth/meta/exclusao-de-dados/route.ts:76–99
precisa do resumo completo, mantido. Nenhuma tela pública/legal/runtime mudou.
A correção pública está **somente preparada**; não é correção publicada em produção.

As 13 colunas novas herdam grants de suas tabelas existentes. Este pacote não
afirma execução/escrita exclusiva de serviço nessas colunas: alguns grants de
tabela existentes são amplos, protegidos por RLS. Não revoga grants de tabela ou
altera listas brancas para fabricar isolamento por coluna. As garantias mínimas
acima referem-se à tabela/RPCs novas; preservar o ACL anterior não é nova auditoria
da autorização de todos os campos operacionais.

## Dependências verificadas e limites de operação

Não foi demonstrada dependência **direta** de U3 nos corpos da 0021. Dependências:
meta_connections, ad_accounts, campaigns, creatives, metrics_daily e vault.secrets;
colunas e tipos usados estão no snapshot. Handlers medidos de atualização são
set_updated_at e impedir_troca_pagina_compartilhada; este último só atua em
UPDATE OF meta_page_id e não é acionado pelo delta nem pelas mudanças de status
da desautorização. Em commercial_order_units não foi encontrado trigger de usuário.

O grafo de FKs que chega às relações apagadas é guardado por definição/nome:
ad_accounts → meta_connections; campaigns, metrics_daily e commercial_order_units
→ ad_accounts. Todos são **ON DELETE SET NULL**, não CASCADE. O ensaio comprova:
pedido/unidade comercial e campanhas próprias permanecem, mas seu vínculo
ad_account_id pode ficar NULL quando a conta Meta sai. Isso é efeito real da FK,
não preservação literal de cada campo. Se surgirem outras FKs/triggers/handlers,
o guard aborta; não antecipar DDL de U3.

No ensaio as duas funções atingiram **duas conexões fictícias de negócios distintos
do mesmo usuário Meta**, preservando um terceiro negócio de outro usuário.
Foram exercitados DELETE/UPDATE efetivos em Vault fictício, métricas inglesas,
contas, conexões e IDs externos das peças/campanhas. Não se declarou operacional
apenas porque CREATE FUNCTION compilou.

**Limite importante:** esse é o escopo legado da 0021, não uma certificação de
eliminação de todo dado Meta no SaaS. As nove tabelas portuguesas do backend são
preservadas e não participam da exclusão aqui. Dados/serviços/Storage fora dos
alvos não são apagados nem auditados como cobertura de uma solicitação global.
Não se certificam conformidade legal, HTTP/signed_request ou configuração das
URLs públicas. Não alterar o backend para ampliar exclusão por suposição.

## Preservação, recibo e guards

u2-aplicar.sql contém **um DO**, sem BEGIN/COMMIT externos. Canal futuro único:
apply_migration, projeto **zskpijnqgkqwxksqmzmf**, nome nominal de ato-u2.json.
Não usar execute_sql para DDL. O canal/contrato de rollback é o mesmo documentado
no [pacote U1](../README.md#canal-final-apply_migration-com-nova-entrada-explícita-no-ledger);
a simulação não é prova da implementação remota do endpoint.

O SQL não identifica o projeto sozinho: argumentos do conector/inventário conectado
vinculam QA. Exige executor postgres, U1 exata (corpo/atributos/ACL) e ledger U1
20261108001903. Exige objetos novos ausentes e pais iguais aos metadados medidos,
incluindo tipos/defaults/nullabilidade/ACL/RLS/policies/constraints/índices/
handlers, além do grafo FK e acesso do owner a Vault.

Preserva as nove tabelas backend: clientes, execucoes, criativos, campanhas_meta,
metricas_diarias, respostas_do_dono, execucoes_de_rotina, perguntas_apresentadas,
campanhas_criacao. Guard da U2 exige RLS ativa, zero policies e SELECT-only efetivo
do serviço, **incluindo recusa de MAINTAIN e SELECT WITH GRANT OPTION em tabela
ou coluna**; anon/auth/PUBLIC sem acesso. Essa correção está só na U2, sem editar
o guard antigo selado da U1. Não se afirma que MAINTAIN/grant options foram medidos
num novo ato remoto: serão recusados pelo guard se presentes no futuro.

Snapshot também cobre os seis pais legados, Vault só em metadados,
commercial_order_units, U1 e todos os overloads novos, defaults globais e ledger.
Normalização remove **só objetos enumerados** pelo delta e somente depois exige
igualdade exata de suas definições com modelo-delta.json. Não remove tabelas
inteiras do backend nem todos os índices/CHECKs de um pai. Antes/depois do DO,
catálogo fora do delta deve ser idêntico. É cobertura desses objetos/campos,
não inventário de todo o banco ou do campo statements do ledger.

u2-preflight.sql e u2-pos.sql devolvem **um SELECT, uma linha, um receipt JSON**
com snapshot, normalized e delta. O comparador recalcula a normalização/delta do
snapshot e recusa recibo inconsistente, mudanças fora da allowlist e adulteração
de corpo/ACL. Exige no ato normal:

- PRE com **45** pares version/name e delta ausente;
- PÓS com os mesmos 45 pares integralmente preservados, sem alteração/remoção,
  mais **uma** nova entrada do nome U2 (46 ao todo);
- retorno: preserva as 46, acrescenta só a entrada nominal de retorno (47).
  Não repara/regrava/apaga entradas históricas.

A fixture tem 45 registros exclusivamente fictícios, incluindo a versão U1
conhecida; não contém cópia dos nomes/linhas reais do ledger. O teste demonstra
comparação integral dos 45 pares; o PRE real futuro será capturado privadamente.
Se a contagem tiver mudado legitimamente, parar para revisão, não ignorar linhas.

Locks ACCESS EXCLUSIVE nos quatro pais que recebem colunas; ACCESS SHARE em
meta_connections/metrics_daily/unidades/Vault, advisory próprio e lock_timeout
local 3 s. CHECKs/índices podem varrer tabelas e bloquear escrita. Custos/duração
remotos não foram medidos. Coordenar janela sem DDL concorrente; não prometer
que o advisory bloqueia quem não o utiliza. Não há alteração de serviço/flag
para obter a janela.

## Backup privado futuro e ato único

**Não houve backup real ou chamada DDL remota nesta preparação.**

1. Central revisa este pacote estável; Victor autoriza nominalmente backup
   privado + aplicação **só U2 no QA**, pelo hash final. A autorização deve
   reconhecer que as funções passam a ser chamáveis pelos papéis aprovados
   após commit; não existe flag OFF criada por este pacote.
2. Confirmar projeto no canal conectado, hashes U2 e os 12 selos U1. Coordenar
   janela de manutenção sem DDL/uso dos novos callbacks até encerrar verificação.
3. Via execute_sql QA, capturar u2-preflight.sql e salvar receipt integral fora
   do repo, em pasta privada de Victor/SYSTEM, por exemplo
   C:/Users/victo/.codex/private-backups/v2g/qa-schema/U2-<UTC>/.
   Salvar também aprovação, data BRT/UTC, projeto, fontes/consultas e hashes;
   ler arquivos de volta e conferir SHA-256. Confirmar 45 entradas anteriores,
   delta.before do modelo, alvo ausente e nenhuma entrada nominal U2 prévia.
   Não copiar .env, tokens, Vault/Auth ou registros de clientes.
4. Este delta DDL só adiciona schema e valida condições; **não altera linhas
   existentes**. Backup de aplicação não demanda exportar conteúdo de clientes.
   Metadados PRE/SQL aceito são o backup restrito suficiente para retorno do
   schema aditivo. Se houver necessidade de alterar dados inválidos, parar e
   preparar outro ato/backup; não fazê-lo dentro da U2.
5. Fazer **uma** chamada apply_migration:
   project_id de ato-u2.json; name qa_reconciliacao_u2_operacional_meta_20261107;
   query = conteúdo integral de u2-aplicar.sql pelo hash aceito.
   A plataforma atribui a versão e registra a entrada; não inserir ledger
   manualmente, não usar delta.sql ou gerar-pacote.mjs como payload remoto.
6. Executar u2-verificar.sql (somente leitura) e u2-pos.sql por execute_sql QA.
   Guardar PÓS/hashes privadamente. Executar localmente
   conferirRecibos(pre,pos,'apply'); deve retornar ok=true. Comparar todos os 45
   pares, não só U1 ou total numérico. Não chamar callbacks/Meta/provedores.
7. Guardar recibo/auditoria e parar para aceite da Central. Não repetir suíte
   geral, abrir fluxo público, aplicar U3 ou declarar push liberado por este ato.

Os metadados deste pacote são fonte de revisão, **não backup do instante futuro**.
Backup/restore global não é retorno automático e Storage não está coberto por
dump lógico de banco, conforme o procedimento de U1.

## Retorno seguro

Falha dentro do DO desfaz seu DDL; contrato do endpoint prevê rollback. Em
timeout/resultado incerto, capturar catálogo/ledger antes de qualquer retry.
Delta completo + uma entrada nominal + catálogo intacto confirma aplicação;
delta ausente + ledger anterior intacto indica não aplicado. Estado parcial,
entrada sem delta/delta sem entrada, overload ou drift: parar sem replay/repair.

Depois de commit, retorno exige autorização nominal **separada**, mesmo QA,
name qa_reconciliacao_u2_operacional_meta_retorno_20261107 e u2-retornar.sql.
Capturar estado atual, comparar ao PÓS aceito e recusar divergências. O SQL:

- exige o delta/definições/ACL exatos e pais normalizados iguais ao baseline;
- recusa **qualquer valor não NULL nas 13 colunas novas**, sem imprimir conteúdo;
- recusa **qualquer registro** na nova exclusoes_de_dados;
- recusa índice/CHECK posterior, inclusive sobre coluna ainda NULL, antes de
  DROP COLUMN (que poderia removê-lo automaticamente sem CASCADE);
- usa DROP RESTRICT para dependentes de função/tabela/coluna; não força cascata;
- remove só objetos da allowlist; compara novamente o catálogo fora do delta.

Linha nova usando só colunas antigas permanece. Não restaura dados antigos por
cima dos atuais; não tenta ressuscitar dados apagados por uma chamada legítima
posterior do callback. No callback de exclusão, um registro persistido em
exclusoes_de_dados bloqueia o retorno automático. Desautorização isolada não cria
esse registro nem tem esse marcador: o retorno DDL jamais repõe tokens removidos
ou status alterados por desautorizar_meta. Não devolver status de exclusão falso para
tornar possível o rollback. Alteração posterior/dependência exige outra revisão.

Depois do retorno autorizado, capturar receipt e conferirRecibos(preRetorno,
posRetorno,'return'); preservar 46 entradas, aceitar apenas a nova de retorno.
Nenhum retorno ou rollback remoto foi executado aqui.

## Ensaio final e limites

Comando: node --test docs/qa/reconciliacao-schema-07-11/u2/ensaio-u2.mjs.
**11/11 PASS, zero falhas, 19.665,3994 ms**. PGlite/PostgreSQL 18.3 instalado,
distinto do PostgreSQL 17.11 QA. Nenhum serviço instalado ou provedor usado.

Há múltiplos cenários por teste: MAINTAIN, grant option de tabela/coluna, default
EXECUTE extra; duas conexões atingidas/terceiro negócio preservado; INSERT/UPDATE
administrativo efetivo; status público com UUID/segredo fictícios em extras,
objetos/arrays dentro de chave permitida, strings, valores negativos/decimais/
grandes e zero; retorno para cada uma das 13 colunas; CHECK/índice posterior,
views/FKs; ledger adulterado e conservação dos dados/selos U1.

As falhas iniciais foram corrigidas (aliases ambíguos SQL, fixture com UUID único
repetido em três campanhas), sem remover índices/guards. Gerador exige que o
catálogo dos sete pais da fixture reproduza os metadados QA medidos; funções de
Auth/RLS e nonce Vault são stubs locais, sem dados reais. Os dois handlers de
atualização são definições medidas. Isso não homologa Auth real/crypto Vault ou
rota HTTP. Não houve chamada remota de desautorização/exclusão nem nova leitura Meta.

Somente SQL/fixtures locais deste pacote foram ensaiados, sem build/.next ou
suíte global. SHA256SUMS.txt sela a entrega; não regenerar arquivos durante
revisão. Atos externos e revisão independente final permanecem pendentes.
