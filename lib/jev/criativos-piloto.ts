import { randomUUID } from "node:crypto";
import { lerDimensao, tipoReal } from "../identidade/dimensoes.ts";

/**
 * Contrato local do piloto visual. Não há chamada de rede nem consumidor no app.
 * Imagens no System One ainda são experimentais segundo a TypeSafe.
 * https://docs.typesafe.ai/images
 */
const MODELO = "jev-1.13.0";
const LIMITE_LOCAL_BYTES = 9 * 1024 * 1024;
const LIMITE_TEXTO = 2_000;

const perguntas = {
  formato: {
    type: "choice",
    instructions: "Qual elemento visual domina a imagem em `imagem`? Classifique apenas o que é visível.",
    criteria: {
      produto: "O produto ou serviço representado visualmente domina a peça.",
      pessoa: "Uma pessoa ou rosto domina a peça.",
      tipografico: "Texto e elementos gráficos dominam, sem foto principal.",
      montagem: "Vários elementos visuais têm peso semelhante.",
      indeterminado: "A imagem não permite identificar um formato dominante.",
    },
  },
  gancho: {
    type: "choice",
    instructions: "Qual é o gancho principal da peça em `imagem`, considerando também `textoAnuncio` quando presente? Não infira desempenho.",
    criteria: {
      oferta_preco: "Preço, desconto ou condição comercial é o foco.",
      beneficio: "Benefício concreto ao comprador é o foco.",
      problema: "Dor ou problema do comprador é o foco.",
      demonstracao: "Mostra funcionamento, uso ou entrega como foco.",
      indeterminado: "Não há um gancho identificável com segurança.",
    },
  },
  sinal_de_prova: {
    type: "choice",
    instructions: "Que sinal de prova aparece na peça em `imagem` ou em `textoAnuncio`? Classifique a presença, não a veracidade.",
    criteria: {
      depoimento_aparente: "Há fala ou avaliação atribuída a cliente, sem validar sua autenticidade.",
      numero_aparente: "Há número ou resultado alegado, sem validar a fonte.",
      demonstracao: "Há demonstração visível do produto ou serviço.",
      nenhum: "Nenhum sinal de prova identificável.",
      indeterminado: "Não é possível decidir pela imagem e pelo texto disponíveis.",
    },
  },
  oferta_explicita: {
    type: "noul",
    instructions: "A peça em `imagem` ou `textoAnuncio` apresenta uma oferta comercial específica, como produto com preço, desconto ou condição?",
  },
} as const;

type PerguntaChoice = "formato" | "gancho" | "sinal_de_prova";
type Rotulos = {
  formato: keyof typeof perguntas.formato.criteria;
  gancho: keyof typeof perguntas.gancho.criteria;
  sinal_de_prova: keyof typeof perguntas.sinal_de_prova.criteria;
};

export type ErroDePreparacao =
  | "arquivo_vazio"
  | "arquivo_grande"
  | "formato_invalido"
  | "dimensoes_invalidas"
  | "texto_grande";

export type PedidoVisual = {
  model: typeof MODELO;
  state: { imagem: string; textoAnuncio: string };
  assets: Record<string, { type: "image"; part: "imagem" }>;
  questions: typeof perguntas;
};

export type PreparacaoVisual =
  | { ok: false; erro: ErroDePreparacao }
  | {
    ok: true;
    pedido: PedidoVisual;
    cabecalhos: { "TypeSafe-Danger-Zone-Images": "true" };
    mimeType: "image/png" | "image/jpeg";
    bytes: Uint8Array;
  };

export function prepararPedidoVisual(bytes: Uint8Array, textoAnuncio = ""): PreparacaoVisual {
  if (bytes.byteLength === 0) return { ok: false, erro: "arquivo_vazio" };
  if (bytes.byteLength > LIMITE_LOCAL_BYTES) return { ok: false, erro: "arquivo_grande" };
  if (textoAnuncio.length > LIMITE_TEXTO) return { ok: false, erro: "texto_grande" };

  const formato = tipoReal(bytes);
  if (!formato) return { ok: false, erro: "formato_invalido" };
  const dimensao = lerDimensao(bytes);
  if (!dimensao || dimensao.largura < 280 || dimensao.altura < 280 ||
    dimensao.largura > 1568 || dimensao.altura > 1568 ||
    dimensao.largura * dimensao.altura > 2_458_624) {
    return { ok: false, erro: "dimensoes_invalidas" };
  }

  const referencia = randomUUID();
  return {
    ok: true,
    cabecalhos: { "TypeSafe-Danger-Zone-Images": "true" },
    mimeType: formato === "png" ? "image/png" : "image/jpeg",
    bytes,
    pedido: {
      model: MODELO,
      state: { imagem: referencia, textoAnuncio: textoAnuncio.trim() },
      assets: { [referencia]: { type: "image", part: "imagem" } },
      questions: perguntas,
    },
  };
}

/** Multipart é o formato recomendado pela TypeSafe para não ampliar o arquivo em base64. */
export function montarFormularioVisual(preparado: Extract<PreparacaoVisual, { ok: true }>): FormData {
  const formulario = new FormData();
  formulario.append("request", new Blob([JSON.stringify(preparado.pedido)], { type: "application/json" }));
  formulario.append("imagem", new Blob([new Uint8Array(preparado.bytes)], { type: preparado.mimeType }),
    preparado.mimeType === "image/png" ? "criativo.png" : "criativo.jpg");
  return formulario;
}

type RespostaChoice = { choice?: unknown; confidence?: unknown };

export type RotuloVisual = {
  rotulos: Rotulos;
  confiancas: Record<PerguntaChoice, number>;
  probabilidadeDeOfertaExplicita: number;
  exigeRevisaoHumana: true;
  comprovaDesempenho: false;
};

function escolhaValida<K extends PerguntaChoice>(
  resposta: RespostaChoice | undefined,
  opcoes: Record<string, string>,
): { rotulo: Rotulos[K]; confianca: number } | null {
  if (!resposta || typeof resposta.choice !== "string" ||
    !Object.prototype.hasOwnProperty.call(opcoes, resposta.choice) ||
    typeof resposta.confidence !== "number" || !Number.isFinite(resposta.confidence) ||
    resposta.confidence < 0 || resposta.confidence > 1) return null;
  return { rotulo: resposta.choice as Rotulos[K], confianca: resposta.confidence };
}

/** Rejeita resposta incompleta ou fora do contrato; jamais aprova/publica uma peça. */
export function lerRespostaVisual(bruto: unknown): RotuloVisual | null {
  if (!bruto || typeof bruto !== "object" || !("answers" in bruto)) return null;
  const answers = bruto.answers;
  if (!answers || typeof answers !== "object") return null;
  const entradas = answers as Record<string, unknown>;
  const formato = escolhaValida<"formato">(entradas.formato as RespostaChoice | undefined, perguntas.formato.criteria);
  const gancho = escolhaValida<"gancho">(entradas.gancho as RespostaChoice | undefined, perguntas.gancho.criteria);
  const sinal = escolhaValida<"sinal_de_prova">(entradas.sinal_de_prova as RespostaChoice | undefined, perguntas.sinal_de_prova.criteria);
  const oferta = entradas.oferta_explicita as { noul?: unknown } | undefined;
  if (!formato || !gancho || !sinal || !oferta || typeof oferta.noul !== "number" ||
    !Number.isFinite(oferta.noul) || oferta.noul < 0 || oferta.noul > 1) return null;
  return {
    rotulos: { formato: formato.rotulo, gancho: gancho.rotulo, sinal_de_prova: sinal.rotulo },
    confiancas: { formato: formato.confianca, gancho: gancho.confianca, sinal_de_prova: sinal.confianca },
    probabilidadeDeOfertaExplicita: oferta.noul,
    exigeRevisaoHumana: true,
    comprovaDesempenho: false,
  };
}
