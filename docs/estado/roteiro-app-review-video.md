# Roteiro do vídeo de App Review — Meta

## Resumo — leia estas cinco linhas primeiro

1. **Gravável hoje? PARCIALMENTE.** Três das seis permissões têm tela que
   as exercita (`ads_read`, `business_management`, `pages_show_list`); as
   outras três (`ads_management`, `pages_manage_ads`,
   `pages_read_engagement`) **não têm nenhuma ação no produto hoje**, nem
   pausada — porque nenhuma tela chama `publicarCampanha()`.
2. **Reserve 1h30:** 20 min de preparo (§5), 3 ensaios de ~5 min, a
   gravação boa, e 30 min para o texto do formulário (§4, já pronto para
   colar).
3. **Só você pode resolver, antes de gravar:** criar a conta de teste da
   V2G (e-mail e senha novos, não os seus), garantir que essa conta do
   Facebook tem conta de anúncio ativa e ao menos uma Página, e **mudar o
   idioma do Facebook para inglês** — a tela de consentimento segue o
   idioma da conta, e a Meta pede UI em inglês.
4. **O vídeo é MUDO.** A Meta manda desligar o áudio e usar legendas. Não
   prepare microfone; prepare a ferramenta de legenda.
5. **Decida a §0.2 antes de apertar gravar:** submeter agora só as três
   demonstráveis, ou adiar até a publicação existir. O roteiro serve para
   as duas, mas o texto do formulário muda.

---

**Escrito em 22/09/2026, revisado e conferido contra a produção em
23/09/2026.** Leia inteiro uma vez antes
de abrir o gravador. As duas primeiras seções mudam o plano; o roteiro
começa na §3.

---

## §0 — Duas coisas que mudam o plano, antes de qualquer outra

### 0.1 A Meta manda DESLIGAR o áudio. Não narre.

A instrução que veio no pedido era "diga em voz alta". A documentação
oficial diz o contrário, com estas palavras:

> *"Disable audio, since our reviewers won't need access to it."*

O que ela pede no lugar: **UI em inglês** quando possível e, quando não,
**legendas e tooltips** explicando o que está acontecendo — mais
**anotações** em cima de cada permissão demonstrada.

**Consequência prática:** o vídeo é mudo, com texto sobreposto. Onde este
roteiro diz "LEGENDA:", é isso que entra escrito na tela, não falado.
Grave sem microfone — sobra uma preocupação a menos.

### 0.2 Três das seis permissões NÃO têm tela que as exerça hoje

Isto é o obstáculo real, e ele não se resolve gravando melhor.

A Meta pede que o vídeo mostre **como usar o app para testar cada
permissão**. Medido no código hoje:

| escopo | tem tela que exerce? | onde |
|---|---|---|
| `ads_read` | **sim** | `/conectar/escolher` lista as contas de anúncio |
| `business_management` | **sim** | a mesma lista alcança contas dentro de um Business Manager |
| `pages_show_list` | **sim** | `/conectar/escolher` lista as Páginas, e `/conta` as lê de novo |
| `pages_read_engagement` | **não** | a única leitura de campos da Página é `GET /{page_id}?fields=location`, dentro de `garantirGeo()`, que só roda dentro de `publicarCampanha()` |
| `ads_management` | **não** | `publicarCampanha()` existe (`lib/meta/publicar.ts:273`) e **nenhuma rota ou action a chama** |
| `pages_manage_ads` | **não** | declarado em `lib/meta/oauth.ts:98`; o próprio comentário (`:85-86`) diz "NENHUMA linha deste projeto exerce este escopo hoje" |

**A prova de que nada publica**, escrita no próprio código em
`app/(fluxo)/verba/page.tsx:172-173`:

> *"a cascata de `garantirGeo()` só roda dentro de `publicarCampanha()`, e
> **nada foi publicado**. Ou seja, ninguém nunca perguntou nada à Página."*

**O que fazer com isso — duas saídas, e a escolha é sua:**

- **A) Submeter só os três demonstráveis agora** (`ads_read`,
  `business_management`, `pages_show_list`) e pedir os outros três numa
  segunda leva, quando a publicação estiver ligada. Custo: **duas filas de
  App Review**, e todo cliente já conectado terá que reconectar quando os
  escopos novos entrarem (`lib/meta/oauth.ts:92-96` — a Meta não concede
  permissão retroativamente).
- **B) Adiar o vídeo** até existir uma tela que dispare
  `publicarCampanha()`, e submeter os seis de uma vez. Custo: o tempo de
  construir essa tela.

O repositório já escolheu **B** por escrito, em
`docs/oauth-meta.md:47-52`: *"pedir separado significa enfrentar a fila do
Meta duas vezes — e o segundo pedido poderia ser negado com cliente já
rodando"*. Se você gravar amanhã assim mesmo, é a opção A, e é uma
mudança de plano consciente, não um detalhe.

### 0.3 Um erro medido que pode derrubar a gravação no meio

Em 15/09, na conta real, o pré-voo devolveu:

> *"conta act_880918131184584 inacessivel com este token: (#200) **Ad
> account owner has NOT grant ads_management**…"*

(`docs/estado/pre-voo-no-aprovar-15-09.md:17-19`)

Esse texto aparece no bloco de pré-requisitos da `/aprovar` — e é uma das
razões de o roteiro **não passar por lá** (ver o Bloco E). Mas o mesmo
erro `(#200)` derruba a listagem de contas em `/conectar/escolher`, que é
o centro do Bloco E. **Confira antes** (§5, item 8): se a conta de teste
não conseguir listar, o vídeo não tem o que mostrar.

---

## §1 — As seis permissões, para que servem e onde aparecem

Fonte: `lib/meta/oauth.ts:75-99`.

| # | escopo | linha | para que serve na V2G | onde o vídeo mostra |
|---|---|---|---|---|
| 1 | `ads_read` | `:76` | ler as contas de anúncio do cliente e o estado delas | `/conectar/escolher` — a lista de contas |
| 2 | `ads_management` | `:77` | criar e gerenciar a campanha na conta do cliente | **nenhuma tela hoje** |
| 3 | `business_management` | `:78` | alcançar contas que pertencem a um Business Manager | a mesma lista, quando a conta é de um BM |
| 4 | `pages_show_list` | `:79` | listar as Páginas do Facebook do cliente | `/conectar/escolher` e `/conta` |
| 5 | `pages_read_engagement` | `:80` | ler campos da Página — hoje, o `location`, de onde saem latitude e longitude do raio de 5 km | **nenhuma tela hoje** |
| 6 | `pages_manage_ads` | `:98` | anunciar em nome da Página | **nenhuma tela hoje** |

`public_profile` vem por padrão e não é pedido (`docs/oauth-meta.md:38`).

**Por que `pages_read_engagement` não é acessório** (vale para o
formulário): `pages_show_list` **lista** as Páginas;
`pages_read_engagement` deixa **ler os campos** delas. Medido em produção
antes de o escopo ser pedido: a listagem funcionou nas 3 Páginas e a
leitura de campos falhou nas 3 com `(#100) This endpoint requires the
'pages_read_engagement' permission` (`docs/oauth-meta.md:76-84`).

---

## §2 — O que a Meta exige do vídeo

Tudo desta seção veio da documentação oficial, consultada em 22/09/2026.

| item | exigência | fonte |
|---|---|---|
| **áudio** | **desligado** — "Disable audio, since our reviewers won't need access to it" | Screen Recordings |
| **idioma** | UI em **inglês** se possível; se não, **legendas e tooltips** | Screen Recordings |
| **resolução** | gravar em alta resolução, **1080 ou mais**; e **reduzir a largura do monitor para até 1440** antes de gravar | Screen Recordings |
| **login** | mostrar **o fluxo inteiro, do logout ao login** | Screen Recordings |
| **credenciais de teste** | se dá para criar conta sem Facebook Login, **incluir as credenciais de um usuário de teste** | Screen Recordings |
| **não usar** | **não** mandar credenciais da sua conta pessoal | Submission Guide |
| **anotações** | recomendado anotar **cada permissão pedida** | Screen Recordings |
| **modo do App** | manter em **Development**; só passar para **Live depois** que a revisão terminar | Submission Guide |
| **verificação de empresa** | pode ser pedida **depois** de escolher as permissões | Submission Guide |
| **duração máxima** | **não encontrado** na documentação oficial | — |
| **tamanho/formato de arquivo** | **não encontrado** na documentação de App Review (o que se acha é especificação de anúncio, que é outra coisa) | — |

**Não medido:** duração e limite de arquivo. Mire em **2 a 4 minutos** e
**MP4 / H.264**, que é o denominador comum seguro — mas isso é escolha
minha, não regra da Meta.

**Atenção à contradição do modo do App.** A Meta manda manter em
Development até a revisão passar. Mas o backend mediu (`backend_v2g/src/
meta/graph.py:96-99`) que **App em modo Desenvolvimento impede criar
anúncio** (`POST /ads` e `POST /adcreatives`), mesmo em conta de teste.
Campanha e conjunto sobem; o anúncio não. Ou seja: mesmo com a tela de
publicação pronta, o vídeo gravado em Development não consegue mostrar o
anúncio final sendo criado — só campanha e conjunto.

---

## §3 — O roteiro, passo a passo

**Antes:** faça a §5 inteira. Depois siga daqui sem parar.

### Bloco A — preparação visível (0:00 – 0:20)

1. Abra uma **janela anônima** do navegador. Isto é o "logout" que a Meta
   pede ver.
2. **LEGENDA:** `V2G — automated ad management for small Brazilian
   businesses. Starting logged out.`
3. Na barra de endereço, digite **exatamente** isto e dê Enter:

   ```
   https://v2g-deploy-webapp.vercel.app
   ```

   → **Medido às 23/09, ao vivo:** essa URL responde **200** e é a
   landing page do app, com o botão "Começar agora". `/entrar` responde
   200 e `/conectar` responde 307 (manda para `/entrar` sem sessão, que é
   o certo).
   → **NÃO use `v2gmidia.com.br`** — aquilo é a landing page de vendas,
   um site estático em outro repositório, e não tem cadastro.
   → **Se você tiver um domínio próprio apontando para o app**, use ele em
   vez deste endereço — mas só se o `NEXT_PUBLIC_SITE_URL` de produção for
   esse mesmo domínio. O `redirect_uri` tem que bater caractere por
   caractere (§5, item 3).

### Bloco B — criar a conta (0:20 – 1:00)

4. Clique em **"Começar agora"** — o do **canto superior direito**, na
   barra de navegação. (A página repete esse botão mais quatro vezes ao
   rolar, incluindo um chamado "Ativar meu plano"; qualquer um leva ao
   mesmo lugar. Se preferir não rolar nem procurar, vá direto para
   `https://v2g-deploy-webapp.vercel.app/entrar`.)
5. **LEGENDA:** `Creating a brand-new account. No Facebook Login here —
   e-mail and password.`
6. Preencha o formulário **"Criar minha conta"**: nome, WhatsApp com DDD,
   e-mail e senha.
   → Use o **e-mail de teste** que você vai mandar no formulário, **não o
   seu pessoal**.
7. Clique em **"Criar minha conta"**.
8. **LEGENDA:** `Signed in. The app now asks the business a few questions
   before connecting anything.`

### Bloco C — chegar à `/conectar` (1:00 – 1:30)

9. Você cai em `/inicio`. **Deixe a tela parada 3 segundos** — ela mostra
   as quatro fases e o próximo passo.
10. **LEGENDA:** `The app shows one next step at a time.`
11. Vá para a tela de conexão. O jeito que **não depende do estado da
    conta** é digitar na barra de endereço:

    ```
    https://v2g-deploy-webapp.vercel.app/conectar
    ```

    (O botão "Seu próximo passo" da `/inicio` também leva lá, mas o
    destino dele muda conforme o que falta no cadastro — numa conta nova
    ele pode apontar para o onboarding. Digitar a URL é previsível.)
12. **Pare 4 segundos nesta tela.** Ela é importante: é onde o app avisa o
    cliente, antes do popup, de que vai aparecer jargão do Facebook.
13. **LEGENDA:** `Before the Facebook dialog, the app explains in plain
    language what will be asked and why.`

### Bloco D — o consentimento, permissão por permissão (1:30 – 2:30)

14. Clique em **"Conectar meu Instagram"**.
    → **Não estranhe o rótulo.** O botão diz "Instagram", não "Facebook":
    é decisão de produto registrada em `app/(fluxo)/conectar/page.tsx:11`
    — *"A PALAVRA 'META' NÃO APARECE. O cliente conecta 'o Instagram do
    meu negócio' — é assim que ele chama."* É o botão certo; ele vai para
    `/auth/meta/iniciar`.
15. O navegador vai para `facebook.com/.../dialog/oauth`. **Não pule esta
    parte — é o centro do vídeo.**
16. Quando a tela de permissões aparecer, **role devagar até o fim** e
    pare em cada item.
17. **ANOTE cada permissão na tela** (retângulo + texto). Uma por vez:
    - `ads_read` → **LEGENDA:** `ads_read — read the client's ad accounts
      so the app can show which account the ads will run in.`
    - `ads_management` → **LEGENDA:** `ads_management — create and manage
      the campaign inside the client's own ad account.`
    - `business_management` → **LEGENDA:** `business_management — reach ad
      accounts that belong to a Business Manager.`
    - `pages_show_list` → **LEGENDA:** `pages_show_list — list the
      client's Facebook Pages so they can pick one.`
    - `pages_read_engagement` → **LEGENDA:** `pages_read_engagement — read
      the Page's location to target a 5 km radius around the business.`
    - `pages_manage_ads` → **LEGENDA:** `pages_manage_ads — run the ad on
      behalf of the client's Page.`
18. Clique em **continuar / autorizar**, aceitando **todas**.

### Bloco E — a volta, e as permissões trabalhando (2:30 – 3:30)

19. O navegador volta para o app, em `/conectar/escolher`.
20. **Pare 5 segundos.** Esta é a tela que prova três permissões de uma
    vez.
21. **LEGENDA:** `Back in the app. This list came from the Graph API using
    the permissions just granted.`
22. Aponte a **lista de contas de anúncio**.
    **ANOTAÇÃO:** `ads_read + business_management — GET /me/adaccounts`
23. Aponte a **lista de Páginas**.
    **ANOTAÇÃO:** `pages_show_list — GET /me/accounts`
24. Escolha uma conta e uma Página e confirme.
25. Vá para:

    ```
    https://v2g-deploy-webapp.vercel.app/conta
    ```

26. **LEGENDA:** `The connected account, read back live from the Graph
    API — not stored text.`
27. Aponte a **lista de Páginas** e o **nome da conta conectada**.
    **ANOTAÇÃO:** `pages_show_list — GET /me/accounts, read again on this
    screen.`

    → **Por que `/conta` e não `/aprovar`.** A `/aprovar` mostra "Página
    conectada: «nome»", que seria a prova mais bonita — mas numa conta
    recém-criada **não existe peça para aprovar**, e a tela pode aparecer
    vazia ou estranha na gravação. Pior: ela própria admite estar
    incompleta, e o texto está visível na página
    (`app/(fluxo)/aprovar/page.tsx:143`): *"Falta a parte que guarda a sua
    resposta e coloca a peça na fila."* Um revisor lendo isso no vídeo tem
    motivo para desconfiar. **Não passe por `/aprovar` nesta gravação.**

### Bloco F — o fecho (3:30 – 4:00)

29. Vá para **`/conta`**.
30. **LEGENDA:** `The client can disconnect at any time. Nothing is
    permanent.`
31. Mostre a seção de conexão e a opção de desconectar. **Não clique.**
32. **LEGENDA final:** `Every ad object the app creates starts PAUSED.
    Nothing spends money without the client's explicit action.`
    → Isto é verdade e está no código: `lib/meta/publicar.ts:22-23`.
33. Pare a gravação.

### O que o vídeo NÃO vai conseguir mostrar

Diga isso **no formulário**, não no vídeo:

- `ads_management` e `pages_manage_ads` **em uso** — nenhuma tela chama
  `publicarCampanha()` ainda.
- `pages_read_engagement` **em uso** — a leitura de `location` só roda
  dentro da publicação.

---

## §4 — Texto para o formulário

O campo da Meta é **"Requested Permissions and Features"**, e a pergunta é
*"why your app needs this permission or feature"* / *"How does this
permission help my app users?"*.

Mande **inglês** no formulário. O português abaixo é para você conferir se
o inglês diz o que você quer.

### `ads_read`

**PT —** A V2G monta e cuida dos anúncios do cliente dentro da conta de
anúncio dele, nunca numa conta nossa. Precisamos listar as contas de
anúncio que o cliente tem para que ele escolha em qual os anúncios vão
rodar, e para ler o estado dela (ativa, desativada, moeda) antes de tentar
qualquer coisa. Sem isso o cliente escolheria no escuro e só descobriria o
problema quando a publicação falhasse.

**EN —** V2G builds and manages ads inside the client's own ad account,
never in an account of ours. We need to list the ad accounts the client
has so they can choose which one the ads will run in, and to read that
account's state (status, disable reason, currency) before attempting
anything. Without it the client would choose blindly and would only find
out about a problem when publishing failed. Used in
`GET /me/adaccounts?fields=id,name,account_status,currency`.

### `ads_management`

**PT —** É a permissão que deixa a V2G criar a campanha, o conjunto e o
anúncio dentro da conta do cliente. Todo objeto que criamos nasce PAUSADO
— nada gasta sem uma ação explícita do cliente. É o serviço que o cliente
contrata: ele descreve o negócio e a V2G monta a campanha por ele.

**EN —** This is the permission that lets V2G create the campaign, ad set
and ad inside the client's own ad account. Every object we create is
created with `status: PAUSED` — nothing spends money without an explicit
action by the client. This is the service the client signs up for: they
describe their business and V2G assembles the campaign for them.

### `business_management`

**PT —** Muitos dos nossos clientes têm a conta de anúncio dentro de um
Business Manager, e não solta no perfil pessoal. Sem esta permissão a
listagem não alcança essas contas, e o cliente vê "nenhuma conta de
anúncio" tendo uma.

**EN —** Many of our clients keep their ad account inside a Business
Manager rather than directly on a personal profile. Without this
permission our listing cannot reach those accounts, and the client is told
"no ad account found" when they actually have one.

### `pages_show_list`

**PT —** O anúncio sai em nome de uma Página do Facebook, e é a Página que
recebe a conversa no WhatsApp. Listamos as Páginas do cliente para ele
escolher qual, e depois lemos o nome dela de volta para mostrar na tela de
aprovação — para ele ver de onde o anúncio vai sair antes de aprovar.

**EN —** The ad runs on behalf of a Facebook Page, and it is the Page that
receives the WhatsApp conversation. We list the client's Pages so they can
pick one, and later read the Page name back to display on the approval
screen, so the client can see which Page the ad will come from before
approving. Used in `GET /me/accounts?fields=id,name,category`.

### `pages_read_engagement`

**PT —** Nosso produto é anúncio local: o cliente escolhe um raio a partir
do próprio negócio, a partir de 5 km. Para isso precisamos da latitude e
da longitude, e a única fonte é `GET /{page_id}?fields=location` na Página
do cliente. O alvo por cidade da Meta tem piso medido de 16 km, grande
demais para uma padaria de bairro. Sem esta permissão o campo volta nulo e
não conseguimos montar o raio.

**EN —** Our product is local advertising: the client picks a radius
around their own business, starting at 5 km. That requires latitude and
longitude, and the only source is `GET /{page_id}?fields=location` on the
client's Page. Meta's city-level targeting has a measured floor of 16 km,
far too wide for a neighbourhood bakery. Without this permission the field
comes back null and we cannot build the radius at all.

### `pages_manage_ads`

**PT —** É a permissão que deixa a V2G veicular o anúncio em nome da
Página do cliente, que é o que o produto faz: a V2G opera os anúncios,
o cliente aprova. Sem ela a campanha não pode sair pela Página dele.

**EN —** This permission lets V2G run the ad on behalf of the client's
Page, which is what the product does: V2G operates the ads and the client
approves them. Without it the campaign cannot run from the client's Page.

### Campo de instruções / observação ao revisor

**EN —** Notes for the reviewer: every ad object this app creates is
created with `status: PAUSED`; the app contains no code path that sets an
object to `ACTIVE`. The app is in Development mode, which Meta's own docs
ask for until review completes; because of that, `POST /ads` is rejected
and the screencast shows the connection and account/Page selection flows
rather than a completed ad. Test account credentials are included below —
they belong to a dedicated test user, not to a personal account.

---

## §5 — Checklist antes de apertar gravar

1. **Conta de teste criada e anotada** — e-mail e senha à mão para colar
   no formulário. **Não** use a sua conta pessoal: a Meta proíbe por
   escrito.
2. **Janela anônima**, sem sessão antiga da V2G nem do Facebook.
3. **O `redirect_uri` cadastrado no painel da Meta.** A URL do app está
   medida e é `https://v2g-deploy-webapp.vercel.app` (respondeu 200 em
   23/09). O que **eu não consigo ler** é o `NEXT_PUBLIC_SITE_URL` de
   produção — ele mora no `.env` da Vercel. Confirme que ele é essa mesma
   URL, e que **`<NEXT_PUBLIC_SITE_URL>/auth/meta/callback`**, sem barra
   no fim, está em **Login do Facebook → Configurações → URIs de
   redirecionamento do OAuth válidos**. É a falha nº 1 desse fluxo
   (`.env.example:39-42`). Se estiver errado, o Bloco D morre na frente
   da câmera com uma tela de erro da Meta.
4. **NÃO é localhost e NÃO é `/exemplo/`.** A bancada responde 404 em
   produção, mas se você gravar em `localhost` o revisor vê `localhost` na
   barra de endereço.
5. **Microfone desligado.** A Meta pede áudio desabilitado.
5b. **Idioma do Facebook em inglês.** A tela de consentimento segue o
    idioma da **conta do Facebook**, não do navegador. Se a conta estiver
    em português, o revisor vê "gerenciar suas contas de anúncios" em
    português — e a Meta pede UI em inglês. Troque em
    *facebook.com → Configurações → Idioma e região* **antes** de gravar,
    e devolva depois se quiser.
6. **Resolução:** monitor com largura de até 1440, gravação em 1080p ou
   mais.
7. **Ferramenta de legenda/anotação pronta** — o vídeo é mudo e as
   anotações são o que explica.
8. **Faça o ensaio até o fim, sem gravar** — e o ponto de checagem é o
   Bloco E: depois de autorizar, a tela `/conectar/escolher` precisa
   **listar contas de anúncio e Páginas de verdade**. Se ela mostrar
   "Não achamos nenhuma conta de anúncio" ou um erro
   `(#200) Ad account owner has NOT grant ads_management`, **pare e
   resolva antes**: sem essa lista o vídeo não tem o que mostrar, e é
   justamente ela que prova três das seis permissões.
   → Esse ensaio consome a conexão da conta de teste. Se precisar repetir
   do zero, desconecte em `/conta` ou crie outra conta de teste.
9. **A conta de teste precisa ter**: uma conta de anúncio ativa e pelo
   menos uma Página do Facebook, senão as telas dos blocos D e E mostram
   estado vazio.
10. **Decida a §0.2 antes de gravar** — submeter três permissões agora ou
    os seis depois. O roteiro acima serve para as duas, mas o texto do
    formulário muda.
11. **App em modo Development.** Não publique antes da revisão.
12. Ensaie uma vez inteiro sem gravar. O fluxo tem um salto para fora do
    domínio (Facebook) e outro de volta; é onde a gravação costuma
    quebrar.

---

## Fontes

- [App Review | Screen Recordings](https://developers.facebook.com/docs/app-review/submission-guide/screen-recordings/)
- [App Review — Submission Guide](https://developers.facebook.com/docs/app-review/submission-guide)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/)

E, dentro do repositório: `lib/meta/oauth.ts:75-99`,
`lib/meta/publicar.ts:22-23, 273`, `app/(fluxo)/verba/page.tsx:172-173`,
`docs/oauth-meta.md:36-105`,
`docs/estado/pre-voo-no-aprovar-15-09.md:11-19`,
`backend_v2g/src/meta/graph.py:96-99`.
