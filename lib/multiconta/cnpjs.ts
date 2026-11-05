import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { cnpjsDoComprador, type PedidoParaIdentificarNegocio } from "./identificacao";
import { lerTodasPaginasEmLotes } from "./paginacao";
import { acessosContratadosDoPerfil } from "../contratacao/acesso-contratado";

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
  const documentos = cnpjsDoComprador(ids, pedidos, perfilId, emailVerificado);
  const concessoes = await acessosContratadosDoPerfil(admin, {
    id: perfilId, email: emailVerificado, email_confirmed_at: "verificado-pelo-chamador",
  });
  for (const g of concessoes) if (ids.includes(g.business_id) && !documentos.has(g.business_id))
    documentos.set(g.business_id, g.contractor_document);
  return documentos;
}
