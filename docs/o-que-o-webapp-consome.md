# O que o webapp consome do backend — e o que ele ignora

Medido em 10/09/2026 contra a API de produção e o banco real. Cada número
tem o comando ao lado.

**Nada aqui é proposta.** É o mapa que o item 1 pediu.

---

## 0. Comece por aqui: a resposta da pergunta que decide o resto

**NÃO EXISTE NENHUMA TELA QUE MOSTRE RESULTADO DE CAMPANHA.**

Não é "existe e está incompleta". Não existe. Três telas tentam, e as três
leem a fonte errada:

| tela | lê | linhas hoje |
|---|---|---|
| `/vendas` | `metrics_daily.conversions` | **0** |
| `/anuncios` | `metrics_daily` | **0** |
| `/inicio` | `metrics_daily` + consolidado | **0** / só o lado do dono |

```sql
select count(*) from public.metrics_daily;   -- 0
select count(*) from public.campaigns;       -- 0
```

`metrics_daily` é tabela do **Supabase**, e o coletor do backend não
escreve nela. Os 13 dias de métrica que existem estão do outro lado, e o
webapp não os alcança por nenhum caminho.

O caminho que existiria é o consolidado, que o `/inicio` já chama. Medido
para o único negócio com execução:

```bash
GET /negocios/a85c37a9…/consolidado
→ investiu_centavos: null   pessoas_que_chegaram: null
  tem_dado_da_plataforma: false
  vendas: 22   voltou_centavos: 120000
```

Ou seja: **a rota responde, e o lado da plataforma vem vazio.** O que
chega é só o que o dono respondeu à mão.

---

## 1. Toda chamada ao backend que existe no código

Dez funções em `lib/backend/`, e **todas saem do servidor do Next**.
Nenhuma sai do browser — os 8 arquivos de `lib/backend/` abrem com
`import "server-only"`, e o build quebra se um componente de cliente
importar qualquer um deles (medido em `docs/superficie-do-token.md` §1).

| rota | arquivo | quem chama | de onde |
|---|---|---|---|
| `POST /cadastro` | `cadastro.ts:118` | `lib/pipeline/disparar.ts` | servidor |
| `GET /nichos` | `nichos.ts:83` | `/onboarding` (page + actions) | servidor |
| `GET /negocios/{id}/execucao` | `dia-seguinte.ts:72` | `lib/estado/cliente.ts`, `/inicio/actions.ts` | servidor |
| `GET /negocios/{id}/consolidado` | `dia-seguinte.ts:181` | `lib/estado/cliente.ts`, `/inicio/actions.ts` | servidor |
| `POST /execucoes/{id}/resposta-do-dono` | `dia-seguinte.ts:232` | `/inicio/actions.ts` | servidor |
| `POST /execucoes/{id}/pergunta-apresentada` | `dia-seguinte.ts:315` | `/inicio/actions.ts` | servidor |
| `GET /execucoes/{id}/consolidado` | `dia-seguinte.ts:116` | **ninguém** | — |
| `GET /execucoes-em-revisao` | `execucoes.ts:164` | **ninguém** | — |
| `GET /campanhas/pre-requisitos` | `pre-requisitos.ts:74` | **ninguém** | — |
| `GET /saude` | `cliente.ts:212` | **ninguém** | — |

```bash
# quatro clientes escritos e sem consumidor:
grep -rn "consolidadoDaExecucao\|execucoesEmRevisao\|preRequisitos" \
  --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./lib/backend/"
# → 0 ocorrências
```

**Quatro clientes prontos que nenhuma tela chama.** Não é código morto por
engano: são rotas mapeadas e embrulhadas cujo consumidor nunca foi
construído.

---

## 2. Quantas das rotas do backend o webapp consome

```bash
GET https://api.v2gmidia.com.br/openapi.json
→ 48 paths, 49 operações
```

O briefing diz 47; medi **49 operações em 48 paths**. A diferença é
`/execucoes/{id}/pergunta-apresentada`, que subiu em 03/09.

**Consumidas: 6 de 49.** Escritas mas sem consumidor: mais 4. **Ignoradas
por inteiro: 39.**

### As 39 que o webapp não chama, por dono

**De outro cliente — n8n e scripts. Não são falta do webapp (26):**

Os 12 `/agentes/*`, os 3 `/tagueamento/*`, `/observador/testar-aviso`,
`/onboarding/call`, `/campanhas`, `/campanhas/google`,
`/campanhas/google/{id}/publicar`, e os transicionadores de estado que o
pipeline chama para andar: `aguardar-fotos`, `aguardar-tagueamento`,
`cadastro-completo`, `decidindo-canal`, `estrutura-pronta`,
`gerando-criativo`, `iniciar-pipeline-texto`, `marcar-revisao`.

Quem manda o app andar é o n8n. O webapp lê estado, não o empurra.

**DEVERIAM ser consumidas pelo webapp (13):**

| rota | o que destrava | pilar |
|---|---|---|
| `GET /perguntas-pendentes` | o loop diário sair do mudo | loop |
| `POST /execucoes/{id}/criativo-pronto` | subir criativo próprio | 4 |
| `GET /execucoes/{id}/criativos` | ver as peças da execução | 4 |
| `POST /execucoes/{id}/fotos` | mandar as fotos que a tela pede | 1 |
| `POST /execucoes/{id}/criativos-enviados` | fechar o passo das fotos | 1 |
| `POST /execucoes/{id}/decidir-arquivos` | escolher o que entra | 4 |
| `POST /execucoes/{id}/aprovar` | aprovar a peça pela tela | 1 |
| `POST /execucoes/{id}/liberar-revisao` | devolver para revisão | 1 |
| `GET /execucoes/{id}` | o estado cru de uma execução | — |
| `PATCH /execucoes/{id}` | corrigir dado do cadastro | — |
| `POST /execucoes/{id}/dados-do-canal` | o canal escolhido | 1 |
| `GET /execucoes-vencidas` | tela de operador | — |
| `GET /execucoes/{id}/consolidado` | resultado POR CAMPANHA | 2 |

**`/execucoes/{id}/criativo-pronto` não aparece no `openapi.json` de
produção.** O briefing diz que ela existe e audita. Medido: não está
publicada. Ou não subiu, ou está sob outro caminho.

---

## 3. As telas que existem, e o que cada uma mostra

```bash
find app -name page.tsx    # 26 telas
```

**Área logada (11)**

| tela | o que mostra | fonte |
|---|---|---|
| `/inicio` | a cadeia do cliente, o card da pergunta do dia, e o acumulado do dono | `estadoDoCliente` + consolidado |
| `/vendas` | quantas pessoas começaram conversa | `metrics_daily` (vazia) |
| `/anuncios` | as peças e o que falta | `estadoDoCliente` + `metrics_daily` |
| `/alertas` | avisos | `decisions`, `campaigns` |
| `/meu-negocio` | o perfil entendido, campo a campo | Supabase |
| `/conta` | dados, tema, conexão do Meta | Supabase + admin |
| `/campanhas`, `/criativos` | redirecionam para `/anuncios` | — |
| `/revisar-perfil`, `/revisar-perfil/[proposta]` | operador | admin |
| `/saude-meta` | operador | admin |

**Fluxo de entrada (10):** `/onboarding`, `/onboarding/contas`, `/verba`,
`/conectar`, `/conectar/escolher`, `/expectativas`, `/aprovar`,
`/reprovado`, `/sem-instagram`, `/whatsapp-business`.

**Públicas (5):** `/` (marketing), `/entrar`, `/recuperar`, `/redefinir`,
`/exclusao-de-dados/[codigo]`.

---

## 4. O que este mapa NÃO cobre

- **Não olhei o que o n8n consome.** As 26 rotas classificadas como "de
  outro cliente" foram lidas pelo nome e pelo lugar no pipeline, não
  medidas contra os fluxos do n8n. Se alguma delas for do webapp, ela está
  na lista errada.
- **Não conferi o corpo das 39 rotas ignoradas.** Sei que existem e o que
  o nome diz; não sei o que devolvem.
- **`metrics_daily` vazia é o estado de hoje**, não uma propriedade. Se o
  coletor passar a escrever nela, três telas mudam sem ninguém tocar em
  código — e é por isso que elas não foram apagadas.
