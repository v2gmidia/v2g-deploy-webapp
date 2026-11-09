# N26 — U5 / revisão dos consumidores pelo 05/06 — 08/11/2026

## 0. Resultado e parada

**Recorte de consumidores concluído, somente local. Não encontrei impeditivo novo dos consumidores para a preparação local da U5.** Isso não é aceite do pacote SQL final, autorização de aplicação, homologação Auth/HTTP nem conclusão da U5.

Revisados os grupos 13/16/17/18: competência fiscal, evidência manual, CPF/CNPJ e acesso histórico. **37 testes existentes passaram nesta rodada.** Um ensaio adicional em memória reproduziu uma ressalva pré-existente de leitura de sessão na página pública histórica (§4). Nada foi corrigido no runtime.

Autorização recebida da Central: revisar os consumidores e escrever apenas este relatório. Não editei pacote do 01/02, fontes SQL, runtime, testes, índice, planilha ou arquivos selados. Não executei baseline SQL, banco remoto/local, migrations, build, serviços, rede, configuração, chamadas pagas, commit, push ou deploy. Os 22 testes SQL baseline informados pela Central e a revisão do 07/08 não foram repetidos nem incorporados à contagem acima. Os 97 hashes selados não foram recalculados por esta frente nesta rodada.

**Próximo dono: Central + 01/02**, para confrontar o pacote final com os contratos abaixo. A revisão não certifica que todas as guardas propostas já constam do pacote em montagem. Nenhum defeito introduzido pelo pacote foi demonstrado por esta revisão de consumidores; não houve comparação integral de seu delta.

## 1. Contratos encontrados

### 1.1 Competência e documento fiscal — grupo 13

- `lib/contratacao/competencias-fiscais.ts:13`: função pura de planejamento. Exige primeiro mês integral, preço conferido e distribuição explícita dos planos antecipados (`:24`, `:27`, `:31`). Mensalidade gera uma competência, sem presumir renovação. Não grava obrigação nem emite nota.
- `app/(protected)/pedidos/page.tsx:69` e `app/(protected)/gestor/compras/page.tsx:84`: consumidores atuais de `fiscal_documents` selecionam `order_id, status, created_at`. Não leem `obligation_id` nem `fiscal_obligations`. A ausência desses campos nos SELECTs atuais não constitui regra inerte, pois não há predicado de competência nesses consumidores.
- `supabase/migrations/20261013060000_competencia_documento_fiscal.sql:7`: obrigação pertence a pedido; unicidade por pedido/mês/tipo (`:12`), FK composta documento/obrigação/pedido (`:18`) e só uma nota autorizada por obrigação (`:27`). Vínculo novo é nullable: documento antigo sem vínculo não vira obrigação ou nota autorizada por inferência.
- A policy fiscal usa o comprador exato do pedido (`:36`), não e-mail, documento ou papel genérico. Não transformar a U5 em emissão fiscal ou preenchimento retroativo de competências.

### 1.2 Evidência manual — grupo 16

- `app/(protected)/pedidos/evidencias-actions.ts:9`: `getUser` sem erro + `app_metadata.papel === "operador"`; papel em `user_metadata` não vale. O ator da RPC vem da sessão (`:23`, `:45`), não do formulário.
- `lib/contratacao/evidencia-manual-servidor.ts:5`: atribuição exata em `manager_accounts` por negócio e operador, conferindo também os IDs retornados. `:15` confere negócio/proprietário/claim; `:20` confere Auth do perfil proposto com e-mail confirmado; `:25` confere pedido, negócio, e-mail, documento e comprador.
- Registro e revisão repetem carteira e identidade antes das RPCs (`evidencias-actions.ts:19`, `:37`, `:42`). Marcar conferida exige duas confirmações e motivo (`:31`, `:34`). A revisão relê o registro do negócio; identidade enviada no formulário não substitui a gravada.
- SELECT da revisão em `evidencias-actions.ts:39` inclui todos os campos efetivamente lidos pelo helper de identidade. O cast para `EvidenciaManual` não significa leitura dos demais campos nesse caminho.
- `app/(protected)/pedidos/ConferenciasManuais.tsx:20`: SELECT completo para o registro e auditoria apresentados; pedidos e eventos incluem os campos usados em `situacaoEvidencia` (`:25`, `:26`). Erro ou truncamento dos eventos impede uma projeção ativa (`:28`). Mais de 50 evidências é explicitado como recorte, não conciliação completa (`:34`).
- `lib/contratacao/evidencia-manual.ts:34`: projeção documental, não direito de acesso. Pedido cancelado ou ocorrência adversa do mesmo pedido/cobrança impede usar como prova ativa (`:37`). Conferida não cria Auth, pagamento aprovado ou propriedade.
- **Não há flag global OFF deste módulo.** A página Pedidos o monta em `page.tsx:102`; negócio explícito + carteira controlam a leitura. Erro/schema ausente mostra indisponibilidade (`ConferenciasManuais.tsx:47`). Não chamar esse comportamento de “feature desligada”.
- As duas RPCs documentais existentes são SECURITY INVOKER, serviço restrito e repetem carteira/identidade/estado. O papel de operador é validado na aplicação; não afirmar que essas duas RPCs repetem toda a autorização Auth no SQL. Não acrescentar autorização nominal `revops`, que pertence a outro módulo.

### 1.3 CPF/CNPJ — grupo 17

- `lib/contratacao/documento-contratante.ts:5`: normalização preserva zeros e não converte letras em documento. Validação matemática e tipo explícito em `:29`; o comentário `:28` limita a prova: não consulta Receita nem comprova titularidade.
- `lib/contratacao/evidencia-manual.ts:21` e `app/(public)/entrar/actions.ts:52` usam o mesmo leitor. `cnpj`/`claimed_cnpj` continuam nomes técnicos legados; não renomear colunas/RPCs no pacote.
- Os consumidores revisados identificam o tipo pelo documento via helper. Não encontrei leitura de `contractor_document_type` em app/lib; as colunas geradas são contrato de banco, sem SELECT faltante identificado nestes caminhos.
- `supabase/migrations/20261025215302_cpf_cnpj_contratante_v0.sql:58` exige três pais: `commercial_orders`, `onboarding_meetings`, `commercial_manual_evidence`. `:73` adiciona tipo gerado e `:76` instala trigger de validação com argumento da coluna correta.
- `:100` altera cinco assinaturas existentes de registro. `:118` remove fusão de negócio por e-mail/documento das três variantes especificadas; `:126` preserva serialização por referência. Documento repetido não deve fundir negócios. Os índices removidos (`:86`, `:93`) precisam ser distinguidos das unicidades por referência/lead/negócio/agenda que permanecem.
- `:110` pula função com marcador `cpf_cnpj_v0`: marcador textual sozinho não prova corpo correto. Guarda/verificador devem conferir a definição final efetiva, atributos e ACL, não apenas procurar o comentário.

### 1.4 Acesso histórico — grupo 18

- `lib/contratacao/acesso-contratado.ts:5`: `V2G_HISTORICAL_ACCESS_ENABLED` só ativa com string exata `true`; ausente é OFF. Leitor de concessões retorna vazio antes de consultar quando OFF ou e-mail não confirmado (`:18`).
- Emissão/revogação: `app/(protected)/pedidos/acesso-contratado/actions.ts:8` checa flag; `:12` valida operação/UUID/motivo; `:14` exige conferência explícita; `:18` exige operador autenticado sem erro. Usa serviço para as RPCs, passando ator da sessão. Não cria nem envia mensagem (`:28`).
- Aceite: `app/(public)/acesso-contratado/[id]/actions.ts:8` valida flag/ID e `:12` recusa erro Auth/e-mail não confirmado. RPC é da sessão e recebe **somente `p_id`** (`:13`), nunca negócio/perfil do formulário ou cliente admin.
- `lib/contratacao/cadastro-contratado.ts:9`: pré-cadastro exige concessão explícita, e-mail/documento exatos, prazo, ausência de aceite/revogação e negócio órfão sem claim. Isso permite criar conta, não aceita o vínculo. Resumo (`:21`) só para destinatário confirmado e proprietário compatível. Os SELECTs incluem os campos usados em ambos os caminhos.
- `app/(public)/entrar/actions.ts:85` distingue convite de compra; `:106` adiciona marcador `access_flow: historical_contract`. `lib/contratacao/vincular.ts:10` usa esse metadado editável **apenas para negar associação automática**, nunca para liberar acesso.
- `lib/contratacao/acesso-contratado.ts:21`: SELECT de concessões inclui negócio, destinatário, documento, aceite e revogação, com filtros e paginação. `lib/contratacao/acesso.ts:25` exige propriedade exata além da concessão. `lib/multiconta/ativo.ts:29` primeiro lista negócios do perfil; `:73` passa as concessões ao seletor. `lib/multiconta/elegibilidade.ts:53` confere negócio, perfil, e-mail, aceite e ausência de revogação. Cookie é preferência, não permissão.
- A identificação do documento para negócios já liberados em `lib/multiconta/cnpjs.ts:24` usa o mesmo leitor com admin, limitado aos IDs recebidos. A confirmação de e-mail é contrato do chamador (`:25`), não uma nova verificação Auth feita por esse helper.
- Fonte SQL histórica: `20261104040711_historical_contract_access.sql:61` e `:67` repetem operador/carteira na emissão; `:64` exige evidência conferida histórica **sem pedido**, documento válido e revisora identificada. Negócio com claim/pedido ou vínculo ativo incompatível não é liberado (`:78`).
- Aceite SQL em `:97` exige e-mail confirmado de `auth.users`, ID explícito, prazo e integridade da evidência/negócio. Só então altera propriedade e registra aceite. Revogação em `:127` desfaz apenas propriedade introduzida pela concessão, preservando proprietário anterior e suporte comercial independente.
- ACL em `:138`: emitir/revogar somente serviço, aceitar somente autenticado; tabelas sem DML direto dos clientes/serviço. Policy de leitura (`:50`) exige aceite próprio, não revogado e propriedade do negócio. Eventos são apenas leitura do serviço; a sequência de eventos é dependência da escrita pelas funções.

## 2. Pais/helpers/atributos que o pacote precisa proteger

Lista derivada dos consumidores/fontes, para conferir contra a guarda e os negativos do pacote; não afirma cobertura já implementada.

1. **Fiscal:** definições/ACL/RLS de `commercial_orders` e `fiscal_documents`; colunas do vínculo; FK composta, unicidades e predicado `status = 'authorized'`; `auth.uid()` e policy do comprador. Preservar documentos preexistentes e seus estados.
2. **Evidência:** `businesses` (`id/profile_id/claim_email`), `profiles` e FK com Auth, `manager_accounts` (par negócio/operador), `commercial_orders` (identidade/status/cobrança) e `commercial_payment_events` (pedido/cobrança/evento). Guardar assinaturas, owner, SECURITY INVOKER, search_path e ACL por função/coluna de registrar/revisar. Unicidade da fonte e imutabilidade/replay divergente não podem virar atualização de identidade.
3. **Documento:** constraints reais das três tabelas, tipo e expressão STORED das três colunas geradas, validator `documento_contratante_valido(text)`, função `conferir_documento_contratante_gravado()`, triggers BEFORE/ROW/eventos/argumentos. Guardar corpo e atributos das cinco RPCs indicadas em `20261025215302_cpf_cnpj_contratante_v0.sql:100`, índices removidos/mantidos e dependências efetivas de seus corpos, sem substituição por fixture mínima.
4. **Auth histórico:** `auth.users` com `id/email/email_confirmed_at/raw_app_meta_data/raw_user_meta_data`; `private.handle_new_user()` com owner, SECURITY DEFINER, search_path e ACL; **trigger `on_auth_user_created` após INSERT de `auth.users`** associado à mesma função; `profiles` e `businesses`. Fontes: `0001_init.sql:705`, `:735`; função movida ao privado em `0002_harden_security_definer_functions.sql:36`. O nome do schema antigo no CREATE TRIGGER histórico não autoriza recriá-lo em public.
5. **Mudança estreita do claim:** o patch `20261104040711_historical_contract_access.sql:13` deve manter criação do perfil/nome/WhatsApp e impedir o claim por e-mail somente no fluxo marcado. Deve abortar definição desconhecida. Conferir corpo anterior/final integral; encontrar só o trecho `if new.email is not null then` não prova equivalência do restante.
6. **Histórico:** tabelas/concessão/eventos, FKs/auditoria, sequência de identidade, policy por owner e três RPCs com atributos e grants exatos. Capturar também dependências externas existentes e novos dependentes: retorno não pode remover propriedade/dados/eventos ou usar CASCADE para ultrapassar a guarda.

## 3. Casos mínimos que devem permanecer no aceite do pacote

- Fiscal: mesmo pedido/mês/tipo não duplica obrigação; documento de pedido B não vincula obrigação de A; segunda nota autorizada recusa, rejeitada/cancelada permite nova tentativa; leitor de B não vê obrigação de A. Ausência de competência não se resolve pela data do pagamento.
- Evidência: operador fora da carteira, perfil/e-mail não confirmado ou pedido divergente recusam; fonte repetida divergente preserva original; sem as duas conferências não marca checked; evento impeditivo exato e pedido cancelado recusam prova ativa; pending/checked/rejected não criam pagamento, Auth, propriedade ou acesso.
- Documento: CPF e CNPJ válidos com zeros, máscara só no app; inválido/repetido/letra recusam; documento legado inalterado preservado conforme trigger, troca inválida recusada; tipo gerado não é coluna gravável; mesma referência conserva replay, nova referência com mesmo e-mail/documento não funde negócios.
- Histórico: papel editável não autoriza; SQL repete operador/carteira; evidência Pix, pendente, recusada, com pedido, outro negócio/documento ou claim não emite. Aceite anônimo, destinatário errado, sem confirmação, expirado antes do primeiro aceite, revogado ou com proprietário/pedido incompatível falha. Cliente não enumera convites e não altera concessão/eventos por DML.
- Aceite/revogação: replay coerente não duplica eventos, divergente não troca destinatário/ator/motivo; uma liberação não libera outro negócio. Revogar mantém propriedade anterior/outro pedido; remove apenas propriedade criada pela própria concessão quando cabível. Transferência/corridas reais não são provadas pelos testes de aplicação substituídos.
- Trigger Auth: cadastro histórico cria perfil mas não reivindica negócios por e-mail; marcador isolado não concede vínculo; cadastro comum preserva o comportamento anterior. Função/trigger/helper/ACL/índice divergente deve abortar sem alterar pais para fazer guarda passar.
- Flag OFF: ações/leitores do app não abrem esse caminho. **Não descrever isso como revogação da RPC no banco**, conforme §4.

## 4. Ressalvas pré-existentes e classificação

### R1 — P2, endurecimento da página pública; não introduzido pela U5

`app/(public)/acesso-contratado/[id]/page.tsx:15` extrai apenas `data.user` de `getUser`, ignorando `error`. Se a porta devolver usuário confirmado e erro na mesma resposta, a página chega à consulta administrativa do resumo (`:19`). Ensaio em memória com página real, Auth/helper/formulário substituídos reproduziu **uma criação do cliente administrativo** nessa condição.

Isso prova ausência da recusa explícita de erro nessa página; **não prova que o provedor real retorna essa combinação, vazamento em HTTP ou concessão de acesso**. A action de aceite recusa `error` em `actions.ts:12`; o resumo real ainda verifica destinatário/negócio. A página Pedidos também ignora `error` em `app/(protected)/pedidos/page.tsx:36`, mas esse segundo caminho não foi executado no ensaio adicional e tem proteção do grupo/layout fora deste recorte.

Encaminhar correção de guarda de página em bloco próprio, sem misturar com DDL. Não é impeditivo novo para montar o pacote local; não declarar esses caminhos integralmente fail-closed em todas as combinações Auth só pelos 37 testes.

### R2 — limite arquitetural preexistente: OFF no app não é OFF da API SQL

A flag de `lib/contratacao/acesso-contratado.ts:6` não é consultada pelas três funções SQL históricas. Após eventual aplicação, `aceitar_acesso_contratado(uuid)` continua concedida a authenticated (`20261104040711_historical_contract_access.sql:141`), com suas próprias verificações de identidade/evidência. A emissão é serviço e valida operador/carteira, mas também não lê a flag.

Logo, instalar estrutura não cria uma concessão nem liga worker; porém a flag OFF do servidor **não é um bloqueio universal de chamada direta à RPC** com uma concessão válida. Não houve chamada SQL/API para testar isso nesta rodada. Se a Central exigir OFF também no banco, isso requer decisão/escopo explícito; não alterar grant ou RPC silenciosamente neste pacote.

## 5. Validação executada e limites

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-competencias-fiscais.mjs scripts/conferir-evidencia-manual.mjs scripts/conferir-documento-contratante.mjs scripts/conferir-acesso-contratado.mjs
```

**37/37 PASS, zero falhas/skips**, nesta rodada: 4 fiscais, 10 de evidência, 15 documentais e 8 históricos. Executam helpers/actions e alguns componentes reais com portas isoladas; Auth, DB/RLS, Storage/serviços e navegação externa não são reais. SELECTs foram conferidos também por leitura dos consumidores: a fixture histórica não projeta colunas de SELECT e, sozinha, não certifica completude.

Ensaio adicional R1: loader existente `ambienteTs`, página pública real, usuário/e-mail fictícios, resposta `getUser` com usuário e erro, resumo/entrada/formulário substituídos; resultado `synthetic=true, authReturnedUserAndError=true, adminCalls=1, remote=false`. A primeira tentativa do ensaio não executou a página por faltar porta `next/cache` no formulário importado; depois o formulário foi explicitamente substituído e o ensaio executou. Não se alterou fixture do repositório nem se contou a tentativa incompleta como teste aprovado. Esse ensaio é reprodução de ressalva, não um 38º caso positivo da suíte.

Não houve JWT/cookies/e-mail reais, cadastro/aceite/revogação remotos, medição de flag remota, concorrência multissessão, HTTP autenticado, emissão fiscal, recuperação/retorno de banco ou aplicação U5. Não rodei typecheck global ou suíte SQL, pois não alterei runtime e a Central já está executando o aceite do pacote. Nenhum relato de aplicação U4 anterior foi revalidado ou usado como prova de U5.

**Parada neste relatório.** Preparação SQL, aceite final, eventual aplicação QA e correção posterior de R1 permanecem atos separados, sob coordenação da Central. Produção e U6 não foram abordadas.
