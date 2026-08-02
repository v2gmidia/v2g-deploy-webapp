# Publicar campanha no Meta — desenho

> **Status: proposta, aguardando aprovação. Nada implementado.**
>
> Este é o primeiro lote que pode gastar dinheiro real do cliente. As
> regras de segurança abaixo não são recomendações — são invariantes que
> o código deve garantir, e cada uma tem um mecanismo concreto associado.

Marketing API **v25.0**, a mesma versão já fixada em `lib/meta/oauth.ts`.

---

## 0.a Ensaio a seco: `validate_only` — TESTADO, FUNCIONA

Toda criação da cadeia aceita `execution_options=["validate_only"]`. O
Meta valida o pedido inteiro e **não cria nada**.

Testado contra a conta real `act_2818009911919726`, contando os objetos
antes e depois:

```
POST /act_<id>/campaigns   { ..., execution_options: ["validate_only"] }
  →  {"success": true}
  campanhas antes: 5   depois: 5
```

O mesmo pedido sem `is_adset_budget_sharing_enabled` devolveu, também sem
criar nada:

```
(#100 / subcode 4834011) "É necessário especificar True ou False no campo
is_adset_budget_sharing_enabled se você não estiver usando o orçamento da
campanha."
```

Ou seja: valida de verdade, com a mensagem específica, em português, no
campo `error_user_msg`. **Este é o mecanismo de pré-checagem do lote.**
Roda a cadeia inteira em seco antes de criar o primeiro objeto — o que
torna a invariante "nada meio-criado" muito mais barata de garantir do
que a limpeza descrita na seção 7.

Use `error_user_msg` quando existir: já vem traduzido e escrito para o
usuário final. `message` é para log.

### Por que a checagem de WhatsApp mora aqui, e não na conexão

Não existe forma de perguntar à API se uma Página tem WhatsApp ligado —
está documentado com os dados em `docs/oauth-meta.md`, seção 2.1. A
pergunta certa não é "esta página tem número?", é "este criativo seria
aceito?", e `validate_only` no `POST /adcreatives` responde exatamente
isso, no momento em que importa.

**Ainda não foi possível ver a mensagem do caso "página sem WhatsApp"**,
porque uma condição anterior barra o pedido — ver 0.b.

---

## 0.b BLOQUEIO: o app precisa sair do modo de desenvolvimento

A validação do criativo falha antes de chegar ao WhatsApp:

```
POST /act_<id>/adcreatives  (CTWA, validate_only)
  →  (#100 / subcode 1885183)
     "O post do criativo dos anúncios foi criado por um app que está em
      modo de desenvolvimento. Ele deve estar em modo público para criar
      este anúncio."
```

Isto **não é um detalhe do teste** — é um pré-requisito de lançamento.
Nenhum anúncio pode ser criado por este app, para ninguém, enquanto ele
estiver em desenvolvimento. Vai junto com o App Review de `ads_read`,
`ads_management`, `business_management`, `pages_show_list` e
`pages_read_engagement`.

Consequência para o planejamento: dá para escrever e testar toda a cadeia
até `adsets` agora; `adcreatives` e `ads` só ganham teste real depois que
o app for público.

---

## 0. As cinco invariantes, e o que garante cada uma

| Invariante | Mecanismo |
|---|---|
| Tudo nasce `PAUSED` | `status: "PAUSED"` é constante no código, não parâmetro. Nenhuma função deste lote aceita status como argumento. |
| Nada é ativado por código | `retomarCampanha()` fica **declarada e não implementada** (§10). Ativar exige outro lote e confirmação humana. |
| Retry não duplica | Chave de publicação persistida + busca-antes-de-criar (§4). |
| Orçamento validado | Teto do banco, piso consultado na própria API do Meta (§5). |
| Rastro mesmo se a API falhar | `decisions` escrito **antes** e **depois** de cada criação (§6). |

**A invariante que sustenta as outras:** objeto `PAUSED` não gasta. Uma
campanha órfã, um conjunto duplicado, um anúncio criado duas vezes — nada
disso custa um centavo enquanto estiver pausado. É isso que transforma
"bug de publicação" em "lixo para limpar" em vez de "prejuízo".

---

## 1. A cadeia de objetos e a ordem

```
1. AdImage      POST /act_<id>/adimages       → image_hash
2. Campaign     POST /act_<id>/campaigns      → campaign_id
3. AdSet        POST /act_<id>/adsets         → adset_id     (precisa de campaign_id)
4. AdCreative   POST /act_<id>/adcreatives    → creative_id  (precisa de image_hash + page_id)
5. Ad           POST /act_<id>/ads            → ad_id        (precisa de adset_id + creative_id)
```

A ordem é imposta por dependência, não por escolha. Os passos 1 e 2 são
independentes entre si e poderiam ser paralelos; mantê-los em série
simplifica o rastro em `decisions` e não custa nada em tempo percebido.

**Onde o dinheiro entra:** só o **AdSet** tem orçamento. Campanha sem
conjunto não gasta; conjunto pausado não gasta. O ponto de risco é
exatamente um, e é o passo 3.

---

## 2. Campos obrigatórios e de onde vem cada valor

### 2.1 Campaign — `POST /act_<id>/campaigns`

| Campo | Valor | Origem |
|---|---|---|
| `name` | texto | `campaigns.name`, com o sufixo de idempotência (§4) |
| `objective` | **PENDENTE** | decisão do Gabriel (§9.1) |
| `status` | `PAUSED` | constante |
| `special_ad_categories` | `[]` | constante — **é obrigatório mesmo vazio**; omitir devolve erro |
| `buying_type` | `AUCTION` | constante |

### 2.2 AdSet — `POST /act_<id>/adsets`

| Campo | Valor | Origem |
|---|---|---|
| `name` | texto | derivado do nome da campanha |
| `campaign_id` | do passo 2 | — |
| `daily_budget` | **inteiro em centavos** | `businesses.monthly_budget` ÷ 30, validado (§5) |
| `billing_event` | `IMPRESSIONS` | constante |
| `optimization_goal` | **PENDENTE** | §9.3 |
| `bid_strategy` | `LOWEST_COST_WITHOUT_CAP` | constante |
| `targeting` | objeto | cidade e raio de `businesses`; resto **PENDENTE** (§9.2) |
| `promoted_object` | depende do objetivo | **PENDENTE** — ver §9.1 |
| `status` | `PAUSED` | constante |
| `start_time` | agora + 1h | evita começar no instante da ativação |

`targeting` na parte que já temos:

```json
{
  "geo_locations": {
    "custom_locations": [
      { "latitude": <lat>, "longitude": <lng>, "radius": <businesses.radius_km>, "distance_unit": "kilometer" }
    ]
  }
}
```

> **Buraco conhecido:** temos `businesses.city` como **texto livre**
> ("São Paulo, SP") e `radius_km` como inteiro. A API precisa de
> **coordenadas** ou de uma chave de cidade do próprio Meta. Isso exige
> um passo de resolução — `GET /search?type=adgeolocation&q=<cidade>` —
> e o resultado precisa ser guardado, senão resolvemos a mesma cidade a
> cada publicação. Ver migration em §8.

### 2.3 AdCreative — `POST /act_<id>/adcreatives`

| Campo | Valor | Origem |
|---|---|---|
| `name` | texto | derivado |
| `object_story_spec.page_id` | id da página | `meta_connections.meta_page_id` |
| `object_story_spec.link_data.image_hash` | do passo 1 | — |
| `object_story_spec.link_data.message` | corpo do anúncio | `creatives.copy` (jsonb) |
| `object_story_spec.link_data.name` | título | `creatives.copy` ou `offers.payload` |
| `object_story_spec.link_data.link` | destino | **PENDENTE** (§9.1) |
| `object_story_spec.link_data.call_to_action` | `{type, value}` | **PENDENTE** (§9.1) |

`creatives.copy` é jsonb livre — saída de LLM, formato ainda não
assentado (decisão registrada em `schema-consolidado.md`). A leitura
precisa ser defensiva e falhar com mensagem clara se faltar título ou
corpo, **antes** de qualquer chamada ao Meta.

### 2.4 Ad — `POST /act_<id>/ads`

| Campo | Valor | Origem |
|---|---|---|
| `name` | texto | derivado |
| `adset_id` | do passo 3 | — |
| `creative` | `{ "creative_id": <id> }` | do passo 4 |
| `status` | `PAUSED` | constante |

---

## 3. De onde sai o token

`public.obter_token_meta(business_id)` (migration 0007), chamada com
`service_role`. Devolve `null` quando a conexão está morta — e `null`
**aborta a publicação antes da primeira chamada**, em vez de queimar
requisição para descobrir o óbvio.

---

## 4. Idempotência

**O problema real:** a chamada cria a campanha no Meta, a resposta se
perde (timeout, deploy no meio, aba fechada), o retry cria a segunda.
Duas campanhas idênticas, e quando alguém ativar, gasta em dobro.

A Marketing API **não oferece um cabeçalho de idempotência genérico**
que eu possa garantir para os cinco endpoints. Então a idempotência é
nossa, em três camadas:

**Camada 1 — estado persistido.** `campaigns` ganha `publish_key uuid` e
os ids externos de cada etapa. Antes de criar qualquer objeto, o código
lê a linha: se `external_campaign_id` já existe, pula o passo 2 e segue
do 3. A publicação vira uma máquina de estados retomável, não uma
transação de tudo ou nada.

**Camada 2 — marca no nome.** O `name` de cada objeto leva um sufixo
`[v2g:<8 primeiros do publish_key>]`. Se o estado local se perdeu mas o
objeto existe no Meta, dá para reencontrá-lo:

```
GET /act_<id>/campaigns?filtering=[{"field":"name","operator":"CONTAIN","value":"v2g:ab12cd34"}]
```

Achou, reaproveita o id e grava. É a rede que pega o caso em que a
gravação local falhou depois da criação remota.

**Camada 3 — trava de concorrência.** `campaigns.publish_state` com
`draft → publishing → published | failed`. A função recusa começar se já
estiver em `publishing` há menos de 10 minutos. Impede dois cliques e
duas execuções simultâneas de fila.

> A camada 2 depende de o nome não ser editado por fora. Se alguém
> renomear a campanha no Gerenciador de Anúncios, a busca falha e o
> retry cria uma segunda — **paused**, então sem custo, mas duplicada.
> A camada 1 cobre o caso comum; a 2 é rede de segurança, não garantia.

---

## 5. Validação de orçamento

O campo `daily_budget` é **inteiro, em centavos**. `R$ 80,00` é `8000`.
Um erro de fator 100 aqui é 100× o gasto do cliente — é o bug mais caro
que este lote pode ter.

Validação, na ordem, antes de qualquer chamada:

1. **Origem única:** `businesses.monthly_budget`. Se for nulo, **aborta**
   com mensagem para o usuário definir o teto. Nunca assume um padrão.
2. **Cálculo:** `diario_centavos = round(monthly_budget * 100 / 30)`.
3. **Piso — consultado, não chutado:**
   `GET /act_<id>/minimum_budgets` devolve o mínimo por moeda para
   aquela conta. Guardar em `ad_accounts.min_daily_budget_cents` com
   validade curta. **Não vou fixar um número neste documento**: o mínimo
   varia por moeda, por país e por objetivo, e um valor errado escrito
   aqui viraria verdade no código.
4. **Teto absoluto:** `diario_centavos * 30 ≤ monthly_budget * 100`.
   Redundante com o passo 2 de propósito — é a checagem que pega um bug
   futuro no cálculo.
5. **Sanidade:** rejeita `≤ 0`, rejeita não-inteiro, rejeita acima de um
   limite fixo no código (proposta: `R$ 1.000,00/dia`) como último freio
   contra dado corrompido no banco.

> **O que o teto NÃO garante:** o Meta gasta até **125%** do orçamento
> diário num dia específico, compensando nos outros — o compromisso dele
> é semanal (≤ 7× o diário), não diário. Então `monthly_budget` precisa
> ser lido como "teto médio", e a interface não deve prometer que o
> cliente nunca verá um dia acima da média. A copy de `/conta` hoje diz
> "a IA nunca passa disso, nem num dia bom" — **isso precisa mudar**
> quando este lote entrar. Não mexi na copy porque é outro escopo, mas
> não dá para publicar sem corrigir.

---

## 6. Rastro em `decisions`

Duas linhas por objeto criado:

**Antes** — `kind = 'publish_attempt'`, `payload` com o passo, o
`publish_key` e os parâmetros já validados (incluindo o orçamento em
centavos). Escrita **antes** da chamada HTTP.

**Depois** — `kind = 'publish_result'`, `payload` com o id externo
retornado ou o erro normalizado (`code`, `subcode`, `type`,
`fbtrace_id`). Nunca o corpo cru, que em algumas rotas carrega token.

Se só existir a linha "antes", sabemos exatamente onde parou — inclusive
quando a falha foi tão dura que nada voltou.

---

## 7. Falha no meio da cadeia

**Nada é limpo automaticamente. Nada precisa ser.**

| Falhou em | O que fica no Meta | Gasta? | Ação |
|---|---|---|---|
| 1 (imagem) | nada | não | retry do zero |
| 2 (campanha) | nada | não | retry do zero |
| 3 (conjunto) | campanha pausada, sem conjunto | **não** | retry retoma do passo 3 |
| 4 (criativo) | campanha + conjunto pausados | **não** | retry retoma do passo 4 |
| 5 (anúncio) | campanha + conjunto + criativo | **não** | retry retoma do passo 5 |

Conjunto pausado não gasta, e conjunto sem anúncio não entrega mesmo se
ativado. Por isso a recomendação é **deixar o órfão e retomar**, não
apagar:

- apagar é uma chamada a mais que pode falhar, deixando estado pior;
- apagar numa corrida pode remover objeto que outra execução acabou de
  criar;
- o órfão é reaproveitado pelo `publish_key` na próxima tentativa.

O que **precisa** existir é visibilidade: `campaigns.publish_state =
'failed'` e `publish_error` com a mensagem, para a interface mostrar
"não conseguimos publicar" com um botão de tentar de novo, em vez de
silêncio.

Limpeza de órfãos antigos (campanha em `failed` há mais de 30 dias) é
rotina separada, fora deste lote.

---

## 8. Migrations necessárias

```sql
-- campaigns: estado da publicação
alter table public.campaigns
  add column publish_key        uuid,
  add column publish_state      text not null default 'draft',
  add column publish_error      text,
  add column external_adset_id  text,
  add column daily_budget_cents bigint;

alter table public.campaigns
  add constraint campaigns_publish_state_check
  check (publish_state in ('draft','publishing','published','failed'));

-- creatives: o que veio do upload e o que o Meta respondeu na revisão
alter table public.creatives
  add column external_image_hash text,
  add column status              text not null default 'draft';

alter table public.creatives
  add constraint creatives_status_check
  check (status in ('draft','pending_review','approved','rejected','paused'));

-- ad_accounts: piso do Meta, para não consultar a cada publicação
alter table public.ad_accounts
  add column min_daily_budget_cents bigint,
  add column min_budget_checked_at  timestamptz;

-- businesses: a cidade resolvida em coordenadas
alter table public.businesses
  add column geo_lat        numeric,
  add column geo_lng        numeric,
  add column geo_resolved_at timestamptz;
```

Três observações sobre essas colunas:

**`external_adset_id` vai para `campaigns`, não `creatives`.** No desenho
do lote 2 eu coloquei o adset em `creatives`, assumindo 1 criativo = 1
anúncio. Para publicar, o conjunto é irmão da campanha, não do criativo —
ele carrega orçamento e segmentação. O campo em `creatives` continua
válido para o dia em que houver vários conjuntos; hoje o que manda é o da
campanha.

**`creatives.status` × `creatives.meta_status`.** `meta_status` guarda o
`effective_status` cru do Meta; `status` guarda a nossa leitura
normalizada, que é o que a interface consulta. São diferentes de
propósito: o Meta tem mais de dez estados efetivos e a tela precisa de
cinco.

**`geo_lat`/`geo_lng`** existem porque resolver "São Paulo, SP" a cada
publicação é lento e frágil. Resolve uma vez, guarda.

---

## 9. O que o Gabriel precisa decidir

### 9.1 Objetivo da campanha e destino do lead — **PENDENTE**

É a decisão de maior consequência do lote: ela determina `objective`,
`optimization_goal`, `promoted_object`, o `call_to_action` e o que conta
como conversão nas métricas.

| Destino | `objective` | Pré-requisito no Meta | Custo de entrada |
|---|---|---|---|
| **WhatsApp** | `OUTCOME_ENGAGEMENT` com destino de mensagem | Número de WhatsApp Business vinculado à Página | Médio — exige WABA configurada e verificada |
| **Formulário instantâneo** | `OUTCOME_LEADS` com `leadgen_form` | Formulário criado via API, **URL de política de privacidade** na Página, e permissão `leads_retrieval` para baixar os leads | Alto — é outro escopo de App Review, e sem ele os leads ficam presos no Meta |
| **Direct do Instagram** | `OUTCOME_ENGAGEMENT` com destino Direct | Conta de Instagram profissional vinculada **e o escopo `instagram_basic`** | **Alto — reabre o escopo que removemos no lote anterior**, com produto Instagram Graph API e App Review |

**Por que ele precisa decidir, e não eu:** as três opções têm o mesmo
custo de código e custos de operação completamente diferentes. WhatsApp
casa com o resto do produto (todo o suporte já é por lá) mas depende de
WABA. Formulário instantâneo tem a melhor taxa de preenchimento e cria
uma dívida nova: alguém precisa consumir os leads. Direct do Instagram
desfaz uma decisão que acabamos de tomar.

Minha leitura, para ele contestar: **WhatsApp**, porque o lead cai onde o
atendimento já acontece e não cria um segundo lugar para o cliente
esquecer de olhar. Mas é decisão de operação, não de engenharia.

### 9.2 Segmentação padrão — **PENDENTE**

Temos `city` e `radius_km` do onboarding. Falta:

| Parâmetro | O que falta decidir | Nota |
|---|---|---|
| Raio | se `radius_km` do onboarding vai cru | Os valores que gravamos (5/25/60) são estimativas nossas para "aqui perto"/"cidade"/"região". O Meta aceita faixa própria de raio; 60 km pode estar acima do permitido para alguns formatos. |
| Idade | mínimo e máximo | Padrão do Meta é 18–65+. Nichos com restrição legal exigem `special_ad_categories`, que hoje mandamos vazio. |
| Gênero | todos, ou por nicho | |
| Interesses | usar ou não | Exige consultar a taxonomia do Meta (`/search?type=adinterest`). Segmentação ampla costuma render melhor com orçamento pequeno — é contraintuitivo e vale ele decidir com essa informação. |

### 9.3 Meta de otimização e janela de atribuição — **PENDENTE**

`optimization_goal` decide o que o Meta persegue; `attribution_spec`
decide o que ele conta como resultado.

**Por que isso não é detalhe técnico:** é essa escolha que define o que
entra em `metrics_daily.conversions` — e portanto o **"R$ 4,20 voltaram
pra cada R$ 1"** que domina o dashboard. Com atribuição de 7 dias por
clique o número é maior; com 1 dia, menor. O mesmo desempenho real vira
dois números diferentes na tela do cliente.

Ele precisa escolher sabendo que está calibrando a métrica que o produto
mostra como principal.

---

## 10. Interface para os lotes 6 e 7

Módulo `lib/meta/campanhas.ts`, tudo `server-only`, tudo recebendo
`businessId` para resolver token e conta internamente — quem chama nunca
manipula token.

```ts
/** Cria campanha + conjunto + criativo + anúncio. TUDO PAUSED. Idempotente. */
publicarCampanha(input: {
  campaignId: string;
  /** valida tudo e devolve o que enviaria, sem chamar o Meta */
  simular?: boolean;
}): Promise<{
  ok: boolean;
  estado: "published" | "failed";
  externalCampaignId?: string;
  externalAdsetId?: string;
  externalAdId?: string;
  erro?: { mensagem: string; codigo?: number; subcodigo?: number };
}>;

/** Pausa campanha e todos os objetos abaixo. Sempre seguro. */
pausarCampanha(campaignId: string): Promise<{ ok: boolean; erro?: string }>;

/** NÃO IMPLEMENTADA NESTE LOTE — ativar é decisão humana (§0). */
retomarCampanha(campaignId: string): Promise<never>;

/** Altera o orçamento diário. Passa pela mesma validação da §5. */
alterarOrcamento(campaignId: string, diarioCentavos: number): Promise<{
  ok: boolean;
  anteriorCentavos?: number;
  erro?: string;
}>;

/** Troca o criativo do anúncio existente, sem recriar campanha. */
trocarCriativo(campaignId: string, creativeId: string): Promise<{ ok: boolean; erro?: string }>;

/** Lê insights e grava em metrics_daily. Idempotente por (campanha, criativo, dia). */
sincronizarMetricas(businessId: string, desde: string, ate: string): Promise<{ diasGravados: number }>;

/** Lê effective_status dos anúncios e grava em creatives.status. */
sincronizarStatusDeRevisao(businessId: string): Promise<{ atualizados: number }>;
```

Três notas para quem for consumir:

**`simular: true` existe para o lote 7.** O motor de regras vai querer
saber o que aconteceria antes de acontecer. Sem isso, testar regra
significa criar objeto no Meta.

**`retomarCampanha` está declarada e lança.** A assinatura existe para o
lote 7 poder compilar contra ela; a implementação exige um lote com
confirmação humana no caminho. Deixar a assinatura sem implementação é
proposital — é mais honesto que uma função que ativa "só quando o
parâmetro certo é passado".

**`alterarOrcamento` recebe centavos, não reais.** O tipo não protege
contra isso, então o nome do parâmetro carrega a unidade. É a mesma
armadilha da §5, agora na fronteira entre dois lotes.

---

## 11. Sincronização de métricas — onde roda

Duas rotinas: `sincronizarMetricas` (diária, granularidade de dia) e
`sincronizarStatusDeRevisao` (mais frequente — é ela que alimenta o aviso
de anúncio reprovado, e reprovação parada por 24h é campanha parada por
24h).

### As três opções

| | Vercel Hobby | Vercel Pro | Cloud Run + Scheduler |
|---|---|---|---|
| Frequência | **1×/dia**, em hora imprecisa dentro da janela | por minuto | qualquer |
| Custo | já pago (US$ 0) | **US$ 20/mês por usuário** | ~US$ 0 no volume atual; free tier generoso |
| Duração máxima | limite de função curto | maior, ainda limitado | sem limite prático |
| Complexidade | nenhuma — é uma rota | nenhuma | **alta**: novo deploy, novo CI, segredos em outro lugar, outro painel para monitorar |
| Onde vive o segredo | env da Vercel | env da Vercel | Secret Manager do GCP |

### A quarta opção, que já existe

**O N8N do Gabriel.** Ele já roda agendado, já tem `service_role`, e já
vai ler `obter_token_meta` para operar campanhas. Chamar uma rota nossa
autenticada num intervalo qualquer é trabalho de minutos para ele, sem
infraestrutura nova.

### Recomendação

**Escrever a sincronização como função pura, chamável de qualquer
lugar**, e expor uma rota `POST /api/sync/metricas` protegida por segredo
compartilhado. Aí:

- **hoje:** N8N chama de hora em hora. Custo zero, zero infraestrutura
  nova, e o Gabriel já está nesse fluxo.
- **se o N8N sair do caminho:** Vercel Pro, US$ 20/mês, uma linha de
  `vercel.json`.
- **quando o volume crescer** a ponto de a sincronização estourar o
  tempo de função: Cloud Run, trocando **quem chama**, não a lógica.

O Hobby sozinho não serve: 1×/dia em hora imprecisa significa que um
anúncio reprovado às 9h só apareceria no dia seguinte.

Não recomendo começar por Cloud Run. Ele é a escolha certa para o lote 7
(motor de regras rodando de madrugada, com tempo de execução longo) e
seria complexidade adiantada aqui.

---

## 12. Tratamento de erro por tipo

| Situação | Como detectar | O que fazer | O que o cliente vê |
|---|---|---|---|
| Token inválido/expirado | `code 190` (subcódigos 458/460/463) — já mapeado em `lib/meta/erros.ts` | `marcar_conexao_meta_quebrada`, **não retentar** | Faixa de reconexão (já existe) |
| Conta sem forma de pagamento | erro de nível de conta na criação do conjunto | `ad_accounts.status = 'no_permission'`, abortar | "Falta cadastrar uma forma de pagamento na sua conta de anúncios" + caminho humano |
| Conta bloqueada | `account_status ≠ 1` — **verificar antes de publicar** | abortar antes da primeira chamada | O motivo em português, já traduzido em `lib/meta/graph.ts` |
| Orçamento abaixo do mínimo | prevenido na §5; se escapar, erro na criação do conjunto | abortar, gravar `publish_error` | "O valor está abaixo do mínimo que o Facebook aceita para a sua região" |
| Segmentação vazia/inválida | erro de spec na criação do conjunto | abortar | "Não conseguimos definir a região dos anúncios" + link para conferir cidade |
| Limite de requisições | `code 4` / `17` / `613` | **retry com espera exponencial**, único caso de retry automático | nada — resolve sozinho |

Os códigos numéricos exatos das linhas 2, 4 e 5 eu **não vou fixar aqui**:
a família 190 está verificada em produção, as demais eu só vi em
documentação e o mapa correto se constrói observando o primeiro erro real
de cada tipo. O código deve tratar por **categoria**, com fallback
genérico, e o mapa cresce conforme aparecem — igual ao que foi feito em
`lib/auth-errors.ts`.

---

## 13. Imagem do criativo

Upload direto para o acervo da conta:

```
POST /act_<id>/adimages
multipart/form-data, campo `bytes` ou `filename`
→ { images: { <nome>: { hash, url } } }
```

O `hash` vai para `creatives.external_image_hash` e é o que o
`object_story_spec` referencia.

**Neste lote a origem do arquivo é upload manual** — não existe geração
de criativo nem bucket de Storage. A função recebe o binário e não
pergunta de onde veio. É isso que faz o lote 6 trocar só a origem: passar
a ler do Storage em vez de receber upload, sem tocar em publicação.

Ordem: o upload é o passo 1 justamente por ser o mais provável de falhar
(arquivo grande, formato recusado) e o mais barato de repetir — falhar
aqui não deixa nada para trás.

---

## 14. O que fica de fora deste lote

Ativar campanha. Geração de criativo. Motor de regras. Pagamento.
Limpeza de órfãos antigos. Múltiplos conjuntos por campanha. Testes A/B
de criativo. A correção da copy de `/conta` sobre o teto de investimento
(§5) — necessária, mas é mudança de texto e pede o seu aval.
