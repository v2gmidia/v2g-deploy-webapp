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
