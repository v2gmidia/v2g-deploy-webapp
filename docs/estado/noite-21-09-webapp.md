# Modo noturno — 21 para 22/09/2026

Branch `onboarding-v3`. **Nenhum commit, nenhum push, nenhum merge,
nenhum deploy, nenhuma migração aplicada, nenhuma escrita no banco,
nenhuma chamada à OpenAI, à Meta ou ao Google.**

## 0. O placar

| tarefa | status | arquivos |
|---|---|---|
| **T1** terminar o v3 e revisar as 60 capturas | **feito** — 3 defeitos achados e consertados | `Onboarding.tsx`, `Onboarding.module.css` |
| **T2** o Início de quem acabou de chegar | **feito** — 2 momentos, 8 capturas | `app/exemplo/_chegada/*`, `app/exemplo/[tela]/page.tsx` |
| **T3** o plano para sair da bancada | **feito** | `docs/plano-onboarding-sair-da-bancada.md` |
| **T4** a armadilha de CSS | **feito** | `docs/armadilha-is-input-css-module.md` |
| — | 2 achados registrados | `DUVIDAS.md` ONB-15 e ONB-16 |

---

## 1. T1 — três defeitos, e os três estavam escondidos da captura

Auditei as 18 telas por TEXTO antes de abrir imagem: cada uma responde
onde estou, o que faço e para onde sigo? A tabela saiu inteira verde para
as três perguntas — e foi a auditoria, e não a imagem, que achou os
defeitos.

### 1.1 A verba abria com R$ 900 que ninguém digitou

`valor={Number(respostas.verba ?? 900)}`. O 900 era o ponto de partida do
slider, e num slider isso é inevitável — a alavanca precisa estar em algum
lugar. Num campo digitado vira outra coisa: o campo abria com um número
que a pessoa não escolheu, **o texto vivo já calculava em cima dele**, e o
"Continuar" já estava aceso. Dava para seguir sem nunca ter decidido
quanto investir.

Agora é zero: campo vazio, sem texto vivo, e o "Continuar" só acende
quando ela digita.

### 1.2 O placeholder parecia resposta

Consertado o 900, a captura mostrou "**R$ 1.200**" em negrito, no mesmo
tamanho do valor, com o "Continuar" apagado ao lado. Era o placeholder —
e quem lesse veria um valor preenchido e um botão quebrado.

Peso 400 e tinta discreta. O campo continua grande com ou sem resposta.

### 1.3 A tela dizia que o material era obrigatório e deixava passar

Passo 10: *"Sem material, a gente não consegue montar o anúncio"* com o
"Continuar" aceso. A tela desmentindo a si mesma — e quem lê é alguém que
já foi enganado por agência antes.

Agora são dois caminhos, os dois nomeados: com arquivo, o principal segue;
sem arquivo, o principal apaga e aparece **"Não tenho agora — mando
depois"**. É o mesmo desenho do "não tenho site", que também não é recusa
nem culpa. O resumo passa a dizer "vai mandar depois".

**O que isso não resolve** está em DUVIDA-ONB-16: "mando depois" conserta
a tela e não conserta o pipeline. E há uma hipótese que merece medição
antes das outras: o `origem_criativo` é fixo em `"gerar"`, então talvez a
IA monte sem material nenhum — e aí a frase é que está errada.

---

## 2. T2 — o Início de quem acabou de chegar

Duas rotas novas na bancada:

- `/exemplo/chegada` — terminou o cadastro, **falta conectar**
- `/exemplo/chegada-conectou` — conectou, e agora é a vez da V2G

### 2.1 O defeito 1: duas coisas ao mesmo tempo

A `/inicio` de hoje mostra "sua campanha está sendo preparada, 0 de 4
etapas" **junto** com "falta conectar sua conta". Uma frase manda esperar,
a outra manda agir, e as duas têm o mesmo peso.

**O conserto: uma ação só.** O herói tem exatamente um botão, e ele é o
`proximo` da cadeia. Medido nas duas telas:

```
chegada (falta conectar)  → 1 ação:  "Conectar meu Facebook"
chegada (conectou)        → 0 ações: "Nada esperando por você"
```

Zero ações **não é ausência de resposta**: a tela diz de quem é a vez, com
um ponto que respira do lado. Quem pediu menos movimento no sistema recebe
o ponto parado.

**O "0 de 4" saiu inteiro.** Zero não é progresso, é a ausência dele —
escrever zero em destaque para quem acabou de terminar o cadastro é dar má
notícia sobre uma coisa que a pessoa fez agora. A cadeia continua na tela,
mas como CONTEXTO: cinza, sem botão, sem placar, com a etapa atual
marcada e um "você está aqui".

### 2.2 O defeito 2: a pergunta do dia antes de existir dia

A `/inicio` condiciona o card em `estado.diaSeguinte.execucao !== null`
(`TelaDoInicio.tsx:208`). **A execução nasce quando o pipeline DISPARA**,
muito antes de qualquer anúncio no ar — e é daí que vem a pergunta
"quantas conversas viraram venda?" para quem nunca teve campanha.

**O conserto é uma linha, e é o predicado certo:**

```ts
const cabePerguntarSobreOntem = esteveNoAr(estado.veiculacao);
```

`esteveNoAr` é da fonte única (`lib/veiculacao/estado.ts`), e é ele que
distingue "o anúncio rodou" de "existe uma linha no banco". Medido nas
quatro capturas: a pergunta não aparece em nenhuma.

**Ela não some em silêncio.** No lugar fica uma linha discreta: *"As
perguntas sobre venda começam quando seu anúncio estiver no ar."* Sumir
sem dizer nada deixaria o dono sem saber que um dia a gente vai perguntar,
e a primeira vez que a pergunta aparecesse pareceria cobrança do nada.

### 2.3 Um terceiro defeito, que só apareceu ao desenhar

A cadeia marcava **"A sua aprovação" como concluída** com "A peça do seu
anúncio" ainda em aberto. Do lado do dado faz sentido — `pecasParaAprovar:
0`, não há nada esperando aprovação. Do lado da tela não faz nenhum: o
dono lê uma lista em ordem e vê a quarta linha marcada com a terceira
pendente.

**Não corrigi `montarEtapas`** — o dado dela não está errado, está
respondendo outra pergunta. A tela passou a carimbar só o que vem ANTES da
etapa atual. O achado está em DUVIDA-ONB-15, e ele vale para a `/inicio`
de produção, que mostra a mesma marca hoje.

---

## 3. T3 e T4 — os dois documentos

**`docs/plano-onboarding-sair-da-bancada.md`** — seis passos, cada um
reversível sozinho. A ordem importa: as três decisões de produto primeiro,
porque sem elas os passos seguintes constroem em cima de suposição. A
rota de transcrição sai da bancada **com sessão e teto de chamadas** — hoje
ela não confere sessão nenhuma, e tudo bem porque não existe em produção;
fora da bancada, sem isso, ela é uma torneira aberta na conta da OpenAI.

**`docs/armadilha-is-input-css-module.md`** — a regra `:is(input[type=…])`
do lote 2a vale (0,1,1) e ganha de qualquer classe de CSS Module (0,1,0).
O comentário dela diz que a especificidade foi escolhida de propósito, e
está certo. O documento tem o sintoma, a causa, as três saídas em ordem de
preferência, e **por que o `!important` não é uma delas**.

---

## 4. Decisões que tomei sozinho

1. **A verba começa em zero, e não em 900.** Campo que abre preenchido
   decide pela pessoa.
2. **O material ganhou porta nomeada em vez de bloqueio.** Bloquear faria
   quem não tem a logo à mão naquele minuto abandonar; deixar passar em
   silêncio era a tela mentindo. Nomear a saída é o padrão que o "não
   tenho site" já usa.
3. **Não corrigi `montarEtapas`.** É produção, está fora do alcance da
   noite, e o dado não está errado — está respondendo outra pergunta.
4. **A tela de chegada tem fixture própria**, e não reusa o
   `exemploDoInicio("preparando")`: aquele tem `conexaoAtiva: true`, que é
   outro momento. A CADEIA vem de `montarEtapas`, a mesma da produção — a
   bancada não pode discordar da `/inicio` sobre qual é o próximo passo,
   que é justamente o assunto da tela.
5. **"Agora é com a gente" é a frase da produção.** Descobri depois, ao
   varrer o pacote: `TelaDoInicio.tsx:344` já diz isso. Mantive — as duas
   telas dizendo a mesma coisa no mesmo momento é acerto, não colisão.
6. **A coluna e o texto viraram dois elementos** no rodapé da tela de
   chegada. Com `margin: 0 auto` e `max-width: 60ch` no mesmo elemento, a
   linha ficava centrada dentro do palco, desalinhada do resto.

---

## 5. O que ficou bloqueado e precisa de humano

1. **A `0023`** (cores na lista branca) continua escrita e **não
   aplicada**.
2. **A lista branca do WhatsApp** ainda não tem migration.
3. **As três decisões do passo 1 do plano:** a OpenAI entra no produto? o
   "Outro" vira fila humana, nicho novo ou recusa? a correção do resumo
   vira tabela de recados?
4. **DUVIDA-ONB-15** — a cadeia é sequência ou lista de pendências? Até
   decidir, a `/inicio` de produção mostra "A sua aprovação · já está
   feito" para quem nem tem peça.
5. **DUVIDA-ONB-16** — o anúncio sai sem material nenhum? Se sair, o passo
   10 vira opcional e a tela para de prometer uma dependência que não
   existe.
6. **As duas telas de chegada são desenho.** Levá-las para a `/inicio` é
   mexer em `app/(protected)/`, que a noite não autoriza.

---

## 6. EXITs

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← conferir:nichos, rede, o vermelho conhecido
```

Os doze que o `&&` pula, um a um, **todos EXIT=0**: dia-seguinte,
apresentada, signed-request, identidade, veiculacao, resultado,
campanha-da-sessao, envio, inicio, analise, portao, escolha-de-campo.

O `conferir:migrations` está **verde** (83 objetos, 41 fora do alcance).

### 6.1 A bancada não chega a produção

`next start` contra o pacote:

```
GET  /entrar                    200   ← controle
GET  /                          200   ← controle
GET  /exemplo/chegada           404
GET  /exemplo/chegada-conectou  404
GET  /exemplo/onboarding        404
GET  /exemplo/bordas            404
POST /exemplo/api-transcrever   404
```

Na varredura dos 703 arquivos do pacote, **zero** ocorrências de "Falta
você conectar o Facebook", "O caminho até seu anúncio no ar", "Não tenho
agora — mando depois" e `material_depois`.

**Duas coisas apareceram, e nenhuma é vazamento — medido, não suposto:**

- **"Agora é com a gente"** está em
  `app_(protected)_inicio_….js` — é a frase da PRODUÇÃO
  (`TelaDoInicio.tsx:344`), não a minha;
- **`estadoDeChegada` e `TelaDeChegada`** sobrevivem como nomes de
  propriedade num ramo morto: o compilador podou os módulos e deixou
  `null.TelaDeChegada` depois de um `notFound()`. Nenhuma frase da tela,
  nenhum `montarEtapas`, nenhuma lógica — só os identificadores. É a mesma
  forma do caminho da rota de transcrição.

---

## 7. `git status` ao fechar

```
 M app/exemplo/[tela]/page.tsx
 M app/exemplo/_onboarding/Onboarding.module.css
 M app/exemplo/_onboarding/Onboarding.tsx
 M docs/v2g-wireframes/DUVIDAS.md
 M docs/v2g-wireframes/capturas/onboarding-v3/  (10 PNG refeitos)
?? app/exemplo/_chegada/
?? docs/armadilha-is-input-css-module.md
?? docs/plano-onboarding-sair-da-bancada.md
?? docs/estado/noite-21-09-webapp.md
?? docs/v2g-wireframes/capturas/inicio-chegada/  (8 PNG)
```

Intactos: `app/(fluxo)/`, `app/(protected)/`, `app/(public)/`,
`app/(marketing)/`, `lib/`, `components/`, `proxy.ts`, `app/globals.css`,
`supabase/`.

---

## 8. Confirmação explícita

**Nenhum commit. Nenhum push. Nenhum merge. Nenhum deploy. Nenhuma
migração aplicada. Nenhuma escrita no banco — as únicas consultas foram as
leituras que o `conferir:migrations` já faz. Nenhuma chamada à OpenAI, à
Meta ou ao Google: as três autorizadas de ontem não foram usadas esta
noite, e o contador segue em 1. Nenhum arquivo de segredo tocado e nenhum
valor de chave impresso.**
