/** Contrato público da fila fake local de 25/10. Sem configuração ou efeitos. */
export const UUID_GERACAO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const monetario = (v: unknown) => typeof v === "string" && /^\d+(\.\d+)?$/.test(v);
export type StatusFila = "queued" | "running" | "storage_pending" | "artifact_available" | "reconciliation_required" | "failed" | "cancelled";
export interface EstadoFila {
  contract: "creative-generation-queue-v1"; version: 1;
  id: string; request_id: string; business_id: string; attempt_id: string;
  status: StatusFila; simulated: true; snapshot_hash: string; artifact_sha256: string | null;
  currency: "USD"; estimated_usd: string; reserved_usd: string; billed_usd: null;
  idempotency_key: string; poll_after_ms: 2000 | null;
  error: "worker_retry" | "attempts_exhausted" | "context_unavailable" | null;
  cost: { kind: "simulated"; unit: "USD_MICRO"; amount: "0" } | null;
  result: { private_reference: string; creative_id: string; sha256: string;
    width: 1088; height: 1088; mime: "image/png"; source: "fake-png-v1";
    authored_by: string; simulated: true } | null;
}
export function filaTerminal(status: StatusFila): boolean {
  return ["artifact_available", "failed", "cancelled"].includes(status);
}
export function estadoDaFilaValido(valor: unknown, pedido: string, negocio: string): valor is EstadoFila {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const e = valor as EstadoFila;
  if (e.contract !== "creative-generation-queue-v1" || e.version !== 1
    || !UUID_GERACAO.test(pedido) || !UUID_GERACAO.test(negocio)
    || e.request_id !== pedido || e.business_id !== negocio
    || ![e.id, e.attempt_id].every((v) => typeof v === "string" && UUID_GERACAO.test(v))
    || !["queued", "running", "storage_pending", "artifact_available", "reconciliation_required", "failed", "cancelled"].includes(e.status)
    || e.simulated !== true || typeof e.snapshot_hash !== "string" || !HASH.test(e.snapshot_hash)
    || !(e.artifact_sha256 === null || typeof e.artifact_sha256 === "string" && HASH.test(e.artifact_sha256))
    || e.currency !== "USD" || !monetario(e.estimated_usd) || !monetario(e.reserved_usd) || e.billed_usd !== null
    || e.idempotency_key !== `creative_generation_request:${pedido}:v1`
    || e.poll_after_ms !== (filaTerminal(e.status) ? null : 2000)
    || ![null, "worker_retry", "attempts_exhausted", "context_unavailable"].includes(e.error)
    || !(e.cost === null || e.cost?.kind === "simulated" && e.cost.unit === "USD_MICRO" && e.cost.amount === "0")) return false;
  const r = e.result;
  if (e.status !== "artifact_available") return r === null;
  return e.error === null && e.cost !== null && Boolean(r && r.private_reference === e.id && r.creative_id === e.id
    && r.sha256 === e.artifact_sha256 && r.width === 1088 && r.height === 1088 && r.mime === "image/png"
    && r.source === "fake-png-v1" && r.simulated === true && typeof r.authored_by === "string" && UUID_GERACAO.test(r.authored_by));
}

/** Projeção para o cliente: não transporta hashes, custos, exceções ou caminhos. */
export type AndamentoGeracao = { ok: true; requestId: string; businessId: string; jobId: string;
  status: StatusFila; simulada: true; consultarEm: 2000 | null; imagemUrl: string | null }
  | { ok: false; motivo: "indisponivel" | "negocio_mudou" | "conferir_estado" | "nao_iniciado" | "contexto_pendente" };
export const RECADOS_GERACAO = {
  indisponivel: "A criação de imagens está indisponível agora. Seu pedido continua guardado.",
  negocio_mudou: "O negócio ou o acesso mudou. Atualize a página para continuar no negócio correto.",
  conferir_estado: "Não foi possível confirmar o andamento. Consulte este mesmo pedido antes de tentar novamente.",
  nao_iniciado: "Este pedido ainda não entrou na fila de criação.",
  contexto_pendente: "Precisamos conferir o contexto e os materiais deste negócio antes de continuar.",
} as const;
export const ROTULOS_GERACAO: Record<StatusFila, string> = {
  queued: "Na fila", running: "Criando imagem", storage_pending: "Guardando imagem",
  artifact_available: "Imagem de teste disponível", failed: "Não foi possível concluir",
  cancelled: "Pedido cancelado", reconciliation_required: "Conferindo o resultado",
};
