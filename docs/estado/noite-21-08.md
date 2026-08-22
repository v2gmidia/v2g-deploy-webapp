# Noite de 21/08 — o que aconteceu

Trabalho autônomo, seis tarefas na lista, **as seis fechadas**. Este
documento é o que você pediu para ler primeiro: o que foi feito, cada
decisão que tomei sozinho com o motivo, o que não deu certo, o que ficou
pela metade, e o que apareceu e não estava na lista.

Nenhuma das ações proibidas foi executada — sem `POST /cadastro`, sem
webhook do n8n, sem Meta, sem Easypanel/Vercel/painel do Supabase, sem
migration aplicada, sem push, sem tocar nas páginas legais, sem chave fora
do `.env.local`. Onde uma tarefa esbarrou nisso, está dito abaixo.

---

## 0. Comece por aqui: as três coisas que dependem de você

> **RESOLVIDO em 22/08.** O "(a), semeia" era sobre o alvo de teste do
> `/aprovar` (§1), que já estava feito — os dois assuntos se cruzaram. E a
> decisão do cartão do herói veio: **opção 1**, marcar como exemplo sem
> inventar número novo e sem tirar o cartão. Feito, commit `df19ec0` na LP.
>
> Fica o registro de por que eu tinha parado: a tabela `decisions` tem 0
> linhas e a string `_teste_visual` não existe em nenhum dos três
> repositórios, então a referência não batia com nada daqui. As duas
> leituras plausíveis eram opostas — uma escrevia no banco de produção, a
> outra alterava a afirmação principal de uma página de vendas no ar.

1. ~~**A LP afirma um resultado de cliente que nunca existiu.**~~
   **RESOLVIDO em 22/08**, opção 1: o cartão do herói ganhou uma tarja
   `EXEMPLO — tela de demonstração, não é resultado de cliente` como
   primeiro elemento, em 15px/14px contra 13,5px do corpo do cartão. Os
   números e o nome continuam os mesmos; nada foi inventado nem removido.
   Detalhe em `lp/docs/prova-social-e-legibilidade.md` §7.1.
2. **Criei 5 linhas de teste no banco de produção**, no negócio fictício
   `a0328fb8`, e elas continuam lá de propósito (§7). Remover:
   `node scripts/alvos-de-peca.mjs --remover`.
3. **A decisão do `.side-support`** (card de vidro sobre cobalto ou card
   claro) segue pendente e agora bloqueia uma linha do `conferir:cascata`.
   Não é minha para tomar: muda aparência em 9 telas.

---

## 1. `/aprovar` mostrando o logo como anúncio — **fechado**

`webapp` · commit `e55c714`

**O que fiz.** A definição de "peça de anúncio" saiu de dentro das telas e
virou `lib/criativos/peca.ts`. As quatro leituras da família passam a
chamar ela: `/aprovar`, `/reprovado`, `/anuncios` e a cadeia do `/inicio`.
Desenho em `docs/lote-leitura-de-peca.md`.

**Decisão que tomei sozinho, e diverge do que o buraco propunha.** O
`buraco-aprovar-sem-filtro.md` §5 propunha quatro filtros, e o quarto era
`.not("campaign_id", "is", null)`. **Não apliquei.** Ele recriaria a
divergência pela ponta oposta: a cadeia conta `pecasParaAprovar` sem olhar
`campaign_id`, então uma peça de campanha `draft` sem campanha faria a
cadeia dizer "tem peça" e a tela dizer "nada esperando você" — a mesma
mentira, trocada de lado. E a tela já se protege: o `campaign_id` só entra
num `select` que já está atrás de um `? :`. Motivo completo no §3 do
desenho.

**Decisão 2: consertar a família, não a tela.** Levantei que cinco lugares
liam `creatives` e cada um decidia sozinho o que conta como peça. Consertar
só a `/aprovar` deixaria quatro definições parecidas e independentes — a
condição exata para a quinta tela nascer errada.

**Decisão 3: os predicados ESTOURAM se faltar coluna no `select`.** O
cliente do Supabase aqui é sem tipo gerado, então `select("id, uso")`
devolve linha destipada e `p.arquivado_em` viraria `undefined` → `null` →
"não arquivada". A regra ficaria escrita e inerte, e nada acusaria. Coluna
que faltou é erro de quem escreveu, nunca estado do dado.

**O alvo, que era o problema.** Com zero linhas `uso = 'campanha'` no banco,
um teste do conserto passaria porque a tela fica vazia. Criei os dois lados,
por comando reprodutível (`scripts/alvos-de-peca.mjs`), no negócio fictício
— e **a logo é a linha mais recente de propósito**, senão a leitura antiga
devolveria a peça por sorte de ordenação e as duas colunas da medição
sairiam iguais. (Aconteceu na primeira versão; consertado.)

**Medido** (`pnpm medir:peca`):

```
V2G (real)   /aprovar antes: a logo do cliente   agora: (vazio)
FICTICIO     /aprovar antes: a logo             agora: ALVO-A-peca-viva
FICTICIO     /reprovado antes: viva + arquivada  agora: só a viva
cadeia e tela concordam nos dois negócios
```

`pnpm conferir:criativos`: 30 conferências. **Base explícita:** com o
predicado revertido ao comportamento de antes, acusa 9 falhas.

**O que a `/anuncios` era, medido e não inferido.** Ela **não** mentia hoje
— logo tem `campaign_id` nulo e nasce `draft`, então sumia por coincidência
entre duas colunas, não por filtro. O que vazava era peça de campanha
reprovada **e arquivada**, que seguiria em "precisa de você" para sempre.

---

## 2. `use_mock_db` com default `True` — **fechado**

`backend_v2g` · commits `4abf37c` e `033c4f5`

**O que fiz.** Default invertido para `False`. Mais a validação de boot
(conserto 3 do próprio documento): recusa subir com `APP_ENV=production` +
`USE_MOCK_DB=true`, e com `USE_MOCK_DB=false` sem credencial.

**Decisão: fiz o conserto 3 junto, que não estava pedido.** Sem ele, a
inversão trocava "201 falso" por "500 sem explicação na primeira requisição
que tocasse o repositório". E produção em modo mock não dá erro nenhum —
responde 201 para tudo. Conferi antes de escrever a validação que ela é
inerte em produção: `GET /saude` responde `{"ambiente":"production",
"mocks":{"db":false}}`, ou seja, o Easypanel já marca a variável
explicitamente, e nem a inversão nem a recusa mudam nada lá.

**O que quebrou, e é o achado.** Inverter o campo sozinho **não quebrou
nada** — o `conftest` já marcava `USE_MOCK_DB=true`. Quem quebrou foi a
validação, e **na coleta**, não na execução: `src/api/main.py` faz
`app = criar_app()` no nível do módulo, quatro arquivos de teste importam
`criar_app`, e isso roda antes de qualquer fixture existir.

```
3 errors during collection (unit) + 1 (integração)
```

Consertado como você disse que era para ser: **explicitando nos testes, não
mantendo o default perigoso.** `os.environ.setdefault` no topo do
`conftest`, com o porquê escrito. E `test_producao_com_token_sobe`, que
montava "produção" só com token, passou a escrever a combinação inteira e
ganhou o irmão do outro lado.

**Medido:** antes 278 unit + 5 integração; depois **288 + 5**, `ruff` e
`mypy` limpos.

**Achado que mudou o diagnóstico.** O `docs/mocks-e-teste-verde.md` cita o
`CLAUDE.md` §12 como origem da regra ("todos os `USE_MOCK_*` são `True` por
padrão"). **Essa frase nunca esteve no `CLAUDE.md`** — a seção fala em
"integração externa **paga**". A generalização nasceu no docstring do
`config.py` e foi citada de volta como se fosse do `CLAUDE.md`. Corrigi o
`CLAUDE.md` com a exceção por escrito.

**Nota de ambiente:** não havia `.venv` nem dependências nesta máquina.
Criei o venv e instalei (`make instalar`) para poder medir em vez de
inferir. `.venv` é gitignored.

---

## 3. Os números difíceis sem porta de volta — **fechado**

`webapp` · commit `85c775c` · desenho em `docs/lote-agora-eu-sei.md`

**O que fiz.** "Agora eu sei" na `/onboarding/contas`, só no estado
`nao_sei`. E a `/meu-negocio` passa a apontar para a tela onde cada número
difícil é respondível — continuando **sem `input`**, porque aquela decisão
está certa.

**A parte difícil não foi o botão, foi não apagar nada.** O `montar.ts` é
explícito: o jsonb registra um fato com hora, e apagar é reescrever
medição. O caminho óbvio (remover a chave `naoSei`) era exatamente o
proibido — e não por purismo: é aquele "não sei" com hora que faz o
`/inicio` trocar de dono no dia 5. Então reabrir **acrescenta**
`reabertoEm`, e `lerConta` ganhou o estado `reaberta`.

**Decisão: `reaberta` vira motivo `nao_perguntado`.** `MotivoPendencia`
existe para decidir o que a tela **oferece**, não para descrever histórico —
e o que se oferece a uma conta reaberta é a pergunta, igual a uma nunca
perguntada. O efeito colateral é o certo: o relógio da dívida para de
correr contra nós. Enquanto ele não sabia, a dívida era nossa; depois que
ele clicou, cobrar de nós um telefonema que ele dispensou seria mentir do
outro lado.

**Decisão: a armadilha ficou fechada por verificação, não por lembrete.**
`catalogo-cliente.ts` recusa importar se um campo `dificil` não disser
`ondeResponder`. O §7 do `buraco-numeros-dificeis.md` diz que essa classe de
falha se repete; um campo difícil novo daqui a três meses não vai depender
de alguém lembrar do documento.

**Medido:** `pnpm conferir:cadastro` §6 e §7, 12 conferências, os dois lados
de cada transição. **Base explícita:** com a leitura de `reabertoEm`
desligada, o §6 acusa 3 falhas.

**O que não fiz:** a varredura dos cinco pares de referência cruzada do §7
continua aberta. Fechei o caso que gerou o documento e pus uma trava para o
análogo do mesmo campo — não varri as outras delegações.

---

## 4. O conferidor de migrations — **fechado**

`webapp` · commit `d2f9e0e` · desenho em `docs/conferidor-de-migrations.md`

`pnpm conferir:migrations`, dentro do `pnpm conferir`. **77 objetos**
conferidos contra o schema vivo, os 20 arquivos, todos presentes.

**Decisão: a porta é a especificação do PostgREST, não o ledger.** O
`supabase_migrations.schema_migrations` e o `pg_proc` não são alcançáveis
com o que existe no `.env.local` — o PostgREST expõe só o `public`. Mas
`GET /rest/v1/` publica as 20 tabelas com todas as colunas e as 11 funções
expostas, numa requisição só, somente leitura.

**A camada do `supabase migration list --linked` NÃO roda aqui.** O projeto
não está linkado (`supabase/.temp/` só tem `cli-latest`), e linkar pede
credencial que não está no `.env.local` — parei nisso, como combinado. Ela
aparece na saída como **DESLIGADA**, com o comando e o motivo, em vez de ser
pulada em silêncio. **Ela é a única camada que enxerga migration aplicada
sem arquivo no repo**, então essa metade continua sem dono.

**Decisão: o que ele não alcança é impresso junto do verde.** 31 coisas
declaradas como fora do alcance (índice, constraint, trigger, policy, grant,
corpo de função, schema `private`). Um conferidor que confere 60% e diz
"TUDO CERTO" produz confiança que não corresponde a nada.

### Dois achados que não estavam na lista

- **A `0009` tem 13 linhas e zero DDL.** Consequência que não estava escrita
  em lugar nenhum: **a cadeia de migrations do repositório não reconstrói o
  banco.** `supabase db push` contra um projeto vazio produz um schema sem
  `execucoes`, `criativos` e `campanhas_meta` — e sem erro, porque não há DDL
  para falhar. Registrado, não resolvido: escrever o DDL das três a partir do
  schema vivo é lote próprio.
- **A `0002` se confere pela ausência.** Ela move `owns_business` e
  `handle_new_user` para o schema `private` para elas sumirem do PostgREST.
  Objeto ausente é prova tão boa quanto presente.

---

## 5. As regras inertes do CSS — **fechado**

`webapp` · commit `f392ce3`

`pnpm conferir:cascata`. Faz os passos 1, 2 e 3 da receita do
`regra-inerte.md` §4, e o 4 (especificidade) como camada de suspeita.

**Decisão forçada pelos fatos: a linha de base precisou de arquivo próprio.**
A §4 exige que o detector acuse os casos 2 e 4 antes de qualquer conserto —
**mas os dois já foram consertados no `globals.css`.** Rodar contra o arquivo
de hoje e ver verde não provaria o detector; provaria o conserto. Então a §0
roda contra `scripts/fixtures/cascata-casos-conhecidos.css`, que reconstrói
os casos 2, 3 e 4 mais quatro controles positivos, e **falha se não acusar
os dois**. Medido: com a regra do caso 4 desligada à mão, a §0 acusa.

Os controles positivos são metade do valor. A primeira versão do detector
acusou os quatro pares de `from`/`to` de dois `@keyframes` diferentes — falso
alarme, e alarme falso repetido é como se aprende a ignorar o conferidor.

**Na folha de hoje ele acha três inertes, e são exatamente as três do §6 do
documento** (`.side-support`). Chegou nelas sozinho.

**Decisão: elas não derrubam o `pnpm conferir`.** Ficam numa lista de
conhecidos com o motivo. A decisão que falta é de desenho e tem consequência
em 9 telas — um conferidor que nasce vermelho por decisão pendente é um
conferidor que alguém desliga na segunda semana. **A lista não é
esconderijo:** cada entrada é impressa sempre, e entrada que deixa de ocorrer
vira FALHA. Medido também.

**O caso 3 ganhou número, e não é 58.** São **104** seletores "classe + tag"
na folha. O cruzamento cru dá 17.041 pares; filtrando pelo JSX (a classe
simples usada naquela TAG, num arquivo que usa as ancestrais do composto)
sobram 103; exigindo valor diferente, **92**. Nenhum é veredito — virar
veredito exige o DOM montado, que o CSS não tem e o `className` de um
arquivo também não.

**Limites escritos e não resolvidos:** `!important` (5 usos, ignorados,
contagem impressa), `@layer`, estilo inline, o caso 1, e a leitura do JSX por
expressão regular.

---

## 6. O visual da landing page — **fechado, mas virou outra coisa**

`lp` · commit `ad2fcf4` · registro em `lp/docs/prova-social-e-legibilidade.md`

**A tarefa mudou no primeiro levantamento.** Ver §0, item 1.

**O que fiz:** removi a seção de prova social com `[PLACEHOLDER]` — que
estava **no ar**, servindo `[X] empresas usando a V2G` e
`[DEPOIMENTO CLIENTE 1 — foco em ...]` para qualquer visitante (conferido por
`curl` no domínio público, não presumido). Ficou só a linha que o próprio
autor escreveu para este caso, que é verdadeira. O título saiu junto:
"Negócios como o seu já estão no controle" também não é verdade com
`campaigns` em zero linhas.

**Decisão: não inventei depoimento, e não deixei como estava.** As opções
eram inventar (fora de questão), deixar (pior) ou tirar.

**Decisão: não mexi no cartão do herói.** É o elemento visual principal e
trocar o texto dele é escrever afirmação comercial nova. Fica para você, com
três saídas propostas.

**O visual, medido em 375×812, antes e depois:**

| | antes (no ar) | depois |
|---|---|---|
| falhas de contraste AA | 22 | **0** |
| texto abaixo de 12px | 16 | **0** |
| alvos de toque < 44px | 10 de 21 | **0** |
| `[PLACEHOLDER]` visíveis | 9 | **0** |

> **Correção de 22/08:** aquele "0" de contraste era **1**, não 0. A
> varredura pulava elemento com filho (`children.length > 0`), então não via
> nada que mistura texto com outra tag. Refeita por **nós de texto**, achou
> `.cmp-row.total .cmp-mkt` em 4,28:1 e `.pf-tag` em 11,5px. Os dois
> consertados; agora é 0 de verdade, conferido em 375px e 1280px. A lição
> não é o número: **um instrumento com ponto cego reporta zero com a mesma
> cara com que reporta zero de verdade.**

**Nenhuma cor da paleta mudou** — sete lugares trocaram qual token usam,
`--ink-mute` (3,07–3,50:1) por `--ink-soft` (6,05–6,89:1), os dois já no
`:root`. A regra da noite era não mexer na paleta; trocar o uso não é trocar
a paleta.

**Uma das 22 falhas era uma regra inerte** — o mesmo padrão da tarefa 5, no
outro repositório: `.isca .cta-sub-link {color: ice}` perdia para
`.section .cta-sub-link {color: cobalt}` por ordem, com a mesma
especificidade, porque `.isca` é um `<div>` dentro da `<section>`. Seta
cobalto sobre navy: **2,51:1**. Consertada por especificidade, não por ordem.

**Isto encostou nas páginas legais**, e está dito: o rodapé é compartilhado
pelas quatro. Mudou área de toque e opacidade de link. **Nenhum texto legal
alterado, nenhum dos três `.html` legais aberto para edição.** Conferido
depois que `privacidade.html` renderiza, sem rolagem horizontal.

### O que NÃO fiz, e por quê

**Não consolidei a escala tipográfica**, que era o coração do pedido visual.
Dois motivos, os dois medidos:

1. **O encaixe não é direto.** A LP tem 22 tamanhos e **zero tokens de
   tamanho no `:root`**; o app tem seis degraus. Mas a âncora de corpo do app
   é **13px** e a da LP está entre 14,5 e 16,5 — adotar a escala do app
   **encolheria** a LP, o contrário do que o leitor de 45 anos no celular
   precisa. Não é importação, é redesenho de escala.
2. **Não consegui ver a página.** O painel do navegador não compõe quadros
   nesta sessão; `screenshot` falha com timeout. Medi tudo por JavaScript na
   página viva. Contraste, corpo e área de toque são números — dá para
   consertar e reconferir pelo mesmo caminho. Ritmo e proporção são
   julgamento visual, e redesenhar 22 tamanhos sem olhar é o tipo de coisa
   que sai pior e ninguém percebe até o cliente ver.

Proposta escrita para quando você puder olhar: seis degraus na LP com os
**mesmos nomes** do app e valores próprios, um degrau acima — mesmo sistema,
escalas diferentes, num lugar só.

**Mais um achado:** `--body` é `'Segoe UI'`, que **não existe fora do
Windows**. Medido: 295 elementos renderizam na família de corpo e 144 em
Archivo. O texto corrido da LP não é a fonte da marca, e muda de desenho
conforme o aparelho. Não mexi — trocar `--body` altera 295 elementos de uma
vez, mesma armadilha do item 2.

---

## 7. O que eu escrevi no banco de produção

**5 linhas em `creatives`**, no negócio `a0328fb8` "Padaria Dona Zilda
(FICTICIO)", com `file_name` prefixado `ALVO-`. Elas continuam lá porque o
`pnpm medir:peca` mede contra elas — sem elas, a medição volta a rodar contra
tabela vazia sem ninguém perceber.

Por que ali é seguro, e as duas propriedades foram conferidas antes:

- `dados_ficticios = true` é **trava**, não etiqueta: `lib/pipeline/
  disparar.ts:289` e `lib/meta/publicar.ts:332` recusam o negócio antes de
  qualquer chamada externa.
- `profile_id` é **nulo** — ninguém é dono desse negócio, então a RLS não
  devolve essas linhas para nenhum usuário logado.

Também conferi que o backend nunca lê `creatives`/`campaigns` e que não há
scheduler nenhum: as linhas são inertes.

**Para remover:** `node scripts/alvos-de-peca.mjs --remover`.

Nada foi escrito no negócio real `a85c37a9`.

---

## 8. Coisas que apareceram e não estavam na lista

1. **A cadeia de migrations não reconstrói o banco** (§4). A mais séria das
   quatro.
2. **A LP afirma um resultado de cliente inexistente** (§0/§6). A mais
   urgente.
3. **`process.exit()` logo depois de `fetch` aborta o Node no Windows** com
   `UV_HANDLE_CLOSING` e sai com **127** — depois de imprimir "TUDO CERTO".
   Medido: com 50ms de espera ainda 127; com 300ms sai limpo, ou seja esperar
   é corrida, não conserto. O `conferir:migrations` foi escrito com tudo
   dentro de `main()` por causa disso. **Os outros conferidores com `fetch`
   escapavam por fazerem trabalho síncrono suficiente depois da chamada.**
   *Consertado depois, no commit `460f626`*: `conferir-cadastro.ts` e
   `medir-peca.mjs` passaram a usar `process.exitCode`. Conferidos os dois
   lados — 5 e 3 execuções saindo 0, e saída 1 com falha forçada.
4. **`--body` da LP é Segoe UI**, que só existe no Windows (§6).
5. **`pnpm conferir` já precisava de rede antes desta noite** — o
   `conferir:cadastro` baixa o `/openapi.json`. Isso resolveu a dúvida sobre
   pôr um conferidor de rede na suíte, e é por isso que o
   `conferir:migrations` entrou nela sem cerimônia.
6. **O diretório de trabalho desta sessão não é o do projeto.** A sessão
   abriu em `C:\Users\victo\v2g_saas` (repositório só de mockups); o trabalho
   está em `C:\Users\victo\v2g-deploy\{webapp,lp}` e o backend em
   `C:\Users\victo\OneDrive\Documentos\GitHub\backend_v2g`. Perdi os
   primeiros minutos procurando.

---

## 9. O que ficou pela metade

| o quê | onde parou |
|---|---|
| `supabase migration list --linked` | precisa de `supabase link`, que pede credencial fora do `.env.local`. É a única camada que vê migration aplicada **sem** arquivo. |
| A decisão do `.side-support` | pendente desde o QA-4; agora aparece a cada `pnpm conferir` |
| Os 92 candidatos de especificidade | lista medida, nenhum conferido — precisa do DOM |
| A escala tipográfica da LP | medida e proposta, não feita — precisa de alguém que veja a tela |
| O `--body` da LP | achado, não mexido |
| A varredura dos pares de referência cruzada (`buraco-numeros-dificeis.md` §7) | continua aberta |
| O DDL das três tabelas da `0009` | registrado como lote próprio |

---

## 10. Os commits, para o push

Nenhum push foi feito (não funciona neste ambiente).

**`v2g-deploy/webapp`** — a partir de `0586264`:

```
e55c714  Uma definicao so para "peca de anuncio", e o alvo que faltava para testar
85c775c  "Agora eu sei": a porta de volta do numero dificil, sem apagar a medicao
d2f9e0e  Conferidor de migrations por objeto, com o que ele nao alcanca impresso junto
f392ce3  conferir:cascata — acusa regra inerte, e prova que mede contra fixture propria
8c05ccf  Estado da noite de 21/08 (este documento)
460f626  Tira a corrida do fim dos dois conferidores que usam fetch
```

**`v2g-deploy/lp`** — a partir de `5b9189f`:

```
ad2fcf4  Tira a prova social inventada e conserta o que estava medido
df19ec0  Cartao do heroi passa a dizer que e exemplo, com a palavra visivel
```

> **Atenção no push da LP:** ele muda o que o público vê, e agora é o
> conjunto todo — sai o `[PLACEHOLDER]`, entra a tarja de exemplo no cartão
> do herói, e o contraste/corpo/toque ficam nos números do §6. Depois de
> subir, vale reconferir o `curl` no domínio: hoje ele ainda devolve os 9
> `is-placeholder` e o cartão sem tarja.

**`backend_v2g`** — a partir de `fc29168`:

```
033c4f5  lint: ordem de import que o ruff ja recusava, em dois arquivos
4abf37c  USE_MOCK_DB nasce false, e o app recusa subir nas duas combinacoes que enganam
```

> **Atenção no deploy do backend:** conferi que produção já marca
> `USE_MOCK_DB=false` explicitamente (`GET /saude` responde `{"db":false}`),
> então a validação nova é inerte lá. Se alguém tiver mexido nessa variável
> entre agora e o deploy, o serviço **recusa subir** — que é o
> comportamento desejado, mas é bom saber antes.

Um commit por tarefa, como você pediu. A única exceção é o `033c4f5`, que
existe **para** não misturar: são duas violações de lint que já estavam no
repo e que o `ruff --fix` corrigiu de passagem.

---

## 11. Estado das conferências, agora

```
webapp    pnpm conferir   →  exit 0
          (typecheck, lista-branca, estado, verba, cadastro,
           criativos, cascata, migrations)
          pnpm build      →  limpo
backend   pytest unit     →  288 passed
          pytest integracao → 5 passed
          ruff + mypy     →  limpos
lp        medição 375×812 →  0 falhas de contraste, 0 texto <12px,
                             0 alvo <44px, 0 placeholder
```
