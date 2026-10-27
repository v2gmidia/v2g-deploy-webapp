/** Triagem local de metadados observados na Biblioteca. Não coleta anúncios nem mede resultado. */
export type AnuncioObservado = {
  id: string;
  url: string;
  anunciante: string;
  inicioExibido: string;
  observadoEm: string;
  situacaoExibida: "ativo" | "inativo" | "desconhecido";
  midiaObservada: "imagem" | "video" | "desconhecida";
  fonte: "biblioteca_meta_interface";
};

export type ClassificacaoJev = {
  id: string;
  rotulo: "servico_barbearia" | "fornecedor_barbearia" | "outro" | "indeterminado";
  confianca: number;
};

export type ReferenciaTriada = {
  anuncio: AnuncioObservado;
  jev: ClassificacaoJev | null;
  diasDesdeInicioExibido: number | null;
  faixaDeContinuidade: "90_dias_ou_mais" | "30_a_89_dias" | "menos_de_30_dias" | "desconhecida";
  destino: "candidato_para_revisao" | "revisao_de_classificacao" | "fora_do_recorte" | "dados_insuficientes";
  comprovaDesempenho: false;
  credibilidadeVerificada: false;
  exigeRevisaoHumana: true;
};

/** Corte provisório de pertinência, não de desempenho ou autorização de uso. */
export const CORTE_PERTINENCIA_PILOTO = 0.8;

function dataUtc(valor: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const instante = Date.parse(`${valor}T00:00:00.000Z`);
  return Number.isFinite(instante) && new Date(instante).toISOString().slice(0, 10) === valor
    ? instante : null;
}

function diasExibidos(inicio: string, observadoEm: string): number | null {
  const a = dataUtc(inicio);
  const b = dataUtc(observadoEm);
  if (a === null || b === null || b < a) return null;
  return Math.floor((b - a) / 86_400_000);
}

/**
 * A faixa de 30/90 dias é uma régua de priorização para revisão, não benchmark
 * de barbearia nem prova de veiculação contínua, vendas, lucro ou confiança.
 */
export function triarReferencias(
  observados: readonly AnuncioObservado[],
  classificacoes: readonly ClassificacaoJev[],
): ReferenciaTriada[] {
  const respostas = new Map<string, ClassificacaoJev>();
  for (const resposta of classificacoes) {
    if (respostas.has(resposta.id)) throw new Error(`Classificação repetida: ${resposta.id}`);
    if (!Number.isFinite(resposta.confianca) || resposta.confianca < 0 || resposta.confianca > 1) {
      throw new Error(`Confiança inválida: ${resposta.id}`);
    }
    respostas.set(resposta.id, resposta);
  }

  const vistos = new Set<string>();
  return observados.map((anuncio) => {
    if (!/^\d+$/.test(anuncio.id) || !anuncio.url.startsWith("https://www.facebook.com/ads/library/?id=")) {
      throw new Error("Referência da Biblioteca inválida");
    }
    if (new URL(anuncio.url).searchParams.get("id") !== anuncio.id) {
      throw new Error(`ID da URL diverge: ${anuncio.id}`);
    }
    if (vistos.has(anuncio.id)) throw new Error(`Anúncio repetido: ${anuncio.id}`);
    vistos.add(anuncio.id);

    const jev = respostas.get(anuncio.id) ?? null;
    const dias = diasExibidos(anuncio.inicioExibido, anuncio.observadoEm);
    const faixaDeContinuidade = dias === null ? "desconhecida"
      : dias >= 90 ? "90_dias_ou_mais"
      : dias >= 30 ? "30_a_89_dias" : "menos_de_30_dias";

    let destino: ReferenciaTriada["destino"];
    if (anuncio.midiaObservada === "video" ||
      ((jev?.rotulo === "fornecedor_barbearia" || jev?.rotulo === "outro") &&
        jev.confianca >= CORTE_PERTINENCIA_PILOTO)) {
      destino = "fora_do_recorte";
    } else if (anuncio.situacaoExibida !== "ativo" || anuncio.midiaObservada !== "imagem" || dias === null || !jev) {
      destino = "dados_insuficientes";
    } else if (jev.rotulo !== "servico_barbearia" || jev.confianca < CORTE_PERTINENCIA_PILOTO) {
      destino = "revisao_de_classificacao";
    } else {
      destino = "candidato_para_revisao";
    }
    return {
      anuncio, jev, diasDesdeInicioExibido: dias, faixaDeContinuidade, destino,
      comprovaDesempenho: false, credibilidadeVerificada: false, exigeRevisaoHumana: true,
    };
  });
}
