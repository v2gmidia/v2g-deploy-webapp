/**
 * VEICULAÇÃO — a única fonte de "o anúncio está, ou esteve, no ar".
 *
 * ============================================================
 * POR QUE ESTE ARQUIVO EXISTE, E O QUE ELE SUBSTITUI.
 *
 * Medido em 11/09/2026, antes de escrever uma linha: **seis telas
 * afirmavam alguma coisa sobre veiculação, e cada uma lia uma fonte
 * diferente.**
 *
 *   /vendas     `estado !== "sem-campanha"`, que é inferência a partir do
 *               `status` do pipeline — e o comentário de
 *               `lib/resultado/do-negocio.ts` já dizia, por extenso, que
 *               essa inferência "NÃO consegue dizer se a campanha está NO
 *               AR ou pausada"
 *   /alertas    `count(campaigns where published_at not null)` — tabela
 *               com ZERO linhas no total
 *   /inicio     `proximo?.id === "numeros"`, ou seja, a posição da cadeia
 *   frases.ts   `campaigns.published_at`, a mesma tabela vazia, MAIS uma
 *               regra própria: gasto medido fecha a etapa `no_ar`
 *   /reprovado  `campaigns.published_at` de novo
 *   /anuncios   o rótulo "Ainda não foi ao ar" saindo do mesmo `status`
 *
 * Seis fontes para um fato só. E o fato tinha dono desde sempre: é o
 * backend quem fala com a Meta.
 *
 * A MEDIÇÃO QUE DECIDIU O DESENHO — conta da V2G (`a85c37a9`), ao vivo,
 * 11/09/2026:
 *
 *   GET /negocios/a85c37a9-…/execucao
 *   → status              "cadastro_completo"
 *     status_na_plataforma "PAUSED"
 *     publicada_em        null
 *     veiculacao          "ja_foi_ao_ar"
 *     andamento           "Seu anúncio já rodou e está pausado no
 *                          momento. Seu gestor pode retomar quando fizer
 *                          sentido."
 *
 * Ou seja: **o anúncio rodou e está parado.** E as telas diziam, no
 * presente, "Seu anúncio está no ar" (`/vendas`, duas vezes) e "Sua
 * campanha está rodando e nada travou" (`/alertas`) — as duas falsas — ao
 * lado de `/alertas` afirmando o contrário na mesma conta, porque lia
 * `campaigns`, que está vazia. Duas telas do mesmo app, a mesma conta,
 * respostas opostas.
 * ============================================================
 *
 * ============================================================
 * A REGRA DESTE MÓDULO, E ELA É CURTA.
 *
 * Nenhuma tela decide sobre veiculação. Nenhuma tela escreve frase de
 * veiculação. As duas coisas saem daqui, e `pnpm conferir:veiculacao`
 * reprova o repositório se voltarem para fora.
 * ============================================================
 *
 * SEM `server-only` de propósito: quem busca o campo é
 * `lib/backend/dia-seguinte.ts`, que guarda o token. Isto aqui é leitura
 * pura de um valor já buscado, e o card da pergunta diária é componente
 * de cliente.
 *
 * Extensão `.ts` explícita nos imports: o conferidor roda este arquivo
 * direto do Node, sem bundler para resolver especificador sem extensão.
 * Mesma regra de `lib/dia-seguinte/` e `lib/nichos/`.
 */

/**
 * O vocabulário que o backend manda hoje, em `RespostaExecucaoDoCliente`.
 *
 * ============================================================
 * DECLARADO, E **NÃO** FECHADO EM UNIÃO DE TIPO.
 *
 * É a mesma escolha de `nivel` em `lib/dia-seguinte/tipos.ts`, pelo mesmo
 * motivo: união fechada convida a um `switch` exaustivo, e o dia em que o
 * backend acrescentar um valor esse `switch` fica sem caso — em produção,
 * calado.
 *
 * O `openapi.json` de produção declara `veiculacao` como `string` com
 * default `sem_evidencia`, **sem enum**. Medido em 11/09/2026: só
 * `ja_foi_ao_ar` foi observado ao vivo. `no_ar` está aqui porque é o
 * complemento óbvio do par, e porque reconhecê-lo antes de ele chegar é
 * mais barato que a tela emudecer no dia em que uma campanha for retomada.
 *
 * **Valor fora desta lista não vira "no ar".** Vira `nao_sabemos`, que é
 * a resposta honesta — ver `veiculacaoDoNegocio`.
 * ============================================================
 */
export const VEICULACAO_CONHECIDA = ["no_ar", "ja_foi_ao_ar", "sem_evidencia"] as const;

export type VeiculacaoDoBackend = (typeof VEICULACAO_CONHECIDA)[number];

/** O slug está no vocabulário conhecido? Diagnóstico, não decisão. */
export function ehVeiculacaoConhecida(bruto: string | null | undefined): boolean {
  return (
    typeof bruto === "string" &&
    (VEICULACAO_CONHECIDA as readonly string[]).includes(bruto)
  );
}

/**
 * O estado que a tela usa. Quatro, e os quatro dizem coisas diferentes.
 *
 * ============================================================
 * `nao_sabemos` NÃO É UM QUINTO CASO INVENTADO PARA CONFORTO.
 *
 * É o mesmo princípio que já custou caro duas vezes neste repositório:
 * `null` não é zero (`lib/dia-seguinte/tipos.ts`, regra 1), e ausência de
 * medição não é medição de ausência (`pessoas_que_chegaram_medido`).
 *
 * "Não temos evidência de que foi ao ar" e "não conseguimos ler a
 * resposta" parecem a mesma coisa na tela e são opostas na origem. A
 * primeira é um cliente que ainda não lançou; a segunda é um defeito
 * nosso. Sem separar os dois, a tela acusa o cliente de não ter anúncio
 * porque um servidor piscou — que é exatamente a família de defeito que a
 * `/anuncios` já paga com `estado: "indisponivel"`.
 * ============================================================
 */
export type EstadoDeVeiculacao =
  /** está no ar AGORA */
  | "no_ar"
  /** rodou, e não está no ar agora */
  | "ja_foi_ao_ar"
  /** nunca foi ao ar, e há evidência disso */
  | "nunca_foi_ao_ar"
  /** não dá para afirmar nada — e a tela diz isso */
  | "nao_sabemos";

/**
 * O que o consolidado do negócio prova sobre o dinheiro.
 *
 * Magro de propósito: são os dois únicos campos que a regra abaixo lê, e
 * `ConsolidadoDoNegocio` satisfaz esta forma sem conversão nenhuma.
 */
export interface GastoMedido {
  temDadoDaPlataforma: boolean;
  investiuCentavos: number | null;
}

/** Houve gasto medido na plataforma? Os dois lados, nunca um só. */
export function houveGastoMedido(evidencia: GastoMedido | null | undefined): boolean {
  return (
    evidencia !== null &&
    evidencia !== undefined &&
    evidencia.temDadoDaPlataforma === true &&
    (evidencia.investiuCentavos ?? 0) > 0
  );
}

export interface SinaisDeVeiculacao {
  /**
   * `veiculacao` de `GET /negocios/{business_id}/execucao`. **A
   * autoridade.** `null`/`undefined` quer dizer que não veio — negócio
   * sem execução, ou campo ausente numa versão antiga da rota.
   */
  veiculacao: string | null | undefined;
  /**
   * O gasto medido, como evidência de RESERVA. Ver o bloco de precedência
   * em `veiculacaoDoNegocio`.
   */
  gasto?: GastoMedido | null;
  /**
   * Nenhuma das fontes de execução deu resposta legível — `execucaoIlegivel`
   * de `lib/estado/cliente.ts`. Não é "não tem execução": 404 é resposta.
   */
  execucaoIlegivel?: boolean;
}

/**
 * O ESTADO DE VEICULAÇÃO DO NEGÓCIO. Uma função, uma resposta.
 *
 * ============================================================
 * A PRECEDÊNCIA, E POR QUE O GASTO CONTINUA AQUI DENTRO.
 *
 *   1. `veiculacao` do backend, quando reconhecida — ele fala com a Meta
 *   2. o gasto medido, como reserva, e só para provar que JÁ FOI ao ar
 *   3. `nao_sabemos`
 *
 * O gasto não é uma segunda regra: é o degrau 2 de uma regra só, escrito
 * no mesmo arquivo, com a precedência declarada. A diferença entre isto e
 * o que existia antes é que antes o degrau 2 morava sozinho em
 * `lib/estado/frases.ts`, decidindo a etapa `no_ar` sem nunca consultar o
 * degrau 1 — que a essa altura já existia na API.
 *
 * POR QUE ELE NÃO FOI SIMPLESMENTE APAGADO. Porque ele prova alguma
 * coisa, e prova sozinho: **a plataforma cobrou.** O Facebook não cobra
 * por anúncio que não foi ao ar. Quando `veiculacao` vier `sem_evidencia`
 * numa conta que gastou R$ 10,25, quem está errado é o `sem_evidencia` —
 * e a tela que dissesse "nunca foi ao ar" para essa conta estaria
 * contrariando o extrato.
 *
 * O QUE O GASTO **NÃO** PODE FAZER, e é o limite que importa: ele nunca
 * devolve `no_ar`. Dinheiro gasto é passado; ele prova que rodou, jamais
 * que está rodando agora. Ter deixado o gasto concluir a etapa "o anúncio
 * no ar" é exatamente como a conta da V2G passou a ler que o anúncio
 * estava no ar enquanto a Meta o mantinha em `PAUSED`.
 * ============================================================
 */
export function veiculacaoDoNegocio(sinais: SinaisDeVeiculacao): EstadoDeVeiculacao {
  const bruto = sinais.veiculacao;

  // ---- 1. o backend, quando ele se faz entender ----
  if (bruto === "no_ar") return "no_ar";
  if (bruto === "ja_foi_ao_ar") return "ja_foi_ao_ar";

  // ---- 2. o gasto, e só para o passado ----
  if (houveGastoMedido(sinais.gasto)) return "ja_foi_ao_ar";

  // ---- 3. o resto ----
  //
  // `sem_evidencia` SÓ vira "nunca foi ao ar" depois que o degrau 2 não
  // provou nada. A ordem é o conteúdo: invertida, uma conta com extrato
  // leria "nunca foi ao ar".
  if (bruto === "sem_evidencia" && !sinais.execucaoIlegivel) return "nunca_foi_ao_ar";

  // Sem execução no backend e sem gasto: não há campanha, e isso é
  // resposta — 404 daquela rota quer dizer "este negócio não tem execução".
  // Leitura que FALHOU é outra coisa, e cai no `nao_sabemos` de baixo.
  if ((bruto === null || bruto === undefined) && !sinais.execucaoIlegivel) {
    return "nunca_foi_ao_ar";
  }

  // Valor que o vocabulário não reconhece, ou leitura que não deu certo.
  // Nos dois casos a tela não afirma nada.
  return "nao_sabemos";
}

/** Foi ao ar em algum momento? `nao_sabemos` responde `false` — não é prova. */
export function esteveNoAr(estado: EstadoDeVeiculacao): boolean {
  return estado === "no_ar" || estado === "ja_foi_ao_ar";
}

/** Está no ar AGORA? Só o presente. */
export function estaNoArAgora(estado: EstadoDeVeiculacao): boolean {
  return estado === "no_ar";
}

/**
 * Dá para afirmar alguma coisa sobre veiculação?
 *
 * Existe para a tela escolher entre "escrever a frase" e "não escrever
 * nada", sem precisar comparar com o literal `"nao_sabemos"` — comparação
 * de literal espalhada é a lista paralela voltando pela porta dos fundos.
 */
export function daParaAfirmar(estado: EstadoDeVeiculacao): boolean {
  return estado !== "nao_sabemos";
}

// ------------------------------------------------------------- as frases

/**
 * O BANCO DE FRASES. Toda frase de veiculação do produto está aqui.
 *
 * ============================================================
 * POR QUE AS FRASES MORAM JUNTO DO ESTADO, E NÃO NAS TELAS.
 *
 * A tentação é deixar cada tela escrever a própria frase a partir do
 * estado — "o estado é uma fonte só, o texto é assunto da tela". Foi
 * exatamente assim que as seis fontes nasceram: cada tela tinha razão
 * sobre o próprio texto, e o app inteiro ficou sem ter razão sobre o
 * fato.
 *
 * Um contraexemplo concreto, e ele já existia: com o anúncio pausado, a
 * `/vendas` escrevia "Seu anúncio está no ar" e a `/alertas` escrevia
 * "Seus anúncios ainda não estão no ar". As duas frases são de tela — e
 * nenhuma revisão de tela pega a contradição, porque ela só existe entre
 * as duas.
 *
 * Cada contexto abaixo é uma frase por estado, os quatro estados sempre
 * presentes. `Record<EstadoDeVeiculacao, string>` é a trava: estado novo
 * não compila sem alguém escrever a frase dele em todos os contextos.
 * ============================================================
 *
 * O TEMPO VERBAL É O CONTEÚDO. `no_ar` fala no presente, `ja_foi_ao_ar`
 * no passado, e nenhum dos dois usa o outro. Era a distinção que não
 * existia em lugar nenhum do app.
 */
export type ContextoDeFrase =
  /** manchete curta, para faixa e cabeçalho */
  | "manchete"
  /** linha de apoio, uma explicação a mais */
  | "apoio"
  /** o selo/rótulo, em duas ou três palavras */
  | "selo";

const FRASES: Record<ContextoDeFrase, Record<EstadoDeVeiculacao, string>> = {
  manchete: {
    no_ar: "Seu anúncio está no ar.",
    // "já rodou" e não "rodou": o dono precisa saber que ele PAROU, e
    // sem "já" a frase lê como histórico neutro de algo que segue.
    ja_foi_ao_ar: "Seu anúncio já rodou e não está no ar agora.",
    nunca_foi_ao_ar: "Seu anúncio ainda não foi ao ar.",
    // Não escreve "pode estar no ar": é palpite com cara de informação.
    nao_sabemos: "A gente não conseguiu conferir se seu anúncio está no ar.",
  },
  apoio: {
    no_ar: "Ele está sendo exibido agora.",
    // Sem prazo e sem desculpa — e sem prometer retomada que ninguém
    // agendou. "Pode retomar" descreve a possibilidade, não um plano.
    ja_foi_ao_ar:
      "Ele saiu do ar e nenhuma verba está sendo gasta agora. Seu gestor pode retomar quando fizer sentido.",
    nunca_foi_ao_ar: "Nenhuma verba foi gasta até aqui.",
    nao_sabemos: "É uma falha nossa de leitura, não um problema na sua conta. Já estamos vendo.",
  },
  selo: {
    no_ar: "No ar",
    ja_foi_ao_ar: "Já rodou",
    nunca_foi_ao_ar: "Ainda não foi ao ar",
    nao_sabemos: "Não conferido",
  },
};

/** A frase de veiculação. **Nenhuma tela escreve a própria.** */
export function fraseDeVeiculacao(
  estado: EstadoDeVeiculacao,
  contexto: ContextoDeFrase,
): string {
  return FRASES[contexto][estado];
}
