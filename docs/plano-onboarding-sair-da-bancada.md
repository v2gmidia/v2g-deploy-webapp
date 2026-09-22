# O plano para o onboarding novo sair da bancada

Escrito em 21/09/2026. **Nenhuma linha deste plano foi executada.** Ele
descreve o que precisa acontecer para `/exemplo/onboarding` virar o
onboarding de verdade, na ordem em que as coisas podem acontecer sem
quebrar o que já está no ar.

O onboarding atual — `app/(fluxo)/onboarding/`, cinco perguntas — continua
intocado desde 20/09 e continua sendo o que o cliente usa.

---

## 1. O que existe hoje, dos dois lados

| | no ar (`app/(fluxo)/onboarding/`) | na bancada (`/exemplo/onboarding`) |
|---|---|---|
| perguntas | 5 | 11 |
| pergunta ticket/custo/lucro | sim | não — três números que desde 17/09 não decidem nada |
| pergunta site e Instagram | **não** | sim — e são o que o pipeline lê |
| áudio | não | sim, em uma pergunta |
| grava em | `confirmar_campo_do_cliente` | `localStorage` |
| lista de nichos | do `GET /nichos` | cópia fiel, lida em 21/09 |

**O maior ganho da troca não é o desenho — é o `site_url`.** O agente
`5. varrer-site` só roda com ele, e o onboarding de hoje não pergunta.

---

## 2. Migrações

### 2.1 A `0022` está APLICADA

`businesses.whatsapp_do_anuncio`. Aplicada por você em 21/09, conferida
por leitura do banco: a coluna responde 200 no PostgREST, com controle
positivo e negativo ao lado.

### 2.2 A `0023` está PENDENTE

`0023_cores_da_marca_na_lista_branca.sql` — põe `cor_primaria`,
`cor_secundaria` e `cor_destaque` na lista branca da
`confirmar_campo_do_cliente`. **Escrita e não aplicada.**

Ela não cria objeto: reescreve uma função que já existe. O
`conferir:migrations` fica verde de qualquer jeito, porque ele confere
presença de objeto e não corpo de função — está escrito no manifesto.

**Sem ela**, as cores da logo só são graváveis por `service_role` e o
cliente não as corrige na `/meu-negocio`.

### 2.3 A que ainda não existe

**A lista branca do WhatsApp.** A `0022` criou a coluna; nada pôs
`whatsapp_do_anuncio` na lista branca. O SQL e as duas linhas de
TypeScript que precisam vir junto estão em
`docs/migracao-whatsapp-do-anuncio.md` §4.

Sem ela, o número é gravável pelo backend e o cliente **não** o muda
depois — o que basta para o cadastro e não basta para o produto.

---

## 3. Variáveis de ambiente

| nome | onde está | o que quebra sem ela |
|---|---|---|
| `OPENAI_API_KEY` | só no `.env.local` desta máquina | o microfone nasce desabilitado com o motivo escrito. **Nada quebra** — é o caminho já capturado |
| — | **falta na Vercel** | o mesmo, em produção |
| — | **falta no `.env.example`** | quem clonar não sabe que ela existe |

E as outras cinco que o `.env.example` não lista e o código usa:
`N8N_API_KEY`, `N8N_BASE_URL`, `META_SYSTEM_USER_ACCESS_TOKEN`,
`V2G_OREGON_URL`, `V2G_OREGON_SERVICE_KEY` — DUVIDA-ONB-10.

**Decisão que falta:** o produto passa a depender da OpenAI? Se sim, a
chave entra no `.env.example` e na Vercel. Se não, o onboarding sobe com
o microfone desligado e o teclado — que é uma entrega inteira, e foi
desenhada para isso.

---

## 4. A rota de transcrição fora de `/exemplo`

Hoje: `app/exemplo/api-transcrever/route.ts`, 404 em produção pelo trinco
de `NODE_ENV`.

Ela precisa virar uma rota de verdade. O que muda:

1. **o caminho** — `app/(fluxo)/onboarding/api-transcrever/route.ts`, ou
   `app/api/transcrever/route.ts`. A primeira mantém a rota dentro do
   grupo que o `proxy.ts` já guarda;
2. **o trinco sai** — as quatro primeiras linhas do `POST`, que devolvem
   404 quando `NODE_ENV === "production"`;
3. **a autorização entra no lugar dele.** Hoje a rota não confere sessão
   nenhuma, e tudo bem porque ela não existe em produção. Fora da
   bancada, sem sessão ela vira um endpoint anônimo que gasta a conta da
   OpenAI de quem apontar um script para ele. **Isto não é detalhe: é a
   diferença entre uma rota e uma torneira aberta.** O padrão do
   repositório é `createClient()` + `auth.getUser()` na primeira linha;
4. **um teto por sessão.** A rota tem teto de tamanho (20 MB) e não tem
   teto de CHAMADAS. Um cliente distraído com o microfone aberto pode
   gerar dezenas;
5. **`recados.ts` vai junto.** A rota lê as frases de lá, e o arquivo está
   em `app/exemplo/_onboarding/`. Ele precisa mudar de casa junto — ou a
   rota nova volta a ter frase escrita dentro dela, que foi o que a v2
   consertou.

**O que hoje já está certo e não precisa mudar:** a rota não escreve em
lugar nenhum, não vaza nome de campo da OpenAI para a tela, e tem recado
próprio por tipo de falha. Os 47 conferidores disso continuam valendo.

---

## 5. O que quebra

### 5.1 Quebra na hora, se a troca for feita sem mais nada

| o que | por quê |
|---|---|
| **o WhatsApp do anúncio** | a coluna existe; a lista branca não. A escrita pelo caminho do cliente falha |
| **as cores da marca** | idem, até a `0023` rodar |
| **o "Brasil inteiro"** | `radius_km` é `int`. A resposta não tem onde cair — DUVIDA-ONB-11 |
| **o "Outro" do nicho** | não existe nicho genérico no backend — DUVIDA-ONB-12 |
| **a correção do resumo** | sem destino decidido — DUVIDA-ONB-9 |

### 5.2 Não quebra, mas fica sem uso

| o que | por quê |
|---|---|
| **as cores** | mesmo gravadas, o `gerar_criativo_visual` não as lê — DUVIDA-ONB-14 |
| **o áudio original** | não é guardado em lugar nenhum — DUVIDA-ONB-3 |

### 5.3 O que NÃO quebra, e vale dizer

- **quem já tem cadastro.** O onboarding novo é a porta de entrada; quem
  já passou pela antiga não volta por ela;
- **o pipeline.** O payload do `/cadastro` não muda de forma — o que muda
  é que `site_url` passa a vir preenchido, que é o que ele já esperava;
- **o Firefox.** Sem Web Speech, o áudio cai no comportamento da v2.

---

## 6. A ordem dos passos

Cada passo é reversível sozinho, e nenhum depende do seguinte estar
pronto.

**Passo 1 — as três decisões de produto.** Sem elas os passos seguintes
constroem em cima de suposição:
- a OpenAI entra no produto? (§3)
- o "Outro" vira fila humana, nicho novo, ou recusa? (DUVIDA-ONB-12)
- a correção do resumo vira tabela de recados? (DUVIDA-ONB-9)

**Passo 2 — as duas migrações que faltam.** A `0023` e a do WhatsApp na
lista branca. São as duas de uma linha de diferença cada, e as duas já
estão escritas ou descritas.

**Passo 3 — a rota de transcrição sai da bancada**, com sessão e teto.
Ela pode subir ANTES do onboarding novo: ninguém a chama até a tela
existir.

**Passo 4 — a tela nova entra atrás de uma chave.** Uma variável de
ambiente ou uma coluna no perfil que escolha entre o onboarding de cinco
e o de onze. É o que torna o passo 5 possível.

**Passo 5 — a troca, para uma fatia.** Metade de quem chega, ou os
cadastros de um dia. O que medir: quantos terminam as onze perguntas
contra quantos terminam as cinco. Se o novo terminar menos, a tela nova
está pedindo demais, e isso só aparece com gente de verdade.

**Passo 6 — a troca inteira, e o onboarding de cinco perguntas sai.**

**O que NÃO fazer:** os passos 2 a 6 de uma vez. Cada um deles tem um
jeito próprio de dar errado, e juntos ficam indistinguíveis.

---

## 7. Como voltar atrás

| passo | como se desfaz | custo |
|---|---|---|
| 1 (decisões) | são decisões, não código | — |
| 2 (migrações) | uma migration nova que reescreve a função sem as colunas novas. As COLUNAS ficam: coluna vazia não atrapalha ninguém, e `drop column` apaga o que já foi gravado | baixo |
| 3 (rota) | a rota deixa de ser chamada quando a tela volta atrás. Ela pode ficar no ar sem uso | baixo |
| 4 (chave) | virar a chave | **imediato** |
| 5 (fatia) | virar a chave para a fatia | **imediato** |
| 6 (troca inteira) | o onboarding de cinco perguntas precisa **ainda existir no código**. É por isso que ele só é apagado depois, e não junto | baixo, se ele não tiver sido apagado |

**A regra que faz o retorno barato:** nada é apagado antes de a troca
ficar de pé por um tempo. Migração é acrescentar, não substituir; a tela
velha fica no repositório; a chave é o que decide.

**O que NÃO dá para desfazer:** o que o cliente já respondeu. Se o
onboarding novo gravar e depois voltar atrás, os dados ficam — e é assim
que tem que ser. O que precisa é que eles estejam em colunas que a tela
velha também saiba ler, e estão: as dez das onze perguntas caem em
colunas que já existiam.

---

## 8. O que este plano NÃO cobre

- **a tela de "processando"** entre o cadastro e o primeiro anúncio. O
  `docs/tela-processando.md` a descreve; o Início de chegada desenhado em
  21/09 (`/exemplo/chegada`) cobre o momento seguinte;
- **o que acontece com quem abandonou** no meio das onze perguntas. O
  `localStorage` da bancada guarda; em produção, um cadastro pela metade
  precisa de uma decisão que ninguém tomou;
- **medir se onze perguntas é demais.** É a pergunta do passo 5, e só
  gente de verdade responde.
