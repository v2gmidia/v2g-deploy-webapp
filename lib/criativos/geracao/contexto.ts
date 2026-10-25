import { createHash } from "node:crypto";
import { prepararPrevooDeGeracao, type EntradaDoPrevooDeGeracao } from "../prevoo-geracao.ts";
import { hashDoPedido, type PedidoDeImagem } from "../pedido-imagem.ts";

export const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export function canonico(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(",")}]`;
  if (valor && typeof valor === "object") return `{${Object.entries(valor).sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonico(v)}`).join(",")}}`;
  return JSON.stringify(valor);
}

/** Somente um loader confiável pode montar esta entrada; não aceitar do formulário. */
export interface ContextoDaGeracao {
  prevoo: EntradaDoPrevooDeGeracao;
  escopoDocumentos: { central: string | null; nicho: string | null };
  hashesMateriais: Record<string, string>;
  hashesReferencias: Record<string, string>;
  estimativaMinorSimulada: number;
}
export interface SnapshotGeracao {
  version: 1;
  simulated: true;
  requestId: string;
  businessId: string;
  requestedBy: string;
  requestHash: string;
  briefing: Extract<ReturnType<typeof prepararPrevooDeGeracao>, { ok: true }>["briefing"];
  documentos: { tipo: "central" | "nicho"; versao: string; conteudo: string; hash: string;
    businessId: string | null; revisadoPor: string; revisadoEm: string }[];
  materiais: { id: string; caminho: string; hash: string }[];
  referencias: { id: string; hash: string }[];
  custo: { moeda: "USD"; estimativaMinor: number; reservaMinor: number; limiteMinor: number };
}
const hashValido = (s: unknown): s is string => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

export function congelarContexto(pedido: PedidoDeImagem, contexto: ContextoDaGeracao): SnapshotGeracao {
  const p = contexto.prevoo;
  const c = p.contexto;
  if (pedido.content_hash !== hashDoPedido(pedido.payload) || c.businessId !== pedido.business_id
      || p.custo.tipo !== "inicial" || p.custo.tentativas.length !== 0
      || c.objetivo.valor?.trim() !== pedido.payload.objetivo
      || c.oferta.valor?.trim() !== pedido.payload.oferta || c.acaoDesejada.valor?.trim() !== pedido.payload.acao
      || c.promocao !== pedido.payload.promocao
      || (c.promocao ? c.validadeDaPromocao?.valor : null) !== pedido.payload.validade
      || [contexto.escopoDocumentos.central, contexto.escopoDocumentos.nicho]
        .some(id => id !== null && id !== pedido.business_id)) throw new Error("contexto_divergente");
  const resultado = prepararPrevooDeGeracao(p);
  if (!resultado.ok) throw new Error("contexto_bloqueado");
  const ids = [p.marca.logoId, ...(p.marca.usarFachada ? [p.marca.fachadaId!] : [])];
  const materiais = ids.map(id => {
    const linha = p.marca.linhas.find(l => l.id === id)!;
    const hash = contexto.hashesMateriais[id];
    if (!hashValido(hash)) throw new Error("hash_material_ausente");
    return { id, caminho: linha.storage_path!, hash };
  });
  const referencias = resultado.briefing.referencias.map(ref => {
    const hash = contexto.hashesReferencias[ref.id];
    if (!hashValido(hash)) throw new Error("hash_referencia_ausente");
    return { id: ref.id, hash };
  });
  const estimativa = contexto.estimativaMinorSimulada;
  const reserva = p.custo.tetoDaProximaTentativaCentavos!;
  if (!Number.isSafeInteger(estimativa) || estimativa < 0 || estimativa > reserva)
    throw new Error("estimativa_invalida");
  const snapshot: SnapshotGeracao = {
    version: 1, simulated: true, requestId: pedido.id, businessId: pedido.business_id,
    requestedBy: pedido.requested_by, requestHash: pedido.content_hash, briefing: resultado.briefing,
    documentos: [resultado.documentos.central, resultado.documentos.nicho].map(doc => ({
      ...doc, hash: sha256(doc.conteudo), businessId: contexto.escopoDocumentos[doc.tipo],
    })), materiais, referencias,
    custo: { moeda: "USD", estimativaMinor: estimativa, reservaMinor: reserva,
      limiteMinor: p.custo.limiteTotalCentavos! },
  };
  if (Buffer.byteLength(canonico(snapshot)) > 65_536) throw new Error("contexto_excessivo");
  // Remover referências a objetos mutáveis do loader, preservando a versão usada.
  return JSON.parse(canonico(snapshot)) as SnapshotGeracao;
}

export function snapshotConfere(snapshot: SnapshotGeracao, hash: string, pedido: PedidoDeImagem): boolean {
  return snapshot.version === 1 && snapshot.simulated === true && hashValido(hash)
    && sha256(canonico(snapshot)) === hash && snapshot.businessId === pedido.business_id
    && snapshot.requestId === pedido.id && snapshot.requestedBy === pedido.requested_by
    && snapshot.requestHash === pedido.content_hash && pedido.content_hash === hashDoPedido(pedido.payload);
}
