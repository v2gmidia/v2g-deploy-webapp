# Integração com o backend V2G

O backend é uma API FastAPI que roda o pipeline de IA e cria a campanha na
Meta. Este documento é sobre **como o webapp fala com ela** — e sobre o que
ainda não está resolvido.

Código em `lib/backend/`. Importe sempre de `lib/backend` (o `index.ts`),
nunca dos arquivos internos.

---

## 0. REGRA DE OURO: `/openapi.json` é a fonte de verdade

**O handoff do backend lista rotas e campos que não estão no deploy
publicado.** Isso já aconteceu duas vezes e vai acontecer de novo — não
por má-fé, mas porque o documento é escrito a partir do código em
desenvolvimento e o deploy fica atrás.

Casos medidos até agora:

| O handoff dizia | O deploy tem |
|---|---|
| `GET /campanhas/pre-requisitos` | **não existe** — 404 (§6.0) |
| `execucoes.criado_em`, `atualizado_em` | **não expostos** em nenhum endpoint (§6.5) |
| `execucoes.cliente_id` preenchido | nulo nas 29 execuções da fila |

**Antes de escrever cliente para qualquer rota nova:**

```bash
curl -s https://api.v2gmidia.com.br/openapi.json | python -m json.tool
```

`/openapi.json` responde **sem token** e traz as rotas e os schemas de
verdade. Duas armadilhas ao ler:

1. Ele **não declara `securitySchemes`** — a especificação não menciona
   autenticação nenhuma, mas ela existe, num middleware que roda antes do
   roteamento. Por isso token inválido dá **401 até em rota inexistente**,
   e o 404 só aparece depois que o token passa a valer. Um 404 é sinal de
   rota ausente **só se o token estiver certo**.
2. O schema declara o campo, não o dado. `cliente_id` está lá e vem nulo
   em 100% da fila real. Ler a especificação não substitui chamar.

**A ordem que funciona:** ler o `/openapi.json` → chamar de verdade →
olhar o corpo cru → só então escrever o tipo. Nessa ordem, e não na do
handoff.

---

## 1. O `X-V2G-Token` é segredo entre máquinas

Esta é a coisa mais importante do documento, e ela tem três consequências
que não são óbvias.

**Quem tem o token faz tudo.** Não há escopo, não há permissão parcial. O
token abre todos os endpoints, para todos os clientes.

**O token NÃO identifica usuário.** Ele diz "esta requisição vem do
webapp", e nada mais. O backend, hoje, **não distingue o cliente A do
cliente B** — ele não sabe quem está pedindo, só que alguém autorizado
pediu.

### Consequência 1 — só no servidor, e o build garante

Todo arquivo de `lib/backend/` começa com `import "server-only"`. Se
alguém importar isso de um componente de cliente, **o build quebra** — que
é infinitamente melhor que descobrir depois que o token está no bundle
que todo visitante baixa.

Na prática: o token sai de **Server Action** ou **Route Handler**. Nunca
de `"use client"`. E não existe versão "só para testar" que burle isso.

### Consequência 2 — a nossa autenticação vem ANTES, sempre

Como o backend não sabe quem é quem, **quem autoriza é a nossa sessão**.
A ordem é sempre esta, sem exceção:

```
1. verificar a sessão do Supabase (o usuário é quem diz ser?)
2. verificar que o recurso pertence a ELE      ← o passo que se esquece
3. só então chamar o backend
```

O passo 2 é o que se esquece, e é o que importa: sem ele, um usuário
logado pode pedir o `id_execucao` de outro e o backend entrega, porque
para o backend a requisição está perfeitamente autorizada. **Não existe
rede de segurança do outro lado.** A RLS do Supabase protege as nossas
tabelas; ela não protege as chamadas à FastAPI.

### Consequência 3 — não repasse identificador vindo do cliente sem checar

Qualquer `id` que chegue de um formulário ou de uma URL precisa ser
confrontado com o dono antes de virar parâmetro de chamada. Isso vale
inclusive para GET: `GET /execucoes/{id}` vaza dados de outro cliente se o
`id` não for validado aqui.

---

## 2. Configuração

Duas variáveis, ambas de servidor, nenhuma com `NEXT_PUBLIC_`:

| Variável | O que é |
|---|---|
| `V2G_BACKEND_URL` | base da API, sem barra no final |
| `V2G_BACKEND_TOKEN` | o valor do header `X-V2G-Token` |

**Se faltar qualquer uma, o app NÃO quebra.** `lib/backend` devolve a
categoria `indisponivel` e a tela mostra que aquela parte ainda não está
ligada. O resto do app funciona normalmente.

Isso é diferente do `credenciaisMeta()`, que **lança** quando falta
`META_APP_ID`. A diferença é proposital: sem app do Meta o fluxo de
conexão não existe, então falhar alto é correto. Aqui não — o app tem
telas que não dependem do backend, e derrubar a renderização delas por
falta de variável seria pior que dizer "indisponível".

---

## 3. Erros, por categoria

Mesma regra do `lib/auth-errors.ts`: a resposta original nunca vai para a
tela, só para o log do servidor. O corpo de erro da FastAPI é
`{"detail": ...}` em inglês, às vezes com detalhe de Pydantic dentro.

| Categoria | Quando | HTTP |
|---|---|---|
| `indisponivel` | falta variável de ambiente | — |
| `rede` | DNS, conexão recusada | — |
| `certificado` | o HTTPS do backend não é confiável | — |
| `tempo_esgotado` | passou do timeout desta chamada | — |
| `nao_autorizado` | token errado, ausente ou revogado | 401, 403 |
| `nao_encontrado` | o recurso não existe | 404 |
| `conflito` | transição de estado inválida | 409 |
| `dados_invalidos` | o backend recusou o que mandamos | 422, 4xx |
| `servidor` | o backend quebrou | 5xx |
| `resposta_ilegivel` | 200 com corpo fora do formato | 200 |

Duas escolhas de texto que merecem registro:

**`nao_autorizado` não pede para o cliente entrar de novo.** 401 do
backend é falha *nossa* de configuração — a sessão dele está ótima, o que
está errado é o nosso token de máquina. Mandar ele fazer login seria
culpá-lo por um problema que não é dele.

**`tempo_esgotado` não diz "falhou".** Nos endpoints de pipeline, o
trabalho **continua rodando** do lado do backend depois que a gente
desiste de esperar. O texto diz para conferir de novo em alguns minutos,
porque é isso que acontece de fato.

O erro é **devolvido**, não lançado: `Resultado<T>` é uma união
discriminada, então quem chama é obrigado pelo compilador a lidar com a
falha antes de acessar os dados.

---

## 4. Timeouts

Do contrato do backend, como constantes nomeadas em `TIMEOUTS`:

| Constante | ms | Endpoints |
|---|---|---|
| `rapido` | 15.000 | leitura, o padrão |
| `agente` | 180.000 | demais agentes |
| `compliance` | 300.000 | `/agentes/checar-compliance-visual` |
| `campanha` | 300.000 | `POST /campanhas` |
| `criativoVisual` | 420.000 | `/agentes/gerar-criativo-visual` |
| `copy` | 600.000 | `/agentes/gerar-copy` |

**Nenhum acima de `rapido` cabe num request de navegador.** Quem chamar um
desses precisa do padrão dispara-e-consulta:

```
1. dispara o trabalho
2. recebe resposta imediata com o id
3. consulta GET /execucoes/{id} a cada 3s
4. atualiza a tela quando o status mudar
```

Não implementado ainda — este lote só tem leitura.

---

## 5. O cliente de `pre-requisitos`

**LEIA A §6.0 ANTES DE USAR: esta rota não existe no backend publicado.**
O código abaixo está escrito, testado e correto — e devolve
`nao_encontrado` contra a API de hoje. Ele fica porque o endpoint é
previsto no contrato e porque a espera é do outro lado, não daqui.

`GET /campanhas/pre-requisitos` — read-only, não escreve nada.

```ts
import { consultarPreRequisitos } from "@/lib/backend";

const r = await consultarPreRequisitos({ idPagina: "847147288492237" });
if (!r.ok) {
  // r.mensagem já está em português e pronta para a tela
} else {
  r.dados.bloqueios;   // string[]
  r.dados.temWhatsapp; // boolean | null  ← ver abaixo
}
```

**`temWhatsapp` é `boolean | null`, e o `null` importa.** `null` significa
"o backend não informou", que **não é** "não tem". A gente já se queimou
exatamente com isso: os campos de WhatsApp da Página do Facebook vêm
ausentes mesmo quando o número existe, e tratar ausência como negativa fez
a interface acusar todo cliente de não ter WhatsApp
(`docs/oauth-meta.md` §2.1). Ausência de informação e informação negativa
são coisas diferentes, e o tipo obriga a tratar as duas.

A resposta é **validada em runtime**, não convertida com `as`. Um `as
PreRequisitos` é uma promessa que o TypeScript acredita e o runtime não
cumpre: se `bloqueios` deixar de ser lista, o `as` deixa passar e a tela
quebra num `.map`, longe daqui, com um erro que não menciona o backend.

---

## 6. O que NÃO está resolvido

### 6.0 `GET /campanhas/pre-requisitos` NÃO EXISTE no backend publicado

> **SUPERADO EM 19/08/2026 — a rota subiu.** Medição nova em
> [`disparo-pipeline.md`](./disparo-pipeline.md) §0.1: responde **200**,
> com os dois controles negativos que dão sentido ao 200 (token inválido
> → 401; rota inexistente com token válido → 404). O aviso no
> `lib/backend/index.ts` foi trocado.
>
> **O texto abaixo fica como está**, porque é registro de medição e
> reescrevê-lo apagaria a evidência de que a rota já não existiu — que é
> a razão de a regra da §0 deste documento existir. Leia o que segue como
> história, não como estado.
>
> Uma ressalva nova, essa sim de estado: `Prevoo.tem_whatsapp` é
> `boolean` com `default: false` no schema publicado, **sem `null`**.
> Nosso `boolean | null` continua certo como tipo, mas contra este
> backend o `null` nunca acontece — então "não consegui verificar" chega
> como `false`. É o bug do `oauth-meta.md` §2.1 outra vez, e o conserto é
> do lado do Gabriel.

Medido contra `https://api.v2gmidia.com.br` com o token válido:

```
GET /campanhas/pre-requisitos            → 404  {"detail":"Not Found"}
GET /campanhas/pre-requisitos?<4 params> → 404  {"detail":"Not Found"}
```

Não é o token: com token inválido a resposta é **401**, porque a checagem
do header roda como middleware, **antes** do roteamento. O 401 virou 404
exatamente quando o token passou a ser válido — ou seja, autentica e a
rota não está lá.

O `GET /openapi.json` é a fonte da verdade e responde 200. As **21 rotas
publicadas** hoje:

```
POST  /cadastro
POST  /execucoes/{id}/iniciar-pipeline-texto
POST  /execucoes/{id}/aguardar-fotos
GET   /execucoes/{id}
GET   /execucoes-em-revisao
POST  /execucoes/{id}/fotos
POST  /execucoes/{id}/criativos-enviados
GET   /execucoes/{id}/criativos
POST  /execucoes/{id}/aprovar
POST  /execucoes/{id}/gerando-criativo
POST  /execucoes/{id}/estrutura-pronta
POST  /campanhas
GET   /saude
POST  /agentes/classificar-nicho
POST  /agentes/diagnosticar-orcamento
POST  /agentes/varrer-site
POST  /agentes/construir-oferta
POST  /agentes/gerar-copy
POST  /agentes/gerar-criativo-visual
POST  /agentes/checar-compliance-visual
POST  /agentes/estruturar-campanha
```

**Só três são de leitura:** `/saude`, `/execucoes-em-revisao` e
`/execucoes/{id}` (mais `/execucoes/{id}/criativos`). Todo o resto
escreve.

O que existe no lugar: `POST /campanhas` devolve `avisos: string[]` dentro
de `RespostaSubidaCampanha` — mas **é endpoint de escrita**, cria campanha
de verdade, e por isso não serve para uma tela de diagnóstico.

**Consequência:** o validador de `pre-requisitos.ts` NÃO foi ajustado, e
não deve ser. Não há divergência de formato a acomodar — a rota está
ausente. Ajustar o validador para aceitar `{"detail":"Not Found"}` seria
transformar "não existe" em "existe e está vazio", que é a mentira mais
caniveteada possível numa tela de diagnóstico.

`GET /openapi.json` responde sem exigir token, e não declara
`securitySchemes` — o token é validado por middleware e não aparece no
contrato. Vale saber ao ler a especificação: ela não menciona
autenticação, mas ela existe.

### 6.1 O certificado HTTPS — RESOLVIDO

**Consertado.** A cadeia valida normalmente agora: `GET /saude` responde
200 e `GET /openapi.json` responde 200, os dois com `fetch` do Node sem
nenhuma flag para ignorar verificação.

O que era, e fica registrado porque a categoria `certificado` no cliente
existe por causa disto:

```
TLS   Subject: CN=Easypanel                        autoassinado
      Issuer:  CN=Easypanel                        (emissor = sujeito)
Node  fetch → TypeError, cause.code =
      DEPTH_ZERO_SELF_SIGNED_CERT
```

O host está servindo o **certificado padrão do Easypanel** em vez de um
certificado emitido para `api.v2gmidia.com.br`. O Node recusa, e o cliente
devolve `certificado`.

Isso não contradiz a verificação relatada de fora ("`/saude` responde 200,
`/execucoes-em-revisao` responde 401"): navegador aceita se alguém clicou
em "prosseguir", e `curl -k` ignora a validação. O que não funciona é
`fetch` do Node **sem desabilitar a verificação** — e desabilitar não está
em questão, porque aceitaria qualquer certificado no caminho, o que abre
interceptação do token.

**O conserto é do lado do backend:** emitir o certificado do domínio no
Easypanel (Let's Encrypt), com o domínio apontado para ele. Até então, o
front trata o backend como indisponível — que é o comportamento certo, e
está testado.

### 6.2 O backend não distingue cliente

Já dito na §1, e repetido aqui porque é a pendência de arquitetura mais
séria. Enquanto durar, **cada chamada depende de nós acertarmos a
verificação de dono**. Um `if` esquecido vaza dados entre clientes sem
nenhum aviso do outro lado.

Quando o backend ganhar autenticação de usuário final (Supabase Auth,
segundo o plano), isso deixa de ser responsabilidade só nossa. Até lá, é.

### 6.3 Nada de escrita, e nenhum polling

> **SUPERADO EM 19/08/2026 pelo lote E.** Existe escrita: `enviar()` em
> `cliente.ts` e `enviarCadastro()` em `cadastro.ts`, que fazem
> `POST /cadastro`. A promessa abaixo foi cumprida ao pé da letra — os
> dois métodos passam por uma função interna só (`chamar()`), então não há
> função paralela que esqueça metade dos casos.
>
> O que **continua** verdade: não existe upload multipart, não existe laço
> de consulta de 3s, e nenhum endpoint de 600s é chamado por nós — os
> `/agentes/*` são do n8n. Desenho em
> [`disparo-pipeline.md`](./disparo-pipeline.md).

Este lote tem só `GET`. Não existe `POST`, upload multipart, nem o laço de
consulta de 3s. O `obter()` é a única porta, de propósito: quando houver
escrita, ela entra ali com a mesma normalização de erro, e não numa função
paralela que esquece metade dos casos.

### 6.4 Qual banco manda continua aberto

O backend grava em `execucoes`; o webapp lê `businesses`, `campaigns` e
`creatives`. Os dois descrevem o mesmo domínio com nomes diferentes. A
decisão está pendente em `docs/contrato-front.md` (D2), e **nenhuma tela
deve ser construída sobre os dois ao mesmo tempo** antes dela.

### 6.5 `GET /execucoes-em-revisao`: o que ele NÃO traz

Fonte da tela `/saude-meta`. Existe, é read-only, e devolveu 200 com 29
execuções na medição. O schema é `RespostaExecucao`, nove campos:

```
id_execucao, cliente_id, status, nicho, requer_revisao,
motivos_revisao, confianca_minima, resultados, aprovacoes
```

O que **não** está lá, e por isso a tela diz na cara do operador:

| Faltando | Consequência |
|---|---|
| qualquer campo de tempo | não dá para dizer há quanto tempo está parado, nem ordenar por espera. `GET /execucoes/{id}` devolve o MESMO schema — não é limitação da listagem. |
| nome do negócio | só existe o nome da CAMPANHA gerada, em `resultados["estruturar-campanha"]`, e em 7 das 29. |
| `cliente_id` com valor | nulo em 29/29. Sem ele não dá para ligar a execução a um cliente do nosso banco. |

**DUAS ESCALAS DE CONFIANÇA CONVIVEM.** `confianca_minima` é sempre 0–1
(27 valores, de 0 a 0,8). As confianças por agente também — **exceto na
execução legada de status `gerado`**, onde vêm 75, 65 e 45, ou seja 0–100.

Mostrar "0,52" e "75" na mesma coluna faria o primeiro parecer catástrofe
e o segundo ótimo, quando **0,52 é melhor que 0,45**. `formatarConfianca`
detecta a escala por valor. O caso patológico — `1` na escala 0–100, que
significa 1% — não dá para desambiguar, e não aparece na fila real.

`motivos_revisao` vem preenchido em 28/29, no formato
`"<agente>: confianca 0.52"`. A exceção é a mesma execução legada.

## 7. Não dá para saber qual commit está no ar

MEDIDO em 21/08/2026. O repositório do backend não abre para esta
máquina, e o deploy não carimba versão — `GET /saude` e o
`info.version` do `openapi.json` não trazem commit nem build id. Não há
como comparar repositório e deploy em nenhuma direção.

Reforça a REGRA DE OURO da §0 pelo caminho negativo: o `/openapi.json`
não é só a melhor fonte de verdade sobre o backend, é a **única**.
Snapshots datados dele ficam em [`docs/openapi/`](./openapi/).

O achado inteiro, com o risco e o procedimento de resgate, está em
[`deriva-repo-deploy.md`](./deriva-repo-deploy.md).
