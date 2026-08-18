# Impeccable — o que é, o que ela escreve, e o que auditar antes de atualizar

Skill de design para agentes de código. Instalada em 18/08/2026, versão
**3.6.0**, escopo de projeto, só o provedor `.claude`.

Este documento existe por um motivo específico, no §1. Leia antes de rodar
`npx impeccable install` de novo.

---

## 1. Auditar o pacote npm NÃO cobre o que é instalado

**O pacote npm não contém a skill.** `impeccable@3.6.0` são 1,2 MB de CLI. O
conteúdo que vai para dentro do repositório — 17,7 MB, 2.947 arquivos — é
baixado de:

```
https://impeccable.style/api/download/bundle/universal
```

no momento em que o `install` roda. **Sem hash fixado, sem versão na URL.**
O `package.json` do npm tem `integrity` (e ele bateu na conferência), mas
isso cobre só o instalador. O payload é um zip servido por HTTP no momento
da chamada.

As três consequências, e a terceira é a que importa:

1. Duas máquinas rodando `install` em dias diferentes podem receber
   conteúdo diferente, com a mesma versão de npm.
2. Não há como conferir, do lado de fora, se o zip de hoje é o mesmo de
   ontem.
3. **Por isso o conteúdo instalado está VERSIONADO neste repositório.** Os
   148 arquivos de `.claude/skills/impeccable/` estão no git de propósito,
   não por descuido. É a única forma de fixar a versão que foi auditada, e
   de fazer qualquer atualização aparecer como diff que alguém pode ler.

### O que fazer antes de atualizar

Não rode `impeccable install --force` direto num tree limpo e commite o
resultado. O caminho:

1. `git status` limpo antes.
2. Rodar o install.
3. **Ler o diff.** São arquivos de terceiro que vão instruir um agente que
   escreve no nosso código — o diff é a revisão de código deles.
4. Reconferir o teste de ida-e-volta do §3, porque a lista de extensões e
   o nome da chave de configuração já mudaram de leitura uma vez.
5. Só então commitar, com a versão nova no título.

Se um dia o projeto passar a fixar hash, o lugar é aqui.

---

## 2. O que o install escreveu

Tudo dentro do repositório. Nada em `~/.claude`, nada fora da árvore.

| caminho | o que é | versionado? |
|---|---|---|
| `.claude/skills/impeccable/` | 148 arquivos: `SKILL.md`, 35 de `reference/`, ~107 scripts | **sim** (ver §1) |
| `.claude/agents/` | 4 subagentes (`documenter`, `finish-reviewer`, `asset-producer`, `manual-edit-applier`) | sim |
| `.claude/settings.local.json` | manifesto dos hooks | **não** — efeito local de máquina |
| `.impeccable/config.json` | escopo do detector (§3) | sim — é decisão de time |
| `.impeccable/hook.cache.json` | dedupe do hook, estado de sessão | não |

Duas coisas que ela **não** fez, ao contrário do que o nome dos arquivos
poderia sugerir:

- **Não tocou em `.claude/settings.json`.** É deliberado no código dela: o
  hook é efeito colateral de máquina, então vai para o
  `settings.local.json` (gitignored) e não para o arquivo compartilhado.
  Neste repositório o `settings.json` nem existia.
- **Não tocou em `app/globals.css` nem nos tokens.** `globals.css` aparece
  uma vez em todo o bundle, dentro de uma lista de **leitura** em
  `hook-lib.mjs` — os nomes de arquivo de estilo que o detector procura
  para resolver a cascata, ao lado de `styles.css` e `index.scss`. Alvo de
  leitura, não de escrita.

Sobre escrita fora do repo, o CLI tem três caminhos, e nenhum foi usado
nesta instalação: `.git/info/exclude` (acrescentaria
`.impeccable/config.local.json`), `~/.impeccable/node-unsupported` (só se o
Node for anterior à 22) e `$TMPDIR` para o zip, apagado depois. **O
`.git/info/exclude` é o único que `git checkout .` não desfaria** — vale
conferir se ele aparecer numa atualização futura.

Não há `postinstall` nem `preinstall`: nada executa por conta própria ao
instalar o pacote. O único ponto de entrada é o `bin`, chamado à mão.

---

## 3. O hook, e como impedir que ele opine sobre backend

São dois, declarados em `.claude/settings.local.json`, com o contrato
escrito no fonte deles: *"never break a turn. Always exit 0."*

| hook | quando | tempo |
|---|---|---|
| `PostToolUse` | após `Edit`, `Write`, `MultiEdit` | 5s |
| `Stop` | fim do turno, passa completa nos arquivos de UI da sessão | 30s |

O `hook.mjs` **relata, não corrige** — devolve os achados como contexto
adicional e não escreve em arquivo de código. Quem escreve é a família
`live-*`, que só roda em `/impeccable live`, chamado à mão.

### Duas camadas de filtro

**(a) Lista branca de extensão, dentro dela.** `ALLOWED_EXTS` em
`hook-lib.mjs`:

```
.tsx .jsx .html .htm .vue .svelte .astro .css .scss .sass .less .ts .js
```

Então `.sql` e `.md` já não chegam nele: migration e documento estão
cobertos sem configuração nenhuma.

**(b) `detector.ignoreFiles` em `.impeccable/config.json`, que é o que
resolve o resto.** `.ts` e `.js` ESTÃO na lista branca — ou seja, `lib/meta/`,
`lib/agentes/`, `proxy.ts` e as server actions passam pelo filtro de extensão.

**A chave é aninhada sob `detector`.** A primeira versão deste documento
dizia `ignoreFiles` no topo do objeto, e estava errada: a chave no topo é
silenciosamente ignorada. O `--help` do detector é a fonte
(`detector.ignoreRules`, `detector.ignoreFiles`, `detector.ignoreValues`,
`detector.designSystem.enabled`).

```json
{
  "detector": {
    "ignoreFiles": [
      "lib/**", "scripts/**", "supabase/**", "prompts/**",
      "proxy.ts", "**/actions.ts"
    ]
  }
}
```

Glob com `**`, `*`, `?` e `{a,b}`. `app/globals.css`, `components/**` e as
`page.tsx` ficam **fora** da lista de propósito: ali é onde ele deve falar.

Vale saber quanto isso realmente compra, para ninguém confiar demais nele:
`lib/**` produz **zero** achados mesmo sem configuração nenhuma, porque as
regras são de CSS e de marcação e não têm o que dizer sobre a função de
procedência. Além disso `.ts` não está em `ACK_EXTS`, então nem o "escaneei
e está limpo" aparece. O `ignoreFiles` aqui é defesa em profundidade para o
dia em que uma regra passe a valer para `.ts` — não é o que faz o silêncio
de hoje.

### Conferido — e o primeiro teste não valia

O teste que eu tinha escrito aqui alimentava o hook com
`lib/meta/publicar.ts` e concluía do silêncio que o `ignoreFiles` estava
funcionando. **Não provava nada:** aquele caminho sai em silêncio de
qualquer jeito (zero achados, `.ts` fora de `ACK_EXTS`). O teste passou pelo
motivo errado, e foi por isso que a chave no topo do objeto sobreviveu tanto
tempo sem ninguém notar.

**Um teste de escopo só vale se o alvo produzir achado quando NÃO está
ignorado.** Hoje o alvo que serve é `app/`, que rende 5:

```bash
# 5 achados — a linha de base
node .claude/skills/impeccable/scripts/detect.mjs --json app

# acrescente "app/**" a detector.ignoreFiles e rode de novo: tem que dar 0
# tire de novo: tem que voltar a 5
```

É a ida E a volta que provam o escopo. Só a ida confunde "ignorado" com
"limpo" — a mesma confusão do teste antigo.

Para o hook em si, o par que discrimina:

```bash
# PROCESSA e devolve additionalContext
echo '{"hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"app/(protected)/vendas/page.tsx"}}'   | node .claude/skills/impeccable/scripts/hook.mjs

# pula por extensão (.sql nunca entra)
echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"supabase/migrations/0013_aplicar_proposta.sql"}}'   | node .claude/skills/impeccable/scripts/hook.mjs
```

### Desligar de vez, quando o trabalho é todo de backend

```bash
IMPECCABLE_HOOK_DISABLED=1
```

Conferido: com a variável, o mesmo evento que antes falava sai em silêncio.
Serve para uma sessão inteira de migration ou de `lib/`, quando nem o
`Stop` interessa.

### Um comportamento que parece defeito e não é

O hook **não repete** o achado do mesmo arquivo: o segundo evento para o
mesmo caminho sai em silêncio. É dedupe, guardado em
`.impeccable/hook.cache.json`. Ao testar, use um arquivo diferente a cada
vez, ou apague o cache — senão a conclusão fácil e errada é que ele parou
de funcionar.

---

## 4. O detector NÃO conhece o nosso design system

Isso é o mais importante deste documento depois do §1, e é contraintuitivo:
rodar o detector **não** faz a skill ler os nossos tokens.

O que ele carrega como "design system" vem de `DESIGN.md` ou de
`.impeccable/design.json` (`findDesignRoot` sobe a árvore procurando esses
dois nomes). **Nenhum dos dois existe neste repositório.** O `globals.css`
é lido como ALVO da varredura — para resolver a cascata de CSS — e nunca
como fonte de verdade. Ele achou o arquivo, traçou o grafo de import a
partir do `layout.tsx`, e os 5 achados de hoje estão todos dentro dele.
Mas os nossos 47 tokens do `:root` são invisíveis para ele.

### A consequência que interessa: a regra da cor está DESLIGADA

`isAllowedColorRaw` começa com `if (!designSystem?.hasColors) return true`.
Sem `DESIGN.md`, toda cor é permitida. Testado com um arquivo descartável
em `app/`:

```css
.teste { color: #ff00aa; background: rgb(12, 200, 90); border: 1px solid #123456; }
.fonte { font-family: 'Inter', sans-serif; }
```

**As três cores literais passaram sem um único achado.** Só o `'Inter'` foi
pego, e por uma regra de fonte genérica embutida nela (`overused-font`), não
por comparação com a nossa paleta.

Ou seja: **"zero valor de cor fora do `:root`" continua sendo regra nossa
que nenhuma ferramenta verifica.** A skill *pode* passar a verificar, mas só
depois que existir um `DESIGN.md` declarando a paleta — é para isso que
serve `/impeccable document` (registra um sistema que já existe), e não o
`init`, que escreve `PRODUCT.md` e não toca em design.

Enquanto isso não existir, quem confere cor literal é revisão humana e
`grep`. Não presuma cobertura que o teste acima mostra que não existe.

### Componentes: ele não inventaria

Não há passo de catálogo de componente. Os nossos 10 de `components/ui/`
não aparecem em relatório nenhum, porque o detector é um varredor de regras
sobre arquivo, não um documentador de biblioteca.

---

## 5. As regras do projeto continuam valendo sobre ela

A skill tem opinião própria sobre design, e em alguns pontos ela vai
sugerir o contrário do que este projeto decidiu. Quando conflitar, o
projeto ganha:

- **CSS puro.** Sem Tailwind, sem CSS-in-JS, sem biblioteca de componente
  ou de gráfico (`docs/arquitetura.md`, Decisões 7 e 8).
- **Zero valor de cor fora do `:root`.** Cor literal em regra é defeito,
  não estilo.
- **Estado vazio honesto.** Nada de dado mockado para a tela ficar bonita:
  o que não veio do banco aparece como não veio.
- **Nada de mudança de lógica, rota ou copy** vindo de sugestão de design.

Se ela reescrever token ou introduzir cor literal, o certo é reverter e
registrar o caso aqui — não acomodar.
