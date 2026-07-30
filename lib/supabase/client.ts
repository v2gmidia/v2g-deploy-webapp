import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components ("use client").
 * Só a anon key — protegida por RLS, nunca ignora policy nenhuma.
 * Nunca importar `lib/supabase/admin.ts` a partir de código que
 * também importa este arquivo (ambos no mesmo bundle de cliente).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
