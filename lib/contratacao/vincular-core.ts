import type { SupabaseClient, User } from "@supabase/supabase-js";

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
  const { data: pedidos, error: erroPedidos } = await admin.from("commercial_orders")
    .select("id, business_id, buyer_profile_id")
    .eq("buyer_email", email)
    .eq("status", "payment_approved")
    .not("business_id", "is", null);
  if (erroPedidos || !pedidos?.length) return;
  const elegiveis = pedidos.filter((pedido) =>
    pedido.business_id && (pedido.buyer_profile_id === null || pedido.buyer_profile_id === user.id));
  if (!elegiveis.length) return;
  const businessIds = [...new Set(elegiveis.map((pedido) => pedido.business_id).filter(Boolean))];
  const { error: erroNegocios } = await admin.from("businesses")
    .update({ profile_id: user.id, claim_email: null })
    .in("id", businessIds)
    .eq("claim_email", email)
    .is("profile_id", null);
  if (erroNegocios) return;
  const { data: negociosDoPerfil, error: erroPropriedade } = await admin.from("businesses")
    .select("id")
    .in("id", businessIds)
    .eq("profile_id", user.id);
  if (erroPropriedade || !negociosDoPerfil?.length) return;
  const idsNegociosDoPerfil = negociosDoPerfil.map((negocio) => negocio.id);
  const idsPedidos = pedidosAutorizadosParaVinculo(elegiveis, idsNegociosDoPerfil, user.id);
  if (!idsPedidos.length) return;
  await admin.from("commercial_orders")
    .update({ buyer_profile_id: user.id })
    .in("id", idsPedidos)
    .in("business_id", idsNegociosDoPerfil)
    .is("buyer_profile_id", null);
}
