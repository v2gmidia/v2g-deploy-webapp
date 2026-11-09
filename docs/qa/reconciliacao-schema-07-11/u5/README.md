# U5 — documentos, competência e acesso histórico

**Preparação local; não aplicada.** Grupos 13/16/17/18, 14 ausências do plano. Propriedade desta pasta apenas; U1–U4, os 97 arquivos selados, checkpoints/índices da Central e runtime permanecem intactos. Nenhum backup U5 de aplicação, DDL remoto, produção, U6, configuração, flag, envio, geração, cobrança, commit, push ou deploy foi executado pelo preparador.

## Ordem e delta explícito

1. Competência fiscal: nova `fiscal_obligations`; `fiscal_documents.obligation_id`, FK composta por obrigação/pedido e índices de suporte. Um documento legado não recebe competência automaticamente. A obrigação é única por pedido/mês/tipo, e apenas uma nota autorizada por obrigação; rejeitadas/canceladas podem coexistir.
2. Evidência documental: nova `commercial_manual_evidence`, índices e RPCs `registrar_evidencia_manual` / `revisar_evidencia_manual`. Conferir documento **não** confirma pagamento, cria pedido ou libera acesso.
3. CPF/CNPJ: validador e trigger helper novos; colunas STORED `contractor_document_type` em pedidos, agenda e evidência; substituição exata dos checks de formato, triggers e índices enumerados. Quatro funções comerciais medidas são alteradas apenas nos trechos previstos de validação, idempotência por referência e remoção de fusão por contato/documento. Nenhuma tabela LP é alterada.
4. Acesso histórico: duas tabelas de concessão/auditoria e RPCs emitir/aceitar/revogar; alteração mínima na definição medida de `private.handle_new_user()`, conservando o mesmo vínculo de trigger do Auth. O marcador editável historical_contract só **nega** o claim automático por e-mail nesse fluxo; não concede privilégio.

São quatro tabelas novas, sete funções novas (incluindo helper de trigger), cinco funções existentes com corpo alterado e três colunas adicionadas em tabelas existentes. A coluna gerada da evidência nasce dentro de tabela nova. As quatro relações existentes representadas integralmente no delta são commercial_orders, onboarding_meetings, fiscal_documents e auth.users; nesta última o efeito é o hash do handler existente, sem recriação do trigger ou alteração de dados/colunas Auth.

Fontes integrais usadas como contrato: `20261013060000_competencia_documento_fiscal.sql`, `20261022200400_manual_contract_evidence.sql`, `20261025215302_cpf_cnpj_contratante_v0.sql`, `20261104040711_historical_contract_access.sql`. Não há replay da pasta de migrations. `preparar-delta.mjs` deriva SQL explícito dos corpos reais medidos: não leva ao banco o mecanismo histórico que pulava funções por marcador ou aceitava IF EXISTS como prova.

## ACL e guardas

ACL nova fiscal é explícita: revoga PUBLIC/anon/authenticated/service_role antes de conceder authenticated SELECT com RLS de comprador e serviço SELECT+INSERT. Serviço não ganha UPDATE/DELETE/TRUNCATE/MAINTAIN/grant option; nenhuma ACL antiga de fiscal_documents é ampliada. Evidência mantém serviço SELECT e INSERT/UPDATE apenas nas colunas da fonte, sem DELETE/reidentificação. Validadores/trigger helpers e RPCs de evidência são de serviço, SECURITY INVOKER, search_path vazio.

Emissão/revogação históricas são SECURITY DEFINER, owner postgres, search_path vazio e EXECUTE somente owner/serviço. Repetem papel operador em raw_app_meta_data e carteira por negócio. Aceite é SECURITY DEFINER com EXECUTE para authenticated, negado a PUBLIC/anon/service_role; confere auth.uid, e-mail confirmado e concessão explícita por ID. Tabelas históricas não recebem escrita direta do cliente/serviço; auditoria é escrita pelas funções definer. A sequência identity é fechada a PUBLIC/anon/authenticated/service_role, sem grant para consumir IDs de auditoria.

Antes/depois, são comparados estado completo dos objetos que mudam, atributos/corpos/ACL/search_path, vínculo/hash do trigger Auth, constraints, índices, attgenerated/expressão STORED, comentários e sequência. Um corpo adulterado que mantém a frase do Auth ou o marcador cpf_cnpj_v0 é recusado. Índice homônimo diferente, coluna comum no lugar da gerada, geração incorreta e default antigo alterado também são recusados. protectedDetails é verificado no DO e comparador, não apenas salvo no modelo.

O histórico é o PÓS U4 aprovado: 48 pares version/name completos, versão U4 `20261109000622`. Mudança antiga mantendo a contagem aborta. A expressão SQL é testada com o array embaralhado e chaves JSON íntegras. O canal pode registrar a entrada nominal antes ou depois do corpo; a guarda anterior ao ato exige estritamente 48 entradas sem U5. Aplicação esperada 48→49; retorno 49→50. Não há manutenção manual de ledger.

Ordenações textuais usam COLLATE C, sem alterar pacotes anteriores. Atributos bigint de sequência (start/increment/min/max/cache) são serializados como **texto**. A guarda SQL encontrou e recusou corretamente a primeira versão numérica: JSON.parse arredondava 9223372036854775807 para 9223372036854776000. Não se afrouxou a comparação. O ensaio atual compara o SQL real e recusa diferença de uma unidade mesmo quando Number do JS seria igual.

## Medições e bancada

`baseline-u4.json` copia apenas metadados do PÓS privado U4, origem SHA-256 `4e4f3cdf596b417ea637a85478a91f30922009d06b5ddfd294411e77bfd03dab`; não é backup novo de aplicação U5. A consulta principal de catálogo QA está preservada em capturar-metadados.sql / metadados-qa.json. Uma consulta complementar estrita, permitida pela Central para a dependência faltante commercial_events, está em capturar-eventos.sql / eventos-qa.json. Não houve leitura de linhas de Auth, clientes, Vault ou segredos, nem consulta em produção.

Dependências são reconstruídas a partir dos metadados medidos, incluindo estrutura/grants de Auth, manager_accounts, fiscal_documents, agenda, eventos financeiros e comerciais, unidades dos pedidos e corpos exatos das funções. commercial_order_units deixou de ser stub para ser dependência completa, pois as RPCs a escrevem. Nove tabelas backend não usadas por estes corpos continuam fixtures mínimas: o pacote não congela esse esquema reduzido como se fosse QA. Serviço SELECT-only/RLS e ausência de grants indevidos permanecem verificados, e todos os metadados PRE/PÓS capturados fora do delta são preservados.

A bancada usa PGlite já instalado em v2g-finance. Auth tem estrutura/handlers medidos, mas os UUIDs, e-mails, metadata de usuários e claims de sessão são **inteiramente fictícios**; nenhum servidor Auth, JWT real, recovery, convite ou e-mail foi usado. Vault é o stub herdado, nunca fonte de prova criptográfica. Atributos de usuário são inseridos somente na bancada para exercitar os ramos das funções. Testes são sequenciais, sem prova multissessão. O comando da suíte de baseline com 22 testes relatado pela Central não foi executado novamente aqui; este ensaio próprio verifica os SQLs completos do pacote U5.

```text
node docs/qa/reconciliacao-schema-07-11/u5/executar-local.mjs
```

`resultado-ensaio.json` registra **30 grupos aprovados** e hashes de quatro consumers relevantes antes/depois. `RELATORIO-MONTAGEM.md` separa evidência local, medições e pendências de homologação. Geradores reescrevem o pacote: não usá-los durante ato/revisão selados. Qualquer ajuste exige novo ensaio e novos hashes.

## Limites da origem preservados

- Checksum de CPF/CNPJ é validação local do número, não consulta cadastral nem identificação do titular do cartão. CNPJ legado de 14 dígitos sem checksum não é apagado; atualização sem mudar o documento continua permitida. Campos gerados refletem comprimento; não certificam identidade.
- LP continua com suas próprias regras CNPJ; a U5 não muda leads_lp nem certifica venda LP com CPF. Compra direta/pedido e agenda são contratos diferentes a homologar.
- Registrar/revisar evidência depende de carteira no SQL e do papel de operador autenticado na aplicação; as funções invoker não acrescentam leitura Auth para validar papel. Emissão/revogação históricas, por sua vez, repetem papel e carteira no banco. Não se equiparam essas garantias.
- Aceite vincula só o negócio da concessão após conferência; revogação limpa somente a propriedade introduzida por ela, preservando dono anterior, outro negócio e vínculo apoiado por pedido independente. Não é conciliação financeira, rotina de cobrança nem liberação automática pela evidência.
- A flag histórica controla a aplicação. Seu valor remoto não foi medido/alterado; ela **não revoga EXECUTE da RPC autenticada** após eventual aplicação. Não se afirma que flag OFF desliga a SQL.
- Revisão de consumers por 05/06 identificou defeito anterior: a página de acesso histórico ignora error de sessão e, no teste sintético usuário+erro, ainda consulta resumo administrativo. A action de aceite confere erro; essa prova não concedeu acesso. Nenhum consumer foi alterado aqui. Corrigir e ensaiar esse caminho é pendência própria antes de homologar/ativar UI.
- Corpos comerciais existentes fora do recorte documental mantêm regras/variantes de origem; não se corrige preço, calendário, elegibilidade LP, RLS global, posse legada por e-mail ou demais regras financeiras por consequência desta unidade. Não houve U6.

## Retorno

`u5-retornar.sql` restaura corpos antigos **pela definição real medida**, checks/índices/comentários exatos e vínculo/hash Auth; remove somente adições enumeradas, sem CASCADE. Exige quatro tabelas novas vazias, nenhum obligation_id usado, nenhum CPF aceito em pedidos/agenda e nenhuma duplicata que impeça restaurar as unicidades antigas. Índice/CHECK/view/FK posterior recusa retorno sem excluir dados ou soltar dependência.

Retorno DDL não restaura dados, vínculos de propriedade ou efeitos externos. Uma concessão usada continua com auditoria mesmo revogada e impede o retorno. Ausência de linhas após intervenção privilegiada não prova ausência de uso; mudanças em businesses/Auth/perfis/pedidos não são desfeitas. Reativar o corpo antigo do trigger não faz claims retroativos nem apaga perfis criados. Retorno exige autorização nominal própria e avaliação atual; nunca é automático e nunca pode apagar dados para fazer a guarda passar.

## Arquivos de operação futura

- u5-conferir-pre.sql: transação read only, sem locks/advisory/RPC; estado completo anterior.
- u5-preflight.sql / u5-pos.sql: SELECT único, uma linha receipt JSON, só catálogo.
- u5-aplicar.sql: um DO, sem BEGIN/COMMIT externos; sem chamar negócios.
- u5-verificar.sql: somente leitura do estado posterior esperado.
- u5-retornar.sql: um DO condicionado; delta-retorno.sql é fonte auxiliar, nunca comando remoto isolado.
- comparar-recibos.mjs: baseline48 íntegro, delta exato e metadados fora dele preservados.
- ATO.md: procedimento futuro de autorização/backup privado, sem backup realizado neste bloco.

Pacote pronto para revisão independente; não autoriza banco, ativação, homologação funcional, U6, push ou produção.
