# As 47 execuções: o que é teste, o que é real

Classificação por **sinal de dados**, não só pelo nome — nome sozinho erra
nos dois sentidos, e este conjunto tem exemplo de cada.

| Classe | Nomes | Execuções | Criativos | Storage |
|---|---|---|---|---|
| **REAL** | 4 | 32 | 74 | 39,4 MB |
| **TESTE** | 10 | 10 | 15 | 2,0 MB |
| **DÚVIDA** | 5 | 5 | **0** | **0 MB** |

---

## REAL — 32 execuções, os 4 que viram `businesses`

| Negócio | Execs | Criativos | Aprovações | Estruturas prontas | CEP |
|---|---|---|---|---|---|
| Facetas Curitiba | 12 | 39 | 7 | 1 | — |
| Clinica Sorriso Real | 10 | 0 | 0 | 0 | — |
| Deo Clínica | 8 | 24 | 8 | 5 | 75680-045 |
| Instituto Bastos | 2 | 11 | 1 | 1 | — |

**Clinica Sorriso Real merece um olhar seu.** Tem 10 execuções e a
descrição mais longa do conjunto (218 caracteres), mas **zero criativos e
zero aprovações** — nunca passou da etapa de texto. É cliente real que
travou, ou uma rodada de testes com nome plausível? A resposta muda se ele
vira `business` ou não.

## TESTE — 10 execuções, descartáveis

`CHECK 0004` · `CHECK API` · `CHECK DEPLOY` · `CHECK DEPLOY 2` ·
`CHECK ENVIAR` · `CHECK MODO ENVIAR` · `CHECK UPLOAD PROD` ·
`TESTE FIDELIDADE` · `Teste Migracao 0002` · `Sorriso Real - teste final`

Sete dos dez têm **descrição vazia** — foram disparados por script, não
por formulário.

**Uma exceção antes de apagar: `CHECK ENVIAR`.** Apesar do nome, ela tem
`estrutura_pronta` e **uma aprovação registrada** — ou seja, atravessou o
pipeline inteiro e produziu saída de verdade. É o único exemplar completo
do modo `enviar`. Se você quiser guardar um caso de referência do fluxo
ponta a ponta, é essa.

## DÚVIDA — 5 execuções, e a decisão é sua

| Nome | Descrição | Criativos | Data |
|---|---|---|---|
| Açaí da V2G | 48 car. | 0 | 27/07 |
| Suco do victor | 32 car. | 0 | 27/07 |
| Pizzaria de Nikiti | 61 car. | 0 | 25/07 |
| Facetas CWB | 76 car. | 0 | 05/08 |
| Facetas Niterói | 52 car. | 0 | 02/08 |

As três primeiras têm cara de teste seu — "da V2G", "do victor", e a
pizzaria é a execução mais antiga da base. As duas de "Facetas" podem ser
variações da Facetas Curitiba ou leads distintos; só você sabe.

**A decisão é barata:** as cinco têm **zero criativos e zero bytes**.
Manter não custa espaço, descartar não perde arquivo. Na dúvida, manter é
o lado reversível.

---

## O mapeamento, quando você decidir

Nada abaixo foi executado. Rodar só depois de fechar Clinica Sorriso Real
e as cinco em dúvida.

```sql
-- 1. No V2G-SITE: criar os businesses que faltam.
--    `profile_id` fica nulo: são negócios sem dono cadastrado ainda, e
--    inventar um dono seria pior que assumir a ausência.
insert into public.businesses (name, niche, city)
values ('Facetas Curitiba',     'clinica-odontologica', 'Curitiba'),
       ('Clinica Sorriso Real', 'clinica-odontologica', null),
       ('Deo Clínica',          'clinica-odontologica', null),
       ('Instituto Bastos',     'clinica-odontologica', null);

-- 2. Depois de mover `execucoes`, ligar pelo nome.
--    O nome é a ÚNICA chave possível: cliente_id é nulo em 47/47.
update public.execucoes e
   set business_id = b.id
  from public.businesses b
 where b.name = e.nome_negocio
   and e.business_id is null;

-- 3. Conferir antes de seguir. Tem que dar 32.
select count(*) filter (where business_id is not null) as ligadas,
       count(*) filter (where business_id is null)     as soltas
  from public.execucoes;
```

## Limpeza do storage, antes de mover

Os três registros que não fecham (`migracao-banco.md` §6):

```sql
-- 2 criativos apontando para arquivo inexistente
select id, execucao_id, nome_arquivo, storage_path
  from public.criativos c
 where c.storage_path is not null
   and not exists (select 1 from storage.objects o where o.name = c.storage_path);

-- 1 objeto sem criativo dono
select o.name, (o.metadata->>'size')::bigint as bytes
  from storage.objects o
 where not exists (select 1 from public.criativos c where c.storage_path = o.name);
```

Olhe os cinco registros antes de apagar qualquer um. Um path órfão pode
ser arquivo que sumiu — ou caminho gravado errado, e aí o arquivo está lá
com outro nome.
