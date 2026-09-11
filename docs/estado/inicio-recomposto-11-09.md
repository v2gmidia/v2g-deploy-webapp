# O Início recomposto — 11/09/2026, à noite

Etapa 2 do `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md`, mais as correções
do QA da `visual-v0` e os itens B/C do adendo do Victor.

```bash
pnpm conferir   # exit 0 — 17 conferidores
pnpm build      # exit 0
```

**Não commitei.** Outra sessão commitou a árvore inteira em `72bb099`,
levando este lote junto — ver §0.4.

---

## §0 O que depende de decisão humana

### 0.1 Três sessões escreveram nesta árvore ao mesmo tempo, e o contrato mudou no meio

O prompt dizia "UMA sessão só neste repo". Não era o caso. Medido pelos
`mtime` e pelo que apareceu sozinho:

| o que mudou | quando eu esbarrei |
|---|---|
| `ExecucaoDoNegocio` ganhou `veiculacao` | meu `typecheck` ficou vermelho em 3 arquivos que não são meus |
| `MedidaDoCliente` ganhou `veiculacao` | de novo, dois minutos depois |
| `EstadoDoCliente` ganhou `veiculacao: EstadoDeVeiculacao` | de novo |
| `houveGastoMedido` saiu de `frases.ts` para `lib/veiculacao/estado.ts` | `conferir-estado.ts` quebrado, não por mim |
| `concluidasPeloGasto` virou `concluidasPelaVeiculacao`, **dentro** de `montarEtapas` | minha linha de `/inicio` deixou de compilar |
| `PerguntaDoDia.tsx` em meio a um save | **uma captura saiu com tela de erro** — `MOEDA_DA_RESPOSTA is not defined` |

Adaptei os meus arquivos ao contrato novo e **não toquei nos deles**. Mas a
captura com erro é o item que importa: **prova visual e árvore compartilhada
não convivem.** Eu só peguei porque olhei a imagem; um pipeline que salvasse
sem olhar teria arquivado a tela de erro como evidência.

**Decidir:** ou uma sessão por vez na árvore, ou uma branch por sessão.

### 0.2 A conta `v2g.midia@gmail.com` não tem negócio, e o cadastro normal não cria

Medido no Supabase de produção (`SELECT`, leitura pura):

```sql
select u.email, p.id as profile, b.id as business
from auth.users u
left join profiles p on p.id = u.id
left join businesses b on b.profile_id = u.id
where u.email = 'v2g.midia@gmail.com';
-- profile: 39a95ee5-…   business: NULL
```

`private.handle_new_user()` cria o `profile` e **reivindica** um business por
`claim_email` — não cria nenhum. Quem cria é `obterOuCriarBusiness()`, e ela
só roda dentro da `/onboarding`. O caminho normal não passa lá:
`auth/confirmar` manda para `/` (`next ?? "/"`), a `/` manda para `/inicio`,
`proxy.ts:177` idem.

**Consertei só o sintoma, como pedido:** a `/inicio` manda para `/onboarding`
quem não tem negócio. **O buraco continua:** `/anuncios` e `/vendas` ainda
mostram estado vazio para essa conta, e qualquer conta nova que vá direto
para uma delas cai no mesmo lugar.

### 0.3 O `andamento` do backend contradiz o resto da resposta

Medido agora, na conta da V2G:

```
status               "cadastro_completo"
andamento            "Seu anúncio já rodou e está pausado no momento."
status_na_plataforma "PAUSED"
veiculacao           "ja_foi_ao_ar"
tem_dado_da_plataforma  true
investiu_centavos    1025
```

`cadastro_completo` é o segundo degrau de nove, e a mesma execução já gastou
R$ 10,25. A frase do `andamento` está certa; o `status` é que está velho.
Como a tela mostra o `andamento` **como vem** (regra de contrato), a
contradição não aparece — mas ela existe, e é pedido ao backend.

### 0.4 Outra sessão commitou este lote

A Regra 1 do plano é "não commitar; git é do Victor". Eu não commitei. O
commit `72bb099` levou tudo — meus arquivos inclusive. Não desfiz: reverter
commit de outra sessão é pior que o problema.

---

## §1 A recomposição

### O que estava errado, e não era cor

A `visual-v0` trocou os tokens e **não recompôs nada**. A `/inicio` continuava
com o esqueleto do protótipo: `.page-head` + `.hero-destaque` sangrada +
`.dash-grid`. Repintar a barra lateral de cobalto para `--plate` muda a
barra; não muda a página.

### O que mudou

**O herói deixou de ser faixa e virou dois cartões.** À esquerda, cobalto,
onde-você-está com as quatro fases. À direita, claro, o próximo passo com
**uma** ação cheia. A faixa sangrada (`.hero-destaque`) continua existindo
para a `/vendas`, onde o assunto da tela é um número só.

**As quatro fases sobre as seis etapas**, e nenhuma se perde:

| fase | etapas |
|---|---|
| Preparar | `cadastro`, `conexao` |
| Criar | `peca`, `aprovacao` |
| Publicar | `no_ar` |
| Otimizar | `numeros` |

Quem agrupa é `fasesDaCadeia()`, em `lib/estado/frases.ts` — não a tela. O
`conferir:inicio` §3 trava a partição: total, disjunta, e batendo exatamente
com o que `montarEtapas()` devolve. Se alguém acrescentar um sétimo degrau e
esquecer da partição, reprova ali, e não numa tela em que o cliente conta
quatro e a lista mostra sete.

**O mobile é recomposto, não espremido:** as fases viram 2×2 em vez de
encolherem para quatro colunas de 70px, e a ordem vira vertical.

**"Em breve" não entrou**, mesmo estando no wireframe: é promessa de prazo, e
a conta da V2G ficou 17 dias na mesma etapa. A fase travada diz "Ainda não".
`conferir:inicio` §4 reprova rótulo que prometa prazo.

---

## §2 As decisões que tomei sozinho

**O redirecionamento ficou na `/inicio`, não no `proxy.ts`.** Aqui o dado já
está na mão — `estadoDoCliente()` acabou de ler `businesses` —, então custa
zero consulta. No proxy custaria uma consulta ao banco em **toda** requisição
protegida para responder uma pergunta que importa uma vez na vida do cliente.
No `auth/confirmar` pegaria só quem acabou de confirmar e-mail, e quem já tem
conta e nunca terminou o onboarding continuaria caindo na tela vazia — que é
exatamente o caso medido.

**O `retorno_por_real` saiu (B1), e o motivo é mais forte que o pedido.** O
backend calcula e manda `"117.07"`. Está aritmeticamente certo e é falso
sobre o negócio: `dias_com_os_dois_lados` é **zero**, então a conta divide a
receita de agosto pelo investimento de setembro. "Pra cada R$ 1,00 voltaram
R$ 117,07" é pior do que não mostrar retorno nenhum.

**O `contagemOuAusencia` foi consertado na origem (B5).** Ele usava
`String(valor)`, e `String(1657)` é `"1657"`. Três telas chamam essa função;
consertar a que o QA viu deixaria as outras duas esperando a vez.

**O período dos sinais é o que TEM dado, não o que foi pedido.** `desde`/`ate`
são 30 dias; a campanha tem gasto em três. Escrever "12/08 a 10/09" ao lado de
R$ 10,25 afirma que ela rodou trinta dias gastando dez reais. A tela escreve
`05/09 a 07/09`.

**O item #8 do QA era `??` contra string vazia.** `cookies().delete()` grava um
cookie **vencido, de valor vazio** — então `get()?.value` devolve `""`, e
`"" ?? "sistema"` é `""`. Nenhuma das três opções casava. Virou
`temaDoCookie()`, usada pelos dois leitores: o `RootLayout` acertava por
acidente, e acerto por acidente é o que faz o próximo leitor errar de novo.

---

## §3 A prova visual, e o que ela custou

> **CORRIGIDO em 11/09/2026, à noite — capturar mudou de preço.** Os portões
> de fixture do `proxy.ts`, do `app/(protected)/layout.tsx` e do layout raiz
> (o tema forçado) saíram: capturar agora exige **login de verdade no dev** e
> **o cookie de sessão na automação**, com `v2g_tema=claro|escuro` ao lado. A
> `V2G_FIXTURE_INICIO` continua, e só decide o que a `/inicio` lê.

As oito capturas estão em `docs/estado/capturas-inicio-11-09/`.

**O `--screenshot` do Chrome mente em largura de celular.**
`--window-size=390,2100` produz um PNG de 390px, mas renderiza a página com
viewport de ~500px (o mínimo de janela do Windows) e **recorta** a imagem. O
resultado parece rolagem horizontal — a barra inferior aparecia com 4 de 5
itens, rótulos cortados no meio.

Não era. Medido no navegador de verdade em 375px:

```js
document.documentElement.scrollWidth  // 375
document.documentElement.clientWidth  // 375
// elementos passando da borda: 0
```

As capturas finais saem pelo DevTools Protocol
(`Emulation.setDeviceMetricsOverride`), que muda o viewport de verdade, e
**cada uma imprime `scrollWidth`/`clientWidth` junto**. Todas as oito:
iguais.

**Duas correções vieram das próprias capturas**, e as duas são de contraste no
tema escuro:

1. `.fase.f-atual` era `background: var(--white)` com `color: var(--navy)`.
   No escuro `--navy` vale `#E9EFF8` — **branco sobre branco**. É o defeito do
   `CLAUDE.md`: token nomeado pela cor servindo de fundo e de texto. Virou
   `--plate-ink` / `--plate`, que são nomes de papel e não trocam de lado
   entre os temas.
2. `.command-card .cta` usava `--cobalt` como tinta. No escuro ele é
   `#0239C7`, azul escuro sobre card escuro — o botão sumia. Virou
   `--cobalt-ink`, que é "cobalto como TINTA" e clareia no escuro.

**Um artefato que não é defeito:** nas capturas de página inteira a barra
inferior do celular aparece no meio da imagem. `captureBeyondViewport`
desenha elemento `position: fixed` na posição do viewport enquanto expande a
página. No aparelho ela fica no rodapé.

---

## §4 O portão das fixtures — como está bloqueado

> **CORRIGIDO em 11/09/2026, à noite.** O que este parágrafo chama de
> "portão em três lugares, porque a proteção é em três camadas" era o
> contrário: a MESMA exceção copiada para dentro das três camadas. E a
> frase "liberei o proxy e o layout barrou mesmo assim" não descreve o
> código que foi commitado — nele o layout tinha o mesmo portão e não
> barrava nada. Sobrou o portão da própria `/inicio`; ver a §3 acima.

Três trincos, e nenhum sozinho abre:

1. `process.env.NODE_ENV !== "production"` — o Next troca pelo literal no
   build. **O preview da Vercel também roda com `NODE_ENV=production`**, então
   está fechado pelo mesmo trinco do ambiente de verdade.
2. `V2G_FIXTURE_INICIO`, que não existe em ambiente nenhum da Vercel.
3. A variável mora em `.env.development.local` — arquivo que o `next build`
   **nem abre**, porque `.env.development.*` só é lido com
   `NODE_ENV=development`.

O portão está em três lugares, porque a proteção é em três camadas:
`proxy.ts`, `app/(protected)/layout.tsx` e a própria página. Descobri isso na
marra: liberei o proxy e o layout barrou mesmo assim — que é a Decisão 3
funcionando.

**A prova, com build limpo e sem dev server:**

```bash
rm -rf .next && pnpm build
grep -rl "FIXTURE_SO_DE_DESENVOLVIMENTO_V2G" .next/ --include='*.js' | wc -l  # 0
grep -rl "fixtures-inicio"                   .next/ --include='*.js' | wc -l  # 0
grep -rl "V2G_FIXTURE_INICIO"                .next/ --include='*.js' | wc -l  # 0
grep -rl "V2G_FIXTURE_TEMA"                  .next/ --include='*.js' | wc -l  # 0

# controle negativo — código VIVO dos mesmos arquivos:
grep -rl "onboarding"          .next/server --include='*.js' | wc -l  # 24
grep -rl "Os primeiros sinais" .next/       --include='*.js' | wc -l  # 1
```

**O `rm -rf .next` é parte da prova, não higiene.** Com o servidor de
desenvolvimento rodando, o Next escreve bundles em `.next/dev/`, e lá a
sentinela aparece — como tem que aparecer. Medir sem apagar dá um falso
positivo que eu cheguei a ver.

`conferir:inicio` §6 trava a forma: só a `/inicio` alcança a fixture, só por
`await import()`, e nenhum outro arquivo de `app/`, `lib/` ou `components/` a
menciona.

---

## §5 B8 — quem entra em `/revisar-perfil` e `/saude-meta`

**Não mudei nada.** É uma COLUNA, não lista e não papel do Postgres:
`auth.users.raw_app_meta_data->>'papel' = 'operador'`, lida por
`obterPapel()` (`proxy.ts:76-79`) e checada na linha 173.

Das 7 contas, **uma** tem:

| conta | `raw_app_meta_data` |
|---|---|
| `victorcabralnsilva@gmail.com` | `{"papel":"operador","provider":"email",…}` |
| as outras 6, `v2g.midia` inclusa | `{"provider":"email","providers":["email"]}` |

`obterPapel()` devolve `null` para a `v2g.midia` → cai no ramo
`redirectUrl.pathname = user ? "/inicio" : "/entrar"` → **`/inicio`**, sem
mensagem (é o item #10 do QA, que registra que o bloqueio é mudo).

**É `app_metadata` e não `user_metadata` de propósito:** `user_metadata` é
gravável pelo próprio usuário via `auth.updateUser`, então qualquer cliente
poderia se promover a operador. `app_metadata` só a `service_role` escreve, e
vem assinada dentro do JWT.

**O que eu NÃO fiz:** executar o redirecionamento logado como `v2g.midia`. Não
tenho sessão e não faço login. A prova acima é a coluna medida no banco mais o
caminho lido no código — não a execução.

---

## §6 O que ficou de fora, e por quê

- **B2, B3, B4, C5, C6** — `/anuncios`, `/vendas`, `/alertas`. Fora do escopo
  desta sessão, por instrução.
- **A rodada 2 do QA não existe no disco.** Procurei no repositório inteiro e
  em `Documents/Codex/`. Só a rodada 1 existe, em
  `handoff-packages/correcao-qa-01/`. Trabalhei pelos itens que o adendo
  listou, que são autocontidos — mas não li o documento.
- **`webapp-atual-2026-09-11.png`** também não estava onde o prompt dizia; está
  em `handoff-packages/correcao-qa-01/`. Usei as minhas capturas, como
  autorizado.
- **`/anuncios` e `/vendas` sem negócio** continuam mostrando estado vazio.
- **A promessa de prazo em `frases.ts:614`** ("Costuma levar poucos minutos")
  continua lá. Não é alcançada por conta nenhuma hoje e mudar a voz da cadeia
  é decisão de produto — apontada pela sessão anterior, e continua apontada.
