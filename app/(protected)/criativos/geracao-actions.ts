"use server";

import { revalidatePath } from "next/cache";
import { guardarPedidoDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { RECADOS_DO_PEDIDO } from "@/lib/criativos/pedido-imagem";
import { filaPeloBackend } from "@/lib/criativos/geracao/backend-da-sessao";
import type { AndamentoGeracao } from "@/lib/criativos/geracao/contrato-fila";
import { urlImagemGerada } from "@/lib/criativos/geracao/imagem-privada";

export type EstadoDoPedido = { ok?: boolean; erro?: string; id?: string; repetido?: boolean };

/** Esta action guarda intenção. Não chama gerador, n8n ou Meta. */
export async function guardarPedidoAction(
  _anterior: EstadoDoPedido, dados: FormData,
): Promise<EstadoDoPedido> {
  try {
    const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo",
      year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const parte = (nome: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === nome)!.value;
    const hoje = `${parte("year")}-${parte("month")}-${parte("day")}`;
    const resultado = await guardarPedidoDaSessao({
      habilitado: process.env.V2G_CREATIVE_REQUESTS_ENABLED === "true",
      id: dados.get("requestId"), negocioEsperado: dados.get("businessId"),
      objetivo: dados.get("objetivo"), oferta: dados.get("oferta"), acao: dados.get("acao"),
      promocao: dados.get("promocao") === "on", validade: dados.get("validade"),
      confirmado: dados.get("confirmado") === "on",
    }, hoje);
    if (!resultado.ok) return { erro: RECADOS_DO_PEDIDO[resultado.motivo] };
    revalidatePath("/criativos");
    return { ok: true, id: resultado.id, repetido: resultado.repetido };
  } catch {
    return { erro: RECADOS_DO_PEDIDO.indisponivel };
  }
}

/** POST só cria/retoma o job durável; não chama worker, gerador ou Meta. */
export async function acompanharGeracaoAction(businessId: string, requestId: string,
  operacao: "submeter" | "consultar" | "cancelar" = "consultar",
): Promise<AndamentoGeracao> {
  if (process.env.V2G_CREATIVE_REQUESTS_ENABLED !== "true"
    || !["submeter", "consultar", "cancelar"].includes(operacao)) return { ok: false, motivo: "indisponivel" };
  const r = await filaPeloBackend({ businessId, requestId, operacao });
  if (!r.ok) return r;
  const e = r.estado;
  return { ok: true, requestId: e.request_id, businessId: e.business_id, jobId: e.id,
    status: e.status, simulada: true, consultarEm: e.poll_after_ms,
    imagemUrl: e.status === "artifact_available" ? urlImagemGerada(e.request_id, e.business_id) : null };
}
