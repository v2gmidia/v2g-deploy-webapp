# Conferidor de migrations — desenho

**Escrito antes do código, em 21/08/2026.** O padrão está medido em
[`migration-no-repo-nao-e-migration-aplicada.md`](./migration-no-repo-nao-e-migration-aplicada.md);
este documento é a decisão de como conferir.

---

## 1. O que já estava decidido, e o que faltava decidir

O documento da medição fecha a questão principal: **comparar por nome não
serve.** Das 22 aplicadas, 19 entraram sem prefixo numérico e pelo menos 2
com o nome trocado; um conferidor por nome dá alarme falso, e alarme falso
repetido é como se aprende a ignorar o conferidor.

Ele propõe duas camadas:

1. `npx supabase migration list --linked` — comparação sem heurística de nome.
2. **Por objeto** — cada migration declara o que cria, e o conferidor
   pergunta ao banco se aquilo existe.

O que faltava decidir era **por qual porta perguntar ao banco**, e a
resposta muda o desenho inteiro.

## 2. A camada 1 não roda nesta máquina, e isso é achado, não obstáculo

`npx supabase migration list --linked` exige `supabase link`, e o projeto
**não está linkado**: `supabase/.temp/` tem só `cli-latest`, sem
`project-ref`. Linkar pede credencial de acesso do Supabase, que não está
no `.env.local`.

Então a camada 1 fica **declarada e desligada**, com o comando exato e o
motivo escritos na saída do conferidor. Não vai como silêncio: um pulo
silencioso é o que faz metade de um conferidor nunca rodar sem ninguém
perceber, que é a mesma doença do documento que gerou este.

## 3. Por qual porta o conferidor pergunta ao banco

O `supabase_migrations.schema_migrations` e o `pg_proc` **não são
alcançáveis com o que existe no `.env.local`**: o PostgREST expõe só o
schema `public`, e o ledger e os catálogos do Postgres não estão nele.

O que É alcançável, e responde a pergunta certa:

```
GET /rest/v1/     (com a service role key)
```

O PostgREST publica ali a própria especificação: **as 20 tabelas com todas
as colunas de cada uma, e as 11 funções expostas como RPC.** Uma requisição,
somente leitura, sem tocar em linha nenhuma.

É menos que o `pg_proc`, e o conferidor tem que dizer o quanto é menos —
ver §5.

## 4. Onde o manifesto mora, e por que não dentro do `.sql`

A alternativa óbvia era um comentário `-- objetos: …` no topo de cada
migration, junto do DDL. **Não.** Migration aplicada é registro histórico;
o próprio `0009` existe só "para o histórico bater com o banco". Editar 20
arquivos já aplicados para acrescentar metadado transforma histórico em
arquivo vivo, e a próxima pessoa não sabe mais o que é original.

O manifesto fica em `supabase/objetos.ts`, ao lado das migrations, com uma
entrada por arquivo. E o conferidor **recusa** arquivo sem entrada e
entrada sem arquivo: migration nova sem declarar objeto quebra o
`pnpm conferir`, que é o único jeito de o manifesto não envelhecer.

## 5. A parte que decide se este conferidor vale: o que ele NÃO alcança

Um conferidor que confere 60% e imprime "TUDO CERTO" é pior que nenhum,
porque produz confiança que não corresponde a nada. Então cada migration
declara também o que ela faz **fora do alcance deste instrumento**, em
texto, e o conferidor **imprime a contagem disso junto do verde**.

O que a especificação do PostgREST não vê:

| não alcança | quem é |
|---|---|
| índice, constraint, trigger | 0001, 0014 |
| policy de RLS | quase todas |
| `grant`/`revoke` de coluna e de tabela | 0003 |
| corpo de função (só vê que ela existe) | 0011, 0015, 0016 |
| tudo que mora fora do schema `public` | 0002 (schema `private`), Vault (0007) |

**Duas dessas viram conferência mesmo assim, invertendo o sinal:**

- A **0002** move `owns_business` e `handle_new_user` para o schema
  `private` justamente para elas **sumirem** do PostgREST. Então a
  conferência dela é por AUSÊNCIA: se `owns_business` aparecer na lista de
  RPC, a 0002 não está aplicada. Objeto ausente é prova tão boa quanto
  presente, e neste caso é a única disponível.
- A **0016** só muda o corpo de uma função (a lista branca), e corpo não é
  visível daqui. Mas o efeito dela é: `target_profit_per_customer` com
  `procedencia = confirmado` no banco é impossível se a coluna não
  estivesse na lista branca. Fica declarada como fora do alcance, com a
  prova por evidência apontada no documento da medição.

## 6. Um achado do levantamento: a 0009 não cria nada

`0009_backend_execucoes_criativos.sql` tem **13 linhas e nenhum DDL** — é
só o cabeçalho explicando que as tabelas do backend foram unificadas neste
projeto e que "a aplicação já aconteceu".

Consequência, que não estava escrita em lugar nenhum:

> **A cadeia de migrations do repositório não reconstrói o banco.** Um
> `supabase db push` contra um projeto vazio produz um schema sem
> `execucoes`, `criativos` e `campanhas_meta` — e sem erro, porque não há
> DDL para falhar.

O manifesto registra isso: a 0009 declara `documenta`, não `cria`. O
conferidor confere que as três tabelas existem (elas existem) **e** imprime
que elas não vieram deste arquivo. A reprodutibilidade da cadeia é outro
problema, e fica registrado em vez de resolvido — resolver seria escrever o
DDL de três tabelas a partir do schema vivo, e isso é lote próprio.

## 7. O que o conferidor devolve

```
pnpm conferir:migrations
```

- `AUSENTE` em qualquer objeto declarado → sai com 1. É o alarme que
  interessa: a migration está no repo e o objeto não está no banco.
- arquivo sem entrada no manifesto (ou o contrário) → sai com 1.
- sem `SUPABASE_SERVICE_ROLE_KEY` → sai com 2, como o `conferir:cadastro`
  já faz quando não consegue baixar o schema. Não medir não é passar.
- a camada 1 desligada → **não** derruba, mas imprime o comando e o motivo.

**Base explícita, medida antes de dar por pronto:** declarei um objeto que
não existe (`public.tabela_que_nao_existe`) e conferi que o conferidor
acusa. Um conferidor que nunca viu vermelho não está medindo.
