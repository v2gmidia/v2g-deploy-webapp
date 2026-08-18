# Perfil da empresa — desenho

A base estável de cada cliente. Toda campanha nova consulta em vez de
recoletar.

**Nada implementado.** Este documento é para aprovação.

---

## 0. Onde eu discordo da divisão proposta

A divisão em três — fatos, identidade visual, narrativa — está certa, e os
motivos dados são bons. Duas ressalvas.

**A primeira: "quem são os donos" não é fato do negócio.** Foi listado
junto com ticket e custo, mas dado de pessoa física tem regime diferente
de dado de empresa. Ticket médio errado é problema comercial; nome, rosto
e voz de uma pessoa são dados pessoais sob a LGPD, com direito de exclusão
que a empresa não tem. Misturar os dois em `businesses` faz "apagar os
dados do João" virar cirurgia dentro de uma tabela que metade do sistema
lê.

Proponho **quatro** grupos, com as pessoas separadas dos fatos. É a mesma
lógica que você aplicou ao tirar a foto do dono da tabela de logo — só
levada uma casa adiante.

**A segunda: a narrativa muda pouco, mas não é uma coisa só.** "Quem é
você" e "história do negócio" servem à copy; "o que faz" é quase fato, e o
pipeline usa para classificar nicho. Mantenho narrativa como tabela única,
com o alerta de que `descricao_livre` já vive em `execucoes` e
`description` em `businesses` — são três lugares para a mesma frase se
ninguém decidir quem manda.

---

## 1. As tabelas

### 1.1 Fatos — expande `businesses`

`businesses` já tem 29 colunas e quase tudo que o pipeline consome:
`avg_ticket_min/max`, `avg_direct_cost`, `target_profit_per_customer`,
`monthly_budget`, `differentiators`, `guarantee`, `delivery_time`,
`payment_policy`, `availability`, `business_hours`, `city`, `radius_km`,
`geo_*`.

Falta pouco, e o que falta veio de `execucoes`:

```sql
alter table public.businesses
  add column cep                     text,
  add column atende_somente_no_local boolean default true,
  add column site_url                text,
  add column instagram_handle        text;
```

**Não crio tabela nova para fatos.** Eles já estão aqui, o webapp já lê
daqui, e a RLS já protege por `owns_business`.

### 1.2 Pessoas — `pessoas_do_negocio` (nova)

```sql
create table public.pessoas_do_negocio (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  nome          text not null,
  papel         text,            -- 'dono', 'socio', 'gestor', 'atendente'
  aparece_em_criativo        boolean not null default false,
  consentimento_imagem_em    timestamptz,
  consentimento_imagem_texto text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
```

**Por que `consentimento_imagem_texto` guarda o texto e não um booleano:**
consentimento sob a LGPD precisa ser demonstrável, e "ele clicou sim" não
demonstra a quê. Guardar a redação vigente no momento do aceite é o que
permite responder, dois anos depois, o que exatamente foi autorizado.

`aparece_em_criativo` responde à pergunta que o time de criativo faz toda
semana: posso usar o rosto de quem? Sem esse campo, a resposta vira
memória de alguém.

### 1.3 Identidade visual — `identidade_visual` + reuso de `creatives`

```sql
create table public.identidade_visual (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null unique references public.businesses(id) on delete cascade,
  cor_primaria   text,
  cor_secundaria text,
  cor_destaque   text,
  fonte_titulo   text,
  fonte_corpo    text,
  tom_de_voz     text,          -- 'informal', 'tecnico', 'acolhedor'
  observacoes    text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
```

`unique (business_id)`: um negócio tem uma identidade. Se um dia tiver duas
marcas, são dois `businesses`.

**Os ARQUIVOS — logo e fotos — não entram aqui.** Já existe `creatives`,
com `storage_path`, `type`, RLS e vínculo com `businesses`. Um segundo
lugar para guardar imagem faria a pergunta "onde está a foto do João" ter
duas respostas.

O que falta em `creatives` é dizer de quem é a foto:

```sql
alter table public.creatives
  add column pessoa_id uuid references public.pessoas_do_negocio(id) on delete set null,
  add column uso       text default 'campanha';
  -- uso: 'logo' | 'identidade' | 'campanha' | 'referencia'
```

**Esse `pessoa_id` é o que responde ao seu ponto de LGPD.** Quando um
cliente sair e quiser a foto dele fora, a consulta é uma linha:

```sql
select storage_path from public.creatives where pessoa_id = $1;
```

Sem ele, "achar as fotos do João" é olhar arquivo por arquivo.

### 1.4 Narrativa — `narrativa_negocio` (nova)

```sql
create table public.narrativa_negocio (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null unique references public.businesses(id) on delete cascade,
  quem_somos        text,
  historia          text,
  por_que_existe    text,
  para_quem         text,
  o_que_nao_fazemos text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
```

`o_que_nao_fazemos` não é enfeite: é o campo que impede a copy de prometer
o que o negócio não entrega — causa nº 1 de reprovação na revisão do Meta.

---

## 2. A procedência de cada campo, sem inflar o schema

Três desenhos possíveis; o terceiro é o que proponho.

**(a) Uma coluna `_origem` ao lado de cada campo.** Dobra o schema: 29
colunas viram 58. Descartado.

**(b) Tabela de auditoria com uma linha por campo.** Correto e completo,
mas toda leitura de perfil vira `join` com agregação — e o pipeline lê isso
a cada rodada.

**(c) Uma coluna `jsonb` por tabela, com o mapa de procedência.**

```sql
alter table public.businesses
  add column procedencia jsonb not null default '{}'::jsonb;
```

Formato:

```json
{
  "avg_ticket_min":  { "origem": "confirmado", "em": "2026-08-17T14:02:00Z", "por": "cliente" },
  "avg_direct_cost": { "origem": "extraido",   "em": "2026-08-17T13:40:00Z", "por": "agente",
                       "entrevista_id": "...", "confianca": 0.62 },
  "monthly_budget":  { "origem": "manual",     "em": "2026-08-17T13:55:00Z", "por": "v2g:gabriel" }
}
```

Três valores de `origem`, e a ordem importa porque vira precedência:

| origem | significa | vale mais que |
|---|---|---|
| `confirmado` | o cliente viu e disse que está certo | tudo |
| `manual` | alguém da V2G anotou durante a conversa | `extraido` |
| `extraido` | o agente tirou da transcrição | — |

**Por que `manual` vale mais que `extraido`:** é exatamente o caso que você
descreveu. A pessoa anota o número à mão porque a transcrição erra em
número — "dois mil" e "duzentos" saem parecidos, e quem estava na conversa
não confunde.

**Por que uma coluna e não uma tabela:** o perfil é lido inteiro, sempre.
Um `jsonb` na mesma linha vem no mesmo `select`, sem `join`. E como a chave
é o nome da coluna, "quais campos ainda não foram confirmados" é uma
expressão só:

```sql
select b.id, k as campo
  from public.businesses b, jsonb_each(b.procedencia) as e(k, v)
 where v->>'origem' <> 'confirmado';
```

**O custo, dito honestamente:** o `jsonb` não é validado pelo banco. Nada
impede alguém gravar `{"origem": "chutado"}`. A mitigação é uma função de
escrita única, e não um `check` — a mensagem de erro de `check` sobre
`jsonb` é ilegível para quem for depurar.

### O que o `diagnosticar-orcamento` ganha

Ele hoje trava metade da fila em confiança 0.50. Com a procedência, ele
distingue:

- ticket `confirmado` → confia, não rebaixa
- ticket `extraido` com `confianca` baixa → aqui o 0.50 faz sentido
- ticket `manual` → confia quase como confirmado

Não é hipótese: das 29 execuções que estavam em revisão, os motivos são
quase todos `"<agente>: confianca 0.52"`. Se o número veio de transcrição
mal ouvida, rebaixar está certo. Se veio do cliente confirmando, é ruído.

---

## 3. A entrevista

```sql
create table public.entrevistas (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  realizada_em      timestamptz not null,
  conduzida_por     text not null,
  transcricao       text not null,
  ferramenta        text,
  anotacoes_numeros jsonb,
  criado_em         timestamptz not null default now()
);

create index entrevistas_business_id_idx
  on public.entrevistas (business_id, realizada_em desc);
```

**Append-only, e o banco garante:**

```sql
revoke update, delete on public.entrevistas from authenticated, anon;
```

Entrevista nova é linha nova, nunca `update`. É o que permite responder,
seis meses depois, de onde veio um número — e é inútil se alguém puder
reescrever a origem.

**`anotacoes_numeros` é o par da transcrição.** Os números anotados à mão
durante a conversa entram aqui, e é deles que sai a procedência `manual`.
Guardar junto da transcrição mantém a prova e o registro no mesmo lugar.

**Áudio não é guardado.** Só o texto, como definido. Vale escrever no
código e na política: além de menos dado sensível e menos storage, voz é
tratada como dado biométrico em algumas leituras da LGPD, o que traria um
regime bem mais pesado.

---

## 4. A ligação com `execucoes`, sem quebrar o backend do Gabriel

O problema: `execucoes` tem `ticket_medio`, `custo_direto_medio`,
`nome_negocio`, `cep` e mais uma dúzia de colunas que o backend **escreve
hoje**. Se passarem a vir do perfil, quem escreve quebra.

**O que eu não faria:** apagar as colunas, ou pôr uma view no lugar da
tabela. As duas quebram na primeira escrita.

**Três fases, e só a primeira depende de nós.**

**Fase 1 — agora, sem tocar no backend.**

```sql
alter table public.execucoes
  add column business_id uuid references public.businesses(id) on delete set null;
create index execucoes_business_id_idx on public.execucoes (business_id);
```

As colunas antigas continuam existindo e sendo escritas. Nada quebra.

**Fase 2 — backend, quando o Gabriel puder.** No `POST /cadastro`, se vier
`business_id`, o backend **lê** os fatos do perfil em vez de exigir do
formulário — e continua gravando nas colunas de `execucoes`, que viram
cópia do que valia naquela rodada.

Isso não é redundância ruim: a execução registra com que números ela
rodou. Se o ticket mudar depois, a execução antiga continua explicável.

**Fase 3 — depois, opcional.** As colunas de `execucoes` viram somente
leitura ou são deprecadas. Só quando ninguém mais escrever nelas.

**Sobre o `cliente_id`:** existe em `execucoes` e está nulo em tudo.
Proponho **deixá-lo morrer** — não repovoar, não apontar para `businesses`.
`business_id` é o vínculo novo; manter dois campos de dono convida metade
do código a usar um e metade o outro. Sai na fase 3, junto com o resto.

---

## 5. O que NÃO está resolvido: a política de privacidade

Conferi o texto publicado em `lp/privacidade.html`. Ele foi escrito para o
App Review do Meta e **não cobre nada do que esta tarefa cria**.

Contagem de menções no documento atual:

| termo | ocorrências |
|---|---|
| gravação · reunião · transcrição | **0** |
| áudio · voz | **0** |
| Meet | **0** |
| biometria | **0** |
| foto | 3 — todas dizendo "fotos do seu negócio, sua logo e fotos do seu Instagram" |

O que falta, item a item:

**1. A seção 2 não menciona entrevista.** Ela lista dados de cadastro,
financeiros, de oferta e fotos do negócio. Precisa de uma linha nova:
transcrição de reunião de onboarding, com data e quem conduziu.

**2. Foto de pessoa não está coberta.** O texto fala em *"fotos do seu
negócio, sua logo e fotos do seu Instagram"*. Rosto de dono e de
funcionário é outra categoria — dado pessoal de um titular que **pode não
ser o titular da conta**. Se o dono manda a foto de uma atendente, ela é a
titular, e ela não assinou nada.

**3. Falta a base legal da transcrição.** A seção 4 dá base legal por
tratamento, e transcrição não está lá. Enquadramento provável: execução de
contrato para o conteúdo do negócio, e **consentimento específico** para
imagem de pessoa — que é o que a própria seção 4 já faz para a conexão do
Meta, então há precedente de redação no documento.

**4. Falta o aviso de gravação no início da reunião.** Isso não é texto de
política, é operação: a pessoa precisa ser avisada de que a chamada está
sendo transcrita **antes** de começar, e o aceite precisa ficar registrado.
`entrevistas.conduzida_por` não substitui isso.

**5. A retenção não cobre transcrição.** A seção 7 diz "excluímos em até 30
dias após o cancelamento, exceto documento fiscal por 5 anos". Transcrição
não é documento fiscal e cai nos 30 dias — o que provavelmente está certo,
mas precisa estar escrito, porque hoje o leitor não sabe que existe
transcrição para ser apagada.

**6. `lp/exclusao-de-dados.html` precisa acompanhar.** É a página que o
Meta exige. Se ela não menciona transcrição e foto de pessoa, o pedido de
exclusão chega sem cobrir as duas.

**Ordem que eu seguiria:** atualizar a política e a página de exclusão →
escrever o texto do aviso de gravação → só então marcar a primeira
entrevista. Nenhum dos três é código, e os três são bloqueio.

---

## 6. Resumo do que muda

| Tabela | O quê |
|---|---|
| `businesses` | +4 colunas de fatos, +`procedencia jsonb` |
| `pessoas_do_negocio` | nova |
| `identidade_visual` | nova |
| `narrativa_negocio` | nova |
| `creatives` | +`pessoa_id`, +`uso` |
| `entrevistas` | nova, append-only |
| `execucoes` | +`business_id` (fase 1) |

Sete mudanças, quatro tabelas novas, nenhuma quebra no backend.
