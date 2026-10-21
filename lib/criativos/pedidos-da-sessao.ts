import "server-only";

import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { hashDoPedido, registrarPedidoDeImagem, type PedidoDeImagem,
  type RepositorioDePedidos } from "./pedido-imagem";

const COLUNAS = "id, business_id, requested_by, content_hash, payload, status, created_at";

export function pedidoPersistidoValido(linha: unknown, businessId: string): linha is PedidoDeImagem {
  if (!linha || typeof linha !== "object" || Array.isArray(linha)) return false;
  const r = linha as PedidoDeImagem;
  const p = r.payload;
  return r.business_id === businessId && typeof r.id === "string"
    && typeof r.requested_by === "string" && r.status === "awaiting_configuration"
    && typeof r.created_at === "string" && Number.isFinite(Date.parse(r.created_at))
    && Boolean(p && p.versao === 1 && typeof p.objetivo === "string"
      && typeof p.oferta === "string" && typeof p.acao === "string"
      && typeof p.promocao === "boolean"
      && (p.validade === null || typeof p.validade === "string"))
    && r.content_hash === hashDoPedido(p);
}

/** O mesmo cliente de sessão faz SELECT e INSERT; RLS também protege a escrita. */
export async function guardarPedidoDaSessao(
  entrada: Parameters<typeof registrarPedidoDeImagem>[0], hoje: string,
) {
  const supabase = await createClient();
  const repositorio: RepositorioDePedidos = {
    async buscar(id, businessId) {
      const r = await supabase.from("creative_generation_requests").select(COLUNAS)
        .eq("business_id", businessId).eq("id", id).maybeSingle();
      if (r.error) throw new Error("pedido_consulta");
      if (!r.data) return null;
      if (!pedidoPersistidoValido(r.data, businessId)) throw new Error("pedido_inconsistente");
      return r.data;
    },
    async inserir(pedido) {
      const r = await supabase.from("creative_generation_requests").insert({
        id: pedido.id, business_id: pedido.business_id, requested_by: pedido.requested_by,
        content_hash: pedido.content_hash, payload: pedido.payload,
      });
      if (r.error?.code === "23505") return "conflito";
      if (r.error) throw new Error("pedido_gravacao");
      return "criado";
    },
  };
  return registrarPedidoDeImagem(entrada, { hoje, repositorio, sessao: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const ativo = await negocioAtivoDaSessao();
    if (ativo.status !== "selecionado") return null;
    return { profileId: user.id, businessId: ativo.negocio.id };
  } });
}

/** Recarrega do banco, nunca do estado do formulário ou do localStorage. */
export async function carregarPedidosDaSessao(businessId: string): Promise<{
  pedidos: PedidoDeImagem[]; falhou: boolean;
}> {
  try {
    const ativo = await negocioAtivoDaSessao();
    if (ativo.status !== "selecionado" || ativo.negocio.id !== businessId)
      return { pedidos: [], falhou: true };
    const supabase = await createClient();
    const r = await supabase.from("creative_generation_requests").select(COLUNAS)
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(20);
    if (r.error || !r.data || r.data.some((p) => !pedidoPersistidoValido(p, businessId)))
      return { pedidos: [], falhou: true };
    return { pedidos: r.data as PedidoDeImagem[], falhou: false };
  } catch {
    return { pedidos: [], falhou: true };
  }
}
