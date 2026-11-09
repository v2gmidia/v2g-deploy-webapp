# N26 — M1/M2 / nova UI QA publicada e limite de identidade — 09/11/2026

## 0. Resultado e parada

**O bloqueio anterior de versão publicada foi superado para a conferência realizada.** A candidata QA está READY, o alias foi atualizado e a nova interface de Anúncios exibiu números na sessão autenticada disponível da **V2G**. Isso ainda **não é aceite dos números Dúú/Piligrin**, nem da fila/decisão na sessão do Cauã.

**Bloqueio atual exato:** a sessão Chrome disponível mostra Victor no negócio V2G e o seletor lista somente V2G. Não oferece Piligrin. Falta abrir a **identidade nominal já proprietária/autorizada da Piligrin**, sem conceder novo acesso ou usar a sessão de Cauã em seu lugar. Para a parte do gestor, Cauã precisa usar a própria sessão já atribuída. Não é necessário escolher outro piloto, criar compra ou refazer atribuição por suposição.

M2: formulário de envio visível no publicado; cliente comum foi redirecionado ao Início ao tentar abrir a fila de gestor. Nenhum arquivo foi selecionado/enviado e nenhuma decisão foi feita. A sequência autenticada positiva continua pendente da fonte/identidades corretas.

Esta rodada fez somente leituras do deployment/alias/logs e navegação em duas abas QA próprias. Sem Git, `.env`, credenciais, alteração de configuração/deploy, consulta ou escrita em banco/Storage, upload, gasto, Meta, produção, BM ou WhatsApp. Não repeti os testes locais anteriores, não editei runtime e não reescrevi checkpoints fechados, índice ou planilha.

## 1. Versão efetivamente confirmada

Conector Vercel, confirmação por deployment e alias em chamadas independentes, em 09/11 aproximadamente 00:00 BRT:

| Campo | Valor observado |
| --- | --- |
| Projeto | `v2g-webapp-qa` — `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Equipe | `team_sEnWVgpk9PlXLZwMQmd4sv3O` |
| Branch Git | **QA** |
| Commit Git | **fe5384de889dd222cfcee0d69677a6685b076caa** |
| Deployment | **dpl_8athSV5dryDvY5euqaNLat1wVHSw** |
| URL da versão | `https://v2g-webapp-vif75pcvm-v2-g.vercel.app` |
| Origem/estado | Git / **READY** |
| ready timestamp | `1794193186447` — 09/11/2026 02:59:46.447 UTC / 08/11/2026 23:59:46.447 BRT |
| Alias conferido | `https://v2g-webapp-qa.vercel.app` aponta ao mesmo deployment/projeto, sem erro de alias |

O campo `target=production` pertence ao **projeto QA isolado**. Não entrei no projeto de produção nem executei publicação. O deployment CLI antigo `dpl_H1N2U8Ye8JB3y5Wn6ucRRLPpbZCJ` ficou como evidência histórica do checkpoint anterior; seu bloqueio de consumidor não foi repetido como estado atual.

## 2. M1 — o que a interface nova mostrou de fato

Nova aba própria Chrome, sessão existente, URL:

`https://v2g-webapp-qa.vercel.app/anuncios?desde=2026-11-01&ate=2026-11-07`

Depois do carregamento, a página mostrou:

- Cabeçalho autenticado **Victor / V2G**; período **01/11/2026–07/11/2026**.
- Seção nova **“Anúncios da conta vinculada”**, conta **act_2818009911919726**.
- Consulta exibida em **09/11/2026 00:00:59**, horário de Brasília; fuso da conta **Brazil/East**, moeda **BRL**, fonte declarada **Meta Marketing API**.
- Campanha **V2G | Conversas no WhatsApp | 28-10**, ID **120252216516550234**; conjunto **120252216516540234**; anúncio **120252216516560234**.
- Na campanha, conjunto e anúncio, cada qual no seu nível: **R$ 26,49 investidos, 1.493 impressões, 22 cliques**, conversas no WhatsApp **“Não medido”** e estado **“Medições parciais”**. Não somei os três níveis.
- Configuração observada **“Ativado na Meta”** acompanhada da ressalva de que não comprova entrega agora.
- Outras campanhas pausadas apresentaram **“Sem medições neste período”** e campos **“Não medido”**, sem converter ausência em zero.
- Abaixo da coleção, seção distinta **“Histórico por rodada da V2G”**, com aviso para não somar as fontes; nela persistiu a falha de leitura legada. Essa falha **não apagou os números da coleção nova**.

**Aceite alcançado:** a nova UI publicada, em sessão autenticada V2G, exibiu hierarquia/valores/metadados e estados parciais honestos no período selecionado. Não capturei corpo HTTP/JWT nem comparei esses números V2G com a BM nesta rodada. Portanto, não é certificado independente de todos os campos da API/fonte ou de sua exatidão contábil.

### Log correlato e limite

Consulta de logs no mesmo deployment/projeto, janela **02:56:24–03:01:24 UTC de 09/11**, filtro backend, registrou para `/anuncios`:

- **03:00:52.138 UTC**: `/negocios/4406fcdb-9737-48d9-8cef-8aabb4eaf3ad/execucao`, HTTP **403**.
- **03:00:53.255** e **03:00:54.165 UTC**: `/negocios/4406fcdb-9737-48d9-8cef-8aabb4eaf3ad/consolidado`, HTTP **404**.

São leituras **legadas do negócio V2G**, compatíveis com a falha mostrada no histórico separado. Não as atribuí à coleção `/meta/campanhas`, à conta Dúú ou à autorização do Cauã. A amostra de logs não é inventário integral de requests nem validação do payload da API.

## 3. Por que não se comparou com Dúú

O seletor de negócios foi aberto na própria página atual e mostrou **somente “Abrir V2G”**. Não havia opção Piligrin. Não alterei cookie, URL de negócio, propriedade, papel ou sessão para contornar.

Alvo nominal da prova ainda pendente:

| Campo | Referência da Central para Dúú, não observada nesta UI |
| --- | --- |
| Negócio Piligrin | `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` |
| Conta Meta | `act_1165478988908157` |
| Campanha / conjunto | `52570261860675` / `52570262603875` |
| AD01 / AD02 | `52570262604075` / `52598499207075` |
| Período da referência BM | 01–07/11/2026, São Paulo |
| Referência humana recebida | Gasto 281,80; alcance 18.635; impressões 26.129 |

Os **26,49 / 1.493 / 22** vistos na V2G não são divergência contra **281,80 / 18.635 / 26.129** do Dúú: são outra conta, outra campanha e métricas distintas. Não atribuir o alcance da BM a cliques da UI. A tabela nova observada nesta sessão expõe gasto/impressões/cliques/conversas; não mostrou um campo de alcance para comparar.

**Menor ator/login necessário:** conta de cliente que já é proprietária da Piligrin e tem o grant QA nominal existente. O checkpoint anterior identificou esse proprietário como perfil `09e25ab4-b55b-48d1-bfde-181e41192bb6`, diferente do proprietário V2G; essa identidade não foi relida por SQL nem inferida do nome exibido nesta rodada. Central/Victor pode abrir essa conta no seu contexto apropriado, sem fornecer senha/cookie/token no chat e sem derrubar a sessão atual por automação. Não criar novo grant nem promover Victor a operador.

Para aceitar a mesa, **Cauã usa a própria conta já atribuída**. Não pedi prints recorrentes ou dupliquei mensagens; Central mantém a coordenação BM/WhatsApp.

## 4. M2 — portas publicadas observadas e sequência pendente

Segunda aba própria, aberta em `https://v2g-webapp-qa.vercel.app/criativos`, ainda no negócio **V2G**:

- Novo carregamento apresentou biblioteca e pedidos; ao resolver, biblioteca **0**, sem peça a revisar.
- Formulário **“Já tenho um criativo”** visível, etapas **Preparar criativo / Conferir e enviar**.
- Selecionar imagem JPG/PNG até 9 MB; objetivos **Receber mensagens no WhatsApp** e **Levar pessoas ao Instagram**; opção de promoção com prazo.
- **“Conferir criativo” desabilitado** sem arquivo e informações. Texto explícito de que enviar não coloca anúncio no ar.
- Não selecionei arquivo, preenchi intenção, chamei análise ou enviei pedido. Não inferi flags remotas completas a partir da presença do formulário.

Na mesma aba, navegação somente de leitura para `/gestor/criativos` terminou em **`/inicio`**, sem expor a fila ao cliente comum. Isso comprova uma porta negativa dessa sessão na versão publicada; não testa carteiras de dois operadores, assinatura de arquivos ou action de decisão.

**Faltam provas positivas no negócio correto**, seguindo a matriz existente sem marcá-la concluída:

1. Identidade nominal Piligrin abre Criativos. Confirmar fonte/identidade e autorizar uma única imagem própria/de teste antes de enviar; nada de material privado presumido.
2. Envio → registrar mesmo `request_id/business_id/autor/hash/tamanho/MIME/intenção`, linha e objeto privado; retomada não duplica quando oferecida. Nenhum desses fatos foi escrito nesta rodada.
3. Cauã, com sua sessão, abre a mesma peça da própria carteira e registra uma decisão/nota autorizada. Não usar a sessão do cliente ou admin para simular a dele.
4. Cliente recarrega e entra novamente: mesmo pedido, estado e nota; outro negócio/operador permanece sem acesso. Aprovação interna não vira “no ar”.

Matriz: `docs/qa/n26-p3-criativo-pronto-04-11/MATRIZ-QA.md`. Os **179 testes locais** do checkpoint de 08/11 continuam evidência histórica local; **zero testes locais foram repetidos** agora. Nenhum clique positivo de upload/revisão foi simulado como prova real.

## 5. Encaminhamento objetivo

- **Resolvido nesta rodada:** candidata QA/alias corretos; nova leitura visível com números **V2G**; entrada M2 visível e cliente sem fila de operador.
- **Falta para Dúú:** abrir a conta nominal Piligrin já autorizada e comparar a coleção/UI do mesmo negócio/conta/período contra a referência BM, com fuso/moeda/cobertura e IDs. O 07/08 mantém sua prova separada de backend/contrato.
- **Falta para Cauã/M2:** sessão própria do Cauã e ensaio de uma peça autorizada com retorno ao cliente. Não ampliar papel, criar compra ou conceder outro acesso para acelerar artificialmente.
- **Não resolvido por inferência:** falha legada do histórico, alcance não exibido no recorte observado, medição de conversas ausente, RLS/Storage por duas identidades, estabilidade/latência e funcionamento de produção.

**Parada no limite de identidade.** Nenhuma publicação/alteração adicional foi feita. O próximo passo depende de sessão nominal adequada e do ensaio coordenado, sem repetir a auditoria de código ou regressar ao bloqueio de deployment já superado.
