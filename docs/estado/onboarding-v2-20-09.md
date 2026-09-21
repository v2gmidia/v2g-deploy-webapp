# Onboarding novo, onze perguntas — 20/09/2026

Branch `onboarding-v2`, a partir do `main`. Tudo na bancada
`/exemplo/onboarding`, que é 404 em produção. **Sem commit, sem push, sem
deploy, sem escrita no banco e sem tocar na Meta.** O onboarding do ar,
`app/(fluxo)/onboarding/` com cinco perguntas, está intocado.

## 0. O que depende de decisão humana

As oito estão em `docs/v2g-wireframes/DUVIDAS.md`, seção "Onboarding
novo". As três que travam virar produção:

1. **`OPENAI_API_KEY` não existe neste repositório** (DUVIDA-ONB-1).
   Enquanto não existir, o microfone nasce desabilitado com o motivo
   escrito — é o estado de todas as 52 capturas.
2. **Três perguntas não têm coluna no banco** (DUVIDA-ONB-7): o nome da
   pessoa, o WhatsApp que recebe cliente, e — dependendo de onde for
   gravado — o raio. Sem migration, o onboarding novo não tem onde
   escrever.
3. **O custo por contato por nicho não vem do backend** (DUVIDA-ONB-4).
   Os três números usados são os que o Victor deu no chat; todo nicho
   fora deles faz a tela dizer que não sabe estimar.

## 1. O que foi feito

- Onze perguntas na ordem do briefing, uma por tela, com progresso,
  transição e Enter para avançar. Resumo no fim, com botão que abre o
  WhatsApp com mensagem pronta (não há agenda integrada — DUVIDA-ONB-6).
- Áudio ou teclado nas cinco perguntas de texto, com transcrição pela
  OpenAI numa rota só de desenvolvimento, revisão antes de aceitar, e o
  áudio original ao lado do que a máquina entendeu.
- Validações com recusa gentil, sem a palavra proibida: nome sem número,
  empresa com dois caracteres, CEP de oito dígitos, Instagram normalizado
  a partir de `@` ou de URL colada, site com domínio e `https://`
  acrescentado, WhatsApp com DDD e máscara.
- Slider de verba com texto vivo em linguagem de dono, o piso de R$ 750
  como único bloqueio, e o mínimo indicado por nicho — que nunca aparece
  abaixo do piso.
- Cada resposta grava no instante em que é aceita (na bancada, no
  `localStorage`).

## 2. Três defeitos meus, achados olhando as capturas e consertados

1. **O indicado ficava abaixo do piso.** Em bebidas, a tela dizia "o
   indicado é R$ 121" e bloqueava abaixo de R$ 750 — contradição na mesma
   tela. Agora a frase diz os dois números.
2. **O seletor de arquivo aparecia duplicado**, com o rótulo nativo do
   sistema ao lado do meu.
3. **O endereço do site era cortado** na borda do resumo a 375px.

E um desvio do briefing, achado ao rodar a conta: `R$ 500 ÷ 30` saía como
R$ 17 por dia por arredondamento. O briefing escreve R$ 16. Passei a
truncar — para baixo é o lado que não promete o que o dia não entrega.

E mais dois, achados depois, fechando a rodada:

4. **A barra de progresso animava `width`.** O aviso do `impeccable`
   estava certo: animar largura obriga o navegador a refazer o layout a
   cada quadro. Consertei em vez de silenciar — a barra cresce por
   `scaleX` com origem à esquerda, e o fator vem do JSX. Medido na
   página depois: passo 1 = 0px, passo 6 = 324px (45%), passo 11 = 655px
   (91%), passo 12 = 720px (100%), `transition: transform`. Pinta igual.
5. **O 404 da rota de transcrição escrevia a palavra proibida** no corpo
   (`{ erro: "indisponivel" }`), e era o único lugar da rota que não
   usava `motivo` como todos os outros. Virou 404 seco, sem corpo — que
   é o que uma rota inexistente responde.

## 3. Verificações

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← conferir:nichos, rede, o vermelho conhecido
```

Os doze que o `&&` pula, um a um, todos EXIT=0: dia-seguinte 157/157 ·
apresentada 27/27 · signed-request 20/20 · identidade 6/6 · veiculacao
117 · resultado 86/86 · campanha-da-sessao 17/17 · envio 48/48 · inicio
39/39 · analise 30/30 · portao 8/8 · escolha-de-campo 9/9.

Mais 35 conferências próprias das validações e da conta do slider,
rodadas em Node fora do navegador (script no scratchpad da sessão), todas
verdes — inclusive a que prova que as siglas CPL, CPA e ROAS não aparecem
em nenhuma frase.

**A bancada não chega a produção.** Remedido depois de refazer o build:
nos 703 arquivos do pacote (fora de `.next/dev` e `.next/cache`), **zero**
ocorrências de qualquer texto ou função da bancada. E a medição saiu
melhor do que a que eu tinha anotado: no `.js` que o servidor executa não
há **nenhuma** string da OpenAI — nem o modelo, nem o endereço, nem o nome
da chave. O compilador troca `NODE_ENV` pelo literal e poda o corpo
inteiro da rota; o que sobra é uma linha que devolve 404. O nome do modelo
só continua no **sourcemap**, arquivo de depuração. O que de fato fica
exposto é o CAMINHO da rota, nos manifestos — DUVIDA-ONB-8.

`next start` contra o pacote de produção, porta 3110:

```
GET  /entrar                    200   ← controle
GET  /exemplo/onboarding        404
GET  /exemplo/inicio            404
POST /exemplo/api-transcrever   404   corpo de 0 bytes
GET  /exemplo/api-transcrever   405   o Next recusa o método antes do corpo
```

O 405 me pegou de surpresa e eu tinha escrito 404 na expectativa do teste.
Quem estava errado era o teste: rota que só exporta `POST` recusa o GET no
roteador do Next, antes de qualquer código meu. Corrigi a expectativa e
registrei a nuance, em vez de acrescentar um `GET` de fachada só para o
número ficar bonito.

## 4. As 52 capturas

`docs/v2g-wireframes/capturas/onboarding-v2/`: 12 telas (11 perguntas +
resumo) × 2 larguras × 2 temas, mais 4 do passo 9 sem custo conhecido.
Abertas uma a uma. Relatório do driver nas 48 principais: nenhum
vazamento horizontal, "falar com uma pessoa" em todas, e nenhuma
ocorrência de "erro", CPL, CPA, ROAS, diminutivo ou "grátis".

## 5. `git status` ao fechar

```
 M app/exemplo/[tela]/page.tsx                    a rota /exemplo/onboarding
 M docs/v2g-wireframes/DUVIDAS.md                 as oito dúvidas novas
?? app/exemplo/_onboarding/                       perguntas, validações, custo, tela e CSS
?? app/exemplo/api-transcrever/                   a transcrição, só em desenvolvimento
?? docs/v2g-wireframes/capturas/onboarding-v2/    52 PNGs
?? docs/estado/onboarding-v2-20-09.md             este registro
```

Intactos: `app/(fluxo)/`, `app/(protected)/`, `app/(public)/`,
`components/`, `lib/`, `proxy.ts`, `app/globals.css`, `.env.example`.

---

# Complemento: o áudio, duas decisões — 20/09/2026 (tarde)

Mesma branch, mesma bancada, sem commit.

## 6. As duas decisões

**Não haverá voz de IA.** Só transcrição (entrada), nunca síntese (saída).
A pergunta é texto na tela e continua sendo. Varri 174 arquivos de `app/`,
`lib/` e `components/` (ignorando comentário, senão o bloco que DECLARA a
regra se acusava sozinho): zero ocorrências de `speechSynthesis`,
`SpeechSynthesisUtterance`, `/audio/speech`, `text-to-speech`, ElevenLabs,
`tts-1` e `gpt-4o-mini-tts`. Um `<audio>` só em toda a superfície, e a
fonte dele é `ditado.url` — a gravação do próprio cliente voltando.

**O convite ao áudio só nas perguntas ABERTAS**, que são duas: "o que você
vende" e a correção do resumo. Nelas o microfone fica mais convidativo que
o teclado — 54px contra 44px, borda e tinta de cobalto, fundo tingido a 8%
— e ganha as duas frases do briefing. Nas curtas (nome, empresa,
Instagram, site) os dois ficam com o mesmo peso e não há frase. Medido nas
capturas:

| tela | altura do microfone | convite | campo |
|---|---|---|---|
| 1, 2, 5, 6 (curtas) | 44px | não | 48px |
| 4 e o resumo (abertas) | **54px** | **sim** | 98px |
| 4 e o resumo, SEM chave | 44px | não | 98px |

O teclado não encolhe em nenhuma, e continua recebendo o foco quando a
pergunta abre. O microfone convidativo continua com BORDA, não fundo
cheio: o principal da tela continua sendo o "Continuar".

**Sem chave, `aberta` não muda nada** — convidar para falar num microfone
desabilitado seria oferecer o que não existe.

## 7. A correção do resumo não existia — foi desenhada

O briefing trata "a correção do resumo" como pergunta aberta. O resumo só
tinha "Voltar e revisar". Agora tem *"Tem alguma coisa errada aí?"*, campo
aberto, áudio convidativo e "Guardar a correção". Ela não valida nada, de
propósito. Vai para o `localStorage` e **entra na mensagem do WhatsApp** de
agendar — o único caminho que hoje chega numa pessoa. Em produção não tem
destino: DUVIDA-ONB-9.

## 8. A chave da OpenAI apareceu no meio da rodada

De manhã a `OPENAI_API_KEY` não existia neste repositório, e as 52
capturas mostravam o microfone desabilitado. À tarde ela está no
`.env.local` — só o NOME foi lido. O estado real das telas virou o
microfone LIGADO, e as capturas foram refeitas por isso.

Para os dois caminhos continuarem capturáveis, o `?microfone=` da bancada
virou três estados: `1` ligado, `0` desligado, ausente vale o ambiente.

**Não exercitei a transcrição ponta a ponta.** Chamar a rota de verdade
gasta na conta da OpenAI do Victor, e eu não fiz isso sem ele pedir. O que
está provado é a tela nos dois estados, não a qualidade da transcrição.

## 9. Um defeito de família, achado ao medir o convite

A borda do microfone convidativo, com `var(--cobalt)`, media **2,28:1** no
tema escuro — o número exato que `docs/contraste.md` §9.1 cita como o
motivo de `--cobalt-ink` existir. A varredura que criou o token migrou "31
regras de `color:` / `outline:`" e **não passou por `border-color:`**.

Consertei as 6 desta folha, e medi cada uma:

| regra | antes | depois |
|---|---|---|
| `.microConvite` | 2,28:1 | 6,00:1 |
| `.microAtivo` (o "estou ouvindo") | 2,28:1 | 6,00:1 |
| `.escolhida` | 2,28:1 | 6,00:1 |
| `.recado` (medido provocando uma recusa de verdade) | 2,28:1 | 6,00:1 |
| `.barraCheia`, contra o trilho COMPOSTO | 2,05:1 | 5,45:1 |
| `.slider` (`accent-color`) | 2,28:1 | 6,00:1 |

**A barraCheia quase me escapou:** o trilho é translúcido a 6%, e o meu
primeiro medidor leu a camada crua e devolveu 6,49:1. Composto sobre o
fundo, era 2,05:1. Passei a compor as camadas antes de medir — e o mesmo
erro estava no medidor das capturas.

As **22 de produção** ficaram de fora desta rodada e estão descritas em
`docs/buraco-borda-cobalt-no-escuro.md`, com a medição e o conserto. Seis
delas são `:focus` de campo — foco de teclado a 2,28:1 é o caso mais sério.

## 10. Verificações

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← conferir:nichos, rede, o vermelho conhecido
```

Os doze que o `&&` pula, um a um, todos EXIT=0.

Mais dois conferidores próprios, em Node fora do navegador: 35 conferências
das validações e da conta do slider, e 38 das duas decisões do áudio
(inclusive dois controles positivos de que o tira-comentários funciona e
não come URL).

**A bancada não chega a produção.** Nos 703 arquivos do pacote, zero
ocorrências de qualquer texto ou função dela — incluindo as duas frases
novas do convite.

## 11. As 60 capturas

12 telas × 2 larguras × 2 temas, mais 4 do passo 9 sem custo conhecido e 8
do caminho sem chave. Nenhum vazamento horizontal em 32 medidas; pior
contraste de texto 4,61:1; nenhuma ocorrência de "erro", CPL, CPA, ROAS,
diminutivo, "grátis" ou promessa de resultado.

