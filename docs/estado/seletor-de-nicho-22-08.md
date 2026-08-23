# Seletor de nicho — o lote, em 22/08

Os três passos que o Victor pediu, na ordem que ele pediu: o endpoint, os
chips, a validação. **Os três fechados**, mais a marcação `aproximacao` do
§4, que entrou depois. Base: `docs/handoff-seletor-de-nicho.md`.

**Falta um `pnpm db:migrate` para o lote funcionar** — ver §0.1.

Nenhuma ação proibida foi executada — sem migration aplicada, sem `POST
/cadastro`, sem webhook do n8n, sem Meta, sem Easypanel/Vercel/painel do
Supabase, sem push, sem tocar nas páginas legais, sem chave fora do
`.env.local`. O `.env.local` foi desligado e restaurado durante o teste da
reserva (§4); está como estava.

---

## 0. Comece por aqui: o que depende de você

1. **A MIGRATION `0021` PRECISA SER APLICADA, E ATÉ LÁ O ONBOARDING NÃO
   GRAVA.** É a única coisa que depende de você para este lote fechar, e é
   bloqueio duro, não recado.

   ```bash
   pnpm db:migrate
   ```

   Aplicar migration contra banco real exige autorização humana explícita
   (`CLAUDE.md`), então o arquivo está escrito e **não** foi rodado.

   **Por que quebra:** `lib/cadastro/procedencia.ts` agora manda `p_origem`
   em **toda** gravação de campo, inclusive com o valor padrão. Contra o
   banco velho, a assinatura de seis argumentos não existe e o PostgREST
   responde "function not found".

   **E isso é escolha, não descuido.** A alternativa — mandar `p_origem` só
   quando é `aproximacao` — faria o caminho degradado ser o único a
   exercitar a assinatura nova. O erro apareceria pela primeira vez com o
   backend do V2G já fora, que é o pior momento concebível para descobrir
   que a migration não rodou. Mandando sempre, a divergência aparece na
   primeira resposta de qualquer campo, em desenvolvimento, na hora. É a
   lição de `migration-no-repo-nao-e-migration-aplicada.md`.

   Se você preferir o contrário, é uma linha: trocar `p_origem: origem ??
   "confirmado"` por mandar o argumento só quando `origem` existe.

   **O que a `0021` faz** (as duas funções foram reescritas inteiras, por
   cópia mecânica — o diff contra `0011` e `0016` tem 2 linhas removidas em
   cada uma, e só as pretendidas):

   - `registrar_procedencia` passa a aceitar `aproximacao` como quarto valor
     de origem;
   - `confirmar_campo_do_cliente` troca o literal `'confirmado'` por um
     parâmetro `p_origem`, com default `'confirmado'` e restrito a
     `confirmado | aproximacao` — `manual` e `extraido` são vocabulário de
     outros canais e não passam por esta porta;
   - a assinatura antiga de cinco argumentos é **derrubada**. Um `create or
     replace` com argumento novo criaria uma segunda função, e duas
     sobrecargas deixam o PostgREST ambíguo — ele recusa a chamada em vez de
     escolher.

   **`aproximacao` fica abaixo de `confirmado` de graça, e isso é o miolo do
   desenho.** As duas travas que protegem valor do cliente comparam com o
   literal: `0013` (`v_atual = 'confirmado' and decisao = 'aceito'`) e `0019`
   (`if v_atual = 'confirmado'`). Um valor marcado `aproximacao` cai fora das
   duas — ou seja, proposta de agente e escrita automática **podem**
   corrigi-lo. É o certo: é palpite sobre uma lista errada, não afirmação do
   dono. Há conferência (`conferir:nichos` §10) garantindo que ninguém
   "conserte" essas travas para incluir `aproximacao`.

   **O texto livre continua `confirmado`**, inclusive durante a degradação:
   quem escreveu o próprio ramo com as próprias palavras deu resposta de
   verdade. Palpite é o chip que cobre três nichos de uma vez.

2. **A `/meu-negocio` (§7 do handoff) não entrou, e virou o lote seguinte.**
   Medido e escrito em
   [`buraco-meu-negocio-nicho-livre.md`](../buraco-meu-negocio-nicho-livre.md).
   O resumo: ela grava a mesma coluna sem conferir nada, com procedência
   `confirmado`, e o `ajuda` dela oferece *"padaria"* como exemplo — o termo
   que o onboarding foi construído para recusar. É porta dos fundos para a
   validação que este lote acabou de fechar. O componente já está
   compartilhado e pronto para ela.

   **Uma leitura que circulou e não se confirma:** que a tela mostraria
   `clinica-odontologica` em vez de "Dentista". Hoje não mostra — o
   onboarding grava o rótulo, não o identificador (§3). Ela mostra o valor
   **cru** (`Campo.tsx:159`), o que só aparece em linha escrita por outro
   caminho, como a fictícia com `niche = 'padaria'`. Se a decisão de
   armazenamento inverter para o identificador, aí sim vira defeito visível.

3. **O §5 (gate de completude) não entrou, e esbarra numa decisão que já
   estava aberta.** Medido: `niche` **não existe** em `CadastroCompleto` —
   o `POST /cadastro` não carrega nicho nenhum hoje. A trava do §5 seria
   regra local, não campo enviado. E somar um sétimo campo esbarra no item
   já aberto em `docs/decisoes.md`: "trava de completude: 6 campos ou 11?".

---

## 1. O endpoint — `GET /nichos`

**Medido em 22/08/2026** contra `https://api.v2gmidia.com.br`, antes de
decidir qualquer coisa sobre carregamento:

| | |
|---|---|
| latência | 17 ms de mediana, 16 ms mínimo, **60 ms a frio** (6 amostras) |
| tamanho | 3,8 KB de JSON, 10 nichos |
| termos | **183**, o número do commit `3b846a1` — deploy em dia |
| sem header | **401**, confirmado. Não 404 |

Arquivos:

- `lib/backend/nichos.ts` — a chamada, `server-only`. Teto de espera de
  **2,5 s**, numa constante à parte da tabela `TIMEOUTS` porque não é tempo
  que o backend leva: é quanto tempo uma pessoa no meio de uma conversa
  pode esperar a tela abrir;
- `lib/nichos/tipos.ts`, `validar.ts`, `busca.ts`, `escolha.ts` — puros,
  sem `server-only`. O filtro roda no navegador e a validação roda no
  servidor **com o mesmo código**, de propósito: com regras diferentes nos
  dois lados existiria escolha que a tela oferece e a ação recusa.

### Decisões que tomei sozinho, e o porquê

**O validador reprova tudo ou nada.** Um item malformado derruba a lista
inteira em vez de ser descartado. Descartar é pior do que parece: o nicho
sumido não vira erro em lugar nenhum — vira um dono de petshop que digita
"petshop", não acha, e conclui que o produto não atende o ramo dele.
Reprovar acende a reserva, que é degradação **visível**. Lista vazia também
reprova: zero chip é pior que cinco chips imprecisos.

**Não filtro `generico`.** Quem filtra é o backend, e é lá que a regra
mora. Medido: ele não vem. Se um dia vier, vai aparecer como chip — e isso
é melhor que sumir com ele aqui, porque um remendo silencioso deste lado
recria a lista paralela que este lote está matando, só que invisível.

**O validador saiu do módulo `server-only`** e foi para `lib/nichos/validar.ts`.
Motivo: em `lib/backend/` ele não é alcançável por conferidor nenhum, e a
alternativa seria testar uma **cópia** dele — cópia de validador concorda
consigo mesma para sempre. Não há segredo nele; é transformação pura.

**Dentro de `lib/nichos/`, import de runtime leva `.ts` explícito.** O
conferidor importa esses arquivos direto do Node, sem bundler para resolver
especificador sem extensão. O `allowImportingTsExtensions` do tsconfig já
autorizava a forma, e o Next resolve igual. Vale só para import de runtime
— `import type` some na compilação.

---

## 2. Os chips — `SeletorDeNicho`

`components/ui/SeletorDeNicho.tsx`. **Dez chips visíveis e a busca abaixo**,
como o handoff §2 decidiu. Já nasce em `components/ui/` e não dentro do
onboarding porque a `/meu-negocio` do §7 usa o mesmo componente.

### O "Outro" fica no fim, depois dos dez

**Decisão do Victor, 22/08.** Ele é a saída para `padaria` e para todo
negócio fora da lista, e a lacuna precisa continuar **visível**: sem um
chip nomeado, quem não se reconhece teria que descobrir sozinho — digitando
e falhando — que existe um caminho.

Tocar nele troca a lista pelo campo livre, com o placeholder da própria
pergunta e uma **porta de volta** ("voltar para a lista"). Sem a volta, o
"Outro" seria escolha da qual não se desiste.

No modo livre o texto **não** é casado contra nicho nenhum, nem se a pessoa
escrever "Dentista". Ela já disse que não está na lista; casar ali seria a
sugestão aproximada que foi recusada.

Some quando a busca não acha nada — ali o recado e o botão já oferecem a
mesma porta, e dois convites para a mesma porta é ruído.

**Ordem conferida no DOM real** (build de produção, 22/08): dez nichos e o
"Outro" em décimo primeiro, último. Ele é renderizado depois do `map`, então
é o último irmão por construção. Não há conferidor automático disso —
`conferir:nichos` não monta React.

### O que o Enter faz

**Regra do Victor, 22/08**, contra o desenho que eu tinha entregado — e ele
está certo. A regra vive em `resolverConsulta`, em `lib/nichos/busca.ts`,
pura e conferida (`conferir:nichos` §9), porque dentro de JSX ninguém a
confere.

| o que está no campo | o que o Enter faz |
|---|---|
| vazio | nada |
| sobrou **um** resultado | escolhe aquele nicho |
| **dois ou mais** | nada — a pessoa toca no chip |
| **nenhum** | manda como texto livre |

O rótulo inteiro digitado tem **precedência** sobre o "sobrou um": hoje os
dois nunca discordam (conferido — zero rótulos deixam mais de um resultado),
mas discordariam no dia em que um rótulo casasse com os termos de outro
nicho, e aí quem digitou "Petshop" ainda quer Petshop.

**O desenho anterior era mais restrito e estava errado.** Ele só agia com o
rótulo inteiro digitado, e o furo é o caminho comum: a pessoa digita
"pizzaria", vê um resultado, aperta Enter, e nada acontece. Ficar preso é
pior que o risco que a regra antiga evitava. E o risco quase não existe — o
chip único está visível logo acima do campo, então ela vê o que o Enter vai
escolher antes de apertar.

**Isto foi MUDADO neste lote, não herdado — e depois verificado.** O
registro importa porque a diferença é grande: a versão que eu tinha
entregado antes deixava o Enter inerte com um resultado na tela, que é o
caso comum. A regra nova foi escrita, e só então conferida.

Verificado no navegador, build de produção, contra a lista real e a árvore
React hidratada — não assumido a partir do código:

| digitei | o que aconteceu |
|---|---|
| `pizzaria` | um chip (Restaurante) + botão Enviar; Enter limpou o campo, repôs a lista e chamou a server action |
| `a` | onze chips, **sem** botão; Enter inerte |
| `barbe` | um chip (Barbearia) + botão |
| `padaria` | zero chips, recado e botão de texto livre |
| vazio | os dez + "Outro", sem botão |

A server action respondeu "Sua sessão expirou" — o esperado no andaime sem
login, e a prova de que a escolha chegou até lá.

### O recado de quem não se acha

> Esse não está na nossa lista — escreva do seu jeito que a gente entende.

Sem sugerir o vizinho (recusado no handoff §10: seria interface pedindo
desculpa) e sem acusar. Com `aria-live`, porque a lista esvaziando **é** a
informação, e quem usa leitor de tela precisa saber disso.

### Carregamento — a pergunta que o Victor mandou medir antes de responder

A `page.tsx` dispara `listarNichos()` **antes** de esperar as duas coisas
que já esperava, e só coleta no fim. Com 17 ms em paralelo, o custo é perto
de zero. Por isso **não** existe estado de "carregando a lista", e **não**
existe reserva aparecendo primeiro para ser trocada por dez chips meio
segundo depois — trocar chip na cara de quem está lendo é pior que as duas
alternativas que a manobra tentaria evitar.

Isso não fica apoiado na medição continuar verdadeira: o teto de 2,5 s
garante a reserva por estrutura.

### A medição do ponto de vista do CLIENTE — pedida em 22/08

A pergunta do Victor: *quanto tempo o campo de busca fica indisponível
depois que a pergunta aparece?* Medido contra **build de produção**
(`pnpm build && pnpm start`), não dev — em dev o número é ficção.

**Os dez chips E o campo de busca vêm no HTML do servidor.** Conferido no
corpo cru da resposta: `Dentista`, `Petshop`, `Oficina` e o placeholder
`Busque ou escreva` estão lá; `Clínica / Consultório` **não** está. Não
existe "chips primeiro, lista depois" — chega tudo junto.

| | |
|---|---|
| TTFB | 36–50 ms quente, 127 ms a frio |
| HTML completo | +3 ms sobre o TTFB (3,8 KB de lista) |

**A resposta à pergunta é zero, e não depende de cronômetro.** Os chips e o
campo estão na MESMA árvore React, dentro do mesmo componente. Eles ficam
vivos no mesmo instante — o da hidratação. Não há janela em que o chip
funcione e a busca não.

Isso é o que decide a comparação com o desenho alternativo ("chips fixos
primeiro, busca quando a lista chegar"): lá a janela **existiria** de
verdade, e seria hidratação **mais** uma ida ao servidor, com os cinco
chips errados no lugar dos dez certos enquanto isso. O desenho atual não é
um meio-termo do que foi pedido — é estritamente mais rápido do ponto de
vista de quem olha a tela.

**O que NÃO consegui medir:** o tempo de hidratação em si. O painel de
navegador desta máquina nunca fica visível, e o Chrome congela hidratação
em aba oculta — 69 s com `document.hidden === true` e o `useEffect` do
marcador nunca rodou. O número seria inventado. Fica registrado como não
medido, e vale medir num navegador de verdade se alguém quiser o absoluto.
Ele é o mesmo para os chips e para a busca, então não muda a decisão.

### As cinco opções antigas

Continuam em `perguntas.ts`, **agora como reserva**, com a conta do estrago
escrita em cima delas (qual cobria três nichos, quais cobriam nenhum, quais
três nichos eram inalcançáveis) e um "não acrescente opção aqui". A flag
nova é `Pergunta.seletorDeNicho`.

---

## 3. A validação — a que quebraria calada

`app/(fluxo)/onboarding/actions.ts`, e a decisão pura em
`lib/nichos/escolha.ts`.

Antes deste lote, a linha 148 conferia resposta de chip contra
`pergunta.opcoes`. Com o nicho vindo do endpoint, **nenhum** nicho está
nessa lista: toda escolha válida seria recusada, e o conserto tentador
seria apagar a checagem — reabrindo o buraco de forjar `origem: "chip"` que
ela existe para fechar.

Agora confere contra a **mesma lista viva que a tela mostrou**. Custa um
`GET /nichos` por resposta de ramo: 17 ms, uma vez por cliente na vida.

### Duas decisões minhas dentro disso

**Grava a grafia canônica, nunca o texto do cliente.** A conferência casa
normalizado, então "dentista" e "DENTISTA" entram e casam — mas o que vai
para a coluna é sempre `Dentista`. Sem isso a coluna acumularia grafias
diferentes para o mesmo nicho, e ela é lida por tela, por conferidor e um
dia por relatório.

**Dois recados de recusa, e eles não podem virar um.**

| situação | recado |
|---|---|
| lista no ar, texto não casa | "Essa opção não existe nesta pergunta." |
| lista fora, nem a reserva casa | "Não consegui confirmar sua escolha agora. Tente de novo em instantes." |

A diferença é quem errou. Com a lista fora, **nós** é que não conseguimos
conferir — acusar o cliente de escolher opção inexistente é o sistema
culpando ele pelo próprio defeito. Há uma conferência guardando essa
diferença, para o dia em que alguém "simplificar" os dois num só.

E com a lista fora, os chips da reserva **passam** — senão o cliente
escolhe um chip que a tela acabou de mostrar e ouve que ele não existe.

### O que fica gravado

`businesses.niche` guarda o **rótulo** ("Dentista"), não o identificador
(`clinica-odontologica`). O handoff não decidiu isso; decidi assim porque a
`/meu-negocio` mostra esse valor ao cliente e "clinica-odontologica" na
tela quebra a regra de zero jargão, porque nada a jusante precisa do slug
hoje (`CadastroCompleto` não carrega nicho), e porque o slug é recuperável
a qualquer momento pela lista viva. **Se for para inverter, é barato agora
e caro depois de ter linha gravada.**

---

## 4. Como foi testado — os dois lados

O Victor foi explícito: fallback passando não prova que a busca funciona.

**Contra o endpoint real.** `pnpm conferir:nichos`, **66/66**. Ele precisa
de rede e de token, ao contrário dos outros conferidores — é o ponto: um
teste contra cópia local provaria só que a cópia concorda consigo mesma.
Sem as env vars ele **pula** os §§ de rede e avisa alto, em vez de fingir
que passou.

O que ele prova e vale citar:

- os 46 termos acentuados do dado real são **todos** acháveis digitados sem
  acento. É a armadilha do `rodízio` generalizada — vale para termo que o
  backend acrescentar amanhã, não só para os dez de hoje;
- `padaria`, `doceria`, `mercearia`, `confeitaria`, `mercadinho` e
  `lavanderia` não acham nada. É a decisão funcionando;
- `"Clínica / Consultório"` e `"Loja física"` **não** são nicho — o buraco
  que o lote fecha;
- o piso de 183 termos, não igualdade: termo só cresce, e cair abaixo é
  deploy atrasado.

**No navegador, com a lista viva** (andaime temporário, já removido —
`/onboarding` exige sessão):

| digitei | aconteceu |
|---|---|
| `siso` | filtrou para **Dentista** |
| `padaria` | zero chips, apareceu o Enviar e o recado; enviou como texto livre |
| `clinica de estetica` (sem acento) | virou chip `Clínica de estética` / `clinica-estetica` |

**No navegador, com a env desligada de verdade** (as duas linhas
`V2G_BACKEND_*` comentadas no `.env.local`, servidor reiniciado, arquivo
restaurado depois): a pergunta 2 voltou a mostrar os cinco chips, o
"Outro" e o "ou digite sua resposta". Exatamente o comportamento anterior
ao lote.

**Suíte completa e build:** `pnpm conferir` limpo, `pnpm build` limpo.

---

## 5. O que ficou pela metade

- **A marcação `aproximacao` está escrita, mas a migration `0021` não foi
  APLICADA** — §0 item 1. Código e conferidor prontos; falta um
  `pnpm db:migrate` com autorização humana. Até lá o onboarding não grava,
  de propósito e ruidosamente;
- **`/meu-negocio` (§7 do handoff)** e **o gate do §5** — fora dos três
  passos pedidos. O §7 virou
  [`buraco-meu-negocio-nicho-livre.md`](../buraco-meu-negocio-nicho-livre.md)
  e é o lote seguinte; o §5 depende de uma decisão já aberta em
  `decisoes.md`;
- **A `0021` não foi exercitada contra Postgres nenhum.** Ela é cópia
  mecânica de duas funções que já rodam em produção, com diff de 2 linhas
  removidas em cada — mas cópia mecânica não é execução. O primeiro
  `db:migrate` é também o primeiro teste de sintaxe dela;
- **`.claude/launch.json`** foi criado para poder subir o dev server pelo
  preview. Não está no `.gitignore`. Se não for para versionar, apagar
  antes do commit.

---

## 6. Não vi a tela renderizada

O painel do navegador não estava exposto, então a verificação foi por
estrutura e por interação, não por pixel. O seletor reusa `.chips-row`,
`.chip-opt`, `.fallback-field` e `.mini-send`; de CSS novo há só o respiro
entre a lista e a busca (`.seletor-nicho .fallback-field`) e o estilo do
recado (`.nicho-sem-lista`, em `--fs-corpo` e `--ink`, não em legenda e não
em `--crit` — não achar o próprio ramo não é erro do cliente). Vale um
olho humano.

---

## 7. Arquivos

**Novos**

```
components/ui/SeletorDeNicho.tsx
lib/backend/nichos.ts
lib/nichos/tipos.ts
lib/nichos/validar.ts
lib/nichos/busca.ts
lib/nichos/escolha.ts
scripts/conferir-nichos.ts
.claude/launch.json          ← ver §5
```

**Alterados**

```
app/(fluxo)/onboarding/page.tsx       busca em paralelo, passa a lista por props
app/(fluxo)/onboarding/Chat.tsx       recebe `nichos`, monta o seletor
app/(fluxo)/onboarding/perguntas.ts   `seletorDeNicho`, as cinco viram reserva
app/(fluxo)/onboarding/actions.ts     valida contra a lista viva; marca a reserva
lib/cadastro/procedencia.ts           `origem` por campo, mandada sempre
app/globals.css                       `.seletor-nicho`, `.nicho-sem-lista`
lib/backend/index.ts                  exporta `listarNichos`
package.json                          `conferir:nichos`, dentro da suíte
```

**Uma migration, e ela NÃO foi aplicada:**

```
supabase/migrations/0021_aproximacao_da_reserva.sql
supabase/objetos.ts                   entrada da 0021 no manifesto do conferidor
```

O handoff §8 dizia "neste lote não há migration nenhuma", e isso valia
enquanto o §4 (a marcação `aproximacao`) estivesse fora. Com o §4 dentro, as
duas instruções não cabiam juntas — a contradição está registrada no §0.1,
junto com a decisão do Victor de fazer a marcação.

O que o §8 dizia e **continua valendo**: `niche` já está na lista branca
(`0015`/`0016`/`0017`), e não se escreve migration para isso.
