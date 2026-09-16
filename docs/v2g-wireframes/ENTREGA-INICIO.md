# Entrega — o Início canônico

Sessão longa de 15–16/09/2026, trabalhada sozinho com o Victor dormindo.
Regra da sessão: não parar para perguntar, escolher o conservador, registrar
e seguir. Tudo o que ficou em aberto está em [`DUVIDAS.md`](./DUVIDAS.md).

**Nada foi commitado, publicado nem aplicado em tela de produção.**

---

## 0. Onde olhar primeiro

A tela canônica roda sem login, em desenvolvimento:

```
http://localhost:3000/exemplo/inicio-pausado      ← o estado da conta real
http://localhost:3000/exemplo/inicio-no-ar
http://localhost:3000/exemplo/inicio-preparando
http://localhost:3000/exemplo/inicio              ← a tela ATUAL, para comparar
```

As capturas finais estão em [`capturas/r3/`](./capturas/r3/), 18 arquivos:

| Estado | claro | escuro |
|---|---|---|
| **pausado** | `r3-pausado-claro-{1280,900,375}.png` | `r3-pausado-escuro-{1280,900,375}.png` |
| **no ar** | `r3-no-ar-claro-{1280,900,375}.png` | `r3-no-ar-escuro-{1280,900,375}.png` |
| **preparando** | `r3-preparando-claro-{1280,900,375}.png` | `r3-preparando-escuro-{1280,900,375}.png` |

As rodadas 1 e 2 ficaram gravadas em `capturas/r1/` e `capturas/r2/` para a
evolução ser visível. O portão da Etapa 0 é `capturas/prova-0.png`.

## 1. O que mudou em relação à tela atual

**Em todos os estados.** Saiu a segunda trilha. A tela atual desenha quatro
fases no topo (`TelaDoInicio.tsx:315`) e, três blocos abaixo, uma lista com as
seis etapas (`:388`) — duas réguas para a mesma caminhada, que é o defeito 10.a
do contrato. Ficou **uma**: as quatro fases, no herói, com um contador só. A
cadeia de seis continua inteira na lógica e continua decidindo qual é a ação
primária; ela deixou de ser desenhada.

**Pausado.** É onde estava a mentira. A tela atual mostra "Nada está esperando
por você" (`:554`) ao lado da manchete que diz que o anúncio não está no ar, com
quatro selos de conclusão. Agora: as marcas de fase ficam **neutras** quando o
anúncio não está no ar agora, o selo do herói diz "Já rodou", e o cartão de
decisão deixa de anunciar conclusão — ele nomeia o que dá para fazer e leva à
única saída que o produto realmente tem, falar com uma pessoa, em botão cheio.

**No ar.** Mesma composição, e é de propósito: quem passou semanas em
"preparando" não deveria reaprender onde as coisas ficam. O que muda é o sinal
— **lima acende só aqui** — e a manchete no presente.

**Preparando.** O herói diz que o anúncio ainda não foi ao ar, a fase 2 aparece
"Em andamento", e o cartão de decisão carrega a tarja de quem tem a bola
("A gente está devendo", quando é nossa). Sem números: a seção inteira é
omitida, não renderizada vazia.

## 2. Divergências deixadas de propósito

| O que | Por quê |
|---|---|
| **Sem "Leva cerca de 3 minutos"** (está na referência) | promessa de prazo, proibida pelo item 9 do contrato |
| **"Ainda não" no lugar de "Em breve"** | mesma razão; a conta da V2G ficou 17 dias num estado só |
| **Cinco itens de navegação atuais**, não os da referência | decisão registrada e datada em `docs/decisoes.md` (12/09) |
| **Lima só no estado "no ar"** | DUVIDA-7: quatro marcas limão sobre campanha parada viram decoração e comemoram o que não aconteceu |
| **"Seu gestor pode retomar" mantido** | DUVIDA-1: é copy da fonte única de veiculação, usada por todas as telas; mudar ali é decisão de produto |
| **"Falar com uma pessoa" ainda duplica no celular** | o segundo está no `Casco` (topo), que é componente de produção e a regra 3 proíbe editar nesta sessão |

## 3. Componentes candidatos a virar sistema

Apareceram com forma própria e servem outras telas:

- **Casco** (barra lateral ≥900px / inferior <900px + topo) — já existe e foi
  reusado sem alteração;
- **Herói de estado** — superfície cobalto com etiqueta, selo, manchete e
  medidor de quatro fases;
- **Cartão de decisão** — tarja de quem tem a bola, título, corpo e **uma**
  ação; sem ação vira frase de quem é a vez;
- **Cartão de número** — rótulo em caixa alta, valor grande, e a variante de
  **ausência** (tipo menor, cor discreta, nota obrigatória);
- **Lista de "se você quiser"** — `.acct-list`/`.acct-row`, já existente;
- **Cartão de comando** — teto do mês e link de mudar.

## 4. Limitações reais do backend que apareceram

1. **Conversas nunca têm número.** A rota do negócio não manda
   `pessoas_que_chegaram_medido`, então `pessoas` é `null` sempre
   (`lib/estado/cliente.ts:483`). A tela mostra ausência com explicação — é o
   comportamento certo, e vai continuar assim até o backend mandar o campo.
2. **Não existe ação de retomar campanha** em lugar nenhum do webapp. Por isso
   o estado pausado não tem botão de retomada (DUVIDA-6).
3. **`campaigns` tem zero linhas** no banco inteiro, e `veiculacao` é a única
   fonte de "no ar" — por isso o estado da tela é montado sobre ela.
4. **Retorno por real não é mostrável**: `diasComOsDoisLados` é 0, e a conta
   dividiria receita de um mês por investimento de outro.

## 5. Verificações, com exit code colado

```
$ pnpm typecheck                 EXIT=0
$ pnpm conferir                  EXIT=0     (19 blocos "TUDO CERTO"; inclui o typecheck)
$ pnpm build                     EXIT=0
```

**Não há lint nem suíte de testes separados neste repositório** — o `package.json`
não tem `lint` nem runner de teste; quem faz esse papel são os 21 conferidores
de `pnpm conferir`. Isso é estado do repo, não coisa que deixei de rodar.

**A superfície nova não chega a produção**, medido depois do build:

```
$ grep -rl "EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G" .next --exclude-dir=cache --exclude-dir=dev   → 0
$ grep -rl "Nada agora — e dá para mudar isso"  .next --exclude-dir=cache --exclude-dir=dev   → 0
$ grep -rl "heroiManchete"                      .next --exclude-dir=cache --exclude-dir=dev   → 1
    .next/server/chunks/ssr/[root-of-the-server]__17qcdw3._.js.map   (mapa de código, 134 KB)
$ grep -rl "Os primeiros sinais" …  → 2   (controle positivo: a tela real está no pacote)

$ next start -p 3111
  /exemplo/inicio-pausado → 404 · /exemplo/inicio → 404 · /entrar → 200
```

O nome de classe sobrevive **só no source map**, que não executa. Código e
textos da tela canônica ficaram fora.

**Um defeito meu, achado e consertado no meio disto:** a primeira versão
importava a tela canônica atrás do parâmetro da rota, e não atrás do
`NODE_ENV` — o componente entrava no pacote (`heroiManchete` em 3 arquivos) e
o comentário do código afirmava o contrário. Corrigido em
`app/exemplo/[tela]/page.tsx`, com a medição registrada lá.

## 6. `git status`, arquivo por arquivo

```
 M app/exemplo/[tela]/page.tsx        rota da bancada: aceita os 3 estados novos,
                                      com o import atrás do portão do NODE_ENV
 M lib/exemplo.ts                     a fixture ganhou os 3 estados; o padrão
                                      continua sendo `pausado` (nenhum chamador muda)
?? app/exemplo/_canonico/             a tela canônica (TelaCanonica.tsx + .module.css).
                                      Pasta com `_`: não vira rota
?? docs/v2g-wireframes/SCREEN-CONTRACT-INICIO.md   Etapa 1
?? docs/v2g-wireframes/DUVIDAS.md                  as 7 dúvidas
?? docs/v2g-wireframes/capturas/                   prova-0 + r1 + r2 + r3 (55 PNGs)
```

Nenhum arquivo de produção foi tocado: `app/(protected)/`, `app/(fluxo)/`,
`components/`, `app/globals.css` e `proxy.ts` estão intactos.

## 7. O que ficou, parando na terceira rodada

1. **"Falar com uma pessoa" duplica no celular** — o segundo vem do `Casco`.
2. **1280px no estado preparando ainda tem vazio** à direita, abaixo do cartão
   de decisão: com pouca informação, a coluna termina cedo.
3. **Em 375px o terceiro cartão de número fica sozinho na linha**, porque o de
   ausência ocupa a linha inteira.
4. **Não há estado de carregamento**: a página é de servidor e chega pronta;
   não existe skeleton no Início hoje.
5. **Sem teste automatizado da tela nova** — ela vive fora da suíte por ser
   superfície de laboratório.

## 8. As dúvidas, em uma linha cada

| # | Assunto | Escolha conservadora |
|---|---|---|
| 1 | "Seu gestor pode retomar" contradiz "sem gestor de tráfego" | manter a frase; não mexer na fonte única |
| 2 | qual trilha sobrevive, 4 fases ou 6 etapas | as 4 fases, como na referência |
| 3 | navegação da referência × a do app | manter os cinco itens decididos em 12/09 |
| 4 | a referência promete prazo | divergir: sem prazo, "Ainda não" |
| 5 | três paletas disputando | os tokens do `globals.css` |
| 6 | estado pausado sem ação possível | declarar o estado + caminho humano; não inventar botão |
| 7 | lima em quatro marcas de conclusão | lima = "no ar agora", só |

A sessão termina aqui, esperando sua aprovação. Nada foi aplicado em outra tela.
