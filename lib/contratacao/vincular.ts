import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { vincularComprasAprovadasComCliente } from "@/lib/contratacao/vincular-core";

/** Vincula compras aprovadas pelo e-mail verificado; falha mantém acesso fechado. */
export async function vincularComprasAprovadas(user: User): Promise<void> {
  // Denial-only marker: never grants permissions. Historical acceptance uses an explicit ID.
  if (user.user_metadata?.access_flow === "historical_contract") return;
  if (!user.email || !user.email_confirmed_at) return;
  try {
    await vincularComprasAprovadasComCliente(createAdminClient(), user);
  } catch {
    // A trava de acesso consulta o pedido vinculado e continua fechada.
  }
}
