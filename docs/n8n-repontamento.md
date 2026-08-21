# Repontamento do N8N — para o Gabriel

> **PROPOSTO — não verificado, e a fonte agora é outra.** MEDIDO em
> 21/08/2026: das seis tabelas que a §4 manda o n8n preencher,
> `analysis_runs`, `offers`, `campaigns` e `decisions` têm **zero linhas**.
> Nenhuma instrução deste documento jamais rodou.
>
> **A fonte do contrato n8n ↔ backend é o repositório do backend**, em
> `v2gmidia/backend_v2g : n8n/CONTRATO.md` — 807 linhas, com os dois
> gatilhos, os dois formatos de corpo do webhook e o passo a passo dos 78
> nós. O que existir aqui sobre n8n é cópia envelhecida; em divergência,
> vale o de lá.
>
> Não é link relativo de propósito: são repositórios diferentes, e link que
> atravessa repo quebra sem avisar.

Documento operacional. O raciocínio por trás das mudanças está em
[`schema-consolidado.md`](./schema-consolidado.md); aqui é só o que precisa
mudar no fluxo.

> O projeto antigo (`v2gmidia's Project`) **não foi tocado** e continua no ar.
> Nada quebra até você repontar. Quando repontar, avise — só então a gente
> considera o antigo aposentado.

## 1. Para onde apontar

| Item | Valor |
|---|---|
| Projeto | `V2G-SITE` |
| Project ref | `ushccxpoxjikzqnwhgfd` |
| URL base | `https://ushccxpoxjikzqnwhgfd.supabase.co` |
| Endpoint REST | `https://ushccxpoxjikzqnwhgfd.supabase.co/rest/v1/<tabela>` |
| Chave | **`service_role`** |

**Sim, `service_role`.** O N8N é backend: ele escreve em nome de vários
negócios, não de um usuário logado. A `service_role` ignora RLS por
definição, que é exatamente o comportamento necessário aqui — com a `anon`
key todo insert seria bloqueado pelas policies.

A chave está em: painel do Supabase → Project Settings → API →
`service_role`. Guarde nas **credenciais do N8N**, nunca em nó de código
nem em variável visível no editor do fluxo.

Cabeçalhos de toda requisição:

```
apikey: <service_role>
Authorization: Bearer <service_role>
Content-Type: application/json
Prefer: return=representation
```

O `Prefer: return=representation` faz o insert devolver a linha criada —
você vai precisar do `id` retornado para encadear os inserts seguintes.

## 2. Renomeação de tabelas

| Antes | Agora |
|---|---|
| `clientes` | `businesses` (+ `meta_connections`, `ad_accounts`) |
| `execucoes` | `analysis_runs` (+ campos espalhados, ver §3) |
| `criativos` | `creatives` |
| `campanhas_meta` | absorvida por `campaigns` e `creatives` |

## 3. Renomeação de colunas

### `clientes` → `businesses`

| Antes | Agora |
|---|---|
| `id` | `id` |
| `id_curto` | `short_id` |
| `nome_negocio` | `name` |
| `nicho` | `niche` |
| `ativo` | `is_active` |
| `criado_em` | `created_at` |
| `atualizado_em` | `updated_at` |
| `meta_ad_account_id` | → tabela `ad_accounts`, coluna `external_id` |
| `meta_page_id` | → tabela `meta_connections`, coluna `meta_page_id` |
| `meta_access_token` | **não existe mais** — ver §6 |

### `execucoes` → espalhada

| Antes | Agora (tabela.coluna) |
|---|---|
| `id` | `analysis_runs.id` |
| `cliente_id` | `analysis_runs.business_id` |
| `criado_em` | `analysis_runs.created_at` |
| `status` | `analysis_runs.status` |
| `requer_revisao` | `analysis_runs.needs_review` |
| `nome_negocio` | **descartada** (use `businesses.name`) |
| `descricao_livre` | `businesses.description` |
| `ticket_medio` | `businesses.avg_ticket` |
| `custo_direto_medio` | `businesses.avg_direct_cost` |
| `lucro_desejado_por_cliente` | `businesses.target_profit_per_customer` |
| `orcamento_mensal_disponivel` | `businesses.monthly_budget` |
| `diferenciais` | `businesses.differentiators` |
| `garantia` | `businesses.guarantee` |
| `prazo_entrega` | `businesses.delivery_time` |
| `politica_pagamento` | `businesses.payment_policy` |
| `disponibilidade` | `businesses.availability` |
| `janela_funcionamento` | `businesses.business_hours` |
| `classificacao` | `decisions` (linha com `kind='classification'`, jsonb em `payload`) |
| `diagnostico` | `decisions` (linha com `kind='diagnosis'`, jsonb em `payload`) |
| `oferta` | `offers.payload` |
| `estrutura_campanha` | `campaigns.structure` |
| `copy` | `creatives.copy` |

### `criativos` → `creatives`

| Antes | Agora |
|---|---|
| `execucao_id` | `analysis_run_id` |
| `cliente_id` | `business_id` |
| `tipo` | `type` |
| `nome_arquivo` | `file_name` |
| `storage_path` | `storage_path` (igual) |
| `descricao_visao` | `vision_description` |
| `criado_em` | `created_at` |

### `campanhas_meta` → dividida

| Antes | Agora |
|---|---|
| `campaign_id` | `campaigns.external_campaign_id` |
| `adset_id` | `creatives.external_adset_id` |
| `creative_id` | `creatives.external_creative_id` |
| `ad_id` | `creatives.external_ad_id` |
| `status_meta` | `creatives.meta_status` |
| `subido_em` | `creatives.published_at` |

## 4. O que muda no fluxo de insert (a parte que dá trabalho)

Antes era **1 insert** em `execucoes` com tudo dentro. Agora são vários,
encadeados — cada um usa o `id` devolvido pelo anterior:

```
1. businesses      → upsert por short_id, devolve business_id
2. analysis_runs    → insert {business_id, input_snapshot, status}, devolve run_id
3. offers           → insert {business_id, analysis_run_id: run_id, payload: <oferta>}
4. campaigns        → insert {business_id, analysis_run_id: run_id, structure: <estrutura_campanha>}
5. creatives        → insert {business_id, analysis_run_id: run_id, campaign_id, copy: <copy>, ...}
6. decisions        → 2 inserts: kind='classification' e kind='diagnosis',
                      ambos com {business_id, run_id, payload}
```

Dois detalhes:

- **`input_snapshot`** (passo 2) é novo: mande ali o jsonb com os números do
  negócio como estavam **naquele run** (ticket médio, orçamento, etc.).
  `businesses` guarda o valor atual; o snapshot guarda o histórico. Sem ele
  não dá para reproduzir um diagnóstico antigo depois que os números mudam.
- **`decisions.run_id`** (não `analysis_run_id`) — é a única tabela onde a FK
  para o run tem esse nome. Nas outras é `analysis_run_id`.

Upsert de `businesses` por `short_id`:

```
POST /rest/v1/businesses?on_conflict=short_id
Prefer: resolution=merge-duplicates,return=representation
```

## 5. Negócios sem dono (importante)

O N8N cria negócios antes de o dono existir no webapp. Isso é esperado e
suportado: `businesses.profile_id` pode ficar nulo.

**Sempre preencha `claim_email`** com o e-mail do dono. Quando essa pessoa se
cadastrar no webapp com o mesmo e-mail, o vínculo acontece sozinho (trigger
no banco) e ela passa a enxergar o negócio. Sem `claim_email`, o negócio fica
órfão para sempre e só a `service_role` alcança — o usuário nunca vai vê-lo,
e **nenhum erro aparece**, que é o pior tipo de falha.

Para auditar órfãos a qualquer momento, chamando com `service_role`:

```
POST /rest/v1/rpc/list_orphan_businesses
```

## 6. Token do Meta — mudança de contrato

`clientes.meta_access_token` **não tem equivalente**. Token não fica mais em
coluna de tabela: o valor vai para o Supabase Vault e
`meta_connections.token_secret_id` guarda só a referência (um uuid).

A coluna `token_secret_id` é ilegível até para usuário autenticado — só
`service_role` acessa (verificado: leitura pelo cliente devolve HTTP 403).

**Isto ainda não tem fluxo definido.** Se o N8N hoje escreve ou lê esse
token, precisamos combinar como ele passa a entrar no Vault antes de você
repontar essa parte. Me chame que a gente fecha isso — não improvise
gravando o token em outra coluna.

## 7. Checklist

- [ ] Trocar URL base e credencial para o projeto `V2G-SITE` (`service_role`)
- [ ] Renomear tabelas e colunas conforme §2 e §3
- [ ] Quebrar o insert único em cadeia de 6 passos (§4)
- [ ] Passar a preencher `claim_email` (§5)
- [ ] Combinar o fluxo do token do Meta antes de mexer nessa parte (§6)
- [ ] Rodar um caso real de ponta a ponta e conferir
- [ ] Avisar quando estiver rodando — só então o projeto antigo é aposentado
