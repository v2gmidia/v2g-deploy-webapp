# Superfície do token — o lado do webapp

Espelho do `docs/superficie-do-token.md` do backend, para o outro lado da
conversa. **Este documento é só o mapa.** Nada aqui foi consertado, e
nenhuma linha dele propõe conserto — a frente fica aberta para depois de
10/09/2026, por decisão do Victor.

Medido em 03/09/2026. A §3.2 foi recontada depois, com a §5 corrigida
junto — ver o aviso lá.

---

## 0. Comece por aqui: o que este documento responde

O backend mediu que o `X-V2G-Token` é **único e compartilhado**, sem
identidade nenhuma dentro dele, e que ele conecta com `service_role` — que
ignora RLS. Portanto **qualquer portador do token lê e escreve o negócio de
qualquer cliente.**

A pergunta imediata era se esse token vaza para o navegador. **Não vaza**,
e a medição está na §1.

A pergunta que sobra é a que importa mais, e é a deste documento: se o
servidor do Next carrega uma chave-mestra, **o que impede a tela do cliente
A de pedir o dado do cliente B?** A resposta é: o `profile_id` sempre nasce
da sessão, nunca da URL. Isso é verdade hoje em 100% dos caminhos — e é
**disciplina de código, não invariante do sistema**. Nada no build, no
tipo ou no banco recusaria um caminho novo que fizesse diferente.

---

## 1. O token não sai do servidor do Next

Três medições, cada uma cobrindo o furo da anterior.

**Nos bundles que o navegador baixa** (29 arquivos de `.next/static`,
build de produção):

```
CONTROLE  frase de componente de cliente     ENCONTRADO
ALVO      X-V2G-Token                        ausente
ALVO      V2G_BACKEND_TOKEN                  ausente
ALVO      o valor do token                   ausente
ALVO      api.v2gmidia.com.br                ausente
```

O controle é o que dá valor ao resto: o grep acha texto de componente de
cliente, então ele alcança o lugar certo. E as duas agulhas de token
**aparecem em 5 chunks de `.next/server`** — existem, e só do lado de lá.

**A barreira, quebrada de propósito.** Um `import { consolidadoDoNegocio }`
dentro de `PerguntaDoDia.tsx` (`"use client"`) faz o build morrer com 16
erros de `server-only`. Os 8 arquivos de `lib/backend/` têm
`import "server-only"` nas três primeiras linhas. Não é convenção: o build
recusa.

**O grafo.** Dos 18 componentes `"use client"` do repositório, 5 alcançam
`lib/backend` no fecho transitivo — e **todos os caminhos atravessam uma
Server Action**, que o Next troca por referência RPC. O corpo nunca entra
no bundle.

Quem lê `process.env.V2G_BACKEND_TOKEN` é **um lugar só**:
`lib/backend/cliente.ts:63`. O único uso é o header em `:126`. Ele não vira
prop, não entra em payload RSC, não é retorno de action — não há caminho
para ele virar dado.

---

## 2. Onde o `profile_id` nasce

**Sempre em `supabase.auth.getUser()`**, lido do cookie de sessão pelo
cliente `@supabase/ssr`. 31 ocorrências, todas em contexto de servidor:
pages (RSC), Server Actions, route handlers e três módulos de `lib/`.

De lá ele segue por dois caminhos, e só dois:

**a) vai junto para o backend, como rede contra bug nosso.** Onze pontos
mandam `profileId: user.id`:

| onde | linha |
|---|---|
| `lib/estado/cliente.ts` | `:296` `execucaoDoNegocio`, `:297` `consolidadoDoNegocio` |
| `app/(protected)/inicio/actions.ts` | `:90`, `:120`, `:239` |
| `app/(protected)/meu-negocio/actions.ts` | `:114` |
| `app/(fluxo)/verba/actions.ts` | `:143` |
| `app/(fluxo)/onboarding/actions.ts` | `:253` |
| `app/(fluxo)/onboarding/contas/actions.ts` | `:392` |

O contrato do backend é explícito sobre o que isso é: não pega chamador
malicioso — que só precisaria mandar o id certo — mas pega o **erro
provável**, um bug nosso trocando ids.

**b) vira o filtro de um `select` sob RLS**, e o `business_id` sai daí:

```ts
.from("businesses").select("id").eq("profile_id", user.id)
```

É o padrão em `/inicio`, `/meu-negocio`, `/conta`, `/verba`, `/conectar/escolher`
e `/auth/meta/iniciar`. **Nenhum `businessId` do repositório vem de fora**:
todos saem de `linha.id`, `negocio.id`, `business.id` ou `ctx.businessId`,
que descendem desse `select`.

---

## 3. Onde um id poderia nascer da query string — e o que acontece hoje

Varri `searchParams`, `params` e `formData` em todo o `app/`.

### 3.1 O que a URL carrega hoje

Nenhuma rota lê identidade da query string. O conjunto inteiro é:

| chave | onde | o que é |
|---|---|---|
| `erro` | `/conectar`, `/redefinir`, `/revisar-perfil/[proposta]` | rótulo de mensagem |
| `next` | `/entrar`, `/auth/confirmar` | destino do redirect |
| `token_hash`, `token`, `code`, `type` | `/auth/confirmar` | credencial do Supabase |
| `state`, `code`, `error` | `/auth/meta/callback` | protocolo do OAuth |

### 3.2 O único id que vem da URL

`/revisar-perfil/[proposta]` — `params.proposta`. Ele endereça dado, e
**não é escopado por dono**: `carregarProposta(propostaId)` aceita qualquer
proposta. É a única rota do app onde a autorização é por **papel** e não
por **posse**.

Isso é desenho, não descuido: é tela de operador, e operador vê todos.

**A CONTAGEM, medida em 03/09** — a pergunta era se alguma action já está
sem a checagem:

| | |
|---|---|
| actions exportadas no diretório | **3** — `decidirAction`, `reabrirAction`, `aplicarAction` |
| que chamam `operadorOuErro()` | **3** |
| sem a checagem | **0** |

Nas três, `operadorOuErro()` é a **primeira linha do corpo**, antes de
qualquer leitura de `formData`. Não há lacuna hoje.

**E são três camadas, não uma.** Isto corrige o que a primeira versão
deste documento dizia — que o portão era a checagem repetida à mão:

1. **`proxy.ts`**, `OPERADOR_PREFIXES = ["/saude-meta", "/revisar-perfil"]`.
   Roda no prefixo inteiro, antes de qualquer código de rota. Server Action
   faz `POST` para a URL da própria página, então a chamada das três passa
   por aqui;
2. **a página**, `papel !== "operador" → notFound()`, nas duas
   (`/revisar-perfil` e `/revisar-perfil/[proposta]`);
3. **cada action**, `operadorOuErro()`.

**O risco residual, então, é mais estreito do que "esquecer a linha".** Uma
action nova sem a checagem continua atrás do `proxy.ts` — enquanto for
invocada de dentro de `/revisar-perfil`. O que a tiraria de lá é ela ser
importada por uma página de outra rota: o `POST` iria para a URL daquela
página, fora do prefixo, e a camada 1 não rodaria. Hoje isso não acontece —
as três são importadas **só** por `[proposta]/page.tsx`, medido.

São, portanto, **duas linhas que alguém não escreveria**, e não uma: a
checagem ausente E a importação de fora do prefixo. Continua sendo o
candidato número um da frente, por um motivo que não mudou — nada acusa
nenhuma das duas. Não há conferidor que ligue "action de operador" a
"prefixo protegido", e o `pnpm conferir` passaria limpo nos dois casos.

### 3.3 Um id que vem do cliente por cookie — e é reconferido

`/auth/meta/callback` lê `businessId` de um cookie que nós assinamos, e
**não confia nele**:

```ts
.from("businesses").select("id").eq("id", guardado.businessId).maybeSingle()
```

O cliente é o da sessão, então a RLS decide: se o negócio não for do
usuário, volta vazio e a rota recusa. É o modelo certo, e vale como
referência do que fazer quando um id precisar atravessar um redirect.

### 3.4 Ids de formulário que endereçam linha

Server Actions que recebem id do cliente e o usam para achar dado:

| ação | id recebido | como é escopado |
|---|---|---|
| `removerImagemAction` | `id` da imagem | `arquivarImagem(businessId, imagemId)`, com `businessId` de `negocioDaSessao()` |
| `decidirAction`, `reabrirAction`, `aplicarAction` | `propostaId`, `itemId` | só o papel de operador — ver §3.2 |
| `salvarRespostaAction` | `qid` da pergunta | não endereça linha de outro cliente; é chave de catálogo |
| `salvarContaAction` | `conta`, `escolha` | idem |

O caso de `arquivarImagem` é o arquétipo do que este documento chama de
disciplina. Ele usa o **cliente admin**, que ignora RLS, e o que separa a
imagem de um cliente da de outro é uma linha de filtro:

```ts
.eq("business_id", businessId)   // sem isto, um id de outro negócio
.eq("id", imagemId)              // arquivaria a imagem alheia
```

O comentário no código já diz isso. **Tirar aquela linha não quebra teste
nenhum, não quebra o typecheck, e não quebra o build.**

---

## 4. Onde a RLS está desligada — o mapa de `service_role`

`pnpm conferir:admin` responde isso e é atualizado por ele, não por este
documento. Em 03/09: **19 pontos de entrada, 14 chamadas diretas e 21
dependências indiretas.**

O que importa para esta frente é que **dentro de um caminho admin a RLS não
existe**, e a única coisa entre o cliente A e o dado do cliente B é o filtro
escrito à mão — como na §3.4. Os pontos de entrada em que isso acontece:

```
server action  app/(protected)/conta/identidade-actions.ts   via lib/identidade/armazenar.ts
server action  app/(protected)/conta/actions.ts              via lib/cadastro/procedencia.ts
server action  app/(protected)/meu-negocio/actions.ts        via lib/pipeline/disparar.ts
server action  app/(protected)/revisar-perfil/[proposta]/actions.ts  via lib/agentes/revisao.ts
route          app/auth/meta/callback/route.ts               direto
page           /inicio, /anuncios, /meu-negocio, /conta, /revisar-perfil, /saude-meta
```

---

## 5. O resumo em três linhas

1. **O token não chega ao navegador.** Provado por grep com controle, pelo
   build recusando a violação, e pelo grafo de imports.
2. **O `profile_id` nasce sempre da sessão.** Nenhuma rota o lê da URL, e
   nenhum `business_id` vem de fora.
3. **Isso é hábito, não trava.** Um handler novo que aceitasse
   `?business_id=` e chamasse o backend funcionaria, passaria no
   `pnpm conferir`, passaria no build — e leria o negócio de qualquer
   cliente. É o que a frente depois do dia 10 tem que resolver.

**CORREÇÃO, mesma data.** A primeira versão desta seção dizia que a rota de
operador era guardada por uma checagem "repetida à mão em cada action", e
que esquecê-la abriria tudo. **A contagem mostrou o contrário:** 3 actions,
3 com a checagem, e `proxy.ts` guardando o prefixo inteiro por baixo. O
buraco existe, mas exige DUAS omissões, não uma — ver §3.2. A frase antiga
teria feito priorizar por um risco maior do que o medido.
