import type { AnuncioObservado, ClassificacaoJev } from "./triagem-referencias.ts";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MAX_ANUNCIOS = 20;
const MAX_TEXTO = 280;

type AnuncioParaJev = AnuncioObservado & { resumoPublico: string };
type RespostaJev = {
  answers?: Record<string, { choice?: unknown; confidence?: unknown }>;
  usage?: { input_tokens?: unknown; output_tokens?: unknown };
};

export type PedidoLoteJev = {
  model: "jev-latest";
  state: { anuncios: Array<{ indice: number; id: string; anunciante: string; resumoPublico: string }> };
  questions: Record<string, {
    type: "choice";
    instructions: string;
    criteria: Record<"servico_barbearia" | "fornecedor_barbearia" | "outro" | "indeterminado", string>;
  }>;
};
export type ResultadoLoteJev = {
  classificacoes: ClassificacaoJev[];
  tokensEntrada: number | null;
  tokensSaida: number | null;
};

/** Uma pergunta por anúncio. O Jev classifica o contexto recebido, sem acessar a Biblioteca. */
export function montarPedidoLoteJev(anuncios: readonly AnuncioParaJev[]): PedidoLoteJev {
  if (anuncios.length < 1 || anuncios.length > MAX_ANUNCIOS) {
    throw new Error(`O lote deve conter entre 1 e ${MAX_ANUNCIOS} anúncios`);
  }
  const ids = new Set<string>();
  const state: PedidoLoteJev["state"] = { anuncios: [] };
  const questions: PedidoLoteJev["questions"] = {};
  anuncios.forEach((anuncio, indice) => {
    if (!/^\d+$/.test(anuncio.id) || ids.has(anuncio.id)) throw new Error("ID ausente ou repetido");
    if (anuncio.fonte !== "biblioteca_meta_interface" ||
      anuncio.situacaoExibida !== "ativo" || anuncio.midiaObservada !== "imagem") {
      throw new Error(`Anúncio sem observação elegível para este lote: ${anuncio.id}`);
    }
    if (anuncio.url !== `https://www.facebook.com/ads/library/?id=${anuncio.id}`) {
      throw new Error(`URL da Biblioteca diverge: ${anuncio.id}`);
    }
    if (!anuncio.resumoPublico.trim() || anuncio.resumoPublico.length > MAX_TEXTO) {
      throw new Error(`Resumo público ausente ou longo: ${anuncio.id}`);
    }
    ids.add(anuncio.id);
    state.anuncios.push({
      indice, id: anuncio.id, anunciante: anuncio.anunciante.trim(),
      resumoPublico: anuncio.resumoPublico.trim(),
    });
    questions[`anuncio_${indice}`] = {
      type: "choice",
      instructions: `Classifique somente o anúncio no índice ${indice} de state.anuncios. O anúncio oferece diretamente corte, barba ou serviço de barbearia ao consumidor? Não infira vendas, reputação nem desempenho.`,
      criteria: {
        servico_barbearia: "Barbearia oferece diretamente corte, barba ou serviço ao consumidor.",
        fornecedor_barbearia: "Vende móveis, ferramentas, cosméticos ou serviços para barbeiros e barbearias.",
        outro: "É de outro negócio, evento, curso, imóvel ou serviço sem oferta direta de barbearia ao consumidor.",
        indeterminado: "O resumo é insuficiente para decidir com segurança.",
      },
    };
  });
  return { model: "jev-latest", state, questions };
}

/** Resposta incompleta ou inesperada não vira candidato aprovado. */
export function lerRespostaLoteJev(pedido: PedidoLoteJev, bruto: unknown): ClassificacaoJev[] {
  if (!bruto || typeof bruto !== "object" || !("answers" in bruto)) throw new Error("Resposta Jev inválida");
  const answers = (bruto as RespostaJev).answers;
  if (!answers || typeof answers !== "object") throw new Error("Respostas Jev ausentes");
  return pedido.state.anuncios.map(({ id, indice }) => {
    const resposta = answers[`anuncio_${indice}`];
    const opcoes = pedido.questions[`anuncio_${indice}`]?.criteria;
    if (!resposta || !opcoes || typeof resposta.choice !== "string" ||
      !Object.prototype.hasOwnProperty.call(opcoes, resposta.choice) ||
      typeof resposta.confidence !== "number" || !Number.isFinite(resposta.confidence) ||
      resposta.confidence < 0 || resposta.confidence > 1) {
      throw new Error(`Classificação Jev incompleta ou inválida: ${id}`);
    }
    return { id, rotulo: resposta.choice as ClassificacaoJev["rotulo"], confianca: resposta.confidence };
  });
}

/** Chamada isolada; token fornecido pelo servidor. Nenhum segredo é registrado em logs. */
export async function consultarJevLote(
  pedido: PedidoLoteJev,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<ResultadoLoteJev> {
  if (!apiKey) throw new Error("Chave Jev ausente");
  const resposta = await fetcher(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`Jev indisponível (${resposta.status})`);
  const bruto: unknown = await resposta.json();
  const classificacoes = lerRespostaLoteJev(pedido, bruto);
  const usage = (bruto as RespostaJev).usage;
  const tokens = (valor: unknown) => Number.isSafeInteger(valor) && Number(valor) >= 0 ? Number(valor) : null;
  return {
    classificacoes,
    tokensEntrada: tokens(usage?.input_tokens),
    tokensSaida: tokens(usage?.output_tokens),
  };
}
