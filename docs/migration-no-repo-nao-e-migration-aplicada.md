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
