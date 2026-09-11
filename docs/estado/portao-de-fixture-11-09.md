# O portão de fixture saiu das camadas de sessão — 11/09/2026, à noite

Sessão curta, só segurança. O lote é a auditoria do portão de fixture
aberto em `72bb099`: proposta 2 (tirar o portão das camadas que decidem
QUEM ENTRA, deixando só o da página) e os itens 1, 4 e 6.

---

## §0 O que depende de decisão humana

**Nada bloqueia.** Uma coisa só, para registro e não para decisão: a
captura de tela ficou mais cara de propósito — agora exige um login de
verdade no ambiente de desenvolvimento e o cookie de sessão entregue à
automação. Se isso doer na próxima rodada de capturas, o caminho barato
**não** é devolver o portão ao `proxy.ts`; é um script de sessão de
desenvolvimento, que é o que usei aqui e apaguei no fim.

---

## §1 O que saiu, e por quê

`72bb099` colocou o mesmo portão em três lugares: a página, o `proxy.ts`
e o `app/(protected)/layout.tsx` — e um quarto, o do tema, no layout
RAIZ. Os dois do meio são os que decidem quem entra; os outros dois
decidem o que se lê depois de entrar.

| onde | o que fazia | agora |
|---|---|---|
| `proxy.ts` | deixava `/inicio` passar sem sessão | **removido** — idêntico ao pré-`72bb099` |
| `app/(protected)/layout.tsx` | não redirecionava para `/entrar` sem sessão | **removido**, com o `user?.id ?? ""` desfeito junto |
| `app/layout.tsx` | tema forçado por variável, no site inteiro | **removido** — ver §2 |
| `app/(protected)/inicio/page.tsx` | escolhe a fonte do estado | **fica**, e só ele |

**A frase que estava errada no código.** O comentário do layout dizia que
o `proxy.ts` deixou a fixture passar e "ESTE layout barrou mesmo assim",
oferecido como prova da defesa em profundidade. Não barrava: o mesmo
portão estava escrito ali, com os mesmos dois trincos. Exceção copiada
para dentro das três camadas não é três camadas — é uma, escrita três
vezes, com o buraco no mesmo lugar. A correção está no lugar do
comentário antigo, e as duas §§ do `inicio-recomposto-11-09.md` que
repetiam a história ganharam a linha `> CORRIGIDO`.

---

## §2 O tema forçado: removido, não restringido

`V2G_FIXTURE_TEMA` morava no layout RAIZ, então valia para a landing
page e para o `/entrar` também: a maior superfície dos quatro portões,
guardando a menor necessidade — oito capturas.

Restringir custaria uma condição nova; remover custou zero, porque o que
ele fazia já existia sem ele. O tema vem do cookie `v2g_tema`, gravado
com `httpOnly: false` (`app/(protected)/conta/tema-actions.ts`), e quem
automatiza a captura já tem de escrever o cookie de sessão — escreve
este junto. **O resultado é mais fiel**: a captura passa pelo mesmo
caminho do cliente que escolheu o tema na `/conta`, em vez de um ramo que
só existe em desenvolvimento. Medido: `data-tema="escuro"` e
`data-tema="claro"` saíram só do cookie, sem variável nenhuma.

---

## §3 `pnpm conferir:portao` — a regra é de LUGAR

`scripts/conferir-portao-de-fixture.ts`, dentro do `pnpm conferir`:
nenhum arquivo que o Next compile — `app/`, `lib/`, `components/` e a
raiz, 152 arquivos — pode nomear uma `V2G_FIXTURE_*` fora de
`app/(protected)/inicio/` e `lib/dev/`.

Fora do alcance, cada um com motivo escrito no arquivo: `scripts/` (não
vira resposta HTTP, e um conferidor precisa poder escrever o nome do que
confere), `docs/` (prosa) e `.env*` (a casa da variável).

Duas coisas que ele tem e que são o que o faz valer: **controle
positivo** (se o padrão não achar as menções na área permitida, reprova —
zero achados por regex quebrada tem a mesma cara de zero achados por
código limpo) e um padrão **montado em runtime**, para este arquivo não
ser a primeira exceção que alguém abriria no dia de ampliar o alcance.

Ele pegou de verdade: reprovou o meu próprio comentário novo em
`app/layout.tsx`, que citava a variável do tema pelo nome.

---

## §4 A prova

Com `V2G_FIXTURE_INICIO` **ligada** e sem cookie, em `pnpm dev`: as 11
rotas de `(protected)` e as 10 de `(fluxo)` devolvem `307` para
`/entrar?next=…`, `/inicio` inclusive. Com sessão de verdade, as três
fixtures continuam renderizando — `0 de 4 fases`, `1 de 4 fases` e
`4 de 4 fases`, com os números de produção (`10,25`, `1.657`) na
terceira.

Build limpo (`rm -rf .next && pnpm build`): sentinela, `fixtures-inicio`,
`V2G_FIXTURE_INICIO` e `V2G_FIXTURE_TEMA` com **0** ocorrências em `.js`;
controle positivo do mesmo build em 25, 1 e 1 — incluindo `v2g_tema`, que
prova que o arquivo editado ESTÁ no pacote.

`pnpm conferir` e `pnpm build` saíram com exit 0.

---

## §5 O que NÃO foi medido

1. **O contrafactual de 11/09 não foi reproduzido.** Não montei de novo a
   árvore "proxy liberado + layout sem portão" para ver o layout barrar.
   O que está afirmado aqui é sobre o código que foi commitado, e esse eu
   li: nele o layout tinha o mesmo portão.
2. **Nenhuma tela foi olhada no navegador.** A prova das três fixtures é
   HTML servido, não pixel — não houve captura nova.
3. **Produção não foi tocada.** A prova do build é local; ninguém
   publicou nada.
4. A sessão de desenvolvimento que usei foi criada por link mágico pela
   admin API (sem senha, sem e-mail enviado) e **revogada no fim**. O
   script não ficou no repo.
