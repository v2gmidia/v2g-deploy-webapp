# A casa do criativo — os três blocos da `/criativos`

> 12/09/2026, branch `visual-v0`. Só front: **nenhum backend novo, nenhuma
> rota nova consumida.**
>
> A página passou de uma tarefa (analisar peça pronta) para três blocos, e
> virou item da barra — `/vendas` saiu no lugar dela. O porquê da troca está
> em `docs/decisoes.md`, entrada de 12/09/2026.

---

## Os três blocos, e o estado de cada um

| # | bloco | estado | o que sustenta |
|---|---|---|---|
| 1 | **Tenho uma peça pronta** | **funciona** | `POST /execucoes/{id}/criativo-pronto`, e a lógica não mudou uma linha |
| 2 | **Minhas peças** | **vazio por medição** | nenhuma rota GET devolve as peças enviadas — §2 |
| 3 | **Criar uma peça nova** | **estrutura, sem backend** | §3, com condição de remoção |

A ordem na tela é essa, e é deliberada: **o que funciona vem primeiro.** Ordenar
pelo fluxo ideal do produto (criar → ver → conferir) poria o bloco que não faz
nada no topo, e quem abre a página pela barra cairia primeiro no que não existe.

---

## §2 — Bloco 2: por que está vazio, e o que falta no backend

O briefing pedia: *"`GET /execucoes/{id}/criativos` existe e devolve as peças
com `url_assinada`. Se der para listar, liste."*

**A rota existe e responde 200. Ela não devolve as peças que o dono mandou para
análise.** Medido em produção, com o token do backend, versão no ar
`b6f668c1cc3f`:

```
GET /execucoes/{id}/criativos
  e3c5944f  Suco do victor      status=gerado            criativos=0
  ee301c4f  Facetas Curitiba    status=estrutura_pronta  criativos=2  (mock:true)
  a42aea32  V2G Teste Coloracao status=decidindo_canal    criativos=0
  98447192  V2G                 status=aguardando_fotos   criativos=0
```

O que ela devolve por item: `formato`, `storage_path`, `url_assinada`,
`largura`, `altura`, `angulo_origem`, `mock`, `descricao_visao`, `origem`,
`e_video`.

### A causa está no filtro, não no dado

```
rotas.py:1333   listar(id, TipoCriativo.CRIATIVO)   <- o que o GET devolve
rotas.py:1135   tipo=TipoCriativo.PRONTO            <- o que o upload grava
```

São **tipos diferentes** do mesmo enum (`src/db/criativo.py:32`). E
`TipoCriativo.PRONTO` é lido por **um lugar só** no backend inteiro —
`checar_compliance_visual/agente.py:78` — e **nenhuma rota GET o devolve**.

Consequência exata: a peça que o dono acabou de analisar **existe** no Storage
e tem `url_assinada` na resposta do POST, e **não há como pedi-la de volta
depois**.

### Por que eu não chamei a rota mesmo assim

Ela mostraria criativos **gerados**, que são outra coisa, moram em `/anuncios`,
e para as contas da V2G vêm zero. Um bloco "Minhas peças" listando zero por
chamar o endereço errado é pior que um vazio honesto: **o vazio se explica, o
errado não** — e no dia em que a geração ligasse, o bloco passaria a mostrar
peça que o dono nunca enviou, sob um título que diz que ele enviou.

### O que falta no backend, em ordem de tamanho

1. **um GET que devolva `TipoCriativo.PRONTO`.** O menor caminho é um parâmetro
   na rota que já existe — `GET /execucoes/{id}/criativos?tipo=pronto` —
   reusando `RespostaCriativos` e `CriativoRevisao` inteiros. Nenhum schema
   novo;
2. **o veredito guardado junto da peça.** Hoje o resultado da análise vive na
   resposta do POST e morre com ela. Sem persistir `veredito`, `motivos` e
   `custo_usd`, a lista mostra imagens sem dizer quais prestaram — o que é
   metade da utilidade do histórico;
3. **uma data.** `CriativoRevisao` não tem `criado_em`, e histórico sem data
   ordena por nada.

**Os três são do backend.** O front lê e desenha; nada aqui depende de mais
front.

---

## §3 — Bloco 3: o que ele é, e a CONDIÇÃO DE REMOÇÃO

### O que ele é

O desenho do fluxo, do wireframe que existe. O briefing citava
`v2g-configurar-criativo`, que **não existe** em `docs/v2g-wireframes`; o que
existe é **`v2g-gerar-criativo-{desktop,mobile}-v1.png`**, com os três passos
`Foto → Oferta → Gerar`, a seção *"A V2G já preparou isso"* e o aviso *"Você
não precisa escrever um prompt"*. **Usei esse, e é a proposta.**

Mantive os três passos e a promessa de que o dono não escreve prompt. Tirei os
controles, a grade de fotos e o botão *"Gerar 3 opções"*.

### O que ele NÃO tem, e é verificável

```
nenhum <input>      nenhum <button>      nenhum href      nenhum onClick
```

Medido no navegador, a 390px:
`document.querySelectorAll('.casa-desenho input,button,a,[onclick]').length === 0`.

A grade de fotos do wireframe ficou fora de propósito: ela mostra padaria e
café, e o dono leria como *"a V2G já fez isto"*. **Imagem de exemplo que pareça
peça gerada pela V2G é proibida** — é a mais fácil de violar sem querer.

### A CONDIÇÃO DE REMOÇÃO

> **Se o backend de geração de criativo para cliente não existir até
> `<DATA — o Victor preenche>`, este bloco sai do ar.**
>
> Sai o bloco inteiro: `CriarPeca.tsx`, o item do índice
> (`.casa-indice`) e o CSS `.casa-obra`/`.casa-desenho`/`.casa-passos`/
> `.casa-volta`. A `/criativos` volta a ter dois blocos e continua na barra.

**Deixei a data em branco de propósito, e ela é sua.** Um bloco que descreve o
que não existe precisa de prazo; sem prazo ele vira promessa permanente — que é
exatamente o que a expressão *"em breve"* faz, e é por isso que ela está
proibida no texto da tela.

**O que conta como "existir":** o dono consegue, pelo webapp, pedir uma peça e
receber uma peça de volta para aprovar. Não conta: o endpoint
`POST /agentes/gerar-criativo-visual` responder — ele já responde, e não é isso
que falta. O que falta é o que vem antes e depois dele.

---

## O que este lote NÃO mediu

- **as 11 telas logadas renderizando com sessão.** Medi que as 11 respondem
  `307 → /entrar?next=<rota>` — nenhuma 500, nenhuma rota perdida — e que
  `pnpm build` compila as 32. **Não abri nenhuma logado**: não tenho sessão, e
  criar uma seria escrever no banco;
- **a análise rodando de ponta a ponta depois da mudança.** Não toquei em
  `Analisar.tsx`, `actions.ts` nem em `lib/criativos/`, e `pnpm conferir:analise`
  passa — mas isso é estrutura, não um envio de imagem de verdade;
- **a barra inferior abaixo de 900px com o item novo.** O CSS que transforma a
  `.sidebar` em barra é o mesmo de antes e o DOM tem os mesmos cinco itens;
  não medi as cinco células de 64px com o rótulo "Criativos", que é mais curto
  que "Vendas" em nada e mais longo em três letras;
- **contraste dos elementos novos.** `docs/contraste.md` tem a tabela do
  projeto; os tokens que usei são os dele (`--ink-soft`, `--ink-mute`,
  `--navy`), mas não medi as razões dos pares novos.

## Uma fragilidade que eu deixaria anotada

O único sinal visual de *"isto não é um controle"* no bloco 3 é a **borda
tracejada** do `.casa-desenho`, e ela é discreta. Não há sombra, não há hover e
o cursor não muda — então nada convida ao toque —, mas alguém olhando rápido
pode ler o cartão como algo abrível. Se virar problema, o conserto é fundo
levemente diferente do `--surface`, não borda mais forte: borda forte chama
mais atenção para a coisa que não faz nada.
