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
