import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * "/" nunca renderiza nada por si só — só decide para onde mandar
 * o visitante, conforme a sessão exista ou não.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/inicio" : "/entrar");
}
