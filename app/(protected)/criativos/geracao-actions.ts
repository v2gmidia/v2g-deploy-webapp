"use server";

import { revalidatePath } from "next/cache";
import { guardarPedidoDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { RECADOS_DO_PEDIDO } from "@/lib/criativos/pedido-imagem";

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
