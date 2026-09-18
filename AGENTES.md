# Regras de trabalho dos agentes — webapp da V2G

Repositório: `v2g-deploy/webapp`. Next.js, **sem Tailwind**.
Backend é outro serviço (`api.v2gmidia.com.br`) e outro repositório.

Comece toda sessão lendo este arquivo. Depois leia `CLAUDE.md` e
`docs/decisoes.md`, que são a memória do que já foi decidido.

---

## Quem decide o quê

**Victor** decide: o que vai para o `main`, o que vira deploy, a aparência
final, o que é aprovado depois de olhar captura, e o que muda regra de
produto.

**Gabriel** decide: conteúdo, nicho, copy que vem do backend, e o que o
cliente vê em termos de mensagem.

**Agente** decide: como medir, como implementar o que já foi decidido, e
como provar que funcionou. Nada além disso.

---

## PARE E PERGUNTE — nunca decida sozinho

- commit, push, merge, rebase, reset, amend, clean
- qualquer publicação na Vercel; push em `main` dispara deploy
- editar arquivo de produção: `app/(protected)/`, `app/(fluxo)/`,
  `app/(public)/`, `components/`, `proxy.ts`
- editar `app/globals.css` fora de uma tarefa que autorize isso
  explicitamente
- editar `docs/desenho/` — são os desenhos aprovados pelo Victor, não são
  código e não se corrigem
- mudar a escala de texto, a paleta, os cinco papéis de botão ou os cinco
  itens de navegação
- mudar texto que vem do backend (as frases sobre o estado da campanha).
  A tela não traduz nem inventa: se a frase está errada, é do Gabriel
- apagar arquivo que você não criou
- mexer em `.env`, segredo ou token
- criar botão para capacidade que o backend não tem

Se a tarefa parecer exigir uma dessas, escreva o que faria e **pare**.

---

## PODE FAZER SOZINHO

Ler, medir, rodar `pnpm typecheck`, `pnpm conferir` e `pnpm build`, criar
branch, trabalhar na bancada `/exemplo/`, capturar tela, escrever documento
em `docs/estado/` e registrar dúvida em `DUVIDAS.md`.

---

## COMO MEDIR

- **Número sem o comando ao lado não é medição.** Escreva "NÃO MEDIDO" com
  o motivo. Nunca zero no lugar de não medido.
- Separe **fato** (o que o comando devolveu) de **interpretação** (sua
  leitura dele).
- Para contar ou listar estrutura de código, use **AST, não grep**. Grep
  perde declaração com quebra de linha.
- Simule antes de aplicar: injete a regra com `<style>` no navegador, meça
  o que quebra, e só então edite o arquivo.

### Captura de tela — a regra que mais importa

**Arquivo com bytes não é prova de tela.** Uma rodada desta obra produziu
18 PNGs íntegros, com tamanho e cabeçalho válidos, todos da tela de login.
Ninguém percebeu até alguém abrir as imagens.

Depois de capturar, **abra e olhe cada uma**, e escreva uma tabela com
cinco evidências por arquivo: manchete visível, estado, tema, largura, e
ausência de tela de login ou erro.

**Armadilha conhecida:** o `proxy.ts` usa `startsWith("/inicio")` em
`PROTECTED_PREFIXES`. Qualquer URL começando com `/inicio` é redirecionada
para o login, inclusive `/inicio-preparando`. As rotas da bancada são
`/exemplo/inicio-*` — o prefixo `/exemplo/` não é opcional.

---

## O QUE ESTE REPOSITÓRIO TEM DE DIFERENTE

**Não há Tailwind.** Os tokens vivem em `app/globals.css`, escrito à mão.
Não instale Tailwind, não sugira Tailwind, não copie código que dependa
dele.

**O `globals.css` é CRLF.** Script que ancora em texto com LF não encontra
nada e falha em silêncio. Leia e grave preservando CRLF.

**O `DESIGN.md` da raiz é gerado**, por `scripts/gerar-design-md.mjs`, a
partir do `globals.css`. Não edite o `DESIGN.md` à mão: mude o CSS e
regenere. O script tem valores escritos na mão em alguns pontos — se o
`DESIGN.md` discordar do CSS, o script é que está velho.

**O hook do impeccable reprova valor fora da escala** e, a cada aviso,
**sugere que você abra uma exceção em arquivo de configuração**. Ignore a
sugestão, sempre. Conserte o código ou use o valor da escala mais próximo.
Se achar que a exceção é o certo, pare e pergunte.

**`pnpm conferir` está vermelho** por causa do `conferir:nichos`, que bate
no backend ao vivo e cuja lista encolheu de 10 para 8 nichos desde 22/08.
Não tem relação com trabalho visual. Rode assim mesmo, registre que
continua vermelho pelo mesmo motivo, e **rode um a um os conferidores que o
`&&` pula** — o `&&` para no primeiro erro e os seguintes nunca chegam a
rodar.

**Não há lint nem runner de teste separado.** `pnpm conferir` é a suíte:
21 conferidores, incluindo o typecheck. Isso é estado do repositório, não
coisa que você deixou de rodar.

**A bancada `/exemplo/` não pode entrar no build de produção.** O import
fica atrás do portão de `NODE_ENV`, não do parâmetro da rota. Prove depois
do build: grep no `.next` pelos textos novos e pela sentinela, e
`next start` devolvendo 404 nas rotas da bancada com `/entrar` em 200 como
controle positivo.

---

## AS REGRAS DO PRODUTO QUE NÃO SE NEGOCIAM

Na tela do dono **nunca** aparece: nota, estrela, semáforo, custo por clique
ou por conversa, promessa de prazo, a palavra "erro" dirigida a ele, nem
soma de moedas diferentes.

- Ausência de dado aparece como travessão com uma linha explicando, nunca
  como zero. **"não medido" e "vazio de verdade" são coisas diferentes** e
  não podem parecer a mesma.
- As frases sobre o momento da campanha vêm prontas do backend; a tela não
  traduz.
- O que não tem fonte de dado é **omitido, não desabilitado**. Botão parado
  ensina que a função existe e está a um clique.
  *Exceção deliberada, decidida pelo Victor em 16/09:* a ação "Voltar a
  anunciar" aparece desabilitada com o motivo escrito embaixo, porque a
  função vai existir e o dono precisa saber que ela é dele. Toda exceção
  nova precisa da mesma aprovação e do mesmo registro datado.
- **Lima `#E8FC65` significa "no ar agora"** e mais nada. Nunca fundo de
  botão com texto branco, nunca marca de conclusão.
- "Gestor" refere-se à própria V2G, que opera as campanhas. Decidido em
  16/09. A palavra é verdadeira e permanece.

Paleta: cobalto `#0743DC`, lima `#E8FC65`, marinho `#111E2F`, de
`app/globals.css`. Escala de texto: 12 · 14 · 16 · 20 · 24 · 30.
Raio: controle 12, cartão 16, pílula. Campo de texto em 16px, porque abaixo
disso o iPhone dá zoom ao focar.

---

## ONDE A MEMÓRIA MORA

Não redescubra o que já foi medido:

| Arquivo | O que tem |
|---|---|
| `docs/decisoes.md` | o que já foi decidido, por quem, quando |
| `docs/varredura-visual.md` | mapa das 26 rotas, componentes, duplicação |
| `docs/tokens.md` | camada de papéis, raio, escala aplicada |
| `docs/botoes.md` | as 22 aparências e os 5 papéis |
| `docs/contraste.md` | razões de contraste medidas |
| `docs/tipografia-pendente.md` | o que se sabe sobre `--body` |
| `docs/estado/indice.md` | o registro de cada sessão |
| `docs/v2g-wireframes/` | contrato de tela, dúvidas, capturas |
| `docs/desenho/` | os HTML aprovados pelo Victor. Leia, não edite |

Ao terminar, grave um registro em `docs/estado/` e a linha no índice.

---

## QUALIDADE ANTES DE ENTREGAR

`pnpm typecheck` EXIT=0. `pnpm build` EXIT=0. `pnpm conferir` rodado, com o
exit code colado e a explicação do vermelho conhecido.

Comportamento de produção não muda: o novo vive na bancada ou atrás de
flag desligada.

Cole o `git status` e explique **todo** arquivo que aparecer, inclusive os
que você não esperava.

---

## CONVERSA ENTRE SESSÕES

Ao responder outra sessão: **só fato medido, com arquivo:linha e o comando
ao lado.** Nada de "na íntegra" sobre resultado de grep.

Quem recebe **não escreve código com base na resposta sem medir do próprio
lado.**

Trocar de sessão não troca de repositório. Confira o caminho antes: este é
o webapp, o backend é outro.

Duas sessões nunca escrevem no mesmo arquivo ao mesmo tempo. Se descobrir
que outra está no mesmo arquivo, pare e avise.

---

## QUANDO PARAR

Pare e relate se:

- a suíte ficar vermelha por causa sua e você não consertar em duas
  tentativas
- a tarefa exigir algo da lista PARE E PERGUNTE
- a premissa da tarefa não bater com o repositório — diga o que mediu, não
  force
- a captura de tela falhar e você não conseguir em três abordagens
  diferentes. Sem prova visual, trabalho de interface não vale nada
- outra sessão estiver escrevendo no mesmo arquivo

---

## AVISO ABERTO

O Gabriel escolheu o **caminho A**. Isso pode tornar o `/conectar` com
Facebook Login e o token no Vault peso morto. **Não construa em cima do
Facebook Login** até o Victor decidir. Se a tarefa encostar nisso, pare e
pergunte.
