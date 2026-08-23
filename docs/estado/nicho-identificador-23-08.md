# O nicho vira identificador — o lote 4, em 23/08

Os dois assuntos que mexiam na mesma coluna, num lote só: **`businesses.niche`
passa a guardar o identificador**, e a **`/meu-negocio` passa a conferir a
escolha contra a lista viva**. Base: o plano do dia (lote 4) e
[`buraco-meu-negocio-nicho-livre.md`](../buraco-meu-negocio-nicho-livre.md).

**Nenhuma migration, e nenhuma escrita em banco.** As linhas existentes estão
como estavam, byte por byte — ver §0.2. Nenhuma ação proibida foi executada:
sem `db:migrate`, sem `POST /cadastro`, sem webhook do n8n, sem Meta, sem
Easypanel/Vercel/painel do Supabase, sem push, sem tocar nas páginas legais,
sem chave fora do `.env.local`. O `.env.local` **não foi tocado** — a sessão
do lote 6 estava usando o mesmo working tree para o disparo do webhook, e o
estado degradado foi verificado forçando a lista nula no andaime em vez de
desligar a env (§4).

---

## 0. Comece por aqui: o que depende de você

1. **Nada bloqueia.** Suíte limpa (101/101 no `conferir:nichos`), build limpo,
   e as oito situações da tela verificadas no navegador.

2. **As duas linhas reais continuam com `Clínica / Consultório`, e isso é
   decisão, não pendência esquecida.** Não houve migração de dado.

   O mapa rótulo→identificador só existe na lista viva do backend. Cravá-lo
   dentro de uma migration recriaria a lista paralela que o lote do seletor
   existiu para matar — e ela envelheceria em silêncio, que é pior que a
   versão de hoje.

   O conserto daquelas linhas acontece quando um humano tocar no campo pela
   `/meu-negocio`: a tela mostra o valor, diz que o ramo não está na lista e
   oferece o botão que abre os dez chips. **A V2G (`a85c37a9`) tem
   `cadastro_estado = 'enviado'` e não trava por isso** — a regra do §5 do
   handoff continua valendo: quem já foi aceito não é travado
   retroativamente.

3. **A extração continua escrevendo nicho em texto livre, e isso agora é
   visível.** `lib/agentes/campos.ts` manda o agente escrever "o ramo, como a
   própria pessoa chama: barbearia, clínica de estética, padaria". Ele não
   escolhe da lista — não tem a lista. Toda linha que a extração preencher
   entra como **não reconhecida** e aparece como pendência na
   `/meu-negocio`.

   **Isso é o certo por enquanto**, e é mais honesto que o de antes: o agente
   não está escolhendo de um catálogo, então o dado dele não deve se parecer
   com uma escolha de catálogo. Mas é decisão sua se um dia o agente passa a
   receber a lista viva e a devolver identificador. Não mexi.

---

## 1. A inversão — e por que hoje era barato

`businesses.niche` guardava o **rótulo** ("Dentista"). Passa a guardar o
**identificador** (`clinica-odontologica`).

**Os dois motivos**, e o segundo é o caro:

1. o rótulo é do backend e pode mudar. Alguém edita o `nome_exibicao` no
   `knowledge/` e toda linha gravada antes fica com o texto velho — sem nada
   em lugar nenhum contando que ficou;
2. **o pipeline escolhe o documento do nicho pelo identificador.** Uma coluna
   de rótulos obriga uma tradução no meio do caminho, e a tradução mora onde
   a lista viva não está.

### A medição que decidiu o formato do conserto

Medido no banco (`V2G-SITE`, 23/08) **antes** de escrever qualquer código:

| negócio | `niche` | procedência | `cadastro_estado` |
|---|---|---|---|
| V2G (`a85c37a9`) | `Clínica / Consultório` | `confirmado` | `enviado` |
| Meu negócio (`0de3321a`) | `Clínica / Consultório` | null | null |
| Padaria Dona Zilda | `padaria` | `extraido` | null (fictícia) |
| Meu negócio (`f0f0ca84`) | null | — | null |

**Zero linhas tinham rótulo válido.** Nenhuma "Dentista", nenhum dos dez.

Isso matou a pergunta mais chata do lote — *o que fazer com o rótulo já
gravado* — e, com ela, um caminho inteiro de código: **não existe tolerância a
rótulo antigo na leitura.** Rótulo na coluna não é reconhecido, e há
conferência guardando isso (`conferir:nichos` §10). Uma segunda regra de
leitura seria código sem sujeito, envelhecendo sem ninguém para exercitá-lo.

É também o motivo de fazer agora: depois de algumas semanas gravando rótulo, a
mesma inversão precisaria de migration com mapa escrito à mão.

### O par, e por que são dois campos e não um

`conferirEscolhaDeNicho` devolvia `{ ok, texto }`. Agora devolve
`{ ok, nicho, rotulo }`:

| campo | destino |
|---|---|
| `nicho` | a coluna `businesses.niche` |
| `rotulo` | o balão do chat, o jsonb do onboarding, a tela |

Separar é o que impede os dois usos de se confundirem de novo: quem grava não
pega o texto de tela por engano, porque ele se chama outra coisa. Há
conferência contra o vazamento nos dez nichos (`conferir:nichos` §8).

**O jsonb do onboarding não mudou de formato** — `respostas.ramo.texto`
continua sendo o rótulo, que é o que ele sempre foi.

---

## 2. A `/meu-negocio` — a porta dos fundos

O buraco: ela gravava a mesma coluna **sem conferir nada**, com procedência
`confirmado`. O cliente escolhia "Dentista" numa lista conferida no onboarding
e trocava por "padaria" uma tela adiante, sem recusa nenhuma.

Fechado nas três camadas, e as três eram necessárias:

1. **a tela** usa o `SeletorDeNicho`, o mesmo componente do onboarding — ele
   já nascera em `components/ui/` para isto;
2. **a Server Action** passa por `conferirEscolhaDeNicho`, a mesma função, não
   uma cópia. Sem isto o item 1 é cosmético: Server Action é endpoint POST de
   verdade, e quem monta o POST à mão não passa por componente nenhum;
3. **o `ajuda` mudou junto.** Ele dizia *"Padaria, salão, clínica — do jeito
   que você mesmo chama"*, e o exemplo era `padaria`: o termo que a busca foi
   construída para não achar e que tem dois testes no backend garantindo que
   não case com nada. Uma tela recusava a palavra e a outra a oferecia como
   modelo de resposta.

A conferência do §2.1 é contra a **família inteira** do varejo de alimento, e
não só contra "padaria": o defeito não foi a palavra, foi dar exemplo de ramo
que a lista não tem.

### A flag mora no catálogo, não num `if` sobre nome de campo

`seletorDeNicho: true` em `lib/perfil/catalogo-cliente.ts`, do lado do
`ondeResponder` e pelo mesmo motivo — foi por `if` sobre nome de campo que
quatro telas passaram a dizer quatro coisas diferentes sobre a mesma conta.

Veio junto uma verificação que quebra na importação: **`seletorDeNicho` e
`opcoes` no mesmo campo é contradição** — são dois editores para a mesma
linha, e o perdedor vira lista escrita à mão que ninguém vê e ninguém mantém.

### Nicho não reconhecido: pendência visível, sem "tá certo"

**Decisão do Victor, 23/08.** O campo continua na lista principal, mostrando o
valor, com uma linha explicando e **um** botão: "escolher na lista".

O "tá certo" **some**, e é o ponto da decisão: confirmar carimbaria
procedência `confirmado` — o nível mais alto da escala — num valor que o
pipeline não consegue usar. O cliente ficaria com a sensação de ter resolvido,
e o dado continuaria mudo.

**E não é erro.** Em `--fs-corpo` e `--ink`, não em `--crit`: quem tem
"Clínica / Consultório" respondeu de boa-fé um onboarding que oferecia aquilo,
e quem tem "padaria" escreveu a verdade sobre o próprio negócio. Nada mais na
tela trava — os outros 25 campos continuam editáveis.

O recado não sugere o vizinho mais próximo (recusado no handoff §10) e não
acusa: *"Esse ramo não está na nossa lista — escolha o seu, e se não achar,
escreva do seu jeito."*

### O texto livre continua existindo

O "Outro" abre o campo, e o que a pessoa escrever vai cru para a coluna. Ela
já disse que não está na lista; casar o texto dela com um nicho ali seria a
sugestão aproximada que foi recusada em 22/08. `padaria` precisa continuar
dizível.

A coluna passa a ter dois tipos de conteúdo — identificador quando sabemos
qual é o nicho, a frase da pessoa quando não sabemos — e **quem lê resolve os
dois numa função só** (`lerNichoGravado`).

### A terceira porta: confirmar também é um POST

Achado ao reler o arquivo depois de fechar as outras duas. A tela não desenha
o "tá certo" num ramo não reconhecido — mas `confirmarCampoAction` é endpoint
de verdade, e quem monta o POST à mão não passa por componente nenhum.

Sem conferência, dava para carimbar procedência `confirmado` num
`Clínica / Consultório`. O valor não muda; a **afirmação sobre ele** é que
fica falsa — mesma família do buraco, um andar acima. Agora o ramo confere o
que já está na coluna antes de confirmar, e com o catálogo fora a recusa é a
de "não deu para conferir agora", não a que acusa o cliente.

---

## 3. O defeito que só apareceu na tela

**Achado no navegador, não no código, e é o motivo de ter aberto o navegador.**

Com o catálogo fora e um identificador na coluna, a `/meu-negocio` mostrava
**`clinica-odontologica` cru** para o dono do consultório. É literalmente o
defeito que o `buraco-meu-negocio-nicho-livre.md` previu para o dia em que o
armazenamento invertesse — jargão na tela que existe para o cliente conferir o
que a gente entendeu do negócio dele.

Quem traduz identificador em rótulo é a lista viva. Sem ela não há tradução, e
as duas alternativas eram piores: desentortar o identificador ("Clinica
odontologica") é inventar rótulo sem acento e sem voz de dono, e "a gente
ainda não sabe" é mentira — sabemos, só não conseguimos escrever o nome.

**O conserto, e ele tem duas metades:**

- a linha mostra *"Não deu para carregar o nome do seu ramo agora — ele
  continua guardado. Recarregue daqui a pouco."*;
- **e não ganha botão nenhum.** O único editor possível sem lista é o texto
  livre, e ele trocaria um `clinica-odontologica` válido pela frase da pessoa:
  a nossa queda rebaixando o dado dela.

Campo **vazio** com o catálogo fora não entra nessa regra — ali não há valor
para proteger nem para traduzir, e a resposta certa é a do onboarding
degradado: texto livre, com a linha dizendo que a lista não carregou. Essa
frase agora mora em um lugar só (`LISTA_NAO_CARREGOU`) e as duas telas a
importam; ela estava escrita à mão dentro do `Chat.tsx`, e copiar teria criado
o segundo texto que envelhece sozinho.

`rotuloDoNichoGravado` devolve **vazio** no estado sem lista, de propósito: se
um dia alguém esquecer de tratar o caso, o pior que acontece é a linha ficar
sem nome. Errar para o lado de não mostrar nada.

---

## 4. Como foi testado — os dois lados de cada corte

**`pnpm conferir` limpo** e **`pnpm build` limpo**, com o andaime já removido.

**`conferir:nichos`: 101/101**, contra o endpoint real (precisa de rede e de
token — é o ponto). O que entrou neste lote:

- **§2.1** — a `/meu-negocio` usa o seletor, não tem lista de opções
  competindo, o texto de apoio não oferece ramo que a lista não tem, e os três
  recados da tela são diferentes entre si;
- **§8** — a escolha volta com o par, e **o que vai para a coluna é
  identificador, nunca rótulo, nos dez nichos**;
- **§10** — o ciclo inteiro nos dez: `escolher → gravar → ler` devolve o mesmo
  rótulo. É esta que pegaria a inversão feita pela metade. Mais: rótulo na
  coluna **não** é reconhecido; `Clínica / Consultório` e `padaria` caem em
  pendência; sem lista nada é acusado de estar fora dela; e o identificador
  não vaza para a tela.

**No navegador** (dev server, andaime temporário renderizando o componente
`Campo` com dados fabricados, já apagado — a `/meu-negocio` exige sessão):

| caso | o que apareceu |
|---|---|
| `clinica-odontologica` | **"Dentista"**, botão "mudar" |
| `Clínica / Consultório` | o valor, a linha da pendência, só "escolher na lista" |
| `padaria` (extraído) | o valor, a linha, "escolher na lista" |
| `"Dentista"` gravado | mostrado, e marcado como pendência |
| vazio | "a gente ainda não sabe", "contar agora" |
| catálogo fora, com valor | a linha do nome que não carregou, **zero botões** |
| catálogo fora, vazio | "contar agora" abre o texto livre + a linha, com `aria-live` |
| tocar em "escolher na lista" | os dez chips, o "Outro" em **décimo primeiro**, a busca, e "deixa como estava" |

E a interação até o servidor: tocar no chip "Dentista" chamou a Server Action,
que respondeu **"Sua sessão expirou. Entre de novo."** — o esperado no andaime
sem login, e a prova de que o `FormData` montado à mão chega lá.

**O que NÃO foi provado no navegador, e é honesto dizer:** a recusa de valor
inventado *dentro da Server Action*. Ela confere a sessão antes de tudo, então
sem login nenhuma chamada chega na validação. O que prova essa metade é o §8
do conferidor, que exercita a **mesma** função que a ação chama — não uma
cópia — e o §2.1, que confere, no **mesmo objeto de catálogo** que a ação usa,
que o campo está marcado com `seletorDeNicho`.

---

## 5. O que ficou pela metade

- **A extração** continua escrevendo texto livre — §0.3;
- **o gate de completude** (§5 do handoff) continua fora, e continua
  esbarrando no item aberto em `decisoes.md` ("6 campos ou 11?");
- **os sub-tipos** continuam não exibidos (handoff §10). O `petshop` é o único
  com três, e exibi-los exige gravar `nicho` **e** `sub_tipo`.

---

## 6. Arquivos

**Novo**

```
lib/nichos/gravado.ts        lerNichoGravado, e os três recados da tela
```

**Alterados**

```
lib/nichos/busca.ts                       nichoPeloIdentificador
lib/nichos/escolha.ts                     devolve { nicho, rotulo }
lib/perfil/catalogo-cliente.ts            seletorDeNicho, o ajuda novo, a verificação
app/(fluxo)/onboarding/actions.ts         grava identificador, ecoa rótulo
app/(fluxo)/onboarding/Chat.tsx           importa LISTA_NAO_CARREGOU
app/(protected)/meu-negocio/page.tsx      busca a lista viva em paralelo
app/(protected)/meu-negocio/Campo.tsx     tradução, seletor, pendência, catálogo fora
app/(protected)/meu-negocio/actions.ts    gravarNicho + a conferência do "tá certo"
app/globals.css                           .rc-nicho-fora
scripts/conferir-nichos.ts                §2.1, §8 e §10
```

**Nenhuma migration.** `niche` já está na lista branca (`0015`/`0016`/`0017`),
e a inversão é de conteúdo da coluna, não de schema.
