# Contrato do front — resposta ao briefing

Resposta às quatro perguntas do `prompt-claude-code-front-v2g.md`, na
ordem pedida. Nenhum código foi escrito ainda, como o briefing manda.

**Antes das quatro, uma coisa precisa ser dita:** o briefing descreve um
sistema que não é o que está neste repositório. Não é detalhe de
nomenclatura — são dois backends, dois esquemas de banco e duas paletas
diferentes. A seção 0 lista os choques, porque metade das respostas
abaixo depende de qual dos dois vale.

---

## 0. O que o briefing diz × o que existe hoje

| Tema | Briefing | Repositório hoje |
|---|---|---|
| Backend | FastAPI, header `X-V2G-Token`, **inalcançável** | Supabase direto, com RLS. Alcançável e em produção. |
| Auth de usuário | "não existe, nem login nem sessão" | **Existe.** Supabase Auth, `proxy.ts`, 3 grupos de rota, recuperação de senha. |
| Tabela central | `execucoes` (1 linha por onboarding) | `businesses` + `campaigns` + `creatives` + `metrics_daily` |
| Estados | 5 valores em `execucoes.status` | `campaigns.publish_state` (4) + `creatives.status` (5), migration 0008 |
| Leitura da Meta | "nenhuma, sem `/insights`" | OAuth vivo, listagem de páginas, `/minimum_budgets`, `/search` geo, cadeia de publicação até `adsets` testada na conta real |
| Cor de marca | `--brand #0B40DA` | `--cobalt #0743DC` — o `#0B40DA` foi **substituído** pelos mockups aprovados |
| Fundo | `--bg #ECF5F2` | `--offwhite #F1F6F7` |
| Lima | `--reward #EAFF64` | `--lime #E8FC65` |
| Tipografia | Inter | Archivo (`next/font`), decisão registrada em `arquitetura.md` §6 |
| Tema | "light é o padrão" | Seletor claro / escuro / do aparelho, entregue e no ar |
| Mínimo de fonte | "nada abaixo de 14px" | 27 tamanhos em uso, vários entre 9,5 e 13,5 |

**Duas coisas do briefing estão certas e já foram aprendidas na marra:**

A regra de nomear token pelo papel cita, sem saber, o bug que a gente
consertou dois lotes atrás: `--navy` fazia fundo escuro **e** cor de
texto, e quebrou no tema escuro. Foi separado em `--plate`/`--plate-ink`.
A lição está certa; o que falta é aplicá-la ao resto dos tokens.

A regra "não construa botão publicar" também bate: a cadeia cria tudo
`PAUSED` e não existe uma linha que ative (`lib/meta/publicar.ts`).

---

## 1. Estrutura de pastas proposta

Partindo do que existe, não do zero. O que é **novo** está marcado.

```
app/
  (marketing)/          "/" pública — landing page
  (public)/             entrar, recuperar, redefinir
  (fluxo)/              uma tarefa por vez, sem sidebar
    onboarding/ expectativas/ conectar/ processando/
    verba/ aprovar/ reprovado/ sem-instagram/ whatsapp-business/
  (protected)/          app com sidebar
    inicio/ vendas/ anuncios/ alertas/ conta/
    execucao/[id]/      NOVO — acompanhamento com polling
  api/
    execucoes/          NOVO — Route Handlers que falam com a FastAPI

lib/
  dados/                NOVO — a camada de acesso única
    tipos.ts              tipos do contrato, uma fonte só
    porta.ts              a interface que as telas enxergam
    mock.ts               implementação em memória
    real.ts               implementação HTTP
    index.ts              escolhe pela env, e é O ÚNICO lugar que escolhe
  meta/                 já existe — OAuth, publicação, orçamento, geo
  supabase/             já existe — server, browser, admin
```

**Por que `api/` e não `fetch` direto na Server Action:** o `X-V2G-Token`
é segredo de máquina. Server Action também roda no servidor e serviria,
mas Route Handler dá um lugar único para registrar erro, medir tempo e
tratar o timeout de 600s sem espalhar isso por cada ação.

**Por que a camada nova se chama `dados/` e não `api/`:** para ser óbvio,
no import, que ninguém deve chamar HTTP fora dali. Um componente que
importa de `lib/dados` está certo; um que importa `fetch` está errado, e
isso dá para verificar com um grep no CI.

---

## 2. Tipos do contrato

Rascunho, não implementado. Três decisões de modelagem embutidas:

```ts
// As duas dimensões que o briefing insiste em separar — e com razão.
export type StatusExecucao =
  | "cadastro_completo"
  | "pipeline_texto_rodando"
  | "aguardando_fotos"
  | "gerando_criativo"
  | "estrutura_pronta"
  | "gerado";            // legado, terminal, 3 linhas antigas

export interface Execucao {
  id: string;
  clienteId: string;
  status: StatusExecucao;

  // NÃO é status. É ortogonal: qualquer estado pode precisar de revisão.
  requerRevisao: boolean;
  motivosRevisao: unknown[];
  confiancaMinima: number | null;

  nomeNegocio: string;
  nicho: string | null;
  origemCriativo: "gerar" | "enviar";

  // `copy` no banco, `copy_anuncios` no backend (colisão com
  // BaseModel.copy do Pydantic). Aqui vira `copyAnuncios` e o mapeamento
  // acontece UMA vez, em `real.ts`.
  copyAnuncios: unknown | null;

  complianceVisual: ComplianceVisual;
  aprovacoes: Aprovacao[];
  criadoEm: string;
}

// TRÊS estados, não dois. Nulo não é "aprovado": criativo enviado pelo
// cliente não passa pela auditoria de propósito, e a ausência é o
// registro. Modelar como boolean faria a tela mentir.
export type ComplianceVisual =
  | { situacao: "aprovado"; detalhe: unknown }
  | { situacao: "reprovado"; detalhe: unknown }
  | { situacao: "nao_auditado" };

export type EtapaAprovacao =
  | "texto" | "criativo_piloto" | "criativo" | "override_compliance";

export interface Aprovacao {
  etapa: EtapaAprovacao;
  aprovado: boolean;
  justificativa: string | null;
  em: string;
}

// A lista é APPEND-ONLY. O tipo não consegue impor isso sozinho, então a
// porta (§3) não expõe nenhum método que substitua a lista — só `aprovar`,
// que acrescenta.

export interface Criativo {
  id: string;
  execucaoId: string;
  tipo: "foto" | "logo" | "criativo";
  origem: "gerado" | "enviado" | null;   // nulo em linhas antigas
  nomeArquivo: string;
  formato: "feed" | "stories" | null;
  eVideo: boolean;
  /** URL ASSINADA, 12h. Nunca montar caminho de Storage na mão. */
  url: string;
  urlExpiraEm: string;
}

export interface PreRequisitosCampanha {
  ok: boolean;
  bloqueios: string[];
  avisos: string[];
  temWhatsapp: boolean;
}
```

---

## 3. A camada de acesso

```ts
// lib/dados/porta.ts — o que as telas enxergam. Nada de URL aqui.
export interface PortaDeDados {
  obterExecucao(id: string): Promise<Execucao | null>;
  listarEmRevisao(): Promise<Execucao[]>;
  criarCadastro(dados: CadastroCompleto): Promise<RespostaCadastro>;

  aprovar(id: string, etapa: EtapaAprovacao, aprovado: boolean,
          justificativa?: string): Promise<Execucao>;

  avancar(id: string, para: TransicaoPermitida): Promise<Execucao>;

  listarCriativos(id: string): Promise<Criativo[]>;
  enviarFotos(id: string, fotos: File[], logo?: File): Promise<ResultadoUpload>;
  enviarCriativos(id: string, arquivos: File[]): Promise<ResultadoUpload>;

  preRequisitosCampanha(): Promise<PreRequisitosCampanha>;
  criarCampanha(id: string): Promise<ResultadoCampanha>;
}
```

Duas escolhas que merecem defesa:

**`avancar(id, para)` em vez de cinco métodos.** O briefing lista cinco
rotas de transição. Cinco métodos deixariam a máquina de estados
espalhada por quem chama; um método com o destino tipado deixa a tabela
de transições válidas num lugar só — e é lá que o **409** vira mensagem
em português em vez de erro cru.

**`aprovar` recebe `justificativa` opcional no tipo, obrigatória na
implementação quando `etapa === "override_compliance"`.** O ideal seria
um tipo-união que torne isso impossível de errar. Vale o custo? É uma das
decisões da §4.

```ts
// lib/dados/index.ts — O ÚNICO lugar que decide qual implementação vale.
export const dados: PortaDeDados =
  process.env.V2G_FONTE_DE_DADOS === "real" ? portaReal : portaMock;
```

Trocar quando o backend subir = mudar uma variável de ambiente.

**Polling.** Fica num hook (`useExecucao(id)`) que chama a porta a cada
3s e para sozinho quando o status vira terminal. As telas recebem
`{ execucao, carregando }` e não sabem se aquilo veio de polling, de
Realtime ou de mock — que é o ponto: trocar por Supabase Realtime depois
não toca em componente nenhum.

---

## 4. As decisões que eu preciso que você tome

Estão em ordem de consequência. As três primeiras travam o resto.

### D1 — Qual backend manda?

O briefing diz que o backend é FastAPI e que **não há auth de usuário**.
Mas este repositório tem Supabase Auth funcionando, com RLS, recuperação
de senha e três camadas de proteção de rota. E fala com a Meta direto.

Três caminhos:

**(a) FastAPI vira a fonte de tudo.** O webapp deixa de falar com o
Supabase e passa a ser cliente da API. Custo: joga fora auth, RLS e a
integração Meta que já foi testada contra a conta real. Não recomendo.

**(b) Supabase continua a fonte do cliente; FastAPI só faz IA.**
(recomendado) O front lê estado e dados do cliente pelo Supabase, como
hoje. A FastAPI entra como **executora de pipeline** — gerar copy, gerar
criativo, checar compliance. É o que aqueles endpoints de 600s fazem de
fato. A camada de dados da §3 continua valendo, só que `real.ts` fala com
os dois.

**(c) Híbrido explícito.** Igual ao (b), mas a FastAPI também grava em
`execucoes`, e o front lê essa tabela pelo Supabase. Exige decidir quem é
dono de cada escrita — dá para fazer, mas precisa de regra escrita.

### D2 — `execucoes` ou `businesses` + `campaigns`?

Os dois esquemas descrevem o mesmo domínio. `execucoes` tem
`nome_negocio`, `ticket_medio`, `orcamento_mensal_disponivel`; `businesses`
tem `name`, `avg_ticket_min/max`, `monthly_budget`. `criativos` e
`creatives` idem.

Isso não pode ficar em pé nos dois. Ou `execucoes` é a mesa da pipeline e
`businesses` a do produto (e alguém sincroniza), ou um dos dois morre.
**Preciso saber qual, antes de escrever um tipo sequer** — os tipos da §2
foram escritos contra `execucoes` só porque o briefing pediu.

### D3 — A paleta do briefing está desatualizada. Qual vale?

O briefing traz `--brand #0B40DA`. O `globals.css` deste repositório diz,
com todas as letras, que esse valor **foi substituído** pelo `#0743DC` dos
mockups aprovados. O mesmo vale para o fundo e o lima, que diferem por
pouco — e "por pouco" é pior que "por muito", porque ninguém percebe até
ver as duas telas lado a lado.

Também: Inter × Archivo. E "light é o padrão" × o seletor de tema que
acabou de entrar.

Meu palpite é que o briefing foi escrito antes dos mockups. **Confirma?**
Se sim, ignoro a paleta dele e mantenho a atual.

### D4 — "Nada abaixo de 14px" derruba a escala medida

O briefing proíbe fonte menor que 14px. O `padrao-visual.md` mediu 27
tamanhos em uso e propôs 7 degraus, sendo o menor **11px** — usado em
eyebrow, pílula e rótulo de delta.

Subir tudo isso para 14px não é ajuste de token: muda a proporção de toda
tela que tem sobrescrito, e o eyebrow em caixa alta a 14px compete com o
título. Ou o piso vira 12px, ou os elementos de sobrescrito mudam de
forma. **Qual dos dois?**

### D5 — Renomear todos os tokens pelo papel?

O briefing está certo, e a gente tem a cicatriz para provar. Mas a
renomeação alcança ~1.800 linhas de CSS e toda tela ao mesmo tempo.
Proponho fazer **depois** que as telas restantes estiverem alinhadas, e
junto com a escala tipográfica — dois refatores globais numa passagem só,
com uma comparação antes/depois confiável. **Fecha assim?**

### D6 — `justificativa` obrigatória: tipo ou validação?

Tornar impossível de errar exige união discriminada, e aí quem chama
precisa de `if` para estreitar o tipo. Validação em runtime é mais simples
de ler e falha em teste, não em compilação. **Prefere qual?** Meu voto é
no tipo: o override de compliance é justamente o lugar onde alguém vai ter
pressa.

---

## O que eu faço assim que D1, D2 e D3 estiverem respondidas

Na ordem do briefing, em lotes pequenos, parando entre eles:

1. `lib/dados/` com os tipos e as duas implementações
2. tokens e componentes base
3. `/execucao/[id]` com polling — a tela que prova a arquitetura
4. aprovação de criativo
5. wizard de cadastro, com as quatro validações obrigatórias
