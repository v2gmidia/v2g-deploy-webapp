# E28 01 e 02 Retomada Asaas e diagnóstico do 422

23/10/2026, manhã de Brasília. Bloco de diagnóstico e preparação concluído.
Leituras externas: Gmail, metadata de deploy, SELECT no QA e calendário.
Sem envio, escrita no banco, replay remoto, nova cobrança, publicação ou acesso
real concedido. Nenhum código de runtime precisou ser duplicado/corrigido.

## Funciona hoje e novidade confirmada

Alice aprovou a tokenização no chamado **1895741**, em 23/10 às 10h31 BRT.
A liberação é monitorada e pode ser revista. A mensagem foi lida diretamente:
[aprovação](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a168f5bf8f55195).
Substitui a pendência de aguardar a aprovação, não comprova configuração ou uso
em produção. Liberação de 3DS de 22/10 preservada; não se estende automaticamente
às mensalidades. Central já respondeu, recibo SENT `1a1690358e6bbd78`; nada reenviado.

Preservadas as provas anteriores de Pix semestral, cartão anual, primeira
mensalidade e confirmação por e-mail. O ensaio de R$ 500 foi estornado e a
assinatura cancelada no Asaas, conforme checkpoint anterior; não repeti a operação
nem usei esse pedido como prova de compra ativa. O estorno ainda não consta no QA.

## O que foi resolvido neste bloco

1. Correlacionei o commit efetivamente publicado com o comportamento de 422 e
   reproduzi o defeito offline, executando o handler/parsers do próprio commit.
2. Reconfirmei no QA o pedido, ledger financeiro, versões remotas e precondições
   das sete RPCs. Identifiquei os timestamps remotos diferentes dos arquivos
   locais: ausência do timestamp original não significa migration ausente.
3. Preparei **um manifesto executável**, somente leitura, com hashes dos arquivos
   e de cada SQL, dependências, equivalências QA, backup, sequência e recuperação.
4. Atualizei a situação de tokenização e separei falha reproduzida de causa remota
   ainda não confirmada. Não afrouxei aceite de evento perdido para devolver 200.

## Evidência do QA e diferença de versões

Leitura Vercel em 23/10:

- Projeto `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, alias
  `https://v2g-webapp-qa.vercel.app`, deploy READY
  `dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`.
- Commit publicado **`fbf00ee3af7fb3cc8c06931138011a49bcd85236`**.
- HEAD local lido pelo manifesto: `7374227997848a5e2b8b99b5ada4e67c36eabfc0`,
  mais mudanças não commitadas. HEAD sozinho não contém a entrega inteira.
- `target=production` no retorno refere-se ao projeto QA, não ao projeto de
  produção da V2G. Produção não foi reinspecionada neste bloco.

SELECT no Supabase QA **`zskpijnqgkqwxksqmzmf`**, sem escrita:

- Pedido `6ae800e5-b4a2-4f12-a6bd-882a5a6cfcaf`: self_service, initial_3ds,
  mensal, R$ 500, aprovação histórica, assinatura nula, negócio
  `3e683d9b-498a-4e07-91b2-8e840c4226ed` e perfil comprador já preenchido.
- Cobrança `pay_j8ec6x5ibbhxk38a`, cliente `cus_000009623360`, vencimento 21/10.
- Ledger continua somente com CREATED e CONFIRMED, recebidos em 21/10 às
  22:59:52 UTC. **Nenhum REFUNDED**, sem inferir que a fila esteja hoje interrompida.
- As quatro RPCs registradoras antigas existem e ainda não aceitam AUTHORIZED
  nas whitelists. O classificador `evento_asaas_impede_confirmacao` está ausente.
- `commercial_manual_evidence` também está ausente. Portanto as duas unidades
  novas continuam não aplicadas, comprovado por objetos além do ledger.

O preflight SELECT das sete funções financeiras retornou: todas presentes,
security invoker, search_path vazio, precondições de trechos compatíveis,
EXECUTE negado a anon/authenticated e permitido a service_role. **Isso é
compatibilidade de preparação, não aplicação nem ensaio de pagamento.**

## Diagnóstico do 422

O [aviso da fila QA](https://mail.google.com/mail/u/?authuser=victor.cabral%40v2gmidia.com.br#all/1a1634641bfed835)
foi lido. Identifica `V2G WebApp QA pagamentos`, destino `/api/webhooks/asaas-payment`,
HTTP 422 e horário 22/10 08:00:58 no próprio aviso. Não contém ID do evento,
tipo, cobrança ou corpo JSON da resposta. A falha de 21/10 informada pelo
Central não foi atribuída por dedução a esse horário de aviso.

O aviso de 14 dias da fila `V2G QA checkout temporario`, com destino trycloudflare
antigo, é outra fila, conforme passagem do Central. Não foi usado como prova de
interrupção atual do webhook QA. Não reativei nem removi nenhuma fila.

### Defeito de versão demonstrado e já corrigido localmente

O handler no commit QA `fbf00ee` rejeita uma confirmação reenviada quando a
consulta canônica já retorna REFUNDED. Isso acontece antes de consultar o evento
anterior: devolve `422 { erro: "confirmacao_divergente" }`.

A árvore local já trata o caso em `app/api/webhooks/asaas-payment/route.ts:60` e
`lib/contratacao/confirmacao-canonica.ts:21`: só reconhece como histórico quando
existe EXATAMENTE o mesmo evento, pedido, cobrança, assinatura, valor e vencimento,
e a identidade canônica confere. Não grava estorno artificial, não aprova compra,
não cria assinatura nem repete e-mail. Evento não persistido/divergente continua
recusado. Não há novo patch de runtime a inventar para esse defeito.

### Outros 422 possíveis que precisam do corpo da resposta

| Resposta | Etapa | Evidência local |
|---|---|---|
| evento_invalido | Parser financeiro ou status de confirmação inválido | `route.ts:35`, `:38`; `evento-financeiro.ts:32`, `pagamento-evento.ts` |
| pedido_divergente | Origem, forma, referência, cliente, valor ou vínculo incompatível | `route.ts:50`, `:80`, `:114`, `:118` |
| confirmacao_divergente | Consulta canônica não confirma o mesmo fato; inclui replay estornado na versão antiga | `route.ts:58`, `:75`; `confirmacao-canonica.ts:4` |
| evento_divergente | RPC devolveu false, por identidade, estado, evento ou valor incompatível | `route.ts:88`, `:140`; RPC `registrar_evento_inicial_3ds` |

Token incorreto produz 401; erro de consulta/gravação ou conciliação de assinatura
produz 503, não 422. Novos estados de risco não suportados eram **ignorados** pelo
parser antigo; não os declarei causa do 422 sem evento. Publicar parser novo sem
a migration correspondente, por outro lado, pode fazer a RPC recusar esses estados.

**HIPÓTESE remota mais aderente ao defeito reproduzido:** confirmação antiga
retida na entrega sequencial volta após estorno; o QA antigo a recusa e o estorno
original não chega ao ledger. **Não é causa remota confirmada.** O teste também
mostrou que o estorno original válido alcança a RPC nas duas versões; o nome
REFUNDED sozinho não explica um 422.

### Dado mínimo ausente

ID/tipo do evento, cobrança, horário/tentativa, corpo da resposta 422, estado
atual e retenção da fila correta. Central já solicitou ao suporte. Alternativa:
Victor entra no **Sandbox** e disponibiliza Integrações → Logs de Webhooks para
leitura desses campos, sem segredo/cartão ou botão de reenvio. A navegação desta
rodada abriu só a página pública, sem painel autenticado; encerrei a aba sem
novo login, reset, leitura de credencial ou tentativa de contornar autenticação.

## Manifesto único e execução futura do QA

Inventário revisável: **`node scripts/manifesto-qa-01-02.mjs`**.
O comando foi executado com sucesso e calcula os SHA256 atuais dos arquivos e
de **15 migrations catalogadas**. Não conecta à rede, não aplica SQL, não publica
e não lê `.env`. Datas/versões externas embutidas são snapshot de 23/10, não uma
consulta live. Catálogo de dependências não é autorização para aplicar 15 SQLs.

Preflight reutilizável: `scripts/sql/qa-01-02-preflight.sql`, **SELECT somente**,
executado nesta rodada no QA fixado. Checa definições/precondições/ACL das sete
funções. Antes de aplicar, refazer a leitura porque o banco pode mudar.

As equivalências já medidas incluem:

| Arquivo local | Versão QA observada |
|---|---|
| 0026 / 0029 / 0034 | 20261008225606 / 20261008225618 / 20261008225620 |
| checkout_transparente / retentativa | 20261009010911 / 20261009013753 |
| gestor_responsaveis_tarefas | 20261009041246 |
| eventos_financeiros / falha_desafio | 20261011141908 / 20261013031434 |
| ligar_lead / security_controls | 20261020010727 / 20261020010734 |
| cartao_mensal_3ds / email_outbox | 20261020023349 / 20261021134245 |
| assisted_asaas_orders, variante server_authorization | 20261021203643 |

Essa equivalência foi estabelecida pelo nome/objetos/precondições. Não declara
igualdade byte a byte com SQL remoto nem permite reaplicar por nome/timestamp.

**Únicas duas novas migrations propostas neste pacote:**

- `20261022152629_asaas_estados_processamento.sql`, SHA256
  `F2E6A009626F68CAE310546B4510EC789C30FFEC8F1B5C527A3BD5AFCF6B7F15`.
  Depende das funções comerciais/3DS existentes. Precondições compatíveis hoje.
- `20261022200400_manual_contract_evidence.sql`, SHA256
  `B66218D8F34CB6795C99C90937B5DA61B517E061969D163EF77A44376550E4DA`.
  Depende das tabelas comerciais, ledger e carteira existentes, **não** da primeira
  migration nova nem de ativar checkout/3DS. Não concede acesso.

Sequência preparada, ainda não executada:

1. Victor fixa o commit de entrega, incluindo arquivos não commitados revisados,
   e confirma só projeto QA. Manifesto inclui o helper de replay, além do handler.
2. Antes de cada unidade: SELECT do ledger/objetos e backup protegido dos dados
   comerciais/carteira, definições SQL, constraints, ACL e versão QA anterior.
   Registrar local, hash, horário e responsável do backup, sem chaves no relatório.
3. Autorizar e aplicar cada unidade nova individualmente em transação; verificar
   e parar entre unidades. Não usar push geral, reparar ledger por conveniência
   ou reaplicar dependências remotas com timestamp diferente.
4. Após verificar banco/ACL, Victor publica o commit aprovado **somente no QA**.
   Conferir alias, projeto, deploy e SHA; não basta preview/arquivo local/READY.
5. Executar a matriz autenticada abaixo com manifesto de atores/dados aprovado.
   A retomada de fila/replay é portão separado, só depois do log e versão correta.

Recuperação: erro SQL deve reverter a unidade inteira; conferir antes de nova
tentativa. Se já aplicada e houver problema de código, rollback QA para versão
anterior registrada, mediante autorização, preservando evidências e ledger.
Não apagar tabela ou direito, desfazer estorno, restaurar produção ou repetir
cobrança como limpeza. Com SELECT somente neste bloco, não há dado remoto criado
a limpar. Futura limpeza de fixtures deve nomear IDs/objetos e ser autorizada;
as provas financeiras históricas não são descartáveis por inferência.

## Matriz de validação de confirmação e acesso

| Passo | Prova necessária | Parada / negação |
|---|---|---|
| Pagamento e pedido | Evento original + consulta canônica + ledger, cliente/valor/cobrança iguais | Não usar callback, captura autorizada ou análise aprovada como pagamento |
| Identidade | Sessão do comprador exato, e-mail confirmado e user_id esperado | Outro perfil ou e-mail não confirmado não reivindica a compra |
| Negócio | business_id do pedido, claim_email exato e releitura da propriedade | Não associar por semelhança nem pelo cookie escolhido |
| Vínculo | buyer_profile_id correto e negócio realmente do comprador | Pedido de outro negócio não abre seu conteúdo |
| Acesso vigente | Compra ativa ou direito por negócio aprovado por política explícita | Pedido estornado não homologa compra ativa; política nova ainda não implementada |
| Isolamento | Usuário não autorizado negado; demais negócios anteriores preservados | Não revogar Auth/perfil inteiro por evento de uma compra |
| Histórico/Pix | Evidência por negócio, responsável, fonte, data e revisão | Documento conferido não fabrica Asaas, identidade autenticada ou grant |
| Saída do ensaio | IDs/resultado/logs registrados; plano de limpeza autorizado cumprido | Não criar outra cobrança, convite ou acesso real neste bloco |

Fontes de implementação: `lib/contratacao/vincular-core.ts:25`, `:42`, `:56`;
`lib/contratacao/acesso.ts:19`; `lib/multiconta/elegibilidade.ts:41`.
O código atual continua usando aprovação histórica sem filtro de estorno no
vínculo/acesso. A projeção visual de estorno NÃO ativa uma política de revogação.
Preservar a proposta mínima: impedir nova concessão sustentada exclusivamente
em compra integralmente estornada, sem retirar outros direitos; **aguarda decisão
humana e implementação própria**. Não concedi acesso nesta retomada.

## Etapa 02 com verificação posterior

Reutilizado o procedimento existente, sem novo módulo jurídico/fiscal. A busca
Gmail posterior a 21/10 por Contabilizei, nota/NFS-e, contrato final e advogado
não encontrou confirmação final; retornou correspondência ao Asaas e o e-mail
de teste. A resposta enviada em 22/10 ainda condicionava o complemento ao
instrumento/alteração de valor/situação fiscal confirmados pelos responsáveis.
Isso não prova inexistência em outros canais. Não pedir de novo o que Victor
já possa ter no jurídico/contabilidade: solicitar a referência concreta.

No pedido fictício inspecionado: zero contrato signed e zero nota authorized.
Não extrapolar essa contagem para clientes reais. Continuam sem prova neste
recorte: instrumento final aplicável, poderes/signatário, evidência de assinatura
e nota/competência correspondente quando cabível. Tokenização aprovada não
substitui nenhum desses atos, e contrato ser opcional para análise Asaas não o
transforma em obrigação dispensada na relação comercial.

## Testes e limites

- Novo `node scripts/conferir-422-versao-publicada.mjs`: **6/6**. Snapshot do
  próprio commit QA vs árvore local, com dados fictícios; identifica diferenças
  de resposta e prova que evento ausente/divergente não recebe 200 histórico.
  O script lê Git e módulos reais, sem rede, `.env` ou eventos reais.
- Manifesto executado com sucesso; todos os arquivos/SQLs catalogados existem e
  foram hasheados. Preflight SELECT executado no QA, sete funções compatíveis.
- Runtime TS/TSX/SQL de migrations não foi alterado nesta rodada; não repeti
  typecheck nem suites financeiras/manuais já verdes sem risco novo. Nenhum build
  ou reinício de dev compartilhado. Teste offline não confirma a causa remota.

## Até cinco faltas em ordem e pedido pronto para revisão

1. **Logs do evento 422 e fila atual**, com os campos mínimos acima. Dono:
   Asaas/Alice (pedido já enviado pelo Central) ou sessão Sandbox de Victor.
2. **Autorização individual de banco QA após backup**, para as duas unidades
   nomeadas e hasheadas, sem outras migrations. Dono: Victor/Central; executor
   do próximo bloco explicitamente autorizado. A unidade 1 backend não cobre isso.
3. **Commit e publicação QA exatos**, seguidos da conciliação controlada do
   estorno/fila quando autorizada. Dono: Victor/Central. Não pedir cobrança nova.
4. **Prova autenticada do negócio correto e política de concessão**, inclusive
   piloto histórico, isolamentos e alerta/WhatsApp da LP. Dono: 01/02 + Victor;
   depende da versão correta e da identificação do piloto/decisão por negócio.
5. **Referência final jurídica/fiscal** e execução manual de cada ato. Donos:
   Victor, jurídico e contabilidade. Automação posterior, sem assinatura/emissão aqui.

Menor ação de Victor para adiantar o bloqueio causal: abrir o Sandbox em
Integrações → Logs de Webhooks e avisar, sem senha/código no chat; alternativamente,
aguardar a resposta à solicitação que o Central já enviou. O pedido de execução
QA deve citar projeto, commit a fixar, as duas versões/hashes e backup; não é
uma autorização genérica de publicar/reativar/cobrar.

## Fontes de coordenação e preservação

Decisões e os três checkpoints anteriores foram relidos. Calendário original
relido via metadata e ranges `Agora — Victor!A1:E9`, `Resumo 01-08!A1:I6` e
`Plano diário 20-31!A1:P9`: ainda refletem fechamento de 22/10/análise Asaas.
Atualização de aprovação veio da mensagem primária de 23/10, não dos quadros.
Figma **NÃO RELIDO**, quota conhecida, sem insistência; usado espelho local v6
`docs/execucao-evento-28-10.md` e passagem humana atual. Quadros pertencem ao Central.

Skills de deploy/Supabase orientaram pinagem de alvo, conferência de versão,
ledger e permissões em leitura; skills Drive/Sheets orientaram leitura limitada.
Não houve edição de onboarding, criativos, backend, páginas legais, credenciais,
flags, quadros ou arquivos concorrentes. Bloco encerrado; Central faz o handoff.
