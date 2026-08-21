# Buraco — o upload de foto e o `aguardando_fotos` não se conhecem

**Medição de 20/08/2026.** Documento de medição: não se atualiza. Se o
defeito for consertado, o conserto é registrado abaixo da linha, sem apagar
o que está aqui.

Encontrado ao desenhar o lote F (`tela-processando.md` §2.3). **Não é o
assunto daquele lote e não foi consertado lá** — o conserto exige chamar o
backend, e o lote F não mexe no backend. Está separado porque é buraco de
integração, de outra família.

---

## 1. O que foi medido

O backend tem um estado de execução que espera foto do cliente, e uma rota
para recebê-la:

```
EstadoExecucao.aguardando_fotos          (lib/backend/cadastro.ts:26)
POST /execucoes/{id}/fotos               (rota do backend, "chamado pelo n8n")
POST /execucoes/{id}/aguardar-fotos      (transição, "chamado pelo n8n")
```

O webapp tem upload de foto, e ele grava em outro lugar:

```
lib/identidade/armazenar.ts    → supabase storage + tabela `creatives`
                                 (createAdminClient, uso in logo|identidade)
```

**Os dois lados não se falam.** `grep` por `execucoes/` e por `fotos` em
`lib/` e `app/`:

```
chamadas a POST /execucoes/{id}/fotos no webapp inteiro:   0
```

`lib/backend/` só conhece duas rotas hoje — `GET /campanhas/pre-requisitos`
e `POST /cadastro` (esta desde o lote E). A rota de fotos nunca foi
implementada do nosso lado.

## 2. A consequência

Se uma execução entrar em `aguardando_fotos`, **o cliente não tem como
sair dela pelo produto.** Ele pode subir quantas fotos quiser na `/conta`:
elas viram linhas em `creatives` com `uso = 'identidade'`, e a execução
continua esperando uma foto que ninguém entrega ao backend.

O pipeline fica parado por tempo indeterminado, e:

- o relógio do operador **não** o acusa — `andamentoDaExecucao` tira
  `aguardando_fotos` dos cortes de propósito (`lib/pipeline/relogios.ts`),
  porque a espera é do cliente e não nossa;
- o relógio do cliente **também não** — a etapa 3 da cadeia sai antes de
  qualquer prazo nesse estado (`lib/estado/frases.ts`), pelo mesmo motivo.

Ou seja: **é o único estado do pipeline que nenhum dos dois relógios
enxerga.** As duas exclusões estão certas isoladamente — nenhuma delas
errou. O caso ficou sem dono porque cada uma delegou ao outro lado, que é o
defeito que este projeto já registrou duas vezes: dois donos apontando um
para o outro, e um caso acontecendo em silêncio.

## 3. O que o lote F fez, e o que ele não fez

**Fez:** a etapa 3 da cadeia passa a dizer a verdade nesse estado — bola do
cliente, texto que diz que o anúncio está esperando uma foto dele, e ação
de **falar com a gente**. Antes ela dizia "a gente está montando o seu
primeiro anúncio", que é mandar o cliente esperar a si mesmo.

**Não fez:** a ação não é "subir foto", e é decisão, não preguiça. Um botão
de upload ali levaria o cliente a fazer uma coisa que não destrava nada — e
botão que não resolve é pior que silêncio, porque ele cumpre a tarefa,
volta, e continua parado sem entender por quê.

## 4. O que NÃO foi verificado

> ### ERRADO. MEDIDO DE NOVO EM 21/08/2026, NO CORPUS CERTO.
>
> **O parágrafo abaixo fica como está, e é para ficar.** Ele é o erro, e
> apagá-lo apagaria a única evidência de como ele foi cometido.
>
> `aguardando_fotos` **não é teórico. Aconteceu 7 vezes.**
>
> ```sql
> -- Oregon (cvwxfalweuplrlchzzeo), 49 execuções:
> pipeline_texto_rodando  15
> cadastro_completo        9
> estrutura_pronta         8
> aguardando_fotos         7     ← 14% do corpus
> gerando_criativo         7
> gerado                   3
> ```
>
> **O erro não foi de raciocínio, foi de corpus.** Contei os status das 5
> linhas do `V2G-SITE` e escrevi "nenhuma execução deste projeto passou
> por lá". As 5 do V2G-SITE são 4 escolhidas a dedo **por cobertura** na
> migração (`migracao-banco.md`, PLANO FINAL) mais a nossa de 19/08 — uma
> amostra curada, não uma amostra. O histórico de verdade tem 49 linhas e
> mora no outro banco.
>
> **E a inferência que ele sustentava também cai:** `origem_criativo`
> fixo em `"gerar"` **não** impede `aguardando_fotos`. Sete execuções
> chegaram lá de qualquer forma. O que eu tinha era uma hipótese sobre a
> rota do n8n, e ela está agora refutada por dado, não confirmada.
>
> **Consequência para o §2 e o §3:** o beco sem saída não é um risco
> hipotético que a cadeia cobre por precaução. É um estado que o pipeline
> real produz em 1 de cada 7 execuções, e para o qual o produto não tem
> saída. O §5 deixa de ser "para quem pegar um dia" e vira trabalho com
> prazo — e a pergunta 4 de lá, que eu tinha posto como a primeira,
> **já está respondida: sim, é alcançável.**

**Se isto acontece.** `origem_criativo` é fixo em `"gerar"`
(`lib/cadastro/montar.ts:394`), e daí se conclui que a IA monta a peça sem
foto do cliente — o que faria o n8n nunca rotear para `aguardando_fotos`.
**Isso é inferência sobre um fluxo que não está nesta máquina**, e a única
execução de cliente que existe está parada em `cadastro_completo` desde
19/08. Nenhuma execução deste projeto passou por `aguardando_fotos`.

Então este documento registra um beco que pode nunca ser percorrido. Ele
existe porque a alternativa era a cadeia dizer a frase proibida se ele for.

## 5. O que o conserto exigiria

Fora do lote F por escopo, listado para quem pegar:

1. `lib/backend/` ganhar a chamada `POST /execucoes/{id}/fotos` — é o
   primeiro `POST` além do `/cadastro`, e entra pelo `enviar()` que já
   existe em `cliente.ts`.
2. Decidir **o que** se manda: as fotos já estão em `creatives` +
   storage, e a rota do backend espera um formato que não foi lido.
3. Decidir **quem** dispara: o cliente pela `/conta`, ou nós ao ver o
   estado. Se for o cliente, a ação da etapa 3 muda de "falar com a gente"
   para o upload de verdade — e aí o botão resolve.
4. ~~Perguntar ao Gabriel se `aguardando_fotos` é alcançável com
   `origem_criativo = "gerar"`.~~ **RESPONDIDO POR MEDIÇÃO em 21/08** — é
   alcançável, 7 de 49. Ver o quadro do §4. O que resta perguntar a ele é
   outra coisa: **o que faz o pipeline entrar nesse estado**, já que não é
   o `origem_criativo`.

~~O item 4 vem antes dos outros três.~~ Ele caiu. Os itens 1 a 3 são
trabalho de verdade, com um estado que o pipeline produz em 1 de cada 7
execuções e que o produto não sabe destravar.
