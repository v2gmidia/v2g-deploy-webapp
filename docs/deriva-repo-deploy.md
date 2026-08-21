# Deriva entre repositório e deploy do backend

MEDIDO em 21/08/2026, contra `api.v2gmidia.com.br` e a org `v2gmidia` no
GitHub.

> ## SUPERADO no mesmo dia, 21/08/2026 — leia isto antes do resto
>
> O corpo abaixo não se reescreve, pela regra de que documento de medição
> ganha nota e não emenda. Mas a suspeita que o motivou **foi medida e
> negada**:
>
> - o repositório **existe e estava clonado nesta máquina** o tempo todo,
>   em `OneDrive/Documentos/GitHub/backend_v2g`, remote
>   `github.com/v2gmidia/backend_v2g`, HEAD `95fcaa8`
> - o `app.openapi()` gerado desse HEAD é **idêntico** ao snapshot puxado
>   do ar: 25 operações, 51 schemas, zero diferença com chaves ordenadas
> - `src/api/rotas.py:105` grava `cliente_id`, batendo com o banco
>
> **Não houve divergência, e portanto não houve edição direta no
> servidor.** O que continua válido do corpo abaixo é só o risco
> estrutural: o deploy segue sem carimbar versão, então o commit exato no
> ar continua desconhecível de fora, e o `diff` de snapshots continua
> sendo a única medida.

Documento próprio, e não uma seção, porque o problema não é de integração
com o backend — é de **não existir medida da diferença entre o que está
escrito e o que está rodando**. Isso contamina toda decisão sobre o
backend, não só as chamadas HTTP.

---

## O que foi medido

**1. O repositório é invisível.**

    gh repo view v2gmidia/backend_v2g           -> não resolve
    gh repo list v2gmidia                       -> 5 repos, nenhum é o backend
    gh search code --owner v2gmidia criar_execucao  -> 0 resultados
    gh search code --owner v2gmidia FastAPI         -> 0 resultados

A conta autenticada nesta máquina é `piligrin00`. Ou o repositório tem
outro nome, ou outro dono, ou a conta não tem acesso.

**2. O deploy não se identifica.**

    GET /saude   (200, sem token)
    {"ok":true,"ambiente":"production","nichos_carregados":11,
     "mocks":{"llm":false,"meta":false,"imagem":false,
              "pagamento":true,"db":false}}

Sem versão, sem commit, sem build id. `openapi.json` declara
`info.version: "0.1.0"`, valor estático que não muda entre deploys.
Nenhum header de resposta traz build.

**3. O deploy se move sozinho.** A §0.1 do `disparo-pipeline.md` contou
**22 rotas em 19/08/2026**. Em 21/08 são **24**. Duas rotas novas em dois
dias, sem anúncio e sem forma de saber quais.

---

## Por que isto é mais grave do que "o repo está atrasado"

"O repositório está atrás do deploy" seria uma afirmação **mensurável e
consertável**: bastaria comparar e commitar a diferença.

O que existe é pior: **não se sabe se o repositório está atrás, à frente
ou idêntico.** Não há como comparar em nenhuma direção. As duas pontas da
medida faltam ao mesmo tempo — o repo não abre, e o deploy não diz de
onde veio.

**A consequência prática, e é ela que custa caro:** qualquer conserto no
backend feito a partir da leitura do repositório pode reverter código que
está rodando e que ninguém sabe que existe. Um deploy a partir de um repo
desatualizado apaga silenciosamente as rotas que apareceram entre 19 e 21
de agosto — e como o deploy não carimba versão, nem o "antes" nem o
"depois" ficam registrados.

---

## O que fazer, na ordem

**Passo 1 — o painel do Easypanel provavelmente já responde.**
Projeto `ia`, serviço `backend`:

- aba **Source**: mostra o provedor, o repositório e o branch de origem.
  Se for um repo Git, **este é o nome real do repositório** — e resolve
  também o achado 1, porque o nome pode não ser `v2gmidia/backend_v2g`.
- aba **Deployments**: cada deploy traz o commit e a data. O último
  bem-sucedido é o que está no ar.

Se a origem for um repo Git, a pergunta "qual commit está rodando" tem
resposta imediata, e o resto deste documento vira precaução e não
resgate.

**Passo 2 — extrair o código que está rodando.** Se a origem for imagem
pronta, ou se houver suspeita de edição dentro do container:

- pelo terminal do serviço no próprio Easypanel: localizar o diretório da
  aplicação (`/app` é o padrão) e conferir o que existe.
- por SSH na VPS Hostinger:

      docker ps                                   # achar o container
      docker cp <container>:/app ./backend-em-producao

Copiar não altera o container e não derruba o serviço.

**Passo 3 — o teste de deriva que não exige ler código.** Subir o
repositório localmente, chamar `GET /openapi.json` e comparar com o
snapshot datado em `docs/openapi/`:

    diff <(jq -S . repo-openapi.json) <(jq -S . docs/openapi/2026-08-21.json)

Diferença vazia significa que a **superfície** do repo é a mesma do
deploy. Não prova implementação idêntica — só contrato idêntico. Mas
diferença não-vazia nomeia exatamente o que falta, sem ninguém ler
arquivo nenhum.

**Passo 4 — antes de qualquer patch no backend:** commitar o código
extraído como linha de base, num branch próprio. Patch aplicado sobre
base desconhecida é o risco descrito acima; sobre base commitada, é
`diff`.

---

## O conserto permanente

Fazer o deploy carimbar a própria versão, e expor no `/saude`:

    {"ok": true, "ambiente": "production", "versao": "<git sha>", ...}

Basta uma variável de ambiente com o SHA, preenchida no build do
Easypanel, lida pelo handler do `/saude`. Enquanto isso não existir, a
única medida de deriva disponível é o `diff` entre snapshots datados de
`/openapi.json` — que por isso passam a ser gerados a cada lote, em
`docs/openapi/`.

---

## Registro do padrão

Este é o quarto caso catalogado de documento ou repositório descrevendo
um sistema diferente do que está rodando. Os outros três estão em
`arquitetura.md` e no `CONTRATO.md` do n8n. O traço comum não é descuido:
é que **nenhum dos dois lados carimba identidade**, então a divergência
não tem como ser notada — só descoberta, tarde, por acidente.


---

## Padrão — inacessível por uma via não é inacessível

Registrado em 21/08/2026, do erro cometido neste próprio documento.

**O que aconteceu:** concluí que o repositório do backend era invisível
porque o `gh` não o resolvia. O `gh` desta máquina está autenticado como
`piligrin00`, que não tem acesso ao repo privado. O GitHub Desktop, com
outra identidade, tinha — e o clone estava no disco o tempo todo.

Sobre essa conclusão errada foi construída uma hipótese de edição direta
no servidor, que consumiu uma rodada inteira e não tinha lastro nenhum.

**A regra que faltou:**

> Resultado negativo de **uma** ferramenta com **uma** identidade não é
> prova de que não existe acesso. Antes de concluir "inacessível", tentar
> as outras vias: clone local em disco, outra conta, e a aba **Source** do
> painel de deploy — que nomeia o repositório de origem.

**E o corolário, que apareceu duas vezes no mesmo dia:** caminho citado de
memória erra. `docs/n8n/CONTRATO.md` era `n8n/CONTRATO.md`;
`v2g-deploy/backend` era `OneDrive/Documentos/GitHub/backend_v2g`. Buscar
por conteúdo acha; confiar no caminho lembrado, não.

**A inversão que isto sugere para a próxima vez:** antes de supor
divergência entre origem e produção, verificar se a origem está mesmo
inacessível. Divergência suposta custou uma rodada; a verificação teria
custado um `find`.
