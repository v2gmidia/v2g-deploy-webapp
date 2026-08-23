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
| [`seletor-de-nicho-22-08.md`](./seletor-de-nicho-22-08.md) | 22/08/2026 | O lote do seletor de nicho: o `GET /nichos`, os dez chips com busca e o "Outro" no fim, a validação no servidor contra a lista viva, e o estado degradado (sem chips, só texto livre) quando o catálogo está fora. | Nenhuma bloqueando. O §0 lista o que ficou para depois: a `/meu-negocio` e o gate de completude. |

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
