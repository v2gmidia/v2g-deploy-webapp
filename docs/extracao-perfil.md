# Extração de perfil a partir de transcrição

**Desenho. Nada implementado.** Complementa `docs/perfil-empresa.md` (o que o
perfil guarda) respondendo *como o perfil é preenchido a partir da conversa de
onboarding*.

O ponto de partida é uma regra só, e todo o resto sai dela:

> O agente **propõe**. Quem grava no perfil é uma pessoa da V2G, campo por
> campo.

Não é cautela decorativa. Um perfil errado não falha: ele gera copy plausível
sobre um negócio que não existe, e o cliente só descobre quando o anúncio já
rodou. Erro que não dá erro precisa de revisão humana antes de virar dado.

---

## 1. O percurso

```
entrevista (transcrição colada + números anotados à mão)
   │
   ▼
[1] extrair      chamada única à API da Anthropic, sem escrita
   │             saída: JSON com N itens { campo, valor, confiança, trecho }
   ▼
[2] verificar    código, não modelo: o trecho existe mesmo na transcrição?
   │             o número do trecho bate com o número proposto?
   ▼
[3] gravar       PROPOSTA no banco (não no perfil)
   │
   ▼
[4] revisar      tela do operador: aceitar / corrigir / descartar, por campo
   │
   ▼
[5] aplicar      só o que foi decidido vira perfil + procedência
```

Os passos 1–3 são um trabalho de fundo: podem levar um minuto, ninguém está
olhando. Os passos 4–5 são humanos e podem acontecer em outro dia, em outra
máquina, por outra pessoa.

**O passo 2 é o que quase todo mundo pula.** Sem ele, "o trecho de onde tirou"
é só mais um campo que o modelo escreve — e um modelo que inventa um valor
inventa a citação junto, com a mesma naturalidade. Verificar em código que a
string aparece na transcrição transforma a citação de promessa em prova.

---

## 2. Onde a proposta mora entre a extração e a confirmação

**No banco, em duas tabelas novas.** Não em memória, não em arquivo, não na
sessão do navegador.

O critério é o que você pediu — sobreviver a fechar a aba — mas o motivo real é
maior que isso: entre extrair e confirmar podem passar dias. A entrevista
acontece na terça, o operador revisa na quinta, e no meio disso o processo
Node reinicia num deploy. Qualquer coisa que dependa de um processo continuar
vivo perde a proposta em silêncio, e a única forma de recuperar é rodar a
extração de novo — pagando de novo e, pior, produzindo um resultado que pode
ser diferente do que a pessoa começou a revisar.

```
propostas_de_perfil      1 por extração de 1 entrevista
  └── itens_da_proposta  1 por campo extraído
```

### `propostas_de_perfil` — o cabeçalho

| coluna | por quê |
|---|---|
| `id`, `business_id`, `entrevista_id` | de qual conversa saiu |
| `prompt_versao` | qual versão do prompt produziu isto |
| `modelo` | `claude-opus-5` — muda com o tempo |
| `estado` | `aberta` \| `aplicada` \| `descartada` |
| `criado_em`, `aplicada_em`, `aplicada_por` | |
| `tokens_entrada`, `tokens_saida` | custo real por entrevista, sem estimativa |

`prompt_versao` e `modelo` existem por um motivo específico: daqui a seis meses
alguém vai olhar uma proposta esquisita e a pergunta útil não é "o modelo
errou", é "**qual** prompt e **qual** modelo produziram isto". Sem essas duas
colunas essa pergunta não tem resposta, e a resposta é a única coisa que
permite corrigir a causa em vez do sintoma.

**Idempotência:** índice único em `(entrevista_id)` filtrando `estado =
'aberta'`. Uma entrevista tem no máximo uma proposta aberta. Clicar duas vezes
em "extrair" não cria duas listas divergentes para a mesma conversa — que é
exatamente o estado em que um operador aceita metade de uma e metade da outra
sem perceber.

### `itens_da_proposta` — o campo

| coluna | por quê |
|---|---|
| `tabela_alvo`, `campo` | `businesses.cep`, `narrativa_negocio.para_quem`, … |
| `valor_proposto` (jsonb) | tipado: texto, número em centavos, booleano |
| `confianca` | `explicito` \| `inferido` (ver §4) |
| `trecho` | o texto literal da transcrição |
| `trecho_verificado` (bool) | resultado do passo 2, escrito por código |
| `divergencia_anotacao` (bool) | só para números (ver §5) |
| `decisao` | `pendente` \| `aceito` \| `corrigido` \| `descartado` |
| `valor_final` (jsonb) | o que o humano decidiu; nulo enquanto pendente |
| `decidido_por`, `decidido_em` | |

`valor_proposto` e `valor_final` são colunas **separadas**. Corrigir não
sobrescreve o que o agente propôs. Isso é o que permite, depois de trinta
entrevistas, perguntar em que campos o agente erra sempre — e ajustar o prompt
com base em dado, não em impressão. Um campo que é corrigido em 80% das
entrevistas é um defeito do prompt, não do modelo, e só a coluna preservada
mostra isso.

`decisao` como coluna própria, e não como "linha some quando decidida", porque
**descartado é informação**. Um campo que o operador viu e recusou é diferente
de um campo que nunca apareceu.

### RLS

As duas tabelas nascem com RLS ligada e **nenhuma política para
`authenticated`** — ou seja, negado para todo mundo que não seja
`service_role`. Não é esquecimento: enquanto a tela do cliente não existe, o
cliente não tem o que ver aqui. Uma proposta contém o palpite do agente antes
de qualquer revisão, e mostrar isso ao cliente como se fosse o perfil dele é
justamente o erro que este desenho inteiro existe para evitar.

Quando a tela de Conta chegar, entra **uma** política de `select` com
`private.owns_business(business_id)` — e só para itens já decididos.

---

## 3. Como o prompt garante que campo ausente volta vazio

Você pediu para eu dizer como. São quatro mecanismos, e o quarto é o único que
não depende de o modelo cooperar.

**(a) O campo ausente é um valor legítimo, não uma falha.** O schema de saída
tem uma lista `campos` onde cada item traz `estado: "encontrado" | "ausente"`.
Não existe "devolva vazio se não souber" — existe um estado que o modelo
escolhe. Instrução que pede omissão compete com o impulso de completar; um
estado nomeado não compete com nada, porque preencher `"ausente"` é tão
"completar a tarefa" quanto preencher o valor.

**(b) Saída estruturada, não JSON pedido em prosa.** `output_config.format`
com um `json_schema` — o valor de `estado` é um `enum`, e um item com
`estado: "ausente"` não aceita `valor`. Isso não é validação depois do fato: a
forma é imposta na geração. O modelo não *pode* devolver um valor sem estado
compatível.

**(c) O trecho é obrigatório para todo campo encontrado.** Exigir a citação
junto com o valor muda o que o modelo está fazendo: não é "o que provavelmente
é o CEP dessa padaria", é "aponte onde ele foi dito". Um campo que ninguém
mencionou não tem para onde apontar.

**(d) A verificação em código — o único mecanismo que não é confiança.**
Depois da resposta, para cada item `encontrado`: normaliza espaços e
maiúsculas e procura `trecho` dentro de `entrevistas.transcricao`. Se não
achar, o item **não entra na proposta** — vai para um registro separado de
descartados, com o motivo.

(a), (b) e (c) tornam a invenção improvável. (d) torna a invenção **detectável**,
e é a única das quatro que continua valendo se o prompt for editado por alguém
que não leu este documento.

Vale dizer o que (d) não pega: um trecho verdadeiro do qual se extraiu a
conclusão errada. A pessoa disse "eu cobrava 200, hoje é 350" e o agente
propõe 200 citando corretamente a frase. Contra isso não existe verificação
automática — existe a tela do lado a lado do §6, que é para onde esse caso
precisa chegar intacto.

### O prompt é arquivo versionado

`prompts/extracao-perfil/v1.md`, fora do código, carregado em tempo de
execução, com a versão gravada em `propostas_de_perfil.prompt_versao`.

Prompt embutido em `.ts` é código: para ajustar uma frase alguém abre o editor,
mexe perto de lógica, e o diff some no meio de um commit de outra coisa. Prompt
em arquivo próprio tem histórico legível — dá para ver a frase que mudou entre
a v1 e a v2 e cruzar com as propostas que cada uma gerou. É artefato de
produto, e produto se revisa lendo, não fazendo code review.

Versões antigas **ficam**. Uma proposta de março tem que continuar
interpretável em outubro.

---

## 4. Confiança: dois níveis, não um número

O modelo devolve `confianca: "explicito" | "inferido"`.

- **explicito** — a pessoa disse. "Meu ticket médio é uns 80 reais."
- **inferido** — deduzido do que foi dito. Ela falou de corte, barba e
  sobrancelha; o agente propõe `para_quem` a partir disso.

**Não vai ter float.** Um `0.73` de um modelo de linguagem não é uma
probabilidade calibrada — é um número plausível, e a diferença entre 0.73 e
0.68 não significa nada que alguém consiga usar. Nós já temos a prova disso na
casa: no pipeline atual metade da fila de revisão está parada em exatamente
`0.50`, o que é o modelo dizendo "não sei" com aparência de medição. Um valor
que se concentra num ponto não carrega informação; carrega a *sensação* de
carregar, que é pior, porque justifica um limiar automático que na verdade não
tem base.

Dois níveis nomeados são grosseiros de propósito, e sobrevivem à pergunta
"o que eu faço diferente se for 0.6 em vez de 0.8?" — que o float não
sobrevive.

Na tela, `inferido` não é um alerta vermelho. É só uma marcação discreta que
diz ao operador onde olhar com mais atenção quando ele estiver com pressa.

---

## 5. Os três números têm tratamento próprio

`ticket_medio_cents`, `custo_por_servico_cents` e `orcamento_mensal_cents`.

Eles são diferentes dos outros campos por um motivo mecânico: **transcrição
automática erra número de um jeito que não parece erro**. "Duzentos" vira
"dois mil". "Cento e cinquenta" vira "cinquenta". O texto continua gramatical,
o valor continua plausível, e nada na frase denuncia. Um `para_quem` errado
soa estranho na leitura; um ticket errado por 10x soa normal — e vira orçamento
de campanha.

Proponho quatro coisas, e a segunda é a que faz o trabalho de verdade.

**(1) Só `explicito` entra.** Número inferido é descartado antes de virar item.
Não existe deduzir orçamento a partir de "não é muita coisa".

**(2) Confronto com `entrevistas.anotacoes_numeros`.** Este é o ponto. A tabela
já guarda os números que a pessoa da V2G **anotou à mão durante a conversa** —
foi para isso que a coluna foi criada. Se existe anotação para o campo e ela
diverge do que o agente extraiu, a anotação vence: ela é `manual`, e quem
escreveu ouviu com o ouvido, não com o transcritor. O item vai para a tela com
`divergencia_anotacao = true`, mostrando os dois valores lado a lado, e
**nunca** com o valor do agente pré-selecionado.

Isso é o motivo pelo qual `manual` tem precedência sobre `extraido` na ordem de
procedência do 0010, e este é o primeiro lugar onde essa ordem faz efeito
prático.

**(3) O número tem que estar no trecho.** A verificação do §3(d) fica mais
estrita: além de o trecho existir, o valor proposto precisa aparecer nele —
como dígito ou por extenso. `350` citando um trecho que só fala em "trezentos e
cinquenta" passa; `350` citando "o preço subiu bastante" não.

**(4) Marcação visual diferente e ausência de "aceitar tudo".** Se um dia
existir um botão de aceitar em lote, ele não pega os três números. São três
campos por entrevista — dez segundos de leitura — e são os únicos cujo erro
vira dinheiro gasto errado.

**Um campo numérico sem anotação e sem trecho verificado simplesmente não entra
na proposta.** Fica em branco no perfil, e branco é honesto: o
`diagnosticar-orcamento` já sabe tratar ausência, e `procedencia_do_campo()`
devolve `desconhecida`. O que ele não sabe tratar é um número errado com cara
de certo.

---

## 6. A tela de revisão do operador

Rota `/revisar-perfil/[proposta]`, atrás do `papel = "operador"` que já existe
no `proxy.ts` — mesma proteção em duas camadas da `/saude-meta`.

**Layout: extraído de um lado, transcrição do outro.**

```
┌─────────────────────────────┬──────────────────────────────┐
│ para_quem                   │ "...é mais gente do bairro    │
│                             │  mesmo, pessoal que trabalha  │
│ Gente do bairro, que        │  aqui perto e passa na hora   │
│ trabalha perto e passa      │  do almoço..."                │
│ na hora do almoço           │                               │
│                        [i]  │  ↑ trecho confere             │
│                             │                               │
│ [aceitar] [corrigir] [não]  │                               │
└─────────────────────────────┴──────────────────────────────┘
```

O trecho fica **ao lado**, não atrás de um clique. Revisão que exige expandir
para conferir a fonte vira revisão onde ninguém expande — e a tela passa a
produzir aprovação em vez de revisão, que é o oposto do que ela existe para
fazer.

Sem "aprovar todos". A tela tem uma função só: obrigar a olhar cada campo uma
vez.

### Três decisões, duas procedências

| decisão | grava | procedência |
|---|---|---|
| **aceitar como veio** | `valor_proposto` | `extraido` |
| **corrigir à mão** | `valor_final` (digitado) | `manual` |
| **descartar** | nada | nenhuma |

É o mapeamento direto para `registrar_procedencia()` do 0010. `confirmado` não
aparece aqui de propósito: `confirmado` significa *o cliente viu e disse que
está certo*, e o cliente ainda não viu nada. Um operador da V2G não pode
produzir `confirmado` — se pudesse, o nível de cima da escala perderia sentido
e a tela de Conta não teria o que acrescentar.

### Funciona entre sessões porque o estado está no banco

Cada decisão é um `update` no item, na hora do clique. Não existe "salvar" no
fim. Fechar a aba na metade e voltar amanhã continua de onde parou, e o
cabeçalho mostra "11 de 23 decididos". Só quando não sobra nenhum `pendente` o
botão de aplicar acende.

**Aplicar é uma transação só.** Ou os 23 campos entram com suas procedências, ou
nenhum entra. Aplicação parcial produz um perfil metade novo metade antigo sem
nenhum registro de onde foi o corte — e esse é o estado que ninguém consegue
depurar depois.

---

## 7. Dois buracos que este desenho encontrou — consertados na 0011

**Aplicado.** `supabase/migrations/0011_procedencia_generalizada.sql`.

**(a) `registrar_procedencia()` só escrevia em `businesses`.** Mas
`identidade_visual` e `narrativa_negocio` também têm coluna `procedencia`, e
é de lá que vem a maior parte do que sai de uma transcrição (`quem_somos`,
`para_quem`, `tom_de_voz`). Agora as três tabelas passam pela mesma função,
com lista branca dentro — não três funções irmãs, que divergem: uma ganha uma
validação que a outra não ganha, e o bug aparece só na tabela esquecida.
`procedencia_do_campo()` foi generalizada junto; se só a escrita tivesse sido,
o `diagnosticar-orcamento` leria `desconhecida` para campo que tem origem.

A assinatura antiga de 5 argumentos foi **removida**, não mantida como atalho.
Não havia chamador nenhum fora da própria 0010 — conferido antes de remover.
Um atalho que assume `businesses` por omissão é o caminho que amanhã grava
procedência na tabela errada sem erro.

Duas decisões dentro da função:

- **Linha inexistente recusa, não cria.** Uma linha de `identidade_visual`
  toda nula, criada de lado por um registro de procedência, é um perfil que
  existe sem ninguém ter dito nada. Na transação de aplicar a proposta o valor
  já vem antes da procedência, então a ordem correta não custa nada.
- **`updated_at` só em `businesses`.** As outras duas têm gatilho
  `set_atualizado_em`; mexer no campo à mão aqui esconderia um gatilho que
  parou de funcionar.

**(b) `authenticated` podia executar as duas.** Este é meu, de ontem, e é o
mais sério. A 0010 revogou de `public, anon` e parou ali — mas o Supabase
concede `execute` a `anon` **e** `authenticated` por privilégio padrão no
schema `public`. A revogação incompleta deixava qualquer usuário logado
chamando uma função `security definer` que ignora RLS e escreve procedência em
**qualquer** `business_id` — inclusive marcando campo de outro negócio como
`confirmado`.

Minha conferência da 0010 disse "anon não tem execute". Era verdade e era
insuficiente: eu chequei um papel e concluí sobre os dois. Agora as duas
funções têm ACL só de `service_role`, e a conferência lê o `proacl` inteiro em
vez de perguntar por um papel de cada vez.

Quando a tela de Conta chegar, o caminho **não** é reabrir
`procedencia_do_campo` para `authenticated` — é acrescentar
`private.owns_business(p_business_id)` dentro da função.

---

## 8. A chamada à API

Uma chamada, sem ferramentas, sem loop. Extração é função pura: transcrição
entra, JSON sai. O agente **não tem acesso ao banco** — não é política de
prompt, é ausência de ferramenta. Não existe caminho pelo qual ele escreva.

- **Modelo:** `claude-opus-5`
- **Pensamento:** adaptativo (o padrão do modelo). `max_tokens` com folga:
  pensamento e resposta dividem o mesmo teto.
- **Saída:** `output_config.format` com `json_schema` — sem pedir JSON em prosa
  e sem parsear texto.
- **Streaming:** sim. É trabalho de fundo com saída longa; sem streaming corre
  risco de timeout de HTTP.
- **Chave:** `ANTHROPIC_API_KEY` em `lib/agentes/` com `import "server-only"`,
  igual ao `V2G_BACKEND_TOKEN`.

**Sem fatiar a transcrição.** Uma reunião de 90 minutos dá algo como 25 mil
tokens; a janela é de 1M. Fatiar aqui só criaria o problema de o campo estar no
pedaço 2 e o número no pedaço 5.

Custo: da ordem de centavos por entrevista. Não é variável de decisão neste
desenho.

---

## 9. Testar com transcrição fictícia, sem contaminar nada

O problema não é `entrevistas` ser append-only. Colar uma transcrição
inventada lá é uma inserção comum, e inserção é o que a tabela aceita. O
problema é o **resto**: a extração termina escrevendo em `businesses`,
`identidade_visual` e `narrativa_negocio`, e um negócio de mentira com perfil
preenchido entra em contagem, em fila de operador e — no pior caso — em
campanha.

Marcar a entrevista não resolve isso, porque o que contamina é o perfil que
sai dela, não o texto que entra.

**Proposta: uma coluna em `businesses`, e o negócio inteiro é fictício.**

```sql
alter table public.businesses
  add column if not exists dados_ficticios boolean not null default false;
```

- **`default false`** — nenhum negócio existente muda, sem backfill e sem
  janela em que alguém real fica marcado por engano.
- **No negócio, não na entrevista** — tudo que pendura nele herda: entrevistas,
  pessoas, identidade, narrativa, propostas. Uma marcação, e toda consulta que
  já filtra por negócio ganha o filtro de graça.
- **Apagar é apagar o negócio.** Os vínculos de perfil são
  `on delete cascade`; `creatives.pessoa_id` e `execucoes.business_id` são
  `on delete set null`. Some tudo em um ato deliberado — sem reescrever
  registro nenhum, e sem tocar no append-only de `entrevistas`.

**A trava que faz a marcação valer alguma coisa:** `lib/meta/publicar.ts`
recusa a cadeia se o negócio for `dados_ficticios`. Sem isso, a coluna é
documentação; com isso, é impossível um negócio de teste virar gasto no Meta.
A checagem fica logo depois de carregar o negócio — antes do token e antes de
marcar `publish_state = "publishing"`, não junto do piso de orçamento como eu
tinha escrito. A resposta não depende de nada do Meta: gastar requisição para
descobrir isso é trabalho jogado fora, e deixaria a campanha num estado
"publishing" que ninguém vai encerrar.

**Onde o filtro precisa entrar:** telas de operador, contagens de dashboard e
qualquer fila de revisão. Vale escrever a lista no PR — é o tipo de filtro que
se esquece exatamente na consulta que ninguém olha.

O que **não** proponho: apagar entrevista de teste, tabela paralela de
entrevistas, ou banco separado. Apagar contraria o append-only pelo motivo
errado — a tabela é append-only para o registro não ser reescrito, e o teste
não precisa reescrever nada. Tabela paralela duplica schema que vai divergir.
Banco separado é o mais correto no papel e o menos usado na prática, porque
exige manter dois conjuntos de migrations em dia.

---

## 10. O que fica previsto e não construído

**Tela de revisão do cliente, em Conta.** O cliente vê o perfil já revisado
pelo operador e confirma ou corrige. Confirmar grava `confirmado` — o nível
mais alto da escala, e o único que só ele pode produzir.

O que já está preparado para isso: a coluna `procedencia` aceita `confirmado`
desde o 0010; a política de `select` das propostas é uma linha; a tela do
operador é o mesmo componente de lado a lado, com a transcrição substituída por
"foi isso que você nos contou". Nada precisa ser desfeito.

**Ligação com o pipeline do Gabriel.** `procedencia_do_campo()` já existe para
o `diagnosticar-orcamento` distinguir número confirmado de número extraído.
Ligar os dois é outro lote.

---

## 11. O que eu quero que você conteste antes de eu codar

1. **Dois níveis de confiança em vez de um número.** É a decisão mais opinativa
   aqui, e ela contraria o que o backend já faz.
2. **A anotação à mão vencer o agente sempre**, mesmo quando o operador acha
   que ouviu errado na hora. A saída é corrigir à mão — mas o padrão é a
   anotação.
3. **Nenhum aceitar-em-lote.** Vai ser tedioso na trigésima entrevista, e é
   exatamente aí que o botão seria pedido.
4. **Item com trecho não verificado sumir da proposta** em vez de aparecer
   marcado. Some, mas fica registrado no descarte — a alternativa é o operador
   avaliar um valor cuja fonte não existe.
