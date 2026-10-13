import type { SupabaseClient, User } from "@supabase/supabase-js";
import { lerTodasPaginas, lerTodasPaginasEmLotes } from "../multiconta/paginacao.ts";

type PedidoParaVinculo = {
  id: string;
  business_id: string | null;
  buyer_profile_id: string | null;
};

/** Não vincula pedidos já atribuídos a outra pessoa nem a negócios que não são do perfil. */
export function pedidosAutorizadosParaVinculo(
  pedidos: PedidoParaVinculo[],
  negociosDoPerfil: string[],
  perfilId: string,
): string[] {
  const negocios = new Set(negociosDoPerfil);
  return pedidos.filter((pedido) =>
    pedido.business_id && negocios.has(pedido.business_id)
      && (pedido.buyer_profile_id === null || pedido.buyer_profile_id === perfilId),
  ).map((pedido) => pedido.id);
}

/** O banco é lido novamente após a reivindicação: tentativa de UPDATE não é prova de propriedade. */
export async function vincularComprasAprovadasComCliente(admin: SupabaseClient, user: User): Promise<void> {
  if (!user.email || !user.email_confirmed_at) return;
  const email = user.email.trim().toLowerCase();
  const pedidos = await lerTodasPaginas<PedidoParaVinculo>((inicio, fim) => admin.from("commercial_orders")
    .select("id, business_id, buyer_profile_id")
    .eq("buyer_email", email)
    .eq("status", "payment_approved")
    .not("business_id", "is", null)
    .order("id", { ascending: true })
    .range(inicio, fim));
  if (!pedidos?.length) return;
  const elegiveis = pedidos.filter((pedido) =>
    pedido.business_id && (pedido.buyer_profile_id === null || pedido.buyer_profile_id === user.id));
  if (!elegiveis.length) return;
  const businessIds = [...new Set(elegiveis.map((pedido) => pedido.business_id)
    .filter((id): id is string => !!id))];
  for (let inicio = 0; inicio < businessIds.length; inicio += 100) {
    const { error } = await admin.from("businesses")
      .update({ profile_id: user.id, claim_email: null })
      .in("id", businessIds.slice(inicio, inicio + 100))
      .eq("claim_email", email)
      .is("profile_id", null);
    if (error) return;
  }
  const negociosDoPerfil = await lerTodasPaginasEmLotes<{ id: string }>(businessIds, (lote, inicio, fim) => admin.from("businesses")
    .select("id")
    .in("id", lote)
    .eq("profile_id", user.id)
    .order("id", { ascending: true })
    .range(inicio, fim));
  if (!negociosDoPerfil?.length) return;
  const idsNegociosDoPerfil = negociosDoPerfil.map((negocio) => negocio.id);
  const idsPedidos = pedidosAutorizadosParaVinculo(elegiveis, idsNegociosDoPerfil, user.id);
  if (!idsPedidos.length) return;
  const pedidosPorNegocio = new Map<string, string[]>();
  const idsAutorizados = new Set(idsPedidos);
  for (const pedido of elegiveis) {
    if (!pedido.business_id || !idsAutorizados.has(pedido.id)) continue;
    const ids = pedidosPorNegocio.get(pedido.business_id) ?? [];
    ids.push(pedido.id);
    pedidosPorNegocio.set(pedido.business_id, ids);
  }
  for (const [businessId, ids] of pedidosPorNegocio) {
    for (let inicio = 0; inicio < ids.length; inicio += 100) {
      const { error } = await admin.from("commercial_orders")
        .update({ buyer_profile_id: user.id })
        .in("id", ids.slice(inicio, inicio + 100))
        .eq("business_id", businessId)
        .eq("buyer_email", email)
        .eq("status", "payment_approved")
        .is("buyer_profile_id", null);
      if (error) return;
    }
  }
}
