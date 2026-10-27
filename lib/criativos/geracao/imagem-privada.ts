import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { geracaoNoAppPeloBackend, type EstadoGeracaoBackend } from "./backend-da-sessao";
import { UUID_GERACAO, estadoDaFilaValido, estadoDaFilaRealValido } from "./contrato-fila";
import { provasContextoIguais } from "./contrato-fila";
import { carregarProvaV2DaSessao } from "./prova-v2-da-sessao";
import { pedidoPersistidoValido } from "../pedidos-da-sessao";

export function urlImagemGerada(requestId: string, businessId: string): string {
  return `/criativos/imagem-gerada/${requestId}?negocio=${businessId}`;
}

type ArquivoGerado = { id: string; business_id: string; type: "image"; uso: "campanha";
  storage_path: string; arquivado_em: null; copy: { generation: Record<string, unknown> } };
export function arquivoDaFilaConfere(linha: unknown, e: EstadoGeracaoBackend): linha is ArquivoGerado {
  if (!linha || typeof linha !== "object" || Array.isArray(linha) || e.status !== "artifact_available") return false;
  const l = linha as { id?: unknown; business_id?: unknown; type?: unknown; uso?: unknown;
    storage_path?: unknown; arquivado_em?: unknown; copy?: { generation?: Record<string, unknown> } };
  const g = l.copy?.generation;
  return l.id === e.id && l.business_id === e.business_id && l.type === "image"
    && l.uso === "campanha" && l.arquivado_em === null
    && l.storage_path === `geracao/${e.business_id}/${e.id}/${e.attempt_id}.png`
    && g?.version === 1 && g.jobId === e.id && g.attemptId === e.attempt_id
    && g.requestId === e.request_id && g.snapshotHash === e.snapshot_hash
    && g.artifactHash === e.artifact_sha256 && g.simulated === e.simulated;
}

/** Sem URL pública/assinatura reaproveitável. Toda leitura revalida sessão + backend + bytes. */
export async function lerImagemGerada(requestId: string, businessId: string): Promise<Uint8Array | null> {
  if (process.env.V2G_CREATIVE_REQUESTS_ENABLED !== "true" || process.env.V2G_CREATIVE_BACKEND_ENABLED !== "true"
    || !UUID_GERACAO.test(requestId) || !UUID_GERACAO.test(businessId)) return null;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const ativo = await negocioAtivoDaSessao();
    if (error || !user || ativo.status !== "selecionado" || ativo.negocio.id !== businessId) return null;
    const pedido = await supabase.from("creative_generation_requests").select("id, business_id, requested_by, payload, content_hash, status, created_at")
      .eq("id", requestId).eq("business_id", businessId).maybeSingle();
    if (pedido.error || !pedido.data || pedido.data.id !== requestId || pedido.data.business_id !== businessId
      || pedido.data.requested_by !== user.id || !pedidoPersistidoValido(pedido.data, businessId)) return null;
    const prova = pedido.data.payload.versao === 2 ? await carregarProvaV2DaSessao(pedido.data) : null;
    if (pedido.data.payload.versao === 2 && !prova) return null;
    const resposta = await geracaoNoAppPeloBackend({ requestId, businessId, operacao: "biblioteca" });
    if (!resposta.ok || resposta.estado.status !== "artifact_available") return null;
    if (prova && !estadoDaFilaValido(resposta.estado, requestId, businessId)
      && !estadoDaFilaRealValido(resposta.estado, requestId, businessId)) return null;
    if (prova && !provasContextoIguais(resposta.estado.context_proof, prova)) return null;
    if (resposta.estado.simulated && (!estadoDaFilaValido(resposta.estado, requestId, businessId)
      || resposta.estado.result?.authored_by !== user.id)) return null;
    if (estadoDaFilaRealValido(resposta.estado, requestId, businessId) && resposta.estado.result?.authored_by !== user.id) return null;
    // O DTO real não traz authored_by. A autoria é relida do pedido pela sessão,
    // além da identidade/propriedade que o próprio backend confere em /biblioteca.
    const r = await supabase.from("creatives").select("id, business_id, type, uso, storage_path, copy, arquivado_em")
      .eq("business_id", businessId).eq("id", resposta.estado.id).maybeSingle();
    if (r.error || !arquivoDaFilaConfere(r.data, resposta.estado)) return null;
    // Biblioteca única existente; bucket diferente no backend permanece indisponível.
    const admin = createAdminClient();
    const bucket = await admin.storage.getBucket("v2g-midia");
    if (bucket.error || bucket.data?.public !== false) return null;
    const download = await admin.storage.from("v2g-midia").download(r.data.storage_path);
    if (download.error || !download.data || download.data.size > 10485760) return null;
    const bytes = Buffer.from(await download.data.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== resposta.estado.artifact_sha256
      || bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
      || bytes.readUInt32BE(16) !== 1088 || bytes.readUInt32BE(20) !== 1088) return null;
    return bytes;
  } catch { return null; }
}
