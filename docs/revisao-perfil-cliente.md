# Revisão do perfil pelo cliente — desenho

**Nada implementado.** Este documento é para aprovação.

A tela onde o cliente vê o que a V2G entendeu do negócio dele e confirma ou
corrige. É o único lugar do sistema que produz a procedência `confirmado` —
nível que existe desde a 0010 e que nunca foi exercitado, porque ninguém
nunca teve onde confirmar nada.

Complementa `docs/perfil-empresa.md` (o que o perfil guarda) e
`docs/extracao-perfil.md` (como ele é preenchido). Este responde *como o dono
do negócio confere o que ficou gravado sobre ele*.

---

## 0. Onde eu discordo do enunciado

O pedido oferece duas opções de lugar: aba Conta, ou **tela própria de fluxo,
uma vez, logo após o onboarding**. A segunda não é uma escolha ruim — ela é
impossível na sequência que existe hoje, e vale dizer por quê antes de
escolher.

No momento em que o onboarding termina não existe perfil para revisar. O
percurso real é:

```
cadastro → onboarding (chat, 4 perguntas) → …dias… → entrevista com uma
pessoa → extração → revisão do operador → aplicar → PERFIL
```

A entrevista acontece depois, com gente, em outro dia. Uma tela de fluxo
pendurada na saída do onboarding mostraria as quatro respostas do chat e mais
nada — e chamaria isso de "o que a gente entendeu do seu negócio", que é falso
na primeira frase.

Existe um momento certo, e ele não é o onboarding: é **quando o operador
aplica a proposta**. Mas transformar esse momento num portão de fluxo esbarra
no segundo problema, que é o mais forte:

**Uma tela de fluxo é de passagem única, e este lote inteiro parte da premissa
de que ele revisa três campos e sai.** O próprio enunciado diz isso, e diz
certo. Se a tela é de passagem única, os 21 campos restantes nunca mais têm
onde ser confirmados — e a pergunta "o que fazer com o campo que ele não
olhou" deixa de ter resposta possível: a resposta seria "nada, para sempre".

Então: **rota revisitável, dentro do app.** O detalhe de onde, no §1.

---

## 1. Onde fica

**Rota própria, `/meu-negocio`, dentro de `(protected)`, alcançada pela
Conta.** Não é uma seção dentro da `/conta`, e não é um sexto item de menu.

**Por que não uma seção da `/conta`.** A `/conta` já tem oito seções (plano,
dados do negócio, identidade, página do Facebook, aparência, verba, perfil,
assinatura). Enfiar 24 campos com duas ações cada no meio disso faz a tela
mais longa do app dobrar de tamanho — e põe uma revisão que precisa de
enquadramento no mesmo rolo do seletor de tema. `padrao-visual.md` §5 já
escreveu o que a `/conta` é: *"tela de ajuste: o cliente chega sabendo o que
veio fazer"*. Aqui é o contrário — ele chega sem saber que isso existe, e a
primeira coisa que a tela faz é explicar por que ela existe.

**Por que não um item de menu.** São cinco (Início, Vendas, Anúncios, Avisos,
Conta) e essa contagem é uma decisão do produto. Uma tela que a pessoa visita
duas ou três vezes na vida não compra uma linha permanente de navegação.

**Por que rota e não modal.** Precisa sobreviver a fechar a aba, ser linkável
de um aviso quando o lote F existir, e ser encontrada de novo seis meses
depois. Modal não é nenhuma das três.

**A porta de entrada.** Um card na `/conta`, na posição onde hoje está "Dados
do seu negócio" — ver o §2, que é onde essa posição fica complicada.

**O que NÃO existe ainda, e eu não vou fingir que existe:** nenhum aviso, push
ou e-mail leva o cliente até lá. Hoje a única forma de chegar é abrir a Conta
e ver o card. Ligar isso a `decisions` (a tabela dos Avisos) é lote E/F, não
este. Se a tela ficar pronta e ninguém for avisado dela, o número de campos
`confirmado` continua zero — e isso é limitação conhecida, não bug.

---

## 2. O conflito que este lote encontra: a `/conta` já grava cinco desses campos

Isto não estava no enunciado e é a coisa mais séria que a leitura achou.

`app/(protected)/conta/Formularios.tsx` → `salvarNegocioAction` grava hoje,
com o cliente logado e sob RLS:

```
name · niche · city · radius_km · avg_ticket_min · avg_ticket_max · monthly_budget
```

Cinco desses — `niche`, `city`, `avg_ticket_min`, `avg_ticket_max`,
`monthly_budget` — são campos do catálogo de extração
(`lib/agentes/campos.ts`). E **nenhum deles registra procedência**.

O estado que isso produz, hoje, sem tela nova nenhuma:

1. o operador aplica a proposta → `avg_ticket_min = 80`,
   `procedencia.avg_ticket_min = {origem: "extraido", entrevista_id: X}`
2. o cliente abre a Conta e corrige para 120
3. o perfil passa a dizer **120 com origem `extraido` da entrevista X**

O valor é do cliente e o registro diz que veio do agente. Não é um campo
desatualizado: é um campo que **afirma uma origem falsa**. E a consequência é
mecânica, não estética — `procedencia_do_campo()` devolve `extraido`, a trava
da 0013 não dispara, e a próxima proposta aceita em `aceito` sobrescreve o
número que o dono digitou.

Isso vale hoje, antes deste lote. A tela nova não cria o problema, mas ela
torna impossível ignorá-lo: seriam duas telas gravando as mesmas colunas com
regras diferentes.

### Duas saídas. **Aprovada a (a)**, e ela foi além do que eu tinha proposto.

**(a) A `/conta` perde os quatro campos de perfil.** `FormNegocio` fica com
`nome` e `raio` — os dois que não saem de conversa nenhuma e não têm entrada
no catálogo — e ganha um link para `/meu-negocio`. Segmento, cidade, ticket e
limite passam a se editar num lugar só, com procedência.

> **Correção na aprovação:** formulário de dois campos parece resto de algo
> maior. `nome` e `raio` vão **também** para a `/meu-negocio`, e o
> `FormNegocio` deixa de existir — a seção "Dados do seu negócio" da `/conta`
> vira uma linha na lista, apontando para lá. Os dois entram na lista branca
> da 0015 e ganham procedência como qualquer outro campo: procedência num
> campo que ninguém extrai é inofensiva (só registra que o dono disse), e o
> ganho é não sobrar nenhum segundo caminho de escrita.

A favor: uma coluna, um lugar de escrita, uma regra. E a tela nova explica
cada número na linguagem do cliente, coisa que o formulário da Conta nunca
fez.

Contra: a copy do limite mensal (a explicação de que o Facebook gasta até 25%
a mais num dia e compensa depois) é boa e precisa **migrar junto**, não
sumir. Fica anotado como parte do trabalho, não como detalhe.

**(b) A `/conta` continua como está e passa a registrar procedência.** Menor
raio de mudança, mas exige detecção de campo alterado: o formulário submete
tudo a cada salvamento, então marcar `confirmado` em tudo carimbaria como "o
cliente conferiu" cinco campos que ele não olhou — fabricar confirmação é o
pior defeito possível justamente nesta feature. Daria para comparar com o
valor atual antes de gravar, mas é mais máquina que (a), e no fim continuam
duas telas editando a mesma coluna com duas copies diferentes.

**Se você preferir raio zero de mudança na `/conta`**, a terceira saída é
deixar como está e escrever o defeito num comentário. Não recomendo: um
defeito que corrompe procedência dentro do lote que inaugura a procedência
confirmada é o pior momento possível para adiar.

---

## 3. O que ele vê

### 3.1 O que sai da tela

- **Nome de coluna.** O operador vê `businesses.avg_ticket_min` porque ele
  precisa saber onde grava. O cliente não. Some.
- **O trecho da transcrição.** Some, e este merece argumento porque
  `extracao-perfil.md` §10 previu o contrário ("o mesmo componente de lado a
  lado, com a transcrição substituída por 'foi isso que você nos contou'").
  Previsão registrada e não cumprida: o trecho é a prova do operador porque o
  trabalho dele é **verificar**. O trabalho do cliente é **reconhecer** — ele
  sabe o próprio ticket sem precisar reler que foi ele quem disse. E o trecho
  é a transcrição automática da fala dele: desconjuntada, com muleta e
  repetição, às vezes constrangedora. Devolver isso na cara de quem falou é um
  custo sem contrapartida.
- **`confianca` (`explicito`/`inferido`).** Some. É a informação que diz ao
  operador onde olhar com pressa. Para o cliente é uma nota interna sobre a
  qualidade do palpite que a V2G deu do negócio dele.
- **Estado da proposta, tokens, modelo, versão do prompt.** Somem.

### 3.2 O que a tela lê

As três tabelas do perfil e mais nada:

```
businesses            (id, os 17 campos do catálogo, procedencia)
narrativa_negocio     (5 campos, procedencia)
identidade_visual     (2 campos, procedencia)
entrevistas           (realizada_em — só a data, para a frase de abertura)
```

**A tela não lê `propostas_de_perfil` nem `itens_da_proposta`.** As duas têm
RLS ligada e nenhuma política para `authenticated` — e é assim que deve
continuar. `extracao-perfil.md` §2 previu abrir uma política de `select` para
o cliente quando esta tela chegasse; **essa política não é mais necessária, e
eu proponho não criá-la.** Tudo que a tela precisa já está na coluna
`procedencia`: a 0013 grava `entrevista_id` e `proposta_id` no `extra` de cada
campo. Uma política a menos é uma superfície a menos, e a proposta é o palpite
do agente antes da revisão — o cliente não tem o que fazer com ela.

Consequência boa disso: **toda a leitura da tela roda com o cliente do próprio
usuário, sob RLS.** O `service_role` só aparece no caminho de escrita (§7).

### 3.3 A ordem dos blocos — números primeiro

O enunciado diz que ele vai revisar os três primeiros e sair. Aceitando isso
como fato em vez de tentar corrigi-lo, a decisão de ordem se resolve sozinha:
**os três primeiros têm que ser os três números.**

| # | Bloco | Campos |
|---|---|---|
| 1 | **Seus números** | ticket (min+max), custo direto por venda, orçamento mensal |
| 2 | **O que você vende** | ramo, o que faz, diferenciais, garantia, formas de pagamento, prazo |
| 3 | **Onde e quando** | cidade, CEP, atende só no local, horário, disponibilidade |
| 4 | **Como a gente fala de você** | quem somos, história, por que existe, para quem, o que não fazemos, tom de voz, observações |
| 5 | **Seus links** | site, Instagram |

Os números vêm primeiro pelo mesmo motivo pelo qual eles têm regra dura na
extração (`extracao-perfil.md` §5): errado neles é dinheiro gasto errado, e o
erro não parece erro. O bloco 4 vem depois de propósito — é o mais longo, o
mais agradável de ler e o de menor consequência se ficar sem conferir.

### 3.4 Os rótulos, em português de dono de padaria

| Coluna | O que o operador lê | O que o cliente lê |
|---|---|---|
| `avg_ticket_min` + `avg_ticket_max` | Ticket médio (mín/máx) | **Quanto uma venda costuma dar** |
| `avg_direct_cost` | Custo direto por venda | **Quanto sai do seu bolso em cada venda** |
| `monthly_budget` | Orçamento mensal de anúncio | **Quanto você quer investir por mês** |
| `niche` | Ramo | **O que é o seu negócio** |
| `description` | O que o negócio faz | **O que você vende** |
| `differentiators` | Diferenciais | **Por que escolhem você** |
| `guarantee` | Garantia | **O que você garante** |
| `payment_policy` | Formas de pagamento | **Como o cliente paga** |
| `delivery_time` | Prazo | **Quanto tempo leva** |
| `city` | Cidade | **Cidade onde você atende** |
| `cep` | CEP | **Seu CEP** |
| `atende_somente_no_local` | Atende só no local | **O cliente precisa ir até você?** |
| `business_hours` | Horário | **Quando você abre** |
| `availability` | Disponibilidade para atender | **Quanto você dá conta hoje** |
| `quem_somos` | Quem somos | **Como você se apresenta** |
| `historia` | História | **Como começou** |
| `por_que_existe` | Por que existe | **Por que você faz isso** |
| `para_quem` | Para quem | **Quem é o seu cliente** |
| `o_que_nao_fazemos` | O que não fazemos | **O que você não faz** |
| `tom_de_voz` | Tom de voz | **Como você quer soar** |
| `observacoes` | Observações de identidade | **Outras coisas sobre a marca** |
| `site_url` · `instagram_handle` | Site · Instagram | **Seu site** · **Seu Instagram** |

**Onde isso mora no código:** um segundo rótulo no mesmo
`lib/agentes/campos.ts`, campo `rotuloCliente`, e não um segundo catálogo. O
arquivo existe justamente para ser fonte única (o comentário do topo dele diz
isso). Dois catálogos divergem no dia em que alguém acrescenta um campo em um
e esquece o outro — e o campo novo apareceria na tela do operador e não na do
cliente, sem erro nenhum.

### 3.5 De onde veio cada valor — três estados, não dois

A procedência de hoje vira uma linha discreta abaixo do valor:

| `procedencia` | O que a tela diz |
|---|---|
| `extraido` | *veio da conversa que você teve com a gente* |
| `manual` | *a gente anotou isso durante a conversa* |
| `confirmado` | *você conferiu isso em 19/08* |
| `desconhecida` | **nada** |

O último é o que importa. Campo sem procedência é campo que o onboarding ou a
Conta gravaram antes de tudo isto existir — e a tela **não inventa uma
origem** para ele. Dizer "você respondeu no cadastro" seria inferência
apresentada como fato, e o valor pode ter vindo de outro lugar. Três estados,
não dois: sabemos, sabemos o outro, e não sabemos.

### 3.6 A tela funciona antes de existir entrevista

Consequência do §3.5 que vale marcar, porque é o que faz este lote entregar
valor sem depender do lote D nem do E.

Um cliente que só passou pelo onboarding tem `name`, `niche`, `city`, ticket e
`monthly_budget` preenchidos, todos com procedência `desconhecida`. A tela
mostra esses cinco, sem alegar origem, com o mesmo "tá certo" ao lado. Ele
confirma, e **nasce o primeiro `confirmado` do sistema** — sem App Review, sem
o backend do Gabriel, sem entrevista.

A frase de abertura muda conforme haja entrevista ou não:

- com entrevista: *"Isso aqui a gente montou a partir da conversa que você
  teve com a gente em 12 de agosto."*
- sem: *"Isso aqui é o que a gente sabe do seu negócio até agora."*

---

## 4. Como ele corrige: campo por campo, sem salvar no fim

**Não é um formulário grande com um botão "salvar" embaixo.** Cada campo tem
duas ações, e cada clique grava na hora.

```
┌──────────────────────────────────────────────────────────┐
│ Quanto uma venda costuma dar                             │
│                                                          │
│ de R$ 60 a R$ 120                                        │
│ veio da conversa que você teve com a gente               │
│                                                          │
│                          [ tá certo ]  [ não é isso ]    │
└──────────────────────────────────────────────────────────┘
```

Depois de confirmado, as duas ações somem e sobra a linha:

```
│ de R$ 60 a R$ 120                                        │
│ ✓ você conferiu isso em 19/08              [ mudar ]     │
```

**Por que não tudo editável de uma vez.** Três motivos, e o terceiro é o que
decide.

1. Vinte e quatro campos abertos em `input` **são** um formulário, e o
   enunciado está certo ao dizer que a diferença muda o comportamento: revisão
   se faz, formulário se adia.
2. Um "salvar" no fim perde tudo se ele fechar a aba na metade — o mesmo
   motivo pelo qual a tela do operador grava no clique.
3. **Um salvamento único torna impossível distinguir "conferi este campo" de
   "não mexi nele".** E essa distinção é a coisa inteira: é o que separa
   `confirmado` de `extraido`, e é a pergunta do §6. Com um botão só no
   rodapé, ou tudo vira `confirmado` (mentira) ou nada vira (a tela não serve
   para nada).

**Corrigir abre um campo no lugar do valor**, com duas ações: *salvar* e
*deixa como estava*. O tipo do campo manda na entrada:

| tipo | entrada |
|---|---|
| texto curto | `input` |
| texto longo (narrativa) | `textarea` |
| número (dinheiro) | `input inputMode="decimal"`, com o mesmo parser da tela do operador — "1.200,50" e "1200.50" entram |
| booleano | dois botões: *sim, só aqui* / *não, eu também vou até o cliente* |
| lista (`differentiators`) | `textarea`, um por linha |
| ticket | **dois** campos, "de" e "até" (§8.1) |

**Sem "confirmar tudo".** Na tela do operador esse botão não existe porque ele
produziria aprovação em vez de revisão. Aqui o argumento é mais duro: o botão
produziria `confirmado` — o topo da escala, o único nível que trava a proposta
do agente — a partir de um clique em cinco campos que ninguém leu. O nível
perderia o significado no primeiro uso.

---

## 5. A procedência: confirmar **e** corrigir gravam `confirmado`

O enunciado pergunta se campo corrigido vira `confirmado` ou `manual`. É
`confirmado`, por dois motivos: um semântico e um mecânico. O mecânico decide.

**Semântico.** `manual` está definido, desde a 0010, como *"alguém da V2G
anotou durante a conversa"*. O cliente não é a V2G. Gravar `manual` para o ato
dele faria a escala passar a ter dois significados diferentes no mesmo valor —
e o `diagnosticar-orcamento`, que lê exatamente isso para decidir se confia no
número, não teria como saber qual dos dois.

**Mecânico, e é o que fecha a questão.** A trava da 0013 recusa `aceito` sobre
`confirmado` e deixa passar `corrigido`. Se a correção do cliente gravasse
`manual`, um `aceito` de uma proposta futura passaria por cima **sem
bloqueio** — o palpite do agente sobrescreveria em silêncio o número que o
dono digitou com as próprias mãos. É exatamente a inversão que a trava existe
para impedir, entrando pela porta dos fundos.

E na dúvida sobre confiabilidade, que é a pergunta que a escala responde: um
valor **digitado pelo dono** é pelo menos tão confiável quanto um valor que
ele apenas leu e aprovou. Nunca menos.

### O ato fica registrado sem inventar um quarto nível

A diferença entre confirmar e corrigir sobrevive no `extra` do jsonb, que a
`registrar_procedencia()` já concatena:

```json
"avg_ticket_min": {
  "origem": "confirmado",
  "em": "2026-08-19T14:02:00Z",
  "por": "cliente:9f3c…",
  "ato": "corrigiu",
  "valor_anterior": 80,
  "procedencia_anterior": "extraido"
}
```

**Por que não um quarto nível (`proprio`, `digitado`).** Todo leitor da escala
— a trava da 0013, o `diagnosticar-orcamento`, a prévia da tela do operador, o
que vier depois — teria que aprender o valor novo, e a única pergunta que
qualquer um deles faz é "posso confiar?". Para os dois atos a resposta é a
mesma: sim, veio do dono. Nível acrescentado é nível que algum leitor vai
esquecer de tratar, e o esquecimento aparece como o campo caindo no `else`
errado meses depois.

**`por` = `"cliente:<uuid do profile>"`**, seguindo a forma de `"v2g:gabriel"`
que o desenho da 0010 já usa. O prefixo diz o lado; o uuid diz qual pessoa,
num negócio com mais de um dono.

### O que a tela do operador passa a ver — e por que ela não muda

Nenhuma linha de código muda lá, e isso é bom sinal: `montarPrevia()` já lê
`procedenciaAtual`, já calcula `conflitoBloqueante` e `sobrescreveConfirmado`,
e a tela já tem as pílulas *"por cima do confirmado"* e *"bloqueia"*, e o
parágrafo que explica a recusa. **Tudo isso foi escrito e nunca teve como
disparar.** A partir deste lote, dispara.

Vale dizer o que isso significa em operação: quando um cliente confirmar um
campo e uma segunda entrevista propuser outro valor para ele, o operador
**vai** bater no bloqueio. Não é regressão, é a regra funcionando pela
primeira vez — e a saída dela (corrigir à mão, assumindo a troca) já está
escrita na tela.

---

## 6. O campo que ele não olhou

Continua `extraido`, e isso é a verdade. A tela precisa deixar visível o que
ainda não foi conferido **sem transformar isso em cobrança**. Três decisões.

**(1) A ausência da ação É a marcação.** Campo não conferido mostra os botões
"tá certo" / "não é isso". Campo conferido mostra "✓ você conferiu isso em
19/08" e um "mudar" discreto. Não existe selo de "pendente", não existe
amarelo, não existe alerta. O estado se lê pela presença do botão — que é
informação que a pessoa já precisa ver de qualquer forma.

**(2) Nenhum contador, em lugar nenhum.** Nem "6 de 24", nem barra de
progresso, nem `.grp-count` no título dos blocos, nem contagem no card da
Conta. Um contador de pendências converte revisão em tarefa, e tarefa com
número visível é exatamente o que se adia. É a mesma disciplina do
`padrao-visual.md` §5, por um motivo diferente: lá o contador de `/alertas`
ficou porque era a informação da tela; aqui ele seria a régua de uma lição de
casa.

Isto tem custo, e ele é real: sem contador, o cliente não tem como saber que
faltam 18 campos. Aceito de propósito — ele não precisa saber, porque não
falta nada. O perfil funciona com campo `extraido`; o que ele confirma é
melhoria, não requisito.

**(3) Uma frase, no topo, dita uma vez:**

> *Não precisa conferir tudo hoje. O que você não mexer continua valendo do
> jeito que está.*

**Onde o número aparece, e só aí:** internamente. A consulta do
`perfil-empresa.md` §2 (`jsonb_each` filtrando origem ≠ `confirmado`) continua
sendo a forma de a V2G saber quanto do perfil está confirmado. Isso é
informação de operação, e o lugar dela é a tela do operador ou um relatório —
nunca a tela do cliente.

---

## 7. A escrita

### 7.1 O caminho

```
[cliente clica "tá certo"]
   │
   ▼
Server Action  ── confere sessão, acha o negócio pelo `profile_id` sob RLS,
   │              valida a chave contra o catálogo, converte o valor
   ▼
supabase.rpc("confirmar_campo_do_cliente", …)   com o cliente ADMIN
   │
   ▼
função no banco ── reconfere o par (profile_id, business_id), grava valor
                   e procedência NA MESMA TRANSAÇÃO
```

**Por que Server Action e não escrita direta do cliente.** Server Action é
endpoint POST de verdade — a mesma lição da tela do operador. Ela confere a
sessão dentro dela, não confia no fato de a página ter carregado.

**Por que uma função de banco e não dois `update` seguidos.** São duas
escritas: o valor e a procedência. Se a segunda falhar, sobra um valor do
cliente carregando a procedência antiga — que é **exatamente o defeito do
§2**, recriado por acidente dentro do lote que existe para consertá-lo. Uma
função plpgsql roda as duas numa transação só. É o mesmo raciocínio da 0013,
em escala menor.

### 7.2 A função — `0015_confirmacao_do_cliente.sql`

**Aplicada em 19/08/2026** como `confirmacao_do_cliente`, pelo mesmo caminho
das 0010–0014 (MCP `apply_migration`, não o `supabase db push` da Decisão 9 —
que descreve uma prática que o projeto não segue desde a 0010; os nomes das
migrations aplicadas batem com os cabeçalhos dos arquivos).

```sql
create or replace function public.confirmar_campo_do_cliente(
  p_profile_id  uuid,
  p_business_id uuid,
  p_tabela      text,
  p_campo       text,
  p_valor       jsonb default null  -- nulo = confirmar o que já está lá
) returns jsonb
language plpgsql security definer set search_path = public
```

**Mudou em relação ao desenho: `p_ato` saiu.** Ele era um argumento, e virou
derivação. Quem chama não tem por que ser acreditado sobre o que acabou de
fazer:

| `p_valor` | valor atual | ato derivado |
|---|---|---|
| nulo | tem valor | `confirmou` |
| nulo | vazio | **recusa** — vazio se preenche, não se confirma |
| dado | vazio | `preencheu` |
| dado | tem valor | `corrigiu` |

Com o ato derivado do estado real, `preencheu` nunca aparece num campo que
tinha valor, e o registro histórico deixa de depender de a aplicação estar
certa.

O que ela faz, em ordem:

1. **Reconfere o dono.** `select 1 from businesses where id = p_business_id
   and profile_id = p_profile_id`. Sem isso, um erro na camada TypeScript vira
   escrita em negócio alheio — e a função é `security definer`, então não há
   RLS por baixo para segurar.
2. **Lista branca de tabela e de COLUNA.** Aqui o desenho subestimou o risco:
   a `registrar_procedencia()` se contenta em conferir que a coluna existe, e
   para ela isso basta — ela só escreve dentro do jsonb. Esta escreve **na
   coluna**, com um nome que vem de um caminho que começa no navegador do
   cliente. Conferir só existência aceitaria `profile_id`, e um POST forjado
   daria o negócio para outra pessoa. A lista é explícita e duplica de
   propósito o `campos.ts`: aquele é a fonte do que a TELA mostra, esta é o
   que o BANCO aceita, e precisa continuar valendo quando o TypeScript
   estiver errado.
3. **`confirmou` não escreve valor.** Só a procedência.
4. **`corrigiu` e `preencheu` escrevem o valor** com o mesmo `#>> '{}'` da
   0013 — nunca `->>`. Gravar `"Sorocaba"` com aspas dentro de coluna `text`
   é uma cicatriz que já custou um anúncio publicado.
5. **Cria a linha filha se faltar**, e só quando há valor para ela — mesma
   regra da 0013: `identidade_visual` toda nula criada de lado é um perfil que
   existe sem ninguém ter dito nada. Confirmar numa tabela sem linha recusa e
   **não** cria.
6. **`registrar_procedencia(..., 'confirmado', 'cliente:<uuid>', extra)`** com
   `ato`, `valor_anterior` e `procedencia_anterior`. O `por` é montado dentro
   da função: quem chama não escolhe como vai ser identificado.
7. **Recusa valor em branco.** Sem isso, "salvar" com o campo vazio apagaria o
   valor e carimbaria `confirmado` em cima do apagamento.

**A lista branca inclui `name` e `radius_km`**, que não vêm de extração
nenhuma. É o que permite o `FormNegocio` da `/conta` desaparecer inteiro em
vez de sobrar como formulário de dois campos — ver §2.

**A ACL, e a Decisão 10 do `arquitetura.md` inteira:**

```sql
revoke all on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirmar_campo_do_cliente(uuid, uuid, text, text, text, jsonb)
  to service_role;
```

Os três papéis no `revoke`, e só `service_role` no `grant`. Revogar de
`public, anon` e concluir sobre os dois foi o furo da 0010, consertado na
0011, e ele não vai voltar aqui.

### 7.3 A alternativa que eu não escolhi, e por quê

O comentário final da 0011 previu outro caminho: *"quando a tela de Conta
chegar, o caminho não é reabrir `procedencia_do_campo` para `authenticated` e
sim acrescentar `private.owns_business(p_business_id)` dentro da função."*

Isso significaria dar `execute` a `authenticated` numa função `security
definer`, com `owns_business()` (que lê `auth.uid()`) fazendo a guarda. É
defensável e tem uma vantagem real: a autorização fica no banco, não no
TypeScript.

Não escolhi por duas razões:

1. **`owns_business()` depende de `auth.uid()`, que é nulo sob
   `service_role`.** Ou seja, o desenho obriga a chamada a vir do cliente do
   usuário — e aí a Server Action deixa de ser a única porta, o que contraria
   o que este lote pede explicitamente.
2. Este projeto já se cortou duas vezes em permissão de função `security
   definer` (0010→0011, e o `revoke select (coluna)` que virou no-op na 0003).
   Uma função que ignora RLS e fica alcançável por qualquer usuário logado é a
   forma exata das duas.

A guarda no banco não some por isso: ela vira o passo 1 do §7.2, que recusa o
par `(profile_id, business_id)` que não bate. É a mesma proteção, sem grant
novo.

### 7.4 Invalidar o geo quando a cidade mudar — só a cidade

Corrigir `city` invalida a localização guardada: ela foi resolvida a partir
daquele nome. Sem limpar, a próxima publicação entrega o anúncio na cidade
antiga, em silêncio.

```sql
update businesses set geo_key = null, geo_label = null, geo_resolved_at = null
```

**Três colunas, e `geo_key` é a única que decide.** `geo_lat/lng` ficam de fora
de propósito: elas vêm do endereço da página do Facebook, não da cidade do
cadastro, e a cascata da `garantirGeo()` já as prefere quando existem — um
endereço real vale mais que um nome de cidade digitado. Corrigir a cidade não
é motivo para descartar a coordenada da página.

**`cep` não invalida nada.** Ele não participa da resolução geográfica em
lugar nenhum (§10.1). Corrigir CEP grava o CEP e mais nada.

Isto vale para a tela nova **e** para o `salvarNegocioAction` da `/conta`, que
hoje grava `city` sem limpar nada. Se a saída (a) do §2 for aprovada, o
`salvarNegocioAction` para de escrever `city` e o problema deixa de existir lá
— a limpeza passa a viver num lugar só, junto da única escrita.

---

## 8. Os casos que quebram se ninguém decidir agora

### 8.1 O ticket é duas colunas e um campo na tela

`avg_ticket_min` e `avg_ticket_max` viraram faixa na 0004. Para o cliente é
**uma** pergunta ("quanto uma venda costuma dar"), e para o banco são duas
colunas com duas entradas de procedência.

Decisão: **campo composto declarado no catálogo.** Confirmar carimba as duas;
corrigir abre dois campos ("de" e "até") e grava as duas. A Server Action faz
duas chamadas à função dentro do mesmo pedido — e se a segunda falhar, a tela
diz que não deu e o `max` fica como estava, porque a primeira chamada é o
`min`, que sozinho não é interpretado como faixa nova por ninguém.

**Cuidado:** a `/conta` hoje grava `avg_ticket_min = avg_ticket_max = mesmo
número` (o comentário do `actions.ts` explica por quê). Se a saída (a) do §2
for aprovada, esse comportamento sai junto com o campo, e a faixa volta a ser
faixa. Se for a (b), os dois convivem e o cliente vê "de R$ 68 a R$ 68" — feio
e verdadeiro, mas é mais um argumento para a (a).

### 8.2 Lista

`differentiators` é `text[]`. Mostra como lista de linhas, corrige como
`textarea` com um por linha — igual à tela do operador, que já resolveu isso.

### 8.3 Booleano

`atende_somente_no_local` não tem "corrigir": tem dois botões que já são a
resposta. Confirmar um valor booleano com "tá certo" e mudar com "não é isso"
seria dois passos para uma escolha binária.

### 8.4 Campo vazio — REVISADO na aprovação

O desenho original não deixava preencher. **Foi rejeitado, e com um argumento
melhor que o meu:** tela que mostra campo vazio sem poder preencher ensina que
ela é só leitura, e quem aprende isso não volta. O custo que eu não tinha
contado não era o formulário — era a segunda visita.

A regra que ficou tem duas metades.

**Campo vazio ganha entrada aberta, e o que ele digitar vira `confirmado`.**
Ato `preencheu`. Ele digitou; é honesto — o mesmo raciocínio do §5, e o mesmo
nível, porque a pergunta que a escala responde ("posso confiar?") tem a mesma
resposta nos três atos.

**Menos os números difíceis, que não aparecem como campo aberto aqui.** São os
que o cliente não sabe de cabeça, e o enunciado do projeto já dizia isso:
`avg_direct_cost` (quanto sai do bolso em cada venda) e `monthly_budget`
(quanto investir por mês). Vazios, eles aparecem — mas com a explicação, não
com um `input`:

> **Quanto sai do seu bolso em cada venda** — ainda não sabemos
> Esse quase ninguém sabe de cabeça, e chutar aqui sai caro: é dele que sai
> quanto a IA pode gastar para te trazer um cliente. A gente levanta esse com
> você, com uma conta que dá para responder.

Não é `input` porque um número chutado neste campo não fica marcado como
chute: entra como `confirmado`, que é o nível mais alto da escala, e vira
orçamento de campanha. A coleta certa deles é o lote B, com a conta que ele
consegue responder.

**O terceiro número difícil não está nesta tela.** `target_profit_per_customer`
(lucro desejado por cliente) não é campo do catálogo de extração e não aparece
aqui. Fica registrado para ninguém procurar.

**O ticket é preenchível.** Ele não está na lista dos difíceis — quanto uma
venda costuma dar é coisa que dono de padaria responde na hora.

### 8.5 Não há negócio, ou não há nada preenchido

Estado vazio honesto: *"A gente ainda não sabe nada do seu negócio. Isso
começa no onboarding"*, com o link — mesma copy que a `/conta` já usa quando
não há `business`.

### 8.6 Reconfirmar e recorrigir

Permitido, sempre. Confirmar campo já `confirmado` atualiza a data. Corrigir
campo `confirmado` grava por cima, com `valor_anterior` no `extra`. O dono
pode mudar de ideia sobre o próprio negócio — é a natureza do dado, não um
caso de borda.

---

## 9. Sem faixa cobalto

Escrito aqui porque a ausência vai parecer esquecimento, e o
`padrao-visual.md` §5 já teve que escrever a mesma frase sobre a `/conta`.

A faixa existe quando o número é o assunto da tela, ou quando ela aponta para
fora da tela. Aqui não é nenhum dos dois: não há número que domine — há vinte
e quatro campos de peso parecido — e a tela não manda ninguém para lugar
nenhum, ela é o destino.

O enquadramento vai no `.page-head`, que é onde ele custa menos e faz o mesmo
trabalho:

> # O que a gente entendeu do seu negócio
>
> Isso aqui a gente montou a partir da conversa que você teve com a gente em
> 12 de agosto. Dá uma conferida — principalmente nos números, que são os que
> mexem no seu dinheiro. O que estiver errado, você corrige aqui mesmo, e a
> IA passa a usar o certo na hora.

E uma linha de abertura no bloco dos números:

> *Comece por estes três. É deles que sai quanto a IA pode gastar para te
> trazer um cliente.*

Se um dia esta tela ganhar faixa, o candidato é condicional e é outro: **um
número que o cliente confirmou e que muda a conta** — por exemplo, o custo por
cliente recalculado depois de ele corrigir o custo direto. Aí a faixa
mostraria a consequência do ato, que é assunto próprio. Não existe hoje.

---

## 10. O que a leitura deste lote encontrou fora dele

Dois achados. Nenhum dos dois é deste lote; os dois são de código que roda
hoje.

### 10.1 `geo_key` nunca é limpo por ninguém — e quem devia limpar não é quem eu disse

**A primeira versão deste parágrafo acusava a `trocarPaginaAction` de limpar
geo incompleto. Estava errada.** Fica registrado porque o erro tem uma lição
útil: eu li a limpeza, li a cascata, vi uma coluna faltando na lista e conclui
sem perguntar **de onde aquela coluna vem**.

O levantamento completo (`grep` de `geo_*` em todo o repo, fora de
`node_modules`):

| | onde |
|---|---|
| **escreve** `geo_key` | `lib/meta/publicar.ts:260`, dentro de `garantirGeo()`, quando `resolverCidade()` acerta |
| **lê** `geo_key` | `lib/meta/publicar.ts:232`, segundo item da cascata |
| **limpa** `geo_key` | **nenhum lugar, em todo o repositório** |

E os dois caminhos de resolução são **mutuamente exclusivos**:
`coordenadaDaPagina()` grava `geo_lat/lng/label/resolved_at` e não grava
`geo_key`; `resolverCidade()` grava `geo_key/label/resolved_at` e não grava
`lat/lng`.

**Por que a `trocarPaginaAction` está certa como está.** `geo_key` deriva de
`businesses.city`, não da página do Facebook. Trocar de página não invalida a
cidade — a cidade continua a mesma. A limpeza de lá cobre exatamente o caso
que a troca de página invalida (a coordenada tirada do endereço da página) e
não deve tocar no resto.

**Onde o defeito está de verdade: `salvarNegocioAction`.** Ela grava `city` e
**não toca em coluna de geo nenhuma**. Como `geo_key` nunca é limpo por
ninguém, o percurso completo é:

1. negócio com `city = "Sorocaba"` publica → `geo_key = <chave de Sorocaba>`
2. o cliente corrige a cidade para "Votorantim" na `/conta`
3. `garantirGeo()` na próxima publicação vê `geo_key` preenchido e devolve
   **Sorocaba**, antes de tentar resolver qualquer coisa

Anúncio entregue na cidade errada, sem erro em lugar nenhum. E é o caminho que
a tela nova reproduz, porque ela também deixa corrigir `city`.

**`cep` não entra nisso.** `grep` de `cep` em `lib/meta/publicar.ts` e
`lib/meta/geo.ts`: zero ocorrências. A resolução usa `city` e a página, nunca o
CEP. O §7.4 dizia "cidade ou CEP" e foi corrigido: só `city` invalida.

**Medido, não inferido.** Em 19/08/2026, no `V2G-SITE`:

```sql
select count(*) as negocios,
       count(*) filter (where geo_key is not null) as com_geo_key,
       count(*) filter (where geo_lat is not null) as com_geo_lat
  from public.businesses;
-- negocios: 3 · com_geo_key: 0 · com_geo_lat: 0
```

**Nenhuma linha está corrompida hoje.** O defeito está vivo no código e ainda
não chegou ao dado, porque nenhum negócio chegou a resolver geo. Corrigir agora
é corrigir antes do primeiro caso, não depois.

### 10.2 O onboarding grava perfil sem procedência

Mesmo defeito do §2, na outra ponta: o onboarding preenche `niche`, `city`,
ticket e `monthly_budget` e não registra origem. Depois deste lote, esses
campos aparecem na tela nova sem linha de origem (§3.5) — o que é honesto e
funciona.

Poderia ser melhor: o onboarding é o cliente respondendo sobre o próprio
negócio, o que se parece muito com `confirmado`. Mas responder um chat de
quatro perguntas não é a mesma coisa que revisar um valor escrito — e inflar
`confirmado` para cobrir o chat esvaziaria o nível antes do primeiro uso.
**Deixo em aberto de propósito**, e registro que a escolha existe.

---

## 11. O que eu quero que você conteste antes de eu codar

1. **A saída (a) do §2** — tirar segmento, cidade, ticket e limite da
   `/conta`. É a única mudança deste lote fora da tela nova, e mexe numa tela
   que funciona.
2. **Sumir com o trecho da transcrição**, contra o que o `extracao-perfil.md`
   §10 previu. Se você achar que o cliente ganha em ver a própria fala, é uma
   linha a mais por campo e eu volto atrás.
3. **Campo vazio sem entrada de preenchimento** (§8.4). É a decisão de que
   tenho menos certeza: talvez seja o momento certo de pedir os números que
   faltam, e talvez eu esteja protegendo o enquadramento à custa de uma coleta
   que o lote B vai ter que fazer de qualquer jeito.
4. **Nenhum contador em lugar nenhum** (§6). Vai parecer incompleto na
   primeira olhada, e é de propósito.
5. **`confirmado` para os dois atos** (§5), com o ato registrado no `extra` em
   vez de um quarto nível na escala.
