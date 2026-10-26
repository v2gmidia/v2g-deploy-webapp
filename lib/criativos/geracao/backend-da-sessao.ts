import "server-only";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { enviar, obter } from "@/lib/backend/cliente";
import { estadoDaFilaValido, type EstadoFila } from "./contrato-fila";

export interface EstadoGeracaoBackend {
  version: 1; id: string; request_id: string; business_id: string; attempt_id: string;
  status: "queued" | "running" | "storage_pending" | "artifact_available" | "reconciliation_required" | "failed" | "cancelled";
  simulated: boolean; snapshot_hash: string; artifact_sha256: string | null;
  currency: "USD"; estimated_usd: string; reserved_usd: string; billed_usd: string | null;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const dinheiro = (v: unknown) => typeof v === "string" && /^\d+(\.\d+)?$/.test(v);
function valido(r: unknown, requestId: string, businessId: string): r is EstadoGeracaoBackend {
  if (!r || typeof r !== "object" || Array.isArray(r)) return false;
  if ("contract" in r) return estadoDaFilaValido(r, requestId, businessId);
  const e = r as EstadoGeracaoBackend;
  return e.version === 1 && e.request_id === requestId && e.business_id === businessId
    && typeof e.id === "string" && UUID.test(e.id) && typeof e.attempt_id === "string" && UUID.test(e.attempt_id)
    && ["running", "storage_pending", "artifact_available", "reconciliation_required"].includes(e.status)
    && typeof e.simulated === "boolean" && typeof e.snapshot_hash === "string" && HASH.test(e.snapshot_hash)
    && (e.artifact_sha256 === null || typeof e.artifact_sha256 === "string" && HASH.test(e.artifact_sha256))
    && (e.status !== "artifact_available" || e.artifact_sha256 !== null)
    && e.currency === "USD" && dinheiro(e.estimated_usd) && dinheiro(e.reserved_usd)
    && (e.billed_usd === null || !e.simulated && dinheiro(e.billed_usd));
}
export type RetornoGeracao = { ok: true; estado: EstadoGeracaoBackend }
  | { ok: false; motivo: "indisponivel" | "negocio_mudou" | "conferir_estado" | "nao_iniciado" | "contexto_pendente" };

/** Porta desligada por padrão; a UI de fila passa por filaPeloBackend.
 * Não usa o worker TS de laboratório. POST perdido não significa não executado.
 * Snapshot, direitos, provedor e reserva pertencem ao servidor backend.
 */
export async function geracaoPeloBackend(entrada: {
  requestId: string; businessId: string; operacao: "executar" | "submeter" | "consultar" | "biblioteca" | "cancelar";
}): Promise<RetornoGeracao> {
  if (process.env.V2G_CREATIVE_BACKEND_ENABLED !== "true") return { ok: false, motivo: "indisponivel" };
  if (!UUID.test(entrada.requestId) || !UUID.test(entrada.businessId)) return { ok: false, motivo: "indisponivel" };
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const ativo = await negocioAtivoDaSessao();
    if (error || !user || !UUID.test(user.id) || ativo.status !== "selecionado" || ativo.negocio.id !== entrada.businessId)
      return { ok: false, motivo: "negocio_mudou" };
    const base = `/criativos/geracao/${ativo.negocio.id}`;
    const resultado = entrada.operacao === "executar" || entrada.operacao === "submeter"
      ? await enviar(base, { request_id: entrada.requestId, profile_id: user.id }, { contexto: "geracao-criativo" })
      : entrada.operacao === "cancelar"
      ? await enviar(`${base}/${entrada.requestId}/cancelar`, { profile_id: user.id }, { contexto: "cancelar-geracao-criativo" })
      : await obter(`${base}/${entrada.requestId}${entrada.operacao === "biblioteca" ? "/biblioteca" : ""}`,
        { params: { profile_id: user.id }, contexto: "estado-geracao-criativo" });
    if (!resultado.ok) {
      if (resultado.http === 404) return { ok: false, motivo: "nao_iniciado" };
      if (resultado.http === 409) return { ok: false, motivo: "contexto_pendente" };
      if (resultado.http === 503 || resultado.categoria === "indisponivel") return { ok: false, motivo: "indisponivel" };
      return { ok: false, motivo: "conferir_estado" };
    }
    if (!valido(resultado.dados, entrada.requestId, entrada.businessId))
      return { ok: false, motivo: "conferir_estado" };
    return { ok: true, estado: resultado.dados };
  } catch {
    return { ok: false, motivo: "conferir_estado" };
  }
}

/** A UI só consome fila assíncrona; o DTO síncrono legado fica no laboratório. */
export async function filaPeloBackend(entrada: {
  requestId: string; businessId: string; operacao: "submeter" | "consultar" | "biblioteca" | "cancelar";
}): Promise<{ ok: true; estado: EstadoFila } | Exclude<RetornoGeracao, { ok: true }>> {
  const r = await geracaoPeloBackend(entrada);
  if (!r.ok) return r;
  return estadoDaFilaValido(r.estado, entrada.requestId, entrada.businessId)
    ? { ok: true, estado: r.estado } : { ok: false, motivo: "conferir_estado" };
}
