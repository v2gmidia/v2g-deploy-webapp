# Dúvidas da sessão longa — Início canônico

Sessão de 15–16/09/2026. O Victor estava dormindo e a regra era **não
parar**: cada ambiguidade virou a escolha mais conservadora, registrada aqui
com o que muda se ele decidir diferente.

Cada uma tem marca no código: `/* DUVIDA-N */`.

---

## DUVIDA-1 — "Seu gestor pode retomar quando fizer sentido"

**O que era.** A frase de apoio do estado `ja_foi_ao_ar`, em
`lib/veiculacao/estado.ts:297-298`. A V2G se posiciona como "gestão de
tráfego **sem** gestor de tráfego" (`PRODUCT.md:21`), e "seu gestor" sugere
uma pessoa operando a conta — exatamente o que o produto diz substituir. Pior:
sugere que existe alguém que **vai** retomar, e ninguém agendou isso.

**Opções.**
(a) manter como está;
(b) trocar por "a gente pode retomar quando fizer sentido";
(c) trocar por algo sem agente ("ele pode voltar ao ar quando fizer sentido");
(d) transformar em ação: "Quer voltar a rodar? Fale com a gente".

**Escolhido: (a), manter, e NÃO tocar no arquivo.** É copy de produto, é a
fonte única de frases de veiculação, e mudá-la altera o texto de **todas** as
telas que leem veiculação — fora do escopo desta sessão, que é o Início.

**Se o Victor decidir outra:** é uma linha em `lib/veiculacao/estado.ts:297`.
Nenhuma tela precisa mudar — é para isso que o banco de frases existe. A
opção (d) é a única que exige mais que texto: precisaria de uma ação de
retomada, que hoje não existe em lugar nenhum do produto.

---

## DUVIDA-2 — Qual das duas trilhas sobrevive

**O que era.** O item 10 do briefing manda sobrar **uma** trilha. Hoje há
duas: as 4 fases do topo (`TelaDoInicio.tsx:315`) e as 6 etapas da lista
(`:388`). A referência visual (`v2g-inicio-preparando-mobile-v1.png`) **também
desenha as duas** — o medidor de 4 no cartão azul e a lista "O que já está
pronto" com 5 itens. Ou seja: a referência não resolve, ela repete o defeito.

**Opções.**
(a) ficar com as 4 fases (bate com a referência e com o wireframe);
(b) ficar com as 6 etapas (bate com a cadeia real, que tem dono e bloqueio
    por etapa);
(c) ficar com as 4 e mover as 6 para outra tela.

**Escolhido: (a), as 4 fases, no topo.** Motivos: é o que a referência
desenha; é o que responde "quanto falta" de relance no celular; e as 6 etapas
existem para *decidir*, não para *mostrar* — `montarEtapas()` continua
inteiro, e a tela lê `proximo` dele como sempre. Nada da lógica muda.

**O que se perde, dito na cara:** a lista das 6 era o único lugar que dizia
**de quem é a vez** de cada etapa futura ("vai depender de você" / "vai ser
com a gente" / "vai depender do Facebook"). Compensei pondo essa informação
no cartão da ação primária, que é onde ela decide alguma coisa.

**Se o Victor decidir outra:** trocar `<Fases>` por `<Trilha>` no bloco do
topo. As duas leem a mesma cadeia; nenhuma consulta nova.

---

## DUVIDA-3 — Os cinco itens de navegação

**O que era.** A referência desenha Início · Resultados · (botão central) ·
Campanhas · Decisões. O app tem Início · Criativos · Anúncios · Avisos ·
Conta (`Casco.tsx:125-137`).

**Opções.** (a) manter os cinco atuais; (b) adotar os da referência.

**Escolhido: (a), manter.** Há decisão registrada e datada em
`docs/decisoes.md` (12/09/2026) sobre exatamente esses cinco, com o motivo
(cinco é teto de cinco células de 64px em 320px, `docs/navegacao-mobile.md`).
Trocar rótulo de navegação é mudança de produto e derrubaria uma decisão
tomada por ele. E "Decisões"/"Resultados" não têm tela correspondente hoje.

**Se o Victor decidir outra:** é `Casco.tsx`, cinco linhas — mas exige criar
ou repontar duas rotas, e o botão central da referência não existe no app.

---

## DUVIDA-4 — A referência viola dois não negociáveis

**O que era.** `v2g-inicio-preparando-mobile-v1.png` traz **"Leva cerca de 3
minutos"**, que é promessa de prazo, proibida pelo item 9. E o rótulo **"Em
breve"** aparece no wireframe do medidor, que é a mesma família.

**Escolhido: divergir da referência de propósito.** Sem estimativa de tempo.
O rótulo de fase travada é **"Ainda não"**, que já é o que o código faz
(`frases.ts:1002-1006`) com o motivo escrito: a conta da V2G ficou dezessete
dias em `aguardando_fotos`.

**Se o Victor decidir outra:** é `ROTULO` em `frases.ts:1002`. Mas seria
reintroduzir promessa de prazo num produto cujo pipeline não tem duração
medida.

---

## DUVIDA-5 — Três paletas disputam autoridade

**O que era.** Medido:

| Fonte | cobalto | lima | marinho |
|---|---|---|---|
| briefing desta sessão | `#0743DC` | `#E8FC65` | `#111E2F` |
| `app/globals.css:25-28` | `#0743DC` | `#E8FC65` | `#111E2F` |
| `DESIGN.md` da raiz (gerado do CSS) | `#0743DC` | `#E8FC65` | `#111E2F` |
| `docs/v2g-wireframes/DESIGN.md` | `#0B41D9` | `#EAFF64` | `#051225` |

**Escolhido: os tokens do `globals.css`.** Três das quatro fontes concordam,
o briefing manda usar os tokens existentes, e o `DESIGN.md` do pacote de
wireframes se declara *seed* ("re-run `$impeccable document` once there's
code to capture the actual tokens").

**Consequência:** nenhum valor literal de cor foi escrito nesta sessão. O
detector do hook valida contra o `DESIGN.md` gerado, então qualquer cor fora
da escala reprovaria — e a regra 4 proíbe silenciar isso.

**Se o Victor decidir outra:** regerar `DESIGN.md` com
`node scripts/gerar-design-md.mjs` depois de trocar os tokens no
`globals.css`. Nenhum componente muda: tudo lê variável.

---

## DUVIDA-6 — O estado pausado não tem ação

**O que era.** Com o anúncio em `ja_foi_ao_ar` e a cadeia fechada, a tela não
oferece **nada** para fazer — hoje ela escreve "Nada está esperando por você"
(`TelaDoInicio.tsx:554`). O item 10 diz que isso é mentira visual, mas não diz
qual ação deveria existir, e o produto **não tem** rota de retomada: não há
`POST` de ativar campanha em lugar nenhum do webapp, e ativar exige decisão
humana por regra (`docs/publicar-campanha.md` §0).

**Opções.**
(a) inventar um botão "Retomar anúncio" (precisaria de rota que não existe);
(b) manter sem ação, mas trocar a moldura: deixar de parecer conclusão e
    passar a declarar o estado, com caminho humano;
(c) manter exatamente como está.

**Escolhido: (b).** O estado pausado passa a ser tratado como **situação que
pede atenção**, não como cadeia concluída: sem selo de "tudo pronto", com a
manchete no passado e a saída que de fato existe — falar com uma pessoa. Não
inventei botão para uma ação que o backend não tem: botão que não resolve é
pior que silêncio (a mesma regra já escrita em `frases.ts:544`).

**Se o Victor decidir outra:** (a) exige rota nova no backend e autorização
humana explícita para escrita na Meta. Não é mudança de tela.

---

## DUVIDA-7 — O que o lima significa

**O que era.** Na rodada 1 as quatro fases saíam com marca limão de
"Concluído" ao lado da manchete "Seu anúncio já rodou e não está no ar
agora" — informação virando comemoração sobre campanha parada.

**Escolhido: lima = "no ar agora", e só.** Parado, as marcas e o selo ficam
neutros. Devolve sentido à Signal Lime Rule do `DESIGN.md`: quatro marcas
limão seguidas não são sinal, são decoração.

**Se o Victor decidir outra:** é a classe `.viva`/`.heroiVivo` no CSS Module
da bancada. Nenhuma lógica muda.

---

## DUVIDA-8 — A trilha depois da publicação

**O que era.** A rodada 4 manda tirar a trilha no pausado e também no "no ar",
porque "Otimizar" é trabalho contínuo e não missão encerrada. Isso resolve o
desenho, mas deixa em aberto a **política**: a trilha some para sempre depois
da primeira publicação? Volta se a campanha for refeita? Vira histórico em
outra tela?

**Escolhido: ocultar depois de `esteveNoAr`.** É o comportamento mais
conservador em relação ao defeito que o contrato mandou matar — nenhum estado
publicado pode parecer conclusão.

**Isto é recomendação visual, NÃO decisão de produto aprovada.** Vai para o
Gabriel junto das outras duas.

**Se decidirem outra:** é a linha `const mostrarTrilha = !jaPublicou` no
componente da bancada.

---

## DUVIDA-9 — Dois nomes para o suporte, e um deles é de produção

**O que era.** O `Casco` usa **dois** rótulos para a mesma ação: "Falar com
alguém" na lateral (`components/ui/Casco.tsx:159`) e "Falar com uma pessoa" no
topo do celular (`:212`). A bancada padronizou em "Falar com alguém", mas
abaixo de 900px os dois aparecem no mesmo campo de visão.

**Escolhido: não tocar no `Casco`.** É componente de produção, e a rodada
proíbe editá-lo só para cumprir esta entrega.

**A alteração exata que faltaria:** trocar o texto de `Casco.tsx:212` para
"Falar com alguém". Uma linha, nenhum outro efeito.

---

# Onboarding novo — 20/09/2026

O briefing manda reescrever o onboarding self-service: onze perguntas no
lugar de cinco, áudio ou teclado em toda pergunta de texto, slider de
verba com texto vivo, e fim com resumo e agendamento. Feito na bancada,
em `/exemplo/onboarding`; o onboarding do ar (`app/(fluxo)/onboarding/`,
cinco perguntas) **não foi tocado**.

Cada decisão abaixo foi tomada sem o Victor, com o que muda se ele
decidir outra.

---

## DUVIDA-ONB-1 — A `OPENAI_API_KEY` apareceu no `.env.local` (RESOLVIDA em parte)

**Medido em 20/09/2026, de manhã:** as 19 variáveis lidas pelo código não
incluíam `OPENAI_API_KEY`, e ela não estava em `.env.local` nem em
`.env.example`. Todas as capturas daquela rodada mostram o microfone
desabilitado — era o estado real da máquina.

**Remedido em 20/09/2026, à tarde: ela está no `.env.local`.** Alguém a
acrescentou enquanto esta rodada corria (só o NOME foi lido; o valor,
nunca). O microfone da bancada passou a nascer LIGADO, e as capturas foram
refeitas por causa disso.

**O que continua aberto:**

1. **Ela não está no `.env.example`**, que é o arquivo de contrato do
   deploy. Quem clonar o repositório não sabe que ela existe. Não
   acrescentei: quem decide que o produto passa a depender da OpenAI é o
   Victor. (E não é a única nessa situação — `N8N_API_KEY`, `N8N_BASE_URL`,
   `META_SYSTEM_USER_ACCESS_TOKEN`, `V2G_OREGON_URL` e
   `V2G_OREGON_SERVICE_KEY` também estão no `.env.local` e fora do
   exemplo.)
2. **Ela não está na Vercel** até alguém pôr — o `.env.local` é desta
   máquina.
3. **A transcrição não foi exercitada ponta a ponta.** Chamar a rota de
   verdade gasta na conta da OpenAI do Victor, e eu não fiz isso sem ele
   pedir. O que está provado é a tela nos dois estados, não a qualidade da
   transcrição.

**Os dois caminhos continuam capturados**, porque o estado sem chave
continua sendo o de qualquer outra máquina: `?microfone=1` desenha ligado,
`?microfone=0` desenha desligado, e sem o parâmetro vale o ambiente. Ver
`onb-04-semchave-*` e `onb-12-semchave-*`.

---

## DUVIDA-ONB-2 — Quais perguntas aceitam áudio, e quais CONVIDAM

**O que era.** O briefing de 20/09 de manhã diz "toda pergunta de texto
aceita áudio ou teclado" e "perguntas de escolha (raio, nicho, valor) são
botão/slider, sem áudio". Sobraram duas que não são nem uma coisa nem
outra: o CEP e o WhatsApp.

**Escolhido: CEP e WhatsApp só por teclado.** Os dois têm FORMATO — oito
dígitos, DDD + número —, e uma transcrição de número ditado erra dígito com
frequência alta o bastante para transformar a ajuda em armadilha: o cliente
confirma "cento e oitenta e quatro..." sem reler, e o anúncio vai para o
CEP errado. Os dois têm máscara, que é o que o teclado do celular resolve
bem.

**Aceitam áudio:** nome, empresa, descrição, Instagram e site.

---

**O complemento de 20/09 à tarde partiu esse grupo em dois** (decisão do
Victor, `docs/decisoes.md`): aceitar áudio e CONVIDAR a falar deixaram de
ser a mesma coisa.

| pergunta | aceita áudio | convida a falar |
|---|---|---|
| 1. nome da pessoa | sim | **não** — mesmo peso que o teclado |
| 2. nome da empresa | sim | **não** |
| 4. o que você vende | sim | **sim** — é ABERTA |
| 5. Instagram | sim | **não** |
| 6. site | sim | **não** |
| a correção do resumo | sim | **sim** — é ABERTA |
| 3, 7, 8, 9, 10, 11 | não | não |

**Onde isso mora:** o campo `aberta` em `perguntas.ts`, uma linha por
pergunta. A correção do resumo não é passo numerado, então ela pede
`aberta` na mão, no componente.

**Se o Victor decidir outra:** é a mesma linha. Nenhuma frase está
escrita dentro de componente — as duas são constantes exportadas.

---

## DUVIDA-ONB-3 — Onde o áudio original fica guardado

**O que o briefing pede:** "GUARDE o áudio original junto da transcrição".

**Na bancada, o áudio fica em memória**, ao lado da transcrição, com um
tocador para o cliente ouvir de novo antes de confirmar. Ele NÃO é
gravado em lugar nenhum: esta rodada proíbe escrita no banco, e o
`localStorage` (onde as respostas ficam) não aguenta áudio — o teto é de
~5 MB por origem, e trinta segundos de webm já ocupam a metade disso.

**O que produção precisa ter**, e é trabalho que não foi feito aqui:
1. um bucket no Supabase Storage para os áudios do onboarding, com RLS
   por `business_id` — o padrão já existe em `lib/identidade/armazenar.ts`;
2. uma coluna ou jsonb que ligue cada resposta ao arquivo e à transcrição,
   para "o que ele disse" e "o que a máquina entendeu" continuarem
   distinguíveis depois;
3. decisão de retenção: áudio de cliente é dado pessoal, e hoje nenhum
   documento do repositório diz por quanto tempo ele fica.

---

## DUVIDA-ONB-4 — O custo por contato por nicho não vem de lugar nenhum

**Medido:** o `GET /nichos` entrega `nicho`, `rotulo`, `termosDeBusca` e
`subTipos`, e mais nada (`lib/nichos/tipos.ts:20-48`). O custo-alvo por
contato é saída do agente `diagnosticar-orcamento`, e
`docs/contrato-do-dashboard.md:360` registra que ele **ainda não existe**
para nenhum cliente.

**Escolhido: uma tabela declarada na bancada, com os três números que o
Victor deu no chat em 20/09** (bebidas R$ 7, agência R$ 30, arquitetura
R$ 60), e **`null` para todo o resto** — que é o que faz a tela dizer
"ainda não temos a média de custo por contato do seu tipo de negócio".
Os dois caminhos estão capturados: `onb-09-*` (com custo) e
`onb-09b-semfaixa-*` (sem).

**O que o backend teria de mandar:** uma faixa por nicho no `GET /nichos`,
ou um campo no documento de `knowledge/`. No dia em que vier, a tabela de
`custo-por-contato.ts` morre e a leitura passa a ser do dado vivo.

**O mínimo indicado nunca aparece abaixo do piso.** Em bebidas, 15
contatos a R$ 7 com 15% de folga dão R$ 121 — abaixo dos R$ 750 com que a
gente consegue rodar. Dizer "o indicado é R$ 121" numa tela que bloqueia
em R$ 750 seria a tela se contradizendo; a frase passa a dizer os dois
números.

---

## DUVIDA-ONB-5 — O CEP é validado só no formato

**Medido:** não existe resolvedor de CEP neste repositório. A única
resolução geográfica é `garantirGeo()` (`lib/meta/publicar.ts`), que fala
com a Meta e exige token — e esta rodada proíbe tocar a Meta.

**Escolhido: validar oito dígitos e formatar `00000-000`.** A tela não
afirma que o CEP existe, porque ninguém consultou nada.

**O que falta:** escolher a fonte (ViaCEP é grátis e sem chave;
BrasilAPI idem) e decidir o que fazer quando ela estiver fora — o
caminho honesto é aceitar o CEP mesmo assim e marcar como não conferido,
nunca barrar o cadastro por indisponibilidade nossa.

---

## DUVIDA-ONB-6 — O fim manda para o WhatsApp, não para uma agenda

**O que era.** O briefing manda terminar com resumo e botão de agendar 30
minutos, "se não houver agenda integrada, manda pro WhatsApp com mensagem
pronta".

**Medido: não há agenda integrada.** Nenhuma menção a Cal.com, Calendly
ou Google Calendar no repositório.

**Escolhido: o botão abre o WhatsApp com a mensagem pronta**, citando o
nome da empresa que ele acabou de cadastrar.

**O que falta:** escolher a ferramenta de agenda e decidir quem é o dono
do horário (Victor? Gabriel? rodízio?). Enquanto isso, o WhatsApp é o
caminho que existe.

---

## DUVIDA-ONB-7 — O que a bancada grava, e o que produção vai gravar (CORRIGIDA)

**Na bancada:** cada resposta aceita vai para o `localStorage` no instante
em que é validada, e quem sai e volta **retoma na primeira pergunta sem
resposta** — não na pergunta 1. Provado em 20/09 com cinco respostas
guardadas: a tela reabriu na 5.

**Em produção o destino é `confirmar_campo_do_cliente`**, a mesma porta da
`/meu-negocio` (migrations 0015/0016), que grava valor e procedência na
mesma transação.

---

**ESTA DÚVIDA DIZIA QUE TRÊS COLUNAS FALTAVAM. FALTA UMA.** Remedido em
20/09 contra `supabase/migrations/` em vez de contra o catálogo de
extração — que foi o meu erro: o catálogo não lista `full_name` nem
`radius_km` porque nenhuma das duas vem da conversa com o agente.

| pergunta | onde grava | existe? |
|---|---|---|
| 1. nome da PESSOA | `profiles.full_name` | **existe**, `0001_init.sql:51` |
| 3. raio de atendimento | `businesses.radius_km` | **existe**, `0001_init.sql:56` |
| 8. WhatsApp que recebe cliente | `businesses.whatsapp_do_anuncio` | **não existe** |

A migration `0022_whatsapp_do_anuncio.sql` está escrita e **NÃO aplicada**.
Ela é a razão de `pnpm conferir:migrations` estar vermelho: aquele
conferidor lê o schema VIVO, e fica verde no instante em que alguém rodar
`db:migrate`.

**O que NÃO entrou junto, e por quê:** a coluna na lista branca da
`confirmar_campo_do_cliente`. A lista não entra sozinha — precisa de
`lib/agentes/campos.ts` ou de `EXTRAS_ESPERADOS` na mesma leva, senão
`conferir:lista-branca` fica vermelho. Está tudo pronto para colar em
`docs/migracao-whatsapp-do-anuncio.md`.

**Enquanto a lista branca não entrar:** o número é gravável pelo backend e
o cliente **não** o edita pela `/meu-negocio`.

**Onde isso está ligado no código:** `app/exemplo/_onboarding/destino.ts`
mapeia as onze perguntas para as colunas, com `colunaExiste` e
`naListaBranca` por campo, e não escreve nada. `?destino=1` na bancada
mostra a tabela na tela.

---

## DUVIDA-ONB-8 — A rota de transcrição fica REGISTRADA em produção

**Remedido em 20/09/2026, depois de refazer o `pnpm build`** (703 arquivos
do pacote, fora de `.next/dev` e `.next/cache`):

| o que procurei | no pacote |
|---|---|
| "Como posso te chamar", "Responder falando" | **0** |
| `custoDoNicho`, `frasesDoSlider`, `distribuidora-de-bebidas` | **0** |
| `v2g:onboarding-v2:bancada` | **0** |
| `transcribe`, `gpt-4o`, `api.openai.com`, `OPENAI_API_KEY` **no `.js` executado** | **0** |
| `gpt-4o-mini-transcribe` no `.js.map` | 1 |
| o CAMINHO `/exemplo/api-transcrever` nos manifestos | 29 |

**O corpo da rota não sobrevive ao build.** `process.env.NODE_ENV` vira
literal, e o compilador poda tudo depois do trinco. O que resta no chunk
de servidor é a função inteira, em uma linha:

```js
function f(e){return NextResponse.json({...},{status:404})}
```

Nenhuma chave, nenhum nome de modelo, nenhum endereço da OpenAI executam
ou existem no código que roda. O nome do modelo só continua no
**sourcemap**, que é arquivo de depuração e não é servido ao navegador.

**O que de fato vaza é o CAMINHO.** `/exemplo/api-transcrever` está nos
manifestos de rota, porque rota do Next é módulo de topo e não se
registra condicionalmente como a página faz com `await import()`.

**Medido com `next start`** na porta 3110, contra o pacote de produção:

```
GET  /entrar                    -> 200   (controle)
GET  /exemplo/onboarding        -> 404
GET  /exemplo/inicio            -> 404
POST /exemplo/api-transcrever   -> 404   corpo de 0 bytes
GET  /exemplo/api-transcrever   -> 405   o Next recusa o método antes do corpo
```

O 405 por GET é comportamento do Next para rota que só exporta `POST`, e
acontece ANTES de qualquer código meu rodar. Ele revela que o caminho está
registrado — o mesmo que os manifestos já revelam.

**Se o Victor quiser zero:** a rota sai da bancada e o endpoint nasce
direto no lugar definitivo, quando o onboarding novo virar produção.

---

## DUVIDA-ONB-9 — A correção do resumo não tem destino em produção

**O que é.** O complemento de 20/09 trata "a correção do resumo" como a
segunda pergunta aberta do fluxo. Ela não existia: o resumo só tinha
"Voltar e revisar". Desenhei o bloco — *"Tem alguma coisa errada aí?"*,
campo aberto, áudio convidativo, botão "Guardar a correção".

**Ela não valida nada, de propósito.** É o cliente dizendo com as palavras
dele o que a gente entendeu errado. Não existe recusa possível ali.

**Na bancada ela vai para o `localStorage`**, como as outras respostas, e
**entra na mensagem do WhatsApp** de agendar os 30 minutos (cortada em 700
caracteres). Esse é o único caminho que hoje chega numa pessoa — deixar a
correção só no navegador seria perdê-la.

**Em produção ela não tem coluna.** Não é campo do negócio: é um recado
sobre o cadastro. As opções, e nenhuma é minha para escolher:

1. uma coluna de texto livre em `businesses` (simples, mas vira campo que
   ninguém lê);
2. uma tabela de recados do onboarding, com data e situação (resolvido ou
   não) — é o que dá para trabalhar;
3. não gravar, e mandar só no WhatsApp — que é o que a bancada faz.

**O que falta decidir:** qual das três, e quem lê. Um recado que ninguém
lê é pior que não perguntar, porque o cliente escreveu achando que alguém
ia ver.

---

## DUVIDA-ONB-10 — O `.env.example` está cinco nomes atrás do `.env.local`

**Medido em 20/09/2026** (só os NOMES; nenhum valor foi lido). Estão no
`.env.local` e **não** no `.env.example`:

- `OPENAI_API_KEY` — a transcrição
- `N8N_API_KEY`, `N8N_BASE_URL`
- `META_SYSTEM_USER_ACCESS_TOKEN`
- `V2G_OREGON_URL`, `V2G_OREGON_SERVICE_KEY`

E o caminho contrário: o `.env.example` tem seis `SUPABASE_SMTP_*` que o
`.env.local` não tem.

**Não mexi em nenhum dos dois.** O `.env.example` é contrato de deploy —
acrescentar nome ali é dizer que o produto passa a depender daquilo, e
essa é decisão do Victor. Registro para não envelhecer em silêncio.

