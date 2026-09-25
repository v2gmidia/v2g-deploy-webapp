# Roteiro do vídeo de App Review — Meta

## Resumo — leia estas cinco linhas primeiro

1. **Gravável hoje? SIM, para cinco das seis.** `ads_read`,
   `business_management`, `pages_show_list`, **`ads_management`** e
   **`pages_read_engagement`** têm ação real no produto. Só
   `pages_manage_ads` continua sem — e ela depende de criar anúncio, que
   o modo Development bloqueia até a própria revisão passar.
2. **Reserve 2h:** 30 min de preparo (§5, agora com a tela de operador),
   3 ensaios de ~6 min, a gravação boa, e 30 min para o texto do
   formulário (§4, já pronto para colar).
3. **Só você pode resolver, antes de gravar:** criar a conta de teste da
   V2G (e-mail e senha novos, não os seus), garantir que essa conta do
   Facebook tem conta de anúncio ativa e ao menos uma Página, **mudar o
   idioma do Facebook para inglês**, e — novidade — deixar a **tela de
   operador acessível na sua conta de trabalho**, porque o Bloco E2 grava
   uma ativação de verdade (§5, itens 13 a 15).
4. **O vídeo é MUDO.** A Meta manda desligar o áudio e usar legendas. Não
   prepare microfone; prepare a ferramenta de legenda.
5. **A §0.2 deixou de ser uma decisão difícil:** peça as seis de uma vez.
   O buraco que motivava adiar fechou em 24/09, e o que sobrou
   (`pages_manage_ads`) é o impasse que a própria revisão desfaz.

---

**Escrito em 22/09/2026, conferido contra a produção em 23/09, e
revisado em 25/09/2026** — quando a ativação de campanha passou a
existir de verdade e três seções deixaram de ser verdadeiras (§0.2, o
Bloco E2 novo, e a nota ao revisor na §4). Leia inteiro uma vez antes
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

### 0.2 Cinco das seis permissões têm ação real — mudou em 24/09/2026

**Esta seção dizia o contrário até 24/09, e a mudança é grande o
bastante para reescrevê-la em vez de remendá-la.**

O que mudou: o `backend_v2g` ganhou duas rotas —
`POST /campanhas/{id_execucao}/ativar` (`rotas.py:3619`) e
`.../pausar` (`rotas.py:3640`) — e o webapp ganhou a tela que as chama,
`/ativar-campanha`. **Testado contra a Meta real em 25/09**, com
`"mock": false` e 200 nos dois sentidos, na campanha `120251447950510234`
da conta `act_2818009911919726`. A trilha está no banco, em
`execucoes.aprovacoes` da execução `aed42ce7`: quatro registros —
intenção e retorno de cada sentido, os dois com `campanha=ok`.

Medido no código hoje:

| escopo | tem tela que exerce? | onde |
|---|---|---|
| `ads_read` | **sim** | `/conectar/escolher` lista as contas de anúncio |
| `business_management` | **sim** | a mesma lista alcança contas dentro de um Business Manager |
| `pages_show_list` | **sim** | `/conectar/escolher` lista as Páginas, e `/conta` as lê de novo |
| `ads_management` | **sim, agora** | `/ativar-campanha/{id}` → `POST /{id}` com `status=ACTIVE` em cada objeto (`graph.py:617`), de cima para baixo (`graph.py:552-558`) |
| `pages_read_engagement` | **sim, agora** | abrir a tela dispara o pré-voo, que lê campos da Página: `GET /{page_id}?fields=id,name,is_published,whatsapp_number` (`graph.py:738-742`) |
| `pages_manage_ads` | **não** | só é exercida ao criar anúncio com `object_story_id` na Página — e isso é `POST /campanhas`, que nenhuma tela chama |

#### A ressalva que você precisa saber antes de gravar

**A ativação usa o token de System User da V2G, não o token que o revisor
acabou de conceder.** `ativar`/`pausar` chamam `obter_client_meta()` sem
passar token (`rotas.py:3543-3545`), e o `_token_atual` cai no token do
processo (`graph.py:154-162`). Só `subir_campanha` injeta o token do
pedido (`graph.py:271`).

O que isso significa na prática:

- **O vídeo mostra o app usando `ads_management` de verdade.** Isso é o
  que a Meta pede ver, e é verdade.
- **Um revisor que refizer o fluxo com o próprio usuário de teste não
  verá o `ads_management` dele ser usado** — porque ele não tem tela de
  operador, e porque a chamada sai com a nossa credencial.
- Não minta sobre isso no formulário. O texto da §4 já foi ajustado para
  descrever o que acontece, e a nota ao revisor explica o desenho: a V2G
  é uma agência, e quem opera os anúncios é o time.

#### A decisão: peça as seis de uma vez

O repositório já preferia isso por escrito, em `docs/oauth-meta.md:47-52`:
*"pedir separado significa enfrentar a fila do Meta duas vezes — e o
segundo pedido poderia ser negado com cliente já rodando"*. O que
impedia era não haver o que mostrar para três escopos. Agora falta um.

E `pages_manage_ads` é um impasse que a própria revisão desfaz: ela só é
exercida criando anúncio, e criar anúncio é bloqueado enquanto o App
estiver em Development — `POST /adcreatives` responde subcode 1885183,
*"o app está em modo de desenvolvimento"* (`lib/meta/publicar.ts:641-644`).
Adiar o pedido até conseguir demonstrar é esperar por uma porta cuja
chave é a própria revisão.

**Peça as seis, mostre cinco, e declare a sexta** — a nota ao revisor na
§4 já traz o texto.

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
| 2 | `ads_management` | `:77` | criar e gerenciar a campanha na conta do cliente | `/ativar-campanha/{id}` — o botão que liga e o que pausa |
| 3 | `business_management` | `:78` | alcançar contas que pertencem a um Business Manager | a mesma lista, quando a conta é de um BM |
| 4 | `pages_show_list` | `:79` | listar as Páginas do Facebook do cliente | `/conectar/escolher` e `/conta` |
| 5 | `pages_read_engagement` | `:80` | ler campos da Página: hoje `is_published` e `whatsapp_number` no pré-voo; o `location` do raio de 5 km quando a publicação ligar | `/ativar-campanha/{id}` — o bloco de pré-requisitos, ao abrir a tela |
| 6 | `pages_manage_ads` | `:98` | anunciar em nome da Página | **nenhuma tela ainda** — depende de criar anúncio, bloqueado em Development |

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

**Não medido:** duração e limite de arquivo. Mire em **4 a 5 minutos** e
**MP4 / H.264**, que é o denominador comum seguro — mas isso é escolha
minha, não regra da Meta. (Eram 2 a 4 antes do Bloco E2; a ativação
acrescenta cerca de um minuto, e ela é o que prova a permissão mais
difícil de justificar por escrito.)

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

### Bloco E2 — a ativação de verdade (3:30 – 4:30)

**Este bloco é novo, de 24/09, e é o que fecha `ads_management` e
`pages_read_engagement`.** Ele é gravado com a **sua conta de trabalho**
(a que tem `papel: operador`), não com a conta de teste — e é isso que a
legenda do item 30 explica ao revisor.

> **Antes de gravar este bloco, leia a §5 itens 13 a 15.** Ele liga uma
> campanha de verdade. A campanha é da conta de teste da própria V2G e o
> registro no banco diz, por escrito, *"não é de cliente nenhum"* — mas
> ela **entra no ar**, e você desliga no item 33.

28. Numa aba separada (já logado como operador), vá para:

    ```
    https://v2g-deploy-webapp.vercel.app/ativar-campanha
    ```

29. **LEGENDA:** `Internal operator screen. V2G is a managed service —
    our team turns the client's campaign on, the client never does.`
30. **LEGENDA:** `This uses a V2G staff account. The client-facing flow
    you just saw never exposes these controls.`
31. Clique em **Abrir** na campanha da fila. **Pare 5 segundos** no bloco
    de pré-requisitos.
    **ANOTAÇÃO:** `pages_read_engagement — GET /{page_id}?fields=id,name,
    is_published,whatsapp_number. The pre-flight reads the Page before
    anything is allowed to spend.`
32. Aponte o **nome do cliente** e o **valor por dia** acima do botão.
    **LEGENDA:** `Who it belongs to and what it will spend, both visible
    before the button exists.`
33. Clique em **Ativar campanha**. Espere a tela recarregar.
    **ANOTAÇÃO:** `ads_management — POST /{object_id} with status=ACTIVE,
    campaign then ad set then ads.`
34. Aponte o **rastro** no fim da página — as duas linhas novas, com quem
    pediu e a hora.
    **LEGENDA:** `Every activation is recorded: who asked, when, and what
    Meta answered.`
35. **Clique em Pausar campanha**, escreva `App Review recording` no
    motivo e confirme.
    **LEGENDA:** `And turned back off. The reason is mandatory — the
    system never pauses on its own.`
    → **Não pule este item.** É a prova de que o controle é bidirecional,
    e é o que evita deixar a campanha rodando depois da gravação.

### Bloco F — o fecho (4:30 – 5:00)

36. Vá para **`/conta`**.
37. **LEGENDA:** `The client can disconnect at any time. Nothing is
    permanent.`
38. Mostre a seção de conexão e a opção de desconectar. **Não clique.**
39. **LEGENDA final:** `Every ad object this app creates starts PAUSED.
    It only goes live when a V2G operator turns it on, one campaign at a
    time, with the client's budget shown on screen.`
    → Isto é verdade e está no código: `lib/meta/publicar.ts:22-23` para o
    PAUSED, e `graph.py:617` para a ativação deliberada.
40. Pare a gravação.

### O que o vídeo NÃO vai conseguir mostrar

Diga isso **no formulário**, não no vídeo:

- **`pages_manage_ads` em uso.** Ela só é exercida ao criar o anúncio com
  `object_story_id` na Página do cliente, e criar anúncio é o que o modo
  Development bloqueia (subcode 1885183). É o único dos seis escopos sem
  demonstração, e o motivo é o impasse que a revisão desfaz.
- **A criação da campanha, do início ao fim.** O vídeo mostra uma campanha
  que já existia sendo ligada e desligada — não a subida. Mesma causa.
- **O `location` da Página**, que é o uso de `pages_read_engagement` que
  o produto vai precisar para o raio de 5 km. O que o vídeo mostra é a
  outra leitura da mesma permissão, a do pré-voo, que já está no ar.

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
anúncio dentro da conta do cliente, e depois ligar e desligar a entrega.
Todo objeto nasce PAUSADO; ele só entra no ar quando alguém do time da
V2G aperta o botão, numa tela que mostra de quem é a campanha e quanto
ela vai gastar por dia. É o serviço que o cliente contrata: ele descreve
o negócio, a V2G monta e opera a campanha por ele. O vídeo mostra uma
ativação e uma pausa de verdade.

**EN —** This is the permission that lets V2G create the campaign, ad set
and ad inside the client's own ad account, and then start and stop
delivery. Every object is created with `status: PAUSED`; it only goes
live when a member of the V2G team turns it on, from an internal screen
that shows whose campaign it is and how much it will spend per day.
Pausing requires a written reason and is always available — the system
never pauses on its own. This is the service the client signs up for:
they describe their business, and V2G builds and operates the campaign
for them. The screencast shows a real activation and a real pause. Used
in `POST /{object_id}` with `status=ACTIVE` or `PAUSED`, applied to the
campaign, the ad set and each ad.

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

**PT —** Dois usos, e o vídeo mostra o primeiro. **Hoje:** antes de deixar
qualquer campanha gastar, conferimos a Página do cliente — se ela está
publicada (anúncio de Página despublicada não entrega) e se tem WhatsApp
ligado, que é para onde a conversa do anúncio vai. **Quando a publicação
ligar:** nosso produto é anúncio local, com raio a partir de 5 km em
volta do negócio, e a latitude e a longitude só existem em
`GET /{page_id}?fields=location`. O alvo por cidade da Meta tem piso
medido de 16 km, grande demais para uma padaria de bairro.

**EN —** Two uses; the screencast shows the first. **Today:** before any
campaign is allowed to spend, we check the client's Page — whether it is
published (ads from an unpublished Page do not deliver) and whether it
has WhatsApp enabled, since that is where the ad's conversation lands.
Used in `GET /{page_id}?fields=id,name,is_published,whatsapp_number`,
visible in the pre-flight block of the screencast. **Once publishing is
enabled:** our product is local advertising, with a radius starting at
5 km around the business, and latitude and longitude only come from
`GET /{page_id}?fields=location` on the client's Page. Meta's city-level
targeting has a measured floor of 16 km, far too wide for a
neighbourhood bakery.

### `pages_manage_ads`

**PT —** É a permissão que deixa a V2G veicular o anúncio em nome da
Página do cliente, que é o que o produto faz: a V2G opera os anúncios,
o cliente aprova. Sem ela a campanha não pode sair pela Página dele.

**EN —** This permission lets V2G run the ad on behalf of the client's
Page, which is what the product does: V2G operates the ads and the client
approves them. Without it the campaign cannot run from the client's Page.

### Campo de instruções / observação ao revisor

**EN —** Notes for the reviewer:

V2G is a managed advertising service for small Brazilian businesses. The
client connects their own ad account and Page; V2G's team builds and
operates the campaigns inside that account. The client never gets ad
controls — that is the product, not a limitation.

Every ad object this app creates is created with `status: PAUSED`. It
goes live only when a V2G operator activates it from an internal screen
that shows the client's name and the daily spend before the button
appears. That activation is what the second half of the screencast shows,
and it is a real one: a real campaign in our own test ad account
(`act_2818009911919726`) is turned on and then turned back off.

Because that screen belongs to our staff, it is recorded with a V2G
employee account rather than the test user whose credentials are below.
The activation call is made server-side with our Business System User
token against the client's ad objects — the client's granted
`ads_management` is what authorises V2G to hold and operate those objects
in their account.

The app is in Development mode, which Meta's own docs ask for until
review completes. Because of that, `POST /adcreatives` is rejected with
subcode 1885183 ("app in development mode"), so the screencast cannot
show an ad being created — only an existing campaign being operated. That
is also the single reason `pages_manage_ads` has no demonstration: it is
exercised when the ad is created on behalf of the Page, which Development
mode blocks. We are requesting it together with the others so that
clients do not have to re-authorise a second time; Meta does not grant
permissions retroactively to accounts that already connected.

Test account credentials are included below — they belong to a dedicated
test user, not to a personal account.

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
10. **A §0.2 não é mais uma decisão aberta** — peça as seis. O texto do
    formulário na §4 já está escrito para isso.
11. **App em modo Development.** Não publique antes da revisão.
12. Ensaie uma vez inteiro sem gravar. O fluxo tem um salto para fora do
    domínio (Facebook) e outro de volta; é onde a gravação costuma
    quebrar.

**Os três itens do Bloco E2 — a ativação real:**

13. **Duas sessões, dois navegadores.** A conta de teste (anônima, blocos
    A–F) e a sua conta de operador (janela normal, Bloco E2). Se usar a
    mesma janela, o login de operador derruba a sessão da conta de teste
    e o Bloco F fica sem o que mostrar.
14. **Confirme que `/ativar-campanha` abre e tem fila** antes de gravar.
    Se a conta não tiver `papel: operador` em `app_metadata`, a rota
    responde 404 **sem mensagem** e você vai achar que ela não existe.
    E confirme que a fila lista a execução `aed42ce7` — é a única do
    banco com campanha registrada.
15. **Aceite que o Bloco E2 gasta dinheiro de verdade**, por alguns
    minutos, na conta de teste da própria V2G. Se preferir risco zero,
    baixe o orçamento diário do conjunto no Gerenciador **antes** de
    gravar — mudança fora do app, sem efeito no roteiro. E **não pule o
    item 35**: é ele que desliga.

---

## Fontes

- [App Review | Screen Recordings](https://developers.facebook.com/docs/app-review/submission-guide/screen-recordings/)
- [App Review — Submission Guide](https://developers.facebook.com/docs/app-review/submission-guide)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/)

E, dentro do repositório: `lib/meta/oauth.ts:75-99`,
`lib/meta/publicar.ts:22-23, 273, 641-644`,
`app/(fluxo)/verba/page.tsx:172-173`, `docs/oauth-meta.md:36-105`,
`docs/estado/pre-voo-no-aprovar-15-09.md:11-19`,
`backend_v2g/src/meta/graph.py:96-99`.

Para a ativação (tudo de 24/09/2026 em diante):
`app/(protected)/ativar-campanha/page.tsx`,
`app/(protected)/ativar-campanha/[execucao]/page.tsx`,
`lib/backend/ativacao.ts`, `lib/campanha/ativacao.ts`,
`lib/campanha/pre-voo.ts:275-284`,
`backend_v2g/src/api/rotas.py:3483-3646`,
`backend_v2g/src/meta/graph.py:154-162, 538-663, 735-742`.

**Onde está a prova do teste real:** `execucoes.aprovacoes` da execução
`aed42ce7-b1cd-49f8-9509-eb772aacb31a`, no projeto `ushccxpoxjikzqnwhgfd`
— quatro registros de 25/09, ativação e pausa, os dois com `campanha=ok`.
