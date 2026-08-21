# Lote — uma definição só para "peça de anúncio"

**Desenho escrito antes do código, em 21/08/2026.** O que está aqui é a
decisão e o motivo dela; a medição de antes está em
[`buraco-aprovar-sem-filtro.md`](./buraco-aprovar-sem-filtro.md), e a de
depois entra no fim deste arquivo.

---

## 1. O problema não é o filtro que falta. É que a definição não tem dono.

O `buraco-aprovar-sem-filtro.md` propõe um conserto de quatro linhas na
`aprovar/page.tsx`. Se eu fizer só isso, conserto esta tela e deixo a
doença: **cinco lugares lêem `creatives` e cada um decide sozinho o que
conta como peça de anúncio.**

Levantamento de hoje (`grep 'from("creatives")'`, fora de `lib/identidade`
e `lib/meta/publicar`, que escrevem):

| lugar | `uso` | `arquivado_em` | `status` |
|---|---|---|---|
| `lib/estado/cliente.ts:178` | `=== "campanha"` (memória) | `is null` (SQL) | `=== "draft"` (memória) |
| `app/(fluxo)/aprovar/page.tsx:35` | — | — | `= 'draft'` |
| `app/(fluxo)/reprovado/page.tsx:25` | — | — | `= 'rejected'` |
| `app/(protected)/anuncios/page.tsx:54` | traz a coluna, não filtra | — | `=== "rejected"` (memória) |

Um deles está certo. Os outros três repetem o mesmo esquecimento em graus
diferentes. Consertar um por um produz quatro definições parecidas e
independentes — que é exatamente a condição para a quinta tela nascer
errada de novo, e para as quatro divergirem quando o domínio de `uso`
mudar.

**Então o lote não é "arrumar a `/aprovar`". É: escrever a definição uma
vez, num lugar, e fazer as quatro leituras chamarem ela.**

## 2. A definição

Do banco (0010 fecha o domínio, 0014 cria o arquivamento):

```sql
uso          in ('logo', 'identidade', 'campanha', 'referencia')  default 'campanha'
arquivado_em timestamptz                                          -- null = vigente
status       text  default 'draft'                                -- draft|pending_review|approved|rejected|paused
```

> **peça de anúncio** = `uso = 'campanha'` **e** `arquivado_em is null`

E, em cima dela, os dois estados que as telas perguntam:

> **espera aprovação** = peça de anúncio **e** `status = 'draft'`
>
> **foi reprovada** = peça de anúncio **e** `status = 'rejected'`

Isso é literalmente o que `lib/estado/cliente.ts` já faz. O lote não
inventa regra nova: **promove a regra que já existe num arquivo a regra do
projeto**, e apaga as três cópias empobrecidas.

## 3. A decisão que diverge do que o buraco propunha: `campaign_id`

O `buraco-aprovar-sem-filtro.md` §5 propõe quatro filtros, e o quarto é:

```ts
.not("campaign_id", "is", null)   // a tela usa campaign_id logo abaixo
```

**Não vou pôr esse.** Três motivos, em ordem de peso:

1. **Ele recria a divergência que este lote existe para matar.** A cadeia
   do `/inicio` conta `pecasParaAprovar` sem olhar `campaign_id`. Se a
   `/aprovar` exigir `campaign_id`, então uma peça de campanha, `draft`,
   sem campanha ainda criada faz a cadeia dizer "tem peça para aprovar" e a
   tela dizer "nada esperando você". Trocaríamos a mentira de hoje (mostra
   logo) por outra do mesmo formato — duas leituras, duas respostas, na
   mesma conta.
2. **A tela já se protege.** `campaign_id` só é usado no `select` do
   reprovado, e esse `select` já está atrás de `pendente.campaign_id ? … : { data: null }`
   (`aprovar/page.tsx:47`). Peça sem campanha renderiza no estado normal,
   sem o bloco de substituto — que é o certo: sem campanha anterior não há
   reprovação anterior.
3. **A ordem de criação não está fechada.** `creatives.campaign_id` é
   `references campaigns(id) on delete set null` e nullable desde a 0001;
   `lib/meta/publicar.ts` é quem amarra os dois. Um filtro que presume
   "criativo nasce depois da campanha" está apostando numa ordem que o
   schema não garante — e o preço do erro é uma peça real invisível, com a
   tela dizendo que não há nada.

**Regra que fica:** filtro de tela serve para excluir o que não é do
assunto (logo não é anúncio), nunca para exigir um campo que a própria
tela sabe viver sem.

## 4. Onde a definição mora

`lib/criativos/peca.ts`, novo, com duas metades que **têm que dizer a mesma
coisa**:

- **os predicados puros** — `ehPecaDeAnuncio`, `esperaAprovacao`,
  `foiReprovada`. Sem rede, sem Supabase, testáveis com fixture.
- **o filtro de SQL** — `apenasPecasDeAnuncio(query)`, que aplica
  `.eq("uso", …).is("arquivado_em", null)` no builder do PostgREST.

Duas metades porque as leituras são de dois tipos e nenhum dos dois some:
a `/anuncios` traz a lista inteira e reparte em memória; a `/aprovar` quer
uma linha só e não pode trazer a tabela para descobrir qual é.

O risco de ter duas metades é elas divergirem. O conferidor fecha isso
rodando **os mesmos casos** contra as duas: cada fixture passa pelo
predicado puro, e as mesmas linhas passam pelo filtro de SQL no banco de
verdade (§6). Se uma metade mudar sozinha, um dos dois lados acusa.

## 5. O que muda em cada tela

| arquivo | antes | depois |
|---|---|---|
| `aprovar/page.tsx` | `.eq("status","draft")` | `apenasPecasDeAnuncio(…).eq("status","draft")` |
| `reprovado/page.tsx` | `.eq("status","rejected")` | `apenasPecasDeAnuncio(…).eq("status","rejected")` |
| `anuncios/page.tsx` | `pecas.filter(p => p.status === "rejected")` | `pecas.filter(foiReprovada)` |
| `lib/estado/cliente.ts` | filtros escritos à mão | os mesmos predicados importados |

`lib/identidade/armazenar.ts` e `lib/meta/publicar.ts` ficam fora: elas
**escrevem** peça e logo, e já dizem `uso` explicitamente em cada escrita.

### 5.1 O que a `/anuncios` faz com logo, medido e não inferido

A `/anuncios` lê tudo sem filtro (`anuncios/page.tsx:54`), mas o que ela
faz com as linhas depois já exclui logo por acidente: agrupa por
`campaign_id` (`if (!p.campaign_id) continue`) e conta reprovada por
`status === "rejected"`. Logo tem `campaign_id` nulo e nasce `draft`, então
hoje ela não mente — **por sorte, não por filtro.** A peça arquivada é que
passaria: uma peça de campanha reprovada e depois arquivada continua
contada como "precisa de você". Troco o predicado mesmo assim, porque o
que segura a tela hoje é uma coincidência entre duas colunas, e
coincidência não sobrevive a mudança de schema.

## 6. Como isto vai ser testado — os dois alvos

O `buraco-aprovar-sem-filtro.md` §5 diz o essencial: **com zero linhas
`uso = 'campanha'` no banco, o conserto passa porque a tela fica vazia, e
tela vazia não prova filtro certo, prova tabela vazia.** Medi hoje, com a
consulta de hoje e a proposta, nos dois negócios que têm dado:

```
### V2G a85c37a9
  HOJE    : {"id":"9263c465…","uso":"logo","status":"draft","campaign_id":null}
  PROPOSTO: (vazio → "Nada esperando você agora")

### Padaria FICTICIO a0328fb8
  HOJE    : (vazio)
  PROPOSTO: (vazio)
```

O lado esquerdo do teste existe (a logo `9263c465`, que tem que sumir). O
lado direito **não existe em lugar nenhum do banco** e precisa ser criado.

**Onde crio, e por quê ali.** No negócio `a0328fb8`, "Padaria Dona Zilda
(FICTICIO)", que tem `dados_ficticios = true` e `profile_id` nulo. As duas
coisas importam:

- `dados_ficticios = true` é trava real, não etiqueta: `lib/pipeline/disparar.ts:289`
  e `lib/meta/publicar.ts:332` recusam o negócio antes de qualquer chamada
  externa. Nada que eu inserir ali pode virar campanha ou gasto.
- `profile_id` nulo quer dizer que **nenhum usuário é dono desse negócio**,
  então a RLS (`owns_business`) não devolve essas linhas para ninguém
  logado. O alvo de teste não aparece na tela de nenhum cliente.

**As cinco linhas criadas** (`file_name` prefixado `ALVO-`, para serem
reconhecíveis a olho nu no banco):

| alvo | `uso` | `status` | `arquivado_em` | tem que |
|---|---|---|---|---|
| A — peça viva | `campanha` | `draft` | null | **aparecer** na `/aprovar` |
| B — peça arquivada | `campanha` | `draft` | preenchido | sumir |
| C — logo | `logo` | `draft` | null | sumir |
| D — reprovada viva | `campanha` | `rejected` | null | **aparecer** na `/reprovado` |
| E — reprovada arquivada | `campanha` | `rejected` | preenchido | sumir |

C é a réplica do defeito real dentro do negócio de teste; A é o lado que
faltava; B e E cobrem o filtro de arquivado, que nem a `/aprovar` nem a
`/reprovado` tinham; D é o lado positivo da `/reprovado`, que sem ele
mediria contra tabela vazia igual à `/aprovar`.

**E a data de C é a mais recente das cinco, de propósito.** A `/aprovar`
traz uma linha só (`order created_at desc limit 1`). Na primeira versão
deste script os alvos nasceram todos no mesmo instante e a leitura ANTIGA
devolveu a peça de campanha por sorte de ordenação — a medição sairia
mostrando as duas colunas iguais, como se não houvesse defeito ali. Com a
logo por último, a leitura antiga devolve a logo e a nova devolve a peça:
**a diferença entre as duas colunas é o que prova o conserto.**

O SQL de criação e o de remoção ficam em `scripts/alvos-de-peca.mjs`, com
`--criar` e `--remover`, para o alvo ser reprodutível e reversível por
comando, não por memória de quem inseriu.

**Duas camadas de prova, e as duas rodam:**

1. `pnpm conferir:criativos` — fixtures, sem rede, entra no `pnpm conferir`.
   Testa os dois lados de cada um dos três filtros.
2. `pnpm medir:peca` — **contra o banco de verdade**, fora do `pnpm conferir`
   porque precisa de rede e de chave. Roda a consulta real das telas nos
   dois negócios e imprime o que cada uma devolve. É esta que responde "o
   filtro funciona", e é a saída dela que vai colada no fim deste
   documento.

**O que estas duas camadas não provam:** que o navegador desenha a tela
certa. Não há sessão nesta máquina e eu não crio uma — provo o que a
consulta devolve e o que o predicado decide, que é onde o defeito está.

---

## 7. A medição de depois — 21/08/2026, `pnpm medir:peca`

Saída colada da execução, contra o banco `ushccxpoxjikzqnwhgfd`, com os
cinco alvos criados por `node scripts/alvos-de-peca.mjs --criar`:

```
### V2G (real) - a85c37a9-df57-4829-985b-41bc306f8537
  /aprovar   antes: ChatGPT Image 6 de ago. de 2026, 18_27_58.png [uso=logo status=draft]
  /aprovar   agora: (vazio)
  /reprovado antes: (vazio)
  /reprovado agora: (vazio)
  cadeia (/inicio) conta 0 peca(s) para aprovar; a tela mostra 0

### Padaria Dona Zilda (FICTICIO) - a0328fb8-cd95-415b-b2f5-5d305e5df9f4
  /aprovar   antes: ALVO-C-logo.png [uso=logo status=draft]
  /aprovar   agora: ALVO-A-peca-viva.png [uso=campanha status=draft]
  /reprovado antes: ALVO-D-reprovada-viva.png [...], ALVO-E-reprovada-arquivada.png [...]
  /reprovado agora: ALVO-D-reprovada-viva.png [uso=campanha status=rejected]
  cadeia (/inicio) conta 1 peca(s) para aprovar; a tela mostra 1
```

O que cada linha prova, e o que ela não prova:

| linha | prova |
|---|---|
| `V2G /aprovar antes: …logo…` | o defeito de 21/08 ainda reproduzia na hora do conserto |
| `V2G /aprovar agora: (vazio)` | a logo sumiu — **sozinha, não prova nada** (ver a seguinte) |
| `FICTICIO /aprovar agora: ALVO-A` | a peça de verdade APARECE: o vazio acima é filtro, não tabela vazia |
| `FICTICIO /aprovar antes: ALVO-C-logo` | o alvo replica o defeito, então as duas colunas medem coisas diferentes |
| `/reprovado antes: D + E` / `agora: D` | o filtro de arquivado tem os dois lados exercitados |
| `cadeia conta N; a tela mostra N` | **a queixa original**: as duas leituras da mesma tabela pararam de discordar |

E os predicados, com fixture, em `pnpm conferir:criativos`: 30 conferências.
Base explícita: com `ehPecaDeAnuncio` revertido para o comportamento de
antes (devolver sempre `true`), o conferidor acusa **9 falhas** — se ele
rodar limpo contra a leitura antiga, está medindo outra coisa.

### O que continua sem prova

- **O navegador.** Não há sessão nesta máquina; foi medido o que a
  consulta devolve, não o que a tela desenha.
- **A `/anuncios` sob dado real.** `campaigns` tem zero linhas no banco
  inteiro, então a tela cai no estado "nenhum anúncio" antes de chegar no
  `foiReprovada`. A troca lá está conferida por fixture e por tipo, não por
  render.
- **Os alvos são fictícios de propósito** e vivem num negócio com
  `dados_ficticios = true`. Eles não provam que o pipeline cria peça com
  `uso = 'campanha'` — provam que, quando ela existir, a tela a encontra.
  Nenhuma peça de campanha real foi produzida pelo sistema até hoje.
