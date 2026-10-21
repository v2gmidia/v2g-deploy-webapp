import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { origemAsaasPermitida } from "./origem-asaas";

/** Consulta a coluna nova apenas para assistidos e com schema/flag explicitamente ativos. */
export async function origemAsaasNoServidor(admin: SupabaseClient,
  pedido: { id: string; origin: string; payment_method: string }, ativo: boolean): Promise<boolean> {
  if (pedido.origin !== "assisted") return origemAsaasPermitida(pedido, false);
  if (!ativo) return false;
  const r = await admin.from("commercial_orders").select("assisted_operator_id")
    .eq("id", pedido.id).eq("origin", "assisted").eq("payment_method", pedido.payment_method).maybeSingle();
  return !r.error && !!r.data && origemAsaasPermitida({ ...pedido, assisted_operator_id: r.data.assisted_operator_id }, true);
}
