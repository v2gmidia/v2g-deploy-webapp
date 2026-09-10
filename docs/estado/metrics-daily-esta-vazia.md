# `metrics_daily` está vazia, e três telas leem ela

Medido em 10/09/2026. Cada número com o comando ao lado.

---

## 0. Comece por aqui: o veredito

**A tabela não deve morrer hoje, e o gatilho para matá-la não é uma data —
é o consolidado passar a trazer `investiu_centavos` diferente de `null`.**

O motivo de não morrer agora é o mesmo que já está registrado em
`lib/estado/cliente.ts:349`: ela é a fonte antiga de uma dívida de duas
fontes, e arrancá-la antes de a nova cobrir o caso deixa o buraco sem
fundo. O motivo de morrer depois é mais forte: **duas fontes para o mesmo
fato é o padrão de divergência que este repositório já pagou três vezes.**

E existe um caso, um só, em que ela seria a fonte certa — está na §5.

---

## 1. Quem criou, e quando

```bash
git log --reverse -- supabase/migrations/0001_init.sql
→ 3566ed3  2026-08-01  Schema consolidado: 10 tabelas com RLS, Vault…
```

Nasceu na **0001**, em 01/08/2026, junto com as outras nove tabelas. Nunca
foi migrada, nunca foi alterada, e **nunca recebeu uma linha**.

```sql
select count(*) from public.metrics_daily;   -- 0
select count(*) from public.campaigns;       -- 0
```

Quarenta dias vazia.

---

## 2. O que escreveria nela, se algo escrevesse

**Nada no webapp escreve.** Medido:

```bash
grep -rn "metrics_daily" --include=*.ts --include=*.tsx . | grep -iE "insert|upsert|update"
→ só as policies e o trigger da 0001. Nenhum código.
```

Há `policy` de `insert` e de `update` para `authenticated` desde a 0001 —
ou seja, o desenho original previa que **o próprio app** escreveria as
métricas, provavelmente por um coletor que nunca foi construído.

Quem coleta hoje é o backend, e ele escreve **no banco dele**. As duas
rotas de consolidado são a única porta pela qual esse dado chega aqui.

---

## 3. As três telas: erro, vazio ou zero?

**Nenhuma mostra erro, e nenhuma mostra `R$ 0,00`.** As três têm porta de
saída. Mas duas dizem coisas que podem ser falsas.

### `/vendas` — vazio, com frase condicionada

`app/(protected)/vendas/page.tsx:37`

```ts
const conversas = (metricas ?? []).reduce((s, m) => s + Number(m.conversions ?? 0), 0);
```

Com zero linhas, `conversas === 0`, e a tela escolhe pela **outra** fonte:

| campanhas publicadas | o que a tela diz |
|---|---|
| nenhuma | "Ninguém chegou ainda porque **nenhum anúncio foi ao ar**" |
| alguma | "Seu anúncio está no ar. A **primeira conversa** ainda não veio." |

Hoje `campaigns` também tem zero linhas, então sai a primeira — **e ela é
verdadeira**. A segunda é a perigosa: ela afirma que ninguém conversou,
quando a verdade seria "estou olhando a tabela errada".

### `/anuncios` — vazio, com uma promessa de prazo

`app/(protected)/anuncios/page.tsx:269`

O guarda é `numeros.investido > 0`, então zero **não vira `R$ 0,00`**. O
que sai é:

> "No ar há pouco tempo — os primeiros números aparecem em até 48 horas."

**Essa frase envelhece mal.** Para uma campanha de 13 dias ela é
literalmente falsa, e é do tipo que faz o cliente ligar no dia 3.

### `/inicio` — já não depende

`lib/estado/cliente.ts:359` — `temNumero` deixou de ser
`metrics_daily.spend > 0` e passou a ser o acumulado do backend, com `||`
mantendo a fonte antiga viva. **Foi a única das três que já migrou.**

---

## 4. Um achado de lambuja, e ele contradiz o contrato do dashboard

`app/(protected)/anuncios/page.tsx:252`

```ts
const custoPorConversa =
  numeros && numeros.conversas > 0 ? numeros.investido / numeros.conversas : null;
```

E renderiza **"R$ X por conversa"**.

O contrato do dashboard é explícito sobre não mostrar custo por clique,
porque é derivável e é a porta para o dono comparar com um número que
ouviu de alguém. **Custo por conversa é o mesmo número com outro nome**, e
já está numa tela em produção.

Não é dívida da `metrics_daily` — é dívida da `/anuncios`, e só não morde
hoje porque a fonte está vazia. **No dia em que a tabela receber linha, a
tela passa a mostrar um número que a regra nova proíbe.**

Não consertei: está fora do escopo deste lote, e a tela inteira vai ser
revista quando o dashboard chegar.

---

## 5. O caso em que ela seria a fonte certa

Um só, e é real: **métrica por PEÇA.**

`metrics_daily` tem `creative_id` e `campaign_id`. O consolidado do
backend é por dia e por execução — ele não separa qual criativo trouxe
qual resultado. Se um dia a tela precisar dizer "esta foto trouxe 12
conversas e aquela trouxe 2", o consolidado de hoje não responde.

Fora disso, ela é espelho de um dado que o backend já tem, e espelho de
dado é a definição do problema que ela criaria.

---

## 6. O que este documento não mediu

- **Não sei por que o coletor do webapp nunca foi construído.** As
  policies de `insert` sugerem que era o desenho original; não achei
  registro da decisão de mudar.
- **Não medi o que a `/vendas` e a `/anuncios` mostrariam com dado real**,
  porque não há dado real deste lado para exercitar.
- **Não olhei `campaigns` e `creatives` com o mesmo cuidado.** `campaigns`
  também tem zero linhas e é lida pelas mesmas telas — pode ter a mesma
  história.
