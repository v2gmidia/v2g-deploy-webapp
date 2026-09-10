/**
 * Quem está sem responder — `GET /perguntas-pendentes`.
 *
 * ============================================================
 * A ROTA EXISTE DESDE SEMPRE E NINGUÉM CHAMA. Medido em 10/09/2026.
 *
 * O backend calcula todo dia a lista de quem deve ser perguntado, grava
 * "14 a perguntar", e não pergunta a ninguém — porque perguntar é do lado
 * de cá. **O loop está construído e mudo desde 01/09.**
 * ============================================================
 *
 * ============================================================
 * O NÍVEL VEM DO BACKEND. NÃO SE RECALCULA AQUI.
 *
 * A escada é `0-2 dias → pergunta`, `≥3 → cobranca`, `≥6 →
 * oferta_de_ajuda`, e **não escala mais**: seis dias e noventa dias saem
 * iguais, de propósito.
 *
 * Isso está escrito aqui como CONFERÊNCIA, não como cálculo. Se a gente
 * derivasse o nível do `silencio_em_dias`, existiriam duas definições de
 * quando cobrar — e a que divergisse seria a nossa, que ninguém audita.
 * `nivelEsperado()` existe só para o conferidor cruzar as duas.
 * ============================================================
 */

export const NIVEIS_DA_PERGUNTA = ["pergunta", "cobranca", "oferta_de_ajuda"] as const;
export type NivelDaPergunta = (typeof NIVEIS_DA_PERGUNTA)[number];

export function ehNivelDaPergunta(v: unknown): v is NivelDaPergunta {
  return typeof v === "string" && (NIVEIS_DA_PERGUNTA as readonly string[]).includes(v);
}

export interface PerguntaPendente {
  idExecucao: string;
  /** `null` quando o negócio não tem nome gravado. */
  nomeNegocio: string | null;
  nivel: NivelDaPergunta;
  silencioEmDias: number;
  /** `YYYY-MM-DD`, ou `null` para quem nunca respondeu. */
  ultimaRespostaEm: string | null;
}

export interface PerguntasPendentes {
  /** o dia da varredura, `YYYY-MM-DD` */
  em: string;
  pendentes: PerguntaPendente[];
  /** quantos foram olhados para chegar nesta lista */
  considerados: number;
  filtroDeDiasAplicado: boolean;
}

/**
 * A escada, como o backend a descreve. **Só para cruzar.**
 *
 * O teto é o ponto: `oferta_de_ajuda` é o último degrau e não há nada
 * depois dele. Um produto que continuasse subindo o tom viraria cobrança
 * de dívida — e o que a gente quer saber é se a pessoa precisa de ajuda,
 * não puni-la pelo silêncio.
 */
export function nivelEsperado(silencioEmDias: number): NivelDaPergunta {
  if (silencioEmDias >= 6) return "oferta_de_ajuda";
  if (silencioEmDias >= 3) return "cobranca";
  return "pergunta";
}

/** O nível que o backend mandou bate com a escada declarada? */
export function nivelConfere(p: PerguntaPendente): boolean {
  return p.nivel === nivelEsperado(p.silencioEmDias);
}

// ---------------------------------------------------------------- validação

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function inteiro(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
}

const DIA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida um item da lista.
 *
 * Devolve `null` em vez de lançar, e quem chama descarta o item — uma
 * pessoa com o corpo torto não pode derrubar a varredura das outras
 * treze.
 */
export function validarPendente(bruto: unknown): PerguntaPendente | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  const silencioEmDias = inteiro(o.silencio_em_dias);
  if (!idExecucao || silencioEmDias === null) return null;
  if (!ehNivelDaPergunta(o.nivel)) return null;

  const ultima = texto(o.ultima_resposta_em);

  return {
    idExecucao,
    // `nome_negocio` é opcional no contrato. Ausente vira `null`, e a
    // tela decide o que escrever — nunca "undefined" na tela.
    nomeNegocio: texto(o.nome_negocio),
    nivel: o.nivel,
    silencioEmDias,
    ultimaRespostaEm: ultima && DIA.test(ultima) ? ultima : null,
  };
}

/**
 * Valida a varredura inteira.
 *
 * ============================================================
 * `considerados` É O QUE SEPARA "NINGUÉM DEVE" DE "NÃO OLHEI".
 *
 * `pendentes: []` com `considerados: 14` quer dizer que catorze pessoas
 * foram olhadas e nenhuma está devendo — notícia boa. `pendentes: []` com
 * `considerados: 0` quer dizer que a varredura não achou ninguém para
 * olhar — que é um problema nosso.
 *
 * É a mesma família do `null` não ser zero: ausência de resultado e
 * ausência de medição saindo iguais. Por isso o campo é preservado até a
 * tela, mesmo que nenhuma tela use ainda.
 * ============================================================
 */
export function validarPerguntasPendentes(bruto: unknown): PerguntasPendentes | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;

  const em = texto(o.em);
  if (!em || !DIA.test(em)) return null;

  const lista = Array.isArray(o.pendentes) ? o.pendentes : [];
  const pendentes = lista
    .map(validarPendente)
    .filter((p): p is PerguntaPendente => p !== null);

  return {
    em,
    pendentes,
    considerados: inteiro(o.considerados) ?? 0,
    filtroDeDiasAplicado: o.filtro_de_dias_aplicado === true,
  };
}
