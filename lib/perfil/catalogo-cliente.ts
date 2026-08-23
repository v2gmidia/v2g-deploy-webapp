// Caminho relativo, e não o alias `@/`: é o que permite este módulo ser
// importado por um script de conferência rodando em `node` puro, que não
// resolve os paths do tsconfig. Mesma escolha que `lib/agentes/revisao.ts`
// faz ao importar `./campos`.
import {
  CAMPOS,
  acharCampo,
  chaveDoCampo,
  type TabelaDePerfil,
  type TipoCampo,
} from "../agentes/campos.ts";

/**
 * Como cada campo do perfil se apresenta AO CLIENTE.
 *
 * NÃO É UM SEGUNDO CATÁLOGO. `lib/agentes/campos.ts` continua sendo a fonte
 * única do que existe — tabela, coluna, tipo, e o texto que vai para o prompt.
 * Este arquivo é uma camada de apresentação por cima dele, chaveada por
 * `chaveDoCampo()`, e responde outra pergunta: como isso se chama para quem é
 * dono da padaria, em que bloco da tela aparece, e se ele pode preencher
 * quando está vazio.
 *
 * POR QUE ARQUIVO SEPARADO, e não um segundo rótulo dentro do `campos.ts`:
 * o desenho (docs/revisao-perfil-cliente.md §3.4) pedia lá dentro. Mudou por
 * um motivo prático que valeu mais — o `campos.ts` é editado por quem mexe na
 * extração e no onboarding, e a linguagem do cliente é outro assunto, com
 * outro critério de revisão. Separado, um campo novo no catálogo quebra ESTE
 * arquivo, em vez de sumir da tela em silêncio. Que foi exatamente o que
 * aconteceu quando `target_profit_per_customer` entrou no catálogo sem
 * ninguém avisar a tela do cliente.
 *
 * A verificação está no fim do arquivo e é o motivo de ele existir.
 */

/** Os blocos da tela, na ordem em que aparecem. */
export type BlocoDoPerfil = "numeros" | "oferta" | "lugar" | "narrativa" | "links";

export const BLOCOS: readonly {
  id: BlocoDoPerfil;
  titulo: string;
  abertura?: string;
}[] = [
  {
    id: "numeros",
    titulo: "Seus números",
    // Primeiro de propósito. O desenho parte da premissa de que ele revisa
    // três campos e sai — então os três primeiros têm que ser os que custam
    // dinheiro quando estão errados.
    abertura:
      "Comece por estes. É deles que sai quanto a IA pode gastar para te trazer um cliente.",
  },
  { id: "oferta", titulo: "O que você vende" },
  { id: "lugar", titulo: "Onde e quando" },
  { id: "narrativa", titulo: "Como a gente fala de você" },
  { id: "links", titulo: "Seus links" },
];

export interface CampoDoCliente {
  chave: string;
  tabela: TabelaDePerfil;
  campo: string;
  tipo: TipoCampo;
  bloco: BlocoDoPerfil;
  /**
   * Campo de dinheiro, herdado do catálogo. **Não é o mesmo que `dificil`** —
   * e a diferença já custou um bug: `avg_ticket_min` é dinheiro e não é
   * difícil, então uma validação escrita contra `dificil` deixou passar
   * "R$ 0" de ticket. Dinheiro é propriedade do campo; difícil é decisão da
   * tela sobre quem sabe responder.
   */
  dinheiro?: true;
  /** O rótulo em português de dono de padaria. Nunca o nome da coluna. */
  rotulo: string;
  /** Uma linha de apoio, quando o rótulo sozinho não basta. */
  ajuda?: string;
  /**
   * Número que quase ninguém sabe de cabeça. Vazio, ele NÃO ganha campo
   * aberto: um chute aqui entra como `confirmado` — o nível mais alto da
   * escala — e vira orçamento de campanha. A coleta certa é o onboarding
   * expandido, com a conta que o cliente consegue responder.
   *
   * Com valor, é confirmável e corrigível como qualquer outro: aí não é
   * chute, é a conversa que produziu.
   */
  dificil?: true;
  /**
   * Onde a pergunta desse número existe numa forma que o cliente consegue
   * responder. **Obrigatório em todo campo `dificil`** — ver a verificação
   * logo abaixo de `APRESENTACAO`.
   *
   * Existe porque `dificil: true` tirava o `input` da tela e não punha nada
   * no lugar: o campo aparecia no bloco "o que a gente ainda não sabe" e
   * acabava ali. Para dois dos três, isso era beco — nenhuma superfície do
   * produto reoferecia a pergunta, e o cliente nunca fechava o cadastro
   * (docs/buraco-numeros-dificeis.md).
   *
   * O destino mora AQUI, e não num `if` sobre nome de campo dentro do
   * `page.tsx`: foi assim que quatro telas passaram a dizer quatro coisas
   * diferentes sobre a mesma conta.
   */
  ondeResponder?: { href: string; rotulo: string };
  /**
   * O ticket é UMA pergunta para o cliente e DUAS colunas no banco. O `min`
   * carrega o par; o `max` é marcado como oculto e renderizado dentro dele.
   */
  parCom?: string;
  oculto?: true;
  /** Opções fechadas. Booleano e escolha não têm "corrigir", têm resposta. */
  opcoes?: readonly { valor: string; rotulo: string }[];
  /**
   * A escolha vem da LISTA VIVA do backend, não de `opcoes`.
   *
   * Só `businesses.niche` tem isto hoje, e a flag existe aqui — no
   * catálogo — em vez de um `if (campo.chave === "businesses.niche")`
   * dentro do `Campo.tsx`, pelo mesmo motivo do `ondeResponder`: foi
   * assim que quatro telas passaram a dizer quatro coisas diferentes
   * sobre a mesma conta.
   *
   * Quem carrega a lista é a `page.tsx`, e quem confere a escolha no
   * servidor é `conferirEscolhaDeNicho` — a MESMA função do onboarding.
   * Enquanto eram duas regras, esta tela gravava texto livre com
   * procedência `confirmado` e o onboarding restringia a dez nichos:
   * porta dos fundos para a validação da tela vizinha
   * (`docs/buraco-meu-negocio-nicho-livre.md`).
   */
  seletorDeNicho?: true;
}

/**
 * Os campos que a tela mostra e que NÃO vêm do catálogo de extração.
 *
 * `radius_km` é o único hoje. Ele não sai de conversa nenhuma — é uma escolha
 * que a pessoa fez no onboarding — mas precisa de casa depois que o
 * `FormNegocio` da `/conta` foi dissolvido, e a lista branca da 0015 já o
 * aceita. Declarado aqui com tipo próprio porque não há entrada no `campos.ts`
 * de onde herdá-lo.
 */
const EXTRAS: readonly CampoDoCliente[] = [
  {
    chave: "businesses.radius_km",
    tabela: "businesses",
    campo: "radius_km",
    tipo: "numero",
    bloco: "lugar",
    rotulo: "Até onde seus anúncios aparecem",
    ajuda: "A IA só mostra seus anúncios para quem está dentro dessa distância.",
    opcoes: [
      { valor: "5", rotulo: "5 km — só aqui perto" },
      { valor: "15", rotulo: "15 km" },
      { valor: "25", rotulo: "25 km — a cidade toda" },
      { valor: "60", rotulo: "60 km — cidade e região" },
    ],
  },
];

/** O que a apresentação acrescenta ao que o catálogo já sabe. */
type Apresentacao = Omit<CampoDoCliente, "chave" | "tabela" | "campo" | "tipo">;

/**
 * A chave de um campo, no nível do TIPO: `"businesses.city"` e não `string`.
 *
 * O condicional (`C extends … ? … : never`) não é enfeite: sem ele o tipo
 * lê `C["tabela"]` e `C["campo"]` como duas uniões independentes e devolve o
 * PRODUTO das duas — 78 combinações, incluindo `businesses.quem_somos`, que
 * não existe. Tipo condicional sobre parâmetro nu distribui membro a membro,
 * que é o pareamento certo: 26 chaves, as que existem.
 */
type ChaveDe<C> = C extends { tabela: string; campo: string }
  ? `${C["tabela"]}.${C["campo"]}`
  : never;
export type ChaveDoCatalogo = ChaveDe<(typeof CAMPOS)[number]>;

/**
 * A apresentação de cada campo do catálogo. A ordem aqui é a ordem da tela
 * dentro de cada bloco.
 *
 * `Record<ChaveDoCatalogo, …>` é a verificação de exaustividade, e ela vale
 * NO EDITOR: campo novo em `campos.ts` sem entrada aqui é erro de compilação
 * antes de qualquer build, e chave que não existe no catálogo é recusada como
 * propriedade em excesso. Só funciona porque o `CAMPOS` preserva os literais
 * com `as const satisfies` — ver o comentário lá.
 */
const APRESENTACAO: Record<ChaveDoCatalogo, Apresentacao> = {
  // ---------- numeros ----------
  "businesses.avg_ticket_min": {
    bloco: "numeros",
    rotulo: "Quanto uma venda costuma dar",
    ajuda: "O que entra, em média, quando alguém compra. Se varia, dá a faixa.",
    parCom: "businesses.avg_ticket_max",
  },
  "businesses.avg_ticket_max": {
    bloco: "numeros",
    rotulo: "Quanto uma venda costuma dar (até)",
    oculto: true,
  },
  "businesses.avg_direct_cost": {
    bloco: "numeros",
    rotulo: "Quanto sai do seu bolso em cada venda",
    ajuda:
      "O que você gasta para entregar UMA venda: material, produto, comissão. Não é a conta de luz.",
    dificil: true,
    ondeResponder: { href: "/onboarding/contas", rotulo: "Responder pela conta (a 2 de 3)" },
  },
  "businesses.target_profit_per_customer": {
    bloco: "numeros",
    rotulo: "Quanto você quer que sobre em cada cliente",
    ajuda: "Depois de pagar o que gastou para entregar.",
    dificil: true,
    ondeResponder: { href: "/onboarding/contas", rotulo: "Responder pela conta (a 3 de 3)" },
  },
  "businesses.monthly_budget": {
    bloco: "numeros",
    rotulo: "Quanto você quer investir por mês",
    // A copy que estava no FormNegocio da /conta e que não podia sumir com
    // ele: o Facebook gasta até 25% a mais num dia bom e compensa nos
    // seguintes. A promessa antiga era "nunca passa disso", que é falsa, e o
    // cliente descobriria sozinho olhando o extrato — o pior lugar.
    ajuda:
      "É esse valor que você gasta no mês. O Facebook pode gastar um pouco mais num dia em que estiver aparecendo gente boa, e menos nos seguintes para compensar. No fim do mês fecha no seu limite.",
    dificil: true,
    // A /verba é o contra-exemplo que já funcionava: número difícil com tela
    // própria e a explicação junto. Foi ela que mostrou a forma do conserto
    // dos outros dois (docs/buraco-numeros-dificeis.md §6).
    ondeResponder: { href: "/verba", rotulo: "Escolher quanto investir" },
  },

  // ---------- oferta ----------
  "businesses.name": {
    bloco: "oferta",
    rotulo: "O nome do seu negócio",
    ajuda: "Do jeito que estaria numa placa.",
  },
  "businesses.niche": {
    bloco: "oferta",
    rotulo: "O que é o seu negócio",
    // O `ajuda` MUDOU JUNTO com o seletor, em 23/08, e não é cosmética.
    //
    // Ele dizia "Padaria, salão, clínica — do jeito que você mesmo
    // chama", e o exemplo era `padaria`: justamente o termo que não tem
    // nicho em `knowledge/`, que a busca foi construída para não achar, e
    // que tem dois testes no backend garantindo que não case com nada.
    // Uma tela recusava a palavra e a outra a oferecia como modelo de
    // resposta — duas instruções opostas sobre a mesma coluna.
    ajuda: "Escolha o seu na lista. É daqui que a IA tira o jeito de falar do seu negócio.",
    seletorDeNicho: true,
  },
  "businesses.description": {
    // NÃO chamar de "O que você vende": é o título do bloco, e rótulo igual
    // ao título logo acima faz a pessoa ler duas vezes achando que pulou
    // alguma coisa. Mesmo defeito que derrubou a faixa da /alertas — dois
    // elementos com o mesmo assunto —, aqui em escala menor.
    bloco: "oferta",
    rotulo: "O que você faz, em uma frase",
  },
  "businesses.guarantee": {
    bloco: "oferta",
    rotulo: "O que você garante",
  },
  "businesses.differentiators": {
    bloco: "oferta",
    rotulo: "Por que escolhem você",
    ajuda: "Uma coisa por linha.",
  },
  "businesses.payment_policy": {
    bloco: "oferta",
    rotulo: "Como o cliente paga",
  },
  "businesses.delivery_time": {
    bloco: "oferta",
    rotulo: "Quanto tempo leva",
  },

  // ---------- lugar ----------
  "businesses.city": {
    bloco: "lugar",
    rotulo: "Cidade onde você atende",
  },
  "businesses.cep": {
    bloco: "lugar",
    rotulo: "Seu CEP",
  },
  "businesses.atende_somente_no_local": {
    bloco: "lugar",
    rotulo: "O cliente precisa ir até você?",
    // Booleano não tem "tá certo / não é isso": tem a resposta. Dois passos
    // para uma escolha binária é um passo a mais.
    opcoes: [
      { valor: "true", rotulo: "Sim, só aqui" },
      { valor: "false", rotulo: "Não, eu também vou até ele" },
    ],
  },
  "businesses.business_hours": {
    bloco: "lugar",
    rotulo: "Quando você abre",
  },
  "businesses.availability": {
    bloco: "lugar",
    rotulo: "Quanto você dá conta hoje",
    ajuda: "Se a agenda está cheia, se sobra espaço, quantos por dia você aguenta.",
  },

  // ---------- narrativa ----------
  "narrativa_negocio.quem_somos": {
    bloco: "narrativa",
    rotulo: "Como você se apresenta",
  },
  "narrativa_negocio.historia": {
    bloco: "narrativa",
    rotulo: "Como começou",
  },
  "narrativa_negocio.por_que_existe": {
    bloco: "narrativa",
    rotulo: "Por que você faz isso",
  },
  "narrativa_negocio.para_quem": {
    bloco: "narrativa",
    rotulo: "Quem é o seu cliente",
  },
  "narrativa_negocio.o_que_nao_fazemos": {
    bloco: "narrativa",
    rotulo: "O que você não faz",
    ajuda:
      "Vale muito: é o que impede o anúncio de prometer o que você não entrega.",
  },
  "identidade_visual.tom_de_voz": {
    bloco: "narrativa",
    rotulo: "Como você quer soar",
    ajuda: "Mais informal, mais técnico, mais acolhedor.",
  },
  "identidade_visual.observacoes": {
    bloco: "narrativa",
    rotulo: "Outras coisas sobre a marca",
    ajuda: "Cores que você usa, referências, o que você não quer ver no anúncio.",
  },

  // ---------- links ----------
  "businesses.site_url": {
    bloco: "links",
    rotulo: "Seu site",
  },
  "businesses.instagram_handle": {
    bloco: "links",
    rotulo: "Seu Instagram",
    ajuda: "Só o @, sem o endereço inteiro.",
  },
};

// ============================================================
// A VERIFICAÇÃO — é por ela que este arquivo existe
// ============================================================

/**
 * Todo campo do catálogo precisa de apresentação. Sem isto, um campo novo em
 * `campos.ts` simplesmente não apareceria na tela do cliente — sem erro, sem
 * aviso, sem nada. Foi assim que `target_profit_per_customer` ficou de fora.
 *
 * QUE TIPO DE VERIFICAÇÃO ESTA É, dito com precisão: ela roda na importação
 * do módulo, então quebra o `next build` (a tela importa este arquivo) e
 * quebra em desenvolvimento na primeira renderização. NÃO é erro de tipo.
 *
 * Não é por escolha: `CAMPOS` está anotado como `readonly Campo[]` no
 * `campos.ts`, e essa anotação alarga as chaves para `string` antes que o
 * `as const` no fim do array chegue a valer. Sem chave literal, o TypeScript
 * não tem o que exigir. Trocar a anotação por `satisfies readonly Campo[]`
 * preservaria os literais e transformaria isto num erro de compilação de
 * verdade — é uma linha, no arquivo da outra frente, e está proposta e não
 * feita.
 */
const SEM_APRESENTACAO = CAMPOS.map(chaveDoCampo).filter((c) => !(c in APRESENTACAO));

if (SEM_APRESENTACAO.length > 0) {
  throw new Error(
    "lib/perfil/catalogo-cliente.ts está desatualizado: " +
      SEM_APRESENTACAO.join(", ") +
      " entrou(entraram) em lib/agentes/campos.ts sem rótulo de cliente. " +
      "Acrescente em APRESENTACAO — e confira se o campo também precisa entrar " +
      "na lista branca de confirmar_campo_do_cliente(), por migration.",
  );
}

/** O contrário: apresentação para campo que não existe mais no catálogo. */
const CHAVES_DO_CATALOGO = new Set(CAMPOS.map(chaveDoCampo));
const SOBRANDO = Object.keys(APRESENTACAO).filter((c) => !CHAVES_DO_CATALOGO.has(c));

if (SOBRANDO.length > 0) {
  throw new Error(
    "lib/perfil/catalogo-cliente.ts tem apresentação órfã: " +
      SOBRANDO.join(", ") +
      " não existe(m) mais em lib/agentes/campos.ts.",
  );
}

/**
 * TODO CAMPO DIFÍCIL PRECISA DIZER ONDE ELE É RESPONDÍVEL.
 *
 * `dificil: true` tira o `input` da tela — com razão, porque um chute ali
 * entraria como `confirmado`, o nível mais alto da escala, e viraria
 * orçamento de campanha. Mas tirar a entrada e não pôr nada no lugar foi o
 * que produziu o beco: dois dos três números difíceis não tinham nenhuma
 * superfície que reoferecesse a pergunta, e o cliente que respondeu "não
 * sei" nunca fechava o cadastro (docs/buraco-numeros-dificeis.md).
 *
 * A verificação existe porque o buraco NÃO veio de uma decisão errada: veio
 * de duas decisões certas que se referenciavam, e o caso caiu no vão. Um
 * lembrete em documento não teria pego o quarto campo difícil daqui a três
 * meses; isto pega, na importação, antes do build.
 */
const DIFICIL_SEM_PORTA = Object.entries(APRESENTACAO)
  .filter(([, ap]) => ap.dificil && !ap.ondeResponder)
  .map(([chave]) => chave);

if (DIFICIL_SEM_PORTA.length > 0) {
  throw new Error(
    "lib/perfil/catalogo-cliente.ts: " +
      DIFICIL_SEM_PORTA.join(", ") +
      " está(ão) marcado(s) como `dificil` sem `ondeResponder`. Campo difícil " +
      "não ganha entrada na /meu-negocio, então sem um destino ele vira beco: " +
      "aparece em “o que a gente ainda não sabe” e acaba ali. Aponte para a " +
      "tela que faz a pergunta numa forma que o cliente consegue responder.",
  );
}

/**
 * `seletorDeNicho` E `opcoes` NO MESMO CAMPO É CONTRADIÇÃO.
 *
 * São dois editores para a mesma linha: um lê a lista viva do backend, o
 * outro desenha os botões de `opcoes`. O `Campo.tsx` escolhe um, e o
 * perdedor vira lista escrita à mão que ninguém vê e ninguém mantém — a
 * lista paralela que o lote do seletor existiu para apagar, agora
 * invisível.
 */
const SELETOR_COM_OPCOES = Object.entries(APRESENTACAO)
  .filter(([, ap]) => ap.seletorDeNicho && ap.opcoes)
  .map(([chave]) => chave);

if (SELETOR_COM_OPCOES.length > 0) {
  throw new Error(
    "lib/perfil/catalogo-cliente.ts: " +
      SELETOR_COM_OPCOES.join(", ") +
      " tem `seletorDeNicho` E `opcoes`. São dois editores para a mesma linha: " +
      "a lista viva do backend e uma lista escrita à mão. Escolha um.",
  );
}

// ============================================================
// O que a tela consome
// ============================================================

/**
 * Quem manda na ordem é o `APRESENTACAO`, e não o `CAMPOS`.
 *
 * A ordem do catálogo é a ordem em que a extração pensa; a daqui é a ordem em
 * que a tela pergunta, com os números na frente. São duas ordens diferentes
 * porque são dois assuntos diferentes, e amarrar uma na outra faria a tela do
 * cliente se reorganizar sozinha quando alguém mexesse no prompt.
 *
 * O `as` no `Object.entries` é o único do arquivo: `entries` devolve
 * `[string, …][]` por definição da biblioteca, mesmo quando o objeto tem
 * chaves literais. Ele não afrouxa nada — quem garante que as chaves são
 * exatamente as do catálogo é o `Record<ChaveDoCatalogo, …>` na declaração
 * acima, e o `acharCampo` abaixo recusa qualquer uma que não exista.
 */
const DO_CATALOGO: CampoDoCliente[] = (
  Object.entries(APRESENTACAO) as [ChaveDoCatalogo, Apresentacao][]
).map(([chave, ap]) => {
  const base = acharCampo(chave);
  if (!base) {
    throw new Error(
      `lib/perfil/catalogo-cliente.ts tem apresentação órfã: ${chave} não existe em lib/agentes/campos.ts.`,
    );
  }
  return {
    chave,
    tabela: base.tabela,
    campo: base.campo,
    tipo: base.tipo,
    ...(base.dinheiro ? { dinheiro: base.dinheiro } : {}),
    ...ap,
  };
});

export const CAMPOS_DO_CLIENTE: readonly CampoDoCliente[] = [...DO_CATALOGO, ...EXTRAS];

/**
 * Os campos que o cliente pode ESVAZIAR, e não só corrigir.
 *
 * A lista é a da `esvaziar_campos_do_cliente()` (migration 0017), copiada —
 * e a cópia é declaradamente frouxa: **quem manda é o banco.** Esta lista só
 * decide se a tela desenha o botão. Se as duas divergirem, o resultado é um
 * botão que dá erro com mensagem clara, não uma escrita errada em silêncio.
 *
 * DUAS AUSÊNCIAS COM MOTIVO:
 *
 * - **`businesses.name`** — a coluna é `not null`. A 0017 o deixa de fora
 *   para a recusa vir como frase e não como erro de constraint.
 * - **`narrativa_negocio.*` e `identidade_visual.*`** — a 0017 só escreve em
 *   `businesses`; ela nasceu para o formulário da `/conta`, que só mexia
 *   nessa tabela. Então narrativa e identidade se corrigem e não se
 *   esvaziam. É assimetria real, herdada, e está registrada em
 *   docs/revisao-perfil-cliente.md em vez de resolvida por uma migration
 *   que este lote não pediu.
 */
export const PODE_ESVAZIAR: ReadonlySet<string> = new Set([
  "businesses.niche",
  "businesses.city",
  "businesses.radius_km",
  "businesses.cep",
  "businesses.description",
  "businesses.avg_ticket_min",
  "businesses.avg_ticket_max",
  "businesses.avg_direct_cost",
  "businesses.target_profit_per_customer",
  "businesses.monthly_budget",
  "businesses.business_hours",
  "businesses.availability",
  "businesses.delivery_time",
  "businesses.payment_policy",
  "businesses.guarantee",
  "businesses.differentiators",
  "businesses.site_url",
  "businesses.instagram_handle",
]);

const POR_CHAVE = new Map(CAMPOS_DO_CLIENTE.map((c) => [c.chave, c]));

export function acharCampoDoCliente(chave: string): CampoDoCliente | undefined {
  return POR_CHAVE.get(chave);
}

/** Os campos de um bloco, sem os ocultos, na ordem em que foram declarados. */
export function camposDoBloco(bloco: BlocoDoPerfil): CampoDoCliente[] {
  return CAMPOS_DO_CLIENTE.filter((c) => c.bloco === bloco && !c.oculto);
}
