# Dúú — leitura liberada e números conferidos na QA — 09/11/2026

## 0. Resultado e próximo passo

**A leitura real do Dúú funciona na sessão cliente Victor/Piligrin da QA publicada.** Após a concessão nominal autorizada, a coleta de 09/11/2026 às **00:31:01 BRT** mostrou os números de 01–07/11/2026. A conferência direta na Meta encontrou os mesmos gastos, impressões e cliques totais no conjunto abaixo.

**Ainda falta o aceite do gestor e o fluxo completo da peça.** Cauã recebeu a solicitação no grupo às 00:02; na nova conferência desta rodada não havia resposta posterior visível. Precisamos da indicação da peça aprovada, arquivo/post original e validação com a sessão própria dele. Não houve envio de criativo ou decisão simulada. O teto mensal estimado de R$ 3 mil continua sem confirmação.

O bloqueio 424 e a autorização preparada do [registro anterior](./n26-duu-leitura-meta-acesso-09-11.md) foram superados neste escopo de leitura. Isso não encerra toda a homologação M1/M2 nem corrige as leituras legadas de execução/consolidado.

## Ato autorizado e conferência da permissão

A Central perguntou expressamente se podia conceder ao leitor `v2g-qa-leitura` somente **Ver desempenho** da **CA - Dúú Gomes (`1165478988908157`)**, sem alterar campanhas, verba ou finanças e sem gerar token. Victor respondeu **“autorizo tudo”** àquela pergunta. O ato ficou limitado à seleção já apresentada.

Antes de confirmar, a Central releu usuário `61595938936618`, conta externa e permissões. Confirmou **Atribuir ativos uma única vez**. A Meta informou **1 ativo foi atribuído**. Após concluir e recarregar, o mesmo usuário Employee passou de dois para três ativos:

| Ativo | Acesso persistido |
|---|---|
| CA - Dúú Gomes | Parcial: Ver desempenho |
| V2G CONTA | Parcial: Ver desempenho |
| V2G MÍDIA | Parcial: Testar app |

Gerenciar campanhas, Gerenciar modelos da Central de Criativos e Gerenciar contas de anúncios ficaram desligados. Não se gerou, leu ou trocou token; não houve mudança de configuração do serviço, SQL ou deploy. A vinculação documental do leitor ao preparo do backend permanece distinta de uma inspeção do usuário do token atual, que não foi realizada. O êxito funcional posterior é a prova da leitura no fluxo real.

## Recorte e identidade da prova

- Aplicativo: `https://v2g-webapp-qa.vercel.app/anuncios?desde=2026-11-01&ate=2026-11-07`.
- Publicação QA já conferida: commit `fe5384de889dd222cfcee0d69677a6685b076caa`, deployment `dpl_8athSV5dryDvY5euqaNLat1wVHSw`.
- Sessão cliente nominal: Victor; negócio escolhido pelo botão legítimo **Piligrin**, ID `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`.
- Conta lida: `act_1165478988908157`; origem exibida **Meta Marketing API**; moeda **BRL**, fuso **America/Sao_Paulo**.
- Período visível em ambas as fontes: **01/11/2026–07/11/2026**. Não se usou soma de níveis para construir totais.
- Campanha: **[E - ABO - WHATSAPP] ESCALA 22/06/2026**, ID `52570261860675`.
- Conjunto: **Donos de bares 23-50**, ID `52570262603875`.

## Comparação dos números

| Conjunto Donos de bares 23-50 | QA, coleta 00:31:01 | Meta, conferência direta nesta rodada | Resultado |
|---|---:|---:|---|
| Gasto | R$ 281,80 | R$ 281,80 | Igual |
| Impressões | 26.129 | 26.129 | Igual |
| Cliques totais | 466 | 466 | Igual |

A campanha mostrou os mesmos três valores na QA; o conjunto tem medições próprias. Não se somam campanha, conjunto e anúncio entre si.

| Anúncio e ID | Gasto na QA | Impressões QA / Meta atual | Cliques totais QA / Meta atual |
|---|---:|---:|---:|
| AD 01 — `52570262604075` | R$ 265,96 | 25.025 / 25.025 | 444 / 444 |
| AD 02 — `52598499207075` | R$ 15,84 | 1.104 / 1.104 | 22 / 22 |

Os gastos individuais coincidem com a referência BM de 08/11; nesta nova comparação foram relidos diretamente o gasto do conjunto e as impressões/cliques dos dois anúncios. Nomes AD 01/AD 02 de outras campanhas não foram tratados como a mesma peça.

**Cliques totais não são cliques no link:** no conjunto a Meta mostra 224 cliques no link, enquanto os 466 correspondem a Cliques (todos). A UI QA continua apresentando **Não medido** para conversas WhatsApp. A coluna Meta de conversas por mensagem iniciadas não foi convertida automaticamente em conversas WhatsApp.

O orçamento configurado observado na Meta é **R$ 50/dia no conjunto**. Isso não comprova teto mensal aprovado nem autoriza mudar verba. O estado ativado não comprova entrega neste instante.

## Limites e pendências até o piloto

- **Cliente / números:** leitura positiva e comparação acima concluídas.
- **Gestor / números:** Cauã precisa conferir o mesmo recorte na própria conta; não se abriu nem simulou a identidade dele.
- **Peças:** área Criativos Piligrin abre, mas continua sem arquivo escolhido/enviado. Falta peça aprovada e origem para testar envio → fila do gestor → decisão → retorno ao cliente.
- **Histórico legado:** falhas separadas de execução/consolidado não receberam correção neste ato; não invalidam a leitura positiva da nova coleção nem podem ser declaradas resolvidas.
- **Produção do produto e operação dos anúncios:** nenhuma publicação, ativação/pausa, mudança financeira ou de orçamento. A única alteração de acesso desta rodada foi a concessão Meta somente de leitura já descrita.

Não houve mudança de código, execução de migration, commit ou push pela Central. Não se repetiu a suíte local: esta rodada mediu a integração publicada, com provas de interface. Não há conclusão de piloto completo ou de aprovação comercial.

## Evidências

Pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-09-11/`:

- `leitura-duu-permissao-aplicada.jpg`: atribuição persistida após recarregar.
- `piligrin-numeros-duu-confirmados.jpg`: campanha e conjunto com números na QA.
- `piligrin-anuncios-pos-acesso-dom.txt`: identidade, recorte, fonte e hierarquia completa renderizada.
- `meta-conjunto-gasto.jpg` e `meta-conjunto-gasto-dom.txt`: R$ 281,80 no conjunto selecionado.
- `meta-conjunto-impressoes.jpg` e `meta-conjunto-impressoes-dom.txt`: 26.129 impressões no mesmo conjunto/recorte.
- `meta-anuncios-impressoes.jpg`, `meta-anuncios-cliques-totais.jpg` e `meta-anuncios-cliques-dom.txt`: comparação dos dois anúncios.
- `caua-retorno-pendente-dom.txt`: somente o grupo correto; última solicitação entregue, sem resposta posterior visível nesta conferência.

## Planilha operacional atualizada

O controle existente atualizou a mesma planilha, sem reorganizar abas: **Visão geral!C12:F12, B19, D19** e **Novembro — execução!J2, L2, H3:L3**. Retorno da releitura: **13/13 textos conferidos**, histórico/formato preservados e **24 células vizinhas intactas**. A leitura do cliente ficou concluída; aceite do Cauã, peça/origem, fluxo de revisão e teto seguem pendentes. Permissão e IDs ficaram na parte técnica.

Planilha: `https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit?gid=2026110801#gid=2026110801`.
