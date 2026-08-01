# Schema consolidado — V2G

> **Status: aprovado e aplicado** no projeto `V2G-SITE` (migrations 0001,
> 0002 e 0003). Dois ajustes entraram na aprovação e estão refletidos no
> SQL, mas o texto abaixo é o da proposta original — leia as ressalvas:
>
> 1. `decisions` ficou como **tabela própria**, com `run_id` referenciando
>    `analysis_runs` (a §1.2 falava em decompor `execucoes` em `decisions`
>    sem separar as duas coisas; run é a execução, decision é o julgamento).
> 2. `businesses.profile_id` nulável foi aprovado **com** tratamento
>    explícito de órfãos — ver §5 e a seção 12 da `0001_init.sql`.
>
> As instruções operacionais para o N8N estão em
> [`n8n-repontamento.md`](./n8n-repontamento.md).

## Contexto

Hoje existem dois projetos Supabase com dois modelos de dados que descrevem
as mesmas entidades:

| Projeto | Ref | Estado |
|---|---|---|
| `v2gmidia's Project` | `cvwxfalweuplrlchzzeo` | 4 tabelas do N8N, 3 linhas em `execucoes`, resto vazio |
| `V2G-SITE` | `ushccxpoxjikzqnwhgfd` | vazio |

O alvo é o **`V2G-SITE`**. O projeto antigo **não é tocado** — fica intacto
até o Gabriel confirmar que os fluxos do N8N foram repontados.

Os nomes do N8N (`clientes`, `execucoes`, `criativos`, `campanhas_meta`) e os
do webapp (`profiles`, `businesses`) descrevem o mesmo domínio com vocabulários
diferentes. Isso não é coexistência, é duplicação — e o custo dela aparece na
primeira query que precisar juntar "o que o N8N gerou" com "o que o usuário vê".

## Convenção (sem exceção)

- **Idioma:** inglês. Tabelas, colunas, índices, constraints, policies, funções.
- **Caso:** `snake_case`.
- **Tabelas:** plural (`businesses`, `campaigns`).
- **Chaves:** `id` para PK; `<entidade>_id` para FK interna; `external_*_id`
  para identificadores que pertencem a sistemas de terceiros (Meta).
- **Datas:** `created_at` / `updated_at`, sempre `timestamptz`.
- **Booleanos:** prefixo `is_` ou `needs_` (`is_active`, `needs_review`).

Isso implica **renomear as colunas da `0001_init.sql`**, que hoje estão em
português (`nome`, `whatsapp`, `segmento`, `cidade`, `raio_km`, `ticket_medio`).
Ver "Impacto no código do app" no fim deste documento — não é uma mudança
só de banco.

---

## 1. Mapeamento: modelo do N8N → schema unificado

### 1.1 `clientes` → `businesses` + `meta_connections` + `ad_accounts`

`clientes` mistura três coisas: identidade do negócio, credencial do Meta e
conta de anúncios. Separar não é purismo — é o que permite um negócio ter mais
de uma conta de anúncios, e é o que tira o token de dentro de uma coluna.

| N8N: `clientes` | Destino | Coluna nova | Nota |
|---|---|---|---|
| `id` | `businesses` | `id` | uuid PK, preservado |
| `id_curto` | `businesses` | `short_id` | **preservar** — é a chave de lookup do N8N |
| `nome_negocio` | `businesses` | `name` | |
| `nicho` | `businesses` | `niche` | funde com `businesses.segmento` do webapp |
| `ativo` | `businesses` | `is_active` | |
| `meta_ad_account_id` | `ad_accounts` | `external_id` | vira linha própria, não coluna |
| `meta_page_id` | `meta_connections` | `meta_page_id` | |
| `meta_access_token` | **Vault** | `meta_connections.token_secret_id` | **nunca em coluna de tabela** |
| `criado_em` | `businesses` | `created_at` | |
| `atualizado_em` | `businesses` | `updated_at` | |

### 1.2 `execucoes` → decomposta

Esta é a tabela que mais justifica a consolidação. Ela hoje acumula **quatro
responsabilidades distintas** numa linha só:

1. **Fatos do negócio** (`ticket_medio`, `custo_direto_medio`,
   `lucro_desejado_por_cliente`, `orcamento_mensal_disponivel`, `diferenciais`,
   `garantia`, `prazo_entrega`, `politica_pagamento`, `disponibilidade`,
   `janela_funcionamento`, `descricao_livre`).
   Não são dados de execução — são atributos do negócio, recoletados a cada
   run porque o N8N nunca teve um onboarding persistente. **Vão para `businesses`.**
2. **Oferta gerada** (`oferta` jsonb) → **`offers`**
3. **Estrutura de campanha e copy** (`estrutura_campanha`, `copy` jsonb) →
   **`campaigns`** e **`creatives`**
4. **Julgamento da IA** (`classificacao`, `diagnostico`, `requer_revisao`,
   `status`) → **`decisions`**

| N8N: `execucoes` | Destino | Coluna nova |
|---|---|---|
| `id` | `analysis_runs` | `id` |
| `cliente_id` | `analysis_runs` | `business_id` |
| `nome_negocio` | — | **descartar** (duplicata denormalizada de `businesses.name`) |
| `descricao_livre` | `businesses` | `description` |
| `ticket_medio` | `businesses` | `avg_ticket` |
| `custo_direto_medio` | `businesses` | `avg_direct_cost` |
| `lucro_desejado_por_cliente` | `businesses` | `target_profit_per_customer` |
| `orcamento_mensal_disponivel` | `businesses` | `monthly_budget` |
| `diferenciais` | `businesses` | `differentiators` (text[]) |
| `garantia` | `businesses` | `guarantee` |
| `prazo_entrega` | `businesses` | `delivery_time` |
| `politica_pagamento` | `businesses` | `payment_policy` |
| `disponibilidade` | `businesses` | `availability` |
| `janela_funcionamento` | `businesses` | `business_hours` |
| `classificacao` | `decisions` | linha com `kind = 'classification'`, `payload` jsonb |
| `diagnostico` | `decisions` | linha com `kind = 'diagnosis'`, `payload` jsonb |
| `oferta` | `offers` | `payload` jsonb |
| `estrutura_campanha` | `campaigns` | `structure` jsonb |
| `copy` | `creatives` | `copy` jsonb |
| `requer_revisao` | `analysis_runs` | `needs_review` |
| `status` | `analysis_runs` | `status` |
| `criado_em` | `analysis_runs` | `created_at` |

> **Proposta de tabela adicional: `analysis_runs`.** Não estava na sua lista de
> 7 tabelas. Argumento: se `execucoes` simplesmente desaparecer, perdemos o
> vínculo entre os artefatos gerados no mesmo run — qual oferta saiu junto de
> qual diagnóstico e de qual estrutura de campanha. `analysis_runs` é uma tabela
> magra (id, business_id, input_snapshot, status, needs_review, created_at) que
> serve de âncora de correlação e de registro de auditoria do que a IA recebeu
> como entrada. **Isto precisa da sua aprovação explícita** — se você preferir,
> a alternativa é carregar um `run_id uuid` solto em cada tabela filha, sem
> tabela pai. Recomendo a tabela; o `run_id` solto não tem onde guardar o
> snapshot de entrada nem o status do run.

O `input_snapshot jsonb` resolve uma tensão real: os números do negócio mudam
com o tempo. `businesses` guarda o **valor atual**; `input_snapshot` guarda o
que a IA viu **naquele run**. Sem isso, um diagnóstico de três meses atrás fica
impossível de reproduzir.

### 1.3 `criativos` → `creatives`

| N8N: `criativos` | Coluna nova | Nota |
|---|---|---|
| `id` | `id` | |
| `execucao_id` | `analysis_run_id` | |
| `cliente_id` | `business_id` | mantido denormalizado — a RLS precisa de caminho direto |
| `tipo` | `type` | |
| `nome_arquivo` | `file_name` | |
| `storage_path` | `storage_path` | já em inglês |
| `descricao_visao` | `vision_description` | |
| `criado_em` | `created_at` | |

### 1.4 `campanhas_meta` → absorvida por `campaigns` + `creatives`

`campanhas_meta` é o **registro de publicação** no Meta, e guarda uma linha por
tupla (campanha, adset, criativo, anúncio) — a hierarquia do Meta achatada.

Proposta: não criar tabela separada. O nível de campanha vai para `campaigns`,
o nível de anúncio vai para `creatives` (na prática cada criativo vira um anúncio):

| N8N: `campanhas_meta` | Destino | Coluna nova |
|---|---|---|
| `campaign_id` | `campaigns` | `external_campaign_id` |
| `adset_id` | `creatives` | `external_adset_id` |
| `creative_id` | `creatives` | `external_creative_id` |
| `ad_id` | `creatives` | `external_ad_id` |
| `status_meta` | `creatives` | `meta_status` |
| `subido_em` | `creatives` | `published_at` |
| `execucao_id` | ambas | `analysis_run_id` |
| `cliente_id` | ambas | `business_id` |

> **Limite conhecido desta escolha:** ela assume 1 criativo = 1 anúncio, e não
> modela adsets como entidade própria. Isso é suficiente enquanto não formos
> gerenciar segmentação e orçamento por adset. Quando for, entra uma tabela
> `ad_sets` e as colunas `external_adset_id` migram para lá. Estou registrando
> agora para que seja uma decisão consciente, não uma descoberta futura.

### 1.5 `metrics_daily` — sem contrapartida no N8N

Nada no modelo atual coleta métricas. Tabela nova, granularidade dia ×
campanha × criativo, com `unique (campaign_id, creative_id, date)` para tornar
a ingestão idempotente (reprocessar o mesmo dia não duplica).

---

## 2. O que preservar e o que descartar

**Preservar:**
- `clientes.id` e `clientes.id_curto` — o `short_id` é como o N8N referencia
  um negócio de fora do banco. Quebrar isso quebra os fluxos.
- Os `jsonb` gerados pela IA (`oferta`, `classificacao`, `diagnostico`,
  `estrutura_campanha`, `copy`). São saída de LLM com formato ainda instável —
  normalizar em colunas agora seria prematuro. Ficam em `payload jsonb` e
  viram colunas quando o formato assentar.
- `criativos.storage_path` e `descricao_visao`.
- Os identificadores externos do Meta.

**Descartar:**
- `execucoes.nome_negocio` — duplicata denormalizada; a fonte é `businesses.name`.
- A repetição dos números do negócio a cada execução — vira estado em
  `businesses` + snapshot em `analysis_runs.input_snapshot`.
- **`clientes.meta_access_token`** — sai da tabela. Ver seção 4.
- A tabela `campanhas_meta` como entidade — absorvida (1.4).

---

## 3. Colunas que o N8N precisa para continuar funcionando

Estas são as que **não podem** mudar de semântica sem repontar o fluxo:

| Precisa | Onde | Por quê |
|---|---|---|
| `businesses.short_id` | `businesses` | chave de lookup externa |
| `businesses.id` | `businesses` | FK de tudo |
| `businesses.is_active` | `businesses` | filtro de quais negócios processar |
| insert em `analysis_runs` | — | cada run cria a linha âncora |
| insert em `offers`, `campaigns`, `creatives`, `decisions` | — | saídas do run |
| `meta_connections.token_secret_id` | Vault | leitura do token |

Consequência para o Gabriel: **um insert em `execucoes` vira vários inserts**
(1 em `analysis_runs` + N nas filhas). Esse é o custo real da consolidação e
está detalhado na seção 6.

---

## 4. Tokens do Meta — Vault, não coluna

`clientes.meta_access_token` hoje é `text` numa tabela. Qualquer vazamento de
`select` (policy mal escrita, service_role usada onde não devia, dump de
backup) entrega acesso à conta de anúncios do cliente.

Proposta:
- Extensão `supabase_vault` habilitada.
- O token vive em `vault.secrets`.
- `meta_connections.token_secret_id uuid` guarda **só a referência**.
- Nenhuma policy de `select` em `meta_connections` expõe o segredo — o valor
  só é resolvido por função `security definer` chamada pelo backend.
- Toda função `security definer` com `set search_path = ''` e referências
  totalmente qualificadas. Sem isso, um schema malicioso no `search_path` do
  chamador consegue sequestrar a resolução de nomes dentro da função — é
  escalonamento de privilégio, não teoria.

---

## 5. RLS — a regra e como ela se aplica

Regra única: **o usuário só acessa linhas do negócio que pertence a ele.**

`profiles` é o caso base (`auth.uid() = id`). `businesses` liga por
`profile_id`. Todas as demais tabelas descendem de `business_id`, e a checagem
vira uma função:

```sql
create function public.owns_business(target uuid)
returns boolean
language sql
security definer
set search_path = ''        -- obrigatório
stable
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = target and b.profile_id = auth.uid()
  );
$$;
```

Cada tabela recebe **quatro policies separadas** (select/insert/update/delete).
Nenhuma `for all`. O N8N não é afetado por nada disso: ele usa `service_role`,
que ignora RLS por definição.

> **Decisão em aberto — `businesses.profile_id` pode ser nulo?**
> Hoje o N8N cria negócios que **não têm usuário no webapp**. Se
> `profile_id` for `not null`, o N8N não consegue inserir. Se for nulável,
> existe um estado "negócio órfão" que nenhuma policy de usuário alcança
> (só `service_role`) — o que na prática é seguro, mas exige um mecanismo de
> **reivindicação**: quando o dono se cadastra, alguém precisa ligar o
> `profile_id`. Minha recomendação: `profile_id` nulável + coluna
> `claim_email text` preenchida pelo N8N + uma função que faz o vínculo no
> primeiro login com e-mail correspondente. **Precisa da sua decisão.**

---

## 6. Impacto no código do app (a conta que vem junto)

Renomear as colunas da `0001_init.sql` para inglês **quebra três arquivos**:

| Arquivo | O que muda |
|---|---|
| [`app/(protected)/inicio/page.tsx:20`](../app/(protected)/inicio/page.tsx) | `.select("nome")` → `.select("full_name")` |
| [`app/(public)/entrar/actions.ts:52`](../app/(public)/entrar/actions.ts) | `options.data: { nome, whatsapp }` → `{ full_name, whatsapp }` |
| `supabase/migrations/0001_init.sql` | trigger `handle_new_user()` lê `raw_user_meta_data ->> 'nome'` → `'full_name'` |

Os `name=` dos inputs do formulário em `entrar/page.tsx` podem continuar em
português (são rótulos de UI, não schema) — mas a chave enviada ao
`options.data` precisa bater com o que o trigger lê. Vou manter os `name=` do
HTML em português e traduzir na action, para não mexer no texto visível.

Como o `V2G-SITE` está vazio e a `0001` nunca foi aplicada em lugar nenhum,
**não há migration de rename** — a `0001` é reescrita no lugar. Isso só é
verdade porque nada foi aplicado ainda; a partir da primeira aplicação, todo
rename vira migration nova.

---

## 7. Dados existentes

As 3 linhas de `execucoes` estão no projeto **antigo**, que fica intacto.
A consolidação **não migra dados** — o `V2G-SITE` nasce vazio e o N8N passa a
escrever nele. Se essas 3 linhas forem relevantes (ex.: clientes reais em
operação), isso é um passo separado que eu não vou executar sem você pedir.

---

## 8. Resumo do que precisa da sua decisão

1. **`analysis_runs` como 8ª tabela** — aprovar ou usar `run_id` solto (§1.2)
2. **`campanhas_meta` absorvida** em `campaigns` + `creatives`, sem tabela
   `ad_sets` por enquanto (§1.4)
3. **`businesses.profile_id` nulável + mecanismo de reivindicação** (§5)
4. **Rename das colunas da `0001`** e os 3 arquivos que isso toca (§6)
5. **As 3 linhas de `execucoes` não são migradas** (§7)

Nenhuma migration será escrita antes de você responder a estes cinco pontos.
