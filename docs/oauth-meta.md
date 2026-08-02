# OAuth do Meta — desenho

> **Status: proposta, aguardando aprovação.** Nada implementado. O contrato
> de segredo já estava definido em [`token-vault.md`](./token-vault.md) —
> este documento é o resto: rotas, escopos, telas e modos de falha.
>
> Escopo deste lote: **conectar e listar**. Nada de criar campanha,
> publicar anúncio ou gerar criativo.

Versão da API: **v25.0** (a atual desde fevereiro de 2026). Fixada em
variável, não espalhada pelo código — subir de versão precisa ser um lugar
só.

---

## 1. O que falta no banco (migration 0005)

Três colunas que o desenho pede e o schema não tem:

| Tabela | Coluna | Por quê |
|---|---|---|
| `ad_accounts` | `ownership text not null default 'cliente'` | Distinguir conta do próprio cliente de conta da V2G. Com `check (ownership in ('cliente','v2g'))` — hoje só existe o primeiro caso, mas a coluna nasce sabendo do segundo. |
| `ad_accounts` | `status text not null default 'ok'` | Os modos de falha precisam marcar a conta, não só a conexão. Valores: `ok`, `expired`, `revoked`, `no_permission`. |
| `meta_connections` | `instagram_account_id text` | **Criada e nunca preenchida** — ver §2. Mantida porque o schema já a aceita nula e ela volta a ser usada quando o Instagram Graph API entrar. |
| `meta_connections` | `meta_user_id text` | Quem autorizou. Necessário para diagnóstico quando o token morre. |
| `meta_connections` | `scopes text[]` | O que o usuário de fato concedeu — nem sempre é tudo que pedimos. |
| `meta_connections` | `last_error text` | O subcódigo do último erro 190, para a tela dizer o motivo certo. |

`token_secret_id` continua com `select` revogado de `anon`/`authenticated`
(migration 0003). As colunas novas são legíveis pelo dono — nenhuma delas é
segredo.

---

## 2. Escopos — o mínimo, e o que isso custa depois

| Escopo | Para quê | Usado neste lote? |
|---|---|---|
| `public_profile` | vem por padrão, não é pedido | — |
| `ads_read` | listar as contas de anúncio e ler o que elas têm | sim |
| `ads_management` | criar e gerenciar campanhas | **não — pedido agora, usado depois** |
| `business_management` | alcançar contas dentro de um Business Manager | sim |
| `pages_show_list` | **listar** as páginas do Facebook | sim |
| `pages_read_engagement` | **ler os campos** de cada página — é o que revela o WhatsApp ligado | sim |

**`ads_management` é pedido agora, mesmo sem uso neste lote.** A primeira
versão deste documento propunha o contrário — pedir só o necessário para
conectar e listar. Estava errado, por duas razões que pesam mais que o
princípio do menor privilégio no momento do consentimento:

1. **O segundo consentimento cairia no pior momento possível.** Ele
   aconteceria quando o cliente já gastou a paciência toda no onboarding e
   está esperando o anúncio subir. É exatamente onde se abandona.
2. **`ads_read` e `ads_management` passam pelo mesmo App Review.** Pedir
   separado significa enfrentar a fila do Meta duas vezes — e o segundo
   pedido poderia ser negado com cliente já rodando, o que quebraria o
   produto em produção sem caminho de volta rápido.

O código continua sem escrever nada na conta de anúncio neste lote. O
escopo está concedido, não exercido — a diferença aparece no que a
aplicação faz, não no que ela poderia fazer.

**A consequência que sobra:** a tela de permissões do Facebook fica mais
pesada, com "gerenciar suas contas de anúncios" em vez de só "ler". A tela
`/conectar` (§6) prepara o cliente para exatamente esse texto.

### `pages_read_engagement` — por que ele NÃO é acessório

**`pages_show_list` lista as páginas. `pages_read_engagement` deixa ler os
campos delas.** São permissões diferentes, e a segunda é a única forma de
descobrir se uma página tem WhatsApp ligado:

```
GET /{page_id}?fields=whatsapp_number,connected_whatsapp_business_account
```

**Verificado em produção, com a conta real, antes de o escopo ser
pedido:** a listagem funcionou (3 páginas, com nome e categoria) e a
leitura dos campos falhou nas 3, com

```
(#100) This endpoint requires the 'pages_read_engagement' permission
```

O resultado era `null` para toda página — inclusive para as que têm
WhatsApp. Não "não tem número": "não consigo saber".

**Por que isso derruba o produto e não só um detalhe:** o v1 inteiro é
click-to-WhatsApp. Página sem número ligado não tem para onde mandar quem
clica no anúncio. Sem este escopo, o cliente escolheria a página no
escuro e só descobriria o problema quando a publicação falhasse — o pior
momento possível, e exatamente o que a verificação na tela de conexão
existe para evitar.

> **Aviso para quem for enxugar escopos depois.** O `pages_show_list` já
> foi removido por engano uma vez, junto com a função que o usava, e o
> buraco só apareceu um lote adiante, quando publicar exigiu `page_id`.
> Antes de tirar qualquer escopo desta lista, a pergunta não é "quem usa
> isto hoje" — é "o que dependeria disto depois". O mesmo aviso está em
> `lib/meta/oauth.ts`, junto do código.

Custo: entra no **mesmo App Review** de `ads_read` e `ads_management`.
Como nada foi submetido ainda, o custo marginal é uma linha no pedido.
Depois de submetido, seria uma segunda fila.

---

## 2.1 NÃO DÁ PARA SABER, PELA API, SE UMA PÁGINA TEM WHATSAPP LIGADO

**Este é o registro mais útil deste documento. Leia antes de tentar.**

A tentativa foi: ler os campos de WhatsApp da Página para avisar o cliente,
na hora de conectar, que aquela página ainda não recebe conversa. Isso
**não funciona**, e não é por falta de escopo.

### O que foi testado, e contra o quê

Conta real, três Páginas, Graph API v25.0, com estado conhecido por
auditoria manual nas interfaces do Meta:

| Página | Portfólio | WhatsApp segundo a interface do Meta |
|---|---|---|
| V2G | V2G Midia | **nenhum** — vínculo pendente |
| Piligrin Build | BM - Piligrin | **+55 21 93618-2928** |
| Piligrin | BM - Piligrin | **dois números**: 21 98035-1531 e 21 93618-2928 |

### O resultado

```
GET /{page_id}?fields=whatsapp_number,has_whatsapp_number,has_whatsapp_business_number

Piligrin  (token de usuário)  →  {"id": "847147288492237"}
Piligrin  (token da PÁGINA)   →  {"id": "847147288492237"}
```

**A Página com DOIS números devolve os três campos omitidos, mesmo lida
com o token dela própria** — o nível mais alto de acesso disponível. Os
campos existem no schema (pedi-los não dá erro), mas nunca são
preenchidos.

Conclusão: `whatsapp_number`, `has_whatsapp_number` e
`has_whatsapp_business_number` são **superfície legada**, do tempo em que
existia um botão de WhatsApp na Página. Elas não refletem o vínculo
WABA–portfólio que a interface do Meta mostra hoje.

### O que foi descartado no caminho

**Não é escopo.** Antes de `pages_read_engagement` o erro era
`(#100) requires the 'pages_read_engagement' permission`; depois virou
`(#100) Tried accessing nonexisting field`, e com os nomes corretos passou
a devolver 200 com os campos ausentes. O escopo resolveu o acesso — o
dado é que não existe.

**Não é portfólio.** A hipótese natural (as Páginas com número estão em
`BM - Piligrin`, e o app foi criado em `V2G Midia`) foi testada e caiu:

```
/me/businesses  →  V2G Midia, Victor Cabral, BM - Piligrin
```

O token alcança os três, lê `/{page_id}?fields=business` de todas, e tem
as seis tarefas (ADVERTISE, ANALYZE, CREATE_CONTENT, MESSAGING, MODERATE,
MANAGE) em cada uma. Nada estava fora de alcance.

**Não adianta subir de escopo.** As arestas onde o vínculo moderno vive
respondem `(#200) You do not have permission to access this field`:

```
/{business_id}/owned_whatsapp_business_accounts
/{business_id}/client_whatsapp_business_accounts
/{page_id}/whatsapp_business_accounts          → nem existe
```

As duas primeiras exigem `whatsapp_business_management` — outro App
Review. E mesmo obtido, ele responde "existe WABA no portfólio", que
**não é a mesma pergunta** que "esta Página está ligada a um número para
anúncio de conversa".

### Armadilha: `phone` não serve

```
/{page_id}?fields=phone   →  {"phone": "+5521980351531"}
```

As duas Páginas devolvem número aqui — inclusive a V2G, que não tem
WhatsApp nenhum. `phone` é o telefone de contato exibido na Página, existe
sem WhatsApp e **não habilita anúncio de conversa**. Quem olhar rápido vai
achar que resolveu.

### Detalhe adicional

`/me/accounts` lista as Páginas onde o **usuário** tem papel, não todas as
do portfólio: `/{business_id}/owned_pages` revelou uma quarta Página
(`Piligrin Build 1`) que a primeira não retorna.

### O que fazer em vez disso

Verificar no momento que importa, contra o que importa: **a própria
criação do criativo**. Ver `docs/publicar-campanha.md` — a checagem correta
é perguntar ao Meta se aquele criativo seria aceito, não inferir por campo
de Página.

### `instagram_basic` foi removido

A primeira versão pedia também `instagram_basic`, para listar o perfil de
Instagram na tela de escolha. O Facebook recusava a autorização inteira:

```
Invalid Scopes: instagram_basic
```

O escopo não vem com o produto "Login do Facebook" — exige o **Instagram
Graph API** adicionado no painel do app, mais App Review e verificação de
empresa para sair do modo desenvolvimento.

**O que decidiu a remoção não foi o custo, foi o modo de falha.** Sem o
escopo, o Facebook não devolve erro: ele apenas omite o subcampo
`instagram_business_account`. A tela então concluiria "não achamos um
Instagram profissional" para **todo mundo**, inclusive para quem tem um, e
mandaria essa pessoa ao WhatsApp resolver um problema que não existe.
Interface afirmando o que não verificou — o mesmo defeito que a migração do
onboarding eliminou.

O v1 não precisa do dado: quem recebe o anúncio é a conta de anúncio, e a
identidade vem pela página. A coluna `meta_connections.instagram_account_id`
fica no schema, vazia, com a nota de retorno em `lib/meta/graph.ts`.

---

## 3. Rotas

```
app/(fluxo)/conectar/page.tsx        tela de preparação (a única que o usuário vê)
app/(fluxo)/conectar/escolher/page.tsx  escolha de conta, depois do callback
app/auth/meta/iniciar/route.ts       GET  → monta o state, redireciona ao Meta
app/auth/meta/callback/route.ts      GET  ← o Meta redireciona para cá
lib/meta/oauth.ts                    troca de code, long-lived, debug_token
lib/meta/graph.ts                    listagem das contas de anúncio
lib/meta/erros.ts                    tradução de erro do Meta para português
```

`/auth/meta/*` são Route Handlers, não Server Actions: o Meta devolve o
navegador com um `GET ?code=...`, e Server Action não atende esse formato.
Ficam fora dos grupos de rota, e o `proxy.ts` precisa continuar deixando
`/auth/*` passar — senão o redirect de volta é barrado antes de chegar.

### `/auth/meta/iniciar`

1. Confere a sessão. Sem usuário → `/entrar?next=/conectar`.
2. Resolve o `business_id` do usuário. Sem negócio → `/onboarding`.
3. Gera `nonce` aleatório (32 bytes, `crypto.randomUUID()` não basta —
   `crypto.getRandomValues` em base64url).
4. Grava um cookie `meta_oauth_state` com `{ nonce, businessId, criadoEm }`:

   ```
   httpOnly: true      não é lido por JavaScript nenhum
   secure:   true      só em HTTPS (em dev, false)
   sameSite: 'lax'     OBRIGATÓRIO ser lax, não strict
   maxAge:   600       10 minutos
   path:     '/auth/meta'
   ```

   > **`sameSite: 'lax'` não é descuido.** Com `strict`, o cookie não
   > acompanha a navegação de volta que vem do domínio do Facebook, e o
   > callback nunca acha o state — o fluxo quebra 100% das vezes. `lax`
   > permite exatamente este caso (navegação de topo, método GET) e continua
   > barrando requisição cross-site de terceiro.

5. Redireciona para:

   ```
   https://www.facebook.com/v25.0/dialog/oauth
     ?client_id=<META_APP_ID>
     &redirect_uri=<NEXT_PUBLIC_SITE_URL>/auth/meta/callback
     &state=<nonce>
     &scope=ads_read,ads_management,business_management,pages_show_list,pages_read_engagement
     &response_type=code
   ```

O `redirect_uri` precisa ser **idêntico** ao registrado no painel do Meta,
caractere por caractere — barra final inclusive. É a causa nº 1 de
`redirect_uri_mismatch`.

### `/auth/meta/callback`

Ordem, com o motivo de cada passo:

1. **Se veio `error` na query** → o usuário recusou ou fechou o popup.
   Redireciona para `/conectar?erro=recusado`. Não é falha do sistema, é uma
   escolha; a tela trata como tal.
2. **Lê o cookie de state e compara com `?state=`.** Diferente ou ausente →
   `/conectar?erro=state`. **Não prossegue em hipótese alguma.** Sem esta
   comparação, um terceiro consegue induzir o usuário logado a ligar a conta
   de anúncios *dele* ao negócio da vítima.
3. **Apaga o cookie**, tenha dado certo ou não. State é de uso único.
4. **Confere a sessão de novo** e confirma que o `businessId` do cookie
   pertence a este usuário (`private.owns_business`). O cookie é nosso, mas
   a sessão pode ter trocado entre o início e o retorno.
5. **Troca o `code` pelo token curto:**
   `GET graph.facebook.com/v25.0/oauth/access_token?client_id&redirect_uri&client_secret&code`
6. **Troca o curto pelo longo (~60 dias):**
   `GET .../oauth/access_token?grant_type=fb_exchange_token&client_id&client_secret&fb_exchange_token=<curto>`
   Guardar o curto seria inútil — expira em horas.
7. **`debug_token`** para saber `expires_at`, `scopes` concedidos e o
   `user_id`. Usa `access_token=<APP_ID>|<APP_SECRET>` — daí este passo ser
   obrigatoriamente servidor.
8. **Grava tudo numa transação** (§4).
9. Redireciona para `/conectar/escolher`.

Nenhuma dessas respostas é logada. O `console.error` de falha registra
`error.code`, `error.error_subcode` e `error.type` — **nunca** o corpo, que
contém o token.

---

## 4. A transação

Segredo no Vault sem linha em `meta_connections` vira órfão que ninguém sabe
que existe. Linha sem segredo vira conexão que nunca funciona. Os dois são
evitáveis fazendo tudo num `insert` só, do lado do banco:

```sql
create function private.conectar_meta(
  p_business_id  uuid,
  p_token        text,
  p_expires_at   timestamptz,
  p_meta_user_id text,
  p_scopes       text[]
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_conn_id   uuid;
begin
  -- nome determinístico: reconectar atualiza o segredo, não acumula lixo
  select id into v_secret_id from vault.secrets
   where name = 'meta_token_' || p_business_id::text;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(
      p_token, 'meta_token_' || p_business_id::text, 'Token do Meta');
  else
    perform vault.update_secret(v_secret_id, p_token);
  end if;

  insert into public.meta_connections (
    business_id, token_secret_id, status, connected_at, expires_at,
    meta_user_id, scopes, last_error)
  values (p_business_id, v_secret_id, 'connected', now(), p_expires_at,
          p_meta_user_id, p_scopes, null)
  on conflict (business_id) do update set
    token_secret_id = excluded.token_secret_id,
    status = 'connected', connected_at = now(),
    expires_at = excluded.expires_at, meta_user_id = excluded.meta_user_id,
    scopes = excluded.scopes, last_error = null, updated_at = now()
  returning id into v_conn_id;

  return v_conn_id;
end;
$$;
```

Precisa de uma `unique (business_id)` em `meta_connections` para o
`on conflict` funcionar — entra na mesma migration. Um negócio tem uma
conexão; reconectar substitui.

`EXECUTE` revogado de `anon` e `authenticated`. Chamada só pelo callback,
com o cliente `admin` (`lib/supabase/admin.ts`, `service_role`) — o primeiro
uso real daquele arquivo, que até hoje não é importado por ninguém.

> **Correção feita na implementação: a função ficou em `public`, não em
> `private`.** Este documento dizia `private.conectar_meta()`, pela mesma
> lógica da migration 0002 — schema `private` não é exposto pelo PostgREST,
> então a função não vira endpoint. Só que o app chama esta função por RPC,
> e RPC passa pelo PostgREST: o que não é exposto não é chamável por
> **ninguém**, nem por `service_role`. Em `private` a função só seria
> alcançável por conexão Postgres direta, que a aplicação não tem.
>
> A proteção equivalente, para função que precisa ser chamável, é a de
> `list_orphan_businesses()`: manter em `public` e revogar `EXECUTE` de
> `public`, `anon` e `authenticated`, concedendo só a `service_role`.
> Verificado: usuário autenticado recebe **HTTP 403**. Ver migration 0006.

**O token nunca passa pelo PostgREST como dado legível.** A chamada é RPC
com `service_role`, o parâmetro entra no corpo do POST sob TLS, e a função
devolve o uuid da conexão — nunca o token.

### Leitura: `public.obter_token_meta(business_id)`

Mesmo desenho de privilégio. Devolve `null` (não erro) quando não há
conexão ou quando o status indica token morto — quem chama trata `null`
como "precisa reconectar", que é a única resposta útil. Usada pelo app na
tela de escolha e pelo N8N na operação das campanhas.

### Marcação de quebra: `public.marcar_conexao_meta_quebrada()`

Marca `meta_connections.status` e o `status` de todas as `ad_accounts` do
negócio. Chamada por quem descobrir primeiro que o token morreu — quase
sempre o N8N, que usa o token de madrugada. **Não apaga o segredo do
Vault:** apagar na hora atrapalha o diagnóstico.

---

## 5. Listagem e escolha

Depois do callback, `/conectar/escolher` mostra o que o token alcança:

```
GET /v25.0/me/adaccounts?fields=id,name,account_status,currency,business
```

Uma conta é **elegível** quando `account_status = 1` (ativa). As demais
aparecem na lista, desabilitadas, com o motivo em português — some-las faria
o cliente achar que a conta dele não existe.

A escolha grava em `ad_accounts`:

```
business_id, meta_connection_id, external_id (act_...), name, currency,
ownership = 'cliente', status = 'ok'
```


### Nenhuma conta elegível

É o beco mais provável do funil e precisa de tela própria, não de uma lista
vazia. Três causas, três textos diferentes:

| Causa | O que a tela diz |
|---|---|
| Nenhuma conta de anúncio | "Não achamos nenhuma conta de anúncio ligada a este perfil." + caminho para falar com uma pessoa |
| Todas desativadas | "A conta que achamos está desativada no Facebook." + o que fazer |

Nenhum desses termina em beco: todos têm botão de WhatsApp. É a instrução
que você deu e é onde o funil mais perde gente.

---

## 6. A tela `/conectar`

Grupo `(fluxo)` — uma tarefa, sem sidebar, sem fuga.

**A palavra "Meta" não aparece.** O cliente conecta "o Instagram do meu
negócio". Mas o popup do Facebook **vai** aparecer cheio de jargão que a
nossa interface não usa, e é aí que a pessoa abandona achando que caiu num
golpe. A tela avisa antes:

> **A próxima tela é do Facebook, não nossa.**
> Ela vai falar em "Meta", "Business Manager" e "gerenciar suas contas de
> anúncios". É o nome técnico das coisas, e é assim para qualquer empresa
> que anuncia no Instagram. Pode seguir: é a tela oficial deles.

E, logo abaixo, o item que o `ads_management` obriga a explicar — porque a
tela do Facebook vai usar a palavra "gerenciar", que assusta:

> **Por que ele pede "gerenciar seus anúncios"**
> É essa permissão que deixa a gente criar e ajustar seus anúncios por
> você — que é o serviço que você contratou. Sem ela, a gente só
> conseguiria olhar. Ela **não** dá acesso ao seu perfil pessoal, às suas
> mensagens nem ao seu feed.

Três promessas, com o mesmo peso:

1. **A V2G nunca posta no seu feed.** Não pedimos permissão de publicar
   nada no seu perfil. O que criamos são anúncios, que aparecem para quem
   você escolhe — não no seu perfil.
2. **Você continua dono de tudo.** A conta de anúncio é sua, o Instagram é
   seu. Se sair, leva tudo.
3. **Dá para desconectar quando quiser**, direto no app.

E, embaixo, a saída que hoje não existe:

> **Não tenho conta profissional no Instagram** → leva para um caminho com
> uma pessoa de verdade no WhatsApp, com a mensagem já preenchida.

---

## 7. Modos de falha

### Durante a conexão

| Situação | Query de volta | Tela |
|---|---|---|
| Usuário recusou | `error=access_denied` | "Você não autorizou. Sem isso não dá para anunciar por você — quando quiser, é só voltar." + botão de tentar de novo |
| `state` inválido | — | "Esse link expirou por segurança. Comece de novo." Nunca prossegue. |
| `redirect_uri` errado | `error=redirect_uri_mismatch` | Erro nosso, não do usuário. Mensagem genérica + WhatsApp. Log com o detalhe. |
| Troca de code falhou | — | Genérica + WhatsApp. Log com `code`/`subcode`, sem corpo. |
| Sem conta elegível | — | §5 |

### Depois de conectado

Os três da [`token-vault.md`](./token-vault.md), sem refresh silencioso em
nenhum:

| Situação | Erro do Meta | `meta_connections.status` | `ad_accounts.status` |
|---|---|---|---|
| Expirou (~60 dias) | 190 / 463 | `expired` | `expired` |
| Removeu o app | 190 / 458 | `revoked` | `revoked` |
| Trocou a senha | 190 / 460 | `revoked` | `revoked` |
| Perdeu acesso à conta | 200 / — | `connected` | `no_permission` |

**Nunca retry silencioso.** Nos três primeiros o token está morto e tentar
de novo só queima chamada. O que acontece:

1. Uma **faixa persistente** no topo de `/campanhas` e `/inicio` quando
   `status != 'connected'`. Não é toast — é estado do sistema e fica até
   ser resolvido.
2. Botão **"Reconectar"** na faixa, que vai direto para
   `/auth/meta/iniciar`. Aviso sem botão é reclamação.
3. Rotina diária (`pg_cron`) marca `expiring` quando faltarem menos de 7
   dias, para avisar antes de quebrar.

O texto diz a consequência antes do motivo: "Sua conta de anúncios
desconectou. Enquanto isso, suas campanhas não recebem ajustes
automáticos."

---

## 8. Segurança — checklist

- [ ] `META_APP_SECRET` só no servidor. **Nunca** prefixado com
      `NEXT_PUBLIC_`. `lib/meta/oauth.ts` leva `import "server-only"`.
- [ ] Token nunca em `console.log`, nunca em resposta de rota, nunca em
      coluna de tabela. Só Vault.
- [ ] `state` validado sempre, cookie `httpOnly` + `sameSite=lax`, uso único.
- [ ] `redirect_uri` idêntico ao registrado.
- [ ] `private.conectar_meta` com `search_path = ''` e `EXECUTE` revogado.
- [ ] Só os 4 escopos da §2.
- [ ] O erro que chega ao usuário nunca inclui a resposta crua do Meta.

---

## 9. O que fica de fora deste lote

Publicar campanha, criar anúncio, gerar criativo, `ads_management`, e a
rotina `pg_cron` de expiração (o desenho está aqui; a implementação vem
junto com o primeiro uso real do token).
