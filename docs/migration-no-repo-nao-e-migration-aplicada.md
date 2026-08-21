# Ter a migration no repositório não é tê-la aplicada

MEDIDO em 21/08/2026, comparando `supabase/migrations/` com
`supabase_migrations.schema_migrations` do V2G-SITE.

---

## O padrão é real e vale escrever

Arquivo commitado e cadeia aplicada são **dois estados independentes**. Nada
no repositório sabe qual migration rodou; nada no banco sabe qual arquivo
existe. Ninguém conferia os dois.

Foi assim que a `0007_onboarding_por_call.sql` do `backend_v2g` ficou **13 dias
sem rodar** no V2G-SITE, com o modelo `Execucao` já declarando os cinco campos
dela desde 19/08. O sintoma foi `POST /cadastro` devolvendo 500 e o erro
`ID#172764` do n8n em 20/08. Ninguém suspeitou da migration porque o arquivo
estava lá, versionado, revisado.

## A conferência, e o que ela achou

Comparando os 20 arquivos com as 22 linhas do ledger:

```
arquivos: 20   aplicadas: 18   sem correspondência: 2
  -> 0001_init.sql
  -> 0006_conectar_meta.sql
aplicadas sem arquivo: init_consolidated_schema,
                       conectar_meta_chamavel_por_service_role,
                       perfil_empresa_rls_e_escrita,
                       procedencia_fecha_execute
```

**E os dois "não aplicados" são falso alarme.** Foram aplicados com outro
nome:

| arquivo | entrou no ledger como |
|---|---|
| `0001_init.sql` | `init_consolidated_schema` |
| `0006_conectar_meta.sql` | `conectar_meta_chamavel_por_service_role` |

Isso é o achado de desenho mais importante deste documento:

> **Comparar por nome não serve.** Das 22 aplicadas, 19 entraram sem o prefixo
> numérico e 3 com ele, e pelo menos 2 entraram com o nome trocado. Um
> conferidor por nome produz alarme falso, e alarme falso repetido é como se
> aprende a ignorar o conferidor.

A conferência que vale é **por objeto**: a migration diz o que cria, e o
conferidor pergunta ao banco se aquilo existe. `esvaziar_campos_do_cliente`
existir em `pg_proc` prova a 0017 aplicada melhor que qualquer nome no ledger.

## O caso concreto de 21/08 — as três suspeitas, todas aplicadas

Levantou-se que as migrations 0016, 0017 e 0019 do webapp nunca teriam sido
aplicadas, quebrando a `/meu-negocio` em produção. **As três estão aplicadas**,
e cada uma tem prova por objeto:

| migration | o que cria | prova medida |
|---|---|---|
| `0016_lucro_desejado_na_lista_branca` | põe `target_profit_per_customer` na lista branca do `confirmar_campo_do_cliente` | o campo tem `procedencia = confirmado` gravada em **19/08 23:31:50** — impossível se não estivesse na lista branca |
| `0017_esvaziar_campo_do_cliente` | função `esvaziar_campos_do_cliente(uuid, text[])` | existe em `pg_proc`, `search_path=public` |
| `0019_escrever_apenas_se_livre` | função homônima + tabela `divergencias_de_cadastro` | aplicada 21/08 20:18:01, testada nos quatro casos |

E o ledger confirma os três: `20260819200349`, `20260819200749`,
`20260821201801`.

## A `/meu-negocio` não está quebrada

O caminho do "tá certo" é o `confirmar_campo_do_cliente`. O negócio
`a85c37a9` tem **20 campos com `procedencia = confirmado`**, todos por
`cliente:f5188fd0-b274-46e8-81ff-e8e275450b74`, entre 19/08 20:11 e
**20/08 13:50**.

Cada uma dessas 20 linhas é um clique em "tá certo" que **funcionou**. A mais
recente é de ontem. Se a tela estivesse quebrada, nenhuma delas existiria.

## Como conferir daqui pra frente

**Pronto para usar, hoje:** a CLI do Supabase já faz a comparação, e o repo já
depende dela (`db:migrate: supabase db push`):

```
npx supabase migration list --linked
```

Ela imprime Local e Remote lado a lado, sem heurística de nome. Exige
`supabase link` uma vez.

**O que falta é ninguém rodar.** A proposta é entrar na família dos
conferidores que já existem:

```
conferir: pnpm typecheck && pnpm conferir:lista-branca && pnpm conferir:estado
          && pnpm conferir:verba && pnpm conferir:cadastro
          && pnpm conferir:migrations        ← novo
```

**E a camada por objeto**, que é a que não dá alarme falso: cada migration
declara os objetos que cria, num manifesto, e o conferidor pergunta ao
`pg_proc` e ao `information_schema` se cada um existe. É mais trabalho e é o
único jeito de a resposta ser sobre o schema em vez de sobre nomenclatura.

## A regra

> Migration no repositório é intenção. Migration no ledger é fato. E o ledger
> mente sobre nomes — quem responde de verdade é o objeto no schema.

---

## O conferidor foi feito — 21/08/2026

`pnpm conferir:migrations`, agora dentro do `pnpm conferir`. Desenho em
[`conferidor-de-migrations.md`](./conferidor-de-migrations.md); o manifesto
de objetos em `supabase/objetos.ts`.

**77 objetos conferidos** contra o schema vivo, os 20 arquivos, todos
presentes. Três coisas deste documento mudaram de estado:

- **A camada por objeto existe.** A porta é a especificação do PostgREST
  (`GET /rest/v1/`), que lista as 20 tabelas com todas as colunas e as 11
  funções expostas. O `pg_proc` e o `information_schema` não são
  alcançáveis com o que há no `.env.local` — o PostgREST expõe só o
  `public` — e essa porta responde a mesma pergunta para tabela, coluna e
  RPC.
- **A camada do `migration list --linked` NÃO roda**, e isso está impresso
  na saída em vez de pulado: o projeto não está linkado
  (`supabase/.temp/` só tem `cli-latest`, sem `project-ref`), e linkar pede
  credencial que não está no `.env.local`. Ela é a única camada que enxerga
  **migration aplicada sem arquivo no repo** — as quatro que este documento
  listou —, então essa metade da conferência continua sem dono.
- **31 coisas ficaram declaradas como fora do alcance** (índice,
  constraint, trigger, policy, grant, corpo de função, schema `private`), e
  o conferidor imprime essa contagem junto do verde. Um conferidor que
  confere 60% e diz "TUDO CERTO" produz confiança que não corresponde a
  nada.

### Duas coisas que o levantamento achou e que não estavam aqui

**1. A 0009 não cria nada.** `0009_backend_execucoes_criativos.sql` tem 13
linhas e **zero DDL** — é só o cabeçalho explicando que as tabelas vieram
do projeto do Oregon na unificação de 17/08. Consequência:

> A cadeia de migrations deste repositório **não reconstrói o banco.** Um
> `supabase db push` contra um projeto vazio produz um schema sem
> `execucoes`, `criativos` e `campanhas_meta` — e sem erro, porque não há
> DDL para falhar.

No manifesto as três entram como `documenta`, não como `cria`: o conferidor
confere que existem e imprime que não vieram desse arquivo. Escrever o DDL
delas a partir do schema vivo é lote próprio, e não foi feito.

**2. A 0002 se confere pela ausência.** Ela move `owns_business` e
`handle_new_user` para o schema `private` justamente para elas sumirem do
PostgREST. Então a prova de que está aplicada é elas **não** aparecerem na
lista de RPC — e o manifesto tem um tipo de objeto só para isso
(`rpc_ausente`). Objeto ausente é prova tão boa quanto presente.

### Base explícita

Um conferidor que nunca viu vermelho não está medindo. Dois controles:

- O §0 do próprio script declara quatro objetos inventados a cada execução
  e falha se não acusar os quatro. Ele roda sempre, não só quando alguém
  lembra.
- Declarei à mão dois objetos inexistentes na 0014 e conferi a saída:
  `1 FALHA(S)`, com os dois nomeados, e código de saída 1.
