# Nichos em dia — 22/09/2026

Branch `nichos-em-dia`, a partir da `main` (`9575eaa`), na árvore
`C:\Users\victo\v2g-deploy\webapp-nichos`.
**Nada foi commitado, empurrado ou publicado. Nenhuma migração. Nenhuma
escrita em banco.**

O Gabriel encolheu o `knowledge/` para **8 nichos e 113 termos**, de
propósito. O `conferir:nichos` estava vermelho por causa disso, e a
leitura corrente era "problema de rede". Não era.

---

## §0 — O que depende de decisão humana

1. **Não consegui ler o banco.** A consulta que decide o tamanho do
   estrago — quantos clientes têm `businesses.niche` de um nicho extinto
   — foi recusada pela política desta sessão. Ela está escrita, pronta
   para colar, em DUVIDA-NICHO-2. É de um minuto.
   **Complicador:** o `.env.local` desta máquina nomeia **dois** hosts
   Supabase diferentes, e só um está na conta que a sessão enxerga.
   Antes de concluir "não tem ninguém", vale saber qual dos dois é o
   banco que a `/meu-negocio` escreve.
2. **A busca casa por pedaço de palavra, e isso ficou perigoso.** Quem
   digita **"ração"** hoje recebe três chips — consultoria de imagem,
   arquiteto e dentista —, por causa de colo**ração**, deco**ração**,
   ext**ração** e restau**ração**. Não implementei o conserto (casar por
   prefixo de palavra): muda uma tela de produção e não estava no pedido.
   Ver DUVIDA-NICHO-1.
3. **A `/meu-negocio` continua texto livre**, com a ajuda sugerindo
   "Padaria" — que é justamente o termo que o conferidor §6 exige que não
   case com nada. Buraco conhecido desde 22/08
   (`docs/buraco-meu-negocio-nicho-livre.md`), e o encolhimento piorou.
   Não consertei: é o lote que aquele documento desenha, e toca produção.
4. **Um dos oito nichos tem custo por contato conhecido.** Eram três, e
   dois apontavam para nichos extintos. Os números do Victor não foram
   apagados — foram para `CUSTO_DE_NICHO_APOSENTADO`, inertes e visíveis.
   Nos outros sete a tela diz que não sabe, que é o certo e é pouco.
5. **Correção do que eu disse ontem:** relatei que um rótulo do backend
   dizia "(Austrália)". **Hoje ele não diz mais** — o `GET /nichos` de
   22/09 devolve "Análise de coloração pessoal / consultoria de imagem",
   sem o parêntese. Os outros dois rótulos-verbete continuam lá.

---

## §1 — Item 1: onde a lista estava escrita à mão

**Em produção, em lugar nenhum — e isso é decisão registrada.**
`app/(fluxo)/onboarding/perguntas.ts` tem `opcoes: []` com um bloco que
proíbe acrescentar: *"toda linha nova é uma lista paralela envelhecendo
em silêncio"*. A `/onboarding` chama `listarNichos()` desde 22/08.

**A cópia estava na bancada**, e tinha apodrecido:

| a bancada oferecia | existe hoje? |
|---|---|
| distribuidora-de-bebidas | não |
| agencia-de-marketing | não |
| arquitetura | **sim** |
| clinica-odontologica | **sim** |
| barbearia | não |
| manicure | não |
| petshop | não |
| oficina-mecanica | não |

**Seis dos oito não existiam.** E os seis que o backend passou a servir —
advocacia, análise de coloração, gestão de tráfego, rastreamento
veicular, reparos, venda de veículo — a bancada nunca ofereceu. Três
quartos dos chips eram negócios que o produto não atende; todos os que
ele atende estavam escondidos. Capturar tela ali era capturar ficção.

**A justificativa também era falsa.** O comentário dizia "a bancada não
tem token do backend". Tem: `app/exemplo/[tela]/page.tsx` é componente de
**servidor** e lê o mesmo `.env.local`. Quem não pode ver o token é o
navegador — e por isso a lista agora desce como **prop**, igual a
produção.

**Dá para vir só do `GET /nichos`? Dá, e agora vem.** Sem lista de
reserva: com o catálogo fora, a bancada mostra o estado degradado, o
mesmo que produção mostra. Reserva não é degradação.

### Os comentários também eram cópia

Cinco arquivos afirmavam a lista de agosto. Corrigidos com a medição de
hoje e com o motivo:

| arquivo | dizia | é |
|---|---|---|
| `lib/nichos/tipos.ts` | "183 termos nos dez nichos" | 113 em 8 |
| `lib/nichos/tipos.ts` | "vazio em nove dos dez; só petshop tem três" | vazio nos 8, zero na lista |
| `lib/nichos/tipos.ts` | exemplo "Petshop — Banho, tosa e veterinário" | nicho extinto |
| `lib/nichos/busca.ts` | dez termos acentuados pelo nome | **nove sumiram** |
| `lib/nichos/busca.ts` | "os dez chips têm que estar visíveis" | "todos" |
| `lib/nichos/validar.ts` | "mostra os chips de reserva" | **a reserva saiu em 22/08** |
| `lib/nichos/validar.ts` | "nove dos dez não têm sub-tipo" | nenhum tem |
| `lib/backend/nichos.ts` | "dez nichos, 183 termos" | 8 e 113 |
| `lib/backend/index.ts` | "dez nichos e 183 termos" | 8 e 113 |

**Cópia de lista viva não precisa ser um `const` para apodrecer.** Um
número dentro de comentário apodrece igual, e ninguém roda comentário.

---

## §2 — Item 2: o conferidor confere a lista viva

**A regra nova, escrita dentro dele: um conferidor de lista viva não
nomeia item da lista.** Todo caso fixo virou derivado em tempo de
execução.

| era | virou |
|---|---|
| `nichos.length >= 10` | **censo impresso**, não assertado — quem decide o tamanho é o backend |
| `termos >= 183` | idem; asserta só que todo nicho tem ao menos um termo |
| `consultorio-medico -> "Médico"` | nenhum rótulo é o identificador embelezado (voz de dono, sem citar ninguém) |
| 4 sondas à mão ("cardiologista", "martelinho de ouro", "banho de gel", "siso") | **varredura dos 113 termos**, cada um achando o nicho dele |
| `"dent"` acha Dentista | as 4 primeiras letras do rótulo acham o nicho, **para todos** |
| `"Clínica de estética"` com acento | todo rótulo acha nas **4 formas** (exato, caixa, espaço, sem acento) |
| `comLista("Petshop")` e `("Oficina mecânica")` | **todo nicho vivo passa, em 3 grafias**, e volta com a grafia canônica |
| `"pizzaria" -> restaurante` | procura um termo que hoje deixe um resultado só e confere o Enter |
| `"a"` deixa vários | procura a primeira letra que deixe dois ou mais |

**Nomes fixos sobraram só onde precisam continuar NÃO existindo:**
`padaria`, `doceria`, `mercearia`, `confeitaria`, `mercadinho`,
`lavanderia`, e os cinco chips velhos. Esses não envelhecem — a decisão é
que fiquem de fora para sempre.

### §10, a seção nova — e é a que teria pego o estrago

Os §§ 4 a 9 conferem o backend contra ele mesmo. Nenhum perguntava a
coisa que quebrou: **o que o webapp escreveu à mão ainda aponta para
nicho que existe?**

- toda chave de `CUSTO_TIPICO` existe na lista viva;
- nenhum custo aposentado voltou ao catálogo sem ser promovido;
- **nenhuma tela guarda cópia da lista à mão** (varre o texto de três
  arquivos procurando `{ nicho: "`).

**Controle positivo, porque verde que não sabe ficar vermelho não prova
nada.** Pus `petshop: 99` na tabela de custo e colei uma lista de volta
na bancada, uma de cada vez:

```
A) custo apontando para nicho morto     -> exit 1
   FALHA todo nicho com custo por contato existe na lista viva — mortos: petshop
B) lista colada de volta na bancada     -> exit 1
```

Os dois restaurados em seguida.

---

## §3 — Item 3: o que deixou de casar

Em DUVIDA-NICHO-1, com a tabela termo a termo. O resumo:

- **nove dos dez acentuados citados em `busca.ts` sumiram**;
- a normalização continua tendo o que provar: **35 acentuados de 113**
  hoje, e o §5 varre todos;
- **"ração" virou armadilha**: casa três nichos errados por substring.

---

## §4 — Item 4: que tela mostra nicho que não existe

| tela | mostra nicho extinto? |
|---|---|
| bancada `/exemplo/onboarding` passo 7 | **mostrava seis. Consertado hoje.** |
| `/onboarding` de produção | não — lê a lista viva desde 22/08 |
| `/meu-negocio` | **mostra o que estiver gravado, cru.** Campo de texto livre, sem conferência |

**E o achado que sustenta a linha de baixo: ninguém reconfere nicho já
gravado.** Medido chamador por chamador: `nichoPeloRotulo()` só é chamada
por `conferirEscolhaDeNicho` e `resolverConsulta` — as duas na hora de
**escrever**. O comentário da função afirmava que ela decidia "se um
`niche` já gravado ainda é reconhecido"; **não decide, e nunca decidiu.**
Corrigido no arquivo, registrado em DUVIDA-NICHO-2.

Ou seja: se existe cliente com `businesses.niche` extinto, ele continua
vendo o próprio nicho na tela e **nada no webapp nota** — nem tela, nem
conferidor. O primeiro sinal seria um anúncio ruim.

---

## §5 — Verificação

```
pnpm typecheck    EXIT 0
pnpm build        EXIT 0   (Compiled successfully in 3.8s)
pnpm conferir     EXIT 0   ← a cadeia inteira, 21 conferidores
pnpm conferir:nichos       TUDO CERTO — 76/76   (era TEM FALHA — 67/79)
```

`pnpm conferir` fechou verde ponta a ponta — o `&&` não para mais na
`nichos`, então os 12 que vinham depois dela voltaram a rodar na suíte.

**Capturas** em `docs/v2g-wireframes/capturas/nichos-em-dia/`, nos dois
temas e nas duas larguras, abertas e olhadas:

- `nicho-lista-viva-*` — os oito nichos reais;
- `nicho-sem-lista-*` — o estado degradado, forçado na marra e
  restaurado em seguida.

**Um defeito meu, achado olhando a captura degradada:** sem lista, a tela
mostrava dois recados quase iguais, com dois links de WhatsApp
empilhados, e o segundo perguntava "não achou o seu?" para quem não
recebeu lista nenhuma. A legenda do passo também mandava "escolha o mais
próximo" sem lista na tela. Os dois somem agora.

---

## §6 — Confirmações explícitas

- **Nenhum commit, push, merge ou deploy.**
- **Nenhuma migração. Nenhuma escrita em banco** — e nenhuma leitura
  também, porque a que eu tentei foi recusada.
- **Nenhuma chamada à Meta, ao Google ou à OpenAI.**
- O `GET /nichos` foi chamado, que é leitura e é o assunto do lote.
