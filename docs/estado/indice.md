# Índice dos documentos de estado

**Este arquivo não é um documento de estado.** É a lista deles, e existe
para responder uma pergunta só: *qual eu leio?*

Sem isto, daqui a um mês a pasta é um monte de datas e ninguém sabe qual
está valendo — que foi exatamente o motivo de o Victor pedir o índice.

---

## Como ler esta pasta

Um documento de estado é o **registro de uma sessão**, escrito quando ela
termina: o que foi feito, cada decisão tomada sozinho e o porquê, o que não
deu certo, o que ficou pela metade e — na §0 — o que depende de decisão
humana.

Regras que fazem a pasta continuar legível:

1. **Documento de estado não se atualiza depois de fechado.** Ele é o
   registro daquele dia. O que mudou depois vira documento novo, ou uma
   linha `> RESOLVIDO em <data>` acima do item — nunca uma reescrita que
   apaga o que se pensava na época.
2. **O mais novo NÃO substitui o mais velho.** Eles cobrem assuntos
   diferentes. Por isso a coluna "o que cobre" abaixo importa mais que a
   data.
3. **Quem fecha um lote acrescenta a linha aqui**, no mesmo commit do
   documento. Índice atualizado depois é índice que envelhece.
4. **A §0 é a única parte que fica "viva"** — ela lista o que depende de
   humano, e some quando a pendência é resolvida.

---

## Os documentos

| documento | data | o que cobre | pendências abertas |
|---|---|---|---|
| [`noite-21-08.md`](./noite-21-08.md) | 21/08/2026 | Seis tarefas de trabalho autônomo: a `/aprovar` mostrando logo como anúncio, o `use_mock_db` com default `True`, os números difíceis sem porta de volta, o conferidor de migrations, as regras inertes do CSS, e o visual da landing page. | Nenhuma — a §0 dele foi resolvida em 22/08 (cartão do herói da LP). |
| [`seletor-de-nicho-22-08.md`](./seletor-de-nicho-22-08.md) | 22/08/2026 | O lote do seletor de nicho: o `GET /nichos`, os dez chips com busca e o "Outro" no fim, a validação no servidor contra a lista viva, e o estado degradado (sem chips, só texto livre) quando o catálogo está fora. | Nenhuma. A `/meu-negocio` do §0.2 foi feita em 23/08; o gate de completude do §0.3 continua esperando a decisão "6 campos ou 11?" em `decisoes.md`. |
| [`webhook-n8n-25-08.md`](./webhook-n8n-25-08.md) | 25/08/2026 | O lote 6: ligar o webapp no webhook do n8n. **O pipeline rodou ponta a ponta pela primeira vez** — 133 s, US$ 0,141 de piso medido, terminando em `aguardando_fotos`. Traz o caminho do webhook medido nó a nó, as cinco tentativas que falharam antes e o que cada uma ensinou, e o texto que os agentes escreveram. | Cinco, na §0. A que decide: o gate de 0,60 promete bloquear e não bloqueia — proposta de conserto com os dois caminhos na §9.2. As outras: o `{SERVIÇO}` que vai para o lote 3, o `LLM_MODELO` de produção, o log do Easypanel e a rotação dos segredos. |
| [`nicho-identificador-23-08.md`](./nicho-identificador-23-08.md) | 23/08/2026 | A inversão do armazenamento (`businesses.niche` passa a guardar `clinica-odontologica`, não "Dentista") e o fechamento da porta dos fundos da `/meu-negocio`: o mesmo seletor, a mesma validação, e nicho não reconhecido virando pendência visível em vez de erro. Inclui o jargão que vazava para a tela com o catálogo fora. | Nenhuma bloqueando. O §0 registra que **nenhuma linha foi migrada** e que a extração ainda escreve nicho em texto livre. |
| [`infraestrutura-25-08.md`](./infraestrutura-25-08.md) | 25/08/2026 | O lote 1: o inventário medido da infraestrutura. Onde cada coisa roda (Hostinger/Campinas, Vercel gru1, Supabase sa-east-1, Zoho/EUA), a política de backup de cada alvo, os dois provedores de IA em runtime, e a confirmação de que **não existe Google Cloud** em nenhum dos dois repositórios. Insumo direto do lote 2. | Quatro, na §0: o prazo de retenção de backup não declarado pelo fornecedor, os cinco subprocessadores fora da política, os dois provedores declarados e inertes, e o banco/storage do Supabase sem cópia. |
| [`dia-seguinte-01-09.md`](./dia-seguinte-01-09.md) | 01/09/2026 | A pergunta diária e a tela "investiu X, voltou Y": a camada das quatro rotas, a `/inicio` lendo o acumulado do negócio, e o card com máscara de moeda. Inclui o fuso que apagava um dia por upsert, o `respondeu_hoje: null` que derrubava a gravação, e o card que sumia sem rastro. | **Sim, e a que importa: o DISPARADOR não existe** — o loop está construído e mudo. Mais o furo de continuidade (dia pulado é dia perdido). Ver a §0. |
| [`pilares-10-09.md`](./pilares-10-09.md) | 10/09/2026 |  O lote dos cinco itens e o estado dos quatro pilares. Traz o mapa do que o webapp consome do backend (6 de 49 rotas), a camada de leitura do dashboard, o consumo de `/perguntas-pendentes`, e a validação de upload. | **Seis, na §0.** As três primeiras travam trabalho pronto: ~~os dois contratos que não estão no repo~~ (**§0.1 vencida** — ver a linha de baixo), o tom do degrau do meio, e a rota que diga QUAIS fotos pedir. |
| [`tela-de-resultado-10-09.md`](./tela-de-resultado-10-09.md) | 10/09/2026, à tarde | **Comece por aqui.** A tela de resultado no ar com dado real: `metrics_daily` fora das três telas, o validador que descartava oito campos em silêncio, os catorze níveis do contrato no lugar de sete frases locais, e `dinheiro()` com moeda obrigatória. Traz a regra de quem pode consultar qual campanha. | **Quatro, na §0.** O vínculo `business_id` é feito à mão e duas campanhas com dinheiro real continuam órfãs; o coletor parou em 07/09; a tela nunca foi vista logada. |
| [`metrics-daily-esta-vazia.md`](./metrics-daily-esta-vazia.md) | 10/09/2026 | A tabela que três telas leem, que nasceu na 0001 e nunca recebeu uma linha. O que cada tela mostra hoje (nenhuma mostra erro nem `R$ 0,00`, mas duas dizem coisas que podem ser falsas), e o veredito sobre matá-la. | Não morre hoje; o gatilho é o consolidado trazer `investiu_centavos`. Dois achados de lambuja na §4: a `/anuncios` mostra custo por conversa e promete 48 horas. |
| [`perguntas-pendentes-os-tres-tons.md`](./perguntas-pendentes-os-tres-tons.md) | 10/09/2026 | Os três tons da escada de silêncio, escritos e **não implementados**. A escada medida (0-2 `pergunta`, ≥3 `cobranca`, ≥6 `oferta_de_ajuda`, com teto) e por que o degrau do meio, na minha versão, não cobra. | **Sim, duas na §4.** O degrau do meio pode mesmo não cobrar? E: nos três degraus a mensagem só alcança quem já voltou. |
| [`fotos-a-tela-nao-sabe-o-que-pedir.md`](./fotos-a-tela-nao-sabe-o-que-pedir.md) | 10/09/2026 | O achado que trava o pilar 3: nenhuma rota diz quais ângulos a execução precisa nem quais já chegaram. O que foi construído mesmo assim (recusa no navegador, clientes, `multipart`) e o pedido ao backend. | **Sim.** O pedido está na §2: `GET /execucoes/{id}` incluir `fotos_pedidas[]` com `angulo`, `rotulo` e `recebida`. |

---

## Cuidado com o nome parecido

**[`../estado-do-cliente.md`](../estado-do-cliente.md) NÃO é documento de
estado de sessão.** Ele é documento de desenho — descreve a cadeia que
decide em que pé o cliente está (`estadoDoCliente()`), e fica em `docs/`,
não aqui. O nome colide e já confundiu.

Mesma coisa para `docs/lote-*.md` (o desenho de um lote, escrito **antes**)
e `docs/buraco-*.md` (a medição de um defeito). Os três são vizinhos deste
diretório e nenhum deles é registro de sessão:

| família | quando é escrito | responde |
|---|---|---|
| `estado/<assunto>-<data>.md` | ao fim de uma sessão | o que aconteceu |
| `lote-*.md` | antes de um lote | o que vai ser feito |
| `buraco-*.md` | ao medir um defeito | o que está quebrado, e o conserto |
| `decisoes.md` | quando um humano decide | o que foi decidido fora do Claude Code |
