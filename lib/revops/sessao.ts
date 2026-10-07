import "server-only";
import { createClient } from "@/lib/supabase/server";
import { temAutorizacaoRevOps } from "./autorizacao";

export async function usuarioRevOps() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && temAutorizacaoRevOps(user) ? user : null;
}

