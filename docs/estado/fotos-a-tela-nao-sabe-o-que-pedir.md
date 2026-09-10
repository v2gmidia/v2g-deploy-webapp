# A tela não sabe QUAIS fotos pedir — o achado do item 5

Medido em 10/09/2026 contra o `openapi.json` de produção.

---

## 0. O achado

**Nenhuma rota diz quais ângulos a execução precisa, nem quais já foram
entregues.** Procurei nas 49 operações e nos schemas.

```bash
GET https://api.v2gmidia.com.br/openapi.json
# schemas que citam "angulo":
#   Anuncio, CopyAngulo, CriativoRevisao, EtapaAprovacao, Legenda,
#   OrigemDoCriativo, gerar_copy/Saida, gerar_criativo_visual/Entrada+Saida
```

Todos são de **saída** do pipeline — o ângulo aparece depois que a copy
foi gerada. Nenhum é de **entrada** para a tela.

E as duas rotas que a tela usaria:

```
POST /execucoes/{id}/fotos     body: fotos[] (binário), logo (opcional)
GET  /execucoes/{id}           devolve: status, nicho, nome_negocio,
                               requer_revisao, motivos_revisao, …
```

`POST /fotos` recebe uma lista sem rótulo: não há campo dizendo que
*esta* foto é do ambiente e *aquela* é da pessoa. E `GET /execucoes/{id}`
devolve o estado da execução sem nenhuma lista de pendências de foto.

**Consequência: a tela só consegue dizer "mande umas fotos".** É
exatamente o que o lote pediu para não fazer.

---

## 1. Por que isso importa mais do que parece

O `status` da execução é `aguardando_fotos`, e a `/inicio` já mostra
"Precisamos das suas fotos para continuar" — medido no negócio da V2G,
que está nesse estado desde 25/08.

Um pedido genérico produz o que sempre produz: a pessoa manda três fotos
da fachada. O gerador precisa de ângulos diferentes para montar peças
diferentes, e com três fotos do mesmo ângulo ele gera três peças iguais —
ou pede de novo, que é a pior experiência possível depois de a pessoa já
ter feito o esforço.

**Pedir nomeando é o que transforma "mande umas fotos" numa tarefa que
alguém consegue cumprir de primeira.**

---

## 2. O que eu precisaria, e é pequeno

Qualquer uma das duas resolve:

**a)** `GET /execucoes/{id}` passar a incluir os ângulos pedidos e o
estado de cada um:

```json
"fotos_pedidas": [
  { "angulo": "ambiente", "rotulo": "O espaço, por dentro", "recebida": true },
  { "angulo": "pessoa",   "rotulo": "Você ou sua equipe",   "recebida": false }
]
```

**b)** `POST /fotos` aceitar o ângulo junto de cada arquivo, e uma rota de
leitura dizer o que falta.

A **(a)** é melhor para a tela: uma leitura só, e ela já sabe montar a
lista do que falta sem inventar vocabulário. O `rotulo` vindo do backend
evita o que já aconteceu com `status` — duas traduções do mesmo termo, em
dois lugares, divergindo.

**Se o `rotulo` não vier, eu escrevo.** Mas aí o texto que o dono lê mora
aqui e a regra mora lá, e um dia elas discordam.

---

## 3. O que foi construído mesmo assim

A parte que não depende do achado:

- **`lib/criativos/envio.ts`** — a recusa no navegador, antes do upload.
  Vídeo, formato, extensão que não bate com o conteúdo, lado menor abaixo
  de 1024, arquivo vazio. Cada recusa com texto que diz **o que fazer**, e
  nenhum deles usando a palavra "erro" — a pessoa mandou a foto do próprio
  negócio, e não errou nada.
- **`lib/backend/criativos-do-cliente.ts`** — `enviarFotosDoNegocio()` e
  `enviarCriativoPronto()`, com validação de fronteira das duas respostas.
- **`lib/backend/cliente.ts`** ganhou `enviarArquivos()`: `multipart/form-data`
  com o `Content-Type` deixado para o `fetch` montar, porque o `boundary`
  só ele sabe.
- **`pnpm conferir:envio`** — 43 conferências.

**A tela não foi construída.** Ela é o que depende do achado: sem saber o
que pedir, o que eu escreveria é o "mande umas fotos" que o lote recusou.

---

## 4. O que este documento não mediu

- **Não exercitei `POST /fotos` contra produção.** Seria escrita em
  execução real, e escrita em produção não acontece sem OK.
- **Não sei se o backend REJEITA por qualidade hoje.** O lote diz que sim
  (1024px, formato, contraste); o `openapi.json` não descreve as regras,
  só o `recusados[]` da resposta. A minha validação usa os números do
  lote — se o backend usar outros, quem está errado é o meu arquivo.
- **Não sei o que acontece se faltar ângulo.** Se o pipeline segue com
  três fotos iguais, ou se ele para, muda o quanto este achado é urgente.
