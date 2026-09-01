# Decisões — o canal humano → sessões

Decisões de produto e arquitetura tomadas **fora do Claude Code** (no chat, em
conversa entre os sócios, ou sozinho). Toda sessão lê este arquivo antes de
começar um lote.

**Precedência:** este arquivo vence qualquer briefing colado num prompt. Se um
prompt contradiz uma decisão registrada aqui, diga a contradição antes de
escrever código.

**Formato:** uma entrada por decisão, mais nova em cima. Registre o que foi
decidido, quem decidiu, e — quando houver — o que foi descartado e por quê.
Decisão sem data não vale; decisão sem motivo é ordem, não decisão.

---

## Em aberto — dependem de decisão humana

<!--
Sessões: quando esbarrarem numa decisão que não é de vocês, acrescentem aqui
em vez de escolher sozinhas. Removam a linha quando a decisão for registrada
na seção de baixo.
-->

- [ ] **Trava de completude do cadastro: 6 campos ou 11?** O app conta 6, o
      backend exige 11 no modo `gerar`. Subir para 11 pode barrar cliente que
      hoje passa. — levantado em 22/08
- [ ] **`origem_criativo` está cravado em `lib/cadastro/montar.ts`.** Trocar por
      valor vindo do payload exige acrescentar pergunta ao onboarding, o que é
      mudança de produto. — levantado em 22/08
- [ ] **`.side-support`: card de vidro sobre cobalto ou card claro?** Muda
      aparência em 9 telas e bloqueia uma linha do `conferir:cascata`. —
      levantado em 21/08

---

## Decididas

### 2026-09-01 — A pergunta é sobre ONTEM, no fuso `America/Sao_Paulo`
**Decisão (Victor):** o dono responde sobre o dia que fechou. "Perguntar
sobre hoje às 10h da manhã não faz sentido." Fuso `America/Sao_Paulo`.

**Por que o fuso é regra e não detalhe:** a Vercel roda em UTC. Das 21h à
meia-noite de Brasília o servidor já está no dia seguinte — três horas por
dia em que "ontem" calculado no fuso do servidor é o dia errado.

**O estrago seria concreto:** às 22h o dono abre o app, a tela pergunta
sobre anteontem, e a resposta vai para a chave `(execução, dia)` de
anteontem — **por cima** do que ele já tinha respondido, porque a escrita é
upsert. Um dia inteiro de venda apagado por causa de fuso.

**Registro:** `lib/dia-seguinte/dia.ts`, com aritmética de calendário (e não
`agora - 24h`, que erraria na virada de horário de verão). Conferências em
`conferir:dia-seguinte` §3.3, inclusive o caso das 22h.

**`jaRespondeu(consolidado, dia)` é a AUTORIDADE; `respondeu_hoje` é
conferência cruzada** — até o backend confirmar que conta em São Paulo.

---

### 2026-09-01 — Duas fontes para "quanto investiu": dívida registrada
**Não é para consertar agora, mas é para estar escrito.**

A `/inicio` tinha uma tela de resultado alimentada por `metrics_daily`
(Supabase, local). O acumulado do backend responde a mesma pergunta — e
mais: ele traz o lado do DONO (quantas viraram venda, quanto entrou), que a
`metrics_daily` nunca vai ter.

**Medido em 01/09/2026: `metrics_daily` tem ZERO linhas, e `campaigns`
também.** A tela de resultado era, portanto, **inalcançável** —
`temNumero` era `spend > 0`. O conflito é de desenho, não visível.

**O que foi feito:** `temNumero` passa a considerar o acumulado também, com
`||` — a fonte antiga continua viva em vez de ser arrancada. Se a
`metrics_daily` receber linha um dia, ela conta.

**O que fica aberto:** quem é a fonte quando as duas tiverem dado. O
palpite é que o backend vence — é ele quem coleta da Meta quando o App
Review sair, e o mesmo endpoint passa a devolver
`tem_dado_da_plataforma: true` sem mudança de contrato. Mas isso não foi
decidido, e `/vendas` também lê `metrics_daily`.

---

### 2026-09-01 — O que falta para o loop diário funcionar sozinho: um DISPARADOR
**Decisão (Victor):** `GET /perguntas-pendentes` **não vira tela.**

**O motivo:** ela é a peça que faz a pergunta diária ACONTECER SOZINHA. Se
virar lista que alguém abre, o produto volta a depender de o dono lembrar de
responder — e o loop existe justamente para não depender disso.

**O consumidor certo não é tela nenhuma: é um job diário** que lê a lista,
ordenada pelo maior silêncio, e dispara notificação. **Esse disparador não
existe** — o contrato do backend diz por extenso que push não existe do lado
de lá — e não era trabalho deste lote.

**É esta a peça que falta, e ela tem nome.** Enquanto não houver disparador,
o loop diário está construído e mudo: o cliente só responde se abrir o app
por conta própria.

**Se alguém quiser uma tela de operador enquanto isso, tudo bem — mas como
MULETA DECLARADA, não como o desenho.** Uma muleta que não se declara vira
o desenho por omissão.

**O `nivel` (pergunta → cobrança → oferta de ajuda) é do disparador, não da
tela.** A `/inicio` mostra a pergunta e pronto; ela não precisa saber o
nível, e buscar a lista inteira para descobrir o de um cliente seria errado
já com 300 negócios.

---

### 2026-09-01 — A soma do acumulado: os dois lados se comportam ao contrário
**Achado do backend, registrado aqui porque o front não pode "consertar".**

No mesmo dia, com duas execuções:

- a **métrica da plataforma SOMA** — duas campanhas no ar gastaram as duas;
- a **resposta do dono NÃO SOMA** — ele responde "quantas vendas hoje" uma
  vez por execução, sobre o **mesmo fato do mundo**.

Somar os dois dobraria a receita. E o erro **superestima o retorno**, que é
o lado errado para errar quando o número na tela é "voltou R$ X" — um
retorno inflado faz o cliente manter uma campanha que não está pagando.

**Quem resolve é a rota**, `GET /negocios/{id}/consolidado`: uma resposta por
dia, execução mais recente vence. **O front não refaz essa conta.**

**`dias_com_resposta_de_mais_de_uma_execucao > 0` é defeito de FLUXO, não de
soma** — significa que a varredura perguntou duas vezes ao mesmo dono no
mesmo dia. A soma continua certa; o que está errado é ter perguntado duas
vezes. Vai para diagnóstico (`conferir:dia-seguinte` §4 tem a conferência),
**nunca** para a tela do cliente: ele não tem o que fazer com isso, e o
problema é nosso.

---

### 2026-09-01 — `respondeu_hoje` não decide o card sozinho
**Contexto:** pedido ao backend para resolver "devo mostrar o card de
pergunta para este cliente agora?". Ele existe e chega nas duas rotas de
consolidado.

**Resolve, com duas ressalvas que precisam ser fechadas com o backend:**

1. **"Hoje" é o fuso de quem?** Se o backend contar em UTC, às 21h de
   Brasília já é o dia seguinte lá — e o card reapareceria para um dia que o
   cliente acabou de responder;
2. **a pergunta costuma ser sobre ONTEM.** O contrato diz que `dia` é "o dia
   a que a resposta SE REFERE". Se a tela pergunta "quantas vendas ontem?",
   um booleano preso a "hoje" responde outra pergunta.

**Enquanto isso não estiver pinado, quem decide o card é
`jaRespondeu(consolidado, dia)`** (`lib/dia-seguinte/resposta.ts`), que
pergunta pelo DIA que a tela vai perguntar e lê os campos do dono — não a
presença do dia na lista, que vai deixar de servir quando o coletor da Meta
ligar e dias aparecerem só com investimento.

`respondeu_hoje` fica como **conferência cruzada**. Divergência entre os
dois é sinal, não empate.

---

### 2026-08-25 — O piso da verba sobe de R$ 150 para R$ 750/mês
**Decisão:** `PISO_MENSAL_DA_CASA = 750` (R$ 25/dia).

**A razão mudou, e é isso que importa registrar.** Não foi um número
corrigido; foi outra pergunta sendo respondida.

Em 20/08 a pergunta era **quem a gente consegue atender**. R$ 300 foi
descartado por "excluir quem quer testar com pouco, que é justamente o
nosso público" (`docs/qa3-telas-isoladas.md` §2), e R$ 150 ganhou como
freio contra o impossível e contra o erro de digitação.

Em 25/08 a pergunta virou **quem consegue ter resultado**. Com verba de
R$ 150 e assinatura de R$ 490, a ferramenta é **76% do gasto total** do
cliente: ele veicula R$ 300 em dois meses tendo pago R$ 1.280, não vê
resultado, e cancela. Com R$ 750 a assinatura cai para **40%** do gasto.

Quem entra abaixo disso não é cliente que a gente perdeu — é cliente que ia
cancelar em dois meses achando que o produto não funciona.

**Isto não invalida a decisão de 20/08**, e as duas ficam nos autos: aquela
respondeu bem a pergunta que tinha. O `qa3-telas-isoladas.md` §2 recebeu um
ponteiro para cá, para os dois documentos não se contradizerem em silêncio.

**Registro:** `lib/verba/limites.ts:43` e o bloco de comentário em cima
dele; casos de corte em `scripts/conferir-verba.ts` §2.1, incluindo um caso
novo — R$ 150 **recusado** — que existe para pegar reversão acidental da
constante.

---

### 2026-08-25 — Verba abaixo do piso vinda da entrevista NÃO é defeito
**Registrado para não parecer bug depois.**

Enquanto o roteiro do onboarding não pedir R$ 750 como piso **na conversa**,
o caminho normal da entrevista vai gerar verba abaixo do piso com alguma
frequência. Não é falha do agente nem do extrator: o agente extrai o que o
cliente disse, e **o cliente não sabe do piso** — ninguém contou para ele.

São os dois lados chegando na mesma regra por caminhos diferentes, e em
velocidades diferentes. O webapp já sabe do piso; a conversa ainda não.

**O que acontece, e é o comportamento certo:** o valor é gravado (a resposta
dele não se perde), o cadastro não fecha, e a `/inicio` cobra a diferença
com os dois números — o dele e o nosso.

**O conserto de verdade é do roteiro, não do código:** a conversa passa a
dizer o piso antes de perguntar quanto ele pode investir. Até lá, cada uma
dessas linhas é uma pessoa que precisa ser avisada, não um erro para
investigar.

---

### 2026-08-25 — Dívida conhecida: a regra do piso mora numa camada que nem todo caminho atravessa
**Não é para consertar agora.** É para estar escrito antes de morder.

**Medido em 25/08 contra o `/openapi.json` ao vivo:** o `POST /cadastro` do
backend aceita `orcamento_mensal_disponivel` com `exclusiveMinimum: 0.0` —
qualquer valor acima de zero. O mesmo vale em `DadosDoOnboarding` e na
entrada do `diagnosticar-orcamento`. **O piso de R$ 750 é regra só do
webapp**, e o nome da constante sempre disse isso ("da casa").

Isso vale hoje porque, na prática, só o webapp escreve. Mas **o n8n chama o
backend direto**, e a `escrever_apenas_se_livre` (migration `0019`) não tem
nenhum chamador TypeScript neste repositório — ela é chamada de fora. Ou
seja: a regra de negócio mora numa camada que nem todo caminho atravessa.

**A consequência concreta, medida:** a trava de completude
(`lib/cadastro/montar.ts:402`) confere `verba > 0`, **não o piso**. Uma
verba de R$ 200 escrita por fora fecha o cadastro, e o `dispararSeCompleto()`
manda o pipeline rodar com um valor que a `/verba` teria recusado na cara do
cliente.

**O que foi feito em 25/08, e o que continua aberto.** A trava de
completude passou a conferir o piso (`lib/cadastro/montar.ts`), e ela é a
única camada que fecha o caminho do n8n **sem tocar no backend** — porque o
disparo é nosso. Uma verba abaixo do piso escrita por fora agora impede o
`dispararSeCompleto()`.

Isso **não** impede a escrita, só o disparo. O valor entra no banco e fica
lá até alguém corrigir.

**O piso dentro da função do banco continua como dívida, e não decidi
sozinho.** Ele fecharia o n8n de verdade — seria a única camada que todo
caminho atravessa. Contra: é regra de negócio dentro do SQL, e o número
passaria a viver em dois lugares que precisam concordar (a constante do
TypeScript e o literal do plpgsql), que é exatamente a forma de defeito que
o `lib/verba/limites.ts` existe para não ter. Além de ser migration contra
banco real, que exige autorização humana.

**Medição de 25/08, para dimensionar:** das quatro linhas de `businesses`,
**nenhuma real** cai na faixa afetada. A única entre R$ 150 e R$ 750 é a
`a0328fb8` (Padaria Dona Zilda), que tem `dados_ficticios = true` e é
barrada antes do disparo. A V2G (`a85c37a9`) tem R$ 2.000 e `enviado`. As
outras duas não têm verba.

### 2026-08-23 — `businesses.niche` guarda o identificador, não o rótulo
**Decisão:** a coluna passa a guardar `clinica-odontologica`; "Dentista" fica
para a tela. As duas telas mostram rótulo e validam contra a mesma lista viva.
**Motivo:** o rótulo é do backend e pode mudar — mexer no `nome_exibicao` do
`knowledge/` deixaria toda linha antiga com o texto velho, sem nada contando
que ficou. E é o identificador que escolhe o documento do nicho no pipeline.
**Por que agora:** medido no banco antes de escrever código — **zero linhas
tinham rótulo válido** (as três com valor tinham `Clínica / Consultório`, que
nunca foi nicho, e `padaria`, fictícia). Depois de semanas gravando rótulo, a
mesma inversão custaria uma migration com mapa escrito à mão.
**NÃO houve migração de dado, e não deve haver:** o mapa rótulo→identificador
só existe na lista viva. Cravá-lo numa migration recria a lista paralela que o
lote do seletor existiu para matar. As linhas antigas se consertam quando um
humano tocar no campo pela `/meu-negocio`.
**Registro:** `lib/nichos/gravado.ts`, `conferir:nichos` §§2.1/8/10, e
`docs/estado/nicho-identificador-23-08.md`.

### 2026-08-23 — Nicho não reconhecido não ganha "tá certo"
**Decisão (Victor):** na `/meu-negocio`, valor de ramo que a lista viva não
reconhece continua na lista principal, mostrando o valor, com uma linha
explicando e um único botão — "escolher na lista". O "tá certo" some.
**Motivo:** confirmar carimbaria procedência `confirmado`, o nível mais alto
da escala, num valor que o pipeline não consegue usar. O cliente ficaria com a
sensação de ter resolvido e o dado continuaria mudo.
**Descartado:** mandar o campo para a seção "o que a gente ainda não sabe" —
ela é a seção do campo VAZIO, e dizer que não sabemos sobre um campo
preenchido é impreciso. E manter o "tá certo", pelo motivo acima.
**Não é erro, e a tela não trata como erro:** em `--fs-corpo` e `--ink`, nunca
em `--crit`. Quem tem "Clínica / Consultório" respondeu de boa-fé um
onboarding que oferecia aquilo. Nada mais na tela trava.

### 2026-08-22 — A reserva de nicho sai; sobra o texto livre
**Decisão:** com o `GET /nichos` fora, a tela não mostra chip nenhum. Só o
campo de texto, mais uma linha dizendo que a lista não carregou.
**Motivo (Victor):** *"quando o catálogo está fora, a verdade é que não
sabemos o nicho. Gravar a frase da pessoa como confirmado é honesto; gravar
um dos cinco chips fixos é palpite com cara de escolha do cliente."* É o
mesmo princípio do `padaria` não achar nada: não inventamos o vizinho mais
próximo, admitimos que não temos.
**Descartado:** manter a reserva marcando a escolha como `aproximacao` — a
decisão de algumas horas antes, revertida abaixo. E travar a pergunta com
um recado de indisponível, que seria hostil: trava o onboarding por causa
de um endpoint de catálogo.
**A linha na tela é parte da decisão, não enfeite:** "escreva do seu jeito"
sozinho parece que nunca houve lista, e a pessoa conclui que o produto é
assim. Dizer que a lista não carregou é a diferença entre uma falha nossa e
uma limitação nossa.
**Registro:** `lib/nichos/escolha.ts`, o comentário da pergunta `ramo` em
`perguntas.ts`, e o estado degradado em `Chat.tsx`. Conferências em
`conferir:nichos` §8 — inclusive uma que impede a pergunta `ramo` de voltar
a ter opção fixa.

### 2026-08-22 — `aproximacao`: REVERTIDA no mesmo dia
**Decisão original:** marcar como `aproximacao` a escolha feita nos chips de
reserva, com a migration `0021` alargando o domínio de procedência.
**Revertida** pela decisão acima, algumas horas depois: sem reserva, não há
o que marcar. A migration `0021` foi apagada antes de ser aplicada, e o
parâmetro `p_origem` saiu do `lib/cadastro/procedencia.ts`.
**Fica registrado porque a ideia era boa e pode voltar:** se um dia existir
uma fonte de nicho que seja palpite legítimo — extração de site, por
exemplo — o desenho está descrito aqui. E fica a observação que valia:
`aproximacao` ficaria **abaixo** de `confirmado` sem ninguém programar isso,
porque as travas da `0013` e da `0019` comparam com o literal `'confirmado'`.
**O que sobrou dela:** nada no código. `confirmar_campo_do_cliente` continua
com a assinatura de cinco argumentos da `0016`.

### 2026-08-22 — Cache da lista de nichos: fora de escopo
**Decisão:** não cachear. A medição não justifica.
**A medição:** `GET /nichos` responde em **17 ms de mediana** (60 ms a
frio), 3,8 KB, dez nichos. A busca é feita no servidor e a lista já vai
dentro do HTML: TTFB de **36–50 ms** quente, HTML completo 3 ms depois,
com os dez chips **e** o campo de busca presentes na primeira pintura.
Não há atraso perceptível para cachear.
**O que seria feito se um dia valer:** cache manual em memória com TTL
curto — não `unstable_cache`, para a invalidação ficar uma linha legível.
E a regra que vem junto: **vencido o TTL sem resposta do backend, entra a
reserva, nunca o valor velho** — senão vira o fallback estático que o
handoff §10 proíbe, que é a lista paralela envelhecendo em silêncio.
**Registro:** `lib/backend/nichos.ts`, no ponto onde se implementaria;
medição em `docs/estado/seletor-de-nicho-22-08.md` §2.

### 2026-08-22 — Cartão do herói da LP: marcar como exemplo
**Decisão:** manter os números e o nome, acrescentando a tarja
`EXEMPLO — tela de demonstração, não é resultado de cliente` como primeiro
elemento do cartão.
**Descartado:** remover o cartão (perderia a prova visual) e inventar número
novo (afirmação falsa numa página de vendas no ar).
**Registro:** commit `df19ec0` na LP, detalhe em `lp/docs/prova-social-e-legibilidade.md` §7.1.
