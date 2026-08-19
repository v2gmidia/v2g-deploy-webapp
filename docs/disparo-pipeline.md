# Disparo do pipeline — desenho

**Lote E implementado e verificado em 19/08/2026, os nove passos da §11.**

**O disparo funciona: a execução nasce, ligada ao negócio, uma só. O
pipeline não anda** — o n8n não reagiu em 8,7 minutos de observação, e
isso virou bloqueio com dono fora desta máquina. Medições na §13,
pergunta ao Gabriel na §12.

> ## O LOTE SEGUINTE É A `/processando`
>
> Registrado aqui e não numa lista à parte, porque a razão de ele ser o
> seguinte nasceu **deste** lote.
>
> A tela lê `analysis_runs`, que tem zero linhas e que ninguém escreve
> (§3). Isso era dívida enquanto o front não disparava nada: uma tela
> muda sobre um pipeline que também estava mudo.
>
> **Deixou de ser dívida no momento em que o front passou a disparar.**
> Agora a execução nasce em `execucoes` e a tela do cliente continua
> dizendo que não há nada sendo montado — e isso é contradição, não
> silêncio. Vai aparecer no primeiro uso real, para o primeiro cliente.
>
> O levantamento do que o conserto enfrenta já está feito na §3.4 e não
> precisa ser redescoberto: os seis estados de `EstadoExecucao` contra os
> quatro da tela, `cadastro_completo` virando mentira, `aguardando_fotos`
> que é espera dele e não nossa, e a ausência de estado de falha no enum.
> O quinto ponto veio depois, da auditoria: a leitura do cliente não pode
> ser `select *` (`auditoria-resultados.md` §4).
>
> **Trocar só o `.from()` foi considerado e recusado**: trocaria tela muda
> por tela errada em quatro estados.

O cliente termina o onboarding e a execução nasce no backend. É a primeira
escrita do webapp na FastAPI — até hoje `lib/backend/` só tem `GET`.

Medido em 19/08/2026 contra `https://api.v2gmidia.com.br` e contra o
`V2G-SITE` (`ushccxpoxjikzqnwhgfd`). O que está na §0 e na §3 foi chamado
ou consultado; o resto é proposta.

As cinco decisões da §10 foram fechadas em 19/08/2026 e já estão aplicadas
ao corpo do documento.

Complementa [`backend-integracao.md`](./backend-integracao.md) (o cliente
HTTP e a regra do token), [`onboarding-expandido.md`](./onboarding-expandido.md)
(`montarCadastro`), [`publicar-campanha.md`](./publicar-campanha.md) (a
idempotência de três camadas) e [`n8n-repontamento.md`](./n8n-repontamento.md)
(quem escreve o quê).

---

## 0. O que foi medido hoje — e três coisas que envelheceram

Ordem do `backend-integracao.md` §0: ler o `/openapi.json`, chamar de
verdade, olhar o corpo cru, só então escrever o tipo. Foi essa a ordem.

### 0.1 São 22 rotas, não 21 — e `/campanhas/pre-requisitos` EXISTE

`GET /openapi.json` responde 200 sem token, 46.198 bytes. A rota que a
§6.0 do `backend-integracao.md` declara ausente está lá, e responde:

```
GET /campanhas/pre-requisitos          + token válido    → 200
{"tem_whatsapp":false,
 "bloqueios":["conta act_2818009911919726 sem forma de pagamento
   cadastrada: a Meta recusa criar anuncio sem cartao, mesmo pausado…",
  "o App da Meta esta em modo Desenvolvimento, e nesse modo a Meta recusa
   criar anuncio — mesmo na conta de teste…"],
 "avisos":[], "ok":false}
```

Os dois controles negativos, para o 200 significar alguma coisa:

```
GET /campanhas/pre-requisitos          + token inválido  → 401
   {"detail":"cabecalho X-V2G-Token ausente ou invalido"}
GET /rota-que-nao-existe-mesmo         + token válido    → 404
   {"detail":"Not Found"}
```

Ou seja: o 404 aparece quando a rota falta, e não apareceu aqui. O deploy
alcançou o handoff.

**Consequência:** `lib/backend/pre-requisitos.ts` deixa de ser código
guardado e passa a funcionar. O aviso no `index.ts` e a §6.0 do
`backend-integracao.md` estão errados a partir de hoje. Corrigir é parte
deste lote — **mas o texto da medição antiga não se reescreve**, ganha uma
nota de que foi superado, pela regra de que documento de medição não se
atualiza.

### 0.2 `Prevoo.tem_whatsapp` NÃO é anulável — a armadilha voltou

O schema publicado:

```json
"tem_whatsapp": { "type": "boolean", "default": false }
```

Sem `anyOf` com `null`. O backend sempre manda um booleano. Nosso
validador faz `typeof o.tem_whatsapp === "boolean" ? … : null`, então o
`null` que existe para significar "não sei" **nunca vai acontecer** contra
este backend: todo cliente sem informação vira `false`.

É exatamente o bug do `oauth-meta.md` §2.1, um nível abaixo. O tipo do
nosso lado está certo; a fonte é que perdeu o terceiro estado.

Não conserto isto neste lote — não é o assunto dele, e mexer no `Prevoo`
é do lado do Gabriel. Vai para ele agora (D5), e está na §12.

### 0.3 `POST /cadastro` — os seis obrigatórios batem, e `cliente_id` é lido

Controle negativo, corpo vazio (não cria nada):

```
POST /cadastro  {}  → 422
missing: descricao_livre, nome_negocio, ticket_medio,
         custo_direto_medio, lucro_desejado_por_cliente,
         orcamento_mensal_disponivel
```

Seis, os mesmos seis de `montarCadastro`. O `conferir:cadastro` já
garante isso contra o schema baixado na hora; a chamada confirma que o
schema publicado é o que roda.

Segundo controle negativo, com os seis válidos e `cliente_id` sujo:

```
POST /cadastro  {…seis ok…, "cliente_id":"isto-nao-e-uuid"} → 422
{"type":"uuid_parsing","loc":["body","cliente_id"],
 "msg":"Input should be a valid UUID…"}
```

**Isto importa mais do que parece.** O 422 prova que `cliente_id` é
realmente lido e validado, não um campo morto no schema. É o único
identificador NOSSO que cabe na ida da requisição. Ver §4.2.

A resposta, quando dá certo, é `RespostaCadastro` — quatro campos:

```
id_execucao (uuid)  status (EstadoExecucao)
deve_varrer_site (bool)  site_url (str|null)
```

### 0.4 O estado do banco compartilhado

```sql
execucoes            4 linhas   business_id preenchido: 0   cliente_id: 0
analysis_runs        0 linhas
offers               0 linhas
decisions            0 linhas
businesses           3 linhas   dados_ficticios: 1
campaigns            0 linhas
creatives            2 linhas

execucoes: criado_em mais recente     05/08/2026 23:49:37 UTC
           atualizado_em mais recente 05/08/2026 23:49:55 UTC
```

`GET /execucoes-em-revisao` devolve 3 das 4 (`estrutura_pronta` ×2,
`gerado` ×1), `cliente_id` nulo em todas.

Nada roda há quatorze dias. E `analysis_runs`, `offers` e `decisions` —
as três tabelas que o repontamento do n8n criaria — estão em zero. Ver §3.

### 0.5 `execucoes` é `default deny`

```sql
execucoes      rls_ligada = true   políticas = 0
criativos      rls_ligada = true   políticas = 0
businesses     rls_ligada = true   políticas = 4
analysis_runs  rls_ligada = true   políticas = 4
```

RLS ligada com zero políticas nega tudo exceto `service_role`. Não é
buraco — mas significa que **hoje só o cliente admin lê `execucoes`**, e
que a verificação de dono é 100% nossa, sem nenhuma rede embaixo. Ver §6.

### 0.6 A tabela tem tempo; a API não

`execucoes` tem `criado_em` e `atualizado_em` (`timestamptz`, default
`now()`), e o `RespostaExecucao` não expõe nenhum dos dois — é o que a
§6.5 do `backend-integracao.md` já registrava.

Como a gente lê a tabela direto pelo Supabase, **para nós essa limitação
não existe.** É o que torna possível detectar execução parada (§5.3).

---

## 1. O contrato: o que vamos chamar, e só

Uma rota. Uma.

| Chamada | Quando | Timeout |
|---|---|---|
| `POST /cadastro` | o cadastro fica completo | `rapido` (15s) |

**Nenhum endpoint de 600s é chamado por nós.** Os `/agentes/*` são do
n8n — o próprio `info.description` do OpenAPI diz "cada endpoint e um
agente isolado; a orquestracao e do n8n". As cinco rotas de transição
(`iniciar-pipeline-texto`, `aguardar-fotos`, `gerando-criativo`,
`estrutura-pronta`) trazem, cada uma, "Chamado pelo n8n" na descrição.
`/aprovar` é o gate do gestor, e o prompt deste lote o exclui.

Isso desmonta metade do problema antes de começar: **o tempo não é nosso
problema porque a espera não é nossa.** A §2 é sobre o que sobra.

### 1.1 O `obter()` ganha um irmão

`lib/backend/cliente.ts` diz, por escrito, o que fazer: *"Só GET por
enquanto, e de propósito… Quando houver POST, ele entra aqui com a mesma
normalização de erro, não numa função paralela que esquece metade dos
casos."*

```ts
export async function enviar(
  caminho: string,
  corpo: unknown,
  opcoes: OpcoesChamada = {},
): Promise<Resultado<unknown>>
```

Idêntico ao `obter()` em tudo que já está resolvido: `configuracao()`,
`AbortSignal.timeout`, `categoriaDaExcecao`, `categoriaDoStatus`,
`registrarErroBackend`, `cache: "no-store"`. As diferenças:

- `method: "POST"`, `Content-Type: application/json`, `JSON.stringify`.
- **201 é sucesso.** O `resposta.ok` do `fetch` já cobre 200–299, então
  não há caso especial — mas vale dizer, porque `/cadastro` responde 201
  e uma checagem `status === 200` escrita por reflexo quebraria tudo.
- O corpo do 422 **não** entra no log. O `registrarErroBackend` já
  documenta por quê: se um endpoint ecoar o que recebeu, o eco traria o
  que a gente mandou. Um 422 aqui é bug nosso de contrato, e o que se
  registra é `caminho` + `categoria`, mais o `loc` dos erros — nunca o
  `input`, que carrega o dado do cliente.

`dados_invalidos` (422) neste fluxo **nunca deveria acontecer**:
`montarCadastro` valida contra o mesmo schema e o `conferir:cadastro`
impede a cópia de envelhecer. Se acontecer, é deriva de contrato. O
tratamento reflete isso — §5.2.

### 1.2 O tipo da resposta, validado e não `as`

```ts
export interface Cadastrado {
  idExecucao: string;
  status: EstadoExecucao | { desconhecido: string };
  deveVarrerSite: boolean;
  siteUrl: string | null;
}

export type EstadoExecucao =
  | "cadastro_completo"
  | "pipeline_texto_rodando"
  | "aguardando_fotos"
  | "gerando_criativo"
  | "estrutura_pronta"
  | "gerado";
```

Validação em runtime como no `pre-requisitos.ts`, pelo mesmo motivo: um
`as` é promessa que o runtime não cumpre.

**Um valor de `status` fora dos seis não é `resposta_ilegivel`.** Se o
backend ganhar um estado novo, recusar a resposta inteira faria o disparo
falhar depois de a execução já ter nascido — o pior desfecho possível.
Guarda o `idExecucao`, aceita o status como desconhecido, e registra no
log.

---

## 2. Quem espera

### 2.1 O front não espera. Ninguém espera.

O `POST /cadastro` "abre a execucao" e devolve. Não roda agente nenhum:
`deve_varrer_site` vem na resposta justamente para que **outra pessoa**
decida varrer. Cabe em requisição de navegador com folga.

Depois disso, o pipeline é do n8n. Nós não seguramos conexão, não temos
laço de 3s contra a FastAPI, e — pela decisão da §3 — **neste lote não
temos nem tela de acompanhamento.**

O `useExecucao(id)` com polling de 3s que o `contrato-front.md` §3
rascunhou não entra. Ele foi escrito quando a FastAPI era a única fonte;
hoje `execucoes` mora no nosso Postgres, e quando houver tela ela lê o
banco, não a API. Um polling de navegador contra a FastAPI atravessaria
um Route Handler novo, com o token no meio, para buscar um dado que está
a um `select` de distância.

### 2.2 O n8n: seguimos por polling (D3)

`POST /cadastro` cria a linha em `cadastro_completo`.
`POST /execucoes/{id}/iniciar-pipeline-texto` é "chamado pelo n8n". Entre
os dois há um passo que **não está em lugar nenhum**: quem avisa o n8n.

Não achei webhook em `docs/`, não há variável de n8n no `.env.local` nem
no `.env.example`, e o fluxo do n8n não está nesta máquina.

**Decidido: seguimos pela hipótese de que o n8n faz polling em
`execucoes`** procurando `status = 'cadastro_completo'`. Se for isso, o
`POST /cadastro` já é o disparo e não falta nada.

O caso do webhook fica preparado e desligado:

```ts
// Sem V2G_N8N_WEBHOOK_URL no ambiente, não chama — mesma disciplina do
// backendConfigurado(). A resposta do Gabriel preenche uma env; não
// reabre o desenho.
const webhook = process.env.V2G_N8N_WEBHOOK_URL;
if (webhook) await avisarN8n(webhook, idExecucao);
```

**Isto continua sendo hipótese, e o passo 6 da §11 é o que a testa:** se
o status sair de `cadastro_completo` sozinho depois do primeiro disparo
real, o polling existe. Se ficar parado, é webhook, e a pergunta da §12
vira bloqueio.

### 2.3 Onde o disparo acontece

Não numa tela nova. Na primeira vez em que `montarCadastro` devolve
`completo: true`.

Isso pode acontecer em três lugares, porque as pendências são três (§5.1
do `onboarding-expandido.md`): o fim do bloco 2, a `/verba`, e a
`/revisar-perfil` do cliente. O último campo a ser preenchido é o que
dispara — e qual é ele muda por cliente.

Então o disparo **não** vive em nenhum dos três. Vive numa função só,
chamada no fim de cada ação que grava campo obrigatório:

```
salvarRespostaAction     (bloco 1 — nome e descrição)
salvarContaAction        (bloco 2 — ticket, custo, lucro)
definirVerbaAction       (/verba)
confirmarCampoAction     (/meu-negocio — o cliente confere o perfil)
salvarCampoAction        (/meu-negocio — o cliente corrige)
        ↓  todas, no fim
   dispararSeCompleto()
```

**São CINCO superfícies, não três.** O desenho dizia três e estava errado
em dois pontos, os dois achados na implementação:

- O **bloco 1** grava `name` e `description`. O caminho comum é bloco 1 →
  bloco 2 → `/verba`, e nele o cadastro nunca fecha ali — mas as perguntas
  não são obrigatoriamente respondidas em ordem. Dá para responder ramo e
  praça, ir para as contas, definir a verba e só então voltar e escrever o
  nome; aí o último dos seis entra no bloco 1.
- A revisão do cliente é **`/meu-negocio`**, não `/revisar-perfil` — esta
  última é tela de operador. E são duas ações lá, não uma: `confirmar`
  (ele diz que está certo) e `salvar` (ele corrige).

`dispararSeCompleto` é a única porta. Se o cadastro não está completo,
devolve sem fazer nada — é o caso comum, e é barato: `montarCadastro` é
puro e as colunas já estão na mão.

É o mesmo argumento do `montarCadastro` existir antes de haver escrita:
três lugares com a mesma regra copiada divergem na primeira edição.

---

## 3. DEFEITO REGISTRADO — a `/processando` nunca funcionou

**Não é consertado neste lote.** Fica registrado porque não pode ficar sem
registro, e porque ele define o que este lote *não* entrega.

### 3.1 A medição

`app/(fluxo)/processando/page.tsx` lê `analysis_runs`. Medido hoje:

```sql
select count(*) from public.analysis_runs;   →  0
select count(*) from public.offers;          →  0
select count(*) from public.decisions;       →  0
```

Zero linhas, e **ninguém escreve**. Quem escreveria é o n8n depois do
repontamento do `n8n-repontamento.md` — cujo checklist da §7 está com os
sete itens em aberto, inclusive "Avisar quando estiver rodando".

Portanto a `/processando` cai no ramo `if (!run)` e mostra "Não há nada
sendo montado agora" **para todo mundo, sempre**, inclusive para quem tem
execução rodando. Não é um caso de borda; é o comportamento único.

### 3.2 Desde quando

```
974be8d  01/08/2026  "Fecha o lote 3: campanhas, dashboard, processando
                      e conferência do /entrar"
```

`git log -S "analysis_runs"` sobre o arquivo devolve esse commit e só
esse: a tabela entrou junto com a tela e nunca foi trocada. A `/processando`
existe há 18 dias e não funcionou em nenhum deles.

`grep -rn analysis_runs app lib components` devolve **duas linhas, as duas
neste arquivo** — uma no comentário do cabeçalho, uma no `.from()`. A tela
é a única leitora da tabela em todo o webapp. Ninguém mais depende disso,
o que torna o conserto barato quando ele vier.

### 3.3 Por que passou despercebido

Porque o estado vazio é bonito e plausível. "Não há nada sendo montado
agora" com um botão "Começar agora" é exatamente o que um cliente novo
deveria ver — e como nunca houve um cliente com pipeline rodando, ninguém
viu a tela mentir. O estado vazio honesto virou o único estado, e um
estado vazio que nunca sai de vazio é indistinguível de uma tela que
funciona até alguém chegar do outro lado.

É o caso do `log vazio não prova ausência de evento`, na forma de
interface: **tela vazia não prova ausência de dado.**

### 3.4 O que ela vai precisar quando for consertada

Levantado agora, com o contexto fresco, para quem repontar não ter que
redescobrir. Os seis estados do backend contra os quatro da tela:

| `EstadoExecucao` | Tela hoje | Cobre? |
|---|---|---|
| `cadastro_completo` | — | **não** |
| `pipeline_texto_rodando` | em andamento | sim |
| `aguardando_fotos` | em andamento | sim (com ressalva) |
| `gerando_criativo` | em andamento | sim |
| `estrutura_pronta` | concluído | sim |
| `gerado` | concluído | sim (legado) |
| *(não existe)* | **falha** | **não tem fonte** |
| *(não existe)* | espera longa | derivável, ver §5.3 |

**`cadastro_completo` não é "em andamento".** É "nasceu e ninguém pegou".
Cairia no padrão seguro da tela ("na dúvida, espera"), e o cliente veria
"Estamos montando sua campanha" enquanto nada roda. Se a hipótese de
polling da §2.2 estiver errada, é o estado em que **toda** execução fica
presa — e a tela mentiria com convicção.

**`aguardando_fotos` não é espera nossa, é espera DELE.** O nome engana:
o pipeline parou porque falta o cliente mandar foto (`POST
/execucoes/{id}/fotos`). Mostrar "pode fechar o app, a gente te avisa"
nesse estado é dizer para esperar a si mesmo. Mesma disciplina do
`nao_sei` do `pendencias.ts`: nunca esconder de quem é a vez.

**Não existe estado de falha no enum.** `EstadoExecucao` tem seis valores
e nenhum é `falhou`. O backend não tem como dizer que quebrou — ele para
de atualizar. O estado de falha da tela (que o protótipo não tinha, e que
foi acrescentado com razão) fica sem fonte, e só a §5.3 o produz.

### 3.5 O que este lote entrega sem ela — dito na cara

Com a `/processando` fora de escopo, **o cliente não vê nada acontecer.**
Ele responde o último campo, a execução nasce no backend, e a tela dele
continua dizendo que não há nada sendo montado.

O lote entrega a escrita, não o acompanhamento. Quem enxerga o resultado
é o operador, pela `/saude-meta` (§5.4). Isso é uma escolha, não um
esquecimento — mas é a razão de este lote **não fechar sozinho a promessa
"o cliente termina o onboarding e a execução nasce"** do lado do cliente:
ela nasce, e ele não fica sabendo.

Consertar a `/processando` é o lote seguinte natural, e o pré-requisito
dele é o passo 1 da §11.

---

## 4. Idempotência — o padrão do `publicar.ts`, e onde ele não serve

As três camadas do `publicar.ts`, uma a uma.

### 4.1 Camada 1 — estado persistido. **Serve, e é a principal.**

Lá: `campaigns.publish_state` + `publish_key` + `publish_started_at`.
Aqui: três colunas novas em `businesses` (migration 0018).

```sql
alter table public.businesses
  add column cadastro_estado text
    check (cadastro_estado in ('enviando','enviado','falhou')),
  add column cadastro_iniciado_em timestamptz,
  add column cadastro_erro text;
```

Ficam em `businesses` e não em `execucoes` porque a linha de `businesses`
existe **antes** da chamada, e a de `execucoes` só depois. Guardar a
trava na linha que ainda não existe é o mesmo que não ter trava.

`cadastro_estado = 'enviado'` faz `dispararSeCompleto` sair na hora.
Cobre o clique duplo, a Server Action chamada duas vezes, o cliente que
volta para a `/verba` e salva de novo.

### 4.2 Camada 2 — a marca vai na ida (D1)

No `publicar.ts` essa camada é frágil por escrito: procura pelo nome no
Gerenciador de Anúncios, e falha se alguém renomear. Aqui não há esse
problema, porque a "busca remota" é um `select` no nosso próprio banco.

O que ela pega: **a resposta perdida.** A chamada saiu, o backend criou a
linha, e o `fetch` estourou o timeout antes do corpo voltar. Sem esta
camada, a retomada cria uma segunda execução para o mesmo negócio.

**E aqui estava o furo.** Quem escreve `execucoes.business_id` somos nós,
**depois** da resposta. Se a resposta se perdeu, `business_id` está nulo —
e a busca não acha nada. A camada existiria sem pegar o caso que ela
existe para pegar.

O `publicar.ts` não tem esse furo porque a marca dele vai na **ida**
(`name: "… [v2g:ab12cd34]"`). A nossa vai na ida também:

```ts
// no corpo do POST /cadastro
cliente_id: negocio.id
```

```sql
-- a busca da camada 2
select id from public.execucoes
 where business_id = $1 or cliente_id = $1
 limit 1;
```

`cliente_id` é o único campo nosso que cabe na requisição, e a §0.3 mediu
que ele é lido e validado como UUID — não é campo morto no schema.

> ### A decisão do `perfil-empresa.md` §4 foi REVISTA
>
> Aquele documento decidiu **deixar o `cliente_id` morrer** — não
> repovoar, não apontar para `businesses` — com o argumento de que
> *"manter dois campos de dono convida metade do código a usar um e
> metade o outro"*.
>
> O argumento continua bom. **O motivo da revisão é outro, e é o que ele
> não previu:** `business_id` só pode ser escrito depois da resposta, e a
> resposta é exatamente o que se perde num timeout. Sem uma marca na ida,
> a execução órfã é indistinguível de execução que nunca nasceu — e a
> retomada duplica.
>
> A regra que preserva a intenção da §4:
>
> **`business_id` é o vínculo. `cliente_id` é o eco do que a gente
> mandou.** Nenhuma consulta de produto lê `cliente_id`. Só a
> reconciliação da §5.2 lê, e ela existe justamente para escrever
> `business_id`. Os dois carregam o mesmo valor; o segundo é marca de
> ida, não um segundo dono.
>
> Isto entra como nota de revisão no `perfil-empresa.md` §4 e como
> Decisão 12 na `arquitetura.md`.

As alternativas que foram descartadas, para o registro:

- **reconciliar por nome + janela de tempo** (`execucoes.nome_negocio` +
  `criado_em` recente). Frágil: dois negócios de mesmo nome no mesmo
  minuto casam errado, e `"Meu negócio"` é literalmente o nome provisório
  de todo mundo (`NOME_PROVISORIO`).
- **aceitar o órfão.** O cliente vê o pipeline rodar duas vezes e a gente
  limpa à mão. Custa token de LLM e imagem em duplicidade.

### 4.3 Camada 3 — trava de concorrência. **Serve, com número menor.**

`cadastro_estado = 'enviando'` + `cadastro_iniciado_em`. Se outra
chamada chega enquanto isso, sai sem fazer nada.

O `publicar.ts` destrava em 10 minutos. Aqui o teto é o timeout da
chamada (15s), então **2 minutos** já é folga larga. Dez minutos deixaria
o cliente travado por causa de um processo que morreu em quinze segundos.

Passados os 2 minutos, retomar é seguro **porque a camada 2 existe** — é
ela que impede a retomada de duplicar. As três, não a que for mais
conveniente.

### 4.4 O que o `publicar.ts` tem e aqui não faz sentido

**O ensaio a seco (`validate_only`).** Não existe equivalente no
`/cadastro`. O mais próximo é `montarCadastro`, que já roda antes e é
mais barato — responde a mesma pergunta ("isto passa?") sem sair da
máquina.

**Não apagar em caso de falha.** No Meta, o objeto órfão está pausado e
não gasta. Aqui o órfão é uma linha de `execucoes` que o n8n pode pegar e
rodar — ou seja, **pode custar dinheiro**. A invariante muda de forma: não
apagamos (não temos rota de DELETE, e não vamos mexer no backend), mas a
reconciliação da §5.2 tem que rodar, e a §7.3 impede que negócio de teste
chegue até aqui.

---

## 5. Falha no meio

### 5.1 A chamada falha e nada foi criado

`rede`, `certificado`, `servidor` (5xx), `indisponivel`.

`cadastro_estado = 'falhou'`, `cadastro_erro` com a mensagem já em
português do `lib/backend/erros.ts`.

**O cliente não vê nada disso neste lote** — a `/processando` está fora
de escopo (§3.5). A falha fica no banco e na `/saude-meta`. Dizer o
contrário seria inventar uma superfície que não existe.

Retomada: a próxima gravação de campo chama `dispararSeCompleto` de novo,
e `'falhou'` não bloqueia (só `'enviando'` e `'enviado'` bloqueiam). Sem
laço automático de retry: uma chamada que cria recurso não se repete
sozinha.

### 5.2 A chamada estoura o tempo e a linha PODE ter nascido

`tempo_esgotado`. É o caso interessante, e o que a mensagem do
`erros.ts` já trata certo: *"o trabalho pode continuar rodando"*.

Não marca `'falhou'`. Marca `'enviando'` ainda, e agenda reconciliação:

```
1. camada 2: select por business_id OU cliente_id
2. achou  → escreve business_id, marca 'enviado', segue a vida
3. não achou e passaram os 2 minutos → 'falhou', pode disparar de novo
```

Onde a reconciliação roda: na própria `dispararSeCompleto`, antes de
qualquer coisa. Sem cron, sem fila — a próxima gravação de campo a
executa. Se o cliente sumir, a execução órfã fica, e a §5.4 é quem a vê.

**Caso separado, e barulhento: 422.** `dados_invalidos` aqui significa
que `montarCadastro` e o schema divergiram — o `conferir:cadastro` deixou
passar, ou o backend mudou entre o `pnpm conferir` e a chamada. Não é
erro do cliente e ele não tem o que fazer. `console.error` com os `loc`
do detalhe (nunca o `input`), `cadastro_estado = 'falhou'`, mensagem
genérica. O que **não** pode acontecer é virar "revise o que você
preencheu": ele preencheu certo.

### 5.3 A execução nasce e para no meio — o silêncio, medido

Não há status de falha (§3.4), então a única evidência é `atualizado_em`
parar de andar. Como a coluna existe na tabela (§0.6), dá para medir.

**Os dois cortes são configuráveis, e são chute (D4).**

```ts
/**
 * ATENÇÃO: 20 e 90 SÃO CHUTE. NINGUÉM MEDIU a duração real de um
 * pipeline — a base tem 4 execuções, todas de 05/08/2026, nenhuma
 * acompanhada do começo ao fim com relógio.
 *
 * Estão aqui como env para poderem ser corrigidos sem deploy no dia em
 * que alguém medir. Quando a medição existir, ela vira um documento
 * próprio e ESTES NÚMEROS mudam — este comentário não some antes disso.
 */
export const MINUTOS_ATE_DEMORANDO =
  Number(process.env.V2G_MIN_ATE_DEMORANDO ?? 20);
export const MINUTOS_ATE_PARADA =
  Number(process.env.V2G_MIN_ATE_PARADA ?? 90);
```

Contados desde `atualizado_em`, **não** desde `criado_em`. A tela de hoje
usa 30 minutos desde `created_at`, o que é pior: um pipeline que avançou
aos 29 minutos parece travado aos 31.

**`aguardando_fotos` fica de fora dos dois cortes.** Ele não está parado,
está esperando o cliente. Um relógio correndo ali acusaria a gente de uma
falha que é pendência dele.

### 5.4 Quem vê — só o operador, neste lote

A `/saude-meta` ganha um bloco: execuções paradas (pelos cortes acima) e
execuções órfãs (`business_id` e `cliente_id` os dois nulos). É onde o
operador já olha, é linguagem interna, e não custa tela nova.

Sem alerta automático, sem e-mail. Um bloco numa tela que alguém abre é
honesto sobre o que é: depende de alguém abrir.

**O cliente não é avisado de nada neste lote.** A `/processando` promete
WhatsApp e ninguém cumpre a promessa hoje; não vou aumentá-la. A
notificação por evento real é o lote F.

---

## 6. Segurança — a ordem, e como fazer o `if` não ser esquecível

A regra do `backend-integracao.md` §1: sessão → dono do recurso → token.
Um `if` esquecido vaza dado sem aviso do outro lado.

**A proposta é não ter o `if`.**

### 6.1 Nada de identificador vindo do cliente

`dispararSeCompleto` **não recebe `businessId` de formulário, de URL, nem
de campo escondido.** Ela descobre sozinha, como `pendenciasDoCliente()`
já faz:

```ts
const supabase = await createClient();          // cliente NORMAL, sob RLS
const { data: { user } } = await supabase.auth.getUser();
if (!user) return;
const { data: negocio } = await supabase
  .from("businesses").select(COLUNAS_DO_CADASTRO)
  .eq("profile_id", user.id)                    // ← e a RLS confere de novo
  .order("created_at").limit(1).maybeSingle();
```

Não existe `businessId` alheio a ser passado, porque não existe parâmetro
para passá-lo. O passo 2 da ordem não é um `if` que alguém pode esquecer;
é a ausência de um caminho. Server Action é endpoint POST, e um POST
forjado aqui não tem o que forjar.

O cliente `admin` (`service_role`) entra **só** depois, e só para escrever
`execucoes.business_id` com um id que já veio do `select` acima.

### 6.2 `execucoes` continua só no `service_role` (D2)

Cheguei a propor dar política de `SELECT` à `execucoes`
(`using (private.owns_business(business_id))`) para tornar a leitura
segura por construção. **Decidido: não neste lote.**

O motivo é bom e vale registrar: `execucoes.resultados` é jsonb de saída
de agente, e **ninguém auditou o que tem lá dentro**. Se algum agente
grava prompt, custo, nota interna ou raciocínio, abrir `SELECT` entrega
isso ao cliente dono — e um `SELECT` aberto não se fecha depois sem
alguém já ter lido. Abrir sem saber o que tem dentro é como vaza dado
interno.

A 0018 fica sem política nenhuma. `execucoes` continua `default deny`.

**E neste lote a pergunta nem chega a ser exercida:** com a `/processando`
fora de escopo (§3), *nada voltado ao cliente lê `execucoes`*. As duas
únicas leituras são a `/saude-meta` (operador, `service_role`) e a
reconciliação da §5.2 (servidor, `service_role`). A decisão vale como
regra para quem repontar a tela depois — e o passo 1 da §11 é a auditoria
que destrava a pergunta.

Quando a leitura de cliente existir, a regra é: ou a política de `SELECT`
(depois da auditoria), ou uma função de servidor que recebe o
`business_id` **já vindo de um `select` sob RLS**, nunca de parâmetro.

### 6.3 O token não muda de lugar

`lib/backend/` inteiro tem `import "server-only"`. `enviar()` entra no
mesmo arquivo, com a mesma primeira linha. `dispararSeCompleto` é
`server-only` e é chamada de Server Actions. Nenhum Route Handler novo,
nenhum `NEXT_PUBLIC_`, nenhuma peça nova por onde o token pudesse
escapar.

O `id_execucao` não sai do servidor. Nenhum componente de cliente o
recebe, porque nenhum precisa dele.

---

## 7. A ligação `businesses` ↔ `execucoes`

### 7.1 A coluna já existe

`execucoes.business_id uuid references businesses(id) on delete set null`,
mais o índice, aplicados na 0010 (`perfil-empresa.md` §4, Fase 1).
Preenchido em 0 de 4 linhas. Este lote é quem passa a preenchê-lo.

### 7.2 Quem escreve o quê — a regra, que vira a Decisão 12

| Coluna | Quem escreve | Quando |
|---|---|---|
| `execucoes.*` (tudo, menos abaixo) | backend / n8n | durante o pipeline |
| `execucoes.business_id` | **webapp**, `service_role` | logo após o `POST /cadastro` |
| `execucoes.cliente_id` | backend, com o que mandamos | no `POST /cadastro` |
| `businesses.*` | webapp | onboarding, perfil, `/conta` |
| `businesses.cadastro_*` | webapp | disparo |

`business_id` é a única coluna de `execucoes` que a gente escreve.
`cliente_id` a gente **manda** e não escreve — quem escreve é o backend,
com o valor que mandamos. A distinção não é preciosismo: é o que impede
alguém de "corrigir" `cliente_id` depois e criar o segundo dono que o
`perfil-empresa.md` §4 temia.

### 7.3 `dados_ficticios` — a trava vem antes de tudo

Medido: 1 dos 3 negócios está marcado. O `publicar.ts` já estabeleceu
onde a checagem fica e por quê — antes do token, antes de marcar estado,
porque a resposta não depende de nada remoto e um estado "enviando" que
ninguém encerra é pior que a chamada economizada.

Mesma coisa aqui, e mais cedo ainda: **antes do `POST /cadastro`**, não
depois. Uma execução de negócio fictício que nasce já pode ser pega pelo
n8n e virar token de LLM e imagem gerada — e, se o polling da §2.2 valer,
vira **na hora**, sem ninguém aprovar nada. Publicação é o segundo
portão; este é o primeiro.

O motivo fica no log e na `/saude-meta`, que é onde ele interessa.

### 7.4 O que a ligação destrava, e o que ela não destrava

Destrava: o bloco de execuções paradas e órfãs da `/saude-meta`, e o nome
do negócio na fila de revisão do operador — que hoje mostra o nome da
**campanha** por falta de alternativa (`execucoes.ts`, item 1 do
cabeçalho). Com `business_id` preenchido, um `join` resolve, e o
comentário que documenta a ausência vira histórico.

Destrava também, mas **não neste lote**, a `/processando` do cliente
(§3).

Não destrava: as 4 execuções legadas. Continuam com `business_id` nulo. O
`migracao-execucoes.md` tem o SQL de ligação por nome e uma decisão sua
pendente sobre cinco delas — **não toco nisso aqui**, é outro assunto e
tem doc próprio.

---

## 8. O que muda, arquivo por arquivo

**Novo**

```
lib/backend/cadastro.ts        enviarCadastro() — POST /cadastro + validação
lib/pipeline/disparar.ts       dispararSeCompleto() — a porta única
lib/pipeline/relogios.ts       os dois cortes configuráveis da §5.3
supabase/migrations/0018_disparo_do_pipeline.sql   (só as 3 colunas; sem RLS)
```

**Alterado**

```
lib/backend/cliente.ts         + enviar() (POST), irmão do obter()
lib/backend/index.ts           + as exportações novas
                               − o aviso de que pre-requisitos não existe (§0.1)
app/(fluxo)/onboarding/contas/actions.ts   + dispararSeCompleto no fim
app/(fluxo)/verba/actions.ts               + dispararSeCompleto no fim
app/(protected)/revisar-perfil/…/actions.ts (a do cliente) + idem
app/(protected)/saude-meta/page.tsx        + bloco de paradas e órfãs
app/(fluxo)/processando/page.tsx           + SÓ um comentário de cabeçalho
                                             registrando o defeito da §3
.env.example                   + V2G_N8N_WEBHOOK_URL (comentada, desligada)
                               + V2G_MIN_ATE_DEMORANDO / V2G_MIN_ATE_PARADA
docs/backend-integracao.md     §6.0 e §6.3 ganham nota de superação
docs/perfil-empresa.md         §4 ganha a nota de revisão do cliente_id (§4.2)
docs/arquitetura.md            + Decisão 12 (a regra de escrita da §7.2)
```

**Não muda**

`lib/meta/*` inteiro. `montarCadastro` — ela já faz o que precisa, e o
payload sai dela sem uma linha nova; só o `cliente_id` é acrescentado
**fora** dela, por quem chama, porque ele não é campo de cadastro e sim
marca de transporte. `proxy.ts` — nenhuma rota nova. `globals.css` —
nenhuma cor, nenhum tamanho, nenhum componente novo.

**A lógica da `/processando` não muda.** Ela ganha um comentário e nada
mais. A tela continua quebrada, agora com o defeito escrito dentro dela —
onde quem for mexer vai ler antes de tocar.

---

## 9. O que não regride, e como se confere

| Trava | Como confere |
|---|---|
| `pnpm typecheck` | parte do `pnpm conferir` |
| `pnpm conferir:lista-branca` | a 0018 não mexe em `confirmar_campo_do_cliente`; as colunas `cadastro_*` são escritas por `service_role`, não pela RPC do cliente, então **não** entram no catálogo |
| `pnpm conferir:cadastro` | `montarCadastro` não muda; continua batendo com o schema baixado na hora |
| `PROTECTED_PREFIXES` | nenhuma rota nova sob `(protected)` — o bloco novo entra na `/saude-meta`, que já está lá e já é de operador |
| cor e tamanho de fonte | nenhum valor novo, nenhum componente novo; `DESIGN.md` roda igual |

Duas conferências que os três conferidores **não** cobrem, e que farei à
mão com evidência no fim do lote:

1. **A 0018 não mexe no acesso a `execucoes`.** Antes e depois da
   migration, o cliente `authenticated` tem que ler zero linhas de
   `execucoes` — inclusive as do próprio negócio, porque a tabela segue
   `default deny` por decisão (§6.2). Os dois lados: confirmar que o
   `service_role` lê e que o `authenticated` não.
2. **O disparo é uma vez só.** Duas chamadas concorrentes de
   `dispararSeCompleto` no mesmo negócio produzem uma linha em
   `execucoes`, não duas. Medido contando linhas antes e depois, com o
   `select` da camada 2 mostrando qual foi reaproveitada.

---

## 10. As decisões — fechadas em 19/08/2026

| | Decisão | Como ficou |
|---|---|---|
| **D1** | `cliente_id` na ida? | **Sim.** `perfil-empresa.md` §4 revisto; motivo registrado na §4.2: a resposta é o que se perde no timeout. |
| **D2** | RLS de `SELECT` em `execucoes`? | **Não.** Só `service_role`. Auditoria de `resultados` primeiro — abrir sem saber o que tem dentro é como vaza dado interno. |
| **D3** | n8n: polling ou webhook? | **Polling**, com `V2G_N8N_WEBHOOK_URL` preparada e ausente. Testado no passo 6. |
| **D4** | os relógios de 20/90 min | **Configuráveis por env**, com o comentário dizendo que são chute sem medição. |
| **D5** | `tem_whatsapp` sem `null` | **Levar ao Gabriel agora.** §12. |
| **+** | `/processando` | **Registrada como quebrada, não consertada.** §3, e a consequência na §3.5. |

---

## 11. Ordem de implementação

Na ordem em que cada passo se verifica sozinho.

1. ✔ **Auditar `execucoes.resultados`.** Feita —
   [`auditoria-resultados.md`](./auditoria-resultados.md). Achou mais do
   que se esperava: `resultados` **não é coluna** (o backend a monta de
   sete colunas jsonb), e nelas convivem texto escrito PARA o cliente
   ("você fica sem margem se a conversão cair") com raciocínio interno
   sobre ele ("descrição é curta e vaga"), estratégia de nicho
   (`brecha_explorada`) e saída de mock distinguível só por um prefixo
   `[mock]` dentro do texto. **Confirma o D2** — e mostra que a proposta
   original estava errada por outro motivo: RLS libera a linha, e o
   problema é a coluna.
2. `enviar()` em `cliente.ts`. Verifica-se sozinho: um POST para
   `/cadastro` com corpo vazio tem que devolver `dados_invalidos` e
   logar, sem criar nada. É o controle negativo da §0.3 passando pelo
   nosso cliente em vez do `curl`.
3. `lib/backend/cadastro.ts` — `enviarCadastro()` e a validação da
   resposta, com `cliente_id` no corpo.
4. Migration 0018: as três colunas `cadastro_*`. Sem política. Conferência
   1 da §9, os dois lados.
5. `lib/pipeline/disparar.ts` e `relogios.ts`. A trava de concorrência se
   verifica com a conferência 2 da §9.
6. Ligar nas três ações. **Primeiro disparo real** — um negócio de teste
   com `dados_ficticios = false`, cadastro completo, linha nascendo em
   `execucoes` com `business_id` preenchido e `cliente_id` ecoado. É aqui
   que a hipótese de polling da §2.2 é testada: se o status sair de
   `cadastro_completo` sozinho, o n8n está escutando. **Se não sair, a
   pergunta da §12 vira bloqueio e o lote para aqui.**
7. Bloco de paradas e órfãs na `/saude-meta`.
8. O comentário de defeito no cabeçalho da `/processando`.
9. Os documentos: nota de superação na §6.0 e §6.3 do
   `backend-integracao.md`, nota de revisão no `perfil-empresa.md` §4,
   Decisão 12 na `arquitetura.md`, e as envs no `.env.example`.

O passo 6 é o único que produz efeito irreversível (uma execução real que
o n8n pode consumir). Antes dele, tudo é reversível.

---

## 13. O que foi verificado, e o que falta

**Medido em 19/08/2026, depois de implementar.**

### 13.1 Os três conferidores

`pnpm conferir` verde: `typecheck`, `conferir:lista-branca` (19 campos do
catálogo, extras conhecidos, controle negativo acusando) e
`conferir:cadastro` (payload valida contra o schema baixado na hora, os
seis obrigatórios barrados um a um, valores de fronteira).

### 13.2 A 0018 não abriu acesso a `execucoes` — os dois lados

| prova | resultado |
|---|---|
| `service_role`: `SELECT execucoes` | 4 linhas (enxerga) |
| `authenticated`: `SELECT execucoes` | **0 linhas** — negado |
| `authenticated`: `INSERT execucoes` | recusado: *new row violates row-level security policy* |
| `authenticated`: `UPDATE execucoes` | 0 linhas afetadas — negado |
| `authenticated`: `SELECT businesses` | **1 linha** — controle positivo |
| `execucoes` antes / depois | 4 / 4 — o teste não criou nada |

O controle positivo é o que dá sentido ao resto: o mesmo usuário, na
mesma transação, **enxerga** `businesses`. Então o zero em `execucoes` é
negação de verdade, não um teste que não sabia achar dado nenhum.

### 13.3 A trava de concorrência — nos dois sentidos

O compare-and-set do `travar()`, com cada estado de partida:

| estado da linha | linhas afetadas | veredito |
|---|---|---|
| `null` (nunca disparou) | 1 | pegou a trava |
| `enviando` | **0** | barrada — não duplica |
| `enviado` | **0** | barrada — não redispara |
| `falhou` | 1 | pegou — retomada permitida |
| valor fora do enum | — | recusado pelo `CHECK` |

Os dois sentidos importam: uma trava que só barra seria uma trava que
nunca deixa retomar, e o cliente ficaria preso para sempre depois da
primeira falha de rede.

### 13.4 O PASSO 6 RODOU — primeiro disparo real, 19/08/2026 23:31 UTC

Negócio `V2G` (`a85c37a9`), `dados_ficticios = false`, pela quinta
superfície: o cliente clicou em "tá certo" no `/meu-negocio`, o que é
`confirmarCampoAction` → `dispararSeCompleto()`.

```
execucoes                                   4 → 5      (UMA, não duas)
execucoes.id                                98447192-3968-4fb1-8062-b14d6a8751ae
execucoes.cliente_id                        a85c37a9-…   ← PERSISTIDO
execucoes.business_id                       a85c37a9-…   ← escrito por nós
execucoes.nome_negocio                      "V2G"
execucoes.status                            cadastro_completo
businesses.cadastro_estado                  enviado
businesses.cadastro_erro                    null

cadastro_iniciado_em  23:31:49.646
execucao criada       23:31:51.303          → 1,7 s de ponta a ponta
```

Log do dev server: **zero linhas `[pipeline]`, zero `[backend:]`**. Todos
os caminhos de falha do lote gritam no log por desenho, e nenhum gritou.

**As três inferências viraram medição:**

**1. O backend PERSISTE o `cliente_id` que mandamos.** Era a suposição mais
grave do lote — a §0.3 só media que ele é *lido e validado*. Agora está
medido que é **gravado**. A camada 2 (§4.2) tem a marca de ida que ela
precisa, e a revisão da decisão do `perfil-empresa.md` §4 se sustenta pelo
motivo que a justificou.

**2. `RespostaCadastro` chega na forma esperada.** Prova indireta e
suficiente: `cadastro_estado` só vira `enviado` depois de `ligarAoNegocio`
devolver `true`, que só acontece com um `idExecucao` válido saído do
validador. Se a forma tivesse mudado, o estado teria ficado em `enviando`
ou `falhou`.

**3. Uma execução, não duas.** A conferência 2 da §9, agora no caminho
real e não só no SQL.

E um número que não era hipótese de ninguém, mas confirma o §1: **1,7
segundo.** O endpoint só abre a linha. `TIMEOUTS.rapido` (15 s) é folga
larga, não aposta.

### 13.5 O n8n NÃO reagiu — o D3 caiu

**Medição:** 24 amostras a cada 15 s, das 23:33:59 às 23:39:52 UTC, mais
uma leitura aos 8,7 minutos.

```
status         cadastro_completo   em 100% das amostras
atualizado_em  23:31:51.303028     inalterado em todas
```

O `atualizado_em` difere do `criado_em` por **7 microssegundos** — são os
dois `now()` do próprio `insert`, não uma atualização. Nada tocou a linha.

**O que isto prova, e o que não prova.** Não prova que o n8n não faz
polling: um intervalo maior que 9 minutos explicaria o mesmo resultado. O
que prova é que **a hipótese (A) da §2.2 não se sustenta como estava
escrita** — ela pressupunha que o `POST /cadastro` "já é o disparo", e por
9 minutos ele não foi.

**Consequência para o lote:** o disparo funciona e a execução nasce ligada
ao negócio, mas o pipeline **não anda**. A pergunta 1 da §12 deixa de ser
dúvida de desenho e vira **bloqueio com dono fora desta máquina**.

O código já está pronto para as duas respostas: `V2G_N8N_WEBHOOK_URL`
ausente hoje, e uma linha em `avisarN8n()` esperando a URL.

### 13.6 O que continua sem verificação

- **A reconciliação da §5.2** (resposta perdida → reencontrar pela marca).
  A camada 2 nunca precisou rodar, porque nenhuma chamada estourou o
  tempo. O `select` está exercitado só em SQL, não pelo caminho real.
- **O bloco de vigilância da `/saude-meta`** com dado de verdade. Aos 8,7
  minutos a execução ainda está abaixo do corte de 20 min, então o bloco
  mostra "nada parado" — que é o correto, e é por isso que ainda não
  prova nada. Passados 20 minutos ela aparece como `demorando`, e aos 90
  como `parada`. **É a primeira oportunidade de ver os relógios da §5.3
  com dado real**, e ela chega sozinha.

### 13.7 O que ficou registrado como buraco, não como pendência

O passo 6 não saiu 100% pela superfície real, e a razão virou documento
próprio: [`buraco-numeros-dificeis.md`](./buraco-numeros-dificeis.md).

O sexto campo (`target_profit_per_customer`) **não tinha entrada nenhuma
no produto** depois de o cliente ter respondido "não sei" no bloco 2 — nem
na `/onboarding/contas` (que fecha a conta), nem no `/meu-negocio` (que
mostra número difícil vazio sem `input`), nem na `/conta` (dissolvida).

O valor foi gravado com origem `manual` (*"alguém da V2G anotou na
conversa"*), que é o que de fato aconteceu, e só então o cliente pôde
confirmá-lo na tela. `confirmar_campo_do_cliente` preservou o rastro:
`procedencia_anterior: "manual"`.

**Só a entrada do número foi por fora. O disparo foi pela tela real.**

### 13.8 O QUE NÃO FOI VERIFICADO ANTES DO PASSO 6 — histórico

**Nenhum `POST /cadastro` de verdade foi feito.** O que existe hoje é o
controle negativo da §0.3 (corpo vazio → 422, nada criado). A cadeia
completa — payload sai de `montarCadastro`, execução nasce, `business_id`
é escrito, `cadastro_estado` vira `enviado` — **não rodou**.

Três coisas dependem dessa medição e hoje são inferência:

1. **Se o backend PERSISTE o `cliente_id` que mandamos.** Ele o *lê* e o
   *valida* (§0.3, medido). Que ele o **grave** na coluna é suposição — e
   se não gravar, a camada 2 não pega o caso da resposta perdida, que é o
   caso para o qual ela existe. É o item mais importante da lista.
2. **Se o n8n faz polling** (§2.2). Se o status sair de
   `cadastro_completo` sozinho, faz. Se ficar parado, é webhook.
3. Se `RespostaCadastro` chega com a forma que o validador espera.

**Por que parou aqui:** nenhum dos 3 negócios do banco tem cadastro
completo — `target_profit_per_customer` é nulo nos três. Rodar o passo 6
exige criar dado para isso, e o resultado é uma execução real que o n8n
pode consumir e transformar em token de LLM e de imagem. É gasto, e é a
única coisa deste lote que não desfaz.

---

## 12. O que vai para o Gabriel

Duas perguntas, as duas com medição junto para ele não ter que refazer.

**1. Como o n8n descobre que existe execução nova? — AGORA COM MEDIÇÃO,
E É BLOQUEIO.**

Não é mais pergunta de desenho. Criamos uma execução real pelo
`POST /cadastro` em 19/08/2026 23:31:51 UTC:

```
id_execucao   98447192-3968-4fb1-8062-b14d6a8751ae
cliente_id    a85c37a9-df57-4829-985b-41bc306f8537   (negócio "V2G")
status        cadastro_completo
```

Ela ficou **parada em `cadastro_completo` por 8,7 minutos**, com
`atualizado_em` inalterado — 24 amostras a cada 15 s, todas iguais. Nada
tocou a linha.

Então: **o `POST /cadastro` sozinho não faz o pipeline andar.** Ou o n8n
não faz polling, ou o intervalo dele é maior que isso.

O que precisamos de você: **o n8n é acordado por webhook?** Se for,
manda a URL — o webapp já tem o gancho pronto e desligado
(`V2G_N8N_WEBHOOK_URL`), então é preencher uma variável de ambiente. Se
ele faz polling, qual é o intervalo, e ele está ligado?

Enquanto isso não fechar, o cadastro nasce e não anda. (§2.2, §13.5)

**2. `Prevoo.tem_whatsapp` perdeu o `null`.** O schema publicado é
`{"type":"boolean","default":false}`, sem `anyOf` nullable — então quando
o backend não consegue verificar o WhatsApp da Página, a resposta é
`false`, indistinguível de "verificamos e não tem". É o bug do
`oauth-meta.md` §2.1: os campos de WhatsApp da Página vêm ausentes mesmo
quando o número existe, e tratar ausência como negativa fez a interface
acusar todo cliente de não ter WhatsApp. Três estados, não dois:
`true`, `false` e `null` para "não consegui verificar". (§0.2)

**E um aviso, não pergunta:** `GET /campanhas/pre-requisitos` voltou a
existir no deploy e responde 200 — o que quer dizer que o nosso cliente
para essa rota, que estava guardado, entra em uso. Os dois bloqueios que
ela devolve hoje (conta sem forma de pagamento, app em modo
Desenvolvimento) são os mesmos que travam o `adcreatives` do lote D.
(§0.1)
