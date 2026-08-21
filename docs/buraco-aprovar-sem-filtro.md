# Buraco — a `/aprovar` mostra uma logo como peça de anúncio

**Medição de 21/08/2026.** Documento de medição: não se atualiza. Se o
defeito for consertado, o conserto é registrado abaixo da linha, sem apagar
o que está aqui.

**Próximo candidato da fila de buracos, depois do
[`buraco-numeros-dificeis.md`](./buraco-numeros-dificeis.md).**

Mesmo formato dos outros três da família: **o dado existe, a leitura é
ampla demais, e a tela afirma o que não aconteceu.**

---

## 1. O que foi medido

`app/(fluxo)/aprovar/page.tsx:35-39` lê `creatives` filtrando por **uma
coisa só**:

```ts
.from("creatives")
.select("id, campaign_id, file_name, copy, status, meta_status, created_at")
.eq("status", "draft")          // ← o único filtro
.order("created_at", { ascending: false })
.limit(1)
```

Sem `uso`. Sem `arquivado_em`. Sem `campaign_id not null`.

No banco, o default da coluna:

```
creatives.status   default 'draft'::text     not null
creatives.uso      default 'campanha'::text  nullable
```

**Toda linha de `creatives` nasce em `draft`.** Inclusive a que veio do
upload de logo, que não é peça de anúncio e nunca vai ser aprovada.

As duas linhas que existem hoje, as duas do negócio `a85c37a9` ("V2G"):

| id | uso | status | campaign_id | arquivado_em |
|---|---|---|---|---|
| `2d192f2f` | logo | **draft** | null | 19/08 14:03 |
| `9263c465` | logo | **draft** | null | null |

## 2. A consequência, hoje, nessa conta

A `9263c465` não está arquivada, é a mais recente, e é `draft`. Ela **é** o
que o `.limit(1)` devolve.

Ou seja: o cliente que abrir `/aprovar` recebe **o próprio logo que ele
subiu**, apresentado como o anúncio que a IA montou para ele aprovar. Com
`campaign_id` nulo, que é o que a tela usa para buscar o resto.

Nenhuma peça de anúncio existe nessa conta — `creatives` com
`uso = 'campanha'`: **zero linhas na tabela inteira.**

## 3. E a cadeia discorda da tela

Aqui é onde ele encosta no lote QA-2. O `estadoDoCliente()` lê a mesma
tabela e filtra certo (`lib/estado/cliente.ts:198,206`):

```ts
const deCampanha = pecas.filter((p) => p.uso === "campanha");
const pecasParaAprovar = deCampanha.filter((p) => p.status === "draft").length;
```

Então, na mesma conta, no mesmo minuto:

| quem | o que diz |
|---|---|
| a cadeia (`/inicio`) | etapa `aprovacao` **concluída** — `pecasParaAprovar === 0`, não há nada para aprovar |
| a tela `/aprovar` | tem uma peça esperando você (é uma logo) |

**É o D3 do QA-2 outra vez**, num par de telas que aquele lote não tocou. A
`/aprovar` não estava entre as quatro medidas em 20/08, e a leitura larga
dela sobreviveu ao lote que existia para eliminar exatamente esse formato.

Não é regressão do QA-2 nem do lote F: essa linha é anterior aos dois. O
que mudou é que agora existe uma fonte única do outro lado para discordar
dela.

## 4. Por que é o mesmo formato dos outros

| buraco | o dado existe | a leitura é ampla | a tela afirma o que não aconteceu |
|---|---|---|---|
| `/anuncios` contando foto (QA-2 §0.3, **consertado**) | `creatives` | sem `uso`, sem `arquivado_em` | "você já tem 2 fotos guardadas" — eram 2 logos, uma removida |
| `/aprovar` (este) | `creatives` | sem `uso`, sem `arquivado_em`, sem `campaign_id` | "tem peça esperando você" — é uma logo |
| verdade vazia da aprovação (QA-2 §11.3, **consertado**) | `creatives` | predicado sobre conjunto vazio | "já está feito" para quem nunca aprovou |

Os três são a mesma doença em três lugares. Dois foram consertados; este
não foi visto porque a `/aprovar` não estava no recorte daquele lote.

## 5. O que o conserto provavelmente é

Curto, e por isso mesmo perigoso de fazer sem medir os dois lados:

```ts
.eq("status", "draft")
.eq("uso", "campanha")          // peça de anúncio, não logo nem identidade
.is("arquivado_em", null)       // não a que ele já removeu
.not("campaign_id", "is", null) // a tela usa campaign_id logo abaixo
```

**Mas o alvo de teste é o problema, e é o de sempre aqui:** com zero linhas
`uso = 'campanha'` no banco inteiro, um teste do conserto passa porque a
tela fica vazia — e uma tela vazia não prova filtro certo, prova tabela
vazia. Já aconteceu quatro vezes neste projeto.

Quem consertar precisa de **dois** alvos: uma logo `draft` (existe, a
`9263c465`) que tem que sumir da tela, e uma peça `uso = 'campanha'`,
`draft`, com `campaign_id`, que tem que aparecer. A segunda não existe e
precisa ser criada à mão.

## 6. O que NÃO foi verificado

- **A `/reprovado` e a `/anuncios` têm leituras parecidas**
  (`reprovado/page.tsx:25-28` filtra só `status = 'rejected'`;
  `anuncios/page.tsx:54-56` não filtra nada e traz `uso` no `select`).
  Não medi o que elas renderizam hoje — a `/anuncios` pelo menos **lê** a
  coluna `uso`, então pode estar filtrando depois, na memória. Fica para
  quem pegar o lote.
- **Se a tela quebra ou só mente.** `campaign_id` nulo entra num segundo
  `select` (`aprovar/page.tsx:48-52`) e no render. Não abri a tela logada
  — não há sessão nesta máquina — então sei o que a consulta devolve, não
  o que o navegador desenha.
