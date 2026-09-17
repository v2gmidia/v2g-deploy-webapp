# Entrega — Início canônico, rodada 4

16/09/2026. Escopo: **só** a superfície de desenvolvimento
`/exemplo/inicio-{preparando,no-ar,pausado}`. Nenhuma página ou componente
compartilhado de produção foi editado, nenhum dado fictício foi ligado ao app
real, nenhum commit, nenhum deploy.

---

## 1. Os quatro consertos

### 1.1 A trilha é de preparação, não placar

A trilha das quatro fases agora só existe **até a primeira publicação**
(`esteveNoAr(veiculacao)`). Depois disso somem os vistos, os "Concluído" e o
contador — junto, porque contador de etapas sobre campanha publicada mede a
coisa errada.

**O que ocupa o herói em cada estado:**

| Estado | O herói mostra |
|---|---|
| **preparando** | selo "Ainda não foi ao ar", manchete, as 4 fases com estados verdadeiros e o contador verdadeiro (**"1 de 4 etapas concluídas"**) |
| **no ar** | selo "No ar" em lima, manchete no presente, **o número âncora** ("Investido até agora · R$ 10,25"), o período que ele cobre ("com gasto medido de 05/09 a 07/09") e a porta para o detalhe ("Ver meus anúncios") |
| **pausado** | selo neutro "Já rodou", manchete no passado, o que dá para fazer ("Para voltar a anunciar, fale com a V2G. Hoje essa decisão não se aperta sozinha aqui dentro.") e a ação real, em botão cheio |

O que **não** ficou no pausado: nenhum "já rodou" vestido de sucesso, nenhuma
afirmação sobre gasto atual. A frase compartilhada diz "nenhuma verba está
sendo gasta agora" e **não a uso**: o consolidado é histórico, não estado
corrente, e nenhuma fonte consultada sustenta essa afirmação.

### 1.2 Um cumprimento

`Oi, Piligrin` saiu do corpo. O cumprimento é só o do cabeçalho
("Boa tarde, Piligrin"), e o `h1` do corpo passou a ser a manchete de estado.

### 1.3 Quatro números em grade 2 × 2

Rótulos de uma linha: **Investido · Cliques · Exibições · Conversas**. Quatro
células de altura igual (`grid-auto-rows: 1fr` + `height: 100%`). Conversas
mostra **"Não medido"**, em tipo menor e cor discreta — não é número e não usa
o tipo de número. A ressalva saiu de dentro da célula e virou nota **logo
abaixo da grade**, amarrada por `aria-describedby="nota-conversas"`.

### 1.4 Um nome para suporte

Na bancada, a ação humana chama-se **"Falar com alguém"**, igual à lateral do
casco. E "seu gestor pode retomar" **não aparece** na cópia da bancada; a
fonte compartilhada (`lib/veiculacao/estado.ts:297`) ficou intacta, como
pedido.

**Limitação que não deu para resolver aqui:** abaixo de 900px o topo do
`Casco` mostra **"Falar com uma pessoa"** (`components/ui/Casco.tsx:212`),
enquanto a lateral já diz "Falar com alguém" (`:159`). No estado pausado isso
põe dois rótulos diferentes para a mesma coisa no mesmo campo de visão.
**A alteração exata que faltaria:** trocar o texto de `Casco.tsx:212` para
"Falar com alguém" — arquivo de produção, fora do escopo desta rodada.

## 2. Antes e depois

**`r3-pausado-escuro-375` → `r4-pausado-escuro-375`**
Saíram os quatro vistos, os quatro "Concluído" e o "4 de 4 etapas concluídas".
No lugar entrou a frase do que fazer e o botão "Falar com alguém". A grade de
números deixou de ter a ausência ocupando a linha inteira: agora são 2 × 2 com
alturas iguais, rótulos curtos, e a explicação embaixo. O cartão "O que depende
de você / Nada agora" sumiu — a ação foi para o herói.

**`r3-no-ar-claro-1280` → `r4-no-ar-claro-1280`**
A trilha com quatro "Concluído" saiu. O herói passou a ocupar a largura
inteira e carrega o número âncora, o período medido e o link de detalhe. O
"Você está no comando" desceu para o rodapé, ao lado da lista — o que fechou a
coluna vazia à direita.

## 3. Conferência das 18 capturas

Abri e olhei **cada uma**. Cinco evidências por arquivo:

| arquivo | manchete | estado | tema | largura | sem login/erro |
|---|---|---|---|---|---|
| `r4-preparando-claro-1280` | "Seu anúncio ainda não foi ao ar." | trilha 1 de 4 | claro | 1280, lateral | ok |
| `r4-preparando-escuro-1280` | idem | trilha 1 de 4 | escuro | 1280, lateral | ok |
| `r4-preparando-claro-900` | idem | trilha 1 de 4 | claro | 900, barra inferior | ok |
| `r4-preparando-escuro-900` | idem | trilha 1 de 4 | escuro | 900, barra inferior | ok |
| `r4-preparando-claro-375` | idem | trilha 1 de 4 | claro | 375, barra inferior | ok |
| `r4-preparando-escuro-375` | idem | trilha 1 de 4 | escuro | 375, barra inferior | ok |
| `r4-no-ar-claro-1280` | "Seu anúncio está no ar." | selo lima, R$ 10,25 | claro | 1280, lateral | ok |
| `r4-no-ar-escuro-1280` | idem | selo lima, R$ 10,25 | escuro | 1280, lateral | ok |
| `r4-no-ar-claro-900` | idem | selo lima | claro | 900, barra inferior | ok |
| `r4-no-ar-escuro-900` | idem | selo lima | escuro | 900, barra inferior | ok |
| `r4-no-ar-claro-375` | idem | selo lima, grade 2×2 | claro | 375, barra inferior | ok |
| `r4-no-ar-escuro-375` | idem | selo lima, grade 2×2 | escuro | 375, barra inferior | ok |
| `r4-pausado-claro-1280` | "Seu anúncio já rodou e não está no ar agora." | selo neutro, botão | claro | 1280, lateral | ok |
| `r4-pausado-escuro-1280` | idem | selo neutro, botão | escuro | 1280, lateral | ok |
| `r4-pausado-claro-900` | idem | selo neutro, botão | claro | 900, barra inferior | ok |
| `r4-pausado-escuro-900` | idem | selo neutro, botão | escuro | 900, barra inferior | ok |
| `r4-pausado-claro-375` | idem | grade 2×2, "Não medido" | claro | 375, barra inferior | ok |
| `r4-pausado-escuro-375` | idem | grade 2×2, "Não medido" | escuro | 375, barra inferior | ok |

Nenhuma tem tela de login, tela vazia, erro, `R$ 0,00`, `0 conversas`, nota,
estrela, semáforo ou promessa de prazo. Vazamento horizontal: **0 de 18**
(relatório do driver).

**Um defeito achado olhando, e consertado:** o botão do herói saía
**sublinhado** — era um `<a>` herdando sublinhado de link. Corrigido, as 18
foram recapturadas e as 6 do pausado reexaminadas depois.

## 4. Verificações — resultados reais

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← falha PRÉ-EXISTENTE, não é desta rodada
```

**O `pnpm conferir` falha, e a causa não é este trabalho.** Quem falha é
`conferir:nichos`, que bate contra o backend ao vivo: a lista viva
**encolheu de 10 para 8 nichos** (medido agora: `GET /nichos` → 200, 8 itens),
e as conferências de "pizzaria → restaurante" e afins caem com isso. Provas de
que não é meu:

- `grep -cE "exemplo|canonico|TelaCanonica" scripts/conferir-nichos.ts` → **0**;
- o `&&` da cadeia para no primeiro erro, então rodei **um a um** os 12
  conferidores seguintes: `dia-seguinte` 157/157, `apresentada` 27/27,
  `signed-request` 20/20, `identidade` 6/6, **`veiculacao` 117**,
  `resultado` 86/86, `campanha-da-sessao` 17/17, `envio` 48/48,
  `inicio` 39/39, `analise` 30/30, `portao` 8/8, `escolha-de-campo` 9/9 —
  **todos EXIT=0**.

O `conferir:veiculacao` passar é o que prova que a cópia nova da bancada não
viola a regra da fonte única de "no ar".

**A bancada continua fora de produção:**

```
grep -rl "EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G" .next …        → 0
grep -rl "Para voltar a anunciar, fale com a V2G" .next …   → 0
grep -rl "heroiManchete" .next …                            → 1  (só um .js.map)
grep -rl "Os primeiros sinais" .next …                      → 2  (controle positivo)

next start -p 3112:
  /exemplo/inicio-pausado → 404 · /exemplo/inicio-no-ar → 404
  /exemplo/inicio-preparando → 404 · /entrar → 200
```

## 5. Arquivos alterados

```
 M app/exemplo/[tela]/page.tsx                      (já era da bancada)
 M app/exemplo/_canonico/TelaCanonica.tsx
 M app/exemplo/_canonico/TelaCanonica.module.css
?? docs/v2g-wireframes/capturas/r4/                 18 PNGs
?? docs/v2g-wireframes/ENTREGA-INICIO-R4.md         este arquivo
```

Intactos: `app/(protected)/`, `app/(fluxo)/`, `app/(public)/`, `components/`,
`lib/veiculacao/`, `lib/estado/`, `app/globals.css`, `proxy.ts`.

## 6. O que ainda não ficou bom

1. **"Falar com alguém" × "Falar com uma pessoa"** no celular — o segundo é do
   `Casco` (§1.4).
2. **No "no ar" em 1280, o herói tem muito espaço vazio à direita** do número
   âncora. O cartão ocupa a linha inteira e o conteúdo é curto.
3. **No preparando em 1280/900 sobra vazio** abaixo do "Você está no comando":
   o cartão é curto e não há mais conteúdo real para pôr ali. Não preenchi com
   cartão decorativo de propósito.
4. **"Em andamento" quebra em duas linhas** no rótulo da fase 2 em 375px.
5. **Sem estado de carregamento** — a página é de servidor e chega pronta.
6. **Nenhum teste automatizado** cobre a tela nova: ela vive fora da suíte por
   ser superfície de laboratório.

## 7. Decisões de produto pendentes

Nenhuma destas está decidida, e nenhuma delas foi aprovada pelo Gabriel:

1. **Quem retoma a campanha.** A cópia compartilhada diz "seu gestor pode
   retomar"; a V2G se posiciona como "gestão de tráfego sem gestor de tráfego".
   Quem é esse gestor, e ele existe?
2. **A rota de retomada não existe.** Não há, em nenhum lugar do webapp, ação
   de reativar campanha — por isso o estado pausado oferece caminho humano e
   não botão. Enquanto não existir, a tela não pode prometer retomada.
3. **A política definitiva da trilha depois da publicação.** A recomendação
   **visual** desta rodada é ocultá-la, pelo argumento de que "Otimizar" é
   trabalho contínuo e não missão encerrada. É recomendação, não decisão
   tomada.
