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
