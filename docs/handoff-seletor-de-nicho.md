# Seletor de nicho no onboarding — handoff

Contexto de uma sessão anterior, que rodou fora deste repositório e por isso não tinha as regras, skills e hooks daqui. **Leia o `CLAUDE.md` deste repo e os documentos que ele indexar antes de escrever código** — nada abaixo substitui isso.

Convenção: **MEDIDO** = verificado contra código ou banco em 22/08/2026. **DECIDIDO** = escolha do Victor. **ABERTO** = não decidido.

---

## O problema

**MEDIDO.** Existem duas listas de nicho que não conversam:

- o backend tem `knowledge/`, com **dez** nichos;
- este webapp tem cinco opções escritas à mão em `app/(fluxo)/onboarding/perguntas.ts` (pergunta `id: "ramo"`), mais um chip `"Outro"` que abre texto livre.

O desencontro, medido opção por opção:

| opção de hoje | nichos reais que ela cobre |
|---|---|
| Clínica / Consultório | **3** — `clinica-odontologica`, `clinica-estetica`, `consultorio-medico` |
| Beleza e estética | **4** — `barbearia`, `manicure`, `salao-de-beleza`, `clinica-estetica` |
| Restaurante / Bar | 1 — `restaurante` |
| Loja física | **nenhum** |
| Serviço (advocacia, arquitetura, contabilidade) | **nenhum** |

Duas opções sem destino, `clinica-estetica` em duas ao mesmo tempo, e três nichos inalcançáveis pelo seletor: `academia`, `oficina-mecanica`, `petshop`.

**MEDIDO, e é o dado real:** dos 4 negócios na base, um respondeu "ramo" — a V2G escolheu "Clínica / Consultório", que é a menos ruim de cinco opções erradas para uma assinatura B2B.

---

## 1. O endpoint

`GET /nichos` no backend. **Está no ar e responde** (medido às 22:48 de 22/08). Exige `X-V2G-Token`.

> **Atenção:** sem o header ele devolve **401**, não 404. O backend não tem caminho que produza 404 para rota existente — é middleware sobre tudo, com quatro exceções públicas (`/saude`, `/docs`, `/redoc`, `/openapi.json`). Um 401 lido como "não existe" já custou tempo nesta história.

Formato:

```json
[
  { "nicho": "clinica-odontologica",
    "rotulo": "Dentista",
    "termos_de_busca": ["dentista", "odontologia", "siso", "canal", "..."],
    "sub_tipos": [] },

  { "nicho": "petshop",
    "rotulo": "Petshop",
    "termos_de_busca": ["petshop", "banho e tosa", "castração", "..."],
    "sub_tipos": [
      { "id": "produto", "rotulo": "Venda de produtos (ração, acessórios)",
        "nome_exibicao": "Petshop — Venda de produtos (ração, acessórios)" },
      { "id": "servico", "rotulo": "Banho, tosa e veterinário",
        "nome_exibicao": "Petshop — Banho, tosa e veterinário" },
      { "id": "misto", "rotulo": "Os dois",
        "nome_exibicao": "Petshop — Os dois" } ] }
]
```

- `nicho` é o identificador (chama-se `nicho` e não `slug` de propósito).
- `rotulo` é voz de dono, não de catálogo: `clinica-odontologica` → **"Dentista"**, `consultorio-medico` → **"Médico"**.
- **São 10.** O `generico` é filtrado pelo backend — é o destino de quem não casa, não uma escolha. Não reintroduzir.
- `sub_tipos` vem vazio em nove dos dez.

**Contagem de termos:** 183 no commit `3b846a1`, 77 antes dele. Se a busca achar "dentista" mas não "siso", o deploy está atrasado — não é bug do front.

---

## 2. Onde a busca fica — DECIDIDO

**Dez chips visíveis + campo de busca abaixo.** Quem se reconhece na lista toca; quem não, digita. Não obriga a digitar e não esconde a lista.

Dez, e não "os cinco ou seis mais comuns": não há dado de uso para escolher quais (4 negócios, 1 resposta de ramo), e um recorte curado seria uma lista nova mantida à mão — a coisa que este lote existe para apagar. Dez chips curtos cabem.

**Sem match:** o texto vira a resposta, `origem: "texto"` — o caminho do "Outro", que já funciona hoje.

Reaproveite o que existe em vez de inventar componente: `perguntas.ts:31` tem `chipAbreTexto` (chip que abre campo sem responder) e `perguntas.ts:33` tem `soTexto` (pergunta que já nasce com o campo aberto).

**A busca filtra NO CLIENTE.** Com 10 itens, mandar a lista inteira uma vez custa menos que uma ida ao servidor por tecla. O corte para mover ao servidor **não é a contagem** — é o dia em que casar termo virar mais que substring (sinônimos). Por volume puro, client-side aguenta até 150–200 nichos.

Normalize acento e caixa **dos dois lados** antes de comparar, senão "estetica" não acha "Estética".

---

## 3. Segurança: a lista vem do servidor

`GET /nichos` exige `X-V2G-Token`, e o `V2G_BACKEND_TOKEN` é segredo de servidor (`lib/backend/cliente.ts:63`). **Ele não pode chegar ao navegador.**

Server Component busca a lista e passa por props ao componente de cliente, que filtra local. Isso mantém as duas decisões: token no servidor, filtro no cliente.

---

## 4. O fallback — DECIDIDO

Se o endpoint não responder, **os cinco chips fixos de hoje continuam aparecendo**, e a escolha feita por eles é gravada com procedência `origem: "aproximacao"`.

O vocabulário de origem já existe em `procedencia`:

```
confirmado     o cliente respondeu numa lista real
extraido       saiu de entrevista/proposta
desconhecida   rebaixado por conta
aproximacao    ← novo: veio dos chips de fallback
```

**Por que a marcação importa:** aqueles chips não são nichos. "Clínica / Consultório" cobre três; "Loja física" não cobre nenhum. O gestor precisa saber, lendo o dado, que aquele valor foi palpite de um momento em que o sistema estava degradado — e não uma escolha do cliente numa lista real.

Grave no mesmo mecanismo de sempre (`gravarCamposDoCliente`), não numa flag nova.

---

## 5. Gate de completude — DECIDIDO, e tem armadilha

`niche` entra na trava de `lib/cadastro/montar.ts` (hoje ela conta 6 campos, listados a partir da linha 107).

**MEDIDO, e é a armadilha:** as três linhas que têm `niche` hoje **não têm slug válido**:

| negócio | `niche` | procedência | `cadastro_estado` |
|---|---|---|---|
| Meu negócio (`0de3321a`) | `Clínica / Consultório` | **null** | null |
| V2G (`a85c37a9`) | `Clínica / Consultório` | `confirmado` | `enviado` |
| Padaria Dona Zilda (FICTÍCIO) | `padaria` | `extraido` | null |

Ou seja: uma trava que valide contra a lista de nichos **pega quem respondeu**, não quem deixou de responder — porque o que eles responderam nunca foi nicho.

**A regra decidida:** quem já enviou não é travado retroativamente. A marca para distinguir **já existe, não invente estado novo**:

```
businesses.cadastro_estado
  null / 'falhou'   -> nunca foi aceito, o gate novo se aplica
  'enviado'         -> o backend já aceitou este cadastro, não trava
  'enviando'        -> em curso
```

Com isso: a V2G (`enviado`) não trava; a Padaria não dispara de qualquer jeito (`dados_ficticios: true`, barrado antes); e sobra **um negócio real** (`0de3321a`) que o gate alcança — e ele nunca disparou, então é o comportamento certo.

**DECIDIDO (22/08/2026):** o `0de3321a` **não trava**. Ele respondeu o onboarding antigo de boa-fé, e travar agora é mudar a regra depois do jogo. A `/meu-negocio` pede a re-resposta do nicho, **sem bloquear o resto da tela** — os outros campos continuam editáveis e o cadastro continua andando.

A forma disso, para quem implementar: nicho fora da lista de dez não é erro de validação, é **pendência visível**. A `/meu-negocio` já tem a seção `naoSabemos` para campo não preenchido (`page.tsx:93`); um nicho inválido é o caso vizinho — preenchido, mas não mais reconhecido. Reaproveite esse padrão em vez de inventar um estado de erro.

**Dimensionamento, MEDIDO:** hoje isto tem **um único sujeito**, e ele tem cara de linha abandonada — `name` = "Meu negócio" (o placeholder), `procedencia.niche` = null (escrita direta, caminho antigo), respostas com os IDs numéricos antigos, parou no passo 1 do onboarding, criado em 01/08 e sem toque desde 19/08. Tem dono (`profile_id` preenchido), então não dá para afirmar que é lixo — mas a regra vale como seguro para linhas futuras muito mais do que como conserto para esta. **Não vale construir tela nova por causa dela.**

---

## 6. A validação server-side — ISTO QUEBRA SE NINGUÉM MEXER

`app/(fluxo)/onboarding/actions.ts:148`:

```ts
// Resposta por chip precisa bater com uma opção real da pergunta —
// o cliente não escolhe o que quiser só porque manda o campo `origem`.
if (entrada.origem === "chip" && !pergunta.opcoes.some((o) => o.echo === texto)) {
  return { ok: false, erro: "Essa opção não existe nesta pergunta." };
}
```

E o cabeçalho do `perguntas.ts` explica por que a lista é módulo compartilhado: *"o servidor também precisa delas — é ele quem valida a resposta recebida contra as opções existentes antes de gravar."*

**Com nicho vindo do endpoint, nenhum nicho está em `pergunta.opcoes`.** Os dois desfechos ruins: rejeitar toda escolha válida, ou alguém remover a checagem e reabrir o buraco de forjar `origem: "chip"` que ela fecha.

O conserto é validar o `ramo` contra a lista viva de `GET /nichos` **no servidor**. Pequeno, mas precisa ser decidido antes, não descoberto depois.

---

## 7. A `/meu-negocio` entra no mesmo lote — DECIDIDO

**MEDIDO.** `lib/perfil/catalogo-cliente.ts:216` expõe a mesma coluna como texto livre:

```ts
"businesses.niche": {
  bloco: "oferta",
  rotulo: "O que é o seu negócio",
  ajuda: "Padaria, salão, clínica — do jeito que você mesmo chama.",
},
```

Não é só "regras diferentes": uma tela vai restringir a dez nichos, e a outra **convida ao texto livre** — e o exemplo que ela dá é *padaria*, o termo que foi deliberadamente deixado sem par. As duas dão instruções opostas sobre a mesma coluna.

Ela passa a usar o mesmo componente de busca. **O `ajuda` precisa mudar junto**, senão a tela pede uma coisa e o componente aceita outra.

---

## 8. Onde o nicho é gravado hoje

`app/(fluxo)/onboarding/actions.ts:192`:

```ts
if (entrada.qid === "ramo") campos.push({ campo: "niche", valor: texto });
```

**MEDIDO:** o onboarding **já** grava por `gravarCamposDoCliente` → `confirmar_campo_do_cliente`, que grava valor e procedência juntos. Não é escrita direta. Não mude para `update`.

**MEDIDO:** `niche` **já está na lista branca** — migrations `0015`, `0016` e `0017`. **Não escreva migration para isso**; seria no-op e vira folclore.

**Neste lote não há migration nenhuma.** A coluna de divergência de nicho em `execucoes` só entra se o `classificar-nicho` que confirma entrar junto — e ele ficou registrado, não implementado.

---

## 9. O registro de demanda

`respostas[qid] = { texto, origem, echo, em }` grava em `businesses.onboarding->'respostas'`. **O texto do "Outro" já é capturado hoje** — o que falta é ler.

Duas ressalvas medidas para quem for consultar:

1. Linhas antigas usam os IDs numéricos (`"0"`, `"1"`, `"2"`…), do esquema anterior ao rename documentado no cabeçalho do `perguntas.ts`. Existem as duas formas no banco; contar só uma dá número errado sem avisar.
2. Volume hoje: 4 negócios, **1** resposta de ramo. O registro é a decisão certa e vai valer muito, mas hoje ele não decide quais nichos escrever.

---

## 10. O que NÃO se faz neste lote

- **Não criar nicho novo.** `padaria`, `lavanderia`, `mercadinho` não existem em `knowledge/` e não devem ser inventados aqui.
- **Não implementar sugestão aproximada.** Foi proposta e **recusada**, com o motivo: *"a ressalva na tela seria interface pedindo desculpa por não ter o que a pessoa precisa"*. O comportamento certo é a busca não achar e a pessoa cair em "Outro". Há dois testes no backend que falham se alguém casar `padaria` ou a família do varejo de alimento (doceria, mercearia, confeitaria) em qualquer nicho.
- **Não exibir os sub-tipos** por enquanto. Eles vêm no endpoint e têm `nome_exibicao` que se sustenta sozinho, mas achatar exige gravar `nicho` **e** `sub_tipo` no cadastro, e o `CadastroCompleto` não tem nenhum dos dois.
- **Não cachear a lista de nichos como fallback estático.** Recria a lista paralela que este lote existe para matar, e ela envelheceria em silêncio.
- **Não mexer no backend.**

---

## 11. Como testar

O teste honesto tem dois lados, e o Victor foi explícito: **fallback passando não prova que a busca funciona.**

1. **Contra o endpoint real**, que já responde. Confirme os 183 termos antes: busque por `siso`, `cardiologista`, `martelinho de ouro`, `banho de gel` — se algum não achar, o deploy está atrasado.
2. **O fallback, desligando a env** do backend. Verifique que os cinco chips aparecem e que a escolha grava `origem: "aproximacao"`.
3. `padaria`, `doceria`, `mercearia` e `lavanderia` **não devem achar nada**. Isso é a decisão funcionando, não uma falha da busca.

### Armadilha do próprio teste: normalize os dois lados

Aconteceu na verificação de produção. `rodizio` não casou — e o dado estava certo: o termo gravado é `rodízio`, com acento, e o teste comparava sem normalizar.

Se alguém concluir daí que "o termo está errado", o conserto vira tirar o acento do `knowledge/restaurante.md` — mexer no dado para fazer um teste ruim passar, e quebrar a grafia que o cliente lê na tela.

**Normalize `casefold()` + remoção de diacríticos nos dois lados**, no código de produção e no teste. Se só um normalizar, eles discordam e o teste vira armadilha. Termos com acento hoje: `rodízio`, `japonês`, `ração`, `veterinário`, `cílios`, `degradê`, `óleo`, `castração`, `musculação`, `estética`.
