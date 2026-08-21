/**
 * O veredito único sobre "este negócio já pode ser cadastrado no backend?".
 *
 * SEM `server-only`, de propósito: não há segredo aqui, e a tela de
 * pendências precisa dos tipos. Quem fala com a FastAPI é `lib/backend`;
 * este módulo só decide o que mandar e o que ainda falta.
 *
 * UMA FUNÇÃO, DOIS CONSUMIDORES, e é a razão de ela existir antes de haver
 * escrita: a tela lista as pendências a partir daqui, e o lote E manda o
 * payload a partir daqui. Se fossem duas regras, a tela diria "está
 * completo" numa e o envio falharia na outra — e o 422 do FastAPI chega em
 * inglês, com detalhe de Pydantic dentro, no meio de um fluxo que o cliente
 * não controla.
 *
 * As restrições abaixo são as MEDIDAS no `/openapi.json` em 19/08/2026
 * (docs/onboarding-expandido.md §0.1), não as que pareceriam razoáveis.
 * `scripts/conferir-cadastro.ts` confere isto contra o schema baixado na
 * hora — é o que impede a cópia à mão de envelhecer sem ninguém ver.
 */

/**
 * O nome que `obterOuCriarBusiness` grava ao criar a linha. `name` é
 * `not null` no banco e a pergunta do nome só existe a partir deste lote,
 * então a coluna nasce ocupada por um provisório.
 *
 * MORA AQUI e é importado por quem grava. Se cada lado tivesse a sua
 * cópia da string, mudar a de lá deixaria a daqui reconhecendo um
 * provisório que ninguém mais escreve — e todo negócio novo passaria a ter
 * "nome" para efeito de cadastro.
 *
 * O custo, dito na cara: um negócio que realmente se chame "Meu negócio"
 * é lido como sem nome. Aceitável — a alternativa é uma coluna booleana só
 * para isso, e a pergunta do nome resolve o caso na primeira tela.
 */
export const NOME_PROVISORIO = "Meu negócio";

// ---------------------------------------------------------------- entrada

/**
 * Uma resposta do bloco 2 (as contas), como fica em
 * `businesses.onboarding.contas`.
 *
 * `confirmado` é coluna própria e não "o valor existe": o §4.1 do desenho
 * manda NÃO gravar na coluna o valor que o cliente não confirmou. Sem este
 * campo, "ele viu o número e não disse nada" e "ninguém perguntou" ficariam
 * idênticos — e são pendências diferentes, que oferecem coisas diferentes.
 */
export interface RespostaDeConta {
  /** o que ele escolheu ou digitou, para a tela remontar o estado */
  echo: string;
  /** o que a conta produziu, em reais; nulo quando não houve conta */
  calculado: number | null;
  /** ele viu o valor em reais e disse que está certo */
  confirmado: boolean;
  /** ele viu a pergunta e não soube — ver §5, é diferente de não perguntado */
  naoSei?: true;
  /**
   * Quando ELE voltou e pediu a pergunta de novo ("Agora eu sei").
   *
   * ACRESCENTA, não substitui: `naoSei` e o `em` original continuam do
   * lado. São dois fatos com hora — às 19:56 ele não sabia, às 22:10 ele
   * voltou — e apagar o primeiro é reescrever medição. Ver o cabeçalho de
   * `lerConta` e docs/lote-agora-eu-sei.md §2.
   */
  reabertoEm?: string;
  em: string;
}

/** As três contas do bloco 2. A verba não está aqui: ela mora em `/verba`. */
export type ChaveDeConta = "ticket" | "custo" | "lucro";

/**
 * O recorte de `businesses` que decide o cadastro.
 *
 * Numéricos aceitam `string` porque o PostgREST serializa `numeric` como
 * string quando o valor não cabe com folga em double — o resto do código já
 * trata assim (`Number(business.monthly_budget)` em `/verba` e `/inicio`).
 */
export interface NegocioParaCadastro {
  id: string;
  name: string | null;
  description: string | null;
  avg_ticket_min: number | string | null;
  avg_ticket_max: number | string | null;
  avg_direct_cost: number | string | null;
  target_profit_per_customer: number | string | null;
  monthly_budget: number | string | null;

  // opcionais do schema que já têm coluna — vão junto quando existem
  cep?: string | null;
  site_url?: string | null;
  instagram_handle?: string | null;
  atende_somente_no_local?: boolean | null;
  differentiators?: string[] | null;
  guarantee?: string | null;
  delivery_time?: string | null;
  payment_policy?: string | null;
  business_hours?: string | null;
  availability?: string | null;

  onboarding?: unknown;
}

// ----------------------------------------------------------------- saída

export type CampoObrigatorio =
  | "nome_negocio"
  | "descricao_livre"
  | "ticket_medio"
  | "custo_direto_medio"
  | "lucro_desejado_por_cliente"
  | "orcamento_mensal_disponivel";

/**
 * Por que o campo está faltando. Muda o que a tela OFERECE, e é para isso
 * que existe — ver §5.1.
 *
 * `nao_sei` é o que não pode virar botão de "responder de novo": reoferecer
 * a mesma pergunta a quem já disse que não sabe faz a pessoa chutar um
 * número na segunda vez só para a tela parar de pedir, que é exatamente o
 * que este desenho inteiro existe para evitar.
 */
export type MotivoPendencia = "nao_perguntado" | "nao_sei" | "nao_confirmado";

export interface Pendencia {
  campo: CampoObrigatorio;
  /** o que o cliente lê. Nunca nome de coluna, nunca nome do campo da API. */
  rotulo: string;
  motivo: MotivoPendencia;
  onde: "/onboarding" | "/onboarding/contas" | "/verba";
  /**
   * Quando a pendência passou a existir, em ISO. Só existe quando dá para
   * saber: um "não sei" tem hora (está no jsonb), um campo que ninguém
   * perguntou não tem — e é ausência honesta, não zero.
   *
   * É este campo que decide o dia 5 do §5.1: passado o prazo sem
   * entrevista, o bloco do `/inicio` para de cobrar do cliente e passa a
   * admitir que a dívida é nossa. Sem a data, não há como saber se já
   * passou.
   */
  desde?: string;
}

/** O corpo do `POST /cadastro`, na forma do schema `CadastroCompleto`. */
export interface CadastroCompleto {
  nome_negocio: string;
  descricao_livre: string;
  ticket_medio: number;
  custo_direto_medio: number;
  lucro_desejado_por_cliente: number;
  orcamento_mensal_disponivel: number;

  tem_site: boolean;
  site_url?: string | null;
  tem_instagram: boolean;
  instagram_handle?: string | null;
  origem_criativo: "gerar" | "enviar";
  atende_somente_no_local: boolean;
  cep?: string | null;
  diferenciais_selecionados: string[];
  garantia_oferecida?: string | null;
  prazo_tipico_entrega?: string | null;
  politica_pagamento?: string | null;
  janela_funcionamento?: string | null;
  disponibilidade_atual?: string | null;
}

export type Cadastro =
  | { completo: true; payload: CadastroCompleto }
  | { completo: false; pendencias: Pendencia[] };

// ------------------------------------------------------------- auxiliares

/** `numeric` do PostgREST pode chegar como string. Nulo é nulo. */
function numero(bruto: number | string | null | undefined): number | null {
  if (bruto === null || bruto === undefined) return null;
  const n = typeof bruto === "number" ? bruto : Number(bruto);
  return Number.isFinite(n) ? n : null;
}

function texto(bruto: string | null | undefined): string | null {
  const t = bruto?.trim();
  return t ? t : null;
}

function lerContas(onboarding: unknown): Partial<Record<ChaveDeConta, RespostaDeConta>> {
  if (!onboarding || typeof onboarding !== "object") return {};
  const contas = (onboarding as { contas?: unknown }).contas;
  if (!contas || typeof contas !== "object") return {};
  return contas as Partial<Record<ChaveDeConta, RespostaDeConta>>;
}

/**
 * O que se sabe hoje sobre uma das três contas, resolvendo COLUNA e JSONB.
 *
 * ============================================================
 * A COLUNA GANHA. SEMPRE. Ver docs/estado-do-cliente.md §4.
 *
 * Medido em 20/08/2026 numa conta real: o jsonb dizia
 * `lucro.naoSei = true` (19/08 19:56) e a coluna
 * `target_profit_per_customer` tinha 200 com procedência `confirmado`
 * (19/08 23:31, três horas e meia depois, pela `/meu-negocio`). A
 * `/onboarding/contas` lia o jsonb e dizia "Você não soube" sobre um
 * número que o próprio cliente havia conferido — e que já estava
 * definindo quanto a IA pode gastar para trazer um cliente.
 *
 * Três razões para a coluna ganhar, em ordem de peso: é ela que fecha o
 * cadastro e vai no `POST /cadastro`; é a única com procedência (quem
 * disse, quando, e se confirmou ou corrigiu); e é a única com caminho de
 * escrita auditado (`confirmar_campo_do_cliente`, 0015/0016).
 *
 * O JSONB NÃO É LIXO: ele é o MOTIVO de a coluna estar vazia, e é o que
 * distingue "ele não soube" de "ninguém perguntou" — a distinção que
 * manda a conversa para a entrevista. Só que esse motivo só tem o que
 * decidir enquanto não há valor.
 *
 * E ele NÃO É APAGADO quando a coluna enche. Aquilo registra um fato com
 * hora: às 19:56 daquele dia, essa pessoa disse que não sabia. Apagar é
 * reescrever medição. Deixar de ler não é apagar.
 * ============================================================
 */
export type LeituraDaConta =
  /** a coluna tem valor — não importa o que o jsonb diga */
  | { estado: "respondida"; valor: number }
  /** coluna vazia, e ele viu a pergunta e não soube */
  | { estado: "nao_sei"; em?: string }
  /**
   * coluna vazia, ele não soube E DEPOIS voltou para responder.
   *
   * Estado próprio, e não um `nao_perguntado` disfarçado: "ninguém
   * perguntou" seria falso. Perguntaram, ele não soube, e ele voltou —
   * três fatos, e a leitura tem que caber os três, porque é dela que a
   * tela tira o "você tinha dito que não sabia".
   */
  | { estado: "reaberta"; naoSeiEm?: string; reabertoEm: string }
  /** coluna vazia, ele viu um número calculado e ainda não disse se bate */
  | { estado: "calculada"; calculado: number | null; em?: string }
  /** coluna vazia e ninguém perguntou */
  | { estado: "nao_perguntado" };

export function lerConta(
  coluna: number | null,
  conta: RespostaDeConta | undefined,
): LeituraDaConta {
  // A ORDEM É A REGRA. Trocar estas duas linhas de lugar reintroduz o
  // defeito inteiro.
  if (coluna !== null) return { estado: "respondida", valor: coluna };
  if (!conta) return { estado: "nao_perguntado" };
  // A ORDEM AQUI TAMBÉM É A REGRA: reaberta é lida ANTES de `nao_sei`,
  // porque a linha reaberta continua tendo `naoSei: true` — ela tem que
  // ter, senão a hora em que ele não soube some. Ver docs/lote-agora-eu-sei.md.
  if (conta.naoSei && conta.reabertoEm) {
    return { estado: "reaberta", naoSeiEm: conta.em, reabertoEm: conta.reabertoEm };
  }
  if (conta.naoSei) return { estado: "nao_sei", em: conta.em };
  if (conta.confirmado) {
    // Marcado como confirmado no jsonb e coluna vazia: a gravação da
    // coluna falhou depois de o jsonb ter sido escrito. Isso não deveria
    // acontecer — `gravarCamposDoCliente` roda ANTES — e se acontecer, a
    // pergunta volta a ficar aberta, que é o comportamento que se cura
    // sozinho na próxima resposta.
    return { estado: "nao_perguntado" };
  }
  return { estado: "calculada", calculado: conta.calculado, em: conta.em };
}

/**
 * Os três estados do §5, agora escritos EM CIMA de `lerConta` — para não
 * haver duas regras de combinação de coluna e jsonb.
 */
function motivoDaConta(
  coluna: number | null,
  conta: RespostaDeConta | undefined,
): MotivoPendencia {
  const leitura = lerConta(coluna, conta);
  switch (leitura.estado) {
    case "nao_sei":
      return "nao_sei";
    // REABERTA VIRA `nao_perguntado`, e isso é decisão. `MotivoPendencia`
    // existe para decidir O QUE A TELA OFERECE (está escrito no tipo), não
    // para descrever histórico — e o que se oferece a uma conta reaberta é
    // o mesmo que a uma nunca perguntada: a pergunta. O histórico continua
    // inteiro no jsonb e na `LeituraDaConta`.
    //
    // O efeito colateral é o certo: a pendência deixa de ser "não sei",
    // então o relógio da dívida (`DIAS_ATE_TROCAR_DE_DONO`) para de correr
    // contra nós. Enquanto ele não sabia, a dívida era nossa — a gente
    // tinha que ligar. Depois que ele clicou em "agora eu sei", cobrar de
    // nós um telefonema que ele dispensou seria a tela mentindo do outro
    // lado. Ver docs/lote-agora-eu-sei.md §3.
    case "reaberta":
      return "nao_perguntado";
    case "calculada":
      return "nao_confirmado";
    // A coluna tem valor e mesmo assim virou pendência: o valor existe e
    // não passa na regra (um custo negativo, um ticket zerado). Oferecer
    // "confirmar um valor" é o certo — há o que olhar na tela.
    case "respondida":
      return "nao_confirmado";
    default:
      return "nao_perguntado";
  }
}

/**
 * O escalar que o backend quer, a partir da faixa que a gente guarda.
 *
 * A conversão DESCARTA a largura, e a perda é real: 1.100 chega igual, vindo
 * de "1.100 exatos" ou de "entre 800 e 1.400". A largura fica nas colunas do
 * nosso lado e só é enxergada pelo `diagnosticar-orcamento` depois da Fase 2
 * do perfil-empresa.md §4. Registrado em §4.3 e não resolvido aqui.
 *
 * Faixa aberta para cima (`max` nulo, "Acima de R$ 800") devolve o `min`:
 * o ponto médio de uma faixa sem topo não existe, e inventar um teto para
 * calcular média seria escolher um número que ninguém disse.
 */
export function ticketEscalar(
  min: number | null,
  max: number | null,
): number | null {
  if (min === null) return null;
  if (max === null || max === min) return min;
  return (min + max) / 2;
}

// ------------------------------------------------------------------ regra

const ROTULOS: Record<CampoObrigatorio, string> = {
  nome_negocio: "O nome do seu negócio",
  descricao_livre: "O que você vende",
  ticket_medio: "Quanto sai uma venda",
  custo_direto_medio: "Quanto sobra de cada venda",
  lucro_desejado_por_cliente: "Quanto você quer que fique com você",
  orcamento_mensal_disponivel: "Quanto você pode investir por mês",
};

/**
 * Decide, e não corrige. Se falta alguma coisa, devolve a lista inteira do
 * que falta — não a primeira pendência. A tela mostra tudo de uma vez
 * porque quem tem duas pendências precisa saber que são duas antes de
 * começar; descobrir a segunda depois de resolver a primeira é o padrão que
 * faz as pessoas abandonarem no meio.
 */
export function montarCadastro(negocio: NegocioParaCadastro): Cadastro {
  const contas = lerContas(negocio.onboarding);
  const pendencias: Pendencia[] = [];

  const anotar = (
    campo: CampoObrigatorio,
    motivo: MotivoPendencia,
    onde: Pendencia["onde"],
    desde?: string,
  ) =>
    pendencias.push({
      campo,
      rotulo: ROTULOS[campo],
      motivo,
      onde,
      ...(desde ? { desde } : {}),
    });

  // ---- nome: a coluna nunca é nula, então o provisório é o "vazio" dela
  const nome = texto(negocio.name);
  const nomeValido = nome !== null && nome !== NOME_PROVISORIO;
  if (!nomeValido) anotar("nome_negocio", "nao_perguntado", "/onboarding");

  // ---- descrição: minLength 10 no schema. O piso do schema não é o piso
  // útil, mas é o que faz o backend recusar, e é o que a gente garante aqui.
  const descricao = texto(negocio.description);
  const descricaoValida = descricao !== null && descricao.length >= 10;
  if (!descricaoValida) anotar("descricao_livre", "nao_perguntado", "/onboarding");

  // ---- ticket: exclusiveMinimum 0
  const ticket = ticketEscalar(
    numero(negocio.avg_ticket_min),
    numero(negocio.avg_ticket_max),
  );
  const ticketValido = ticket !== null && ticket > 0;
  if (!ticketValido) {
    anotar("ticket_medio", motivoDaConta(ticket, contas.ticket), "/onboarding/contas", contas.ticket?.em);
  }

  // ---- custo direto: minimum 0 (zero é válido — revenda de consignado,
  // serviço sem insumo). Por isso `>= 0`, e não `> 0` como o ticket.
  const custo = numero(negocio.avg_direct_cost);
  const custoValido = custo !== null && custo >= 0;
  if (!custoValido) {
    anotar("custo_direto_medio", motivoDaConta(custo, contas.custo), "/onboarding/contas", contas.custo?.em);
  }

  // ---- lucro desejado: minimum 0 (zero é válido — quem quer só crescer)
  const lucro = numero(negocio.target_profit_per_customer);
  const lucroValido = lucro !== null && lucro >= 0;
  if (!lucroValido) {
    anotar("lucro_desejado_por_cliente", motivoDaConta(lucro, contas.lucro), "/onboarding/contas", contas.lucro?.em);
  }

  // ---- verba: exclusiveMinimum 0. Vive em `/verba` (D2), e não tem
  // "não sei": é decisão, não fato — ninguém descobre depois quanto quer
  // gastar.
  const verba = numero(negocio.monthly_budget);
  const verbaValida = verba !== null && verba > 0;
  if (!verbaValida) {
    anotar("orcamento_mensal_disponivel", "nao_perguntado", "/verba");
  }

  if (pendencias.length > 0) return { completo: false, pendencias };

  const site = texto(negocio.site_url);
  const insta = texto(negocio.instagram_handle);

  return {
    completo: true,
    payload: {
      nome_negocio: nome!,
      descricao_livre: descricao!,
      ticket_medio: ticket!,
      custo_direto_medio: custo!,
      lucro_desejado_por_cliente: lucro!,
      orcamento_mensal_disponivel: verba!,

      // `tem_site` e `tem_instagram` são DERIVADOS, não perguntados. Um
      // booleano "tem site?" respondido sim com a URL vazia é o par
      // incoerente que o backend não tem como resolver.
      tem_site: site !== null,
      site_url: site,
      tem_instagram: insta !== null,
      instagram_handle: insta,

      // Fixo enquanto o upload do cliente não decide isto. `gerar` é o
      // default do schema, e é o que a cadeia de publicação faz hoje.
      origem_criativo: "gerar",

      // Coluna `default true` no banco; o schema também. Nulo vira true, e
      // não false: inverter o default calado mudaria a segmentação.
      atende_somente_no_local: negocio.atende_somente_no_local ?? true,

      cep: texto(negocio.cep),
      diferenciais_selecionados: negocio.differentiators ?? [],
      garantia_oferecida: texto(negocio.guarantee),
      prazo_tipico_entrega: texto(negocio.delivery_time),
      politica_pagamento: texto(negocio.payment_policy),
      janela_funcionamento: texto(negocio.business_hours),
      disponibilidade_atual: texto(negocio.availability),

      // `cliente_id` NÃO é enviado. O perfil-empresa.md §4 decidiu deixá-lo
      // morrer: está nulo em 29/29 execuções e manter dois campos de dono
      // convida metade do código a usar um e metade o outro. O vínculo novo
      // é `execucoes.business_id`.
    },
  };
}

/** Atalho para as telas: só o veredito, sem montar payload nenhum. */
export function faltaAlgo(negocio: NegocioParaCadastro): boolean {
  return !montarCadastro(negocio).completo;
}
