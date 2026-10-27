"use server";

import { revalidatePath } from "next/cache";
import { guardarPedidoDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { RECADOS_DO_PEDIDO } from "@/lib/criativos/pedido-imagem";
import { geracaoNoAppPeloBackend } from "@/lib/criativos/geracao/backend-da-sessao";
import { modoGeracaoNoApp, submissaoRealHabilitada } from "@/lib/criativos/geracao/configuracao-app";
import { filaTerminal, provasContextoIguais } from "@/lib/criativos/geracao/contrato-fila";
import type { AndamentoGeracao } from "@/lib/criativos/geracao/contrato-fila";
import { urlImagemGerada } from "@/lib/criativos/geracao/imagem-privada";
import { catalogoBarbeariaDisponivel } from "@/lib/jev/catalogo-da-sessao";
import { buscarPedidoDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { carregarProvaV2DaSessao } from "@/lib/criativos/geracao/prova-v2-da-sessao";

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
      referenciaId: dados.get("referenciaId"),
      referenciasHabilitadas: Boolean(dados.get("referenciaId"))
        && typeof dados.get("businessId") === "string"
        && await catalogoBarbeariaDisponivel(dados.get("businessId") as string),
    }, hoje);
    if (!resultado.ok) return { erro: RECADOS_DO_PEDIDO[resultado.motivo] };
    revalidatePath("/criativos");
    return { ok: true, id: resultado.id, repetido: resultado.repetido };
  } catch {
    return { erro: RECADOS_DO_PEDIDO.indisponivel };
  }
}

/** Submissão real exige modo/flag específicos, ainda OFF fora dos testes. */
export async function acompanharGeracaoAction(businessId: string, requestId: string,
  operacao: "submeter" | "consultar" | "cancelar" = "consultar",
): Promise<AndamentoGeracao> {
  if (process.env.V2G_CREATIVE_REQUESTS_ENABLED !== "true"
    || !["submeter", "consultar", "cancelar"].includes(operacao)) return { ok: false, motivo: "indisponivel" };
  let pedido;
  try {
    pedido = await buscarPedidoDaSessao(businessId, requestId);
  } catch { return { ok: false, motivo: "conferir_estado" }; }
  if (!pedido) return { ok: false, motivo: "conferir_estado" };
  // V2 real continua sem submissão, independentemente de flags/202 ou teste fake.
  if (pedido.payload.versao === 2 && operacao === "submeter" && modoGeracaoNoApp() !== "fila_ficticia")
    return { ok: false, motivo: "submissao_real_pendente" };
  const prova = pedido.payload.versao === 2 ? await carregarProvaV2DaSessao(pedido) : null;
  if (pedido.payload.versao === 2 && !prova) return { ok: false, motivo: "contexto_pendente" };
  const r = await geracaoNoAppPeloBackend({ businessId, requestId, operacao });
  if (!r.ok) return { ...r, podeSubmeter: r.motivo === "nao_iniciado" && (modoGeracaoNoApp() === "fila_ficticia" || pedido.payload.versao === 1 && submissaoRealHabilitada()),
    tipoCriacao: modoGeracaoNoApp() === "fila_ficticia" ? "ficticia" : "real" };
  const e = r.estado;
  if (prova && (!provasContextoIguais(e.context_proof, prova) || !("result" in e)
    || e.result !== null && (e.result as { authored_by?: unknown }).authored_by !== pedido.requested_by))
    return { ok: false, motivo: "conferir_estado" };
  return { ok: true, requestId: e.request_id, businessId: e.business_id, jobId: e.id,
    status: e.status, simulada: e.simulated,
    consultarEm: filaTerminal(e.status) || (!e.simulated && e.status === "reconciliation_required") ? null : 2000,
    imagemUrl: e.status === "artifact_available" ? urlImagemGerada(e.request_id, e.business_id) : null };
}
