# Modo noturno — 20/09/2026

Branch `onboarding-v2`. **Nenhum commit, nenhum push, nenhum deploy,
nenhuma migração aplicada, nenhuma chamada à OpenAI, à Meta ou ao Google,
nenhuma escrita no banco.**

## 0. O placar

| tarefa | status | arquivos | testes |
|---|---|---|---|
| **T1** as bordas de produção | **feito** — 14 trocadas, 6 justificadas | `app/globals.css`, `app/(marketing)/lp.css`, `app/exemplo/_bordas/*`, `docs/contraste.md` §14, `docs/buraco-borda-cobalt-no-escuro.md` | 21 casos × 2 temas, antes e depois, compondo camadas; 8 capturas abertas |
| **T2** as colunas que faltam | **feito** — falta **uma**, não três | `supabase/migrations/0022_*.sql`, `supabase/objetos.ts`, `app/exemplo/_onboarding/destino.ts`, `docs/migracao-whatsapp-do-anuncio.md` | 26 conferências do mapa de destino, fora do navegador e fora do banco |
| **T3** a transcrição falhando | **feito** — e um defeito real consertado | `app/exemplo/api-transcrever/route.ts`, `app/exemplo/_onboarding/recados.ts`, `Onboarding.tsx` | 47 conferências com `fetch` dublê; 40 capturas das 10 falhas |
| **T4** o resumo e o fim | **feito** | `Onboarding.tsx`, `perguntas.ts` (`ondeParou`) | 31 conferências + prova viva da retomada no navegador |
| **T5** recomendações | **feito** — 11 dúvidas | `docs/v2g-wireframes/RECOMENDACOES-20-09.md` | — (é documento) |
| — | achado no caminho | `docs/buraco-lp-sem-tema-escuro.md`, `docs/buraco-color-scheme.md` | 59 textos da LP medidos nos dois temas |

---

## 1. T1 — as bordas de cobalto

**Eram 21, não 22.** Contei 21 no `globals.css` quando são 20, mais 1 no
`lp.css`. E **eram 3 de foco, não 6** — as outras que eu contei como foco
são `:hover`.

**14 trocadas** para `--cobalt-ink`. No tema escuro saíram de 1,87–2,28:1
para 3,30–6,00:1. **No tema claro: 21 de 21 casos com cor e contraste
idênticos** — medido antes e depois, não deduzido do token.

As três de foco de teclado são o caso mais sério: quem navega sem mouse
perde o rastro de onde está.

**6 ficaram, e o porquê de cada uma** está em `docs/contraste.md` §14.3.
Quatro são **borda morta** — o grupo dos cinco papéis de botão põe
`border: 0` depois, e a largura computada é `0px`; trocar a cor não
mudaria um pixel. Duas são **preenchimento**, e uma delas resolve a
questão inteira em um número: branco sobre `--cobalt` dá **8,70:1**, e
sobre `--cobalt-ink` cairia para **3,30:1**. Cobalto é bom como fundo e
ruim como tinta — trocar o fundo quebraria o texto que está em cima dele.

**Três coisas que só a medição mostrou:**

1. as quatro bordas mortas — ler o CSS não bastava, era preciso computar;
2. o meu primeiro medidor de `:focus` media a borda de repouso: `el.focus()`
   numa página headless nem sempre pega, e ele devolvia `--line` (1,24:1)
   achando que era o foco. Só lendo a regra no CSSOM o 2,10:1 apareceu;
3. o `.faq` da LP é a armadilha da §9.1 ao vivo — o cartão é **branco mesmo
   no tema escuro**, então a borda tem um lado claro e um escuro. O pior
   dos dois lados subiu de 1,87 para 3,30, acima do piso, e por isso a
   troca fica.

**Para olhar:** `/exemplo/bordas` renderiza a marcação real das 14, com
repouso e estado forçado lado a lado, e a lista das 6 que ficaram.

---

## 2. T2 — as colunas que faltam: uma, não três

**A DUVIDA-ONB-7 estava errada**, e o erro foi meu: eu olhei o catálogo de
extração (`lib/agentes/campos.ts`) em vez do schema. O catálogo não lista
`full_name` nem `radius_km` porque nenhuma das duas vem da conversa com o
agente.

| pergunta | destino | existe? |
|---|---|---|
| nome da pessoa | `profiles.full_name` | **existe**, `0001_init.sql:51` |
| raio de atendimento | `businesses.radius_km` | **existe**, `0001_init.sql:56` |
| WhatsApp que recebe cliente | `businesses.whatsapp_do_anuncio` | **não existe** |

`supabase/migrations/0022_whatsapp_do_anuncio.sql` está escrita e **não
aplicada**. Não serve `profiles.whatsapp`: aquele é o número da PESSOA que
tem a conta; este é o do NEGÓCIO, para onde o anúncio manda quem clicar.

**A lista branca NÃO entrou, de propósito.** Ela não entra sozinha — pede
`lib/agentes/campos.ts` ou `EXTRAS_ESPERADOS` na mesma leva, e eu estava
proibido de tocar código de produção fora de CSS. O SQL e as duas linhas
de TypeScript estão prontos para colar em
`docs/migracao-whatsapp-do-anuncio.md`, com a recomendação de qual dos
dois caminhos seguir.

**A bancada está ligada aos destinos** em `destino.ts`: o mapa das onze
perguntas, com `colunaExiste` e `naListaBranca` por campo. Ele **não
escreve nada** — diz o que seria escrito. `?destino=1` mostra a tabela na
tela.

---

## 3. T3 — a transcrição falhando, e um defeito real

**O defeito:** quando a transcrição falhava, **o áudio gravado sumia.** O
blob morria dentro da função. Quem falasse um minuto e caísse num 429
perdia o minuto.

**Consertado:** o áudio entra em estado próprio no instante em que a
gravação PARA, antes de qualquer chamada. Se a transcrição não vier, ele
continua na tela com tocador — a falha custa a transcrição, não o que a
pessoa falou.

**Mais três coisas:**

- **teto de tempo no navegador**, 2 minutos, para ninguém falar oito e
  descobrir o limite do outro lado;
- **cada falha com o seu recado**, e o de 429 é o único que manda esperar
  — tentar de novo na hora é justamente o que piora um limite de uso;
- **as frases saíram para `recados.ts`**, lido pela rota E pela bancada.
  Com a frase escrita nos dois lugares, um dia um muda e o outro não, e a
  tela capturada deixa de ser a tela que o cliente vê.

**47 conferências**, com o `fetch` global trocado por um dublê. Nenhum
pacote saiu desta máquina, e a seção 0 do teste prova isso. Cobre: chave
ausente, 429, 500, 503, 401, 400, rede cortada, áudio mudo, áudio longo
demais, arquivo de zero byte, campo ausente. Em todos: recado sem a
palavra proibida, que não começa culpando quem falou, que diz o que fazer,
e o teclado oferecido. E duas que valem por si: **nenhum nome de campo da
OpenAI vaza para a tela**, e nem o nome dela.

**40 capturas** dos 10 casos, `capturas/onboarding-v2/falhas/`.

---

## 4. T4 — o resumo e o fim

**O resumo mostra as onze**, inclusive o que ficou em branco (traço), com
**"mudar" em cada linha** que volta À PERGUNTA — não ao passo anterior.
Quem quer corrigir o WhatsApp não passa por mais seis telas.

**O que veio de áudio aparece marcado.** A marca vive numa chave reservada
guardada junto das respostas, então sobrevive a fechar o navegador — se
vivesse num estado à parte, quem voltasse veria o resumo sem saber o que
tinha ditado.

**A mensagem de agendamento leva o cadastro inteiro.** 490 caracteres no
dado de exemplo: as onze respostas, o que ficou em branco escrito como
"não respondi", o que veio falado marcado, e a correção do resumo com
teto de 600 caracteres e aviso de corte. Ela é montada da **mesma lista**
que desenha a tela — duas listas separadas divergem, e quem atende
receberia um resumo diferente do que o cliente viu.

**A retomada, provada no navegador:** com cinco respostas no
`localStorage`, a tela reabriu em **"PERGUNTA 5 DE 11 — Qual o @ do seu
Instagram?"**. É a PRIMEIRA sem resposta, e não a última respondida: quem
voltou para corrigir o Instagram no meio e fechou o navegador reabre no
Instagram, não no resumo.

---

## 5. Dois achados que eu não fui procurar

**A landing page não tem tema escuro que funcione.**
`docs/buraco-lp-sem-tema-escuro.md`. Medido com recarga limpa em cada
tema: **claro 0 de 59 textos abaixo do piso; escuro 28 de 59, pior caso
1,16:1** — texto `#E9EFF8` sobre cartão `#FFFFFF`. O `globals.css` é
importado pelo layout raiz e troca a tinta; o `lp.css` não tem uma linha
de `prefers-color-scheme` e os cartões ficam brancos. É a página de
vendas, e o texto que explica o produto é o que some.

**O `color-scheme` só vale para quem clicou no botão de tema.**
`docs/buraco-color-scheme.md`. As duas regras da linha 501 dependem do
atributo `data-tema`, que só existe depois de a pessoa escolher. Quem
confia no modo escuro do sistema recebe tokens escuros e controles nativos
claros — `select` branco, tocador de áudio branco, barra de rolagem clara.
Uma linha conserta.

**Não toquei em nenhum dos dois.** O primeiro muda a cara de uma página no
ar; o segundo é CSS de produção fora do assunto da T1.

---

## 6. Cada decisão que tomei sozinho

1. **`--cobalt-ink` na borda, `--cobalt` no preenchimento.** Não é regra
   minha: é o critério da §9.1 — o FUNDO, não a propriedade. O que eu
   acrescentei foi a medida que decide os casos de fronteira: branco sobre
   cobalto 8,70:1, sobre a tinta 3,30:1.
2. **Não troquei as 4 bordas mortas.** Trocar a cor de uma borda de 0px é
   ruído no diff. Registradas com a medição.
3. **Não troquei os 2 preenchimentos.** Um deles quebraria o texto branco
   por cima. O outro tem borda e fundo do mesmo cobalto, e trocar só a
   borda criaria um anel que não existe hoje. Ficam como buraco aberto: os
   dois medem 2,28:1 contra o fundo da página, e o conserto pede desenho.
4. **Mantive a troca no `lp.css`** mesmo com o cartão branco no escuro,
   porque o pior dos dois lados da borda melhorou (1,87 → 3,30) e no tema
   claro nada muda.
5. **`whatsapp_do_anuncio`, em português.** A tabela mistura os dois
   idiomas, então não havia convenção a respeitar. O nome precisa dizer DE
   QUEM é o número — que é a distinção inteira para `profiles.whatsapp`.
6. **A coluna guarda com máscara**, `(15) 99876-5432`, e não E.164. Quem
   precisar de E.164 para a Meta converte na leitura; guardar o formato de
   uma integração na coluna faz a segunda herdar a escolha da primeira.
7. **A migration não mexe na lista branca.** Ela não entra sozinha, e eu
   não podia tocar os arquivos que teriam de vir junto.
8. **Declarei a 0022 em `supabase/objetos.ts`.** Sem isso o
   `conferir:migrations` acusa manifesto envelhecido — e declarar o que
   uma migration cria faz parte de escrevê-la no padrão do projeto.
9. **O áudio fica quando a transcrição falha.** O briefing pedia "nunca
   perca o áudio já gravado"; o código perdia.
10. **Teto de 2 minutos na gravação.** Número meu. Nenhuma destas onze
    perguntas pede uma resposta mais longa.
11. **A retomada é a PRIMEIRA pergunta sem resposta**, e "não tenho site"
    conta como resposta — lá há saída legítima, no Instagram não.
12. **A correção do resumo entra na mensagem do WhatsApp**, cortada em 600
    caracteres com aviso. Deixá-la só no navegador seria perdê-la.
13. **A amostra `/exemplo/bordas` é bancada nova.** As 14 regras pintam
    telas atrás do login, e sem ela não haveria o que olhar.
14. **Usei a pilha monoespaçada do `DESIGN.md`** em vez da minha: o hook do
    `impeccable` acusou, e eu consertei em vez de silenciar.

---

## 7. O que ficou bloqueado e precisa de humano

1. **Aplicar a `0022`.** `pnpm db:migrate`. É o que fecha o vermelho do
   `conferir:migrations`.
2. **A lista branca do WhatsApp** — migration + `campos.ts` **ou**
   `EXTRAS_ESPERADOS`, na mesma leva. Sem ela o cliente não muda o número
   depois. Pronto para colar em `docs/migracao-whatsapp-do-anuncio.md`.
3. **As 22 bordas de cobalto que eu não podia tocar** — não sobrou
   nenhuma: as 14 foram, e as 6 que ficaram têm razão. **Este item está
   fechado.**
4. **O tema escuro da landing page.** 28 de 59 textos ilegíveis, numa
   página no ar. Três consertos possíveis no documento; recomendo travar a
   LP no tema claro como remédio imediato.
5. **O `color-scheme` no `:root`.** Uma linha.
6. **O preenchimento de cobalto no escuro** — `.trilha-item.e-feita
   .trilha-marca` e `.fase.f-atual .fase-marca`, 2,28:1. Pede desenho.
7. **A `OPENAI_API_KEY` na Vercel e no `.env.example`.** Ela apareceu no
   `.env.local` desta máquina em 20/09; em nenhum outro lugar.
8. **A transcrição nunca foi exercitada ponta a ponta.** Gasta a sua
   conta, e você não autorizou. O que está provado é a tela em todos os
   estados, não a qualidade da transcrição.
9. **As 11 recomendações da T5**, em
   `docs/v2g-wireframes/RECOMENDACOES-20-09.md`. Nenhuma implementada.

---

## 8. EXITs finais

```
pnpm typecheck                 EXIT=0
pnpm build                     EXIT=0
pnpm conferir                  EXIT=1   ← para na conferir:migrations
```

O `&&` para na `migrations`, então os treze seguintes foram rodados um a
um:

```
conferir:nichos                EXIT=1   ← o vermelho conhecido, de rede
conferir:migrations            EXIT=1   ← a 0022 escrita e NÃO aplicada
conferir:lista-branca          EXIT=0
conferir:dia-seguinte          EXIT=0
conferir:apresentada           EXIT=0
conferir:signed-request        EXIT=0
conferir:identidade            EXIT=0
conferir:veiculacao            EXIT=0
conferir:resultado             EXIT=0
conferir:campanha-da-sessao    EXIT=0
conferir:envio                 EXIT=0
conferir:inicio                EXIT=0
conferir:analise               EXIT=0
conferir:portao                EXIT=0
conferir:escolha-de-campo      EXIT=0
```

**Os dois vermelhos são esperados e diferentes entre si.** O `nichos` é de
rede (a lista viva encolheu de 10 para 8). O `migrations` é o conferidor
fazendo o serviço dele: ele lê o schema VIVO, a 0022 está no repositório e
não no banco, e ele fica verde no instante em que alguém rodar
`db:migrate` — é exatamente o que
`docs/migration-no-repo-nao-e-migration-aplicada.md` descreve.

Fora da suíte, quatro conferidores próprios em Node, sem rede e sem banco:

```
validações e a conta do slider   35 conferências   EXIT=0
as duas decisões do áudio        38 conferências   EXIT=0
o mapa de destino das colunas    26 conferências   EXIT=0
a transcrição falhando           47 conferências   EXIT=0
o resumo, a mensagem, a retomada 31 conferências   EXIT=0
```

**A bancada não chega a produção.** Nos 703 arquivos do pacote: zero
ocorrências de qualquer texto, função ou chave da bancada — incluindo os
recados novos, que agora são importados pela rota. `next start`:

```
GET  /entrar                    200   ← controle
GET  /                          200   ← controle
GET  /exemplo/onboarding        404
GET  /exemplo/inicio            404
GET  /exemplo/bordas            404
POST /exemplo/api-transcrever   404   corpo de 0 bytes
GET  /exemplo/api-transcrever   405   o Next recusa o método antes do corpo
```

---

## 9. Confirmação explícita

**Nenhum commit. Nenhum push. Nenhum merge, rebase, reset, amend ou clean.
Nenhum deploy — nem Vercel, nem Easypanel. Nenhuma migração aplicada.
Nenhuma escrita em banco: as únicas consultas foram as leituras que o
`conferir:migrations` e o `conferir:nichos` já fazem. Nenhuma chamada à
OpenAI, à Meta ou ao Google — a transcrição foi exercitada com um `fetch`
dublê, e o teste prova que nenhum pacote saiu. Nenhum arquivo de segredo
foi tocado, e nenhum valor de chave foi impresso: só nomes de variável.
Nenhum arquivo que eu não criei foi apagado.**
