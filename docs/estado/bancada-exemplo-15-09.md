# A bancada `/exemplo` e o rodapé do `/entrar` — 15/09/2026

Duas tarefas. Nada foi commitado, publicado ou colocado no ar.

---

## 0. O que depende de decisão humana

1. **O rodapé do `/entrar` NÃO foi aplicado: espera aprovação dos prints**
   (§1). O pedido era mostrar antes de aplicar.
2. **A proposta pinta a ação de outra cor.** "Já tenho conta" fica em
   `--texto-discreto` e "→ Entrar" em `--cobalt-ink`, com peso 700. Se a
   linha deve ser toda cinza, é trocar uma regra.
3. **O modo login tem o mesmo desenho.** "Novo por aqui? → Criar conta" usa
   o mesmo `.auth-foot .link-btn` e muda junto quando a proposta for
   aplicada. Só o modo cadastro foi fotografado.

---

## 1. Tarefa 1 — o rodapé do `/entrar`, proposta com print

**Hoje:** "Já tenho conta", texto solto, ao lado de uma caixa cinza de
54px ("→ Entrar", secundária), logo abaixo do "Criar minha conta".

**Proposta:** uma linha só, e ela inteira é o botão: "Já tenho conta →
Entrar". Sem fundo, sem borda, centralizada, com 44px de altura de toque.

**Contraste**, medido na página real com a proposta aplicada no DOM, sobre
o fundo composto do cartão:
```
javascript_tool → /entrar 375px: troca o .auth-foot pelo botão e injeta a regra; fundo composto dos ancestrais, razão WCAG da cor de cada parte; data-tema claro e escuro
```

| Parte | Claro | Escuro |
|---|---|---|
| "Já tenho conta" (`--texto-discreto`) | #5A6977 sobre #FEFEFE: **5,59:1** | #7D8CA1 sobre #0C1523: **5,35:1** |
| "→ Entrar" (`--cobalt-ink`, 700) | #0743DC sobre #FEFEFE: **7,32:1** | #5C88FA sobre #0C1523: **5,54:1** |
| Caixa do botão | 297×44 em 375px · 418×44 em 1280px | igual |

As quatro medidas passam de 4,5:1.

**O que a aplicação muda,** quando aprovada:
- **`app/(public)/entrar/page.tsx`:** o texto de apoio entra no botão, e o
  "Já tenho conta" solto sai.
- **`app/globals.css`:** o `.auth-foot .link-btn` sai da lista da secundária
  e ganha a regra da linha.

**Os prints** (captura pelo protocolo de depuração do Chrome, com a página
real, CSS e fontes de verdade, recortados no `.auth-card`):
`entrar-antes-375.png`, `entrar-proposta-375.png`,
`entrar-proposta-375-escuro.png`, `entrar-antes-1280.png`,
`entrar-proposta-1280.png`.

---

## 2. Tarefa 2 — a bancada `/exemplo/[tela]`

`/exemplo/inicio` desenha a `/inicio` de verdade, com dado falso e sem
login. Qualquer outro nome de tela dá 404.

### 2.1 Uma contradição com o repositório, dita antes do código

O `docs/estado/portao-de-fixture-11-09.md` §0 diz que, se a captura doer, o
caminho barato "não é devolver o portão ao `proxy.ts`". A bancada respeita o
que aquele lote protegeu:

- **Nenhuma camada de sessão mudou.** O `proxy.ts` e a checagem do
  `app/(protected)/layout.tsx` estão como eram. A `/inicio` real continua
  devolvendo 307 para `/entrar` sem sessão.
- **A bancada não lê sessão, banco nem backend.**
- **Nada da fixture foi usado.** A rota não nomeia `V2G_FIXTURE_*` nem
  importa `lib/dev/fixtures-inicio.ts`, e as travas `conferir:portao` e
  `conferir:inicio` §6 continuam como estavam.

### 2.2 Como ela foi feita

Para a bancada desenhar a **mesma** tela, e não uma cópia que envelhece,
duas separações sem mudança de desenho:

| Antes | Agora |
|---|---|
| `app/(protected)/inicio/page.tsx` buscava e desenhava (1016 linhas) | `page.tsx` só busca (164 linhas) e entrega a `TelaDoInicio.tsx` (907), que só desenha |
| `app/(protected)/layout.tsx` checava a sessão e desenhava o casco | o layout checa a sessão e depois desenha `components/ui/Casco.tsx`, que não decide quem entra |

- Os trechos foram **movidos por âncora**, com os comentários junto, por um
  script que confere cada âncora antes de gravar. Nenhuma linha de desenho
  foi reescrita.
- A `<FaixaReconectar />`, que lê sessão, chega pronta por `faixa`: a página
  real passa a faixa, e a bancada não passa nada.

**O dado falso** vem de um arquivo só, `lib/exemplo.ts`:
- campanha pausada: veiculação `ja_foi_ao_ar`, com a manchete "Seu anúncio
  já rodou e não está no ar agora";
- R$ 10,25 investido, 64 cliques e 1.657 aparições;
- conversas sem medição: `pessoas: null`, e a tela escreve "ainda não
  sabemos".

Os ids são inventados, para nenhuma action tocar execução real. As duas
actions da `/inicio` exigem sessão antes do backend (`actions.ts:76`, `:222`).

### 2.3 Como ela fica fora de produção

Um trinco, o do build:
```ts
const exemplo = process.env.NODE_ENV !== "production" ? await import("@/lib/exemplo") : null;
if (!exemplo) notFound();
```
- No build, o Next troca `NODE_ENV` pelo literal. O `import()` morre, o
  `lib/exemplo.ts` não entra no pacote e a rota dá 404.
- O preview da Vercel também roda com `NODE_ENV=production`.
- A rota ainda declara `robots: noindex`.

**A prova:**
```
$ pnpm build
build exit=0
├ ƒ /exemplo/[tela]
$ grep -rl --exclude-dir=dev --exclude-dir=cache <texto> .next | wc -l
EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G: 0     (a sentinela de lib/exemplo.ts)
FIXTURE_SO_DE_DESENVOLVIMENTO_V2G: 0     (a da fixture da /inicio, que continua fora)
Os primeiros sinais: 2                   (controle positivo: o texto da tela está no pacote)
$ next start -p 3100
/exemplo/inicio → 404 · /exemplo/anuncios → 404 · /entrar → 200 · /inicio → 307 /entrar?next=%2Finicio
```
Em desenvolvimento, `curl` devolve 200 em `/exemplo/inicio`, 404 em
`/exemplo/anuncios` e 307 em `/inicio`.

### 2.4 As travas que mudaram de arquivo

A separação moveu código que a suíte lê como texto. As duas travas passaram
a ler onde o código agora mora, sem afrouxar nada:
- `scripts/conferir-inicio.ts` §5 lê `TelaDoInicio.tsx`, onde está o
  desenho;
- `scripts/conferir-resultado.ts` §10 ganhou `TelaDoInicio.tsx` na lista.

### 2.5 Os prints

Mesma captura da tarefa 1, na `/exemplo/inicio` em 375px:
- `exemplo-inicio-375-claro-tela1.png` e `exemplo-inicio-375-escuro-tela1.png`
  mostram a primeira tela;
- `exemplo-inicio-375-claro.png` e `exemplo-inicio-375-escuro.png` mostram a
  página inteira, com 3246px.

Nas duas primeiras tentativas a captura falhou, e as falhas estão
registradas:
1. **O Chrome recusou o caminho do arquivo.** Com barras invertidas dentro
   de uma função do shell, ele não achou a extensão; resolvido com barras
   normais.
2. **As cópias da página saíram sem CSS.** Em desenvolvimento o Next carrega
   o CSS por JavaScript, e a cópia ia sem scripts. A saída foi capturar a
   página viva pelo protocolo de depuração.

Nas capturas finais, o indicador "N" do modo de desenvolvimento foi
escondido, e a barra inferior fixa cai no fim da página inteira.

---

## 3. Verificação

```
$ pnpm typecheck        → exit 0
$ pnpm conferir         → exit=0 (19 blocos "TUDO CERTO")
$ pnpm build            → exit 0
```

## 4. O que ficou fora

- **Só a `/inicio` tem bancada.** Cada tela nova precisa da mesma separação
  entre busca e desenho.
- **A fixture `com-dados` e o `lib/exemplo.ts` repetem números de
  produção.** Não foram unificados: a fixture é lida pela rota real, e a
  trava §6 proíbe outro arquivo de alcançá-la.
- **O script de captura** (`captura.mjs`) ficou na pasta temporária da
  sessão, fora do repositório. Se a bancada virar hábito, ele merece um
  lugar em `scripts/`.

## 5. Arquivos

| Arquivo | O quê |
|---|---|
| `app/exemplo/[tela]/page.tsx` | novo: a rota da bancada |
| `lib/exemplo.ts` | novo: o dado falso e a sentinela |
| `app/(protected)/inicio/TelaDoInicio.tsx` | novo: o desenho da `/inicio`, movido da página |
| `app/(protected)/inicio/page.tsx` | só a busca; entrega à `TelaDoInicio` |
| `components/ui/Casco.tsx` | novo: barra e topo, movidos do layout |
| `app/(protected)/layout.tsx` | a checagem de sessão, e depois o `Casco` |
| `scripts/conferir-inicio.ts` | §5 lê `TelaDoInicio.tsx` |
| `scripts/conferir-resultado.ts` | §10 inclui `TelaDoInicio.tsx` |
| `docs/estado/bancada-exemplo-15-09.md` | este arquivo |
| `docs/estado/indice.md` | a linha deste arquivo |
