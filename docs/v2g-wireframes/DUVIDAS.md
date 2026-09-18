# Dúvidas da sessão longa — Início canônico

Sessão de 15–16/09/2026. O Victor estava dormindo e a regra era **não
parar**: cada ambiguidade virou a escolha mais conservadora, registrada aqui
com o que muda se ele decidir diferente.

Cada uma tem marca no código: `/* DUVIDA-N */`.

---

## DUVIDA-1 — "Seu gestor pode retomar quando fizer sentido"

> **RESOLVIDA em 17/09/2026** — decisão do Victor de 16/09, registrada em
> `docs/decisoes.md`: "gestor" é a própria V2G, e a frase fica. A rodada 5
> passa a mostrar o apoio da fonte única no estado parado (ver DUVIDA-10).
> O texto abaixo é o raciocínio da época e fica como estava.

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

> **RESOLVIDA em 17/09/2026** — decisão do Victor de 16/09, registrada em
> `docs/decisoes.md`: "Voltar a anunciar" é a principal do parado,
> desabilitada com o motivo embaixo, como exceção deliberada à regra de
> omitir. "Falar com alguém" cai para secundária. O texto abaixo é o
> raciocínio da época e fica como estava.

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

> **RESOLVIDA em 17/09/2026** — decisão chegada no briefing da rodada 5,
> registrada em `docs/decisoes.md`: a trilha aparece uma vez na conclusão e
> some para sempre. O que ficou em aberto dessa decisão é a DUVIDA-11.

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

# Rodada 5 — 17/09/2026

Mesma regra: não parar, escolher o conservador, registrar o que muda se o
Victor decidir outra. Marcas no código: `DUVIDA-10` a `DUVIDA-13`.

---

## DUVIDA-10 — O apoio do estado parado volta a aparecer

**O que era.** A rodada 4 escondia a frase de apoio de `ja_foi_ao_ar`
("Ele saiu do ar e nenhuma verba está sendo gasta agora. Seu gestor pode
retomar quando fizer sentido.") por dois motivos: o "gestor" estava em
dúvida (DUVIDA-1), e "nenhuma verba está sendo gasta agora" parecia uma
afirmação sobre o presente sem fonte.

**Escolhido: mostrar, inteira, na faixa "onde estou", nos quatro
momentos.** O primeiro motivo caiu com a decisão de 16/09. O segundo não
se sustenta medido: `ja_foi_ao_ar` vem do backend a partir do status da
Meta (`status_na_plataforma: "PAUSED"`, medição de 11/09 no cabeçalho de
`lib/veiculacao/estado.ts`), e campanha pausada na Meta não gasta. A frase
é da fonte única, e a regra do produto é que a tela não traduz nem
esconde pedaço dela.

**Se o Victor decidir outra:** tirar a linha `<p className={css.apoio}>` de
`TelaCanonica.tsx`. Nenhuma lógica muda.

---

## DUVIDA-11 — O momento "acabou de concluir" não tem fonte

**O que era.** A decisão de 17/09 pede que a conclusão apareça **uma vez**.
`esteveNoAr()` responde "a preparação acabou?", mas não responde "o dono
já viu isso?" — e sem a segunda resposta não existe "uma vez": ou aparece
sempre (o placar que a decisão mata), ou nunca.

**Medido:** nenhuma das três fontes que o Início lê tem o dado. `veiculacao`
é um slug sem data (`lib/veiculacao/estado.ts:116`); `publicada_em` veio
`null` na única conta real (medição de 11/09); e `campaigns` tem zero
linhas. A rodada proíbe inventar campo e guardar no navegador.

**Escolhido: a tela recebe `mostrarConclusao`, que hoje só a bancada
liga.** Em `TelaCanonica.tsx` o momento é `concluiu` só se esteve no ar
**e** a cadeia está fechada **e** `mostrarConclusao` é verdadeiro. O
padrão é `false`. Em produção, sem fonte, a tela cairia direto no momento
de depois (sem trilha) — a conclusão nunca apareceria. Uma omissão, e não
o defeito de volta.

**O que o backend teria de mandar**, do mais barato ao mais completo:

1. `GET /negocios/{id}/execucao` incluir `foi_ao_ar_pela_primeira_vez_em`
   (timestamp). Sozinho, NÃO resolve "uma vez" — só permitiria uma janela
   de tempo ("nos primeiros N dias"), que é placar temporário, não uma
   vez. Serve de insumo para o item 2.
2. Um registro de que **o dono viu** a conclusão — por exemplo
   `conclusao_vista_em` em `businesses`, gravado por uma ação explícita
   do dono ("Entendi"). **Não** gravado ao renderizar: o Next faz prefetch
   de rota, e uma gravação no carregamento consumiria o momento sem
   ninguém ter olhado.

O item 2 é escrita nova no banco e botão novo — os dois exigem decisão, e
por isso a bancada **não** desenha o botão "Entendi" (seria botão para
capacidade que não existe).

**Se o Victor decidir outra:** a janela de tempo do item 1 é uma linha no
cálculo de `momento`, trocando `mostrarConclusao` por uma comparação de
datas. Registro aqui que ela contraria o texto da decisão.

---

## DUVIDA-12 — O texto da conclusão é desta rodada

**O que era.** O momento (b) precisa dizer que a preparação acabou e que
não vai aparecer de novo. Não há texto de produto para isso.

**Escrito nesta rodada, esperando o Gabriel:**
- título da faixa: "A preparação terminou"
- "Esta é a última vez que a preparação aparece aqui."
- "Daqui em diante, o Início mostra o que o anúncio está fazendo: quanto
  foi investido e quanto voltou para você."

Sem celebração, sem lima (lima é "no ar agora", e o selo do topo já é
lima nesse momento). As marcas das quatro fases são cobalto.

**Se o Gabriel escrever outro:** três strings em `TelaCanonica.tsx`.

Também desta rodada, e na mesma fila: o motivo do botão desabilitado —
"Este botão ainda não funciona por aqui. Enquanto isso, quem coloca seu
anúncio de volta para rodar é a equipe da V2G — é só chamar." — e o
rótulo "Enquanto rodou" da metade dos números no parado.

---

## DUVIDA-13 — A pergunta do dia só aparece com o anúncio no ar agora

> **ATUALIZADA em 17/09/2026, R5-b** — a pergunta saiu também do momento
> "concluiu" (achado da auditoria: a caixa dela era maior que a âncora e
> tinha o único botão, e a conclusão perdia a disputa). Hoje ela aparece
> só no `no-ar`, que é o Início de todo dia depois da conclusão.

**O que era.** A tela atual mostra a pergunta do dia sempre que há
execução. No parado, o "Guardar" dela seria uma segunda principal ao lado
de "Voltar a anunciar" — e a decisão de 16/09 faz de "Voltar a anunciar"
a principal.

**Escolhido: pergunta só quando `estaNoArAgora`.** Nos momentos (b) e (c)
ela é a única principal habilitada da tela (relatório do driver,
`botoesPrincipaisHabilitados: ["Guardar"]`).

**O que se perde, dito na cara:** venda que chega depois da pausa — de
quem viu o anúncio antes — não tem onde ser contada no Início parado.

**Se o Victor decidir outra:** tirar o `noArAgora &&` da condição do bloco
`<PerguntaDoDia>`. A tela passaria a ter duas principais no parado, uma
delas desabilitada; a hierarquia precisaria ser refeita.

---

# Rodada 5-b — 17/09/2026, depois da auditoria

---

## DUVIDA-14 — "Otimizar" na partição de produção

**O que era.** Achado B1: no concluiu a tela dizia "4 de 4" com "Otimizar
✓". A fonte é `PARTICAO` em `lib/estado/frases.ts`, que liga a fase
"Otimizar" à etapa `numeros` — fecha quando o primeiro número chega.

**Escolhido: consertar na bancada, não na partição.** A conclusão mostra só
as três fases que terminam (`FASE_CONTINUA = "otimizar"` em
`TelaCanonica.tsx`) e diz "A otimização começa agora, e não termina."
`lib/estado/frases.ts` é produção e é lido pela `/inicio` real; mudar a
partição muda o contador de lá também, e `conferir:inicio` §3 trava a
partição em seis etapas cobertas.

**O conserto da família, que não é desta sessão:** renomear a quarta fase
para o que a etapa `numeros` mede de fato ("Primeiros números") ou
separá-la da trilha de preparação. As duas mudam texto de produção.

**Se o Victor decidir outra:** tirar o filtro `fasesDaPreparacao` de
`TelaCanonica.tsx` volta às quatro fases.

---

## DUVIDA-15 — B2: a ação do parado, e onde discordo da auditoria

**O que a auditoria pediu.** Que a saída que funciona ("Falar com alguém")
seja a coisa óbvia da tela; hoje o desabilitado e a secundária têm o mesmo
peso, e o R$ 10,25 domina.

**O que foi consertado, medido no DOM (R5-b):**
- o R$ 10,25 saiu da âncora e foi para a grade, no tamanho dos outros
  números. Os maiores textos da tela agora: manchete 30px, os quatro
  números 24px — nenhum dinheiro acima da ação;
- a âncora do parado é só a ação, com 480px de largura; sobra dentro dela:
  **0px** nas três larguras (era 79 e 69);
- o motivo termina apontando para o botão de baixo: "É só chamar."

**Onde discordo, e por quê.** Vestir "Falar com alguém" de principal (cobalto
cheio) inverte a decisão do Victor de 16/09, registrada em `decisoes.md`:
"Voltar a anunciar" é a principal, "a saída humana cai para secundária". A
auditoria mesmo registra que a decisão manda isso. Com uma principal
desabilitada, **nenhuma** principal habilitada é o resultado direto da
decisão, e não um defeito de desenho que eu consiga consertar sem desfazê-la.

**O que muda se o Victor decidir outra:** trocar `cta ghost` por `cta` no
link "Falar com alguém" e `cta` por `cta ghost` no botão desabilitado —
duas classes em `TelaCanonica.tsx`. Fica registrado para ele decidir olhando
`r5b-pausado-*`.
