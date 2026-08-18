# Unificar no V2G-SITE — o que foi medido antes de executar

Levantamento feito nos dois projetos antes de rodar qualquer coisa.
Números conferidos por `count(*)`, não pela estimativa do painel — o
projeto do Oregon esteve pausado e as estatísticas dele mostravam **zero
linhas em tudo**, o que teria feito alguém concluir que não havia nada
para migrar.

| | Oregon (`cvwxfalweuplrlchzzeo`) | V2G-SITE (`ushccxpoxjikzqnwhgfd`) |
|---|---|---|
| região | us-west-2 | sa-east-1 |
| tabelas | clientes, execucoes, criativos, campanhas_meta | 10, do webapp |
| migrations | 2 (`baseline_schema`, `0002_workflow_b`) | 8 (`0001`–`0008`) |
| funções | **0** | 6 |
| gatilhos | **0** | — |
| políticas RLS | **0** (com RLS ligada) | 40 |
| auth.users | 0 | 4 |
| vault.secrets | 0 | 1 |
| buckets | `v2g-midia` (privado), 88 objetos, 41,4 MB | **nenhum** |

---

## 1. Dois dos três motivos já estão resolvidos no banco

A mudança de modelo foi justificada por três ausências. **Duas delas não
são ausências no banco — são ausências no `RespostaExecucao`.**

| O que falta na API | Existe em `execucoes`? |
|---|---|
| nome do negócio | **SIM** — `nome_negocio`, preenchido: "Facetas Curitiba", "Deo Clínica", "Instituto Bastos"… |
| campo de tempo | **SIM** — `criado_em` e `atualizado_em`, ambos `timestamptz` |
| `cliente_id` | não — nulo em 47 de 47 |

Acrescentar esses três campos ao modelo de resposta do backend entrega
nome e tempo **hoje**, sem migrar nada. São dois problemas de exposição,
não de modelagem.

## 2. Não existe chave para ligar `execucoes` a `businesses`

- 47 execuções, **19 nomes de negócio distintos**
- 2 registros em `businesses`: "Meu negócio" (Copacabana) e "V2G" (Rio)
- **Nenhum dos 19 nomes bate com os 2**
- `cliente_id` é nulo em 47/47, então não há nem chave indireta

Cerca de metade dos 19 é lixo de teste: `CHECK DEPLOY`, `CHECK API`,
`CHECK UPLOAD PROD`, `TESTE FIDELIDADE`, `Teste Migracao 0002`.

Apontar `execucoes` para `businesses` deixaria `business_id` **nulo em
47/47** — trocando um campo nulo por outro. O ganho depende de um
mapeamento manual, e os únicos candidatos reais são Facetas Curitiba (12),
Clinica Sorriso Real (10), Deo Clínica (8) e Instituto Bastos (2), que
somam 32 das 47 e **não existem em `businesses`**.

## 3. A lista de migrations está trocada

As `0001`–`0006` citadas no plano são as do **webapp**, e já estão
aplicadas no V2G-SITE — junto com a `0007` (token no Vault) e a `0008`
(publicação de campanha).

O que precisa rodar lá são as **duas do backend**: `baseline_schema` e
`0002_workflow_b`.

Boa notícia: **não há colisão de nome**. `clientes`, `execucoes`,
`criativos` e `campanhas_meta` não existem no destino.

## 4. RLS ligada com zero políticas

No Oregon as quatro tabelas têm RLS **ligada e nenhuma política** — o que
significa negar tudo, para todo mundo, exceto `service_role`. Funciona
porque o backend usa `service_role`.

No V2G-SITE o webapp conecta com a chave anônima e o JWT do usuário, e há
40 políticas. Se as tabelas forem para lá sem política, seguem invisíveis
para o webapp — o que **é aceitável**, porque ele fala com elas via
FastAPI. Mas precisa ser decisão tomada, não omissão herdada.

## 5. `clientes.meta_access_token` é texto puro

A tabela `clientes` tem uma coluna de token de acesso do Meta em texto
claro. Ela tem **zero linhas**, e a decisão é substituí-la por
`businesses` — então **não migre `clientes`**.

Migrar essa tabela levaria um segundo lugar para guardar token de Meta
justamente para o projeto onde o token foi deliberadamente posto no
Vault (`obter_token_meta`, migration 0007). Dois cofres, um deles sem
porta.

## 6. Storage: três registros não fecham

- 89 criativos, **88 objetos** no bucket
- **2 criativos apontam para arquivo que não existe**
- **1 objeto não pertence a criativo nenhum**

Ao recriar o bucket no V2G-SITE, replicar: **privado**, sem limite de
tamanho, todos os tipos. Se ele nascer público, as URLs assinadas de 12h
viram decoração e o acervo fica aberto.

## 7. O que NÃO está amarrado

- **Nenhum código aponta para o projeto antigo.** Uma única menção, em
  `docs/schema-consolidado.md`, e ela está desatualizada: diz "3 linhas em
  execucoes" quando há 47.
- **Zero funções e zero gatilhos** no Oregon: não há lógica de banco para
  portar. `atualizado_em` não é mantido por gatilho — quem escreve é a
  aplicação.
- **Zero usuários e zero segredos no Vault** do Oregon.

---

# PLANO FINAL

Revisado depois de confirmado que **as 47 execuções são teste do Gabriel**.
Nenhum dado de cliente. Isso remove o seed de `businesses` do plano e
transforma a migração numa mudança de infraestrutura, não de dados.

**Nada abaixo foi executado.** A troca das variáveis no Easypanel tem
confirmação própria, porque derruba o pipeline enquanto não apontar para o
lugar certo.

## 1. Os quatro casos de referência que eu guardaria

Escolhidos por **cobertura**, não por serem os maiores. O que um teste de
migração precisa exercitar é o que muda de forma: modo de criativo, tipo
de arquivo, vídeo, aprovações, compliance e volume de storage.

| Guardar | id | Por quê |
|---|---|---|
| **CHECK ENVIAR** | `899f120c` | Único exemplar completo do modo `enviar`. `estrutura_pronta`, 3 criativos enviados, 1 vídeo, 2 aprovações. E o único com `requer_revisao = false` **e** `compliance_visual` nulo — a combinação que testa a armadilha do "nulo não é aprovado". 0,01 MB. |
| **Facetas Curitiba** | `ee301c4f` | Único com os **três tipos** de criativo (`criativo`, `foto`, `logo`) e os dois formatos (`feed`, `stories`). `compliance_visual` preenchido, `requer_revisao = true`, 2 aprovações. Cobre o modo `gerar` inteiro em 0,01 MB. |
| **Deo Clínica** | `a56d3dea` | O peso. 12 criativos e **19,10 MB** — é o único que prova que a mudança de bucket aguenta volume de verdade. Também a maior lista de aprovações (4), que exercita o `jsonb` append-only. |
| **Açaí da V2G** *(opcional)* | `e3c5944f` | Status legado `gerado`, e o **único registro com confiança na escala 0–100** (75, 65, 45) em vez de 0–1. É a fixture do segundo ramo de `formatarConfianca` — sem ele, aquele código fica sem nenhum caso real que o exercite. Custa **0 criativos e 0 bytes**. |

Os três primeiros são o conjunto mínimo. O quarto é de graça e eu o
guardaria: descartá-lo transforma um ramo de código testado em código sem
fixture.

### Uma lacuna que nenhuma escolha resolve

`criativos.origem` na base inteira: **`gerado` = 0**, `enviado` = 10,
nulo = 79.

Nenhum criativo foi marcado como gerado pela IA — nem entre os que vou
guardar, nem entre os que vão ser apagados. O caminho `origem = 'gerado'`
**não tem fixture hoje e não terá depois**. Isso não é consequência do
descarte; já era assim.

## 2. O que exatamente vai ser apagado

Guardando as quatro acima:

| | Guardado | Apagado |
|---|---|---|
| execuções | **4** | **43** |
| criativos | **20** | **69** |
| objetos no storage | **20** | **68** |
| volume | 19,13 MB | **22,28 MB** |

Some 88 objetos e 41,4 MB — bate com o levantamento.

Sem as quatro de referência, seriam 47 execuções, 89 criativos e 88
objetos apagados. Se quiser o conjunto mais leve, tire a Deo Clínica
`a56d3dea`: cai para 19,13 → 0,03 MB guardados, e some o único teste de
volume.

## 3. A sequência

Cada passo é reversível até o 5. O 5 não é.

```
1. V2G-SITE: rodar as DUAS migrations do backend
   (`baseline_schema` e `0002_workflow_b`)
   → sem colisão: clientes/execucoes/criativos/campanhas_meta não existem lá
   → NÃO migrar `clientes`: zero linhas e token em texto puro (§5)

2. V2G-SITE: criar o bucket `v2g-midia`
   → PRIVADO, sem limite de tamanho, todos os mime types — igual ao atual
   → se nascer público, as URLs assinadas de 12h viram decoração

3. Copiar as 4 execuções, seus 20 criativos e os 20 objetos

4. Conferir no destino, antes de tocar em qualquer outra coisa:
     select count(*) from public.execucoes;   -- espera 4
     select count(*) from public.criativos;   -- espera 20
     select count(*) from storage.objects;    -- espera 20
   e abrir uma URL assinada para provar que o arquivo veio junto

5. >>> CONFIRMAR COM O GABRIEL <<<
   Trocar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_BUCKET
   no Easypanel + redeploy
   → o pipeline dele fica fora do ar entre a troca e o redeploy
   → depois: GET /saude deve responder 200 e
     GET /execucoes-em-revisao deve devolver as que sobraram

6. Só então apagar no Oregon. Ou melhor: não apagar —
   deixar o projeto de pé por alguns dias como backup vivo, e só
   depois remover.
```

**O passo 6 é de propósito.** Não há motivo para apagar o Oregon no mesmo
dia: ele já não custa nada em uso, e enquanto existir é a única cópia dos
43 registros descartados. Apagar é a única coisa aqui que não tem volta.

## 4. O que fica pendente depois

- Nenhum `business` é criado a partir destas execuções — elas são teste, e
  o vínculo `execucoes → businesses` passa a valer só para o que entrar
  daqui para frente.
- O patch do `RespostaExecucao` (`patch-resposta-execucao.md`) continua
  independente e não foi aplicado — verificado no `/openapi.json`.
