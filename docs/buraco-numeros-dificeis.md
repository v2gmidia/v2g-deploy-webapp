# O buraco dos números difíceis

**Medido em 19/08/2026**, ao tentar rodar o passo 6 do lote E
([`disparo-pipeline.md`](./disparo-pipeline.md) §13.4). Não é desenho: é
registro de um buraco que bloqueou um teste.

---

## 1. O buraco, em uma frase

**Um número marcado como difícil, que o cliente respondeu "não sei", não
tem nenhuma porta de volta no produto.** Nem para ele, nem para nós.

E como `montarCadastro` exige os seis, um cliente nessa situação **nunca
dispara o pipeline** — sem erro, sem pendência acionável, sem nada na tela
que diga o que falta acontecer.

## 2. As quatro portas, e por que nenhuma abre

Medido no negócio `V2G` (`a85c37a9`), que respondeu `naoSei: true` na
conta de lucro em 19/08/2026 19:56.

| porta | a regra | resultado |
|---|---|---|
| `/onboarding/contas` | `fechada = confirmado \|\| naoSei` (`Contas.tsx:29`) | "não sei" **fecha** a conta. Ela sai da fila e vira texto estático — *"Você não soube — a gente resolve na conversa."* Sem botão, sem desfazer. |
| `/meu-negocio` | `vazio && dificil → naoSabemos` (`revisao-cliente.ts:240`) | renderizado **sem `input`**, no bloco "O que a gente ainda não sabe" |
| `/conta` | o `FormNegocio` foi dissolvido no lote C (§8.7) | não existe mais |
| entrevista → extração → `/revisar-perfil` | existe em código | a entrevista é processo humano que **não roda ainda** |

`grep` confirma que as únicas escritas de `target_profit_per_customer` no
app são a C3 da `/onboarding/contas` (fechada) e a RPC do `/meu-negocio`
(sem entrada na tela).

## 3. Os dois documentos apontam um para o outro

Esta é a parte que interessa, porque explica como o buraco passou.

**`revisao-perfil-cliente.md` §8.4** decidiu, com razão, não pôr `input`
nos números difíceis:

> "Não é `input` porque um número chutado neste campo não fica marcado
> como chute: entra como `confirmado`, que é o nível mais alto da escala,
> e vira orçamento de campanha. **A coleta certa deles é o lote B**, com a
> conta que ele consegue responder."

**O lote B entregou a conta** — e deu a ela uma saída "não sei" que,
também com razão, fecha a pergunta:

> "'Não sei' FECHA a conta — ele respondeu, e a resposta foi que não sabe.
> Tratar como pendente devolveria a mesma pergunta e ele chutaria um
> número na segunda vez só para a tela parar de pedir."

**As duas metades estão certas isoladas. O par não tem fundo.** O lote C
delega ao B; o B tem uma saída que não volta para lugar nenhum. Ninguém
decidiu que "não sei" seria terminal — ele ficou terminal porque cada lado
confiou que o outro tinha a porta.

## 4. E ninguém decidiu que este campo seria só-leitura

`revisao-perfil-cliente.md` §8.4 diz, textualmente:

> "**O terceiro número difícil não está nesta tela.**
> `target_profit_per_customer` (lucro desejado por cliente) não é campo do
> catálogo de extração e não aparece aqui. Fica registrado para ninguém
> procurar."

**Isso deixou de ser verdade e o documento não sabe.** O lote B pôs o
campo em `lib/agentes/campos.ts` (é o que a migration 0016 foi alcançar).
A verificação de completude do `catalogo-cliente.ts` — que roda na
importação e quebra o build — **obrigou** alguém a dar uma apresentação a
ele. Ele ganhou `dificil: true` por analogia com os outros dois números, e
com isso caiu no balde só-leitura.

Ou seja: o campo chegou na tela **por um mecanismo**, não por uma decisão.
A verificação fez o trabalho dela (o campo não ficou invisível), e o
efeito colateral foi um campo obrigatório do `/cadastro` sem entrada.

## 5. O alcance — não é caso de borda, é o caminho principal

Três campos têm `dificil: true`:

| campo | tem porta de volta? |
|---|---|
| `avg_direct_cost` | **não** — mesmo beco |
| `target_profit_per_customer` | **não** — mesmo beco |
| `monthly_budget` | **sim** — a `/verba`, tela própria com a explicação |

E o enunciado do projeto diz que "não sei" é a resposta **esperada**:

> "três dos seis são números que o cliente não sabe de cabeça. Por isso os
> primeiros clientes passam por entrevista com uma pessoa."

Então o disparo do lote E, por conta própria, essencialmente **não sai**
para o cliente-alvo. O buraco não está na quina; está no meio da estrada.

## 6. A forma do conserto — proposta, não feita

A `/verba` é o contra-exemplo que mostra o caminho: ela também é um número
difícil, e tem porta porque **ganhou tela própria com a explicação**. Foi
o lote B que a criou, exatamente por isso (D2 do
`onboarding-expandido.md`).

O conserto menor que respeita as duas decisões:

> No bloco do que já fechou na `/onboarding/contas`, onde hoje está o
> texto estático *"Você não soube — a gente resolve na conversa"*, entra
> um caminho de volta que **o cliente escolhe** — *"Agora eu sei"*.

Isso **não contradiz o lote B**. A razão dele era a tela não *cobrar*:
reoferecer a pergunta faz a pessoa chutar para a tela parar de pedir. Um
caminho que ele clica por vontade própria não é a tela pedindo — é ele
voltando. São coisas diferentes, e a diferença é quem começou.

O mesmo vale para o `/meu-negocio`: o bloco "O que a gente ainda não
sabe" pode continuar sem `input` (a decisão do §8.4 está certa) **e**
oferecer o link para a conta que ele consegue responder.

**Não implementado.** É lote próprio, e é de B/C, não de E.

## 7. O padrão pode se repetir — procurar antes de fechar o conserto

Acrescentado a pedido do Victor em 19/08/2026, e é a parte deste documento
com mais chance de valer mais que o caso que o gerou.

**O buraco não veio de uma decisão errada. Veio de duas decisões certas que
se referenciam.** O lote C delegou ao B ("a coleta certa deles é o lote
B"); o lote B entregou a coleta com uma saída que não volta. Cada um
assumiu que o outro cobria o caso, e o caso caiu no vão.

Isso é uma **classe** de falha, não um episódio. Ela tem uma assinatura
reconhecível:

- um documento de lote diz *"isso é assunto do lote X"*
- o lote X trata do assunto, mas não exatamente daquele recorte
- nenhum dos dois está errado sozinho
- **nada falha** — o caso simplesmente não acontece, em silêncio

E é por isso que ela é difícil de ver: não há erro, não há log, não há
tela quebrada. Há um cliente que não dispara e uma pendência que não
aparece.

**Antes de fechar o lote do conserto, varrer os pares de referência
cruzada.** O jeito de achar é procurar as delegações — cada frase em
`docs/` que empurra um caso para outro lote — e, para cada uma, perguntar
não "o outro lote existe?" mas **"o outro lote cobre ESTE recorte, ou só o
assunto?"**.

Candidatos que já se veem daqui, e que ainda **não** foram verificados:

| delegação | o par a conferir |
|---|---|
| `perfil-empresa.md` §4 Fase 2 → "backend, quando o Gabriel puder" | o backend nunca leu `business_id`; a Fase 2 tem dono fora desta máquina |
| `revisao-perfil-cliente.md` §8.7 → `esvaziar` não alcança `narrativa_negocio`/`identidade_visual` | assimetria "registrada em vez de resolvida" — alguém corrige e não consegue apagar |
| `backend-integracao.md` §6.4 → "a decisão está pendente em `contrato-front.md` (D2)" | o D2 nunca foi respondido por escrito; o lote E decidiu na prática (Decisão 12) |
| `disparo-pipeline.md` §3 → `/processando` é o lote seguinte | verificar que o lote seguinte cobre os cinco pontos da §3.4, não só o `.from()` |
| `onboarding-expandido.md` §5.1 → três superfícies de pendência | o lote E achou que são **cinco** superfícies de disparo, não três — mesma família de erro |

O último é significativo: **o mesmo tipo de contagem incompleta já
aconteceu duas vezes neste projeto em dois dias.** Não é coincidência; é a
assinatura.

## 8. O que isto bloqueia agora

O passo 6 do lote E — o primeiro disparo real — não sai pela superfície
real enquanto isto existir, porque o negócio de teste é justamente um que
respondeu "não sei".

O desbloqueio usado, e por que é honesto, está em
[`disparo-pipeline.md`](./disparo-pipeline.md) §13.5.

---

## CONSERTADO em 21/08/2026

Nada acima foi alterado. O conserto seguiu a forma proposta no §6 e está
desenhado em [`lote-agora-eu-sei.md`](./lote-agora-eu-sei.md).

O que foi feito:

- **"Agora eu sei"** na `/onboarding/contas`, no bloco do que já fechou,
  só no estado `nao_sei`. Ele reabre a conta e a pergunta volta para a fila.
- **A reabertura não apaga o "não sei"** — acrescenta `reabertoEm` ao lado
  dele. A hora em que o cliente disse que não sabia continua legível, que é
  o que faz o `/inicio` trocar de dono no dia 5.
- **`lerConta` ganhou o estado `reaberta`**, e não reaproveitou
  `nao_perguntado`: perguntaram, ele não soube, e ele voltou — três fatos.
- **A `/meu-negocio` aponta para a conta.** Continua sem `input` (a decisão
  do §8.4 do `revisao-perfil-cliente.md` está certa e não mudou), mas cada
  campo difícil vazio agora leva à tela onde a pergunta existe numa forma
  respondível. O destino mora no catálogo (`ondeResponder`), não num `if`
  no `page.tsx`.
- **A armadilha ficou fechada por verificação, não por lembrete.**
  `catalogo-cliente.ts` recusa importar se algum campo `dificil` não
  disser `ondeResponder`. O §7 deste documento diz que a classe de falha se
  repete; um campo difícil novo daqui a três meses não vai depender de
  alguém lembrar deste documento.

Conferido em `pnpm conferir:cadastro` §6 e §7 — 12 conferências, os dois
lados de cada transição. Base explícita: com a leitura de `reabertoEm`
desligada, o §6 acusa **3 falhas**.

### O que este conserto NÃO resolveu

- **O §7 continua aberto.** A varredura dos pares de referência cruzada
  (cinco candidatos listados lá) não foi feita. O que este lote fez foi
  fechar o caso que gerou o documento e pôr uma trava para o caso análogo
  do mesmo campo — não varrer as outras delegações.
- **Nenhum cliente reabriu nada.** O caso vivo no banco é o negócio `V2G`,
  que respondeu "não sei" em 19/08 e teve a coluna preenchida depois — ou
  seja, hoje ele lê `respondida`, e o botão não aparece para ninguém. O
  conserto está conferido por fixture, não por uso.
- **A `/verba` já tinha porta** e não foi tocada. Ela ganhou só a entrada
  no catálogo, para a `/meu-negocio` poder apontar para ela.
