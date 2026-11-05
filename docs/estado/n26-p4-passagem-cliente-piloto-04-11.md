# N26-P4 — passagem de um cliente-piloto — 04/11/2026

## 0. Veredito e próximo ato

**Checkpoint preparado; cliente ainda não passado.**

O plano de novembro mantém a passagem bloqueada até existir um piloto nominal
com contratação/vínculo, autoridade e ativos verificáveis. A aba
`Cauã — operação` ainda registra `Piloto 01 — escolher`; a aba
`Decisões e riscos` registra `Piloto ainda não aceito`.

Estado correto: **`aguardando identificação do piloto`**.

Victor escolhe um único lugar `C__` e entrega, por canal seguro, somente:

1. cliente/negócio e fonte da identificação;
2. pessoa autorizada, função e limite do que ela pode autorizar;
3. conta WebApp e `business_id`, se já existirem;
4. fonte da compra ou contratação histórica;
5. portfólio, conta de anúncios, Página e proprietários, se conhecidos;
6. pessoa do cliente que concede os acessos Meta;
7. confirmação de Cauã como gestor V2G responsável.

Sem esses dados, não emitir acesso, convidar pessoa, compartilhar ativo, criar
compra, publicar campanha nem preencher IDs por memória.

## 1. Ficha operacional mínima — preencher somente com prova

```text
PASSAGEM DO PILOTO — C__

Identidade e autoridade
[ ] Cliente/negócio:
[ ] Fonte da identificação:
[ ] Pessoa autorizada:
[ ] Função:
[ ] Escopo da autoridade:
[ ] Fonte da autoridade:

Contratação e vínculo V2G
[ ] Origem: compra confirmada / contratação histórica:
[ ] Fonte, data e estado da prova:
[ ] Conta WebApp:
[ ] business_id:
[ ] Proprietário do negócio na WebApp:
[ ] Divergência encontrada:

Responsável V2G
[ ] Cauã identificado pelo próprio usuário:
[ ] manager_accounts confirma Cauã + business_id:
[ ] Cauã entrou com login próprio e 2FA:
[ ] Nenhuma senha, token ou 2FA de Victor foi compartilhado:

Ativos Meta
[ ] Portfólio empresarial — nome / ID / proprietário:
[ ] Conta de anúncios — nome / act_ID / proprietário:
[ ] Página — nome / ID / proprietário:
[ ] Instagram — @ / ID / proprietário / não usado:
[ ] Dataset/pixel — nome / ID / proprietário / não usado:
[ ] Tarefas concedidas por ativo:
[ ] Acesso manual de Cauã comprovado:
[ ] Leitura API comprovada separadamente:
[ ] Publicação comprovada separadamente:

Reunião e operação
[ ] Estado do onboarding:
[ ] Reserva Google localizada para este negócio:
[ ] Data/hora/fuso:
[ ] Estado: confirmada / pendente / erro:
[ ] Fonte da confirmação:
[ ] Materiais e peça/versão:
[ ] Aprovação, conta, orçamento e período autorizados:

Controle
[ ] Etapa atual:
[ ] Evidência:
[ ] Impedimento:
[ ] Dono do impedimento:
[ ] Próximo ato único:
```

Um campo sem fonte fica `não verificado`. O mesmo e-mail, CNPJ, grupo,
agência ou responsável não autoriza unir negócios.

## 2. Portões da passagem

| Transição | Portão | Prova mínima | Dono | Estado em 04/11 |
|---|---|---|---|---|
| escolha → conferência | piloto nominal, pessoa autorizada e fonte | ficha C__ aberta, autoridade e origem localizáveis | Victor + cliente | **bloqueado** |
| conferência → acesso V2G | contratação e negócio coincidem | pedido confirmado ou evidência histórica conferida; `business_id` explícito | 01/02 | **não provado** |
| acesso V2G → onboarding | cliente comum abre somente o negócio aceito | sessão própria, outro negócio negado e ausência de fusão | 01/02 → 03/04 | **não provado em QA** |
| onboarding → reunião | cadastro concluído e Google conciliado | evento do mesmo negócio, data/fuso e estado honesto | 03/04 | **local; versão ainda não provada em QA** |
| reunião → acesso Meta | proprietário compartilha só ativos necessários | IDs, proprietários, tarefas e sessão própria de Cauã | cliente + Cauã | **não provado** |
| acesso Meta → leitura | atribuição interna e conta exata | `manager_accounts`, `business_id`, `act_ID`, período e resposta da fonte | Cauã + 07/08 | **contrato local; leitura real não provada** |
| leitura → criativo | materiais e versão pertencem ao mesmo negócio | fonte, versão, aprovação e autorização de orçamento | 05/06 | **não provado** |
| criativo → publicação | autorização específica e conferência manual | operador, horário, IDs devolvidos e estado lido na Meta | Cauã | **não autorizado por este checkpoint** |
| publicação → aceite | app e Meta reconciliados sem inventar resultado | mesmo negócio/conta/campanha/período; desconhecido não vira zero | 07/08 + cliente | **não provado** |
| piloto → próximos sete | todos os portões acima aceitos | ficha completa, pendências com dono e aceite do cliente | Victor + Cauã | **bloqueado** |

## 3. Rastreio do mesmo `business_id` no código local

### 3.1 Contratação histórica e primeiro acesso — 01/02

- `lib/contratacao/cadastro-contratado.ts:7-15` lê a concessão pelo ID
  explícito, compara e-mail/documento e só então consulta exatamente
  `g.business_id`; cadastro não concede propriedade.
- `supabase/migrations/20261104040711_historical_contract_access.sql:91-114`
  aceita somente a concessão explícita autenticada. A função usa
  `auth.uid()`, confere e-mail, evidência e o mesmo `business_id`; o
  navegador não fornece perfil nem negócio para vincular.
- `lib/contratacao/acesso-contratado.ts:16-25` só devolve concessões aceitas,
  não revogadas, do usuário e e-mail confirmados.

Portão: o caminho está protegido localmente, mas depende da migration,
publicação e flag `V2G_HISTORICAL_ACCESS_ENABLED` no ambiente nomeado.
Até lá, não é caminho homologado de QA ou produção.

### 3.2 Negócio ativo da sessão — 03/04

- `lib/multiconta/ativo.ts:21-75` parte do usuário autenticado, lê os
  negócios alcançáveis, aplica elegibilidade e trata o cookie apenas como
  preferência. Um ID de cookie não cria permissão.
- `lib/onboarding/pendencia-do-negocio.ts:43-60` exige o
  `businessId` e o `profile_id` do usuário na mesma consulta.
- `app/(protected)/inicio/page.tsx:158-163` usa o `estado.negocioId`
  tanto para a pendência quanto para a conciliação da agenda.

Portão: o recorte local da agenda passou anteriormente em 27/27,
`conferir:inicio` em 70/70 e preservação do onboarding em 77/77. Isso não
prova que a versão esteja publicada em QA nem que exista reserva do piloto.

### 3.3 Cauã e leitura Meta — 07/08

- `app/(protected)/gestor/page.tsx:33-35` exige sessão própria com papel
  `operador`.
- `app/(protected)/gestor/page.tsx:107-126` lê
  `manager_accounts`, forma a carteira do usuário e só escolhe para leitura
  um negócio que também esteja em `minhasContas`.
- `lib/backend/anuncios-do-negocio.ts:56-69` repete no servidor o papel de
  operador e a atribuição exata `business_id + operator_profile_id`.
- `lib/backend/anuncios-do-negocio.ts:80-98` aceita somente contas
  `ad_accounts` ativas e `ok` do mesmo `business_id`, recusa
  `contaId` externa e valida a resposta do backend contra negócio, conta e
  período.
- Para o cliente, `lib/backend/anuncios-do-negocio.ts:70-79` deriva o negócio
  da sessão autorizada; `app/(protected)/anuncios/page.tsx:102-108` deixa a
  URL escolher apenas a conta, que é revalidada no servidor.

Portão: o contrato local não substitui publicação da rota no backend,
configuração das flags, credencial válida, atribuição real de Cauã e uma
leitura autenticada de QA da conta do piloto.

## 4. Handoffs executáveis

### 01/02 — compra, contratação e acesso

Recebe: lugar C__, pessoa/negócio, fonte e data da contratação, e-mail/documento
conferidos, possível `business_id` e divergências.

Entrega: pedido confirmado **ou** evidência histórica conferida; pessoa e
negócio exatos; caminho de acesso proposto; outro negócio recusado. Não cria
nova compra para substituir histórico e não trata CPF/CNPJ como autoridade.

### 05/06 — materiais e criativo

Recebe: C__, `business_id`, marca e materiais com fonte, hipótese marcada
como hipótese, peça e versão exatas, forma da aprovação, conta/orçamento/período
autorizados.

Entrega: criativo recuperável no mesmo negócio, estado visível após novo login
e pacote inequívoco para operação. Peça aprovada não significa anúncio no ar.

### 07/08 — conta, campanha e números

Recebe: C__, `business_id`, `act_ID`, proprietários e autorização; IDs de
campanha/conjunto/anúncio/creative quando existirem; fonte, período, fuso,
atribuição e horário de coleta.

Entrega: leitura da mesma conta e janela no app e na Meta, origem explícita,
falha diferente de zero e vínculo negócio → conta → campanha → anúncio →
criativo. Acesso manual, leitura e publicação têm aceites independentes.

## 5. Roteiro de Cauã sem senha de Victor

1. Entrar na V2G com o próprio usuário e 2FA; confirmar que
   `manager_accounts` aponta Cauã para o `business_id` do piloto.
2. Abrir a ficha C__ e conferir identidade, autoridade e contratação antes de
   pedir qualquer acesso Meta.
3. Em reunião assistida, o proprietário do cliente adiciona a V2G como parceira
   e concede somente as tarefas necessárias. O cliente digita senha e 2FA;
   Cauã não recebe esses segredos.
4. Cauã abre o portfólio e cada ativo em sua própria sessão, registra nome, ID,
   proprietário, tarefa e horário. Ver na interface prova acesso manual, não API.
5. Entregar o pacote sem segredo a 07/08. Fazer a leitura no app apenas quando
   QA tiver rota, flags, credencial e atribuição válidas.
6. Entregar materiais e versão a 05/06. Publicar manualmente só depois da
   aprovação e autorização específicas.
7. Reabrir como cliente comum e conferir negócio, conta, campanha, fonte e
   período. Testar que outro negócio é negado.
8. Registrar aceite, bloqueio, dono e próximo ato. Só então propor C02.

## 6. O que só pode ser fechado em QA após publicação

- migration, ACL/RLS, flag e aceite real do acesso histórico;
- sessão real do cliente mostrando somente o negócio do piloto;
- versão da conciliação Google → Início publicada e reserva real reconciliada;
- atribuição real de Cauã e entrada com o próprio usuário;
- rota Meta publicada no backend com flag de leitura, credencial e conta
  vinculada;
- comparação da mesma conta/campanha/período entre Meta e WebApp;
- upload, fila e decisão do criativo por cliente e Cauã reais;
- negação de outro negócio em sessão externa comum.

Nenhum desses itens foi promovido de `não provado` por testes locais.

## 7. Aceite do N26-P4

Este checkpoint fecha a **preparação da passagem**, não a passagem do cliente:

- há uma ficha única, sem cliente inventado;
- cada transição tem prova, dono e portão;
- os handoffs 01/02, 05/06 e 07/08 usam o mesmo `business_id`;
- Cauã consegue executar o roteiro com usuário próprio, sem senha de Victor;
- os limites entre local, QA, Meta e produção estão explícitos;
- a ausência de nome, autoridade e ativos mantém o piloto bloqueado.

Próximo ato único: Victor nomeia o piloto e fornece a entrada mínima da seção 0.
