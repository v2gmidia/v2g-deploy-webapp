import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { cnpjsDoComprador, type PedidoParaIdentificarNegocio } from "./identificacao";
import { lerTodasPaginasEmLotes } from "./paginacao";

/** Identifica apenas negócios já liberados e pedidos do comprador verificado. */
export async function cnpjsDosNegociosLiberados(
  ids: string[], perfilId: string, emailVerificado: string | null,
): Promise<Map<string, string>> {
  if (ids.length === 0 || !emailVerificado) return new Map();
  const admin = createAdminClient();
  const pedidos = await lerTodasPaginasEmLotes<PedidoParaIdentificarNegocio>(ids, (lote, inicio, fim) => admin
    .from("commercial_orders")
    .select("business_id, cnpj, buyer_email, buyer_profile_id")
    .eq("status", "payment_approved")
    .in("business_id", lote)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, fim));
  if (!pedidos) throw new Error("pedidos indisponíveis");
  return cnpjsDoComprador(ids, pedidos, perfilId, emailVerificado);
}
