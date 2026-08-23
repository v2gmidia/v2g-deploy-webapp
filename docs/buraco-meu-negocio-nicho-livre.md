# Buraco — a `/meu-negocio` grava nicho sem conferir nada

**Medição de 22/08/2026.** Documento de medição: não se atualiza. Se o
defeito for consertado, o conserto é registrado abaixo da linha, sem apagar
o que está aqui.

**É o §7 do [`handoff-seletor-de-nicho.md`](./handoff-seletor-de-nicho.md),
e é o lote seguinte** ao seletor de nicho
([`estado/seletor-de-nicho-22-08.md`](./estado/seletor-de-nicho-22-08.md)).

Mesma família do que o lote do seletor acabou de fechar no onboarding:
**duas telas escrevem a mesma coluna com regras opostas.** O onboarding
agora restringe `businesses.niche` a dez nichos conferidos contra a lista
viva; a `/meu-negocio` continua tratando a mesma coluna como texto livre.

---

## 1. O que foi medido

### A tela convida ao texto livre — e dá o exemplo proibido

`lib/perfil/catalogo-cliente.ts:216`:

```ts
"businesses.niche": {
  bloco: "oferta",
  rotulo: "O que é o seu negócio",
  ajuda: "Padaria, salão, clínica — do jeito que você mesmo chama.",
},
```

O exemplo é **`padaria`** — exatamente o termo que não tem nicho em
`knowledge/`, que a busca do onboarding foi construída para **não** achar,
e que tem dois testes no backend garantindo que ele não case com nada.
Uma tela recusa a palavra; a outra a oferece como modelo de resposta.

### A gravação não confere nada

`app/(protected)/meu-negocio/actions.ts` chama `confirmar_campo_do_cliente`
direto, sem passar por validação de domínio nenhuma:

```ts
const { data, error } = await admin.rpc("confirmar_campo_do_cliente", {
  p_profile_id: ctx.profileId,
  p_business_id: ctx.businessId,
  p_tabela: campo.tabela,
  p_campo: campo.campo,
  p_valor: valor === undefined ? null : valor,
});
```

A única checagem antes disso é `campoOuErro()`, que pergunta se a **chave**
existe na lista branca — não o que o **valor** é.

**A consequência, e é o buraco:** o cliente responde "Dentista" no
onboarding, onde a escolha é conferida contra o `GET /nichos`
(`lib/nichos/escolha.ts`), e uma tela adiante pode trocar por "padaria" sem
nenhuma recusa. O valor entra com procedência **`confirmado`** — o nível
mais alto da escala — porque a função do banco crava `'confirmado'` nos
três atos (migration `0016`, linha 238). O dado fica indistinguível de uma
escolha feita numa lista real.

Ou seja: a validação que o lote do seletor acrescentou tem uma porta dos
fundos aberta, a uma tela de distância.

### A tela mostra o valor cru

`app/(protected)/meu-negocio/Campo.tsx:159`:

```ts
return <>{String(campo.valor)}</>;
```

Sem consulta a catálogo, sem tradução de identificador para rótulo. O que
estiver na coluna aparece literal.

**Ressalva importante, para não se procurar o defeito errado:** *hoje isso
não produz `clinica-odontologica` na tela vindo do onboarding.* O
onboarding grava o **rótulo** (`"Dentista"`), não o identificador — decisão
registrada em `estado/seletor-de-nicho-22-08.md` §3. O valor cru só vira
problema para linhas escritas por outros caminhos: a linha fictícia "Padaria
Dona Zilda" tem `niche = 'padaria'` com procedência `extraido`, e apareceria
assim, literal.

Se um dia a decisão de armazenamento inverter para o identificador, esta
linha passa a mostrar `clinica-odontologica` para o dono do consultório — e
aí ela é o conserto obrigatório, não opcional.

---

## 2. O conserto proposto

1. **A `/meu-negocio` passa a usar o `SeletorDeNicho`**
   (`components/ui/SeletorDeNicho.tsx`), o mesmo componente do onboarding.
   Ele já nasceu compartilhado para isto, e já aceita `escolhido` para
   marcar o chip do valor atual;
2. **o `ajuda` muda junto.** Deixar "Padaria, salão, clínica — do jeito que
   você mesmo chama" acima de uma lista de dez chips é a tela pedindo uma
   coisa e o componente aceitando outra;
3. **a gravação passa por `conferirEscolhaDeNicho`**
   (`lib/nichos/escolha.ts`), a mesma função que o onboarding usa. Sem isso
   o item 1 é cosmético: a porta dos fundos continua aberta para quem
   montar o POST à mão;
4. **nicho fora da lista de dez vira pendência visível, não erro de
   validação.** A tela já tem a seção `naoSabemos` para campo não
   preenchido (`page.tsx:93`); um nicho não reconhecido é o caso vizinho —
   preenchido, mas não mais reconhecido. Reaproveitar esse padrão, sem
   inventar estado de erro, e **sem bloquear o resto da tela**: os outros
   campos continuam editáveis e o cadastro continua andando.

O item 4 é a decisão de 22/08 registrada no §5 do handoff: quem respondeu o
onboarding antigo de boa-fé não é travado retroativamente.

---

## 3. Dimensionamento

**Um único sujeito real hoje.** O `0de3321a` tem `niche = 'Clínica /
Consultório'`, que nunca foi nicho — cobria três. A V2G (`a85c37a9`) tem o
mesmo valor mas com `cadastro_estado = 'enviado'`, e por decisão não trava.
A "Padaria Dona Zilda" é fictícia e é barrada antes por `dados_ficticios`.

**A regra vale como seguro para linha futura muito mais que como conserto
para essas.** Não vale construir tela nova por causa delas — o
reaproveitamento do `naoSabemos` é o teto de esforço justificado.

---

## 4. O conserto — feito em 23/08/2026

Registro abaixo da linha, como manda o cabeçalho: a medição acima **não foi
alterada**. O lote inteiro está em
[`estado/nicho-identificador-23-08.md`](./estado/nicho-identificador-23-08.md).

Os quatro itens do §2, e o que aconteceu com cada um:

| item | como ficou |
|---|---|
| 1. usar o `SeletorDeNicho` | feito, com `seletorDeNicho: true` no catálogo — a flag mora lá, não num `if` sobre nome de campo |
| 2. o `ajuda` muda junto | feito. Há conferência (`conferir:nichos` §2.1) contra a **família inteira** do varejo de alimento, não só contra "padaria" |
| 3. gravar por `conferirEscolhaDeNicho` | feito, e é a metade que importa: sem ela o item 1 seria cosmético |
| 4. pendência visível, não erro | feito — **com uma diferença**, ver abaixo |

**A diferença no item 4, e é decisão do Victor em 23/08:** o campo **não** vai
para a seção `naoSabemos`. Ela é a seção do campo VAZIO, e dizer "a gente
ainda não sabe" sobre um campo preenchido é impreciso. Ele fica na lista
principal mostrando o valor, com a linha explicando e **um** botão ("escolher
na lista"). O que sai é o **"tá certo"**: confirmar carimbaria `confirmado` num
valor que o pipeline não consegue usar.

**Duas coisas que este documento previu e que se confirmaram:**

1. *"Se um dia a decisão de armazenamento inverter para o identificador, esta
   linha passa a mostrar `clinica-odontologica` para o dono do consultório — e
   aí ela é o conserto obrigatório."* Inverteu, e a linha 159 do `Campo.tsx` é
   agora a tradução. Mas a previsão ficou **curta** por um caso: com o catálogo
   FORA não há o que traduzir, e ali o identificador cru chegou mesmo à tela —
   achado no navegador, não no código. Ver §3 do documento de estado;
2. o dimensionamento. Continuam sendo as mesmas três linhas, e **nenhuma foi
   migrada**: o mapa rótulo→identificador só existe na lista viva, e cravá-lo
   numa migration recriaria a lista paralela.
