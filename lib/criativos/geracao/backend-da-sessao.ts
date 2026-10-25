import "server-only";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { enviar, obter } from "@/lib/backend/cliente";

export interface EstadoGeracaoBackend {
  version: 1; id: string; request_id: string; business_id: string; attempt_id: string;
  status: "running" | "storage_pending" | "artifact_available" | "reconciliation_required";
  simulated: boolean; snapshot_hash: string; artifact_sha256: string | null;
  currency: "USD"; estimated_usd: string; reserved_usd: string; billed_usd: string | null;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const dinheiro = (v: unknown) => typeof v === "string" && /^\d+(\.\d+)?$/.test(v);
function valido(r: unknown, requestId: string, businessId: string): r is EstadoGeracaoBackend {
  if (!r || typeof r !== "object" || Array.isArray(r)) return false;
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
  | { ok: false; motivo: "indisponivel" | "negocio_mudou" | "conferir_estado" };

/** Porta nova, desligada por padrao e ainda sem action/rota/botao comercial.
 * Nao usa o worker TS de laboratorio. POST perdido nao significa nao executado.
 * Snapshot, direitos, provedor e reserva pertencem ao servidor backend.
 */
export async function geracaoPeloBackend(entrada: {
  requestId: string; businessId: string; operacao: "executar" | "consultar" | "biblioteca";
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
    const resultado = entrada.operacao === "executar"
      ? await enviar(base, { request_id: entrada.requestId, profile_id: user.id }, { contexto: "geracao-criativo" })
      : await obter(`${base}/${entrada.requestId}${entrada.operacao === "biblioteca" ? "/biblioteca" : ""}`,
        { params: { profile_id: user.id }, contexto: "estado-geracao-criativo" });
    if (!resultado.ok || !valido(resultado.dados, entrada.requestId, entrada.businessId))
      return { ok: false, motivo: "conferir_estado" };
    return { ok: true, estado: resultado.dados };
  } catch {
    return { ok: false, motivo: "conferir_estado" };
  }
}
