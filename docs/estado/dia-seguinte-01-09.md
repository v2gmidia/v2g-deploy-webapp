# O dia seguinte — a pergunta diária e a tela de resultado, em 01/09

Três lotes, na ordem pedida: a camada de dados, a `/inicio` lendo o
acumulado, e o card da pergunta. Base: `contrato-do-app-dia-seguinte.md`
(worktree `backend_v2g-a2`, fora deste repositório).

Nenhuma ação proibida foi executada — sem migration, sem `POST /cadastro`,
sem webhook do n8n, sem Meta, sem painel do Supabase, sem tocar nas páginas
legais. **O push falhou por permissão** (`piligrin00` sem escrita no repo),
e os commits estão prontos para o Victor empurrar.

---

## 0. Comece por aqui: o que falta para o loop diário estar completo

O loop **funciona** — o Victor testou os cinco caminhos com dado real e
todos passaram. O que falta abaixo não é conserto: é o que ainda não existe.

### 1. O DISPARADOR. É o que falta de verdade.

`GET /perguntas-pendentes` existe no backend e **nada o consome**. Sem ele,
o loop diário só acontece se o dono abrir o app por conta própria — e o
loop existe justamente para não depender disso.

O consumidor certo não é tela: é um **job diário** que lê a lista, ordenada
pelo maior silêncio, e dispara notificação. Push não existe do lado do
backend (o contrato diz por extenso), então falta o canal também.

**Enquanto não houver disparador, o loop está construído e mudo.**

### 2. FURO DE CONTINUIDADE: dia pulado é dia perdido

**Medido em 01/09.** O card pergunta sobre ONTEM, e só. `diaDeOntemEmSaoPaulo`
é fixo na `page.tsx` e na Server Action; o componente recebe **um** dia.

Consequência: se o dono ficar três dias sem abrir o app, os dias 1 e 2
**nunca são perguntados**. Não há tela que os alcance, e o backend não
guarda pergunta não respondida — o contrato é explícito: "só existe
resposta".

Isso não apareceu no teste porque o teste foi feito no mesmo dia. Aparece
no primeiro fim de semana.

Duas saídas, e nenhuma é minha para escolher:

- **o card pergunta o dia mais antigo em aberto**, não o de ontem. O
  `consolidado` já sabe quais dias têm resposta; o que falta é decidir até
  onde voltar (3 dias? a janela inteira?);
- **o disparador cobre isso** perguntando no dia certo, e a tela continua
  sendo só de ontem. Mas aí o furo existe enquanto o disparador não existir.

### 3. `respondeu_no_dia` ainda não é autoridade

Está lido, validado e conferido contra o eco (`respostaConfiavelSobre`),
mas quem decide o card é a `jaRespondeu` local. Não inverti no mesmo
movimento em que troquei o corpo da requisição — duas mudanças de
autoridade no mesmo commit tornam impossível saber qual quebrou.

A inversão é pequena e depende de o Victor confirmar que o eco bate na
prática.

### 4. `origem: "gestor"` não tem caminho no app

O contrato prevê a primeira resposta registrada à mão por um gestor, para o
cliente atendido FORA da plataforma — e diz que essa primeira resposta é a
"matrícula" que faz a varredura passar a cuidar dele. Nada no app faz isso.

### 5. Teto de valor: decisão adiada

O campo de receita aceita o que o dono digitar. O único limite é
`Number.isSafeInteger`, e ele não é decisão de produto — é recusar número
que o JavaScript não representa direito.

### 6. Nunca vi o card em tema claro

A verificação de tela foi toda em tema escuro. O `.botao-leve` usa `--line`,
`--surface` e `--ink-mute`, todos com valor nos dois temas, mas isso é
inferência, não medição.

---

## 1. O que foi construído

### A camada de dados — `lib/dia-seguinte/` e `lib/backend/dia-seguinte.ts`

Puro de um lado (tipos, validadores, montagem, máscara), `server-only` do
outro (as quatro chamadas). Mesmo padrão do `lib/nichos/`, e pelo mesmo
motivo: validador que nenhum conferidor alcança é validador em que ninguém
confia.

**As três regras do contrato viraram tipo:**

- **`null` nunca vira `0`.** O validador separa ausente (`null`) de tipo
  errado (reprova) de zero (passa como `0`);
- **centavos continuam centavos**, com o nome dizendo. O `dinheiro()` deste
  repositório recebe reais;
- **`Decimal` continua string** até exibir.

### A `/inicio` — o acumulado do NEGÓCIO, não da execução

A rota por execução responde "como está indo esta campanha"; a `/inicio`
diz "quanto eu já investi e quanto voltou", que é do negócio. Com duas
rodadas, a por execução esconderia a anterior.

**Os dois lados se comportam ao contrário no mesmo dia** — a métrica soma,
a resposta do dono não — e quem resolve é a rota. O front não refaz a
conta.

### O card — `PerguntaDoDia`

Duas perguntas respondíveis separadamente, "não sei" mandando `null` e
nunca `0`, máscara de moeda com teclado de banco, e o resumo que encolhe
para uma linha depois de respondido.

---

## 2. As decisões tomadas sozinho, e o porquê

**O card aparece nas DUAS telas da `/inicio`**, e não é redundância: a tela
de resultado só é alcançada com `temNumero`, que hoje só fica verdadeiro
quando o acumulado tem dado — que só existe depois de ele responder. Card
só lá seria porta trancada por dentro.

**Mandar os dois campos antes do merge por campo.** Era correto sob as duas
semânticas; mandar só o mexido era seguro apenas DEPOIS do merge. Trocado
quando o Victor confirmou o deploy.

**A leitura do consolidado deixou de bloquear a escrita** depois do merge:
omitir preserva, e recusar a resposta do cliente por uma leitura que falhou
seria cobrar dele um problema nosso.

**Respiro no `Guardar` em vez de trocar por `.cta`** — o card acabou de
sair da disputa com a manchete, e um botão cheio o devolveria para lá.

---

## 3. O que não deu certo, e o que custou

### O fuso era UTC, e o buraco era perda de dado

Não era formatação. Às 22h de Brasília o servidor está no dia seguinte; a
tela perguntaria sobre anteontem e a resposta iria para a chave
`(execução, dia)` de anteontem, **por cima** do que já estava lá. Um dia
inteiro de venda apagado.

Corrigido dos dois lados — e do lado do backend eram **seis** lugares, com
o `tzdata` entrando por acidente como transitiva do `psycopg`.

### `respondeu_hoje: null` derrubou a pergunta inteira

A Server Action consulta com `desde=ate=ontem`, janela que não contém hoje
— e aí o campo volta `null`. O validador exigia booleano, reprovava o corpo,
e a ação morria em "não consegui confirmar". **A pergunta nunca gravava.**

Achado **antes** do primeiro POST real, medindo a rota em vez de esperar o
teste.

### O card sumia sem deixar rastro

Não renderizou numa conta real com a rota provada por `curl` e o console
limpo. Os dois caminhos que zeram a execução são silenciosos, cada um por
um bom motivo — e juntos fazem "não tem campanha", "o backend está fora" e
"o `profile_id` não bate" virarem a mesma tela vazia.

**Foi defeito meu de desenho.** Corrigido: a `/inicio` loga a causa
separada, e `pnpm diagnostico:card` refaz os cinco passos no ambiente de
quem roda.

### `process.exit()` derrubava a suíte com tudo verde

Com sockets keep-alive abertos, o libuv caía no Windows e o processo saía
com 3221226505 **depois** de imprimir "TUDO CERTO". A suíte inteira
falharia com tudo passando — o pior falso alarme possível.

---

## 4. Como foi conferido

`pnpm conferir:dia-seguinte` — **110/110** com rede, 99 sem. Só GET: o
`POST` grava em produção com upsert e não tem desfazer, então o que se
confere é o CORPO que seria mandado.

**Os cinco caminhos na tela, com dado real, pelo Victor:** responder os
dois, corrigir só as vendas (receita sobreviveu), "não sei" na receita
(apagou só ela), "não sei" nos dois (recusou), e o resumo mostrando o valor
novo imediatamente.

**A máscara, tecla a tecla no navegador:** os cinco passos, o backspace
sobre o texto já formatado, e o campo limpo voltando a vazio.

---

## 5. Os commits, para o push

```
5bc34f2  Lote 1 — a camada de dados
dabc406  Lote 2 — a /inicio lê o acumulado
aa0831b  Lote 3 — o card da pergunta diária
c3463a7  fix — `respondeu_hoje: null` derrubava a pergunta
c3d41da  merge por campo — só vai o que o dono mexeu
3fd364a  fix — o card sumia sem deixar rastro
38800fa  o card fica depois de respondido, mas encolhe
5897076  máscara de moeda, Corrigir como botão, respiro no Guardar
```
