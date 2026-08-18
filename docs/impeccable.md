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
4. Reconferir os dois testes do §3 (escopo do hook), porque a lista de
   extensões e o nome da chave de configuração podem mudar entre versões.
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

**(b) `ignoreFiles` em `.impeccable/config.json`, que é o que resolve o
resto.** `.ts` e `.js` ESTÃO na lista branca — ou seja, `lib/meta/`,
`lib/agentes/`, `proxy.ts` e as server actions dispararam o hook sem esta
configuração. Detector de design opinando sobre a função de procedência é
ruído no contexto, e ruído no contexto sai caro: ele ocupa espaço que
devia estar sendo usado pelo problema real.

```json
{
  "ignoreFiles": [
    "lib/**", "scripts/**", "supabase/**", "prompts/**",
    "proxy.ts", "**/actions.ts"
  ]
}
```

Glob com `**`, `*`, `?` e `{a,b}`. `app/globals.css`, `components/**` e as
`page.tsx` ficam **fora** da lista de propósito: ali é onde ele deve falar.

### Conferido, não presumido

Os três casos, alimentando o hook por stdin com um evento sintético:

```bash
# pula (ignoreFiles)
echo '{"hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"lib/meta/publicar.ts"}}' \
  | node .claude/skills/impeccable/scripts/hook.mjs

# pula (extensão)
echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"supabase/migrations/0013_aplicar_proposta.sql"}}' \
  | node .claude/skills/impeccable/scripts/hook.mjs

# PROCESSA e devolve contexto
echo '{"hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"app/(protected)/vendas/page.tsx"}}' \
  | node .claude/skills/impeccable/scripts/hook.mjs
```

Os dois primeiros saem em silêncio com código 0; o terceiro devolve
`hookSpecificOutput.additionalContext`. **Repita estes três depois de
qualquer atualização** — é o teste mais curto que prova que o escopo
sobreviveu.

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

## 4. As regras do projeto continuam valendo sobre ela

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
