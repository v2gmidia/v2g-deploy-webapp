# Roteiro — testar a ativação contra a Meta de verdade

23/09/2026. Para o Victor executar **à mão**, uma vez, antes de qualquer
uso em cliente. Nada aqui é automático e nada aqui roda sozinho.

> **Por que este roteiro existe.** `lib/meta/ativar.ts:47-68` declara, no
> próprio código: *"⚠️ NÃO TESTADO CONTRA A GRAPH API REAL. Nenhuma linha
> deste arquivo foi exercitada contra o Meta."* O que está conferido é que
> compila, que o fluxo de banco está certo e que a trava de identidade é
> chamada. O que **não** está conferido é se `POST /{id}` com
> `status=ACTIVE` é mesmo o caminho nos três níveis, e o que a Meta
> responde. Este roteiro é essa conferência.

**Onde o código está:** worktree `C:\Users\victo\v2g-deploy\webapp-ativar`,
branch `ativar-campanha`. **Tudo ainda não commitado** — 7 arquivos novos e
13 modificados. Outra sessão pode estar editando ali; confira
`git status` antes de começar.

---

## §0. Antes de tudo — três portas que podem estar fechadas

### 0.1 As migrations 0024 e 0025 **não estão aplicadas**

São arquivos `??` no `git status`. Sem a **0024**, nada disto funciona:

- as colunas `ativada_em`, `ativada_por`, `pausada_em`, `pausada_por`,
  `ativando_em` não existem (`0024:18-22`);
- `publish_state` ainda recusa os valores `'ativando'`, `'ativa'` e
  `'pausada'` pelo CHECK antigo (`0024:74-77` é quem os acrescenta);
- a trava de concorrência não tem onde escrever.

Aplicar é **ação que exige sua autorização explícita** (CLAUDE.md). O
comando é `pnpm db:migrate`, e ele aplica **todas** as pendentes — ou
seja, leva a **0025** junto. A 0025 só faz `alter column transcricao drop
not null` em `entrevistas` (`0025:22-23`), tabela em que, medido em
23/09, nenhuma linha do webapp escreve. É inofensiva, mas vai junto: você
está autorizando as duas.

**Confira antes** quais já rodaram — `docs/migration-no-repo-nao-e-migration-aplicada.md`
existe justamente porque arquivo no repo não é migration aplicada.

### 0.2 Você precisa do papel de operador — e a conta importa

`proxy.ts:76` põe `/ativar-campanha` em `OPERADOR_PREFIXES`, e a página
confere de novo (`page.tsx:51`: `papel !== "operador" → notFound()`).

O papel é uma coluna, não um grupo: `auth.users.raw_app_meta_data->>'papel'`.
Medido em 11/09 (`docs/estado/inicio-recomposto-11-09.md:262-270`), das 7
contas **uma** tem o papel:

| conta | papel |
|---|---|
| `victorcabralnsilva@gmail.com` | `operador` |
| `v2g.midia@gmail.com` e as outras 5 | nenhum |

**Entre com `victorcabralnsilva@gmail.com`.** Se entrar com a `v2g.midia`,
`/ativar-campanha` te manda para `/inicio` **sem mensagem nenhuma** — o
bloqueio é mudo, e você vai achar que a rota não existe.

Se precisar dar o papel a outra conta, é no painel do Supabase
(`app_metadata`, nunca `user_metadata` — este último o próprio usuário
escreve, e qualquer cliente poderia se promover).

### 0.3 Suba o app a partir do worktree certo

```powershell
cd "C:\Users\victo\v2g-deploy\webapp-ativar"
pnpm dev
```

Abrir do `webapp` principal (branch `main`) **não tem a tela** —
`/ativar-campanha` não existe lá.

---

## §1. (a) Qual campanha usar, e o `business_id`

### 1.1 O que a ativação exige da linha — os cinco requisitos

`carregarAlvo` (`lib/meta/ativar.ts:164-215`) e `conferirAntesDeAtivar`
(`lib/campanha/ativacao.ts:150-250`) só seguem com **tudo** isto:

| # | Requisito | Onde é exigido |
|---|---|---|
| 1 | `campaigns.business_id` **não nulo** | `ativacao.ts:179-187` — é a trava que você citou |
| 2 | `businesses` com essa id existindo, com `monthly_budget` preenchido | `ativacao.ts:188-196` |
| 3 | `publish_state` em `'published'` ou `'pausada'` | `ativacao.ts:208-213` |
| 4 | `external_campaign_id` **e** `external_adset_id` preenchidos | `ativar.ts:183-188` |
| 5 | `obter_token_meta(business_id)` devolvendo token | `ativar.ts:203-207` |

O nº 5 é o que decide se dá para reaproveitar algo ou não: o token **é do
negócio**, sai do Vault, e só existe se aquele negócio passou pelo
`/conectar` (OAuth do Facebook). **Não há como criar um negócio de teste
sem passar por esse consentimento.**

`creatives.external_ad_id` (o terceiro nível) é opcional: se não houver
nenhum, o nível "anuncio" é pulado sem erro (`ativar.ts:265`).

### 1.2 Ache o candidato — rode isto no SQL Editor do Supabase

Só leitura. Cole inteiro:

```sql
select
  c.id                      as campanha_id,
  c.name                    as campanha,
  c.business_id,
  b.name                    as negocio,
  b.monthly_budget          as teto_mes,
  c.publish_state,
  c.external_campaign_id,
  c.external_adset_id,
  (select count(*) from creatives cr
    where cr.business_id = c.business_id
      and cr.campaign_id = c.id
      and cr.external_ad_id is not null) as anuncios,
  aa.external_id            as conta_de_anuncio,
  mc.status                 as conexao_meta
from campaigns c
left join businesses b       on b.id = c.business_id
left join ad_accounts aa     on aa.id = c.ad_account_id
left join meta_connections mc on mc.business_id = c.business_id
order by c.created_at desc;
```

**Escolha a linha que tiver, ao mesmo tempo:** `business_id` preenchido,
`publish_state` em `published` ou `pausada`, os dois `external_*`
preenchidos, `conexao_meta = connected`, e
`conta_de_anuncio = act_2818009911919726`.

Se essa linha existir, **pare aqui e use ela**. É o caminho mais barato e
o único que não exige criar nada.

### 1.3 Se nenhuma linha servir

Três cenários, do mais barato ao mais caro:

**(A) A campanha existe, está na conta certa, mas `business_id` está
nulo.** É o defeito que você já vinha investigando no backend. Conserto
manual, uma linha, depois de descobrir de quem é:

```sql
-- confira primeiro de quem deveria ser
select id, name, profile_id from businesses order by created_at;

-- só então, com o id na mão
update campaigns set business_id = '<uuid-do-negocio>' where id = '<uuid-da-campanha>';
```

Confira que esse negócio tem `monthly_budget` e conexão Meta viva — sem
isso você só trocou um bloqueio por outro.

**(B) Existe campanha na Meta mas não no nosso banco.** Aí falta
`external_campaign_id`/`external_adset_id`. Dá para preencher à mão, com
os ids que o Gerenciador de Anúncios mostra na URL. É honesto para teste,
mas escreva num `decisions` ou num bilhete que aquela linha foi montada à
mão — senão ela vira "campanha publicada pelo pipeline" na leitura de
outra pessoa.

**(C) Negócio de teste do zero.** É o caminho caro, e o passo que não dá
para pular é o 4:

1. `businesses`: crie a linha com `profile_id` da sua conta e
   `monthly_budget` baixo (veja §1.4).
2. Entre no app como esse usuário.
3. `/conectar` → OAuth do Facebook → `/conectar/escolher`: escolha a
   Página e a conta `act_2818009911919726`. Isso grava
   `meta_connections` + o token no Vault (`conectar_meta`, migration
   0006) e a linha em `ad_accounts`.
4. Publique uma campanha por onde o pipeline publica hoje. **Não dá para
   pular**: `external_campaign_id`/`external_adset_id` só nascem da
   publicação real, e a tela de ativação recusa sem eles.

Se o passo 4 não estiver disponível, o cenário (C) não fecha, e o teste
tem que ser (A) ou (B).

### 1.4 O teto do mês — e uma armadilha que vale ler duas vezes

O botão mostra `diarioCentavos`, calculado como
`round(monthly_budget × 100 ÷ 30)` (`lib/meta/orcamento.ts:129`). Com
`monthly_budget = 150`, o botão diz **R$ 5,00 por dia**.

**Mas esse número não é enviado à Meta.** `mudarOsTresNiveis` chama
`atualizarNoMeta(id, token, { status })` (`ativar.ts:271`) — **só o
status**. Quem gasta é o `daily_budget` que já está no conjunto de
anúncios lá na Meta, gravado quando ele foi criado.

Consequência prática: **o número do botão pode não ser o que vai gastar.**
Antes de ativar, abra o conjunto no Gerenciador e olhe o orçamento diário
de verdade. Se estiver alto, **baixe ali mesmo**, na Meta, antes de
ativar — mudança fora do app, sem risco para o teste.

E note: `conferirAntesDeAtivar` chama `validarOrcamento(teto, null)`
(`ativacao.ts:199`), com piso `null` de propósito — **a ativação não
confere o piso mínimo da Meta**. Quem confere é a publicação.

---

## §2. (b) Entrar como operador e chegar na tela

1. `pnpm dev` no worktree `webapp-ativar`.
2. `http://localhost:3000/entrar` com **`victorcabralnsilva@gmail.com`**.
3. `http://localhost:3000/ativar-campanha` — a fila.

A fila lista `publish_state` em `published`, `ativa`, `pausada` e
`ativando` (`page.tsx:63`), ordenada pela criação mais antiga. **Ela não
tem botão de propósito** — ativar mora dentro de cada campanha, junto do
nome do cliente e do valor.

4. Clique em **Abrir** na campanha escolhida →
   `/ativar-campanha/<uuid>`.

**Se a fila vier vazia**, olhe o console do servidor antes de concluir
qualquer coisa: `page.tsx:81` registra a falha de consulta lá, e lista
vazia por erro tem exatamente a mesma cara de lista vazia de verdade.

**Antes de clicar em qualquer botão**, leia a tela inteira: ela mostra os
bloqueios, o cliente, o valor/dia e o pré-voo relido na hora. Se houver
bloqueio, o botão de ativar **não aparece** (`[campanha]/page.tsx:179`) —
e o que estiver escrito ali é a resposta do pré-voo, palavra por palavra.

---

## §3. (c) O que conferir na Meta depois de clicar "Ativar"

A invariante 2 de `ativar.ts:21-24` diz: **os três níveis, ou nenhum.** Um
anúncio `ACTIVE` dentro de um conjunto `PAUSED` não veicula, e a tela
diria "no ar" sobre algo parado. É exatamente isso que este teste
verifica.

### 3.1 O jeito preciso — Graph API, só leitura

Melhor que a interface, porque `effective_status` é o campo que o código
assume e a UI traduz. Pegue os três ids da linha do banco (§1.2) e do
`creatives.external_ad_id`, e rode:

```
GET https://graph.facebook.com/v21.0/<external_campaign_id>?fields=id,name,status,effective_status&access_token=<TOKEN>
GET https://graph.facebook.com/v21.0/<external_adset_id>?fields=id,name,status,effective_status,daily_budget&access_token=<TOKEN>
GET https://graph.facebook.com/v21.0/<external_ad_id>?fields=id,name,status,effective_status&access_token=<TOKEN>
```

**O resultado esperado nos três: `status: "ACTIVE"`.**

`effective_status` é outra conversa e é onde mora a surpresa possível: ele
pode voltar `ACTIVE`, mas também `CAMPAIGN_PAUSED`, `ADSET_PAUSED`,
`PENDING_REVIEW`, `DISAPPROVED`, `WITH_ISSUES` ou
`IN_PROCESS` — e **nenhum desses foi medido nesta base**. Anote o que vier,
seja o que for; é isso que este teste está aqui para descobrir.

### 3.2 O jeito visual — Gerenciador de Anúncios

`adsmanager.facebook.com`, conta `act_2818009911919726`. Confira nas três
abas, **e as três precisam bater**:

| aba | o que olhar |
|---|---|
| Campanhas | a chave ligada, coluna "Veiculação" |
| Conjuntos de anúncios | a chave ligada, **e o orçamento diário** (§1.4) |
| Anúncios | a chave ligada, e o status de revisão |

Ligue a coluna **"Veiculação"** (Delivery) — é ela que mostra o
equivalente ao `effective_status`. "Ativa" nos três é o resultado bom.
"Em análise" é normal em anúncio novo e não é falha.

### 3.3 Do nosso lado

```sql
select publish_state, ativada_em, ativada_por, pausada_em, pausada_por, ativando_em
from campaigns where id = '<uuid-da-campanha>';
```

Esperado: `publish_state = 'ativa'`, `ativada_em` e `ativada_por`
preenchidos (seu e-mail), `ativando_em` como ficou. O carimbo só é escrito
**depois** de a Meta aceitar os três níveis (`ativar.ts:455-463`) — se ele
está lá, a Meta aceitou.

E o rastro, uma linha por nível, antes e depois:

```sql
select kind, status, needs_review, payload, created_at
from decisions
where campaign_id = '<uuid-da-campanha>'
order by created_at;
```

Esperado: `ativacao_tentativa` e `ativacao_resultado` para `campanha`,
`conjunto` e `anuncio` — seis linhas se houver anúncio, quatro se não.

---

## §4. (d) Desfazer no fim — não deixe nada rodando

**Faça isto no mesmo dia, de preferência nos minutos seguintes.** Cada
hora ativa é dinheiro de verdade na conta de teste.

### 4.1 Primeiro, pelo app — porque isso também é teste

Na mesma tela `/ativar-campanha/<uuid>`, o botão **"Pausar campanha"**
(`[campanha]/page.tsx:188`). Ele aparece quando os carimbos dizem
`rodando` ou `rodando_desde_sempre`.

Pausar **não pede confirmação nenhuma**, e é decisão — invariante 3 de
`ativar.ts:25-27`: *"O freio nunca pede permissão."*

### 4.2 Confira que parou, pelos mesmos três caminhos do §3

Os três `status` de volta a `PAUSED`. No banco:
`publish_state = 'pausada'`, com `pausada_em`/`pausada_por` preenchidos e
**`ativada_em` continuando lá** — os quatro carimbos convivem, e é o
desenho certo (`0024:36-51`).

### 4.3 Se o botão do app falhar — o freio manual

**Não fique investigando com a campanha no ar.** Vá ao Gerenciador de
Anúncios e **desligue a chave da campanha**. Pausar a campanha desliga
tudo abaixo dela; é uma ação e resolve o gasto.

Depois, com o gasto parado, acerte o banco:

```sql
update campaigns
   set publish_state = 'pausada',
       pausada_em    = now(),
       pausada_por   = 'victorcabralnsilva@gmail.com'
 where id = '<uuid-da-campanha>';
```

(O CHECK `campaigns_pausada_exige_carimbo_check` exige o par preenchido —
`0024:127-131`. Por isso os três campos na mesma instrução.)

### 4.4 Se a campanha ficar presa em `'ativando'`

É a trava de concorrência. Ela se solta sozinha **em 10 minutos**
(`ativar.ts:85`): a tentativa seguinte retoma. Se quiser destravar antes:

```sql
update campaigns set publish_state = 'published', ativando_em = null
 where id = '<uuid-da-campanha>' and publish_state = 'ativando';
```

**Mas confira na Meta primeiro** se algum nível chegou a subir. Preso em
`'ativando'` quer dizer que não sabemos onde parou.

---

## §5. (e) Se algo der errado — o que copiar para mim

Não tente consertar no meio. **Pause primeiro** (§4.3), depois colete.
Quanto mais completo, menos eu chuto.

### 5.1 As cinco coisas, nesta ordem

1. **O rastro no banco** — é o mais importante, tem o código do erro e a
   frase juntos:

   ```sql
   select kind, status, needs_review, payload, created_at
   from decisions
   where campaign_id = '<uuid-da-campanha>'
   order by created_at;
   ```

   Copie o `payload` **inteiro** das linhas com `status = 'failed'`. Ele
   traz `nivel`, `code`, `subcode`, `type` e **`fbtrace_id`**
   (`ativar.ts:279-300`) — o `fbtrace_id` é o que identifica a chamada do
   lado da Meta.

2. **A frase que apareceu na tela**, copiada literalmente.

3. **O console do `pnpm dev`** — tudo que começa com `[ativar-campanha]`,
   `[ativar:` ou `[meta]`. A resposta crua da Meta **nunca** vai para a
   tela (é regra: em várias rotas o corpo carrega o próprio token), então
   o detalhe está só aqui.

4. **O estado dos três níveis na Meta**, pelo §3.1 — `status` e
   `effective_status` dos três, mesmo que pareçam óbvios. "Parou no
   conjunto" e "parou no anúncio" levam a consertos diferentes.

5. **A linha da campanha**:

   ```sql
   select id, publish_state, ativada_em, ativada_por, pausada_em,
          pausada_por, ativando_em, external_campaign_id, external_adset_id
   from campaigns where id = '<uuid-da-campanha>';
   ```

### 5.2 O caso que exige mais cuidado

Se a tela disser **"Alguma coisa quebrou do nosso lado no meio da
operação. NÃO dá para saber se o Meta chegou a receber a mudança"** —
essa frase vem de `actions.ts:190-198`, e ela é literal: **não sabemos se
subiu.**

Nesse caso, **confira na Meta antes de qualquer outra coisa**, e pause à
mão se estiver ativo. Só depois colete o resto.

### 5.3 O que **não** copiar

**Nunca cole o `access_token`**, nem em print, nem em URL da Graph API,
nem em log. Se precisar mandar uma URL da Graph, corte tudo a partir de
`&access_token=`.

---

## §6. O que este roteiro não garante

Escrito lendo o código, não executando — nenhum passo abaixo foi rodado
por mim:

1. **Não sei o que a Meta responde.** É o objetivo do teste. Em especial:
   se `POST /{id}` com `status=ACTIVE` é o caminho certo nos três níveis,
   e qual erro vem quando a conta não tem saldo — a checagem que existe
   hoje responde "dá para criar o objeto?", não "dá para gastar?"
   (`ativar.ts:62-65`).
2. **Não consultei o banco.** As consultas do §1.2 e do §1.3 são para
   você rodar; eu não sei quantas linhas de `campaigns` existem, nem se
   alguma já satisfaz os cinco requisitos.
3. **Não sei se a conta `act_2818009911919726` tem forma de pagamento
   ativa.** Sem ela a ativação falha, e provavelmente com uma mensagem
   que ninguém aqui ainda viu.
4. **Não conferi que o papel de operador continua na conta do 11/09.**
   A medição tem doze dias. Confirme no passo 0.2 antes de culpar a rota.
5. **A ordem de ativação é de cima para baixo** (campanha → conjunto →
   anúncio), e isso é proteção: se parar no meio, o que ficou `ACTIVE`
   está dentro de algo ainda `PAUSED` e **não gasta** (`ativar.ts:235-240`).
   Essa afirmação é raciocínio do autor do código sobre como a Meta compõe
   os níveis — **não é medição desta base.** Confirmá-la é parte do teste.
