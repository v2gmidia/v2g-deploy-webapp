# onboarding-v4 — 22/09/2026

Branch `onboarding-v4`, na árvore de trabalho `C:\Users\victo\v2g-deploy\webapp-v4`.
**Nada foi commitado, empurrado ou publicado. Nenhuma migração. Nenhuma
escrita em banco.**

---

## §0 — O que depende de decisão humana

1. **A `onboarding-v4` saiu da `onboarding-v3`, não da `main`.** O
   briefing pediu "a partir da main". Medido antes de decidir: `main` tem
   **zero** ocorrências de `NICHO_OUTRO`, e os itens 1 e 2 do briefing
   mexem exatamente no código que só existe na v3 (o chip "Outro" e o
   passo 10 com saída nomeada). Sair da `main` seria reescrever a v3
   inteira antes de começar. **Se a intenção era descartar a v3, esta
   branch está errada e eu refaço.**
2. **Usei `git worktree` em vez de trocar de branch.** A árvore principal
   tem 5 arquivos não commitados da `inicio-correcoes` (os dois defeitos
   da `/inicio`). Trocar de branch os carregaria junto.
3. **O piso de confiança da classificação é chute meu** (0,6). Ver
   DUVIDA-ONB-18: não rodei o agente uma vez, então não sei como a
   confiança dele se distribui.
4. **A lista de nichos do backend foi trocada** entre 22/08 e hoje, e
   `conferir:nichos` falha por causa disso — **na `main` também**. Ver
   DUVIDA-ONB-19. Tem um `SELECT` de um minuto esperando alguém: existe
   cliente com `businesses.niche` de nicho extinto?
5. **Três dos oito rótulos do backend são verbete de catálogo**, um deles
   dizendo "(Austrália)". Ver DUVIDA-ONB-20. O conserto é no `knowledge/`
   do backend; o que eu fiz aqui é remendo de frase.
6. **Transcrição: não troquei nada**, como mandado. O modelo de hoje já é
   o mais barato que a OpenAI lista. Ver §3.

---

## §1 — Tarefa a tarefa

| tarefa | status | arquivos |
|---|---|---|
| 1. "Outro" vira classificação | feito | `_onboarding/classificar.ts` (novo), `_onboarding/perguntas.ts`, `_onboarding/Onboarding.tsx`, `api-classificar-nicho/route.ts` (novo) |
| 2. Material: pular / cobrar de volta | feito (desenho) | `_material/CobrancaDoMaterial.tsx` + `.module.css` (novos), `[tela]/page.tsx` |
| 3. Transcrição: medir custo | medido, nada trocado | — |
| Capturas, 2 temas × 2 larguras | 20 arquivos | `docs/v2g-wireframes/capturas/onboarding-v4/` |
| DUVIDAS | 5 entradas | `docs/v2g-wireframes/DUVIDAS.md` |

---

## §2 — Item 1: o "Outro"

### Duas camadas, e a de graça vem primeiro

1. **`acharPorTermos`** — casa o texto contra os 113 `termos_de_busca` que
   o `GET /nichos` já devolve. Custa zero e responde na hora.
2. **`POST /agentes/classificar-nicho`** — o agente do backend, quando a
   primeira não acha. Roda um LLM e custa, por isso é o degrau de baixo.

Inverter seria pagar um modelo para descobrir que "dentista" é
`clinica-odontologica`, que está escrito numa lista que a gente já tem.

### Os subtipos não serviram

O briefing manda usar os `sub_tipos`. Eles vêm **vazios nos oito nichos**.
Quem carrega o vocabulário é `termos_de_busca`, e é por ele que
"sou designer de interiores" → `arquitetura`, que é o caso que o briefing
cita pelo nome. Detalhe em DUVIDA-ONB-17.

### Três telas, nesta ordem

1. **A pergunta aberta** — "Não achou o seu? Conta com detalhes o que você
   faz.", com áudio, como as outras duas abertas do fluxo.
2. **A proposta** — "Pelo que você contou, o seu caso é **Arquiteto**.
   Confere?", com a linha que diz de onde veio: *Foi "design de
   interiores" no que você contou que me levou até aí.*
3. **A pessoa** — "Então é com uma pessoa mesmo.", quando não dá para
   propor **ou** quando ela recusa. Sem segundo palpite: insistir depois
   de um "não é isso" é discutir com o dono sobre o negócio dele.

### O que eu consertei olhando a captura, não lendo o código

- **A proposta nascia enterrada.** Os nove chips continuavam na tela e a
  frase aparecia depois deles, abaixo da dobra em 375. Pior: o chip aceso
  dizia "Outro" enquanto a frase dizia "Arquiteto" — a tela se contradizia
  em dois centímetros. Com proposta na tela, a lista sai, e a ajuda do
  passo ("Escolha o mais próximo") sai junto: ela instrui sobre uma lista
  que não está mais lá. **De 12 ações na tela para 3.**
- **"Espera o material chegar"** virou **"Destrava quando o material
  chegar"**: a primeira é ordem para quem já sabe que precisa mandar; a
  segunda diz o que destrava o botão.

### Uma família que eu ia duplicar

Eu tinha escrito um normalizador meu em `classificar.ts`. `lib/nichos/busca.ts`
já tem `normalizar()`, e é ela que a busca de nicho de produção usa nos
dois lados. Agora `achatar()` nasce dela e acrescenta **uma** linha
(pontuação vira espaço, porque aqui eu quebro em palavras).

O comentário de `busca.ts` já previa este dia por escrito: *"o dia de
mover é o dia em que casar termo virar mais que substring: sinônimo, erro
de digitação, **radical**"*. A tolerância de radical foi exatamente o que
faltou para "designer" casar com "design".

### Conferidor

`scratchpad/checar-classificar.ts` — **27 conferências, todas verdes**,
sem rede e sem navegador. Ele pegou dois defeitos meus antes de virarem
tela:

- `acharPorTermos("sou designer de interiores")` devolvia `null` — o caso
  do briefing. "designer" não reduzia a "design";
- o palpite por radical saía com **confiança 1,0, acima do 0,9 do
  casamento de termo inteiro**. Evidência mais fraca pontuando mais alto é
  número que ordena errado, e ele decide qual palpite ganha.

---

## §3 — Item 3: a transcrição, medida

**Modelo de hoje: `gpt-4o-mini-transcribe`, US$ 0,003/min.** É o mais
barato que a OpenAI lista. A tabela inteira:

| modelo | US$/min | relação |
|---|---|---|
| **gpt-4o-mini-transcribe** (o nosso) | **0,003** | — |
| gpt-transcribe | 0,0045 | 1,5× |
| gpt-4o-transcribe | 0,006 | 2× |
| gpt-live-transcribe / gpt-realtime-whisper | 0,017 | 5,7× |

**As duas chamadas autorizadas**, mesmo áudio (WAV de 7,93 s, 15 palavras):

| modelo | palavras erradas | tempo | custo neste áudio |
|---|---|---|---|
| gpt-4o-mini-transcribe | **2 de 15** | 2,1 s | US$ 0,000396 |
| gpt-transcribe | 3 de 15 | 1,9 s | US$ 0,000595 |

**Gasto total: US$ 0,000991.** Duas chamadas de duas autorizadas.

**Conclusão: não há o que trocar.** Não existe alternativa mais barata na
OpenAI, e o modelo 50 % mais caro **não foi melhor** nesta amostra.

**A ressalva importa:** uma amostra de 8 segundos em voz sintética é prova
fraca. O que ela sustenta é "não há motivo para trocar agora", não "o
mini é melhor". Sotaque, ruído de rua e áudio de 2 minutos podem inverter
isso — e é áudio de dono de PME no celular que vai decidir, não o meu.

---

## §4 — O que NÃO foi feito, e por quê

- **Nenhum POST ao `/agentes/classificar-nicho`.** A rota está escrita e
  ligada contra o contrato real; ela nunca foi exercitada. Roda um LLM e
  custa, e não foi autorizado. As três capturas do "Outro" foram tiradas
  pela camada local, sem tocar no backend.
- **Nenhuma linha de produção mexida.** O desenho da cobrança do material
  mora na bancada. Levá-lo ao `/inicio` exige que o estado do cliente
  saiba responder "tem material?", e ele não sabe (§0.4 do DUVIDA-ONB-16).
- **`conferir:nichos` continua vermelho** — e continua vermelho na `main`.
  Não é meu, e consertá-lo é mexer num conferidor de produção que a
  `inicio-correcoes` também toca.

---

## §5 — Verificação

```
pnpm typecheck                EXIT 0
pnpm build                    EXIT 0  (Compiled successfully in 4.0s)
pnpm conferir                 EXIT 1  ← conferir:nichos, 67/79
                                        MESMA falha na árvore da main
```

Os 12 conferidores que o `&&` pula depois da `nichos`, um a um:

```
dia-seguinte       EXIT 0   157/157
apresentada        EXIT 0    27/27
signed-request     EXIT 0
identidade         EXIT 0     6/6, 6 exceções declaradas
veiculacao         EXIT 0   117
resultado          EXIT 0
campanha-da-sessao EXIT 0    17/17
envio              EXIT 0
inicio             EXIT 0    39/39
analise            EXIT 0
portao             EXIT 0
escolha-de-campo   EXIT 0
```

**Isolamento da bancada, medido no build limpo:** 717 arquivos de
produção varridos, **zero** ocorrências de qualquer texto das telas novas
— a pergunta do "Outro", a proposta, a recusa, a cobrança do material, o
motivo do botão travado, a frase da tranca, e os termos de busca. A rota
`/exemplo/api-classificar-nicho` aparece no manifesto como caminho, igual
à `api-transcrever`, e responde 404 em produção pelo mesmo trinco.

---

## §6 — Confirmações explícitas

- **Nenhum commit, push, merge ou deploy.**
- **Nenhuma migração escrita ou aplicada. Nenhuma escrita em banco.**
- **Nenhuma chamada à Meta ou ao Google.**
- **Duas chamadas à OpenAI**, as duas autorizadas, US$ 0,000991 no total.
- **Nenhuma chamada ao `/agentes/classificar-nicho`.**
- **Nenhum `.env` lido para fora do necessário, nenhuma chave impressa.**
