# Uma recomendação para cada dúvida em aberto — 20/09/2026 (madrugada)

**Nada aqui foi implementado.** É a tarefa T5 da noite: para cada dúvida
de `DUVIDAS.md` que ainda depende de você, o que eu recomendaria e a
medição que sustenta a recomendação.

Onde eu não tinha como medir, está escrito que não tinha.

---

## DUVIDA-2 — Qual das duas trilhas sobrevive

**Medido.** `TelaDoInicio.tsx` desenha as duas: 4 fases no topo (`:315`) e
6 etapas na lista (`:388`). `lib/estado/cliente.ts` produz as seis, e
`fasesDaCadeia` agrupa as mesmas seis em quatro — são a mesma informação
em duas resoluções, não duas informações. O `conferir:inicio` §3 prova
isso: a partição é total e disjunta, e bate exatamente com a cadeia.

**Recomendo ficar com as SEIS**, e a razão é de produto, não de layout: as
quatro fases têm nomes de processo (`preparar`, `otimizar`), e as seis
têm nomes do que o DONO precisa fazer (`cadastro`, `conexão`, `peça`).
Quando a pessoa abre a tela para saber "o que falta", a resposta está na
lista de seis.

**O que isso custa:** a referência visual desenha as quatro. Se o desenho
das quatro for inegociável, a saída é mantê-las como BARRA de progresso
sem rótulo — um medidor —, e a lista de seis como o conteúdo.

---

## DUVIDA-3 — Os cinco itens de navegação

**Medido.** O app tem Início · Criativos · Anúncios · Avisos · Conta
(`components/ui/Casco.tsx`). A referência desenha Início · Resultados ·
(botão central) · Campanhas · Decisões.

**Recomendo NÃO adotar a referência**, e por um motivo que está escrito no
próprio `Casco.tsx:127`: "Campanhas e Criativos viraram ANÚNCIOS. O
cliente não separa." Voltar a separar Campanhas de Resultados desfaz uma
decisão que já foi tomada contra a intuição de quem faz tráfego e a favor
de quem tem padaria.

**O que eu mudaria, se alguma coisa:** "Avisos" é o item mais fraco —
nome de caixa de entrada para uma tela que quase sempre está vazia.

---

## DUVIDA-4 — A referência viola dois não negociáveis

**Medido.** `v2g-inicio-preparando-mobile-v1.png` traz "Leva cerca de 3
minutos" (promessa de prazo) e "Em breve".

**Recomendo descartar as duas frases e manter o resto da referência.**
Isto não é dúvida de produto: o item 9 do briefing e o `PRODUCT.md`
proíbem promessa de prazo, e o `conferir:veiculacao` §3 já tem a trava que
recusa qualquer frase de veiculação com prazo. Uma imagem de referência
não revoga uma trava.

**A pergunta que sobra, e essa é sua:** quem desenhou a referência sabia
da regra? Se não sabia, vale avisar antes da próxima leva — senão a
mesma frase volta.

---

## DUVIDA-5 — Três paletas disputam autoridade

**Medido hoje.** `app/globals.css` declara `--cobalt: #0743DC` e
`--lime: #E8FC65`, com paleta escura calibrada à parte, e **7 literais de
cor fora do `:root`** no arquivo inteiro — o detector do `DESIGN.md` cobre
o resto.

**Recomendo declarar o `globals.css` como a autoridade, por escrito, no
`DESIGN.md`.** Ele já é na prática: é o único dos três que tem os dois
temas calibrados, é o que o detector confere, e é o que o
`docs/contraste.md` mede. Mockup e apresentação são registro de uma
proposta; token é o que pinta.

**O que falta:** uma linha no `DESIGN.md` dizendo isso, para a próxima
sessão não reabrir a discussão com um PNG na mão.

---

## DUVIDA-7 — O que o lima significa

**Medido.** `lib/veiculacao/estado.ts` tem a fonte única das frases, e o
`conferir:veiculacao` §3 prova que nenhuma tela escreve a própria.

**Recomendo: lima é "no ar agora", e mais nada.** É o que a regra do
repositório já diz, e é o que distingue celebração de informação —
`ja_foi_ao_ar` com marca de lima é comemorar campanha parada, que foi
exatamente o defeito da rodada 1.

**Consequência que vale dizer em voz alta:** isso torna o lima RARO. Uma
conta sem campanha no ar nunca vê lima, e é assim que ele continua
significando alguma coisa.

---

## DUVIDA-9 — Os nomes do suporte: são QUATRO, não dois

**Remedido em 20/09.** A dúvida registrava dois rótulos. São quatro, em
sete lugares de produção:

| rótulo | onde |
|---|---|
| "Falar com alguém" | `components/ui/Casco.tsx:159` |
| "Falar com uma pessoa" | `Casco.tsx:212`, `app/(fluxo)/layout.tsx:54`, `app/(protected)/inicio/TelaDoInicio.tsx:866` |
| "Falar com uma pessoa agora" | `app/(fluxo)/conectar/escolher/page.tsx:229` |
| "Falar com um humano" | `app/(fluxo)/onboarding/Trilha.tsx:153` e `:181` |

**Recomendo "Falar com uma pessoa"**, por contagem e por som: é o que
aparece em mais lugares (4 de 7), e "humano" é palavra de quem constrói
robô — o dono da padaria não se descreve como humano.

**Recomendo também extrair a frase para uma constante**, do mesmo jeito
que `lib/veiculacao/estado.ts` fez com as frases de veiculação. Enquanto
ela estiver escrita em sete arquivos, a quinta variação é questão de
tempo — foi assim que a quarta apareceu.

**O que isso NÃO é:** não é urgente. É o tipo de coisa que entra junto com
a próxima mudança que já for tocar o `Casco`.

---

## DUVIDA-ONB-3 — Onde o áudio original fica guardado

**Medido.** Na bancada o áudio vive em memória, com tocador, e some ao
trocar de pergunta (com `revokeObjectURL`, para não vazar). Não é gravado
em lugar nenhum.

**Recomendo NÃO guardar o áudio em produção, e guardar só a transcrição
mais a marca de que ela veio de áudio.** A marca já existe e já sobrevive
a fechar o navegador (`__respondidas_falando`).

**Por quê, contra o que o briefing pediu:** áudio de cliente é dado
pessoal, nenhum documento do repositório diz por quanto tempo ele fica, e
a LGPD trata retenção indefinida como problema, não como zelo. O valor de
guardar o áudio é poder conferir uma transcrição duvidosa — e isso a
revisão ANTES de aceitar já resolve, que é o que a tela faz hoje.

**Se você quiser guardar mesmo assim**, o que precisa vir junto:
1. bucket no Storage com RLS por `business_id` — o padrão de
   `lib/identidade/armazenar.ts`;
2. coluna ligando resposta → arquivo → transcrição, para "o que ele disse"
   e "o que a máquina entendeu" continuarem distinguíveis;
3. **um prazo de retenção escrito**, e um job que apague.

O item 3 é o que transforma isso de dívida em decisão.

---

## DUVIDA-ONB-4 — O custo por contato por nicho

**Medido.** `GET /nichos` entrega `nicho`, `rotulo`, `termosDeBusca` e
`subTipos` — mais nada (`lib/nichos/tipos.ts`). Os três números em uso
(bebidas R$ 7, agência R$ 30, arquitetura R$ 60) são os que você deu no
chat, e estão declarados como tal no topo de `custo-por-contato.ts`.

**Recomendo pedir a faixa ao backend no `GET /nichos`**, e não construir
tabela no webapp. Motivo medido: a lista viva encolheu de 10 para 8 nichos
sem ninguém avisar — é o vermelho do `conferir:nichos` desde ontem. Uma
tabela local envelheceria do mesmo jeito, e em silêncio.

**Enquanto não vier:** o caminho "não sei estimar" já está desenhado e
capturado (`onb-09b-semfaixa-*`). Ele é honesto e não custa nada manter.

---

## DUVIDA-ONB-5 — O CEP é validado só no formato

**Medido.** Não há resolvedor de CEP no repositório. A única resolução
geográfica é `garantirGeo()`, que fala com a Meta e exige token.

**Recomendo ViaCEP**, e recomendo consultá-lo **só para preencher a
cidade**, não para barrar. Ele é grátis, não pede chave, e devolve
`localidade` — que alimenta `businesses.city`, que é de onde sai a
segmentação geográfica.

**A regra que tem que vir junto:** ViaCEP fora do ar **não pode barrar o
cadastro**. O CEP entra como o cliente digitou, marcado como não
conferido. Indisponibilidade nossa nunca vira recusa ao cliente — é a
mesma regra que o `conferir:apresentada` já aplica ao backend.

---

## DUVIDA-ONB-6 — O fim manda para o WhatsApp, não para uma agenda

**Medido.** Nenhuma menção a Cal.com, Calendly ou Google Calendar no
repositório.

**Recomendo ficar no WhatsApp por enquanto**, e a razão mudou de 20/09 de
manhã para agora: a mensagem deixou de ser uma linha e passou a levar o
cadastro inteiro, com o que veio falado e o que ficou em branco (490
caracteres no dado de exemplo). Quem atende abre o WhatsApp sabendo tudo.

Uma agenda integrada trocaria isso por um horário marcado e nenhum
contexto — a não ser que alguém construa a passagem do resumo para a
agenda, que é mais trabalho do que o que existe hoje.

**Quando isso muda:** quando o volume passar do que uma pessoa dá conta de
responder à mão. Aí o problema é fila, não contexto.

---

## DUVIDA-ONB-9 — A correção do resumo não tem destino

**Medido.** Ela vai para o `localStorage` e entra na mensagem do WhatsApp,
cortada em 600 caracteres com aviso.

**Recomendo a opção 2: uma tabela de recados do onboarding**, com
`business_id`, texto, data e situação. Não uma coluna em `businesses`.

**Por quê:** uma coluna de texto livre em `businesses` vira campo que
ninguém lê. Uma tabela com situação é a única forma de a pergunta "ficou
algum recado sem resposta?" ter resposta — e essa pergunta é o que
justifica ter perguntado.

**O risco de não decidir:** o cliente escreve achando que alguém vai ler.
Recado que ninguém lê é pior do que não perguntar, e hoje o único caminho
até uma pessoa é ele mesmo apertar o botão do WhatsApp.

---

## DUVIDA-ONB-10 — O `.env.example` está atrás do `.env.local`

**Medido** (só os NOMES). Estão no `.env.local` e não no exemplo:
`OPENAI_API_KEY`, `N8N_API_KEY`, `N8N_BASE_URL`,
`META_SYSTEM_USER_ACCESS_TOKEN`, `V2G_OREGON_URL`,
`V2G_OREGON_SERVICE_KEY`. E o exemplo tem seis `SUPABASE_SMTP_*` que o
local não tem.

**Recomendo acrescentar as seis ao `.env.example`, com um comentário por
linha dizendo o que quebra sem ela.** Nome em arquivo de exemplo não é
segredo — é o contrato de quem clonar o repositório. Hoje quem clonar sobe
o app sem transcrição e sem n8n, e descobre isso quando a tela falha.

**Recomendo um conferidor**, na mesma família dos outros: varre
`process.env.*` no código, compara com o `.env.example` e acusa nome lido
pelo código que não está no exemplo. É o mesmo formato do
`conferir:lista-branca`, que existe exatamente para esse tipo de par que
sai de sincronia em silêncio.

---

## O que NÃO está nesta lista, e por quê

**DUVIDA-1, 6 e 8** foram decididas por você em 16, 17 e 18/09 e estão em
`docs/decisoes.md`.

**DUVIDA-ONB-1, 2, 7 e 8** foram remedidas nesta madrugada e as entradas
delas em `DUVIDAS.md` já estão atualizadas — a ONB-7, em especial, estava
errada: duas das três colunas que ela dava como faltantes existem desde a
`0001_init.sql`.
