# Etapa 1 — Fundação visual (11/09/2026)

Sessão V2, branch `visual-v0`. Executa a Etapa 1 do
`docs/v2g-wireframes/IMPLEMENTATION-PLAN.md` §6.

**Arquivos alterados:** `app/globals.css`, `scripts/conferir-cascata.ts`.
Nada mais. Não commitei (Regra 1 do plano — git é do Victor).

---

## §0 O que depende de decisão humana

1. **`.empty-card` e `.rev-item` têm `border-radius: 14px` e ficaram de fora
   da escala.** O plano (§2 "Raio") isenta o `14px` do `.auth-card` como
   exceção pontual, mas fala de **um**, e são **três**. Os outros dois são
   cards comuns, que pela tabela seriam `--raio-card` (12px).
   **Não mexi de propósito:** trocar 14 por 12 muda a aparência, e esta etapa
   renomeia sem redesenhar. Virar token é decisão de produto.
   Custo de adiar: baixo — são dois seletores, e o token já existe.

2. **`pnpm conferir` não roda mais em árvore limpa, e o verde não é
   reproduzível.** Três sessões (V2, V3, V4) escreveram na mesma árvore hoje,
   e nada foi commitado. Duas consequências, e a segunda é pior:

   - um `conferir` verde atesta o **conjunto**, não o lote de ninguém;
   - ele **falha de mentira**. Uma rodada da V3 saiu com **exit 2** enquanto
     eu escrevia o `globals.css` — as 15 conferências individuais passaram e o
     `typecheck` também: era o arquivo sendo LIDO no meio da minha escrita.
     Rodada seguinte, exit 0.

   **Antes de concluir que quebrou, confira se outra sessão está com o arquivo
   na mão.** Esse falso vermelho custa caro: ele aparece como falha de regra,
   e a reação natural é caçar defeito que não existe. Medido pela V3 em
   11/09; registrado nos dois documentos de propósito, porque quem topar com
   ele vai estar lendo um dos dois, não os dois.

   Só commit resolve — e commit é do Victor.

---

## §1 O que foi feito

### Tokens de raio — seis degraus, nenhum valor novo

Acrescentados ao `:root`: `--raio-card` 12px, `--raio-item` 10px,
`--raio-interno` 8px, `--raio-selo` 6px, `--raio-micro` 4px,
`--raio-pilula` 999px.

**73 de 85 declarações de `border-radius` passaram a usar token.** As 12 que
continuam literais: 7× `50%` (avatar), 3× `14px` (§0 item 1), 1× `3px`
(`.rev-etiqueta`), 1× `0` (item de nav na barra inferior). Nenhuma é degrau.

Cada substituição é valor idêntico ao que já estava escrito — é renomeação.
A conta do plano (16× 12px, 6× 6px) batia com a **árvore limpa**; hoje são 21
e 7 porque a V3 acrescentou 5 e 1 no bloco `.res-*`. Conferido com ela.

### `--sidebar-bg`: de `var(--cobalt)` para `var(--plate)`

Com `--sidebar-ink` reancorado em `--plate-ink`
(`rgb(var(--plate-ink-rgb) / 0.78)`), como o plano pede.

O valor **não** saiu do pixel do wireframe — o amostrado (`#001624`) foi
descartado, porque imagem gerada por IA não é fonte de cor. `--plate` já
existia, já é escuro nos dois temas e já tem par de tinta.

Contraste medido, antes → depois, no tema claro:

| par | cobalto | `--plate` |
|---|---:|---:|
| `--sidebar-ink` sobre a barra | 5,07 | **9,74** |
| `--sidebar-ink-strong` sobre a barra | 7,38 | **16,79** |
| tinta forte sobre o item ativo | 5,48 | **10,53** |

**O tema escuro não foi tocado**: lá `--sidebar-bg` já era `#080E1A`, cravado.

### `.side-support`: card claro — e a pendência não era de desenho

Aberta em 21/08, fechada aqui. **Ela não era uma escolha estética: era código
morto.** `.side-support` estava declarado **duas vezes com a mesma
especificidade** — vidro na seção do shell, card gelo ~950 linhas adiante. A
segunda vencia sempre. O card claro nunca foi a opção que ganhou uma
discussão: é o que as 9 telas já renderizavam desde o primeiro dia.

Apagadas as três regras de vidro (`background`, `b`, `p`) — as mesmas três
inertes de `regra-inerte.md` §6 e `pilares-10-09.md` §0.5. **Zero pixels
mudam.** O que muda é o arquivo parar de descrever um desenho que não
acontece.

O comentário do anel de foco foi reescrito: ele avisava que o anel "precisa
voltar a ser branco se algum dia o vidro passar a vencer". O vidro não existe
mais, então o condicional virou incondicional e o 6,64 é definitivo.

### `scripts/conferir-cascata.ts` — a lista `CONHECIDOS` ficou vazia

**Esta edição não foi escolha minha: o conferidor a exigiu.** A lista tinha as
três regras do `.side-support` como "pendentes de decisão", e a §3 do script
transforma em FALHA qualquer entrada que deixe de ocorrer — *"a lista não pode
envelhecer sozinha"*. Apagadas as regras, ele falhou pedindo, com a mensagem
que ele mesmo escreve, que a entrada saísse.

A folha passou de **3 inertes conhecidas** para **0 inertes, 0 conhecidas** —
primeira vez que `conferir:cascata` fecha sem nenhuma pendência.

### `/criativos` no `proxy.ts` — nada a fazer

Já estava em `PROTECTED_PREFIXES` (`proxy.ts:53`), junto com `/campanhas`.
O plano §3.4 diz o mesmo. Item verificado, zero alterações.

---

## §2 Verificação

| o quê | resultado |
|---|---|
| `pnpm conferir` | **exit 0** |
| `pnpm build` | **exit 0**, as 11 rotas protegidas compilam |
| `conferir:cascata` | 0 inertes (eram 3) |
| `font-size` literal | **0 no HEAD, 0 agora** — nenhum introduzido |
| tokens do tema escuro | **80, e 0 diferenças** contra o HEAD |
| os dois blocos escuros em sincronia | 39 = 39, idênticos |

**Nada já falhava antes.** Baseline medido duas vezes: na árvore limpa
(commit `441e70e`) e de novo depois que o trabalho da V3 apareceu. Verde nas
duas.

**A ressalva que esta tabela exige** — ver §0 item 2: todo verde acima foi
medido em árvore compartilhada por três sessões. Ele vale como "não quebrei
nada", que era a pergunta; não vale como medição isolada deste lote, e não é
reproduzível enquanto duas sessões escreverem ao mesmo tempo.

### Alvos de toque, medidos no navegador

Contra a folha real, com `<meta viewport>`, tema claro:

| largura | célula de nav | mínimo |
|---:|---|---:|
| 390px | 78 × 55 | **55** |
| 375px | 75 × 55 | **55** |
| 320px | 64 × 55 | **55** |

Os três acima de 44. Nenhum rótulo truncado a 320px (`scrollWidth` =
`clientWidth` nos cinco). A altura dá 55 e não 56 porque o `border-top` de 1px
da barra entra na conta — `--barra-h` continua 56px.

### Cores computadas, os dois temas

| | claro | escuro |
|---|---|---|
| fundo da barra | `#111E2F` (`--plate`) | `#080E1A` (intacto) |
| tinta da barra | `rgba(241,246,247,.78)` | — |
| fundo do card | `#E3F6FE` | `#0E2231` |
| título do card | `#111E2F` | `#E9EFF8` |
| botão de ajuda | `#E8FC65` | `#D5EF25` |

---

## §3 O que não foi medido, e por quê

**As 11 telas não foram abertas no app rodando.** Elas exigem sessão Supabase,
e entrar com credencial é ação que não me cabe. A porta 3000 também estava
ocupada pelo servidor de outra sessão. O que fiz no lugar: um harness servido
como estático, com o **DOM real do `layout.tsx`** e a **folha real**, onde as
medidas acima foram tiradas. Ele mede CSS de verdade, mas **não** é o app —
não prova server component, dado ou sessão. O `pnpm build` cobre o que falta
das 11 rotas: todas compilam.

Existe `app/captura-fixture/` na árvore, de outra sessão, que parece resolver
isso melhor. Não usei porque apareceu depois de eu já ter medido.

**Uma leitura descartada, para ninguém repetir o susto.** Medindo logo depois
de trocar `colorScheme` no mesmo lote de chamadas, o lima veio claro no tema
escuro — parecia token não aplicado. Relido em chamada separada: `#D5EF25`,
correto. Era leitura obsoleta por um quadro, não defeito. Leitura de cor
depois de trocar tema pede chamada própria.

---

## §4 O que mudou de escopo, e por quem

A Etapa 1 do plano tem **três** itens; executei **dois e meio**, por decisão
do Victor registrada em `decisoes.md` no mesmo dia (entrada 3):

- **Os rótulos da navegação NÃO mudam.** O plano pede
  *Início · Resultados · Vendas · Decisões · Conta* mais *Negócio* no desktop.
  Vale o QA-1 e os cinco itens atuais. `layout.tsx` não foi tocado — a
  navegação está intacta, inclusive o comentário que explica por que
  "Campanhas" e "Criativos" viraram "Anúncios".
- Com isso, **a Etapa 1 virou só CSS** (mais a linha do conferidor).
