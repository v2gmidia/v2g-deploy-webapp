# Onboarding v3 — o feedback do Victor — 21/09/2026

Branch `onboarding-v3`, a partir da `main`. **Sem commit, sem push, sem
merge, sem deploy, sem migração aplicada, sem escrita no banco, sem
chamada à Meta ou ao Google.**

## 0. O que depende de decisão humana

Três dos sete itens do feedback esbarraram no backend, e nenhum deles é
questão de desenho:

1. **O backend não sabe segmentar o Brasil inteiro** (DUVIDA-ONB-11). Ele
   monta raio em volta de um ponto e nada mais.
2. **Não existe nicho genérico para o "Outro"** (DUVIDA-ONB-12). Os oito
   nichos do `GET /nichos` são todos específicos.
3. **Ninguém lê as cores da marca** (DUVIDA-ONB-14). As colunas existem
   desde a `0010`; o gerador de criativo não tem campo de cor.

E uma medição que muda um número que você me deu:

4. **Dois dos três custos por contato eram de nichos que não existem**
   (DUVIDA-ONB-13).

## 1. As sete coisas pedidas

| item | estado |
|---|---|
| 1. áudio só onde faz sentido | feito — ficou em uma pergunta |
| 2. transcrição ao vivo | feito — híbrido, com queda limpa no Firefox |
| 3. "Brasil inteiro" | feito na tela; **o backend não recebe** |
| 4. nicho da lista real + "Outro" | feito; **não há nicho genérico** |
| 5. investimento digitado | feito, com o texto vivo mantido |
| 6. cores da logo | feito; **ninguém as lê ainda** |
| 7. conectar Facebook | intocado, e depois virou o complemento B |

E os dois complementos:

| complemento | estado |
|---|---|
| A. cores com caixa de marcação | feito + migration `0023` escrita, **não aplicada** |
| B. duas trilhas no passo 11 | feito, só desenho |

## 2. A lista de nichos estava errada, e não por pouco

**Medido em 21/09 contra `api.v2gmidia.com.br/nichos`:** 8 nichos, 113
termos de busca. Da lista da v2 (bebidas, agência, barbearia, manicure,
petshop, oficina, arquitetura, dentista), **só duas existem**:
`arquitetura` e `clinica-odontologica`. As outras seis nunca existiram.

A lista real:

```
advocacia · analise-coloracao-pessoal · arquitetura · clinica-odontologica
gestao-de-trafego · rastreamento-veicular · reparos · venda-de-veiculo
```

Isso contaminava mais do que a tela: **a `distribuidora-de-bebidas` era o
dado de exemplo de TODAS as capturas da v2**, e era um dos três nichos com
custo por contato declarado. O exemplo virou `arquitetura`, que existe.

Sobre os R$ 7 de bebidas: **não joguei o número em cima de outro nicho.**
Custo de um negócio valendo para outro é pior do que não ter custo.

## 3. A transcrição, agora em duas camadas

**Exercitada de verdade.** Gerei um WAV com fala em português usando a voz
LOCAL do Windows (`Microsoft Maria Desktop`, pt-BR — não é rede, não é
serviço, e não é voz de IA no produto: é arquivo de teste) e mandei pela
própria rota:

```
7,93 s de áudio · status 200 em 2,2 s

DITO   : Eu faço projeto de interiores para apartamento pequeno,
         do desenho até o acompanhamento da obra.
OUVIDO : Eu faço projeto de interiores para apartamento pequeno,
         do desenho eito o acompanhamento da obra.
```

Uma palavra errada em dezessete — e é exatamente o argumento para o
cliente poder editar antes de avançar, que é o que a tela faz.

**O híbrido:** a Web Speech do navegador escreve enquanto a pessoa fala,
separando o que já está fechado do que ainda está sendo ouvido (tinta
normal contra itálico claro). Ao parar, o texto do navegador vai para o
campo NA HORA, e a OpenAI substitui quando responde.

**O ganho não é só velocidade.** Quando a OpenAI falha — sem chave, 429,
rede cortada —, o texto do navegador **continua na tela**. Antes, uma
falha custava tudo o que a pessoa tinha falado.

**Firefox** não implementa `SpeechRecognition`: cai no comportamento da
v2, sem quebrar nada.

**Isto não é voz de IA.** A decisão de 20/09 proíbe SÍNTESE — a máquina
falando com o cliente. `SpeechRecognition` é o contrário. `speechSynthesis`
continua ausente do repositório.

## 4. Um defeito de produção que apareceu no caminho

O campo de valor da verba renderizava em **16px** em vez de 40px. A regra
estava lá, o navegador a listava, e o computado saía errado.

**A causa:** o `globals.css` (lote 2a, 14/09) põe a família dos controles
num `:is(input[type="text"], …)`, e o comentário de lá explica que o
`:is()` foi escolhido **justamente pela especificidade** — ele vale
(0,1,1) para ganhar de `.field input`. Uma classe sozinha vale (0,1,0) e
perde.

Consertei do meu lado, com dois seletores (`.campoDinheiro .campoValor`),
sem `!important` e sem tocar na regra de produção. **Registro porque o
próximo CSS Module que estilizar um `input` vai cair no mesmo buraco.**

## 5. Outro defeito meu, achado olhando a captura

O campo "e qual é o seu negócio?" do "Outro" abria **pré-preenchido com o
slug do nicho** (`arquitetura`), porque o rascunho era semeado de
`respostas[atual.id]` e o passo 7 tem duas respostas. Agora ele semeia de
`nicho_outro`.

## 6. As cores: o que a medição disse

| pergunta | resposta |
|---|---|
| há onde guardar? | **sim** — `identidade_visual.cor_primaria/secundaria/destaque`, migration `0010` |
| o cliente pode gravar? | **não** — a lista branca da `confirmar_campo_do_cliente` aceita só `tom_de_voz` e `observacoes` |
| o criativo lê? | **não** — a `Entrada` do `gerar_criativo_visual` não tem campo de cor |

A migration `0023_cores_da_marca_na_lista_branca.sql` resolve a segunda,
e é **cópia mecânica da 0016** — o `git diff` entre as duas mostra só o
bloco do array e o cabeçalho. **Não aplicada.**

Ela derruba, com medição, a justificativa que a 0015 deu para deixar cor
de fora: *"são lidas pela geração de criativo"*. Não são.

**A extração roda no navegador**, sem API: canvas, contagem por caixas
grossas, e descarte do que não é cor de marca (transparente, quase branco,
quase preto, cinza). **Logo preto e branco devolve lista vazia**, e a tela
diz isso em vez de inventar um azul.

Provado com uma logo PNG gerada aqui (azul `#1F4B99` + laranja `#E8A33D` +
barra preta + fundo branco): a tela devolveu **exatamente as duas cores**,
e ignorou o preto e o branco.

## 7. O custo das chamadas à OpenAI

**Uma chamada, de três autorizadas.**

```
1 chamada · 7,93 s de áudio · gpt-4o-mini-transcribe · status 200
```

Não consultei a tabela de preços, então não vou inventar o valor em reais:
o que posso afirmar é a contagem e a duração. A tarifa desse modelo é por
minuto de áudio, e 7,93 s é uma fração de um minuto — é a menor unidade
que dá para gastar.

As outras duas ficaram sem uso. O contador está em
`scratchpad/chamadas-openai.json`.

## 8. EXITs

```
pnpm typecheck   EXIT=0
pnpm build       EXIT=0
pnpm conferir    EXIT=1   ← conferir:nichos, rede, o vermelho conhecido
```

Os doze que o `&&` pula, um a um, **todos EXIT=0**.

O `conferir:migrations` está **verde** (83 objetos): a `0023` reescreve
uma função que já existe, e o conferidor confirma a presença dela — sem
ver o corpo, que é justamente o que muda. Está escrito no manifesto.

Dois conferidores próprios, sem rede:

```
as cores da logo        26 conferências   EXIT=0
```

**A bancada não chega a produção.** Nos 703 arquivos do pacote: zero
ocorrências de "Essas são as cores da sua empresa", "O Brasil inteiro",
`coresDeImageData`, `ouvinteDeFala`, "Outro — meu negócio", "Você já
anuncia no Facebook" e `reaisDeDigitos`.

## 9. As 60 capturas

`docs/v2g-wireframes/capturas/onboarding-v3/` — 15 telas × 2 temas × 2
larguras. Zero vazamento horizontal, zero palavra proibida (erro, CPL,
CPA, ROAS, diminutivo, "grátis").

Onde a tela depende de um clique ou de um arquivo, o driver faz: ele
clica em "O Brasil inteiro", em "Outro", nas duas trilhas do passo 11, e
**manda a logo de verdade** pelo `DOM.setFileInputFiles`.

Duas capturas existem por um parâmetro de bancada: `?aovivo=1` desenha o
bloco da fala ao vivo com um exemplo dentro — fala não cabe em captura
estática, e sem isso a única forma de olhar essa tela seria falar num
microfone.

## 10. Uma coisa que eu não mexi e vale você olhar

O rótulo do nicho `analise-coloracao-pessoal` é **"Análise de coloração
pessoal / consultoria de imagem (Austrália)"**. Ele vem do backend e
aparece inteiro no botão da tela. Não é meu para mudar, mas "(Austrália)"
num produto brasileiro chama atenção — e o rótulo é o que o dono de
padaria lê.

## 11. `git status` ao fechar

```
 M app/exemplo/[tela]/page.tsx
 M app/exemplo/_onboarding/Onboarding.module.css
 M app/exemplo/_onboarding/Onboarding.tsx
 M app/exemplo/_onboarding/custo-por-contato.ts
 M app/exemplo/_onboarding/destino.ts
 M app/exemplo/_onboarding/perguntas.ts
 M docs/v2g-wireframes/DUVIDAS.md
 M supabase/objetos.ts
?? app/exemplo/_onboarding/cores-da-logo.ts
?? app/exemplo/_onboarding/fala-ao-vivo.ts
?? docs/estado/onboarding-v3-21-09.md
?? docs/v2g-wireframes/capturas/onboarding-v3/
?? supabase/migrations/0023_cores_da_marca_na_lista_branca.sql
```

Intactos: `app/(fluxo)/`, `app/(protected)/`, `app/(public)/`,
`app/(marketing)/`, `lib/`, `components/`, `proxy.ts`, `app/globals.css`.
